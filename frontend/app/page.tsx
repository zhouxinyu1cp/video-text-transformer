'use client'

import { useRouter } from 'next/navigation'
import { VideoInputForm } from '@/components/video-input/VideoInputForm'
import { VideoMetaCard } from '@/components/video-input/VideoMetaCard'
import { useAppStore } from '@/stores/useAppStore'

export default function HomePage() {
  const router = useRouter()
  const { videoMeta, status, setStatus } = useAppStore()
  const isProcessing = status !== 'idle' && status !== 'done' && status !== 'error'

  const handleStartProcessing = () => {
    setStatus('transcribing')
    router.push('/result')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            视频智能文稿生成器
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            解析视频链接，一键生成带说话人标签的逐字稿与可发布的智能图文
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!videoMeta ? (
            <VideoInputForm />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <VideoMetaCard
                videoMeta={videoMeta}
                onStartProcessing={handleStartProcessing}
                isProcessing={isProcessing}
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold mb-4">处理流程</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-3">1</span>
                      <span>解析视频链接，获取元数据</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-3">2</span>
                      <span>提取音频并进行语音转写</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-3">3</span>
                      <span>自动分离说话人</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-3">4</span>
                      <span>生成智能图文与信息提取</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
