import type { NextApiRequest, NextApiResponse } from 'next';
import Moralis from 'moralis';
import { ADDRESSES } from '../../../utils/contracts';
import { processTransaction } from '../../../utils/transactions';
import type { Transaction, TokenBalance } from '../../../utils/types';
import type { EvmErc20TokenBalanceWithPriceJSON } from 'moralis/common-evm-utils';

interface DAOResponse {
  balances: TokenBalance[];
  transactions: Transaction[];
}

interface TransactionData {
  hash: string;
  // Add other relevant fields based on what data you're actually using
}

interface MoralisTokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  logo: string | null;
  decimals: string;
  balance: string;
  balance_formatted: string;
  possible_spam: boolean;
  verified_contract: boolean;
  native_token: boolean;
  price?: {
    usd_price?: string;
    native_price?: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DAOResponse | { error: string }>) {
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

    console.log('Fetching DAO data...');

    // Fetch both balances and transactions
    const [balancesResponse, transactionsResponse] = await Promise.all([
      Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
        chain: "0x1",
        address: ADDRESSES.TREASURY
      }).catch(error => {
        console.error('Balance fetch error:', error);
        throw error;
      }),
      Moralis.EvmApi.wallets.getWalletHistory({
        chain: "0x1",
        address: ADDRESSES.TREASURY,
        limit: 100
      }).catch(error => {
        console.error('Transaction fetch error:', error);
        throw error;
      })
    ]);

    console.log('Processing DAO data...');

    // Process balances with safe fallbacks
    const balances = balancesResponse.toJSON().result || [];
    const processedBalances: TokenBalance[] = balances.map((balance: any) => {
      // First safely extract all values with proper type checking
      const tokenAddress = typeof balance.token_address === 'string' ? balance.token_address : '';
      const symbol = typeof balance.symbol === 'string' ? balance.symbol : '';
      const name = typeof balance.name === 'string' ? balance.name : '';
      const logo = balance.logo || null;
      const decimals = typeof balance.decimals === 'string' ? parseInt(balance.decimals, 10) : 0;
      const rawBalance = typeof balance.balance === 'string' ? balance.balance : '0';
      const formattedBalance = typeof balance.balance_formatted === 'string' ? balance.balance_formatted : '0';
      
      // Handle price data safely
      const usdPrice = balance.price?.usd_price ? parseFloat(balance.price.usd_price) : null;
      const usdValue = usdPrice && formattedBalance ? parseFloat(formattedBalance) * usdPrice : null;

      // Handle boolean flags safely
      const possibleSpam = typeof balance.possible_spam === 'boolean' ? balance.possible_spam : false;
      const verifiedContract = typeof balance.verified_contract === 'boolean' ? balance.verified_contract : false;
      const nativeToken = typeof balance.native_token === 'boolean' ? balance.native_token : false;

      return {
        token_address: tokenAddress,
        symbol,
        name,
        logo,
        decimals,
        balance: rawBalance,
        balance_formatted: formattedBalance,
        usd_price: usdPrice,
        usd_value: usdValue,
        possible_spam: possibleSpam,
        verified_contract: verifiedContract,
        native_token: nativeToken
      };
    });

    // Process transactions
    const transactions = transactionsResponse.toJSON().result;
    const processedTransactions = transactions.map(tx => 
      processTransaction(tx, 'treasury')
    );

    console.log('DAO data processed successfully');

    res.status(200).json({
      balances: processedBalances,
      transactions: processedTransactions
    });
  } catch (error) {
    console.error('DAO API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: `Failed to fetch DAO data: ${errorMessage}` });
  }
} 