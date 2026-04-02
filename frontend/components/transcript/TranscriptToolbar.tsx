'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { downloadFile } from '@/lib/api'
import { downloadBlob, getFileExtension } from '@/lib/download'
import { useAppStore } from '@/stores/useAppStore'

export function TranscriptToolbar() {
  const { transcript, sessionId } = useAppStore()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleCopy = async () => {
    if (!transcript) return

    const text = transcript.segments
      .map((seg) => {
        const speaker = transcript.speakerMap[seg.speakerId] || seg.speakerId
        return `[${formatTime(seg.startTime)}] ${speaker}: ${seg.text}`
      })
      .join('\n\n')

    await navigator.clipboard.writeText(text)
  }

  const handleDownload = async (type: 'transcript_txt' | 'transcript_word') => {
    if (!sessionId) return

    setIsDownloading(true)
    try {
      const blob = await downloadFile(type, sessionId)
      const ext = getFileExtension(type)
      await downloadBlob(blob, `transcript_${Date.now()}.${ext}`)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 pb-4 mb-4">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        复制全文
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload('transcript_txt')}
        disabled={isDownloading}
      >
        下载TXT
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload('transcript_word')}
        disabled={isDownloading}
      >
        下载Word
      </Button>
    </div>
  )
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
