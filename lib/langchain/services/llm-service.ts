import { ChatOpenAI } from "@langchain/openai"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { ChatSettings } from "@/types"

type SupportedChatModel = ChatOpenAI | ChatAnthropic | ChatGoogleGenerativeAI

export class LLMService {
  private static instance: LLMService
  private models: Map<string, SupportedChatModel> = new Map()

  private constructor() {}

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService()
    }
    return LLMService.instance
  }

  public getModel(
    chatSettings: ChatSettings,
    apiKey: string
  ): SupportedChatModel {
    const modelKey = `${chatSettings.model}-${apiKey}`

    if (this.models.has(modelKey)) {
      return this.models.get(modelKey)!
    }

    let model: SupportedChatModel

    // Check for OpenRouter models first (they can have various formats)
    if (chatSettings.model.includes("/") || chatSettings.model.includes(":")) {
      model = new ChatOpenAI({
        modelName: chatSettings.model,
        temperature: chatSettings.temperature,
        openAIApiKey: apiKey,
        streaming: true,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1"
        }
      })
    } else {
      // Handle other providers based on model prefix
      switch (chatSettings.model.split("-")[0]) {
        case "gpt":
          model = new ChatOpenAI({
            modelName: chatSettings.model,
            temperature: chatSettings.temperature,
            openAIApiKey: apiKey,
            streaming: true
          })
          break
        case "claude":
          model = new ChatAnthropic({
            modelName: chatSettings.model,
            temperature: chatSettings.temperature,
            anthropicApiKey: apiKey
          })
          break
        case "gemini":
          model = new ChatGoogleGenerativeAI({
            modelName: chatSettings.model,
            temperature: chatSettings.temperature,
            apiKey: apiKey
          })
          break
        case "mistral":
          model = new ChatOpenAI({
            modelName: chatSettings.model,
            temperature: chatSettings.temperature,
            openAIApiKey: apiKey,
            streaming: true,
            configuration: {
              baseURL: "https://api.mistral.ai/v1"
            }
          })
          break
        case "llama3":
        case "mixtral":
        case "gemma":
        case "deepseek":
        case "qwen":
        case "compound":
          // Groq models
          model = new ChatOpenAI({
            modelName: chatSettings.model,
            temperature: chatSettings.temperature,
            openAIApiKey: apiKey,
            streaming: true,
            configuration: {
              baseURL: "https://api.groq.com/openai/v1"
            }
          })
          break
        case "pplx":
        case "sonar":
          // Perplexity models
          model = new ChatOpenAI({
            modelName: chatSettings.model,
            temperature: chatSettings.temperature,
            openAIApiKey: apiKey,
            streaming: true,
            configuration: {
              baseURL: "https://api.perplexity.ai"
            }
          })
          break
        default:
          throw new Error(`Unsupported model: ${chatSettings.model}`)
      }
    }

    this.models.set(modelKey, model)
    return model
  }
}
