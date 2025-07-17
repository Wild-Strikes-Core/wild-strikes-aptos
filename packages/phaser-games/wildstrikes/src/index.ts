import * as Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { BootScene } from './scenes/BootScene';
import { StartScene } from './scenes/StartScene';
import { HomeScene } from './scenes/HomeScene';
import MatchmakingScene from './scenes/MatchmakingScene';
import MatchFoundScene from './scenes/MatchFoundScene';
import ArenaScene from './scenes/ArenaScene';
import { MainGameScene } from './scenes/MainGameScene';
import VictoryScene from './scenes/VictoryScene';
import DefeatScene from './scenes/DefeatScene';
import { GameOverScene } from './scenes/GameOverScene';

class WildstrikesGame extends Phaser.Game {
  constructor(container: HTMLElement) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1920,
      height: 1080,
      pixelArt: true,
      parent: container,
      scene: [
        BootScene,
        StartScene,
        HomeScene,
        MatchmakingScene,
        MatchFoundScene,
        ArenaScene,
        MainGameScene,
        VictoryScene,
        DefeatScene,
        GameOverScene,
        MainScene,
      ],
      transparent: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          fps: 60,
          debug: true,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };
    super(config);
  }
}

export default WildstrikesGame; 