/**
 * ExtPlayer Core Types & Interfaces
 */

export interface DRMKeySystemConfig {
  licenseUrl: string;
  certificateUrl?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export interface DRMOptions {
  widevine?: DRMKeySystemConfig;
  fairplay?: DRMKeySystemConfig;
  playready?: DRMKeySystemConfig;
}

export interface QualityLevel {
  id: string | number;
  label: string;
  height?: number;
  bitrate?: number; // Bitrate in bps (e.g., 4500000 for 4.5 Mbps)
  src?: string;     // Direct video source URL for multi-bitrate MP4s
}

export interface ExtPlayerOptions {
  /** Target element selector or HTMLElement */
  target: string | HTMLElement;
  /** Primary video source URL */
  src?: string;
  /** Sprite VTT URL for hover thumbnail scrubbing preview */
  thumbsVttUrl?: string;
  /** Video poster image URL */
  poster?: string;
  /** Enable automatic thumbnail poster extraction from video if poster is missing (default: true) */
  autoPoster?: boolean;
  /** Video title overlay in top bar */
  title?: string;
  /** Show or hide top header title bar */
  showTitle?: boolean;
  /** Autoplay setting */
  autoplay?: boolean | 'muted' | 'play' | 'auto';
  /** Loop setting (repeat video) */
  loop?: boolean;
  /** Muted initially */
  muted?: boolean;
  /** Initial volume (0.0 to 1.0) */
  volume?: number;
  /** Preset theme name ('obsidian', 'cinema', 'nordic', 'monochrome') or custom theme string */
  theme?: 'obsidian' | 'cinema' | 'nordic' | 'monochrome' | string;
  /** Primary accent color for controls (CSS color string, default: #3b82f6) */
  themeColor?: string;
  /** Custom font family string for UI elements */
  fontFamily?: string;
  /** Optional Google Font or CSS font stylesheet URL to load automatically */
  fontUrl?: string;
  /** Show or hide entire controls toolbar (useful for ambient background showcase) */
  showControls?: boolean;
  /** Show or hide time display (00:00 / 00:00) */
  showTime?: boolean;
  /** Show ambient glow backdrop around video container */
  ambientGlow?: boolean;
  /** Show loop toggle button in controls bar */
  showLoopBtn?: boolean;
  /** Show unmute banner when autoplaying muted */
  showUnmuteBanner?: boolean;
  /** DRM Configuration */
  drm?: DRMOptions;
  /** Preload mode */
  preload?: 'auto' | 'metadata' | 'none';
  /** Cross-origin attribute (optional, leave undefined for maximum cross-domain video compatibility) */
  crossOrigin?: 'anonymous' | 'use-credentials' | undefined;
  /** Available video quality / bitrate levels */
  qualities?: QualityLevel[];
  /** Default quality ID */
  defaultQuality?: string | number;
  /** Enable default UI Skin plugin */
  useDefaultUI?: boolean;
  /** Enable keyboard shortcuts plugin */
  useShortcuts?: boolean;
}

export interface ExtPlayerPlugin {
  name: string;
  version?: string;
  init(player: ExtPlayerInstance): void;
  destroy?(): void;
}

export type PlayerEventMap = {
  'ready': void;
  'play': void;
  'pause': void;
  'ended': void;
  'timeupdate': { currentTime: number; duration: number; progressPercentage: number };
  'progress': { bufferedPercentage: number };
  'volumechange': { volume: number; muted: boolean };
  'ratechange': { rate: number };
  'loopchange': { loop: boolean };
  'fullscreenchange': { isFullscreen: boolean };
  'pipchange': { isPip: boolean };
  'qualitychange': { quality: QualityLevel; bitrate?: number };
  'qualitieschange': { qualities: QualityLevel[] };
  'autoplaypolicy': { status: 'success' | 'fallback_muted' | 'blocked'; muted: boolean };
  'postergenerated': { posterUrl: string };
  'drmstatus': { status: 'requesting' | 'authorized' | 'failed'; error?: Error };
  'error': { error: Error | MediaError };
  'destroy': void;
};

export interface ExtPlayerInstance {
  readonly videoElement: HTMLVideoElement;
  readonly containerElement: HTMLElement;
  readonly options: Required<ExtPlayerOptions>;
  
  play(): Promise<void>;
  pause(): void;
  togglePlay(): void;
  seek(timeInSeconds: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  toggleMute(): void;
  setLoop(loop: boolean): void;
  toggleLoop(): void;
  setPlaybackRate(rate: number): void;
  setQuality(qualityId: string | number): void;
  getQualities(): QualityLevel[];
  setQualities(qualities: QualityLevel[]): void;
  getCurrentQuality(): QualityLevel | undefined;
  getPlugin<T extends ExtPlayerPlugin = ExtPlayerPlugin>(name: string): T | undefined;
  toggleFullscreen(): void;
  togglePictureInPicture(): void;
  loadSource(src: string, options?: Partial<ExtPlayerOptions>): void;
  
  on<K extends keyof PlayerEventMap>(event: K, handler: (payload: PlayerEventMap[K]) => void): void;
  off<K extends keyof PlayerEventMap>(event: K, handler: (payload: PlayerEventMap[K]) => void): void;
  emit<K extends keyof PlayerEventMap>(event: K, payload?: PlayerEventMap[K]): void;
  
  registerPlugin(plugin: ExtPlayerPlugin): void;
  destroy(): void;
}
