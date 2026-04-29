import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { setPasswordDeps } from "./deps"
import { SetPasswordForm } from "./SetPasswordForm"

interface PageProps {
  searchParams: Promise<{ token?: string | string[] }>
}

export const dynamic = "force-dynamic"

export default async function SetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tokenRaw = Array.isArray(params.token) ? params.token[0] : params.token
  const token = (tokenRaw ?? "").trim()

  if (!token) {
    return (
      <InvalidLinkCard message="No setup token was provided. Please use the link from your welcome email." />
    )
  }

  const tokenHash = setPasswordDeps.hashSetupToken(token)
  const user = await setPasswordDeps.findUserByTokenHash(tokenHash)

  if (!user || !user.setupTokenExpiresAt) {
    return (
      <InvalidLinkCard message="This setup link is invalid or has already been used. Please contact support." />
    )
  }

  if (user.setupTokenExpiresAt.getTime() < Date.now()) {
    return (
      <InvalidLinkCard message="This setup link has expired. Please contact support to request a new one." />
    )
  }

  return (
    <div className="py-16">
      <div className="container-custom max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set Your Password</CardTitle>
            <CardDescription>
              Welcome{user.name ? `, ${user.name}` : ""}. Choose a password to finish setting up your provider account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SetPasswordForm token={token} />
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              This link is valid for 24 hours and can only be used once.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

const SUPPORT_EMAIL = "support@bestexpresspeptides.com"

function InvalidLinkCard({ message }: { message: string }) {
  return (
    <div className="py-16">
      <div className="container-custom max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Setup Link Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  "Provider setup link request",
                )}`}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Contact support for a new link
              </a>
              <Link href="/auth/signin" className="text-sm text-primary hover:underline text-center">
                Go to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
