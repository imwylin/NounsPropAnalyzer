import React, { useMemo } from 'react';
import { FrontendTransaction } from '../types/frontend';
import { TimeRange } from '../types/time';
import { Contract } from '../../../lib/types';
import styles from './TransactionAnalysis.module.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '180d', label: '180 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' }
];

interface TransactionAnalysisProps {
  transactions: FrontendTransaction[];
  selectedContract: Contract;
  prices: Record<string, number>;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const parseValue = (value: string): number => {
  try {
    console.log('Raw value:', value, typeof value);
    
    // Handle null, undefined, or empty string
    if (!value) return 0;
    
    // If value is already a number, just convert to ETH
    if (typeof value === 'number') {
      return value / 1e18;
    }

    // Try parsing as regular number first
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      return numericValue / 1e18;
    }

    // If that fails, try cleaning the string and parsing
    const cleanValue = value.toString().replace(/[^0-9-]/g, '');
    console.log('Cleaned value:', cleanValue);
    
    if (!cleanValue || cleanValue === '-') return 0;
    
    // Try parsing as regular number again
    const parsedValue = Number(cleanValue);
    if (!isNaN(parsedValue)) {
      return parsedValue / 1e18;
    }

    return 0;
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error parsing value:', {
      originalValue: value,
      type: typeof value,
      error: error.message
    });
    return 0;
  }
};

export const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({
  transactions,
  selectedContract,
  prices,
  timeRange,
  onTimeRangeChange,
}) => {
  const analysis = useMemo(() => {
    // Group transactions by day and calculate inflow/outflow
    const timeSeriesData = transactions.reduce((acc, tx) => {
      const timestamp = parseInt(tx.timeStamp) * 1000; // Convert to milliseconds
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          timestamp,
          inflow: 0,
          outflow: 0,
          cumulativeInflow: 0,
          cumulativeOutflow: 0
        };
      }

      let value = 0;
      // Only handle ETH and ETH-equivalent token transfers
      switch (tx.type) {
        case 'normal':
        case 'internal':
          // For ETH transfers, use the value field directly
          value = parseValue(tx.value);
          break;
        case 'erc20':
          // For ERC20, check if it's one of our tracked ETH-equivalent tokens
          if (tx.tokenData) {
            const symbol = tx.tokenData.symbol?.toLowerCase();
            if (symbol === 'weth' || symbol === 'steth' || symbol === 'wsteth' || symbol === 'reth') {
              // All these tokens use 18 decimals
              value = parseValue(tx.tokenData.amount);
            }
          }
          break;
        // Ignore NFT transactions (erc721 and erc1155)
      }

      const isInflow = tx.to.toLowerCase() === selectedContract.address.toLowerCase();
      
      if (isInflow) {
        acc[date].inflow += value;
      } else {
        acc[date].outflow += value;
      }

      return acc;
    }, {} as Record<string, {
      date: string;
      timestamp: number;
      inflow: number;
      outflow: number;
      cumulativeInflow: number;
      cumulativeOutflow: number;
    }>);

    // Convert to array and calculate cumulative values
    const chartData = Object.values(timeSeriesData)
      .sort((a, b) => a.timestamp - b.timestamp)
      .reduce((acc, point) => {
        const prev = acc[acc.length - 1];
        const newPoint = {
          ...point,
          cumulativeInflow: (prev?.cumulativeInflow || 0) + point.inflow,
          cumulativeOutflow: (prev?.cumulativeOutflow || 0) + point.outflow
        };
        acc.push(newPoint);
        return acc;
      }, [] as Array<{
        date: string;
        timestamp: number;
        inflow: number;
        outflow: number;
        cumulativeInflow: number;
        cumulativeOutflow: number;
      }>);

    return {
      chartData,
      valueAnalysis: {
        incoming: chartData.reduce((sum, d) => sum + (d.inflow > 0 ? 1 : 0), 0),
        outgoing: chartData.reduce((sum, d) => sum + (d.outflow > 0 ? 1 : 0), 0),
        totalIncomingValue: chartData[chartData.length - 1]?.cumulativeInflow || 0,
        totalOutgoingValue: chartData[chartData.length - 1]?.cumulativeOutflow || 0
      }
    };
  }, [transactions, selectedContract]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.analysis}>
      <div className={styles.timeRangeSelector}>
        {TIME_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`${styles.timeRangeButton} ${timeRange === option.value ? styles.active : ''}`}
            onClick={() => onTimeRangeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={analysis.chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ff4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatDate}
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                stroke="var(--border)"
                type="number"
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                stroke="var(--border)"
                tickFormatter={value => `${value.toFixed(2)} ETH`}
              />
              <Tooltip 
                contentStyle={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px'
                }}
                labelFormatter={value => formatDate(value as number)}
                formatter={(value: number) => [`${value.toFixed(4)} ETH`, '']}
              />
              <Area
                type="monotone"
                dataKey="cumulativeInflow"
                stroke="var(--accent-success)"
                fillOpacity={1}
                fill="url(#inflowGradient)"
                name="Inflow"
              />
              <Area
                type="monotone"
                dataKey="cumulativeOutflow"
                stroke="#ff4444"
                fillOpacity={1}
                fill="url(#outflowGradient)"
                name="Outflow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.label}>Total Inflow</span>
            <span className={styles.value}>
              {analysis.valueAnalysis.totalIncomingValue.toFixed(4)} ETH
              {prices?.ETH && (
                <small>
                  ${(analysis.valueAnalysis.totalIncomingValue * prices.ETH).toLocaleString()}
                </small>
              )}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Total Outflow</span>
            <span className={styles.value}>
              {analysis.valueAnalysis.totalOutgoingValue.toFixed(4)} ETH
              {prices?.ETH && (
                <small>
                  ${(analysis.valueAnalysis.totalOutgoingValue * prices.ETH).toLocaleString()}
                </small>
              )}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Net Flow</span>
            <span className={styles.value}>
              {(analysis.valueAnalysis.totalIncomingValue - analysis.valueAnalysis.totalOutgoingValue).toFixed(4)} ETH
              {prices?.ETH && (
                <small>
                  ${((analysis.valueAnalysis.totalIncomingValue - analysis.valueAnalysis.totalOutgoingValue) * prices.ETH).toLocaleString()}
                </small>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 