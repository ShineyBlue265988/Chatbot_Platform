// lib/server/limit-enforcement.ts
import {
  fetchUsageLimits,
  getRelevantLimit,
  isLimitExceeded
} from "@/lib/llm/limits"
import { fetchTokenUsage } from "@/lib/llm/fetchTokenUsage"
import { supabase } from "@/lib/supabase/browser-client"
import { TokenUsageStats } from "@/lib/llm/token-usage"

export async function enforceUsageLimits({
  userId,
  modelName,
  modelProvider,
  agentId
}: {
  userId: string
  modelName: string
  modelProvider: string
  agentId?: string
}) {
  if (!userId) {
    throw new Error("User ID required for limit enforcement.")
  }
  console.log("Enforcing limits for:", {
    userId,
    modelName,
    modelProvider,
    agentId
  })

  // await insertTestLimit(userId);

  // Fetch all limits for this user
  const { data: limits, error: limitsError } = await supabase
    .from("usage_limits")
    .select("*")
    .or(`type.eq.user,type.eq.provider,target.eq.${userId}`) // Add type.eq.provider to get provider limits

  console.log("Fetched limits:", limits)
  console.log("Limits error:", limitsError)

  if (limitsError) throw limitsError

  // Get current month's usage
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: usageData, error: usageError } = await supabase
    .from("token_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("model_provider", modelProvider) // Added to filter by provider
    .gte("created_at", startOfMonth.toISOString())

  if (usageError) throw usageError

  // Calculate usage
  const usage = {
    byModel: {},
    byProvider: {},
    byUser: {},
    byAgent: {}
  }

  for (const record of usageData) {
    const totalTokens = record.total_tokens

    // Update by model
    if (record.model_name) {
      usage.byModel[record.model_name] =
        (usage.byModel[record.model_name] || 0) + totalTokens
      // console.log(`usage.byModel[${record.model_name}]=============>`, usage.byModel[record.model_name])
    }

    // Update by provider
    if (record.model_provider) {
      usage.byProvider[record.model_provider] =
        (usage.byProvider[record.model_provider] || 0) + totalTokens
      // console.log(`usage.byProvider[${record.model_provider}]=============>`, usage.byProvider[record.model_provider])
    }

    // Update by user
    usage.byUser[userId] = (usage.byUser[userId] || 0) + totalTokens
    // console.log(`usage.byUser[${userId}]=============>`, usage.byUser[userId])

    // Update by agent
    if (record.agent_id) {
      usage.byAgent[record.agent_id] =
        (usage.byAgent[record.agent_id] || 0) + totalTokens
      // console.log(`usage.byAgent[${record.agent_id}]=============>`, usage.byAgent[record.agent_id])
    }
  }

  // Check limits including estimated tokens
  for (const limit of limits) {
    let used = 0

    switch (limit.type) {
      case "model":
        if (limit.target === modelName) {
          used = usage.byModel[modelName] || 0
        }
        break
      case "provider":
        if (limit.target === modelProvider) {
          used = usage.byProvider[modelProvider] || 0
        }
        break
      case "user":
        if (limit.target === userId) {
          used = usage.byUser[userId] || 0
        }
        break
      case "agent":
        if (limit.target === agentId) {
          used = usage.byAgent[agentId || ""] || 0
        }
        break
    }
    console.log("used=============>", used)
    console.log("limit.usage_limit=============>", limit.usage_limit)
    console.log("limit.type=============>", limit.type)
    console.log("limit.target=============>", limit.target)

    // Check both current usage and estimated total
    if (used >= limit.usage_limit) {
      throw new Error(
        `You have exceeded your ${limit.type} token limit (${limit.usage_limit}). Please upgrade your plan or wait for reset.`
      )
    }
  }

  // Return current usage stats for reference
  return {
    currentUsage: usage,
    hasAvailableTokens: true
  }
}
