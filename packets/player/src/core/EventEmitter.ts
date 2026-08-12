import { PlayerEventMap } from './types';

type EventCallback<T = any> = (data: T) => void;

export class EventEmitter {
  private listeners: Map<keyof PlayerEventMap, Set<EventCallback>> = new Map();

  public on<K extends keyof PlayerEventMap>(event: K, callback: (payload: PlayerEventMap[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off<K extends keyof PlayerEventMap>(event: K, callback: (payload: PlayerEventMap[K]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  public emit<K extends keyof PlayerEventMap>(event: K, payload?: PlayerEventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[ExtPlayer] Error in event listener for "${String(event)}":`, err);
        }
      });
    }
  }

  public removeAllListeners(): void {
    this.listeners.clear();
  }
}
