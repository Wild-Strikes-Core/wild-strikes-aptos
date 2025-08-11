import * as Phaser from 'phaser';
import { BootScene } from './scenes/menu/BootScene';
import { StartScene } from './scenes/menu/StartScene';
import { HomeScene } from './scenes/menu/HomeScene';
import MatchmakingScene from './scenes/menu/MatchmakingScene';
import MatchFoundScene from './scenes/menu/MatchFoundScene';
import VictoryScene from './scenes/arena/arenas/pvp/core/VictoryScene';
import DefeatScene from './scenes/arena/arenas/pvp/core/DefeatScene';
import ArenaScene from './scenes/arena/arenas/pvp/core/ArenaSceneFALSE';
import StartMenuScene from './scenes/menu/StartMenuScene';
import { TestMapScene } from './scenes/arena/arenas/pvp/core/TestMapScene';
import TestMapSceneMultiplayer from './scenes/arena/arenas/pvp/core/TestMapSceneMultiplayer';

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
        StartMenuScene,
        HomeScene,
        MatchmakingScene,
        MatchFoundScene,
        ArenaScene,
        VictoryScene,
        DefeatScene,
        TestMapScene,
        TestMapSceneMultiplayer,
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