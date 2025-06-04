import React, { useState } from "react"

type Role = {
  id?: string
  name: string
  permissions: string[]
  description?: string
}

type Permission = {
  id: string
  name: string
}

type RoleModalProps = {
  allPermissions: Permission[] // ✅ Change from string[] to Permission[]
  role: Role | null
  onClose: () => void
  onSave: (role: {
    name: string
    permissions: string[]
    description?: string
  }) => void
}

const RoleModal: React.FC<RoleModalProps> = ({
  allPermissions,
  role,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(role?.name || "")
  const [description, setDescription] = useState(role?.description || "")
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions || []
  )

  const togglePermission = (permId: string) => {
    // ✅ Use permission ID for logic
    setPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name, permissions, description })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3 className="mb-4 text-lg font-bold">
          {role ? "Edit Role" : "Create New Role"}
        </h3>

        {/* Role Name Input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Role Name:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter role name (e.g., 'Content Manager')"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role Description Input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Description:</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what this role can do..."
            rows={3}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ✅ Permissions Section - Show permission names */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium">Permissions:</label>
          <div className="max-h-60 overflow-y-auto rounded border bg-gray-50 p-3">
            {allPermissions.map(permission => (
              <label
                key={permission.id}
                className="mb-2 flex items-center rounded p-2 hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={permissions.includes(permission.id)} // ✅ Check using permission ID
                  onChange={() => togglePermission(permission.id)} // ✅ Toggle using permission ID
                  className="mr-3 size-4 accent-blue-600"
                />
                <span className="text-sm">
                  <span className="font-medium">{permission.name}</span>{" "}
                  {/* ✅ Show permission name */}
                  <span className="ml-2 block text-xs text-gray-500">
                    {getPermissionDescription(permission.id)}{" "}
                    {/* ✅ Description based on ID */}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Selected {permissions.length} of {allPermissions.length} permissions
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {role ? "Update Role" : "Create Role"}
          </button>
        </div>
      </div>

      {/* Modal Styles */}
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .modal {
          background: white;
          padding: 24px;
          border-radius: 12px;
          min-width: 500px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        @media (max-width: 640px) {
          .modal {
            min-width: 90vw;
            margin: 20px;
          }
        }
      `}</style>
    </div>
  )
}

// ✅ Enhanced permission descriptions
const getPermissionDescription = (permissionId: string): string => {
  const descriptions: Record<string, string> = {
    "team.view": "View team members and basic information",
    "team.manage": "Add/remove members and change their roles",
    "team.invite": "Send invitations to new team members",
    "team.remove_members": "Remove members from the team",
    "workspace.read": "View workspace content and files",
    "workspace.write": "Create and edit workspace content",
    "workspace.manage": "Manage workspace settings and configuration",
    "roles.manage": "Create, edit, and delete custom roles",
    "chat.read": "View chat conversations and history",
    "chat.write": "Send messages and create new chats",
    "files.read": "View and download files",
    "files.write": "Upload, edit, and manage files",
    "assistants.read": "View AI assistants and their configurations",
    "assistants.write": "Create and modify AI assistants",
    "prompts.read": "View prompt templates",
    "prompts.write": "Create and edit prompt templates",
    "collections.read": "View document collections",
    "collections.write": "Create and manage document collections"
  }
  return descriptions[permissionId] || "Custom permission"
}

export default RoleModal
