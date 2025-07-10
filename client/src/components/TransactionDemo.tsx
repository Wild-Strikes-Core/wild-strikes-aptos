import React, { useState } from "react";
import { useAptosWallet } from "../hooks/useAptosWallet";

export const TransactionDemo: React.FC = () => {
  const { 
    account, 
    connected, 
    transferAPT, 
    executeMoveFunction, 
    callViewFunction, 
    getAccountBalance,
    getTransactionHistory 
  } = useAptosWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const handleGetBalance = async () => {
    if (!connected) return;
    
    setLoading(true);
    try {
      const balance = await getAccountBalance();
      setBalance(balance);
    } catch (error) {
      console.error("Error getting balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!connected || !recipient || !amount) return;
    
    setLoading(true);
    try {
      // Convert amount to octas (1 APT = 100000000 octas)
      const amountInOctas = parseInt(amount) * 100000000;
      await transferAPT(recipient, amountInOctas);
      alert("Transfer successful!");
      
      // Refresh balance
      await handleGetBalance();
    } catch (error) {
      console.error("Error transferring APT:", error);
      alert("Transfer failed: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTransactions = async () => {
    if (!connected) return;
    
    setLoading(true);
    try {
      const txHistory = await getTransactionHistory(5);
      setTransactions(txHistory || []);
    } catch (error) {
      console.error("Error getting transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallViewFunction = async () => {
    setLoading(true);
    try {
      // Example: Get account balance using view function
      const result = await callViewFunction(
        "0x1::coin::balance" as `${string}::${string}::${string}`,
        [account?.address],
        ["0x1::aptos_coin::AptosCoin"]
      );
      console.log("View function result:", result);
    } catch (error) {
      console.error("Error calling view function:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="transaction-demo">
        <h3>Connect wallet to try transactions</h3>
      </div>
    );
  }

  return (
    <div className="transaction-demo">
      <h3>Wallet Transaction Demo</h3>
      
      <div className="demo-section">
        <h4>Account Balance</h4>
        <button onClick={handleGetBalance} disabled={loading}>
          {loading ? "Loading..." : "Get Balance"}
        </button>
        {balance !== null && (
          <p>Balance: {balance / 100000000} APT</p>
        )}
      </div>

      <div className="demo-section">
        <h4>Transfer APT</h4>
        <input
          type="text"
          placeholder="Recipient address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount (APT)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleTransfer} disabled={loading || !recipient || !amount}>
          {loading ? "Sending..." : "Transfer"}
        </button>
      </div>

      <div className="demo-section">
        <h4>Transaction History</h4>
        <button onClick={handleGetTransactions} disabled={loading}>
          {loading ? "Loading..." : "Get Transactions"}
        </button>
        {transactions.length > 0 && (
          <div className="transactions-list">
            {transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <p>Hash: {tx.hash}</p>
                <p>Type: {tx.type}</p>
                <p>Status: {tx.success ? "Success" : "Failed"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="demo-section">
        <h4>Call View Function</h4>
        <button onClick={handleCallViewFunction} disabled={loading}>
          {loading ? "Loading..." : "Call View Function"}
        </button>
      </div>
    </div>
  );
};
