# @cristianobleve/player 🎬

![ExtPlayer v1.0 Banner](https://img.cristianobleve.com/img/pictures/ext_v1.png)

> Next-generation, ultra-modular, modern HTML5 Video Player with Glassmorphism UI, Preset Themes, HLS/DASH Streaming, DRM, Auto-Poster Extraction, and Smart Autoplay Policy.

[![npm version](https://img.shields.io/npm/v/@cristianobleve/player.svg?style=flat-square)](https://www.npmjs.com/package/@cristianobleve/player)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](./LICENSE)

---

## ✨ Features

- 💎 **Modern Luxury Aesthetics**: Inspired by Apple TV+ & Vercel with Glassmorphism UI & micro-animations.
- 🎨 **Built-in Preset Themes**: Switch between `obsidian`, `cinema`, `nordic`, and `monochrome` presets or supply custom CSS variables.
- ⚡ **Zero-Config CDN AutoInit**: Include 1 script tag and use `<div data-ext-player data-src="..."></div>`.
- 📡 **Adaptive HLS & Multi-Bitrate**: Built-in `HLS.js` integration with automatic quality level switching.
- 🖼️ **Auto-Poster Frame Extraction**: Automatically extracts a high-quality video snapshot if no custom poster image is provided.
- 🤖 **Smart Autoplay Policy Handler**: Automatically falls back to muted playback with a tap-to-unmute banner if unmuted autoplay is blocked by browser policies.
- 📐 **Mobile & Responsive First**: Smooth controls scaling from tiny 320px mobile screens to 1440px+ 4K displays.
- 🔒 **DRM Support**: Widevine, FairPlay, and PlayReady Encrypted Media Extensions (EME) hooks.

---

## 📦 Installation

### Via NPM / Yarn / PNPM

```bash
npm install @cristianobleve/player
```

```javascript
import ExtPlayer from '@cristianobleve/player';
import '@cristianobleve/player/css';

const player = new ExtPlayer('#video-container', {
  src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  title: '🌊 Ocean Wildlife',
  theme: 'obsidian'
});
```

### Via CDN (Script Tag)

```html
<!-- ExtPlayer Stylesheet -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@extpackets/player@latest/dist/ext-player.css">

<!-- ExtPlayer Script -->
<script src="https://cdn.jsdelivr.net/npm/@extpackets/player@latest/dist/ext-player.min.js"></script>

<!-- Declarative HTML Tag -->
<div 
  data-ext-player 
  data-src="https://vjs.zencdn.net/v/oceans.mp4" 
  data-title="🌊 Oceans Showcase"
  data-theme="obsidian">
</div>
```

---

## ⚙️ Options Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `target` | `string \| HTMLElement` | *(required)* | Selector or DOM container element |
| `src` | `string` | `''` | Video source URL (MP4, HLS `.m3u8`, WebM, Cloud links) |
| `poster` | `string` | `''` | Custom poster image URL |
| `autoPoster` | `boolean` | `true` | Auto-extract thumbnail frame from video if poster is missing |
| `title` | `string` | `''` | Title string overlay displayed in top left bar |
| `showTitle` | `boolean` | `true` | Show or hide top header title bar |
| `theme` | `'obsidian' \| 'cinema' \| 'nordic' \| 'monochrome'` | `'obsidian'` | Built-in theme preset |
| `fontFamily` | `string` | System Fonts | Custom CSS `font-family` string |
| `fontUrl` | `string` | `''` | Google Font or CSS font URL to auto-inject into `<head>` |
| `autoplay` | `boolean \| 'muted' \| 'play'` | `false` | Smart Autoplay with automatic muted fallback |
| `loop` | `boolean` | `false` | Loop video playback |
| `muted` | `boolean` | `false` | Start muted |
| `volume` | `number` | `1.0` | Initial volume level (0.0 to 1.0) |

---

## 📄 License

MIT © [Cristiano Bleve](https://github.com/cristianobleve)
