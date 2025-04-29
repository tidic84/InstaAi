import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
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

    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('id')
    
    if (!conversationId) {
      // Si aucun ID de conversation n'est fourni, retourner toutes les conversations de l'utilisateur
      const conversations = await db.conversation.findMany({
        where: {
          instagramAccount: {
            userId: token.sub as string
          }
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "desc"
            },
            take: 10
          },
          instagramAccount: {
            select: {
              id: true,
              username: true
            }
          }
        }
      })
      
      return NextResponse.json({
        count: conversations.length,
        conversations: conversations.map(c => ({
          id: c.id,
          participantUsername: c.participantUsername,
          accountId: c.instagramAccountId,
          accountUsername: c.instagramAccount.username,
          messageCount: c.messages.length,
          lastMessageAt: c.lastMessageAt,
          messages: c.messages.slice(0, 3).map(m => ({
            id: m.id,
            content: m.content,
            isFromUser: m.isFromUser,
            createdAt: m.createdAt
          }))
        }))
      })
    }
    
    // Récupérer les détails d'une conversation spécifique
    const conversation = await db.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc"
          }
        },
        instagramAccount: {
          select: {
            id: true,
            username: true,
            userId: true
          }
        }
      }
    })
    
    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 })
    }
    
    // Vérifier que l'utilisateur a accès à cette conversation
    if (conversation.instagramAccount.userId !== token.sub) {
      return NextResponse.json({ error: "Non autorisé à accéder à cette conversation" }, { status: 403 })
    }
    
    return NextResponse.json({
      id: conversation.id,
      participantUsername: conversation.participantUsername,
      accountId: conversation.instagramAccountId,
      accountUsername: conversation.instagramAccount.username,
      messageCount: conversation.messages.length,
      lastMessageAt: conversation.lastMessageAt,
      messages: conversation.messages.map(m => ({
        id: m.id,
        content: m.content,
        isFromUser: m.isFromUser,
        createdAt: m.createdAt
      }))
    })
  } catch (error) {
    console.error("Erreur lors du débogage de la conversation:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
