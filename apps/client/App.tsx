import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "@game-core/PhaserGame";
import { WalletProvider } from "@web3/WalletProvider";
import { WalletConnection } from "@web3/WalletConnection";
import { WalletPhaserSync } from "@web3/WalletPhaserSync";

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

