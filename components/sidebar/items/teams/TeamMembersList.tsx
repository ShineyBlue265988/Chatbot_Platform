import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"

interface TeamMembersListProps {
  teamName: string
  teamId: string
  currentUserId: string // Pass the logged-in user's id to check for owner/admin
}

const ROLE_OPTIONS = ["owner", "admin", "member"]

const TeamMembersList: React.FC<TeamMembersListProps> = ({
  teamName,
  teamId,
  currentUserId
}) => {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      setError(null)
      // Fetch team members
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select(
          "id, user_id, role, profiles: user_id (display_name, username, image_url)"
        )
        .eq("team_id", teamId)
      if (memberError) setError(memberError.message)
      else setMembers(memberData || [])
      setLoading(false)
    }
    fetchMembers()
  }, [teamId])

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole as "owner" | "admin" | "member" })
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
  const currentUser = members.find(m => m.user_id === currentUserId)
  const isCurrentUserAdmin =
    currentUser &&
    (currentUser.role === "admin" || currentUser.role === "owner")

  if (loading) return <div>Loading team members...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!members.length) return <div>No team members found.</div>

  return (
    <div>
      <h3 className="mb-2 font-bold">{teamName}</h3>
      {/* Invite modal logic can be handled in parent if needed */}
      <ul>
        {/* Active Members */}
        {members.map(member => (
          <li
            key={member.id}
            className="mb-2 flex w-full items-center justify-between gap-3 rounded border p-2"
          >
            {/* Avatar/Icon */}
            <span className="inline-block w-[32px] overflow-hidden rounded-full bg-gray-200">
              {member.profiles?.image_url ? (
                <img
                  src={member.profiles.image_url}
                  alt="avatar"
                  className="size-full object-cover"
                />
              ) : (
                <svg
                  className="size-full text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
                </svg>
              )}
            </span>
            <div className="flex flex-1 flex-col items-center justify-between gap-2">
              <div className="flex w-full items-center justify-between gap-3">
                {/* Name, Role, Status in the same row */}
                <span className="font-semibold">
                  {member.profiles?.display_name || "Unknown"}
                  {member.user_id === currentUserId && " (You)"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="ml-2 rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-xs dark:border-green-600 dark:bg-green-700">
                    Active
                  </span>
                  {/* Delete button */}
                  {isCurrentUserOwner && member.role !== "owner" && (
                    <button
                      className="rounded p-1 hover:bg-red-100 focus:outline-none dark:hover:bg-red-900"
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
                </span>
              </div>
              <div className="flex w-full items-center justify-between gap-3">
                {/* Email/Username below */}
                <div className="text-xs text-gray-500">
                  {member.profiles?.username || "-"}
                </div>
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
                  <span className="ml-2 text-sm font-semibold">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamMembersList
