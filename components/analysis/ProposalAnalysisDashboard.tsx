import { useProposalAnalysis } from '../../hooks/useProposalAnalysis'
import { ComplianceIndicators } from './ComplianceIndicators'
import { CharitableBreakdown } from './CharitableBreakdown'
import type { Classification, RiskLevel } from '../../types/parser'

interface ProposalAnalysisDashboardProps {
  proposalId: number
}

/**
 * Dashboard component displaying proposal details and 501c3 analysis
 */
export function ProposalAnalysisDashboard({
  proposalId
}: ProposalAnalysisDashboardProps) {
  const {
    data,
    isLoading,
    isError,
    error
  } = useProposalAnalysis({
    proposalId
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p>Analyzing proposal {proposalId}...</p>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="p-6 text-red-500">
        <p>Error: {error?.message || 'Failed to load proposal analysis'}</p>
      </div>
    )
  }

  // No data state
  if (!data) {
    return (
      <div className="p-6 text-center">
        <p>No analysis available for proposal {proposalId}</p>
      </div>
    )
  }

  const { analysis } = data

  return (
    <div className="space-y-8 p-6">
      {/* Proposal Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          Proposal {proposalId}
        </h1>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium
            ${getClassificationColor(analysis?.classification)}`}>
            {analysis?.classification || 'Unclassified'}
          </span>
          {analysis?.risk_assessment && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium
              ${getRiskLevelColor(analysis.risk_assessment.private_benefit_risk)}`}>
              {analysis.risk_assessment.private_benefit_risk} Risk
            </span>
          )}
        </div>
      </header>

      {/* Analysis Content */}
      {analysis && (
        <div className="space-y-6">
          <ComplianceIndicators analysis={analysis} />
          <CharitableBreakdown analysis={analysis} />
        </div>
      )}
    </div>
  )
}

// Utility functions for styling
function getClassificationColor(classification?: Classification): string {
  switch (classification) {
    case 'CHARITABLE':
      return 'bg-green-100 text-green-800'
    case 'OPERATIONAL':
      return 'bg-blue-100 text-blue-800'
    case 'MARKETING':
      return 'bg-purple-100 text-purple-800'
    case 'PROGRAM_RELATED':
      return 'bg-yellow-100 text-yellow-800'
    case 'UNALLOWABLE':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRiskLevelColor(risk?: RiskLevel): string {
  switch (risk) {
    case 'LOW':
      return 'bg-green-100 text-green-800'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800'
    case 'HIGH':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
} 