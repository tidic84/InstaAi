import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { IgApiClient } from "instagram-private-api"

// Fonction utilitaire pour convertir les timestamps Instagram en Date
function getValidDate(timestamp: string | number): Date | null {
  try {
    const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp
    // Vérifier si le timestamp est en millisecondes ou en secondes
    const date = new Date(timestampNum > 9999999999 ? timestampNum / 1000 : timestampNum * 1000)
    return isNaN(date.getTime()) ? null : date
  } catch (error) {
    console.error("Erreur de conversion de timestamp:", timestamp)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    let accountId, conversationId;

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      accountId = formData.get('accountId');
      conversationId = formData.get('conversationId');
      
      if (!accountId || !conversationId) {
        console.error("Paramètres manquants:", { accountId, conversationId });
        return NextResponse.json({ error: "Paramètres requis manquants" }, { status: 400 });
      }
    } else {
      const body = await request.json();
      accountId = body.accountId;
      conversationId = body.conversationId;
    }

    if (!accountId) {
      return NextResponse.json({ error: "ID de compte requis" }, { status: 400 });
    }

    // Authentification de l'utilisateur
    const cookiesList = await cookies()
    const headersList = await headers()
    
    const token = await getToken({ 
      req: {
        cookies: cookiesList,
        headers: headersList
      },
      secret: process.env.NEXTAUTH_SECRET || authOptions.secret
    })
    
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    
    // Récupération du compte Instagram
    const account = await db.instagramAccount.findUnique({
      where: {
        id: accountId,
        userId: token.sub as string
      }
    })
    
    if (!account) {
      return NextResponse.json(
        { error: "Compte Instagram non trouvé" },
        { status: 404 }
      )
    }
    
    // Déchiffrement du mot de passe
    const password = decrypt(account.password)
    
    // Connexion à Instagram
    const ig = new IgApiClient()
    ig.state.generateDevice(account.username)
    
    try {
      const loggedInUser = await ig.account.login(account.username, password)
      console.log("Connecté à Instagram en tant que:", account.username)

      // Récupérer les threads Instagram
      const threads = await ig.feed.directInbox().items()
      console.log(`${threads.length} conversations Instagram trouvées`)

      // Si pas d'ID de conversation, synchroniser toutes les conversations
      if (!conversationId) {
        let totalNewMessages = 0
        
        for (const thread of threads) {
          console.log(`Traitement de la conversation avec ${thread.users[0]?.username}`)
          
          // Trouver ou créer la conversation
          let conversation = await db.conversation.findFirst({
            where: {
              AND: [
                { instagramAccountId: account.id },
                { participantUsername: thread.users[0]?.username }
              ]
            }
          })

          if (!conversation) {
            const lastMessageTime = getValidDate(thread.last_permanent_item?.timestamp)
            conversation = await db.conversation.create({
              data: {
                instagramAccountId: account.id,
                participantUsername: thread.users[0]?.username || 'unknown',
                lastMessageAt: lastMessageTime || new Date()
              }
            })
            console.log("Nouvelle conversation créée")
          }

          // Récupérer les messages
          const threadFeed = ig.feed.directThread({ thread_id: thread.thread_id })
          let messages = await threadFeed.items()
          console.log(`${messages.length} messages trouvés`)

          for (const message of messages) {
            if (!message.text) continue

            try {
              const messageDate = getValidDate(message.timestamp)
              if (!messageDate) {
                console.error("Date invalide pour le message:", message.text)
                continue
              }

              const messageExists = await db.message.findFirst({
                where: {
                  conversationId: conversation.id,
                  content: message.text,
                  createdAt: {
                    gte: new Date(messageDate.getTime() - 5000),
                    lte: new Date(messageDate.getTime() + 5000)
                  }
                }
              })

              if (!messageExists) {
                const newMessage = await db.message.create({
                  data: {
                    conversationId: conversation.id,
                    content: message.text,
                    isFromUser: message.user_id.toString() === loggedInUser.pk.toString(),
                    createdAt: messageDate
                  }
                })
                console.log(`Message créé: "${message.text.substring(0, 30)}..." à ${messageDate.toISOString()}`)
                totalNewMessages++
              }
            } catch (error) {
              console.error("Erreur lors du traitement du message:", error, "Message:", message)
              continue
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: `${totalNewMessages} nouveaux messages récupérés dans ${threads.length} conversations`
        })
      }

      // Si un ID de conversation est fourni, continuer avec le code existant
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId }
      })

      if (!conversation) {
        console.error("Conversation non trouvée dans la base de données")
        return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 })
      }

      // Récupérer le thread Instagram
      const matchingThread = threads.find(thread => 
        thread.users[0]?.username === conversation.participantUsername
      )

      if (!matchingThread) {
        console.error("Thread Instagram non trouvé")
        return NextResponse.json({ error: "Thread Instagram non trouvé" }, { status: 404 })
      }

      console.log("Thread Instagram trouvé, récupération des messages...")

      // Récupérer tous les messages par lots
      const feedThread = ig.feed.directThread({ thread_id: matchingThread.thread_id })
      let allMessages = []
      
      try {
        while (true) {
          const messages = await feedThread.items()
          if (messages.length === 0) break
          
          console.log(`Lot de ${messages.length} messages récupérés`)
          allMessages.push(...messages)
          
          if (!feedThread.isMoreAvailable()) break
          
          // Pause pour éviter les limites de taux
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error("Erreur pendant la récupération des messages:", error)
      }

      console.log(`Total: ${allMessages.length} messages trouvés`)

      // Sauvegarder les messages
      let newMessagesCount = 0
      for (const message of allMessages) {
        if (!message.text) continue

        try {
          const messageDate = getValidDate(message.timestamp)
          if (!messageDate) {
            console.error("Date invalide pour le message:", message.text)
            continue
          }

          const messageExists = await db.message.findFirst({
            where: {
              conversationId: conversation.id,
              content: message.text,
              createdAt: {
                gte: new Date(messageDate.getTime() - 5000),
                lte: new Date(messageDate.getTime() + 5000)
              }
            }
          })

          if (!messageExists) {
            await db.message.create({
              data: {
                conversationId: conversation.id,
                content: message.text,
                isFromUser: message.user_id.toString() === loggedInUser.pk.toString(),
                createdAt: messageDate
              }
            })
            newMessagesCount++
            console.log(`Nouveau message sauvegardé: ${message.text.substring(0, 30)}...`)
          }
        } catch (error) {
          console.error("Erreur lors de la sauvegarde d'un message:", error)
        }
      }

      // Mettre à jour la date du dernier message
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      })

      // Rediriger ou retourner une réponse JSON selon le type de requête
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        const baseUrl = request.headers.get('origin') || process.env.NEXTAUTH_URL
        return NextResponse.redirect(`${baseUrl}/dashboard/messages/${accountId}/${conversation.id}`)
      }

      return NextResponse.json({
        success: true,
        message: `${newMessagesCount} nouveaux messages récupérés`,
        threadId: matchingThread.thread_id
      })

    } catch (error) {
      console.error("Erreur détaillée:", error)
      return NextResponse.json({ 
        error: "Erreur lors de la récupération des messages",
        details: error.message 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Erreur globale:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    )
  }
}
