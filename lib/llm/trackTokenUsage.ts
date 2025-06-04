import { supabase } from "@/lib/supabase/browser-client"

export async function trackTokenUsage({
  userId,
  workspaceId,
  modelName,
  modelProvider,
  usage
}: {
  userId: string
  workspaceId: string
  modelName: string
  modelProvider: string
  usage: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}) {
  const insertData = {
    user_id: userId,
    workspace_id: workspaceId,
    model_name: modelName,
    model_provider: modelProvider,
    input_tokens: usage.input_tokens ?? usage.promptTokens ?? 0,
    output_tokens: usage.output_tokens ?? usage.completionTokens ?? 0,
    total_tokens: usage.total_tokens ?? usage.totalTokens ?? 0,
    created_at: new Date().toISOString().split("T")[0]
    // agent_id: null
  }

  const { error } = await supabase.from("token_usage").upsert(insertData, {
    onConflict:
      "workspace_id,user_id,model_name,model_provider,date(created_at)",
    ignoreDuplicates: false
  })

  if (error) {
    console.error("[trackTokenUsage] Supabase error:", error)
    throw error
  }
}
