'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { TranscriptView } from '@/components/transcript/TranscriptView'
import { VideoMetaCard } from '@/components/video-input/VideoMetaCard'
import { ArticleView } from '@/components/article/ArticleView'
import { ExtractionPanel } from '@/components/extraction/ExtractionPanel'
import { Spinner } from '@/components/ui/Spinner'
import { Card, CardContent } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { transcribe } from '@/lib/api'

const STATUS_LABELS: Record<string, string> = {
  idle: '等待处理',
  parsing: '正在解析链接',
  extracting: '正在提取音频',
  transcribing: '正在转写音频',
  separating: '正在分离说话人',
  generating: '正在生成文章',
  extracting_frames: '正在提取关键帧',
  done: '处理完成',
  error: '处理失败',
}

export default function ResultPage() {
  const { videoMeta, sessionId, transcript, status, error, setStatus, setTranscript, setError: setStoreError } = useAppStore()
  const [progress, setProgress] = useState(0)
  const hasStartedTranscribe = useRef(false)

  // Start transcription when page loads with transcribing status and no transcript
  useEffect(() => {
    if (status === 'transcribing' && !transcript && !hasStartedTranscribe.current && videoMeta && sessionId) {
      hasStartedTranscribe.current = true

      transcribe(
        sessionId,
        videoMeta.videoUrl,
        videoMeta,
        (stage, prog, message) => {
          setProgress(prog)
          if (stage === 'extracting') setStatus('extracting')
          else if (stage === 'transcribing') setStatus('transcribing')
          else if (stage === 'separating') setStatus('separating')
        }
      )
        .then((result) => {
          setTranscript(result)
          setStatus('done')
          setProgress(100)
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : '转写失败'
          setStoreError(errorMessage)
          setStatus('error')
        })
    }
  }, [status, transcript, videoMeta, sessionId, setStatus, setTranscript, setStoreError])

  // Update progress bar
  useEffect(() => {
    if (status === 'transcribing') {
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90))
      }, 500)
      return () => clearInterval(interval)
    } else if (status === 'done') {
      setProgress(100)
    }
  }, [status])

  if (status === 'parsing') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-gray-600">正在解析视频链接...</p>
        </div>
      </main>
    )
  }

  if (status === 'transcribing' || status === 'extracting' || status === 'separating') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Spinner className="h-10 w-10 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{STATUS_LABELS[status] || '处理中...'}</h2>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">请稍候，无需关闭页面</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (error || status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              ✕
            </div>
            <h2 className="text-xl font-semibold mb-2">处理失败</h2>
            <p className="text-gray-600 mb-4">{error || '发生未知错误'}</p>
            <a
              href="/"
              className="inline-flex items-center text-blue-600 hover:underline"
            >
              ← 返回首页重试
            </a>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <a href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← 返回首页
          </a>
          <h1 className="text-3xl font-bold text-gray-900">处理结果</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {videoMeta && <VideoMetaCard videoMeta={videoMeta} />}
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="transcript">
              <TabsList>
                <TabsTrigger value="transcript">逐字稿</TabsTrigger>
                <TabsTrigger value="article">智能图文</TabsTrigger>
                <TabsTrigger value="extraction">信息提取</TabsTrigger>
              </TabsList>

              <TabsContent value="transcript">
                <TranscriptView />
              </TabsContent>

              <TabsContent value="article">
                <ArticleView />
              </TabsContent>

              <TabsContent value="extraction">
                <ExtractionPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  )
}
