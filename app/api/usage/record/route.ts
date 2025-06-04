import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/browser-client"
import { getServerProfile } from "@/lib/server/server-chat-helpers"

// GET endpoint to fetch usage data
export async function GET(req: NextRequest) {
  try {
    const profile = await getServerProfile()
    const userId = profile.id

    // Get the current month's start and end dates
    const now = new Date()
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString()
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).toISOString()

    // Query to get aggregated usage by model
    const { data: usageData, error } = await supabase
      .from("token_usage")
      .select("model_provider, model_name, total_tokens")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth)

    if (error) {
      console.error("[API /usage/record] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aggregate usage by model
    const aggregatedUsage = usageData.reduce((acc: any, curr) => {
      const key = `${curr.model_provider}-${curr.model_name}`
      if (!acc[key]) {
        acc[key] = {
          name: curr.model_name,
          value: 0
        }
      }
      acc[key].value += curr.total_tokens
      return acc
    }, {})

    // Convert to array format expected by the bar chart
    const formattedData = Object.values(aggregatedUsage)

    return NextResponse.json(formattedData)
  } catch (error: any) {
    console.error("[API /usage/record] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Existing POST endpoint
export async function POST(req: NextRequest) {
  console.log("[API /usage/record] POST called")
  const { userId, workspaceId, modelProvider, modelName, usage } =
    await req.json()
  console.log("[API /usage/record] Data received:", {
    userId,
    workspaceId,
    modelProvider,
    modelName,
    usage
  })

  const { error } = await supabase.from("token_usage").insert({
    user_id: userId,
    workspace_id: workspaceId,
    model_provider: modelProvider,
    model_name: modelName,
    input_tokens: usage.input_tokens ?? usage.promptTokens ?? 0,
    output_tokens: usage.output_tokens ?? usage.completionTokens ?? 0,
    total_tokens: usage.total_tokens ?? usage.totalTokens ?? 0
    // agent_id: null
  })

  if (error) {
    console.error("[API /usage/record] Supabase error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log("[API /usage/record] Token usage recorded successfully")
  return NextResponse.json({ success: true })
}
