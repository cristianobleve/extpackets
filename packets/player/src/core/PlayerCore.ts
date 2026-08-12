import { generateAutoPoster } from '../utils/poster';
import { EventEmitter } from './EventEmitter';
import { PluginManager } from './PluginManager';
import { ExtPlayerInstance, ExtPlayerOptions, ExtPlayerPlugin, PlayerEventMap, QualityLevel } from './types';
import { getElement } from '../utils/dom';
import { resolveCloudMediaUrl } from '../utils/cloud';

export class PlayerCore implements ExtPlayerInstance {
  public readonly videoElement: HTMLVideoElement;
  public readonly containerElement: HTMLElement;
  public readonly options: Required<ExtPlayerOptions>;
  
  private eventEmitter: EventEmitter = new EventEmitter();
  private pluginManager: PluginManager;
  private currentQuality?: QualityLevel;
  private destroyed: boolean = false;

  constructor(userOptions: ExtPlayerOptions) {
    // 1. Resolve Target Container
    this.containerElement = getElement(userOptions.target);
    this.containerElement.classList.add('ext-player-root');

    // 2. Set Default Options
    this.options = {
      target: userOptions.target,
      src: userOptions.src || '',
      poster: userOptions.poster || '',
      autoPoster: userOptions.autoPoster ?? true,
      title: userOptions.title || '',
      showTitle: userOptions.showTitle ?? true,
      autoplay: userOptions.autoplay ?? false,
      loop: userOptions.loop ?? false,
      muted: userOptions.muted ?? false,
      volume: userOptions.volume ?? 1.0,
      theme: userOptions.theme || 'monochrome',
      themeColor: userOptions.themeColor || '',
      fontFamily: userOptions.fontFamily || "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontUrl: userOptions.fontUrl || "",
      showControls: userOptions.showControls ?? true,
      showTime: userOptions.showTime ?? true,
      ambientGlow: userOptions.ambientGlow ?? false,
      showLoopBtn: userOptions.showLoopBtn ?? true,
      showUnmuteBanner: userOptions.showUnmuteBanner ?? true,
      drm: userOptions.drm || {},
      preload: userOptions.preload || 'metadata',
      crossOrigin: (userOptions.crossOrigin as any) || '',
      qualities: userOptions.qualities || [],
      defaultQuality: userOptions.defaultQuality || 'auto',
      useDefaultUI: userOptions.useDefaultUI ?? true,
      useShortcuts: userOptions.useShortcuts ?? true,
    };

    // Apply Theme & CSS Custom Variables
    if (this.options.fontUrl) {
      this.loadExternalFont(this.options.fontUrl);
    }
    this.setTheme(this.options.theme);
    if (this.options.themeColor) {
      this.containerElement.style.setProperty('--ext-theme-color', this.options.themeColor);
    }
    this.containerElement.style.setProperty('--ext-font-family', this.options.fontFamily);

    if (this.options.ambientGlow) {
      this.containerElement.classList.add('ambient-glow');
    }

    // 3. Create or reuse HTMLVideoElement
    let existingVideo = this.containerElement.querySelector('video');
    if (existingVideo) {
      this.videoElement = existingVideo;
    } else {
      this.videoElement = document.createElement('video');
      this.containerElement.appendChild(this.videoElement);
    }

    this.setupVideoAttributes();

    // 4. Initialize Plugin Manager
    this.pluginManager = new PluginManager(this);

    // 5. Bind Native Video Events
    this.bindNativeEvents();

    // 6. Set source if provided
    if (this.options.src) {
      this.loadSource(this.options.src);
    }
  }


  private loadExternalFont(url: string): void {
    if (!url) return;
    const existing = document.querySelector(`link[href="${url}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
      console.log(`[ExtPlayer] Loaded custom font stylesheet: ${url}`);
    }
  }

  private setupVideoAttributes(): void {
    const v = this.videoElement;
    v.classList.add('ext-player-video');
    v.playsInline = true;
    v.preload = this.options.preload;
    if (this.options.crossOrigin) {
      v.crossOrigin = this.options.crossOrigin;
    } else {
      v.removeAttribute('crossorigin');
    }
    if (this.options.poster) v.poster = this.options.poster;
    if (this.options.autoplay) v.autoplay = !!this.options.autoplay;
    v.loop = this.options.loop;
    v.muted = this.options.muted;
    v.volume = this.options.volume;
  }

  private bindNativeEvents(): void {
    const v = this.videoElement;

    v.addEventListener('loadedmetadata', () => {
      this.eventEmitter.emit('ready');
      if (this.options.autoplay) {
        this.handleAutoplay();
      }
    });

    v.addEventListener('loadeddata', async () => {
      if (!this.options.poster && this.options.autoPoster && !v.poster) {
        const autoPosterUrl = await generateAutoPoster(v);
        if (autoPosterUrl) {
          v.poster = autoPosterUrl;
          (this.options as any).poster = autoPosterUrl;
          this.eventEmitter.emit('postergenerated', { posterUrl: autoPosterUrl });
          console.log('[ExtPlayer] Auto-extracted poster thumbnail frame from video.');
        }
      }
    });

    v.addEventListener('play', () => {
      this.eventEmitter.emit('play');
    });

    v.addEventListener('pause', () => {
      this.eventEmitter.emit('pause');
    });

    v.addEventListener('ended', () => {
      this.eventEmitter.emit('ended');
    });

    v.addEventListener('timeupdate', () => {
      const currentTime = v.currentTime;
      const duration = v.duration || 0;
      const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
      this.eventEmitter.emit('timeupdate', { currentTime, duration, progressPercentage });
    });

    v.addEventListener('progress', () => {
      let bufferedPercentage = 0;
      if (v.buffered.length > 0 && v.duration > 0) {
        bufferedPercentage = (v.buffered.end(v.buffered.length - 1) / v.duration) * 100;
      }
      this.eventEmitter.emit('progress', { bufferedPercentage });
    });

    v.addEventListener('volumechange', () => {
      this.eventEmitter.emit('volumechange', { volume: v.volume, muted: v.muted });
    });

    v.addEventListener('ratechange', () => {
      this.eventEmitter.emit('ratechange', { rate: v.playbackRate });
    });

    v.addEventListener('error', () => {
      if (v.error) {
        this.eventEmitter.emit('error', { error: v.error });
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = document.fullscreenElement === this.containerElement;
      if (isFullscreen) {
        this.containerElement.classList.add('is-fullscreen');
      } else {
        this.containerElement.classList.remove('is-fullscreen');
      }
      this.eventEmitter.emit('fullscreenchange', { isFullscreen });
    });

    v.addEventListener('enterpictureinpicture', () => {
      this.eventEmitter.emit('pipchange', { isPip: true });
    });

    v.addEventListener('leavepictureinpicture', () => {
      this.eventEmitter.emit('pipchange', { isPip: false });
    });
  }

  // --- Public API Methods ---

  
  /**
   * Smart Autoplay Policy Handler
   * Attempts unmuted playback first; if blocked by browser policy,
   * automatically falls back to muted autoplay and notifies listeners.
   */
  public async handleAutoplay(): Promise<void> {
    if (!this.options.autoplay) return;

    if (this.options.autoplay === 'muted') {
      this.setMuted(true);
      try {
        await this.videoElement.play();
        this.eventEmitter.emit('autoplaypolicy', { status: 'fallback_muted', muted: true });
      } catch (err) {
        console.warn('[ExtPlayer] Muted autoplay failed:', err);
        this.eventEmitter.emit('autoplaypolicy', { status: 'blocked', muted: true });
      }
      return;
    }

    try {
      await this.videoElement.play();
      this.eventEmitter.emit('autoplaypolicy', { status: 'success', muted: this.videoElement.muted });
    } catch (err) {
      console.warn('[ExtPlayer] Unmuted autoplay blocked by browser policy. Falling back to muted autoplay.', err);
      this.setMuted(true);
      try {
        await this.videoElement.play();
        this.eventEmitter.emit('autoplaypolicy', { status: 'fallback_muted', muted: true });
      } catch (fallbackErr) {
        console.warn('[ExtPlayer] Muted autoplay fallback failed:', fallbackErr);
        this.eventEmitter.emit('autoplaypolicy', { status: 'blocked', muted: true });
      }
    }
  }

  public async play(): Promise<void> {
    try {
      await this.videoElement.play();
    } catch (err) {
      console.warn('[ExtPlayer] Play prevented or failed:', err);
      throw err;
    }
  }

  public pause(): void {
    this.videoElement.pause();
  }

  public togglePlay(): void {
    if (this.videoElement.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  public seek(timeInSeconds: number): void {
    if (isNaN(timeInSeconds)) return;
    const clampedTime = Math.max(0, Math.min(timeInSeconds, this.videoElement.duration || 0));
    this.videoElement.currentTime = clampedTime;
  }

  public setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.videoElement.volume = clampedVolume;
    if (clampedVolume > 0) {
      this.videoElement.muted = false;
    } else {
      this.videoElement.muted = true;
    }
  }

  public setMuted(muted: boolean): void {
    this.videoElement.muted = muted;
    if (!muted && this.videoElement.volume === 0) {
      this.videoElement.volume = 1.0;
    }
  }

  public toggleMute(): void {
    this.setMuted(!this.videoElement.muted);
  }

  public setLoop(loop: boolean): void {
    this.options.loop = loop;
    this.videoElement.loop = loop;
    this.eventEmitter.emit('loopchange', { loop });
    console.log(`[ExtPlayer] Loop mode ${loop ? 'enabled' : 'disabled'}`);
  }

  public toggleLoop(): void {
    this.setLoop(!this.videoElement.loop);
  }

  public setTheme(themeName: string): void {
    this.containerElement.classList.remove('theme-obsidian', 'theme-cinema', 'theme-nordic', 'theme-monochrome');
    this.containerElement.classList.add(`theme-${themeName}`);
    (this.options as any).theme = themeName;
    console.log(`[ExtPlayer] Theme changed to: ${themeName}`);
  }

  public setPlaybackRate(rate: number): void {
    this.videoElement.playbackRate = rate;
  }

  public setQualities(qualities: QualityLevel[]): void {
    this.options.qualities = qualities;
    if (qualities.length > 0) {
      // Respect defaultQuality option if it matches one of the provided levels
      const defaultQ = this.options.defaultQuality;
      const match = qualities.find(
        (q) => String(q.id) === String(defaultQ) || q.label === String(defaultQ)
      );
      this.currentQuality = match ?? qualities[0];
    } else {
      this.currentQuality = undefined;
    }
    this.eventEmitter.emit('qualitieschange', { qualities });
  }

  public getQualities(): QualityLevel[] {
    return this.options.qualities;
  }

  public setQuality(qualityId: string | number): void {
    const targetQuality = this.options.qualities.find(
      (q) => String(q.id) === String(qualityId) || q.label === qualityId || q.id === qualityId
    );
    if (!targetQuality) {
      console.warn(`[ExtPlayer] Quality level "${qualityId}" not found in available qualities.`);
      return;
    }

    this.currentQuality = targetQuality;

    // Always emit qualitychange so plugins (e.g. HLS) can react
    this.eventEmitter.emit('qualitychange', { quality: targetQuality, bitrate: targetQuality.bitrate });
    console.log(`[ExtPlayer] setQuality -> "${targetQuality.label}" (id: ${targetQuality.id})`);

    // Static multi-src MP4: each quality level has its own distinct URL
    const isHLS = this.videoElement.src.includes('.m3u8') || (this.options.src || '').includes('.m3u8');
    if (!isHLS && targetQuality.src) {
      const savedTime = this.videoElement.currentTime;
      const isPlaying = !this.videoElement.paused;

      console.log(`[ExtPlayer] Switching MP4 src to "${targetQuality.label}" -> ${targetQuality.src}`);
      this.options.src = targetQuality.src;
      this.videoElement.src = targetQuality.src;
      this.videoElement.load();
      this.videoElement.currentTime = savedTime;
      if (isPlaying) {
        this.videoElement.play().catch(() => {});
      }
    }
  }

  public getCurrentQuality(): QualityLevel | undefined {
    return this.currentQuality;
  }

  public async toggleFullscreen(): Promise<void> {
    if (!document.fullscreenElement) {
      if (this.containerElement.requestFullscreen) {
        await this.containerElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  }

  public async togglePictureInPicture(): Promise<void> {
    if ('pictureInPictureEnabled' in document) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this.videoElement.requestPictureInPicture();
      }
    }
  }

  public loadSource(src: string, options?: Partial<ExtPlayerOptions>): void {
    if (options) {
      Object.assign(this.options, options);
    }
    const resolvedSrc = resolveCloudMediaUrl(src);
    this.options.src = resolvedSrc;
    this.videoElement.src = resolvedSrc;
    this.videoElement.load();
  }

  // --- Events API ---

  public on<K extends keyof PlayerEventMap>(event: K, handler: (payload: PlayerEventMap[K]) => void): void {
    this.eventEmitter.on(event, handler);
  }

  public off<K extends keyof PlayerEventMap>(event: K, handler: (payload: PlayerEventMap[K]) => void): void {
    this.eventEmitter.off(event, handler);
  }

  public emit<K extends keyof PlayerEventMap>(event: K, payload?: PlayerEventMap[K]): void {
    this.eventEmitter.emit(event, payload);
  }

  // --- Plugin API ---

  public registerPlugin(plugin: ExtPlayerPlugin): void {
    this.pluginManager.register(plugin);
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.eventEmitter.emit('destroy');
    this.pluginManager.destroyAll();
    this.eventEmitter.removeAllListeners();

    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.pause();
      this.videoElement.removeAttribute('src');
      this.videoElement.load();
    }

    this.containerElement.classList.remove('ext-player-root', 'ambient-glow');
  }
}
