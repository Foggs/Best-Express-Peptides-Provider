import { permanentRedirect } from "next/navigation"

export default function ProviderIntakePage() {
  permanentRedirect("/auth/signup")
}
