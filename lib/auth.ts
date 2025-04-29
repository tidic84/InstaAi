import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { compare } from "bcrypt"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
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
          // Trouver l'utilisateur par email
          const user = await db.user.findFirst({
            where: { email: credentials.email },
            select: { 
              id: true, 
              name: true, 
              email: true,
              password: true
            }
          })

          if (!user || !user.password) {
            return null
          }

          // Vérifier le mot de passe
          const passwordValid = await compare(credentials.password, user.password)
          
          if (!passwordValid) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email
          }
        } catch (error) {
          console.error("Erreur d'authentification:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name
        session.user.email = token.email
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  debug: process.env.NODE_ENV === "development",
}
