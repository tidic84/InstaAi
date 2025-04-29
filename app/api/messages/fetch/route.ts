import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { IgApiClient } from "instagram-private-api"

export async function POST(request: Request) {
  try {
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
    
    // Récupération des données du corps de la requête
    const { accountId } = await request.json()
    
    if (!accountId) {
      return NextResponse.json(
        { error: "ID de compte requis" },
        { status: 400 }
      )
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
      // Connexion au compte Instagram
      await ig.account.login(account.username, password)
      
      // Récupération des threads de messages
      const threads = await ig.feed.directInbox().items()
      
      // Traitement des threads et des messages
      const processedThreads = []
      
      for (const thread of threads) {
        // Vérifier si le thread existe déjà dans la base de données
        // Notez que nous recherchons par participantUsername au lieu de instagramThreadId
        let conversation = await db.conversation.findFirst({
          where: {
            participantUsername: thread.users[0]?.username || 'unknown',
            instagramAccountId: account.id
          }
        })
        
        // Convertir le timestamp correctement
        let lastMessageTimestamp: Date;
        try {
          // Vérifier si le timestamp existe et est un nombre valide
          if (thread.last_permanent_item && typeof thread.last_permanent_item.timestamp === 'number') {
            lastMessageTimestamp = new Date(thread.last_permanent_item.timestamp * 1000);
            
            // Vérifier si la date est valide
            if (isNaN(lastMessageTimestamp.getTime())) {
              lastMessageTimestamp = new Date(); // Utiliser la date actuelle comme fallback
            }
          } else {
            lastMessageTimestamp = new Date(); // Utiliser la date actuelle comme fallback
          }
        } catch (error) {
          console.error("Erreur lors de la conversion du timestamp:", error);
          lastMessageTimestamp = new Date(); // Utiliser la date actuelle comme fallback
        }
        
        // Si le thread n'existe pas, le créer
        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              instagramAccountId: account.id,
              participantUsername: thread.users[0]?.username || 'unknown',
              lastMessageAt: lastMessageTimestamp
            }
          })
          console.log(`Nouvelle conversation créée pour ${thread.users[0]?.username || 'unknown'}`)
        } else {
          // Mettre à jour la date du dernier message
          await db.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: lastMessageTimestamp
            }
          })
        }
        
        // Récupérer les messages du thread
        const messages = await ig.feed.directThread({ thread_id: thread.thread_id }).items()
        
        let newMessagesCount = 0
        
        // Traiter chaque message
        for (const message of messages) {
          if (!message.text) continue;
          
          const messageTime = new Date(message.timestamp * 1000);
      
          // Créer le message avec plus d'informations
          await db.message.create({
            data: {
              conversationId: conversation.id,
              content: message.text,
              isFromUser: message.user_id.toString() === account.instagramUserId,
              createdAt: messageTime,
              // Ajouter plus d'informations utiles
              metadata: JSON.stringify({
                instagramItemId: message.item_id,
                userId: message.user_id,
                timestamp: message.timestamp
              })
            }
          })
          console.log(`Message créé: ${message.text.substring(0, 50)}...`)
          newMessagesCount++;
        }
        
        // Ajouter aux threads traités
        processedThreads.push({
          id: conversation.id,
          username: thread.users[0]?.username || 'unknown',
          messageCount: newMessagesCount
        })
      }
      
      // Mettre à jour la date de dernière vérification du compte
      await db.instagramAccount.update({
        where: { id: account.id },
        data: {
          updatedAt: new Date()  // Utiliser updatedAt comme lastChecked
        }
      })
      
      return NextResponse.json({
        success: true,
        message: `${processedThreads.length} conversations et messages récupérés avec succès.`,
        threads: processedThreads
      })
    } catch (error) {
      console.error("Erreur de connexion Instagram:", error)
      
      // Mettre à jour le statut du compte en cas d'erreur
      await db.instagramAccount.update({
        where: { id: account.id },
        data: {
          isActive: false
        }
      })
      
      return NextResponse.json(
        { error: "Impossible de se connecter au compte Instagram ou de récupérer les messages." },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages Instagram" },
      { status: 500 }
    )
  }
}
