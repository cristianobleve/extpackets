import { ExtPlayerInstance, ExtPlayerPlugin } from '../../core/types';

export class YouTubePlugin implements ExtPlayerPlugin {
  public name = 'ExtPlayerYouTube';
  public version = '1.0.0';

  private player!: ExtPlayerInstance;
  private iframe?: HTMLIFrameElement;

  public init(player: ExtPlayerInstance): void {
    this.player = player;

    const originalLoadSource = player.loadSource.bind(player);

    player.loadSource = (src: string, options?: any) => {
      const ytId = this.extractYouTubeId(src);
      if (ytId) {
        this.loadYouTubeVideo(ytId);
      } else {
        if (this.iframe && this.iframe.parentNode) {
          this.iframe.parentNode.removeChild(this.iframe);
          this.iframe = undefined;
        }
        this.player.videoElement.style.display = 'block';
        originalLoadSource(src, options);
      }
    };

    // Check initial src on setup
    if (player.options.src) {
      const ytId = this.extractYouTubeId(player.options.src);
      if (ytId) {
        this.loadYouTubeVideo(ytId);
      }
    }
  }

  public extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  public loadYouTubeVideo(videoId: string): void {
    // Hide HTML5 video tag while playing YouTube embed
    this.player.videoElement.style.display = 'none';

    let iframe = this.player.containerElement.querySelector<HTMLIFrameElement>('iframe.ext-player-yt');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'ext-player-yt';
      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.zIndex = '1';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      this.player.containerElement.insertBefore(iframe, this.player.containerElement.firstChild);
    }
    
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=${this.player.options.autoplay ? 1 : 0}&modestbranding=1&rel=0`;
    this.iframe = iframe;
    console.log(`[ExtPlayerYouTube] Embedded YouTube video ID: ${videoId}`);
  }

  public destroy(): void {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  }
}
