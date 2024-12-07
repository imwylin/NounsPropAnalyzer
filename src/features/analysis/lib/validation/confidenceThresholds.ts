import type { 
  AIAnalysisResult, 
  ValidationError
} from '../../../../types/graphql'

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
  reviewReasons: string[]
}

export interface ConfidenceViolation {
  field: string
  threshold: number
  actual: number
  severity: 'WARNING' | 'ERROR'
}

// Update ModificationAssessment interface with new severity levels
export interface ModificationAssessment {
  severity: 'STRUCTURAL' | 'SUBSTANTIVE' | 'PROCEDURAL' | 'MINOR'
  reason: string
  categories: {
    governance: number
    financial: number
    operational: number
    compliance: number
    documentation: number
  }
}

export function assessModifications(modifications: string[]): ModificationAssessment {
  // Categorization keywords
  const categories = {
    governance: [
      'governance', 'oversight', 'voting', 'control', 'board',
      'decision', 'authority', 'policy', 'leadership', 'stakeholder'
    ],
    financial: [
      'budget', 'cost', 'fund', 'expense', 'revenue',
      'payment', 'allocation', 'financial', 'monetary', 'treasury'
    ],
    operational: [
      'process', 'implement', 'execute', 'manage', 'coordinate',
      'organize', 'operate', 'conduct', 'perform', 'deliver'
    ],
    compliance: [
      'compliance', 'regulatory', 'legal', 'requirement', 'guideline',
      'standard', 'rule', 'policy', 'restriction', 'limitation'
    ],
    documentation: [
      'document', 'report', 'record', 'track', 'measure',
      'monitor', 'assess', 'evaluate', 'verify', 'audit'
    ]
  }

  // Impact keywords indicating severity
  const impactKeywords = {
    structural: [  // Core changes that fundamentally alter the proposal
      'fundamental', 'comprehensive', 'restructure', 'redefine',
      'overhaul', 'redesign', 'transform', 'rebuild', 'revise entirely',
      'significant change', 'major revision', 'complete overhaul',
      'reorient', 'pivot', 'realign'
    ],
    substantive: [  // Changes to what the proposal will do/deliver
      'add', 'remove', 'modify', 'change', 'adjust',
      'incorporate', 'integrate', 'introduce', 'include', 'exclude',
      'replace', 'update', 'expand', 'reduce', 'allocate',
      'develop program', 'create system', 'build mechanism'
    ],
    procedural: [  // Changes to how things will be done/managed
      'establish', 'implement', 'document', 'track', 'report',
      'monitor', 'formalize', 'standardize', 'outline', 'define',
      'specify', 'set guidelines', 'detail workflow', 'measure',
      'ensure', 'verify', 'demonstrate', 'maintain', 'coordinate',
      'manage', 'oversee', 'control', 'govern'
    ],
    minor: [  // Refinements and clarifications
      'review', 'consider', 'suggest', 'recommend', 'explore',
      'assess', 'evaluate', 'examine', 'investigate', 'analyze',
      'clarify', 'enhance', 'refine', 'optimize', 'improve',
      'elaborate', 'explain'
    ]
  }

  // Initialize category counts
  const categoryCounts = {
    governance: 0,
    financial: 0,
    operational: 0,
    compliance: 0,
    documentation: 0
  }

  // Count severity by category
  let structuralCount = 0
  let substantiveCount = 0
  let proceduralCount = 0
  let minorCount = 0

  modifications.forEach(mod => {
    const modText = mod.toLowerCase()

    // Count categories
    Object.entries(categories).forEach(([category, keywords]) => {
      if (keywords.some(word => modText.includes(word))) {
        categoryCounts[category as keyof typeof categoryCounts]++
      }
    })

    // Determine severity
    if (impactKeywords.structural.some(word => modText.includes(word))) {
      structuralCount++
    } else if (impactKeywords.substantive.some(word => modText.includes(word))) {
      substantiveCount++
    } else if (impactKeywords.procedural.some(word => modText.includes(word))) {
      proceduralCount++
    } else {
      minorCount++
    }
  })

  // Determine overall severity and reason
  let severity: 'STRUCTURAL' | 'SUBSTANTIVE' | 'PROCEDURAL' | 'MINOR'
  let reason: string

  if (structuralCount > 0) {
    severity = 'STRUCTURAL'
    reason = `Structural modifications needed (${structuralCount} fundamental changes)`
  } else if (substantiveCount >= 2 || modifications.length >= 4) {
    severity = 'SUBSTANTIVE'
    reason = substantiveCount >= 2
      ? `Substantive modifications suggested (${substantiveCount} significant items)`
      : `Multiple modifications needed (${modifications.length} items)`
  } else if (proceduralCount >= 2 || modifications.length >= 3) {
    severity = 'PROCEDURAL'
    reason = proceduralCount >= 2
      ? `Procedural modifications recommended (${proceduralCount} process items)`
      : `Process improvements suggested (${modifications.length} items)`
  } else {
    severity = 'MINOR'
    reason = minorCount > 0
      ? `Minor refinements suggested (${minorCount} items)`
      : "No significant modifications required"
  }

  // Add category context to reason if there's a concentration
  const maxCategory = Object.entries(categoryCounts)
    .reduce((max, [cat, count]) => count > max[1] ? [cat, count] : max, ['', 0])

  if (maxCategory[1] > 1) {
    reason += `, primarily in ${maxCategory[0]} (${maxCategory[1]} items)`
  }

  return {
    severity,
    reason,
    categories: categoryCounts
  }
}

// Add new interface for review reason
export interface HumanReviewReason {
  required: boolean
  reasons: string[]
}

// Update determineHumanReviewNeed to use native confidence
function determineHumanReviewNeed(
  result: AIAnalysisResult, 
  violations: ConfidenceViolation[],
  businessWarnings: ValidationError[]
): HumanReviewReason {
  const reasons: string[] = []

  // Check Claude's native confidence if available
  if (result.native_confidence?.response_confidence) {
    const confidence = result.native_confidence.response_confidence
    if (confidence < 0.7) {  // Example threshold
      reasons.push(`Low overall confidence from Claude (${(confidence * 100).toFixed(1)}%)`)
    }
  }

  // Risk-based triggers
  if (result.risk_assessment.private_benefit_risk === 'HIGH') {
    reasons.push('High private benefit risk')
  }
  if (result.risk_assessment.mission_alignment === 'WEAK') {
    reasons.push('Weak mission alignment')
  }
  if (result.risk_assessment.implementation_complexity === 'HIGH') {
    reasons.push('High implementation complexity')
  }

  // Validation-based triggers
  if (violations.some(v => v.severity === 'ERROR')) {
    const errorViolations = violations.filter(v => v.severity === 'ERROR')
    errorViolations.forEach(violation => {
      switch (violation.field) {
        case 'classification':
          reasons.push(`Classification confidence (${(violation.actual * 100).toFixed(1)}%) below required threshold of ${(violation.threshold * 100).toFixed(1)}%`)
          break
        case 'private_benefit_risk':
          reasons.push(`Private benefit risk assessment confidence (${(violation.actual * 100).toFixed(1)}%) below required threshold of ${(violation.threshold * 100).toFixed(1)}%`)
          break
        case 'mission_alignment':
          reasons.push(`Mission alignment assessment confidence (${(violation.actual * 100).toFixed(1)}%) below required threshold of ${(violation.threshold * 100).toFixed(1)}%`)
          break
        case 'implementation_complexity':
          reasons.push(`Implementation complexity assessment confidence (${(violation.actual * 100).toFixed(1)}%) below required threshold of ${(violation.threshold * 100).toFixed(1)}%`)
          break
        default:
          reasons.push(`${violation.field} confidence (${(violation.actual * 100).toFixed(1)}%) below required threshold of ${(violation.threshold * 100).toFixed(1)}%`)
      }
    })
  } else if (violations.length >= 2) {
    const violationFields = violations.map(v => v.field).join(', ')
    reasons.push(`Multiple confidence concerns in: ${violationFields}`)
  }

  // Track both unallowable element triggers
  const hasUnallowableElements = result.unallowable_elements.some(element => {
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

  const hasUnallowableBusinessWarning = businessWarnings.some(
    warning => warning.rule === 'UNALLOWABLE_ELEMENTS_CONSISTENCY'
  )

  // Add unallowable elements message if either check triggers
  if (hasUnallowableElements || hasUnallowableBusinessWarning) {
    reasons.push('Contains unallowable elements')
  }

  // Business rule warnings - excluding unallowable elements warning
  if (businessWarnings.length > 0) {
    businessWarnings.forEach(warning => {
      switch (warning.rule) {
        case 'CLASSIFICATION_RISK_ALIGNMENT':
          reasons.push('Risk level conflicts with classification')
          break
        case 'UNALLOWABLE_ELEMENTS_CONSISTENCY':
          // Skip - already handled above
          break
        case 'COMPLEXITY_MODIFICATIONS':
          reasons.push('Implementation complexity assessment needs review')
          break
        case 'MISSION_ALIGNMENT_CHECK':
          reasons.push('Mission alignment concerns for classification')
          break
        default:
          if (!warning.message.toLowerCase().includes('unallowable')) {
            reasons.push(`Business rule warning: ${warning.message}`)
          }
      }
    })
  }

  // Modifications assessment
  const modificationAssessment = assessModifications(result.required_modifications)
  if (modificationAssessment.severity === 'STRUCTURAL') {
    reasons.push('Requires structural modifications')
  } else if (modificationAssessment.severity === 'SUBSTANTIVE' && result.classification === 'CHARITABLE') {
    reasons.push('Substantive modifications needed for charitable proposal')
  }

  return {
    required: reasons.length > 0,
    reasons
  }
}

// Update validateConfidence to only use native confidence
export function validateConfidence(result: AIAnalysisResult, businessWarnings: ValidationError[] = []): ConfidenceValidationResult {
  const violations: ConfidenceViolation[] = []

  // Check Claude's native confidence if available
  if (result.native_confidence?.response_confidence) {
    const confidence = result.native_confidence.response_confidence
    if (confidence < 0.7) {  // Example threshold
      violations.push({
        field: 'claude_confidence',
        threshold: 0.7,
        actual: confidence,
        severity: 'WARNING'
      })
    }
  }

  const reviewDecision = determineHumanReviewNeed(result, violations, businessWarnings)

  return {
    passed: violations.length === 0,
    needs_human_review: reviewDecision.required,
    violations,
    reviewReasons: reviewDecision.reasons
  }
} 