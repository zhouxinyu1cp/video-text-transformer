# 视频智能文稿生成器 - 技术规划文档

**版本：** 1.0
**日期：** 2026年3月31日
**说明：** 基于 PRD v2.0 需求文档的技术架构规划，采用单体服务架构、中国大模型服务、本地文件存储。

---

## 一、技术选型总览

### 1.1 前端技术栈

| 层级 | 推荐技术 | 说明 |
|------|----------|------|
| **框架** | Next.js 14 (App Router) | SSR + API Routes，一站式前后端 |
| **UI 库** | Tailwind CSS + Radix UI | 原子化样式 + 无障碍组件 |
| **状态管理** | Zustand | 轻量级状态管理 |
| **PDF 生成** | @react-pdf/renderer | 纯前端 PDF 生成 |
| **视频预览** | react-player | 多平台视频统一播放组件 |

### 1.2 后端技术栈

| 层级 | 推荐技术 | 说明 |
|------|----------|------|
| **运行时** | Node.js 20 LTS | 前后端统一语言 |
| **框架** | Fastify | 高性能 REST API 框架 |
| **任务调度** | Node.js 原生 child_process | 后台任务处理 |
| **文件存储** | 本地文件系统 | /tmp/video-transcriber/ |
| **ASR 服务** | 阿里云语音识别 / 腾讯云 ASR | 云服务 API 调用 |
| **LLM 服务** | 通义千问 (Qwen-Max) / 智谱 GLM-4 | 中国大模型服务 |

---

## 二、中国大模型服务对比

| 服务 | 模型 | 优势 | 适用场景 |
|------|------|------|----------|
| **阿里云通义千问** | Qwen-Max | 上下文长(128k)、中文优化强、成本低 | 文章优化、信息提取首选 |
| **智谱 AI** | GLM-4-Plus | 开源可自部署、本地化支持好 | 需要私有化部署场景 |
| **百度文心一言** | ERNIE-4.0 | 百度搜索生态集成 | 需结合搜索增强时 |

**推荐优先级：通义千问 > 智谱 GLM > 文心一言**

---

## 三、ASR 服务选型

| 方案 | 服务商 | 说明 |
|------|--------|------|
| **推荐 1** | 阿里云语音识别 | 中文优化好、准确率高、按量付费 |
| **推荐 2** | 腾讯云 ASR | 中文方言支持、实时转写 |
| **备选** | Whisper (本地 Docker) | 开源可控，需较高配置 |

---

## 四、系统架构设计

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  VideoInput → TranscriptView → ArticleView → PDFExport     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Fastify 单体)                    │
├─────────────────────────────────────────────────────────────┤
│  API Routes:                                                │
│  ├── POST /api/parse-link      (视频链接解析)               │
│  ├── POST /api/transcribe      (音频转写 + 说话人分离)      │
│  ├── POST /api/generate-article (LLM 文章生成)             │
│  ├── POST /api/extract-info    (信息结构化提取)            │
│  └── GET  /api/download/:type  (文件下载)                  │
├─────────────────────────────────────────────────────────────┤
│  Services (内部模块):                                       │
│  ├── LinkParserService    (平台解析服务)                   │
│  ├── FFmpegService        (音视频处理服务)                 │
│  ├── ASRService            (语音转写服务)                  │
│  ├── LLMService            (大模型服务封装)               │
│  └── FileService           (本地文件管理)                  │
├─────────────────────────────────────────────────────────────┤
│  Storage: /tmp/video-transcriber/{session_id}/             │
│  ├── audio/               (提取的音频文件)                  │
│  ├── frames/              (关键帧截图)                      │
│  └── output/              (生成的文稿)                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 目录结构

```
video-transcriber/
├── frontend/                    # Next.js 前端
│   ├── app/
│   │   ├── page.tsx            # 主页
│   │   ├── result/page.tsx     # 结果页
│   │   └── api/               # API 代理 (可选)
│   ├── components/
│   │   ├── VideoInput.tsx
│   │   ├── TranscriptView.tsx
│   │   ├── ArticleView.tsx
│   │   └── PDFExport.tsx
│   └── lib/
│       └── api.ts
├── backend/                    # Fastify 后端
│   ├── src/
│   │   ├── index.ts           # 入口文件
│   │   ├── routes/
│   │   │   ├── parse.ts
│   │   │   ├── transcribe.ts
│   │   │   ├── article.ts
│   │   │   └── download.ts
│   │   ├── services/
│   │   │   ├── LinkParserService.ts
│   │   │   ├── FFmpegService.ts
│   │   │   ├── ASRService.ts
│   │   │   ├── LLMService.ts
│   │   │   └── FileService.ts
│   │   └── types/
│   │       └── index.ts
│   └── package.json
└── docker-compose.yml
```

---

## 五、核心功能实现方案

### 5.1 视频链接解析 (FR1.1 - FR1.2)

**功能：** 解析 B站、抖音、YouTube、微信视频号等平台链接，提取元数据

**技术方案：**

| 平台 | 解析方式 | 关键技术 |
|------|----------|----------|
| B站 | 非官方 API + 网页抓取 | playurl API、OG 标签解析 |
| YouTube | ytdl-core | getInfo API |
| 抖音/视频号 | 网页 Meta 解析 | OpenGraph 标签 |

**接口设计：**

```typescript
// POST /api/parse-link
Request:  { url: string }
Response: {
  success: boolean,
  data: {
    title: string,       // 视频标题
    thumbnail: string,   // 封面图 URL
    duration: number,    // 时长(秒)
    platform: string,    // 平台名
    videoUrl: string     // 原始视频 URL
  },
  error?: string
}
```

### 5.2 音视频转写 (FR2.1)

**功能：** 将视频音频转换为带毫秒级时间戳的原始文本

**技术流程：**

```
视频 URL → FFmpeg 音频提取 → ASR API 转写 → 时间戳对齐
```

**关键技术 - FFmpeg 音频提取：**

```bash
ffmpeg -i "video.mp4" -vn -acodec libmp3lame -q:a 2 audio.mp3
# -vn: 禁用视频流
# -acodec libmp3lame: MP3 编码
# -q:a 2: 高质量 (128kbps)
```

**输出格式：**

```json
{
  "segments": [
    {
      "start": 0.0,
      "end": 5.5,
      "text": "大家好，欢迎来到本期节目"
    }
  ]
}
```

### 5.3 说话人分离 (FR2.2)

**功能：** 自动区分不同说话人，标记为"发言人 A"、"发言人 B"

**技术方案：**

| 方案 | 服务商 | 特点 |
|------|--------|------|
| 云服务 | 阿里云/腾讯云 ASR | 内置说话人分离，中文优化 |
| 自部署 | pyannote-audio | 开源可控，需 GPU |

**输出格式：**

```json
{
  "speakerSegments": [
    {
      "start": 0.0,
      "end": 30.5,
      "speaker": "发言人A",
      "text": "大家好，欢迎来到本期节目..."
    }
  ]
}
```

### 5.4 智能图文生成 (FR2.4)

**功能：** 基于逐字稿生成书面化文章，自动插入关键帧图片

**LLM Prompt 设计：**

```
你是一位专业编辑，请将以下口语化逐字稿转换为书面化文章：

要求：
1. 删除语气词（嗯、啊、这个、那个...）
2. 合理断句，优化阅读体验
3. 标注需要插入图片的位置 [IMAGE: 描述内容]
4. 保留核心信息和观点
5. 分段清晰，有小标题

原文：
{transcript}

请直接返回处理后的文章内容。
```

**关键帧提取流程：**

```
视频 → FFmpeg 场景检测 → 选取关键帧 → 返回路径列表
```

```bash
ffmpeg -i video.mp4 -vf "select='eq(pict_type,I)+gt(scene,0.1)',showinfo" -vsync vfr frames_%03d.jpg
```

**输出格式：**

```json
{
  "article": "文章内容（包含 [IMAGE: 描述] 标签）...",
  "frames": [
    { "path": "/tmp/xxx/frames/001.jpg", "description": "主持人开场" },
    { "path": "/tmp/xxx/frames/002.jpg", "description": "产品展示" }
  ]
}
```

### 5.5 信息结构化提取 (FR3.1)

**功能：** 从文稿中自动识别核心观点、行动项、数据事实

**LLM Prompt 设计：**

```
请从以下会议记录中提取结构化信息，返回 JSON 格式：

{
  "core_points": ["核心观点1", "核心观点2"],
  "action_items": [{"task": "任务描述", "owner": "负责人", "deadline": "日期"}],
  "data_facts": ["数据/事实1", "数据/事实2"]
}

原文：
{transcript}

只返回 JSON，不要其他内容。
```

---

## 六、本地文件管理方案

### 6.1 FileService 实现

```typescript
// FileService.ts
import * as fs from 'fs/promises';
import * as path from 'path';

const BASE_DIR = process.env.STORAGE_BASE_DIR || '/tmp/video-transcriber';

export class FileService {
  // 创建会话目录结构
  async createSessionDir(sessionId: string): Promise<string> {
    const dir = path.join(BASE_DIR, sessionId);
    await fs.mkdir(path.join(dir, 'audio'), { recursive: true });
    await fs.mkdir(path.join(dir, 'frames'), { recursive: true });
    await fs.mkdir(path.join(dir, 'output'), { recursive: true });
    return dir;
  }

  // 获取会话目录
  getSessionDir(sessionId: string): string {
    return path.join(BASE_DIR, sessionId);
  }

  // 清理会话文件（关闭页面时调用）
  async cleanupSession(sessionId: string): Promise<void> {
    const dir = path.join(BASE_DIR, sessionId);
    await fs.rm(dir, { recursive: true, force: true });
  }

  // 定时清理（24小时前的临时文件）
  scheduleCleanup(): void {
    setInterval(async () => {
      try {
        const entries = await fs.readdir(BASE_DIR);
        const now = Date.now();
        for (const entry of entries) {
          const fullPath = path.join(BASE_DIR, entry);
          const stat = await fs.stat(fullPath);
          if (now - stat.mtimeMs > 24 * 60 * 60 * 1000) {
            await fs.rm(fullPath, { recursive: true, force: true });
            console.log(`Cleaned up old session: ${entry}`);
          }
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 60 * 60 * 1000); // 每小时执行
  }
}
```

### 6.2 目录结构示例

```
/tmp/video-transcriber/
├── sess_abc123/
│   ├── audio/
│   │   └── extracted.mp3
│   ├── frames/
│   │   ├── frame_001.jpg
│   │   ├── frame_002.jpg
│   │   └── frame_003.jpg
│   └── output/
│       ├── transcript.json
│       ├── article.md
│       └── structured_info.json
├── sess_def456/
│   └── ...
```

---

## 七、API 接口设计

### 7.1 视频链接解析

```
POST /api/parse-link
Content-Type: application/json

Request:
{ "url": "https://www.bilibili.com/video/BVxxx" }

Response:
{
  "success": true,
  "data": {
    "title": "视频标题",
    "thumbnail": "https://example.com/thumb.jpg",
    "duration": 3600,
    "platform": "bilibili",
    "videoUrl": "https://example.com/video.mp4"
  }
}
```

### 7.2 音频转写

```
POST /api/transcribe
Content-Type: application/json

Request:
{
  "sessionId": "sess_abc123",
  "videoUrl": "https://example.com/video.mp4"
}

Response:
{
  "success": true,
  "data": {
    "transcript": [
      {
        "start": 0.0,
        "end": 5.5,
        "speaker": "发言人A",
        "text": "大家好，欢迎来到本期节目"
      }
    ],
    "audioPath": "/tmp/video-transcriber/sess_abc123/audio/extracted.mp3"
  }
}
```

### 7.3 文章生成

```
POST /api/generate-article
Content-Type: application/json

Request:
{
  "sessionId": "sess_abc123",
  "transcript": "原始逐字稿文本..."
}

Response:
{
  "success": true,
  "data": {
    "article": "生成的书面化文章（包含 [IMAGE: 描述] 标签）...",
    "frames": [
      { "path": "/tmp/.../frame_001.jpg", "description": "开场画面" }
    ]
  }
}
```

### 7.4 信息提取

```
POST /api/extract-info
Content-Type: application/json

Request:
{
  "transcript": "会议逐字稿内容..."
}

Response:
{
  "success": true,
  "data": {
    "core_points": ["核心观点1", "核心观点2"],
    "action_items": [
      { "task": "完成报告", "owner": "张三", "deadline": "2026-04-15" }
    ],
    "data_facts": ["Q1营收增长20%", "用户突破100万"]
  }
}
```

### 7.5 文件下载

```
GET /api/download/:type?sessionId=sess_abc123

Type 可选值：
- transcript: 逐字稿 (TXT)
- transcript-docx: 逐字稿 (Word)
- article: 智能图文 (MD)
- article-pdf: 智能图文 (PDF)
```

---

## 八、环境变量配置

```bash
# .env

# ============ 存储配置 ============
STORAGE_BASE_DIR=/tmp/video-transcriber

# ============ 阿里云语音识别 ============
ALIYUN_ACCESS_KEY=your_access_key
ALIYUN_ACCESS_SECRET=your_access_secret

# ============ 通义千问 ============
DASHSCOPE_API_KEY=your_api_key

# ============ 服务器配置 ============
PORT=3001
HOST=0.0.0.0
```

---

## 九、部署方案

### 9.1 Docker Compose 配置

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
      - ALIYUN_ACCESS_KEY=${ALIYUN_ACCESS_KEY}
      - ALIYUN_ACCESS_SECRET=${ALIYUN_ACCESS_SECRET}
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
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

### 9.2 FFmpeg 安装

Docker 镜像需包含 FFmpeg：

```dockerfile
FROM node:20-slim

# 安装 FFmpeg
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

## 十、技术选型总结

| 模块 | 推荐方案 | 部署方式 |
|------|----------|----------|
| **前端框架** | Next.js 14 + Tailwind + Zustand | Vercel / 任意 Node 主机 |
| **后端框架** | Fastify 单体 | Docker 容器 |
| **ASR 服务** | 阿里云语音识别 / 腾讯云 ASR | 云服务 API |
| **LLM 服务** | 通义千问 Qwen-Max | 云服务 API |
| **文件存储** | 本地文件系统 | Docker 持久化卷 |
| **PDF 生成** | @react-pdf/renderer | 纯前端 |
| **音视频处理** | FFmpeg | Docker 内置 |

---

## 十一、关键风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| 平台 API 变更 | 链接解析失败 | 预留解析器抽象接口，快速替换 |
| ASR 准确率不足 | 方言/噪音环境 | 提供"人工校正"入口 |
| 视频下载版权 | 法律风险 | 仅处理公开视频，添加水印 |
| 处理时间过长 | 用户流失 | 实时进度推送 + 预估时间 |
| 本地存储满 | 服务不可用 | 定时清理 + 容量监控 |
| 大模型 API 限流 | 处理失败 | 重试机制 + 降级方案 |
