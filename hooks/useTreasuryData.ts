import { useMemo } from 'react';
import { CONTRACTS, getContractName } from '../utils/transactions';
import { 
  EtherscanTransaction,
  ContractData,
  EnhancedTransaction,
  USDCTransaction,
  NounTransaction,
  TransactionQuery,
  RawTreasuryData
} from '../utils/types';

export function useTreasuryData(rawData: RawTreasuryData) {
  return useMemo(() => {
    const defaultResponse = {
      nounTransactions: [] as NounTransaction[],
      usdcTransactions: [] as USDCTransaction[],
      ethTransactions: [] as EnhancedTransaction[],
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
          .filter((tx: EtherscanTransaction) => {
            // Only include transactions we haven't seen before
            if (processedHashes.has(tx.hash)) return false;
            processedHashes.add(tx.hash);
            return true;
          })
          .map((tx: EtherscanTransaction) => ({
            ...tx,
            contractAddress: address,
            contractName: getContractName(address)
          }));
        
        return [...acc, ...enhancedTransactions];
      }, []);

    // Split transactions by type
    const nounTransactions: NounTransaction[] = transactions
      .filter((tx): tx is EnhancedTransaction & { tokenID: string } => 
        tx.transactionType === 'nft' && typeof tx.tokenID === 'string' && tx.tokenID !== ''
      )
      .map(tx => ({
        ...tx,
        nounId: tx.tokenID
      }));

    const usdcTransactions: USDCTransaction[] = transactions
      .filter((tx): tx is EnhancedTransaction & { tokenDecimal: string } => 
        tx.tokenSymbol === 'USDC' && typeof tx.tokenDecimal === 'string'
      )
      .map(tx => ({
        ...tx,
        amount: tx.value,
        decimals: parseInt(tx.tokenDecimal)
      }));

    const ethTransactions = transactions
      .filter(tx => tx.tokenSymbol === 'ETH' || !tx.tokenSymbol);

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
      usdcTransactions,
      ethTransactions,
      balances
    };
  }, [rawData]);
} 