import { IgApiClient } from "instagram-private-api"
import { decrypt } from "@/lib/encryption"
import { db } from "@/lib/db"
import type { Message } from "@prisma/client"

// Cache for Instagram clients to avoid repeated logins
const clientCache = new Map<string, { client: IgApiClient; expiry: number }>()
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

export async function getInstagramClient(accountId: string): Promise<IgApiClient> {
  // Check if we have a cached client that's not expired
  const cached = clientCache.get(accountId)
  if (cached && cached.expiry > Date.now()) {
    return cached.client
  }

  // Get account details from database
  const account = await db.instagramAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    throw new Error("Instagram account not found")
  }

  // Create new client
  const ig = new IgApiClient()
  ig.state.generateDevice(account.username)

  try {
    // Decrypt password and login
    const password = decrypt(account.password)
    await ig.account.login(account.username, password)

    // Cache the client
    clientCache.set(accountId, {
      client: ig,
      expiry: Date.now() + CACHE_TTL,
    })

    return ig
  } catch (error) {
    console.error(`Instagram login error for ${account.username}:`, error)

    // Update account status if login fails
    await db.instagramAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    })

    throw new Error("Failed to login to Instagram")
  }
}

export async function fetchNewMessages(accountId: string): Promise<Message[]> {
  try {
    const ig = await getInstagramClient(accountId)
    const inbox = await ig.feed.directInbox().items()

    const newMessages: Message[] = []
    
    // Obtenir l'ID utilisateur Instagram
    const account = await db.instagramAccount.findUnique({
      where: { id: accountId },
    })
    
    if (!account) {
      throw new Error("Instagram account not found")
    }

    // Process each thread/conversation
    for (const thread of inbox) {
      // Find or create conversation in our database
      let conversation = await db.conversation.findFirst({
        where: {
          participantUsername: thread.users[0]?.username || "unknown",
          instagramAccountId: accountId,
        },
      })

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            instagramAccountId: accountId,
            participantUsername: thread.users[0]?.username || "unknown",
            lastMessageAt: new Date(thread.last_permanent_item.timestamp * 1000),
          },
        })
      }

      // Get thread items (messages)
      const threadItems = await ig.feed.directThread({ thread_id: thread.thread_id }).items()

      // Process each message in the thread
      for (const item of threadItems) {
        if (!item.text) continue; // Skip messages without text
        
        const messageTime = new Date(item.timestamp * 1000);
        
        // Check if we've already processed this message
        const existingMessage = await db.message.findFirst({
          where: {
            conversationId: conversation.id,
            content: item.text,
            createdAt: {
              gte: new Date(messageTime.getTime() - 60000),
              lte: new Date(messageTime.getTime() + 60000),
            }
          },
        })

        if (existingMessage) {
          continue
        }

        // Create new message in our database
        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            content: item.text,
            isFromUser: item.user_id.toString() !== account.instagramUserId,
            createdAt: messageTime,
          },
        })

        // If message is from user, add to newMessages list to process later
        if (message.isFromUser) {
          newMessages.push(message)
        }
      }

      // Update last message time
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      })
    }

    // Update account last checked time
    await db.instagramAccount.update({
      where: { id: accountId },
      data: { updatedAt: new Date() },
    })

    return newMessages
  } catch (error) {
    console.error(`Error fetching messages for account ${accountId}:`, error)
    throw new Error("Failed to fetch Instagram messages")
  }
}

export async function sendDirectMessage(accountId: string, threadId: string, text: string): Promise<boolean> {
  try {
    const ig = await getInstagramClient(accountId)

    // Send the message
    await ig.directThread.broadcast({
      thread_ids: [threadId],
      text: text,
    })

    return true
  } catch (error) {
    console.error(`Error sending message for account ${accountId}:`, error)
    return false
  }
}
