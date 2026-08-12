import { ExtPlayerInstance, ExtPlayerPlugin } from '../../core/types';
import { formatTime } from '../../utils/time';
import { createElement } from '../../utils/dom';
import './styles.css';

const SVG_ICONS = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,3 20,12 6,21"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>`,
  volumeHigh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  volumeMute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>`,
  loop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  pip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><rect width="9" height="6" x="11" y="12" rx="1" fill="currentColor" stroke="none"/></svg>`,
  fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`
};

export class UIPlugin implements ExtPlayerPlugin {
  public name = 'ExtPlayerUI';
  public version = '1.0.0';
  
  private player!: ExtPlayerInstance;
  private root!: HTMLElement;
  
  // UI Elements
  private overlayGradient!: HTMLElement;
  private headerTitleBar?: HTMLElement;
  private unmuteBanner?: HTMLElement;
  private bigPlayBtn!: HTMLElement;
  private controlsBar!: HTMLElement;
  private playPauseBtn!: HTMLElement;
  private volumeBtn!: HTMLElement;
  private volumeSlider!: HTMLInputElement;
  private currentTimeEl!: HTMLElement;
  private durationEl!: HTMLElement;
  private timelineContainer!: HTMLElement;
  private timelineProgress!: HTMLElement;
  private timelineBuffered!: HTMLElement;
  private timelineTooltip!: HTMLElement;
  private loopBtn?: HTMLElement;
  private settingsBtn!: HTMLElement;
  private settingsMenu!: HTMLElement;
  private drmBadge!: HTMLElement;
  private pipBtn!: HTMLElement;
  private fullscreenBtn!: HTMLElement;

  private activeSpeed: number = 1.0;
  private activeQuality: string = 'Auto';
  private activeTrackId: string | null = null;
  private hideControlsTimeout?: number;

  public init(player: ExtPlayerInstance): void {
    this.player = player;
    this.root = player.containerElement;

    this.renderUI();
    this.bindEvents();
    // Initialize activeQuality based on defaultQuality option or fallback to 'Auto'
    const defaultQ = this.player.options.defaultQuality;
    this.activeQuality = defaultQ !== undefined ? String(defaultQ) : 'Auto';
    this.updatePlayState();
    this.updateLoopState(this.player.videoElement.loop);
    this.updateVolumeState(this.player.videoElement.volume, this.player.videoElement.muted);
  }

  private renderUI(): void {
    const opts = this.player.options;

    // 1. Overlay Gradient
    this.overlayGradient = createElement('div', 'ext-player-overlay-gradient');
    this.root.appendChild(this.overlayGradient);

    // 2. Header Title Overlay (if title provided)
    if (opts.title) {
      this.headerTitleBar = createElement('div', `ext-player-header-title ${!opts.showTitle ? 'hidden' : ''}`, `<span>${opts.title}</span>`);
      this.root.appendChild(this.headerTitleBar);
    }

    // 3. Unmute Banner Overlay (if muted & autoplaying)
    if (opts.muted && opts.showUnmuteBanner) {
      this.unmuteBanner = createElement('div', 'ext-player-unmute-banner', `${SVG_ICONS.volumeMute} Click per Attivare l'Audio`);
      this.root.appendChild(this.unmuteBanner);
      this.unmuteBanner.addEventListener('click', () => {
        this.player.setMuted(false);
        this.player.setVolume(1.0);
        if (this.unmuteBanner) this.unmuteBanner.style.display = 'none';
      });
    }

    // 4. Big Play Button
    this.bigPlayBtn = createElement('div', 'ext-player-big-play', SVG_ICONS.play);
    this.root.appendChild(this.bigPlayBtn);

    // 5. Settings Menu Popup
    this.settingsMenu = createElement('div', 'ext-player-settings-menu');
    this.root.appendChild(this.settingsMenu);

    // 6. Controls Bar Container
    this.controlsBar = createElement('div', `ext-player-controls ${!opts.showControls ? 'hidden' : ''}`);
    this.controlsBar.innerHTML = `
      <div class="ext-player-timeline-container">
        <div class="ext-player-timeline-track">
          <div class="ext-player-timeline-buffered"></div>
          <div class="ext-player-timeline-progress">
            <div class="ext-player-timeline-handle"></div>
          </div>
        </div>
        <div class="ext-player-timeline-tooltip">00:00</div>
      </div>
      <div class="ext-player-controls-row">
        <div class="ext-player-controls-left">
          <button class="ext-player-btn play-pause-btn">${SVG_ICONS.play}</button>
          <div class="ext-player-volume-group">
            <button class="ext-player-btn volume-btn">${SVG_ICONS.volumeHigh}</button>
            <input type="range" class="ext-player-volume-slider" min="0" max="1" step="0.05" value="1">
          </div>
          <div class="ext-player-time ${!opts.showTime ? 'hidden' : ''}">
            <span class="current-time">00:00</span> / <span class="duration-time">00:00</span>
          </div>
        </div>
        <div class="ext-player-controls-right">
          <span class="ext-player-badge drm-badge" style="display: none;">DRM</span>
          
          <button class="ext-player-btn settings-btn" title="Settings">${SVG_ICONS.settings}</button>
          <button class="ext-player-btn pip-btn" title="Picture-in-Picture">${SVG_ICONS.pip}</button>
          <button class="ext-player-btn fullscreen-btn" title="Fullscreen">${SVG_ICONS.fullscreen}</button>
        </div>
      </div>
    `;

    this.root.appendChild(this.controlsBar);

    // Cache element references
    this.playPauseBtn = this.controlsBar.querySelector('.play-pause-btn')!;
    this.volumeBtn = this.controlsBar.querySelector('.volume-btn')!;
    this.volumeSlider = this.controlsBar.querySelector('.ext-player-volume-slider')!;
    this.currentTimeEl = this.controlsBar.querySelector('.current-time')!;
    this.durationEl = this.controlsBar.querySelector('.duration-time')!;
    this.timelineContainer = this.controlsBar.querySelector('.ext-player-timeline-container')!;
    this.timelineProgress = this.controlsBar.querySelector('.ext-player-timeline-progress')!;
    this.timelineBuffered = this.controlsBar.querySelector('.ext-player-timeline-buffered')!;
    this.timelineTooltip = this.controlsBar.querySelector('.ext-player-timeline-tooltip')!;
    if (opts.showLoopBtn) {
      this.loopBtn = this.controlsBar.querySelector('.loop-btn') || undefined;
    }
    this.settingsBtn = this.controlsBar.querySelector('.settings-btn')!;
    this.drmBadge = this.controlsBar.querySelector('.drm-badge')!;
    this.pipBtn = this.controlsBar.querySelector('.pip-btn')!;
    this.fullscreenBtn = this.controlsBar.querySelector('.fullscreen-btn')!;

    if (opts.drm && Object.keys(opts.drm).length > 0) {
      this.drmBadge.style.display = 'inline-block';
      this.drmBadge.classList.add('drm-active');
    }
  }

  private bindEvents(): void {
    // Play/Pause toggles
    this.bigPlayBtn.addEventListener('click', () => this.player.togglePlay());
    this.playPauseBtn.addEventListener('click', () => this.player.togglePlay());

    // Single Click to Play/Pause on video element
    this.player.videoElement.addEventListener('click', () => this.player.togglePlay());

    // Double Click for Fullscreen
    this.player.videoElement.addEventListener('dblclick', () => this.player.toggleFullscreen());

    // Loop Toggle Button
    if (this.loopBtn) {
      this.loopBtn.addEventListener('click', () => this.player.toggleLoop());
    }

    // Volume & Mute
    this.volumeBtn.addEventListener('click', () => this.player.toggleMute());
    this.volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.player.setVolume(val);
    });

    // Timeline Scrubber Dragging (YouTube Style)
    let isScrubbing = false;

    const updateTooltipOnHover = (e: MouseEvent) => {
      const rect = this.timelineContainer.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const duration = this.player.videoElement.duration || 0;
      const time = pos * duration;

      this.timelineTooltip.textContent = formatTime(time);
      this.timelineTooltip.style.left = `${pos * 100}%`;
    };

    const updateScrubberOnDrag = (e: MouseEvent) => {
      const rect = this.timelineContainer.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const duration = this.player.videoElement.duration || 0;
      const time = pos * duration;

      this.timelineProgress.style.width = `${pos * 100}%`;
      this.timelineTooltip.textContent = formatTime(time);
      this.timelineTooltip.style.left = `${pos * 100}%`;
      this.player.seek(time);
    };

    this.timelineContainer.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      this.root.classList.add('user-active');
      updateScrubberOnDrag(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (isScrubbing) {
        updateScrubberOnDrag(e);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isScrubbing) {
        isScrubbing = false;
      }
    });

    this.timelineContainer.addEventListener('mousemove', (e) => {
      if (!isScrubbing) {
        updateTooltipOnHover(e);
      }
    });

    // Settings Menu toggle
    this.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSettingsMenu();
    });

    document.addEventListener('click', () => {
      this.settingsMenu.classList.remove('visible');
    });

    // PiP & Fullscreen
    this.pipBtn.addEventListener('click', () => this.player.togglePictureInPicture());
    this.fullscreenBtn.addEventListener('click', () => this.player.toggleFullscreen());

    // Activity tracker for hiding controls (only if controls enabled)
    if (this.player.options.showControls) {
      this.root.addEventListener('mousemove', () => this.handleUserActivity());
      this.root.addEventListener('click', () => this.handleUserActivity());
      this.root.addEventListener('touchstart', () => this.handleUserActivity());
      this.root.addEventListener('mouseleave', () => {
        if (!this.player.videoElement.paused) {
          this.root.classList.remove('user-active');
        }
      });
      // Initial trigger so controls show on play start then hide after delay
      this.handleUserActivity();
    }

    // Player Events mapping to UI updates
    this.player.on('play', () => this.updatePlayState());
    this.player.on('pause', () => this.updatePlayState());
    this.player.on('ended', () => this.updatePlayState());
    this.player.on('loopchange', ({ loop }) => this.updateLoopState(loop));
    
    this.player.on('timeupdate', ({ currentTime, duration, progressPercentage }) => {
      this.currentTimeEl.textContent = formatTime(currentTime);
      this.durationEl.textContent = formatTime(duration);
      if (!isScrubbing) {
        this.timelineProgress.style.width = `${progressPercentage}%`;
      }
    });

    this.player.on('progress', ({ bufferedPercentage }) => {
      this.timelineBuffered.style.width = `${bufferedPercentage}%`;
    });

    
    this.player.on('autoplaypolicy', ({ status }) => {
      if (status === 'fallback_muted' && this.player.options.showUnmuteBanner) {
        this.showUnmuteBannerOverlay();
      }
    });

    this.player.on('volumechange', ({ volume, muted }) => {
      this.updateVolumeState(volume, muted);
      if (!muted && this.unmuteBanner) {
        this.unmuteBanner.style.display = 'none';
      }
    });

    this.player.on('qualitieschange', ({ qualities }) => {
      if (qualities && qualities.length > 0) {
        // Respect defaultQuality: find matching level or fallback to first
        const defaultQ = this.player.options.defaultQuality;
        const match = qualities.find(
          (q) => String(q.id) === String(defaultQ) || q.label === String(defaultQ)
        );
        this.activeQuality = String((match ?? qualities[0]).id);
        this.renderSettingsContent();
      }
    });

    this.player.on('qualitychange', ({ quality }) => {
      this.activeQuality = String(quality.id);
      this.renderSettingsContent();
    });
  }

  private handleUserActivity(): void {
    if (!this.player.options.showControls) return;
    this.root.classList.add('user-active');
    if (this.hideControlsTimeout) {
      window.clearTimeout(this.hideControlsTimeout);
    }
    this.hideControlsTimeout = window.setTimeout(() => {
      if (!this.player.videoElement.paused) {
        this.root.classList.remove('user-active');
      }
    }, 2500);
  }

  
  private showUnmuteBannerOverlay(): void {
    if (!this.unmuteBanner) {
      this.unmuteBanner = createElement('div', 'ext-player-unmute-banner', `${SVG_ICONS.volumeMute} Click per Attivare l'Audio`);
      this.root.appendChild(this.unmuteBanner);
      this.unmuteBanner.addEventListener('click', () => {
        this.player.setMuted(false);
        this.player.setVolume(1.0);
        if (this.unmuteBanner) this.unmuteBanner.style.display = 'none';
      });
    } else {
      this.unmuteBanner.style.display = 'flex';
    }
  }

  private updatePlayState(): void {
    const isPaused = this.player.videoElement.paused;
    if (isPaused) {
      this.root.classList.add('paused');
      this.playPauseBtn.innerHTML = SVG_ICONS.play;
    } else {
      this.root.classList.remove('paused');
      this.playPauseBtn.innerHTML = SVG_ICONS.pause;
    }
  }

  private updateLoopState(loop: boolean): void {
    if (this.loopBtn) {
      if (loop) {
        this.loopBtn.classList.add('loop-active');
        this.loopBtn.title = 'Loop Active (Click to disable)';
      } else {
        this.loopBtn.classList.remove('loop-active');
        this.loopBtn.title = 'Loop Disabled (Click to enable)';
      }
    }
  }

  private updateVolumeState(volume: number, muted: boolean): void {
    if (muted || volume === 0) {
      this.volumeBtn.innerHTML = SVG_ICONS.volumeMute;
      this.volumeSlider.value = '0';
    } else {
      this.volumeBtn.innerHTML = SVG_ICONS.volumeHigh;
      this.volumeSlider.value = volume.toString();
    }
  }

  private toggleSettingsMenu(): void {
    const isVisible = this.settingsMenu.classList.contains('visible');
    if (isVisible) {
      this.settingsMenu.classList.remove('visible');
    } else {
      this.renderSettingsContent();
      this.settingsMenu.classList.add('visible');
    }
  }

  private renderSettingsContent(): void {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const qualities = this.player.getQualities();

    const isLooping = this.player.videoElement.loop;

    this.settingsMenu.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; padding: 4px 8px;">Playback Options</div>
      <div class="ext-player-menu-item ${isLooping ? 'active' : ''}" data-action="toggle-loop">
        <span>Loop Video</span>
        ${isLooping ? '✓' : ''}
      </div>

      ${this.player.options.tracks && this.player.options.tracks.length > 0 ? `
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; padding: 8px 8px 4px 8px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.1);">Subtitles</div>
        <div class="ext-player-menu-item ${!this.activeTrackId ? 'active' : ''}" data-track-id="off">
          <span>Off</span>
          ${!this.activeTrackId ? '✓' : ''}
        </div>
        ${this.player.options.tracks.map((t, idx) => {
          const tId = t.id || `track-${idx}`;
          const isActive = this.activeTrackId === tId;
          return `
            <div class="ext-player-menu-item ${isActive ? 'active' : ''}" data-track-id="${tId}">
              <span>${t.label}</span>
              ${isActive ? '✓' : ''}
            </div>
          `;
        }).join('')}
      ` : ''}

      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; padding: 8px 8px 4px 8px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.1);">Speed</div>
      ${speeds.map(speed => `
        <div class="ext-player-menu-item ${this.activeSpeed === speed ? 'active' : ''}" data-speed="${speed}">
          <span>${speed === 1.0 ? 'Normal' : speed + 'x'}</span>
          ${this.activeSpeed === speed ? '✓' : ''}
        </div>
      `).join('')}
      
      ${qualities.length > 0 ? `
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; padding: 8px 8px 4px 8px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.1);">Quality</div>
        ${qualities.map(q => {
          const isActive = this.activeQuality === String(q.id) || this.activeQuality === q.label;
          return `
            <div class="ext-player-menu-item ${isActive ? 'active' : ''}" data-quality-id="${q.id}">
              <span>${q.label}</span>
              ${isActive ? '✓' : ''}
            </div>
          `;
        }).join('')}
      ` : ''}
    `;

    this.settingsMenu.querySelectorAll('[data-track-id]').forEach(item => {
      item.addEventListener('click', (e) => {
        const trackId = (e.currentTarget as HTMLElement).dataset.trackId;
        this.activeTrackId = trackId === 'off' ? null : (trackId || null);
        
        const textTracks = this.player.videoElement.textTracks;
        for (let i = 0; i < textTracks.length; i++) {
          textTracks[i].mode = (this.activeTrackId && i.toString() === this.activeTrackId) ? 'showing' : 'disabled';
        }
        
        this.settingsMenu.classList.remove('visible');
      });
    });

    this.settingsMenu.querySelectorAll('[data-speed]').forEach(item => {
      item.addEventListener('click', (e) => {
        const speed = parseFloat((e.currentTarget as HTMLElement).dataset.speed || '1.0');
        this.activeSpeed = speed;
        this.player.setPlaybackRate(speed);
        this.settingsMenu.classList.remove('visible');
      });
    });

    this.settingsMenu.querySelectorAll('[data-quality-id]').forEach(item => {
      item.addEventListener('click', (e) => {
        const qId = (e.currentTarget as HTMLElement).dataset.qualityId || 'auto';
        this.activeQuality = String(qId);
        this.player.setQuality(qId);
        this.settingsMenu.classList.remove('visible');
      });
    });
  }

  public destroy(): void {
    if (this.controlsBar && this.controlsBar.parentNode) {
      this.controlsBar.parentNode.removeChild(this.controlsBar);
    }
    if (this.bigPlayBtn && this.bigPlayBtn.parentNode) {
      this.bigPlayBtn.parentNode.removeChild(this.bigPlayBtn);
    }
    if (this.headerTitleBar && this.headerTitleBar.parentNode) {
      this.headerTitleBar.parentNode.removeChild(this.headerTitleBar);
    }
    if (this.unmuteBanner && this.unmuteBanner.parentNode) {
      this.unmuteBanner.parentNode.removeChild(this.unmuteBanner);
    }
  }
}
