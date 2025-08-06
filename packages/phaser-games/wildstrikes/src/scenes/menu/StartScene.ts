import * as Phaser from 'phaser';
import bgClouds from '../../components/bg-clouds';
import { BaseScene } from './BaseScene';
import { Animations } from '../../effects/Animations';

export class StartScene extends BaseScene {
  private PLAY_BUTTON!: Phaser.GameObjects.Image;
  private MAIN_LOGO!: Phaser.GameObjects.Image;

  constructor() {
    super('Start');
  }
  
  private connectingWallet = false;
  private loadingText: Phaser.GameObjects.Text | null = null;

  create(): void {
    const { centerX, centerY, width, height } = this.cameras.main;

    // --- Constants ---
    const BG_DEPTH = -1000;
    const CLOUD_DEPTHS = [-500, -400, -300];
    const CLOUD_POSITIONS = [
      { x: 500, y: 300, speed: 20 },
      { x: 1200, y: 450, speed: 30 },
      { x: 900, y: 200, speed: 40 },
    ];
    
    // Listen for wallet connection events
    if (typeof window !== 'undefined') {
      console.log("[StartScene] Setting up wallet connection event listeners");
      
      // Handle successful wallet connection
      const handleWalletConnected = (event: CustomEvent) => {
        console.log("[StartScene] 'aptos-wallet-connected' event received", {
          connectingWallet: this.connectingWallet,
          address: event.detail?.address
        });
        
        if (this.connectingWallet) {
          console.log("[StartScene] Wallet connected while in connecting state, transitioning to Home");
          if (this.loadingText) this.loadingText.destroy();
          
          // Transition to Home scene
          this.cameras.main.fadeOut(180, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Home');
          });
          this.connectingWallet = false;
        }
      };
      
      // Handle wallet disconnection
      const handleWalletDisconnected = () => {
        console.log("[StartScene] 'aptos-wallet-disconnected' event received");
        // Handle wallet disconnection if needed
      };
      
      window.addEventListener('aptos-wallet-connected', handleWalletConnected as EventListener);
      window.addEventListener('aptos-wallet-disconnected', handleWalletDisconnected as EventListener);
      
      // Clean up when scene is destroyed
      this.events.once('destroy', () => {
        console.log("[StartScene] Removing wallet event listeners");
        window.removeEventListener('aptos-wallet-connected', handleWalletConnected as EventListener);
        window.removeEventListener('aptos-wallet-disconnected', handleWalletDisconnected as EventListener);
      });
      
      // Debug current global wallet state
      console.log("[StartScene] Current global wallet state:", {
        connected: window.aptosWalletConnected,
        address: window.aptosWalletAddress
      });
    }

    // --- Background ---
    this.createStandardBackground();

    // --- Decorative Parallax Clouds ---
    if (this.textures.exists('2G_bgClouds_2')) {
      CLOUD_POSITIONS.forEach((cfg, i) => {
        const cloud = new bgClouds(this, cfg.x, cfg.y).setDepth(CLOUD_DEPTHS[i]);
        cloud.speed = cfg.speed;
        this.add.existing(cloud);
      });
    }

    // --- UI Elements ---
    this.PLAY_BUTTON = this.add.image(centerX, centerY + 200, 'connect-btn').setScale(0.86);
    this.MAIN_LOGO = this.add.image(centerX, centerY - 120, 'newLogo').setScale(1.74);

    this.events.emit('scene-awake');
    this.cameras.main.fadeIn(180, 0, 0, 0);

    // --- Idle Animations ---
    Animations.floatyIdle(this, this.PLAY_BUTTON, 15);
    this.applyLogoPulse(this.MAIN_LOGO);

    // --- Button Interactivity ---
    this.PLAY_BUTTON.setInteractive({ cursor: 'pointer' });

    // THIS IS THE KEY FIX: Prevent the default transition behavior
    // Flag to control if the scene should transition automatically
    const preventAutoTransition = false; // Set to false to enable transitions for testing

    this.PLAY_BUTTON.on('pointerdown', () => {
      console.log("[StartScene] PLAY_BUTTON clicked");
      // Prevent multiple clicks
      if (this.connectingWallet) {
        console.log("[StartScene] Already connecting to wallet, ignoring click");
        return;
      }
      
      this.tweens.killTweensOf(this.PLAY_BUTTON);
      this.createClickEffect(this.PLAY_BUTTON, () => {
        console.log("[StartScene] Click effect completed, checking wallet connection");
        
        // Debug global variables
        if (typeof window !== 'undefined') {
          console.log("[StartScene] Current global wallet state:", {
            connected: window.aptosWalletConnected,
            address: window.aptosWalletAddress
          });
        }
        
        // Check if already connected first
        if (typeof window !== 'undefined' && window.aptosWalletConnected) {
          console.log("[StartScene] Wallet already connected, transitioning to Home scene");
          this.cameras.main.fadeOut(180, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            if (!preventAutoTransition) {
              this.scene.start('Home');
            } else {
              console.log("[StartScene] Auto transition prevented - wallet already connected");
            }
          });
          return;
        }
        
        // Set connecting state
        this.connectingWallet = true;
        console.log("[StartScene] Connecting wallet flow started");
        
        // Create loading indicator
        this.loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'Connecting Wallet...', {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ffffff'
        }).setOrigin(0.5);
        
        // Add a simple animation to the loading text
        this.tweens.add({
          targets: this.loadingText,
          alpha: 0.5,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
        
        // Dispatch a custom event to trigger wallet connection
        if (typeof window !== 'undefined') {
          console.log("[StartScene] Dispatching wildstrikes-connect-wallet event");
          const connectEvent = new CustomEvent('wildstrikes-connect-wallet');
          window.dispatchEvent(connectEvent);
          
          // Add polling to check wallet connection
          let attempts = 0;
          const maxAttempts = 60; // 30 seconds at 500ms intervals
          
          const checkInterval = setInterval(() => {
            attempts++;
            console.log(`[StartScene] Checking wallet connection (attempt ${attempts}/${maxAttempts})`);
            
            if (window.aptosWalletConnected) {
              console.log("[StartScene] Wallet connected detected via global variable!");
              clearInterval(checkInterval);
              
              if (this.loadingText) this.loadingText.destroy();
              this.connectingWallet = false;
              
              // Transition to Home scene
              this.cameras.main.fadeOut(180, 0, 0, 0);
              this.cameras.main.once('camerafadeoutcomplete', () => {
                if (!preventAutoTransition) {
                  this.scene.start('Home');
                } else {
                  console.log("[StartScene] Auto transition prevented - wallet newly connected");
                }
              });
            }
            
            if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              console.log("[StartScene] Wallet connection timed out after max attempts");
              
              // Only show timeout message if still in connecting state
              if (this.connectingWallet) {
                this.connectingWallet = false;
                
                if (this.loadingText) {
                  this.loadingText.setText('Wallet connection timed out.\nPlease try again.').setOrigin(0.5);
                  // Stop the fading animation
                  this.tweens.killTweensOf(this.loadingText);
                  // Add a fade out after 3 seconds
                  this.time.delayedCall(3000, () => {
                    if (this.loadingText) {
                      this.tweens.add({
                        targets: this.loadingText,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                          if (this.loadingText) this.loadingText.destroy();
                          this.loadingText = null;
                        }
                      });
                    }
                  });
                }
              }
            }
          }, 500);
        }
      });
    });

    this.PLAY_BUTTON.on('pointerover', () => {
      this.tweens.add({
        targets: this.PLAY_BUTTON,
        scaleX: this.PLAY_BUTTON.scaleX * 1.1,
        scaleY: this.PLAY_BUTTON.scaleY * 1.1,
        duration: 300,
        ease: 'Sine.easeOut',
      });
      this.createShimmerEffect(this.PLAY_BUTTON);
    });

    this.PLAY_BUTTON.on('pointerout', () => {
      this.PLAY_BUTTON.clearTint();
      this.tweens.add({
        targets: this.PLAY_BUTTON,
        scaleX: 0.86,
        scaleY: 0.86,
        duration: 300,
        ease: 'Sine.easeOut',
      });
    });
  }

  // Removed custom floaty idle implementation in favour of Animations.floatyIdle

  private applyLogoPulse(logo: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: logo,
      scale: logo.scaleX * 1.02,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createShimmerEffect(button: Phaser.GameObjects.Image): void {
    const colors = [0xffff66, 0xffffff, 0xffe066, 0xffffcc];
    let colorIndex = 0;

    this.time.addEvent({
      delay: 150,
      callback: () => {
        if (!button.active) return;
        button.setTint(colors[colorIndex]);
        colorIndex = (colorIndex + 1) % colors.length;
      },
      repeat: 10,
    });
  }

  private createClickEffect(button: Phaser.GameObjects.Image, callback: () => void): void {
    this.tweens.add({
      targets: button,
      scale: '*=0.85',
      duration: 100,
      ease: 'Bounce.easeIn',
      onComplete: () => {
        this.tweens.add({
          targets: button,
          scale: '*=1.8',
          alpha: 0,
          duration: 400,
          ease: 'Back.easeOut',
          onComplete: callback,
        });
      },
    });
  }
}
