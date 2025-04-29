import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Assurez-vous que cette fonction est exportée comme export par défaut
// ou comme export nommé "middleware"
export function middleware(request: NextRequest) {
  // Pour les routes d'API d'authentification, nous nous assurons que les headers et cookies
  // sont correctement traités de manière asynchrone
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    // Nous pouvons attendre explicitement les headers et cookies ici si nécessaire
    // mais pour la plupart des cas, nous laissons simplement la requête continuer
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Matcher pour les routes d'authentification
    '/api/auth/:path*',
  ],
}
