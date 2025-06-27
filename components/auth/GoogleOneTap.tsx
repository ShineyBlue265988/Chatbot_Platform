// components/auth/GoogleOneTap.tsx
"use client"

import Script from "next/script"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser-client"
import { CredentialResponse } from "google-one-tap"

const GoogleOneTap = () => {
  const router = useRouter()

  // Generate nonce and its SHA-256 hash
  const generateNonce = async (): Promise<[string, string]> => {
    const nonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    )
    const encoder = new TextEncoder()
    const encodedNonce = encoder.encode(nonce)
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedNonce = hashArray
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
    return [nonce, hashedNonce]
  }

  useEffect(() => {
    let nonce: string

    const initializeGoogleOneTap = async () => {
      const [generatedNonce, hashedNonce] = await generateNonce()
      nonce = generatedNonce

      // Check if already logged in
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push("/")
        return
      }

      // @ts-ignore
      window.google?.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response: CredentialResponse) => {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce
            })
            if (error) throw error
            router.push("/")
          } catch (error) {
            console.error("Google One Tap login error:", error)
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true
      })
      // @ts-ignore
      window.google?.accounts.id.prompt()
    }

    // Wait for the Google script to load
    if (window.google?.accounts?.id) {
      initializeGoogleOneTap()
    } else {
      window.addEventListener("google-loaded", initializeGoogleOneTap)
    }

    return () => {
      window.removeEventListener("google-loaded", initializeGoogleOneTap)
    }
    // eslint-disable-next-line
  }, [])

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          // Dispatch a custom event when Google script is loaded
          window.dispatchEvent(new Event("google-loaded"))
        }}
      />
      <div id="oneTap" className="fixed right-0 top-0 z-[100]" />
    </>
  )
}

export default GoogleOneTap
