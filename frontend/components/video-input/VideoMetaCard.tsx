'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { VideoMeta } from '@video-transcriber/shared'
import { formatDuration } from '@/lib/utils'

interface VideoMetaCardProps {
  videoMeta: VideoMeta
  onStartProcessing?: () => void
  isProcessing?: boolean
}

export function VideoMetaCard({ videoMeta, onStartProcessing, isProcessing }: VideoMetaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{videoMeta.title || '视频标题'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
          {videoMeta.thumbnail ? (
            <img
              src={videoMeta.thumbnail}
              alt={videoMeta.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              暂无封面
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">平台</span>
            <span className="font-medium">{videoMeta.platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">时长</span>
            <span className="font-medium">{formatDuration(videoMeta.duration * 1000)}</span>
          </div>
          {videoMeta.author && (
            <div className="flex justify-between">
              <span className="text-gray-500">作者</span>
              <span className="font-medium">{videoMeta.author}</span>
            </div>
          )}
        </div>

        {onStartProcessing && (
          <Button
            className="w-full"
            onClick={onStartProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? '处理中...' : '开始处理'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
