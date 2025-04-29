import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
import { IgApiClient } from "instagram-private-api"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, username, password } = await req.json()

    // Verify the user ID matches the session user
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if account already exists
    const existingAccount = await db.instagramAccount.findUnique({
      where: {
        userId_username: {
          userId,
          username,
        },
      },
    })

    if (existingAccount) {
      return NextResponse.json({ error: "This Instagram account is already connected" }, { status: 400 })
    }

    // Validate credentials by attempting to login
    const ig = new IgApiClient()
    ig.state.generateDevice(username)

    try {
      await ig.account.login(username, password)
    } catch (error) {
      console.error("Instagram login error:", error)
      return NextResponse.json({ error: "Invalid Instagram credentials" }, { status: 400 })
    }

    // Encrypt password before storing
    const encryptedPassword = encrypt(password)

    // Create new account
    const newAccount = await db.instagramAccount.create({
      data: {
        userId,
        username,
        encryptedPassword,
        isActive: true,
      },
    })

    return NextResponse.json({
      message: "Instagram account added successfully",
      accountId: newAccount.id,
    })
  } catch (error) {
    console.error("Error adding Instagram account:", error)
    return NextResponse.json({ error: "Failed to add Instagram account" }, { status: 500 })
  }
}
