import React, { useMemo } from 'react';
import type { Contract } from '../../../lib/types';
import { usePrices } from '../context/PriceContext';
import styles from './TreasuryOverview.module.css';
import { formatUnits } from 'ethers';

interface TreasuryOverviewProps {
  contracts: Contract[];
  isLoading: boolean;
}

// Simple function to parse token balance with proper decimals
const parseTokenBalance = (balance: string | undefined, decimals: number = 18): number => {
  if (!balance) return 0;
  try {
    const cleanBalance = balance.replace(/[^0-9\-]/g, '');
    if (!cleanBalance) return 0;
    return parseFloat(formatUnits(cleanBalance, decimals));
  } catch (error) {
    console.error('Error parsing balance:', error);
    return 0;
  }
};

// Find token balance in the treasury contract
const findTokenBalance = (contract: Contract | undefined, symbol: string): { balance: string, decimals: string } | null => {
  if (!contract?.tokenHoldings) return null;
  
  const token = contract.tokenHoldings.find(t => 
    t.tokenSymbol?.toLowerCase() === symbol.toLowerCase()
  );
  
  if (token) {
    return { balance: token.balance, decimals: token.tokenDecimal };
  }
  return null;
};

export default function TreasuryOverview({ contracts = [], isLoading }: TreasuryOverviewProps) {
  const { prices } = usePrices();

  const balances = useMemo(() => {
    if (!contracts?.length) {
      return {
        eth: 0,
        usdc: 0,
        weth: 0,
        steth: 0,
        wsteth: 0,
        reth: 0,
        nouns: 0
      };
    }

    // Get the treasury contract (first contract)
    const treasuryContract = contracts[0];

    // Calculate ETH balance from treasury
    const ethBalance = parseTokenBalance(treasuryContract?.balance);

    // Get token balances from treasury
    const usdcToken = findTokenBalance(treasuryContract, 'USDC');
    const wethToken = findTokenBalance(treasuryContract, 'WETH');
    const stethToken = findTokenBalance(treasuryContract, 'STETH');
    const wstethToken = findTokenBalance(treasuryContract, 'WSTETH');
    const rethToken = findTokenBalance(treasuryContract, 'RETH');

    // Parse token balances
    const usdcBalance = parseTokenBalance(usdcToken?.balance, parseInt(usdcToken?.decimals || '6'));
    const wethBalance = parseTokenBalance(wethToken?.balance, parseInt(wethToken?.decimals || '18'));
    const stethBalance = parseTokenBalance(stethToken?.balance, parseInt(stethToken?.decimals || '18'));
    const wstethBalance = parseTokenBalance(wstethToken?.balance, parseInt(wstethToken?.decimals || '18'));
    const rethBalance = parseTokenBalance(rethToken?.balance, parseInt(rethToken?.decimals || '18'));

    // Calculate Nouns NFT balance from treasury
    const nounsBalance = treasuryContract?.nftHoldings?.reduce((sum, holding) => {
      if (holding.symbol?.toLowerCase() === 'noun') {
        return sum + parseInt(holding.tokenQuantity || '0');
      }
      return sum;
    }, 0) || 0;

    return {
      eth: ethBalance,
      usdc: usdcBalance,
      weth: wethBalance,
      steth: stethBalance,
      wsteth: wstethBalance,
      reth: rethBalance,
      nouns: nounsBalance
    };
  }, [contracts]);

  const totalUSDValue = useMemo(() => {
    if (!prices) return 0;

    // Calculate individual USD values
    const ethValue = balances.eth * prices.ETH;
    const usdcValue = balances.usdc; // USDC is pegged to USD
    const wethValue = balances.weth * prices.ETH; // WETH is 1:1 with ETH
    const stethValue = balances.steth * prices.STETH;
    const wstethValue = balances.wsteth * prices.WSTETH;
    const rethValue = balances.reth * prices.RETH;

    // Log only the final values for debugging
    console.log('Token Balances & USD Values:', {
      ETH: { balance: balances.eth, value: ethValue },
      USDC: { balance: balances.usdc, value: usdcValue },
      WETH: { balance: balances.weth, value: wethValue },
      STETH: { balance: balances.steth, value: stethValue },
      WSTETH: { balance: balances.wsteth, value: wstethValue },
      RETH: { balance: balances.reth, value: rethValue }
    });

    return ethValue + usdcValue + wethValue + stethValue + wstethValue + rethValue;
  }, [balances, prices]);

  const formatValue = (value: number, prefix: string = '', decimals: number = 4) => {
    return `${prefix}${value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };

  if (isLoading || !prices) {
    return (
      <div className={styles.overview}>
        <div className={styles.header}>
          <h1>Treasury Overview</h1>
        </div>
        <div className={styles.totalValue}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.overview}>
      <div className={styles.header}>
        <h1>Treasury Overview</h1>
      </div>

      <div className={styles.totalValue}>
        <span className={styles.totalValuePill}>
          {formatValue(totalUSDValue, '$', 2)}
        </span>
        <span className={styles.totalValuePill}>
          {formatValue(balances.nouns, '', 0)} NOUNS
        </span>
      </div>

      <div className={styles.balanceGrid}>
        <div className={`${styles.balancePill} ${styles.ethBalance}`}>
          <span className={styles.balanceLabel}>ETH Balance</span>
          <span className={styles.balanceValue}>
            {formatValue(balances.eth)} ETH
          </span>
          <span className={styles.usdValue}>
            {formatValue(balances.eth * prices.ETH, '$', 2)}
          </span>
        </div>

        <div className={`${styles.balancePill} ${styles.usdcBalance}`}>
          <span className={styles.balanceLabel}>USDC Balance</span>
          <span className={styles.balanceValue}>
            {formatValue(balances.usdc)} USDC
          </span>
          <span className={styles.usdValue}>
            {formatValue(balances.usdc, '$', 2)}
          </span>
        </div>

        <div className={`${styles.balancePill} ${styles.wethBalance}`}>
          <span className={styles.balanceLabel}>WETH Balance</span>
          <span className={styles.balanceValue}>
            {formatValue(balances.weth)} WETH
          </span>
          <span className={styles.usdValue}>
            {formatValue(balances.weth * prices.ETH, '$', 2)}
          </span>
        </div>

        <div className={`${styles.balancePill} ${styles.stethBalance}`}>
          <span className={styles.balanceLabel}>stETH Balance</span>
          <span className={styles.balanceValue}>
            {formatValue(balances.steth)} stETH
          </span>
          <span className={styles.usdValue}>
            {formatValue(balances.steth * prices.STETH, '$', 2)}
          </span>
        </div>

        <div className={`${styles.balancePill} ${styles.stethBalance}`}>
          <span className={styles.balanceLabel}>wstETH Balance</span>
          <span className={styles.balanceValue}>
            {formatValue(balances.wsteth)} wstETH
          </span>
          <span className={styles.usdValue}>
            {formatValue(balances.wsteth * prices.WSTETH, '$', 2)}
          </span>
        </div>

        <div className={`${styles.balancePill} ${styles.rethBalance}`}>
          <span className={styles.balanceLabel}>rETH Balance</span>
          <span className={styles.balanceValue}>
            {formatValue(balances.reth)} rETH
          </span>
          <span className={styles.usdValue}>
            {formatValue(balances.reth * prices.RETH, '$', 2)}
          </span>
        </div>
      </div>
    </div>
  );
} 