import { PlayerEntity } from '../playerEntity';
// import { RocketEntity } from './RocketEntity';


export class EntityFactory {
    static createPlayer(id: string, scene: Phaser.Scene, x: number, y: number): PlayerEntity {
        const sprite = scene.physics.add.sprite(x, y, 'playerSprite'); // Replace 'playerSprite' with actual sprite key
        return new PlayerEntity(id, scene, sprite);
    }

}