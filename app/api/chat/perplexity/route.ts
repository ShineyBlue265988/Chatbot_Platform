import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { StreamingTextResponse } from "ai"
import { ChatService } from "@/lib/langchain/services/chat-service"
import { ServerRuntime } from "next"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages, userId } = json as {
    chatSettings: ChatSettings
    messages: any[]
    userId: string
  }

  try {
    const profile = await getServerProfile()
    checkApiKey(profile.perplexity_api_key, "Perplexity")

    const chatService = new ChatService()

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    chatService
      .streamChat(
        messages,
        chatSettings,
        profile.perplexity_api_key || "",
        async token => {
          await writer.write(encoder.encode(token))
        },
        userId,
        "perplexity"
      )
      .then(async () => {
        await writer.close()
      })

    return new StreamingTextResponse(stream.readable)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "Perplexity API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "Perplexity API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
