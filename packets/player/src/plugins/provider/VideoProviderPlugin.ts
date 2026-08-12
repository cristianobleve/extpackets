import { ExtPlayerInstance, ExtPlayerPlugin } from '../../core/types';
import { resolveCloudMediaUrl } from '../../utils/cloud';

export interface ProviderMatch {
  type: 'youtube' | 'vimeo' | 'dailymotion' | 'twitch' | 'cloud' | 'direct';
  embedUrl?: string;
  directUrl?: string;
}

export class VideoProviderPlugin implements ExtPlayerPlugin {
  public name = 'ExtPlayerVideoProvider';
  public version = '1.0.0';

  private player!: ExtPlayerInstance;
  private iframe?: HTMLIFrameElement;

  public init(player: ExtPlayerInstance): void {
    this.player = player;

    const originalLoadSource = player.loadSource.bind(player);

    player.loadSource = (src: string, options?: any) => {
      const match = this.resolveProvider(src);
      if (match.type === 'cloud' && match.directUrl) {
        this.clearIframe();
        originalLoadSource(match.directUrl, options);
      } else if (match.embedUrl) {
        this.loadEmbedIframe(match.embedUrl, match.type);
      } else {
        this.clearIframe();
        originalLoadSource(src, options);
      }
    };

    if (player.options.src) {
      const match = this.resolveProvider(player.options.src);
      if (match.type === 'cloud' && match.directUrl) {
        this.player.options.src = match.directUrl;
      } else if (match.embedUrl) {
        this.loadEmbedIframe(match.embedUrl, match.type);
      }
    }
  }

  public resolveProvider(url: string): ProviderMatch {
    if (!url) return { type: 'direct' };

    // 1. YouTube
    const ytReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = url.match(ytReg);
    if (ytMatch && ytMatch[2].length === 11) {
      const ytId = ytMatch[2];
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&modestbranding=1&rel=0`
      };
    }

    // 2. Vimeo
    const vimeoReg = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const vimeoMatch = url.match(vimeoReg);
    if (vimeoMatch && vimeoMatch[1]) {
      const vimeoId = vimeoMatch[1];
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=0&dnt=1`
      };
    }

    // 3. Dailymotion
    const dmReg = /(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const dmMatch = url.match(dmReg);
    if (dmMatch && dmMatch[1]) {
      const dmId = dmMatch[1];
      return {
        type: 'dailymotion',
        embedUrl: `https://www.dailymotion.com/embed/video/${dmId}?autoplay=0`
      };
    }

    // 4. Twitch
    const twitchReg = /(?:twitch\.tv\/videos\/)([0-9]+)/;
    const twitchMatch = url.match(twitchReg);
    if (twitchMatch && twitchMatch[1]) {
      const twitchId = twitchMatch[1];
      const parentDomain = window.location.hostname || 'localhost';
      return {
        type: 'twitch',
        embedUrl: `https://player.twitch.tv/?video=${twitchId}&parent=${parentDomain}&autoplay=false`
      };
    }

    // 5. Google Drive / Dropbox / Cloud Storage Direct Streams
    const resolvedCloud = resolveCloudMediaUrl(url);
    if (resolvedCloud !== url) {
      return {
        type: 'cloud',
        directUrl: resolvedCloud
      };
    }

    return { type: 'direct' };
  }

  public loadEmbedIframe(embedUrl: string, type: string): void {
    this.player.videoElement.style.display = 'none';

    let iframe = this.player.containerElement.querySelector<HTMLIFrameElement>('iframe.ext-player-provider');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'ext-player-provider';
      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.zIndex = '1';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      this.player.containerElement.insertBefore(iframe, this.player.containerElement.firstChild);
    }
    iframe.src = embedUrl;
    this.iframe = iframe;
    console.log(`[ExtPlayerVideoProvider] Embedded ${type} video: ${embedUrl}`);
  }

  private clearIframe(): void {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = undefined;
    }
    this.player.videoElement.style.display = 'block';
  }

  public destroy(): void {
    this.clearIframe();
  }
}
