import type { Adapter } from "next-auth/adapters"
import { db } from "@/lib/db"

export function CustomPrismaAdapter(): Adapter {
  return {
    // Gestion des utilisateurs
    async createUser(data) {
      const user = await db.user.create({
        data: {
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          image: data.image,
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
        },
      })
      return user
    },
    
    async getUser(id) {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
        },
      })
      return user
    },
    
    async getUserByEmail(email) {
      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
        },
      })
      return user
    },
    
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await db.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        select: { userId: true },
      })
      if (!account) return null
      
      const user = await db.user.findUnique({
        where: { id: account.userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
        },
      })
      return user
    },
    
    async updateUser(data) {
      const user = await db.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          image: data.image,
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
        },
      })
      return user
    },
    
    async deleteUser(userId) {
      await db.user.delete({ where: { id: userId } })
    },
    
    // Gestion des sessions
    async createSession(data) {
      const session = await db.session.create({
        data,
        select: {
          id: true,
          sessionToken: true,
          userId: true,
          expires: true,
        },
      })
      return session
    },
    
    async getSessionAndUser(sessionToken) {
      const sessionAndUser = await db.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              image: true,
            },
          },
        },
      })
      if (!sessionAndUser) return null
      
      const { user, ...session } = sessionAndUser
      return { user, session }
    },
    
    async updateSession(data) {
      const session = await db.session.update({
        where: { sessionToken: data.sessionToken },
        data,
        select: {
          id: true,
          sessionToken: true,
          userId: true,
          expires: true,
        },
      })
      return session
    },
    
    async deleteSession(sessionToken) {
      await db.session.delete({ where: { sessionToken } })
    },
    
    // Gestion des comptes
    async linkAccount(data) {
      await db.account.create({ data })
    },
    
    async unlinkAccount({ providerAccountId, provider }) {
      await db.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      })
    },

    // Gestion des tokens de vérification
    async createVerificationToken(data) {
      // Utiliser une requête SQL brute pour contourner les problèmes de schéma
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS "VerificationToken" (
          "identifier" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier", "token")
        );
      `;
      
      // Puis insérer le token
      await db.$executeRaw`
        INSERT INTO "VerificationToken" ("identifier", "token", "expires")
        VALUES (${data.identifier}, ${data.token}, ${data.expires})
      `;
      
      return data;
    },
    
    async useVerificationToken({ identifier, token }) {
      try {
        // Vérifier si la table existe
        const tableExists = await db.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'VerificationToken'
          );
        `;
        
        // Si la table n'existe pas, retourner null
        if (!tableExists[0].exists) {
          return null;
        }
        
        // Récupérer le token
        const result = await db.$queryRaw`
          DELETE FROM "VerificationToken"
          WHERE "identifier" = ${identifier} AND "token" = ${token}
          RETURNING "identifier", "token", "expires"
        `;
        
        // Si aucun token n'a été trouvé, retourner null
        if (!result || !result[0]) {
          return null;
        }
        
        return result[0];
      } catch (error) {
        console.error("Error in useVerificationToken:", error);
        return null;
      }
    }
  }
}
