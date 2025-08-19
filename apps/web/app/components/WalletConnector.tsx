'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState, useEffect } from 'react';

export function WalletConnector({ onConnected }: { onConnected?: (address: string) => void }) {
  const { connect, disconnect, account, connected } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  // Call onConnected callback when wallet connects
  useEffect(() => {
    // Only call onConnected when the wallet actually connects (not on every render)
    if (connected && account && onConnected) {
      const address = account.address.toString();
      // Use a local state to track if we've already called onConnected for this address
      // This prevents multiple calls with the same address
      const addressKey = `${address}`;
      const lastConnectedAddress = localStorage.getItem('lastConnectedAddress');
      
      if (lastConnectedAddress !== addressKey) {
        localStorage.setItem('lastConnectedAddress', addressKey);
        onConnected(address);
      }
    }
  }, [connected, account, onConnected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Try to connect to Petra first
      await connect('Petra');
    } catch (error: any) {
      // Only show error and try AptosConnect if user hasn't rejected the request
      if (error?.message?.includes('User has rejected the request')) {
        console.log("User rejected Petra wallet connection");
      } else {
        console.log("Failed to connect to Petra, trying AptosConnect");
        try {
          await connect('AptosConnect');
        } catch (secondError: any) {
          // Don't log detailed error for user rejections
          if (secondError?.message?.includes('User has rejected')) {
            console.log("User rejected AptosConnect wallet connection");
          } else {
            console.log("Failed to connect to any wallet");
          }
        }
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet", error);
    }
  };

  return (
    <div>
      {connected && account ? (
        <div className="flex flex-col items-center gap-2">
          <div>Connected: {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}</div>
          <button 
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}
