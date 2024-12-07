import type { Contract } from '../../../lib/types';
import { formatEther, formatUnits } from 'ethers';
import styles from './ContractCard.module.css';

interface ContractCardProps {
  contract: Contract;
  prices: {
    ETH: number;
    NOUNS: number;
  } | null;
}

function formatTokenValue(balance: string | undefined, decimals: string | undefined, symbol: string | undefined): { formatted: string; usdValue: number } {
  try {
    if (!balance || !decimals) {
      return { formatted: '0', usdValue: 0 };
    }

    // Clean the balance string
    const cleanBalance = balance.replace(/[^0-9\-]/g, '');
    if (!cleanBalance) {
      return { formatted: '0', usdValue: 0 };
    }

    // Format using ethers.js utilities
    const formatted = formatUnits(cleanBalance, parseInt(decimals));
    const value = parseFloat(formatted);

    return {
      formatted,
      usdValue: value
    };
  } catch (error) {
    console.warn(`Error formatting token value for ${symbol}:`, error);
    return { formatted: '0', usdValue: 0 };
  }
}

function isValidBigIntString(value: string): boolean {
  try {
    // Clean the string first
    const cleaned = value.replace(/[^0-9\-]/g, '');
    if (!cleaned) return false;
    BigInt(cleaned);
    return true;
  } catch {
    return false;
  }
}

export function ContractCard({ contract, prices }: ContractCardProps) {
  // Debug logging
  console.log('Contract data:', {
    address: contract.address,
    balance: contract.balance,
    tokenHoldings: contract.tokenHoldings,
    nftHoldings: contract.nftHoldings
  });

  const ethValue = (() => {
    try {
      if (!contract.balance) {
        return 0;
      }

      // Clean and format the balance
      const cleanBalance = contract.balance.replace(/[^0-9\-]/g, '');
      if (!cleanBalance) return 0;

      const formatted = formatEther(cleanBalance);
      return parseFloat(formatted) * (prices?.ETH || 0);
    } catch (error) {
      console.warn('Error calculating ETH value:', error);
      return 0;
    }
  })();

  const tokenValues = (contract.tokenHoldings || []).reduce((acc, token) => {
    if (!token) return acc;
    const { usdValue } = formatTokenValue(token.balance, token.tokenDecimal, token.tokenSymbol);
    return acc + usdValue;
  }, 0);

  const nftCount = (contract.nftHoldings || []).reduce((acc, holding) => {
    if (!holding?.tokenQuantity) return acc;
    try {
      if (!isValidBigIntString(holding.tokenQuantity)) {
        console.log('Invalid NFT quantity:', holding.tokenQuantity);
        return acc;
      }
      return acc + Number(holding.tokenQuantity);
    } catch (error) {
      console.error('Error parsing NFT quantity:', error);
      return acc;
    }
  }, 0);
  
  const nftValue = nftCount * (prices?.NOUNS || 0);
  const totalValue = ethValue + tokenValues + nftValue;

  const formattedEthBalance = (() => {
    try {
      if (!contract.balance) return '0';
      if (!isValidBigIntString(contract.balance)) {
        console.log('Invalid ETH balance for display:', contract.balance);
        return '0';
      }
      // Remove any decimal points and convert to BigInt
      const cleanBalance = contract.balance.toString().trim().split('.')[0];
      return formatEther(BigInt(cleanBalance));
    } catch (error) {
      console.error('Error formatting ETH balance:', error);
      return '0';
    }
  })();

  return (
    <div className={styles.statusPill}>
      <div className={styles.statusInfo}>
        <div className={styles.statusTitle}>{contract.name || 'Unknown Contract'}</div>
        <div className={styles.statusLabel}>
          ${totalValue.toLocaleString()}
        </div>
        <div className={styles.usdValue}>
          {formattedEthBalance} ETH
        </div>
      </div>
    </div>
  );
} 