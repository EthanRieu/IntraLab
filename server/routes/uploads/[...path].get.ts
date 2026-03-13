import { createReadStream, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

export default defineEventHandler((event) => {
  const path = getRouterParam(event, 'path')
  const filePath = join(process.cwd(), 'public', 'uploads', path || '')

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'File not found' })
  }

  const ext = extname(filePath).toLowerCase()
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
  setResponseHeader(event, 'Content-Type', mimeType)
  return sendStream(event, createReadStream(filePath))
})