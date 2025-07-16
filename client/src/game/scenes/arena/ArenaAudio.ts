export class ArenaAudio {
    private scene: Phaser.Scene;
    private currentBackgroundMusic: Phaser.Sound.BaseSound | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public startBackgroundMusic(musicKey: string): void {
        // Stop any existing background music
        if (this.currentBackgroundMusic) {
            this.currentBackgroundMusic.stop();
            this.currentBackgroundMusic = null;
        }
        
        // Start new background music
        try {
            this.currentBackgroundMusic = this.scene.sound.add(musicKey, {
                loop: true,
                volume: 0.5
            });
            this.currentBackgroundMusic.play();
            console.log(`Background music started: ${musicKey}`);
        } catch (error) {
            console.error(`Failed to start background music: ${musicKey}`, error);
        }
    }

    public stopBackgroundMusic(): void {
        if (this.currentBackgroundMusic) {
            this.currentBackgroundMusic.stop();
            this.currentBackgroundMusic = null;
            console.log("Background music stopped");
        }
    }

    public playSound(soundKey: string, volume: number = 1.0): void {
        try {
            const sound = this.scene.sound.add(soundKey, { volume });
            sound.play();
        } catch (error) {
            console.error(`Failed to play sound: ${soundKey}`, error);
        }
    }

    public playHitSound(): void {
        this.playSound("player-hit", 0.8);
    }

    public playAttackSound(): void {
        this.playSound("Attack", 0.6);
    }

    public playGameOverSound(): void {
        this.playSound("game-over", 1.0);
    }

    public getCurrentBackgroundMusic(): Phaser.Sound.BaseSound | null {
        return this.currentBackgroundMusic;
    }

    public destroy(): void {
        this.stopBackgroundMusic();
    }
}
