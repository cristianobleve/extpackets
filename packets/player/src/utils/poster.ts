/**
 * Auto Poster Frame Extractor Utility
 * Extracts a snapshot frame from the HTMLVideoElement to generate a thumbnail poster image
 * automatically when no custom poster URL is provided.
 */

export async function generateAutoPoster(
  video: HTMLVideoElement,
  quality = 0.85
): Promise<string | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const capture = () => {
      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        if (width > 0 && height > 0 && ctx) {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);
          const posterUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(posterUrl);
          return;
        }
      } catch (err) {
        console.warn('[ExtPlayer] Auto-poster frame extraction note:', err);
      }
      resolve(null);
    };

    if (video.readyState >= 2 && video.videoWidth > 0) {
      capture();
    } else {
      const onData = () => {
        video.removeEventListener('loadeddata', onData);
        capture();
      };
      video.addEventListener('loadeddata', onData);
      setTimeout(() => {
        video.removeEventListener('loadeddata', onData);
        if (video.videoWidth > 0) capture();
        else resolve(null);
      }, 3000);
    }
  });
}
