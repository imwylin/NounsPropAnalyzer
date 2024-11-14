import { useEffect, useState } from 'react';
import styles from './treasury.module.css';
import Layout from '../components/layout/Layout';

interface TokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  balance: string;
  balance_formatted: string;
  usd_price: number | null;
  usd_value: number | null;
  possible_spam: boolean;
  verified_contract: boolean;
  native_token: boolean;
}

interface NativeTransfer {
  from_address: string;
  to_address: string;
  value: string;
  value_formatted: string;
  direction: 'send' | 'receive';
  token_symbol: string;
}

interface Transaction {
  hash: string;
  from_address: string;
  to_address: string;
  block_timestamp: string;
  value: string;
  native_transfers: NativeTransfer[];
  category: string;
  summary: string;
}

export default function Treasury() {
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/treasury');
        const data = await response.json();

        if (!response.ok) throw new Error(data.message);

        // Map the response to our TokenBalance interface
        const validTokens = data.balances
          .filter((token: any) => !token.possible_spam || token.verified_contract)
          .map((token: any) => ({
            token_address: token.token_address,
            symbol: token.symbol,
            name: token.name,
            logo: token.logo,
            decimals: token.decimals,
            balance: token.balance,
            balance_formatted: token.balance_formatted,
            usd_price: token.usd_price,
            usd_value: token.usd_value,
            possible_spam: token.possible_spam,
            verified_contract: token.verified_contract,
            native_token: token.native_token
          }));

        setTokenBalances(validTokens);

        // Map the response to our Transaction interface
        const mappedTransactions = data.transactions.map((tx: any) => ({
          hash: tx.hash,
          from_address: tx.from_address,
          to_address: tx.to_address,
          block_timestamp: tx.block_timestamp,
          value: tx.value,
          native_transfers: tx.native_transfers || [],
          category: tx.category,
          summary: tx.summary
        }));

        setTransactions(mappedTransactions);
        setIsLoading(false);
      } catch (e) {
        console.error(e);
        setError('Failed to fetch treasury data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div>Error: {error}</div></Layout>;

  return (
    <Layout>
      <div className={styles.container}>
        <h1>Nouns DAO Treasury Analysis</h1>
        
        <section className={styles.balances}>
          <h2>Token Balances</h2>
          <div className={styles.balanceGrid}>
            {tokenBalances.map((token) => (
              <div key={token.token_address} className={styles.balanceCard}>
                <div className={styles.tokenHeader}>
                  {token.logo && <img src={token.logo} alt={token.symbol} className={styles.tokenLogo} />}
                  <h3>{token.name} ({token.symbol})</h3>
                </div>
                <p>Balance: {token.balance_formatted}</p>
                {token.usd_value && (
                  <p>Value: ${token.usd_value.toLocaleString()}</p>
                )}
                {token.native_token && <span className={styles.nativeToken}>Native Token</span>}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.transactions}>
          <h2>Recent Transactions</h2>
          <div className={styles.transactionList}>
            {transactions.map((tx) => (
              <div key={tx.hash} className={styles.transactionCard}>
                <h3>{tx.summary}</h3>
                <p>Category: {tx.category}</p>
                <p>Hash: {tx.hash}</p>
                <p>Time: {new Date(tx.block_timestamp).toLocaleString()}</p>
                {tx.native_transfers.map((transfer, index) => (
                  <div key={index} className={styles.transferInfo}>
                    <p>{transfer.direction === 'send' ? 'Sent' : 'Received'}: {transfer.value_formatted} {transfer.token_symbol}</p>
                    <p>{transfer.direction === 'send' ? 'To' : 'From'}: {transfer.direction === 'send' ? transfer.to_address : transfer.from_address}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
} 