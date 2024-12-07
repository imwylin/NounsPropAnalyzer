import type { AIAnalysisResult } from '../../../../types/graphql'

export interface BusinessRule {
  id: string
  name: string
  validate: (result: AIAnalysisResult) => ValidationResult
  severity: 'WARNING' | 'ERROR'
}

export interface ValidationResult {
  valid: boolean
  message: string
}

export interface ValidationError {
  rule: string
  message: string
  severity: 'WARNING' | 'ERROR'
}

const businessRules: BusinessRule[] = [
  {
    id: 'CLASSIFICATION_RISK_ALIGNMENT',
    name: 'Classification and Risk Alignment',
    severity: 'ERROR',
    validate: (result: AIAnalysisResult): ValidationResult => {
      if (result.classification === 'CHARITABLE' && 
          result.risk_assessment.private_benefit_risk === 'HIGH') {
        return {
          valid: false,
          message: 'Charitable classification conflicts with high private benefit risk'
        }
      }
      return { valid: true, message: '' }
    }
  },
  {
    id: 'UNALLOWABLE_ELEMENTS_CONSISTENCY',
    name: 'Unallowable Elements Consistency',
    severity: 'WARNING',
    validate: (result: AIAnalysisResult): ValidationResult => {
      const hasActualUnallowableElements = result.unallowable_elements.some(element => {
        const lowerElement = element.toLowerCase()
        const negativeIndicators = [
          'no ', 
          'none ', 
          'not ', 
          'there are no',
          'none identified',
          'no concerning',
          'no specific',
          'aligns with',
          'consistent with'
        ]
        return !negativeIndicators.some(indicator => lowerElement.includes(indicator))
      })

      if (result.classification === 'CHARITABLE' && hasActualUnallowableElements) {
        return {
          valid: false,
          message: 'Proposal contains unallowable elements that may need review'
        }
      }
      return { valid: true, message: '' }
    }
  },
  {
    id: 'COMPLEXITY_MODIFICATIONS',
    name: 'Implementation Complexity vs Modifications',
    severity: 'WARNING',
    validate: (result: AIAnalysisResult): ValidationResult => {
      if (result.risk_assessment.implementation_complexity === 'LOW' &&
          result.required_modifications.length > 3) {
        return {
          valid: false,
          message: 'Low implementation complexity conflicts with number of required modifications'
        }
      }
      return { valid: true, message: '' }
    }
  },
  {
    id: 'MISSION_ALIGNMENT_CHECK',
    name: 'Mission Alignment Requirements',
    severity: 'ERROR',
    validate: (result: AIAnalysisResult): ValidationResult => {
      if (result.classification === 'CHARITABLE' &&
          result.risk_assessment.mission_alignment === 'WEAK') {
        return {
          valid: false,
          message: 'Charitable proposals must have moderate or strong mission alignment'
        }
      }
      return { valid: true, message: '' }
    }
  }
]

export function validateBusinessLogic(result: AIAnalysisResult): ValidationError[] {
  const errors: ValidationError[] = []
  
  for (const rule of businessRules) {
    const validation = rule.validate(result)
    if (!validation.valid) {
      errors.push({
        rule: rule.name,
        message: validation.message,
        severity: rule.severity
      })
    }
  }
  
  return errors
} 