# extpackets 🚀

> Monorepo suite of high-performance, modular web components & media libraries by Cristiano Bleve.

![ExtPlayer Banner](https://img.cristianobleve.com/img/pictures/ext_v1.png)

## 📦 Suite Packages

| Package | Description | Version | NPM Link |
|---|---|---|---|
| [`@cristianobleve/player`](./packets/player) | Modern Dark Monochrome HTML5 Video Player with YouTube, HLS, DRM & Auto-Poster | `1.0.3` | [![npm](https://img.shields.io/npm/v/@cristianobleve/player.svg?style=flat-square)](https://www.npmjs.com/package/@cristianobleve/player) |
| [`@cristianobleve/audio`](./packets/audio) | Glassmorphism Audio Player with Realtime Web Audio Waveform Visualizer & Playlist | `1.0.0` | [![npm](https://img.shields.io/npm/v/@cristianobleve/audio.svg?style=flat-square)](https://www.npmjs.com/package/@cristianobleve/audio) |
| [`@cristianobleve/lightbox`](./packets/lightbox) | High-performance Image & Video Gallery Viewer with Pinch-Zoom & Pan | `1.0.0` | [![npm](https://img.shields.io/npm/v/@cristianobleve/lightbox.svg?style=flat-square)](https://www.npmjs.com/package/@cristianobleve/lightbox) |
| [`@cristianobleve/uploader`](./packets/uploader) | Drag & Drop File Uploader with Chunking, Instant Preview & Progress Bar | `1.0.0` | [![npm](https://img.shields.io/npm/v/@cristianobleve/uploader.svg?style=flat-square)](https://www.npmjs.com/package/@cristianobleve/uploader) |

---

## 💻 Usage Examples

### 1. 🎬 ExtPlayer (`@cristianobleve/player`)

#### CDN / HTML Usage:
```html
<!-- Import CSS & JS Bundle -->
<link rel="stylesheet" href="https://cdn.cristianobleve.com/packets/player/latest/ext-player.css">
<script src="https://cdn.cristianobleve.com/packets/player/latest/ext-player.min.js"></script>

<!-- Container Element -->
<div id="my-video"></div>

<script>
  // Initialize Video Player (MP4, YouTube, HLS .m3u8, Cloud URLs)
  const player = new ExtPlayer('#my-video', {
    src: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    title: '🎬 Sintel Movie Trailer',
    theme: 'monochrome', // 'monochrome' | 'obsidian' | 'cinema' | 'nordic'
    autoplay: false
  });
</script>
```

#### NPM / ES Modules Usage:
```bash
npm install @cristianobleve/player
```

```javascript
import ExtPlayer from '@cristianobleve/player';
import '@cristianobleve/player/css';

const player = new ExtPlayer('#video-container', {
  src: 'https://www.youtube.com/watch?v=L_LUpnjgPso', // Auto YouTube Embed!
  title: 'YouTube Video Demo'
});
```

---

### 2. 🎵 ExtAudio (`@cristianobleve/audio`)

```html
<script src="https://cdn.cristianobleve.com/packets/audio/latest/ext-audio.min.js"></script>
<div id="audio-container"></div>

<script>
  new ExtAudio({
    target: '#audio-container',
    playlist: [
      {
        id: 1,
        title: 'Midnight Drive',
        artist: 'ExtPackets Synthwave',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400',
        src: 'https://vjs.zencdn.net/v/oceans.mp4'
      }
    ]
  });
</script>
```

---

### 3. 🖼️ ExtLightbox (`@cristianobleve/lightbox`)

```html
<script src="https://cdn.cristianobleve.com/packets/lightbox/latest/ext-lightbox.min.js"></script>
<button id="open-gallery">Open Gallery</button>

<script>
  const gallery = new ExtLightbox({
    items: [
      { src: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200', caption: 'Cinema Photo 1' },
      { src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200', caption: 'Neon City Photo 2' }
    ]
  });

  document.getElementById('open-gallery').addEventListener('click', () => {
    gallery.open(0);
  });
</script>
```

---

### 4. 📁 ExtUploader (`@cristianobleve/uploader`)

```html
<script src="https://cdn.cristianobleve.com/packets/uploader/latest/ext-uploader.min.js"></script>
<div id="uploader-box"></div>

<script>
  new ExtUploader({
    target: '#uploader-box',
    endpoint: '/api/upload',
    maxFileSizeMB: 50,
    onSuccess: (res) => console.log('File uploaded successfully!', res)
  });
</script>
```

---

## 📄 License

MIT © [Cristiano Bleve](https://github.com/cristianobleve)
