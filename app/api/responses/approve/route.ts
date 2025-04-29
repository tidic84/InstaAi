import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendDirectMessage } from "@/lib/instagram-client"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { responseId, modifiedText } = await req.json()

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

    // Determine the text to send
    const textToSend = modifiedText || aiResponse.suggestedResponse

    // Send the message to Instagram
    const success = await sendDirectMessage(
      aiResponse.message.conversation.instagramAccount.id,
      aiResponse.message.conversation.id,
      textToSend,
    )

    if (!success) {
      return NextResponse.json({ error: "Failed to send message to Instagram" }, { status: 500 })
    }

    // Update the AI response status
    await db.aIResponse.update({
      where: { id: responseId },
      data: {
        status: "sent",
        modifiedResponse: modifiedText,
      },
    })

    // Create a new message record for the sent response
    await db.message.create({
      data: {
        conversationId: aiResponse.message.conversationId,
        content: textToSend,
        isFromUser: false,
        timestamp: new Date(),
      },
    })

    return NextResponse.json({
      message: "Response approved and sent successfully",
    })
  } catch (error) {
    console.error("Error in approve response API:", error)
    return NextResponse.json({ error: "Failed to approve and send response" }, { status: 500 })
  }
}
