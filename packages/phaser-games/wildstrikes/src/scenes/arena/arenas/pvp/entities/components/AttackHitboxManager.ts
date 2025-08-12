// Ported from @player/AttackHitboxManager to live inside ECS.
// Identical behavior; trimmed only imports.
export class AttackHitboxManager {
    private scene: Phaser.Scene;
    private player: Phaser.Physics.Arcade.Sprite;
    private hitboxGraphics: Phaser.GameObjects.Graphics | null = null;
    private hitboxGroup: Phaser.Physics.Arcade.Group;
    private activeHitboxes: Map<string, AttackHitbox> = new Map();
    private opponentPlayer: Phaser.Physics.Arcade.Sprite | null = null;
    private debugMode: boolean = true;
  
    constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite, singlePlayerMode: boolean = false) {
      this.scene = scene;
      this.player = player;
      this.hitboxGroup = this.scene.physics.add.group();
      this.hitboxGraphics = this.scene.add.graphics();
      this.hitboxGraphics.setDepth(1000);
      if (this.debugMode && this.scene.physics.world.drawDebug) {
        this.scene.physics.world.debugGraphic.setVisible(true);
      }
    }
  
    setOpponentPlayer(opponent: Phaser.Physics.Arcade.Sprite): void {
      this.opponentPlayer = opponent;
      if (this.hitboxGroup && opponent && opponent.body) {
        const existing = this.scene.physics.world.colliders.getActive()
          .filter(c => c.object1 === this.hitboxGroup || c.object2 === this.hitboxGroup);
        existing.forEach(c => c.destroy());
        this.scene.physics.add.overlap(this.hitboxGroup, opponent, (hitboxObj: any, opponentObj: any) => {
          this.handleHitCollision(hitboxObj, opponentObj);
        });
      }
    }
  
    private handleHitCollision(hitboxBody: Phaser.Physics.Arcade.Sprite): void {
      const hitbox = Array.from(this.activeHitboxes.values()).find(h => h.body === hitboxBody);
      if (hitbox && hitbox.isActive) {
        hitbox.isActive = false;
        this.removeHitbox(hitbox.id);
      }
    }
  
    renderServerValidatedAttack(serverData: {
      attackType: 'light' | 'heavy';
      position: { x: number; y: number; facing: 'left' | 'right' };
      isHit: boolean;
      timestamp: number;
    }): void {
      const facing = serverData.position.facing;
      const hitboxData: HitboxData = serverData.attackType === 'light' ? {
        id: `server_light_${serverData.timestamp}`, type: 'light', damage: 15, knockbackForce: 200, knockbackAngle: 45,
        width: 80, height: 60, duration: 200, offsetX: facing === 'left' ? -75 : 75, offsetY: -10, color: serverData.isHit ? 0x00ff00 : 0xff4444, alpha: serverData.isHit ? 0.8 : 0.4
      } : {
        id: `server_heavy_${serverData.timestamp}`, type: 'heavy', damage: 25, knockbackForce: 400, knockbackAngle: 60,
        width: 150, height: 80, duration: 400, offsetX: facing === 'left' ? -40 : 40, offsetY: -20, color: serverData.isHit ? 0x00ff00 : 0xff8800, alpha: serverData.isHit ? 0.8 : 0.5
      };
      const worldX = serverData.position.x + hitboxData.offsetX;
      const worldY = serverData.position.y + hitboxData.offsetY;
  
      const visualHitbox: AttackHitbox = {
        ...hitboxData, body: null as any, startTime: this.scene.time.now, isActive: true, worldX, worldY
      };
      this.activeHitboxes.set(hitboxData.id, visualHitbox);
      this.drawHitbox(visualHitbox);
      this.scene.time.delayedCall(hitboxData.duration, () => this.removeHitbox(hitboxData.id));
    }
  
    createLocalAttackHitbox(attackType: 'light' | 'heavy'): void {
      if (!this.player) return;
      const facing = this.player.flipX ? 'left' : 'right';
      const data: HitboxData = attackType === 'light' ? {
        id: `local_light_${Date.now()}`, type: 'light', damage: 15, knockbackForce: 200, knockbackAngle: 45,
        width: 80, height: 60, duration: 200, offsetX: facing === 'left' ? -75 : 75, offsetY: -10, color: 0xff4444, alpha: 0.4
      } : {
        id: `local_heavy_${Date.now()}`, type: 'heavy', damage: 25, knockbackForce: 400, knockbackAngle: 60,
        width: 150, height: 80, duration: 400, offsetX: facing === 'left' ? -40 : 40, offsetY: -20, color: 0xff8800, alpha: 0.5
      };
      const worldX = this.player.x + data.offsetX;
      const worldY = this.player.y + data.offsetY;
  
      const hitboxSprite = this.scene.physics.add.sprite(worldX, worldY, '__DEFAULT');
      hitboxSprite.setVisible(false);
      hitboxSprite.setSize(data.width, data.height);
      hitboxSprite.setDisplaySize(data.width, data.height);
  
      const hitbox: AttackHitbox = {
        ...data, body: hitboxSprite, startTime: this.scene.time.now, isActive: true, worldX, worldY
      };
      this.hitboxGroup.add(hitboxSprite);
      this.activeHitboxes.set(data.id, hitbox);
      this.drawHitbox(hitbox);
      this.scene.time.delayedCall(data.duration, () => this.removeHitbox(data.id));
    }
  
    private drawHitbox(hitbox: AttackHitbox): void {
      if (!this.hitboxGraphics) return;
      this.hitboxGraphics.fillStyle(hitbox.color, hitbox.alpha);
      this.hitboxGraphics.fillRect(hitbox.worldX - hitbox.width / 2, hitbox.worldY - hitbox.height / 2, hitbox.width, hitbox.height);
      this.hitboxGraphics.lineStyle(2, hitbox.color, 1.0);
      this.hitboxGraphics.strokeRect(hitbox.worldX - hitbox.width / 2, hitbox.worldY - hitbox.height / 2, hitbox.width, hitbox.height);
    }
  
    update(): void {
      const now = this.scene.time.now;
      this.activeHitboxes.forEach((h, id) => {
        if (h.isActive && now - h.startTime >= h.duration) this.removeHitbox(id);
      });
      if (this.activeHitboxes.size > 0) this.redrawAll();
    }
  
    private redrawAll(): void {
      if (!this.hitboxGraphics) return;
      this.hitboxGraphics.clear();
      this.activeHitboxes.forEach(h => {
        if (!h.isActive) return;
        this.hitboxGraphics.fillStyle(h.color, h.alpha);
        this.hitboxGraphics.fillRect(h.worldX - h.width / 2, h.worldY - h.height / 2, h.width, h.height);
        this.hitboxGraphics.lineStyle(2, h.color, 1.0);
        this.hitboxGraphics.strokeRect(h.worldX - h.width / 2, h.worldY - h.height / 2, h.width, h.height);
      });
    }
  
    private removeHitbox(id: string): void {
      const h = this.activeHitboxes.get(id);
      if (!h) return;
      h.isActive = false;
      if (h.body && (h.body as any).destroy) {
        this.hitboxGroup.remove(h.body);
        (h.body as any).destroy();
      }
      this.activeHitboxes.delete(id);
      if (this.activeHitboxes.size === 0 && this.hitboxGraphics) this.hitboxGraphics.clear();
    }
  
    destroy(): void {
      this.activeHitboxes.forEach((_, id) => this.removeHitbox(id));
      if (this.hitboxGraphics) { this.hitboxGraphics.destroy(); this.hitboxGraphics = null; }
      this.hitboxGroup.destroy();
    }
  }
  
  type HitboxData = {
    id: string; type: 'light' | 'heavy'; damage: number; knockbackForce: number; knockbackAngle: number;
    width: number; height: number; duration: number; offsetX: number; offsetY: number; color: number; alpha: number;
  };
  type AttackHitbox = HitboxData & {
    body: Phaser.Physics.Arcade.Sprite; startTime: number; isActive: boolean; worldX: number; worldY: number;
  };