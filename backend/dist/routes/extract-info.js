import { llmService } from '../services/LLMService.js';
export async function extractInfoRoutes(app) {
    app.post('/api/extract-info', async (request, reply) => {
        const { sessionId, transcript } = request.body;
        if (!sessionId || !transcript) {
            return reply.status(400).send({
                success: false,
                error: { code: 'MISSING_SESSION_ID', message: 'Session ID and transcript are required' },
            });
        }
        try {
            const extraction = await llmService.extractInfo(transcript);
            return {
                success: true,
                data: { extraction },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Extraction failed';
            return reply.status(500).send({
                success: false,
                error: { code: 'EXTRACTION_FAILED', message },
            });
        }
    });
}
