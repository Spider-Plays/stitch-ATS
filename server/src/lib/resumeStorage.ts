import fs from 'fs/promises'
import os from 'os'
import path from 'path'

// Avoid OneDrive-synced project folders (common EPERM on Windows)
export const RESUME_UPLOAD_DIR =
  process.env.RESUME_UPLOAD_DIR || path.join(os.tmpdir(), 'stitch-ats-resumes')

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx'])

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export function isAllowedResumeFile(mime: string, filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  if (ALLOWED_EXT.has(ext)) return true
  return ALLOWED_MIME.has(mime)
}

export function resolveResumeMime(mime: string, filename: string): string {
  if (mime && mime !== 'application/octet-stream' && ALLOWED_MIME.has(mime)) return mime
  const ext = path.extname(filename).toLowerCase()
  return MIME_BY_EXT[ext] || mime
}

export function resumeExtension(mime: string, filename?: string): string {
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime]
  if (filename) {
    const ext = path.extname(filename).toLowerCase()
    if (ALLOWED_EXT.has(ext)) return ext
  }
  return '.bin'
}

export async function ensureResumeDir(): Promise<void> {
  await fs.mkdir(RESUME_UPLOAD_DIR, { recursive: true })
}

export function resumeFilePath(candidateId: string, mime: string, filename?: string): string {
  return path.join(RESUME_UPLOAD_DIR, `${candidateId}${resumeExtension(mime, filename)}`)
}

export async function saveResumeFile(
  candidateId: string,
  mime: string,
  buffer: Buffer,
  filename?: string
): Promise<string> {
  await ensureResumeDir()
  await deleteResumeFile(candidateId)
  const resolvedMime = resolveResumeMime(mime, filename || '')
  const filePath = resumeFilePath(candidateId, resolvedMime, filename)
  await fs.writeFile(filePath, buffer)
  return filePath
}

export async function deleteResumeFile(candidateId: string): Promise<void> {
  await ensureResumeDir()
  const files = await fs.readdir(RESUME_UPLOAD_DIR).catch(() => [] as string[])
  const prefix = `${candidateId}.`
  await Promise.all(
    files
      .filter((f) => f.startsWith(prefix))
      .map((f) => fs.unlink(path.join(RESUME_UPLOAD_DIR, f)).catch(() => undefined))
  )
}

export async function findResumeFile(
  candidateId: string
): Promise<{ filePath: string; mime: string } | null> {
  await ensureResumeDir()
  const files = await fs.readdir(RESUME_UPLOAD_DIR).catch(() => [] as string[])
  const match = files.find((f) => f.startsWith(`${candidateId}.`))
  if (!match) return null
  const ext = path.extname(match).toLowerCase()
  const mime = MIME_BY_EXT[ext] || 'application/octet-stream'
  return { filePath: path.join(RESUME_UPLOAD_DIR, match), mime }
}
