"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { setPasswordAction, type SetPasswordFormState } from "./actions"

const initialState: SetPasswordFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Setting password…
        </>
      ) : (
        "Set Password"
      )}
    </Button>
  )
}

export function SetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(setPasswordAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={8}
          required
          placeholder="Re-enter your password"
        />
      </div>
      <SubmitButton />
    </form>
  )
}
