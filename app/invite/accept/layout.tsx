import React, { ReactNode } from "react"

export default function AcceptInviteLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
