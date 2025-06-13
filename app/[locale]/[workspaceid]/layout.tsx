"use client"

import { ChatbotUIContext } from "@/context/context"
import { getWorkspacesByUserId } from "@/db/workspaces"
import { supabase } from "@/lib/supabase/browser-client"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useCallback } from "react"

export default function WorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { workspaceid: string }
}) {
  const {
    setChatMessages,
    setSelectedChat,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay,
    setUserInput,
    setWorkspaces,
    setSelectedWorkspace
  } = useContext(ChatbotUIContext)

  const router = useRouter()
  const workspaceId = params.workspaceid

  // Memoize fetchWorkspaceData function
  const fetchWorkspaceData = useCallback(
    async (workspaceId: string) => {
      try {
        const session = (await supabase.auth.getSession()).data.session
        if (!session) {
          return router.push("/login")
        }

        const workspaces = await getWorkspacesByUserId(session.user.id)
        setWorkspaces(workspaces)

        const currentWorkspace = workspaces.find(w => w.id === workspaceId)
        if (currentWorkspace) {
          setSelectedWorkspace(currentWorkspace)
        } else {
          const homeWorkspace = workspaces.find(w => w.is_home)
          if (homeWorkspace) {
            router.push(`/${homeWorkspace.id}/chat`)
          } else {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Error fetching workspace data:", error)
        router.push("/login")
      }
    },
    [router, setWorkspaces, setSelectedWorkspace]
  )

  // Memoize chat state reset function
  const resetChatState = useCallback(() => {
    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)
    setIsGenerating(false)
    setFirstTokenReceived(false)
    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
  }, [
    setUserInput,
    setChatMessages,
    setSelectedChat,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  ])

  // Initial session check and workspace data fetch
  useEffect(() => {
    const initializeWorkspace = async () => {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) {
        return router.push("/login")
      } else {
        await fetchWorkspaceData(workspaceId)
      }
    }

    initializeWorkspace()
  }, [router, workspaceId, fetchWorkspaceData])

  // Reset chat state when workspace changes
  useEffect(() => {
    const handleWorkspaceChange = async () => {
      await fetchWorkspaceData(workspaceId)
      resetChatState()
    }

    handleWorkspaceChange()
  }, [workspaceId, fetchWorkspaceData, resetChatState])

  return <>{children}</>
}
