import { describe, it, expect, beforeEach } from 'vitest'
import { linkParserService } from './LinkParserService'

describe('LinkParserService', () => {
  const testCases = [
    {
      name: 'B站视频链接 (BV格式)',
      url: 'https://www.bilibili.com/video/BV1xx411c7mD',
      expectedPlatform: 'bilibili',
      expectedVideoId: 'BV1xx411c7mD',
    },
    {
      name: 'B站视频链接 (短BV格式)',
      url: 'https://bilibili.com/video/BV1GJ411x7h7',
      expectedPlatform: 'bilibili',
      expectedVideoId: 'BV1GJ411x7h7',
    },
    {
      name: '抖音视频链接',
      url: 'https://www.douyin.com/video/7123456789012345678',
      expectedPlatform: 'douyin',
      expectedVideoId: '7123456789012345678',
    },
    {
      name: 'YouTube视频链接 (watch格式)',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      expectedPlatform: 'youtube',
      expectedVideoId: 'dQw4w9WgXcQ',
    },
    {
      name: 'YouTube视频链接 (短格式)',
      url: 'https://youtu.be/dQw4w9WgXcQ',
      expectedPlatform: 'youtube',
      expectedVideoId: 'dQw4w9WgXcQ',
    },
    {
      name: '视频号链接',
      url: 'https://channels.weixin.qq.com/video/abc123xyz',
      expectedPlatform: 'wechat_video',
      expectedVideoId: 'abc123xyz',
    },
  ]

  testCases.forEach(({ name, url, expectedPlatform, expectedVideoId }) => {
    it(`应正确解析: ${name}`, () => {
      const result = linkParserService.parse(url)
      expect(result.platform).toBe(expectedPlatform)
      expect(result.videoId).toBe(expectedVideoId)
    })
  })

  it('应抛出错误: 不支持的平台', () => {
    expect(() => linkParserService.parse('https://example.com/video123')).toThrow('UNSUPPORTED_PLATFORM')
  })

  it('validateUrl应返回true: 有效B站链接', () => {
    expect(linkParserService.validateUrl('https://www.bilibili.com/video/BV1xx411c7mD')).toBe(true)
  })

  it('validateUrl应返回false: 无效链接', () => {
    expect(linkParserService.validateUrl('not-a-url')).toBe(false)
  })
})
