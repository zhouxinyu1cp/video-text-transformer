# 技术方案规划：视频智能文稿生成器

**版本：** 1.0
**日期：** 2026年3月31日

---

## 1. 技术上下文总结

### 1.1 技术选型

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **前端框架** | React 18 + TypeScript | 主流选择，类型安全 |
| **UI组件库** | Ant Design 5 | 企业级组件，配置化能力强 |
| **状态管理** | React Context API | 轻量，无需引入额外依赖 |
| **后端框架** | Python FastAPI | 高性能异步，自动化API文档 |
| **数据库** | SQLite | 单体架构首选，零配置 |
| **任务队列** | FastAPI BackgroundTasks | 满足异步处理需求 |
| **音视频处理** | FFmpeg | 行业标准 |
| **关键帧提取** | OpenCV | 本地场景切换检测 |
| **ASR服务** | 腾讯云ASR | 云服务集成 |
| **LLM服务** | 腾讯混元/DeepSeek | 文本优化与信息提取 |

### 1.2 核心设计原则

- **单体优先**：后端采用单体架构，简化部署与运维
- **本地存储**：所有用户数据仅存在于当次会话，关闭即清除
- **轻量抽象**：仅在必要时引入抽象层，避免过度设计
- **安全第一**：路径隔离、任务校验、防路径遍历

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 视频输入  │  │ 文稿预览  │  │ 图文生成  │  │ 信息提取  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       └─────────────┴─────────────┴─────────────┘          │
│                           │                                 │
│                    REST API / WebSocket                     │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                     后端 (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   API Routes                         │   │
│  │  /task          /task/{id}/status      /download/*  │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                    │
│  ┌─────────────────────┴───────────────────────────────┐   │
│  │              Background Task Processor               │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐ │   │
│  │  │下载视频  │→ │音频提取  │→ │ASR转写  │→ │LLM处理 │ │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └───────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────┴───────────────────────────┐   │
│  │              SQLite (tasks表)                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│              /app/data/tasks/{task_id}/                    │
│              ├── input/ (视频/音频)                         │
│              └── output/ (文稿/图片)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 项目结构

### 3.1 前端工程结构

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── main.tsx                 # 应用入口
│   ├── App.tsx                  # 根组件
│   ├── index.css                # 全局样式
│   │
│   ├── api/                     # API调用层
│   │   └── taskApi.ts          # 任务相关API封装
│   │
│   ├── components/              # UI组件
│   │   ├── VideoInput/         # 视频链接输入
│   │   │   ├── VideoInput.tsx
│   │   │   └── VideoInput.css
│   │   ├── TaskStatus/        # 任务状态展示
│   │   │   ├── TaskStatus.tsx
│   │   │   └── TaskStatus.css
│   │   ├── TranscriptViewer/   # 逐字稿查看器
│   │   │   ├── TranscriptViewer.tsx
│   │   │   └── TranscriptViewer.css
│   │   ├── ArticlePreview/     # 智能图文预览
│   │   │   ├── ArticlePreview.tsx
│   │   │   └── ArticlePreview.css
│   │   ├── InfoExtractor/      # 信息提取面板
│   │   │   ├── InfoExtractor.tsx
│   │   │   └── InfoExtractor.css
│   │   └── common/             # 通用组件
│   │       ├── Loading.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── DownloadButton.tsx
│   │
│   ├── context/                # 状态管理
│   │   └── TaskContext.tsx     # 任务状态上下文
│   │
│   ├── hooks/                  # 自定义Hooks
│   │   ├── useTaskStatus.ts    # 轮询任务状态
│   │   └── useDownload.ts      # 文件下载处理
│   │
│   ├── types/                  # TypeScript类型定义
│   │   └── index.ts            # 任务状态、API响应类型
│   │
│   └── utils/                  # 工具函数
│       ├── formatTime.ts       # 时间戳格式化
│       └── downloadFile.ts      # 文件下载工具
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### 3.2 后端工程结构

```
backend/
├── app/
│   ├── main.py                  # FastAPI应用入口
│   ├── config.py                # 配置管理
│   │
│   ├── api/                     # API路由
│   │   ├── __init__.py
│   │   ├── task.py             # 任务相关路由
│   │   └── download.py         # 文件下载路由
│   │
│   ├── core/                    # 核心业务逻辑
│   │   ├── __init__.py
│   │   ├── task_manager.py     # 任务管理器(状态更新)
│   │   └── cleanup.py           # 定时清理脚本
│   │
│   ├── services/                # 服务层(业务处理)
│   │   ├── __init__.py
│   │   ├── video_downloader.py  # 视频下载
│   │   ├── audio_extractor.py   # 音频提取
│   │   ├── transcriber.py       # ASR转写
│   │   ├── text_processor.py    # LLM文本处理
│   │   └── keyframe_extractor.py # 关键帧提取
│   │
│   ├── models/                  # 数据模型
│   │   ├── __init__.py
│   │   └── task.py             # Task数据模型
│   │
│   ├── db/                      # 数据库
│   │   ├── __init__.py
│   │   ├── database.py        # SQLite连接
│   │   └── tasks.db            # SQLite数据库文件
│   │
│   └── utils/                   # 工具函数
│       ├── __init__.py
│       ├── file_utils.py       # 文件操作
│       └── path_utils.py       # 路径安全校验
│
├── data/                        # 数据存储目录
│   └── tasks/                   # 任务文件存储
│
├── requirements.txt
└── run.py                      # 启动脚本
```

---

## 4. 核心功能模块设计

### 4.1 前端模块

| 模块 | 职责 | 关键实现 |
|------|------|----------|
| **VideoInput** | 链接输入与验证 | 正则校验、显示元数据(标题/封面/时长) |
| **TaskStatus** | 处理状态展示 | 轮询status接口，进度百分比展示 |
| **TranscriptViewer** | 逐字稿展示 | 时间戳跳转、说话人标签重命名 |
| **ArticlePreview** | 智能图文预览 | Markdown渲染、图片展示 |
| **InfoExtractor** | 结构化信息提取 | 卡片列表、在线编辑 |

### 4.2 后端模块

| 模块 | 职责 | 关键实现 |
|------|------|----------|
| **video_downloader** | 下载视频/提取音频 | 调用ffmpeg-python，支持多平台 |
| **audio_extractor** | 音频分离 | ffmpeg -i input.mp4 -vn -acodec pcm_s16le |
| **transcriber** | ASR转写 | 调用腾讯云ASR API |
| **text_processor** | 文本优化+结构化提取 | 调用LLM API，提示词工程 |
| **keyframe_extractor** | 关键帧提取 | OpenCV场景切换检测 |

---

## 5. API设计

### 5.1 任务接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/task` | 创建任务，提交视频链接 |
| GET | `/api/task/{task_id}` | 获取任务详情与状态 |
| GET | `/api/task/{task_id}/status` | 轮询状态(含进度) |
| DELETE | `/api/task/{task_id}` | 删除任务(清理文件) |

### 5.2 文件接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/download/{task_id}/{filename}` | 下载生成文件 |

### 5.3 响应格式

```typescript
// 创建任务响应
interface TaskCreateResponse {
  task_id: string;
  status: "pending" | "processing" | "success" | "failed";
  video_meta: {
    title: string;
    cover_url: string;
    duration: number;
  };
}

// 状态轮询响应
interface TaskStatusResponse {
  task_id: string;
  status: string;
  progress: number;        // 0-100
  current_step: string;     // "downloading" | "transcribing" | "processing" | "extracting"
  error?: string;
}

// 任务结果响应
interface TaskResultResponse {
  task_id: string;
  status: "success";
  transcript: {
    raw_text: string;
    segments: Array<{
      start: number;       // 毫秒
      end: number;
      speaker: string;
      text: string;
    }>;
    speakers: string[];
  };
  article: {
    title: string;
    content: string;       // Markdown格式
    images: string[];      // 图片URL列表
  };
  structured: {
    key_points: string[];
    action_items: string[];
    data_facts: string[];
  };
}
```

---

## 6. 数据库设计

### 6.1 tasks表

```sql
CREATE TABLE tasks (
    task_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    current_step TEXT,
    video_url TEXT NOT NULL,
    video_meta TEXT,              -- JSON: title, cover, duration
    result_data TEXT,              -- JSON: transcript, article, structured
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    expires_at DATETIME NOT NULL   -- 创建后24小时过期
);
```

---

## 7. 文件存储结构

```
/app/data/tasks/{task_id}/
├── input/
│   ├── video.mp4                 # 原始视频(可选)
│   └── audio.wav                 # 提取的音频
├── output/
│   ├── transcript.txt            # 原始逐字稿
│   ├── transcript.docx           # Word版本
│   ├── article.md                # 优化后文章
│   ├── article.pdf               # PDF版本(含图片)
│   └── keyframes/
│       ├── 001.jpg
│       ├── 002.jpg
│       └── 003.jpg
```

---

## 8. 安全设计

### 8.1 文件访问控制

- 所有文件通过 `/api/download/{task_id}/{filename}` 访问
- 后端校验 `task_id` 存在且未过期
- 使用 `task_id` 作为目录名，禁止用户自定义路径
- 文件名经过sanitize，防止路径遍历

### 8.2 数据清理机制

- 任务创建时设置 `expires_at` = 创建时间 + 24小时
- 后台定时任务(每小时)清理过期数据
- 删除数据库记录前先删除对应文件目录

---

## 9. 部署架构

### 9.1 单机部署

```
                    ┌─────────────┐
   User ───────────►│   Nginx     │
                    │   (80/443)  │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
      ┌───────────────┐         ┌───────────────┐
      │  Frontend      │         │  Backend       │
      │  (Vite/静态)   │         │  (FastAPI)     │
      │  :5173         │         │  :8000         │
      └───────────────┘         └───────────────┘
                                         │
                                ┌────────┴────────┐
                                │                 │
                                ▼                 ▼
                         ┌──────────┐      ┌──────────┐
                         │  SQLite  │      │  /app/   │
                         │  tasks.db│      │  data/   │
                         └──────────┘      └──────────┘
```

### 9.2 环境变量

```bash
# 后端
DATABASE_URL=sqlite:///./app/db/tasks.db
ASR_API_KEY=xxx
ASR_APP_ID=xxx
LLM_API_KEY=xxx
LLM_API_URL=xxx
FFMPEG_PATH=/usr/bin/ffmpeg

# 前端
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 10. 开发阶段规划

| 阶段 | 里程碑 | 交付物 |
|------|--------|--------|
| **Phase 1** | 基础框架搭建 | 前端脚手架、后端框架、API基础接口 |
| **Phase 2** | 核心流程打通 | 视频下载→音频提取→ASR转写全流程 |
| **Phase 3** | 逐字稿功能 | 说话人分离、文稿展示、下载功能 |
| **Phase 4** | 智能图文 | LLM优化、关键帧提取、PDF生成 |
| **Phase 5** | 信息提取 | 结构化信息提取与展示 |
| **Phase 6** | 完善与测试 | 清理机制、安全加固、验收测试 |

---

## 11. 技术约束与注意事项

1. **FFmpeg必须预装**：服务器环境需安装ffmpeg并加入PATH
2. **ASR/LLM对接**：通过环境变量配置API凭证，支持快速切换服务商
3. **前端仅做预览**：不做复杂编辑，编辑功能通过下载后处理
4. **无状态设计**：后端不保存用户会话信息，每次访问均为全新会话
5. **文件临时性**：所有文件设置过期时间，前端不依赖持久化链接
