import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fetchNewMessages } from "@/lib/instagram-client"
import { generateResponse } from "@/lib/mistral-client"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active Instagram accounts for the user
    const accounts = await db.instagramAccount.findMany({
      where: {
        userId: session.user.id as string,
        isActive: true,
      },
    })

    if (accounts.length === 0) {
      return NextResponse.json({ message: "No active Instagram accounts found" }, { status: 200 })
    }

    let totalNewMessages = 0
    let totalResponses = 0

    // Process each account
    for (const account of accounts) {
      try {
        // Fetch new messages
        const newMessages = await fetchNewMessages(account.id)
        totalNewMessages += newMessages.length

        // Generate AI responses for new messages
        for (const message of newMessages) {
          // Get conversation history
          const conversationHistory = await db.message.findMany({
            where: {
              conversationId: message.conversationId,
              id: { not: message.id },
            },
            orderBy: {
              timestamp: "asc",
            },
            take: 10, // Limit to last 10 messages for context
          })

          // Format conversation history for Mistral AI
          const formattedHistory = conversationHistory.map((msg) => ({
            role: msg.isFromUser ? "user" : ("assistant" as "user" | "assistant"),
            content: msg.content,
          }))

          // Generate response
          const aiResponse = await generateResponse(message.content, formattedHistory)

          // Save the suggested response
          await db.aIResponse.create({
            data: {
              messageId: message.id,
              suggestedResponse: aiResponse,
              status: "pending",
            },
          })

          totalResponses++
        }
      } catch (error) {
        console.error(`Error processing account ${account.username}:`, error)
        // Continue with other accounts even if one fails
      }
    }

    return NextResponse.json({
      message: `Processed ${accounts.length} accounts, found ${totalNewMessages} new messages, generated ${totalResponses} responses`,
    })
  } catch (error) {
    console.error("Error in message fetch API:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
