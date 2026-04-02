# 视频智能文稿生成器 - 技术方案规划

**版本：** 1.0
**日期：** 2026年3月31日
**状态：** 草稿

---

## 一、项目概述

### 1.1 项目定位

一款**无需登录、即用即走**的在线工具，解析主流视频平台链接，一键生成带说话人标签的逐字稿与可发布的智能图文草稿。

### 1.2 核心功能模块

| 模块 | 功能描述 |
|------|----------|
| **视频解析** | 解析 B站、抖音、YouTube、视频号链接，提取元数据 |
| **语音转写** | 音频提取 + ASR 转写，带毫秒级时间戳 |
| **说话人分离** | 自动区分说话人，支持重命名标签 |
| **文稿输出** | 逐字稿预览、复制、下载（TXT/Word(.docx)） |
| **智能图文** | LLM 优化文章 + 关键帧配图，导出 PDF |
| **信息提取** | 结构化提取核心观点、行动项、数据事实 |

### 1.3 数据流向

```
视频链接
    │
    ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│链接解析 │───▶│音频提取 │───▶│ ASR转写 │───▶│说话人分离│
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                  │
                     ┌────────────────────────────┘
                     ▼
              ┌───────────┐    ┌────────────┐
              │  逐字稿输出 │    │ LLM文章生成 │
              └───────────┘    └────────────┘
                                       │
                              ┌────────┴────────┐
                              ▼                 ▼
                        ┌──────────┐     ┌──────────┐
                        │ 关键帧提取│     │ 信息结构化│
                        └──────────┘     └──────────┘
```

---

## 二、技术选型

### 2.1 技术栈总览

| 层级 | 技术选型 | 选型理由 |
|------|----------|----------|
| **前端框架** | Next.js 14 (App Router) | SSR + API Routes 一站式解决，首选 |
| **UI 样式** | Tailwind CSS + Radix UI | 原子化样式 + 无障碍组件 |
| **状态管理** | Zustand | 轻量级，足以应对单页应用复杂度 |
| **PDF 生成** | @react-pdf/renderer | 纯前端生成，避免后端依赖 |
| **视频预览** | react-player | 多平台统一播放器 |
| **后端框架** | Fastify | 高性能，优于 Express |
| **运行时** | Node.js 20 LTS | 稳定，LTS 版本 |
| **ASR 服务** | @whisper/nodejs (Node.js bindings, base 模型) | 开源本地，无需 API 费用 |
| **LLM 服务** | MiniMax 大模型 | 中文能力强，上下文 128k |
| **Word生成** | docx 库 | 生成真正的 .docx 文件 |
| **文件存储** | 本地文件系统 | /tmp/video-transcriber/ |

### 2.2 大模型服务对比

| 服务 | 模型 | 适用场景 |
|------|------|----------|
| **MiniMax** | MiniMax-Text-01 | 文章优化、信息提取（推荐） |
| **阿里云通义千问** | Qwen-Max | 需要更长上下文时 |
| **智谱 AI** | GLM-4-Plus | 需要私有化部署时 |

**推荐：MiniMax > 通义千问 > 智谱 GLM**

### 2.3 ASR 服务方案

| 方案 | 实现方式 | 适用场景 |
|------|----------|----------|
| **已采用** | nodejs-whisper (Node.js Whisper 封装) | ✅ 已实现：开源可控，无需 API 费用，base 模型兼顾速度与精度 |
| **备选** | 阿里云语音识别 | 中文优化更好，但需要阿里云账号 |
| **备选** | MiniMax 语音识别 | 一站式服务，按量付费 |

**实现细节**:
- `ASRService` 封装 `nodejs-whisper` 包
- 支持动态导入，未安装时给出友好错误提示
- 首次运行自动下载 base 模型
- 模型路径可通过 `WHISPER_MODEL_PATH` 环境变量配置
- 说话人分离基于停顿检测（>2s 视为换人）

---

## 三、前端工程结构

```
frontend/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 主页（视频链接输入）
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   └── result/
│       └── page.tsx              # 结果页（文稿 + 图文）
│
├── components/                   # UI 组件（按功能分组）
│   ├── video-input/
│   │   ├── VideoInputForm.tsx    # 链接输入表单
│   │   └── VideoMetaCard.tsx     # 视频元数据展示卡
│   │
│   ├── transcript/
│   │   ├── TranscriptView.tsx    # 逐字稿主视图
│   │   ├── TranscriptSegment.tsx # 单条转写片段
│   │   ├── SpeakerTag.tsx        # 说话人标签（可点击重命名）
│   │   └── TranscriptToolbar.tsx # 工具栏（复制/下载）
│   │
│   ├── article/
│   │   ├── ArticleView.tsx       # 智能图文主视图
│   │   ├── ArticleRenderer.tsx  # 文章渲染（含图片占位）
│   │   └── FrameGallery.tsx      # 关键帧画廊
│   │
│   ├── extraction/
│   │   ├── ExtractionPanel.tsx   # 信息提取面板
│   │   └── ExtractionCard.tsx    # 提取结果卡片
│   │
│   └── ui/                       # 基础 UI 组件（基于 Radix）
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Dialog.tsx
│       ├── Tabs.tsx
│       ├── Spinner.tsx
│       └── Toast.tsx
│
├── lib/                          # 工具函数
│   ├── api.ts                    # API 调用封装
│   ├── download.ts               # 文件下载工具
│   └── utils.ts                  # 通用工具函数
│
├── stores/                       # Zustand 状态管理
│   └── useAppStore.ts            # 全局状态（sessionId、视频信息、转写结果等）
│
├── types/                        # TypeScript 类型定义
│   └── index.ts                  # 共享类型定义
│
├── public/                       # 静态资源
│   └── favicon.ico
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.1 前端组件说明

| 组件 | 职责 | 依赖关系 |
|------|------|----------|
| `VideoInputForm` | 链接输入 + 验证 | 调用 `api.parseLink` |
| `VideoMetaCard` | 显示视频标题/封面/时长 | 接收 props |
| `TranscriptView` | 逐字稿主容器 | 订阅 `useAppStore.transcript` |
| `SpeakerTag` | 说话人标签（可编辑） | 触发 `store.updateSpeakerName` |
| `ArticleRenderer` | 渲染文章 + 图片占位 | 接收 `article` + `frames` props |
| `ExtractionPanel` | 信息提取结果展示 | 调用 `api.extractInfo` |

### 3.2 前端状态设计（Zustand Store）

```typescript
interface AppState {
  // 视频信息
  videoMeta: {
    title: string;
    thumbnail: string;
    duration: number;
    platform: string;
    videoUrl: string;
  } | null;

  // 转写结果
  transcript: TranscriptSegment[];
  speakerMap: Record<string, string>; // speakerId -> 显示名

  // 文章结果
  article: string | null;
  frames: Frame[];

  // 提取结果
  extraction: ExtractionResult | null;

  // Session
  sessionId: string | null;

  // Actions
  setVideoMeta: (meta: VideoMeta) => void;
  setTranscript: (transcript: TranscriptSegment[]) => void;
  updateSpeakerName: (speakerId: string, name: string) => void;
  setArticle: (article: string, frames: Frame[]) => void;
  setExtraction: (result: ExtractionResult) => void;
  reset: () => void;
}
```

---

## 四、后端工程结构

```
backend/
├── src/
│   ├── index.ts                  # 入口文件，启动 Fastify 服务器
│   ├── app.ts                    # Fastify 实例配置
│   │
│   ├── routes/                   # 路由定义（每个文件对应一个 API）
│   │   ├── parse.ts              # POST /api/parse-link
│   │   ├── transcribe.ts         # POST /api/transcribe
│   │   ├── generate-article.ts   # POST /api/generate-article
│   │   ├── extract-info.ts       # POST /api/extract-info
│   │   └── download.ts           # GET  /api/download/:type
│   │
│   ├── services/                 # 业务逻辑模块（无继承，优先函数）
│   │   ├── LinkParserService.ts  # 视频链接解析
│   │   ├── FFmpegService.ts      # 音视频处理
│   │   ├── ASRService.ts         # 语音识别
│   │   ├── LLMService.ts         # 大模型服务
│   │   └── FileService.ts        # 文件管理
│   │
│   ├── types/                    # 类型定义
│   │   └── index.ts
│   │
│   └── utils/                    # 工具函数
│       └── helpers.ts
│
├── package.json
├── tsconfig.json
└── .env.example
```

### 4.1 后端服务模块说明

| 模块 | 职责 | 公开方法 |
|------|------|----------|
| `LinkParserService` | 解析各平台视频链接 | `parse(url: string): Promise<VideoMeta>` |
| `FFmpegService` | 音频提取、关键帧截取 | `extractAudio(videoUrl, outputPath)`, `extractFrames(videoUrl, outputDir, count)` |
| `ASRService` | 调用 nodejs-whisper 转写 | `transcribe(audioPath): Promise<TranscriptSegment[]>`, `separateSpeakers(segments)` |
| `LLMService` | 调用 MiniMax API | `generateArticle(transcript)`, `extractInfo(transcript)` |
| `FileService` | 会话目录管理、文件读写 | `createSession(sessionId)`, `read/write`, `cleanup` |

### 4.2 API 路由设计

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/parse-link` | 解析视频链接 |
| POST | `/api/transcribe` | 音频转写 + 说话人分离 |
| POST | `/api/generate-article` | 生成智能图文 |
| POST | `/api/extract-info` | 结构化信息提取 |
| GET | `/api/download/:type` | 文件下载 (txt/word/pdf) |
| GET | `/api/files/:sessionId/frames/:filename` | 获取抽帧图片 |
| GET | `/api/proxy/image` | 图片代理 (解决跨域/CORB) |

### 4.3 目录结构（运行时）

```
/tmp/video-transcriber/
└── {sessionId}/
    ├── audio/
    │   └── extracted.mp3
    ├── frames/
    │   ├── frame_001.jpg
    │   └── frame_002.jpg
    └── output/
        ├── transcript.json
        ├── article.md
        └── structured_info.json
```

---

## 五、环境变量配置

```bash
# .env

# ============ 存储配置 ============
STORAGE_BASE_DIR=/tmp/video-transcriber

# ============ MiniMax API (LLM) ============
MINIMAX_API_KEY=your_api_key
MINIMAX_GROUP_ID=your_group_id

# ============ 服务器配置 ============
PORT=3001
HOST=0.0.0.0
API_BASE_URL=http://localhost:3001
```

---

## 六、部署方案

### 6.1 Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"   # 前端
      - "3001:3001"   # 后端 API
    environment:
      - STORAGE_BASE_DIR=/app/data
      - MINIMAX_API_KEY=${MINIMAX_API_KEY}
      - MINIMAX_GROUP_ID=${MINIMAX_GROUP_ID}
    volumes:
      - app-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  app-data:
```

### 6.2 基础镜像 Dockerfile

```dockerfile
FROM node:20-slim

# 安装 FFmpeg（音视频处理必需）
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]
```

---

## 七、技术方案总结

| 维度 | 方案 | 理由 |
|------|------|------|
| **架构风格** | 单体服务（Monolithic） | 复杂度低，PRD 功能范围清晰 |
| **前后端通信** | REST API | 简单直观，无需额外框架 |
| **状态管理** | Zustand（前端） | 轻量，无 context 嵌套地狱 |
| **PDF 生成** | @react-pdf/renderer（前端） | 减轻后端压力，纯前端完成 |
| **文件存储** | 本地文件系统 | 符合「无需登录」定位，会话级存储 |
| **LLM 调用** | MiniMax API | 中文能力强，上下文 128k |
| **ASR 调用** | nodejs-whisper (本地 base 模型) | ✅ 已实现：开源可控，无需 API 费用 |

---

## 八、实施计划（建议）

| 阶段 | 内容 | 产出 |
|------|------|------|
| **Phase 1** | 项目脚手架 + 链接解析 | 可运行的空项目 |
| **Phase 2** | 音频提取 + ASR 转写 | 逐字稿基础功能 |
| **Phase 3** | 说话人分离 + 文稿输出 | 完整的逐字稿功能 |
| **Phase 4** | LLM 文章生成 + 关键帧 | 智能图文功能 |
| **Phase 5** | 信息提取 + PDF 导出 | 进阶功能完成 |
| **Phase 6** | 测试 + 部署优化 | 生产可用版本 |

---

*文档状态：待评审*
