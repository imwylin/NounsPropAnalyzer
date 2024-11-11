import type { ParsedAnalysis } from '../../types/parser'

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
function validateAnalysis(analysis: any): asserts analysis is ParsedAnalysis {
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

  // Validate risk assessment
  const riskFields = [
    'private_benefit_risk',
    'mission_alignment',
    'implementation_complexity'
  ]

  for (const field of riskFields) {
    if (!(field in analysis.risk_assessment)) {
      throw new Error(`Missing risk assessment field: ${field}`)
    }
  }
} 