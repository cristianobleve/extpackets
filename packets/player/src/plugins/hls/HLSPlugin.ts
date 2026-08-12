import Hls from 'hls.js';
import { ExtPlayerInstance, ExtPlayerPlugin, QualityLevel } from '../../core/types';

export class HLSPlugin implements ExtPlayerPlugin {
  public name = 'ExtPlayerHLS';
  public version = '1.0.0';

  private player!: ExtPlayerInstance;
  private hlsInstance?: Hls;

  public init(player: ExtPlayerInstance): void {
    this.player = player;

    // Listen to loadSource calls to intercept .m3u8 URLs automatically
    const originalLoadSource = player.loadSource.bind(player);

    player.loadSource = (src: string, options?: any) => {
      if (src.includes('.m3u8') || options?.isHLS) {
        this.loadHLSStream(src);
      } else {
        if (this.hlsInstance) {
          this.hlsInstance.destroy();
          this.hlsInstance = undefined;
        }
        originalLoadSource(src, options);
      }
    };
  }

  public loadHLSStream(src: string): void {
    const video = this.player.videoElement;

    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = undefined;
    }

    // 1. Safari Native HLS Support
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('[ExtPlayerHLS] Using native Safari HLS engine for:', src);
      video.src = src;
      video.load();
      return;
    }

    // 2. HLS.js Engine Support
    if (Hls.isSupported()) {
      console.log('[ExtPlayerHLS] Initializing Hls.js engine for:', src);
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      this.hlsInstance = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        console.log(`[ExtPlayerHLS] Manifest parsed. Found ${data.levels.length} quality levels.`);

        // Map HLS levels to ExtPlayer QualityLevel format
        const qualities: QualityLevel[] = [
          { id: 'auto', label: 'Auto (ABR)', bitrate: 0 }
        ];

        data.levels.forEach((level, index) => {
          const label = level.height ? `${level.height}p` : `Level ${index + 1}`;
          qualities.push({
            id: index,
            label,
            height: level.height,
            bitrate: level.bitrate
          });
        });

        this.player.setQualities(qualities);
        this.player.emit('ready');
      });

      // Handle quality level switches from ExtPlayer
      this.player.on('qualitychange', ({ quality }) => {
        if (this.hlsInstance) {
          const idStr = String(quality.id);
          if (idStr === 'auto') {
            this.hlsInstance.currentLevel = -1; // Auto ABR
            console.log('[ExtPlayerHLS] Switched to Auto ABR');
          } else {
            const levelIndex = parseInt(idStr, 10);
            if (!isNaN(levelIndex) && levelIndex >= 0) {
              this.hlsInstance.currentLevel = levelIndex;
              console.log(`[ExtPlayerHLS] HLS Level set to index: ${levelIndex} (${quality.label})`);
            }
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('[ExtPlayerHLS] Fatal HLS error:', data.type);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      console.warn('[ExtPlayerHLS] HLS is not supported in this browser environment.');
    }
  }

  public destroy(): void {
    if (this.hlsInstance) {
      this.hlsInstance.destroy();
    }
  }
}
