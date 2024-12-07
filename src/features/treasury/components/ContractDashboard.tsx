import { useState, useEffect, useCallback } from 'react';
import { ContractActivity } from './ContractActivity';
import { TransactionAnalysis } from './TransactionAnalysis';
import { useSelectedContract } from '../context/SelectedContractContext';
import { useContractData } from '../context/ContractDataContext';
import { usePrices } from '../context/PriceContext';
import { getContractsArray } from '../types/contracts';
import { TimeRange, TIME_RANGES } from '../types/time';
import styles from './ContractDashboard.module.css';
import type { Contract } from '../../../lib/types';
import type { FrontendTransaction } from '../types/frontend';

interface DetailedContractData {
  error?: string;
  data?: Contract;
  transactions: FrontendTransaction[];
  allTransactions: FrontendTransaction[];
  isLoading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
  };
}

export default function ContractDashboard() {
  const { selectedContract } = useSelectedContract();
  const { state: contractData } = useContractData();
  const { prices } = usePrices();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [detailedData, setDetailedData] = useState<DetailedContractData>({
    transactions: [],
    allTransactions: [],
    isLoading: false,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasMore: false
    }
  });

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    loadAnalysisTransactions(range);
  };

  // Load all transactions for transaction history without any filtering
  const loadTransactions = useCallback(async (page: number) => {
    if (!selectedContract) return;

    try {
      setDetailedData(prev => ({
        ...prev,
        isLoading: true,
        error: undefined
      }));

      // Fetch all transactions without time range filtering
      const response = await fetch(
        `/api/treasury/contract/transactions?` + 
        `address=${selectedContract.address}&` +
        `page=${page}&` +
        `pageSize=100`  // Keep reasonable page size for performance
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();

      setDetailedData(prev => {
        if (page === 1) {
          return {
            ...prev,
            transactions: data.transactions,
            pagination: {
              currentPage: data.pagination.page,
              totalPages: data.pagination.totalPages,
              totalItems: data.pagination.total,
              hasMore: data.pagination.page < data.pagination.totalPages
            },
            isLoading: false
          };
        }

        const existingHashes = new Set(prev.transactions.map(tx => tx.hash));
        const newTransactions = data.transactions.filter((tx: FrontendTransaction) => !existingHashes.has(tx.hash));
        
        return {
          ...prev,
          transactions: [...prev.transactions, ...newTransactions],
          pagination: {
            currentPage: data.pagination.page,
            totalPages: data.pagination.totalPages,
            totalItems: data.pagination.total,
            hasMore: data.pagination.page < data.pagination.totalPages
          },
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      setDetailedData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load transactions',
        isLoading: false
      }));
    }
  }, [selectedContract]);

  // Load filtered transactions for analysis
  const loadAnalysisTransactions = useCallback(async (currentTimeRange: TimeRange = timeRange) => {
    if (!selectedContract) return;

    try {
      const now = Math.floor(Date.now() / 1000);
      const rangeSeconds = TIME_RANGES[currentTimeRange];
      const startTime = rangeSeconds ? now - rangeSeconds : 0;

      // Fetch transactions with time range filtering for analysis
      const response = await fetch(
        `/api/treasury/contract/transactions?` + 
        `address=${selectedContract.address}&` +
        `page=1&` +
        `pageSize=1000&` +
        `startTime=${startTime}&` +
        `endTime=${now}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      // Only update analysis transactions, leave history transactions unchanged
      setDetailedData(prev => ({
        ...prev,
        allTransactions: data.transactions
      }));
    } catch (error) {
      console.error('Error loading analysis transactions:', error);
    }
  }, [selectedContract, timeRange]);

  // Load initial data when contract changes
  useEffect(() => {
    if (!selectedContract) return;
    
    // Reset state
    setDetailedData({
      transactions: [],
      allTransactions: [],
      isLoading: false,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasMore: false
      }
    });

    // Load both transaction sets
    loadTransactions(1);  // Load all transactions for history
    loadAnalysisTransactions(timeRange);  // Load filtered transactions for analysis
  }, [selectedContract, loadTransactions, loadAnalysisTransactions, timeRange]);

  const handleLoadMore = useCallback(() => {
    if (!detailedData.pagination.hasMore) return;
    loadTransactions(detailedData.pagination.currentPage + 1);
  }, [detailedData.pagination, loadTransactions]);

  if (!selectedContract) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.empty}>Select a contract to view details</div>
      </div>
    );
  }

  if (detailedData.error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.error}>{detailedData.error}</div>
      </div>
    );
  }

  const monitoredContract = getContractsArray().find(
    c => c.address.toLowerCase() === selectedContract.address.toLowerCase()
  );

  const contract = contractData.contracts.find(
    c => c.address.toLowerCase() === selectedContract.address.toLowerCase()
  ) || selectedContract;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2>{monitoredContract?.name || contract.name}</h2>
          <div className={styles.headerRight}>
            <a
              href={`https://etherscan.io/address/${contract.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.addressPill}
            >
              {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
            </a>
            {contract.syncStatus?.inProgress && (
              <div className={styles.syncStatus}>
                <span>Syncing...</span>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progress} 
                    style={{ width: `${contract.syncStatus.progress || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionAnalysis
        transactions={detailedData.allTransactions}
        selectedContract={selectedContract}
        prices={prices ? Object.fromEntries(Object.entries(prices)) : {}}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />

      <ContractActivity 
        transactions={detailedData.transactions}
        pagination={detailedData.pagination}
        onLoadMore={handleLoadMore}
        prices={prices}
        isLoading={detailedData.isLoading}
      />
    </div>
  );
} 