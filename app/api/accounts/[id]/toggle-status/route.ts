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
    
    // Récupérer le corps de la requête
    const body = await request.json().catch(() => ({}))
    const isActive = body.isActive === true // S'assurer que c'est un booléen
    
    console.log(`Tentative de modification du statut du compte ${accountId} à ${isActive ? 'actif' : 'inactif'}`)
    
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
    
    // Mettre à jour le statut du compte
    const updatedAccount = await db.instagramAccount.update({
      where: { id: accountId },
      data: { isActive }
    })
    
    return NextResponse.json({
      success: true,
      message: `Le compte est maintenant ${isActive ? "actif" : "inactif"}.`,
      account: {
        id: updatedAccount.id,
        username: updatedAccount.username,
        isActive: updatedAccount.isActive
      }
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du compte:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du compte Instagram" },
      { status: 500 }
    )
  }
}
