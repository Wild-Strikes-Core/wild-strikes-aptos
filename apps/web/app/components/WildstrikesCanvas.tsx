'use client';

import { useEffect, useRef, useState } from 'react';
import { useWallet, groupAndSortWallets } from '@aptos-labs/wallet-adapter-react';

export default function WildstrikesCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const { account, connected, connect, disconnect, wallets, notDetectedWallets } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Group wallets by type using the official utility
  const { aptosConnectWallets, availableWallets } = groupAndSortWallets([
    ...(wallets || []), 
    ...(notDetectedWallets || [])
  ]);

  // Initialize the game
  useEffect(() => {
    if (!containerRef.current) return;
    
    let gameInstance: Phaser.Game | null = null;
    
    import('@phaser-games/wildstrikes').then(({ default: WildstrikesGame }) => {
      gameInstance = new WildstrikesGame(containerRef.current!);
      setGame(gameInstance);
    });

    return () => {
      if (gameInstance) gameInstance.destroy(true);
    };
  }, []);

  // Set up event listeners after the game has been initialized
  useEffect(() => {
    if (!game) return;
    
    // If wallet is already connected, pass the info to the game
    if (connected && account) {
      const address = account.address.toString();
      setWalletAddress(address);
      
      // Set global variables immediately
      if (typeof window !== 'undefined') {
        window.aptosWalletConnected = true;
        window.aptosWalletAddress = address;
      }
    }
    
    // Listen for custom connect wallet events from the Phaser game
    const handleConnectWallet = async () => {
      // Reset wallet connection status (in case of a previous attempt)
      if (typeof window !== 'undefined') {
        window.aptosWalletConnected = false;
        window.aptosWalletAddress = undefined;
      }
      
      if (!connected) {
        // Show the wallet selection modal
        setShowWalletModal(true);
      } else {
        // Ensure global variables are set if wallet is already connected
        if (typeof window !== 'undefined' && account) {
          window.aptosWalletConnected = true;
          window.aptosWalletAddress = account.address.toString();
          
          // Explicitly dispatch the connected event for Phaser
          const walletConnectedEvent = new CustomEvent('aptos-wallet-connected', { 
            detail: { address: account.address.toString() }
          });
          window.dispatchEvent(walletConnectedEvent);
        }
      }
    };
    
    window.addEventListener('wildstrikes-connect-wallet', handleConnectWallet);
    
    return () => {
      window.removeEventListener('wildstrikes-connect-wallet', handleConnectWallet);
    };
  }, [game, connected, account]);

  // Update game when wallet connection changes
  useEffect(() => {
    if (!game) return;
    
    if (connected && account) {
      const address = account.address.toString();
      // Only update if the address has changed
      if (walletAddress !== address) {
        setWalletAddress(address);
        
        // Set global variables for Phaser game to access
        if (typeof window !== 'undefined') {
          window.aptosWalletConnected = true;
          window.aptosWalletAddress = address;
        }
        
        // Dispatch a custom event that Phaser can listen for
        if (typeof window !== 'undefined') {
          const walletConnectedEvent = new CustomEvent('aptos-wallet-connected', { 
            detail: { address }
          });
          window.dispatchEvent(walletConnectedEvent);
        }
      }
    } else if (!connected && walletAddress !== null) {
      setWalletAddress(null);
      
      // Clear global variables
      if (typeof window !== 'undefined') {
        window.aptosWalletConnected = false;
        window.aptosWalletAddress = undefined;
      }
      
      // Dispatch a custom event that Phaser can listen for
      if (typeof window !== 'undefined') {
        const walletDisconnectedEvent = new CustomEvent('aptos-wallet-disconnected');
        window.dispatchEvent(walletDisconnectedEvent);
      }
    }
  }, [game, connected, account, walletAddress]);

  const handleWalletSelect = async (walletName: string) => {
    try {
      // If already connected, disconnect first to ensure fresh authentication
      if (connected) {
        await disconnect();
      }
      
      // Connect to the selected wallet, which will prompt for authentication
      await connect(walletName);
      setShowWalletModal(false);
    } catch (error) {
      console.log("Wallet connection failed:", error);
      // Don't close the modal on error, let user try again
    }
  };

  const handleCloseModal = () => {
    setShowWalletModal(false);
    
    // Reset global variables to indicate connection was cancelled
    if (typeof window !== 'undefined') {
      window.aptosWalletConnected = false;
      window.aptosWalletAddress = undefined;
      
      // Dispatch event to notify Phaser that connection was cancelled
      const cancelEvent = new CustomEvent('aptos-wallet-connection-cancelled');
      window.dispatchEvent(cancelEvent);
    }
  };

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-semibold">Connect Wallet</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Social Login Section - AptosConnect wallets */}
            {aptosConnectWallets && aptosConnectWallets.length > 0 && (
              <div className="mb-4">
                <h3 className="text-gray-300 text-sm font-medium mb-3">SOCIAL LOGIN</h3>
                <div className="space-y-2">
                  {aptosConnectWallets.map((wallet) => (
                    <button
                      key={wallet.name}
                      onClick={() => handleWalletSelect(wallet.name)}
                      className="w-full flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                        {wallet.name.includes('Google') ? (
                          <span className="text-gray-800 font-bold text-sm">G</span>
                        ) : wallet.name.includes('Apple') ? (
                          <span className="text-gray-800 font-bold text-sm">🍎</span>
                        ) : (
                          <span className="text-gray-800 font-bold text-sm">A</span>
                        )}
                      </div>
                      {wallet.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Installed Wallets Section */}
            {availableWallets && availableWallets.length > 0 && (
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-3">INSTALLED WALLETS</h3>
                <div className="space-y-2">
                  {availableWallets.map((wallet) => (
                    <button
                      key={wallet.name}
                      onClick={() => handleWalletSelect(wallet.name)}
                      className="w-full flex items-center gap-3 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {wallet.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {wallet.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}