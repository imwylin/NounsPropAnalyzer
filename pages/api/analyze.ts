import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { 
  AIAnalysisResult, 
  RiskLevel, 
  MissionAlignment,
  RiskAssessment 
} from '../../types/graphql'
import systemPrompt from '../../AIPrompts/systemprompt.json'
import systemPrompt2 from '../../AIPrompts/systemprompt2.json'
import systemPrompt3 from '../../AIPrompts/systemprompt3.json'
import { validateBusinessLogic, ValidationError } from '../../src/validation/businessRules'
import { validateConfidence, ConfidenceViolation } from '../../src/validation/confidenceThresholds'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ErrorResponse {
  field: string
  message: string
  received?: string
  expected?: string[]
}

// Update the response type to include validation warnings
interface ApiResponse {
  result?: AIAnalysisResult & { rawResponse?: string }
  error?: string
  details?: ErrorResponse
  validationWarnings?: ValidationError[]
  confidenceViolations?: ConfidenceViolation[]
}

// Add helper function for extracting lists
function extractList(text: string, section: string): string[] {
  // Try multiple list formats
  const patterns = [
    `${section}:?\\s*\\n((?:[-•*+]\\s*.+\\n?)+)`,  // Bullet points
    `${section}:?\\s*\\n((?:\\d+\\.\\s*.+\\n?)+)`, // Numbered lists
    `${section}:?\\s*([^\\n]+)`,                    // Single line
  ]

  for (const pattern of patterns) {
    const match = text.match(new RegExp(pattern, 'i'))
    if (match) {
      return match[1]
        .split(/\n|;/)
        .map(s => s.replace(/^[-•*+\d.]\s*/, '').trim())
        .filter(Boolean)
    }
  }
  
  return ['[Not specified]']
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { description, promptVersion } = req.body
  const getSelectedPrompt = (version: number) => {
    switch (version) {
      case 2:
        return systemPrompt2
      case 3:
        return systemPrompt3
      default:
        return systemPrompt
    }
  }
  const selectedPrompt = getSelectedPrompt(promptVersion)

  if (!description) {
    return res.status(400).json({ error: 'Description is required' })
  }

  try {
    const prompt = `You are analyzing a Nouns DAO proposal for 501(c)(3) compliance.

${JSON.stringify(selectedPrompt, null, 2)}

Your response MUST follow this EXACT format with no deviations:

ANALYSIS:::START
CLASSIFICATION: [one of: CHARITABLE, OPERATIONAL, MARKETING, PROGRAM_RELATED, UNALLOWABLE]
CLASSIFICATION_CONFIDENCE: [number between 0 and 1]
PRIMARY_PURPOSE: [write a single sentence]
ALLOWABLE_ELEMENTS:
- [write each element as a complete, descriptive sentence]
- [focus on specific proposal elements, not generic categories]
- [describe concrete activities and outcomes]
UNALLOWABLE_ELEMENTS:
- [write each element as a complete, descriptive sentence]
- [identify specific concerns or issues]
- [explain why the element is unallowable]
REQUIRED_MODIFICATIONS:
- [write each modification as an actionable recommendation]
- [be specific about what needs to change]
RISK_ASSESSMENT:
PRIVATE_BENEFIT_RISK: [one of: LOW, MEDIUM, HIGH]
PRIVATE_BENEFIT_CONFIDENCE: [number between 0 and 1]
MISSION_ALIGNMENT: [one of: STRONG, MODERATE, WEAK]
MISSION_ALIGNMENT_CONFIDENCE: [number between 0 and 1]
IMPLEMENTATION_COMPLEXITY: [one of: LOW, MEDIUM, HIGH]
IMPLEMENTATION_CONFIDENCE: [number between 0 and 1]
KEY_CONSIDERATIONS:
- [write each consideration as a complete thought]
- [focus on specific implications and impacts]
ANALYSIS:::END

Analyze this proposal:
${description}

Remember: 
1. Your response MUST start with ANALYSIS:::START and end with ANALYSIS:::END
2. Use EXACT field names as shown above
3. Write elements and modifications as complete, descriptive sentences
4. Use ONLY the allowed values for classifications and risk levels
5. Include confidence scores between 0 and 1 for each assessment
6. Do not add any additional text or explanations outside the markers
7. Do not copy categories directly from the prompt context`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].text
    console.log('Raw AI response:', content)
    
    // First try exact format
    const analysisMatch = content.match(/ANALYSIS:::START\n([\s\S]*)\nANALYSIS:::END/)
    if (!analysisMatch) {
      throw new Error('Failed to parse analysis response')
    }
    
    const analysis = analysisMatch[1]
    
    // Extract risk assessment section with more precise pattern - include everything after RISK_ASSESSMENT:
    const risk_section = analysis.match(/RISK_ASSESSMENT:[\s\S]*?(?=\nKEY_CONSIDERATIONS:|$)/i)?.[0] || ''
    console.log('STEP 1 - Raw risk section:', risk_section)

    // Use a more precise regex pattern that handles newlines
    const missionAlignmentMatch = risk_section.match(/MISSION_ALIGNMENT:\s*(STRONG|MODERATE|WEAK)[\s\n]/i)
    console.log('STEP 2 - Mission alignment raw match:', missionAlignmentMatch)
    console.log('STEP 3 - Mission alignment captured value:', missionAlignmentMatch?.[1])

    // Extract and validate mission alignment value with strict checking
    let missionAlignmentValue: MissionAlignment
    if (missionAlignmentMatch?.[1]) {
      const value = missionAlignmentMatch[1].toUpperCase()
      console.log('STEP 4 - Uppercase value:', value)
      if (value === 'STRONG' || value === 'MODERATE' || value === 'WEAK') {
        missionAlignmentValue = value as MissionAlignment
        console.log('STEP 5 - Valid mission alignment:', missionAlignmentValue)
      } else {
        console.warn('STEP 5a - Invalid mission alignment value:', value)
        missionAlignmentValue = 'MODERATE'
      }
    } else {
      console.warn('STEP 5b - No mission alignment match found')
      missionAlignmentValue = 'MODERATE'
    }

    console.log('STEP 6 - Final mission alignment value:', missionAlignmentValue)

    // Create risk assessment object with explicit value
    const riskAssessment: RiskAssessment = {
      private_benefit_risk: (risk_section.match(/PRIVATE_BENEFIT_RISK:\s*(LOW|MEDIUM|HIGH)[\s\n]/i)?.[1]?.toUpperCase() || 'HIGH') as RiskLevel,
      mission_alignment: missionAlignmentValue,
      implementation_complexity: (risk_section.match(/IMPLEMENTATION_COMPLEXITY:\s*(LOW|MEDIUM|HIGH)[\s\n]/i)?.[1]?.toUpperCase() || 'HIGH') as RiskLevel
    }

    console.log('STEP 7 - Risk assessment object:', JSON.stringify(riskAssessment, null, 2))

    const result = {
      classification: analysis.match(/CLASSIFICATION:\s*(\w+)/i)?.[1] || 'UNALLOWABLE',
      primary_purpose: analysis.match(/PRIMARY_PURPOSE:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() || '[Missing]',
      allowable_elements: extractList(analysis, 'ALLOWABLE_ELEMENTS'),
      unallowable_elements: extractList(analysis, 'UNALLOWABLE_ELEMENTS'),
      required_modifications: extractList(analysis, 'REQUIRED_MODIFICATIONS'),
      risk_assessment: { ...riskAssessment },  // Create a new object with all fields
      key_considerations: extractList(analysis, 'KEY_CONSIDERATIONS')
    }

    console.log('STEP 8 - Result mission alignment:', result.risk_assessment.mission_alignment)

    // Add confidence scores and needs_human_review
    const resultWithConfidence = {
      ...result,
      confidence_scores: {
        classification: parseFloat(content.match(/CLASSIFICATION_CONFIDENCE:\s*(0\.\d+)/i)?.[1] || '0.5'),
        risk_assessment: {
          private_benefit_risk: parseFloat(content.match(/PRIVATE_BENEFIT_CONFIDENCE:\s*(0\.\d+)/i)?.[1] || '0.5'),
          mission_alignment: parseFloat(content.match(/MISSION_ALIGNMENT_CONFIDENCE:\s*(0\.\d+)/i)?.[1] || '0.5'),
          implementation_complexity: parseFloat(content.match(/IMPLEMENTATION_CONFIDENCE:\s*(0\.\d+)/i)?.[1] || '0.5')
        }
      },
      needs_human_review: false
    } as AIAnalysisResult

    console.log('STEP 9 - Result with confidence mission alignment:', resultWithConfidence.risk_assessment.mission_alignment)

    // Validate business rules
    const validationErrors = validateBusinessLogic(resultWithConfidence)
    const warnings = validationErrors.filter(e => e.severity === 'WARNING')
    const criticalErrors = validationErrors.filter(e => e.severity === 'ERROR')

    // Validate confidence thresholds
    const confidenceValidation = validateConfidence(resultWithConfidence, warnings)
    
    console.log('Mission alignment after validation:', resultWithConfidence.risk_assessment.mission_alignment)

    // Create final result with all validations
    const finalResult = {
      ...resultWithConfidence,
      needs_human_review: confidenceValidation.needs_human_review,
      rawResponse: content
    } as AIAnalysisResult

    console.log('Final result mission alignment:', finalResult.risk_assessment.mission_alignment)

    // Return successful result with any warnings and confidence violations
    res.status(200).json({
      result: finalResult,
      validationWarnings: warnings,
      confidenceViolations: confidenceValidation.violations
    })
  } catch (error) {
    console.error('Analysis failed:', error)
    
    // Only throw errors for critical failures
    if ((error as ErrorResponse).field === 'format') {
      res.status(400).json({
        error: `Analysis Error: ${(error as ErrorResponse).message}`,
        details: error as ErrorResponse
      })
    } else {
      res.status(500).json({
        error: 'Analysis failed',
        details: error instanceof Error ? { 
          field: 'unknown',
          message: error.message 
        } : undefined
      })
    }
  }
} 