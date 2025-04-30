import { ModelProvider } from "."

// export type LLMID =
//   | OpenAILLMID
//   | GoogleLLMID
//   | AnthropicLLMID
//   | MistralLLMID
//   | GroqLLMID
//   | PerplexityLLMID

// OpenAI Models (UPDATED 5/13/24)
export type OpenAILLMID =
  | "gpt-4o" // GPT-4o
  | "gpt-4-turbo-preview" // GPT-4 Turbo
  | "gpt-4-vision-preview" // GPT-4 Vision
  | "gpt-4" // GPT-4
  | "gpt-3.5-turbo" // Updated GPT-3.5 Turbo

// Google Models
export type GoogleLLMID =
  | "gemini-pro" // Gemini Pro
  | "gemini-pro-vision" // Gemini Pro Vision
  | "gemini-1.5-pro-latest" // Gemini 1.5 Pro
  | "gemini-1.5-flash" // Gemini 1.5 Flash

// Anthropic Models
export type AnthropicLLMID =
  | "claude-2.1" // Claude 2
  | "claude-instant-1.2" // Claude Instant
  | "claude-3-haiku-20240307" // Claude 3 Haiku
  | "claude-3-sonnet-20240229" // Claude 3 Sonnet
  | "claude-3-opus-20240229" // Claude 3 Opus
  | "claude-3-5-sonnet-20240620" // Claude 3.5 Sonnet

// Mistral Models
export type MistralLLMID =
  | "mistral-tiny" // Mistral Tiny
  | "mistral-small-latest" // Mistral Small
  | "mistral-medium-latest" // Mistral Medium
  | "mistral-large-latest" // Mistral Large

export type GroqLLMID =
  | "llama3-8b-8192" // Llama 3 8B
  | "llama3-70b-8192" // Llama 3 70B
  | "llama-3.1-8b-instant" // Llama 3.1 8B Instant
  | "llama-3.3-70b-versatile" // Llama 3.3 70B Versatile
  | "meta-llama/llama-4-scout-17b-16e-instruct" // Llama 4 Scout 17B
  | "meta-llama/llama-4-maverick-17b-128e-instruct" // Llama 4 Maverick 17B
  | "mistral-saba-24b" // Mistral Saba 24B
  | "gemma2-9b-it" // Gemma 2 9B IT
  | "deepseek-r1-distill-llama-70b" // DeepSeek R1 Distill Llama 70B
  | "qwen-qwq-32b" // Qwen QWQ 32B
  | "compound-beta" // Compound Beta
  | "compound-beta-mini" // Compound Beta Mini

// Perplexity Models (UPDATED 1/31/24)
export type PerplexityLLMID =
  | "pplx-7b-online" // Perplexity Online 7B
  | "pplx-70b-online" // Perplexity Online 70B
  | "pplx-7b-chat" // Perplexity Chat 7B
  | "pplx-70b-chat" // Perplexity Chat 70B
  | "mixtral-8x7b-instruct" // Mixtral 8x7B Instruct
  | "mistral-7b-instruct" // Mistral 7B Instruct
  | "llama-2-70b-chat" // Llama2 70B Chat
  | "codellama-34b-instruct" // CodeLlama 34B Instruct
  | "codellama-70b-instruct" // CodeLlama 70B Instruct
  | "sonar-small-chat" // Sonar Small Chat
  | "sonar-small-online" // Sonar Small Online
  | "sonar-medium-chat" // Sonar Medium Chat
  | "sonar-medium-online" // Sonar Medium Online

export type LLMID = string // Or a more specific union type if applicable

export interface LLM {
  modelId: LLMID
  modelName: string
  provider: ModelProvider
  hostedId: string
  platformLink: string
  imageInput: boolean
  pricing?: {
    currency: string
    unit: string
    inputCost: number
    outputCost?: number
  }
}

export interface OpenRouterLLM extends LLM {
  maxContext: number
}
