import { Transaction, NativeTransfer, NFTTransfer, ERC20Transfer } from './types';
import { ADDRESSES, getContractDetails } from './contracts';

export function processTransaction(tx: any, type: 'auction' | 'treasury' | 'tokenBuyer' | 'usdcPayer') {
  const isNounsTransfer = tx.nft_transfers?.some((transfer: NFTTransfer) => 
    transfer.token_address.toLowerCase() === ADDRESSES.NOUNS_TOKEN.toLowerCase()
  );

  const hasEthTransfer = tx.native_transfers && tx.native_transfers.length > 0;
  const hasErc20Transfer = tx.erc20_transfers && tx.erc20_transfers.length > 0;
  const ethAmount = hasEthTransfer ? tx.native_transfers[0].value_formatted : null;

  let category = 'Contract Interaction';
  let description = 'Contract Interaction';
  let contractDetails = '';
  let direction = '';

  // Determine direction for ETH and ERC-20 transfers
  if ((type === 'treasury' || type === 'usdcPayer' || type === 'tokenBuyer') && (hasEthTransfer || hasErc20Transfer)) {
    const contractAddress = type === 'treasury' 
      ? ADDRESSES.TREASURY 
      : type === 'usdcPayer'
        ? ADDRESSES.USDC_PAYER
        : ADDRESSES.TOKEN_BUYER;

    if (hasEthTransfer) {
      const fromContract = tx.native_transfers[0].from_address.toLowerCase() === contractAddress.toLowerCase();
      direction = fromContract ? 'Outbound' : 'Inbound';
    } else if (hasErc20Transfer) {
      const fromContract = tx.erc20_transfers[0].from_address.toLowerCase() === contractAddress.toLowerCase();
      direction = fromContract ? 'Outbound' : 'Inbound';
    }
  }

  // Get contract details
  if (tx.to_address) {
    contractDetails = getContractDetails(tx.to_address);
    if (contractDetails !== 'Unknown Contract') {
      description = `Interaction with ${contractDetails}`;
    }
  }

  // Categorize transaction
  if (isNounsTransfer) {
    const nftTransfer = tx.nft_transfers.find((t: NFTTransfer) => 
      t.token_address.toLowerCase() === ADDRESSES.NOUNS_TOKEN.toLowerCase()
    );
    category = 'NFT Transfer';
    description = `Noun #${nftTransfer.token_id} Transfer`;
  } else if (type === 'auction' && hasEthTransfer) {
    category = 'Auction Bid';
    description = `Bid ${ethAmount} ETH`;
  } else if (hasEthTransfer) {
    category = 'ETH Transfer';
    description = `${ethAmount} ETH`;
  } else if (hasErc20Transfer) {
    const erc20Transfer = tx.erc20_transfers[0];
    category = 'Token Transfer';
    description = `${erc20Transfer.value_formatted} ${erc20Transfer.token_symbol}`;
  }

  return {
    ...tx,
    type,
    category,
    description,
    source: type,
    contractDetails,
    direction
  } as Transaction;
} 