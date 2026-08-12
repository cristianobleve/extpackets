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

  constructor(options: ExtLightboxOptions) {
    this.options = options;
    this.currentIndex = options.startIndex || 0;
  }

  public open(index: number = 0): void {
    this.currentIndex = index;
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
          background: rgba(8, 10, 15, 0.92);
          backdrop-filter: blur(24px);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .ext-lightbox-img {
          max-width: 90vw;
          max-height: 80vh;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          transition: transform 0.2s ease;
          user-select: none;
        }
        .ext-lightbox-caption {
          margin-top: 16px;
          font-size: 0.95rem;
          color: #94a3b8;
        }
        .ext-lightbox-close {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5rem;
        }
        .ext-lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5rem;
        }
        .ext-lightbox-nav.prev { left: 24px; }
        .ext-lightbox-nav.next { right: 24px; }
      </style>

      <button class="ext-lightbox-close" id="close">&times;</button>
      <button class="ext-lightbox-nav prev" id="prev">&#10094;</button>
      <button class="ext-lightbox-nav next" id="next">&#10095;</button>
      <img class="ext-lightbox-img" id="img" src="${item.src}" alt="${item.alt || ''}" />
      <div class="ext-lightbox-caption">${item.caption || ''}</div>
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

    closeBtn.addEventListener('click', () => this.close());
    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());

    // Wheel zoom
    img.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.scale += e.deltaY * -0.002;
      this.scale = Math.min(Math.max(0.8, this.scale), 4);
      img.style.transform = `scale(${this.scale})`;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowLeft') this.prev();
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
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = undefined;
    }
  }
}
