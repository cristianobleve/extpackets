import { PlayerCore } from './core/PlayerCore';
import { ExtPlayerOptions } from './core/types';
import { UIPlugin } from './plugins/ui/UIPlugin';
import { ShortcutsPlugin } from './plugins/shortcuts/ShortcutsPlugin';
import { DRMPlugin } from './plugins/drm/DRMPlugin';
import { HLSPlugin } from './plugins/hls/HLSPlugin';
import { VideoProviderPlugin } from './plugins/provider/VideoProviderPlugin';

export class ExtPlayer extends PlayerCore {
  constructor(target: string | HTMLElement, options: Partial<ExtPlayerOptions> = {}) {
    const fullOptions: ExtPlayerOptions = {
      target,
      ...options
    };

    super(fullOptions);

    // Register Automatic HLS Engine Plugin
    this.registerPlugin(new HLSPlugin());

    // Register Automatic Video Provider Plugin (YouTube, Vimeo, Dailymotion, Twitch, Cloud Storage)
    this.registerPlugin(new VideoProviderPlugin());

    // Register Default UI if enabled
    if (this.options.useDefaultUI) {
      this.registerPlugin(new UIPlugin());
    }

    // Register Keyboard Shortcuts if enabled
    if (this.options.useShortcuts) {
      this.registerPlugin(new ShortcutsPlugin());
    }

    // Register DRM Plugin if DRM settings provided
    if (this.options.drm && Object.keys(this.options.drm).length > 0) {
      this.registerPlugin(new DRMPlugin(this.options.drm));
    }
  }

  /**
   * Static helper for quick mounting via selector or element
   */
  public static attach(target: string | HTMLElement, options: Partial<ExtPlayerOptions> = {}): ExtPlayer {
    return new ExtPlayer(target, options);
  }

  /**
   * Auto-initializes any DOM elements with [data-ext-player]
   */
  public static autoInit(): ExtPlayer[] {
    const elements = document.querySelectorAll<HTMLElement>('[data-ext-player]');
    const instances: ExtPlayer[] = [];

    elements.forEach((el) => {
      const src = el.getAttribute('data-src') || el.getAttribute('data-ext-src') || undefined;
      const poster = el.getAttribute('data-poster') || undefined;
      const autoPoster = el.getAttribute('data-auto-poster') !== 'false';
      const title = el.getAttribute('data-title') || undefined;
      const rawTheme = el.getAttribute('data-theme') || undefined;
      const isPresetTheme = rawTheme && ['obsidian', 'cinema', 'nordic', 'monochrome'].includes(rawTheme);
      const theme = isPresetTheme ? rawTheme : undefined;
      const themeColor = !isPresetTheme ? rawTheme : undefined;
      const fontFamily = el.getAttribute('data-font') || el.getAttribute('data-font-family') || undefined;
      const fontUrl = el.getAttribute('data-font-url') || undefined;
      
      const rawAutoplay = el.getAttribute('data-autoplay');
      const autoplay = rawAutoplay === 'muted' ? 'muted' : el.hasAttribute('data-autoplay');
      const loop = el.hasAttribute('data-loop') || el.getAttribute('data-loop') === 'true';
      const showControls = el.getAttribute('data-show-controls') !== 'false' && el.getAttribute('data-controls') !== 'false';
      const showTime = el.getAttribute('data-show-time') !== 'false' && el.getAttribute('data-time') !== 'false';
      const showTitle = el.getAttribute('data-show-title') !== 'false';
      const ambientGlow = el.hasAttribute('data-ambient') || el.getAttribute('data-ambient-glow') === 'true';

      const instance = new ExtPlayer(el, {
        src,
        poster,
        autoPoster,
        title,
        showTitle,
        theme,
        themeColor,
        fontFamily,
        fontUrl,
        autoplay,
        loop,
        showControls,
        showTime,
        ambientGlow
      });
      instances.push(instance);
    });

    return instances;
  }
}

// Auto init on DOMContentLoaded if script is loaded via CDN tag
if (typeof window !== 'undefined') {
  (window as any).ExtPlayer = ExtPlayer;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ExtPlayer.autoInit());
  } else {
    ExtPlayer.autoInit();
  }
}

export * from './core/types';
export { PlayerCore } from './core/PlayerCore';
export { UIPlugin } from './plugins/ui/UIPlugin';
export { ShortcutsPlugin } from './plugins/shortcuts/ShortcutsPlugin';
export { DRMPlugin } from './plugins/drm/DRMPlugin';
