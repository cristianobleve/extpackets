export interface AudioTrack {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  src: string;
}

export interface ExtAudioOptions {
  target: string | HTMLElement;
  playlist: AudioTrack[];
  autoplay?: boolean;
  theme?: 'shadcn' | 'obsidian' | 'cinema' | string;
}

export class ExtAudio {
  private container: HTMLElement;
  private options: ExtAudioOptions;
  private audio: HTMLAudioElement;
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private canvas?: HTMLCanvasElement;
  private animFrameId?: number;

  constructor(options: ExtAudioOptions) {
    this.options = options;
    this.container = typeof options.target === 'string' ? document.querySelector(options.target)! : options.target;
    this.audio = new Audio();
    
    this.render();
    if (this.options.playlist && this.options.playlist.length > 0) {
      this.loadTrack(0);
    }
  }

  public render(): void {
    this.container.classList.add('ext-audio-root');
    this.container.innerHTML = `
      <style>
        .ext-audio-root {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 24px;
          color: #f4f4f5;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 420px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
          box-sizing: border-box;
        }

        .ext-audio-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ext-audio-cover {
          width: 72px;
          height: 72px;
          border-radius: 8px;
          object-fit: cover;
          background: #18181b;
          border: 1px solid #27272a;
          flex-shrink: 0;
        }

        .ext-audio-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }

        .ext-audio-title {
          font-size: 1rem;
          font-weight: 600;
          color: #fafafa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ext-audio-artist {
          font-size: 0.875rem;
          color: #a1a1aa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ext-audio-waveform-wrap {
          position: relative;
          width: 100%;
          height: 48px;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 4px;
          box-sizing: border-box;
        }

        .ext-audio-waveform {
          width: 100%;
          height: 100%;
          display: block;
        }

        .ext-audio-progress-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ext-audio-slider-bg {
          width: 100%;
          height: 6px;
          background: #27272a;
          border-radius: 9999px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .ext-audio-slider-fill {
          height: 100%;
          width: 0%;
          background: #fafafa;
          border-radius: 9999px;
          transition: width 0.1s linear;
        }

        .ext-audio-time-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #a1a1aa;
          font-variant-numeric: tabular-nums;
        }

        .ext-audio-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .ext-audio-btn {
          background: #18181b;
          border: 1px solid #27272a;
          color: #f4f4f5;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
        }

        .ext-audio-btn:hover {
          background: #27272a;
          border-color: #3f3f46;
          color: #ffffff;
        }

        .ext-audio-btn:active {
          transform: scale(0.96);
        }

        .ext-audio-btn.play-main {
          background: #fafafa;
          color: #09090b;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 50%;
        }

        .ext-audio-btn.play-main:hover {
          background: #e4e4e7;
        }

        .ext-audio-btn svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }

        .ext-audio-btn.play-main svg {
          width: 20px;
          height: 20px;
        }
      </style>

      <div class="ext-audio-header">
        <img class="ext-audio-cover" id="cover" src="" alt="Cover" />
        <div class="ext-audio-meta">
          <div class="ext-audio-title" id="title">Select Track</div>
          <div class="ext-audio-artist" id="artist">-</div>
        </div>
      </div>

      <div class="ext-audio-waveform-wrap">
        <canvas class="ext-audio-waveform" id="waveform"></canvas>
      </div>

      <div class="ext-audio-progress-container">
        <div class="ext-audio-slider-bg" id="slider-bg">
          <div class="ext-audio-slider-fill" id="slider-fill"></div>
        </div>
        <div class="ext-audio-time-row">
          <span id="time-curr">0:00</span>
          <span id="time-dur">0:00</span>
        </div>
      </div>

      <div class="ext-audio-controls">
        <button class="ext-audio-btn" id="prev" title="Previous">
          <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button class="ext-audio-btn play-main" id="play" title="Play/Pause">
          <svg id="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="ext-audio-btn" id="next" title="Next">
          <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>
    `;

    this.canvas = this.container.querySelector('#waveform') as HTMLCanvasElement;
    this.bindEvents();
  }

  private bindEvents(): void {
    const playBtn = this.container.querySelector('#play')!;
    const prevBtn = this.container.querySelector('#prev')!;
    const nextBtn = this.container.querySelector('#next')!;
    const sliderBg = this.container.querySelector('#slider-bg')!;

    playBtn.addEventListener('click', () => this.togglePlay());
    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());

    sliderBg.addEventListener('click', (e: any) => {
      const rect = sliderBg.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (this.audio.duration) {
        this.audio.currentTime = pos * this.audio.duration;
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      const fill = this.container.querySelector('#slider-fill') as HTMLElement;
      const curr = this.container.querySelector('#time-curr') as HTMLElement;
      const dur = this.container.querySelector('#time-dur') as HTMLElement;

      if (fill && this.audio.duration) {
        fill.style.width = `${(this.audio.currentTime / this.audio.duration) * 100}%`;
        curr.textContent = this.formatTime(this.audio.currentTime);
        dur.textContent = this.formatTime(this.audio.duration);
      }
    });

    this.audio.addEventListener('ended', () => this.next());
  }

  public loadTrack(index: number): void {
    if (index < 0 || index >= this.options.playlist.length) return;
    this.currentIndex = index;
    const track = this.options.playlist[index];

    this.audio.src = track.src;
    (this.container.querySelector('#title')!).textContent = track.title;
    (this.container.querySelector('#artist')!).textContent = track.artist;
    (this.container.querySelector('#cover') as HTMLImageElement).src = track.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';

    if (this.isPlaying) this.audio.play();
  }

  public togglePlay(): void {
    const playIcon = this.container.querySelector('#play-icon')!;
    if (this.audio.paused) {
      this.audio.play();
      this.isPlaying = true;
      playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      this.startWaveform();
    } else {
      this.audio.pause();
      this.isPlaying = false;
      playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    }
  }

  public next(): void {
    this.loadTrack((this.currentIndex + 1) % this.options.playlist.length);
  }

  public prev(): void {
    this.loadTrack((this.currentIndex - 1 + this.options.playlist.length) % this.options.playlist.length);
  }

  private startWaveform(): void {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    this.canvas.width = this.canvas.clientWidth * 2;
    this.canvas.height = this.canvas.clientHeight * 2;

    let phase = 0;

    const draw = () => {
      if (!this.isPlaying) return;
      this.animFrameId = requestAnimationFrame(draw);

      const width = this.canvas!.width;
      const height = this.canvas!.height;
      phase += 0.08;

      ctx.clearRect(0, 0, width, height);

      // Draw 60 thin ultra-clean rounded pill bars (SoundCloud / Apple Music style)
      const bars = 55;
      const gap = 4;
      const barWidth = (width - (bars * gap)) / bars;

      const progress = this.audio.duration ? (this.audio.currentTime / this.audio.duration) : 0;
      const activeBars = Math.floor(progress * bars);

      for (let i = 0; i < bars; i++) {
        // Sine wave animation calculation for realistic smooth audio pulse
        const sinVal = Math.sin(i * 0.2 + phase) * 0.4 + Math.cos(i * 0.15 - phase * 0.5) * 0.4;
        const barHeight = Math.max(6, (Math.abs(sinVal) * (height * 0.75)));
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Active bars glow white/blue, inactive bars are subtle dark zinc
        if (i <= activeBars) {
          ctx.fillStyle = '#60a5fa';
        } else {
          ctx.fillStyle = '#27272a';
        }

        // Draw smooth rounded pill bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 999);
        ctx.fill();
      }
    };
    draw();
  }

  private formatTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}

if (typeof window !== 'undefined') {
  (window as any).ExtAudio = ExtAudio;
}
