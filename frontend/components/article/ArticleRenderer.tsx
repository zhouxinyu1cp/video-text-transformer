'use client'

import React from 'react'
import type { Article } from '@video-transcriber/shared'

interface ArticleRendererProps {
  article: Article
}

export function ArticleRenderer({ article }: ArticleRendererProps) {
  return (
    <div className="prose prose-blue max-w-none">
      <header className="mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{article.title}</h1>
        <div className="text-sm text-gray-500">
          字数：{article.wordCount} | 生成时间：{new Date(article.createdAt).toLocaleString('zh-CN')}
        </div>
      </header>

      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
        {article.content}
      </div>

      {article.frames.length > 0 && (
        <div className="mt-8 pt-4 border-t">
          <h2 className="text-xl font-semibold mb-4">关键帧</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {article.frames.map((frame) => (
              <div key={frame.id} className="relative group">
                <img
                  src={frame.imageUrl}
                  alt={frame.description || `帧 ${frame.id}`}
                  className="w-full aspect-video object-cover rounded-lg"
                />
                {frame.description && (
                  <p className="text-xs text-gray-500 mt-1">{frame.description}</p>
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {formatTimestamp(frame.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
