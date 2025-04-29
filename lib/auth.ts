import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { compare } from "bcrypt"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user || !user.password) {
            return null
          }

          const passwordMatch = await compare(credentials.password, user.password)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        } catch (error) {
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Assurez-vous que l'ID est correctement assigné au token
        token.id = user.id
        token.name = user.name
        token.email = user.email
        // Pour le débogage, ajoutons aussi un champ spécifique
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // Assurez-vous que l'ID est correctement assigné à la session utilisateur
        session.user.id = token.id as string || token.sub || token.userId as string
        session.user.name = token.name
        session.user.email = token.email
      }
      return session
    }
  },
  debug: true, // Activons temporairement le mode debug pour voir les logs
}
