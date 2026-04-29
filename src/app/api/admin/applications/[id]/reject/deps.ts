import { prisma } from "@/lib/prisma"
import { sendProviderRejectionEmail } from "@/lib/rejectionEmail"
import type { ProviderApplication } from "@prisma/client"

export interface RejectionEmailData {
  email: string
  name: string
}

export const rejectApplicationDeps = {
  findApplication: (id: string): Promise<ProviderApplication | null> =>
    prisma.providerApplication.findUnique({ where: { id } }),

  setApplicationRejected: (id: string): Promise<ProviderApplication> =>
    prisma.providerApplication.update({
      where: { id },
      data: { status: "REJECTED" },
    }),

  sendRejectionEmail: (data: RejectionEmailData) => sendProviderRejectionEmail(data),
}
