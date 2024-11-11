import type { ParsedAnalysis } from '../../types/parser'

interface ComplianceIndicatorsProps {
  analysis: ParsedAnalysis
}

/**
 * Visual indicators for proposal's 501c3 compliance status
 */
export function ComplianceIndicators({ analysis }: ComplianceIndicatorsProps) {
  const {
    classification,
    risk_assessment: {
      private_benefit_risk,
      mission_alignment,
      implementation_complexity
    }
  } = analysis

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Classification */}
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Classification
          </div>
          <div className={`inline-flex px-2 py-1 rounded-full text-sm font-medium
            ${getClassificationColor(classification)}`}>
            {classification}
          </div>
        </div>

        {/* Private Benefit Risk */}
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Private Benefit Risk
          </div>
          <div className={`inline-flex px-2 py-1 rounded-full text-sm font-medium
            ${getRiskLevelColor(private_benefit_risk)}`}>
            {private_benefit_risk}
          </div>
        </div>

        {/* Mission Alignment */}
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Mission Alignment
          </div>
          <div className={`inline-flex px-2 py-1 rounded-full text-sm font-medium
            ${getAlignmentColor(mission_alignment)}`}>
            {mission_alignment}
          </div>
        </div>

        {/* Implementation Complexity */}
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Complexity
          </div>
          <div className={`inline-flex px-2 py-1 rounded-full text-sm font-medium
            ${getComplexityColor(implementation_complexity)}`}>
            {implementation_complexity}
          </div>
        </div>
      </div>
    </div>
  )
}

// Utility functions for styling
function getClassificationColor(classification: string): string {
  const colors = {
    CHARITABLE: 'bg-green-100 text-green-800',
    OPERATIONAL: 'bg-blue-100 text-blue-800',
    MARKETING: 'bg-purple-100 text-purple-800',
    PROGRAM_RELATED: 'bg-yellow-100 text-yellow-800',
    UNALLOWABLE: 'bg-red-100 text-red-800'
  }
  return colors[classification as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getRiskLevelColor(risk: string): string {
  const colors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800'
  }
  return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getAlignmentColor(alignment: string): string {
  const colors = {
    STRONG: 'bg-green-100 text-green-800',
    MODERATE: 'bg-yellow-100 text-yellow-800',
    WEAK: 'bg-red-100 text-red-800'
  }
  return colors[alignment as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getComplexityColor(complexity: string): string {
  const colors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800'
  }
  return colors[complexity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
} 