import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    // Recherche de l'utilisateur dans la base de données de manière plus robuste
    try {
      const user = await db.user.findFirst({
        where: {
          email: email,
        },
        select: {
          id: true,
          email: true,
        }
      })

      // Renvoie un booléen indiquant si l'utilisateur existe
      return NextResponse.json({ exists: !!user, email })
    } catch (error) {
      console.error("Erreur Prisma lors de la recherche de l'utilisateur:", error)
      return NextResponse.json({ error: "Erreur lors de la vérification de l'utilisateur" }, { status: 500 })
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
