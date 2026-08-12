/**
 * Formats time in seconds to HH:MM:SS or MM:SS format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const formattedM = m.toString().padStart(2, '0');
  const formattedS = s.toString().padStart(2, '0');

  if (h > 0) {
    const formattedH = h.toString().padStart(2, '0');
    return `${formattedH}:${formattedM}:${formattedS}`;
  }

  return `${formattedM}:${formattedS}`;
}
