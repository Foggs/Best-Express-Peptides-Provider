"use client"

import { useFormState, useFormStatus } from "react-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Loader2, X } from "lucide-react"
import { setPasswordAction, type SetPasswordFormState } from "./actions"

const initialState: SetPasswordFormState = {}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
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

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${ok ? "text-green-700" : "text-gray-500"}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      <span>{label}</span>
    </li>
  )
}

export function SetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(setPasswordAction, initialState)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const hasMinLen = password.length >= 8
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const matches = confirmPassword.length > 0 && password === confirmPassword
  const allGood = hasMinLen && hasLetter && hasNumber && matches
  const showMismatch = confirmPassword.length > 0 && !matches

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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <ul className="mt-2 space-y-1">
          <Rule ok={hasMinLen} label="At least 8 characters" />
          <Rule ok={hasLetter} label="Contains a letter" />
          <Rule ok={hasNumber} label="Contains a number" />
        </ul>
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
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          aria-invalid={showMismatch || undefined}
        />
        {showMismatch && (
          <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
        )}
      </div>
      <SubmitButton disabled={!allGood} />
    </form>
  )
}
