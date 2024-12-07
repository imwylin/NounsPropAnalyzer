import { formatUnits } from 'ethers';
import styles from './BalanceDisplay.module.css';

interface BalanceDisplayProps {
  eth: string;
  usdc: string;
}

export function BalanceDisplay({ eth, usdc }: BalanceDisplayProps) {
  const formatEth = (value: string) => {
    const formatted = parseFloat(formatUnits(value || '0', 18));
    return formatted.toFixed(3);
  };

  const formatUsdc = (value: string) => {
    const formatted = parseFloat(formatUnits(value || '0', 6));
    return formatted.toFixed(2);
  };

  return (
    <div className={styles.balances}>
      <div className={styles.balance}>
        <span>{formatEth(eth)} ETH</span>
      </div>
      <div className={styles.balance}>
        <span>{formatUsdc(usdc)} USDC</span>
      </div>
    </div>
  );
} 