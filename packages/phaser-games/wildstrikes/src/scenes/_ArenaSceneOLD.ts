/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { PLAYER_1, PLAYER_2 } from "@shared/constants/constants";
import { SOCKET } from "@shared/socket";
import { Socket } from "socket.io-client";
import { PlayerManager } from "../controllers/PlayerManager";
import { UIManager } from "../controllers/UIManager";
import { SceneManager } from "../controllers/SceneManager";
import { MultiplayerManager } from "../controllers/MultiplayerManager";
import { ArenaBackground } from "../arena/ArenaBackground";
import { ArenaUI } from "../arena/ArenaUI";
import { ArenaAudio } from "../arena/ArenaAudio";
import { ArenaInput } from "../arena/ArenaInput";
import { ArenaNetworking, IPlayerState } from "../arena/ArenaNetworking";
import { ArenaPlayer } from "../arena/ArenaPlayer";
import { ArenaPhysics } from "../arena/ArenaPhysics";
import { ArenaGameState } from "../arena/ArenaGameState";
/* END-USER-IMPORTS */

interface InputPayload {
  tick: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  flipX: boolean;
  anim: string;
}


export default class Arena extends Phaser.Scene {
    private KEYS!: any;
    
    /* START-USER-CODE */
    
    // Client-side prediction
    private pending_inputs: InputPayload[] = [];
    private tick: number = 0;


    // Socket connection
    private socket: Socket = SOCKET;
    
    // Arena modules
    private arenaBackground: ArenaBackground;
    private arenaUI: ArenaUI;
    private arenaAudio: ArenaAudio;
    private arenaInput: ArenaInput;
    private arenaNetworking: ArenaNetworking;
    private arenaPlayer: ArenaPlayer;
    private arenaPhysics: ArenaPhysics;
    private arenaGameState: ArenaGameState;
    private spritesCreated: boolean = false;
    
    // Manager instances
    private sceneManager: SceneManager | null = null;
    private playerManager: PlayerManager | null = null;
    private uiManager: UIManager | null = null;
    private multiplayerManager: MultiplayerManager | null = null;

    constructor() {
        super("Arena");
        
        // Initialize arena modules
        this.arenaBackground = new ArenaBackground(this);
        this.arenaUI = new ArenaUI(this);
        this.arenaAudio = new ArenaAudio(this);
        this.arenaInput = new ArenaInput(this, () => this.performAttack());
        this.arenaPlayer = new ArenaPlayer(this);
        this.arenaPhysics = new ArenaPhysics(this);
        this.arenaGameState = new ArenaGameState(this);
        
        // Initialize networking with callbacks
        this.arenaNetworking = new ArenaNetworking(this, this.socket, {
            onGameStateUpdate: (data) => this.handleGameStateUpdate(data),
            onMatchEnded: (data) => this.handleMatchEnded(data),
            onPlayerHit: (data) => this.handlePlayerHit(data),
            onPlayerAttacked: (data) => this.handlePlayerAttacked(data),
            onTimerUpdate: (data) => this.handleTimerUpdate(data),
            onPlayersConnected: (data) => this.handlePlayersConnected(data),
            onPlayerDisconnected: (data) => this.handlePlayerDisconnected(data),
        });
    }

    editorCreate(): void {
        console.log("Starting editorCreate...");
        
        // Create background
        this.arenaBackground.createBackground();
        
        // Create physics platforms
        this.arenaPhysics.createPlatforms();
        
        // Create UI elements
        this.arenaUI.createUI();
        
        console.log("editorCreate completed successfully");
    }

    create() {
        console.log("Arena scene starting - initializing...");
        
        // Initialize the scene content from the scene editor
        this.editorCreate();
        
        // Reset jump count on scene creation
        this.arenaPlayer.resetJumpCount();
        
        // Ensure all UI elements are properly visible and layered
        this.arenaUI.ensureUIElementsVisible();

        // Setup physics
        this.arenaPhysics.setupPhysicsDebug(false);

        // Setup networking
        this.arenaNetworking.setupSocketListeners();

        console.log("Emitting playerReady event");
        this.arenaNetworking.emitPlayerReady(PLAYER_1, PLAYER_2);

        // Setup input controls
        this.arenaInput.setupControls();
        this.KEYS = this.arenaInput.getKeys();
        
        // Set up world bounds based on background
        this.setupWorldBounds();

        console.log("Arena scene initialization completed");
        this.debugGameAssets();
        
        // Set up shutdown event listener to stop music when scene closes
        this.events.on("shutdown", this.onShutdown, this);
    }
    
    private setupWorldBounds(): void {
        // Get the background sprite
        const bg = this.arenaBackground.getBackgroundSprite();
        
        if (bg) {
            // Calculate the world bounds based on the background size
            const width = bg.width * (bg.scaleX || 1);
            const height = bg.height * (bg.scaleY || 1);
            
            console.log(`Setting world bounds to ${width}x${height}`);
            
            // Set the physics world bounds
            this.physics.world.setBounds(0, 0, width, height);
            
            // Set the camera bounds to match
            this.cameras.main.setBounds(0, 0, width, height);
        } else {
            console.warn("Background sprite not available, using default world bounds");
            
            // Set default bounds if background not available
            this.physics.world.setBounds(0, 0, 1920, 1080);
            this.cameras.main.setBounds(0, 0, 1920, 1080);
        }
    }

    update(time: number, delta: number): void {
        this.tick++;

        // Early exit if scene is being destroyed or key resources are missing
        if (this.arenaGameState.isTransitioning() ||
            !this.scene ||
            !this.scene.isActive("Arena") ||
            !this.KEYS?.left ||
            !this.arenaGameState.getMyPlayer().sprite ||
            !this.arenaGameState.getMyPlayer().sprite!.active ||
            !this.arenaGameState.getMyPlayer().sprite!.body) {
            return;
        }

        // Update multiplayer manager
        if (this.multiplayerManager) {
            this.multiplayerManager.update(time, delta);
        }

        // Update camera zoom based on player speed
        this.updateCameraZoom();

        // Handle player movement and controls
        const inputPayload = this.handlePlayerMovement(time);

        const myPlayer = this.arenaGameState.getMyPlayer().sprite!;

        if (myPlayer.body) {
            // Apply the input locally for immediate feedback
            myPlayer.x = inputPayload.x;
            myPlayer.y = inputPayload.y;
            myPlayer.body.velocity.x = inputPayload.velocityX;
            myPlayer.body.velocity.y = inputPayload.velocityY;
            myPlayer.setFlipX(inputPayload.flipX);
            if (this.arenaPlayer.isSpriteAnimationSafe(myPlayer) && myPlayer.anims.currentAnim?.key !== inputPayload.anim) {
                myPlayer.play(inputPayload.anim, true);
            }
        }

        // Store the input in the pending_inputs array
        this.pending_inputs.push(inputPayload);


        // Legacy sendInputs removed – compact packets handled by MultiplayerManager

        // Update health bars above player heads
        this.arenaUI.updatePlayerHealthBars(
            this.arenaGameState.getMyPlayer().sprite,
            this.arenaGameState.getOtherPlayer().sprite,
            this.arenaGameState.getGameState(),
            this.arenaNetworking.getSocketId() || ""
        );

        // Update other player's position and animation
        this.updateOtherPlayerStates();
    }

    private handlePlayerMovement(time: number): InputPayload {
        const myPlayer = this.arenaGameState.getMyPlayer().sprite!;
        const gameState = this.arenaGameState.getGameState();
        
        const onGround = myPlayer.body!.touching.down || myPlayer.body!.blocked.down;

        // Handle keyboard attack (X key)
        if (this.arenaInput.isKeyJustPressed('attack')) {
            this.performAttack();
        }

        // Movement with running support
        const isRunning = this.arenaInput.isKeyPressed('shift');
        const baseSpeed = 200;
        const runSpeed = 350;
        let currentAnimation = "_Idle_Idle";
        
        let velocityX = 0;
        let velocityY = myPlayer.body!.velocity.y;


        // Check if player is in air
        const isInAir = !onGround;
        
        // Jump handling
        if (this.arenaInput.isKeyJustPressed('up')) {
            this.arenaPlayer.handleJump(myPlayer);
        }
        
        // Movement and animation logic
        if (isInAir && !myPlayer.getData('isAttacking')) {
            currentAnimation = "_Jump";
        } else if (this.arenaInput.isKeyPressed('left') && !myPlayer.getData('isAttacking')) {
            const speed = isRunning ? runSpeed : baseSpeed;
            velocityX = -speed;
            myPlayer.setFlipX(true);
            currentAnimation = "_Run";
        } else if (this.arenaInput.isKeyPressed('right') && !myPlayer.getData('isAttacking')) {
            const speed = isRunning ? runSpeed : baseSpeed;
            velocityX = speed;
            myPlayer.setFlipX(false);
            currentAnimation = "_Run";
        } else if (!myPlayer.getData('isAttacking')) {
            velocityX = 0;
            currentAnimation = "_Idle_Idle";
        }
        
        // Debug: Log animation calculation
        console.log(`Animation calculated: ${currentAnimation}, velocity: (${myPlayer.body!.velocity.x}, ${myPlayer.body!.velocity.y}), isInAir: ${isInAir}, isAttacking: ${myPlayer.getData('isAttacking')}, leftPressed: ${this.arenaInput.isKeyPressed('left')}, rightPressed: ${this.arenaInput.isKeyPressed('right')}`);
        
        // Apply calculated velocity to physics body so the player actually moves
        if (myPlayer.body) {
            myPlayer.body.velocity.x = velocityX;
        }

        // Apply camera bounds constraint
        this.arenaPlayer.constrainPlayerToCameraBounds(myPlayer);

        // Update animation if needed (but don't override attack animations)
        if (this.arenaPlayer.isSpriteAnimationSafe(myPlayer) && 
            myPlayer.body?.velocity && 
            this.scene.isActive("Arena") &&
            !myPlayer.getData('isAttacking')) { // Don't change animations while attacking
            
            const socketId = this.arenaNetworking.getSocketId();
            if (socketId === gameState.player1.id) {
                if (gameState.player1.anim !== currentAnimation) {
                    gameState.player1.anim = currentAnimation;
                    try {
                        myPlayer.play(currentAnimation, true);
                        console.log(`Playing animation: ${currentAnimation}`);
                    } catch (error) {
                        console.error("Failed to play animation:", currentAnimation, error);
                    }
                }
            } else if (socketId === gameState.player2.id) {
                if (gameState.player2.anim !== currentAnimation) {
                    gameState.player2.anim = currentAnimation;
                    try {
                        myPlayer.play(currentAnimation, true);
                        console.log(`Playing animation: ${currentAnimation}`);
                    } catch (error) {
                        console.error("Failed to play animation:", currentAnimation, error);
                    }
                }
            }
        }
        
        return {
            tick: this.tick,
            x: myPlayer.x,
            y: myPlayer.y,
            velocityX: velocityX,
            velocityY: velocityY,
            flipX: myPlayer.flipX,
            anim: currentAnimation
        };
    }

    private updateOtherPlayerStates(): void {
        const otherPlayer = this.arenaGameState.getOtherPlayer().sprite;
        const gameState = this.arenaGameState.getGameState();
        const socketId = this.arenaNetworking.getSocketId();
        
        console.log(`UpdateOtherPlayerStates: socketId=${socketId}, player1.id=${gameState.player1.id}, player2.id=${gameState.player2.id}, otherPlayer exists=${!!otherPlayer}`);
        
        if (this.scene.isActive("Arena") && otherPlayer) {
            if (socketId === gameState.player1.id) {
                // I am player 1, so update other player sprite from player 2's state
                console.log(`I am player1, updating other player from player2 state:`, gameState.player2);
                this.updatePlayerFromGameState(otherPlayer, gameState.player2);
            } else if (socketId === gameState.player2.id) {
                // I am player 2, so update other player sprite from player 1's state
                console.log(`I am player2, updating other player from player1 state:`, gameState.player1);
                this.updatePlayerFromGameState(otherPlayer, gameState.player1);
            }
        }
    }

    private updatePlayerFromGameState(sprite: Phaser.Physics.Arcade.Sprite, playerState: IPlayerState): void {
        if (playerState.x !== undefined) {
            sprite.x += (playerState.x - sprite.x) * 0.2;
        }
        if (playerState.y !== undefined) {
            sprite.y += (playerState.y - sprite.y) * 0.2;
        }
        if (playerState.flipX !== undefined) sprite.setFlipX(playerState.flipX);
        
        // Update animation based on velocity and state
        if (this.arenaPlayer.isSpriteAnimationSafe(sprite)) {
            const currentAnim = sprite.anims.currentAnim?.key || "";
            const isCurrentlyAttacking = sprite.getData('isAttacking') || false;
            const currentTime = this.time.now;
            
            // Skip animation updates if currently attacking
            if (isCurrentlyAttacking) {
                return;
            }
            
            // Determine appropriate animation based on velocity - improved logic
            let animationToPlay = "_Idle_Idle";
            
            // Check if player is actually in air (not just has vertical velocity)
            const isGrounded = sprite.body && (sprite.body.touching.down || sprite.body.blocked.down);
            
            // If player is moving horizontally and grounded, use Run animation
            if (playerState.velocityX && Math.abs(playerState.velocityX) > 100 && isGrounded) {
                animationToPlay = "_Run";
            }
            // Only use Jump animation if player is actually in air AND moving upward significantly
            else if (!isGrounded && playerState.velocityY && playerState.velocityY < -200) {
                animationToPlay = "_Jump";
            }
            // For small vertical movements or falling, stay with ground animations
            else if (playerState.velocityX && Math.abs(playerState.velocityX) > 100) {
                animationToPlay = "_Run"; // Keep running animation even if slightly in air
            }
            
            // Prevent rapid animation switching
            const timeSinceLastChange = currentTime - (this.arenaGameState.getOtherPlayer().lastAnimationChangeTime || 0);
            const minimumAnimationTime = 350; // Increased to reduce stuttering further
            
            // Only change animation if enough time has passed and animation is different
            if (currentAnim !== animationToPlay && 
                timeSinceLastChange > minimumAnimationTime) {
                
                try {
                    sprite.play(animationToPlay, true);
                    this.arenaGameState.getOtherPlayer().lastAnimationChangeTime = currentTime;
                    this.arenaGameState.getOtherPlayer().lastReceivedAnimation = animationToPlay;
                    console.log(`Opponent animation: ${currentAnim} → ${animationToPlay}`);
                } catch (error) {
                    console.error("Failed to play other player animation:", animationToPlay, error);
                }
            } else {
                console.log(`Animation update skipped: conditions not met`);
            }
        } else {
            console.log(`Animation update skipped: sprite unsafe`);
        }
    }

    private performAttack(): void {
        const myPlayer = this.arenaGameState.getMyPlayer().sprite;
        if (!myPlayer) return;
        
        // Check attack cooldown first with enhanced feedback
        if (!this.arenaInput.canAttack()) {
            const consecutiveAttacks = this.arenaInput.getConsecutiveAttacks();
            const cooldownProgress = this.arenaInput.getAttackCooldownProgress();
            console.log(`Attack blocked by cooldown: consecutive=${consecutiveAttacks}, progress=${(cooldownProgress * 100).toFixed(1)}%`);
            return; // Still in cooldown
        }
        
        // Mark attack time
        this.arenaInput.markAttack();
        this.arenaInput.markAttack();
        
        if (this.arenaPlayer.performAttack(myPlayer)) {
            // Pass player position and direction for accurate hit detection
            const playerData = {
                x: myPlayer.x,
                y: myPlayer.y,
                flipX: myPlayer.flipX
            };
            
            this.arenaNetworking.emitPlayerAttack(playerData);
            this.arenaAudio.playAttackSound();
        }
    }

    // Socket event handlers
    private handleGameStateUpdate(data: any): void {
        // If our sprite is not yet created (e.g., gameStateUpdate arrives before playersConnected), just ignore for now
        if (!this.arenaGameState.getMyPlayer().sprite) {
            console.warn('gameStateUpdate received but my sprite not ready yet');
            return;
        }
        const myPlayerId = this.arenaNetworking.getSocketId();
        const serverState = data.player1.id === myPlayerId ? data.player1 : data.player2;

        if (serverState) {
            // Server Reconciliation
            const lastProcessedTick = serverState.lastProcessedTick;

            // Remove all processed inputs from the pending_inputs queue
            this.pending_inputs = this.pending_inputs.filter(input => input.tick > lastProcessedTick);

            // Re-apply pending inputs to the authoritative state
            const myPlayer = this.arenaGameState.getMyPlayer().sprite!;
            myPlayer.x = serverState.x;
            myPlayer.y = serverState.y;
            if (myPlayer.body) {
                myPlayer.body.velocity.x = serverState.velocityX;
                myPlayer.body.velocity.y = serverState.velocityY;
            }
            myPlayer.setFlipX(serverState.flipX);

            this.pending_inputs.forEach(input => {
                myPlayer.x = input.x;
                myPlayer.y = input.y;
                if (myPlayer.body) {
                    myPlayer.body.velocity.x = input.velocityX;
                    myPlayer.body.velocity.y = input.velocityY;
                }
                myPlayer.setFlipX(input.flipX);
                if (this.arenaPlayer.isSpriteAnimationSafe(myPlayer) && myPlayer.anims.currentAnim?.key !== input.anim) {
                    myPlayer.play(input.anim, true);
                }
            });
        }


        // Update player 1 state
        if (data.player1) {
            this.arenaGameState.updatePlayerState(data.player1.id, data.player1);
        }

        // Update player 2 state
        if (data.player2) {
            this.arenaGameState.updatePlayerState(data.player2.id, data.player2);
        }
    }

    private handleMatchEnded(data: any): void {
        if (this.arenaGameState.isTransitioning()) {
            return;
        }
        
        this.arenaGameState.setTransitioning(true);
        console.log(`Match ended:`, data);
        
        // Stop background music
        this.arenaAudio.stopBackgroundMusic();
        
        // Play game over sound
        this.arenaAudio.playGameOverSound();
        
        // Show immediate feedback
        this.showMatchEndFeedback(data);
        
        // Handle the result
        this.handleMatchResult(data);
    }

    private handlePlayerHit(data: any): void {
        console.log("Player hit event received:", data);
        console.log(`Player ${data.id} hit by ${data.attackerId}, health: ${data.health}`);
        
        // Get current player socket ID to determine if this is the current player
        const socketId = this.arenaNetworking.getSocketId();
        const isCurrentPlayerHit = data.id === socketId;
        
        // Play enhanced hit sounds for better feedback
        this.arenaAudio.playHitSound();
        this.arenaAudio.playImpactSound();
        
        // Play additional dramatic sound if current player is hit
        if (isCurrentPlayerHit) {
            this.arenaAudio.playDamageSound();
            this.arenaAudio.playHeavyHitSound();
        }

        // Update health in game state
        this.arenaGameState.updatePlayerState(data.id, { health: data.health });
        
        // Force update game state and UI
        const myPlayer = this.arenaGameState.getMyPlayer().sprite;
        const otherPlayer = this.arenaGameState.getOtherPlayer().sprite;
        const gameState = this.arenaGameState.getGameState();
        
        // Log current health states for debugging
        console.log("Current game state after hit:", {
            player1Health: gameState.player1.health,
            player2Health: gameState.player2.health,
            hitPlayerId: data.id,
            mySocketId: socketId,
            isCurrentPlayerHit: isCurrentPlayerHit
        });
        
        this.arenaUI.updatePlayerHealthBars(myPlayer, otherPlayer, gameState, socketId || '');
        
        // Visual feedback for hit player with enhanced effects
        const hitPlayer = isCurrentPlayerHit ? myPlayer : otherPlayer;
        if (hitPlayer && hitPlayer.active && hitPlayer.scene) {
            console.log(`Applying enhanced hit effects to ${isCurrentPlayerHit ? 'current player' : 'other player'}`);
            
            // Check if this hit caused a knockout (health <= 0)
            const isKnockout = data.health <= 0;
            
            this.applyHitEffects(hitPlayer, isCurrentPlayerHit, isKnockout);
        } else {
            console.warn(`Could not apply hit effects - player sprite not available or inactive`);
        }
    }

    private applyHitEffects(sprite: Phaser.Physics.Arcade.Sprite, isCurrentPlayer: boolean = false, isKnockout: boolean = false): void {
        if (!sprite || !sprite.active || !sprite.scene) {
            console.warn("Cannot apply hit effects: sprite is invalid or inactive");
            return;
        }

        // Prevent duplicate hit effects if already in progress
        if (sprite.getData('hitEffectInProgress')) {
            console.log("Hit effect already in progress for this sprite, skipping");
            return;
        }

        console.log(`Applying hit effects - isCurrentPlayer: ${isCurrentPlayer}, sprite position: (${sprite.x}, ${sprite.y})`);

        // Mark hit effect as in progress
        sprite.setData('hitEffectInProgress', true);

        // Store original tint for restoration
        const originalTint = sprite.tint;

        try {
            // Simple red flash effect only - no position or scale changes
            const flashColor = isCurrentPlayer ? 0xff4444 : 0xff6666;
            
            // Create a gentle flash effect that doesn't interfere with animations
            const flashTween = this.tweens.add({
                targets: sprite,
                tint: flashColor,
                duration: isCurrentPlayer ? 120 : 100,
                yoyo: true,
                repeat: isCurrentPlayer ? 1 : 0,
                ease: 'Power2',
                onComplete: () => {
                    if (sprite && sprite.active) {
                        sprite.setTint(originalTint);
                        sprite.setData('hitEffectInProgress', false); // Clear the flag
                        console.log(`Flash effect completed, tint reset`);
                    }
                }
            });

            // Screen shake effect ONLY for the current player being hit
            if (isCurrentPlayer) {
                this.applyScreenShake();
            }

            // Visual effects that don't affect the sprite directly - only once
            this.createDamageParticles(sprite.x, sprite.y - 30, isCurrentPlayer);
            
            // Show knockout text for both players when knockout happens, otherwise show damage text
            if (isKnockout) {
                // Show knockout text for both the hit player and display it prominently
                this.createDamageText(sprite.x, sprite.y - 50, "KNOCKOUT!", isCurrentPlayer, true);
            } else {
                this.createDamageText(sprite.x, sprite.y - 50, "-10", isCurrentPlayer, false);
            }
            
            console.log(`Hit effects applied successfully - only tint and external effects`);
        } catch (error) {
            console.error("Error applying hit effects:", error);
            
            // Emergency restoration in case of error
            if (sprite && sprite.active) {
                sprite.setTint(originalTint);
                sprite.setData('hitEffectInProgress', false); // Clear the flag
                console.log("Emergency sprite restoration applied");
            }
        }
    }

    private applyScreenShake(): void {
        try {
            const camera = this.cameras.main;
            const originalZoom = camera.zoom;
            
            console.log("Applying subtle screen shake for current player hit");
            
            // Gentle camera shake - much reduced intensity
            camera.shake(200, 0.015, true);
            
            // Very slight zoom punch
            this.tweens.add({
                targets: camera,
                zoom: originalZoom * 1.02,
                duration: 80,
                yoyo: true,
                ease: 'Power2'
            });
            
            // Screen flash effect - create a red overlay that quickly fades
            const screenFlash = this.add.rectangle(
                camera.width / 2,
                camera.height / 2,
                camera.width,
                camera.height,
                0xff0000,
                0.3
            );
            screenFlash.setDepth(1000); // Very high depth to appear above everything
            screenFlash.setScrollFactor(0); // Keep it fixed to camera
            
            // Fade out the screen flash quickly
            this.tweens.add({
                targets: screenFlash,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    screenFlash.destroy();
                }
            });
        } catch (error) {
            console.error("Error applying screen shake:", error);
        }
    }

    private createDamageParticles(x: number, y: number, isCurrentPlayer: boolean = false): void {
        try {
            console.log(`Creating damage particles at (${x}, ${y}) for ${isCurrentPlayer ? 'current' : 'other'} player`);
            
            // Create more particles for current player hit
            const particleCount = isCurrentPlayer ? 8 : 5;
            const particleColor = isCurrentPlayer ? 0xff2222 : 0xff6666;
            const particleSize = isCurrentPlayer ? 4 : 3;
            
            // Create simple damage indicator particles
            for (let i = 0; i < particleCount; i++) {
                const particle = this.add.circle(
                    x + (Math.random() - 0.5) * 40, 
                    y, 
                    particleSize, 
                    particleColor
                );
                particle.setDepth(10);
                
                // Animate particles with more dramatic effect for current player
                const spreadX = isCurrentPlayer ? 120 : 100;
                const spreadY = isCurrentPlayer ? 80 : 60;
                const duration = isCurrentPlayer ? 800 : 600;
                
                this.tweens.add({
                    targets: particle,
                    x: particle.x + (Math.random() - 0.5) * spreadX,
                    y: particle.y - Math.random() * spreadY,
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    duration: duration,
                    ease: 'Power2',
                    onComplete: () => {
                        if (particle && particle.scene) {
                            particle.destroy();
                        }
                    }
                });
            }
            
            // Add some sparks for current player
            if (isCurrentPlayer) {
                this.createSparkEffects(x, y);
            }
        } catch (error) {
            console.error("Error creating damage particles:", error);
        }
    }
    
    private createSparkEffects(x: number, y: number): void {
        try {
            console.log(`Creating spark effects at (${x}, ${y})`);
            
            // Create spark-like effects for more dramatic impact
            for (let i = 0; i < 6; i++) {
                const spark = this.add.rectangle(
                    x + (Math.random() - 0.5) * 30,
                    y + (Math.random() - 0.5) * 20,
                    2,
                    8,
                    0xffff88
                );
                spark.setDepth(11);
                spark.rotation = Math.random() * Math.PI * 2;
                
                this.tweens.add({
                    targets: spark,
                    x: spark.x + (Math.random() - 0.5) * 60,
                    y: spark.y - Math.random() * 40,
                    alpha: 0,
                    rotation: spark.rotation + (Math.random() - 0.5) * Math.PI,
                    duration: 400,
                    ease: 'Power2',
                    onComplete: () => {
                        if (spark && spark.scene) {
                            spark.destroy();
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error creating spark effects:", error);
        }
    }
    
    private createDamageText(x: number, y: number, damage: string, isCurrentPlayer: boolean, isKnockout: boolean = false): void {
        let textColor = isCurrentPlayer ? '#ff3333' : '#ff6666';
        let fontSize = isCurrentPlayer ? '32px' : '28px';
        
        // Special styling for knockout text
        if (isKnockout) {
            textColor = '#ff8800'; // Orange color for knockout
            fontSize = isCurrentPlayer ? '48px' : '42px'; // Larger font for knockout
        }
        
        const damageText = this.add.text(x, y, damage, {
            fontSize: fontSize,
            fontFamily: 'Arial',
            color: textColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: isKnockout ? 4 : 2 // Thicker stroke for knockout
        });
        
        damageText.setDepth(15);
        damageText.setOrigin(0.5, 0.5);
        
        // Enhanced animation for knockout text
        const animationDuration = isKnockout ? 1500 : 1000;
        const finalY = isKnockout ? y - 80 : y - 60;
        const finalScale = isKnockout ? 2.0 : 1.5;
        
        // Animate the damage text
        this.tweens.add({
            targets: damageText,
            y: finalY,
            alpha: 0,
            scaleX: finalScale,
            scaleY: finalScale,
            duration: animationDuration,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
        
        // No rotation effect for knockout text - removed shaking/rotation completely
    }

    private handlePlayerAttacked(data: any): void {
        console.log("Player attacked event received:", data);
        
        // Play attack sound
        this.arenaAudio.playAttackSound();

        // Show attack animation for other players only
        const socketId = this.arenaNetworking.getSocketId();
        
        // If the player who attacked is not the current player, show the attack animation
        if (data.id !== socketId) {
            const otherPlayerSprite = this.arenaGameState.getOtherPlayer().sprite;
            this.showAttackAnimation(otherPlayerSprite);
        }
    }

    private handleTimerUpdate(data: any): void {
        console.log("Timer update received:", data);
        if (this.scene.isActive("Arena")) {
            // Check for both possible timer formats
            const timeToDisplay = data.formattedTime || data.timeLeft || "XX:XX";
            this.arenaUI.updateTimer(timeToDisplay);
        }
    }

    private handlePlayersConnected(data: any): void {
        console.log("Players connected event received", data);
        
        // Ignore early payloads until both players marked connected
        if (!data.player1 || !data.player2) {
            console.warn('playersConnected payload missing player data');
            return;
        }

        // Set the map from server data
        if (data.selectedMap) {
            this.arenaBackground.setSelectedMap(data.selectedMap);
            this.arenaBackground.recreateBackground();
            this.arenaUI.ensureUIElementsVisible();
        }
        
        // Update game state with player data
        this.arenaGameState.updateGameState(
            {
                id: data.player1.id,
                x: data.player1.x,
                y: data.player1.y,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                flipX: false,
                anim: "_Idle_Idle",
                pastAnim: undefined,
            },
            {
                id: data.player2.id,
                x: data.player2.x,
                y: data.player2.y,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                flipX: true,
                anim: "_Idle_Idle",
                pastAnim: undefined,
            }
        );
        
        // Update player names
        this.arenaUI.updatePlayerNames(data.player1.name, data.player2.name);

        // Create player sprites
        this.createPlayerSprites(data);

        // Recompute world bounds now that the background may have changed
        this.setupWorldBounds();

        // Ensure the main camera is following our player even if SceneManager failed
        const mySpriteFollow = this.arenaGameState.getMyPlayer().sprite;
        if (mySpriteFollow) {
            this.cameras.main.startFollow(mySpriteFollow);
        }
 
        // Initialize managers
        this.initializeManagers();
        
        // Start background music
        const selectedMap = this.arenaBackground.getSelectedMap();
        if (selectedMap) {
            this.arenaAudio.startBackgroundMusic(selectedMap.musicKey);
        }
        
        // Create entrance animation
        this.arenaUI.createEntranceAnimation();
        this.createEntranceAnimation();
    }

    private handleNewPlayer(data: any): void {
        console.log("New player joined:", data);
        // Handle new player joining if needed
    }

    private handlePlayerDisconnected(data: any): void {
        console.log("Player disconnected:", data);
        // Handle player disconnection if needed
    }

    private createPlayerSprites(data: any): void {
        if (this.spritesCreated) {
            console.warn('createPlayerSprites called but sprites already exist');
            return;
        }
        console.log("Creating sprites for players...");
        
        const socketId = this.arenaNetworking.getSocketId();
        
        if (socketId === data.player1.id) {
            // Current player is player 1
            const mySprite = this.arenaPlayer.createPlayerSprite(data.player1.x ?? 100, data.player1.y ?? 300);
            this.arenaGameState.setMyPlayerSprite(mySprite);
            
            const otherSprite = this.arenaPlayer.createPlayerSprite(data.player2.x ?? 700, data.player2.y ?? 300);
            this.arenaGameState.setOtherPlayerSprite(otherSprite);
        } else if (socketId === data.player2.id) {
            // Current player is player 2
            const mySprite = this.arenaPlayer.createPlayerSprite(data.player2.x ?? 700, data.player2.y ?? 300);
            this.arenaGameState.setMyPlayerSprite(mySprite);
            
            const otherSprite = this.arenaPlayer.createPlayerSprite(data.player1.x ?? 100, data.player1.y ?? 300);
            this.arenaGameState.setOtherPlayerSprite(otherSprite);
        }

        // Configure sprites and add physics
        const myPlayer = this.arenaGameState.getMyPlayer().sprite;
        const otherPlayer = this.arenaGameState.getOtherPlayer().sprite;
        
        if (myPlayer) {
            this.arenaPlayer.configurePlayerSprite(myPlayer);
            this.arenaPhysics.addPlatformCollider(myPlayer);
        }
        
        if (otherPlayer) {
            this.arenaPlayer.configurePlayerSprite(otherPlayer);
            this.arenaPhysics.addPlatformCollider(otherPlayer);
        }

        console.log("Sprites created and configured successfully");

        this.spritesCreated = true;
    }

    private initializeManagers(): void {
        // Create the scene manager for camera handling
        this.sceneManager = new SceneManager(
            this,
            this.arenaBackground.getBackgroundSprites()[0],
            [], // Empty array for tile sprites since we're using regular sprites
            {
                bestZoom: 1.5,
                parallaxFactor: 0.4,
            }
        );

        // Create the player manager
        this.playerManager = new PlayerManager(this, this.socket, {
            walkSpeed: 200,
            runSpeed: 400,
            jumpSpeed: -2000,
            crouchSpeed: 150,
            disableAttackHandlers: true
        });

        // Initialize the player manager with the actual player sprite
        const myPlayer = this.arenaGameState.getMyPlayer().sprite;
        if (myPlayer) {
            // Create dummy HP and stamina text objects for PlayerManager
            const dummyHPText = this.add.text(0, 0, "").setVisible(false);
            const dummyStaminaText = this.add.text(0, 0, "").setVisible(false);
            
            this.playerManager.initialize(
                myPlayer.x, 
                myPlayer.y, 
                dummyHPText, 
                dummyStaminaText, 
                myPlayer
            );
        }

        // Initialize MultiplayerManager for compact input networking
        if (myPlayer && !this.multiplayerManager) {
            this.multiplayerManager = new MultiplayerManager(this, this.socket, myPlayer, {
                positionUpdateInterval: 50,
                platform: this.arenaPhysics.getPlatform(),
            });
        }

        // Create the UI manager
        this.uiManager = new UIManager(this, {
            p1infoContainer: this.arenaUI.getAllUIElements()[0] as Phaser.GameObjects.Image,
            p2infoContainer: this.arenaUI.getAllUIElements()[1] as Phaser.GameObjects.Image,
            player1Name: this.arenaUI.getAllUIElements()[2] as Phaser.GameObjects.Text,
            player2Name: this.arenaUI.getAllUIElements()[3] as Phaser.GameObjects.Text,
            uiTimer: this.arenaUI.getAllUIElements()[4] as Phaser.GameObjects.Sprite,
            matchTimerText: this.arenaUI.getAllUIElements()[5] as Phaser.GameObjects.Text,
            uiSkillContainer: null as any,
            uiSkillONE: null as any,
            uiSkillTWO: null as any,
            uiSkillTHREE: null as any,
        });

        // Configure camera ignore lists
        this.setupCameraIgnoreLists();
        
        // Setup camera follow
        this.setupCameraFollow();
    }

    private setupCameraIgnoreLists(): void {
        if (!this.sceneManager) return;
        
        // Make main camera ignore ALL UI elements
        this.sceneManager.setMainIgnoreUI(this.arenaUI.getAllUIElements());

        // Create array of gameplay elements
        const gameplayElements = [
            ...this.arenaBackground.getBackgroundSprites(),
            this.arenaPhysics.getPlatform(),
        ].filter((elem) => elem !== undefined);

        // Add player sprites to gameplay elements
        const myPlayer = this.arenaGameState.getMyPlayer().sprite;
        const otherPlayer = this.arenaGameState.getOtherPlayer().sprite;
        
        if (myPlayer) gameplayElements.push(myPlayer);
        if (otherPlayer) gameplayElements.push(otherPlayer);

        // Add other players
        Object.values(this.arenaGameState.getOtherPlayers()).forEach((sprite) => {
            gameplayElements.push(sprite);
        });

        // Make UI camera ignore ALL gameplay elements
        this.sceneManager.setUIIgnoreGameplay(gameplayElements);
    }

    private setupCameraFollow(): void {
        if (this.sceneManager && this.arenaGameState.getMyPlayer().sprite) {
            // SceneManager doesn't have setFollowTarget, use camera directly
            this.cameras.main.startFollow(this.arenaGameState.getMyPlayer().sprite!);
        }
    }

    private updateCameraZoom(): void {
        if (this.sceneManager && this.arenaGameState.getMyPlayer().sprite) {
            if (this.playerManager) {
                // Use PlayerManager's getSpeed method if available
                const speed = this.playerManager.getSpeed();
                const runSpeedThreshold = this.playerManager.getRunSpeedThreshold();
                this.sceneManager.updateCameraZoom(speed, runSpeedThreshold);
            } else {
                // Fallback: calculate speed directly from player sprite
                const playerBody = this.arenaGameState.getMyPlayer().sprite!.body;
                const speed = playerBody ? Math.abs(playerBody.velocity.x) : 0;
                const runSpeedThreshold = 350 * 0.8; // Default run speed threshold
                this.sceneManager.updateCameraZoom(speed, runSpeedThreshold);
            }
        }
    }

    private showMatchEndFeedback(data: any): void {
        // Prevent duplicate feedback
        if (this.arenaGameState.isTransitioning()) {
            console.log("Match end feedback already shown, skipping duplicate");
            return;
        }
        
        const endTitle = data.reason === "knockout" ? "KNOCKOUT!" : "TIME UP!";
        const endColor = data.reason === "knockout" ? "#ff8800" : "#ff0000";
        
        const endText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            endTitle,
            {
                fontFamily: "Arial",
                fontSize: "80px",
                color: endColor,
                stroke: "#000000",
                strokeThickness: 6,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#000",
                    blur: 5,
                    stroke: true,
                    fill: true,
                },
            }
        );
        endText.setOrigin(0.5);
        endText.setScrollFactor(0);
        endText.setDepth(1000);
        
        // Add win/lose text below the knockout text
        let resultText = "";
        const socketId = this.arenaNetworking.getSocketId();
        
        console.log("=== WIN/LOSE TEXT DEBUG ===");
        console.log("Match end feedback data:", data);
        console.log("Current socket ID:", socketId);
        
        if (data.winner && data.loser) {
            // Handle both possible data formats:
            // Format 1: winner/loser are objects with id property
            // Format 2: winner/loser are just socket ID strings
            const winnerId = typeof data.winner === 'string' ? data.winner : data.winner.id;
            const loserId = typeof data.loser === 'string' ? data.loser : data.loser.id;
            
            console.log(`Winner ID: ${winnerId}, Loser ID: ${loserId}`);
            if (winnerId === socketId) {
                resultText = "YOU WIN!";
                console.log("Setting result text to: YOU WIN!");
            } else if (loserId === socketId) {
                resultText = "YOU LOSE!";
                console.log("Setting result text to: YOU LOSE!");
            }
        } else {
            resultText = "DRAW!";
            console.log("Setting result text to: DRAW!");
        }
        
        console.log("Final result text:", resultText);
        
        const winLoseText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 30,
            resultText,
            {
                fontFamily: "Arial",
                fontSize: "48px",
                color: resultText === "YOU WIN!" ? "#00ff00" : resultText === "YOU LOSE!" ? "#ff4444" : "#ffff00",
                stroke: "#000000",
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#000",
                    blur: 5,
                    stroke: true,
                    fill: true,
                },
            }
        );
        winLoseText.setOrigin(0.5);
        winLoseText.setScrollFactor(0);
        winLoseText.setDepth(1000);
        
        // Flash the screen
        if (data.reason === "knockout") {
            this.cameras.main.flash(300, 255, 136, 0);
        } else {
            this.cameras.main.flash(300, 255, 0, 0);
        }
    }

    private handleMatchResult(data: any): void {
        console.log("=== MATCH RESULT DEBUG ===");
        console.log("Match result data:", data);
        
        if (data.winner && data.loser) {
            // Handle both possible data formats:
            // Format 1: winner/loser are objects with id and name
            // Format 2: winner/loser are just socket ID strings
            const winnerId = typeof data.winner === 'string' ? data.winner : data.winner.id;
            const loserId = typeof data.loser === 'string' ? data.loser : data.loser.id;
            const winnerName = typeof data.winner === 'string' ? 'Player' : data.winner.name;
            const loserName = typeof data.loser === 'string' ? 'Player' : data.loser.name;
            
            console.log(`Winner: ${winnerName} (ID: ${winnerId}), Loser: ${loserName} (ID: ${loserId})`);
            
            // Determine if current player won or lost
            const socketId = this.arenaNetworking.getSocketId();
            console.log(`Current player socket ID: ${socketId}`);
            const currentPlayerWon = winnerId === socketId;
            console.log(`Current player won: ${currentPlayerWon}`);
            
            // Validate that we have a valid socket ID
            if (!socketId) {
                console.error("No socket ID available! Defaulting to GameMenu");
                this.time.delayedCall(3000, () => {
                    this.scene.start("GameMenu");
                });
                return;
            }
            
            // Transition to appropriate scene after delay
            this.time.delayedCall(3000, () => {
                if (currentPlayerWon) {
                    console.log("=== TRANSITIONING TO VICTORY SCENE ===");
                    try {
                        this.scene.start("Victory");
                    } catch (error) {
                        console.error("Error starting Victory scene:", error);
                        console.log("Falling back to GameMenu");
                        this.scene.start("GameMenu");
                    }
                } else {
                    console.log("=== TRANSITIONING TO DEFEAT SCENE ===");
                    try {
                        this.scene.start("Defeat");
                    } catch (error) {
                        console.error("Error starting Defeat scene:", error);
                        console.log("Falling back to GameMenu");
                        this.scene.start("GameMenu");
                    }
                }
            });
        } else {
            console.log("Match ended in a draw - returning to main menu");
            // Handle draw logic - return to game menu
            this.time.delayedCall(3000, () => {
                this.scene.start("GameMenu");
            });
        }
    }

    private showAttackAnimation(sprite: Phaser.Physics.Arcade.Sprite | undefined): void {
        if (!sprite || 
            !this.arenaPlayer.isSpriteAnimationSafe(sprite) || 
            sprite.getData('isAttacking')) {
            return;
        }
        
        try {
            // Set attacking flag first to prevent interruptions
            sprite.setData('isAttacking', true);
            
            // Stop any current animation before playing attack
            if (sprite.anims.currentAnim) {
                sprite.anims.stop();
            }
            
            // Clear any existing animation complete listeners to prevent conflicts
            sprite.off('animationcomplete');
            
            // Play attack animation
            sprite.play({
                key: "_Attack2",
                frameRate: 15, // Increased from 12 to 15 for spam attack consistency
                repeat: 0,
            });
            
            console.log(`Attack animation started for player ${sprite.flipX ? 'left' : 'right'}`);
            
            // Handle animation completion
            sprite.once('animationcomplete', (animation: any, frame: any) => {
                if (sprite && sprite.active && animation.key === "_Attack2") {
                    console.log("Attack animation completed, returning to idle");
                    sprite.setData('isAttacking', false);
                    
                    // Return to idle animation after attack completes
                    try {
                        sprite.play('_Idle_Idle', true);
                    } catch (error) {
                        console.warn("Could not play idle animation after attack:", error);
                    }
                }
            });
            
            // Fallback timeout to clear attacking flag if animation doesn't complete
            this.time.delayedCall(300, () => { // Reduced from 400ms to 300ms for spam attack consistency
                if (sprite && sprite.active && sprite.getData('isAttacking')) {
                    console.log("Attack animation timeout - forcing idle state");
                    sprite.setData('isAttacking', false);
                    try {
                        sprite.play('_Idle_Idle', true);
                    } catch (error) {
                        console.warn("Could not play fallback idle animation:", error);
                    }
                }
            });
        } catch (error) {
            console.error("Failed to play attack animation for other player:", error);
            // Reset attacking state if animation fails
            sprite.setData('isAttacking', false);
        }
    }

    private createEntranceAnimation(): void {
        // Start with a camera flash
        this.cameras.main.flash(500, 0, 0, 0);

        // Create a "FIGHT!" text
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
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#000",
                    blur: 5,
                    stroke: true,
                    fill: true,
                },
            }
        );
        fightText.setOrigin(0.5);
        fightText.setAlpha(0);
        fightText.setScale(2);
        fightText.setScrollFactor(0);

        // Create map announcement text
        const selectedMap = this.arenaBackground.getSelectedMap();
        const mapText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            `Map: ${selectedMap?.name || "Unknown"}`,
            {
                fontFamily: "Arial",
                fontSize: "36px",
                color: "#ffff00",
                stroke: "#000000",
                strokeThickness: 4,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: "#000",
                    blur: 3,
                    stroke: true,
                    fill: true,
                },
            }
        );
        mapText.setOrigin(0.5);
        mapText.setAlpha(0);
        mapText.setScrollFactor(0);

        // Animate texts
        this.time.delayedCall(800, () => {
            this.tweens.add({
                targets: [fightText, mapText],
                alpha: 1,
                scale: 1,
                duration: 600,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.time.delayedCall(1500, () => {
                        this.tweens.add({
                            targets: [fightText, mapText],
                            alpha: 0,
                            scale: 0.5,
                            duration: 400,
                            ease: 'Power2',
                            onComplete: () => {
                                fightText.destroy();
                                mapText.destroy();
                            }
                        });
                    });
                }
            });
        });

        // Resume game after animations
        this.time.delayedCall(2300, () => {
            this.physics.resume();
        });
    }

    private debugGameAssets(): void {
        console.log("=== DEBUGGING GAME ASSETS ===");
        
        // Debug: List loaded textures
        console.log("=== LOADED TEXTURE KEYS ===");
        this.textures.list &&
            Object.keys(this.textures.list).forEach((key) => {
                console.log(`Texture: ${key}`);
            });

        // List available animations
        console.log("=== AVAILABLE ANIMATIONS ===");
        const animKeys = Object.keys((this.anims as any).anims.entries);
        animKeys.forEach((key) => console.log(`Animation: ${key}`));
        
        // Debug current sprites
        console.log("=== CURRENT SPRITES ===");
        console.log("MY_PLAYER.sprite:", this.arenaGameState.getMyPlayer().sprite);
        console.log("OTHER_PLAYER.sprite:", this.arenaGameState.getOtherPlayer().sprite);
        console.log("Platform:", this.arenaPhysics.getPlatform());
        
        console.log("=== GAME ASSETS DEBUG COMPLETE ===");
    }

    shutdown(): void {
        console.log("Arena scene shutting down - cleaning up...");
        
        // Stop background music
        this.arenaAudio.stopBackgroundMusic();
        
        // Clean up managers
        if (this.playerManager) {
            this.playerManager.destroy();
            this.playerManager = null;
        }

        if (this.sceneManager) {
            this.sceneManager.destroy();
            this.sceneManager = null;
        }

        if (this.uiManager) {
            this.uiManager.destroy();
            this.uiManager = null;
        }

        if (this.multiplayerManager) {
            // MultiplayerManager doesn't have destroy method, clean up manually
            this.multiplayerManager = null;
        }
        
        // Clean up arena modules
        this.arenaNetworking.destroy();
        this.arenaInput.destroy();
        this.arenaAudio.destroy();
        this.arenaUI.destroy();
        this.arenaBackground.destroy();
        this.arenaPhysics.destroy();
        this.arenaPlayer.destroy();
        this.arenaGameState.destroy();
        
        // Clean up any timers
        if (this.time) {
            this.time.removeAllEvents();
        }
        
        console.log("Arena scene cleanup completed");
    }

    preDestroy(): void {
        console.log("Arena scene preDestroy called");
        this.shutdown();
    }

    onShutdown(): void {
        console.log("Arena scene onShutdown called");
    }

    destroy(): void {
        console.log("Arena scene being destroyed");
        this.shutdown();
    }
}
/* END OF COMPILED CODE */
