/**
 * SceneManager - Manages camera behavior and UI/gameplay layer separation
 */
export class SceneManager {
    private scene: Phaser.Scene;
    private background: Phaser.GameObjects.Sprite;
    private bestZoom: number = 1.5;
    private parallaxFactor: number = 0.4;
    private currentZoom: number = 1;
    private targetZoom: number = 1;
    private zoomSpeed: number = 0.02;
    private followTarget?: Phaser.Physics.Arcade.Sprite;

    // UI Camera for fixed UI elements
    private uiCamera?: Phaser.Cameras.Scene2D.Camera;
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    constructor(
        scene: Phaser.Scene,
        background: Phaser.GameObjects.Sprite,
        tileSprites: Phaser.GameObjects.TileSprite[] = [],
        config: {
            bestZoom?: number;
            parallaxFactor?: number;
        } = {}
    ) {
        this.scene = scene;
        this.background = background;
        this.bestZoom = config.bestZoom || this.bestZoom;
        this.parallaxFactor = config.parallaxFactor || this.parallaxFactor;
        
        // Get the main camera
        this.mainCamera = this.scene.cameras.main;
        
        // Create UI camera for fixed UI elements
        this.uiCamera = this.scene.cameras.add(0, 0, this.scene.game.config.width as number, this.scene.game.config.height as number);
        this.uiCamera.setName('UI_Camera');
        
        // Set initial zoom
        this.currentZoom = this.bestZoom;
        this.targetZoom = this.bestZoom;
        this.mainCamera.setZoom(this.currentZoom);
        
        // Set up parallax scrolling for background
        this.setupParallaxScrolling();
    }

    /**
     * Set up parallax scrolling for background elements
     */
    private setupParallaxScrolling(): void {
        if (this.background) {
            this.background.setScrollFactor(this.parallaxFactor);
        }
    }

    /**
     * Set up camera to follow a target sprite
     * @param target - The sprite for the camera to follow
     * @param options - Optional camera configuration options
     */
    setupCameraFollow(
        target: Phaser.Physics.Arcade.Sprite, 
        options?: {
            deadzone?: Phaser.Geom.Rectangle,
            lerpX?: number,
            lerpY?: number
        }
    ): void {
        this.followTarget = target;
        
        // Set up smooth camera follow with optional deadzone and smoothing
        const lerpX = options?.lerpX ?? 0.1;
        const lerpY = options?.lerpY ?? 0.1;
        
        // Set deadzone if provided (area where camera won't scroll until player leaves it)
        if (options?.deadzone) {
            this.mainCamera.startFollow(target, true, lerpX, lerpY);
            this.mainCamera.setDeadzone(
                options.deadzone.width,
                options.deadzone.height
            );
            
            // Center the deadzone in the camera view
            this.mainCamera.setFollowOffset(
                -(options.deadzone.x + options.deadzone.width/2 - this.mainCamera.width/2),
                -(options.deadzone.y + options.deadzone.height/2 - this.mainCamera.height/2)
            );
        } else {
            // Default simple follow with smoothing
            this.mainCamera.startFollow(target, true, lerpX, lerpY);
        }
        
        // Set camera bounds to prevent going outside the world
        const worldBounds = this.scene.physics.world.bounds;
        this.mainCamera.setBounds(
            worldBounds.x, 
            worldBounds.y, 
            worldBounds.width, 
            worldBounds.height
        );
    }

    /**
     * Update camera zoom based on player speed
     */
    updateCameraZoom(playerSpeed: number, runSpeedThreshold: number): void {
        // Calculate target zoom based on player speed
        if (playerSpeed > runSpeedThreshold) {
            // Zoom out when running fast
            this.targetZoom = this.bestZoom * 0.8;
        } else {
            // Default zoom when moving slowly or idle
            this.targetZoom = this.bestZoom;
        }
        
        // Smoothly interpolate to target zoom
        this.currentZoom = Phaser.Math.Linear(this.currentZoom, this.targetZoom, this.zoomSpeed);
        this.mainCamera.setZoom(this.currentZoom);
    }

    /**
     * Make main camera ignore UI elements
     */
    setMainIgnoreUI(uiElements: Phaser.GameObjects.GameObject[]): void {
        uiElements.forEach(element => {
            if (element) {
                this.mainCamera.ignore(element);
            }
        });
    }

    /**
     * Make UI camera ignore gameplay elements
     */
    setUIIgnoreGameplay(gameplayElements: Phaser.GameObjects.GameObject[]): void {
        if (this.uiCamera) {
            gameplayElements.forEach(element => {
                if (element) {
                    this.uiCamera!.ignore(element);
                }
            });
        }
    }

    /**
     * Add element to UI camera only
     */
    addToUIElements(element: Phaser.GameObjects.GameObject): void {
        if (this.uiCamera && element) {
            this.mainCamera.ignore(element);
            // Element will be visible in UI camera by default
        }
    }

    /**
     * Add element to gameplay camera only
     */
    addToGameplayElements(element: Phaser.GameObjects.GameObject): void {
        if (this.uiCamera && element) {
            this.uiCamera.ignore(element);
            // Element will be visible in main camera by default
        }
    }

    /**
     * Get the main camera
     */
    getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
    }

    /**
     * Get the UI camera
     */
    getUICamera(): Phaser.Cameras.Scene2D.Camera | undefined {
        return this.uiCamera;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.uiCamera) {
            this.scene.cameras.remove(this.uiCamera);
        }
        this.followTarget = undefined;
    }
}
