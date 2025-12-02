"use client"

import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FlaskIcon, WarningIcon } from "@/components/icons"

export function AgeVerification() {
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    const verified = Cookies.get("age-verified")
    if (!verified) {
      setShowDialog(true)
    }
  }, [])

  const handleVerify = () => {
    Cookies.set("age-verified", "true", { expires: 30 })
    setShowDialog(false)
  }

  const handleDecline = () => {
    window.location.href = "https://www.google.com"
  }

  return (
    <Dialog open={showDialog} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <FlaskIcon size={48} className="text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Age Verification Required</DialogTitle>
          <DialogDescription className="text-base">
            You must be 21 years of age or older to access this website.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
          <div className="flex gap-3">
            <WarningIcon size={20} className="text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Research Use Only</p>
              <p>All products on this website are intended for research and laboratory use only. They are not intended for human consumption.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button size="lg" onClick={handleVerify} className="w-full">
            I am 21 or older - Enter
          </Button>
          <Button variant="outline" size="lg" onClick={handleDecline} className="w-full">
            I am under 21 - Leave
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          By entering, you agree to our Terms of Service and confirm that you are of legal age to purchase research chemicals in your jurisdiction.
        </p>
      </DialogContent>
    </Dialog>
  )
}
