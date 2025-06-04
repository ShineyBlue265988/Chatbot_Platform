import React from "react"

interface RoleCardProps {
  roleName: string
  roleDescription?: string
  teamName: string
  permissions: string[]
  allPermissions: Array<{ id: string; name: string; description?: string }>
  isSystemRole: boolean
}

export const RoleCard: React.FC<RoleCardProps> = ({
  roleName,
  roleDescription,
  teamName,
  permissions,
  allPermissions,
  isSystemRole
}) => {
  const getPermissionName = (permissionId: string) => {
    const permission = allPermissions.find(p => p.id === permissionId)
    return permission?.name || permissionId
  }

  const getPermissionDescription = (permissionId: string) => {
    const permission = allPermissions.find(p => p.id === permissionId)
    return permission?.description || ""
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {roleName}
            </h3>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                isSystemRole
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              {isSystemRole ? "System" : "Custom"}
            </span>
          </div>

          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg
              className="size-4"
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
            <span>Team: {teamName}</span>
          </div>

          {roleDescription && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {roleDescription}
            </p>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Permissions
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {permissions.length} granted
          </span>
        </div>

        {permissions.length === 0 ? (
          <div className="py-4 text-center">
            <svg
              className="mx-auto mb-2 size-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No permissions assigned
            </p>
          </div>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {permissions.map(permissionId => {
              const permissionName = getPermissionName(permissionId)
              const permissionDescription =
                getPermissionDescription(permissionId)

              return (
                <div
                  key={permissionId}
                  className="flex items-center gap-2 rounded-md bg-gray-50 p-2 dark:bg-gray-700"
                  title={permissionDescription}
                >
                  <svg
                    className="size-4 shrink-0 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {permissionName}
                    </p>
                    {permissionDescription && (
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {permissionDescription}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{isSystemRole ? "System-defined role" : "Custom role"}</span>
          <span>
            {permissions.length} / {allPermissions.length} permissions
          </span>
        </div>
      </div>
    </div>
  )
}
