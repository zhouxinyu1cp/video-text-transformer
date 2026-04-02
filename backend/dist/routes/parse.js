import { linkParserService } from '../services/LinkParserService.js';
export async function parseRoutes(app) {
    app.post('/api/parse-link', async (request, reply) => {
        const { url } = request.body;
        if (!url) {
            return reply.status(400).send({
                success: false,
                error: { code: 'INVALID_URL', message: 'URL is required' },
            });
        }
        if (!linkParserService.validateUrl(url)) {
            return reply.status(400).send({
                success: false,
                error: { code: 'INVALID_URL', message: 'Invalid URL format' },
            });
        }
        try {
            const videoMeta = await linkParserService.getVideoMeta(url);
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                success: true,
                data: {
                    sessionId,
                    videoMeta,
                },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (message === 'UNSUPPORTED_PLATFORM') {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'UNSUPPORTED_PLATFORM', message: 'Unsupported video platform' },
                });
            }
            return reply.status(502).send({
                success: false,
                error: { code: 'FETCH_ERROR', message: 'Failed to fetch video information' },
            });
        }
    });
}
