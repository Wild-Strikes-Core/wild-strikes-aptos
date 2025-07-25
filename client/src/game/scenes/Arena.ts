// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { PLAYER_1, PLAYER_2 } from "@/lib/constants";
import { SOCKET } from "@/lib/socket";
import { log } from "node:console";
import { Socket } from "socket.io-client";
import { PlayerManager } from "../controllers/PlayerManager";
import { SceneManager } from "../controllers/SceneManager";
import { UIManager } from "../controllers/UIManager";
import { MultiplayerManager } from "../controllers/MultiplayerManager";
import { AnimationManager } from "../controllers/AnimationManager";
import { createPlayerSprite } from "../utils/spriteUtils";
/* END-USER-IMPORTS */

interface IPlayerState {
    id?: string;
    x?: number;
    y?: number;
    velocityX?: number;
    velocityY?: number;
    health: number;
    flipX?: boolean;
    anim?: string;
    pastAnim?: string;
}
export default class Arena extends Phaser.Scene {
    private background!: Phaser.GameObjects.Sprite;
    private background_2!: Phaser.GameObjects.Sprite;
    private background_3!: Phaser.GameObjects.Sprite;
    private grass!: Phaser.GameObjects.Sprite;
    private platform!: Phaser.Physics.Arcade.Image;
    private player1HP!: Phaser.GameObjects.Text;
    private player1STA!: Phaser.GameObjects.Text;
    private p1infoContainer!: Phaser.GameObjects.Image;
    private p2infoContainer!: Phaser.GameObjects.Image;
    private uiTimer!: Phaser.GameObjects.Sprite;
    private matchTimerText!: Phaser.GameObjects.Text;
    private player1Name!: Phaser.GameObjects.Text;
    private player2Name!: Phaser.GameObjects.Text;
    
    // Health bars above player heads
    private player1HealthBar!: Phaser.GameObjects.Graphics;
    private player2HealthBar!: Phaser.GameObjects.Graphics;
    private player1HealthBarBg!: Phaser.GameObjects.Graphics;
    private player2HealthBarBg!: Phaser.GameObjects.Graphics;

    private KEYS!: any;
    private joystick!: any; // Virtual joystick for movement controls
    private sprintButtonPressed!: () => boolean; // Function to check sprint button state
    private isMobileDevice: boolean = false; // Track if we're on a mobile device
    /* START-USER-CODE */

    // Socket connection
    private socket: Socket = SOCKET;

    // Position update tracking for the server
    private lastPositionUpdate: number = 0;
    private positionUpdateInterval: number = 50; // ms between updates
    private lastAnimationUpdate: number = 0;
    private animationUpdateInterval: number = 100; // ms between animation updates (slower than position)
    private isTransitioning: boolean = false; // Track if scene is transitioning

    // Player state interfaces to match original implementation
    private MY_PLAYER: {
        sprite?: Phaser.Physics.Arcade.Sprite;
    } = {};

    private OTHER_PLAYER: {
        sprite?: Phaser.Physics.Arcade.Sprite;
        lastReceivedAnimation?: string;
        lastAnimationChangeTime?: number;
    } = {};

    private GAME_STATE: {
        player1: IPlayerState;
        player2: IPlayerState;
    } = {
        player1: {
            id: undefined,
            x: undefined,
            y: undefined,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            flipX: false,
            anim: "_Idle_Idle",
            pastAnim: undefined,
        },
        player2: {
            id: undefined,
            x: undefined,
            y: undefined,
            velocityX: 0,
            velocityY: 0,
            flipX: true,
            health: 100,
            anim: "_Idle_Idle",
            pastAnim: undefined,
        },
    };
    // private otherPlayer: {
    //     sprite?: Phaser.Physics.Arcade.Sprite;
    //     x?: number;
    //     y?: number;
    //     health?: number;
    //     flipX?: boolean;
    //     velocityX?: number;
    //     velocityY?: number;
    //     animationManager?: AnimationManager;
    // } = {};

    // Other players registry
    private otherPlayers: { [id: string]: Phaser.Physics.Arcade.Sprite } = {};

    // Scene manager for handling camera and UI/gameplay layer separation
    private sceneManager: SceneManager | null = null;

    // Manager instances
    private playerManager: PlayerManager | null = null;
    private uiManager: UIManager | null = null;
    private multiplayerManager: MultiplayerManager | null = null;

    // Match data from previous scene
    private matchData: {
        players?: {
            player1: { id: string; name: string };
            player2: { id: string; name: string };
        };
    } = {};

    // Add attack cooldown tracking
    private lastAttackTime: number = 0;
    private attackCooldown: number = 300; // 300ms cooldown between attacks

    // Map and music configuration
    private readonly mapConfigs = [
        {
            name: "forest",
            backgroundKey: "newMap",
            musicKey: "in-match"
        },
        {
            name: "Philippines",
            backgroundKey: "Philippines", 
            musicKey: "PH-BG"
        },
        {
            name: "Japan",
            backgroundKey: "Japan",
            musicKey: "JPN-BG"
        },
        {
            name: "France",
            backgroundKey: "France",
            musicKey: "FRN-BG"
        }
    ];
    private selectedMap: { name: string; backgroundKey: string; musicKey: string } | null = null;
    private currentBackgroundMusic: Phaser.Sound.BaseSound | null = null;

    // In the class definition, add these properties to track jumps
    private jumpCount: number = 0; // Tracks how many jumps have been performed since last touching ground
    private maxJumps: number = 2; // Maximum number of jumps allowed (1 = normal jump, 2 = double jump)

    constructor() {
        super("Arena");
    }

    editorCreate(): void {
        console.log("Starting editorCreate...");
        
        // NOTE: Map selection is now handled by server and received via playersConnected event
        // We'll use a default map initially and update it when we receive server data
        if (!this.selectedMap) {
            this.selectedMap = {
                name: "forest",
                backgroundKey: "newMap",
                musicKey: "in-match"
            };
            console.log("Using default map (will be updated by server):", this.selectedMap.name);
        } else {
            console.log("Using server-selected map:", this.selectedMap.name, "with music:", this.selectedMap.musicKey);
        }
        
        // Create background based on selected map
        if (this.selectedMap.name === "forest") {
            // Forest map uses spritesheet frames from newMap
            this.background = this.add.sprite(960, 544, this.selectedMap.backgroundKey, 0);
            this.background.setDepth(-4);
            console.log("Forest background created:", this.background);

            this.background_2 = this.add.sprite(960, 560, this.selectedMap.backgroundKey, 1);
            this.background_2.setDepth(-3);
            console.log("Forest background_2 created:", this.background_2);

            this.background_3 = this.add.sprite(960, 656, this.selectedMap.backgroundKey, 2);
            this.background_3.setDepth(-2);
            console.log("Forest background_3 created:", this.background_3);

            this.grass = this.add.sprite(960, 656, this.selectedMap.backgroundKey, 3);
            this.grass.setDepth(-1);
            console.log("Forest grass created:", this.grass);
        } else if (this.selectedMap.name === "Philippines") {
            // Philippines map uses a single background image
            this.background = this.add.sprite(960, 540, this.selectedMap.backgroundKey);
            this.background.setDisplaySize(1920, 1080); // Scale to fit screen
            this.background.setDepth(-4);
            console.log("Philippines background created:", this.background);
            
            // Create placeholder sprites for consistency (hidden)
            this.background_2 = this.add.sprite(0, 0, "").setVisible(false);
            this.background_3 = this.add.sprite(0, 0, "").setVisible(false);
            this.grass = this.add.sprite(0, 0, "").setVisible(false);
        } else if (this.selectedMap.name === "Japan") {
            // Japan map uses a single background image
            this.background = this.add.sprite(960, 540, this.selectedMap.backgroundKey);
            this.background.setDisplaySize(1920, 1080); // Scale to fit screen
            this.background.setDepth(-4);
            console.log("Japan background created:", this.background);
            
            // Create placeholder sprites for consistency (hidden)
            this.background_2 = this.add.sprite(0, 0, "").setVisible(false);
            this.background_3 = this.add.sprite(0, 0, "").setVisible(false);
            this.grass = this.add.sprite(0, 0, "").setVisible(false);
        } else if (this.selectedMap.name === "France") {
            // France map uses a single background image
            this.background = this.add.sprite(960, 540, this.selectedMap.backgroundKey);
            this.background.setDisplaySize(1920, 1080); // Scale to fit screen
            this.background.setDepth(-4);
            console.log("France background created:", this.background);
            
            // Create placeholder sprites for consistency (hidden)
            this.background_2 = this.add.sprite(0, 0, "").setVisible(false);
            this.background_3 = this.add.sprite(0, 0, "").setVisible(false);
            this.grass = this.add.sprite(0, 0, "").setVisible(false);
        }

        // platform
        const platform = this.physics.add.staticImage(48, 1088, "M_playerCard");
        platform.scaleX = 5;
        platform.alpha = 0.1;
        platform.alphaTopLeft = 0.1;
        platform.alphaTopRight = 0.1;
        platform.alphaBottomLeft = 0.1;
        platform.alphaBottomRight = 0.1;
        platform.body.pushable = false;
        platform.body.immovable = true;
        platform.body.setSize(830, 171, false);
        console.log("Platform created:", platform);

        // player1HP
        const player1HP = this.add.text(678, 708, "", {});
        player1HP.text = "(100/100 HP)";
        player1HP.setStyle({ fontSize: "24px", fontStyle: "bold italic" });
        player1HP.setDepth(10); // Ensure UI stays on top

        // player1STA
        const player1STA = this.add.text(672, 736, "", {});
        player1STA.text = "(100/100 STA)";
        player1STA.setStyle({ fontSize: "24px", fontStyle: "bold italic" });
        player1STA.setDepth(10); // Ensure UI stays on top

        // p1infoContainer
        const p1infoContainer = this.add.image(
            336,
            112,
            "PlayerStats_Container"
        );
        p1infoContainer.scaleX = 1.07;
        p1infoContainer.scaleY = 1.07;
        p1infoContainer.alpha = 0.8;
        p1infoContainer.alphaTopLeft = 0.8;
        p1infoContainer.alphaTopRight = 0.8;
        p1infoContainer.alphaBottomLeft = 0.8;
        p1infoContainer.alphaBottomRight = 0.8;
        p1infoContainer.setDepth(5); // Ensure UI stays on top

        // p2infoContainer
        const p2infoContainer = this.add.image(
            1584,
            112,
            "PlayerStats_Container"
        );
        p2infoContainer.scaleX = 1.07;
        p2infoContainer.scaleY = 1.07;
        p2infoContainer.flipX = true;
        p2infoContainer.alpha = 0.8;
        p2infoContainer.alphaTopLeft = 0.8;
        p2infoContainer.alphaTopRight = 0.8;
        p2infoContainer.alphaBottomLeft = 0.8;
        p2infoContainer.alphaBottomRight = 0.8;
        p2infoContainer.setDepth(5); // Ensure UI stays on top



        // uiTimer
        const uiTimer = this.add.sprite(
            1760,
            1008,
            "Timer_Container_Frames",
            0
        );
        uiTimer.scaleX = 0.8191303940245613;
        uiTimer.scaleY = 0.8191303940245613;
        uiTimer.setDepth(6); // Ensure UI stays on top
        uiTimer.play("matchTimerAnimTimer_Container_Frames");

        // matchTimerText
        const matchTimerText = this.add.text(1728, 986, "", {});
        matchTimerText.text = "XX:XX";
        matchTimerText.setStyle({
            align: "center",
            fontFamily: "Sans-serif",
            fontSize: "42px",
            fontStyle: "bold italic",
            "shadow.stroke": true,
        });
        matchTimerText.setDepth(7); // Ensure UI stays on top

        // player1Name
        const player1Name = this.add.text(200, 123, "", {});
        player1Name.scaleX = 0.7156265225589847;
        player1Name.scaleY = 0.7156265225589847;
        player1Name.text = "Player 1 Name";
        player1Name.setStyle({
            align: "center",
            color: "#580000ff",
            fontFamily: "Sans-serif",
            fontSize: "42px",
            fontStyle: "bold italic",
            "shadow.stroke": true,
        });
        player1Name.setDepth(6); // Ensure UI stays on top

        // player2Name
        const player2Name = this.add.text(1513, 123, "", {});
        player2Name.scaleX = 0.7156265225589847;
        player2Name.scaleY = 0.7156265225589847;
        player2Name.text = "Player 2 Name";
        player2Name.setStyle({
            align: "center",
            color: "#580000ff",
            fontFamily: "Sans-serif",
            fontSize: "42px",
            fontStyle: "bold italic",
            "shadow.stroke": true,
        });
        player2Name.setDepth(6); // Ensure UI stays on top

        // Create health bars above player heads (will be positioned when players are created)
        const player1HealthBarBg = this.add.graphics();
        player1HealthBarBg.setDepth(15); // Above everything
        
        const player1HealthBar = this.add.graphics();
        player1HealthBar.setDepth(16); // Above background
        
        const player2HealthBarBg = this.add.graphics();
        player2HealthBarBg.setDepth(15); // Above everything
        
        const player2HealthBar = this.add.graphics();
        player2HealthBar.setDepth(16); // Above background

        this.platform = platform;
        this.player1HP = player1HP;
        this.player1STA = player1STA;
        this.p1infoContainer = p1infoContainer;
        this.p2infoContainer = p2infoContainer;
        this.uiTimer = uiTimer;
        this.matchTimerText = matchTimerText;
        this.player1Name = player1Name;
        this.player2Name = player2Name;
        this.player1HealthBar = player1HealthBar;
        this.player2HealthBar = player2HealthBar;
        this.player1HealthBarBg = player1HealthBarBg;
        this.player2HealthBarBg = player2HealthBarBg;

        console.log("editorCreate completed successfully");
        console.log("All assets assigned to instance variables");
        
        // Debug: Log all UI elements to verify they are created
        console.log("UI Elements created:");
        console.log("- player1HP:", this.player1HP);
        console.log("- player1STA:", this.player1STA);
        console.log("- p1infoContainer:", this.p1infoContainer);
        console.log("- p2infoContainer:", this.p2infoContainer);
        console.log("- uiTimer:", this.uiTimer);
        console.log("- matchTimerText:", this.matchTimerText);
        console.log("- player1Name:", this.player1Name);
        console.log("- player2Name:", this.player2Name);
        console.log("- player1HealthBar:", this.player1HealthBar);
        console.log("- player2HealthBar:", this.player2HealthBar);
    }

    createPlayerSprite(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string = "_Idle_Idle",
        frame: number = 0
    ): Phaser.Physics.Arcade.Sprite {
        console.log(`Creating player sprite at (${x}, ${y}) with texture: ${texture}`);
        
        const sprite = scene.physics.add.sprite(x, y, texture, frame);
        
        if (!sprite) {
            console.error("Failed to create sprite");
            throw new Error("Failed to create sprite");
        }
        
        console.log("Sprite created successfully:", sprite);
        
        // Set interactive area without showing debug hitbox
        sprite.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: false,
            // Don't render debug visuals
            debug: false
        });
        
        sprite.scaleX = 5;
        sprite.scaleY = 5;
        sprite.setOrigin(0, 0);
        
        if (sprite.body) {
            sprite.body.gravity.y = 10000;
            sprite.body.setOffset(45, 40);
            sprite.body.setSize(30, 40, false);
            console.log("Sprite physics body configured");
        } else {
            console.error("Sprite body is null");
        }
        
        // Initialize attacking flag
        sprite.setData('isAttacking', false);
        
        // Set player sprite depth to appear above background but below UI
        sprite.setDepth(1);
        
        console.log("Player sprite created and configured successfully");
        return sprite;
    }

    private setupControls(): void {}

    /**
     * Create mobile-specific controls (joystick and touch buttons)
     */
    private createMobileControls(): void {
        console.log("Creating mobile controls...");
        
        // Initialize virtual joystick for movement controls
        this.joystick = (this.plugins.get('rexvirtualjoystickplugin') as any).add(this, {
            x: 200,
            y: this.cameras.main.height - 200,
            radius: 100,
            base: this.add.circle(0, 0, 100, 0x888888, 0.3),
            thumb: this.add.circle(0, 0, 40, 0xcccccc, 0.8),
            dir: '8dir',   // 8-directional movement
            enable: true
        });

        // Add attack button for mobile/touch controls
        const attackButton = this.add.circle(
            this.cameras.main.width - 150, 
            this.cameras.main.height - 150, 
            60, 
            0xff4444, 
            0.7
        );
        attackButton.setInteractive();
        attackButton.setScrollFactor(0);
        attackButton.setDepth(10);
        
        const attackText = this.add.text(
            this.cameras.main.width - 150, 
            this.cameras.main.height - 150, 
            'ATK', 
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        attackText.setOrigin(0.5);
        attackText.setScrollFactor(0);
        attackText.setDepth(11);
        
        attackButton.on('pointerdown', () => {
            this.performAttack();
        });

        // Add jump button
        const jumpButton = this.add.circle(
            this.cameras.main.width - 280, 
            this.cameras.main.height - 150, 
            50, 
            0x44ff44, 
            0.7
        );
        jumpButton.setInteractive();
        jumpButton.setScrollFactor(0);
        jumpButton.setDepth(10);
        
        const jumpText = this.add.text(
            this.cameras.main.width - 280, 
            this.cameras.main.height - 150, 
            'JUMP', 
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        jumpText.setOrigin(0.5);
        jumpText.setScrollFactor(0);
        jumpText.setDepth(11);
        
        jumpButton.on('pointerdown', () => {
            const onGround = this.MY_PLAYER.sprite?.body?.touching!.down! || 
                            this.MY_PLAYER.sprite?.body?.blocked!.down!;
            
            if (onGround) {
                this.MY_PLAYER.sprite?.setVelocityY(-2000)!;
                this.jumpCount = 1;
            } else if (!onGround && this.jumpCount < this.maxJumps) {
                this.MY_PLAYER.sprite?.setVelocityY(-2000)!;
                this.jumpCount++;
                
                if (this.MY_PLAYER.sprite) {
                    this.tweens.add({
                        targets: this.MY_PLAYER.sprite,
                        alpha: 0.7,
                        duration: 100,
                        yoyo: true,
                        repeat: 1
                    });
                }
            }
        });

        // Add sprint button
        const sprintButton = this.add.circle(
            this.cameras.main.width - 410, 
            this.cameras.main.height - 150, 
            45, 
            0xffaa00, 
            0.7
        );
        sprintButton.setInteractive();
        sprintButton.setScrollFactor(0);
        sprintButton.setDepth(10);
        
        const sprintText = this.add.text(
            this.cameras.main.width - 410, 
            this.cameras.main.height - 150, 
            'RUN', 
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        sprintText.setOrigin(0.5);
        sprintText.setScrollFactor(0);
        sprintText.setDepth(11);
        
        let isSprintPressed = false;
        sprintButton.on('pointerdown', () => {
            isSprintPressed = true;
        });
        
        this.input.on('pointerup', () => {
            isSprintPressed = false;
        });
        
        this.sprintButtonPressed = () => isSprintPressed;

        // Store references for cleanup
        this.joystick.attackButton = attackButton;
        this.joystick.attackText = attackText;
        this.joystick.jumpButton = jumpButton;
        this.joystick.jumpText = jumpText;
        this.joystick.sprintButton = sprintButton;
        this.joystick.sprintText = sprintText;
        
        console.log("Mobile controls created successfully");
    }

    /**
     * Setup PC-specific controls (mouse click to attack)
     */
    private setupPCControls(): void {
        console.log("Setting up PC controls...");
        
        // Create a placeholder joystick object for PC to prevent errors
        this.joystick = {
            left: false,
            right: false,
            up: false,
            down: false,
            force: 0,
            wasJumpPressed: false
        };
        
        // Create a placeholder sprint function for PC (always returns false since we use shift key)
        this.sprintButtonPressed = () => false;
        
        // Setup mouse click to attack for PC
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            this.performAttack();
        });
        
        console.log("PC controls setup completed");
    }

    create() {
        console.log("Arena scene starting - initializing...");
        
        // Initialize the scene content from the scene editor
        this.editorCreate();
        
        // Reset jump count on scene creation
        this.jumpCount = 0;
        
        // Ensure all UI elements are properly visible and layered
        this.ensureUIElementsVisible();

        // Disable physics debug rendering
        this.physics.world.drawDebug = false;
        this.physics.world.debugGraphic.clear();

        // Clear any existing socket listeners to prevent duplicates
        this.socket.off("gameStateUpdate");
        this.socket.off("matchEnded");
        this.socket.off("playerHit");
        this.socket.off("playerAttacked");
        this.socket.off("timerUpdate");
        this.socket.off("playersConnected");
        this.socket.off("newPlayer");
        this.socket.off("playerDisconnected");

        console.log("Emitting playerReady event");
        this.socket.emit("playerReady", {
            player1: PLAYER_1,
            player2: PLAYER_2,
        });

        this.createPlatforms();

        this.KEYS = this.input.keyboard?.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.SPACE,  // Space for jump
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,  // Shift for running
            attack: Phaser.Input.Keyboard.KeyCodes.X,  // X key for attack (alternative to mouse)
        })!;

        // Detect if we're on a mobile device using Phaser's device detection
        this.isMobileDevice = this.sys.game.device.os.android || 
                             this.sys.game.device.os.iOS || 
                             this.sys.game.device.os.iPad ||
                             this.sys.game.device.os.iPhone ||
                             this.sys.game.device.input.touch;
        
        console.log("Device detection - isMobile:", this.isMobileDevice);

        // Only create mobile controls if on mobile device
        if (this.isMobileDevice) {
            this.createMobileControls();
        }

        // Setup PC controls only if not on mobile
        if (!this.isMobileDevice) {
            this.setupPCControls();
        }

        console.log("Setting up socket event listeners");

        // Add debug listeners for all socket events
        this.socket.on("matchFound", (data) => {
            console.log("matchFound event received:", data);
        });

        this.socket.on("yourPlayerId", (playerId) => {
            console.log("yourPlayerId event received:", playerId);
        });

        this.socket.on("gameStateUpdate", (data) => {
            
            // Update player 1 state
            if (data.player1) {
                this.GAME_STATE.player1.x = data.player1.x;
                this.GAME_STATE.player1.y = data.player1.y;
                this.GAME_STATE.player1.velocityY = data.player1.velocityY;
                this.GAME_STATE.player1.velocityX = data.player1.velocityX;
                this.GAME_STATE.player1.flipX = data.player1.flipX;
                this.GAME_STATE.player1.health = data.player1.health || 100;
                this.GAME_STATE.player1.anim = data.player1.animation || "_Idle_Idle";
            }

            // Update player 2 state
            if (data.player2) {
                this.GAME_STATE.player2.x = data.player2.x;
                this.GAME_STATE.player2.y = data.player2.y;
                this.GAME_STATE.player2.velocityY = data.player2.velocityY;
                this.GAME_STATE.player2.velocityX = data.player2.velocityX;
                this.GAME_STATE.player2.flipX = data.player2.flipX;
                this.GAME_STATE.player2.health = data.player2.health || 100;
                this.GAME_STATE.player2.anim = data.player2.animation || "_Idle_Idle";
            }

            // Update the actual sprites with the latest state
            if (this.MY_PLAYER.sprite && this.OTHER_PLAYER.sprite) {
                if (this.socket.id === this.GAME_STATE.player1.id) {
                    // I am player 1, so update other player (player 2) sprite
                    if (this.GAME_STATE.player2.x !== undefined) {
                        this.OTHER_PLAYER.sprite.x = this.GAME_STATE.player2.x;
                    }
                    if (this.GAME_STATE.player2.y !== undefined) {
                        this.OTHER_PLAYER.sprite.y = this.GAME_STATE.player2.y;
                    }
                    if (this.GAME_STATE.player2.flipX !== undefined) {
                        this.OTHER_PLAYER.sprite.setFlipX(this.GAME_STATE.player2.flipX);
                    }
                    // Play animation only if it's different and not an attack animation
                    if (this.GAME_STATE.player2.anim && this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active && this.OTHER_PLAYER.sprite.anims) {
                        const currentAnim = this.OTHER_PLAYER.sprite.anims.currentAnim?.key || "";
                        const isCurrentlyAttacking = this.OTHER_PLAYER.sprite.getData('isAttacking') || false;
                        const newAnimIsAttack = this.GAME_STATE.player2.anim.includes("Attack");
                        const currentTime = this.time.now;
                        
                        // Prevent rapid animation switching by adding a minimum time between changes
                        const timeSinceLastChange = currentTime - (this.OTHER_PLAYER.lastAnimationChangeTime || 0);
                        const minimumAnimationTime = 150; // Minimum time between animation changes
                        
                        // Only change animation if it's different, not interrupting an attack, not an attack animation, and enough time has passed
                        // Attack animations should ONLY be handled by the playerAttacked event, not here
                        if (currentAnim !== this.GAME_STATE.player2.anim && 
                            !isCurrentlyAttacking &&
                            !newAnimIsAttack &&
                            timeSinceLastChange > minimumAnimationTime) {
                            
                            const targetAnim = this.GAME_STATE.player2.anim;
                            if (targetAnim && this.isSpriteAnimationSafe(this.OTHER_PLAYER.sprite)) {
                                try {
                                    this.OTHER_PLAYER.sprite.play(targetAnim, true);
                                    this.OTHER_PLAYER.lastAnimationChangeTime = currentTime;
                                    this.OTHER_PLAYER.lastReceivedAnimation = targetAnim;
                                } catch (error) {
                                    console.warn("Error playing animation:", error);
                                }
                            }
                        }
                    }
                } else if (this.socket.id === this.GAME_STATE.player2.id) {
                    // I am player 2, so update other player (player 1) sprite
                    if (this.GAME_STATE.player1.x !== undefined) {
                        this.OTHER_PLAYER.sprite.x = this.GAME_STATE.player1.x;
                    }
                    if (this.GAME_STATE.player1.y !== undefined) {
                        this.OTHER_PLAYER.sprite.y = this.GAME_STATE.player1.y;
                    }
                    if (this.GAME_STATE.player1.flipX !== undefined) {
                        this.OTHER_PLAYER.sprite.setFlipX(this.GAME_STATE.player1.flipX);
                    }
                    // Play animation only if it's different and not an attack animation
                    if (this.GAME_STATE.player1.anim && this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active && this.OTHER_PLAYER.sprite.anims) {
                        const currentAnim = this.OTHER_PLAYER.sprite.anims.currentAnim?.key || "";
                        const isCurrentlyAttacking = this.OTHER_PLAYER.sprite.getData('isAttacking') || false;
                        const newAnimIsAttack = this.GAME_STATE.player1.anim.includes("Attack");
                        const currentTime = this.time.now;
                        
                        // Prevent rapid animation switching by adding a minimum time between changes
                        const timeSinceLastChange = currentTime - (this.OTHER_PLAYER.lastAnimationChangeTime || 0);
                        const minimumAnimationTime = 150; // Minimum time between animation changes
                        
                        // Only change animation if it's different, not interrupting an attack, not an attack animation, and enough time has passed
                        // Attack animations should ONLY be handled by the playerAttacked event, not here
                        if (currentAnim !== this.GAME_STATE.player1.anim && 
                            !isCurrentlyAttacking &&
                            !newAnimIsAttack &&
                            timeSinceLastChange > minimumAnimationTime) {
                            
                            const targetAnim = this.GAME_STATE.player1.anim;
                            if (targetAnim && this.isSpriteAnimationSafe(this.OTHER_PLAYER.sprite)) {
                                try {
                                    this.OTHER_PLAYER.sprite.play(targetAnim, true);
                                    this.OTHER_PLAYER.lastAnimationChangeTime = currentTime;
                                    this.OTHER_PLAYER.lastReceivedAnimation = targetAnim;
                                } catch (error) {
                                    console.warn("Error playing animation:", error);
                                }
                            }
                        }
                    }
                }
            }
        });

        this.socket.on("matchEnded", (data) => {
            if (this.isTransitioning) {
                console.log("Already transitioning, ignoring matchEnded");
                return;
            }
            
            this.isTransitioning = true;
            console.log(`Match ended:`, data);
            
            // Stop background music immediately when match ends
            if (this.currentBackgroundMusic) {
                this.currentBackgroundMusic.stop();
                this.currentBackgroundMusic = null;
            }
            if (this.selectedMap) {
                this.sound.stopByKey(this.selectedMap.musicKey);
            }
            
            // Play game over sound
            try {
                this.sound.play("game-over", { volume: 0.7 });
            } catch (error) {
                console.warn("Error playing game over sound:", error);
            }
            
            // Show immediate feedback based on reason
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
            
            // Make sure the end text is only shown in UI camera to prevent duplication
            if (this.sceneManager) {
                this.sceneManager.addToUIElements(endText);
            }
            
            // Show final health scores if available
            if (data.finalHealth) {
                const healthText = this.add.text(
                    this.cameras.main.width / 2,
                    this.cameras.main.height / 2 + 50,
                    `Final Health: Player 1: ${data.finalHealth.player1}  Player 2: ${data.finalHealth.player2}`,
                    {
                        fontFamily: "Arial",
                        fontSize: "32px",
                        color: "#ffffff",
                        stroke: "#000000",
                        strokeThickness: 4,
                    }
                );
                healthText.setOrigin(0.5);
                healthText.setScrollFactor(0);
                
                // Add to UI elements to prevent duplication
                if (this.sceneManager) {
                    this.sceneManager.addToUIElements(healthText);
                }
            }
            
            // Flash the screen with different colors based on reason
            if (data.reason === "knockout") {
                this.cameras.main.flash(500, 255, 136, 0); // Orange flash for knockout
            } else {
                this.cameras.main.flash(500, 255, 255, 255); // White flash for timeout
            }
            
            // Handle the result
            if (data.winner && data.loser) {
                if (this.socket.id == data.winner) {
                    // Show winner text
                    const winnerText = this.add.text(
                        this.cameras.main.width / 2,
                        this.cameras.main.height / 2 + 100,
                        data.reason === "knockout" ? "VICTORY BY KNOCKOUT!" : "YOU WIN!",
                        {
                            fontFamily: "Arial",
                            fontSize: "48px",
                            color: "#00ff00",
                            stroke: "#000000",
                            strokeThickness: 4,
                        }
                    );
                    winnerText.setOrigin(0.5);
                    winnerText.setScrollFactor(0);
                    
                    // Add to UI elements to prevent duplication
                    if (this.sceneManager) {
                        this.sceneManager.addToUIElements(winnerText);
                    }
                    
                    this.time.delayedCall(3 * 1000, () => {
                        // Ensure music is stopped before transition
                        if (this.currentBackgroundMusic) {
                            this.currentBackgroundMusic.stop();
                            this.currentBackgroundMusic = null;
                        }
                        if (this.selectedMap) {
                            this.sound.stopByKey(this.selectedMap.musicKey);
                        }
                        this.cameras.main.fadeOut(400, 0, 0, 0);
                        this.cameras.main.once("camerafadeoutcomplete", () => {
                            this.scene.stop("Arena");
                            this.scene.start("Victory");
                        });
                    });
                } else if (this.socket.id == data.loser) {
                    // Show loser text
                    const loserText = this.add.text(
                        this.cameras.main.width / 2,
                        this.cameras.main.height / 2 + 100,
                        data.reason === "knockout" ? "DEFEATED!" : "YOU LOSE!",
                        {
                            fontFamily: "Arial",
                            fontSize: "48px",
                            color: "#ff0000",
                            stroke: "#000000",
                            strokeThickness: 4,
                        }
                    );
                    loserText.setOrigin(0.5);
                    loserText.setScrollFactor(0);
                    
                    // Add to UI elements to prevent duplication
                    if (this.sceneManager) {
                        this.sceneManager.addToUIElements(loserText);
                    }
                    
                    this.time.delayedCall(3 * 1000, () => {
                        // Ensure music is stopped before transition
                        if (this.currentBackgroundMusic) {
                            this.currentBackgroundMusic.stop();
                            this.currentBackgroundMusic = null;
                        }
                        if (this.selectedMap) {
                            this.sound.stopByKey(this.selectedMap.musicKey);
                        }
                        this.cameras.main.fadeOut(400, 0, 0, 0);
                        this.cameras.main.once("camerafadeoutcomplete", () => {
                            this.scene.stop("Arena");
                            this.scene.start("Defeat");
                        });
                    });
                }
            } else {
                // It's a tie (only possible with timeout)
                endText.setText("TIE GAME!");
                endText.setColor("#ffff00");
                
                const tieText = this.add.text(
                    this.cameras.main.width / 2,
                    this.cameras.main.height / 2 + 100,
                    "DRAW!",
                    {
                        fontFamily: "Arial",
                        fontSize: "48px",
                        color: "#ffff00",
                        stroke: "#000000",
                        strokeThickness: 4,
                    }
                );
                tieText.setOrigin(0.5);
                tieText.setScrollFactor(0);
                
                // Add to UI elements to prevent duplication
                if (this.sceneManager) {
                    this.sceneManager.addToUIElements(tieText);
                }
                
                this.time.delayedCall(3 * 1000, () => {
                    // Ensure music is stopped before transition
                    if (this.currentBackgroundMusic) {
                        this.currentBackgroundMusic.stop();
                        this.currentBackgroundMusic = null;
                    }
                    if (this.selectedMap) {
                        this.sound.stopByKey(this.selectedMap.musicKey);
                    }
                    this.cameras.main.fadeOut(400, 0, 0, 0);
                    this.cameras.main.once("camerafadeoutcomplete", () => {
                        this.scene.stop("Arena");
                        this.scene.start("GameMenu"); // Go back to game menu for ties
                    });
                });
            }
        });

        this.socket.on("playerHit", (data) => {
            // Play hit sound when any player is hit
            try {
                this.sound.play("player-hit", { volume: 0.6 });
            } catch (error) {
                console.warn("Error playing player hit sound:", error);
            }

            if (data.id == this.GAME_STATE.player1.id) {
                this.GAME_STATE.player1.health = data.health;
                
                // Update health display if this is the local player
                if (this.socket.id === this.GAME_STATE.player1.id) {
                    this.player1HP.setText(`(${data.health}/100 HP)`);
                    
                    // Add hit effect
                    this.cameras.main.flash(100, 255, 0, 0, false);
                    this.cameras.main.shake(200, 0.01);
                }
            }
            if (data.id == this.GAME_STATE.player2.id) {
                this.GAME_STATE.player2.health = data.health;
                
                // Update health display if this is the local player (Note: player1HP shows current player's health)
                if (this.socket.id === this.GAME_STATE.player2.id) {
                    this.player1HP.setText(`(${data.health}/100 HP)`);
                    
                    // Add hit effect
                    this.cameras.main.flash(100, 255, 0, 0, false);
                    this.cameras.main.shake(200, 0.01);
                }
            }
            
            // Update health bars above player heads whenever any player's health changes
            this.updatePlayerHealthBars();
        });

        this.socket.on("playerAttacked", (data) => {
            // Play attack sound for any player attack
            try {
                this.sound.play("Attack", { volume: 0.5 });
            } catch (error) {
                console.warn("Error playing attack sound:", error);
            }

            // Only show attack animation for OTHER players, not for the current player
            if (data.id === this.GAME_STATE.player1.id && this.socket.id !== data.id) {
                // Other player (player 1) is attacking, show their attack animation
                if (this.isSpriteAnimationSafe(this.OTHER_PLAYER.sprite) && 
                    !this.OTHER_PLAYER.sprite!.getData('isAttacking')) {
                    try {
                        // Stop any current animation before playing attack
                        if (this.OTHER_PLAYER.sprite!.anims.currentAnim) {
                            this.OTHER_PLAYER.sprite!.anims.stop();
                        }
                        
                        this.OTHER_PLAYER.sprite!.play({
                            key: "_Attack2",
                            frameRate: 8,  // Faster attack animation
                            repeat: 0,
                        });
                        // Set a flag to prevent movement animations from overriding attack
                        this.OTHER_PLAYER.sprite!.setData('isAttacking', true);
                        
                        // Clear any existing animation complete listeners to prevent conflicts
                        this.OTHER_PLAYER.sprite!.off('animationcomplete');
                        
                        // Clear the flag after animation completes
                        this.OTHER_PLAYER.sprite!.once('animationcomplete', () => {
                            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active) {
                                this.OTHER_PLAYER.sprite.setData('isAttacking', false);
                            }
                        });
                        
                        // Fallback timeout to clear attacking flag if animation doesn't complete
                        this.time.delayedCall(500, () => {
                            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active) {
                                this.OTHER_PLAYER.sprite.setData('isAttacking', false);
                            }
                        });
                    } catch (error) {
                        console.warn("Error playing attack animation:", error);
                    }
                }
            } else if (data.id === this.GAME_STATE.player2.id && this.socket.id !== data.id) {
                // Other player (player 2) is attacking, show their attack animation
                if (this.isSpriteAnimationSafe(this.OTHER_PLAYER.sprite) && 
                    !this.OTHER_PLAYER.sprite!.getData('isAttacking')) {
                    try {
                        // Stop any current animation before playing attack
                        if (this.OTHER_PLAYER.sprite!.anims.currentAnim) {
                            this.OTHER_PLAYER.sprite!.anims.stop();
                        }
                        
                        this.OTHER_PLAYER.sprite!.play({
                            key: "_Attack2",
                            frameRate: 8,  // Faster attack animation
                            repeat: 0,
                        });
                        // Set a flag to prevent movement animations from overriding attack
                        this.OTHER_PLAYER.sprite!.setData('isAttacking', true);
                        
                        // Clear any existing animation complete listeners to prevent conflicts
                        this.OTHER_PLAYER.sprite!.off('animationcomplete');
                        
                        // Clear the flag after animation completes
                        this.OTHER_PLAYER.sprite!.once('animationcomplete', () => {
                            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active) {
                                this.OTHER_PLAYER.sprite.setData('isAttacking', false);
                            }
                        });
                        
                        // Fallback timeout to clear attacking flag if animation doesn't complete
                        this.time.delayedCall(500, () => {
                            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active) {
                                this.OTHER_PLAYER.sprite.setData('isAttacking', false);
                            }
                        });
                    } catch (error) {
                        console.warn("Error playing attack animation:", error);
                    }
                }
            }
            // Note: We don't play attack animation for the current player here
            // because it's already handled in performAttack() method
        });

        this.socket.on("timerUpdate", (data) => {
            // Update the timer display
            if (this.matchTimerText) {
                this.matchTimerText.text = data.formattedTime || "XX:XX";
            }
        });

        // Prevent context menu on right click
        this.game.canvas.addEventListener('contextmenu', this.contextMenuHandler);

        this.socket.on("playersConnected", (data) => {
            console.log("Players connected event received", data);
            
            // Set the map from server data
            if (data.selectedMap) {
                this.selectedMap = data.selectedMap;
                if (this.selectedMap) {
                    console.log("Map selected by server:", this.selectedMap.name, "with music:", this.selectedMap.musicKey);
                    
                    // Recreate the background with the server-selected map
                    this.recreateBackground();
                    
                    // Start the correct background music
                    this.startBackgroundMusic();
                }
            }
            
            this.GAME_STATE.player1 = {
                id: data.player1.id,
                x: data.player1.x,
                y: data.player1.y,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                flipX: false,
                anim: "_Idle_Idle",
                pastAnim: undefined,
            };

            this.GAME_STATE.player2 = {
                id: data.player2.id,
                x: data.player2.x,
                y: data.player2.y,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                flipX: true,
                anim: "_Idle_Idle",
                pastAnim: undefined,
            };
            
            // Update player names if available
            if (data.player1.name && this.player1Name) {
                this.player1Name.setText(data.player1.name);
                console.log("Updated player1 name to:", data.player1.name);
            }
            if (data.player2.name && this.player2Name) {
                this.player2Name.setText(data.player2.name);
                console.log("Updated player2 name to:", data.player2.name);
            }

            console.log("Creating sprites for players...");
            
            if (this.socket.id == data.player1.id) {
                console.log("I am player 1 - creating sprites");
                this.MY_PLAYER.sprite = this.createPlayerSprite(
                    this,
                    data.player1.x,
                    data.player1.y
                );

                this.OTHER_PLAYER.sprite = this.createPlayerSprite(
                    this,
                    data.player2.x,
                    data.player2.y
                );

                if (this.OTHER_PLAYER.sprite) {
                    this.OTHER_PLAYER.sprite.setFlipX(true);
                    console.log("Set player 2 sprite to flipX true");
                }
                if (this.MY_PLAYER.sprite) {
                    this.MY_PLAYER.sprite.setFlipX(false);
                    console.log("Set player 1 sprite to flipX false");
                }
            } else if (this.socket.id == data.player2.id) {
                console.log("I am player 2 - creating sprites");
                this.MY_PLAYER.sprite = this.createPlayerSprite(
                    this,
                    data.player2.x,
                    data.player2.y
                );

                this.OTHER_PLAYER.sprite = this.createPlayerSprite(
                    this,
                    data.player1.x,
                    data.player1.y
                );
                if (this.MY_PLAYER.sprite) {
                    this.MY_PLAYER.sprite.setFlipX(true);
                    console.log("Set player 2 sprite to flipX true");
                }
                if (this.OTHER_PLAYER.sprite) {
                    this.OTHER_PLAYER.sprite.setFlipX(false);
                    console.log("Set player 1 sprite to flipX false");
                }
            }

            console.log("Configuring player sprites...");
            if (this.MY_PLAYER.sprite) {
                this.configurePlayerSprite(this.MY_PLAYER.sprite);
                console.log("Configured MY_PLAYER sprite");
            } else {
                console.error("MY_PLAYER sprite is null after creation");
            }
            
            if (this.OTHER_PLAYER.sprite) {
                this.configurePlayerSprite(this.OTHER_PLAYER.sprite);
                console.log("Configured OTHER_PLAYER sprite");
            } else {
                console.error("OTHER_PLAYER sprite is null after creation");
            }

            if (this.platform) {
                if (this.MY_PLAYER.sprite) {
                    this.addPlatformCollider(this.MY_PLAYER.sprite);
                    console.log("Added platform collider to MY_PLAYER");
                }
                if (this.OTHER_PLAYER.sprite) {
                    this.addPlatformCollider(this.OTHER_PLAYER.sprite);
                    console.log("Added platform collider to OTHER_PLAYER");
                }
            }

            console.log("Sprites created and configured successfully");
            this.debugGameAssets();
            
            // Initialize the camera and manager systems
            this.initializeManagers();
            
            // Initialize the player manager with the local player sprite
            if (this.playerManager) {
                this.playerManager.initialize(
                    this.MY_PLAYER.sprite!.x,
                    this.MY_PLAYER.sprite!.y,
                    this.player1HP,
                    this.player1STA,
                    this.MY_PLAYER.sprite // Pass the existing sprite to the manager
                );
            }

            // Initialize multiplayer manager
            this.multiplayerManager = new MultiplayerManager(
                this,
                this.socket,
                this.MY_PLAYER.sprite!,
                {
                    positionUpdateInterval: 50,
                    platform: this.platform,
                }
            );

            // Connect the multiplayer manager with scene manager
            if (this.multiplayerManager && this.sceneManager) {
                this.multiplayerManager.setSceneManager(this.sceneManager);
            }

            // Set up camera to follow player
            this.setupCameraFollow();
            
            // Start the entrance animation once both players are connected
            this.createEntranceAnimation();
        });

        // Background music will be started when we receive server data with selected map
        // Set up shutdown event listener to stop music when scene closes
        this.events.on("shutdown", this.onShutdown, this);
    }

    /**
     * Configure a player sprite with standard physics settings
     */
    private configurePlayerSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (!sprite) {
            console.error("Cannot configure null sprite");
            return;
        }
        
        console.log("Configuring player sprite:", sprite);
        
        // Set interactive area without showing debug hitbox
        sprite.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: false,
            // Don't render debug visuals
            debug: false
        });
        
        sprite.scaleX = 3;
        sprite.scaleY = 3;
        sprite.setOrigin(0, 0);

        if (sprite.body) {
            sprite.body.gravity.y = 10000;
            sprite.body.setOffset(45, 40);
            sprite.body.setSize(30, 40, false);
            // Ensure body debug is off
            if ('debugShowBody' in sprite.body) {
                (sprite.body as any).debugShowBody = false;
            }
            console.log("Sprite physics body configured");
        } else {
            console.error("Sprite body is null in configurePlayerSprite");
        }

        // Important for attack animations: disable automatic animation complete callbacks
        // that would force a return to idle - we'll handle this specifically for attacks
        sprite.setData("autoPlayIdleOnComplete", false);

        // Play initial animation
        if (sprite && sprite.anims && sprite.texture) {
            try {
                sprite.anims.play("_Idle_Idle", true);
                console.log("Initial animation played successfully");
            } catch (error) {
                console.error("Error playing initial animation:", error);
            }
        } else {
            console.error("Sprite, sprite.anims, or sprite.texture is null in configurePlayerSprite");
        }
    }

    /**
     * Check if a sprite is safe to animate (has valid texture and animations)
     */
    private isSpriteAnimationSafe(sprite: Phaser.Physics.Arcade.Sprite | undefined): boolean {
        return !!(sprite && 
                 sprite.active && 
                 sprite.texture && 
                 sprite.anims);
    }

    /**
     * List all available animations for debugging
     */
    private listAnimations(): void {
        console.log("=== AVAILABLE ANIMATIONS ===");
        const animKeys = Object.keys((this.anims as any).anims.entries);
        animKeys.forEach((key) => console.log(`Animation: ${key}`));
        console.log("===========================");
    }

    /**
     * Log animation durations for debugging
     */
    private debugAnimationDurations(): void {
        console.log("=== ANIMATION DURATIONS ===");
        // @ts-ignore
        const animKeys = Object.keys(this.anims.anims.entries);
        animKeys.forEach((key) => {
            const anim = this.anims.get(key);
            if (anim) {
                // Calculate duration based on frameRate and frames
                const frameDuration = 1000 / (anim.frameRate || 24);
                const totalDuration = frameDuration * anim.frames.length;
                console.log(
                    `Animation ${key}: ${totalDuration.toFixed(2)}ms (${
                        anim.frames.length
                    } frames @ ${anim.frameRate || 24}fps)`
                );
            }
        });
        console.log("==========================");
    }

    /**
     * Initialize camera and manager systems
     */
    private initializeManagers(): void {
        // Create the scene manager for camera handling
        this.sceneManager = new SceneManager(
            this,
            this.background,
            [], // Empty array for now, since we don't have TileSprite objects
            {
                bestZoom: 1.5,
                parallaxFactor: 0.4,
            }
        );

        // Create the player manager but disable its attack handlers
        // since we handle attacks directly in the Arena scene
        this.playerManager = new PlayerManager(this, this.socket, {
            walkSpeed: 200,
            runSpeed: 400,
            jumpSpeed: -2000,
            crouchSpeed: 150,
            disableAttackHandlers: true // Prevent duplicate attack handling
        });

        // Create the UI manager
        this.uiManager = new UIManager(this, {
            p1infoContainer: this.p1infoContainer,
            p2infoContainer: this.p2infoContainer,
            player1Name: this.player1Name,
            player2Name: this.player2Name,
            uiTimer: this.uiTimer,
            matchTimerText: this.matchTimerText,
            uiSkillContainer: null as any, // Removed skill container
            uiSkillONE: null as any, // Removed skill icon
            uiSkillTWO: null as any, // Removed skill icon
            uiSkillTHREE: null as any, // Removed skill icon
        });

        // Configure camera ignore lists - collect ALL UI elements
        const uiElements = [
            this.p1infoContainer,
            this.p2infoContainer,
            this.player1Name,
            this.player2Name,
            this.uiTimer,
            this.matchTimerText,
            this.player1HealthBar,
            this.player2HealthBar,
            this.player1HealthBarBg,
            this.player2HealthBarBg,
            // Only include mobile controls if on mobile device
            ...(this.isMobileDevice ? [
                this.joystick,
                this.joystick?.attackButton,
                this.joystick?.attackText,
                this.joystick?.jumpButton,
                this.joystick?.jumpText,
                this.joystick?.sprintButton,
                this.joystick?.sprintText,
            ] : []),
            ...this.uiManager.getUIElements(), // Get any additional UI elements from the manager
        ].filter(Boolean); // Filter out any undefined elements

        // Make main camera ignore ALL UI elements
        this.sceneManager.setMainIgnoreUI(uiElements);

        // Create array of gameplay elements to be ignored by UI camera
        const gameplayElements = [
            this.background,
            this.platform,
            this.background_2,
            this.background_3,
            this.grass,
        ].filter((elem) => elem !== undefined);

        // Add player sprites to gameplay elements when they're created
        if (this.MY_PLAYER.sprite) {
            gameplayElements.push(this.MY_PLAYER.sprite);
        }
        if (this.OTHER_PLAYER.sprite) {
            gameplayElements.push(this.OTHER_PLAYER.sprite);
        }

        // Add all other player sprites that exist
        Object.values(this.otherPlayers).forEach((sprite) => {
            if (sprite) gameplayElements.push(sprite);
        });

        // Make UI camera ignore ALL gameplay elements
        this.sceneManager.setUIIgnoreGameplay(gameplayElements);
    }

    /**
     * Set up camera to follow player
     */
    private setupCameraFollow(): void {
        if (this.sceneManager && this.MY_PLAYER.sprite) {
            // Set up camera to follow player with deadzone for smoother transitions
            // This creates a rectangular area where player can move without camera following
            // Only when player gets near the edge of this deadzone does the camera follow
            const deadZoneWidth = 200;  // Width of deadzone rectangle
            const deadZoneHeight = 150; // Height of deadzone rectangle
            
            this.sceneManager.setupCameraFollow(this.MY_PLAYER.sprite, {
                deadzone: new Phaser.Geom.Rectangle(
                    (this.cameras.main.width - deadZoneWidth) / 2,
                    (this.cameras.main.height - deadZoneHeight) / 2,
                    deadZoneWidth,
                    deadZoneHeight
                ),
                lerpX: 0.2, // Smooth horizontal camera movement (0.1 = very smooth, 1 = instant)
                lerpY: 0.2  // Smooth vertical camera movement
            });
        }
    }

    /**
     * Update camera zoom based on player speed
     */
    private updateCameraZoom(): void {
        if (this.sceneManager && this.MY_PLAYER.sprite && this.playerManager) {
            const speed = this.playerManager.getSpeed();
            const runSpeedThreshold = this.playerManager.getRunSpeedThreshold();
            this.sceneManager.updateCameraZoom(speed, runSpeedThreshold);
        }
    }

    /**
     * Update method called each frame
     */
    update(time: number, delta: number): void {
        // Early exit if scene is being destroyed or key resources are missing
        if (this.isTransitioning || 
            !this.scene || 
            !this.scene.isActive("Arena") || 
            !this.KEYS?.left || 
            !this.MY_PLAYER.sprite || 
            !this.MY_PLAYER.sprite.active || 
            !this.MY_PLAYER.sprite.body) {
            return;
        }

        // Update player manager if it exists (but disable its attack handling)
        // We'll handle attacks directly since we need custom multiplayer logic
        // Commenting out PlayerManager update to prevent animation conflicts
        // if (this.playerManager) {
        //     this.playerManager.update(time, delta);
        // }

        // Update multiplayer manager
        if (this.multiplayerManager) {
            this.multiplayerManager.update(time, delta);
        }

        // Update camera zoom based on player speed
        this.updateCameraZoom();

        if (this.GAME_STATE.player1.id == this.socket.id) {
            // if (this.GAME_STATE.player1.anim == "_Attack2") {
            //     this.MY_PLAYER.sprite?.play({
            //         key: "_Attack2",
            //         frameRate: 10,
            //         repeat: 0,
            //     });
            //     this.MY_PLAYER.sprite?.off("animationcomplete");
            //     this.MY_PLAYER.sprite?.once("animationcomplete", () => {
            //         this.GAME_STATE.player1.anim = "_Idle_Idle";
            //     });
            // }

            if (
                this.GAME_STATE.player1.x != this.MY_PLAYER.sprite.body?.x ||
                this.GAME_STATE.player1.y != this.MY_PLAYER.sprite.body?.y ||
                this.GAME_STATE.player1.flipX != this.MY_PLAYER.sprite.flipX
            ) {
                this.socket.emit("playerMoved", {
                    x: this.MY_PLAYER.sprite.x,
                    y: this.MY_PLAYER.sprite.y,
                    velocityX: this.MY_PLAYER.sprite.body?.velocity.x,
                    velocityY: this.MY_PLAYER.sprite.body?.velocity.y,
                    flipX: this.MY_PLAYER.sprite.flipX,
                });
            }
        }

        if (this.GAME_STATE.player2.id == this.socket.id) {
            // if (this.GAME_STATE.player2.anim == "_Attack2") {
            //     this.MY_PLAYER.sprite?.play({
            //         key: "_Attack2",
            //         frameRate: 10,
            //         repeat: 0,
            //     });

            //     this.MY_PLAYER.sprite?.off("animationcomplete");
            //     this.MY_PLAYER.sprite?.once("animationcomplete", () => {
            //         this.GAME_STATE.player2.anim = "_Idle_Idle";
            //     });
            // }
            if (
                this.GAME_STATE.player2.x != this.MY_PLAYER.sprite.x ||
                this.GAME_STATE.player2.y != this.MY_PLAYER.sprite.y ||
                this.GAME_STATE.player2.flipX != this.MY_PLAYER.sprite.flipX
            ) {
                this.socket.emit("playerMoved", {
                    x: this.MY_PLAYER.sprite.x,
                    y: this.MY_PLAYER.sprite.y,
                    velocityX: this.MY_PLAYER.sprite.body?.velocity.x,
                    velocityY: this.MY_PLAYER.sprite.body?.velocity.y,
                    flipX: this.MY_PLAYER.sprite.flipX,
                });
            }
        }

        const onGround =
            this.MY_PLAYER.sprite?.body?.touching!.down! ||
            this.MY_PLAYER.sprite?.body?.blocked!.down!;

        // Handle keyboard attack (X key) - works both on ground and in air!
        if (Phaser.Input.Keyboard.JustDown(this.KEYS.attack!)) {
            this.performAttack();
        }

        // Movement with running support (keyboard + joystick + mobile sprint button)
        const isRunning = this.KEYS.shift?.isDown || (this.sprintButtonPressed && this.sprintButtonPressed()) || false;
        const baseSpeed = 200;
        const runSpeed = 350; // Faster when running
        let currentAnimation = "_Idle_Idle"; // Default animation
        
        // Get joystick input with sensitivity adjustments (only if on mobile)
        const joystickLeft = this.isMobileDevice ? this.joystick.left : false;
        const joystickRight = this.isMobileDevice ? this.joystick.right : false;
        const joystickUp = this.isMobileDevice ? this.joystick.up : false;
        const joystickDown = this.isMobileDevice ? this.joystick.down : false;
        const joystickForce = this.isMobileDevice ? this.joystick.force : 0; // Force magnitude (0-1)
        
        // Joystick sensitivity settings
        const minForceThreshold = 0.15; // Minimum force needed to register movement (deadzone)
        const jumpForceThreshold = 0.75; // Force needed to trigger jump
        const maxSpeedMultiplier = 0.7; // Maximum speed multiplier for joystick (reduces max speed)
        
        // Apply deadzone and scale force for more controlled movement
        const adjustedForce = joystickForce > minForceThreshold ? 
            Math.min((joystickForce - minForceThreshold) / (1 - minForceThreshold) * maxSpeedMultiplier, maxSpeedMultiplier) : 0;
        
        // Track joystick jump state to prevent continuous jumping (mobile only)
        const joystickJumpPressed = this.isMobileDevice && joystickUp && joystickForce > jumpForceThreshold;
        if (this.isMobileDevice && !this.joystick.wasJumpPressed) {
            this.joystick.wasJumpPressed = false;
        }
        
        // Check if player is in air (not on ground)
        const isInAir = !onGround;
        
        // Jump logic for ground and air jumps
        if (onGround) {
            // Reset jump count when on ground
            this.jumpCount = 0;
            // Reset joystick jump state when on ground
            if (!joystickJumpPressed) {
                this.joystick.wasJumpPressed = false;
            }
        }

        // Jump with space key or joystick up (with state tracking to prevent continuous jumping)
        const keyboardJump = Phaser.Input.Keyboard.JustDown(this.KEYS.up!);
        const joystickJump = joystickJumpPressed && !this.joystick.wasJumpPressed;
        
        if (keyboardJump || joystickJump) {
            if (joystickJump) {
                this.joystick.wasJumpPressed = true; // Mark that joystick jump was pressed
            }
            
            // First jump (from ground)
            if (onGround) {
                this.MY_PLAYER.sprite?.setVelocityY(-2000)!;
                this.jumpCount = 1;
                // Set jump animation if not attacking
                if (!this.MY_PLAYER.sprite?.getData('isAttacking')) {
                    currentAnimation = "_Jump";
                }
            } 
            // Double jump (in air) - perform second jump
            else if (!onGround && this.jumpCount < this.maxJumps) {
                this.MY_PLAYER.sprite?.setVelocityY(-2000)!;
                this.jumpCount++;
                
                // Create a small visual effect for double jump (optional)
                if (this.MY_PLAYER.sprite) {
                    // Simply flash the player sprite to indicate double jump
                    this.tweens.add({
                        targets: this.MY_PLAYER.sprite,
                        alpha: 0.7,
                        duration: 100,
                        yoyo: true,
                        repeat: 1
                    });
                    
                    // Play a sound effect for double jump if available
                    // this.sound.play('jump_sound', { volume: 0.5 });
                }
                
                // Set jump animation if not attacking
                if (!this.MY_PLAYER.sprite?.getData('isAttacking')) {
                    currentAnimation = "_Jump";
                }
            }
        }
        
        // Reset joystick jump state when not pressing up (mobile only)
        if (!joystickJumpPressed && this.isMobileDevice) {
            this.joystick.wasJumpPressed = false;
        }
        
        if (isInAir && !this.MY_PLAYER.sprite?.getData('isAttacking')) {
            // Use jump or fall animation when in air (but not when attacking)
            const velocityY = this.MY_PLAYER.sprite?.body?.velocity.y || 0;
            currentAnimation = velocityY < 0 ? "_Jump" : "_Fall";
        } else if ((this.KEYS.left!.isDown || (joystickLeft && adjustedForce > 0)) && !this.MY_PLAYER.sprite?.getData('isAttacking')) {
            // Calculate speed based on joystick force or use default for keyboard
            let speed = isRunning ? -runSpeed : -baseSpeed;
            if (joystickLeft && adjustedForce > 0) {
                // Use adjusted force for more precise control
                speed = -(isRunning ? runSpeed : baseSpeed) * adjustedForce;
            }
            this.MY_PLAYER.sprite?.setVelocityX(speed)!;
            this.MY_PLAYER.sprite?.setFlipX(true);
            // Use _Run animation for both walking and running (as per reference)
            currentAnimation = "_Run";
        } else if ((this.KEYS.right.isDown || (joystickRight && adjustedForce > 0)) && !this.MY_PLAYER.sprite?.getData('isAttacking')) {
            // Calculate speed based on joystick force or use default for keyboard
            let speed = isRunning ? runSpeed : baseSpeed;
            if (joystickRight && adjustedForce > 0) {
                // Use adjusted force for more precise control
                speed = (isRunning ? runSpeed : baseSpeed) * adjustedForce;
            }
            this.MY_PLAYER.sprite?.setVelocityX(speed)!;
            this.MY_PLAYER.sprite?.setFlipX(false);
            // Use _Run animation for both walking and running (as per reference)
            currentAnimation = "_Run";
        } else if (!this.MY_PLAYER.sprite?.getData('isAttacking')) {
            this.MY_PLAYER.sprite?.setVelocityX(0)!;
            currentAnimation = "_Idle_Idle";
        }
        
        // Apply camera bounds constraint to prevent player from going too far off-screen
        // We do this after movement but before animation updates
        if (this.MY_PLAYER.sprite && this.MY_PLAYER.sprite.active) {
            // Apply constraint and check if position was modified
            const wasConstrained = this.constrainPlayerToCameraBounds(this.MY_PLAYER.sprite);
            
            // If player was constrained at a boundary, adjust camera immediately
            // to avoid jarring camera jumps
            if (wasConstrained && this.sceneManager) {
                // Force camera to update its position by slightly nudging the target position
                this.cameras.main.setFollowOffset(
                    this.cameras.main.followOffset.x,
                    this.cameras.main.followOffset.y
                );
            }
        }

        // Only update animation if it's different and not currently attacking
        if (this.isSpriteAnimationSafe(this.MY_PLAYER.sprite) && 
            this.MY_PLAYER.sprite!.body?.velocity && 
            this.scene.isActive("Arena")) {
            
            const currentAnimKey = this.MY_PLAYER.sprite!.anims.currentAnim?.key || "";
            const isAttacking = this.MY_PLAYER.sprite!.getData('isAttacking') || false;
            
            // Don't interrupt attack animations, and only change if animation is different
            if (!isAttacking && currentAnimKey !== currentAnimation) {
                try {
                    // Play the animation with proper frame rate
                    this.MY_PLAYER.sprite!.anims.play(currentAnimation, true);
                } catch (error) {
                    console.warn("Error playing animation:", error);
                }
            }
        }

        // Send position updates to server
        if (this.MY_PLAYER.sprite && 
            this.MY_PLAYER.sprite.active && 
            this.MY_PLAYER.sprite.body && 
            this.scene.isActive("Arena") && 
            this.socket && 
            this.socket.connected && 
            time - this.lastPositionUpdate > this.positionUpdateInterval) {
            
            const currentAnimKey = this.MY_PLAYER.sprite.anims?.currentAnim?.key || "_Idle_Idle";
            const isAttacking = this.MY_PLAYER.sprite.getData('isAttacking') || false;
            
            // If we're attacking, send the attack animation, otherwise send movement animation
            const animationToSend = isAttacking ? currentAnimKey : currentAnimation;
            
            // Only send animation update if enough time has passed or if animation changed significantly
            const shouldUpdateAnimation = (time - this.lastAnimationUpdate > this.animationUpdateInterval) || 
                                        isAttacking || 
                                        (this.MY_PLAYER.sprite.getData('lastSentAnimation') !== animationToSend);
            
            try {
                this.socket.emit("playerMoved", {
                    x: this.MY_PLAYER.sprite.x,
                    y: this.MY_PLAYER.sprite.y,
                    velocityX: this.MY_PLAYER.sprite.body.velocity.x,
                    velocityY: this.MY_PLAYER.sprite.body.velocity.y,
                    flipX: this.MY_PLAYER.sprite.flipX,
                    animation: shouldUpdateAnimation ? animationToSend : undefined, // Only send animation if needed
                    isRunning: isRunning,
                    isAttacking: isAttacking,
                    animState: {
                        doubleJumping: this.jumpCount > 1, // Only true for second jump
                        onGround: onGround,
                        jumping: this.jumpCount > 0 && this.MY_PLAYER.sprite.body.velocity.y < 0
                    }
                });
                
                if (shouldUpdateAnimation) {
                    this.lastAnimationUpdate = time;
                    this.MY_PLAYER.sprite.setData('lastSentAnimation', animationToSend);
                }
                
                this.lastPositionUpdate = time;
            } catch (error) {
                console.warn("Error sending player position:", error);
            }
        }

        // Update health bars above player heads
        this.updatePlayerHealthBars();

        // Update other player's position and animation (now handled by gameStateUpdate)
        if (this.scene.isActive("Arena") && this.GAME_STATE.player1.id != this.socket.id) {
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active && this.GAME_STATE.player1.x !== undefined) {
                this.OTHER_PLAYER.sprite.setX(this.GAME_STATE.player1.x);
            }
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active && this.GAME_STATE.player1.y !== undefined && 752 > this.GAME_STATE.player1.y) {
                this.OTHER_PLAYER.sprite.setY(this.GAME_STATE.player1.y);
            }
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active && this.GAME_STATE.player1.flipX !== undefined) {
                this.OTHER_PLAYER.sprite.setFlipX(this.GAME_STATE.player1.flipX);
            }
            
            // For OTHER_PLAYER, we're more lenient with camera bounds
            // Only constrain if they go extremely far off-screen
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active) {
                // Use lenient constraint that allows player1 to go further off-screen
                // The constrainPlayerToCameraBounds method handles this automatically now
                // based on whether it's MY_PLAYER or OTHER_PLAYER
                this.constrainPlayerToCameraBounds(this.OTHER_PLAYER.sprite);
            }
        }

        if (this.scene.isActive("Arena") && this.GAME_STATE.player2.id != this.socket.id) {
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active && this.GAME_STATE.player2.x !== undefined) {
                this.OTHER_PLAYER.sprite.setX(this.GAME_STATE.player2.x);
            }
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active && this.GAME_STATE.player2.y !== undefined && 752 > this.GAME_STATE.player2.y) {
                this.OTHER_PLAYER.sprite.setY(this.GAME_STATE.player2.y);
            }
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active && this.GAME_STATE.player2.flipX !== undefined) {
                this.OTHER_PLAYER.sprite.setFlipX(this.GAME_STATE.player2.flipX);
            }
            
            // For OTHER_PLAYER, we're more lenient with camera bounds
            // Only constrain if they go extremely far off-screen
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active) {
                // Use lenient constraint that allows player2 to go further off-screen
                // The constrainPlayerToCameraBounds method handles this automatically now
                // based on whether it's MY_PLAYER or OTHER_PLAYER
                this.constrainPlayerToCameraBounds(this.OTHER_PLAYER.sprite);
            }
        }

        // if (this.GAME_STATE.player1.id == this.socket.id) {
        //     this.MY_PLAYER.sprite?.setX(this.GAME_STATE.player1.x);
        //     this.MY_PLAYER.sprite?.setFlipX(this.GAME_STATE.player1.flipX);
        // }

        // if (this.GAME_STATE.player2.id == this.socket.id) {
        //     this.MY_PLAYER.sprite?.setX(this.GAME_STATE.player2.x);
        //     this.MY_PLAYER.sprite?.setFlipX(this.GAME_STATE.player2.flipX);
        // }

        // if (this.GAME_STATE.player1.id == this.socket.id) {
        //     if (
        //         this.GAME_STATE.player1.x != this.MY_PLAYER.sprite.x ||
        //         this.GAME_STATE.player1.y != this.MY_PLAYER.sprite.y ||
        //         this.GAME_STATE.player1.velocityX !=
        //             this.MY_PLAYER.sprite.body?.velocity.x ||
        //         this.GAME_STATE.player1.velocityY !=
        //             this.MY_PLAYER.sprite.body?.velocity.y ||
        //         this.GAME_STATE.player1.flipX != this.MY_PLAYER.sprite.flipX
        //     ) {
        //         this.socket.emit("playerMoved", {
        //             x: this.MY_PLAYER.sprite.x,
        //             y: this.MY_PLAYER.sprite.y,
        //             velocityX: this.MY_PLAYER.sprite.body?.velocity.x,
        //             velocityY: this.MY_PLAYER.sprite.body?.velocity.y,
        //             flipX: this.MY_PLAYER.sprite.flipX,
        //         });
        //     }
        // }

        // if (this.GAME_STATE.player2.id == this.socket.id) {
        //     if (
        //         this.GAME_STATE.player2.x != this.MY_PLAYER.sprite.x ||
        //         this.GAME_STATE.player2.y !== this.MY_PLAYER.sprite.y ||
        //         this.GAME_STATE.player2.velocityX !=
        //             this.MY_PLAYER.sprite.body?.velocity.x ||
        //         this.GAME_STATE.player2.velocityY !=
        //             this.MY_PLAYER.sprite.body?.velocity.y ||
        //         this.GAME_STATE.player2.flipX != this.MY_PLAYER.sprite.flipX
        //     ) {
        //         this.socket.emit("playerMoved", {
        //             x: this.MY_PLAYER.sprite.x,
        //             y: this.MY_PLAYER.sprite.y,
        //             velocityX: this.MY_PLAYER.sprite.body?.velocity.x,
        //             velocityY: this.MY_PLAYER.sprite.body?.velocity.y,
        //             flipX: this.MY_PLAYER.sprite.flipX,
        //         });
        //     }
        // }

        // ✅ Jump only if touching the ground
        // if (this.CURSORS.up.isDown && this.player.body.touching.down) {
        //     this.player.setVelocityY(-330);
        // }

        // Update player manager for local player
        // if (this.playerManager) {
        //     this.playerManager.update(time, delta);

        //     // Update camera zoom based on speed
        //     if (this.sceneManager && this.myPlayer.sprite) {
        //         const speed =
        //             this.myPlayer.sprite && this.myPlayer.sprite.body
        //                 ? Math.abs(this.myPlayer.sprite.body.velocity.x)
        //                 : 0;
        //         this.sceneManager.updateCameraZoom(
        //             speed,
        //             this.playerManager.getRunSpeedThreshold()
        //         );
        //     }
        // }

        // Update multiplayer manager
        // if (this.multiplayerManager) {
        //     this.multiplayerManager.update(time, delta);
        // }

        // Debug - Periodically check platform colliders every 2 seconds
        // if (time % 2000 < 20) {
        //     // Check if any player is missing a platform collider
        //     let needsColliderRefresh = false;

        //     if (
        //         this.myPlayer.sprite &&
        //         !this.myPlayer.sprite.getData("platformCollider")
        //     ) {
        //         needsColliderRefresh = true;
        //     }

        //     // if (
        //     //     this.otherPlayer.sprite &&
        //     //     !this.otherPlayer.sprite.getData("platformCollider")
        //     // ) {
        //     //     needsColliderRefresh = true;
        //     // }

        //     // Refresh colliders if needed
        //     if (needsColliderRefresh) {
        //         console.log(
        //             "Missing platform colliders detected, refreshing..."
        //         );
        //         this.refreshAllPlatformColliders();
        //     }
        // }
    }

    /**
     * Handle end of match
     */
    private handleMatchEnd(): void {
        // Add additional logic for match end here
        console.log("Match has ended!");

        // Example: Show victory/defeat message, go to result screen, etc.
    }

    /**
     * Create platforms and level geometry
     */
    createPlatforms(): void {
        console.log("Creating platforms...");
        
        // Set up platform physics for the main platform
        if (this.platform) {
            console.log("Platform found, configuring...");
            this.platform.setOrigin(0.5, 0); // Center origin horizontally
            this.platform.setImmovable(true);

            // Adjust platform to match camera width with extra safety margin
            const cameraWidth = this.cameras.main.width;
            const safetyMargin = 400; // Extra width on each side
            const totalWidth = cameraWidth + safetyMargin * 2;

            // Update both display width and physics body size
            this.platform.displayWidth = totalWidth;
            if (this.platform.body) {
                (this.platform.body as Phaser.Physics.Arcade.StaticBody).width =
                    totalWidth;
                this.platform.body.setSize(
                    totalWidth,
                    this.platform.body.height,
                    false
                );
            }

            // Position platform in the center of the camera view
            this.platform.x = cameraWidth / 2;

            // Ensure platform is enabled for physics
            if (this.platform.body) {
                this.platform.body.enable = true;
            }

            console.log(
                `Platform configured: width=${totalWidth}, position=(${this.platform.x}, ${this.platform.y})`
            );
        } else {
            console.error("Platform not found in createPlatforms");
        }
    }

    /**
     * Add platform collider to a player sprite
     * @param sprite - The player sprite to add collider to
     */
    private addPlatformCollider(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (this.platform && sprite && sprite.body) {
            // Remove any existing colliders first to prevent duplicates
            this.physics.world.colliders
                .getActive()
                .filter(
                    (collider) =>
                        (collider.object1 === sprite &&
                            collider.object2 === this.platform) ||
                        (collider.object1 === this.platform &&
                            collider.object2 === sprite)
                )
                .forEach((collider) => collider.destroy());

            // Add a fresh collider
            const collider = this.physics.add.collider(sprite, this.platform);

            // Store reference to help with debugging
            sprite.setData("platformCollider", collider);

            console.log(
                `Platform collider added to player at (${sprite.x}, ${sprite.y})`
            );
        } else {
            console.warn(
                "Could not add platform collider - sprite, platform, or body is missing"
            );
        }
    }

    /**
     * Debug game assets (textures, animations)
     */
    private debugGameAssets(): void {
        console.log("=== DEBUGGING GAME ASSETS ===");
        
        // Debug: List loaded textures to confirm which ones are available
        console.log("=== LOADED TEXTURE KEYS ===");
        this.textures.list &&
            Object.keys(this.textures.list).forEach((key) => {
                console.log(`Texture: ${key}`);
            });

        // List available animations for debugging
        this.listAnimations();

        // Debug animation durations
        this.debugAnimationDurations();
        
        // Debug current sprites
        console.log("=== CURRENT SPRITES ===");
        console.log("MY_PLAYER.sprite:", this.MY_PLAYER.sprite);
        console.log("OTHER_PLAYER.sprite:", this.OTHER_PLAYER.sprite);
        console.log("Platform:", this.platform);
        console.log("Background:", this.background);
        
        console.log("=== SCENE CHILDREN COUNT ===");
        console.log("Total scene children:", this.children.length);
        
        console.log("=== GAME ASSETS DEBUG COMPLETE ===");
    }

    /**
     * Clean up when scene is shut down
     */
    shutdown(): void {
        console.log("Arena scene shutting down - cleaning up...");
        
        // Stop background music - primary music stop location
        if (this.currentBackgroundMusic) {
            this.currentBackgroundMusic.stop();
            this.currentBackgroundMusic = null;
        }
        if (this.selectedMap) {
            this.sound.stopByKey(this.selectedMap.musicKey);
        }
        
        // Remove all socket event listeners to prevent memory leaks
       
        this.socket.off("gameStateUpdate");
        this.socket.off("matchEnded");
        this.socket.off("playerHit");
        this.socket.off("playerAttacked");
        this.socket.off("timerUpdate");
        this.socket.off("playersConnected");
        this.socket.off("newPlayer");
        this.socket.off("playerDisconnected");

        // Clean up all managers
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
            this.multiplayerManager.cleanup();
            this.multiplayerManager = null;
        }
        this.socket.off("matchFound");
        this.socket.off("yourPlayerId");
        
        // Clean up player sprites and their resources
        if (this.MY_PLAYER.sprite) {
            // Stop any ongoing animations first
            if (this.MY_PLAYER.sprite.anims && this.MY_PLAYER.sprite.active) {
                try {
                    this.MY_PLAYER.sprite.anims.stop();
                } catch (error) {
                    console.warn("Error stopping MY_PLAYER animations:", error);
                }
            }
            // Remove event listeners
            if (this.MY_PLAYER.sprite.active) {
                this.MY_PLAYER.sprite.removeAllListeners();
            }
            // Destroy the sprite
            this.MY_PLAYER.sprite.destroy();
            this.MY_PLAYER.sprite = undefined;
        }
        
        if (this.OTHER_PLAYER.sprite) {
            // Stop any ongoing animations first
            if (this.OTHER_PLAYER.sprite.anims && this.OTHER_PLAYER.sprite.active) {
                try {
                    this.OTHER_PLAYER.sprite.anims.stop();
                } catch (error) {
                    console.warn("Error stopping OTHER_PLAYER animations:", error);
                }
            }
            // Remove event listeners
            if (this.OTHER_PLAYER.sprite.active) {
                this.OTHER_PLAYER.sprite.removeAllListeners();
            }
            // Destroy the sprite
            this.OTHER_PLAYER.sprite.destroy();
            this.OTHER_PLAYER.sprite = undefined;
        }
        
        // Clean up other player registry
        Object.values(this.otherPlayers).forEach((sprite) => {
            if (sprite && sprite.active) {
                try {
                    if (sprite.anims) {
                        sprite.anims.stop();
                    }
                    sprite.removeAllListeners();
                    sprite.destroy();
                } catch (error) {
                    console.warn("Error cleaning up other player sprite:", error);
                }
            }
        });
        this.otherPlayers = {};
        
        // Clean up input listeners
        this.input.off("pointerdown");
        
        // Remove context menu event listener
        if (this.game.canvas) {
            this.game.canvas.removeEventListener('contextmenu', this.contextMenuHandler);
        }
        
        // Clean up virtual joystick and mobile controls
        if (this.joystick && this.isMobileDevice) {
            // Clean up attack button and text if they exist
            if (this.joystick.attackButton) {
                this.joystick.attackButton.destroy();
            }
            if (this.joystick.attackText) {
                this.joystick.attackText.destroy();
            }
            // Clean up jump button and text if they exist
            if (this.joystick.jumpButton) {
                this.joystick.jumpButton.destroy();
            }
            if (this.joystick.jumpText) {
                this.joystick.jumpText.destroy();
            }
            // Clean up sprint button and text if they exist
            if (this.joystick.sprintButton) {
                this.joystick.sprintButton.destroy();
            }
            if (this.joystick.sprintText) {
                this.joystick.sprintText.destroy();
            }
            this.joystick.destroy();
            this.joystick = null;
        }
        
        // Clean up any timers
        if (this.time) {
            this.time.removeAllEvents();
        }
        
        // Reset game state
        this.GAME_STATE = {
            player1: {
                id: undefined,
                x: undefined,
                y: undefined,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                flipX: false,
                anim: "_Idle_Idle",
                pastAnim: undefined,
            },
            player2: {
                id: undefined,
                x: undefined,
                y: undefined,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                flipX: true,
                anim: "_Idle_Idle",
                pastAnim: undefined,
            },
        };
        
        // // Clear position update tracking
        this.lastPositionUpdate = 0;
        this.lastAnimationUpdate = 0;
        
        // Reset OTHER_PLAYER references
        this.OTHER_PLAYER = {
            sprite: undefined,
            lastReceivedAnimation: undefined,
            lastAnimationChangeTime: undefined,
        };
        
        // Reset MY_PLAYER reference
        this.MY_PLAYER = {
            sprite: undefined,
        };
        
        // Reset transition flag
        this.isTransitioning = false;
        
        console.log("Arena scene cleanup completed");
    }

    /**
     * Handle scene pre-destruction
     */
    preDestroy(): void {
        console.log("Arena scene preDestroy called");
        this.shutdown();
    }

    /**
     * Context menu handler for preventing right-click context menu
     */
    private contextMenuHandler = (e: Event) => {
        e.preventDefault();
    };

    /**
     * Called when the scene is shutting down
     * Ensures music is stopped to prevent audio overlap
     */
    onShutdown() {
        console.log("Arena scene onShutdown called - music will be stopped in shutdown method");
        // Music stopping is handled in the main shutdown method
    }

    /**
     * Handle scene destruction
     */
    destroy(): void {
        console.log("Arena scene being destroyed");
        // Stop music before destroying
        if (this.currentBackgroundMusic) {
            this.currentBackgroundMusic.stop();
            this.currentBackgroundMusic = null;
        }
        if (this.selectedMap) {
            this.sound.stopByKey(this.selectedMap.musicKey);
        }
        this.shutdown();
    }

    /**
     * Handle player attack (works both on ground and in air)
     */
    private performAttack(): void {
        const currentTime = this.time.now;
        
        // Check attack cooldown to prevent spam
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return; // Still in cooldown
        }
        
        // Check if already attacking to prevent animation conflicts
        if (this.MY_PLAYER.sprite?.getData('isAttacking')) {
            console.log("Already attacking, ignoring new attack input");
            return; // Already attacking, ignore new attack input
        }
        
        // Extra safety check to prevent animation conflicts for Player 1
        if (this.MY_PLAYER.sprite?.anims?.isPlaying && 
            this.MY_PLAYER.sprite.anims.currentAnim?.key === "_Attack2") {
            console.log("Attack animation already playing, ignoring duplicate");
            return;
        }
        
        this.lastAttackTime = currentTime;
        const currentPlayerId = this.socket.id;
        
        if (currentPlayerId === this.GAME_STATE.player1.id) {
            // Play attack sound for local player attack
            try {
                this.sound.play("Attack", { volume: 0.5 });
            } catch (error) {
                console.warn("Error playing attack sound:", error);
            }

            // Emit attack event to server (this will trigger other players' attack animations)
            this.socket.emit("playerAttacked", {
                x: this.MY_PLAYER.sprite?.x || this.GAME_STATE.player1.x,
                y: this.MY_PLAYER.sprite?.y || this.GAME_STATE.player1.y,
                attackWidth: 120,
                attackHeight: 80,
                flipX: this.MY_PLAYER.sprite?.flipX || false,
            });
            
            // Play attack animation for local player
            if (this.isSpriteAnimationSafe(this.MY_PLAYER.sprite)) {
                try {
                    // Stop any current animation before playing attack
                    if (this.MY_PLAYER.sprite!.anims.currentAnim) {
                        this.MY_PLAYER.sprite!.anims.stop();
                    }
                    
                    this.MY_PLAYER.sprite!.play({
                        key: "_Attack2",
                        frameRate: 8,
                        repeat: 0,
                    });
                    this.MY_PLAYER.sprite!.setData('isAttacking', true);
                    
                    // Clear any existing animation complete listeners to prevent conflicts
                    this.MY_PLAYER.sprite!.off('animationcomplete');
                    
                    this.MY_PLAYER.sprite!.once('animationcomplete', () => {
                        if (this.MY_PLAYER.sprite && this.MY_PLAYER.sprite.active) {
                            this.MY_PLAYER.sprite.setData('isAttacking', false);
                        }
                    });
                    
                    // Fallback timeout to clear attacking flag if animation doesn't complete
                    this.time.delayedCall(500, () => {
                        if (this.MY_PLAYER.sprite && this.MY_PLAYER.sprite.active) {
                            this.MY_PLAYER.sprite.setData('isAttacking', false);
                        }
                    });
                } catch (error) {
                    console.warn("Error playing attack animation:", error);
                }
            }
        } else if (currentPlayerId === this.GAME_STATE.player2.id) {
            // Play attack sound for local player attack
            try {
                this.sound.play("Attack", { volume: 0.5 });
            } catch (error) {
                console.warn("Error playing attack sound:", error);
            }

            // Emit attack event to server (this will trigger other players' attack animations)
            this.socket.emit("playerAttacked", {
                x: this.MY_PLAYER.sprite?.x || this.GAME_STATE.player2.x,
                y: this.MY_PLAYER.sprite?.y || this.GAME_STATE.player2.y,
                attackWidth: 120,
                attackHeight: 80,
                flipX: this.MY_PLAYER.sprite?.flipX || false,
            });
            
            // Play attack animation for local player
            if (this.isSpriteAnimationSafe(this.MY_PLAYER.sprite)) {
                try {
                    // Stop any current animation before playing attack
                    if (this.MY_PLAYER.sprite!.anims.currentAnim) {
                        this.MY_PLAYER.sprite!.anims.stop();
                    }
                    
                    this.MY_PLAYER.sprite!.play({
                        key: "_Attack2",
                        frameRate: 8,
                        repeat: 0,
                    });
                    this.MY_PLAYER.sprite!.setData('isAttacking', true);
                    
                    // Clear any existing animation complete listeners to prevent conflicts
                    this.MY_PLAYER.sprite!.off('animationcomplete');
                    
                    this.MY_PLAYER.sprite!.once('animationcomplete', () => {
                        if (this.MY_PLAYER.sprite && this.MY_PLAYER.sprite.active) {
                            this.MY_PLAYER.sprite.setData('isAttacking', false);
                        }
                    });
                    
                    // Fallback timeout to clear attacking flag if animation doesn't complete
                    this.time.delayedCall(500, () => {
                        if (this.MY_PLAYER.sprite && this.MY_PLAYER.sprite.active) {
                            this.MY_PLAYER.sprite.setData('isAttacking', false);
                        }
                    });
                } catch (error) {
                    console.warn("Error playing attack animation:", error);
                }
            }
        }
    }

    /**
     * Create an entrance animation for the match
     */
    private createEntranceAnimation(): void {
        // Store original positions of players for reference
        const myPlayerOriginalX = this.MY_PLAYER.sprite?.x || 608;
        const myPlayerOriginalY = this.MY_PLAYER.sprite?.y || 752;

        // Set initial game state
        // Pause physics to prevent early movement
        this.physics.pause();

        // Hide UI elements initially
        this.p1infoContainer.setAlpha(0);
               this.p2infoContainer.setAlpha(0);
        this.player1Name.setAlpha(0);
        this.player2Name.setAlpha(0);

        // Hide timer
        this.uiTimer.setAlpha(0);
        this.matchTimerText.setAlpha(0);

        // Start with a camera flash
        this.cameras.main.flash(500, 0, 0, 0);

        // Create a "FIGHT!" text that starts big and animates down
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

        // Make fight text stay in place during camera movements
        fightText.setScrollFactor(0);

        // If we have a scene manager with cameras set up, make sure the fight text
        // is only rendered by the UI camera to prevent duplication
        if (this.sceneManager) {
            // Add to UI elements (will be seen in UI camera only)
            this.sceneManager.addToUIElements(fightText);
        }

        // Create map announcement text
        const mapText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            `Map: ${this.selectedMap?.name || "Unknown"}`,
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

        // Add map text to UI elements if scene manager exists
        if (this.sceneManager) {
            this.sceneManager.addToUIElements(mapText);
        }

        // Create a sequence of animations

        // 1. Fade in player info containers
        this.time.delayedCall(300, () => {
            this.tweens.add({
                targets: [this.p1infoContainer, this.p2infoContainer],
                alpha: 0.8,
                duration: 400,
                ease: "Power2",
            });

            // Fade in player names with a slight delay
            this.time.delayedCall(200, () => {
                this.tweens.add({
                    targets: [this.player1Name, this.player2Name],
                    alpha: 1,
                    duration: 300,
                    ease: "Power2",
                });
            });
        });

        // 2. Animate in the FIGHT! text and map announcement
        this.time.delayedCall(800, () => {
            // Play a whoosh sound if available
            try {
                this.sound.play("Attack", { volume: 0.3 });
            } catch (error) {
                console.warn("Could not play whoosh sound:", error);
            }

            // Zoom in and fade in the fight text
            this.tweens.add({
                targets: fightText,
                scale: 1,
                alpha: 1,
                duration: 300,
                ease: "Back.out(1.5)",
                onComplete: () => {
                    // Shake the camera for emphasis
                    this.cameras.main.shake(200, 0.02);

                    // Add a pulsing effect
                    this.tweens.add({
                        targets: fightText,
                        scale: 1.1,
                        yoyo: true,
                        repeat: 1,
                        duration: 150,
                        ease: "Sine.easeInOut",
                    });

                    // Show map text after FIGHT! appears
                    this.time.delayedCall(400, () => {
                        this.tweens.add({
                            targets: mapText,
                            alpha: 1,
                            duration: 300,
                            ease: "Power2",
                        });
                    });

                    // After a short delay, fade out both texts
                    this.time.delayedCall(1200, () => {
                        this.tweens.add({
                            targets: [fightText, mapText],
                            alpha: 0,
                            scale: 1.5,
                            duration: 300,
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

        // 3. Fade in the UI elements
        this.time.delayedCall(1800, () => {
            // Timer
            this.tweens.add({
                targets: [this.uiTimer, this.matchTimerText],
                alpha: 1,
                duration: 500,
                ease: "Power2",
            });
        });

        // 4. Resume game after all animations
        this.time.delayedCall(2300, () => {
            // Resume physics
            this.physics.resume();

            // Make sure players are in their starting positions
            if (this.MY_PLAYER.sprite) {
                this.MY_PLAYER.sprite.x = myPlayerOriginalX;
                this.MY_PLAYER.sprite.y = myPlayerOriginalY;
            }

            console.log("Match started! Players can now move and attack.");
        });
    }

    /**
     * Update health bars above player heads
     */
    private updatePlayerHealthBars(): void {
        // Update player 1 health bar
        if (this.MY_PLAYER.sprite && this.GAME_STATE.player1.id === this.socket.id) {
            this.updateHealthBar(
                this.player1HealthBarBg,
                this.player1HealthBar,
                this.MY_PLAYER.sprite,
                this.GAME_STATE.player1.health
            );
        } else if (this.OTHER_PLAYER.sprite && this.GAME_STATE.player1.id !== this.socket.id) {
            this.updateHealthBar(
                this.player1HealthBarBg,
                this.player1HealthBar,
                this.OTHER_PLAYER.sprite,
                this.GAME_STATE.player1.health
            );
        }
        
        // Update player 2 health bar
        if (this.MY_PLAYER.sprite && this.GAME_STATE.player2.id === this.socket.id) {
            this.updateHealthBar(
                this.player2HealthBarBg,
                this.player2HealthBar,
                this.MY_PLAYER.sprite,
                this.GAME_STATE.player2.health
            );
        } else if (this.OTHER_PLAYER.sprite && this.GAME_STATE.player2.id !== this.socket.id) {
            this.updateHealthBar(
                this.player2HealthBarBg,
                this.player2HealthBar,
                this.OTHER_PLAYER.sprite,
                this.GAME_STATE.player2.health
            );
        }
    }
    
    /**
     * Update a single health bar above a player sprite
     */
    private updateHealthBar(
        backgroundBar: Phaser.GameObjects.Graphics,
        healthBar: Phaser.GameObjects.Graphics,
        playerSprite: Phaser.Physics.Arcade.Sprite,
        health: number
    ): void {
        if (!playerSprite || !playerSprite.active) return;
        
        const barWidth = 60;
        const barHeight = 8;

        // Since the sprite's origin is set to (0,0), we need to calculate the character's
        // visual center and top position based on the known sprite configuration
        
        // Hard-coded values based on sprite configuration in createPlayerSprite
        // We know the sprite uses scaleX=5, scaleY=5
        // We know body is set with setOffset(45, 40) and setSize(30, 40)
        // These values together determine the actual visual position of the character
        
        // For precise character center positioning, we need the exact middle of the character's visible body
        // From looking at the sprite creation code and body settings, we know:
        // - The body is offset at (45, 40) and has size (30, 40)
        // - The visual center of the character is at body's center
        
        // Calculate center position based on body position and size
        const bodyOffsetX = playerSprite.body ? playerSprite.body.offset.x : 45;
        const bodyWidth = playerSprite.body ? playerSprite.body.width : 30;
        
        // The visual center is in the middle of the body
        const characterCenterX = playerSprite.x + (bodyOffsetX + bodyWidth/2) * playerSprite.scaleX;
        
        // The top of the character is at the sprite's position plus a small offset
        // Determined by visual inspection to match the character's head position
        const characterTopY = playerSprite.y + 5 * playerSprite.scaleY;
        
        // Position the health bar horizontally centered over the character
        const x = characterCenterX - barWidth / 2;
        
        // Position the health bar directly above the character's head with a small gap
        const y = characterTopY - barHeight - 5; // 5px gap
        
        // Clear previous graphics
        backgroundBar.clear();
        healthBar.clear();
        
        // Draw background (dark red)
        backgroundBar.fillStyle(0x330000);
        backgroundBar.fillRect(x, y, barWidth, barHeight);
        
        // Draw health bar (green to red based on health)
        const healthPercent = Math.max(0, health) / 100;
        const healthBarWidth = barWidth * healthPercent;
        
        // Color based on health percentage
        let healthColor = 0x00ff00; // Green
        if (healthPercent < 0.5) {
            healthColor = 0xffff00; // Yellow
        }
        if (healthPercent < 0.25) {
            healthColor = 0xff0000; // Red
        }
        
        healthBar.fillStyle(healthColor);
        healthBar.fillRect(x, y, healthBarWidth, barHeight);
        
        // Add border
        backgroundBar.lineStyle(1, 0xffffff);
        backgroundBar.strokeRect(x, y, barWidth, barHeight);
    }

    /**
     * Recreate the background when map is changed by server
     */
    private recreateBackground(): void {
        if (!this.selectedMap) return;
        
        // Destroy existing background sprites
        if (this.background) this.background.destroy();
        if (this.background_2) this.background_2.destroy();
        if (this.background_3) this.background_3.destroy();
        if (this.grass) this.grass.destroy();
        
        // Create new background based on selected map
        if (this.selectedMap.name === "forest") {
            // Forest map uses spritesheet frames from newMap
            this.background = this.add.sprite(960, 544, this.selectedMap.backgroundKey, 0);
            this.background_2 = this.add.sprite(960, 560, this.selectedMap.backgroundKey, 1);
            this.background_3 = this.add.sprite(960, 656, this.selectedMap.backgroundKey, 2);
            this.grass = this.add.sprite(960, 656, this.selectedMap.backgroundKey, 3);
            
            // Send all background sprites to the back so UI stays on top
            this.background.setDepth(-4);
            this.background_2.setDepth(-3);
            this.background_3.setDepth(-2);
            this.grass.setDepth(-1);
            
            console.log("Recreated forest background and sent to back");
        } else if (this.selectedMap.name === "Philippines") {
            // Philippines map uses a single background image
            this.background = this.add.sprite(960, 540, this.selectedMap.backgroundKey);
            this.background.setDisplaySize(1920, 1080); // Scale to fit screen
            this.background.setDepth(-4); // Send to back
            
            // Create placeholder sprites for consistency (hidden)
            this.background_2 = this.add.sprite(0, 0, "").setVisible(false);
            this.background_3 = this.add.sprite(0, 0, "").setVisible(false);
            this.grass = this.add.sprite(0, 0, "").setVisible(false);
            
            console.log("Recreated Philippines background and sent to back");
        } else if (this.selectedMap.name === "Japan") {
            // Japan map uses a single background image
            this.background = this.add.sprite(960, 540, this.selectedMap.backgroundKey);
            this.background.setDisplaySize(1920, 1080); // Scale to fit screen
            this.background.setDepth(-4); // Send to back
            
            // Create placeholder sprites for consistency (hidden)
            this.background_2 = this.add.sprite(0, 0, "").setVisible(false);
            this.background_3 = this.add.sprite(0, 0, "").setVisible(false);
            this.grass = this.add.sprite(0, 0, "").setVisible(false);
            
            console.log("Recreated Japan background and sent to back");
        } else if (this.selectedMap.name === "France") {
            // France map uses a single background image
            this.background = this.add.sprite(960, 540, this.selectedMap.backgroundKey);
            this.background.setDisplaySize(1920, 1080); // Scale to fit screen
            this.background.setDepth(-4); // Send to back
            
            // Create placeholder sprites for consistency (hidden)
            this.background_2 = this.add.sprite(0, 0, "").setVisible(false);
            this.background_3 = this.add.sprite(0, 0, "").setVisible(false);
            this.grass = this.add.sprite(0, 0, "").setVisible(false);
            
            console.log("Recreated France background and sent to back");
        }
        
        // Ensure all UI elements maintain their proper depth and visibility after map change
        this.ensureUIElementsVisible();
    }
    
    /**
     * Ensure all UI elements are visible and properly layered
     */
    private ensureUIElementsVisible(): void {
        console.log("Ensuring UI elements are visible and properly layered...");
        
        // Health and stamina displays
        if (this.player1HP) {
            this.player1HP.setDepth(10);
            this.player1HP.setVisible(true);
        }
        if (this.player1STA) {
            this.player1STA.setDepth(10);
            this.player1STA.setVisible(true);
        }
        
        // Player info containers
        if (this.p1infoContainer) {
            this.p1infoContainer.setDepth(5);
            this.p1infoContainer.setVisible(true);
        }
        if (this.p2infoContainer) {
            this.p2infoContainer.setDepth(5);
            this.p2infoContainer.setVisible(true);
        }
        
        // Timer elements
        if (this.uiTimer) {
            this.uiTimer.setDepth(6);
            this.uiTimer.setVisible(true);
        }
        if (this.matchTimerText) {
            this.matchTimerText.setDepth(7);
            this.matchTimerText.setVisible(true);
        }
        
        // Player names
        if (this.player1Name) {
            this.player1Name.setDepth(6);
            this.player1Name.setVisible(true);
        }
        if (this.player2Name) {
            this.player2Name.setDepth(6);
            this.player2Name.setVisible(true);
        }
        
        // Health bars above heads
        if (this.player1HealthBar) {
            this.player1HealthBar.setDepth(16);
            this.player1HealthBar.setVisible(true);
        }
        if (this.player2HealthBar) {
            this.player2HealthBar.setDepth(16);
            this.player2HealthBar.setVisible(true);
        }
        if (this.player1HealthBarBg) {
            this.player1HealthBarBg.setDepth(15);
            this.player1HealthBarBg.setVisible(true);
        }
        if (this.player2HealthBarBg) {
            this.player2HealthBarBg.setDepth(15);
            this.player2HealthBarBg.setVisible(true);
        }
        
        console.log("UI elements depth and visibility updated");
    }

    /**
     * Start background music based on selected map
     */
    private startBackgroundMusic(): void {
        if (!this.selectedMap) return;
        
        // Stop any existing background music
        if (this.currentBackgroundMusic) {
            this.currentBackgroundMusic.stop();
            this.currentBackgroundMusic = null;
        }
        
        // Start new background music
        try {
            this.currentBackgroundMusic = this.sound.add(this.selectedMap.musicKey, { loop: true, volume: 0.4 });
            this.currentBackgroundMusic.play();
            console.log("Started server-selected background music:", this.selectedMap.musicKey);
        } catch (error) {
            console.error("Failed to start server-selected background music:", error);
        }
    }

    /**
     * Constrain player position to stay within camera bounds
     * @param sprite - The player sprite to constrain
     * @returns - Whether the position was constrained (true) or not (false)
     */
    private constrainPlayerToCameraBounds(sprite: Phaser.Physics.Arcade.Sprite): boolean {
        if (!sprite || !sprite.body) {
            return false;
        }

        let positionConstrained = false;
        
        // Get camera bounds
        const camera = this.cameras.main;
        const worldView = camera.worldView;
        
        // Calculate effective sprite dimensions (adjust based on sprite's actual visible area)
        // The sprite.width/height are the texture dimensions, which may be larger than the visible area
        // due to the body offset and size settings
        const spriteWidth = sprite.body.width * sprite.scaleX;
        const spriteHeight = sprite.body.height * sprite.scaleY;
        
        // Calculate body offset (the sprite's physics body may be offset from its origin)
        const bodyOffsetX = sprite.body.offset.x * sprite.scaleX;
        const bodyOffsetY = sprite.body.offset.y * sprite.scaleY;
        
        // Define different boundary zones - allow players to go slightly off-screen
        // before constraining them
        const innerPadding = 20;   // Pixels from edge for soft boundary (players can cross this)
        const outerPadding = -100;  // Pixels from edge for hard boundary (players cannot cross this)
                                    // Negative value means players can go off-screen by this amount
        
        // Calculate effective display bounds
        // Soft bounds - visual indicators, no actual constraint
        const softLeftBound = worldView.x + innerPadding + bodyOffsetX;
        const softRightBound = worldView.x + worldView.width - spriteWidth - innerPadding;
        const softTopBound = worldView.y + innerPadding + bodyOffsetY;
        const softBottomBound = worldView.y + worldView.height - (spriteHeight / 2) - innerPadding;
        
        // Hard bounds - actual constraint points where player movement is stopped
        const hardLeftBound = worldView.x + outerPadding + bodyOffsetX;
        const hardRightBound = worldView.x + worldView.width - spriteWidth - outerPadding;
        const hardTopBound = worldView.y + outerPadding + bodyOffsetY;
        const hardBottomBound = worldView.y + worldView.height - (spriteHeight / 2) - outerPadding;
        
        // Store original position for debugging
        const originalX = sprite.x;
        const originalY = sprite.y;
        
        // Check if this sprite is MY_PLAYER
        const isMyPlayer = this.MY_PLAYER.sprite === sprite;

        // Apply different constraints based on whether this is MY_PLAYER or OTHER_PLAYER
        if (isMyPlayer) {
            // For MY_PLAYER, apply soft constraints when chasing OTHER_PLAYER
            // but apply hard constraints when OTHER_PLAYER is visible or when at map edges
            
            // Calculate distance to OTHER_PLAYER if it exists
            let otherPlayerVisible = false;
            if (this.OTHER_PLAYER.sprite && this.OTHER_PLAYER.sprite.active) {
                // Check if OTHER_PLAYER is within camera view
                const otherX = this.OTHER_PLAYER.sprite.x;
                const otherY = this.OTHER_PLAYER.sprite.y;
                
                otherPlayerVisible = (
                    otherX >= worldView.x && 
                    otherX <= worldView.x + worldView.width &&
                    otherY >= worldView.y &&
                    otherY <= worldView.y + worldView.height
                );
            }
            
            // Apply hard constraints to keep player in bounds
            // Check horizontal bounds (hard constraints)
            if (sprite.x < hardLeftBound) {
                sprite.x = hardLeftBound;
                sprite.body.velocity.x = 0;
                positionConstrained = true;
            } else if (sprite.x > hardRightBound) {
                sprite.x = hardRightBound;
                sprite.body.velocity.x = 0;
                positionConstrained = true;
            }

            // Check vertical bounds (hard constraints)
            if (sprite.y < hardTopBound) {
                sprite.y = hardTopBound;
                sprite.body.velocity.y = 0;
                positionConstrained = true;
            }
            
            // Always check bottom bound to prevent falling off the bottom of the screen
            if (sprite.y > hardBottomBound) {
                sprite.y = hardBottomBound;
                // We don't zero out velocity here to allow jumping
                positionConstrained = true;
            }
        } else {
            // For OTHER_PLAYER, be more lenient with constraints
            // Only apply constraints when they go too far off screen
            
            // Check horizontal bounds (very lenient)
            if (sprite.x < hardLeftBound - 100) { // Extra 100px allowance
                sprite.x = hardLeftBound - 100;
                positionConstrained = true;
            } else if (sprite.x > hardRightBound + 100) { // Extra 100px allowance
                sprite.x = hardRightBound + 100;
                positionConstrained = true;
            }

            // Check vertical bounds (very lenient)
            if (sprite.y < hardTopBound - 100) { // Extra 100px allowance
                sprite.y = hardTopBound - 100;
                positionConstrained = true;
            }
            
            // Bottom bound check (lenient but still constraining)
            if (sprite.y > hardBottomBound + 100) { // Extra 100px allowance
                sprite.y = hardBottomBound + 100;
                positionConstrained = true;
            }
        }
        
        // Log position constraints for debugging if position was constrained
        if (positionConstrained && this.game.config.physics.arcade?.debug) {
            console.log(`Player ${isMyPlayer ? 'MY_PLAYER' : 'OTHER_PLAYER'} constrained: [${originalX.toFixed(0)}, ${originalY.toFixed(0)}] → [${sprite.x.toFixed(0)}, ${sprite.y.toFixed(0)}]`);
        }
        
        return positionConstrained;

        return positionConstrained;
    }

    /**
     * Handle scene pre-destruction
     */
}
/* END OF COMPILED CODE */

// You can write more code here

