import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { createFolder } from "@/db/folders"
import { ContentType } from "@/types"
import { IconFolderPlus, IconPlus } from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import { Button } from "../ui/button"
import { CreateAssistant } from "./items/assistants/create-assistant"
import { CreateCollection } from "./items/collections/create-collection"
import { CreateFile } from "./items/files/create-file"
import { CreateModel } from "./items/models/create-model"
import { CreatePreset } from "./items/presets/create-preset"
import { CreatePrompt } from "./items/prompts/create-prompt"
import { CreateTool } from "./items/tools/create-tool"
// Import the PermissionGuard component
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import { Permission } from "@/lib/permissions"

interface SidebarCreateButtonsProps {
  contentType: ContentType
  hasData: boolean
}

export const SidebarCreateButtons: FC<SidebarCreateButtonsProps> = ({
  contentType,
  hasData
}) => {
  const { profile, selectedWorkspace, folders, setFolders } =
    useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()

  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false)
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false)
  const [isCreatingTool, setIsCreatingTool] = useState(false)
  const [isCreatingModel, setIsCreatingModel] = useState(false)

  const handleCreateFolder = async () => {
    if (!profile) return
    if (!selectedWorkspace) return

    const createdFolder = await createFolder({
      user_id: profile.user_id,
      workspace_id: selectedWorkspace.id,
      name: "New Folder",
      description: "",
      type: contentType
    })
    setFolders([...folders, createdFolder])
  }

  const getCreateFunction = () => {
    switch (contentType) {
      case "chats":
        return async () => {
          handleNewChat()
        }

      case "presets":
        return async () => {
          setIsCreatingPreset(true)
        }

      case "prompts":
        return async () => {
          setIsCreatingPrompt(true)
        }

      case "files":
        return async () => {
          setIsCreatingFile(true)
        }

      case "collections":
        return async () => {
          setIsCreatingCollection(true)
        }

      case "assistants":
        return async () => {
          setIsCreatingAssistant(true)
        }

      case "tools":
        return async () => {
          setIsCreatingTool(true)
        }

      case "models":
        return async () => {
          setIsCreatingModel(true)
        }

      default:
        return undefined // Handle cases where contentType is not recognized
    }
  }

  // Determine the required permission for creating the main item
  let requiredCreatePermission: Permission = "chats.write" // Add default value
  switch (contentType) {
    case "chats":
      requiredCreatePermission = "chats.write"
      break
    case "presets":
      requiredCreatePermission = "presets.write"
      break
    case "prompts":
      requiredCreatePermission = "prompts.write"
      break
    case "files":
      requiredCreatePermission = "files.write"
      break
    case "collections":
      requiredCreatePermission = "collections.write"
      break
    case "assistants":
      requiredCreatePermission = "assistants.write"
      break
    case "tools":
      requiredCreatePermission = "tools.write"
      break
    case "models":
      requiredCreatePermission = "models.write"
      break
  }

  // You might decide folder creation requires the same write permission as the content type
  // Or a specific 'folder.write' permission. Let's assume the same for simplicity here.
  const requiredFolderPermission = requiredCreatePermission

  return (
    <div className="flex w-full space-x-2">
      {/* Wrap the main Create button with PermissionGuard */}
      <PermissionGuard
        permission={requiredCreatePermission}
        fallback={
          // Optional: Render a disabled button if the user doesn't have permission
          <Button
            className="flex h-[36px] grow"
            disabled
            title={`You do not have permission to create ${contentType}.`}
          >
            <IconPlus className="mr-1" size={20} />
            New{" "}
            {contentType.charAt(0).toUpperCase() +
              contentType.slice(1, contentType.length - 1)}
          </Button>
        }
        // showLoading // Optionally show loading state
      >
        {/* This button will only render if the user has the required permission */}
        <Button className="flex h-[36px] grow" onClick={getCreateFunction()}>
          <IconPlus className="mr-1" size={20} />
          New{" "}
          {contentType.charAt(0).toUpperCase() +
            contentType.slice(1, contentType.length - 1)}
        </Button>
      </PermissionGuard>

      {/* Wrap the Folder button with PermissionGuard */}
      {/* Only attempt to guard if hasData is true, as the folder button is conditional */}
      {hasData && (
        <PermissionGuard
          permission={requiredFolderPermission} // Use the same permission or a different one
          fallback={
            // Optional: Render a disabled folder button
            <Button
              className="size-[36px] p-1"
              disabled
              title={`You do not have permission to create folders for ${contentType}.`}
            >
              <IconFolderPlus size={20} />
            </Button>
          }
          // showLoading // Optionally show loading state
        >
          {/* This button will only render if the user has the required permission */}
          <Button className="size-[36px] p-1" onClick={handleCreateFolder}>
            <IconFolderPlus size={20} />
          </Button>
        </PermissionGuard>
      )}

      {/* ... existing modals ... */}
      {isCreatingPrompt && (
        <CreatePrompt
          isOpen={isCreatingPrompt}
          onOpenChange={setIsCreatingPrompt}
        />
      )}
      {isCreatingPreset && (
        <CreatePreset
          isOpen={isCreatingPreset}
          onOpenChange={setIsCreatingPreset}
        />
      )}
      {isCreatingFile && (
        <CreateFile isOpen={isCreatingFile} onOpenChange={setIsCreatingFile} />
      )}
      {isCreatingCollection && (
        <CreateCollection
          isOpen={isCreatingCollection}
          onOpenChange={setIsCreatingCollection}
        />
      )}
      {isCreatingAssistant && (
        <CreateAssistant
          isOpen={isCreatingAssistant}
          onOpenChange={setIsCreatingAssistant}
        />
      )}
      {isCreatingTool && (
        <CreateTool isOpen={isCreatingTool} onOpenChange={setIsCreatingTool} />
      )}
      {isCreatingModel && (
        <CreateModel
          isOpen={isCreatingModel}
          onOpenChange={setIsCreatingModel}
        />
      )}
    </div>
  )
}
