import { ChatbotUIContext } from "@/context/context"
import { WORKSPACE_INSTRUCTIONS_MAX } from "@/db/limits"

import { supabase } from "@/lib/supabase/browser-client"

import {
  getWorkspaceImageFromStorage,
  uploadWorkspaceImage
} from "@/db/storage/workspace-images"
import { updateWorkspace } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import {
  IconHome,
  IconSettings,
  IconUsers,
  IconLock
} from "@tabler/icons-react"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { ChatSettingsForm } from "../ui/chat-settings-form"
import ImagePicker from "../ui/image-picker"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { LimitDisplay } from "../ui/limit-display"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "../ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { DeleteWorkspace } from "./delete-workspace"

interface WorkspaceSettingsProps {}

export const WorkspaceSettings: FC<WorkspaceSettingsProps> = ({}) => {
  const {
    profile,
    selectedWorkspace,
    setSelectedWorkspace,
    setWorkspaces,
    setChatSettings,
    workspaceImages,
    setWorkspaceImages
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)

  const [name, setName] = useState(selectedWorkspace?.name || "")
  const [imageLink, setImageLink] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [description, setDescription] = useState(
    selectedWorkspace?.description || ""
  )
  const [instructions, setInstructions] = useState(
    selectedWorkspace?.instructions || ""
  )

  // Add team name state
  const [teamName, setTeamName] = useState("")

  // Determine workspace type based on team_id - handle the type properly
  const [isTeamWorkspace, setIsTeamWorkspace] = useState(() => {
    const workspace = selectedWorkspace as any
    return workspace?.team_id !== null && workspace?.team_id !== undefined
  })

  const [defaultChatSettings, setDefaultChatSettings] = useState({
    model: selectedWorkspace?.default_model,
    prompt: selectedWorkspace?.default_prompt,
    temperature: selectedWorkspace?.default_temperature,
    contextLength: selectedWorkspace?.default_context_length,
    includeProfileContext: selectedWorkspace?.include_profile_context,
    includeWorkspaceInstructions:
      selectedWorkspace?.include_workspace_instructions,
    embeddingsProvider: selectedWorkspace?.embeddings_provider
  })

  useEffect(() => {
    const workspaceImage =
      workspaceImages.find(
        image => image.path === selectedWorkspace?.image_path
      )?.base64 || ""

    setImageLink(workspaceImage)
  }, [workspaceImages])

  const handleSave = async () => {
    if (!selectedWorkspace) {
      console.error("❌ No selected workspace")
      toast.error("No workspace selected")
      return
    }

    try {
      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("❌ User not authenticated")
        toast.error("User not authenticated")
        return
      }

      console.log("🔄 Starting workspace update for:", selectedWorkspace.id)
      console.log(
        "🔍 Conversion type:",
        isTeamWorkspace ? "Private → Team" : "Team → Private"
      )

      // Handle image upload if needed
      let imagePath = selectedWorkspace.image_path || ""
      if (selectedImage) {
        console.log("🖼️ Uploading workspace image...")
        try {
          imagePath = await uploadWorkspaceImage(
            selectedWorkspace,
            selectedImage
          )
          const url = (await getWorkspaceImageFromStorage(imagePath)) || ""

          if (url) {
            const response = await fetch(url)
            const blob = await response.blob()
            const base64 = await convertBlobToBase64(blob)

            setWorkspaceImages(prev => [
              ...prev,
              {
                workspaceId: selectedWorkspace.id,
                path: imagePath,
                base64,
                url
              }
            ])
            console.log("✅ Workspace image uploaded successfully")
          }
        } catch (imageError) {
          console.error("⚠️ Image upload failed:", imageError)
          // Continue without failing the entire operation
        }
      }

      // Get current workspace state
      const workspace = selectedWorkspace as any
      const currentTeamId = workspace.team_id

      console.log("🔍 Current workspace state:", {
        id: selectedWorkspace.id,
        name: selectedWorkspace.name,
        currentTeamId,
        isTeamWorkspace,
        userId: user.id
      })

      // Verify workspace exists and get current state
      const { data: existingWorkspace, error: checkError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", selectedWorkspace.id)
        .maybeSingle()

      if (checkError) {
        console.error("❌ Workspace verification failed:", checkError)
        throw new Error(`Failed to verify workspace: ${checkError.message}`)
      }

      if (!existingWorkspace) {
        console.error("❌ Workspace not found")
        throw new Error("Workspace not found. It may have been deleted.")
      }

      console.log("✅ Workspace verified:", {
        id: existingWorkspace.id,
        name: existingWorkspace.name,
        currentTeamId: existingWorkspace.team_id,
        currentUserId: existingWorkspace.user_id
      })

      // Prepare base update data
      let updateData: any = {
        name: name.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        default_model: defaultChatSettings.model,
        default_prompt: defaultChatSettings.prompt,
        default_temperature: defaultChatSettings.temperature,
        default_context_length: defaultChatSettings.contextLength,
        embeddings_provider: defaultChatSettings.embeddingsProvider,
        include_profile_context: defaultChatSettings.includeProfileContext,
        include_workspace_instructions:
          defaultChatSettings.includeWorkspaceInstructions,
        updated_at: new Date().toISOString()
      }

      // Add image path if updated
      if (imagePath && imagePath !== selectedWorkspace.image_path) {
        updateData.image_path = imagePath
      }

      // Handle workspace type conversion
      if (isTeamWorkspace) {
        // ========================================
        // CONVERTING TO TEAM WORKSPACE
        // ========================================
        console.log("🔄 Converting to team workspace...")

        let teamId = currentTeamId

        if (!teamId) {
          // Create new team
          console.log("📝 Creating new team...")
          const finalTeamName =
            teamName.trim() || `${selectedWorkspace.name} Team`

          const { data: newTeam, error: teamError } = await supabase
            .from("teams")
            .insert([
              {
                name: finalTeamName,
                description: `Team workspace for ${selectedWorkspace.name}`,
                creator_id: user.id,
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .single()

          if (teamError) {
            console.error("❌ Failed to create team:", teamError)
            throw new Error(`Failed to create team: ${teamError.message}`)
          }

          teamId = newTeam.id
          console.log("✅ Team created successfully:", {
            id: teamId,
            name: finalTeamName
          })

          // Add user as team owner
          console.log("👤 Adding user as team owner...")
          const { error: memberError } = await supabase
            .from("team_members")
            .insert({
              team_id: teamId,
              user_id: user.id,
              status: "active",
              role: "Owner"
            })

          if (memberError) {
            console.error("❌ Failed to add team member:", memberError)
            // Rollback: delete the created team
            await supabase.from("teams").delete().eq("id", teamId)
            throw new Error(`Failed to add team member: ${memberError.message}`)
          }

          console.log("✅ User added as team owner")
        } else {
          console.log("✅ Using existing team:", teamId)
        }

        // Set team workspace data
        updateData.team_id = teamId
        updateData.user_id = user.id
      } else {
        // ========================================
        // CONVERTING TO PRIVATE WORKSPACE
        // ========================================
        console.log("🔄 Converting to private workspace...")

        if (currentTeamId) {
          console.log("🧹 Cleaning up team associations...")

          // Check if user is team owner before allowing conversion
          console.log("🔍 Checking team ownership...")
          const { data: teamMember, error: memberCheckError } = await supabase
            .from("team_members")
            .select("role")
            .eq("team_id", currentTeamId)
            .eq("user_id", user.id)
            .eq("status", "active")
            .single()

          if (memberCheckError) {
            console.error(
              "❌ Failed to check team membership:",
              memberCheckError
            )
            throw new Error("Failed to verify team membership")
          }

          if (!teamMember || teamMember.role !== "Owner") {
            console.error("❌ User is not team owner")
            throw new Error(
              "Only team owners can convert team workspaces to private workspaces"
            )
          } else if (teamMember.role === "Owner") {
            console.log("✅ User verified as team owner")

            // Remove all team members
            console.log("👥 Removing team members...")
            const { error: removeMemberError } = await supabase
              .from("team_members")
              .delete()
              .eq("team_id", currentTeamId)

            if (removeMemberError) {
              console.error(
                "⚠️ Failed to remove team members:",
                removeMemberError
              )
            } else {
              console.log("✅ Team members removed")
            }

            // Delete team if no other workspaces
          }
        }

        // Set private workspace data
        updateData.user_id = user.id
        updateData.team_id = null
      }

      // ========================================
      // UPDATE WORKSPACE
      // ========================================
      console.log("💾 Updating workspace with data:", {
        ...updateData,
        // Don't log sensitive data, just structure
        hasName: !!updateData.name,
        hasDescription: !!updateData.description,
        hasInstructions: !!updateData.instructions,
        teamId: updateData.team_id,
        userId: updateData.user_id
      })
      // Ensure required fields are present and valid
      if (!updateData.name || updateData.name.trim().length === 0) {
        throw new Error("Workspace name is required")
      }

      if (!updateData.user_id) {
        throw new Error("User ID is required")
      }

      // Ensure team_id is explicitly set to null for private workspaces
      if (!isTeamWorkspace) {
        updateData.team_id = null
      }

      const { data: updatedWorkspace, error: updateError } = await supabase
        .from("workspaces")
        .update(updateData)
        .eq("id", selectedWorkspace.id)
        .select()
        .maybeSingle()

      if (updateError) {
        console.error("❌ Workspace update failed:", updateError)
        throw new Error(`Failed to update workspace: ${updateError.message}`)
      }

      console.log("🗑️ Deleting empty team...")
      const { error: deleteTeamError } = await supabase
        .from("teams")
        .delete()
        .eq("id", currentTeamId)

      if (deleteTeamError) {
        console.error("⚠️ Failed to delete team:", deleteTeamError)
      } else {
        console.log("ℹ️ Team has other workspaces, keeping team")
      }

      if (!updatedWorkspace) {
        console.error("❌ No workspace was updated")

        // Debug: Check current workspace state
        const { data: debugWorkspace } = await supabase
          .from("workspaces")
          .select("id, name, user_id, team_id")
          .eq("id", selectedWorkspace.id)
          .maybeSingle()

        console.log("🔍 Debug - Current workspace state:", debugWorkspace)

        if (!debugWorkspace) {
          throw new Error("Workspace was deleted during the update process")
        }

        throw new Error(
          "Workspace update failed - no rows were affected. Check permissions."
        )
      }

      console.log("✅ Workspace updated successfully:", {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        teamId: updatedWorkspace.team_id,
        userId: updatedWorkspace.user_id
      })

      // ========================================
      // UPDATE LOCAL STATE
      // ========================================
      console.log("🔄 Updating local state...")

      // Update selected workspace
      setSelectedWorkspace(updatedWorkspace)

      // Update workspaces list
      setWorkspaces(workspaces => {
        return workspaces.map(ws => {
          if (ws.id === selectedWorkspace.id) {
            return updatedWorkspace
          }
          return ws
        })
      })

      // Update chat settings if valid
      if (
        defaultChatSettings.model &&
        defaultChatSettings.prompt &&
        typeof defaultChatSettings.temperature === "number" &&
        typeof defaultChatSettings.contextLength === "number" &&
        typeof defaultChatSettings.includeProfileContext === "boolean" &&
        typeof defaultChatSettings.includeWorkspaceInstructions === "boolean" &&
        defaultChatSettings.embeddingsProvider
      ) {
        console.log("⚙️ Updating chat settings...")
        setChatSettings({
          model: defaultChatSettings.model as string,
          prompt: defaultChatSettings.prompt,
          temperature: defaultChatSettings.temperature,
          contextLength: defaultChatSettings.contextLength,
          includeProfileContext: defaultChatSettings.includeProfileContext,
          includeWorkspaceInstructions:
            defaultChatSettings.includeWorkspaceInstructions,
          embeddingsProvider: defaultChatSettings.embeddingsProvider as
            | "openai"
            | "local"
        })
      }

      // Close dialog
      setIsOpen(false)

      // Show success message
      const conversionType = isTeamWorkspace
        ? "team workspace"
        : "private workspace"
      toast.success(`Workspace successfully converted to ${conversionType}!`)
      console.log(`✅ Workspace conversion completed: ${conversionType}`)

      // Refresh page if workspace type changed
      const workspaceTypeChanged = isTeamWorkspace !== !!currentTeamId
      if (workspaceTypeChanged) {
        console.log(
          "🔄 Workspace type changed, refreshing page in 2 seconds..."
        )
        toast.info("Refreshing page to apply changes...")

        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error: any) {
      console.error("❌ Workspace update failed:", error)

      // Show user-friendly error message
      const errorMessage = error.message || "An unexpected error occurred"
      toast.error(`Failed to update workspace: ${errorMessage}`)

      // Log full error for debugging
      console.error("Full error details:", {
        error,
        stack: error.stack,
        selectedWorkspace: selectedWorkspace?.id,
        isTeamWorkspace,
        userId: (await supabase.auth.getUser()).data.user?.id
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      buttonRef.current?.click()
    }
  }

  const handleWorkspaceTypeChange = (isTeam: boolean) => {
    setIsTeamWorkspace(isTeam)
    // Reset team name when switching
    if (!isTeam) {
      setTeamName("")
    }
  }

  if (!selectedWorkspace || !profile) return null

  // Cast workspace for team_id access
  const workspace = selectedWorkspace as any

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <WithTooltip
          display={<div>Workspace Settings</div>}
          trigger={
            <IconSettings
              className="ml-3 cursor-pointer pr-[5px] hover:opacity-50"
              size={32}
              onClick={() => setIsOpen(true)}
            />
          }
        />
      </SheetTrigger>

      <SheetContent
        className="flex flex-col justify-between"
        side="left"
        onKeyDown={handleKeyDown}
      >
        <div className="grow overflow-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Workspace Settings</span>
                {selectedWorkspace?.is_home && <IconHome size={20} />}
                {isTeamWorkspace ? (
                  <IconUsers size={20} />
                ) : (
                  <IconLock size={20} />
                )}
              </div>
            </SheetTitle>

            {selectedWorkspace?.is_home && (
              <div className="text-sm font-light">
                This is your home workspace for personal use.
              </div>
            )}
          </SheetHeader>

          <Tabs defaultValue="main">
            <TabsList className="mt-4 grid w-full grid-cols-2">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="defaults">Defaults</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-4 space-y-4" value="main">
              <>
                <div className="space-y-1">
                  <Label>Workspace Name</Label>

                  <Input
                    placeholder="Name..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                {/* Workspace Type Toggle */}
                {!selectedWorkspace?.is_home && (
                  <div className="space-y-2">
                    <Label>Workspace Type</Label>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant={!isTeamWorkspace ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleWorkspaceTypeChange(false)}
                        className="flex items-center space-x-2"
                      >
                        <IconLock size={16} />
                        <span>Private</span>
                      </Button>

                      <Button
                        variant={isTeamWorkspace ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleWorkspaceTypeChange(true)}
                        className="flex items-center space-x-2"
                      >
                        <IconUsers size={16} />
                        <span>Team</span>
                      </Button>
                    </div>

                    <div className="text-muted-foreground text-xs">
                      {!isTeamWorkspace
                        ? "Only you can access this workspace"
                        : "Team members can access this workspace"}
                      {workspace?.team_id && (
                        <div className="mt-1 font-mono text-xs">
                          Team ID: {workspace.team_id}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Name Input - Only show when converting to team workspace */}
                {isTeamWorkspace && !workspace.team_id && (
                  <div className="space-y-1">
                    <Label>Team Name</Label>
                    <Input
                      placeholder="Enter team name..."
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                    />
                    <div className="text-muted-foreground text-xs">
                      {teamName.trim()
                        ? `Team will be named: "${teamName}"`
                        : `Team will be named: "${selectedWorkspace.name} Team"`}
                    </div>
                  </div>
                )}

                {/* <div className="space-y-1">
                  <Label>Description</Label>

                  <Input
                    placeholder="Description... (optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div> */}

                <div className="space-y-1">
                  <Label>Workspace Image</Label>

                  <ImagePicker
                    src={imageLink}
                    image={selectedImage}
                    onSrcChange={setImageLink}
                    onImageChange={setSelectedImage}
                    width={50}
                    height={50}
                  />
                </div>
              </>

              <div className="space-y-1">
                <Label>
                  How would you like the AI to respond in this workspace?
                </Label>

                <TextareaAutosize
                  placeholder="Instructions... (optional)"
                  value={instructions}
                  onValueChange={setInstructions}
                  minRows={5}
                  maxRows={10}
                  maxLength={1500}
                />

                <LimitDisplay
                  used={instructions.length}
                  limit={WORKSPACE_INSTRUCTIONS_MAX}
                />
              </div>
            </TabsContent>

            <TabsContent className="mt-5" value="defaults">
              <div className="mb-4 text-sm">
                These are the settings your workspace begins with when selected.
              </div>

              <ChatSettingsForm
                chatSettings={defaultChatSettings as any}
                onChangeChatSettings={setDefaultChatSettings}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 flex justify-between">
          <div>
            {!selectedWorkspace.is_home && (
              <DeleteWorkspace
                workspace={selectedWorkspace}
                onDelete={() => setIsOpen(false)}
              />
            )}
          </div>

          <div className="space-x-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>

            <Button ref={buttonRef} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
