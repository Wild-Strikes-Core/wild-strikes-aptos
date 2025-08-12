import { PlayerEntity } from '../playerEntity';

export class EntityFactory {
  static createPlayer(
    id: string,
    scene: Phaser.Scene,
    x: number,
    y: number,
    options?: { inputEnabled?: boolean; singlePlayerMode?: boolean; playerId?: string; roomId?: string; followCamera?: boolean }
  ): PlayerEntity {
    const sprite = scene.physics.add.sprite(x, y, '_Idle') as Phaser.Physics.Arcade.Sprite;
    return new PlayerEntity(id, scene, sprite, options);
  }
}