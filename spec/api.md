# 视频智能文稿生成器 - API 接口文档

**版本：** 1.0
**日期：** 2026年3月31日
**状态：** 初稿

---

## 一、概述

### 1.1 文档目的

本文档定义视频智能文稿生成器前后端交互的 API 接口规范、共享数据类型及前端状态结构。

### 1.2 基础信息

| 项目 | 说明 |
|------|------|
| 前端地址 | `http://localhost:3000` |
| 后端地址 | `http://localhost:3001` |
| 通信协议 | REST + JSON |
| 认证方式 | 无（无需登录） |
| Session 管理 | 通过 `sessionId` 追踪会话，仅存在于浏览器内存 |

---

## 二、共享数据类型

### 2.1 视频平台枚举

```typescript
type Platform = 'bilibili' | 'douyin' | 'youtube' | 'wechat_video';
```

### 2.2 视频元数据

```typescript
interface VideoMeta {
  platform: Platform;           // 视频平台
  videoUrl: string;             // 原始视频链接
  title: string;                // 视频标题
  thumbnail: string;            // 封面图 URL
  duration: number;             // 视频时长（秒）
  author?: string;              // 作者/UP主（可选）
}
```

### 2.3 转写片段

```typescript
interface TranscriptSegment {
  id: string;                   // 片段唯一 ID，格式：seg_001, seg_002...
  startTime: number;           // 开始时间（毫秒）
  endTime: number;             // 结束时间（毫秒）
  text: string;                // 转写文本
  speakerId: string;           // 说话人 ID，格式：spk_001, spk_002...
  confidence?: number;         // 置信度 0-1（可选）
}
```

### 2.4 说话人映射

```typescript
interface SpeakerMap {
  [speakerId: string]: string;  // speakerId -> 显示名称
  // 示例: { "spk_001": "主持人", "spk_002": "嘉宾" }
}
```

### 2.5 关键帧

```typescript
interface Frame {
  id: string;                   // 帧唯一 ID，格式：frame_001, frame_002...
  timestamp: number;            // 在视频中的时间戳（秒）
  imageUrl: string;             // 帧图片 URL（完整后端 URL）
  description?: string;         // 帧描述（可选）
}
```

### 2.6 提取结果

```typescript
interface ExtractionResult {
  corePoints: string[];         // 核心观点/结论列表
  facts: FactItem[];            // 数据/事实列表
  actionItems: ActionItem[];    // 行动项/待办列表
}

interface FactItem {
  id: string;
  content: string;
  type: 'data' | 'fact';        // 数据型 / 事实型
}

interface ActionItem {
  id: string;
  content: string;
  assignee?: string;            // 负责人（可选）
  deadline?: string;            // 截止时间（可选）
}
```

### 2.7 逐字稿完整结构

```typescript
interface Transcript {
  videoMeta: VideoMeta;
  segments: TranscriptSegment[];
  speakerMap: SpeakerMap;
  duration: number;             // 总时长（毫秒）
  language: string;             // 语言代码，默认 "zh-CN"
  createdAt: string;            // ISO 时间戳
}
```

### 2.8 智能图文完整结构

```typescript
interface Article {
  title: string;                // 文章标题
  content: string;              // 优化后的文章正文（Markdown 格式）
  frames: Frame[];              // 关联的关键帧列表
  originalSummary?: string;     // 原文摘要（可选）
  wordCount: number;            // 字数统计
  createdAt: string;            // ISO 时间戳
}
```

### 2.9 处理状态枚举

```typescript
type ProcessingStatus =
  | 'idle'
  | 'parsing'        // 解析链接中
  | 'extracting'     // 提取音频中
  | 'transcribing'   // 转写中
  | 'separating'     // 说话人分离中
  | 'generating'     // 生成文章中
  | 'extracting_frames' // 提取关键帧中
  | 'done'
  | 'error';
```

---

## 三、API 接口

### 3.1 解析视频链接

解析输入的视频链接，获取元数据。

**请求**

```
POST /api/parse-link
Content-Type: application/json
```

```typescript
// Request Body
interface ParseLinkRequest {
  url: string;                  // 视频链接
}
```

**响应**

```
200 OK
```

```typescript
// Response Body
interface ParseLinkResponse {
  success: true;
  data: {
    sessionId: string;           // 会话 ID，用于后续请求
    videoMeta: VideoMeta;        // 视频元数据
  };
}

interface ParseLinkErrorResponse {
  success: false;
  error: {
    code: 'INVALID_URL' | 'UNSUPPORTED_PLATFORM' | 'FETCH_ERROR';
    message: string;
  };
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| `INVALID_URL` | 链接格式无效 |
| `UNSUPPORTED_PLATFORM` | 不支持的视频平台 |
| `FETCH_ERROR` | 获取视频信息失败 |

---

### 3.2 音频转写

对视频进行音频提取、ASR 转写及说话人分离。

**请求**

```
POST /api/transcribe
Content-Type: application/json
```

```typescript
// Request Body
interface TranscribeRequest {
  sessionId: string;            // 会话 ID（来自 parse-link 响应）
  videoUrl: string;             // 视频 URL
}
```

**响应**

```
200 OK
Content-Type: text/event-stream
```

```typescript
// SSE Event: progress
interface TranscribeProgressEvent {
  event: 'progress';
  data: {
    stage: ProcessingStatus;
    progress: number;           // 0-100
    message: string;            // 状态描述
  };
}

// SSE Event: done
interface TranscribeDoneEvent {
  event: 'done';
  data: {
    transcript: Transcript;
  };
}

// SSE Event: error
interface TranscribeErrorEvent {
  event: 'error';
  data: {
    code: string;
    message: string;
  };
}
```

**WebSocket 备选方案**（若 SSE 不稳定）

```
WS /api/transcribe
```

---

### 3.3 生成智能图文

基于转写结果，生成优化文章并提取关键帧。

**请求**

```
POST /api/generate-article
Content-Type: application/json
```

```typescript
// Request Body
interface GenerateArticleRequest {
  sessionId: string;            // 会话 ID
  transcript: Transcript;       // 转写结果（完整结构）
  options?: {
    articleStyle?: 'informative' | 'casual' | 'professional'; // 文章风格，默认 informative
    frameCount?: number;         // 关键帧数量，默认 4
  };
}
```

**响应**

```
200 OK
Content-Type: text/event-stream
```

```typescript
// SSE Event: progress
interface ArticleProgressEvent {
  event: 'progress';
  data: {
    stage: 'generating' | 'extracting_frames';
    progress: number;            // 0-100
    message: string;
  };
}

// SSE Event: done
interface ArticleDoneEvent {
  event: 'done';
  data: {
    article: Article;
  };
}

// SSE Event: error
interface ArticleErrorEvent {
  event: 'error';
  data: {
    code: string;
    message: string;
  };
}
```

---

### 3.4 结构化信息提取

从转写内容中提取核心观点、数据事实、行动项。

**请求**

```
POST /api/extract-info
Content-Type: application/json
```

```typescript
// Request Body
interface ExtractInfoRequest {
  sessionId: string;
  transcript: Transcript;
}
```

**响应**

```
200 OK
```

```typescript
interface ExtractInfoResponse {
  success: true;
  data: {
    extraction: ExtractionResult;
  };
}
```

---

### 3.5 文件下载

获取转写文稿或智能图文的文件形式。

**请求**

```
GET /api/download/:type?sessionId={sessionId}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | string | 文件类型：`transcript_txt` / `transcript_word` / `article_pdf` |
| `sessionId` | string | 会话 ID |

**响应**

| 类型 | Content-Type | 说明 |
|------|--------------|------|
| `transcript_txt` | `text/plain; charset=utf-8` | 纯文本格式 |
| `transcript_word` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Word 文档 |
| `article_pdf` | `application/pdf` | PDF 文档 |

**错误响应**

```
400 Bad Request
```

```typescript
{
  success: false;
  error: {
    code: 'MISSING_SESSION_ID' | 'FILE_NOT_READY' | 'UNKNOWN_TYPE';
    message: string;
  };
}
```

---

### 3.6 获取抽帧图片

获取视频处理过程中提取的关键帧图片。

**请求**

```
GET /api/files/:sessionId/frames/:filename
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `sessionId` | string | 会话 ID |
| `filename` | string | 图片文件名 |

**响应**

```
200 OK
Content-Type: image/jpeg
Cache-Control: public, max-age=31536000
```

**错误响应**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `FILE_NOT_FOUND` | 404 | 文件不存在 |

---

### 3.7 图片代理

代理外部图片请求，解决浏览器 CORB（Cross-Origin Read Blocking）问题。

**请求**

```
GET /api/proxy/image?url={encodedImageUrl}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | string | 经过 URL 编码的外部图片 URL |

**响应**

```
200 OK
Content-Type: image/jpeg (或原图类型)
Cache-Control: public, max-age=86400
Access-Control-Allow-Origin: *
```

**错误响应**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `MISSING_URL` | 400 | 缺少 url 参数 |
| `INVALID_PROTOCOL` | 400 | 非法的 URL 协议（仅允许 http/https） |
| `UPSTREAM_ERROR` | 502 | 上游图片获取失败 |
| `PROXY_ERROR` | 502 | 图片代理失败 |

**使用场景**
- 视频封面图（B站、YouTube 等外部 URL）
- 任何需要在前端页面显示的外部图片资源

---

### 3.8 健康检查

后端服务健康状态探测。

**请求**

```
GET /api/health
```

**响应**

```
200 OK
```

```typescript
interface HealthResponse {
  status: 'ok';
  version: string;
  timestamp: string;
}
```

---

## 四、前端状态结构（Zustand Store）

### 4.1 Store 接口定义

```typescript
interface AppState {
  // ===== 会话 =====
  sessionId: string | null;
  status: ProcessingStatus;
  error: string | null;

  // ===== 视频信息 =====
  videoMeta: VideoMeta | null;

  // ===== 转写结果 =====
  transcript: Transcript | null;
  speakerMap: SpeakerMap;

  // ===== 智能图文 =====
  article: Article | null;

  // ===== 信息提取 =====
  extraction: ExtractionResult | null;

  // ===== Actions =====
  setSessionId: (id: string) => void;
  setStatus: (status: ProcessingStatus) => void;
  setError: (error: string | null) => void;
  setVideoMeta: (meta: VideoMeta) => void;
  setTranscript: (transcript: Transcript) => void;
  updateSpeakerName: (speakerId: string, name: string) => void;
  setArticle: (article: Article) => void;
  setExtraction: (result: ExtractionResult) => void;
  reset: () => void;
}
```

### 4.2 Store 初始化状态

```typescript
const initialState: AppState = {
  sessionId: null,
  status: 'idle',
  error: null,
  videoMeta: null,
  transcript: null,
  speakerMap: {},
  article: null,
  extraction: null,
};
```

### 4.3 状态变更流程

```
[用户粘贴链接]
    │
    ▼
setStatus('parsing')
    │
    ▼
POST /api/parse-link
    │
  成功 → setVideoMeta(meta), setSessionId(sessionId)
  失败 → setError(message), setStatus('error')
    │
    ▼
[用户点击"开始处理"]
    │
    ▼
setStatus('transcribing')
    │
    ▼
POST /api/transcribe (SSE)
    │
  progress events → setStatus(stage)
    │
  done event → setTranscript(transcript), setStatus('done')
  error event → setError(message), setStatus('error')
    │
    ▼
[用户点击说话人标签重命名]
    │
    ▼
updateSpeakerName(speakerId, newName) → 同步更新 speakerMap 和 transcript.segments
```

---

## 五、API 调用流程

### 5.1 完整处理流程

```
┌─────────────┐
│  粘贴链接   │
└──────┬──────┘
       │ POST /api/parse-link
       ▼
┌─────────────┐
│  视频元数据 │ ◀── 响应 videoMeta + sessionId
└──────┬──────┘
       │
       │ 用户确认 → 点击"开始处理"
       ▼
┌─────────────┐
│  音频转写   │ ◀── POST /api/transcribe (SSE)
└──────┬─────┘
       │ 进度事件流: parsing → extracting → transcribing → separating
       ▼
┌─────────────┐
│  逐字稿输出 │ ◀── 响应完整 Transcript
└──────┬──────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌─────────────┐        ┌─────────────┐
│  复制/下载  │        │  生成智能图文 │
│  (TXT/Word) │        │  POST /api/  │
│             │        │  generate-  │
│             │        │  article    │
└─────────────┘        └──────┬──────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  信息提取   │
                      │  POST /api/ │
                      │  extract-   │
                      │  info       │
                      └──────┬──────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  下载 PDF   │
                      │  GET /api/  │
                      │  download/ │
                      │  article_  │
                      │  pdf        │
                      └─────────────┘
```

### 5.2 各阶段状态码映射

| 前端 status | 后端 SSE stage | 说明 |
|-------------|----------------|------|
| `idle` | - | 初始状态 |
| `parsing` | `parsing` | 解析链接 |
| `extracting` | `extracting` | 提取音频 |
| `transcribing` | `transcribing` | ASR 转写 |
| `separating` | `separating` | 说话人分离 |
| `generating` | `generating` | LLM 生成文章 |
| `extracting_frames` | `extracting_frames` | 提取关键帧 |
| `done` | `done` | 处理完成 |
| `error` | `error` | 处理失败 |

---

## 六、错误处理规范

### 6.1 错误响应格式

```typescript
interface APIError {
  success: false;
  error: {
    code: string;               // 错误码
    message: string;            // 用户可读的错误描述
    details?: unknown;          // 详细信息（可选）
  };
}
```

### 6.2 错误码汇总

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `INVALID_URL` | 400 | 链接格式无效 |
| `UNSUPPORTED_PLATFORM` | 400 | 不支持的视频平台 |
| `FETCH_ERROR` | 502 | 获取视频信息失败 |
| `TRANSCRIPTION_FAILED` | 500 | 转写服务异常 |
| `ARTICLE_GENERATION_FAILED` | 500 | 文章生成服务异常 |
| `EXTRACTION_FAILED` | 500 | 信息提取服务异常 |
| `SESSION_NOT_FOUND` | 404 | 会话不存在或已过期 |
| `FILE_NOT_READY` | 404 | 下载文件未就绪 |
| `FILE_NOT_FOUND` | 404 | 文件不存在 |
| `UNKNOWN_TYPE` | 400 | 未知的下载类型 |
| `MISSING_SESSION_ID` | 400 | 缺少会话 ID |
| `MISSING_URL` | 400 | 缺少 URL 参数 |
| `INVALID_PROTOCOL` | 400 | 非法的 URL 协议（仅允许 http/https） |
| `UPSTREAM_ERROR` | 502 | 上游图片获取失败 |
| `PROXY_ERROR` | 502 | 图片代理失败 |
| `SERVER_ERROR` | 500 | 服务器内部错误 |

### 6.3 前端错误处理策略

```typescript
// 错误展示优先级
const errorPriority: Record<string, number> = {
  'INVALID_URL': 1,
  'SESSION_NOT_FOUND': 1,
  'MISSING_SESSION_ID': 1,
  'UNSUPPORTED_PLATFORM': 2,
  'FETCH_ERROR': 3,
  'TRANSCRIPTION_FAILED': 3,
  'SERVER_ERROR': 4,
};

// 用户提示策略
function getErrorToast(error: APIError): string {
  switch (error.code) {
    case 'INVALID_URL':
      return '链接格式无效，请检查后重新输入';
    case 'UNSUPPORTED_PLATFORM':
      return '暂不支持该视频平台，支持 B站、抖音、YouTube、视频号';
    case 'SESSION_NOT_FOUND':
      return '会话已过期，请重新输入链接';
    default:
      return error.message || '处理失败，请稍后重试';
  }
}
```

---

## 七、浏览器端数据保留策略

根据 PRD 非功能需求「数据安全」：

| 数据类型 | 存储位置 | 保留时间 |
|----------|----------|----------|
| `sessionId` | 内存 (Zustand) | 页面刷新丢失 |
| `videoMeta` | 内存 (Zustand) | 页面刷新丢失 |
| `transcript` | 内存 (Zustand) | 页面刷新丢失 |
| `article` | 内存 (Zustand) | 页面刷新丢失 |
| `extraction` | 内存 (Zustand) | 页面刷新丢失 |

**关键帧图片**：以完整后端 URL 形式存储（如 `/api/files/{sessionId}/frames/frame_001.jpg`），通过后端 API 获取。

**关闭页面后**：所有数据随浏览器进程一起销毁。

---

## 八、接口速查表

| 方法 | 路径 | 描述 | 同步/异步 |
|------|------|------|-----------|
| POST | `/api/parse-link` | 解析视频链接 | 同步 |
| POST | `/api/transcribe` | 音频转写 | SSE 异步 |
| POST | `/api/generate-article` | 生成智能图文 | SSE 异步 |
| POST | `/api/extract-info` | 结构化信息提取 | 同步 |
| GET | `/api/download/:type` | 文件下载 (txt/word/pdf) | 同步 |
| GET | `/api/files/:sessionId/frames/:filename` | 获取抽帧图片 | 同步 |
| GET | `/api/proxy/image` | 图片代理 (解决跨域/CORB) | 同步 |
| GET | `/api/health` | 健康检查 | 同步 |

---

*文档状态：待评审*
