// lib/llm/usage-limits.ts
import { supabase } from "@/lib/supabase/browser-client"

interface UsageLimit {
  type: "global" | "model" | "user" | "agent"
  target?: string
  limit: number
}

export async function checkUsageLimits({
  workspaceId,
  userId,
  modelName,
  requestedTokens
}: {
  workspaceId: string
  userId: string
  modelName: string
  requestedTokens: number
}): Promise<{ allowed: boolean; reason?: string }> {
  // Fetch all applicable limits
  const { data: limits, error } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("workspace_id", workspaceId)
    .or(`user_id.is.null,user_id.eq.${userId}`)

  if (error) {
    throw new Error(`Failed to check usage limits: ${error.message}`)
  }

  // Get current usage for various scopes
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: currentUsage } = await supabase
    .from("token_usage")
    .select("total_tokens")
    .eq("workspace_id", workspaceId)
    .gte("created_at", startOfMonth.toISOString())

  const totalUsage =
    currentUsage?.reduce((sum, record) => sum + record.total_tokens, 0) || 0

  // Check against each limit
  for (const limit of limits) {
    const currentTotal = totalUsage + requestedTokens

    if (currentTotal > limit.limit) {
      return {
        allowed: false,
        reason: `${limit.type} limit of ${limit.limit} tokens would be exceeded`
      }
    }
  }

  return { allowed: true }
}
