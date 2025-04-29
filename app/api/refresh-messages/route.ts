import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: "ID de compte requis" }, { status: 400 })
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

    // Vérifier que le compte appartient à l'utilisateur
    const account = await db.instagramAccount.findFirst({
      where: {
        id: accountId,
        userId: token.sub as string
      }
    })

    if (!account) {
      return NextResponse.json({ error: "Compte non trouvé" }, { status: 404 })
    }
    
    // Appeler l'API de récupération des messages
    try {
      const baseUrl = process.env.NEXTAUTH_URL || `https://${headersList.get('host')}`
      const response = await fetch(`${baseUrl}/api/messages/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": cookiesList.toString()
        },
        body: JSON.stringify({
          accountId: accountId
        })
      })
      
      const responseData = await response.json()
      if (!response.ok) {
        return NextResponse.json({ error: responseData.error || "Échec de la récupération des messages" }, { status: response.status })
      }
      
      // Rediriger vers la page des messages du compte
      return NextResponse.redirect(`${baseUrl}/dashboard/messages/${accountId}`)
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API de récupération des messages:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des messages" }, { status: 500 })
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    )
  }
}
