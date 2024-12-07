import type { ParsedAnalysis, RiskAssessment } from '../types/parser'

/**
 * Parses and validates Claude's analysis response
 */
export function parseAnalysisResponse(response: string): ParsedAnalysis {
  try {
    // Extract JSON between markers
    const match = response.match(/ANALYSIS:::START([\s\S]*?)ANALYSIS:::END/)
    if (!match) {
      throw new Error('Invalid response format')
    }

    // Parse and validate JSON
    const analysis = JSON.parse(match[1].trim()) as ParsedAnalysis
    validateAnalysis(analysis)

    return analysis
  } catch (err) {
    console.error('Failed to parse analysis:', err)
    throw new Error('Failed to parse analysis response')
  }
}

/**
 * Validates the structure of the parsed analysis
 */
function validateAnalysis(analysis: Partial<ParsedAnalysis>): asserts analysis is ParsedAnalysis {
  const required = [
    'id',
    'classification',
    'primary_purpose',
    'allowable_elements',
    'unallowable_elements',
    'required_modifications',
    'risk_assessment'
  ]

  for (const field of required) {
    if (!(field in analysis)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Validate risk assessment fields match RiskAssessment interface
  const riskFields = [
    'private_benefit_risk',
    'mission_alignment',
    'implementation_complexity'
  ] as const

  if (!analysis.risk_assessment || typeof analysis.risk_assessment !== 'object') {
    throw new Error('Invalid risk_assessment structure')
  }

  for (const field of riskFields) {
    if (!(field in analysis.risk_assessment)) {
      throw new Error(`Missing risk assessment field: ${field}`)
    }
  }

  // Additional type validation for risk assessment fields
  const { risk_assessment } = analysis
  if (!isRiskAssessment(risk_assessment)) {
    throw new Error('Invalid risk assessment field values')
  }
}

function isRiskAssessment(value: unknown): value is RiskAssessment {
  if (typeof value !== 'object' || value === null) return false
  
  const assessment = value as Record<string, unknown>
  return (
    'private_benefit_risk' in assessment &&
    'mission_alignment' in assessment &&
    'implementation_complexity' in assessment &&
    ['LOW', 'MEDIUM', 'HIGH'].includes(assessment.private_benefit_risk as string) &&
    ['STRONG', 'MODERATE', 'WEAK'].includes(assessment.mission_alignment as string) &&
    ['LOW', 'MEDIUM', 'HIGH'].includes(assessment.implementation_complexity as string)
  )
} 