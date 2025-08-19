'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { PropsWithChildren } from 'react';

export const WalletProvider = ({ children }: PropsWithChildren) => {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.TESTNET,
        aptosConnect: { 
          dappId: "wildstrikes-game"
        },
      }}
      onError={(error) => {
        // Filter out user rejections which aren't actually errors
        if (error && typeof error === 'string' && !error.includes('User has rejected')) {
          console.log("Wallet adapter error:", error);
        } else if (error && typeof error === 'object' && error.message && 
                  !error.message.toString().includes('User has rejected')) {
          console.log("Wallet adapter error:", error.message);
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
