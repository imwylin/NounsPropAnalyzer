import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '../../../features/treasury/lib/storage';
import { MONITORED_CONTRACTS } from '../../../features/treasury/types/contracts';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get sync status for all contracts
    const syncStatus = await Storage.getAllSyncStatus();

    // Get contract data
    const contractData = await Promise.all(
      Object.values(MONITORED_CONTRACTS).map(async contract => {
        try {
          const data = await Storage.getContractData(contract.address);
          
          // Return minimal contract data if still loading
          if (!data) {
            return {
              address: contract.address,
              name: contract.name,
              type: contract.type,
              ethBalance: '0',
              usdcBalance: '0',
              wethBalance: '0',
              stethBalance: '0',
              rethBalance: '0',
              wstethBalance: '0',
              lastUpdated: null,
              isLoading: true
            };
          }

          // Helper to get token balance with proper decimal handling
          const getTokenBalance = (symbol: string) => {
            const token = data.tokenHoldings.find(t => 
              t.tokenSymbol.toLowerCase() === symbol.toLowerCase()
            );
            if (!token) return '0';
            return token.balance;
          };

          const status = syncStatus.find(s => s.contractAddress === contract.address);

          return {
            address: contract.address,
            name: contract.name,
            type: contract.type,
            ethBalance: data.balance || '0',
            usdcBalance: getTokenBalance('USDC'),
            wethBalance: getTokenBalance('WETH'),
            stethBalance: getTokenBalance('STETH'),
            wstethBalance: getTokenBalance('WSTETH'),
            rethBalance: getTokenBalance('RETH'),
            lastUpdated: status?.lastSync || null,
            isLoading: status?.inProgress || false
          };
        } catch (error) {
          console.error(`Error processing contract ${contract.address}:`, error);
          return {
            address: contract.address,
            name: contract.name,
            type: contract.type,
            ethBalance: '0',
            usdcBalance: '0',
            wethBalance: '0',
            stethBalance: '0',
            rethBalance: '0',
            wstethBalance: '0',
            lastUpdated: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return res.status(200).json({
      contracts: contractData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in summary endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 