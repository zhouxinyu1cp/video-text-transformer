'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ExtractionCard } from './ExtractionCard'
import { extractInfo } from '@/lib/api'
import { useAppStore } from '@/stores/useAppStore'
import { Spinner } from '@/components/ui/Spinner'

export function ExtractionPanel() {
  const { transcript, sessionId, extraction, setExtraction, setError } = useAppStore()
  const [isExtracting, setIsExtracting] = useState(false)

  const handleExtract = async () => {
    if (!transcript || !sessionId) return

    setIsExtracting(true)
    try {
      const result = await extractInfo(sessionId, transcript)
      setExtraction(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : '提取失败'
      setError(message)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">信息提取</h2>
          {!extraction && !isExtracting && (
            <Button onClick={handleExtract} disabled={!transcript}>
              开始提取
            </Button>
          )}
        </div>

        {isExtracting ? (
          <div className="text-center py-12">
            <Spinner className="h-8 w-8 mx-auto mb-4" />
            <p className="text-gray-600">正在提取信息...</p>
          </div>
        ) : extraction ? (
          <ExtractionCard extraction={extraction} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>点击&quot;开始提取&quot;按钮提取关键信息</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
