"use client"

import { Dashboard } from "@/components/ui/dashboard"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantWorkspacesByWorkspaceId } from "@/db/assistants"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getCollectionWorkspacesByWorkspaceId } from "@/db/collections"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getFoldersByWorkspaceId } from "@/db/folders"
import { getModelWorkspacesByWorkspaceId } from "@/db/models"
import { getPresetWorkspacesByWorkspaceId } from "@/db/presets"
import { getPromptWorkspacesByWorkspaceId } from "@/db/prompts"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { getToolWorkspacesByWorkspaceId } from "@/db/tools"
import { getWorkspaceById } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { supabase } from "@/lib/supabase/browser-client"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from "react"
import Loading from "../loading"

interface WorkspaceLayoutProps {
  children: ReactNode
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceid as string

  const {
    setChatSettings,
    setAssistants,
    setAssistantImages,
    setChats,
    setCollections,
    setFolders,
    setFiles,
    setPresets,
    setPrompts,
    setTools,
    setModels,
    selectedWorkspace,
    setSelectedWorkspace,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)

  const [loading, setLoading] = useState(true)

  // Refs to prevent duplicate calls
  const fetchingRef = useRef(false)
  const currentWorkspaceRef = useRef<string | null>(null)
  const sessionCheckedRef = useRef(false)

  const resetChatState = useCallback(() => {
    console.log("🔄 Resetting chat state")
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

  const fetchWorkspaceData = useCallback(
    async (workspaceId: string) => {
      // Prevent duplicate calls for the same workspace
      if (fetchingRef.current || currentWorkspaceRef.current === workspaceId) {
        console.log(
          "🚫 Already fetching workspace data or same workspace, skipping...",
          workspaceId
        )
        return
      }

      fetchingRef.current = true
      currentWorkspaceRef.current = workspaceId
      setLoading(true)

      console.log("🏢 Starting fetchWorkspaceData for:", workspaceId)

      try {
        // Fetch workspace data
        const workspace = await getWorkspaceById(workspaceId)
        setSelectedWorkspace(workspace)

        // Fetch all workspace-related data in parallel
        const [
          assistantData,
          chats,
          collectionData,
          folders,
          fileData,
          presetData,
          promptData,
          toolData,
          modelData
        ] = await Promise.all([
          getAssistantWorkspacesByWorkspaceId(workspaceId),
          getChatsByWorkspaceId(workspaceId),
          getCollectionWorkspacesByWorkspaceId(workspaceId),
          getFoldersByWorkspaceId(workspaceId),
          getFileWorkspacesByWorkspaceId(workspaceId),
          getPresetWorkspacesByWorkspaceId(workspaceId),
          getPromptWorkspacesByWorkspaceId(workspaceId),
          getToolWorkspacesByWorkspaceId(workspaceId),
          getModelWorkspacesByWorkspaceId(workspaceId)
        ])

        // Set all the data
        setAssistants(assistantData.assistants)
        setChats(chats)
        setCollections(collectionData.collections)
        setFolders(folders)
        setFiles(fileData.files)
        setPresets(presetData.presets)
        setPrompts(promptData.prompts)
        setTools(toolData.tools)
        setModels(modelData.models)

        // Handle assistant images
        const imagePromises = assistantData.assistants.map(async assistant => {
          let url = ""
          if (assistant.image_path) {
            url =
              (await getAssistantImageFromStorage(assistant.image_path)) || ""
          }

          if (url) {
            try {
              const response = await fetch(url)
              const blob = await response.blob()
              const base64 = await convertBlobToBase64(blob)
              return {
                assistantId: assistant.id,
                path: assistant.image_path,
                base64,
                url
              }
            } catch (error) {
              console.error("Error processing assistant image:", error)
              return {
                assistantId: assistant.id,
                path: assistant.image_path,
                base64: "",
                url: ""
              }
            }
          } else {
            return {
              assistantId: assistant.id,
              path: assistant.image_path,
              base64: "",
              url: ""
            }
          }
        })

        const assistantImages = await Promise.all(imagePromises)
        setAssistantImages(assistantImages)

        // Set chat settings
        setChatSettings({
          model:
            searchParams.get("model") ||
            workspace?.default_model ||
            "gpt-4-1106-preview",
          prompt:
            workspace?.default_prompt ||
            "You are a friendly, helpful AI assistant.",
          temperature: workspace?.default_temperature || 0.5,
          contextLength: workspace?.default_context_length || 4096,
          includeProfileContext: workspace?.include_profile_context || true,
          includeWorkspaceInstructions:
            workspace?.include_workspace_instructions || true,
          embeddingsProvider:
            (workspace?.embeddings_provider as "openai" | "local") || "openai"
        })

        console.log("✅ Workspace data loaded successfully for:", workspaceId)
      } catch (error) {
        console.error("❌ Error fetching workspace data:", error)
        // Optionally redirect to error page or show error message
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    },
    [
      setSelectedWorkspace,
      setAssistants,
      setChats,
      setCollections,
      setFolders,
      setFiles,
      setPresets,
      setPrompts,
      setTools,
      setModels,
      setAssistantImages,
      setChatSettings,
      searchParams
    ]
  )

  const checkSessionAndFetchData = useCallback(
    async (workspaceId: string) => {
      if (
        sessionCheckedRef.current &&
        currentWorkspaceRef.current === workspaceId
      ) {
        console.log("🚫 Session already checked for this workspace")
        return
      }

      console.log("🔐 Checking session for workspace:", workspaceId)

      try {
        const session = (await supabase.auth.getSession()).data.session

        if (!session) {
          console.log("❌ No session found, redirecting to login")
          return router.push("/login")
        }

        sessionCheckedRef.current = true
        await fetchWorkspaceData(workspaceId)
      } catch (error) {
        console.error("❌ Error checking session:", error)
        router.push("/login")
      }
    },
    [fetchWorkspaceData, router]
  )

  // Single useEffect to handle all initialization and workspace changes
  useEffect(() => {
    if (!workspaceId) {
      console.log("❌ No workspaceId provided")
      return
    }

    // If workspace changed, reset everything
    if (currentWorkspaceRef.current !== workspaceId) {
      console.log(
        "🔄 Workspace changed from",
        currentWorkspaceRef.current,
        "to",
        workspaceId
      )

      // Reset refs
      sessionCheckedRef.current = false
      currentWorkspaceRef.current = null

      // Reset chat state
      resetChatState()

      // Check session and fetch new workspace data
      checkSessionAndFetchData(workspaceId)
    }
  }, [workspaceId, checkSessionAndFetchData, resetChatState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up workspace layout")
      fetchingRef.current = false
      currentWorkspaceRef.current = null
      sessionCheckedRef.current = false
    }
  }, [])

  if (loading) {
    return <Loading />
  }

  return <Dashboard>{children}</Dashboard>
}
