import { EnhancedTransaction } from '../utils/types';
import { 
  safeFormatAmount, 
  getTransactionDisplay 
} from '../utils/transactions';
import styles from './TreasuryFeed.module.css';

interface TreasuryFeedProps {
  transaction: EnhancedTransaction;
  contractName: string;
}

export function TreasuryFeed({ transaction: tx, contractName }: TreasuryFeedProps) {
  const formattedDate = new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const direction = tx.to.toLowerCase() === tx.contractAddress.toLowerCase() ? 'in' : 'out';
  const counterparty = direction === 'in' ? tx.from : tx.to;

  return (
    <tr className={`${styles.transactionRow} ${styles[direction]}`}>
      <td className={styles.timestamp}>{formattedDate}</td>
      <td className={styles.contract}>{contractName}</td>
      <td className={styles.type}>
        {getTransactionDisplay(tx)}
      </td>
      <td className={`${styles.amount} ${styles.rightAlign}`}>
        <span className={styles[direction]}>
          {direction === 'out' && '-'}
          {tx.tokenSymbol ? 
            safeFormatAmount(tx.value, tx.tokenSymbol === 'USDC' ? 6 : 18) :
            safeFormatAmount(tx.value, 18)
          } {tx.tokenSymbol || 'ETH'}
        </span>
      </td>
      <td>
        <span className={`${styles.directionBadge} ${styles[direction]}`}>
          {direction.toUpperCase()}
        </span>
      </td>
      <td className={styles.address}>
        <a
          href={`https://etherscan.io/address/${counterparty}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {counterparty.substring(0, 6)}...{counterparty.substring(38)}
        </a>
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
} 