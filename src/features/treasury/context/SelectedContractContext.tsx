import { createContext, useContext, useState, ReactNode } from 'react';
import type { Contract } from '../../../lib/types';
import { getContractsArray } from '../types/contracts';

interface SelectedContractContextType {
  selectedContract: Contract;
  setSelectedContract: (contract: Contract) => void;
}

// Get the first contract from the array
const firstContract = getContractsArray()[0];

// Treasury is always the first contract
const DEFAULT_CONTRACT: Contract = {
  ...firstContract,
  balance: '0',
  tokenHoldings: [],
  nftHoldings: [],
  lastSync: new Date(),
  metadata: {
    lastSyncTime: Date.now(),
    transactionCounts: { normal: 0, internal: 0, erc20: 0, erc721: 0, erc1155: 0 },
    isComplete: false,
    lastSyncBlock: '0',
    oldestSyncedBlock: '0'
  }
};

const SelectedContractContext = createContext<SelectedContractContextType | null>(null);

export function SelectedContractProvider({ children }: { children: ReactNode }) {
  const [selectedContract, setSelectedContract] = useState<Contract>(DEFAULT_CONTRACT);

  return (
    <SelectedContractContext.Provider value={{ selectedContract, setSelectedContract }}>
      {children}
    </SelectedContractContext.Provider>
  );
}

export function useSelectedContract() {
  const context = useContext(SelectedContractContext);
  if (!context) {
    throw new Error('useSelectedContract must be used within a SelectedContractProvider');
  }
  return context;
} 