"use client"

import { useState } from "react"
import { WarningIcon, CloseIcon } from "@/components/icons"

export function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2">
      <div className="container-custom flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <WarningIcon size={16} className="shrink-0" />
          <span>
            <strong>Research Use Only:</strong> All products are for laboratory research purposes. Not for human consumption.
          </span>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="shrink-0 hover:bg-white/20 p-1 rounded"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  )
}
