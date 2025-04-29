import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
import { loginToInstagram } from "@/lib/instagram-client-safe"

export async function POST(request: Request) {
  try {
    // Authentification de l'utilisateur
    const cookiesList = await cookies()
    const headersList = await headers()
    
    const token = await getToken({ 
      req: {
        cookies: cookiesList,
        headers: headersList
      },
      secret: process.env.NEXTAUTH_SECRET || authOptions.secret
    })
    
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    
    // Récupération des données du formulaire
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur et mot de passe requis" },
        { status: 400 }
      )
    }
    
    try {
      // Vérifier les identifiants Instagram avec notre wrapper sécurisé
      await loginToInstagram(username, password)
      
      // Chiffrement du mot de passe avant de le stocker
      const encryptedPassword = encrypt(password)
      
      // Vérification si le compte existe déjà pour cet utilisateur
      const existingAccount = await db.instagramAccount.findFirst({
        where: {
          username,
          userId: token.sub as string
        }
      })
      
      if (existingAccount) {
        // Mise à jour du compte existant
        await db.instagramAccount.update({
          where: { id: existingAccount.id },
          data: {
            password: encryptedPassword,
            isActive: true,
            updatedAt: new Date(),
          }
        })
        
        return NextResponse.json({ success: true, message: "Compte Instagram mis à jour avec succès" })
      }
      
      // Création d'un nouveau compte
      await db.instagramAccount.create({
        data: {
          username,
          password: encryptedPassword,
          userId: token.sub as string,
          isActive: true,
        }
      })
      
      return NextResponse.json({ success: true, message: "Compte Instagram ajouté avec succès" })
    } catch (error: any) {
      console.error("Erreur de connexion Instagram:", error)
      
      // Envoyer un message d'erreur plus clair à l'utilisateur
      const errorMessage = error.message || "Impossible de se connecter au compte Instagram. Vérifiez vos identifiants."
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du compte:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du compte Instagram" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Authentification de l'utilisateur
    const cookiesList = await cookies()
    const headersList = await headers()
    
    const token = await getToken({ 
      req: {
        cookies: cookiesList,
        headers: headersList
      },
      secret: process.env.NEXTAUTH_SECRET || authOptions.secret
    })
    
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    
    // Récupération des comptes de l'utilisateur
    const accounts = await db.instagramAccount.findMany({
      where: {
        userId: token.sub as string
      },
      select: {
        id: true,
        username: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            conversations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des comptes Instagram" },
      { status: 500 }
    )
  }
}
