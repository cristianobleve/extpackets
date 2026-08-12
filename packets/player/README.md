# @cristianobleve/player 🎬

![ExtPlayer Banner](https://img.cristianobleve.com/img/pictures/ext_v1.png)

> Next-generation, ultra-modular, modern Geometric Dark HTML5 Video Player with YouTube / Vimeo Embeds, HLS Streaming, DRM, and Auto-Poster Frame Extraction.

[![npm version](https://img.shields.io/npm/v/@cristianobleve/player.svg?style=flat-square)](https://www.npmjs.com/package/@cristianobleve/player)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](./LICENSE)

---

## ✨ Features

- 🖤 **Geometric Dark Aesthetics**: Modern pitch-black (`#000000`) theme with high-contrast sharp 6px geometry and monochrome controls.
- 🌐 **Universal Provider Resolution**: Native support for **YouTube**, **Vimeo**, **Dailymotion**, **Twitch**, **Google Drive**, **Dropbox**, and **AWS S3 / R2**.
- 📡 **Adaptive HLS & Multi-Bitrate**: Built-in `HLS.js` integration with automatic quality level switching.
- 🖼️ **Auto-Poster Frame Extraction**: Automatically extracts a high-quality video snapshot if no custom poster image is provided.
- 🤖 **Smart Autoplay Policy Handler**: Automatically falls back to muted playback with a tap-to-unmute banner if unmuted autoplay is blocked.
- 📐 **Mobile & Responsive First**: Smooth controls scaling from tiny 320px mobile screens to 1440px+ 4K displays.
- 🔒 **DRM EME Hooks**: Widevine, FairPlay, and PlayReady Encrypted Media Extensions support.

---

## 📦 Installation

### Via NPM

```bash
npm install @cristianobleve/player
```

```javascript
import ExtPlayer from '@cristianobleve/player';
import '@cristianobleve/player/css';

// Initialize player
const player = new ExtPlayer('#video-container', {
  src: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  title: '🎬 Sintel Movie Trailer',
  theme: 'monochrome', // 'monochrome' | 'obsidian' | 'cinema' | 'nordic'
  autoplay: false
});
```

### Via CDN (Browser Script Tag)

```html
<!-- ExtPlayer Stylesheet -->
<link rel="stylesheet" href="https://cdn.cristianobleve.com/packets/player/latest/ext-player.css">

<!-- ExtPlayer Script -->
<script src="https://cdn.cristianobleve.com/packets/player/latest/ext-player.min.js"></script>

<div id="player-target"></div>

<script>
  new ExtPlayer('#player-target', {
    src: 'https://www.youtube.com/watch?v=L_LUpnjgPso', // Works with YouTube!
    title: 'YouTube Embed Demo'
  });
</script>
```

---

## 💻 Code Examples

### 1. Direct MP4 Video
```javascript
const player = new ExtPlayer('#video', {
  src: 'https://vjs.zencdn.net/v/oceans.mp4',
  title: '🌊 Oceans Wildlife',
  theme: 'monochrome'
});
```

### 2. YouTube / Vimeo Video
```javascript
const player = new ExtPlayer('#video', {
  src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'YouTube Stream'
});
```

### 3. Adaptive HLS (`.m3u8`) Streaming
```javascript
const player = new ExtPlayer('#video', {
  src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  title: '📡 Live HLS Stream'
});
```

---

## 🛠️ Methods & API

```javascript
// Controls
player.play();
player.pause();
player.togglePlay();
player.seek(30); // Seek to 30s
player.setVolume(0.8);
player.setMuted(true);
player.toggleFullscreen();

// Events
player.on('play', () => console.log('Video started'));
player.on('pause', () => console.log('Video paused'));
player.on('ended', () => console.log('Playback completed'));
player.on('timeupdate', ({ currentTime, duration }) => {
  console.log(`Progress: ${currentTime} / ${duration}`);
});
```

---

## ⚙️ Options Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `target` | `string \| HTMLElement` | *(required)* | Selector or DOM container element |
| `src` | `string` | `''` | Video source URL (MP4, YouTube, Vimeo, HLS `.m3u8`, Cloud links) |
| `poster` | `string` | `''` | Custom poster image URL |
| `autoPoster` | `boolean` | `true` | Auto-extract thumbnail frame from video if poster is missing |
| `title` | `string` | `''` | Title string overlay displayed in top left bar |
| `showTitle` | `boolean` | `true` | Show or hide top header title bar |
| `theme` | `'monochrome' \| 'obsidian' \| 'cinema' \| 'nordic'` | `'monochrome'` | Built-in theme preset |
| `autoplay` | `boolean \| 'muted' \| 'play'` | `false` | Smart Autoplay with automatic muted fallback |
| `loop` | `boolean` | `false` | Loop video playback |
| `muted` | `boolean` | `false` | Start muted |
| `volume` | `number` | `1.0` | Initial volume level (0.0 to 1.0) |

---

## 📄 License

MIT © [Cristiano Bleve](https://github.com/cristianobleve)
