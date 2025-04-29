import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Attendre explicitement les cookies et headers
    const cookiesList = await cookies()
    const headersList = await headers()
    
    // Obtenir manuellement le token JWT de next-auth
    const token = await getToken({ 
      req: {
        cookies: cookiesList,
        headers: headersList
      },
      secret: process.env.NEXTAUTH_SECRET || authOptions.secret
    })
    
    // Si nous avons un token, construire manuellement l'objet session
    const session = token ? {
      user: {
        id: token.id || token.sub,
        name: token.name,
        email: token.email,
        image: token.picture || null
      },
      expires: token.exp ? new Date(token.exp * 1000).toISOString() : null
    } : null
    
    // Retourner la session dans un format compatible
    return NextResponse.json({
      authenticated: !!session,
      session
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de la session:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la session" },
      { status: 500 }
    )
  }
}
