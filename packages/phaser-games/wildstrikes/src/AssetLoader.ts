import * as Phaser from 'phaser';
import { ASSETS, AssetEntry } from './assets/asset-manifest';

/**
 * Thin wrapper around Phaser.LoaderPlugin that understands the structure of `AssetEntry`.
 *
 * Usage:
 *   const loader = new AssetLoader(this.load);
 *   loader.loadGroup('ui');
 */
export class AssetLoader {
  constructor(private readonly load: Phaser.Loader.LoaderPlugin) {}

  /**
   * Loads all assets that match the provided group. If `group` is undefined, it
   * loads every asset in the manifest.
   */
  loadGroup(group?: string): void {
    this.filter(group).forEach((entry) => this.loadSingle(entry));
  }

  private filter(group?: string): AssetEntry[] {
    return ASSETS.filter((a) => (group ? a.group === group : true));
  }

  private loadSingle({ key, url, type }: AssetEntry): void {
    switch (type) {
      case 'image':
        this.load.image(key, url);
        break;
      case 'audio':
        this.load.audio(key, url);
        break;
      case 'atlas':
        // Here we assume the atlas JSON shares the same key but with .json and .png located side-by-side.
        // Feel free to tweak to match your asset pipeline.
        this.load.multiatlas(key, url);
        break;
      case 'pack':
        this.load.pack(key, url);
        break;
      default:
        // eslint-disable-next-line no-console
        console.warn(`[AssetLoader] Unsupported asset type "${type}" for key "${key}"`);
    }
  }
} 