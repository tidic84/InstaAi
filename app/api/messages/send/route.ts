import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendDirectMessage } from "@/lib/instagram-client-safe"
import { decrypt } from "@/lib/encryption"

export async function POST(request: Request) {
  try {
    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const conversationId = searchParams.get('conversationId')
    
    if (!accountId || !conversationId) {
      return NextResponse.json({ error: "Identifiants de compte et conversation requis" }, { status: 400 })
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
    
    // Récupérer le compte Instagram et vérifier qu'il appartient à l'utilisateur
    const account = await db.instagramAccount.findFirst({
      where: {
        id: accountId,
        userId: token.sub as string
      }
    })
    
    if (!account) {
      return NextResponse.json({ error: "Compte Instagram non trouvé" }, { status: 404 })
    }
    
    // Récupérer la conversation
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        instagramAccountId: accountId
      }
    })
    
    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 })
    }
    
    // Récupérer le message du formulaire
    const formData = await request.formData()
    const messageContent = formData.get('message') as string
    
    if (!messageContent) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 })
    }
    
    // Envoyer le message via l'API Instagram
    try {
      // Déchiffrer le mot de passe
      const password = decrypt(account.password)
      
      // Envoyer le message
      const success = await sendDirectMessage(account.username, password, conversation.id, messageContent)
      
      if (!success) {
        throw new Error("Échec de l'envoi du message")
      }
      
      // Créer un enregistrement local du message
      await db.message.create({
        data: {
          conversationId,
          content: messageContent,
          isFromUser: false, // Le message vient de l'utilisateur de l'application (not from Instagram user)
          createdAt: new Date()
        }
      })
      
      // Rediriger vers la conversation
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/messages/${accountId}/${conversationId}`)
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      return NextResponse.json({ error: "Erreur lors de l'envoi du message à Instagram" }, { status: 500 })
    }
  } catch (error) {
    console.error("Erreur dans l'API d'envoi de message:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
