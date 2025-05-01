import { LLMID } from "./llms"
import { ModelProvider } from "./models"

export * from "./announcement"
export * from "./assistant-retrieval-item"
export * from "./chat"
export * from "./chat-file"
export * from "./chat-message"
export * from "./collection-file"
export * from "./content-type"
export * from "./file-item-chunk"
export * from "./images/assistant-image"
export * from "./images/message-image"
export * from "./images/workspace-image"
export * from "./sharing"
export * from "./sidebar-data"

export interface LLM {
  modelId: string
  modelName: string
  provider: ModelProvider
  hostedId: string
  platformLink: string
  imageInput: boolean
  maxContext?: number
  pricing?: {
    currency: string
    unit: string
    inputCost: number
    outputCost: number
  }
}
