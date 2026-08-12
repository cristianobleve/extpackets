#!/usr/bin/env node

import { transcodeToHLS } from './transcoder.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🎬 ExtPackets Transcoder CLI - Ultra-fast HLS Video Converter

Usage:
  npx extpackets-transcode <input.mp4> [options]

Options:
  --out, -o <dir>      Output directory for HLS files (default: ./hls_output)
  --instant, -i        Instant Slice Mode (< 1s execution, zero re-encoding)
  --preset <preset>    Encoding preset: ultrafast (default) | superfast | fast

Examples:
  # Instant HLS Slicing (< 1 sec):
  npx extpackets-transcode video.mp4 --instant --out ./public/video_hls

  # Multi-Bitrate Ultrafast HLS (1080p, 720p, 480p):
  npx extpackets-transcode video.mp4 --out ./public/video_hls
`);
    process.exit(0);
  }

  const inputPath = args[0];
  let outputDir = './hls_output';
  let instantCopy = false;
  let preset: 'ultrafast' | 'superfast' | 'fast' = 'ultrafast';

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === '--out' || args[i] === '-o') && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--instant' || args[i] === '-i') {
      instantCopy = true;
    } else if (args[i] === '--preset' && args[i + 1]) {
      preset = args[i + 1] as any;
      i++;
    }
  }

  console.log(`\n🚀 Starting ExtPackets Transcoder...`);
  console.log(`   Input:   ${inputPath}`);
  console.log(`   Output:  ${outputDir}`);
  console.log(`   Instant: ${instantCopy ? 'YES (< 1 sec mode)' : 'NO (Multi-bitrate ultrafast)'}\n`);

  try {
    const startTime = Date.now();
    const result = await transcodeToHLS({
      inputPath,
      outputDir,
      instantCopy,
      preset,
      onProgress: ({ time, fps }) => {
        process.stdout.write(`\r⏳ Transcoding... Time: ${time} | FPS: ${fps}`);
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n\n✅ Done in ${duration}s! Master playlist: ${result.masterPlaylist}\n`);
  } catch (err: any) {
    console.error(`\n❌ Transcoding failed:`, err.message);
    process.exit(1);
  }
}

main();
