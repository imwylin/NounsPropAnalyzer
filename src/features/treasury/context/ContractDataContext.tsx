import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Contract, APIResponse } from '../../../lib/types';
import { getContractsArray, ContractConfig } from '../types/contracts';

interface ContractDataState {
  contracts: Contract[];
  isLoading: boolean;
  error: string | null;
}

type ContractDataAction = 
  | { type: 'SET_CONTRACTS'; payload: Contract[] }
  | { type: 'UPDATE_CONTRACTS'; payload: Contract[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Create empty contract records for monitored contracts
const initialState: ContractDataState = {
  contracts: getContractsArray().map((contract: ContractConfig) => ({
    ...contract,
    balance: '0',
    tokenHoldings: [],
    nftHoldings: [],
    lastSync: new Date(),
    metadata: {
      lastSyncTime: Date.now(),
      transactionCounts: {
        normal: 0,
        internal: 0,
        erc20: 0,
        erc721: 0,
        erc1155: 0
      },
      isComplete: false,
      lastSyncBlock: '0',
      oldestSyncedBlock: '0'
    }
  })),
  isLoading: true,
  error: null
};

function contractDataReducer(state: ContractDataState, action: ContractDataAction): ContractDataState {
  switch (action.type) {
    case 'SET_CONTRACTS':
      return { ...state, contracts: action.payload };
    case 'UPDATE_CONTRACTS': {
      // Update existing contracts while preserving order and structure
      const updatedContracts = state.contracts.map(existing => {
        const updated = action.payload.find(
          (c: Contract) => c.address.toLowerCase() === existing.address.toLowerCase()
        );
        return updated || existing;
      });
      
      // Add any new contracts that weren't in the original list
      const newContracts = action.payload.filter((newContract: Contract) => 
        !state.contracts.some(
          existing => existing.address.toLowerCase() === newContract.address.toLowerCase()
        )
      );
      
      return {
        ...state,
        contracts: [...updatedContracts, ...newContracts]
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const ContractDataContext = createContext<{
  state: ContractDataState;
  dispatch: React.Dispatch<ContractDataAction>;
  refreshData: () => Promise<void>;
} | null>(null);

export function ContractDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(contractDataReducer, initialState);

  const refreshData = useCallback(async () => {
    try {
      const response = await fetch('/api/treasury');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json() as APIResponse;
      
      // Update contracts while preserving the initial structure
      dispatch({ type: 'UPDATE_CONTRACTS', payload: data.contracts || [] });
      dispatch({ type: 'SET_ERROR', payload: data.error });
    } catch (error) {
      console.error('Error refreshing data:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value = {
    state,
    dispatch,
    refreshData
  };

  return (
    <ContractDataContext.Provider value={value}>
      {children}
    </ContractDataContext.Provider>
  );
}

export function useContractData() {
  const context = useContext(ContractDataContext);
  if (!context) {
    throw new Error('useContractData must be used within a ContractDataProvider');
  }
  return context;
} 