# 视频智能文稿生成器 - 任务列表

**生成日期：** 2026年3月31日
**版本：** 1.0

---

## 前置依赖说明

- `[P]` = 可并行执行（无依赖）
- 无标记 = 必须等待依赖任务完成
- 测试先行：每个功能任务必须先编写失败的测试，再实现代码

---

## Phase 1: 项目脚手架 + 链接解析

### 1.1 项目结构搭建

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 1.1.1 | 创建根目录 `package.json`（workspaces 配置） | `package.json` | - | 脚手架 |
| 1.1.2 | 创建 `frontend/` 目录的 Next.js 14 项目（含 App Router） | `frontend/` | - | 脚手架 |
| 1.1.3 | 创建 `backend/` 目录的 Fastify 项目 | `backend/` | - | 脚手架 |
| 1.1.4 | 创建 `shared/` 目录存放共享类型 | `shared/` | - | 脚手架 |

### 1.2 共享类型定义

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 1.2.1 | 创建 Platform 枚举和 VideoMeta 类型 | `shared/types/index.ts` | 1.1.4 | 类型 |
| 1.2.2 | 创建 TranscriptSegment、SpeakerMap、Frame 类型 | `shared/types/index.ts` | 1.2.1 | 类型 |
| 1.2.3 | 创建 ExtractionResult、FactItem、ActionItem 类型 | `shared/types/index.ts` | 1.2.2 | 类型 |
| 1.2.4 | 创建 Transcript、Article 类型 | `shared/types/index.ts` | 1.2.3 | 类型 |
| 1.2.5 | 创建 ProcessingStatus 枚举 | `shared/types/index.ts` | 1.2.4 | 类型 |
| 1.2.6 | 导出所有类型并编写类型测试 | `shared/types/index.ts` | 1.2.5 | 测试+类型 |

### 1.3 前端基础配置

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 1.3.1 | 配置 Tailwind CSS | `frontend/tailwind.config.ts` | 1.1.2 | 配置 |
| 1.3.2 | 创建 Radix UI 基础组件（Button, Input, Card） | `frontend/components/ui/` | 1.1.2 | 组件 |
| 1.3.3 | 创建 Radix UI 进阶组件（Dialog, Tabs） | `frontend/components/ui/` | 1.3.2 | 组件 |
| 1.3.4 | 创建 Toast、Spinner 组件 | `frontend/components/ui/` | 1.3.3 | 组件 |

### 1.4 后端基础配置

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 1.4.1 | 配置 TypeScript 编译选项 | `backend/tsconfig.json` | 1.1.3 | 配置 |
| 1.4.2 | 创建 `.env.example` 环境变量模板 | `backend/.env.example` | 1.1.3 | 配置 |
| 1.4.3 | 创建 Fastify 入口文件 `src/index.ts` | `backend/src/index.ts` | 1.1.3 | 脚手架 |
| 1.4.4 | 创建 Fastify 实例配置 `src/app.ts` | `backend/src/app.ts` | 1.4.3 | 脚手架 |
| 1.4.5 | 创建健康检查路由 `GET /api/health` | `backend/src/routes/health.ts` | 1.4.4 | 路由 |

### 1.5 链接解析服务（后端）

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 1.5.1 | **编写测试**：LinkParserService 解析 B站链接 | `backend/src/services/LinkParserService.test.ts` | 1.4.4 | 测试 |
| 1.5.2 | **编写测试**：LinkParserService 解析抖音链接 | `backend/src/services/LinkParserService.test.ts` | 1.5.1 | 测试 |
| 1.5.3 | **编写测试**：LinkParserService 解析 YouTube 链接 | `backend/src/services/LinkParserService.test.ts` | 1.5.2 | 测试 |
| 1.5.4 | **编写测试**：LinkParserService 无效链接处理 | `backend/src/services/LinkParserService.test.ts` | 1.5.3 | 测试 |
| 1.5.5 | **实现**：LinkParserService（B站、抖音、YouTube、视频号） | `backend/src/services/LinkParserService.ts` | 1.5.4 | 实现 |
| 1.5.6 | **实现**：POST `/api/parse-link` 路由 | `backend/src/routes/parse.ts` | 1.5.5 | 路由 |

### 1.6 前端链接解析功能

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 1.6.1 | **编写测试**：VideoInputForm 组件测试 | `frontend/components/video-input/VideoInputForm.test.tsx` | 1.3.4 | 测试 |
| 1.6.2 | **实现**：VideoInputForm 组件 | `frontend/components/video-input/VideoInputForm.tsx` | 1.6.1 | 组件 |
| 1.6.3 | **实现**：VideoMetaCard 组件 | `frontend/components/video-input/VideoMetaCard.tsx` | 1.6.2 | 组件 |
| 1.6.4 | **编写测试**：Zustand Store 基础状态测试 | `frontend/stores/useAppStore.test.ts` | 1.3.4 | 测试 |
| 1.6.5 | **实现**：Zustand Store（sessionId, videoMeta, status） | `frontend/stores/useAppStore.ts` | 1.6.4 | 状态 |
| 1.6.6 | **实现**：API 调用封装 `lib/api.ts` | `frontend/lib/api.ts` | 1.1.2 | 工具 |
| 1.6.7 | **实现**：工具函数 `lib/utils.ts` | `frontend/lib/utils.ts` | 1.1.2 | 工具 |
| 1.6.8 | **实现**：主页 `app/page.tsx`（链接输入页） | `frontend/app/page.tsx` | 1.6.3, 1.6.5, 1.6.6, 1.6.7 | 页面 |

---

## Phase 2: 音频提取 + ASR 转写

### 2.1 文件服务（后端）

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 2.1.1 | **编写测试**：FileService 会话目录创建测试 | `backend/src/services/FileService.test.ts` | 1.4.4 | 测试 |
| 2.1.2 | **编写测试**：FileService 文件读写测试 | `backend/src/services/FileService.test.ts` | 2.1.1 | 测试 |
| 2.1.3 | **实现**：FileService（createSession, write, read, cleanup） | `backend/src/services/FileService.ts` | 2.1.2 | 服务 |

### 2.2 FFmpeg 音频提取服务

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 2.2.1 | **编写测试**：FFmpegService 音频提取集成测试 | `backend/src/services/FFmpegService.test.ts` | 2.1.3 | 测试 |
| 2.2.2 | **实现**：FFmpegService（extractAudio） | `backend/src/services/FFmpegService.ts` | 2.2.1 | 服务 |

### 2.3 ASR 语音识别服务（nodejs-whisper）

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 2.3.1 | **编写测试**：ASRService (nodejs-whisper) 转写测试 | `backend/src/services/ASRService.test.ts` | 2.1.3 | 测试 |
| 2.3.2 | **实现**：ASRService（nodejs-whisper base 模型，transcribe 返回 TranscriptSegment[]） | `backend/src/services/ASRService.ts` | 2.3.1 | 服务 |

### 2.4 转写 API 路由

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 2.4.1 | **编写测试**：POST `/api/transcribe` 路由测试 | `backend/src/routes/transcribe.test.ts` | 2.2.2, 2.3.2 | 测试 |
| 2.4.2 | **实现**：POST `/api/transcribe` 路由（含 SSE 进度推送） | `backend/src/routes/transcribe.ts` | 2.4.1 | 路由 |

### 2.5 前端转写功能

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 2.5.1 | **编写测试**：TranscriptView 组件测试 | `frontend/components/transcript/TranscriptView.test.tsx` | 1.3.4 | 测试 |
| 2.5.2 | **实现**：TranscriptSegment 组件 | `frontend/components/transcript/TranscriptSegment.tsx` | 2.5.1 | 组件 |
| 2.5.3 | **实现**：TranscriptView 主视图组件 | `frontend/components/transcript/TranscriptView.tsx` | 2.5.2 | 组件 |
| 2.5.4 | **实现**：结果页 `app/result/page.tsx` | `frontend/app/result/page.tsx` | 2.5.3 | 页面 |

---

## Phase 3: 说话人分离 + 文稿输出

### 3.1 说话人分离

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 3.1.1 | **编写测试**：说话人分离逻辑测试 | `backend/src/services/ASRService.test.ts` | 2.3.2 | 测试 |
| 3.1.2 | **实现**：说话人分离逻辑（合并相邻同说话人片段） | `backend/src/services/ASRService.ts` | 3.1.1 | 服务 |

### 3.2 前端说话人标签

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 3.2.1 | **编写测试**：SpeakerTag 组件测试 | `frontend/components/transcript/SpeakerTag.test.tsx` | 1.3.4 | 测试 |
| 3.2.2 | **实现**：SpeakerTag 组件（可点击重命名） | `frontend/components/transcript/SpeakerTag.tsx` | 3.2.1 | 组件 |
| 3.2.3 | **扩展测试**：Zustand Store speakerMap 更新测试 | `frontend/stores/useAppStore.test.ts` | 1.6.4 | 测试 |
| 3.2.4 | **扩展**：updateSpeakerName action | `frontend/stores/useAppStore.ts` | 3.2.3 | 状态 |

### 3.3 文稿下载功能（后端）

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 3.3.1 | **编写测试**：生成 TXT 格式测试 | `backend/src/routes/download.test.ts` | 2.1.3 | 测试 |
| 3.3.2 | **编写测试**：生成 Word 格式测试 (docx) | `backend/src/routes/download.test.ts` | 3.3.1 | 测试 |
| 3.3.3 | **实现**：GET `/api/download/transcript_txt` | `backend/src/routes/download.ts` | 3.3.2 | 路由 |
| 3.3.4 | **实现**：GET `/api/download/transcript_word` (使用 docx 库) | `backend/src/routes/download.ts` | 3.3.3 | 路由 |

### 3.4 前端文稿工具栏

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 3.4.1 | **编写测试**：TranscriptToolbar 组件测试 | `frontend/components/transcript/TranscriptToolbar.test.tsx` | 1.3.4 | 测试 |
| 3.4.2 | **实现**：TranscriptToolbar 组件（复制/下载 TXT/Word） | `frontend/components/transcript/TranscriptToolbar.tsx` | 3.4.1 | 组件 |
| 3.4.3 | **实现**：文件下载工具 `lib/download.ts` | `frontend/lib/download.ts` | 1.1.2 | 工具 |

---

## Phase 4: LLM 文章生成 + 关键帧

### 4.1 LLM 服务

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 4.1.1 | **编写测试**：LLMService 生成文章测试 | `backend/src/services/LLMService.test.ts` | 2.1.3 | 测试 |
| 4.1.2 | **编写测试**：LLMService 信息提取测试 | `backend/src/services/LLMService.test.ts` | 4.1.1 | 测试 |
| 4.1.3 | **实现**：LLMService（generateArticle） | `backend/src/services/LLMService.ts` | 4.1.2 | 服务 |
| 4.1.4 | **实现**：LLMService（extractInfo） | `backend/src/services/LLMService.ts` | 4.1.3 | 服务 |
| 4.1.5 | **实现**：nodejs-whisper 模型初始化脚本（首次运行自动下载 base 模型） | `backend/scripts/init-whisper-model.ts` | 2.1.3 | 脚本 |

### 4.2 关键帧提取服务

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 4.2.1 | **编写测试**：FFmpegService 关键帧提取测试 | `backend/src/services/FFmpegService.test.ts` | 2.2.2 | 测试 |
| 4.2.2 | **实现**：FFmpegService（extractFrames） | `backend/src/services/FFmpegService.ts` | 4.2.1 | 服务 |

### 4.3 图片代理服务（解决 CORB）

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 4.3.1 | **编写测试**：图片代理路由测试 | `backend/src/routes/download.test.ts` | 2.1.3 | 测试 |
| 4.3.2 | **实现**：GET `/api/proxy/image` 路由 | `backend/src/routes/download.ts` | 4.3.1 | 路由 |
| 4.3.3 | **实现**：FileService.getFrameUrl 返回完整 URL | `backend/src/services/FileService.ts` | 2.1.3 | 服务 |
| 4.3.4 | **实现**：LinkParserService 返回代理后的图片 URL | `backend/src/services/LinkParserService.ts` | 1.5.5 | 服务 |

### 4.4 生成文章 API

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 4.4.1 | **编写测试**：POST `/api/generate-article` 路由测试 | `backend/src/routes/generate-article.test.ts` | 4.1.3, 4.2.2 | 测试 |
| 4.4.2 | **实现**：POST `/api/generate-article` 路由（含 SSE） | `backend/src/routes/generate-article.ts` | 4.4.1 | 路由 |

### 4.5 前端文章功能

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 4.5.1 | **编写测试**：ArticleRenderer 组件测试 | `frontend/components/article/ArticleRenderer.test.tsx` | 1.3.4 | 测试 |
| 4.5.2 | **实现**：ArticleRenderer 组件 | `frontend/components/article/ArticleRenderer.tsx` | 4.5.1 | 组件 |
| 4.5.3 | **编写测试**：FrameGallery 组件测试 | `frontend/components/article/FrameGallery.test.tsx` | 1.3.4 | 测试 |
| 4.5.4 | **实现**：FrameGallery 组件 | `frontend/components/article/FrameGallery.tsx` | 4.5.3 | 组件 |
| 4.5.5 | **编写测试**：ArticleView 组件测试 | `frontend/components/article/ArticleView.test.tsx` | 1.3.4 | 测试 |
| 4.5.6 | **实现**：ArticleView 主视图组件 | `frontend/components/article/ArticleView.tsx` | 4.5.5 | 组件 |

---

## Phase 5: 信息提取 + PDF 导出

### 5.1 信息提取 API

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 5.1.1 | **编写测试**：POST `/api/extract-info` 路由测试 | `backend/src/routes/extract-info.test.ts` | 4.1.4 | 测试 |
| 5.1.2 | **实现**：POST `/api/extract-info` 路由 | `backend/src/routes/extract-info.ts` | 5.1.1 | 路由 |

### 5.2 PDF 生成

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 5.2.1 | **编写测试**：PDF 生成组件测试 | `frontend/components/article/ArticlePDF.test.tsx` | 1.3.4 | 测试 |
| 5.2.2 | **实现**：PDF 下载路由 GET `/api/download/article_pdf` | `backend/src/routes/download.ts` | 3.3.4 | 路由 |
| 5.2.3 | **实现**：ArticlePDF 组件（基于 @react-pdf/renderer） | `frontend/components/article/ArticlePDF.tsx` | 5.2.1 | 组件 |

### 5.3 前端信息提取面板

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 5.3.1 | **编写测试**：ExtractionCard 组件测试 | `frontend/components/extraction/ExtractionCard.test.tsx` | 1.3.4 | 测试 |
| 5.3.2 | **实现**：ExtractionCard 组件 | `frontend/components/extraction/ExtractionCard.tsx` | 5.3.1 | 组件 |
| 5.3.3 | **编写测试**：ExtractionPanel 组件测试 | `frontend/components/extraction/ExtractionPanel.test.tsx` | 1.3.4 | 测试 |
| 5.3.4 | **实现**：ExtractionPanel 组件 | `frontend/components/extraction/ExtractionPanel.tsx` | 5.3.3 | 组件 |
| 5.3.5 | **扩展**：Zustand Store extraction 状态 | `frontend/stores/useAppStore.ts` | 1.6.4 | 状态 |

---

## Phase 6: 测试 + 部署优化

### 6.1 集成测试

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 6.1.1 | **编写**：端到端测试（parse → transcribe → article） | `backend/e2e/transcribe.test.ts` | Phase 1-5 | 测试 |
| 6.1.2 | **编写**：API 集成测试套件 | `backend/tests/api.test.ts` | Phase 1-5 | 测试 |

### 6.2 Docker 部署

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 6.2.1 | 创建 `Dockerfile`（Node.js 20 + FFmpeg + @whisper/nodejs） | `Dockerfile` | Phase 1-5 | 部署 |
| 6.2.2 | 创建 `docker-compose.yml` | `docker-compose.yml` | 6.2.1 | 部署 |

### 6.3 前端完整集成

| # | 任务 | 文件 | 依赖 | 类型 |
|---|------|------|------|------|
| 6.3.1 | 创建根布局 `app/layout.tsx` | `frontend/app/layout.tsx` | Phase 1-5 | 布局 |
| 6.3.2 | 创建全局样式 `app/globals.css` | `frontend/app/globals.css` | 6.3.1 | 样式 |
| 6.3.3 | 添加 favicon | `frontend/public/favicon.ico` | 1.1.2 | 静态 |

---

## 任务统计

| Phase | 任务数 | 测试任务数 | 实现任务数 |
|-------|--------|------------|------------|
| Phase 1 | 22 | 8 | 14 |
| Phase 2 | 9 | 5 | 4 |
| Phase 3 | 11 | 6 | 5 |
| Phase 4 | 10 | 6 | 4 |
| Phase 5 | 8 | 4 | 4 |
| Phase 6 | 6 | 2 | 4 |
| **总计** | **66** | **31** | **35** |

> 注：后端单元测试实际共 57 个，覆盖 LinkParserService、FileService、ASRService、LLMService、FFmpegService、下载路由等核心模块。

---

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

### 集成测试优先策略

- **优先使用真实依赖**：文件系统、实际 API 调用（使用真实测试凭证）
- **Mock 策略**：仅在外部服务不可用时使用 Mock（如 MiniMax LLM 可用时用真实集成测试）
- **测试数据**：使用公开可访问的视频链接进行真实集成测试

---

## 并行执行建议

以下任务可并行执行（无依赖关系）：

**[P]** Phase 1.3.2 ~ 1.3.4（Radix UI 组件）
**[P]** Phase 1.4.1 ~ 1.4.3（后端基础配置）
**[P]** Phase 1.5.1 ~ 1.5.4（LinkParserService 测试）
**[P]** Phase 2.1.1 ~ 2.1.2（FileService 测试）
**[P]** Phase 3.2.1 ~ 3.2.2（SpeakerTag 测试与实现）
**[P]** Phase 4.4.1 ~ 4.4.6（文章相关组件）

---

*文档状态：待执行*
