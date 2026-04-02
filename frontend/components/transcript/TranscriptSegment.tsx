'use client'

import React from 'react'
import type { TranscriptSegment as TranscriptSegmentType } from '@video-transcriber/shared'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TranscriptSegmentProps {
  segment: TranscriptSegmentType
  speakerName: string
  onSpeakerClick?: (speakerId: string) => void
}

export function TranscriptSegment({ segment, speakerName, onSpeakerClick }: TranscriptSegmentProps) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-xs text-gray-400 font-mono">
          {formatDuration(segment.startTime)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => onSpeakerClick?.(segment.speakerId)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {speakerName}
            </button>
            {segment.confidence && (
              <span className="text-xs text-gray-400">
                {Math.round(segment.confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed">{segment.text}</p>
        </div>
      </div>
    </div>
  )
}
