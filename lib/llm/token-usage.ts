// lib/db/token-usage.ts
import { supabase } from "@/lib/supabase/browser-client"

export async function saveTokenUsage({
  userId,
  modelName,
  modelProvider,
  inputTokens,
  outputTokens,
  totalTokens
  // workspaceId
}: {
  userId: string
  modelName: string
  modelProvider: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  // workspaceId: string | null
}) {
  const { error } = await supabase.from("token_usage").insert([
    {
      user_id: userId,
      model_name: modelName,
      model_provider: modelProvider,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens
      // agent_id: null,
      // workspace_id: workspaceId
    }
  ])
  if (error) throw error
}

export interface TokenUsageStats {
  totalTokens: number
  byProvider: Record<string, number>
  byDate: Record<string, number>
  recentUsage: {
    date: string
    tokens: number
  }[]
}

export async function fetchTokenUsageStats(
  userId: string
): Promise<TokenUsageStats> {
  // Get current month's date range
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    const { data, error } = await supabase
      .from("token_usage")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString())
    console.log("Fetched token usage data:=======>", data)
    if (error) throw error

    const stats: TokenUsageStats = {
      totalTokens: 0,
      byProvider: {},
      byDate: {},
      recentUsage: []
    }

    // Process the data
    data.forEach(record => {
      const totalTokens = record.total_tokens
      const date = new Date(record.created_at).toISOString().split("T")[0]

      // Update total tokens
      stats.totalTokens += totalTokens

      // Update by model
      if (record.model_provider) {
        stats.byProvider[record.model_provider] =
          (stats.byProvider[record.model_provider] || 0) + totalTokens
      }

      // Update by date
      stats.byDate[date] = (stats.byDate[date] || 0) + totalTokens
    })

    // Create recent usage array (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split("T")[0]
    })

    stats.recentUsage = last7Days
      .map(date => ({
        date,
        tokens: stats.byDate[date] || 0
      }))
      .reverse()

    return stats
  } catch (error) {
    console.error("Error fetching token usage:", error)
    throw error
  }
}
