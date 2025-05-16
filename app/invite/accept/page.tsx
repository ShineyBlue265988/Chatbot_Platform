"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
// import { getInviteByToken, acceptInviteByToken, declineInviteByToken } from "@/db/team-invites";
// import { useSession } from "@supabase/auth-helpers-react"; // or your auth hook

function AcceptInvitePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  // const session = useSession();

  useEffect(() => {
    if (token) {
      // getInviteByToken(token).then(setInvite).finally(() => setLoading(false));
      setLoading(false) // Remove this line and uncomment above when db functions are available
    }
  }, [token])

  const handleAccept = async () => {
    // await acceptInviteByToken(token, session.user.id);
    router.push("/dashboard") // or wherever
  }

  const handleDecline = async () => {
    // await declineInviteByToken(token);
    router.push("/") // or wherever
  }

  if (loading) return <div>Loading...</div>
  if (!invite) return <div>Invalid or expired invite.</div>

  return (
    <div>
      <h1>You&apos;ve been invited to join a team!</h1>
      <p>Team: {invite?.team_id || "Unknown"}</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDecline}>Decline</button>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInvitePageInner />
    </Suspense>
  )
}
