import { fileService } from './FileService.js';
import { miniMaxService } from './MiniMaxService.js';
class LLMService {
    async generateArticle(transcript, options) {
        try {
            // Build prompt from transcript
            const transcriptText = this.buildTranscriptText(transcript);
            // Use MiniMax LLM to generate article
            const { title, content } = await miniMaxService.generateArticle(`视频标题：${transcript.videoMeta.title || '未知'}
视频作者：${transcript.videoMeta.author || '未知'}
视频时长：${Math.round(transcript.duration / 60000)}分钟

视频转写内容：
${transcriptText}`, { articleStyle: options?.articleStyle });
            const article = {
                title,
                content,
                frames: [],
                wordCount: content.length,
                createdAt: new Date().toISOString(),
            };
            // Save article to file
            await fileService.write(transcript.videoMeta.videoUrl.split('/').pop() || 'session', 'output/article.md', content);
            return article;
        }
        catch (error) {
            console.error('Article generation failed:', error);
            throw new Error('Failed to generate article');
        }
    }
    async extractInfo(transcript) {
        try {
            const transcriptText = this.buildTranscriptText(transcript);
            // Use MiniMax LLM to extract structured info
            const extracted = await miniMaxService.extractInfo(transcriptText);
            const facts = extracted.facts.map((f, idx) => ({
                id: `fact_${idx + 1}`,
                content: f.content,
                type: f.type,
            }));
            const actionItems = extracted.actionItems.map((a, idx) => ({
                id: `action_${idx + 1}`,
                content: a.content,
                assignee: a.assignee,
                deadline: a.deadline,
            }));
            const extraction = {
                corePoints: extracted.corePoints,
                facts,
                actionItems,
            };
            // Save extraction result to file
            await fileService.write(transcript.videoMeta.videoUrl.split('/').pop() || 'session', 'output/structured_info.json', JSON.stringify(extraction, null, 2));
            return extraction;
        }
        catch (error) {
            console.error('Info extraction failed:', error);
            throw new Error('Failed to extract information');
        }
    }
    buildTranscriptText(transcript) {
        return transcript.segments
            .map((seg) => {
            const speaker = transcript.speakerMap?.[seg.speakerId] || seg.speakerId;
            const start = new Date(seg.startTime).toISOString().substr(11, 8);
            return `[${start}] ${speaker}: ${seg.text}`;
        })
            .join('\n');
    }
}
export const llmService = new LLMService();
