import type { Contract, SyncStatus } from '../../../lib/types';
import { Database } from '../../../lib/db/index';

export interface ContractResponse extends Contract {
  syncStatus?: SyncStatus;
}

export interface APIResponse {
  contracts: ContractResponse[];
  lastSync?: number;
  error: string | null;
}

export type ContractType = 'treasury' | 'auction' | 'payment' | 'governance' | 'token';

export interface ContractConfig {
  address: string;
  name: string;
  type: ContractType;
}

export const MONITORED_CONTRACTS: Record<string, ContractConfig> = {
  TREASURY_V2: {
    address: "0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71",
    name: "Treasury v2",
    type: "treasury"
  },
  AUCTION_HOUSE: {
    address: "0x830BD73E4184ceF73443C15111a1DF14e495C706",
    name: "Auction House",
    type: "auction"
  },
  TOKEN_BUYER: {
    address: "0x4f2acdc74f6941390d9b1804fabc3e780388cfe5",
    name: "Token Buyer [ETH → USDC]",
    type: "payment"
  },
  PAYER: {
    address: "0xd97Bcd9f47cEe35c0a9ec1dc40C1269afc9E8E1D",
    name: "Payer [USDC Payments]",
    type: "payment"
  },
  STREAM_FACTORY: {
    address: "0x0fd206FC7A7dBcD5661157eDCb1FFDD0D02A61ff",
    name: "Stream Factory",
    type: "payment"
  },
  CLIENT_REWARDS_PROXY: {
    address: "0x883860178F95d0C82413eDc1D6De530cB4771d55",
    name: "Client Rewards",
    type: "payment"
  },
  DAO_PROXY: {
    address: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
    name: "DAO [Proposing/Voting]",
    type: "governance"
  },
  NOUNS_TOKEN: {
    address: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
    name: "Nouns Token [Delegations]",
    type: "token"
  },
  TREASURY_V1: {
    address: "0x0BC3807Ec262cB779b38D65b38158acC3bfedE10",
    name: "Treasury v1",
    type: "treasury"
  }
};

// Helper function to get contracts as an array
export const getContractsArray = (): ContractConfig[] => Object.values(MONITORED_CONTRACTS);

export function getContractByAddress(address: string): ContractConfig | undefined {
  const normalizedAddress = address.toLowerCase();
  return getContractsArray().find(
    contract => contract.address.toLowerCase() === normalizedAddress
  );
}

export function getContractKey(address: string): string | undefined {
  const normalizedAddress = address.toLowerCase();
  return Object.entries(MONITORED_CONTRACTS).find(
    ([_, contract]) => contract.address.toLowerCase() === normalizedAddress
  )?.[0];
}

export async function getMonitoredContracts(): Promise<ContractConfig[]> {
  return getContractsArray();
}

export async function initializeContracts(): Promise<void> {
  try {
    console.log('Starting contract initialization...');
    const contracts = getContractsArray();
    console.log(`Found ${contracts.length} contracts to initialize:`, contracts);

    for (const contract of getContractsArray()) {
      console.log(`Checking contract: ${contract.name} (${contract.address})`);
      const existingContract = await Database.getContract(contract.address);
      
      if (!existingContract) {
        console.log(`Initializing contract: ${contract.name}`);
        // Initialize contract in database
        await Database.updateContract(contract.address, {
          address: contract.address,
          name: contract.name,
          type: contract.type,
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
        });

        // Initialize sync status
        await Database.updateSyncStatus(contract.address, {
          contractAddress: contract.address,
          inProgress: false,
          stage: 'initialized',
          progress: 0,
          lastSync: null,
          error: null,
          lastSyncedBlock: null
        });
        console.log(`Successfully initialized contract: ${contract.name}`);
      } else {
        console.log(`Contract already exists: ${contract.name}`);
      }
    }
    console.log('Contract initialization completed successfully');
  } catch (error) {
    console.error('Error initializing contracts:', error);
    throw error;
  }
} 