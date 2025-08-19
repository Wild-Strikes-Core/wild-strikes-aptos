import { EntityComponent } from '../components/EntityComponent';

export abstract class GameEntity {
    id: string;
    scene: Phaser.Scene;
    sprite: Phaser.Physics.Arcade.Sprite;
    components: Map<string, EntityComponent>;

    constructor(id: string, scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
        this.id = id;
        this.scene = scene;
        this.sprite = sprite;
        this.components = new Map();
    }

    addComponent(name: string, component: EntityComponent) {
        this.components.set(name, component);
    }

    getComponent<T>(name: string): T | undefined {
        return this.components.get(name) as T;
    }

    update() {
        this.components.forEach(component => component.update());
    }

    destroy() {
        this.components.forEach(component => component.destroy());
        this.sprite.destroy();
    }
}