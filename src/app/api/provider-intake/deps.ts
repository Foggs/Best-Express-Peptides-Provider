import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { rateLimit as _rateLimit } from "@/lib/rate-limit"

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"])
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

async function _saveFile(file: File): Promise<string> {
  const rawExt = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!ALLOWED_EXTENSIONS.has(rawExt)) {
    throw new Error(`File type ".${rawExt}" is not allowed. Accepted: pdf, jpg, jpeg, png.`)
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File exceeds the 10 MB limit.")
  }
  const uploadDir = join(process.cwd(), "private-uploads", "provider-intake")
  await mkdir(uploadDir, { recursive: true })
  const filename = `${randomUUID()}.${rawExt}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadDir, filename), buffer)
  return filename
}

type ApplicationData = Parameters<typeof prisma.providerApplication.create>[0]["data"]

export const providerIntakeDeps = {
  rateLimit: _rateLimit as typeof _rateLimit,
  saveFile: _saveFile as (file: File) => Promise<string>,
  createApplication: (data: ApplicationData): Promise<unknown> =>
    prisma.providerApplication.create({ data }),
}
