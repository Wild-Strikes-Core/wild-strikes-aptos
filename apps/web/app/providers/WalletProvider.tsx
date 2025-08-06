'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { PropsWithChildren } from 'react';

export const WalletProvider = ({ children }: PropsWithChildren) => {
  // Get the origin for AptosConnect configuration
  let dappImageURI: string | undefined;
  if (typeof window !== "undefined") {
    dappImageURI = `${window.location.origin}/aptos-favicon.ico`;
  }

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.TESTNET,
        // Configure AptosConnect
        aptosConnect: {
          dappImageURI
        },
      }}
      // Only include Petra and AptosConnect will be included by default
      optInWallets={["Petra"]}
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
