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
import { IconLoader2, IconBrain } from "@tabler/icons-react"
import Loading from "../loading"

interface WorkspaceLayoutProps {
  children: ReactNode
}
// Simple workspace loading component
const WorkspaceLoading: React.FC<{ workspaceName?: string }> = ({
  workspaceName
}) => {
  return (
    <div className="white dark:black flex min-h-screen items-center justify-center bg-gradient-to-br">
      <div className="text-center">
        {/* Animated Logo/Icon */}
        <div className="relative mb-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-white shadow-lg dark:bg-gray-800">
            <IconBrain className="size-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="absolute inset-0 mx-auto size-20 animate-ping rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
        </div>

        {/* Loading Text */}
        <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
          {workspaceName
            ? `Loading Workspace: ${workspaceName}`
            : "Loading Workspace"}
        </h2>

        <p className="mx-auto mb-8 max-w-sm text-gray-600 dark:text-gray-400">
          Setting up your AI workspace environment...
        </p>

        {/* Spinner */}
        <div className="flex items-center justify-center space-x-2">
          <IconLoader2 className="size-6 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Please wait
          </span>
        </div>

        {/* Animated Dots */}
        <div className="mt-6 flex justify-center space-x-1">
          <div className="size-2 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400"></div>
          <div
            className="size-2 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="size-2 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  )
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
  const [loadingPhase, setLoadingPhase] = useState<
    "auth" | "workspace" | "data" | "complete"
  >("auth")

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
      if (fetchingRef.current || currentWorkspaceRef.current === workspaceId) {
        return
      }

      fetchingRef.current = true
      currentWorkspaceRef.current = workspaceId

      try {
        setLoadingPhase("workspace")

        // PHASE 1: Critical data first (needed to show the UI)
        const workspace = await getWorkspaceById(workspaceId)
        setSelectedWorkspace(workspace)

        // Set basic chat settings immediately so UI can render
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

        // Show the dashboard immediately with basic workspace loaded
        setLoading(false)
        setLoadingPhase("data")

        // PHASE 2: Load essential data in parallel (but don't block UI)
        const [chats, folders] = await Promise.all([
          getChatsByWorkspaceId(workspaceId),
          getFoldersByWorkspaceId(workspaceId)
        ])

        setChats(chats)
        setFolders(folders)

        // PHASE 3: Load remaining data in background (non-blocking)
        setTimeout(async () => {
          try {
            const [
              assistantData,
              collectionData,
              fileData,
              presetData,
              promptData,
              toolData,
              modelData
            ] = await Promise.all([
              getAssistantWorkspacesByWorkspaceId(workspaceId),
              getCollectionWorkspacesByWorkspaceId(workspaceId),
              getFileWorkspacesByWorkspaceId(workspaceId),
              getPresetWorkspacesByWorkspaceId(workspaceId),
              getPromptWorkspacesByWorkspaceId(workspaceId),
              getToolWorkspacesByWorkspaceId(workspaceId),
              getModelWorkspacesByWorkspaceId(workspaceId)
            ])

            // Set all the remaining data
            setAssistants(assistantData.assistants)
            setCollections(collectionData.collections)
            setFiles(fileData.files)
            setPresets(presetData.presets)
            setPrompts(promptData.prompts)
            setTools(toolData.tools)
            setModels(modelData.models)

            // Handle assistant images in background (lowest priority)
            if (assistantData.assistants.length > 0) {
              setTimeout(async () => {
                const imagePromises = assistantData.assistants.map(
                  async assistant => {
                    try {
                      let url = ""
                      if (assistant.image_path) {
                        url =
                          (await getAssistantImageFromStorage(
                            assistant.image_path
                          )) || ""
                      }

                      if (url) {
                        const response = await fetch(url)
                        const blob = await response.blob()
                        const base64 = await convertBlobToBase64(blob)
                        return {
                          assistantId: assistant.id,
                          path: assistant.image_path,
                          base64,
                          url
                        }
                      } else {
                        return {
                          assistantId: assistant.id,
                          path: assistant.image_path,
                          base64: "",
                          url: ""
                        }
                      }
                    } catch (error) {
                      console.error("Error loading assistant image:", error)
                      return {
                        assistantId: assistant.id,
                        path: assistant.image_path,
                        base64: "",
                        url: ""
                      }
                    }
                  }
                )

                const assistantImages = await Promise.all(imagePromises)
                setAssistantImages(assistantImages)
              }, 100) // Load images after everything else
            }

            setLoadingPhase("complete")
          } catch (error) {
            console.error("Error loading background data:", error)
          }
        }, 50) // Small delay to let UI render first
      } catch (error) {
        console.error("Error fetching workspace data:", error)
        setLoading(false)
      } finally {
        fetchingRef.current = false
      }
    },
    [
      setSelectedWorkspace,
      setChatSettings,
      setChats,
      setFolders,
      setAssistants,
      setCollections,
      setFiles,
      setPresets,
      setPrompts,
      setTools,
      setModels,
      setAssistantImages,
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
    return (
      <WorkspaceLoading
        workspaceName={selectedWorkspace?.name}
        phase={loadingPhase}
      />
    )
  }

  return <Dashboard>{children}</Dashboard>
}
