// lib/llm/fetchTokenUsage.ts
import { supabase } from "@/lib/supabase/browser-client"

export async function fetchTokenUsage(workspaceId: string) {
  console.log("[fetchTokenUsage] Called with workspaceId:", workspaceId)
  const { data, error } = await supabase
    .from("token_usage")
    .select("*")
    .eq("workspace_id", workspaceId)

  if (error) {
    console.error("[fetchTokenUsage] Supabase error:", error)
    throw new Error(error.message)
  }

  if (!data) {
    console.warn("[fetchTokenUsage] No data returned from Supabase.")
    return { global: 0, byModel: {}, byUser: {}, byProvider: {}, raw: [] }
  }

  // Aggregate
  const global = data.reduce((sum, row) => sum + row.total_tokens, 0)

  const byModel: Record<string, number> = {}
  const byUser: Record<string, number> = {}
  const byProvider: Record<string, number> = {} // Add this

  data.forEach(row => {
    byModel[row.model_name] = (byModel[row.model_name] || 0) + row.total_tokens
    byUser[row.user_id] = (byUser[row.user_id] || 0) + row.total_tokens
    byProvider[row.provider] =
      (byProvider[row.provider] || 0) + row.total_tokens // Add this
  })

  console.log("[fetchTokenUsage] Aggregated usage:", {
    global,
    byModel,
    byUser,
    byProvider,
    raw: data
  })
  return { global, byModel, byUser, byProvider, raw: data }
}
