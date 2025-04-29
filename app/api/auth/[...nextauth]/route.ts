import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Créer le gestionnaire d'authentification avec les options mises à jour
const handler = NextAuth(authOptions)

// Exporter les gestionnaires GET et POST
export { handler as GET, handler as POST }
