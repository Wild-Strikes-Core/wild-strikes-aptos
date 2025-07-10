// Utility functions to bridge React and Phaser
export class WalletPhaserBridge {
  private static instance: WalletPhaserBridge;
  private scene: Phaser.Scene | null = null;

  private constructor() {}

  static getInstance(): WalletPhaserBridge {
    if (!WalletPhaserBridge.instance) {
      WalletPhaserBridge.instance = new WalletPhaserBridge();
    }
    return WalletPhaserBridge.instance;
  }

  setScene(scene: Phaser.Scene) {
    this.scene = scene;
  }

  updatePlayerName(name: string) {
    if (this.scene && this.scene.scene.key === "Home") {
      const homeScene = this.scene as any;
      if (homeScene.PLAYER_NAME) {
        homeScene.PLAYER_NAME.setText(name);
      }
    }
  }

  updatePlayerAddress(address: string) {
    if (this.scene && this.scene.scene.key === "Home") {
      const homeScene = this.scene as any;
      if (homeScene.PLAYER_NAME) {
        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        homeScene.PLAYER_NAME.setText(shortAddress);
      }
    }
  }

  showWalletConnected() {
    if (this.scene && this.scene.scene.key === "Home") {
      const homeScene = this.scene as any;
      if (homeScene.PLAYER_NAME) {
        homeScene.PLAYER_NAME.setText("Wallet Connected");
      }
    }
  }

  showWalletDisconnected() {
    if (this.scene && this.scene.scene.key === "Home") {
      const homeScene = this.scene as any;
      if (homeScene.PLAYER_NAME) {
        homeScene.PLAYER_NAME.setText("Connect Wallet");
      }
    }
  }
}

// Global instance
export const walletPhaserBridge = WalletPhaserBridge.getInstance();
