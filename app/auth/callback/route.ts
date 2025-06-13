import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  // Handle auth errors
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?message=${error_description || error}&type=error`
    )
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    try {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Token exchange error:", exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/login?message=Authentication failed. Please try again.&type=error`
        )
      }

      // Check if this is email verification
      if (data.user && data.user.email_confirmed_at) {
        // Email verified successfully

        // Check if user has completed setup
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .single()

        if (!profile || !profile.has_onboarded) {
          // User needs to complete setup
          return NextResponse.redirect(`${requestUrl.origin}/setup`)
        }

        // Check for home workspace
        const { data: homeWorkspace, error: workspaceError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("user_id", data.user.id)
          .eq("is_home", true)
          .single()

        if (!homeWorkspace) {
          // Create home workspace if it doesn't exist
          return NextResponse.redirect(`${requestUrl.origin}/setup`)
        }

        // If next parameter is provided, redirect there
        if (next) {
          return NextResponse.redirect(`${requestUrl.origin}${next}`)
        }

        // Redirect to chat with success message
        return NextResponse.redirect(
          `${requestUrl.origin}/${homeWorkspace.id}/chat?message=Email verified successfully!&type=success`
        )
      }
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?message=Authentication failed. Please try again.&type=error`
      )
    }
  }

  // Default redirect
  if (next) {
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  } else {
    return NextResponse.redirect(`${requestUrl.origin}/login`)
  }
}
