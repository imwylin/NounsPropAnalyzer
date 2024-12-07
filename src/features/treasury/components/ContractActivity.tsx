import { useState } from 'react';
import { useContractData } from '../context/ContractDataContext';
import { FrontendTransaction } from '../types/frontend';
import styles from './ContractActivity.module.css';

interface Prices {
  ETH: number;
  WETH: number;
  STETH: number;
  WSTETH: number;
  RETH: number;
}

interface ContractActivityProps {
  transactions: FrontendTransaction[];
  isLoading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
  };
  onLoadMore: () => void;
  prices: Prices | null;
}

export function ContractActivity({ 
  transactions, 
  isLoading, 
  pagination, 
  onLoadMore,
  prices 
}: ContractActivityProps) {
  const { state: { contracts } } = useContractData();
  const [isExpanded, setIsExpanded] = useState(false);

  const getContractLabel = (address: string) => {
    const contract = contracts.find(
      c => c.address.toLowerCase() === address.toLowerCase()
    );

    if (contract?.name) {
      return (
        <div className={styles.contractPillWrapper}>
          <a 
            href={`https://etherscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contractPill}
          >
            <span className={styles.contractName}>{contract.name}</span>
          </a>
        </div>
      );
    }

    return (
      <a 
        href={`https://etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.addressLink}
      >
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </a>
    );
  };

  const formatTokenInfo = (tx: FrontendTransaction) => {
    if (tx.type === 'erc20' && tx.tokenData?.symbol) {
      return {
        symbol: tx.tokenData.symbol,
        name: tx.tokenData.tokenName,
        tokenId: tx.tokenData.tokenID
      };
    }
    return {
      symbol: 'ETH',
      name: 'Ethereum',
      tokenId: undefined
    };
  };

  const formatValue = (tx: FrontendTransaction) => {
    let value: number;
    let symbol: string;

    if (tx.type === 'erc20' && tx.tokenData?.amount) {
      const decimals = parseInt(tx.tokenData.tokenDecimal || '18');
      value = parseFloat(tx.tokenData.amount) / Math.pow(10, decimals);
      symbol = tx.tokenData.symbol;
    } else {
      value = parseFloat(tx.value) / 1e18;
      symbol = 'ETH';
    }

    let usdValue: number | undefined;
    if (prices) {
      if (symbol === 'ETH') usdValue = value * prices.ETH;
      else if (symbol === 'WETH') usdValue = value * prices.WETH;
      else if (symbol === 'STETH') usdValue = value * prices.STETH;
      else if (symbol === 'WSTETH') usdValue = value * prices.WSTETH;
      else if (symbol === 'RETH') usdValue = value * prices.RETH;
    }

    return {
      formatted: value.toFixed(value < 0.0001 ? 8 : 4),
      usdValue: usdValue ? usdValue.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) : undefined
    };
  };

  const formatGas = (tx: FrontendTransaction) => {
    const gasUsed = parseFloat(tx.gasUsed);
    const gasPrice = parseFloat(tx.gasPrice) / 1e9; // Convert to Gwei
    const gasCost = (gasUsed * parseFloat(tx.gasPrice)) / 1e18; // Convert to ETH

    return {
      gasUsed: `${gasUsed.toLocaleString()} gas`,
      gasPrice: `${gasPrice.toFixed(2)} Gwei`,
      gasCost: `${gasCost.toFixed(6)} ETH`
    };
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const formatFunctionInfo = (tx: FrontendTransaction) => {
    if (tx.type === 'normal') {
      if (tx.functionName) {
        // Split function name and parameters, handling edge cases
        const match = tx.functionName.match(/^([^(]+)(\(.*\))?$/);
        if (match) {
          const [, name, params = ''] = match;
          return {
            name: name.trim(),
            params: params.trim(),
            methodId: tx.methodId || ''
          };
        }
      }
      if (tx.methodId) {
        return {
          name: '',
          params: '',
          methodId: tx.methodId
        };
      }
    } else if (tx.type === 'erc20') {
      return {
        name: 'Transfer',
        params: tx.tokenData ? `(${tx.tokenData.symbol})` : '',
        methodId: tx.methodId || ''
      };
    } else if (tx.type === 'erc721' || tx.type === 'erc1155') {
      return {
        name: 'Transfer',
        params: tx.tokenData ? `(TokenId: ${tx.tokenData.tokenID})` : '',
        methodId: tx.methodId || ''
      };
    }
    return {
      name: '',
      params: '',
      methodId: ''
    };
  };

  const getTransactionType = (tx: FrontendTransaction) => {
    if (tx.type === 'normal') {
      if (tx.functionName) {
        return {
          label: 'Contract',
          style: styles.typeContract
        };
      }
      return {
        label: 'ETH',
        style: styles.typeEth
      };
    }
    if (tx.type === 'internal') {
      return {
        label: 'Internal',
        style: styles.typeInternal
      };
    }
    if (tx.type === 'erc20') {
      return {
        label: tx.tokenData?.symbol || 'ERC20',
        style: styles.typeErc20
      };
    }
    if (tx.type === 'erc721') {
      return {
        label: 'NFT',
        style: styles.typeErc721
      };
    }
    if (tx.type === 'erc1155') {
      return {
        label: 'Multi-Token',
        style: styles.typeErc1155
      };
    }
    return {
      label: tx.type,
      style: styles.typeDefault
    };
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerContent}>
          <h3>Transaction History</h3>
          <span className={styles.transactionCount}>
            {(pagination.totalItems || 0).toLocaleString()} transactions
          </span>
        </div>
        <button 
          className={`${styles.toggleButton} ${isExpanded ? styles.expanded : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'} Transactions
        </button>
      </div>

      {isExpanded && (
        <div className={styles.container}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Value</th>
                <th>Gas</th>
                <th>Function</th>
                <th>Block</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => {
                const time = formatDate(tx.timeStamp);
                const token = formatTokenInfo(tx);
                const value = formatValue(tx);
                const gas = formatGas(tx);
                const func = formatFunctionInfo(tx);
                const type = getTransactionType(tx);

                return (
                  <tr key={`${tx.hash}-${index}`}>
                    <td>
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.txLink}
                      >
                        {time.date}
                      </a>
                    </td>
                    <td>
                      <span className={`${styles.txType} ${type.style}`}>
                        {type.label}
                      </span>
                    </td>
                    <td>{getContractLabel(tx.from)}</td>
                    <td>{getContractLabel(tx.to)}</td>
                    <td className={styles.txValue}>
                      <div className={styles.valueStack}>
                        <span className={styles.amount}>{value.formatted} {token.symbol}</span>
                        {value.usdValue && (
                          <span className={styles.usdValue}>{value.usdValue}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.gasPills}>
                        <span className={styles.gasPill}>{gas.gasUsed}</span>
                        <span className={styles.gasPill}>{gas.gasPrice}</span>
                        <span className={styles.gasPill}>{gas.gasCost}</span>
                      </div>
                    </td>
                    <td className={styles.functionCell}>
                      {(func.name || func.methodId) ? (
                        <div className={styles.functionStack}>
                          {func.name && (
                            <div className={styles.functionNameWrapper}>
                              <span className={styles.functionName}>{func.name}</span>
                              {func.params && (
                                <span className={styles.functionParams}>{func.params}</span>
                              )}
                            </div>
                          )}
                          {func.methodId && (
                            <span className={styles.methodId}>{func.methodId}</span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.noFunction}>-</span>
                      )}
                    </td>
                    <td>
                      <a
                        href={`https://etherscan.io/block/${tx.blockNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blockLink}
                      >
                        {tx.blockNumber}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {isLoading && (
            <div className={styles.loading}>Loading transactions...</div>
          )}
          {!isLoading && pagination.hasMore && (
            <button 
              className={styles.loadMore}
              onClick={onLoadMore}
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
} 