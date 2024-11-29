import { useMemo } from 'react';
import { useTreasury } from './useTreasury';
import { EnhancedTransaction, NounTransaction, Transaction } from '../utils/types';

export function useAuctionData() {
  const { rawData } = useTreasury('all', {
    contractTypes: ['auction']
  });

  return useMemo(() => {
    const defaultResponse = {
      nounTransactions: [],
      balances: {
        eth: '0',
        usdc: '0'
      }
    };

    if (!rawData) return defaultResponse;

    // Use a Set to track unique transaction hashes
    const processedHashes = new Set<string>();

    const transactions: EnhancedTransaction[] = Object.entries(rawData)
      .reduce<EnhancedTransaction[]>((acc, [address, contractData]) => {
        if (!contractData?.transactions) return acc;
        
        const enhancedTransactions = contractData.transactions
          .filter((tx: Transaction) => {
            // Only include transactions we haven't seen before
            if (processedHashes.has(tx.hash)) return false;
            processedHashes.add(tx.hash);
            return true;
          })
          .map((tx: Transaction) => ({
            ...tx,
            contractAddress: address,
            contractName: contractData.contractName
          }));
        
        return [...acc, ...enhancedTransactions];
      }, []);

    // Now transactions is guaranteed to be an array
    const nounTransactions: NounTransaction[] = (transactions || [])
      .filter((tx): tx is EnhancedTransaction & { tokenID: string } => 
        tx && typeof tx.tokenID === 'string' && tx.tokenID !== ''
      )
      .map(tx => ({
        ...tx,
        nounId: tx.tokenID
      }));

    // Calculate balances
    const balances = {
      eth: Object.values(rawData).reduce((sum, contract) => 
        sum + BigInt(contract?.balances?.eth || '0'), BigInt(0)
      ).toString(),
      usdc: Object.values(rawData).reduce((sum, contract) => 
        sum + BigInt(contract?.balances?.usdc || '0'), BigInt(0)
      ).toString()
    };

    return {
      nounTransactions,
      balances
    };
  }, [rawData]);
} 