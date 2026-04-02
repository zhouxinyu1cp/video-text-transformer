class MiniMaxService {
  private _apiKey: string = ''
  private _groupId: string = ''
  private baseUrl: string = 'https://api.minimax.chat/v1'

  constructor() {
    // Lazy load environment variables to ensure dotenv.config() has run
    // This is needed because ES module imports are resolved before any module code executes
  }

  private get apiKey(): string {
    if (!this._apiKey) {
      this._apiKey = process.env.MINIMAX_API_KEY || ''
    }
    return this._apiKey
  }

  private get groupId(): string {
    if (!this._groupId) {
      this._groupId = process.env.MINIMAX_GROUP_ID || ''
    }
    return this._groupId
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Generate article using MiniMax LLM API
   */
  async generateArticle(prompt: string, options?: { articleStyle?: string }): Promise<{ title: string; content: string }> {
    if (!this.apiKey || !this.groupId) {
      throw new Error('MiniMax API credentials not configured')
    }

    try {
      const stylePrompt = options?.articleStyle
        ? `请用${options.articleStyle}风格撰写文章。`
        : ''

      const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'MiniMax-M2.7',
          messages: [
            {
              role: 'system',
              content: `你是一个专业的文章撰写助手。请根据提供的视频转写内容，生成一篇结构清晰、内容详实的图文文章。
文章要求：
1. 包含标题和正文
2. 适当分段，使用markdown格式
3. 提取视频的核心观点
4. ${stylePrompt}
5. 字数不少于500字`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`MiniMax LLM API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json() as {
        code?: number; msg?: string; choices?: Array<{
          message?: { content?: string }
        }>
      }

      if (data.code && data.code !== 0) {
        throw new Error(`MiniMax LLM error: ${data.msg}`)
      }

      const content = data.choices?.[0]?.message?.content || ''

      // Parse title from content (first # heading) or generate one
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : '视频图文'

      return { title, content }
    } catch (error) {
      console.error('MiniMax LLM generation failed:', error)
      throw error
    }
  }

  /**
   * Extract structured info using MiniMax LLM API
   */
  async extractInfo(transcriptText: string): Promise<{
    corePoints: string[];
    facts: Array<{ content: string; type: 'data' | 'fact' }>;
    actionItems: Array<{ content: string; assignee?: string; deadline?: string }>;
  }> {
    if (!this.apiKey || !this.groupId) {
      throw new Error('MiniMax API credentials not configured')
    }

    try {
      const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'MiniMax-M2.7',
          messages: [
            {
              role: 'system',
              content: `你是一个信息提取专家。请从视频转写内容中提取以下信息并以JSON格式返回：
{
  "corePoints": ["核心观点1", "核心观点2", ...],  // 3-5个核心观点
  "facts": [{"content": "事实内容", "type": "fact|data"}, ...],  // 数据或事实，最多5条
  "actionItems": [{"content": "行动项内容", "assignee": "负责人(如果有)", "deadline": "截止日期(如果有)"}, ...]  // 行动项，最多3条
}
如果没有行动项，返回空数组。注意：只返回JSON，不要有其他内容。`,
            },
            {
              role: 'user',
              content: transcriptText,
            },
          ],
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`MiniMax LLM API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json() as {
        code?: number; msg?: string; choices?: Array<{
          message?: { content?: string }
        }>
      }

      if (data.code && data.code !== 0) {
        throw new Error(`MiniMax LLM error: ${data.msg}`)
      }

      const content = data.choices?.[0]?.message?.content || '{}'

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          corePoints: parsed.corePoints || [],
          facts: (parsed.facts || []).map((f: { content: string; type: string }) => ({
            content: f.content,
            type: f.type === 'data' ? 'data' as const : 'fact' as const,
          })),
          actionItems: (parsed.actionItems || []).map((a: { content: string; assignee?: string; deadline?: string }) => ({
            content: a.content,
            assignee: a.assignee,
            deadline: a.deadline,
          })),
        }
      }

      throw new Error('Failed to parse extracted info')
    } catch (error) {
      console.error('MiniMax info extraction failed:', error)
      throw error
    }
  }
}

export const miniMaxService = new MiniMaxService()
