'use client'

import React from 'react'
import type { Frame } from '@video-transcriber/shared'

interface FrameGalleryProps {
  frames: Frame[]
  onFrameSelect?: (frame: Frame) => void
}

export function FrameGallery({ frames, onFrameSelect }: FrameGalleryProps) {
  if (frames.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无关键帧
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {frames.map((frame) => (
        <button
          key={frame.id}
          onClick={() => onFrameSelect?.(frame)}
          className="relative group overflow-hidden rounded-lg border hover:border-blue-500 transition-colors"
        >
          <img
            src={frame.imageUrl}
            alt={frame.description || `帧 ${frame.id}`}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-white text-xs">
              {formatTimestamp(frame.timestamp)}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
