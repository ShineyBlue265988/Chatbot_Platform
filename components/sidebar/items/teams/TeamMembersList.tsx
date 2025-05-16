import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"

interface TeamMembersListProps {
  teamId: string
  currentUserId: string // Pass the logged-in user's id to check for owner/admin
}

const ROLE_OPTIONS = ["owner", "admin", "member"]

const TeamMembersList: React.FC<TeamMembersListProps> = ({
  teamId,
  currentUserId
}) => {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      setError(null)
      // Join with auth.users to get email (if RLS allows)
      const { data, error } = await supabase
        .from("team_members")
        .select("id, user_id, role, profiles: user_id (display_name)")
        .eq("team_id", teamId)

      console.log("data-------------------->", data)
      if (error) setError(error.message)
      else setMembers(data || [])
      setLoading(false)
    }
    fetchMembers()
  }, [teamId])

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole as "admin" | "member" | "viewer" })
      .eq("id", memberId)
    if (error) setError(error.message)
    else
      setMembers(
        members.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    setLoading(false)
  }

  const handleRemove = async (memberId: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)
    if (error) setError(error.message)
    else setMembers(members.filter(m => m.id !== memberId))
    setLoading(false)
  }

  // Find the owner (there should be only one)
  const owner = members.find(m => m.role === "owner")
  const isCurrentUserOwner = owner && owner.user_id === currentUserId

  if (loading) return <div>Loading team members...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!members.length) return <div>No team members found.</div>

  return (
    <div>
      <h3 className="mb-2 font-bold">Team Members</h3>
      <ul>
        {members.map(member => (
          <li key={member.id} className="mb-2 flex items-center">
            <span className="mr-2">
              {member.profiles?.display_name}
              {member.user_id === currentUserId && " (You)"}
            </span>
            <span className="mx-2">| Role: </span>
            {isCurrentUserOwner && member.role !== "owner" ? (
              <select
                value={member.role}
                onChange={e => handleRoleChange(member.id, e.target.value)}
                className="rounded border px-1 py-0.5 dark:bg-black dark:text-white"
                disabled={loading}
              >
                {ROLE_OPTIONS.filter(role => role !== "owner").map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold">{member.role}</span>
            )}
            {isCurrentUserOwner && member.role !== "owner" && (
              <button
                className="ml-4 rounded p-1 hover:bg-red-100 focus:outline-none dark:hover:bg-red-900"
                onClick={() => handleRemove(member.id)}
                disabled={loading}
                aria-label="Remove member"
                title="Remove member"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-5 text-red-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamMembersList
