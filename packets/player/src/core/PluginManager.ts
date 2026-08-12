import { ExtPlayerInstance, ExtPlayerPlugin } from './types';

export class PluginManager {
  private plugins: Map<string, ExtPlayerPlugin> = new Map();
  private player: ExtPlayerInstance;

  constructor(player: ExtPlayerInstance) {
    this.player = player;
  }

  public register(plugin: ExtPlayerPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[ExtPlayer] Plugin "${plugin.name}" is already registered. Re-initializing.`);
      this.unregister(plugin.name);
    }

    try {
      plugin.init(this.player);
      this.plugins.set(plugin.name, plugin);
      console.log(`[ExtPlayer] Loaded plugin: ${plugin.name} v${plugin.version || '1.0.0'}`);
    } catch (err) {
      console.error(`[ExtPlayer] Failed to initialize plugin "${plugin.name}":`, err);
    }
  }

  public unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      if (plugin.destroy) {
        try {
          plugin.destroy();
        } catch (err) {
          console.error(`[ExtPlayer] Error destroying plugin "${name}":`, err);
        }
      }
      this.plugins.delete(name);
    }
  }

  public getPlugin<T extends ExtPlayerPlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  public destroyAll(): void {
    this.plugins.forEach((plugin) => {
      if (plugin.destroy) {
        try {
          plugin.destroy();
        } catch (err) {
          console.error(`[ExtPlayer] Error destroying plugin "${plugin.name}":`, err);
        }
      }
    });
    this.plugins.clear();
  }
}
