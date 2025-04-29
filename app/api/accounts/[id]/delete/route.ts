import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id
    
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
    
    // Vérifier que le compte Instagram appartient à l'utilisateur
    const account = await db.instagramAccount.findFirst({
      where: {
        id: accountId,
        userId: token.sub as string
      }
    })
    
    if (!account) {
      return NextResponse.json({ error: "Compte Instagram non trouvé" }, { status: 404 })
    }
    
    try {
      // Supprimer d'abord les conversations et messages associés
      // Récupérer toutes les conversations de ce compte
      const conversations = await db.conversation.findMany({
        where: { instagramAccountId: accountId },
        select: { id: true }
      });
      
      // Pour chaque conversation, supprimer les messages et réponses AI associés
      for (const conversation of conversations) {
        // Supprimer les réponses AI associées aux messages de cette conversation
        await db.aIResponse.deleteMany({
          where: {
            message: {
              conversationId: conversation.id
            }
          }
        });
        
        // Supprimer les messages
        await db.message.deleteMany({
          where: { conversationId: conversation.id }
        });
      }
      
      // Supprimer les conversations
      await db.conversation.deleteMany({
        where: { instagramAccountId: accountId }
      });
      
      // Enfin, supprimer le compte
      await db.instagramAccount.delete({
        where: { id: accountId }
      });
      
      return NextResponse.json({
        success: true,
        message: "Le compte a été supprimé avec succès."
      });
    } catch (error) {
      console.error("Erreur lors de la suppression des données:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression du compte et des données associées" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du compte:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte Instagram" },
      { status: 500 }
    )
  }
}
