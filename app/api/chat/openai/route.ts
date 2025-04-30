import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { StreamingTextResponse } from "ai"
import { ChatService } from "@/lib/langchain/services/chat-service"
import { ServerRuntime } from "next"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    const profile = await getServerProfile()

    // Determine which API key to use based on the model
    let apiKey: string
    let provider: string

    // Check for OpenRouter models first (they can have various formats)
    if (chatSettings.model.includes("/") || chatSettings.model.includes(":")) {
      apiKey = profile.openrouter_api_key || ""
      provider = "OpenRouter"
    } else {
      // Handle other providers based on model prefix
      switch (chatSettings.model.split("-")[0]) {
        case "gpt":
          apiKey = profile.openai_api_key || ""
          provider = "OpenAI"
          break
        case "claude":
          apiKey = profile.anthropic_api_key || ""
          provider = "Anthropic"
          break
        case "gemini":
          apiKey = profile.google_gemini_api_key || ""
          provider = "Google"
          break
        case "mistral":
          apiKey = profile.mistral_api_key || ""
          provider = "Mistral"
          break
        case "llama3":
        case "mixtral":
        case "gemma":
          apiKey = profile.groq_api_key || ""
          provider = "Groq"
          break
        case "pplx":
        case "sonar":
          apiKey = profile.perplexity_api_key || ""
          provider = "Perplexity"
          break
        default:
          throw new Error(`Unsupported model: ${chatSettings.model}`)
      }
    }

    checkApiKey(apiKey, provider)

    const chatService = new ChatService()

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    chatService
      .streamChat(messages, chatSettings, apiKey, async token => {
        await writer.write(encoder.encode(token))
      })
      .then(async () => {
        await writer.close()
      })

    return new StreamingTextResponse(stream.readable)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
