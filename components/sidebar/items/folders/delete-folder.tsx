import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { ChatbotUIContext } from "@/context/context"
import { deleteFolder } from "@/db/folders"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import { ContentType } from "@/types"
import { IconTrash } from "@tabler/icons-react"
import { FC, useContext, useRef, useState } from "react"
import { toast } from "sonner"

interface DeleteFolderProps {
  folder: Tables<"folders">
  contentType: ContentType
}

export const DeleteFolder: FC<DeleteFolderProps> = ({
  folder,
  contentType
}) => {
  const {
    setChats,
    setFolders,
    setPresets,
    setPrompts,
    setFiles,
    setCollections,
    setAssistants,
    setTools,
    setModels
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [showFolderDialog, setShowFolderDialog] = useState(false)

  const stateUpdateFunctions = {
    chats: setChats,
    presets: setPresets,
    prompts: setPrompts,
    files: setFiles,
    collections: setCollections,
    assistants: setAssistants,
    tools: setTools,
    models: setModels
  }

  const handleDeleteFolderOnly = async () => {
    await deleteFolder(folder.id)

    setFolders(prevState => prevState.filter(c => c.id !== folder.id))

    setShowFolderDialog(false)

    if (contentType === "teams") return
    const setStateFunction =
      stateUpdateFunctions[contentType as keyof typeof stateUpdateFunctions]

    if (!setStateFunction) return

    setStateFunction((prevItems: any) =>
      prevItems.map((item: any) => {
        if (item.folder_id === folder.id) {
          return {
            ...item,
            folder_id: null
          }
        }

        return item
      })
    )
  }

  const handleDeleteFolderAndItems = async () => {
    if (contentType === "teams") return
    const setStateFunction =
      stateUpdateFunctions[contentType as keyof typeof stateUpdateFunctions]

    if (!setStateFunction) return

    const folderContentTables = [
      "chats",
      "prompts",
      "assistants",
      "collections",
      "files",
      "models",
      "tools"
      // Add any other content types (table names) that can legitimately be in folders here
    ] as const // Use 'as const' to create an array of literal types

    // Infer the valid table names type from the array for type safety
    type FolderContentTableName = (typeof folderContentTables)[number]

    // Check if the current contentType variable's value is one of the valid table names
    // This check is important both at runtime and helps TypeScript understand the type
    if (!folderContentTables.includes(contentType as FolderContentTableName)) {
      console.error(
        `Attempted to delete folder content for invalid type: ${contentType}. Must be one of: ${folderContentTables.join(", ")}`
      )
      // Optionally show a toast or handle this error in the UI
      return // Stop the function if the type is invalid
    }

    // Now that we've checked and confirmed it's a valid table name string,
    // we can safely cast the contentType variable to the specific union type
    const validTableName = contentType as FolderContentTableName

    // Proceed with deletion using the validated and casted variable as the table name
    const { error } = await supabase
      .from(validTableName) // <-- Use the variable whose type is now validated
      .delete()
      .eq("folder_id", folder.id)

    if (error) {
      toast.error(error.message)
    }

    setStateFunction((prevItems: any) =>
      prevItems.filter((item: any) => item.folder_id !== folder.id)
    )

    handleDeleteFolderOnly()
  }

  return (
    <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
      <DialogTrigger asChild>
        <IconTrash className="hover:opacity-50" size={18} />
      </DialogTrigger>

      <DialogContent className="min-w-[550px]">
        <DialogHeader>
          <DialogTitle>Delete {folder.name}</DialogTitle>

          <DialogDescription>
            Are you sure you want to delete this folder?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowFolderDialog(false)}>
            Cancel
          </Button>

          <Button
            ref={buttonRef}
            variant="destructive"
            onClick={handleDeleteFolderAndItems}
          >
            Delete Folder & Included Items
          </Button>

          <Button
            ref={buttonRef}
            variant="destructive"
            onClick={handleDeleteFolderOnly}
          >
            Delete Folder Only
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
