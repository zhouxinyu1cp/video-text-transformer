# 视频智能文稿生成器

一款**无需登录、即用即走**的在线工具，解析主流视频平台链接，一键生成带说话人标签的逐字稿与可发布的智能图文。

## 功能特性

- **视频解析**: 支持 B站、抖音、YouTube、视频号
- **语音转写**: 音频提取 + ASR 转写，带毫秒级时间戳
- **说话人分离**: 自动区分说话人，支持重命名标签
- **文稿输出**: 逐字稿预览、复制、下载（TXT/Word(.docx)）
- **智能图文**: LLM 优化文章 + 关键帧配图
- **信息提取**: 结构化提取核心观点、行动项、数据事实
- **图片代理**: 后端代理跨域图片，避免 CORB 阻塞

## 快速开始

### 前置要求

- Node.js >= 20.0.0
- npm >= 9.0.0
- FFmpeg (用于音视频处理)
- @whisper/nodejs 模型文件 (首次运行自动下载)

### 开发模式

```bash
# 安装依赖
npm install

# 启动后端 (端口 3001)
cd backend && npm run dev

# 启动前端 (端口 3000)
cd frontend && npm run dev
```

访问 http://localhost:3000

### Docker 部署

```bash
# 构建并启动
docker-compose up --build

# 后台运行
docker-compose up -d
```

访问 http://localhost:3000

### 环境变量

**后端环境变量** (复制 `backend/.env.example` 为 `backend/.env`):

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `MINIMAX_API_KEY` | MiniMax API Key (LLM) | 是 |
| `MINIMAX_GROUP_ID` | MiniMax Group ID (LLM) | 是 |
| `PORT` | 服务端口 (默认 3001) | 否 |
| `HOST` | 服务地址 (默认 0.0.0.0) | 否 |
| `STORAGE_BASE_DIR` | 文件存储目录 | 否 |
| `FRONTEND_URL` | 前端地址 (CORS) | 否 |
| `API_BASE_URL` | 后端 API 地址 (生成图片URL用) | 否 |

**前端环境变量**:

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | http://localhost:3001 |

## 测试

### 运行所有测试

```bash
# 运行前后端所有测试
npm test --workspaces --if-present

# 仅运行后端测试
cd backend && npm test

# 仅运行前端测试
cd frontend && npm test
```

### 测试覆盖

| 模块 | 测试数 | 状态 |
|------|--------|------|
| Backend Services | 35 | ✅ |
| Backend Routes | 15 | ✅ |
| Frontend Components | 23 | ✅ |
| Frontend Store | 8 | ✅ |
| **总计** | **91** | ✅ |

> 注：后端单元测试共 57 个，覆盖 LinkParserService、FileService、ASRService、LLMService、FFmpegService、下载路由等核心模块。

### E2E 测试

```bash
# 安装 Playwright 浏览器
npx playwright install chromium

# 运行 E2E 测试
npx playwright test
```

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + Radix UI
- **状态管理**: Zustand
- **PDF 生成**: @react-pdf/renderer

### 后端
- **框架**: Fastify (Node.js 20 LTS)
- **ASR**: nodejs-whisper (本地 Whisper 模型，base 模型)
  - 首次运行自动下载模型
  - 无需 API 费用，离线可用
- **LLM**: MiniMax 大模型
- **存储**: 本地文件系统

## 项目结构

```
视频智能文稿生成器/
├── frontend/                  # Next.js 前端
│   ├── app/                  # App Router 页面
│   │   ├── page.tsx          # 主页（视频链接输入）
│   │   ├── layout.tsx       # 根布局
│   │   └── result/
│   │       └── page.tsx     # 结果页
│   ├── components/           # UI 组件
│   │   ├── video-input/     # 视频输入
│   │   ├── transcript/       # 逐字稿
│   │   ├── article/          # 智能图文
│   │   ├── extraction/       # 信息提取
│   │   └── ui/              # 基础组件
│   ├── stores/              # Zustand 状态
│   ├── lib/                 # 工具函数
│   └── public/              # 静态资源
│
├── backend/                  # Fastify 后端
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务服务
│   │   └── types/           # 类型定义
│   ├── tests/               # 集成测试
│   └── e2e/                # E2E 测试
│
├── shared/                  # 共享类型
│   └── types/
│       └── index.ts         # TypeScript 类型
│
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## API 接口

详细 API 文档请参考 [spec/api.md](spec/api.md)。

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/parse-link` | 解析视频链接，获取视频元数据 |
| POST | `/api/transcribe` | 音频转写 (SSE 流式) |
| POST | `/api/generate-article` | 生成智能图文 (SSE 流式) |
| POST | `/api/extract-info` | 结构化信息提取 |
| GET | `/api/download/:type` | 文件下载 (txt/word/pdf) |
| GET | `/api/files/:sessionId/frames/:filename` | 获取抽帧图片 |
| GET | `/api/proxy/image` | 图片代理 (解决跨域/CORB) |

## 部署

### Vercel (前端)

```bash
cd frontend
vercel deploy
```

### PM2 (后端)

```bash
cd backend
npm run build
pm2 start dist/index.js --name video-transcriber-api
```

### Docker

```bash
# 仅后端
docker build -t video-transcriber-api ./backend
docker run -d -p 3001:3001 \
  -v /tmp/video-transcriber:/tmp/video-transcriber \
  -e MINIMAX_API_KEY=your_minimax_key \
  -e MINIMAX_GROUP_ID=your_minimax_group_id \
  video-transcriber-api

# 完整部署
docker-compose up --build
```

## 运行时目录结构

```
/tmp/video-transcriber/
└── {sessionId}/
    ├── audio/
    │   └── extracted.mp3
    ├── frames/
    │   └── frame_001.jpg
    └── output/
        ├── transcript.json
        ├── article.md
        └── structured_info.json
```

## License

MIT
