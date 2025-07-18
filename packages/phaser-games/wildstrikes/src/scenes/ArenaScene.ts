import { ArenaBackground } from "../arena/ArenaBackground";
import { ArenaPhysics } from "../arena/ArenaPhysics";
import { ArenaAudio } from "../arena/ArenaAudio";
import { ArenaPlayer } from "../arena/ArenaPlayer";
import { ArenaUI } from "../arena/ArenaUI";
import { ArenaInput } from "../arena/ArenaInput";
import { SceneManager } from "../controllers/SceneManager";

export default class Arena extends Phaser.Scene {
    // Arena helpers
    private arenaBackground!: ArenaBackground;
    private arenaPhysics!: ArenaPhysics;
    private arenaPlayer!: ArenaPlayer;
    private arenaUI!: ArenaUI;
    private arenaInput!: ArenaInput;
    private sceneManager!: SceneManager;
    private arenaAudio!: ArenaAudio;

    // Main player sprite reference
    private player!: Phaser.Physics.Arcade.Sprite;

    // Movement constants
    private readonly WALK_SPEED = 230;
    private readonly RUN_SPEED = 350;

    constructor() {
        super({ key: "Arena" });
    }

    create(): void {
        /* ------------------------------------------------------------------
         * Helpers initialization
         * ------------------------------------------------------------------ */
        this.arenaBackground = new ArenaBackground(this);
        this.arenaPhysics = new ArenaPhysics(this);
        this.arenaPlayer = new ArenaPlayer(this);
        this.arenaUI = new ArenaUI(this);
        this.arenaAudio = new ArenaAudio(this);

        /* --------------------------------------------------------------
         * Map selection & background
         * -------------------------------------------------------------- */
        const mapConfigs = this.arenaBackground.getMapConfigs();
        const randomMap = Phaser.Utils.Array.GetRandom(mapConfigs);
        this.arenaBackground.setSelectedMap(randomMap);
        this.arenaBackground.createBackground(); // Create background first to define world size

        // Player
        this.player = this.arenaPlayer.createPlayerSprite(300, 500);
        this.arenaPlayer.configurePlayerSprite(this.player);

        // Camera & scene manager (requires background and player to exist)
        const bgSprite = this.arenaBackground.getBackgroundSprite();
        this.sceneManager = new SceneManager(this, bgSprite!, [], { // Use non-null assertion as bg is now guaranteed
            bestZoom: 1.5,
            parallaxFactor: 0.4,
        });
        this.sceneManager.setupCameraFollow(this.player);

        // World bounds are now set; create platform
        this.arenaPhysics.createPlatforms();
        this.arenaPhysics.addPlatformCollider(this.player);

        // Input setup
        this.arenaInput = new ArenaInput(this, () => {
            const didAttack = this.arenaPlayer.performAttack(this.player);
            if (didAttack) {
                this.arenaAudio.playAttackSound();
            }
        });
        this.arenaInput.setupControls();

        // UI setup
        this.arenaUI.createUI();
        this.arenaUI.updatePlayerNames("Player 1", "Enemy");
        this.arenaUI.ensureUIElementsVisible();

        // Entrance animation
        this.createEntranceAnimation(randomMap.name);
        this.arenaAudio.startBackgroundMusic(randomMap.musicKey);

        // Basic gravity
        this.physics.world.gravity.y = 2000;
    }

    update(time: number, delta: number): void {
        if (!this.player || !this.player.body) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;

        /* ------------------------------------------------------------------
         * Attack handling
         * ------------------------------------------------------------------ */
        if (this.arenaInput.isKeyJustPressed("attack")) {
            const didAttack = this.arenaPlayer.performAttack(this.player);
            if (didAttack) {
                this.arenaAudio.playAttackSound();
            }
        }

        // If attacking, skip movement animation overrides
        if (this.player.getData("isAttacking")) {
            // Allow minimal horizontal friction while attacking
            body.setVelocityX(body.velocity.x * 0.9);
        } else {
            /* --------------------------------------------------------------
             * Movement & animation (when NOT attacking)
             * -------------------------------------------------------------- */
            const isRunning = this.arenaInput.isKeyPressed("shift");
            const speed = isRunning ? this.RUN_SPEED : this.WALK_SPEED;

            let playingAnim = "_Idle_Idle";

            if (this.arenaInput.isKeyPressed("left")) {
                body.setVelocityX(-speed);
                this.player.setFlipX(true);
                playingAnim = "_Run";
            } else if (this.arenaInput.isKeyPressed("right")) {
                body.setVelocityX(speed);
                this.player.setFlipX(false);
                playingAnim = "_Run";
            } else {
                body.setVelocityX(0);
            }

            // Jump
            if (this.arenaInput.isKeyJustPressed("up") && body.onFloor()) {
                body.setVelocityY(-850);
                playingAnim = "_Jump";
            }

            // Update animation
            if (
                this.arenaPlayer.isSpriteAnimationSafe(this.player) &&
                this.player.anims.currentAnim?.key !== playingAnim
            ) {
                this.player.play(playingAnim, true);
            }
        }

        /* ------------------------------------------------------------------
         * Camera zoom adjustment
         * ------------------------------------------------------------------ */
        const speedAbs = Math.abs(body.velocity.x);
        this.sceneManager.updateCameraZoom(speedAbs, this.RUN_SPEED * 0.8);
    }

    /* ------------------------------------------------------------------
     * Entrance animation (camera flash + FIGHT! text)
     * ------------------------------------------------------------------ */
    private createEntranceAnimation(mapName: string): void {
        // Pause physics until animation done
        this.physics.pause();

        // Flash to start
        this.cameras.main.flash(500, 0, 0, 0);

        // FIGHT! text
        const fightText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            "FIGHT!",
            {
                fontFamily: "Arial",
                fontSize: "120px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
            }
        );
        fightText.setOrigin(0.5).setAlpha(0).setScale(2).setScrollFactor(0);

        // Map label
        const mapText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            `Map: ${mapName}`,
            {
                fontFamily: "Arial",
                fontSize: "36px",
                color: "#ffff00",
                stroke: "#000000",
                strokeThickness: 4,
            }
        );
        mapText.setOrigin(0.5).setAlpha(0).setScrollFactor(0);

        this.time.delayedCall(800, () => {
            this.tweens.add({
                targets: [fightText, mapText],
                alpha: 1,
                scale: 1,
                duration: 600,
                ease: "Back.easeOut",
                onComplete: () => {
                    this.time.delayedCall(1500, () => {
                        this.tweens.add({
                            targets: [fightText, mapText],
                            alpha: 0,
                            scale: 0.5,
                            duration: 400,
                            ease: "Power2",
                            onComplete: () => {
                                fightText.destroy();
                                mapText.destroy();
                            },
                        });
                    });
                },
            });
        });

        // Resume physics after animation (~2.3 s)
        this.time.delayedCall(2300, () => {
            this.physics.resume();
        });
    }

    /* ------------------------------------------------------------------
     * Scene shutdown cleanup
     * ------------------------------------------------------------------ */
    shutdown(): void {
        this.arenaAudio.stopBackgroundMusic();
    }

    destroy(): void {
        this.shutdown();
    }
}
