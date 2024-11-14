import type { NextApiRequest, NextApiResponse } from 'next';
import Moralis from 'moralis';
import { ADDRESSES } from '../../../utils/contracts';
import { processTransaction } from '../../../utils/transactions';
import { Transaction } from '../../../utils/types';

interface AuctionResponse {
  transactions: Transaction[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AuctionResponse | { error: string }>) {
  if (!process.env.MORALIS_API_KEY) {
    console.error('MORALIS_API_KEY is not configured');
    return res.status(500).json({ error: 'MORALIS_API_KEY is not configured' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Moralis only once
    if (!Moralis.Core.isStarted) {
      try {
        await Moralis.start({
          apiKey: process.env.MORALIS_API_KEY
        });
      } catch (startError) {
        console.error('Moralis start error:', startError);
        if (!(startError instanceof Error) || !startError.message.includes('started already')) {
          throw startError;
        }
      }
    }

    console.log('Fetching auction house data...');

    // Fetch transactions
    const transactionsResponse = await Moralis.EvmApi.wallets.getWalletHistory({
      chain: "0x1",
      address: ADDRESSES.AUCTION_HOUSE,
      limit: 100
    }).catch(error => {
      console.error('Transaction fetch error:', error);
      throw error;
    });

    console.log('Processing auction house data...');

    // Process transactions
    const transactions = transactionsResponse.toJSON().result;
    const processedTransactions = transactions.map(tx => 
      processTransaction(tx, 'auction')
    );

    // Sort transactions by timestamp
    const sortedTransactions = processedTransactions.sort((a, b) => 
      new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
    );

    console.log('Auction house data processed successfully');

    res.status(200).json({
      transactions: sortedTransactions
    });
  } catch (error) {
    console.error('Auction House API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: `Failed to fetch auction house data: ${errorMessage}` });
  }
} 