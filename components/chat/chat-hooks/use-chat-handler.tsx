import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { updateChat } from "@/db/chats"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { deleteMessagesIncludingAndAfter } from "@/db/messages"
import { buildFinalMessages } from "@/lib/build-prompt"
import { Tables } from "@/supabase/types"
import { ChatMessage, ChatPayload, LLMID, ModelProvider } from "@/types"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useRef } from "react"
import { LLM_LIST } from "../../../lib/models/llm/llm-list"
import {
  createTempMessages,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  handleRetrieval,
  processResponse,
  validateChatSettings
} from "../chat-helpers"

export const useChatHandler = () => {
  const router = useRouter()

  const {
    userInput,
    chatFiles,
    setUserInput,
    setNewMessageImages,
    profile,
    setIsGenerating,
    setChatMessages,
    setFirstTokenReceived,
    selectedChat,
    selectedWorkspace,
    setSelectedChat,
    setChats,
    setSelectedTools,
    availableLocalModels,
    availableOpenRouterModels,
    abortController,
    setAbortController,
    chatSettings,
    newMessageImages,
    selectedAssistant,
    chatMessages,
    chatImages,
    setChatImages,
    setChatFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    newMessageFiles,
    chatFileItems,
    setChatFileItems,
    setToolInUse,
    useRetrieval,
    sourceCount,
    setIsPromptPickerOpen,
    setIsFilePickerOpen,
    selectedTools,
    selectedPreset,
    setChatSettings,
    models,
    isPromptPickerOpen,
    isFilePickerOpen,
    isToolPickerOpen
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus()
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

  const handleNewChat = async () => {
    if (!selectedWorkspace) return

    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)
    setChatFileItems([])

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
    setIsPromptPickerOpen(false)
    setIsFilePickerOpen(false)

    setSelectedTools([])
    setToolInUse("none")

    if (selectedAssistant) {
      setChatSettings({
        model: selectedAssistant.model as LLMID,
        prompt: selectedAssistant.prompt,
        temperature: selectedAssistant.temperature,
        contextLength: selectedAssistant.context_length,
        includeProfileContext: selectedAssistant.include_profile_context,
        includeWorkspaceInstructions:
          selectedAssistant.include_workspace_instructions,
        embeddingsProvider: selectedAssistant.embeddings_provider as
          | "openai"
          | "local"
      })

      let allFiles = []

      const assistantFiles = (
        await getAssistantFilesByAssistantId(selectedAssistant.id)
      ).files
      allFiles = [...assistantFiles]
      const assistantCollections = (
        await getAssistantCollectionsByAssistantId(selectedAssistant.id)
      ).collections
      for (const collection of assistantCollections) {
        const collectionFiles = (
          await getCollectionFilesByCollectionId(collection.id)
        ).files
        allFiles = [...allFiles, ...collectionFiles]
      }
      const assistantTools = (
        await getAssistantToolsByAssistantId(selectedAssistant.id)
      ).tools

      setSelectedTools(assistantTools)
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )

      if (allFiles.length > 0) setShowFilesDisplay(true)
    } else if (selectedPreset) {
      setChatSettings({
        model: selectedPreset.model as LLMID,
        prompt: selectedPreset.prompt,
        temperature: selectedPreset.temperature,
        contextLength: selectedPreset.context_length,
        includeProfileContext: selectedPreset.include_profile_context,
        includeWorkspaceInstructions:
          selectedPreset.include_workspace_instructions,
        embeddingsProvider: selectedPreset.embeddings_provider as
          | "openai"
          | "local"
      })
    } else if (selectedWorkspace) {
      // setChatSettings({
      //   model: (selectedWorkspace.default_model ||
      //     "gpt-4-1106-preview") as LLMID,
      //   prompt:
      //     selectedWorkspace.default_prompt ||
      //     "You are a friendly, helpful AI assistant.",
      //   temperature: selectedWorkspace.default_temperature || 0.5,
      //   contextLength: selectedWorkspace.default_context_length || 4096,
      //   includeProfileContext:
      //     selectedWorkspace.include_profile_context || true,
      //   includeWorkspaceInstructions:
      //     selectedWorkspace.include_workspace_instructions || true,
      //   embeddingsProvider:
      //     (selectedWorkspace.embeddings_provider as "openai" | "local") ||
      //     "openai"
      // })
    }

    return router.push(`/${selectedWorkspace.id}/chat`)
  }

  const handleFocusChatInput = () => {
    chatInputRef.current?.focus()
  }

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    const startingInput = messageContent

    try {
      setUserInput("")
      setIsGenerating(true)

      // Validate chat settings
      if (!validateChatSettings(chatSettings)) {
        setIsGenerating(false)
        return
      }

      // Create new chat if needed
      if (!selectedChat) {
        const newChat = await handleCreateChat(
          chatSettings,
          messageContent,
          selectedWorkspace,
          selectedAssistant,
          selectedTools,
          chatFiles,
          setSelectedChat,
          setChats,
          setChatMessages
        )

        if (!newChat) return
      }

      // Create message
      const message = await handleCreateMessages(
        messageContent,
        chatSettings,
        selectedChat,
        selectedAssistant,
        setChatMessages,
        chatMessages,
        isRegeneration,
        newMessageImages,
        chatImages,
        setChatImages,
        newMessageFiles,
        chatFileItems,
        setChatFileItems,
        setShowFilesDisplay,
        setNewMessageFiles,
        setNewMessageImages
      )

      if (!message) return

      // Create temp messages
      const tempUserMessage: ChatMessage = {
        message: {
          chat_id: selectedChat?.id || "",
          content: messageContent,
          created_at: new Date().toISOString(),
          id: Math.random().toString(),
          image_paths: [],
          model: chatSettings.model,
          role: "user",
          sequence_number: chatMessages.length,
          updated_at: new Date().toISOString(),
          user_id: ""
        },
        fileItems: []
      }

      const tempAssistantMessage: ChatMessage = {
        message: {
          chat_id: selectedChat?.id || "",
          content: "",
          created_at: new Date().toISOString(),
          id: Math.random().toString(),
          image_paths: [],
          model: chatSettings.model,
          role: "assistant",
          sequence_number: chatMessages.length + 1,
          updated_at: new Date().toISOString(),
          user_id: ""
        },
        fileItems: []
      }

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      await createTempMessages(
        tempUserMessage,
        tempAssistantMessage,
        chatMessages,
        setChatMessages
      )

      // Build final messages
      const finalMessages = await buildFinalMessages(
        chatMessages,
        chatSettings,
        selectedAssistant,
        profile,
        selectedWorkspace,
        newMessageImages,
        chatImages,
        newMessageFiles,
        chatFileItems
      )

      // Handle retrieval
      if (useRetrieval) {
        await handleRetrieval(
          finalMessages,
          chatSettings,
          selectedAssistant,
          newAbortController,
          sourceCount,
          setToolInUse,
          setFirstTokenReceived,
          setChatMessages,
          setIsGenerating
        )
      }

      // Handle chat
      if (chatSettings.model === "ollama") {
        await handleLocalChat(
          finalMessages,
          chatSettings,
          selectedAssistant,
          newAbortController,
          setFirstTokenReceived,
          setChatMessages,
          setIsGenerating
        )
      } else {
        await handleHostedChat(
          finalMessages,
          chatSettings,
          selectedAssistant,
          newAbortController,
          setFirstTokenReceived,
          setChatMessages,
          setIsGenerating
        )
      }
    } catch (error) {
      console.error(error)
      setIsGenerating(false)
    }
  }

  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number
  ) => {
    if (!selectedChat) return

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )

    const filteredMessages = chatMessages.filter(
      chatMessage => chatMessage.message.sequence_number < sequenceNumber
    )

    setChatMessages(filteredMessages)

    handleSendMessage(editedContent, filteredMessages, false)
  }

  return {
    chatInputRef,
    prompt,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendEdit
  }
}
