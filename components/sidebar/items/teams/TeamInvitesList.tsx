import React, { useEffect, useState } from "react"
import {
  getPendingInvitesByEmail,
  acceptInvite,
  declineInvite
} from "@/db/team-invites"
import { supabase } from "@/lib/supabase/browser-client"

const TeamInvitesList: React.FC = () => {
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      setEmail(user?.email ?? null)
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchInvites = async () => {
      if (!email) return
      setLoading(true)
      setError(null)
      try {
        const data = await getPendingInvitesByEmail(email)
        setInvites(data)
      } catch (e: any) {
        setError(e.message || "Failed to fetch invites.")
      } finally {
        setLoading(false)
      }
    }
    fetchInvites()
  }, [email])

  const handleAccept = async (invite: any) => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      await acceptInvite(invite.id, invite.team_id, userId)
      setInvites(invites.filter(i => i.id !== invite.id))
    } catch (e: any) {
      setError(e.message || "Failed to accept invite.")
    }
    setLoading(false)
  }

  const handleDecline = async (invite: any) => {
    setLoading(true)
    setError(null)
    try {
      await declineInvite(invite.id)
      setInvites(invites.filter(i => i.id !== invite.id))
    } catch (e: any) {
      setError(e.message || "Failed to decline invite.")
    }
    setLoading(false)
  }

  if (loading) return <div>Loading invites...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!invites.length) return <div>No pending invites.</div>

  return (
    <div>
      <h3 className="mb-2 font-bold">Pending Team Invites</h3>
      <ul>
        {invites.map(invite => (
          <li key={invite.id} className="mb-2">
            Invited to team <b>{invite.team_id}</b>
            <button
              className="ml-2 text-green-600"
              onClick={() => handleAccept(invite)}
            >
              Accept
            </button>
            <button
              className="ml-2 text-red-600"
              onClick={() => handleDecline(invite)}
            >
              Decline
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamInvitesList
