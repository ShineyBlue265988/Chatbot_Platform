import { Brand } from "@/components/ui/brand"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: { message?: string; email?: string }
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const session = (await supabase.auth.getSession()).data.session

  // If user is already logged in and verified, redirect to chat
  if (session && session.user.email_confirmed_at) {
    const { data: homeWorkspace } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_home", true)
      .single()

    if (homeWorkspace) {
      return redirect(`/${homeWorkspace.id}/chat`)
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-4 px-8 sm:max-w-md">
      <div className="animate-in text-foreground flex w-full flex-1 flex-col justify-center gap-4 text-center">
        <Brand />

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Check Your Email</h1>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              We&apos;ve sent a verification link to:
            </p>
            {searchParams.email && (
              <p className="font-medium">{searchParams.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Click the link in your email to verify your account and complete
              the sign-up process.
            </p>
            <p className="text-muted-foreground text-sm">
              Don&apos;t see the email? Check your spam folder.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>

          {searchParams?.message && (
            <p className="mt-4 rounded-md border border-blue-200 bg-blue-100 p-4 text-center text-blue-800">
              {searchParams.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
