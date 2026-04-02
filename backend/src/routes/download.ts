import type { FastifyInstance } from 'fastify'
import { fileService } from '../services/FileService.js'
import fs from 'fs/promises'
import path from 'path'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

function formatTimestamp(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${secs}秒`
  }
  if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  }
  return `${secs}秒`
}

export async function downloadRoutes(app: FastifyInstance) {
  app.get('/api/download/:type', async (request, reply) => {
    const { type } = request.params as { type: string }
    const { sessionId } = request.query as { sessionId?: string }

    if (!sessionId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_SESSION_ID', message: 'Session ID is required' },
      })
    }

    try {
      let content: string | Buffer
      let contentType: string
      let filename: string

      switch (type) {
        case 'transcript_txt': {
          const transcript = await fileService.read(sessionId, 'output/transcript.json')
          const parsed = JSON.parse(transcript)
          content = parsed.segments
            .map((seg: { startTime: number; endTime: number; text: string; speakerId: string }) => {
              const start = new Date(seg.startTime).toISOString().substr(11, 8)
              return `[${start}] ${parsed.speakerMap?.[seg.speakerId] || seg.speakerId}: ${seg.text}`
            })
            .join('\n\n')
          contentType = 'text/plain; charset=utf-8'
          filename = `transcript_${sessionId}.txt`
          break
        }
        case 'transcript_word': {
          const transcript = await fileService.read(sessionId, 'output/transcript.json')
          const parsed = JSON.parse(transcript)

          // 构建 Word 文档
          const children: Paragraph[] = [
            new Paragraph({
              text: '视频逐字稿',
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              text: `时长: ${formatDuration(parsed.duration * 1000)}`,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: '',
            }),
          ]

          for (const seg of parsed.segments) {
            const start = formatTimestamp(seg.startTime * 1000)
            const speaker = parsed.speakerMap?.[seg.speakerId] || seg.speakerId
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `[${start}] `, bold: true }),
                  new TextRun({ text: `${speaker}: `, bold: true, color: '666666' }),
                  new TextRun({ text: seg.text }),
                ],
                spacing: { after: 100 },
              })
            )
          }

          const doc = new Document({
            sections: [{ children }],
          })

          content = await Packer.toBuffer(doc)
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          filename = `transcript_${sessionId}.docx`
          break
        }
        case 'article_pdf': {
          content = await fileService.read(sessionId, 'output/article.md')
          contentType = 'text/markdown'
          filename = `article_${sessionId}.md`
          break
        }
        default:
          return reply.status(400).send({
            success: false,
            error: { code: 'UNKNOWN_TYPE', message: 'Unknown download type' },
          })
      }

      reply.header('Content-Type', contentType)
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      return content
    } catch (error) {
      return reply.status(404).send({
        success: false,
        error: { code: 'FILE_NOT_READY', message: 'File not ready for download' },
      })
    }
  })

  // Serve frame images
  app.get('/api/files/:sessionId/frames/:filename', async (request, reply) => {
    const { sessionId, filename } = request.params as { sessionId: string; filename: string }

    try {
      const filePath = path.join(fileService.getSessionDir(sessionId), 'frames', filename)
      const content = await fs.readFile(filePath)

      reply.header('Content-Type', 'image/jpeg')
      reply.header('Cache-Control', 'public, max-age=31536000')
      return content
    } catch (error) {
      return reply.status(404).send({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'Frame file not found' },
      })
    }
  })

  // Proxy external image requests to avoid CORB issues
  app.get('/api/proxy/image', async (request, reply) => {
    const { url } = request.query as { url?: string }

    if (!url) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_URL', message: 'URL parameter is required' },
      })
    }

    try {
      // Validate URL to prevent SSRF
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_PROTOCOL', message: 'Only HTTP and HTTPS are allowed' },
        })
      }

      const imageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      })

      if (!imageResponse.ok) {
        return reply.status(502).send({
          success: false,
          error: { code: 'UPSTREAM_ERROR', message: 'Failed to fetch image' },
        })
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

      reply.header('Content-Type', contentType)
      reply.header('Cache-Control', 'public, max-age=86400')
      reply.header('Access-Control-Allow-Origin', '*')
      return Buffer.from(imageBuffer)
    } catch (error) {
      return reply.status(502).send({
        success: false,
        error: { code: 'PROXY_ERROR', message: 'Failed to proxy image' },
      })
    }
  })
}
