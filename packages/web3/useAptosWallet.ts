import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Initialize Aptos client
const config = new AptosConfig({ network: Network.TESTNET }); // Change to MAINNET for production
const aptos = new Aptos(config);

export const useAptosWallet = () => {
  const walletContext = useWallet();

  const {
    connect,
    disconnect,
    account,
    connected,
    wallet,
    signAndSubmitTransaction,
    signTransaction,
    signMessage,
    signMessageAndVerify,
    changeNetwork,
    network,
    isLoading,
    wallets,
  } = walletContext;

  // Helper function to get account balance
  const getAccountBalance = async () => {
    if (!account) return null;
    try {
      const balance = await aptos.getAccountAPTAmount({
        accountAddress: account.address,
      });
      return balance;
    } catch (error) {
      console.error("Error fetching account balance:", error);
      return null;
    }
  };

  // Helper function to get account resources
  const getAccountResources = async () => {
    if (!account) return null;
    try {
      const resources = await aptos.getAccountResources({
        accountAddress: account.address,
      });
      return resources;
    } catch (error) {
      console.error("Error fetching account resources:", error);
      return null;
    }
  };

  // Helper function to transfer APT
  const transferAPT = async (to: string, amount: number) => {
    if (!account) throw new Error("No account connected");
    
    try {
      const transaction = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [to, amount],
        },
      });
      
      // Wait for transaction to be confirmed
      const confirmedTransaction = await aptos.waitForTransaction({
        transactionHash: transaction.hash,
      });
      
      return confirmedTransaction;
    } catch (error) {
      console.error("Error transferring APT:", error);
      throw error;
    }
  };

  // Helper function to execute a Move function
  const executeMoveFunction = async (
    functionName: `${string}::${string}::${string}`,
    functionArguments: any[] = [],
    typeArguments: string[] = []
  ) => {
    if (!account) throw new Error("No account connected");
    
    try {
      const transaction = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: functionName,
          functionArguments,
          typeArguments,
        },
      });
      
      // Wait for transaction to be confirmed
      const confirmedTransaction = await aptos.waitForTransaction({
        transactionHash: transaction.hash,
      });
      
      return confirmedTransaction;
    } catch (error) {
      console.error("Error executing Move function:", error);
      throw error;
    }
  };

  // Helper function to call a view function
  const callViewFunction = async (
    functionName: `${string}::${string}::${string}`,
    functionArguments: any[] = [],
    typeArguments: string[] = []
  ) => {
    try {
      const result = await aptos.view({
        payload: {
          function: functionName,
          functionArguments,
          typeArguments,
        },
      });
      
      return result;
    } catch (error) {
      console.error("Error calling view function:", error);
      throw error;
    }
  };

  // Helper function to get transaction history
  const getTransactionHistory = async (limit: number = 10) => {
    if (!account) return null;
    
    try {
      const transactions = await aptos.getAccountTransactions({
        accountAddress: account.address,
        options: {
          limit,
        },
      });
      
      return transactions;
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return null;
    }
  };

  return {
    // Core wallet functions
    connect,
    disconnect,
    account,
    connected,
    wallet,
    signAndSubmitTransaction,
    signTransaction,
    signMessage,
    signMessageAndVerify,
    changeNetwork,
    network,
    isLoading,
    wallets,
    
    // Helper functions
    getAccountBalance,
    getAccountResources,
    transferAPT,
    executeMoveFunction,
    callViewFunction,
    getTransactionHistory,
    
    // Aptos client instance
    aptos,
  };
};
