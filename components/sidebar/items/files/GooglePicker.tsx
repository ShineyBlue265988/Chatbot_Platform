"use client"

import React from "react"
import type { FC } from "react"
import useDrivePicker from "react-google-drive-picker"
import { Button } from "@/components/ui/button"

interface GooglePickerProps {
  onFileSelect: (file: File) => void
}

interface PickerData {
  action: string
  docs?: Array<{
    id: string
    name: string
    mimeType: string
    // Add other properties that might be in the docs objects
  }>
  // Add other properties that might be in the data object
}

const GooglePicker: FC<GooglePickerProps> = ({ onFileSelect }) => {
  const [openPicker] = useDrivePicker()

  const handleOpenPicker = () => {
    gapi.load("client:auth2", () => {
      gapi.client
        .init({
          apiKey: "AIzaSyCfXvne6fHQONNfGlnJf2XJVC-mueFzbck"
        })
        .then(() => {
          let tokenInfo = gapi.auth.getToken()
          const pickerConfig: any = {
            clientId:
              "336247810256-7uveqa8vsl10cm5ht8nfajrueh87qb4v.apps.googleusercontent.com",
            developerKey: "AIzaSyCfXvne6fHQONNfGlnJf2XJVC-mueFzbck",
            viewId: "DOCS",
            viewMimeTypes:
              "image/jpeg,image/png,image/gif,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            token: tokenInfo ? tokenInfo.access_token : null,
            showUploadView: true,
            showUploadFolders: true,
            supportDrives: true,
            multiselect: false, // Set to false to simplify handling
            callbackFunction: (data: PickerData) => {
              const elements = Array.from(
                document.getElementsByClassName(
                  "picker-dialog"
                ) as HTMLCollectionOf<HTMLElement>
              )
              for (let i = 0; i < elements.length; i++) {
                elements[i].style.zIndex = "2000"
              }
              if (
                data.action === "picked" &&
                data.docs &&
                data.docs.length > 0
              ) {
                if (!tokenInfo) {
                  tokenInfo = gapi.auth.getToken()
                }

                const selectedDoc = data.docs[0] // Get the first selected document

                // Fetch the file content
                fetch(
                  `https://www.googleapis.com/drive/v3/files/${selectedDoc.id}?alt=media`,
                  {
                    headers: {
                      Authorization: `Bearer ${tokenInfo.access_token}`
                    }
                  }
                )
                  .then(response => response.blob())
                  .then(blob => {
                    // Create a File object from the blob
                    const file = new File([blob], selectedDoc.name, {
                      type: selectedDoc.mimeType
                    })

                    // Pass the file to the parent component
                    onFileSelect(file)
                  })
                  .catch(error => {
                    console.error(
                      "Error downloading file from Google Drive:",
                      error
                    )
                  })
              }
            }
          }
          openPicker(pickerConfig)
        })
    })
  }

  return (
    <div>
      <Button onClick={() => handleOpenPicker()} variant="outline">
        Open Google Drive
      </Button>
    </div>
  )
}

export default GooglePicker
