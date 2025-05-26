import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import {
  HumanMessage,
  AIMessage,
  SystemMessage
} from "@langchain/core/messages"
import { ChatSettings } from "@/types"
import { LLMService } from "./llm-service"
import { saveTokenUsage } from "@/lib/llm/token-usage"
import { LLM_LIST } from "@/lib/models/llm/llm-list"

import type { AIMessageChunk } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"
import { concat } from "@langchain/core/utils/stream"

export class ChatService {
  private llmService: LLMService

  constructor() {
    this.llmService = LLMService.getInstance()
  }

  public async chat(
    messages: { role: string; content: string }[],
    chatSettings: ChatSettings,
    apiKey: string,
    userId: string,
    chatId?: string
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
    const usage = response.usage_metadata ?? response.response_metadata ?? null

    // Save usage if available
    if (usage) {
      // Find provider from LLM_LIST
      const llm = LLM_LIST.find(m => m.modelId === chatSettings.model)
      const modelProvider = llm?.provider || "unknown"
      await saveTokenUsage({
        userId,
        modelName: chatSettings.model,
        modelProvider,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        totalTokens: usage.total_tokens
      })
    }

    return {
      content: response.content,
      usage
    }
  }

  public async streamChat(
    messages: { role: string; content: string }[],
    chatSettings: ChatSettings,
    apiKey: string,
    onToken: (token: string) => void,
    userId: string,
    modelProvider?: string
  ): Promise<{ usage: any }> {
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

    let finalResult: AIMessageChunk | undefined
    for await (const chunk of stream) {
      // Call onToken for each chunk
      if (typeof chunk.content === "string") {
        onToken(chunk.content)
      } else if (Array.isArray(chunk.content)) {
        const textContent = chunk.content
          .filter(item => typeof item === "string")
          .join("")
        if (textContent) {
          onToken(textContent)
        }
      }
      // Save the last chunk for usage metadata
      if (finalResult) {
        finalResult = concat(finalResult, chunk)
      } else {
        finalResult = chunk
      }
    }

    const usage = finalResult?.usage_metadata ?? null
    console.log("usage=============>", usage)

    // Save usage if available
    if (usage) {
      // Find provider from LLM_LIST
      const llm = LLM_LIST.find(m => m.modelId === chatSettings.model)
      const modelProvider = llm?.provider || "unknown"
      await saveTokenUsage({
        userId,
        modelName: chatSettings.model,
        modelProvider,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        totalTokens: usage.total_tokens
      })
    }

    return { usage }
  }
}
