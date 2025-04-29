import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcrypt"

export async function POST(request: Request) {
  try {
    const { email, name, password } = await request.json()

    // Validation des données
    if (!email || !name || !password) {
      return NextResponse.json({ error: "Email, nom et mot de passe requis" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.user.findFirst({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà inscrit" }, { status: 400 })
    }

    // Hacher le mot de passe
    const hashedPassword = await hash(password, 10)

    try {
      // Créer la table User avec une colonne password si elle n'existe pas déjà
      await db.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'User' AND column_name = 'password'
          ) THEN
            ALTER TABLE "User" ADD COLUMN "password" TEXT;
          END IF;
        END
        $$;
      `;

      // Insérer l'utilisateur avec un mot de passe
      const result = await db.$executeRaw`
        INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${name}, ${email}, ${hashedPassword}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, name, email
      `;

      // Récupérer l'utilisateur créé
      const newUser = await db.user.findFirst({
        where: { email },
        select: { id: true, name: true, email: true }
      })

      return NextResponse.json({ 
        success: true, 
        message: "Utilisateur créé avec succès",
        user: newUser
      })
    } catch (error) {
      console.error("Erreur SQL:", error)
      throw error
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    return NextResponse.json({ 
      error: "Erreur interne du serveur", 
      details: error instanceof Error ? error.message : "Erreur inconnue" 
    }, { status: 500 })
  }
}
