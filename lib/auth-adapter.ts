import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import { db } from "@/lib/db"
import { hash } from "bcrypt"

// Créer une version modifiée de l'adaptateur PrismaAdapter
export function CustomPrismaAdapter(): Adapter {
  // Commencer avec l'adaptateur standard
  const standardAdapter = PrismaAdapter(db)
  
  return {
    ...standardAdapter,
    // Remplacer la fonction getUserByEmail pour éviter le problème de colonne password
    async getUserByEmail(email) {
      try {
        const user = await db.user.findFirst({
          where: { email },
          select: { 
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true
          }
        })
        return user
      } catch (error) {
        console.error("Error in getUserByEmail:", error)
        return null
      }
    },
    // Remplacer la fonction createUser pour gérer le password
    async createUser(data) {
      try {
        // Générer un mot de passe temporaire si nous devons en créer un
        const randomPassword = Math.random().toString(36).slice(-10)
        const hashedPassword = await hash(randomPassword, 10)
        
        // Utiliser une requête brute pour créer l'utilisateur sans le champ password
        const result = await db.$executeRaw`
          INSERT INTO "User" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${data.name || null}, ${data.email}, ${data.emailVerified || null}, ${data.image || null}, NOW(), NOW())
          RETURNING id, name, email, "emailVerified", image, "createdAt", "updatedAt"
        `
        
        // Récupérer l'utilisateur créé
        const user = await db.user.findFirst({
          where: { email: data.email },
          select: { 
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true
          }
        })
        
        return user!
      } catch (error) {
        console.error("Error in createUser:", error)
        throw error
      }
    }
  }
}
