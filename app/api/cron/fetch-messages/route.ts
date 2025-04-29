import { NextResponse } from 'next/server'
import { db } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { IgApiClient } from "instagram-private-api"

// Fonction pour journaliser les exécutions CRON
async function logCronExecution(status: string, details?: string) {
  await db.cronLog.create({
    data: {
      task: "fetch-messages",
      status,
      details: details || null
    }
  })
}

export async function GET(request: Request) {
  // Vérifier l'authentification avec une clé API simple
  const { searchParams } = new URL(request.url)
  const apiKey = searchParams.get('key')
  
  if (apiKey !== process.env.CRON_API_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  
  try {
    // Commencer à journaliser l'exécution
    await logCronExecution("started")
    
    // Récupérer tous les comptes actifs
    const activeAccounts = await db.instagramAccount.findMany({
      where: {
        isActive: true
      }
    })
    
    if (activeAccounts.length === 0) {
      await logCronExecution("completed", "Aucun compte actif trouvé")
      return NextResponse.json({ message: "Aucun compte actif trouvé" })
    }
    
    const results = []
    
    // Traiter chaque compte un par un pour éviter les limites de taux
    for (const account of activeAccounts) {
      try {
        // Déchiffrer le mot de passe
        const password = decrypt(account.password)
        
        // Connexion à Instagram
        const ig = new IgApiClient()
        ig.state.generateDevice(account.username)
        
        // Connexion au compte Instagram
        const loggedInUser = await ig.account.login(account.username, password)
        
        // Mettre à jour l'ID utilisateur Instagram s'il n'est pas déjà défini
        if (!account.instagramUserId) {
          await db.instagramAccount.update({
            where: { id: account.id },
            data: {
              instagramUserId: loggedInUser.pk.toString()
            }
          })
        }
        
        // Récupération des threads de messages
        const threads = await ig.feed.directInbox().items()
        
        let newMessageCount = 0
        
        // Traiter chaque thread
        for (const thread of threads) {
          // Vérifier si le thread existe déjà
          let conversation = await db.conversation.findFirst({
            where: {
              instagramThreadId: thread.thread_id,
              instagramAccountId: account.id
            }
          })
          
          // Si le thread n'existe pas, le créer
          if (!conversation) {
            conversation = await db.conversation.create({
              data: {
                instagramThreadId: thread.thread_id,
                instagramAccountId: account.id,
                participantUsername: thread.users[0]?.username || 'unknown',
                lastMessageAt: new Date(thread.last_permanent_item.timestamp * 1000)
              }
            })
          } else {
            // Mettre à jour la date du dernier message
            await db.conversation.update({
              where: { id: conversation.id },
              data: {
                lastMessageAt: new Date(thread.last_permanent_item.timestamp * 1000)
              }
            })
          }
          
          // Récupérer les messages du thread
          const messages = await ig.feed.directThread({ thread_id: thread.thread_id }).items()
          
          // Traiter chaque message
          for (const message of messages) {
            // Vérifier si le message existe déjà
            const existingMessage = await db.message.findFirst({
              where: {
                instagramItemId: message.item_id,
                conversationId: conversation.id
              }
            })
            
            // Si le message n'existe pas et qu'il vient d'un autre utilisateur, le créer
            if (!existingMessage && message.text && message.user_id !== loggedInUser.pk) {
              await db.message.create({
                data: {
                  instagramItemId: message.item_id,
                  conversationId: conversation.id,
                  content: message.text,
                  senderUsername: thread.users.find(u => u.pk === message.user_id)?.username || 'unknown',
                  timestamp: new Date(message.timestamp * 1000)
                }
              })
              
              newMessageCount++
            }
          }
        }
        
        // Mettre à jour la date de dernière vérification du compte
        await db.instagramAccount.update({
          where: { id: account.id },
          data: {
            lastChecked: new Date()
          }
        })
        
        results.push({
          account: account.username,
          success: true,
          newMessages: newMessageCount
        })
        
        // Pause entre les comptes pour éviter les limites de taux
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (error) {
        console.error(`Erreur lors du traitement du compte ${account.username}:`, error)
        
        // Mettre à jour le statut du compte en cas d'erreur
        await db.instagramAccount.update({
          where: { id: account.id },
          data: {
            isActive: false
          }
        })
        
        results.push({
          account: account.username,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue"
        })
      }
    }
    
    // Journaliser la fin de l'exécution
    await logCronExecution("completed", JSON.stringify(results))
    
    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error("Erreur lors de l'exécution du CRON:", error)
    
    // Journaliser l'erreur
    await logCronExecution("failed", error instanceof Error ? error.message : "Erreur inconnue")
    
    return NextResponse.json(
      { error: "Erreur lors de l'exécution du CRON" },
      { status: 500 }
    )
  }
}
