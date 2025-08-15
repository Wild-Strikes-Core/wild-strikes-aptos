import { GameEntity } from '../core/GameEntity';
import { CameraComponent } from '../components/CameraComponent';
import { HitboxComponent } from '../components/HitboxComponent';
import { InputComponent } from '../components/InputComponent';
import { NetworkComponent } from '../components/NetworkComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { MovementComponent } from '../components/MovementComponent';
import { StateComponent } from '../components/StateComponent';

// Player states
import { 
  IdleState,
  SprintingState,
  JumpingState,
  DashingState,
  AttackingLightState,
  AttackingHeavyState,
  CrouchingState,
  CrouchWalkingState,
  HitState,
  DeadState,
} from '../states/player';

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
      characterKey?: string;
      spriteMap?: Record<string, { texture: string; data: string }>;
    } = {}
  ) {
    super(id, scene, sprite);
    const inputEnabled = options.inputEnabled ?? true;
    const singlePlayerMode = options.singlePlayerMode ?? false;



    const defaultBindings = {
      left: { keys: ['A', 'ArrowLeft'] },
      right: { keys: ['D', 'ArrowRight'] },
      jump: { keys: ['W', 'SPACE'] },
      crouch: { keys: ['CTRL', 'ArrowDown'] },
      dash: { keys: ['Q'] },
      lightAttack: { pointerButtons: [0] }, // left click
      heavyAttack: { pointerButtons: [2] }, // right click
    };

    // Initialize sprite component, passing in the character key and sprite map
    const spriteComp = new SpriteComponent(this, { characterKey: options.characterKey, mapOverride: options.spriteMap as any });
    spriteComp.setDefaults();

    const inputComp = new InputComponent(this, inputEnabled, defaultBindings as any);
    this.addComponent('input', inputComp);

    // Add network component if playerId and roomId are provided
    const net = options.playerId && options.roomId ? new NetworkComponent(this, { playerId: options.playerId, roomId: options.roomId }) : null;
    if (net) {
      this.addComponent('network', net);
    }
  
    // Add camera component if followCamera is true
    const cam = new CameraComponent(this);
    if (options.followCamera) {
      cam.follow(0, 0, 0.1, 0.1);
    }

    // Add components to the entity
    this.addComponent('sprite', spriteComp);
    this.addComponent('movement', new MovementComponent(this));
    this.addComponent('hitbox', new HitboxComponent(this, singlePlayerMode));
    this.addComponent('camera', cam);

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

    // wire up actions to handlers
    inputComp.setHandlers('jump', {
      onDown: () => {
        // call whatever your state machine method is:
        const state = this.getComponent('state') as any;
        state?.goto?.('jumping'); // adapt to your StateComponent API
      }
    });
    inputComp.setHandlers('lightAttack', {
      onDown: () => {
        const state = this.getComponent('state') as any;
        // only attempt transition if local player and input enabled
        if (inputEnabled) state?.goto?.('attackingLight');
      }
    });
    // Movement is handled by states; no direct movement handlers here
    this.sprite.setData('id', id);
  }
}