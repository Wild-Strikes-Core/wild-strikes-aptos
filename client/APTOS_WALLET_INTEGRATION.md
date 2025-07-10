# Aptos Wallet Integration

This project now includes complete Aptos wallet integration, replacing the previous Rainbow Kit/Ethereum implementation.

## Features

- **Wallet Connection**: Connect to various Aptos wallets (Petra, Martian, etc.)
- **Multi-wallet Support**: Support for browser extension wallets and social login options
- **Phaser Integration**: Wallet status reflected in the game UI
- **TypeScript Support**: Fully typed implementation with proper error handling
- **Mobile Support**: Deep linking support for mobile wallets

## Components

### WalletProvider
Wraps the entire application with Aptos wallet context.

### WalletConnection
Main wallet connection component with:
- Wallet selector modal
- Connected wallet display
- Disconnect functionality
- Support for both installed and installable wallets

### useAptosWallet Hook
Custom hook that provides:
- Core wallet functions (connect, disconnect, sign transactions)
- Helper functions (getAccountBalance, transferAPT, etc.)
- Aptos client instance for direct API calls

## Usage Examples

### Basic Wallet Connection
```typescript
import { useAptosWallet } from "./hooks/useAptosWallet";

const { connect, disconnect, account, connected } = useAptosWallet();

// Connect to a specific wallet
await connect("Petra");

// Disconnect
await disconnect();
```

### Transfer APT
```typescript
const { transferAPT } = useAptosWallet();

// Transfer 1 APT (amount in octas)
await transferAPT("0x1234...", 100000000);
```

### Execute Move Function
```typescript
const { executeMoveFunction } = useAptosWallet();

await executeMoveFunction(
  "0x1::aptos_account::transfer",
  ["0x1234...", 100000000]
);
```

### Call View Function
```typescript
const { callViewFunction } = useAptosWallet();

const result = await callViewFunction(
  "0x1::coin::balance",
  ["0x1234..."],
  ["0x1::aptos_coin::AptosCoin"]
);
```

## Network Configuration

The wallet is currently configured for **TESTNET**. To change to mainnet:

1. Update `WalletProvider.tsx`:
```typescript
dappConfig={{
  network: Network.MAINNET,
}}
```

2. Update `useAptosWallet.ts`:
```typescript
const config = new AptosConfig({ network: Network.MAINNET });
```

## Supported Wallets

- **Petra Wallet**: Chrome extension
- **Martian Wallet**: Chrome extension
- **Nightly Wallet**: Chrome extension
- **Aptos Connect**: Social login wallets
- **Other AIP-62 compliant wallets**

## Installation

The following packages are required:
```bash
npm install @aptos-labs/wallet-adapter-react @aptos-labs/ts-sdk
```

## Game Integration

The wallet status is automatically reflected in the Phaser game:
- **Disconnected**: Shows "Connect Wallet" in the player name area
- **Connected**: Shows shortened wallet address
- **Real-time Updates**: Wallet changes are immediately reflected in the game

## Transaction Demo

A transaction demo component is included to test wallet functionality:
- Get account balance
- Transfer APT to another address
- View transaction history
- Call view functions

## Security Notes

- Always validate user inputs before executing transactions
- Use testnet for development and testing
- Implement proper error handling for production use
- Consider implementing transaction confirmation dialogs

## Troubleshooting

### Common Issues

1. **Wallet not detected**: Make sure the wallet extension is installed and enabled
2. **Connection failed**: Check network configuration and wallet permissions
3. **Transaction failed**: Verify account has sufficient balance and correct permissions

### Development Tips

- Use the browser console to debug wallet connection issues
- Check the network tab for API call errors
- Ensure the wallet is unlocked and connected to the correct network

## Migration from Rainbow Kit

If you previously used Rainbow Kit, you can now remove these dependencies:
- `@rainbow-me/rainbowkit`
- `wagmi`
- `viem`
- `@tanstack/react-query`

The new Aptos implementation provides similar functionality with better integration for Aptos-based applications.
