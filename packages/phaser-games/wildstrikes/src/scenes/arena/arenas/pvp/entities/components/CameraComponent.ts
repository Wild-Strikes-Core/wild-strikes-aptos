import { GameEntity } from '../core/GameEntity';
import { EntityComponent } from './EntityComponent';

export class CameraComponent implements EntityComponent {
  constructor(private entity: GameEntity) {}

  follow(offsetX = 0, offsetY = 0, lerpX = 0.1, lerpY = 0.1) {
    const cam = this.entity.scene.cameras.main;
    cam.startFollow(this.entity.sprite, true, lerpX, lerpY, offsetX, offsetY);
  }

  setBounds(x: number, y: number, w: number, h: number) {
    this.entity.scene.cameras.main.setBounds(x, y, w, h);
  }

  setZoom(zoom: number) {
    this.entity.scene.cameras.main.setZoom(zoom);
  }

  shake(duration = 150, intensity = 0.01) {
    this.entity.scene.cameras.main.shake(duration, intensity);
  }

  update(): void {}

  destroy(): void {
    const cam = this.entity.scene.cameras.main;
    if ((cam as any).followTarget === this.entity.sprite) cam.stopFollow();
  }
}