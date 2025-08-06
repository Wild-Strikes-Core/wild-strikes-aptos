'use client';

import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export default function WildstrikesCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const { account, connected } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null); // Used to track current wallet address

  // No need for handleWalletConnected since we're using the PLAY_BUTTON directly

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
  const { connect } = useWallet();
  
  useEffect(() => {
    if (!game) return;
    
    console.log("[WildstrikesCanvas] Game initialized, setting up event listeners");
    
    // Debug current wallet state
    console.log("[WildstrikesCanvas] Current wallet state:", {
      connected,
      accountAddress: account?.address?.toString(),
      walletAddress
    });
    
    // If wallet is already connected, pass the info to the game
    if (connected && account) {
      const address = account.address.toString();
      setWalletAddress(address);
      console.log("[WildstrikesCanvas] Wallet already connected:", address);
      
      // Set global variables immediately
      if (typeof window !== 'undefined') {
        console.log("[WildstrikesCanvas] Setting global variables for already connected wallet");
        window.aptosWalletConnected = true;
        window.aptosWalletAddress = address;
      }
    }
    
    // Listen for custom connect wallet events from the Phaser game
    const handleConnectWallet = async () => {
      console.log("[WildstrikesCanvas] 'wildstrikes-connect-wallet' event received");
      
      // Reset wallet connection status (in case of a previous attempt)
      if (typeof window !== 'undefined') {
        window.aptosWalletConnected = false;
        window.aptosWalletAddress = undefined;
        console.log("[WildstrikesCanvas] Reset global wallet variables");
      }
      
      if (!connected) {
        console.log("[WildstrikesCanvas] Wallet not connected, attempting to connect");
        try {
          console.log("[WildstrikesCanvas] Attempting to connect to Petra wallet...");
          // Try to connect to Petra first
          await connect('Petra');
          console.log("[WildstrikesCanvas] Successfully connected to Petra wallet");
          
          // No need to manually set global variables here - this will be handled by the wallet connection change effect
        } catch (error: any) {
          console.log("[WildstrikesCanvas] Petra connection error:", error?.message || error);
          
          // Only try AptosConnect if not a user rejection
          if (!error?.message?.includes('User has rejected the request')) {
            console.log("[WildstrikesCanvas] Failed to connect to Petra, trying AptosConnect");
            try {
              await connect('AptosConnect');
              console.log("[WildstrikesCanvas] Successfully connected to AptosConnect");
              
              // No need to manually set global variables here - this will be handled by the wallet connection change effect
            } catch (secondError: any) {
              console.log("[WildstrikesCanvas] Failed to connect to AptosConnect:", secondError?.message || secondError);
              // Reset the global variables if all connections fail
              if (typeof window !== 'undefined') {
                window.aptosWalletConnected = false;
                window.aptosWalletAddress = undefined;
                console.log("[WildstrikesCanvas] Reset global variables after connection failure");
              }
            }
          } else {
            console.log("[WildstrikesCanvas] User rejected Petra wallet connection");
            // Reset the global variables if connection is rejected
            if (typeof window !== 'undefined') {
              window.aptosWalletConnected = false;
              window.aptosWalletAddress = undefined;
              console.log("[WildstrikesCanvas] Reset global variables after user rejection");
            }
          }
        }
      } else {
        console.log("[WildstrikesCanvas] Wallet already connected:", account?.address.toString());
        // Ensure global variables are set if wallet is already connected
        if (typeof window !== 'undefined' && account) {
          window.aptosWalletConnected = true;
          window.aptosWalletAddress = account.address.toString();
          console.log("[WildstrikesCanvas] Updated global variables for already connected wallet");
          
          // Explicitly dispatch the connected event for Phaser
          const walletConnectedEvent = new CustomEvent('aptos-wallet-connected', { 
            detail: { address: account.address.toString() }
          });
          window.dispatchEvent(walletConnectedEvent);
          console.log("[WildstrikesCanvas] Dispatched aptos-wallet-connected event");
        }
      }
    };
    
    console.log("[WildstrikesCanvas] Adding event listener for 'wildstrikes-connect-wallet'");
    window.addEventListener('wildstrikes-connect-wallet', handleConnectWallet);
    
    return () => {
      console.log("[WildstrikesCanvas] Removing event listener for 'wildstrikes-connect-wallet'");
      window.removeEventListener('wildstrikes-connect-wallet', handleConnectWallet);
    };
  }, [game, connected, account, connect, walletAddress]);

  // Update game when wallet connection changes
  useEffect(() => {
    // Only run this effect if the game instance exists
    if (!game) return;
    
    console.log("[WildstrikesCanvas] Wallet connection change detected:", {
      connected,
      accountAddress: account?.address?.toString(),
      previousWalletAddress: walletAddress
    });
    
    if (connected && account) {
      const address = account.address.toString();
      // Only update if the address has changed
      if (walletAddress !== address) {
        setWalletAddress(address);
        
        // Set global variables for Phaser game to access
        if (typeof window !== 'undefined') {
          console.log("[WildstrikesCanvas] Setting global wallet connection variables - connected:", address);
          window.aptosWalletConnected = true;
          window.aptosWalletAddress = address;
          
          // Debug global state after update
          console.log("[WildstrikesCanvas] Global wallet state after update:", {
            connected: window.aptosWalletConnected,
            address: window.aptosWalletAddress
          });
        }
        
        console.log("[WildstrikesCanvas] Wallet connection updated:", address);
        
        // Dispatch a custom event that Phaser can listen for
        if (typeof window !== 'undefined') {
          console.log("[WildstrikesCanvas] Dispatching aptos-wallet-connected event");
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
        console.log("[WildstrikesCanvas] Clearing global wallet connection variables");
        window.aptosWalletConnected = false;
        window.aptosWalletAddress = undefined;
        
        // Debug global state after update
        console.log("[WildstrikesCanvas] Global wallet state after disconnect:", {
          connected: window.aptosWalletConnected,
          address: window.aptosWalletAddress
        });
      }
      
      console.log("[WildstrikesCanvas] Wallet disconnected");
      
      // Dispatch a custom event that Phaser can listen for
      if (typeof window !== 'undefined') {
        console.log("[WildstrikesCanvas] Dispatching aptos-wallet-disconnected event");
        const walletDisconnectedEvent = new CustomEvent('aptos-wallet-disconnected');
        window.dispatchEvent(walletDisconnectedEvent);
      }
    }
  }, [game, connected, account, walletAddress]);

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* No overlay UI - using PLAY_BUTTON in Phaser game instead */}
    </div>
  );
} 