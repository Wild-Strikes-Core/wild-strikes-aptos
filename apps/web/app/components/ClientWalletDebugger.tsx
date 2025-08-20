'use client';

import dynamic from 'next/dynamic';

// This is a client component that can use dynamic imports with ssr: false
const WalletDebugger = dynamic(() => import('./WalletDebugger'), { 
  ssr: false,
  loading: () => null // Don't show loading state for the debugger
});

export default function ClientWalletDebugger() {
  return <WalletDebugger />;
}
