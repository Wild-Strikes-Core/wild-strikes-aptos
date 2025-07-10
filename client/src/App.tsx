import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import { WalletProvider } from "./components/WalletProvider";
import { WalletConnection } from "./components/WalletConnection";
import { WalletPhaserSync } from "./components/WalletPhaserSync";

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const currentScene = (scene: Phaser.Scene) => {};

    return (
        <WalletProvider>
            <div id="app">
                <WalletPhaserSync />
                <div style={{ position: "absolute", top: 20, right: 20, zIndex: 1000 }}>
                    <WalletConnection />
                </div>
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            </div>
        </WalletProvider>
    );
}

export default App;

