"use client"

import { useEffect } from "react"

function isChunkError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const e = err as { name?: string; message?: string }
  return (
    e.name === "ChunkLoadError" ||
    (typeof e.message === "string" && e.message.includes("Loading chunk"))
  )
}

export function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (isChunkError(event.error) || isChunkError({ message: event.message })) {
        window.location.reload()
      }
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isChunkError(event.reason)) {
        window.location.reload()
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)
    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return null
}
