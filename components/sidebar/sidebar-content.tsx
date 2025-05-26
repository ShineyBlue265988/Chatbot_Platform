import { Tables } from "@/supabase/types"
import { ContentType, DataListType } from "@/types"
import { FC, useState, useContext, useEffect } from "react"
import { SidebarCreateButtons } from "./sidebar-create-buttons"
import { SidebarDataList } from "./sidebar-data-list"
import { SidebarSearch } from "./sidebar-search"
import { deleteAssistant } from "@/db/assistants"
import { deleteChat } from "@/db/chats"
import { deleteCollection } from "@/db/collections"
import { deleteFile } from "@/db/files"
import { deleteModel } from "@/db/models"
import { deletePreset } from "@/db/presets"
import { deletePrompt } from "@/db/prompts"
import { deleteFileFromStorage } from "@/db/storage/files"
import { deleteTool } from "@/db/tools"
import { deleteFolder } from "@/db/folders"
import { updateAssistant } from "@/db/assistants"
import { updateChat } from "@/db/chats"
import { updateCollection } from "@/db/collections"
import { updateFile } from "@/db/files"
import { updateModel } from "@/db/models"
import { updatePreset } from "@/db/presets"
import { updatePrompt } from "@/db/prompts"
import { updateTool } from "@/db/tools"
import { toast } from "sonner"
import { ChatbotUIContext } from "@/context/context"
import {
  IconBoxMultiple,
  IconCheckbox,
  IconTrash,
  IconArrowsShuffle,
  IconFileDownload,
  IconArchive,
  IconArchiveOff,
  IconFilter,
  IconSortAscending2
} from "@tabler/icons-react"
import { getMessagesByChatId } from "@/db/messages"

interface SidebarContentProps {
  contentType: ContentType
  data: DataListType
  folders: Tables<"folders">[]
}

export const SidebarContent: FC<SidebarContentProps> = ({
  contentType,
  data,
  folders
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filterOption, setFilterOption] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<string | null>(null)
  const [showMoveDropdown, setShowMoveDropdown] = useState(false)
  const [moveTargetFolder, setMoveTargetFolder] = useState<string>("")
  const [moveLoading, setMoveLoading] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // Filter/sort state
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("")
  const [selectedSort, setSelectedSort] = useState<string>("newest")

  // Icon button handlers
  const handleMultiSelectToggle = () => setMultiSelectMode(v => !v)
  const handleFilterClick = () => setFilterDropdownOpen(v => !v)
  const handleSortClick = () => setSortDropdownOpen(v => !v)

  // Types that support folders
  const folderTypes = [
    "chats",
    "presets",
    "prompts",
    "files",
    "collections",
    "assistants",
    "tools",
    "models",
    "roles",
    "users-analytics",
    "usage-limits",
    "teams" // Add this line
  ]

  // Always default to 'All' (no folder filter) on mount or when contentType changes
  useEffect(() => {
    setSelectedFolderFilter("")
  }, [contentType])

  // Filtering and sorting
  let filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  if (!showArchived) {
    filteredData = filteredData.filter((item: any) => !item.archived)
  }
  // Sort all items before folder filter
  if (selectedSort === "name-asc") {
    filteredData = [...filteredData].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  } else if (selectedSort === "name-desc") {
    filteredData = [...filteredData].sort((a, b) =>
      b.name.localeCompare(a.name)
    )
  } else if (selectedSort === "oldest") {
    filteredData = [...filteredData].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  } else if (selectedSort === "newest") {
    filteredData = [...filteredData].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }
  // Folder filter LAST
  if (selectedFolderFilter) {
    filteredData = filteredData.filter(
      (item: any) => item.folder_id === selectedFolderFilter
    )
  }

  const {
    setChats,
    setPresets,
    setPrompts,
    setFiles,
    setCollections,
    setAssistants,
    setTools,
    setModels
  } = useContext(ChatbotUIContext)

  const stateUpdateFunctions = {
    chats: setChats,
    presets: setPresets,
    prompts: setPrompts,
    files: setFiles,
    collections: setCollections,
    assistants: setAssistants,
    tools: setTools,
    models: setModels,
    roles: () => {}, // No-op function
    "users-analytics": () => {}, // No-op function
    "usage-limits": () => {} // No-op function
  }

  // Action button handlers (bulk delete)
  const handleDelete = async () => {
    if (contentType === "teams") return // Prevent handling teams here

    // Handle special content types that don't support deletion
    if (["roles", "users-analytics", "usage-limits"].includes(contentType)) {
      toast.error(`Deleting ${contentType} is not supported`)
      return
    }
    if (!window.confirm("Are you sure you want to delete the selected items?"))
      return
    // Map contentType to delete function
    const deleteFunctions: Record<
      string,
      (id: string, item?: any) => Promise<void>
    > = {
      chats: async id => {
        await deleteChat(id)
      },
      presets: async id => {
        await deletePreset(id)
      },
      prompts: async id => {
        await deletePrompt(id)
      },
      files: async (id, item) => {
        if (item?.file_path) await deleteFileFromStorage(item.file_path)
        await deleteFile(id)
      },
      collections: async id => {
        await deleteCollection(id)
      },
      assistants: async id => {
        await deleteAssistant(id)
      },
      tools: async id => {
        await deleteTool(id)
      },
      models: async id => {
        await deleteModel(id)
      },
      folders: async id => {
        await deleteFolder(id)
      },
      roles: () => {
        throw new Error("Role deletion not implemented")
      },
      "users-analytics": () => {
        throw new Error("Users analytics deletion not implemented")
      },
      "usage-limits": () => {
        throw new Error("Usage limits deletion not implemented")
      }
    }
    const deleteFn = deleteFunctions[contentType]
    if (!deleteFn) return
    // Find the items to delete
    const itemsToDelete = data.filter((item: any) =>
      selectedItems.includes(item.id)
    )
    for (const item of itemsToDelete) {
      await deleteFn(item.id, item)
    }
    setSelectedItems([])
    const setStateFunction =
      (contentType as string) === "teams"
        ? undefined
        : stateUpdateFunctions[contentType as keyof typeof stateUpdateFunctions]
    if (setStateFunction) {
      setStateFunction((prev: any[]) =>
        prev.filter(item => !selectedItems.includes(item.id))
      )
    }
  }

  // Move logic
  const handleMove = () => {
    setShowMoveDropdown(true)
  }

  const handleMoveConfirm = async () => {
    if (!moveTargetFolder) return
    setMoveLoading(true)
    let errorOccurred = false
    // Map contentType to update function
    const updateFunctions: Record<
      string,
      (id: string, update: any) => Promise<any>
    > = {
      chats: updateChat,
      presets: updatePreset,
      prompts: updatePrompt,
      files: updateFile,
      collections: updateCollection,
      assistants: updateAssistant,
      tools: updateTool,
      models: updateModel
    }
    const updateFn = updateFunctions[contentType]
    if (!updateFn) return
    const itemsToMove = data.filter((item: any) =>
      selectedItems.includes(item.id)
    )
    for (const item of itemsToMove) {
      try {
        await updateFn(item.id, { folder_id: moveTargetFolder })
      } catch (err) {
        errorOccurred = true
      }
    }
    setMoveLoading(false)
    setSelectedItems([])
    setShowMoveDropdown(false)
    setMoveTargetFolder("")
    if (errorOccurred) {
      toast.error("Some items could not be moved. Please try again.")
    } else {
      toast.success("Items moved successfully!")
    }
    const setStateFunction =
      contentType === "teams"
        ? undefined
        : stateUpdateFunctions[contentType as keyof typeof stateUpdateFunctions]
    if (setStateFunction) {
      setStateFunction((prev: any[]) =>
        prev.map(item =>
          selectedItems.includes(item.id)
            ? { ...item, folder_id: moveTargetFolder }
            : item
        )
      )
    }
  }

  // Select All logic
  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredData.map((item: any) => item.id))
    }
  }

  // Export logic
  const handleExport = async () => {
    if (selectedItems.length === 0) return

    if (contentType === "chats") {
      // For each selected chat, fetch its messages
      const itemsToExport = await Promise.all(
        filteredData
          .filter((item: any) => selectedItems.includes(item.id))
          .map(async (chat: any) => {
            const messages = await getMessagesByChatId(chat.id)
            return { ...chat, messages }
          })
      )
      const blob = new Blob([JSON.stringify(itemsToExport, null, 2)], {
        type: "application/json"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${contentType}-export-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Exported selected chats with context!")
    } else {
      // Default export for other types
      const itemsToExport = filteredData.filter((item: any) =>
        selectedItems.includes(item.id)
      )
      const blob = new Blob([JSON.stringify(itemsToExport, null, 2)], {
        type: "application/json"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${contentType}-export-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Exported selected items!")
    }
  }

  // Archive logic
  const handleArchive = async () => {
    if (selectedItems.length === 0) return
    setMoveLoading(true)
    let errorOccurred = false
    // Use the same update functions as move
    const updateFunctions: Record<
      string,
      (id: string, update: any) => Promise<any>
    > = {
      chats: updateChat,
      presets: updatePreset,
      prompts: updatePrompt,
      files: updateFile,
      collections: updateCollection,
      assistants: updateAssistant,
      tools: updateTool,
      models: updateModel
    }
    const updateFn = updateFunctions[contentType]
    if (!updateFn) return
    const itemsToArchive = data.filter((item: any) =>
      selectedItems.includes(item.id)
    )
    for (const item of itemsToArchive) {
      try {
        await updateFn(item.id, { archived: true })
      } catch (err) {
        errorOccurred = true
      }
    }
    setMoveLoading(false)
    setSelectedItems([])
    if (errorOccurred) {
      toast.error("Some items could not be archived. Please try again.")
    } else {
      toast.success("Items archived successfully!")
    }
    const setStateFunction =
      contentType === "teams"
        ? undefined
        : stateUpdateFunctions[contentType as keyof typeof stateUpdateFunctions]
    if (setStateFunction) {
      setStateFunction((prev: any[]) =>
        prev.map(item =>
          selectedItems.includes(item.id) ? { ...item, archived: true } : item
        )
      )
    }
  }

  // Unarchive logic
  const handleUnarchive = async () => {
    if (selectedItems.length === 0) return
    setMoveLoading(true)
    let errorOccurred = false
    const updateFunctions: Record<
      string,
      (id: string, update: any) => Promise<any>
    > = {
      chats: updateChat,
      presets: updatePreset,
      prompts: updatePrompt,
      files: updateFile,
      collections: updateCollection,
      assistants: updateAssistant,
      tools: updateTool,
      models: updateModel
    }
    const updateFn = updateFunctions[contentType]
    if (!updateFn) return
    const itemsToUnarchive = data.filter((item: any) =>
      selectedItems.includes(item.id)
    )
    for (const item of itemsToUnarchive) {
      try {
        await updateFn(item.id, { archived: false })
      } catch (err) {
        errorOccurred = true
      }
    }
    setMoveLoading(false)
    setSelectedItems([])
    if (errorOccurred) {
      toast.error("Some items could not be unarchived. Please try again.")
    } else {
      toast.success("Items unarchived successfully!")
    }
    const setStateFunction =
      contentType === "teams"
        ? undefined
        : stateUpdateFunctions[contentType as keyof typeof stateUpdateFunctions]
    if (setStateFunction) {
      setStateFunction((prev: any[]) =>
        prev.map(item =>
          selectedItems.includes(item.id) ? { ...item, archived: false } : item
        )
      )
    }
  }

  return (
    // Subtract 50px for the height of the workspace settings
    <div className="flex max-h-[calc(100%-50px)] grow flex-col">
      {/* Icon row */}
      <div className="mt-2 flex items-center gap-2">
        {/* Search bar */}
        <div>
          <SidebarSearch
            contentType={contentType}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>
        {/* Multi-select icon */}
        <button
          className="rounded p-1 text-gray-800  hover:opacity-50 dark:text-gray-200"
          title="Multi-select"
          onClick={handleMultiSelectToggle}
        >
          {multiSelectMode ? (
            <IconCheckbox size={22} />
          ) : (
            <IconBoxMultiple size={22} />
          )}
        </button>
        {/* Filter icon */}
        <div className="group relative">
          <button
            className="rounded p-1 text-gray-800 hover:opacity-50 dark:text-gray-200"
            title="Filter"
          >
            <IconFilter size={22} />
          </button>
          <div className="bg-background dark:bg-background absolute left-0 z-10 hidden w-48 rounded text-gray-800 shadow group-hover:block dark:text-gray-200">
            <div className="p-2 font-bold">Filter by folder</div>
            <div>
              <button
                className={`block w-full px-2 py-1 text-left hover:opacity-50 ${selectedFolderFilter === "" ? "font-bold" : ""}`}
                onClick={() => {
                  setSelectedFolderFilter("")
                  setFilterDropdownOpen(false)
                }}
              >
                All
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  className={`block w-full px-2 py-1 text-left hover:opacity-50 ${selectedFolderFilter === folder.id ? "font-bold" : ""}`}
                  onClick={() => {
                    setSelectedFolderFilter(folder.id)
                    setFilterDropdownOpen(false)
                  }}
                >
                  {folder.name}
                </button>
              ))}
            </div>
            <div className="my-2 border-t" />
            <div className="p-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={e => setShowArchived(e.target.checked)}
                />
                Show archived
              </label>
            </div>
          </div>
        </div>
        {/* Sort icon */}
        <div className="group relative">
          <button
            className="rounded p-1 text-gray-800  hover:opacity-50 dark:text-gray-200"
            title="Sort"
          >
            <IconSortAscending2 size={22} />
          </button>
          <div className="bg-background dark:bg-background  absolute left-0 z-10 hidden w-40 rounded text-gray-800 shadow group-hover:block dark:text-gray-200">
            <div className="p-2 font-bold">Sort by</div>
            <button
              className={`block w-full px-2 py-1 text-left hover:opacity-50 ${selectedSort === "newest" ? "font-bold" : ""}`}
              onClick={() => {
                setSelectedSort("newest")
                setSortDropdownOpen(false)
              }}
            >
              Newest
            </button>
            <button
              className={`block w-full px-2 py-1 text-left hover:opacity-50 ${selectedSort === "oldest" ? "font-bold" : ""}`}
              onClick={() => {
                setSelectedSort("oldest")
                setSortDropdownOpen(false)
              }}
            >
              Oldest
            </button>
            <button
              className={`block w-full px-2 py-1 text-left hover:opacity-50 ${selectedSort === "name-asc" ? "font-bold" : ""}`}
              onClick={() => {
                setSelectedSort("name-asc")
                setSortDropdownOpen(false)
              }}
            >
              Name (A-Z)
            </button>
            <button
              className={`block w-full px-2 py-1 text-left hover:opacity-50 ${selectedSort === "name-desc" ? "font-bold" : ""}`}
              onClick={() => {
                setSelectedSort("name-desc")
                setSortDropdownOpen(false)
              }}
            >
              Name (Z-A)
            </button>
          </div>
        </div>
      </div>

      {/* Action bar for multi-select mode */}
      {multiSelectMode && (
        <div className="mt-2 flex max-w-full flex-wrap items-center justify-around gap-1  rounded border p-1 shadow">
          {/* Select All / Unselect All */}
          <div className="group relative flex flex-wrap justify-between">
            <button
              className={`rounded p-0.5 text-gray-800  hover:opacity-50 dark:text-gray-200 ${selectedItems.length === filteredData.length && filteredData.length > 0 ? "bg-gray-300 dark:bg-gray-800" : ""}`}
              style={{ width: 32, height: 32, minWidth: 32 }}
              onClick={handleSelectAll}
              title={
                selectedItems.length === filteredData.length &&
                filteredData.length > 0
                  ? "Unselect All"
                  : "Select All"
              }
            >
              <IconBoxMultiple size={18} />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
              {selectedItems.length === filteredData.length &&
              filteredData.length > 0
                ? "Unselect All"
                : "Select All"}
            </span>
          </div>
          {/* Delete */}
          <div className="group relative">
            <button
              className="rounded p-0.5 text-gray-800  hover:opacity-50 dark:text-gray-200"
              style={{ width: 32, height: 32, minWidth: 32 }}
              onClick={handleDelete}
              disabled={selectedItems.length === 0}
              title="Delete"
            >
              <IconTrash size={18} />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
              Delete
            </span>
          </div>
          {/* Move */}
          {folderTypes.includes(contentType) && (
            <div className="group relative">
              <button
                className="rounded p-0.5 text-gray-800  hover:opacity-50 dark:text-gray-200"
                style={{ width: 32, height: 32, minWidth: 32 }}
                onClick={handleMove}
                disabled={selectedItems.length === 0}
                title="Move"
              >
                <IconArrowsShuffle size={18} />
              </button>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                Move
              </span>
            </div>
          )}
          {/* Export */}
          <div className="group relative">
            <button
              className="rounded p-0.5 text-gray-800  hover:opacity-50 dark:text-gray-200"
              style={{ width: 32, height: 32, minWidth: 32 }}
              onClick={() => handleExport()}
              disabled={selectedItems.length === 0}
              title="Export"
            >
              <IconFileDownload size={18} />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
              Export
            </span>
          </div>
          {/* Archive */}
          <div className="group relative">
            <button
              className="rounded p-0.5 text-gray-800  hover:opacity-50 dark:text-gray-200"
              style={{ width: 32, height: 32, minWidth: 32 }}
              onClick={handleArchive}
              disabled={selectedItems.length === 0}
              title="Archive"
            >
              <IconArchive size={18} />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
              Archive
            </span>
          </div>
          {/* Unarchive button: only show if all selected items are archived */}
          {selectedItems.length > 0 &&
            filteredData.filter(
              (item: any) => selectedItems.includes(item.id) && item.archived
            ).length === selectedItems.length && (
              <div className="group relative">
                <button
                  className="rounded p-0.5 text-gray-800  hover:opacity-50 dark:text-gray-200"
                  style={{ width: 32, height: 32, minWidth: 32 }}
                  onClick={handleUnarchive}
                  disabled={selectedItems.length === 0}
                  title="Unarchive"
                >
                  <IconArchiveOff size={18} />
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                  Unarchive
                </span>
              </div>
            )}
        </div>
      )}

      {/* Move dropdown */}
      {showMoveDropdown && (
        <div className="mt-2 flex items-center gap-2">
          <select
            className="rounded border p-1"
            value={moveTargetFolder}
            onChange={e => setMoveTargetFolder(e.target.value)}
            disabled={moveLoading}
          >
            <option value="">Select folder...</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <button
            className="rounded bg-green-600 p-1 text-white hover:bg-green-700"
            onClick={handleMoveConfirm}
            disabled={!moveTargetFolder || moveLoading}
          >
            {moveLoading ? "Moving..." : "Move"}
          </button>
          <button
            className="rounded bg-gray-400 p-1 text-white hover:bg-gray-500"
            onClick={() => {
              setShowMoveDropdown(false)
              setMoveTargetFolder("")
            }}
            disabled={moveLoading}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Create buttons */}
      <div className="mt-2 flex items-center">
        <SidebarCreateButtons
          contentType={contentType}
          hasData={data.length > 0}
        />
      </div>

      {/* Data list */}
      <SidebarDataList
        contentType={contentType}
        data={filteredData as any}
        folders={folders}
        multiSelectMode={multiSelectMode}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        selectedSort={selectedSort}
      />
    </div>
  )
}
