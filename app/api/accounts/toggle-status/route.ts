import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { accountId, isActive } = await req.json()

    // Get the account
    const account = await db.instagramAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Verify the user owns this account
    if (account.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update account status
    await db.instagramAccount.update({
      where: { id: accountId },
      data: { isActive },
    })

    return NextResponse.json({
      message: `Account ${isActive ? "activated" : "deactivated"} successfully`,
    })
  } catch (error) {
    console.error("Error toggling account status:", error)
    return NextResponse.json({ error: "Failed to update account status" }, { status: 500 })
  }
}
