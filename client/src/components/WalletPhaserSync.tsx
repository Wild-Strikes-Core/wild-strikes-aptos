import { useEffect } from "react";
import { useAptosWallet } from "../hooks/useAptosWallet";
import { walletPhaserBridge } from "../utils/walletPhaserBridge";

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
