import { MistralClient } from "@mistralai/mistralai"

// Initialize Mistral client
const client = new MistralClient(process.env.MISTRAL_API_KEY || "")

export async function generateResponse(
  message: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
  try {
    // Create system prompt
    const systemPrompt = `You are a helpful Instagram DM assistant. 
    Your goal is to respond to messages in a friendly, helpful, and concise manner.
    Keep responses under 200 characters when possible.
    Be conversational but professional.
    Do not use hashtags unless specifically relevant.
    If you don't know something, be honest about it.`

    // Prepare messages for the API
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ]

    // Call Mistral API
    const response = await client.chat({
      model: "mistral-large-latest",
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error("Error generating response with Mistral AI:", error)
    return "Sorry, I couldn't generate a response at this time."
  }
}
