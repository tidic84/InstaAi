import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"

export async function getServerSessionSafe() {
  // Attendre explicitement les cookies et headers
  const cookiesList = await cookies()
  const headersList = await headers()
  
  // Obtenir manuellement le token JWT
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

  return session
}
