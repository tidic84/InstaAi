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

    const { responseId } = await req.json()

    // Get the AI response
    const aiResponse = await db.aIResponse.findUnique({
      where: { id: responseId },
      include: {
        message: {
          include: {
            conversation: {
              include: {
                instagramAccount: true,
              },
            },
          },
        },
      },
    })

    if (!aiResponse) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 })
    }

    // Verify the user owns this account
    if (aiResponse.message.conversation.instagramAccount.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update the AI response status
    await db.aIResponse.update({
      where: { id: responseId },
      data: {
        status: "rejected",
      },
    })

    return NextResponse.json({
      message: "Response rejected successfully",
    })
  } catch (error) {
    console.error("Error in reject response API:", error)
    return NextResponse.json({ error: "Failed to reject response" }, { status: 500 })
  }
}
