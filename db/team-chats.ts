import { supabase } from "@/lib/supabase/browser-client"

export const getTeamChats = async (teamId: string) => {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true }) // if you have a created_at column
  if (error) throw new Error(error.message)
  return data
}

export const getChatMessages = async (chatId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("sequence_number", { ascending: true }) // or created_at if you have it
  if (error) throw new Error(error.message)
  return data
}
