import { ExtPlayerInstance, ExtPlayerPlugin, DRMOptions } from '../../core/types';

export class DRMPlugin implements ExtPlayerPlugin {
  public name = 'ExtPlayerDRM';
  public version = '1.0.0';

  private player!: ExtPlayerInstance;
  private options?: DRMOptions;
  private mediaKeys?: MediaKeys;

  constructor(options?: DRMOptions) {
    this.options = options;
  }

  public init(player: ExtPlayerInstance): void {
    this.player = player;
    const config = this.options || player.options.drm;

    if (!config || Object.keys(config).length === 0) {
      return;
    }

    console.log('[ExtPlayerDRM] Initializing DRM EME module with configuration:', config);

    player.on('ready', () => {
      this.configureEME(config);
    });
  }

  private async configureEME(drmConfig: DRMOptions): Promise<void> {
    if (!('requestMediaKeySystemAccess' in navigator)) {
      console.warn('[ExtPlayerDRM] Encrypted Media Extensions (EME) are not supported in this browser.');
      return;
    }

    const keySystems: Record<string, string> = {
      widevine: 'com.widevine.alpha',
      fairplay: 'com.apple.fps.1_0',
      playready: 'com.microsoft.playready'
    };

    for (const [key, systemId] of Object.entries(keySystems)) {
      const systemConfig = drmConfig[key as keyof DRMOptions];
      if (systemConfig && systemConfig.licenseUrl) {
        try {
          this.player.emit('drmstatus', { status: 'requesting' });

          const access = await navigator.requestMediaKeySystemAccess(systemId, [
            {
              initDataTypes: ['cenc', 'keyids'],
              videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
              audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }]
            }
          ]);

          this.mediaKeys = await access.createMediaKeys();
          await this.player.videoElement.setMediaKeys(this.mediaKeys);

          console.log(`[ExtPlayerDRM] EME License system "${systemId}" attached successfully.`);
          this.player.emit('drmstatus', { status: 'authorized' });
          return;
        } catch (err: any) {
          console.info(`[ExtPlayerDRM] System "${systemId}" not supported or license check skipped:`, err.message || err);
        }
      }
    }
  }

  public destroy(): void {
    this.mediaKeys = undefined;
  }
}
