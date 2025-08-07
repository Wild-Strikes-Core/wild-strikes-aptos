import { GameEntity } from './core/GameEntity';
import {
    CameraComponent,
    HitboxComponent,
    InputComponent,
    MovementComponent,
    NetworkComponent,
    SpriteComponent,
    StateComponent,
} from './components';

export class PlayerEntity extends GameEntity {
    constructor(id: string, scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
        super(id, scene, sprite);
        this.addComponent('camera', new CameraComponent(this));
        this.addComponent('hitbox', new HitboxComponent(this));
        this.addComponent('input', new InputComponent(this));
        this.addComponent('movement', new MovementComponent(this));
        this.addComponent('network', new NetworkComponent(this));
        this.addComponent('sprite', new SpriteComponent(this));
        this.addComponent('state', new StateComponent(this)); // Initial state
    }

    setPlayerAppearance(textureKey: string, animKey?: string) {
        const spriteComp = this.getComponent<SpriteComponent>('sprite');
        if (spriteComp) {
            spriteComp.setSprite(textureKey);
            if (animKey) spriteComp.playAnimation(animKey);
        }
    }

    update() {
        super.update(); // updates all components
    }
}