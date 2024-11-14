import type { NextApiRequest, NextApiResponse } from 'next';
import Moralis from 'moralis';
import { ADDRESSES } from '../../../utils/contracts';
import { processTransaction } from '../../../utils/transactions';
import { Transaction, TokenBalance } from '../../../utils/types';

interface USDCPayerResponse {
  transactions: Transaction[];
  balances: TokenBalance[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<USDCPayerResponse | { error: string }>) {
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

    console.log('Fetching USDC payer data...');

    // Fetch both balances and transactions
    const [balancesResponse, transactionsResponse] = await Promise.all([
      Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
        chain: "0x1",
        address: ADDRESSES.USDC_PAYER
      }).catch(error => {
        console.error('Balance fetch error:', error);
        throw error;
      }),
      Moralis.EvmApi.wallets.getWalletHistory({
        chain: "0x1",
        address: ADDRESSES.USDC_PAYER,
        limit: 100
      }).catch(error => {
        console.error('Transaction fetch error:', error);
        throw error;
      })
    ]);

    console.log('Processing USDC payer data...');

    // Process balances with safe fallbacks
    const balances = balancesResponse.toJSON().result || [];
    const processedBalances: TokenBalance[] = balances.map((balance: any) => ({
      token_address: balance.token_address || '',
      symbol: balance.symbol || '',
      name: balance.name || '',
      logo: balance.logo || null,
      decimals: parseInt(balance.decimals || '0'),
      balance: balance.balance || '0',
      balance_formatted: balance.balance_formatted || '0',
      usd_price: balance.usd_price ? parseFloat(balance.usd_price) : null,
      usd_value: balance.usd_price && balance.balance_formatted ? 
        parseFloat(balance.balance_formatted) * parseFloat(balance.usd_price) : 
        null,
      possible_spam: balance.possible_spam || false,
      verified_contract: balance.verified_contract || false,
      native_token: balance.native_token || false
    }));

    // Process transactions
    const transactions = transactionsResponse.toJSON().result;
    const processedTransactions = transactions.map(tx => 
      processTransaction(tx, 'usdcPayer')
    );

    console.log('USDC payer data processed successfully');

    res.status(200).json({
      transactions: processedTransactions,
      balances: processedBalances
    });
  } catch (error) {
    console.error('USDC Payer API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: `Failed to fetch USDC payer data: ${errorMessage}` });
  }
} 