"use client"

import React, { useRef } from "react"
import type { FC } from "react"
import { Button } from "@/components/ui/button"

interface GooglePickerProps {
  onFileSelect: (file: File) => void
}

declare global {
  interface Window {
    google: any
    gapi: any
  }
}

const CLIENT_ID =
  "336247810256-7uveqa8vsl10cm5ht8nfajrueh87qb4v.apps.googleusercontent.com"
const API_KEY = "AIzaSyCfXvne6fHQONNfGlnJf2XJVC-mueFzbck"
const APP_ID = "336247810256"
const SCOPE = "https://www.googleapis.com/auth/drive.readonly"

const GooglePicker: FC<GooglePickerProps> = ({ onFileSelect }) => {
  const accessTokenRef = useRef<string | null>(null)
  const pickerApiLoadedRef = useRef(false)
  const gisInitedRef = useRef(false)
  const tokenClientRef = useRef<any>(null)

  // Load Google API and Identity Services
  React.useEffect(() => {
    // Load gapi
    const loadGapi = () => {
      if (!window.gapi) {
        const script = document.createElement("script")
        script.src = "https://apis.google.com/js/api.js"
        script.onload = () => {
          window.gapi.load("client:picker", () => {
            pickerApiLoadedRef.current = true
          })
        }
        document.body.appendChild(script)
      } else {
        window.gapi.load("client:picker", () => {
          pickerApiLoadedRef.current = true
        })
      }
    }

    // Load GIS
    const loadGIS = () => {
      if (!window.google || !window.google.accounts) {
        const script = document.createElement("script")
        script.src = "https://accounts.google.com/gsi/client"
        script.onload = () => {
          gisInitedRef.current = true
        }
        document.body.appendChild(script)
      } else {
        gisInitedRef.current = true
      }
    }

    loadGapi()
    loadGIS()
  }, [])

  // Initialize token client
  const initTokenClient = () => {
    if (!window.google || !window.google.accounts || tokenClientRef.current)
      return
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response: any) => {
        if (response.error) {
          console.error("Google OAuth error:", response)
          return
        }
        accessTokenRef.current = response.access_token
        createPicker()
      }
    })
  }

  // Create and show the picker
  const createPicker = () => {
    if (!pickerApiLoadedRef.current || !accessTokenRef.current) {
      return
    }
    const google = window.google
    const picker = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS)
      .setOAuthToken(accessTokenRef.current)
      .setDeveloperKey(API_KEY)
      .setAppId(APP_ID)
      .setCallback(async (data: any) => {
        if (
          data.action === google.picker.Action.PICKED &&
          data.docs &&
          data.docs.length > 0
        ) {
          const doc = data.docs[0]
          try {
            // Download file as blob
            const res = await fetch(
              `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
              {
                headers: {
                  Authorization: `Bearer ${accessTokenRef.current}`
                }
              }
            )
            if (!res.ok)
              throw new Error("Failed to download file from Google Drive")
            const blob = await res.blob()
            const file = new File([blob], doc.name, { type: doc.mimeType })
            onFileSelect(file)
          } catch (err) {
            console.error("Error downloading file from Google Drive:", err)
          }
        }
      })
      .build()
    picker.setVisible(true)
  }

  // Handle button click
  const handleOpenPicker = () => {
    if (!tokenClientRef.current) {
      initTokenClient()
    }
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: "consent" })
    }
  }

  return (
    <div>
      <Button onClick={handleOpenPicker} variant="outline">
        Open Google Drive
      </Button>
    </div>
  )
}

export default GooglePicker
