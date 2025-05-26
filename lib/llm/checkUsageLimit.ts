import { supabase } from "@/lib/supabase/browser-client"
// Set your usage limit here (e.g., 1,000,000 tokens)
const USAGE_LIMIT = 1_000_000

export async function checkUsageLimit(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // Query the token usage table for the sum of total_tokens for this user/workspace
  const { data, error } = await supabase
    .from("token_usage") // Replace with your actual table name
    .select("total_tokens")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)

  if (error) {
    console.error("Error fetching token usage:", error)
    // Fail-safe: allow usage if we can't check (or you can block)
    return false
  }

  // Sum up the total tokens
  const totalTokensUsed =
    data?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0

  return totalTokensUsed >= USAGE_LIMIT
}
