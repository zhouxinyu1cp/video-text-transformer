class LinkParserService {
    patterns;
    constructor() {
        this.patterns = {
            bilibili: /^(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV[\w]+)/,
            douyin: /^(?:https?:\/\/)?(?:www\.)?douyin\.com\/video\/(\d+)/,
            youtube: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            wechat_video: /^(?:https?:\/\/)?(?:www\.)?channels\.weixin\.qq\.com\/video\/(\w+)/,
        };
    }
    parse(url) {
        for (const [platform, pattern] of Object.entries(this.patterns)) {
            const match = url.match(pattern);
            if (match) {
                return {
                    platform: platform,
                    videoId: match[1],
                    videoUrl: url,
                };
            }
        }
        throw new Error('UNSUPPORTED_PLATFORM');
    }
    async getVideoMeta(url) {
        const { platform, videoId } = this.parse(url);
        switch (platform) {
            case 'bilibili':
                return this.getBilibiliMeta(url, videoId);
            case 'youtube':
                return this.getYouTubeMeta(url, videoId);
            case 'douyin':
                return this.getDouyinMeta(url, videoId);
            case 'wechat_video':
                return this.getWechatVideoMeta(url, videoId);
            default:
                throw new Error('UNSUPPORTED_PLATFORM');
        }
    }
    async getBilibiliMeta(url, bvid) {
        try {
            const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
            const data = await response.json();
            if (data.code === 0 && data.data) {
                const { title, pic, duration, owner } = data.data;
                // B站图片通过后端代理避免CORB，使用完整URL
                const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
                const thumbnail = `${baseUrl}/api/proxy/image?url=${encodeURIComponent(pic)}`;
                return {
                    platform: 'bilibili',
                    videoUrl: url,
                    title: title,
                    thumbnail: thumbnail,
                    duration: duration,
                    author: owner?.name || '未知UP主',
                };
            }
            throw new Error(`Bilibili API error: ${data.code}`);
        }
        catch (error) {
            console.error('Failed to fetch Bilibili metadata:', error);
            throw new Error('Failed to fetch Bilibili video information');
        }
    }
    async getYouTubeMeta(url, videoId) {
        try {
            // Use YouTube oEmbed API for basic metadata
            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const response = await fetch(oembedUrl);
            const data = await response.json();
            // Get video duration using Invidious API (more reliable than YouTube API)
            let duration = 0;
            try {
                const invidiousResponse = await fetch(`https://yewtu.be/api/v1/videos/${videoId}`);
                const invidiousData = await invidiousResponse.json();
                duration = invidiousData.duration || 0;
            }
            catch {
                // Fallback: try with youtube.com directly
                const ytResponse = await fetch(`https://youtube.com/watch?v=${videoId}`);
                // If direct fetch fails, use estimate
            }
            return {
                platform: 'youtube',
                videoUrl: url,
                title: data.title || `YouTube视频 ${videoId}`,
                thumbnail: data.thumbnail_url
                    ? `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/proxy/image?url=${encodeURIComponent(data.thumbnail_url)}`
                    : `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/proxy/image?url=${encodeURIComponent(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)}`,
                duration: duration,
                author: data.author_name || '未知频道',
            };
        }
        catch (error) {
            console.error('Failed to fetch YouTube metadata:', error);
            throw new Error('Failed to fetch YouTube video information');
        }
    }
    async getDouyinMeta(url, videoId) {
        // 抖音没有公开的官方 API，尝试使用公开的第三方解析接口
        try {
            // 尝试 douyin.iiilab.com API
            const response = await fetch(`https://api.douyin.wtf/api?url=${encodeURIComponent(url)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.title) {
                    return {
                        platform: 'douyin',
                        videoUrl: url,
                        title: data.title,
                        thumbnail: data.cover || '',
                        duration: data.duration || 60,
                        author: data.author?.nickname || data.author?.unique_id || '未知用户',
                    };
                }
            }
        }
        catch {
            // Continue to fallback
        }
        // 最后后备：返回URL信息而非硬编码
        const urlObj = new URL(url);
        return {
            platform: 'douyin',
            videoUrl: url,
            title: `抖音视频 ${videoId}`,
            thumbnail: '',
            duration: 60,
            author: urlObj.hostname || '抖音',
        };
    }
    async getWechatVideoMeta(url, videoId) {
        // 视频号没有公开 API，尝试获取页面信息
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                }
            });
            const html = await response.text();
            // 尝试从页面提取标题
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : `视频号视频 ${videoId}`;
            // 尝试提取缩略图
            const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
            const thumbnail = ogImageMatch ? ogImageMatch[1] : '';
            return {
                platform: 'wechat_video',
                videoUrl: url,
                title: title,
                thumbnail: thumbnail,
                duration: 300, // 视频号视频默认时长
            };
        }
        catch {
            // 后备方案
            return {
                platform: 'wechat_video',
                videoUrl: url,
                title: `视频号视频 ${videoId}`,
                thumbnail: '',
                duration: 300,
            };
        }
    }
    validateUrl(url) {
        try {
            new URL(url);
            return Object.values(this.patterns).some((pattern) => pattern.test(url));
        }
        catch {
            return false;
        }
    }
}
export const linkParserService = new LinkParserService();
