import { GameEntity } from './core/GameEntity';
import { CameraComponent } from './components/CameraComponent';
import { HitboxComponent } from './components/HitboxComponent';
import { InputComponent } from './components/InputComponent';
import { NetworkComponent } from './components/NetworkComponent';
import { SpriteComponent } from './components/SpriteComponent';
import { MovementComponent } from './components/MovementComponent';
import { StateComponent } from './components/StateComponent';

// Player states
import { IdleState } from './states/player/IdleState';
import { SprintingState } from './states/player/SprintingState';
import { JumpingState } from './states/player/JumpingState';
import { DashingState } from './states/player/DashingState';
import { AttackingLightState } from './states/player/AttackingLightState';
import { AttackingHeavyState } from './states/player/AttackingHeavyState';
import { CrouchingState } from './states/player/CrouchingState';
import { CrouchWalkingState } from './states/player/CrouchWalkingState';
import { HitState } from './states/player/HitState';
import { DeadState } from './states/player/DeadState';

export class PlayerEntity extends GameEntity {
  constructor(
    id: string,
    scene: Phaser.Scene,
    sprite: Phaser.Physics.Arcade.Sprite,
    options: {
      inputEnabled?: boolean;
      singlePlayerMode?: boolean;
      playerId?: string;
      roomId?: string;
      followCamera?: boolean;
    } = {}
  ) {
    super(id, scene, sprite);
    const inputEnabled = options.inputEnabled ?? true;
    const singlePlayerMode = options.singlePlayerMode ?? false;

    const spriteComp = new SpriteComponent(this);
    spriteComp.setDefaults();
    this.addComponent('sprite', spriteComp);

    this.addComponent('input', new InputComponent(this, inputEnabled));
    this.addComponent('movement', new MovementComponent(this));
    this.addComponent('hitbox', new HitboxComponent(this, singlePlayerMode));

    const net = options.playerId && options.roomId ? new NetworkComponent(this, { playerId: options.playerId, roomId: options.roomId }) : null;
    if (net) this.addComponent('network', net);

    const cam = new CameraComponent(this);
    this.addComponent('camera', cam);
    if (options.followCamera) cam.follow(0, 0, 0.1, 0.1);

    // Provide states from @states/
    const states = {
      idle: (deps: any, goto: any) => new IdleState(deps, goto),
      sprinting: (deps: any, goto: any) => new SprintingState(deps, goto),
      jumping: (deps: any, goto: any) => new JumpingState(deps, goto),
      dashing: (deps: any, goto: any) => new DashingState(deps, goto),
      attackingLight: (deps: any, goto: any) => new AttackingLightState(deps, goto),
      attackingHeavy: (deps: any, goto: any) => new AttackingHeavyState(deps, goto),
      crouching: (deps: any, goto: any) => new CrouchingState(deps, goto),
      crouchWalking: (deps: any, goto: any) => new CrouchWalkingState(deps, goto),
      hit: (deps: any, goto: any) => new HitState(deps, goto),
      dead: (deps: any, goto: any) => new DeadState(deps, goto),
    };

    this.addComponent('state', new StateComponent(this, { inputEnabled, singlePlayerMode, states, initial: 'idle' }));
    this.sprite.setData('id', id);
  }
}