import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { 
  AIAnalysisResult, 
  RiskLevel, 
  MissionAlignment,
  RiskAssessment,
  ClaudeConfidenceMetadata 
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

// Add helper function to convert image markdown to descriptive text
function convertImageMarkdownToText(description: string): string {
  // Match markdown image syntax: ![alt text](url)
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g
  
  return description.replace(imageRegex, (match, altText, url) => {
    // If alt text exists, use it, otherwise extract filename from URL
    const description = altText || url.split('/').pop()?.split('.')[0] || 'image'
    return `[Image description: ${description}]`
  })
}

// Update the pattern matching function to be more flexible
export const extractAnalysis = (rawResponse: string) => {
  // Remove any leading/trailing whitespace and normalize newlines
  const cleanResponse = rawResponse.trim().replace(/\r\n/g, '\n')

  const startMarker = 'ANALYSIS:::START'
  const endMarker = 'ANALYSIS:::END'

  const startIndex = cleanResponse.indexOf(startMarker)
  const endIndex = cleanResponse.indexOf(endMarker)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Invalid response format - missing markers')
  }

  // Extract content between markers and normalize whitespace
  const analysisContent = cleanResponse
    .slice(startIndex + startMarker.length, endIndex)
    .trim()

  // Validate required sections with more lenient matching
  const requiredSections = [
    { 
      name: 'CLASSIFICATION:', 
      pattern: /CLASSIFICATION:[\s\S]*?(CHARITABLE|OPERATIONAL|MARKETING|PROGRAM_RELATED|UNALLOWABLE)/i 
    },
    { 
      name: 'PRIMARY_PURPOSE:', 
      pattern: /PRIMARY_PURPOSE:[\s\S]*?(?=ALLOWABLE_ELEMENTS:|$)/i 
    },
    { 
      name: 'ALLOWABLE_ELEMENTS:', 
      pattern: /ALLOWABLE_ELEMENTS:[\s\S]*?(?=UNALLOWABLE_ELEMENTS:|$)/i 
    },
    { 
      name: 'UNALLOWABLE_ELEMENTS:', 
      pattern: /UNALLOWABLE_ELEMENTS:[\s\S]*?(?=REQUIRED_MODIFICATIONS:|$)/i 
    },
    { 
      name: 'REQUIRED_MODIFICATIONS:', 
      pattern: /REQUIRED_MODIFICATIONS:[\s\S]*?(?=RISK_ASSESSMENT:|$)/i 
    },
    { 
      name: 'RISK_ASSESSMENT:', 
      pattern: /RISK_ASSESSMENT:[\s\S]*?(?:PRIVATE_BENEFIT_RISK:\s*(LOW|MEDIUM|HIGH))[\s\S]*?(?:MISSION_ALIGNMENT:\s*(STRONG|MODERATE|WEAK))[\s\S]*?(?:IMPLEMENTATION_COMPLEXITY:\s*(LOW|MEDIUM|HIGH))/i 
    },
    { 
      name: 'KEY_CONSIDERATIONS:', 
      pattern: /KEY_CONSIDERATIONS:[\s\S]*?(?=ANALYSIS:::END|$)/i 
    }
  ]

  // Log the content being tested and which pattern fails
  for (const section of requiredSections) {
    const match = section.pattern.test(analysisContent)
    if (!match) {
      console.error(`Failed to match pattern for section: ${section.name}`)
      console.error('Pattern:', section.pattern.source)
      console.error('Content section:', analysisContent.substring(
        Math.max(0, analysisContent.indexOf(section.name) - 50),
        Math.min(analysisContent.length, analysisContent.indexOf(section.name) + 200)
      ))
      throw new Error(`Invalid response format - ${section.name} section does not match expected pattern`)
    }
  }

  return analysisContent
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
    // Preprocess description to make images readable
    const processedDescription = convertImageMarkdownToText(description)

    const prompt = `You are analyzing a Nouns DAO proposal for 501(c)(3) compliance.

${JSON.stringify(selectedPrompt, null, 2)}

Your response MUST follow this EXACT format with no deviations:

ANALYSIS:::START

CLASSIFICATION: [one of: CHARITABLE, OPERATIONAL, MARKETING, PROGRAM_RELATED, UNALLOWABLE]

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
MISSION_ALIGNMENT: [one of: STRONG, MODERATE, WEAK]
IMPLEMENTATION_COMPLEXITY: [one of: LOW, MEDIUM, HIGH]

KEY_CONSIDERATIONS:
- [write each consideration as a complete thought]
- [focus on specific implications and impacts]

ANALYSIS:::END

Analyze this proposal:
${processedDescription}

Remember: 
1. Your response MUST start with ANALYSIS:::START and end with ANALYSIS:::END
2. Use EXACT field names as shown above
3. Write elements and modifications as complete, descriptive sentences
4. Use ONLY the allowed values for classifications and risk levels
5. Do not add any additional text or explanations outside the markers
6. Do not copy categories directly from the prompt context`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })

    // Initialize empty confidence metrics
    let nativeConfidence: ClaudeConfidenceMetadata = {}

    console.log('Claude response:', response)
    console.log('Initial confidence metrics:', nativeConfidence)

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
      risk_assessment: { ...riskAssessment },
      key_considerations: extractList(analysis, 'KEY_CONSIDERATIONS'),
      native_confidence: nativeConfidence,
      needs_human_review: false
    } as AIAnalysisResult

    console.log('STEP 8 - Result mission alignment:', result.risk_assessment.mission_alignment)

    // Validate business rules
    const validationErrors = validateBusinessLogic(result)
    const warnings = validationErrors.filter(e => e.severity === 'WARNING')

    // Validate confidence thresholds
    const confidenceValidation = validateConfidence(result, warnings)
    
    console.log('Mission alignment after validation:', result.risk_assessment.mission_alignment)

    // Create final result with all validations
    const finalResult = {
      ...result,
      needs_human_review: confidenceValidation.needs_human_review,
      rawResponse: content,
      reviewReasons: confidenceValidation.reviewReasons,
      native_confidence: nativeConfidence
    } as AIAnalysisResult

    console.log('Final result mission alignment:', finalResult.risk_assessment.mission_alignment)

    // After getting the initial analysis, add a grading step
    const gradingPrompt = `Grade your analysis against these specific rubrics:

    <rubrics>
    1. CLASSIFICATION must be justified by specific elements in the proposal and match the following criteria:
       - CHARITABLE: Direct public benefit, no substantial private benefit
       - PROGRAM_RELATED: Mission-aligned activities with measurable outcomes
       - OPERATIONAL: Internal functioning and governance
       - MARKETING: Primarily promotional or branding
       - UNALLOWABLE: Significant private benefit or non-exempt purposes

    2. RISK_ASSESSMENT must cite concrete factors:
       - PRIVATE_BENEFIT_RISK must identify specific beneficiaries and benefits
       - MISSION_ALIGNMENT must reference specific mission elements
       - IMPLEMENTATION_COMPLEXITY must list specific challenges

    3. REQUIRED_MODIFICATIONS must be:
       - Specific and actionable
       - Directly address identified issues
       - Include measurable outcomes

    4. ELEMENTS must be:
       - Complete sentences
       - Specific to this proposal
       - Include concrete details
    </rubrics>

    <analysis>
    ${content}
    </analysis>

    Think through each rubric carefully, then output:
    1. A score (1-5) for each rubric
    2. Brief justification for each score
    3. Overall confidence (0-100) in your analysis

    Format your response as:
    GRADE:::START
    RUBRIC_1_SCORE: [1-5]
    RUBRIC_1_REASON: [brief explanation]
    RUBRIC_2_SCORE: [1-5]
    RUBRIC_2_REASON: [brief explanation]
    RUBRIC_3_SCORE: [1-5]
    RUBRIC_3_REASON: [brief explanation]
    RUBRIC_4_SCORE: [1-5]
    RUBRIC_4_REASON: [brief explanation]
    OVERALL_CONFIDENCE: [0-100]
    GRADE:::END`

    const gradingResponse = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: gradingPrompt }],
      temperature: 0.1
    })

    // After grading response, update confidence metrics
    const gradeContent = gradingResponse.content[0].text
    const gradeMatch = gradeContent.match(/GRADE:::START\n([\s\S]*)\nGRADE:::END/)

    if (gradeMatch) {
      const matchContent = gradeMatch[1]
      
      // Create confidence metrics with more precise parsing
      nativeConfidence = {
        response_confidence: parseFloat(matchContent.match(/OVERALL_CONFIDENCE:\s*(\d+)/)?.[1] || '0') / 100,
        rubric_scores: {
          classification: parseInt(matchContent.match(/RUBRIC_1_SCORE:\s*(\d+)/)?.[1] || '0'),
          risk_assessment: parseInt(matchContent.match(/RUBRIC_2_SCORE:\s*(\d+)/)?.[1] || '0'),
          modifications: parseInt(matchContent.match(/RUBRIC_3_SCORE:\s*(\d+)/)?.[1] || '0'),
          elements: parseInt(matchContent.match(/RUBRIC_4_SCORE:\s*(\d+)/)?.[1] || '0')
        },
        grading_response: matchContent
      }

      // Update the final result to include the confidence metrics
      const finalResult = {
        ...result,
        needs_human_review: confidenceValidation.needs_human_review,
        rawResponse: content,
        reviewReasons: confidenceValidation.reviewReasons,
        native_confidence: nativeConfidence  // Make sure this is included
      } as AIAnalysisResult

      console.log('Final result with confidence:', finalResult)
      console.log('Native confidence metrics:', nativeConfidence)

      // Return successful result with confidence metrics included
      res.status(200).json({
        result: finalResult,
        validationWarnings: warnings,
        confidenceViolations: confidenceValidation.violations
      })
    } else {
      console.warn('Failed to parse grading response')
      
      // Return result without confidence metrics
      res.status(200).json({
        result: {
          ...result,
          needs_human_review: confidenceValidation.needs_human_review,
          rawResponse: content,
          reviewReasons: confidenceValidation.reviewReasons
        },
        validationWarnings: warnings,
        confidenceViolations: confidenceValidation.violations
      })
    }
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