import type {
  ParseLinkResponse,
  ExtractInfoResponse,
  VideoMeta,
  Transcript,
  Article,
  ExtractionResult,
  APIError,
} from '@video-transcriber/shared'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw error
  }
  return response.json()
}

export async function parseLink(url: string): Promise<ParseLinkResponse> {
  const response = await fetch(`${API_BASE}/api/parse-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return handleResponse<ParseLinkResponse>(response)
}

export async function transcribe(
  sessionId: string,
  videoUrl: string,
  videoMeta: VideoMeta,
  onProgress: (stage: string, progress: number, message: string) => void
): Promise<Transcript> {
  const response = await fetch(`${API_BASE}/api/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, videoUrl, videoMeta }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Transcription failed' } }))
    throw error
  }

  // Handle SSE stream
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        if (data.event === 'progress') {
          onProgress(data.data.stage, data.data.progress, data.data.message)
        } else if (data.event === 'done') {
          return data.data.transcript
        } else if (data.event === 'error') {
          throw new Error(data.data.message)
        }
      }
    }
  }

  throw new Error('Stream ended without transcript')
}

export async function generateArticle(
  sessionId: string,
  transcript: Transcript,
  options?: { articleStyle?: string; frameCount?: number },
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<Article> {
  const response = await fetch(`${API_BASE}/api/generate-article`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, transcript, options }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Article generation failed' } }))
    throw error
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        if (data.event === 'progress' && onProgress) {
          onProgress(data.data.stage, data.data.progress, data.data.message)
        } else if (data.event === 'done') {
          return data.data.article
        } else if (data.event === 'error') {
          throw new Error(data.data.message)
        }
      }
    }
  }

  throw new Error('Stream ended without article')
}

export async function extractInfo(
  sessionId: string,
  transcript: Transcript
): Promise<ExtractionResult> {
  const response = await fetch(`${API_BASE}/api/extract-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, transcript }),
  })
  const result = await handleResponse<ExtractInfoResponse>(response)
  return result.data.extraction
}

export async function downloadFile(
  type: 'transcript_txt' | 'transcript_word' | 'article_pdf',
  sessionId: string
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/download/${type}?sessionId=${sessionId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Download failed' } }))
    throw error
  }
  return response.blob()
}
