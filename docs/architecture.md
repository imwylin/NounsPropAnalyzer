# System Architecture

## Overview

The Nouns 501c3 Analysis system provides automated analysis of DAO proposals for charitable compliance. It combines on-chain data with AI-powered analysis to assess 501c3 eligibility.

## Core Components

### Data Layer
- `hooks/useProposalCount.ts`: Fetches total proposal count
- `hooks/useProposalBatch.ts`: Loads proposal data in batches
- `hooks/useProposalAnalysis.ts`: Combines proposal data with analysis

### Analysis Components
- `components/analysis/ProposalAnalysisDashboard.tsx`: Main analysis view
- `components/analysis/ComplianceIndicators.tsx`: Visual compliance status
- `components/analysis/CharitableBreakdown.tsx`: Detailed analysis breakdown

### Parser Components
- `components/parser/AnalysisTable.tsx`: Data grid for analysis results
- `components/parser/FilterBar.tsx`: Analysis filtering interface
- `components/parser/ExportControls.tsx`: Export functionality

### API Routes
- `pages/api/analyze.ts`: Claude integration for proposal analysis

## Data Flow

1. User requests proposal analysis
2. System fetches on-chain data via Wagmi hooks
3. Data is sent to Claude for analysis
4. Results are parsed and displayed
5. Users can filter, sort, and export results

## Type System

Core types are defined in:
- `types/nouns.ts`: DAO contract interfaces
- `types/parser.ts`: Analysis data structures

## Integration Points

- Ethereum: Via Wagmi/Viem
- AI Analysis: Claude API
- Data Export: CSV/XLSX generation 