import { useEffect } from "react";
import { useAptosWallet } from "./useAptosWallet";
import { walletPhaserBridge } from "./walletPhaserBridge";

export const WalletPhaserSync: React.FC = () => {
  const { account, connected, wallet } = useAptosWallet();

  useEffect(() => {
    if (connected && account) {
      // Update Phaser scene with wallet info
      walletPhaserBridge.updatePlayerAddress(account.address.toString());
    } else {
      // Show disconnected state
      walletPhaserBridge.showWalletDisconnected();
    }
  }, [connected, account, wallet]);

  return null; // This component doesn't render anything
};
