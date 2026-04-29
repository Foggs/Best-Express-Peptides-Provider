"use server"

import { redirect } from "next/navigation"
import { consumeSetupToken } from "./deps"

export interface SetPasswordFormState {
  error?: string
}

export async function setPasswordAction(
  _prevState: SetPasswordFormState,
  formData: FormData,
): Promise<SetPasswordFormState> {
  const token = String(formData.get("token") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")

  const result = await consumeSetupToken({ token, password, confirmPassword })

  if (!result.ok) {
    return { error: result.error }
  }

  redirect("/auth/signin?passwordSet=1")
}
