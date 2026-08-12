import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

export interface TranscodeOptions {
  /** Input MP4 video file path */
  inputPath: string;
  /** Output directory where HLS files (.m3u8, .ts) will be saved */
  outputDir: string;
  /** Instant Copy Mode (Under 1 second - slices MP4 into HLS without re-encoding) */
  instantCopy?: boolean;
  /** Target resolution ladder */
  qualities?: Array<{
    name: string;
    resolution: string; // e.g. "1920x1080", "1280x720", "854x480"
    bitrate: string;    // e.g. "4500k", "2200k", "1000k"
  }>;
  /** FFmpeg preset: 'ultrafast' | 'superfast' | 'fast' (default: 'ultrafast') */
  preset?: 'ultrafast' | 'superfast' | 'fast';
  /** Progress callback */
  onProgress?: (progress: { percentage: number; fps: number; time: string }) => void;
}

export async function transcodeToHLS(options: TranscodeOptions): Promise<{ masterPlaylist: string }> {
  const {
    inputPath,
    outputDir,
    instantCopy = false,
    preset = 'ultrafast',
    onProgress
  } = options;

  const resolvedInput = resolve(inputPath);
  const resolvedOutput = resolve(outputDir);

  if (!existsSync(resolvedInput)) {
    throw new Error(`[ExtTranscoder] Input file not found: ${resolvedInput}`);
  }

  if (!existsSync(resolvedOutput)) {
    mkdirSync(resolvedOutput, { recursive: true });
  }

  // 1. Instant Copy Mode (Under 1 second execution!)
  if (instantCopy) {
    console.log(`[ExtTranscoder] Running Instant Copy Mode on: ${resolvedInput}`);
    const playlistPath = join(resolvedOutput, 'stream.m3u8');
    const segmentPath = join(resolvedOutput, 'segment_%03d.ts');

    const args = [
      '-y',
      '-i', resolvedInput,
      '-c', 'copy',
      '-start_number', '0',
      '-hls_time', '4',
      '-hls_list_size', '0',
      '-f', 'hls',
      playlistPath
    ];

    await runFFmpeg(args, onProgress);

    // Create a master playlist referencing stream.m3u8
    const masterPath = join(resolvedOutput, 'master.m3u8');
    const masterContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
stream.m3u8
`;
    writeFileSync(masterPath, masterContent, 'utf-8');

    return { masterPlaylist: masterPath };
  }

  // 2. Multi-Bitrate Ultrafast HLS Transcode (1080p, 720p, 480p)
  const defaultQualities = options.qualities || [
    { name: '1080p', resolution: '1920x1080', bitrate: '4500k' },
    { name: '720p',  resolution: '1280x720',  bitrate: '2200k' },
    { name: '480p',  resolution: '854x480',   bitrate: '1000k' }
  ];

  console.log(`[ExtTranscoder] Generating ${defaultQualities.length} quality levels in parallel with preset="${preset}"...`);

  // Build FFmpeg multi-output arguments for ultra-fast parallel encoding
  const args = ['-y', '-i', resolvedInput];

  defaultQualities.forEach((q) => {
    const qDir = join(resolvedOutput, q.name);
    if (!existsSync(qDir)) mkdirSync(qDir, { recursive: true });

    args.push(
      '-vf', `scale=${q.resolution}`,
      '-c:v', 'libx264',
      '-preset', preset,
      '-b:v', q.bitrate,
      '-maxrate', q.bitrate,
      '-bufsize', `${parseInt(q.bitrate) * 2}k`,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-hls_time', '4',
      '-hls_list_size', '0',
      '-f', 'hls',
      join(qDir, 'index.m3u8')
    );
  });

  await runFFmpeg(args, onProgress);

  // Generate Master Playlist (master.m3u8)
  const masterPath = join(resolvedOutput, 'master.m3u8');
  let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';

  defaultQualities.forEach((q) => {
    const bw = parseInt(q.bitrate) * 1000;
    masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${q.resolution},NAME="${q.name}"\n${q.name}/index.m3u8\n`;
  });

  writeFileSync(masterPath, masterContent, 'utf-8');
  console.log(`[ExtTranscoder] Master playlist created successfully: ${masterPath}`);

  return { masterPlaylist: masterPath };
}

function runFFmpeg(args: string[], onProgress?: (progress: any) => void): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const ffmpegProc = spawn('ffmpeg', args);

    ffmpegProc.stderr.on('data', (data: Buffer) => {
      const log = data.toString();
      if (onProgress && log.includes('time=')) {
        const timeMatch = log.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
        const fpsMatch = log.match(/fps=\s*(\d+)/);
        if (timeMatch) {
          onProgress({
            percentage: 0,
            fps: fpsMatch ? parseInt(fpsMatch[1]) : 0,
            time: timeMatch[1]
          });
        }
      }
    });

    ffmpegProc.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`[ExtTranscoder] FFmpeg process exited with code ${code}`));
      }
    });

    ffmpegProc.on('error', (err) => {
      reject(new Error(`[ExtTranscoder] Failed to start FFmpeg process. Is FFmpeg installed in system PATH? Error: ${err.message}`));
    });
  });
}
