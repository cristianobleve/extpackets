import { ExtPlayerInstance, ExtPlayerPlugin, TrackItem } from '../../core/types';

export class CaptionsPlugin implements ExtPlayerPlugin {
  public name = 'ExtPlayerCaptions';
  public version = '1.0.0';

  private player!: ExtPlayerInstance;
  private tracks: TrackItem[] = [];
  private activeTrackId: string | null = null;

  public init(player: ExtPlayerInstance): void {
    this.player = player;

    if (player.options.tracks && player.options.tracks.length > 0) {
      this.setTracks(player.options.tracks);
    }
  }

  public setTracks(tracks: TrackItem[]): void {
    this.tracks = tracks;

    // Clear existing track elements from video
    const existingTracks = this.player.videoElement.querySelectorAll('track');
    existingTracks.forEach(t => t.remove());

    tracks.forEach((track, index) => {
      const trackEl = document.createElement('track');
      trackEl.kind = track.kind || 'subtitles';
      trackEl.label = track.label;
      trackEl.srclang = track.srclang || 'en';
      trackEl.src = track.src;
      trackEl.id = track.id || `track-${index}`;

      if (track.default && !this.activeTrackId) {
        trackEl.default = true;
        this.activeTrackId = trackEl.id;
      }

      this.player.videoElement.appendChild(trackEl);
    });

    // Ensure textTracks mode matches state
    this.syncTextTracksState();
  }

  public selectTrack(trackId: string | null): void {
    this.activeTrackId = trackId;
    this.syncTextTracksState();

    const selected = this.tracks.find(t => t.id === trackId) || null;
    this.player.emit('trackchange', { track: selected });
  }

  private syncTextTracksState(): void {
    const textTracks = this.player.videoElement.textTracks;
    for (let i = 0; i < textTracks.length; i++) {
      const tt = textTracks[i];
      if (this.activeTrackId && (tt.label === this.getTrackLabel(this.activeTrackId) || tt.language === this.activeTrackId)) {
        tt.mode = 'showing';
      } else {
        tt.mode = 'disabled';
      }
    }
  }

  private getTrackLabel(trackId: string): string {
    const found = this.tracks.find(t => t.id === trackId);
    return found ? found.label : trackId;
  }

  public getAvailableTracks(): TrackItem[] {
    return this.tracks;
  }

  public destroy(): void {
    const existingTracks = this.player.videoElement.querySelectorAll('track');
    existingTracks.forEach(t => t.remove());
  }
}
