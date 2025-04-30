import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import {
  HumanMessage,
  AIMessage,
  SystemMessage
} from "@langchain/core/messages"
import { ChatSettings } from "@/types"
import { LLMService } from "./llm-service"

export class ChatService {
  private llmService: LLMService

  constructor() {
    this.llmService = LLMService.getInstance()
  }

  public async chat(
    messages: { role: string; content: string }[],
    chatSettings: ChatSettings,
    apiKey: string
  ) {
    const model = this.llmService.getModel(chatSettings, apiKey)

    const formattedMessages = messages.map(msg => {
      switch (msg.role) {
        case "user":
          return new HumanMessage(msg.content)
        case "assistant":
          return new AIMessage(msg.content)
        case "system":
          return new SystemMessage(msg.content)
        default:
          throw new Error(`Unsupported message role: ${msg.role}`)
      }
    })

    const response = await model.invoke(formattedMessages)
    return response.content
  }

  public async streamChat(
    messages: { role: string; content: string }[],
    chatSettings: ChatSettings,
    apiKey: string,
    onToken: (token: string) => void
  ) {
    const model = this.llmService.getModel(chatSettings, apiKey)

    const formattedMessages = messages.map(msg => {
      switch (msg.role) {
        case "user":
          return new HumanMessage(msg.content)
        case "assistant":
          return new AIMessage(msg.content)
        case "system":
          return new SystemMessage(msg.content)
        default:
          throw new Error(`Unsupported message role: ${msg.role}`)
      }
    })

    const stream = await model.stream(formattedMessages)

    for await (const chunk of stream) {
      if (typeof chunk.content === "string") {
        onToken(chunk.content)
      } else if (Array.isArray(chunk.content)) {
        // Handle complex content types
        const textContent = chunk.content
          .filter(item => typeof item === "string")
          .join("")
        if (textContent) {
          onToken(textContent)
        }
      }
    }
  }
}
