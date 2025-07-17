// bg-clouds component that creates moving cloud sprites for game scenes
export default class bgClouds extends Phaser.GameObjects.Image {
  public speed: number = 50;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Create a cloud sprite using the cloud texture
    super(scene, x, y, '2G_bgClouds_1');
    
    // Set initial properties
    this.setOrigin(0.5, 0.5);
    this.setScale(1);
    this.setAlpha(0.7);
    
    // Add to scene
    scene.add.existing(this);
  }
  
  preUpdate(time: number, delta: number) {
    // Move clouds to the left
    this.x -= this.speed * (delta / 1000);
    
    // Reset position when cloud moves off screen
    if (this.x < -this.width) {
      this.x = 1920 + this.width; // Reset to right side of screen
    }
  }
} 