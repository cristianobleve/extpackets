import { resolveCloudMediaUrl } from '../utils/cloud';

export type SupportedMediaType = 'hls' | 'mp4' | 'webm' | 'mov_transcode' | 'unknown';

export interface ResolvedMediaSource {
  originalUrl: string;
  resolvedUrl: string;
  mediaType: SupportedMediaType;
  isHLS: boolean;
  needsTranscode: boolean;
}

export class SmartMediaEngine {
  /**
   * Automatically inspects, normalizes and routes ANY video URL
   * (.m3u8, .mp4, .mov, .mkv, .webm, Google Drive, S3, etc.)
   * into a client-playable format.
   */
  public static async analyzeSource(url: string): Promise<ResolvedMediaSource> {
    const cloudResolved = resolveCloudMediaUrl(url);
    const lowercaseUrl = cloudResolved.toLowerCase().split('?')[0];

    // 1. Check if it's an HLS Manifest (.m3u8)
    if (lowercaseUrl.endsWith('.m3u8') || lowercaseUrl.includes('m3u8')) {
      return {
        originalUrl: url,
        resolvedUrl: cloudResolved,
        mediaType: 'hls',
        isHLS: true,
        needsTranscode: false
      };
    }

    // 2. Check if it's standard MP4 or WebM
    if (lowercaseUrl.endsWith('.mp4') || lowercaseUrl.endsWith('.webm') || lowercaseUrl.endsWith('.ogv')) {
      return {
        originalUrl: url,
        resolvedUrl: cloudResolved,
        mediaType: lowercaseUrl.endsWith('.webm') ? 'webm' : 'mp4',
        isHLS: false,
        needsTranscode: false
      };
    }

    // 3. Check for MOV, MKV, AVI, FLV or unknown containers requiring automatic client transcode/wrap
    if (
      lowercaseUrl.endsWith('.mov') ||
      lowercaseUrl.endsWith('.mkv') ||
      lowercaseUrl.endsWith('.avi') ||
      lowercaseUrl.endsWith('.flv') ||
      lowercaseUrl.endsWith('.ts')
    ) {
      console.log(`[SmartMediaEngine] Detected container format (${lowercaseUrl}). Routing through client transcode engine.`);
      return {
        originalUrl: url,
        resolvedUrl: cloudResolved,
        mediaType: 'mov_transcode',
        isHLS: false,
        needsTranscode: true
      };
    }

    // 4. Default fallback: treatment as MP4 with auto-cloud resolution
    return {
      originalUrl: url,
      resolvedUrl: cloudResolved,
      mediaType: 'mp4',
      isHLS: false,
      needsTranscode: false
    };
  }
}
