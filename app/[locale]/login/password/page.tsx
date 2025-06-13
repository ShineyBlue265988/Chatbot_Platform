"use client"

import { ChangePassword } from "@/components/utility/change-password"
import { supabase } from "@/lib/supabase/browser-client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  const checkSession = useCallback(async () => {
    const session = (await supabase.auth.getSession()).data.session

    if (!session) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (loading) {
    return null
  }

  return <ChangePassword />
}
