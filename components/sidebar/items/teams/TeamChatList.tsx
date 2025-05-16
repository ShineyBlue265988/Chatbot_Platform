import React, { useEffect, useState } from "react"
import { getTeamChats, getChatMessages } from "@/db/team-chats" // see above
// You may need to create this file and export the functions above
import { supabase } from "@/lib/supabase/browser-client"

const TeamChatList = ({ teamId }: { teamId: string }) => {
  console.log("pandaid=============>", teamId)
  const [chats, setChats] = useState<any[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingChats, setLoadingChats] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teamId) return
    setLoadingChats(true)
    getTeamChats(teamId)
      .then(setChats)
      .catch(e => setError(e.message))
      .finally(() => setLoadingChats(false))

    // --- Real-time subscription for new chats ---
    const chatChannel = supabase
      .channel("chats")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `team_id=eq.${teamId}`
        },
        payload => {
          setChats(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
    }
  }, [teamId])

  useEffect(() => {
    console.log("selectedChatId=============>", selectedChatId)
    if (!selectedChatId) return
    setLoadingMessages(true)
    getChatMessages(selectedChatId)
      .then(setMessages)
      .catch(e => setError(e.message))
      .finally(() => setLoadingMessages(false))

    // --- Real-time subscription for new messages ---
    const messageChannel = supabase
      .channel("messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChatId}`
        },
        payload => {
          console.log("payload.new=============>", payload.new)
          // setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      // supabase.removeChannel(messageChannel)
      messageChannel.unsubscribe()
    }
  }, [selectedChatId])

  return (
    <div>
      <h3 className="mb-2 font-bold">Team Chats</h3>
      {loadingChats && <div>Loading chats...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul>
        {chats.map((chat, index) => (
          <li
            key={index}
            className={`mb-2 cursor-pointer rounded border p-2 ${selectedChatId === chat.id ? "bg-blue-100" : ""}`}
            onClick={() => setSelectedChatId(chat.id)}
          >
            {chat.name}
          </li>
        ))}
      </ul>
      {selectedChatId && (
        <div>
          <h4 className="mt-4 font-semibold">Messages</h4>
          {loadingMessages && <div>Loading messages...</div>}
          <ul>
            {messages.map((msg, index) => (
              <li key={index} className="mb-1">
                <span className="font-bold">{msg.role}:</span> {msg.content}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default TeamChatList
