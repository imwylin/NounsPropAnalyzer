import { NounTransaction } from '../utils/types';
import { safeFormatAmount } from '../utils/transactions';
import styles from './AuctionHouseFeed.module.css';

interface AuctionHouseFeedProps {
  transactions: NounTransaction[];
  balances: {
    eth: string;
    usdc: string;
  };
}

export function AuctionHouseFeed({ transactions, balances }: AuctionHouseFeedProps) {
  return (
    <div className={styles.auctionFeed}>
      <div className={styles.auctionStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>ETH Balance</span>
          <span className={styles.statValue}>
            {safeFormatAmount(balances.eth, 18)} ETH
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Transaction Count</span>
          <span className={styles.statValue}>
            {transactions.length}
          </span>
        </div>
      </div>

      <div className={styles.auctionList}>
        <table className={styles.auctionTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Noun ID</th>
              <th>Action</th>
              <th className={styles.rightAlign}>Amount</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const uniqueKey = `${tx.hash}-${tx.timeStamp}-${tx.nounId}-${tx.value}`;
              return (
                <tr key={uniqueKey}>
                  <td className={styles.timestamp}>
                    {new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}
                  </td>
                  <td>{tx.nounId ? `Noun #${tx.nounId}` : 'Unknown'}</td>
                  <td className={styles.action}>
                    {tx.isMint ? 'Mint' : tx.isNounderNoun ? 'Nounder Claim' : 'Transfer'}
                  </td>
                  <td className={styles.rightAlign}>
                    {safeFormatAmount(tx.value, 18)} ETH
                  </td>
                  <td className={styles.hash}>
                    <a 
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tx.hash.substring(0, 6)}...{tx.hash.substring(62)}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 