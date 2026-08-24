export interface LightboxItem {
  src: string;
  caption?: string;
  alt?: string;
  tag?: string;
}

export interface ExtLightboxOptions {
  items: LightboxItem[];
  startIndex?: number;
  drm?: boolean; // Anti-screenshot / privacy protection (default true)
  allowZoom?: boolean;
  allowRotate?: boolean;
}

export class ExtLightbox {
  private options: ExtLightboxOptions;
  private overlay?: HTMLElement;
  private currentIndex: number = 0;
  private scale: number = 1;
  private rotation: number = 0;
  private translateX: number = 0;
  private translateY: number = 0;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isDrmBlackout: boolean = false;

  private handleKeydown = (e: KeyboardEvent) => {
    // Immediate DRM shield trigger on Meta (Windows key) or PrintScreen
    if (e.key === 'Meta' || e.key === 'OS' || e.code?.includes('Meta') || e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S' || e.key === 'I'))) {
      this.triggerDrmShield();
    }

    if (e.key === 'Escape') {
      this.close();
      return;
    }
    if (e.key === 'ArrowRight') {
      this.next();
      return;
    }
    if (e.key === 'ArrowLeft') {
      this.prev();
      return;
    }
    if (e.key === '+' || e.key === '=') {
      this.zoomIn();
      return;
    }
    if (e.key === '-' || e.key === '_') {
      this.zoomOut();
      return;
    }
    if (e.key === '0') {
      this.resetTransform();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      this.rotate();
      return;
    }
  };

  private handleKeyup = (e: KeyboardEvent) => {
    if (e.key === 'Meta' || e.key === 'OS' || e.code?.includes('Meta')) {
      // If user released Windows key and window is still focused, restore
      if (document.hasFocus()) {
        setTimeout(() => this.hideDrmShield(), 300);
      }
    }
  };

  private handleWindowBlur = () => {
    if (this.options.drm !== false) {
      this.triggerDrmShield();
    }
  };

  private handleWindowFocus = () => {
    if (this.options.drm !== false && this.isDrmBlackout) {
      setTimeout(() => this.hideDrmShield(), 250);
    }
  };

  private handleVisibilityChange = () => {
    if (this.options.drm !== false) {
      if (document.visibilityState === 'hidden') {
        this.triggerDrmShield();
      } else {
        setTimeout(() => this.hideDrmShield(), 250);
      }
    }
  };

  constructor(options: ExtLightboxOptions) {
    this.options = { drm: true, allowZoom: true, allowRotate: true, ...options };
    this.currentIndex = options.startIndex || 0;
  }

  public open(index: number = 0): void {
    this.currentIndex = Math.max(0, Math.min(index, this.options.items.length - 1));
    this.scale = 1;
    this.rotation = 0;
    this.translateX = 0;
    this.translateY = 0;

    this.cleanupListeners();
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('keyup', this.handleKeyup);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.render();
  }

  private triggerDrmShield(): void {
    this.isDrmBlackout = true;
    if (this.overlay) {
      const shield = this.overlay.querySelector('.ext-lightbox-drm-shield') as HTMLElement;
      const img = this.overlay.querySelector('#img') as HTMLElement;
      if (shield) shield.classList.add('active');
      if (img) img.style.filter = 'blur(40px) brightness(0)';
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    } catch (_) {}
  }

  private hideDrmShield(): void {
    this.isDrmBlackout = false;
    if (this.overlay) {
      const shield = this.overlay.querySelector('.ext-lightbox-drm-shield') as HTMLElement;
      const img = this.overlay.querySelector('#img') as HTMLElement;
      if (shield) shield.classList.remove('active');
      if (img) img.style.filter = 'none';
    }
  }

  private updateTransform(): void {
    if (!this.overlay) return;
    const img = this.overlay.querySelector('#img') as HTMLImageElement;
    const zoomBadge = this.overlay.querySelector('.ext-lightbox-zoom-badge');
    if (img) {
      img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale}) rotate(${this.rotation}deg)`;
      img.style.cursor = this.scale > 1.05 ? (this.isDragging ? 'grabbing' : 'grab') : 'default';
    }
    if (zoomBadge) {
      zoomBadge.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  public zoomIn(): void {
    this.scale = Math.min(4, +(this.scale + 0.25).toFixed(2));
    this.updateTransform();
  }

  public zoomOut(): void {
    this.scale = Math.max(0.6, +(this.scale - 0.25).toFixed(2));
    if (this.scale <= 1) {
      this.translateX = 0;
      this.translateY = 0;
    }
    this.updateTransform();
  }

  public resetTransform(): void {
    this.scale = 1;
    this.rotation = 0;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
  }

  public rotate(): void {
    this.rotation = (this.rotation + 90) % 360;
    this.updateTransform();
  }

  private updateSlide(direction: 'next' | 'prev' = 'next'): void {
    if (!this.overlay) return;

    const item = this.options.items[this.currentIndex] || { src: '', caption: '', alt: '' };
    const total = this.options.items.length;

    const img = this.overlay.querySelector('#img') as HTMLImageElement;
    const counterBadge = this.overlay.querySelector('.ext-lightbox-counter-text');
    const footerCaption = this.overlay.querySelector('.ext-lightbox-footer-caption');

    if (counterBadge) {
      counterBadge.textContent = `${this.currentIndex + 1} / ${total}`;
    }

    if (footerCaption) {
      footerCaption.textContent = item.caption || 'Documento Ospite';
    }

    this.scale = 1;
    this.rotation = 0;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();

    if (img) {
      // Smooth slide transition
      img.style.transition = 'opacity 0.12s ease, transform 0.12s ease';
      img.style.opacity = '0.3';
      img.style.transform = `scale(0.96) translate(${direction === 'next' ? '15px' : '-15px'}, 0)`;

      setTimeout(() => {
        img.src = item.src;
        img.alt = item.alt || '';
        img.style.opacity = '1';
        img.style.transform = 'scale(1) translate(0, 0)';
      }, 80);
    }
  }

  private render(): void {
    if (this.overlay) this.overlay.remove();

    const item = this.options.items[this.currentIndex] || { src: '', caption: '', alt: '' };
    const total = this.options.items.length;

    this.overlay = document.createElement('div');
    this.overlay.className = 'ext-lightbox-overlay';
    this.overlay.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .ext-lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 6, 9, 0.88);
          backdrop-filter: blur(28px) saturate(1.8);
          -webkit-backdrop-filter: blur(28px) saturate(1.8);
          z-index: 9999999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          color: #ffffff;
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
          user-select: none;
          -webkit-user-select: none;
          isolation: isolate;
          animation: extLbFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes extLbFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        /* ── Top Floating Glass Pill Bar ── */
        .ext-lightbox-header {
          width: 100%;
          max-width: 1200px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 20;
          gap: 12px;
        }

        .ext-lightbox-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ext-lightbox-pill-badge {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 8px 20px rgba(0, 0, 0, 0.4);
          color: #ffffff;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.3px;
        }

        .ext-lightbox-drm-badge {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #34d399;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ext-lightbox-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 9999px;
          padding: 4px 6px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .ext-lightbox-tool-btn {
          background: transparent;
          border: none;
          color: #e4e4e7;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, color 0.15s ease;
          padding: 0;
          transform: scale(1);
          transform-origin: center center;
        }

        .ext-lightbox-tool-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          transform: scale(1.08);
        }

        .ext-lightbox-tool-btn:active {
          transform: scale(0.94) !important;
        }

        .ext-lightbox-tool-btn svg {
          width: 18px;
          height: 18px;
          stroke: currentColor;
          stroke-width: 2.2;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          display: block;
          pointer-events: none;
        }

        .ext-lightbox-btn-close {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .ext-lightbox-btn-close:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #ffffff;
          border-color: rgba(239, 68, 68, 0.5);
        }

        /* ── Main Viewport ── */
        .ext-lightbox-viewport {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          max-height: calc(100vh - 150px);
          overflow: hidden;
          cursor: default;
        }

        .ext-lightbox-img-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          max-width: 90vw;
          max-height: 74vh;
          will-change: transform;
        }

        .ext-lightbox-img {
          max-width: 88vw;
          max-height: 72vh;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: filter 0.2s ease;
          user-select: none;
          -webkit-user-select: none;
          object-fit: contain;
          pointer-events: auto;
          background: #09090b;
        }

        /* ── Side Navigation Arrows (Fixed Center Alignment) ── */
        .ext-lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%) scale(1);
          transform-origin: center center;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(24px) saturate(1.8);
          -webkit-backdrop-filter: blur(24px) saturate(1.8);
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
          color: #ffffff;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          z-index: 25;
          padding: 0;
          outline: none;
        }

        .ext-lightbox-nav:hover {
          background: rgba(255, 255, 255, 0.24);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-50%) scale(1.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(255, 255, 255, 0.2);
        }

        .ext-lightbox-nav:active {
          transform: translateY(-50%) scale(0.94) !important;
        }

        .ext-lightbox-nav.prev { left: 24px; }
        .ext-lightbox-nav.next { right: 24px; }

        .ext-lightbox-nav svg {
          width: 26px;
          height: 26px;
          stroke: #ffffff;
          stroke-width: 2.8;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          display: block;
          pointer-events: none;
        }

        /* ── Bottom Floating Pill Bar ── */
        .ext-lightbox-footer {
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(24px) saturate(1.8);
          -webkit-backdrop-filter: blur(24px) saturate(1.8);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 9999px;
          padding: 8px 24px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #f4f4f5;
          text-align: center;
          max-width: 800px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
          z-index: 20;
        }

        .ext-lightbox-footer kbd {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.72rem;
          font-family: inherit;
          color: #ffffff;
        }

        .ext-lightbox-zoom-badge {
          background: rgba(255, 255, 255, 0.14);
          border-radius: 9999px;
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #a1a1aa;
        }

        /* ── DRM Anti-Screenshot Shield ── */
        .ext-lightbox-drm-shield {
          position: fixed;
          inset: 0;
          background: #000000;
          z-index: 10000000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s ease;
        }

        .ext-lightbox-drm-shield.active {
          opacity: 1;
          pointer-events: auto;
        }

        .ext-lightbox-shield-card {
          background: rgba(24, 24, 27, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 22px;
          padding: 36px 44px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95);
          max-width: 440px;
        }

        .ext-lightbox-shield-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34d399;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ext-lightbox-shield-icon svg {
          width: 28px;
          height: 28px;
          stroke: currentColor;
          stroke-width: 2.2;
          fill: none;
        }

        .ext-lightbox-shield-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
        }

        .ext-lightbox-shield-text {
          font-size: 0.875rem;
          color: #a1a1aa;
          line-height: 1.5;
        }

        /* ── Print Protection ── */
        @media print {
          .ext-lightbox-overlay, .ext-lightbox-img, .ext-lightbox-viewport {
            display: none !important;
            visibility: hidden !important;
          }
        }
      </style>

      <!-- Top Glass Toolbar -->
      <div class="ext-lightbox-header">
        <div class="ext-lightbox-header-left">
          <div class="ext-lightbox-pill-badge">
            <span class="ext-lightbox-counter-text">${this.currentIndex + 1} / ${total}</span>
          </div>
          ${this.options.drm !== false ? `
            <div class="ext-lightbox-drm-badge" title="Protezione Anti-Screenshot Attiva">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>DRM Protetto</span>
            </div>
          ` : ''}
        </div>

        <div class="ext-lightbox-toolbar">
          <button class="ext-lightbox-tool-btn" id="btn-zoom-out" title="Riduci Zoom (-)">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <span class="ext-lightbox-zoom-badge">100%</span>
          <button class="ext-lightbox-tool-btn" id="btn-zoom-in" title="Aumenta Zoom (+)">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button class="ext-lightbox-tool-btn" id="btn-rotate" title="Ruota 90° (R)">
            <svg viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>
          <button class="ext-lightbox-tool-btn" id="btn-reset" title="Ripristina (0)">
            <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
          </button>
          <button class="ext-lightbox-tool-btn ext-lightbox-btn-close" id="close" title="Chiudi (ESC)">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Main Viewport with Document Image & Arrows -->
      <div class="ext-lightbox-viewport" id="viewport">
        ${total > 1 ? `
          <button class="ext-lightbox-nav prev" id="prev" title="Precedente (←)">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        ` : ''}

        <div class="ext-lightbox-img-wrapper" id="img-wrapper">
          <img class="ext-lightbox-img" id="img" src="${item.src}" alt="${item.alt || ''}" draggable="false" oncontextmenu="return false;" />
        </div>

        ${total > 1 ? `
          <button class="ext-lightbox-nav next" id="next" title="Successivo (→)">
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        ` : ''}
      </div>

      <!-- Bottom Floating Pill Information Bar -->
      <div class="ext-lightbox-footer">
        <span class="ext-lightbox-footer-caption">${item.caption || 'Documento Ospite'}</span>
        <span style="opacity: 0.4;">•</span>
        <span style="font-size: 0.8rem; color: #a1a1aa;">
          <kbd>←</kbd> <kbd>→</kbd> Naviga &nbsp;|&nbsp; <kbd>Rotellina</kbd> Zoom &nbsp;|&nbsp; <kbd>ESC</kbd> Chiudi
        </span>
      </div>

      <!-- DRM Anti-Screenshot Full Blackout Shield -->
      <div class="ext-lightbox-drm-shield">
        <div class="ext-lightbox-shield-card">
          <div class="ext-lightbox-shield-icon">
            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div class="ext-lightbox-shield-title">Protezione Documenti Attiva</div>
          <div class="ext-lightbox-shield-text">
            La visualizzazione è oscurata durante la perdita di focus o la cattura dello schermo per proteggere i dati sensibili.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.bindEvents();
    this.updateTransform();
  }

  private bindEvents(): void {
    if (!this.overlay) return;

    const closeBtn = this.overlay.querySelector('#close');
    const prevBtn = this.overlay.querySelector('#prev');
    const nextBtn = this.overlay.querySelector('#next');
    const btnZoomIn = this.overlay.querySelector('#btn-zoom-in');
    const btnZoomOut = this.overlay.querySelector('#btn-zoom-out');
    const btnRotate = this.overlay.querySelector('#btn-rotate');
    const btnReset = this.overlay.querySelector('#btn-reset');
    const img = this.overlay.querySelector('#img') as HTMLImageElement;
    const viewport = this.overlay.querySelector('#viewport') as HTMLElement;

    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.close(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });
    if (btnZoomIn) btnZoomIn.addEventListener('click', (e) => { e.stopPropagation(); this.zoomIn(); });
    if (btnZoomOut) btnZoomOut.addEventListener('click', (e) => { e.stopPropagation(); this.zoomOut(); });
    if (btnRotate) btnRotate.addEventListener('click', (e) => { e.stopPropagation(); this.rotate(); });
    if (btnReset) btnReset.addEventListener('click', (e) => { e.stopPropagation(); this.resetTransform(); });

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    if (viewport) {
      viewport.addEventListener('click', (e) => {
        if (e.target === viewport) this.close();
      });
    }

    if (img) {
      // Wheel Zoom
      img.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.002;
        this.scale = Math.min(Math.max(0.6, this.scale + delta), 4);
        if (this.scale <= 1) {
          this.translateX = 0;
          this.translateY = 0;
        }
        this.updateTransform();
      }, { passive: false });

      // Double Click to Toggle Zoom (1x <-> 2x)
      img.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (this.scale > 1.2) {
          this.resetTransform();
        } else {
          this.scale = 2;
          this.updateTransform();
        }
      });

      // Drag Pan when zoomed
      img.addEventListener('mousedown', (e) => {
        if (this.scale > 1.05) {
          e.preventDefault();
          this.isDragging = true;
          this.dragStartX = e.clientX - this.translateX;
          this.dragStartY = e.clientY - this.translateY;
          img.style.cursor = 'grabbing';
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
          this.translateX = e.clientX - this.dragStartX;
          this.translateY = e.clientY - this.dragStartY;
          this.updateTransform();
        }
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          if (img) img.style.cursor = this.scale > 1.05 ? 'grab' : 'default';
        }
      });

      // Error handler
      img.addEventListener('error', () => {
        const footer = this.overlay?.querySelector('.ext-lightbox-footer');
        if (footer && !footer.innerHTML.includes('non disponibile')) {
          footer.innerHTML += ' <span style="color: #ef4444; font-size: 0.8rem; margin-left: 8px;">(Immagine non disponibile)</span>';
        }
      });
    }
  }

  public next(): void {
    if (this.options.items.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.options.items.length;
    this.updateSlide('next');
  }

  public prev(): void {
    if (this.options.items.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.options.items.length) % this.options.items.length;
    this.updateSlide('prev');
  }

  private cleanupListeners(): void {
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('keyup', this.handleKeyup);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  public close(): void {
    this.cleanupListeners();
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = undefined;
    }
  }
}

if (typeof window !== 'undefined') {
  (window as any).ExtLightbox = ExtLightbox;
}
