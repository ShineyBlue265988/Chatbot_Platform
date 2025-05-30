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
    checkApiKey(profile.mistral_api_key, "Mistral")

    const chatService = new ChatService()

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    chatService
      .streamChat(
        messages,
        chatSettings,
        profile.mistral_api_key || "",
        async token => {
          await writer.write(encoder.encode(token))
        },
        userId,
        "mistral"
      )
      .then(async () => {
        await writer.close()
      })

    return new StreamingTextResponse(stream.readable)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    // Handle model deprecation errors
    if (
      errorMessage.includes("will be deprecated") ||
      errorMessage.includes("has been deprecated")
    ) {
      return new Response(
        JSON.stringify({
          message: errorMessage,
          type: "model_deprecation"
        }),
        {
          status: 400
        }
      )
    }

    // Handle API key errors
    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "Mistral API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "Mistral API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
