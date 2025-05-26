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
  const [teamNames, setTeamNames] = useState<{ [teamId: string]: string }>({})
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
    const fetchInvitesAndTeams = async () => {
      if (!email) return
      setLoading(true)
      setError(null)
      try {
        // Fetch invites
        const data = await getPendingInvitesByEmail(email)
        setInvites(data)

        // Fetch team names for all unique team_ids
        const uniqueTeamIds = Array.from(
          new Set(data.map((invite: any) => invite.team_id))
        )
        if (uniqueTeamIds.length > 0) {
          const { data: teams, error: teamError } = await supabase
            .from("team_workspaces")
            .select("team_id, name")
            .in("team_id", uniqueTeamIds)

          if (teamError) {
            setError(teamError.message)
          } else if (teams) {
            console.log("Fetched teams:", teams)
            const names: { [teamId: string]: string } = {}

            teams.forEach((team: any) => {
              names[team.team_id] = team.name
            })
            setTeamNames(names)
          }
        }
      } catch (e: any) {
        setError(e.message || "Failed to fetch invites.")
      } finally {
        setLoading(false)
      }
    }
    fetchInvitesAndTeams()
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
            Invited to team <b>{teamNames[invite.team_id] || invite.team_id}</b>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                className="ml-2 rounded border-2 border-green-200 bg-green-100 p-1 text-xs text-green-700 hover:bg-green-200"
                aria-label="Cancel invite"
                title="Decline invite"
                onClick={() => handleAccept(invite)}
              >
                Accept
              </button>
              <button
                className="ml-2 rounded border-2 border-red-200 bg-red-100 p-1 text-xs text-red-700 hover:bg-red-200"
                aria-label="Cancel invite"
                title="Decline invite"
                onClick={() => handleDecline(invite)}
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamInvitesList
