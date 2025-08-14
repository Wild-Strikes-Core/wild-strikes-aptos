import { PlayerEntity } from '../player/playerEntity';
import { CHARACTER_MAPS } from '../player/playerSpriteMaps';

export class EntityFactory {
  static createPlayer(
    id: string,
    scene: Phaser.Scene,
    x: number,
    y: number,
    options?: { inputEnabled?: boolean; singlePlayerMode?: boolean; playerId?: string; roomId?: string; followCamera?: boolean; characterKey?: string; spriteMap?: Record<string, { texture: string; data: string }> }
  ): PlayerEntity {
    const characterTexture = options?.characterKey && CHARACTER_MAPS[options.characterKey]
      ? CHARACTER_MAPS[options.characterKey].player_idle.texture
      : undefined;
    const initialTexture = characterTexture || options?.spriteMap?.player_idle?.texture || '_Idle';
    const sprite = scene.physics.add.sprite(x, y, initialTexture) as Phaser.Physics.Arcade.Sprite;
    return new PlayerEntity(id, scene, sprite, options);
  }
}