import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No valid authorization header" },
        { status: 401 }
      )
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "")

    // Verify the token and get user info using admin client
    const {
      data: { user },
      error: userError
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      console.error("Auth error:", userError)
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log("Deleting data for user:", userId)

    // First, ensure home workspace exists before deletion
    const { data: existingHomeWorkspace } = await supabaseAdmin
      .from("workspaces")
      .select("*")
      .eq("user_id", userId)
      .eq("is_home", true)
      .single()

    let homeWorkspaceId = existingHomeWorkspace?.id

    // If no home workspace exists, create one
    if (!existingHomeWorkspace) {
      const { data: newHomeWorkspace, error: createError } = await supabaseAdmin
        .from("workspaces")
        .insert({
          user_id: userId,
          name: "Home",
          description: "",
          instructions: "",
          default_context_length: 4096,
          default_model: "gpt-3.5-turbo",
          default_prompt: "You are a helpful AI assistant.",
          default_temperature: 0.5,
          include_profile_context: true,
          include_workspace_instructions: true,
          embeddings_provider: "openai",
          is_home: true,
          image_path: ""
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating home workspace:", createError)
      } else {
        homeWorkspaceId = newHomeWorkspace?.id
        console.log("Created new home workspace:", homeWorkspaceId)
      }
    }

    // Delete user data in the correct order using admin client
    const deletionSteps = [
      // Step 1: Delete messages first (they reference chats)
      async () => {
        const { error } = await supabaseAdmin
          .from("messages")
          .delete()
          .eq("user_id", userId)
        if (error) console.error("Error deleting messages:", error)
        return { table: "messages", error }
      },

      // Step 2: Delete chat-related data
      async () => {
        const { error } = await supabaseAdmin
          .from("chats")
          .delete()
          .eq("user_id", userId)
        if (error) console.error("Error deleting chats:", error)
        return { table: "chats", error }
      },

      // Step 3: Delete workspace junction tables
      async () => {
        const tables = [
          "tool_workspaces",
          "preset_workspaces",
          "prompt_workspaces",
          "model_workspaces",
          "file_workspaces",
          "collection_workspaces",
          "assistant_workspaces"
        ]

        const results = []
        for (const table of tables) {
          try {
            const { error } = await supabaseAdmin
              .from(table)
              .delete()
              .eq("user_id", userId)
            if (error) console.error(`Error deleting ${table}:`, error)
            results.push({ table, error })
          } catch (err) {
            console.error(`Error deleting ${table}:`, err)
            results.push({ table, error: err })
          }
        }

        return results
      },

      // Step 4: Delete file-related data
      async () => {
        const results = []

        try {
          const { error: fileItemsError } = await supabaseAdmin
            .from("file_items")
            .delete()
            .eq("user_id", userId)
          if (fileItemsError)
            console.error("Error deleting file_items:", fileItemsError)
          results.push({ table: "file_items", error: fileItemsError })
        } catch (err) {
          console.error("Error deleting file_items:", err)
          results.push({ table: "file_items", error: err })
        }

        try {
          const { error: collectionFilesError } = await supabaseAdmin
            .from("collection_files")
            .delete()
            .eq("user_id", userId)
          if (collectionFilesError)
            console.error(
              "Error deleting collection_files:",
              collectionFilesError
            )
          results.push({
            table: "collection_files",
            error: collectionFilesError
          })
        } catch (err) {
          console.error("Error deleting collection_files:", err)
          results.push({ table: "collection_files", error: err })
        }

        return results
      },

      // Step 5: Delete user items
      async () => {
        const tables = [
          "tools",
          "presets",
          "prompts",
          "models",
          "files",
          "collections",
          "assistants",
          "folders"
        ]

        const results = []
        for (const table of tables) {
          try {
            const { error } = await supabaseAdmin
              .from(table)
              .delete()
              .eq("user_id", userId)
            if (error) console.error(`Error deleting ${table}:`, error)
            results.push({ table, error })
          } catch (err) {
            console.error(`Error deleting ${table}:`, err)
            results.push({ table, error: err })
          }
        }

        return results
      },

      // Step 6: Delete non-home workspaces
      async () => {
        const { error } = await supabaseAdmin
          .from("workspaces")
          .delete()
          .eq("user_id", userId)
          .eq("is_home", false)
        if (error) console.error("Error deleting workspaces:", error)
        return { table: "workspaces (non-home)", error }
      }
    ]

    // Execute deletion steps sequentially
    const results = []
    for (const step of deletionSteps) {
      try {
        const result = await step()
        results.push(result)
      } catch (error) {
        console.error("Error in deletion step:", error)
        results.push({ error })
      }
    }

    // Reset the home workspace to default state
    try {
      const { error: homeWorkspaceError } = await supabaseAdmin
        .from("workspaces")
        .update({
          name: "Home",
          description: "",
          instructions: "",
          default_context_length: 4096,
          default_model: "gpt-3.5-turbo",
          default_prompt: "You are a helpful AI assistant.",
          default_temperature: 0.5,
          include_profile_context: true,
          include_workspace_instructions: true,
          embeddings_provider: "openai"
        })
        .eq("user_id", userId)
        .eq("is_home", true)

      if (homeWorkspaceError) {
        console.error("Error resetting home workspace:", homeWorkspaceError)
      }
    } catch (err) {
      console.error("Error resetting home workspace:", err)
    }

    // Reset profile to default state (keep basic info but clear API keys and context)
    try {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          profile_context: "",
          openai_api_key: "",
          openai_organization_id: "",
          anthropic_api_key: "",
          google_gemini_api_key: "",
          mistral_api_key: "",
          groq_api_key: "",
          perplexity_api_key: "",
          azure_openai_api_key: "",
          azure_openai_endpoint: "",
          azure_openai_35_turbo_id: "",
          azure_openai_45_turbo_id: "",
          azure_openai_45_vision_id: "",
          azure_openai_embeddings_id: "",
          openrouter_api_key: "",
          use_azure_openai: false
        })
        .eq("id", userId)

      if (profileError) {
        console.error("Error resetting profile:", profileError)
      }
    } catch (err) {
      console.error("Error resetting profile:", err)
    }

    console.log("Data deletion completed for user:", userId)

    return NextResponse.json({
      message: "All user data deleted successfully",
      userId: userId,
      homeWorkspaceId: homeWorkspaceId,
      deletedTables: results.length
    })
  } catch (error) {
    console.error("Unexpected error deleting user data:", error)
    return NextResponse.json(
      {
        error: "Failed to delete user data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
