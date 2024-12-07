import type { Contract } from '../../../lib/types';
import { formatUnits } from 'ethers';

export function formatBalance(balance: string | null | undefined, decimals: number = 18): string {
  if (!balance) return '0';
  
  try {
    // Clean the balance string - remove any non-numeric characters except minus sign
    const cleanBalance = balance.replace(/[^0-9\-]/g, '');
    if (!cleanBalance) return '0';
    
    // Format using ethers.js utilities
    return formatUnits(cleanBalance, decimals);
  } catch (e) {
    console.warn(`Failed to format balance: ${balance}`, e);
    return '0';
  }
}

export function formatUSDC(balance: string | null | undefined): string {
  return formatBalance(balance, 6);
}

export function formatETH(balance: string | null | undefined): string {
  return formatBalance(balance, 18);
}

export function sumTokenBalance(contracts: Contract[], symbol: string): string {
  const sum = contracts.reduce((sum, contract) => {
    const tokenBalance = contract.tokenHoldings?.find(t => 
      t.tokenSymbol?.toLowerCase() === symbol.toLowerCase()
    )?.balance;
    
    if (!tokenBalance) return sum;
    
    try {
      // Clean the balance string
      const cleanBalance = tokenBalance.replace(/[^0-9\-]/g, '');
      if (!cleanBalance) return sum;
      
      return sum + BigInt(cleanBalance);
    } catch (e) {
      console.warn(`Failed to parse balance for token ${symbol}:`, e);
      return sum;
    }
  }, BigInt(0));
  
  // Return raw sum - formatting will be handled by the display component
  return sum.toString();
}

export function formatDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatContractSummary(contracts: Contract[]): {
  totalETH: string;
  totalUSDC: string;
  totalWETH: string;
  totalSTETH: string;
  totalRETH: string;
  totalWSTETH: string;
} {
  return contracts.reduce((acc, contract) => {
    try {
      // Get raw balances
      const ethBalance = contract.balance || '0';
      const usdcBalance = contract.tokenHoldings?.find(t => 
        t.tokenSymbol?.toLowerCase() === 'usdc'
      )?.balance || '0';
      const wethBalance = contract.tokenHoldings?.find(t => 
        t.tokenSymbol?.toLowerCase() === 'weth'
      )?.balance || '0';
      const stethBalance = contract.tokenHoldings?.find(t => 
        t.tokenSymbol?.toLowerCase() === 'steth'
      )?.balance || '0';
      const rethBalance = contract.tokenHoldings?.find(t => 
        t.tokenSymbol?.toLowerCase() === 'reth'
      )?.balance || '0';
      const wstethBalance = contract.tokenHoldings?.find(t => 
        t.tokenSymbol?.toLowerCase() === 'wsteth'
      )?.balance || '0';

      // Clean and parse each balance
      const cleanAndParse = (balance: string): bigint => {
        const cleaned = balance.replace(/[^0-9\-]/g, '');
        return cleaned ? BigInt(cleaned) : BigInt(0);
      };

      // Return raw sums - formatting will be handled by display components
      return {
        totalETH: (BigInt(acc.totalETH) + cleanAndParse(ethBalance)).toString(),
        totalUSDC: (BigInt(acc.totalUSDC) + cleanAndParse(usdcBalance)).toString(),
        totalWETH: (BigInt(acc.totalWETH) + cleanAndParse(wethBalance)).toString(),
        totalSTETH: (BigInt(acc.totalSTETH) + cleanAndParse(stethBalance)).toString(),
        totalRETH: (BigInt(acc.totalRETH) + cleanAndParse(rethBalance)).toString(),
        totalWSTETH: (BigInt(acc.totalWSTETH) + cleanAndParse(wstethBalance)).toString()
      };
    } catch (e) {
      console.warn('Failed to process contract summary:', e);
      return acc;
    }
  }, {
    totalETH: '0',
    totalUSDC: '0',
    totalWETH: '0',
    totalSTETH: '0',
    totalRETH: '0',
    totalWSTETH: '0'
  });
} 