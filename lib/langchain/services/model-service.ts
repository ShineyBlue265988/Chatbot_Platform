import { ChatSettings } from "@/types"

interface ModelDeprecation {
  deprecatedModel: string
  shutdownDate: string
  recommendedReplacements: string[]
}

export class ModelService {
  private static instance: ModelService
  private deprecations: Map<string, ModelDeprecation> = new Map()

  private constructor() {
    this.initializeDeprecations()
  }

  public static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService()
    }
    return ModelService.instance
  }

  private initializeDeprecations() {
    // April 14, 2025 deprecations
    this.addDeprecation("llama-3.2-1b-preview", "2025-04-14", [
      "llama-3.1-8b-instant"
    ])
    this.addDeprecation("llama-3.2-3b-preview", "2025-04-14", [
      "llama-3.1-8b-instant"
    ])
    this.addDeprecation("llama-3.2-11b-vision-preview", "2025-04-14", [
      "meta-llama/llama-4-scout-17b-16e-instruct"
    ])
    this.addDeprecation("llama-3.2-90b-vision-preview", "2025-04-14", [
      "meta-llama/llama-4-scout-17b-16e-instruct"
    ])
    this.addDeprecation("deepseek-r1-distill-qwen-32b", "2025-04-14", [
      "qwen-qwq-32b"
    ])
    this.addDeprecation("qwen-2.5-32b", "2025-04-14", ["qwen-qwq-32b"])
    this.addDeprecation("qwen-2.5-coder-32b", "2025-04-14", [
      "qwen-qwq-32b",
      "meta-llama/llama-4-maverick-17b-128e-instruct"
    ])
    this.addDeprecation("llama-3.3-70b-specdec", "2025-04-14", [
      "meta-llama/llama-4-scout-17b-16e-instruct"
    ])
    this.addDeprecation("deepseek-r1-distill-llama-70b-specdec", "2025-04-14", [
      "deepseek-r1-distill-llama-70b",
      "deepseek-r1-distill-qwen-32b"
    ])

    // March 24, 2025 deprecations
    this.addDeprecation("deepseek-r1-distill-llama-70b-specdec", "2025-03-24", [
      "deepseek-r1-distill-llama-70b",
      "deepseek-r1-distill-qwen-32b"
    ])

    // March 20, 2025 deprecations
    this.addDeprecation("mixtral-8x7b-32768", "2025-03-20", [
      "mistral-saba-24b",
      "llama-3.3-70b-versatile"
    ])

    // January 24, 2025 deprecations
    this.addDeprecation("llama-3.1-70b-versatile", "2025-01-24", [
      "llama-3.3-70b-versatile"
    ])
    this.addDeprecation("llama-3.1-70b-specdec", "2025-01-24", [
      "llama-3.3-70b-specdec"
    ])

    // January 6, 2025 deprecations
    this.addDeprecation("llama3-groq-8b-8192-tool-use-preview", "2025-01-06", [
      "llama-3.3-70b-versatile"
    ])
    this.addDeprecation("llama3-groq-70b-8192-tool-use-preview", "2025-01-06", [
      "llama-3.3-70b-versatile"
    ])

    // December 18, 2024 deprecations
    this.addDeprecation("gemma-7b-it", "2024-12-18", ["gemma2-9b-it"])

    // November 25, 2024 deprecations
    this.addDeprecation("llama-3.2-90b-text-preview", "2024-11-25", [
      "llama-3.2-90b-vision-preview",
      "llama-3.1-70b-versatile"
    ])

    // October 18, 2024 deprecations
    this.addDeprecation("llava-v1.5-7b-4096-preview", "2024-10-28", [
      "llama-3.2-11b-vision-preview"
    ])
    this.addDeprecation("llama-3.2-11b-text-preview", "2024-10-28", [
      "llama-3.2-11b-vision-preview",
      "llama-3.1-8b-instant"
    ])
  }

  private addDeprecation(
    deprecatedModel: string,
    shutdownDate: string,
    recommendedReplacements: string[]
  ) {
    this.deprecations.set(deprecatedModel, {
      deprecatedModel,
      shutdownDate,
      recommendedReplacements
    })
  }

  public checkModelDeprecation(chatSettings: ChatSettings): {
    isDeprecated: boolean
    message?: string
  } {
    const deprecation = this.deprecations.get(chatSettings.model)
    if (!deprecation) {
      return { isDeprecated: false }
    }

    const shutdownDate = new Date(deprecation.shutdownDate)
    const today = new Date()

    if (today >= shutdownDate) {
      return {
        isDeprecated: true,
        message: `Model ${chatSettings.model} has been deprecated and is no longer available. Please use one of these recommended models: ${deprecation.recommendedReplacements.join(", ")}`
      }
    }

    const daysUntilShutdown = Math.ceil(
      (shutdownDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      isDeprecated: true,
      message: `Model ${chatSettings.model} will be deprecated on ${deprecation.shutdownDate} (${daysUntilShutdown} days from now). Please migrate to one of these recommended models: ${deprecation.recommendedReplacements.join(", ")}`
    }
  }

  public getRecommendedReplacement(model: string): string | undefined {
    const deprecation = this.deprecations.get(model)
    return deprecation?.recommendedReplacements[0]
  }
}
