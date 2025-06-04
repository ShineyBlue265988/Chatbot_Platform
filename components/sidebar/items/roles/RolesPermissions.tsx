import { useEffect, useState, useContext } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { ChatbotUIContext } from "@/context/context"
import { useUserRoles } from "@/lib/permissions"
import { RoleCard } from "./RoleCard"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  is_system_role: boolean
  created_at: string
  updated_at: string
}

interface Permission {
  id: string
  name: string
  description: string
}

const RolesPermissions = () => {
  const { selectedWorkspace, profile } = useContext(ChatbotUIContext)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isWorkspaceOwner, setIsWorkspaceOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDescription, setNewRoleDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Use the custom hook for user roles
  const {
    userRoles,
    loading: userRolesLoading,
    error: userRolesError
  } = useUserRoles(profile?.user_id || "", selectedWorkspace?.id || "")

  // Check if user is workspace owner
  const checkWorkspaceOwnership = async () => {
    if (!selectedWorkspace?.id || !profile?.user_id) {
      setIsWorkspaceOwner(false)
      return false
    }

    try {
      const { data: workspace, error } = await supabase
        .from("workspaces")
        .select("user_id")
        .eq("id", selectedWorkspace.id)
        .single()

      if (error) {
        console.error("Workspace ownership check error:", error)
        setIsWorkspaceOwner(false)
        return false
      }

      const isOwner = workspace?.user_id === profile.user_id
      setIsWorkspaceOwner(isOwner)
      return isOwner
    } catch (err) {
      console.error("Workspace ownership check failed:", err)
      setIsWorkspaceOwner(false)
      return false
    }
  }

  // Fetch all permissions
  const fetchPermissions = async () => {
    try {
      const { data: permissions, error } = await supabase
        .from("permissions")
        .select("*")
        .order("name")

      if (error) throw error
      setPermissions(permissions as Permission[])
    } catch (err: any) {
      console.error("Error fetching permissions:", err)
      setError(err.message)
    }
  }

  // Fetch all roles (for workspace owners)
  const fetchAllRoles = async () => {
    if (!selectedWorkspace?.id) return

    try {
      const { data: allRoles, error } = await supabase
        .from("roles")
        .select("*")
        .eq("workspace_id", selectedWorkspace.id)
        .order("is_system_role", { ascending: false })
        .order("name")

      if (error) throw error
      setRoles(allRoles as Role[])
    } catch (err: any) {
      console.error("Error fetching roles:", err)
      setError(err.message)
    }
  }

  // Fetch user's specific roles (for non-owners)
  const fetchUserSpecificRoles = async () => {
    if (!selectedWorkspace?.id || !profile?.user_id) return

    try {
      // Get unique role names from userRoles
      const roleNames = [...new Set(userRoles.map(ur => ur.role_name))]

      if (roleNames.length === 0) {
        setRoles([])
        return
      }

      const { data: userRoleDetails, error } = await supabase
        .from("roles")
        .select("*")
        .eq("workspace_id", selectedWorkspace.id)
        .in("name", roleNames)

      if (error) throw error
      setRoles(userRoleDetails as Role[])
    } catch (err: any) {
      console.error("Error fetching user roles:", err)
      setError(err.message)
    }
  }

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedWorkspace?.id || !profile?.user_id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Check workspace ownership
        const isOwner = await checkWorkspaceOwnership()

        // Fetch permissions (needed for both owners and non-owners)
        await fetchPermissions()

        // Fetch roles based on ownership
        if (isOwner) {
          await fetchAllRoles()
        } else {
          // Wait for userRoles to be loaded before fetching role details
          if (!userRolesLoading && userRoles.length > 0) {
            await fetchUserSpecificRoles()
          }
        }
      } catch (err: any) {
        console.error("Error in fetchData:", err)
        setError(err.message || "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWorkspace?.id, profile?.user_id, userRoles, userRolesLoading])

  // Permission toggle handler (only for workspace owners)
  const hasPermission = (role: Role, permissionId: string) =>
    Array.isArray(role.permissions) && role.permissions.includes(permissionId)

  const handlePermissionToggle = async (role: Role, permissionId: string) => {
    if (role.is_system_role) {
      alert("Cannot modify system roles")
      return
    }

    if (!isWorkspaceOwner) {
      alert("Only workspace owners can modify roles")
      return
    }

    setUpdating(`${role.id}-${permissionId}`)

    try {
      let newPermissions: string[]
      if (hasPermission(role, permissionId)) {
        newPermissions = role.permissions.filter(pid => pid !== permissionId)
      } else {
        newPermissions = [...(role.permissions || []), permissionId]
      }

      const { error } = await supabase
        .from("roles")
        .update({ permissions: newPermissions })
        .eq("id", role.id)

      if (error) {
        setError(error.message)
      } else {
        setRoles(prev =>
          prev.map(r =>
            r.id === role.id ? { ...r, permissions: newPermissions } : r
          )
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  // Create new role handler (only for workspace owners)
  const handleCreateRole = async () => {
    if (!selectedWorkspace?.id) {
      setCreateError("No workspace selected")
      return
    }

    if (!isWorkspaceOwner) {
      setCreateError("Only workspace owners can create roles")
      return
    }

    setCreating(true)
    setCreateError(null)

    if (!newRoleName.trim()) {
      setCreateError("Role name is required")
      setCreating(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("roles")
        .insert({
          name: newRoleName,
          description: newRoleDescription,
          permissions: [],
          workspace_id: selectedWorkspace.id,
          is_system_role: false
        })
        .select()
        .single()

      if (error) {
        setCreateError(error.message)
      } else if (data) {
        setRoles(prev => [...prev, data as Role])
        setShowModal(false)
        setNewRoleName("")
        setNewRoleDescription("")
      }
    } catch (err: any) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  // Loading states
  if (loading || userRolesLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading roles and permissions...</span>
      </div>
    )
  }

  // Error states
  if (error || userRolesError) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center">
            <svg
              className="mr-2 size-5 text-red-600 dark:text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 dark:text-red-300">
              {error || userRolesError}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedWorkspace) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          Please select a workspace to view roles and permissions.
        </div>
      </div>
    )
  }

  // Render for non-owners (show only their roles)
  if (!isWorkspaceOwner) {
    return (
      <div className="max-w-6xl p-4">
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            My Roles & Permissions
          </h2>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Role Overview
                </p>
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  You can view your assigned roles and permissions. Only
                  workspace owners can modify roles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {userRoles.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="mx-auto mb-4 size-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No Team Assignments
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You are not assigned to any teams in this workspace.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {userRoles.map((userRole, index) => {
              const role = roles.find(r => r.name === userRole.role_name)
              return (
                <RoleCard
                  key={`${userRole.team_name}-${userRole.role_name}-${index}`}
                  roleName={userRole.role_name}
                  roleDescription={userRole.role_description}
                  teamName={userRole.team_name}
                  permissions={userRole.role_permissions}
                  allPermissions={permissions}
                  isSystemRole={userRole.is_system_role}
                />
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Render for workspace owners (full management interface)
  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Roles & Permissions Management
        </h2>
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Workspace Owner
              </p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                You have full access to manage all roles and permissions in this
                workspace.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Type
              </th>
              {permissions.map(permission => (
                <th
                  key={permission.id}
                  className="p-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                >
                  <div className="origin-center -rotate-45 whitespace-nowrap">
                    {permission.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {roles.map(role => (
              <tr
                key={role.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                    {role.description || "-"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      role.is_system_role
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {role.is_system_role ? "System" : "Custom"}
                  </span>
                </td>
                {permissions.map(permission => {
                  const isChecked = hasPermission(role, permission.id)
                  const isLoading = updating === `${role.id}-${permission.id}`
                  const isDisabled = role.is_system_role || isLoading

                  return (
                    <td key={permission.id} className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() =>
                            handlePermissionToggle(role, permission.id)
                          }
                          className={`size-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500${
                            isDisabled
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer"
                          }`}
                          title={
                            role.is_system_role
                              ? "System roles cannot be modified"
                              : permission.description || permission.name
                          }
                        />
                        {isLoading && (
                          <div className="ml-1 size-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create New Role Button */}
      <div className="mt-6">
        <button
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          onClick={() => setShowModal(true)}
          disabled={creating}
        >
          <svg
            className="mr-2 size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create New Role
        </button>
      </div>

      {/* Create Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowModal(false)
                setNewRoleName("")
                setNewRoleDescription("")
                setCreateError(null)
              }}
            ></div>

            {/* Modal panel */}
            <div className="inline-block overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle dark:bg-gray-800">
              <div>
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg
                    className="size-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Create New Role
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create a custom role with specific permissions for your
                      workspace.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4 sm:mt-6">
                <div>
                  <label
                    htmlFor="role-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Role Name *
                  </label>
                  <input
                    type="text"
                    id="role-name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter role name"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div>
                  <label
                    htmlFor="role-description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Description
                  </label>
                  <textarea
                    id="role-description"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter role description (optional)"
                    value={newRoleDescription}
                    onChange={e => setNewRoleDescription(e.target.value)}
                    disabled={creating}
                  />
                </div>

                {createError && (
                  <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="flex">
                      <svg
                        className="size-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {createError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:col-start-2 sm:text-sm"
                  onClick={handleCreateRole}
                  disabled={creating || !newRoleName.trim()}
                >
                  {creating ? (
                    <>
                      <svg
                        className="-ml-1 mr-3 size-5 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Role"
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowModal(false)
                    setNewRoleName("")
                    setNewRoleDescription("")
                    setCreateError(null)
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RolesPermissions
