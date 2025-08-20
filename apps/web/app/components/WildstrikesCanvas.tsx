'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  useWallet, 
  groupAndSortWallets, 
  WalletItem, 
  AptosPrivacyPolicy,
  AboutAptosConnect
} from '@aptos-labs/wallet-adapter-react';

export default function WildstrikesCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const { account, connected, wallets, notDetectedWallets } = useWallet();
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
    
    // Prevent context menu on the container
    const container = containerRef.current;
    // Ensure container can receive focus for keyboard handling
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '0');
    }
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    container.addEventListener('contextmenu', preventContextMenu);

    // Prevent browser defaults for game combos at capture phase without stopping propagation
    const preventBrowserShortcuts = (e: KeyboardEvent) => {
      const active = (document.activeElement as HTMLElement | null);
      const inContainer = !!active && (active === container || container.contains(active));
      if (!inContainer) return;
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyD' || e.code === 'Space')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventBrowserShortcuts, true);
    window.addEventListener('keyup', preventBrowserShortcuts, true);
    
    // Also prevent on any canvas that gets created
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLCanvasElement) {
            node.addEventListener('contextmenu', preventContextMenu);
          }
        });
      });
    });
    
    observer.observe(container, { childList: true, subtree: true });

    import('@phaser-games/wildstrikes').then(({ default: WildstrikesGame }) => {
      gameInstance = new WildstrikesGame(containerRef.current!);
      setGame(gameInstance);
      
      // Additional prevention after game is created
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', preventContextMenu);
        // Focus the container so keyboard events are scoped here
        container.focus();
      }
    });

    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('keydown', preventBrowserShortcuts, true);
      window.removeEventListener('keyup', preventBrowserShortcuts, true);
      observer.disconnect();
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

  // Education screen renderer for AboutAptosConnect
  const renderEducationScreen = () => {
    return null; // We'll keep this simple for now
  };

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4 relative max-h-screen overflow-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            
            <div className="text-center mb-8">
              {aptosConnectWallets && aptosConnectWallets.length > 0 ? (
                <>
                  <h2 className="text-gray-900 text-xl font-semibold mb-2">Log in or sign up</h2>
                  <p className="text-gray-900 text-lg">with Social + Aptos Connect</p>
                </>
              ) : (
                <h2 className="text-gray-900 text-xl font-semibold mb-2">Connect Wallet</h2>
              )}
            </div>
            
            <AboutAptosConnect renderEducationScreen={renderEducationScreen}>
              {/* Social Login Section - AptosConnect wallets */}
              {aptosConnectWallets && aptosConnectWallets.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-col gap-2 pt-3">
                    {aptosConnectWallets.map((wallet) => (
                      <WalletItem
                        key={wallet.name}
                        wallet={wallet}
                        onConnect={handleCloseModal}
                      >
                        <WalletItem.ConnectButton asChild>
                          <button className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-4 rounded-lg transition-colors bg-white hover:bg-gray-50">
                            <WalletItem.Icon className="h-5 w-5" />
                            <WalletItem.Name className="text-base font-normal" />
                          </button>
                        </WalletItem.ConnectButton>
                      </WalletItem>
                    ))}
                    
                    <p className="flex gap-1 justify-center items-center text-gray-500 text-sm mt-6">
                      Learn more about{' '}
                      <AboutAptosConnect.Trigger className="flex gap-1 py-3 items-center text-gray-700">
                        Aptos Connect →
                      </AboutAptosConnect.Trigger>
                    </p>
                    
                    <AptosPrivacyPolicy className="flex flex-col items-center py-1">
                      <p className="text-xs leading-5 text-center text-gray-500">
                        <AptosPrivacyPolicy.Disclaimer />{' '}
                        <AptosPrivacyPolicy.Link className="text-gray-500 underline underline-offset-4" />
                        <span className="text-gray-500">.</span>
                      </p>
                      <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-gray-500 mt-1" />
                    </AptosPrivacyPolicy>
                    
                    {availableWallets && availableWallets.length > 0 && (
                      <div className="flex items-center gap-3 pt-4 text-gray-500">
                        <div className="h-px w-full bg-gray-300" />
                        Or
                        <div className="h-px w-full bg-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Installed Wallets Section */}
              {availableWallets && availableWallets.length > 0 && (
                <div className="flex flex-col gap-3 pt-3">
                  {availableWallets.map((wallet) => (
                    <WalletItem
                      key={wallet.name}
                      wallet={wallet}
                      onConnect={handleCloseModal}
                      className="flex items-center justify-between px-4 py-3 gap-4 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors bg-white hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <WalletItem.Icon className="h-6 w-6" />
                        <WalletItem.Name className="text-base font-normal text-gray-700" />
                      </div>
                      <WalletItem.ConnectButton asChild>
                        <button className="bg-gray-900 text-white px-4 py-1 rounded text-sm hover:bg-gray-800">
                          Connect
                        </button>
                      </WalletItem.ConnectButton>
                    </WalletItem>
                  ))}
                </div>
              )}
            </AboutAptosConnect>
          </div>
        </div>
      )}
    </div>
  );
}