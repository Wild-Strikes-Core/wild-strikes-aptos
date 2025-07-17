import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import Home from "./scenes/Home";
import { AUTO, Game } from "phaser";
import Preloader from "./scenes/Preloader";
import Start from "./scenes/Start";
import Matchmaking from "./scenes/Matchmaking";
import MatchFound from "./scenes/MatchFound";
import Arena from "./scenes/Arena";
import Defeat from "./scenes/Defeat";
import Victory from "./scenes/Victory";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1920,
    height: 1080,
    pixelArt: true,
    parent: "game-container",
    backgroundColor: "#000000", // Changed to black since we have background images
    physics: {
        default: "arcade",
        arcade: {
            gravity: {
                x: 0,
                y: 0,
            },
            fps: 60,
            debug: true,
        },
    },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
        Boot,
        Preloader,
        Start,
        Home,
        MainGame,
        GameOver,
        Victory,
        Defeat,
        Matchmaking,
        MatchFound,
        Arena,
    ],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;

