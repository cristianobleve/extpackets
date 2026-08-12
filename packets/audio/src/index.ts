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
  theme?: 'obsidian' | 'cinema' | 'nordic' | string;
  showWaveform?: boolean;
}

export class ExtAudio {
  private container: HTMLElement;
  private options: ExtAudioOptions;
  private audio: HTMLAudioElement;
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private canvas?: HTMLCanvasElement;

  constructor(options: ExtAudioOptions) {
    this.options = options;
    this.container = typeof options.target === 'string' ? document.querySelector(options.target)! : options.target;
    this.audio = new Audio();
    
    this.render();
    if (this.options.playlist.length > 0) {
      this.loadTrack(0);
    }
  }

  public render(): void {
    this.container.classList.add('ext-audio-root', `theme-${this.options.theme || 'obsidian'}`);
    this.container.innerHTML = `
      <style>
        .ext-audio-root {
          background: rgba(18, 22, 31, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          color: #f1f5f9;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .ext-audio-cover {
          width: 100%;
          height: 220px;
          border-radius: 12px;
          object-fit: cover;
          background: #1e293b;
        }
        .ext-audio-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ext-audio-title { font-weight: 700; font-size: 1.1rem; }
        .ext-audio-artist { color: #94a3b8; font-size: 0.9rem; }
        .ext-audio-waveform { width: 100%; height: 50px; background: rgba(0,0,0,0.2); border-radius: 8px; }
        .ext-audio-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ext-audio-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          padding: 10px 16px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.1rem;
        }
        .ext-audio-btn.play { background: #3b82f6; width: 50px; height: 50px; border-radius: 50%; }
      </style>

      <img class="ext-audio-cover" id="cover" src="" alt="Cover" />
      <div class="ext-audio-info">
        <div class="ext-audio-title" id="title">Select Track</div>
        <div class="ext-audio-artist" id="artist">-</div>
      </div>
      <canvas class="ext-audio-waveform" id="waveform"></canvas>
      <div class="ext-audio-controls">
        <button class="ext-audio-btn" id="prev">⏮</button>
        <button class="ext-audio-btn play" id="play">▶</button>
        <button class="ext-audio-btn" id="next">⏭</button>
      </div>
    `;

    this.canvas = this.container.querySelector('#waveform') as HTMLCanvasElement;
    this.bindEvents();
  }

  private bindEvents(): void {
    const playBtn = this.container.querySelector('#play')!;
    const prevBtn = this.container.querySelector('#prev')!;
    const nextBtn = this.container.querySelector('#next')!;

    playBtn.addEventListener('click', () => this.togglePlay());
    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());
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
    const playBtn = this.container.querySelector('#play')!;
    if (this.audio.paused) {
      this.audio.play();
      this.isPlaying = true;
      playBtn.textContent = '⏸';
      this.startWaveform();
    } else {
      this.audio.pause();
      this.isPlaying = false;
      playBtn.textContent = '▶';
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

    const draw = () => {
      if (!this.isPlaying) return;
      requestAnimationFrame(draw);

      ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      ctx.fillStyle = '#3b82f6';
      
      const bars = 30;
      for (let i = 0; i < bars; i++) {
        const height = Math.random() * this.canvas!.height * 0.8;
        ctx.fillRect(i * 12 + 10, (this.canvas!.height - height) / 2, 6, height);
      }
    };
    draw();
  }
}

if (typeof window !== 'undefined') {
  (window as any).ExtAudio = ExtAudio;
}
