declare class MiniMaxService {
    private _apiKey;
    private _groupId;
    private baseUrl;
    constructor();
    private get apiKey();
    private get groupId();
    private getHeaders;
    /**
     * Generate article using MiniMax LLM API
     */
    generateArticle(prompt: string, options?: {
        articleStyle?: string;
    }): Promise<{
        title: string;
        content: string;
    }>;
    /**
     * Extract structured info using MiniMax LLM API
     */
    extractInfo(transcriptText: string): Promise<{
        corePoints: string[];
        facts: Array<{
            content: string;
            type: 'data' | 'fact';
        }>;
        actionItems: Array<{
            content: string;
            assignee?: string;
            deadline?: string;
        }>;
    }>;
}
export declare const miniMaxService: MiniMaxService;
export {};
