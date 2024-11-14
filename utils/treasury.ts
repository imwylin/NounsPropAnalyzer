interface FlowData {
  month: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

export function calculateMoneyFlow(transactions: any[]): FlowData[] {
  const currentYear = new Date().getFullYear();
  const monthlyFlows = new Map<string, { inflow: number; outflow: number }>();

  // Initialize all months of current year
  for (let month = 0; month < 12; month++) {
    const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
    monthlyFlows.set(monthKey, { inflow: 0, outflow: 0 });
  }

  // Process transactions
  transactions.forEach(tx => {
    const date = new Date(tx.block_timestamp);
    if (date.getFullYear() !== currentYear) return;

    const monthKey = `${currentYear}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const flow = monthlyFlows.get(monthKey) || { inflow: 0, outflow: 0 };
    
    if (tx.direction === 'Inbound' && tx.native_transfers?.[0]) {
      flow.inflow += parseFloat(tx.native_transfers[0].value_formatted);
    } else if (tx.direction === 'Outbound' && tx.native_transfers?.[0]) {
      flow.outflow += parseFloat(tx.native_transfers[0].value_formatted);
    }

    monthlyFlows.set(monthKey, flow);
  });

  // Convert to array and calculate net flow
  return Array.from(monthlyFlows.entries())
    .map(([month, { inflow, outflow }]) => ({
      month,
      inflow,
      outflow,
      netFlow: inflow - outflow
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
} 