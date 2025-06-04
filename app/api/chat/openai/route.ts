import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { StreamingTextResponse } from "ai"
import { ChatService } from "@/lib/langchain/services/chat-service"
import { ServerRuntime } from "next"
import { enforceUsageLimits } from "@/lib/server/limit-enforcement"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages, agentId } = json as {
    chatSettings: ChatSettings
    messages: any[]
    agentId?: string
  }

  try {
    const profile = await getServerProfile()
    const userId = profile.user_id

    // Determine which API key to use based on the model
    let apiKey: string
    let provider: string

    // Check for OpenRouter models first (they can have various formats)
    if (chatSettings.model.includes("/") || chatSettings.model.includes(":")) {
      apiKey = profile.openrouter_api_key || ""
      provider = "openrouter"
    } else {
      // Handle other providers based on model prefix
      switch (chatSettings.model.split("-")[0]) {
        case "gpt":
          apiKey = profile.openai_api_key || ""
          provider = "openai"
          break
        case "claude":
          apiKey = profile.anthropic_api_key || ""
          provider = "anthropic"
          break
        case "gemini":
          apiKey = profile.google_gemini_api_key || ""
          provider = "google"
          break
        case "mistral":
          apiKey = profile.mistral_api_key || ""
          provider = "mistral"
          break
        case "llama3":
        case "mixtral":
        case "gemma":
          apiKey = profile.groq_api_key || ""
          provider = "groq"
          break
        case "pplx":
        case "sonar":
          apiKey = profile.perplexity_api_key || ""
          provider = "perplexity"
          break
        default:
          throw new Error(`Unsupported model: ${chatSettings.model}`)
      }
    }

    checkApiKey(apiKey, provider)

    // Check usage limits
    await enforceUsageLimits({
      userId,
      modelName: chatSettings.model,
      modelProvider: "openai",
      agentId
    })

    const chatService = new ChatService()
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    console.log("profile--------------->", profile)
    // const workspaceId = profile.workspace_id
    chatService
      .streamChat(
        messages,
        chatSettings,
        apiKey,
        async token => {
          await writer.write(encoder.encode(token))
        },
        userId,
        provider
        // workspaceId
      )
      .then(async () => {
        await writer.close()
      })
      .catch(async err => {
        await writer.close()
        throw err
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
