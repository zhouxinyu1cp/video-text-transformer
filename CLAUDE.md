# 视频智能文稿生成器

你是一名资深的TypeScript工程师，你的目标是高质量完成本项目的研发交付。

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + Radix UI
- **状态管理**: Zustand
- **PDF 生成**: @react-pdf/renderer
- **视频预览**: react-player

### 后端
- **框架**: Fastify (Node.js 20 LTS)
- **ASR**: nodejs-whisper (本地 Whisper 模型，base 模型)
  - 基于 whisper.cpp 的 Node.js 封装，纯本地推理
  - 首次运行自动下载模型，无需手动配置
  - 无 API 费用，完全离线可用
- **LLM**: MiniMax 大模型
- **Word生成**: docx 库 (生成真正的 .docx 文件)
- **存储**: 本地文件系统 `/tmp/video-transcriber/`

## 项目结构

```
视频智能文稿生成器/          # Monorepo 根目录
├── package.json          # Workspaces 配置
│
├── shared/               # 共享类型定义（前后端共用）
│   └── types/
│       └── index.ts      # Platform, VideoMeta, TranscriptSegment, SpeakerMap,
│                         # Frame, ExtractionResult, FactItem, ActionItem 等类型
│
frontend/                  # Next.js 前端
├── app/                  # App Router 页面
│   ├── page.tsx          # 主页（视频链接输入）
│   ├── layout.tsx        # 根布局
│   ├── globals.css       # 全局样式
│   └── result/
│       └── page.tsx      # 结果页（文稿 + 图文）
├── components/            # UI 组件
│   ├── video-input/      # 视频输入
│   │   ├── VideoInputForm.tsx
│   │   └── VideoMetaCard.tsx
│   ├── transcript/       # 逐字稿
│   │   ├── TranscriptView.tsx
│   │   ├── TranscriptSegment.tsx
│   │   ├── SpeakerTag.tsx
│   │   └── TranscriptToolbar.tsx
│   ├── article/          # 智能图文
│   │   ├── ArticleView.tsx
│   │   ├── ArticleRenderer.tsx
│   │   ├── ArticlePDF.tsx
│   │   └── FrameGallery.tsx
│   ├── extraction/        # 信息提取
│   │   ├── ExtractionPanel.tsx
│   │   └── ExtractionCard.tsx
│   └── ui/               # 基础 UI 组件（基于 Radix）
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Dialog.tsx
│       ├── Tabs.tsx
│       ├── Spinner.tsx
│       └── Toast.tsx
├── lib/                   # 工具函数
│   ├── api.ts            # API 调用封装
│   ├── download.ts       # 文件下载工具
│   └── utils.ts          # 通用工具函数
├── stores/                # Zustand 状态管理
│   └── useAppStore.ts    # 全局状态
└── types/                 # 前端专有类型（如有）

backend/                    # Fastify 后端
├── src/
│   ├── index.ts          # 入口文件
│   ├── app.ts            # Fastify 实例配置
│   ├── routes/            # API 路由
│   │   ├── parse.ts          # POST /api/parse-link
│   │   ├── transcribe.ts     # POST /api/transcribe
│   │   ├── generate-article.ts  # POST /api/generate-article
│   │   ├── extract-info.ts   # POST /api/extract-info
│   │   └── download.ts       # GET /api/download/:type, 图片代理 /api/proxy/image
│   ├── services/          # 业务逻辑模块
│   │   ├── LinkParserService.ts  # 视频链接解析
│   │   ├── FFmpegService.ts     # 音频提取、关键帧截取
│   │   ├── ASRService.ts         # 语音识别（nodejs-whisper）
│   │   ├── LLMService.ts        # 大模型服务
│   │   └── FileService.ts       # 文件管理
│   ├── types/             # 后端专有类型
│   └── utils/             # 工具函数
├── package.json
└── .env.example
```

## 运行时目录结构

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

## 关键约定

1. **前后端通信**: REST API
2. **状态管理**: Zustand（前端），无 context 嵌套
3. **PDF 生成**: 纯前端 `@react-pdf/renderer`，减轻后端压力
4. **文件存储**: 会话级本地存储，sessionId 隔离
5. **服务模块**: 优先函数式设计，无继承
6. **共享类型**: 前后端共用类型定义在 `shared/types/index.ts`
7. **图片URL**: 必须使用完整后端URL（包含 http://localhost:3001），避免前端相对路径解析错误
8. **跨域图片**: 通过 `/api/proxy/image` 代理，避免浏览器 CORB 阻塞

## 构建

### 前端构建
```bash
cd frontend
npm install
npm run build      # 生产构建
npm run dev        # 开发模式
npm run start       # 生产预览
```

### 后端构建
```bash
cd backend
npm install
npm run build      # TypeScript 编译
npm run dev        # 开发模式 (tsx watch)
npm run start       # 生产模式
```

## 部署

### Docker Compose（一键部署）

```bash
docker-compose up --build
```

```yaml
# docker-compose.yml
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

### 前端部署 (Vercel)

```bash
npm i -g vercel
cd frontend
vercel deploy
```

**环境变量**:
- `NEXT_PUBLIC_API_URL` - 后端 API 地址 (如 `https://api.example.com`)

### 后端部署

#### 方案一：PM2 + Node.js

```bash
cd backend
npm run build
pm2 start dist/index.js --name video-transcriber-api
```

#### 方案二：Docker

```dockerfile
# backend/Dockerfile
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

```bash
docker build -t video-transcriber-api ./backend
docker run -d -p 3001:3001 \
  -v /tmp/video-transcriber:/tmp/video-transcriber \
  video-transcriber-api
```

### 环境变量

**后端必需环境变量**:
| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PORT` | 服务端口 | `3001` |
| `HOST` | 服务地址 | `0.0.0.0` |
| `STORAGE_BASE_DIR` | 文件存储根目录 | `/tmp/video-transcriber` |
| `MINIMAX_API_KEY` | MiniMax API Key (LLM) | - |
| `MINIMAX_GROUP_ID` | MiniMax Group ID (LLM) | - |
| `FRONTEND_URL` | 前端地址 (CORS) | `http://localhost:3000` |
| `API_BASE_URL` | 后端API地址（生成图片URL用） | `http://localhost:3001` |

**前端环境变量**:
| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `http://localhost:3001` |

## AI协作指令

1. **当要添加新功能时**: 你应该先`@`相关代码文件，理解现有逻辑，再以列表形式提出你的计划，待我审查后再开始编码实现。
2. **测试先行铁律**: 所有新功能或Bug修复，都必须从编写一个（或多个）失败的测试开始。
3. **代码解释**: 生成复杂的代码段后，请用注释(或在对话中)，解释其核心逻辑和设计思想。

## TDD 执行指南

### Red-Green-Refactor 循环

```
┌─────────────────────────────────────────────────────────┐
│  1. Red    │ 编写一个失败的测试（描述期望行为）          │
├─────────────────────────────────────────────────────────┤
│  2. Green  │ 只写最少量代码使测试通过                    │
├─────────────────────────────────────────────────────────┤
│  3. Refactor │ 重构代码，消除重复，提升清晰度            │
└─────────────────────────────────────────────────────────┘
```

### 表格驱动测试模板

```typescript
describe('LinkParserService', () => {
  const testCases = [
    {
      name: 'B站视频链接',
      url: 'https://www.bilibili.com/video/BV1xx411c7mD',
      expected: { platform: 'bilibili', videoId: 'BV1xx411c7mD' }
    },
    {
      name: '抖音视频链接',
      url: 'https://www.douyin.com/video/7123456789012345678',
      expected: { platform: 'douyin', videoId: '7123456789012345678' }
    },
    // 更多测试用例...
  ];

  testCases.forEach(({ name, url, expected }) => {
    it(`应正确解析: ${name}`, () => {
      const result = LinkParserService.parse(url);
      expect(result.platform).toBe(expected.platform);
      expect(result.videoId).toBe(expected.videoId);
    });
  });
});
```

### 测试策略

- **集成测试优先**: 优先使用真实依赖（文件系统、实际 API 调用）
- **Mock 策略**: 仅在外部服务不可用时使用 Mock（如 MiniMax LLM 可用时用真实集成测试）
- **测试数据**: 使用公开可访问的视频链接进行真实集成测试
