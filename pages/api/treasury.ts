import type { NextApiRequest, NextApiResponse } from 'next';
import Moralis from 'moralis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY
    });

    const TREASURY_ADDRESS = '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71';

    // Fetch token balances
    const balancesResponse = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      chain: "0x1",
      address: TREASURY_ADDRESS
    });

    // Fetch transaction history
    const txResponse = await Moralis.EvmApi.wallets.getWalletHistory({
      chain: "0x1",
      order: "DESC",
      address: TREASURY_ADDRESS
    });

    res.status(200).json({
      balances: balancesResponse.toJSON().result,
      transactions: txResponse.toJSON().result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching treasury data' });
  }
} 