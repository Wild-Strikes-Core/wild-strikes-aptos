import React, { useState } from "react";
import { useWallet, groupAndSortWallets } from "@aptos-labs/wallet-adapter-react";

export const WalletConnection: React.FC = () => {
  const { 
    connect, 
    disconnect, 
    account, 
    connected, 
    wallet, 
    wallets = [],
    isLoading 
  } = useWallet();

  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);

  // Group wallets by type
  const { aptosConnectWallets, availableWallets, installableWallets } = groupAndSortWallets(wallets);

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setIsWalletSelectorOpen(false);
    } catch (error) {
      console.error("Failed to connect to wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect from wallet:", error);
    }
  };

  const WalletSelector = () => (
    <div className="wallet-selector">
      <div className="wallet-selector-backdrop" onClick={() => setIsWalletSelectorOpen(false)}>
        <div className="wallet-selector-modal" onClick={(e) => e.stopPropagation()}>
          <div className="wallet-selector-header">
            <h3>Connect Wallet</h3>
            <button 
              onClick={() => setIsWalletSelectorOpen(false)}
              className="close-button"
            >
              ✕
            </button>
          </div>
          
          <div className="wallet-list">
            {/* Aptos Connect Wallets (Social Login) */}
            {aptosConnectWallets.length > 0 && (
              <div className="wallet-group">
                <h4>Social Login</h4>
                {aptosConnectWallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    className="wallet-button"
                    disabled={isLoading}
                  >
                    <img src={wallet.icon} alt={wallet.name} className="wallet-icon" />
                    <span>{wallet.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Available Wallets (Installed) */}
            {availableWallets.length > 0 && (
              <div className="wallet-group">
                <h4>Installed Wallets</h4>
                {availableWallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    className="wallet-button"
                    disabled={isLoading}
                  >
                    <img src={wallet.icon} alt={wallet.name} className="wallet-icon" />
                    <span>{wallet.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Installable Wallets (Not installed) */}
            {installableWallets.length > 0 && (
              <div className="wallet-group">
                <h4>More Wallets</h4>
                {installableWallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => window.open(wallet.url, '_blank')}
                    className="wallet-button installable"
                  >
                    <img src={wallet.icon} alt={wallet.name} className="wallet-icon" />
                    <span>{wallet.name}</span>
                    <span className="install-label">Install</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (connected && account) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <img src={wallet?.icon} alt={wallet?.name} className="wallet-icon-small" />
          <div className="account-info">
            <span className="wallet-name">{wallet?.name}</span>
            <span className="account-address">
              {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
            </span>
          </div>
        </div>
        <button onClick={handleDisconnect} className="disconnect-button">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsWalletSelectorOpen(true)}
        className="connect-wallet-button"
        disabled={isLoading}
      >
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </button>
      
      {isWalletSelectorOpen && <WalletSelector />}
    </>
  );
};
