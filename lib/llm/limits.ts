// lib/llm/limits.ts
import { supabase } from "@/lib/supabase/browser-client"
import { enforceUsageLimits } from "@/lib/server/limit-enforcement"

interface UsageLimit {
  id: string
  type: "model" | "user" | "agent" | "provider"
  target: string // Required now since we always need to specify what we're limiting
  usage_limit: number
  created_at: string
  updated_at: string | null // Changed from string to string | null
}

interface TokenUsage {
  byModel: Record<string, number>
  byUser: Record<string, number>
  byAgent: Record<string, number>
  byProvider: Record<string, number>
}

export async function fetchUsageLimits(userId: string): Promise<UsageLimit[]> {
  const { data, error } = await supabase
    .from("usage_limits")
    .select("*")
    .or(`type.eq.user,target.eq.${userId}`) // Get user's specific limits and any limits applied to them

  if (error) throw error
  return data.map(limit => ({
    ...limit,
    type: limit.type as "model" | "user" | "agent" | "provider"
  }))
}

export async function checkBeforeGeneration({
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
  try {
    await enforceUsageLimits({
      userId,
      modelName,
      modelProvider,
      agentId
    })
    return { allowed: true }
  } catch (error) {
    return {
      allowed: false,
      reason:
        error instanceof Error ? error.message : "Usage limit would be exceeded"
    }
  }
}

export async function fetchTokenUsage(userId: string): Promise<TokenUsage> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data, error } = await supabase
    .from("token_usage")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString())

  if (error) throw error

  const usage: TokenUsage = {
    byModel: {},
    byUser: {},
    byAgent: {},
    byProvider: {}
  }

  for (const record of data) {
    const totalTokens = record.total_tokens

    // Update by model
    if (record.model_name) {
      usage.byModel[record.model_name] =
        (usage.byModel[record.model_name] || 0) + totalTokens
    }

    // Update by user
    usage.byUser[userId] = (usage.byUser[userId] || 0) + totalTokens

    // Update by agent
    if (record.agent_id) {
      usage.byAgent[record.agent_id] =
        (usage.byAgent[record.agent_id] || 0) + totalTokens
    }
  }

  return usage
}

export function getRelevantLimit(
  limits: UsageLimit[],
  context: {
    userId: string
    modelName: string
    agentId?: string
  }
): UsageLimit | null {
  // Check for specific limits in priority order: agent > model > user
  if (context.agentId) {
    const agentLimit = limits.find(
      limit => limit.type === "agent" && limit.target === context.agentId
    )
    if (agentLimit) return agentLimit
  }

  const modelLimit = limits.find(
    limit => limit.type === "model" && limit.target === context.modelName
  )
  if (modelLimit) return modelLimit

  const userLimit = limits.find(
    limit => limit.type === "user" && limit.target === context.userId
  )
  return userLimit || null
}

export function isLimitExceeded(used: number, limit: number): boolean {
  return used >= limit
}
