export type Classification = 'CHARITABLE' | 'OPERATIONAL' | 'MARKETING' | 'PROGRAM_RELATED' | 'UNALLOWABLE'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type AlignmentLevel = 'STRONG' | 'MODERATE' | 'WEAK'
export type ComplexityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface RiskAssessment {
  private_benefit_risk: RiskLevel
  mission_alignment: AlignmentLevel
  implementation_complexity: ComplexityLevel
}

export interface RawAnalysis {
  raw: string
}

export interface ParsedAnalysis {
  id: string
  timestamp: string
  classification: Classification
  primary_purpose: string
  allowable_elements: string[]
  unallowable_elements: string[]
  required_modifications: string[]
  risk_assessment: RiskAssessment
  key_considerations: string[]
} 