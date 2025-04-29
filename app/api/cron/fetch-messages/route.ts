import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fetchNewMessages } from "@/lib/instagram-client"
import { generateResponse } from "@/lib/mistral-client"

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(req.url)
    const cronSecret = searchParams.get("secret")

    if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
      console.error("Unauthorized cron job attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting scheduled message fetch...")

    // Get all active Instagram accounts
    const accounts = await db.instagramAccount.findMany({
      where: {
        isActive: true,
      },
    })

    if (accounts.length === 0) {
      return NextResponse.json({ message: "No active Instagram accounts found" }, { status: 200 })
    }

    let totalNewMessages = 0
    let totalResponses = 0
    const accountResults = []

    // Process each account
    for (const account of accounts) {
      try {
        console.log(`Processing account: ${account.username}`)

        // Fetch new messages
        const newMessages = await fetchNewMessages(account.id)
        totalNewMessages += newMessages.length

        let accountResponseCount = 0

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
          accountResponseCount++
        }

        accountResults.push({
          username: account.username,
          newMessages: newMessages.length,
          responsesGenerated: accountResponseCount,
          success: true,
        })
      } catch (error) {
        console.error(`Error processing account ${account.username}:`, error)
        accountResults.push({
          username: account.username,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        })
        // Continue with other accounts even if one fails
      }
    }

    // Update last run timestamp in database
    await db.cronLog.create({
      data: {
        jobType: "fetch-messages",
        status: "completed",
        details: JSON.stringify({
          accountsProcessed: accounts.length,
          totalNewMessages,
          totalResponses,
          accountResults,
        }),
      },
    })

    console.log(
      `Cron job completed: Processed ${accounts.length} accounts, found ${totalNewMessages} new messages, generated ${totalResponses} responses`,
    )

    return NextResponse.json({
      message: `Processed ${accounts.length} accounts, found ${totalNewMessages} new messages, generated ${totalResponses} responses`,
      accountResults,
    })
  } catch (error) {
    console.error("Error in cron job:", error)

    // Log error in database
    await db.cronLog.create({
      data: {
        jobType: "fetch-messages",
        status: "failed",
        details: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      },
    })

    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
