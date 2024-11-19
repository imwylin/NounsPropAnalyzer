import type { 
  AIAnalysisResult, 
  ValidationError, 
  ConfidenceScores 
} from '../../types/graphql'

export const CONFIDENCE_THRESHOLDS = {
  CLASSIFICATION: {
    CHARITABLE: 0.85,
    UNALLOWABLE: 0.90,
    PROGRAM_RELATED: 0.80
  },
  RISK_ASSESSMENT: {
    PRIVATE_BENEFIT: 0.80,
    MISSION_ALIGNMENT: 0.85,
    IMPLEMENTATION: 0.75
  }
} as const

export interface ConfidenceValidationResult {
  passed: boolean
  needs_human_review: boolean
  violations: ConfidenceViolation[]
}

export interface ConfidenceViolation {
  field: string
  threshold: number
  actual: number
  severity: 'WARNING' | 'ERROR'
}

function validateClassificationConfidence(
  classification: string,
  score: number
): ConfidenceViolation | null {
  const threshold = CONFIDENCE_THRESHOLDS.CLASSIFICATION[classification as keyof typeof CONFIDENCE_THRESHOLDS.CLASSIFICATION]
  
  if (!threshold) {
    return null
  }

  if (score < threshold) {
    return {
      field: 'classification',
      threshold,
      actual: score,
      severity: 'ERROR'
    }
  }

  return null
}

function validateRiskAssessmentConfidence(
  scores: ConfidenceScores['risk_assessment']
): ConfidenceViolation[] {
  const violations: ConfidenceViolation[] = []

  if (scores.private_benefit_risk < CONFIDENCE_THRESHOLDS.RISK_ASSESSMENT.PRIVATE_BENEFIT) {
    violations.push({
      field: 'private_benefit_risk',
      threshold: CONFIDENCE_THRESHOLDS.RISK_ASSESSMENT.PRIVATE_BENEFIT,
      actual: scores.private_benefit_risk,
      severity: 'WARNING'
    })
  }

  if (scores.mission_alignment < CONFIDENCE_THRESHOLDS.RISK_ASSESSMENT.MISSION_ALIGNMENT) {
    violations.push({
      field: 'mission_alignment',
      threshold: CONFIDENCE_THRESHOLDS.RISK_ASSESSMENT.MISSION_ALIGNMENT,
      actual: scores.mission_alignment,
      severity: 'WARNING'
    })
  }

  if (scores.implementation_complexity < CONFIDENCE_THRESHOLDS.RISK_ASSESSMENT.IMPLEMENTATION) {
    violations.push({
      field: 'implementation_complexity',
      threshold: CONFIDENCE_THRESHOLDS.RISK_ASSESSMENT.IMPLEMENTATION,
      actual: scores.implementation_complexity,
      severity: 'WARNING'
    })
  }

  return violations
}

function determineHumanReviewNeed(
  result: AIAnalysisResult, 
  violations: ConfidenceViolation[],
  businessWarnings: ValidationError[]
): boolean {
  // Confidence-based triggers
  const lowConfidence = 
    result.confidence_scores.classification < 0.75 ||
    result.confidence_scores.risk_assessment.private_benefit_risk < 0.70 ||
    result.confidence_scores.risk_assessment.mission_alignment < 0.70 ||
    result.confidence_scores.risk_assessment.implementation_complexity < 0.70

  // Risk-based triggers
  const highRisk = 
    result.risk_assessment.private_benefit_risk === 'HIGH' ||
    result.risk_assessment.mission_alignment === 'WEAK' ||
    result.risk_assessment.implementation_complexity === 'HIGH'

  // Validation-based triggers
  const validationIssues = 
    violations.some(v => v.severity === 'ERROR') ||
    violations.length >= 2 ||
    businessWarnings.length > 0

  // Content-based triggers
  const contentIssues = 
    result.unallowable_elements.length > 0 ||
    result.required_modifications.length >= 3

  // Classification-based triggers
  const sensitiveClassification = 
    result.classification === 'CHARITABLE' ||
    result.classification === 'PROGRAM_RELATED'

  return lowConfidence || 
         highRisk || 
         validationIssues || 
         (contentIssues && sensitiveClassification)
}

export function validateConfidence(result: AIAnalysisResult, businessWarnings: ValidationError[] = []): ConfidenceValidationResult {
  const violations: ConfidenceViolation[] = []

  // Check classification confidence
  const classificationViolation = validateClassificationConfidence(
    result.classification,
    result.confidence_scores.classification
  )
  if (classificationViolation) {
    violations.push(classificationViolation)
  }

  // Check risk assessment confidences
  violations.push(...validateRiskAssessmentConfidence(result.confidence_scores.risk_assessment))

  const needs_human_review = determineHumanReviewNeed(result, violations, businessWarnings)

  return {
    passed: violations.length === 0,
    needs_human_review,
    violations
  }
} 