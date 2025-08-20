'use client';

/**
 * Debugging utility to diagnose issues with the wallet connection.
 * This component will display wallet connection information directly in the UI
 * when running in development mode.
 */

import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export default function WalletDebugger() {
  const { connected, account, wallets } = useWallet();
  const [globalState, setGlobalState] = useState({
    aptosWalletConnected: false,
    aptosWalletAddress: undefined as string | undefined
  });

  // Update global state display periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateGlobalState = () => {
      setGlobalState({
        aptosWalletConnected: window.aptosWalletConnected || false,
        aptosWalletAddress: window.aptosWalletAddress
      });
    };

    // Check immediately
    updateGlobalState();
    
    // Then check every second
    const interval = setInterval(updateGlobalState, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        padding: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        fontSize: '12px',
        zIndex: 9999,
        borderRadius: '5px',
        maxWidth: '300px'
      }}
    >
      <h4 style={{ margin: '0 0 5px', color: '#00aaff' }}>Wallet Debugger</h4>
      <div>
        <strong>React state:</strong>
        <ul style={{ margin: '0 0 8px', paddingLeft: '15px' }}>
          <li>Connected: {connected ? 'true' : 'false'}</li>
          <li>Address: {account?.address?.toString() || 'none'}</li>
          <li>Available wallets: {wallets.map(w => w.name).join(', ')}</li>
        </ul>
        <strong>Global variables:</strong>
        <ul style={{ margin: '0', paddingLeft: '15px' }}>
          <li>aptosWalletConnected: {globalState.aptosWalletConnected ? 'true' : 'false'}</li>
          <li>aptosWalletAddress: {globalState.aptosWalletAddress || 'none'}</li>
        </ul>
      </div>
    </div>
  );
}
