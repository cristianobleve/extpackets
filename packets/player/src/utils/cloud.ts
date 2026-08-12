/**
 * Cloud Provider URL Normalizer & Resolver
 * Converts cloud share URLs (Google Drive, Dropbox, AWS S3, Cloudflare R2)
 * into direct HTML5 media stream endpoints.
 */

export function resolveCloudMediaUrl(url: string): string {
  if (!url) return url;

  const trimmedUrl = url.trim();

  // 1. Google Drive Share Links
  // Example: https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I/view?usp=sharing
  // Example: https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9I
  const gdriveFileMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const gdriveOpenMatch = trimmedUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  const gdriveId = gdriveFileMatch ? gdriveFileMatch[1] : (gdriveOpenMatch ? gdriveOpenMatch[1] : null);

  if (gdriveId) {
    console.log(`[ExtPlayer] Resolving Google Drive URL for file ID: ${gdriveId}`);
    return `https://drive.google.com/uc?export=download&id=${gdriveId}`;
  }

  // 2. Dropbox Share Links
  // Example: https://www.dropbox.com/s/abcdef12345/video.mp4?dl=0
  if (trimmedUrl.includes('dropbox.com')) {
    console.log('[ExtPlayer] Normalizing Dropbox link for direct streaming');
    return trimmedUrl.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  // 3. AWS S3 / Cloudflare R2 / GCS / DigitalOcean Spaces URLs
  // Work out-of-the-box (requires standard CORS headers on the bucket)
  return trimmedUrl;
}
