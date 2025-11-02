/* eslint-disable prettier/prettier */
'use client';

import { B3Provider } from '@b3dotfun/sdk';
import { ReactNode } from 'react';

const B3_PROJECT_ID = process.env.NEXT_PUBLIC_B3_PROJECT_ID!;
const B3_API_KEY = process.env.NEXT_PUBLIC_B3_API_KEY!;

if (!B3_PROJECT_ID || !B3_API_KEY) {
  throw new Error('B3_PROJECT_ID and B3_API_KEY must be set in .env.local');
}

export function B3WalletProvider({ children }: { children: ReactNode }) {
  return (
    <B3Provider
      config={{
        apiKey: B3_API_KEY,
        projectId: B3_PROJECT_ID,
        socials: [
          'google',
          'apple',
          'twitter',
          'discord',
          'farcaster',
        ],
        wallets: [
          'metamask',
          'walletconnect',
        ],
        network: 'testnet',
      }}
    >
      {children}
    </B3Provider>
  );
}
