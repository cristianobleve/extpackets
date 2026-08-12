import { ExtPlayerInstance, ExtPlayerPlugin } from '../../core/types';

export class ShortcutsPlugin implements ExtPlayerPlugin {
  public name = 'ExtPlayerShortcuts';
  public version = '1.0.0';

  private player!: ExtPlayerInstance;
  private onKeyDownBound!: (e: KeyboardEvent) => void;

  public init(player: ExtPlayerInstance): void {
    this.player = player;
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.onKeyDownBound);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore if focus is in an input/textarea
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
      return;
    }

    const key = e.key.toLowerCase();

    switch (key) {
      case ' ':
      case 'k':
        e.preventDefault();
        this.player.togglePlay();
        break;

      case 'arrowleft':
      case 'j':
        e.preventDefault();
        this.player.seek(this.player.videoElement.currentTime - 5);
        break;

      case 'arrowright':
      case 'l':
        e.preventDefault();
        this.player.seek(this.player.videoElement.currentTime + 5);
        break;

      case 'arrowup':
        e.preventDefault();
        this.player.setVolume(this.player.videoElement.volume + 0.1);
        break;

      case 'arrowdown':
        e.preventDefault();
        this.player.setVolume(this.player.videoElement.volume - 0.1);
        break;

      case 'f':
        e.preventDefault();
        this.player.toggleFullscreen();
        break;

      case 'm':
        e.preventDefault();
        this.player.toggleMute();
        break;
    }
  }

  public destroy(): void {
    if (this.onKeyDownBound) {
      window.removeEventListener('keydown', this.onKeyDownBound);
    }
  }
}
