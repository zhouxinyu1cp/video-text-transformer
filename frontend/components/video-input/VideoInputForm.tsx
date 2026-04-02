'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { parseLink } from '@/lib/api'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

export function VideoInputForm() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setVideoMeta, setSessionId, setStatus, setError: setStoreError } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    setError(null)
    setStatus('parsing')

    try {
      const response = await parseLink(url)
      if (response.success) {
        setSessionId(response.data.sessionId)
        setVideoMeta(response.data.videoMeta)
        setStatus('idle')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '解析链接失败'
      setError(errorMessage)
      setStoreError(errorMessage)
      setStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartProcessing = () => {
    setStatus('transcribing')
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="video-url" className="block text-sm font-medium mb-2">
                视频链接
              </label>
              <div className="flex gap-2">
                <Input
                  id="video-url"
                  type="url"
                  placeholder="请粘贴B站、抖音、YouTube或视频号链接"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !url.trim()}>
                  {isLoading ? '解析中...' : '解析'}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </form>

          <div className="mt-6 text-sm text-gray-500">
            <p>支持的平台：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>B站 (bilibili.com)</li>
              <li>抖音 (douyin.com)</li>
              <li>YouTube (youtube.com)</li>
              <li>视频号 (channels.weixin.qq.com)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
