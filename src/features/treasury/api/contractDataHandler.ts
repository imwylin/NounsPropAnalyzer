import { NextApiRequest, NextApiResponse } from 'next';
import { FrontendTransaction } from '../types/frontend';
import type { 
  BaseTransaction, 
  ERC20Transfer, 
  ERC721Transfer, 
  ERC1155Transfer 
} from '../types/etherscan';
import { Database } from '../../../lib/db/index';
import { getContractTransactions } from '../lib/queries';

function isERC20Transfer(tx: BaseTransaction): tx is ERC20Transfer {
  return tx.type === 'erc20';
}

function isERC721Transfer(tx: BaseTransaction): tx is ERC721Transfer {
  return tx.type === 'erc721';
}

function isERC1155Transfer(tx: BaseTransaction): tx is ERC1155Transfer {
  return tx.type === 'erc1155';
}

function transformTransaction(tx: BaseTransaction): FrontendTransaction {
  const base: FrontendTransaction = {
    hash: tx.hash,
    blockNumber: tx.blockNumber,
    timeStamp: tx.timeStamp,
    from: tx.from,
    to: tx.to,
    value: tx.value || '0',
    type: tx.type,
    gas: tx.gas || '0',
    gasPrice: tx.gasPrice || '0',
    gasUsed: tx.gasUsed || '0',
    nonce: tx.nonce || '0',
    input: tx.input || '',
    contractAddress: tx.contractAddress || '',
    isError: tx.isError || '0',
    txreceipt_status: tx.txreceipt_status || '1',
    methodId: tx.methodId,
    functionName: tx.functionName
  };

  if (isERC20Transfer(tx)) {
    return {
      ...base,
      tokenData: {
        symbol: tx.tokenSymbol,
        amount: tx.value,
        tokenName: tx.tokenName,
        tokenDecimal: tx.tokenDecimal
      }
    };
  }

  if (isERC721Transfer(tx)) {
    return {
      ...base,
      tokenData: {
        symbol: tx.tokenSymbol,
        amount: '1', // NFTs always transfer 1 token
        tokenName: tx.tokenName,
        tokenDecimal: tx.tokenDecimal,
        tokenID: tx.tokenID
      }
    };
  }

  if (isERC1155Transfer(tx)) {
    return {
      ...base,
      tokenData: {
        symbol: tx.tokenSymbol,
        amount: tx.tokenValue,
        tokenName: tx.tokenName,
        tokenID: tx.tokenID
      }
    };
  }

  return base;
}

export default async function contractDataHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { address, page = '1', limit = '10' } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    // Get contract from database
    const contract = await Database.getContract(address);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Get transactions from database using the query helper
    const { transactions, pagination } = await getContractTransactions(
      address,
      pageNum,
      limitNum
    );

    // Transform transactions for frontend
    const paginatedTransactions = transactions
      .map(transformTransaction)
      .sort((a: FrontendTransaction, b: FrontendTransaction) => 
        Number(b.timeStamp) - Number(a.timeStamp)
      );

    return res.status(200).json({
      transactions: paginatedTransactions,
      pagination
    });
  } catch (error) {
    console.error('Error in contract data handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 