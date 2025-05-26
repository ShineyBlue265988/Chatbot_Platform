import Link from "next/link"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function UsageLimitsLink() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? resolvedTheme || theme : "light"
  const isDark = currentTheme === "dark"

  return (
    <Link
      href="/usage-limits"
      className={`flex items-center space-x-2 rounded-lg p-2 transition-colors ${
        isDark
          ? "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <svg
        className="size-5"
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
      <span>Usage Limits</span>
    </Link>
  )
}
