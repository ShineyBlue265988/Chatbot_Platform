import { LLM } from "@/types"
import { GroqLLMID } from "@/types/llms"

const GROQ_PLATORM_LINK = "https://groq.com/"

// Llama 4 Models
const LLAMA_4_SCOUT: LLM = {
  modelId: "meta-llama/llama-4-scout-17b-16e-instruct" as GroqLLMID,
  modelName: "Llama 4 Scout 17B",
  provider: "groq",
  hostedId: "meta-llama/llama-4-scout-17b-16e-instruct",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 131072,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.5,
    outputCost: 1.5
  }
}

const LLAMA_4_MAVERICK: LLM = {
  modelId: "meta-llama/llama-4-maverick-17b-128e-instruct" as GroqLLMID,
  modelName: "Llama 4 Maverick 17B",
  provider: "groq",
  hostedId: "meta-llama/llama-4-maverick-17b-128e-instruct",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 131072,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.5,
    outputCost: 1.5
  }
}

// Llama 3 Models
const LLAMA_3_8B: LLM = {
  modelId: "llama3-8b-8192" as GroqLLMID,
  modelName: "Llama 3 8B",
  provider: "groq",
  hostedId: "llama3-8b-8192",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 8192,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.05,
    outputCost: 0.1
  }
}

const LLAMA_3_70B: LLM = {
  modelId: "llama3-70b-8192" as GroqLLMID,
  modelName: "Llama 3 70B",
  provider: "groq",
  hostedId: "llama3-70b-8192",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 8192,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.59,
    outputCost: 0.79
  }
}

const LLAMA_3_1_8B_INSTANT: LLM = {
  modelId: "llama-3.1-8b-instant" as GroqLLMID,
  modelName: "Llama 3.1 8B Instant",
  provider: "groq",
  hostedId: "llama-3.1-8b-instant",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 131072,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.05,
    outputCost: 0.1
  }
}

const LLAMA_3_3_70B_VERSATILE: LLM = {
  modelId: "llama-3.3-70b-versatile" as GroqLLMID,
  modelName: "Llama 3.3 70B Versatile",
  provider: "groq",
  hostedId: "llama-3.3-70b-versatile",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 131072,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.59,
    outputCost: 0.79
  }
}

// Other Models
const MISTRAL_SABA_24B: LLM = {
  modelId: "mistral-saba-24b" as GroqLLMID,
  modelName: "Mistral Saba 24B",
  provider: "groq",
  hostedId: "mistral-saba-24b",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 32768,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.5,
    outputCost: 1.5
  }
}

const GEMMA2_9B_IT: LLM = {
  modelId: "gemma2-9b-it" as GroqLLMID,
  modelName: "Gemma 2 9B IT",
  provider: "groq",
  hostedId: "gemma2-9b-it",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 8192,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.15,
    outputCost: 0.15
  }
}

const DEEPSEEK_R1_DISTILL_LLAMA_70B: LLM = {
  modelId: "deepseek-r1-distill-llama-70b" as GroqLLMID,
  modelName: "DeepSeek R1 Distill Llama 70B",
  provider: "groq",
  hostedId: "deepseek-r1-distill-llama-70b",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 131072,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.59,
    outputCost: 0.79
  }
}

const QWEN_QWQ_32B: LLM = {
  modelId: "qwen-qwq-32b" as GroqLLMID,
  modelName: "Qwen QWQ 32B",
  provider: "groq",
  hostedId: "qwen-qwq-32b",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 131072,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.5,
    outputCost: 1.5
  }
}

const COMPOUND_BETA: LLM = {
  modelId: "compound-beta" as GroqLLMID,
  modelName: "Compound Beta",
  provider: "groq",
  hostedId: "compound-beta",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 8192,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.5,
    outputCost: 1.5
  }
}

const COMPOUND_BETA_MINI: LLM = {
  modelId: "compound-beta-mini" as GroqLLMID,
  modelName: "Compound Beta Mini",
  provider: "groq",
  hostedId: "compound-beta-mini",
  platformLink: GROQ_PLATORM_LINK,
  imageInput: false,
  maxContext: 8192,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 0.5,
    outputCost: 1.5
  }
}

export const GROQ_LLM_LIST: LLM[] = [
  LLAMA_4_SCOUT,
  LLAMA_4_MAVERICK,
  LLAMA_3_8B,
  LLAMA_3_70B,
  LLAMA_3_1_8B_INSTANT,
  LLAMA_3_3_70B_VERSATILE,
  MISTRAL_SABA_24B,
  GEMMA2_9B_IT,
  DEEPSEEK_R1_DISTILL_LLAMA_70B,
  QWEN_QWQ_32B,
  COMPOUND_BETA,
  COMPOUND_BETA_MINI
]
