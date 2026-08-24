export interface LightboxItem {
  src: string;
  caption?: string;
  alt?: string;
}

export interface ExtLightboxOptions {
  items: LightboxItem[];
  startIndex?: number;
}

export class ExtLightbox {
  private options: ExtLightboxOptions;
  private overlay?: HTMLElement;
  private currentIndex: number = 0;
  private scale: number = 1;

  private handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  };

  constructor(options: ExtLightboxOptions) {
    this.options = options;
    this.currentIndex = options.startIndex || 0;
  }

  public open(index: number = 0): void {
    this.currentIndex = index;
    document.removeEventListener('keydown', this.handleKeydown);
    document.addEventListener('keydown', this.handleKeydown);
    this.render();
  }

  private render(): void {
    if (this.overlay) this.overlay.remove();

    const item = this.options.items[this.currentIndex];

    this.overlay = document.createElement('div');
    this.overlay.className = 'ext-lightbox-overlay';
    this.overlay.innerHTML = `
      <style>
        .ext-lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(9, 9, 11, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 999999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          color: #f4f4f5;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
        }

        .ext-lightbox-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
        }

        .ext-lightbox-counter {
          background: #18181b;
          border: 1px solid #27272a;
          color: #a1a1aa;
          font-size: 0.8125rem;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 9999px;
          letter-spacing: 0.3px;
        }

        .ext-lightbox-btn-close {
          background: #18181b;
          border: 1px solid #27272a;
          color: #f4f4f5;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .ext-lightbox-btn-close:hover {
          background: #27272a;
          border-color: #3f3f46;
        }

        .ext-lightbox-btn-close svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }

        .ext-lightbox-viewport {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          max-height: 80vh;
          overflow: hidden;
        }

        .ext-lightbox-img {
          max-width: 90vw;
          max-height: 75vh;
          border-radius: 12px;
          border: 1px solid #27272a;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          object-fit: contain;
        }

        .ext-lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: #18181b;
          border: 1px solid #27272a;
          color: #f4f4f5;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
          z-index: 10;
        }

        .ext-lightbox-nav:hover {
          background: #27272a;
          border-color: #3f3f46;
        }

        .ext-lightbox-nav.prev { left: 24px; }
        .ext-lightbox-nav.next { right: 24px; }

        .ext-lightbox-nav svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }

        .ext-lightbox-footer {
          margin-top: 16px;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 0.875rem;
          color: #a1a1aa;
          text-align: center;
          max-width: 600px;
        }
      </style>

      <div class="ext-lightbox-header">
        <div class="ext-lightbox-counter">${this.currentIndex + 1} / ${this.options.items.length}</div>
        <button class="ext-lightbox-btn-close" id="close" title="Close">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div class="ext-lightbox-viewport" id="viewport">
        <button class="ext-lightbox-nav prev" id="prev" title="Previous">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>

        <img class="ext-lightbox-img" id="img" src="${item.src}" alt="${item.alt || ''}" />

        <button class="ext-lightbox-nav next" id="next" title="Next">
          <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
      </div>

      ${item.caption ? `<div class="ext-lightbox-footer">${item.caption}</div>` : '<div></div>'}
    `;

    document.body.appendChild(this.overlay);
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.overlay) return;
    const closeBtn = this.overlay.querySelector('#close')!;
    const prevBtn = this.overlay.querySelector('#prev')!;
    const nextBtn = this.overlay.querySelector('#next')!;
    const img = this.overlay.querySelector('#img') as HTMLImageElement;
    const viewport = this.overlay.querySelector('#viewport') as HTMLElement;

    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.close(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    if (viewport) {
      viewport.addEventListener('click', (e) => {
        if (e.target === viewport) this.close();
      });
    }

    // Wheel zoom
    img.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.scale += e.deltaY * -0.002;
      this.scale = Math.min(Math.max(0.8, this.scale), 3.5);
      img.style.transform = `scale(${this.scale})`;
    });

    // Error handling for missing images
    img.addEventListener('error', () => {
      const footer = this.overlay?.querySelector('.ext-lightbox-footer');
      if (footer && !footer.innerHTML.includes('non disponibile')) {
        footer.innerHTML += ' <span style="color: #ef4444; font-size: 0.8rem; margin-left: 8px;">(Non disponibile)</span>';
      }
    });
  }

  public next(): void {
    this.scale = 1;
    this.currentIndex = (this.currentIndex + 1) % this.options.items.length;
    this.render();
  }

  public prev(): void {
    this.scale = 1;
    this.currentIndex = (this.currentIndex - 1 + this.options.items.length) % this.options.items.length;
    this.render();
  }

  public close(): void {
    document.removeEventListener('keydown', this.handleKeydown);
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = undefined;
    }
  }
}

if (typeof window !== 'undefined') {
  (window as any).ExtLightbox = ExtLightbox;
}
