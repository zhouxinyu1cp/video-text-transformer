import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '视频智能文稿生成器',
  description: '解析视频链接，一键生成逐字稿与智能图文',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
