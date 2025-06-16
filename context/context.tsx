import { Tables } from "@/supabase/types"
import {
  ChatFile,
  ChatMessage,
  ChatSettings,
  LLM,
  MessageImage,
  WorkspaceImage
} from "@/types"
import { OpenRouterLLM } from "@/types/llms"
import { AssistantImage } from "@/types/images/assistant-image"
import { VALID_ENV_KEYS } from "@/types/valid-keys"
import { Dispatch, SetStateAction, createContext } from "react"
import React, { useState, useEffect } from "react"

interface ChatbotUIContext {
  // PROFILE STORE
  profile: Tables<"profiles"> | null
  setProfile: Dispatch<SetStateAction<Tables<"profiles"> | null>>

  // ITEMS STORE
  assistants: Tables<"assistants">[]
  setAssistants: Dispatch<SetStateAction<Tables<"assistants">[]>>
  collections: Tables<"collections">[]
  setCollections: Dispatch<SetStateAction<Tables<"collections">[]>>
  chats: Tables<"chats">[]
  setChats: Dispatch<SetStateAction<Tables<"chats">[]>>
  files: Tables<"files">[]
  setFiles: Dispatch<SetStateAction<Tables<"files">[]>>
  folders: Tables<"folders">[]
  setFolders: Dispatch<SetStateAction<Tables<"folders">[]>>
  models: Tables<"models">[]
  setModels: Dispatch<SetStateAction<Tables<"models">[]>>
  presets: Tables<"presets">[]
  setPresets: Dispatch<SetStateAction<Tables<"presets">[]>>
  prompts: Tables<"prompts">[]
  setPrompts: Dispatch<SetStateAction<Tables<"prompts">[]>>
  tools: Tables<"tools">[]
  setTools: Dispatch<SetStateAction<Tables<"tools">[]>>
  workspaces: Tables<"workspaces">[]
  setWorkspaces: Dispatch<SetStateAction<Tables<"workspaces">[]>>

  // MODELS STORE
  envKeyMap: Record<string, VALID_ENV_KEYS>
  setEnvKeyMap: Dispatch<SetStateAction<Record<string, VALID_ENV_KEYS>>>
  availableHostedModels: LLM[]
  setAvailableHostedModels: Dispatch<SetStateAction<LLM[]>>
  availableLocalModels: LLM[]
  setAvailableLocalModels: Dispatch<SetStateAction<LLM[]>>
  availableOpenRouterModels: OpenRouterLLM[]
  setAvailableOpenRouterModels: Dispatch<SetStateAction<OpenRouterLLM[]>>

  // WORKSPACE STORE
  selectedWorkspace: Tables<"workspaces"> | null
  setSelectedWorkspace: Dispatch<SetStateAction<Tables<"workspaces"> | null>>
  workspaceImages: WorkspaceImage[]
  setWorkspaceImages: Dispatch<SetStateAction<WorkspaceImage[]>>

  // PRESET STORE
  selectedPreset: Tables<"presets"> | null
  setSelectedPreset: Dispatch<SetStateAction<Tables<"presets"> | null>>

  // ASSISTANT STORE
  selectedAssistant: Tables<"assistants"> | null
  setSelectedAssistant: Dispatch<SetStateAction<Tables<"assistants"> | null>>
  assistantImages: AssistantImage[]
  setAssistantImages: Dispatch<SetStateAction<AssistantImage[]>>
  openaiAssistants: any[]
  setOpenaiAssistants: Dispatch<SetStateAction<any[]>>

  // PASSIVE CHAT STORE
  userInput: string
  setUserInput: Dispatch<SetStateAction<string>>
  chatMessages: ChatMessage[]
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>
  chatSettings: ChatSettings | null
  setChatSettings: Dispatch<SetStateAction<ChatSettings | null>>
  selectedChat: Tables<"chats"> | null
  setSelectedChat: Dispatch<SetStateAction<Tables<"chats"> | null>>
  chatFileItems: Tables<"file_items">[]
  setChatFileItems: Dispatch<SetStateAction<Tables<"file_items">[]>>

  // ACTIVE CHAT STORE
  abortController: AbortController | null
  setAbortController: Dispatch<SetStateAction<AbortController | null>>
  firstTokenReceived: boolean
  setFirstTokenReceived: Dispatch<SetStateAction<boolean>>
  isGenerating: boolean
  setIsGenerating: Dispatch<SetStateAction<boolean>>

  // CHAT INPUT COMMAND STORE
  isPromptPickerOpen: boolean
  setIsPromptPickerOpen: Dispatch<SetStateAction<boolean>>
  slashCommand: string
  setSlashCommand: Dispatch<SetStateAction<string>>
  isFilePickerOpen: boolean
  setIsFilePickerOpen: Dispatch<SetStateAction<boolean>>
  hashtagCommand: string
  setHashtagCommand: Dispatch<SetStateAction<string>>
  isToolPickerOpen: boolean
  setIsToolPickerOpen: Dispatch<SetStateAction<boolean>>
  toolCommand: string
  setToolCommand: Dispatch<SetStateAction<string>>
  focusPrompt: boolean
  setFocusPrompt: Dispatch<SetStateAction<boolean>>
  focusFile: boolean
  setFocusFile: Dispatch<SetStateAction<boolean>>
  focusTool: boolean
  setFocusTool: Dispatch<SetStateAction<boolean>>
  focusAssistant: boolean
  setFocusAssistant: Dispatch<SetStateAction<boolean>>
  atCommand: string
  setAtCommand: Dispatch<SetStateAction<string>>
  isAssistantPickerOpen: boolean
  setIsAssistantPickerOpen: Dispatch<SetStateAction<boolean>>

  // ATTACHMENTS STORE
  chatFiles: ChatFile[]
  setChatFiles: Dispatch<SetStateAction<ChatFile[]>>
  chatImages: MessageImage[]
  setChatImages: Dispatch<SetStateAction<MessageImage[]>>
  newMessageFiles: ChatFile[]
  setNewMessageFiles: Dispatch<SetStateAction<ChatFile[]>>
  newMessageImages: MessageImage[]
  setNewMessageImages: Dispatch<SetStateAction<MessageImage[]>>
  showFilesDisplay: boolean
  setShowFilesDisplay: Dispatch<SetStateAction<boolean>>

  // RETRIEVAL STORE
  useRetrieval: boolean
  setUseRetrieval: Dispatch<SetStateAction<boolean>>
  sourceCount: number
  setSourceCount: Dispatch<SetStateAction<number>>

  // TOOL STORE
  selectedTools: Tables<"tools">[]
  setSelectedTools: Dispatch<SetStateAction<Tables<"tools">[]>>
  toolInUse: string
  setToolInUse: Dispatch<SetStateAction<string>>

  // NEW PROPERTY
  activeWorkspaceId: string | null
  setActiveWorkspaceId: Dispatch<SetStateAction<string | null>>

  // NEW PROPERTY
  selectedTeamId: string | null
  setSelectedTeamId: Dispatch<SetStateAction<string | null>>
}

export const ChatbotUIContext = createContext<ChatbotUIContext>({
  // PROFILE STORE
  profile: null,
  setProfile: () => {},

  // ITEMS STORE
  assistants: [],
  setAssistants: () => {},
  collections: [],
  setCollections: () => {},
  chats: [],
  setChats: () => {},
  files: [],
  setFiles: () => {},
  folders: [],
  setFolders: () => {},
  models: [],
  setModels: () => {},
  presets: [],
  setPresets: () => {},
  prompts: [],
  setPrompts: () => {},
  tools: [],
  setTools: () => {},
  workspaces: [],
  setWorkspaces: () => {},

  // MODELS STORE
  envKeyMap: {},
  setEnvKeyMap: () => {},
  availableHostedModels: [],
  setAvailableHostedModels: () => {},
  availableLocalModels: [],
  setAvailableLocalModels: () => {},
  availableOpenRouterModels: [],
  setAvailableOpenRouterModels: () => {},

  // WORKSPACE STORE
  selectedWorkspace: null,
  setSelectedWorkspace: () => {},
  workspaceImages: [],
  setWorkspaceImages: () => {},

  // PRESET STORE
  selectedPreset: null,
  setSelectedPreset: () => {},

  // ASSISTANT STORE
  selectedAssistant: null,
  setSelectedAssistant: () => {},
  assistantImages: [],
  setAssistantImages: () => {},
  openaiAssistants: [],
  setOpenaiAssistants: () => {},

  // PASSIVE CHAT STORE
  userInput: "",
  setUserInput: () => {},
  selectedChat: null,
  setSelectedChat: () => {},
  chatMessages: [],
  setChatMessages: () => {},
  chatSettings: null,
  setChatSettings: () => {},
  chatFileItems: [],
  setChatFileItems: () => {},

  // ACTIVE CHAT STORE
  isGenerating: false,
  setIsGenerating: () => {},
  firstTokenReceived: false,
  setFirstTokenReceived: () => {},
  abortController: null,
  setAbortController: () => {},

  // CHAT INPUT COMMAND STORE
  isPromptPickerOpen: false,
  setIsPromptPickerOpen: () => {},
  slashCommand: "",
  setSlashCommand: () => {},
  isFilePickerOpen: false,
  setIsFilePickerOpen: () => {},
  hashtagCommand: "",
  setHashtagCommand: () => {},
  isToolPickerOpen: false,
  setIsToolPickerOpen: () => {},
  toolCommand: "",
  setToolCommand: () => {},
  focusPrompt: false,
  setFocusPrompt: () => {},
  focusFile: false,
  setFocusFile: () => {},
  focusTool: false,
  setFocusTool: () => {},
  focusAssistant: false,
  setFocusAssistant: () => {},
  atCommand: "",
  setAtCommand: () => {},
  isAssistantPickerOpen: false,
  setIsAssistantPickerOpen: () => {},

  // ATTACHMENTS STORE
  chatFiles: [],
  setChatFiles: () => {},
  chatImages: [],
  setChatImages: () => {},
  newMessageFiles: [],
  setNewMessageFiles: () => {},
  newMessageImages: [],
  setNewMessageImages: () => {},
  showFilesDisplay: false,
  setShowFilesDisplay: () => {},

  // RETRIEVAL STORE
  useRetrieval: false,
  setUseRetrieval: () => {},
  sourceCount: 4,
  setSourceCount: () => {},

  // TOOL STORE
  selectedTools: [],
  setSelectedTools: () => {},
  toolInUse: "none",
  setToolInUse: () => {},

  // NEW PROPERTY
  activeWorkspaceId: null,
  setActiveWorkspaceId: () => {},

  // NEW PROPERTY
  selectedTeamId: null,
  setSelectedTeamId: () => {}
})

export const ChatbotUIProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // PROFILE STORE
  const [profile, setProfile] = useState<ChatbotUIContext["profile"]>(null)
  // ITEMS STORE
  const [assistants, setAssistants] = useState<ChatbotUIContext["assistants"]>(
    []
  )
  const [collections, setCollections] = useState<
    ChatbotUIContext["collections"]
  >([])
  const [chats, setChats] = useState<ChatbotUIContext["chats"]>([])
  const [files, setFiles] = useState<ChatbotUIContext["files"]>([])
  const [folders, setFolders] = useState<ChatbotUIContext["folders"]>([])
  const [models, setModels] = useState<ChatbotUIContext["models"]>([])
  const [presets, setPresets] = useState<ChatbotUIContext["presets"]>([])
  const [prompts, setPrompts] = useState<ChatbotUIContext["prompts"]>([])
  const [tools, setTools] = useState<ChatbotUIContext["tools"]>([])
  const [workspaces, setWorkspaces] = useState<ChatbotUIContext["workspaces"]>(
    []
  )
  // MODELS STORE
  const [envKeyMap, setEnvKeyMap] = useState<ChatbotUIContext["envKeyMap"]>({})
  const [availableHostedModels, setAvailableHostedModels] = useState<
    ChatbotUIContext["availableHostedModels"]
  >([])
  const [availableLocalModels, setAvailableLocalModels] = useState<
    ChatbotUIContext["availableLocalModels"]
  >([])
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<
    ChatbotUIContext["availableOpenRouterModels"]
  >([])
  // WORKSPACE STORE
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<ChatbotUIContext["selectedWorkspace"]>(null)
  useEffect(() => {
    console.log("🏢 Selected workspace changed:", selectedWorkspace?.id)
    console.trace("Workspace change triggered by:")
  }, [selectedWorkspace])
  const [workspaceImages, setWorkspaceImages] = useState<
    ChatbotUIContext["workspaceImages"]
  >([])
  // PRESET STORE
  const [selectedPreset, setSelectedPreset] =
    useState<ChatbotUIContext["selectedPreset"]>(null)
  // ASSISTANT STORE
  const [selectedAssistant, setSelectedAssistant] =
    useState<ChatbotUIContext["selectedAssistant"]>(null)
  const [assistantImages, setAssistantImages] = useState<
    ChatbotUIContext["assistantImages"]
  >([])
  const [openaiAssistants, setOpenaiAssistants] = useState<
    ChatbotUIContext["openaiAssistants"]
  >([])
  // PASSIVE CHAT STORE
  const [userInput, setUserInput] = useState<string>("")
  const [selectedChat, setSelectedChat] =
    useState<ChatbotUIContext["selectedChat"]>(null)
  const [chatMessages, setChatMessages] = useState<
    ChatbotUIContext["chatMessages"]
  >([])
  const [chatSettings, setChatSettings] =
    useState<ChatbotUIContext["chatSettings"]>(null)
  const [chatFileItems, setChatFileItems] = useState<
    ChatbotUIContext["chatFileItems"]
  >([])
  // ACTIVE CHAT STORE
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [firstTokenReceived, setFirstTokenReceived] = useState<boolean>(false)
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)
  // CHAT INPUT COMMAND STORE
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState<boolean>(false)
  const [slashCommand, setSlashCommand] = useState<string>("")
  const [isFilePickerOpen, setIsFilePickerOpen] = useState<boolean>(false)
  const [hashtagCommand, setHashtagCommand] = useState<string>("")
  const [isToolPickerOpen, setIsToolPickerOpen] = useState<boolean>(false)
  const [toolCommand, setToolCommand] = useState<string>("")
  const [focusPrompt, setFocusPrompt] = useState<boolean>(false)
  const [focusFile, setFocusFile] = useState<boolean>(false)
  const [focusTool, setFocusTool] = useState<boolean>(false)
  const [focusAssistant, setFocusAssistant] = useState<boolean>(false)
  const [atCommand, setAtCommand] = useState<string>("")
  const [isAssistantPickerOpen, setIsAssistantPickerOpen] =
    useState<boolean>(false)
  // ATTACHMENTS STORE
  const [chatFiles, setChatFiles] = useState<ChatbotUIContext["chatFiles"]>([])
  const [chatImages, setChatImages] = useState<ChatbotUIContext["chatImages"]>(
    []
  )
  const [newMessageFiles, setNewMessageFiles] = useState<
    ChatbotUIContext["newMessageFiles"]
  >([])
  const [newMessageImages, setNewMessageImages] = useState<
    ChatbotUIContext["newMessageImages"]
  >([])
  const [showFilesDisplay, setShowFilesDisplay] = useState<boolean>(false)
  // RETRIEVAL STORE
  const [useRetrieval, setUseRetrieval] = useState<boolean>(false)
  const [sourceCount, setSourceCount] = useState<number>(4)
  // TOOL STORE
  const [selectedTools, setSelectedTools] = useState<
    ChatbotUIContext["selectedTools"]
  >([])
  const [toolInUse, setToolInUse] = useState<string>("none")
  // NEW PROPERTY
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null
  )
  // NEW PROPERTY
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  return (
    <ChatbotUIContext.Provider
      value={{
        profile,
        setProfile,
        assistants,
        setAssistants,
        collections,
        setCollections,
        chats,
        setChats,
        files,
        setFiles,
        folders,
        setFolders,
        models,
        setModels,
        presets,
        setPresets,
        prompts,
        setPrompts,
        tools,
        setTools,
        workspaces,
        setWorkspaces,
        envKeyMap,
        setEnvKeyMap,
        availableHostedModels,
        setAvailableHostedModels,
        availableLocalModels,
        setAvailableLocalModels,
        availableOpenRouterModels,
        setAvailableOpenRouterModels,
        selectedWorkspace,
        setSelectedWorkspace,
        workspaceImages,
        setWorkspaceImages,
        selectedPreset,
        setSelectedPreset,
        selectedAssistant,
        setSelectedAssistant,
        assistantImages,
        setAssistantImages,
        openaiAssistants,
        setOpenaiAssistants,
        userInput,
        setUserInput,
        selectedChat,
        setSelectedChat,
        chatMessages,
        setChatMessages,
        chatSettings,
        setChatSettings,
        chatFileItems,
        setChatFileItems,
        isGenerating,
        setIsGenerating,
        firstTokenReceived,
        setFirstTokenReceived,
        abortController,
        setAbortController,
        isPromptPickerOpen,
        setIsPromptPickerOpen,
        slashCommand,
        setSlashCommand,
        isFilePickerOpen,
        setIsFilePickerOpen,
        hashtagCommand,
        setHashtagCommand,
        isToolPickerOpen,
        setIsToolPickerOpen,
        toolCommand,
        setToolCommand,
        focusPrompt,
        setFocusPrompt,
        focusFile,
        setFocusFile,
        focusTool,
        setFocusTool,
        focusAssistant,
        setFocusAssistant,
        atCommand,
        setAtCommand,
        isAssistantPickerOpen,
        setIsAssistantPickerOpen,
        chatFiles,
        setChatFiles,
        chatImages,
        setChatImages,
        newMessageFiles,
        setNewMessageFiles,
        newMessageImages,
        setNewMessageImages,
        showFilesDisplay,
        setShowFilesDisplay,
        useRetrieval,
        setUseRetrieval,
        sourceCount,
        setSourceCount,
        selectedTools,
        setSelectedTools,
        toolInUse,
        setToolInUse,
        activeWorkspaceId,
        setActiveWorkspaceId,
        selectedTeamId,
        setSelectedTeamId
      }}
    >
      {children}
    </ChatbotUIContext.Provider>
  )
}
