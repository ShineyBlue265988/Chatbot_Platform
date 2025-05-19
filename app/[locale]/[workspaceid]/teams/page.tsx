"use client"
import React, { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import TeamMembersList from "@/components/sidebar/items/teams/TeamMembersList"

const TeamsMainBoard = () => {
  const { selectedTeamId, profile } = useContext(ChatbotUIContext)

  if (!profile?.user_id) {
    return (
      <div className="flex h-full items-center justify-center text-xl text-gray-400">
        Please log in to view team members.
      </div>
    )
  }

  if (!selectedTeamId) {
    return (
      <div className="flex h-full items-center justify-center text-xl text-gray-400">
        Select a team from the sidebar to view its members.
      </div>
    )
  }

  return (
    <div className="p-6">
      <TeamMembersList
        teamId={selectedTeamId}
        currentUserId={profile.user_id}
      />
    </div>
  )
}

export default TeamsMainBoard
