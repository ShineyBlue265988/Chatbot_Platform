import type { NextApiRequest, NextApiResponse } from "next"
import { Resend } from "resend"

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY!)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end()

  const { to, inviteLink } = req.body

  try {
    const response = await resend.emails.send({
      from: "noreply@yourapp.com",
      to,
      subject: "You have been invited to join a team!",
      html: `
        <p>You have been invited to join a team on Your App!</p>
        <p><a href="${inviteLink}">Click here to accept the invitation</a>.</p>
        <p>If you do not wish to join, you can ignore this email.</p>
      `
    })
    if (response.error) {
      throw new Error(response.error.message)
    }
    res.status(200).json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
