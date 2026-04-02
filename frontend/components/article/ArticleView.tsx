'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArticleRenderer } from './ArticleRenderer'
import { FrameGallery } from './FrameGallery'
import { generateArticle } from '@/lib/api'
import { useAppStore } from '@/stores/useAppStore'
import { Spinner } from '@/components/ui/Spinner'

export function ArticleView() {
  const { transcript, sessionId, article, setArticle, status, setStatus, setError } = useAppStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState('')

  const handleGenerate = async () => {
    if (!transcript || !sessionId) return

    setIsGenerating(true)
    setStatus('generating')

    try {
      const result = await generateArticle(
        sessionId,
        transcript,
        { articleStyle: 'informative', frameCount: 4 },
        (stage, progress, message) => {
          setGenerationStage(message)
          setStatus(stage as any)
        }
      )
      setArticle(result)
      setStatus('done')
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败'
      setError(message)
      setStatus('error')
    } finally {
      setIsGenerating(false)
      setGenerationStage('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>智能图文</CardTitle>
          {!article && !isGenerating && (
            <Button onClick={handleGenerate} disabled={!transcript}>
              生成文章
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isGenerating ? (
          <div className="text-center py-12">
            <Spinner className="h-8 w-8 mx-auto mb-4" />
            <p className="text-gray-600">{generationStage || '正在生成...'}</p>
          </div>
        ) : article ? (
          <ArticleRenderer article={article} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>点击&quot;生成文章&quot;按钮生成智能图文</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
