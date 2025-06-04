import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"

interface TeamMembersListProps {
  teamName: string
  teamId: string
  currentUserId: string
}

const ROLE_OPTIONS = ["Owner", "Admin", "Member", "Viewer"]

const TeamMembersList: React.FC<TeamMembersListProps> = ({
  teamName,
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

      try {
        console.log("Fetching members for team:", teamId)

        // Get team members
        const { data: memberData, error: memberError } = await supabase
          .from("team_members")
          .select("id, user_id, role")
          .eq("team_id", teamId)

        if (memberError) {
          console.error("Member fetch error:", memberError)
          throw memberError
        }

        console.log("Team members data:", memberData)

        if (memberData && memberData.length > 0) {
          // Get user IDs
          const userIds = memberData.map(member => member.user_id)
          console.log("User IDs to fetch profiles for:", userIds)

          // Get profiles for those users
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("user_id, display_name, username, image_url")
            .in("user_id", userIds)

          if (profileError) {
            console.error("Profile fetch error:", profileError)
            throw profileError
          }

          console.log("Profile data:", profileData)

          // Combine the data
          const membersWithProfiles = memberData.map(member => ({
            ...member,
            profile:
              profileData?.find(
                profile => profile.user_id === member.user_id
              ) || null
          }))

          console.log("Combined members with profiles:", membersWithProfiles)
          setMembers(membersWithProfiles)
        } else {
          console.log("No members found for team")
          setMembers([])
        }
      } catch (error: any) {
        console.error("Fetch members error:", error)
        setError(error.message || "Failed to fetch team members")
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchMembers()
    }
  }, [teamId])

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: newRole as "Owner" | "Admin" | "Member" | "Viewer" })
        .eq("id", memberId)

      if (error) {
        throw error
      }

      // Update local state
      setMembers(prevMembers =>
        prevMembers.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch (error: any) {
      console.error("Role change error:", error)
      setError(error.message || "Failed to update role")
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (
      !confirm("Are you sure you want to remove this member from the team?")
    ) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId)

      if (error) {
        throw error
      }

      // Update local state
      setMembers(prevMembers => prevMembers.filter(m => m.id !== memberId))
    } catch (error: any) {
      console.error("Remove member error:", error)
      setError(error.message || "Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  // Find the owner and determine permissions
  const owner = members.find(m => m.role === "Owner")
  const isCurrentUserOwner = owner && owner.user_id === currentUserId
  const currentUser = members.find(m => m.user_id === currentUserId)
  const isCurrentUserAdmin =
    currentUser &&
    (currentUser.role === "Admin" || currentUser.role === "Owner")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading team members...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-center">
          <svg
            className="mr-2 size-5 text-red-600 dark:text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      </div>
    )
  }

  if (!members.length) {
    return (
      <div className="py-8 text-center">
        <svg
          className="mx-auto mb-4 size-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">
          No team members found.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {teamName} Members ({members.length})
      </h3>

      <div className="space-y-3">
        {members.map(member => (
          <div
            key={member.id}
            // Main container: Still flex-col
            className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Container for Avatar and Info Block */}
            {/* Use flex-row here to place avatar next to the info column */}
            <div className="flex items-start gap-3">
              {/* Avatar - still flex-shrink-0 */}
              <div className="size-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                {member.profile?.image_url ? (
                  <img
                    src={member.profile.image_url}
                    alt="avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <svg
                      className="size-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info Block: Name Row and Username/Role/Button Row */}
              {/* This is the nested flex-col */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Row 1: Display Name, You, Active */}
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate font-medium text-gray-900 dark:text-white">
                    {member.profile?.display_name ||
                      member.profile?.username ||
                      "Unknown User"}
                  </h4>
                  {member.user_id === currentUserId && (
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      You
                    </span>
                  )}
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                  {/* Remove Button (Aligned to the right) */}
                  {/* Use ml-auto or flex-shrink-0 and position the button */}
                  {isCurrentUserOwner &&
                    member.role !== "Owner" &&
                    member.user_id !== currentUserId && (
                      // Using ml-auto pushes this element to the right within the flex container
                      <button
                        className="ml-auto rounded-full p-1 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-900"
                        onClick={() => handleRemove(member.id)}
                        disabled={loading}
                        aria-label="Remove member"
                        title="Remove member from team"
                      >
                        <svg
                          className="size-5 text-red-600 dark:text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                </div>

                {/* Row 2: Username, Role, Remove Button */}
                {/* This row needs to align items and potentially push the button to the end */}
                <div className="flex items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {/* Username */}
                  <p className="truncate">
                    {member.profile?.username
                      ? `@${member.profile.username}`
                      : "No username"}
                  </p>

                  {/* Role Selector or Display */}
                  {/* Use flex-1 and min-w-0 on the username/role container if you want the role/button to be pushed far right */}
                  {isCurrentUserOwner &&
                  member.role !== "Owner" &&
                  member.user_id !== currentUserId ? (
                    // Owner can change role - show select
                    <select
                      value={member.role}
                      onChange={e =>
                        handleRoleChange(member.id, e.target.value)
                      }
                      className="rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      disabled={loading}
                    >
                      {ROLE_OPTIONS.filter(role => role !== "Owner").map(
                        role => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    // Other users just see the role display
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.role === "Owner"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : member.role === "Admin"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : member.role === "Member"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" // Added Member specific color
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" // Default for Viewer
                      }`}
                    >
                      {member.role.charAt(0).toUpperCase() +
                        member.role.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* The previous bottom row content is now merged into the info block's second row */}
            {/* The role and remove button are placed within that flex row */}
          </div>
        ))}
      </div>

      {/* ... Team Stats ... */}
      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Total Members: {members.length}</span>
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Owners: {members.filter(m => m.role === "Owner").length}
            </span>
            <span>
              Admins: {members.filter(m => m.role === "Admin").length}
            </span>
            <span>
              Members: {members.filter(m => m.role === "Member").length}
            </span>
            {members.some(m => m.role === "Viewer") && (
              <span>
                Viewers: {members.filter(m => m.role === "Viewer").length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamMembersList
