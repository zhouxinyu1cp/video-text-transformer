import type { Platform, VideoMeta } from '@video-transcriber/shared';
export interface ParseResult {
    platform: Platform;
    videoId: string;
    videoUrl: string;
}
declare class LinkParserService {
    private patterns;
    constructor();
    parse(url: string): ParseResult;
    getVideoMeta(url: string): Promise<VideoMeta>;
    private getBilibiliMeta;
    private getYouTubeMeta;
    private getDouyinMeta;
    private getWechatVideoMeta;
    validateUrl(url: string): boolean;
}
export declare const linkParserService: LinkParserService;
export {};
