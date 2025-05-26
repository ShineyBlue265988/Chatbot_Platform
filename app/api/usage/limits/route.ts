// app/api/usage/limits/route.ts
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/browser-client"
import { getServerProfile } from "@/lib/server/server-chat-helpers"

// GET /api/usage/limits
export async function GET(req: NextRequest) {
  try {
    const profile = await getServerProfile()
    const userId = profile.user_id
    console.log("userId==================>", userId)
    // Get the provider from query params if specified
    const { searchParams } = new URL(req.url)
    const provider = searchParams.get("provider")

    let query = supabase.from("usage_limits").select("*")

    if (provider) {
      // If provider specified, get specific provider limit
      query = query.eq("target", provider)
    }

    // Get both global limits and user-specific limits
    query = query.or(`user_id.eq.${userId},user_id.is.null`)

    const { data: limits, error } = await query

    if (error) {
      console.error("[API /usage/limits] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no limits found, return empty array
    if (!limits || limits.length === 0) {
      return NextResponse.json([])
    }

    // For each model, prefer user-specific limits over global limits
    const modelLimits = limits.reduce((acc: any, limit) => {
      const existingLimit = acc[limit.target]
      // Only override if there's no existing limit or if this is a user-specific limit
      if (!existingLimit || limit.user_id) {
        acc[limit.target] = limit
      }
      return acc
    }, {})

    return NextResponse.json(Object.values(modelLimits))
  } catch (error: any) {
    console.error("[API /usage/limits] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/usage/limits
export async function POST(req: NextRequest) {
  try {
    const profile = await getServerProfile()
    const userId = profile.user_id
    const body = await req.json()
    const { type, target, usage_limit } = body

    // Validate required fields
    if (!type || !target || !usage_limit) {
      return NextResponse.json(
        { error: "type, target, and usage_limit are required" },
        { status: 400 }
      )
    }

    // Validate type
    if (!["model", "user", "agent", "provider"].includes(type)) {
      return NextResponse.json(
        { error: "type must be one of: model, user, agent, provider" },
        { status: 400 }
      )
    }
    // Validate provider names if type is 'model'
    if (
      type === "provider" &&
      !["openai", "anthropic", "gemini", "groq", "mistral"].includes(target)
    ) {
      return NextResponse.json(
        {
          error:
            "For provider type, target must be a valid provider: openai, anthropic, gemini, groq, or mistral"
        },
        { status: 400 }
      )
    }
    // Upsert logic
    const { data, error } = await supabase
      .from("usage_limits")
      .upsert([{ type, target, usage_limit, user_id: userId }], {
        onConflict: "type,target" // Changed conflict constraint
      })
      .select("*")

    if (error) throw error
    return NextResponse.json(data[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/usage/limits?id=...
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 })
    }

    const { error } = await supabase.from("usage_limits").delete().eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
