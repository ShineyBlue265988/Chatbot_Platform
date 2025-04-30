import {
  LLMID,
  OpenAILLMID,
  GoogleLLMID,
  AnthropicLLMID,
  MistralLLMID,
  GroqLLMID,
  PerplexityLLMID
} from "./llms"
import { ModelProvider } from "./models"

export * from "./models"
export * from "./llms"

export interface ChatSettings {
  model: LLMID
  temperature: number
  contextLength: number
  includeProfileContext: boolean
  includeWorkspaceInstructions: boolean
  embeddingsProvider: "openai" | "local"
  prompt: string
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function"
  content: string
  name?: string
  tool_call_id?: string
  chat_id?: string
  assistant_id?: string
}

export interface ChatPayload {
  messages: ChatMessage[]
  chatSettings: ChatSettings
  selectedTools?: any[]
}

// Add the FileItemChunk interface
export interface FileItemChunk {
  id?: string
  fileId: string
  content: string
  tokens: number
  embedding?: number[]
  metadata?: Record<string, any>
}

// Add the ChatFile interface if needed
export interface ChatFile {
  id: string
  name: string
  type: string
  size?: number
  url?: string
  filepath?: string
  content?: string
  messageId?: string
}

// Add the MessageImage interface if needed
export interface MessageImage {
  id: string
  url: string
  messageId: string
  width?: number
  height?: number
  base64?: string // Add this property for base64-encoded image data
}
