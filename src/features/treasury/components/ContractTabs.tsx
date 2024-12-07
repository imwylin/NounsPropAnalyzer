import { Tab } from '@headlessui/react';
import type { Contract } from '../../../lib/types';
import { useContractData } from '../context/ContractDataContext';
import { useSelectedContract } from '../context/SelectedContractContext';
import styles from './ContractTabs.module.css';
import { getContractsArray } from '../types/contracts';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function ContractTabs() {
  const { state } = useContractData();
  const { contracts } = state;
  const { selectedContract, setSelectedContract } = useSelectedContract();

  // Get monitored contracts as array
  const monitoredContracts = getContractsArray();

  // Ensure contracts are in the same order as monitored contracts
  const orderedContracts = monitoredContracts.map(monitored => {
    // Find matching contract from loaded data
    const contract = contracts.find(c => c.address.toLowerCase() === monitored.address.toLowerCase());
    
    // Return either the loaded contract or a placeholder with the correct name from monitored contracts
    return contract || {
      ...monitored,
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
  });

  // Find the index of the selected contract
  const selectedIndex = orderedContracts.findIndex(
    c => c.address.toLowerCase() === selectedContract.address.toLowerCase()
  );

  return (
    <div className={styles.tabContainer}>
      <Tab.Group 
        selectedIndex={selectedIndex} 
        onChange={(index) => setSelectedContract(orderedContracts[index])}
      >
        <Tab.List className={styles.tabs}>
          {orderedContracts.map((contract: Contract) => {
            // Get the monitored contract config to ensure correct name
            const monitoredContract = monitoredContracts.find(
              c => c.address.toLowerCase() === contract.address.toLowerCase()
            );
            
            return (
              <Tab
                key={contract.address}
                className={({ selected }) =>
                  classNames(
                    styles.tab,
                    selected ? styles.active : ''
                  )
                }
              >
                <span className={styles.tabName}>
                  {monitoredContract?.name || contract.name}
                </span>
              </Tab>
            );
          })}
        </Tab.List>
      </Tab.Group>
    </div>
  );
} 