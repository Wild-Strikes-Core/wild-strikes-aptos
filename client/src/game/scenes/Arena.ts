/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { PLAYER_1, PLAYER_2 } from "@/lib/constants";
import { SOCKET } from "@/lib/socket";
import { Socket } from "socket.io-client";
import { PlayerManager } from "../controllers/PlayerManager";
import { UIManager } from "../controllers/UIManager";
import { SceneManager } from "../controllers/SceneManager";
import { MultiplayerManager } from "../controllers/MultiplayerManager";
import { ArenaBackground } from "./arena/ArenaBackground";
import { ArenaUI } from "./arena/ArenaUI";
import { ArenaAudio } from "./arena/ArenaAudio";
import { ArenaInput } from "./arena/ArenaInput";
import { ArenaNetworking, IPlayerState } from "./arena/ArenaNetworking";
import { ArenaPlayer } from "./arena/ArenaPlayer";
import { ArenaPhysics } from "./arena/ArenaPhysics";
import { ArenaGameState } from "./arena/ArenaGameState";
/* END-USER-IMPORTS */

export default class Arena extends Phaser.Scene {
    private KEYS!: any;
    
    /* START-USER-CODE */
    
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
            onNewPlayer: (data) => this.handleNewPlayer(data),
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
        const currentAnimation = this.handlePlayerMovement(time);

        // Send position updates to server
        this.sendPositionUpdates(time, currentAnimation);

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

    private handlePlayerMovement(time: number): string {
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
            myPlayer.body!.velocity.x = -speed;
            myPlayer.setFlipX(true);
            currentAnimation = "_Run";
        } else if (this.arenaInput.isKeyPressed('right') && !myPlayer.getData('isAttacking')) {
            const speed = isRunning ? runSpeed : baseSpeed;
            myPlayer.body!.velocity.x = speed;
            myPlayer.setFlipX(false);
            currentAnimation = "_Run";
        } else if (!myPlayer.getData('isAttacking')) {
            myPlayer.body!.velocity.x = 0;
            currentAnimation = "_Idle_Idle";
        }
        
        // Debug: Log animation calculation
        console.log(`Animation calculated: ${currentAnimation}, velocity: (${myPlayer.body!.velocity.x}, ${myPlayer.body!.velocity.y}), isInAir: ${isInAir}, isAttacking: ${myPlayer.getData('isAttacking')}, leftPressed: ${this.arenaInput.isKeyPressed('left')}, rightPressed: ${this.arenaInput.isKeyPressed('right')}`);
        
        // Apply camera bounds constraint
        this.arenaPlayer.constrainPlayerToCameraBounds(myPlayer);

        // Update animation if needed
        if (this.arenaPlayer.isSpriteAnimationSafe(myPlayer) && 
            myPlayer.body?.velocity && 
            this.scene.isActive("Arena")) {
            
            const socketId = this.arenaNetworking.getSocketId();
            if (socketId === gameState.player1.id) {
                if (gameState.player1.anim !== currentAnimation) {
                    gameState.player1.anim = currentAnimation;
                    try {
                        myPlayer.play(currentAnimation, true);
                    } catch (error) {
                        console.error("Failed to play animation:", currentAnimation, error);
                    }
                }
            } else if (socketId === gameState.player2.id) {
                if (gameState.player2.anim !== currentAnimation) {
                    gameState.player2.anim = currentAnimation;
                    try {
                        myPlayer.play(currentAnimation, true);
                    } catch (error) {
                        console.error("Failed to play animation:", currentAnimation, error);
                    }
                }
            }
        }
        
        return currentAnimation;
    }

    private sendPositionUpdates(time: number, currentAnimation: string): void {
        const myPlayer = this.arenaGameState.getMyPlayer().sprite;
        
        if (myPlayer && 
            myPlayer.active && 
            myPlayer.body && 
            this.scene.isActive("Arena") && 
            this.arenaNetworking.isConnected() && 
            this.arenaGameState.canSendPositionUpdate()) {
            
            const gameState = this.arenaGameState.getGameState();
            const socketId = this.arenaNetworking.getSocketId();
            
            // Send position update with current animation
            this.arenaNetworking.emitPlayerMoved({
                x: myPlayer.x,
                y: myPlayer.y,
                velocityX: myPlayer.body.velocity.x,
                velocityY: myPlayer.body.velocity.y,
                flipX: myPlayer.flipX,
                anim: currentAnimation
            });
            
            this.arenaGameState.markPositionUpdateSent();
        }
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
        if (playerState.x !== undefined) sprite.x = playerState.x;
        if (playerState.y !== undefined) sprite.y = playerState.y;
        if (playerState.flipX !== undefined) sprite.setFlipX(playerState.flipX);
        
        // Update animation based on velocity and state
        if (this.arenaPlayer.isSpriteAnimationSafe(sprite)) {
            const currentAnim = sprite.anims.currentAnim?.key || "";
            const isCurrentlyAttacking = sprite.getData('isAttacking') || false;
            const currentTime = this.time.now;
            
            // Determine appropriate animation based on velocity
            let animationToPlay = "_Idle_Idle";
            
            // If player is moving horizontally, use Run animation
            if (playerState.velocityX && Math.abs(playerState.velocityX) > 50) {
                animationToPlay = "_Run";
            }
            
            // If player is moving vertically (falling or jumping), use Jump animation
            if (playerState.velocityY && playerState.velocityY < -50) {
                animationToPlay = "_Jump";
            }
            
            // Prevent rapid animation switching
            const timeSinceLastChange = currentTime - (this.arenaGameState.getOtherPlayer().lastAnimationChangeTime || 0);
            const minimumAnimationTime = 150; // Minimum time between animation changes
            
            // Debug logging
            console.log(`Opponent animation update: current=${currentAnim}, calculated=${animationToPlay}, velocityX=${playerState.velocityX}, velocityY=${playerState.velocityY}, attacking=${isCurrentlyAttacking}, timeSince=${timeSinceLastChange}`);
            
            // Only change animation if not attacking and enough time has passed
            if (currentAnim !== animationToPlay && 
                !isCurrentlyAttacking && 
                timeSinceLastChange > minimumAnimationTime) {
                
                try {
                    console.log(`Playing opponent animation: ${animationToPlay}`);
                    sprite.play(animationToPlay, true);
                    this.arenaGameState.getOtherPlayer().lastAnimationChangeTime = currentTime;
                    this.arenaGameState.getOtherPlayer().lastReceivedAnimation = animationToPlay;
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
        
        // Check attack cooldown first (like in backup)
        if (!this.arenaInput.canAttack()) {
            return; // Still in cooldown
        }
        
        // Mark attack time
        this.arenaInput.markAttack();
        
        if (this.arenaPlayer.performAttack(myPlayer)) {
            this.arenaNetworking.emitPlayerAttack();
            this.arenaAudio.playAttackSound();
        }
    }

    // Socket event handlers
    private handleGameStateUpdate(data: any): void {
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
        // Play hit sound
        this.arenaAudio.playHitSound();

        // Update health in game state
        this.arenaGameState.updatePlayerState(data.id, { health: data.health });
    }

    private handlePlayerAttacked(data: any): void {
        // Play attack sound
        this.arenaAudio.playAttackSound();

        // Show attack animation for other players only
        const gameState = this.arenaGameState.getGameState();
        const socketId = this.arenaNetworking.getSocketId();
        
        if (data.id === gameState.player1.id && socketId !== data.id) {
            this.showAttackAnimation(this.arenaGameState.getOtherPlayer().sprite);
        } else if (data.id === gameState.player2.id && socketId !== data.id) {
            this.showAttackAnimation(this.arenaGameState.getOtherPlayer().sprite);
        }
    }

    private handleTimerUpdate(data: any): void {
        console.log("Timer update received:", data);
        // Check for both possible timer formats
        const timeToDisplay = data.formattedTime || data.timeLeft || "XX:XX";
        this.arenaUI.updateTimer(timeToDisplay);
    }

    private handlePlayersConnected(data: any): void {
        console.log("Players connected event received", data);
        
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
        console.log("Creating sprites for players...");
        
        const socketId = this.arenaNetworking.getSocketId();
        
        if (socketId === data.player1.id) {
            // Current player is player 1
            const mySprite = this.arenaPlayer.createPlayerSprite(data.player1.x, data.player1.y);
            this.arenaGameState.setMyPlayerSprite(mySprite);
            
            const otherSprite = this.arenaPlayer.createPlayerSprite(data.player2.x, data.player2.y);
            this.arenaGameState.setOtherPlayerSprite(otherSprite);
        } else if (socketId === data.player2.id) {
            // Current player is player 2
            const mySprite = this.arenaPlayer.createPlayerSprite(data.player2.x, data.player2.y);
            this.arenaGameState.setMyPlayerSprite(mySprite);
            
            const otherSprite = this.arenaPlayer.createPlayerSprite(data.player1.x, data.player1.y);
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
        
        // Flash the screen
        if (data.reason === "knockout") {
            this.cameras.main.flash(300, 255, 136, 0);
        } else {
            this.cameras.main.flash(300, 255, 0, 0);
        }
    }

    private handleMatchResult(data: any): void {
        if (data.winner && data.loser) {
            console.log(`Winner: ${data.winner.name}, Loser: ${data.loser.name}`);
            // Handle winner/loser logic
            this.time.delayedCall(3000, () => {
                this.scene.start("GameMenu");
            });
        } else {
            console.log("Match ended in a draw");
            // Handle draw logic
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
            // Stop any current animation before playing attack (like backup)
            if (sprite.anims.currentAnim) {
                sprite.anims.stop();
            }
            
            sprite.play({
                key: "_Attack2",
                frameRate: 8,
                repeat: 0,
            });
            
            // Set a flag to prevent movement animations from overriding attack
            sprite.setData('isAttacking', true);
            
            // Clear any existing animation complete listeners to prevent conflicts
            sprite.off('animationcomplete');
            
            // Clear the flag after animation completes
            sprite.once('animationcomplete', () => {
                if (sprite && sprite.active) {
                    sprite.setData('isAttacking', false);
                }
            });
            
            // Fallback timeout to clear attacking flag if animation doesn't complete
            this.time.delayedCall(500, () => {
                if (sprite && sprite.active) {
                    sprite.setData('isAttacking', false);
                }
            });
        } catch (error) {
            console.error("Failed to play attack animation for other player:", error);
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
