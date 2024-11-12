import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { 
  AIAnalysisResult, 
  Classification, 
  RiskLevel, 
  MissionAlignment 
} from '../../types/graphql'
import systemPrompt from '../../AIPrompts/systemprompt.json'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Add specific error types
type AnalysisError = {
  field: string
  message: string
  received?: string
  expected?: string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { description } = req.body

  if (!description) {
    return res.status(400).json({ error: 'Description is required' })
  }

  try {
    const prompt = `You are analyzing a Nouns DAO proposal for 501(c)(3) compliance.

${JSON.stringify(systemPrompt, null, 2)}

Your response MUST follow this EXACT format with no deviations:

ANALYSIS:::START
CLASSIFICATION: [one of: ${systemPrompt.output_format.structure.required_fields.classification.values.join(', ')}]
PRIMARY_PURPOSE: [write a single sentence]
ALLOWABLE_ELEMENTS:
- [list each element on a new line starting with a dash]
UNALLOWABLE_ELEMENTS:
- [list each element on a new line starting with a dash]
REQUIRED_MODIFICATIONS:
- [list each modification on a new line starting with a dash]
RISK_ASSESSMENT:
PRIVATE_BENEFIT_RISK: [one of: LOW, MEDIUM, HIGH]
MISSION_ALIGNMENT: [one of: STRONG, MODERATE, WEAK]
IMPLEMENTATION_COMPLEXITY: [one of: LOW, MEDIUM, HIGH]
KEY_CONSIDERATIONS:
- [list each consideration on a new line starting with a dash]
ANALYSIS:::END

Analyze this proposal:
${description}

Remember: 
1. Your response MUST start with ANALYSIS:::START and end with ANALYSIS:::END
2. Use EXACT field names as shown above
3. Follow the EXACT format for lists using dashes
4. Use ONLY the allowed values for classifications and risk levels
5. Do not add any additional text or explanations outside the markers

${systemPrompt.disclaimer}`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].text
    
    const analysisMatch = content.match(
      new RegExp(`ANALYSIS:::START\\n?([\\s\\S]*?)\\n?ANALYSIS:::END`)
    )
    
    if (!analysisMatch) {
      console.error('Raw response:', content)
      throw {
        field: 'format',
        message: 'Response missing required markers',
        received: content.slice(0, 100) + '...'
      }
    }
    
    const analysis = analysisMatch[1].trim()

    const classification = analysis.match(/CLASSIFICATION:\s*(\w+)/i)?.[1]
    if (!classification) {
      throw {
        field: 'classification',
        message: 'Missing classification field'
      }
    }
    if (!systemPrompt.output_format.structure.required_fields.classification.values.includes(classification)) {
      throw {
        field: 'classification',
        message: 'Invalid classification value',
        received: classification,
        expected: systemPrompt.output_format.structure.required_fields.classification.values
      }
    }

    const primary_purpose = analysis.match(/PRIMARY_PURPOSE:\s*(.+?)(?=\n|$)/i)?.[1]?.trim()
    if (!primary_purpose) {
      console.error('Missing primary purpose')
      throw new Error('Missing primary purpose')
    }

    const risk_section = analysis.match(/RISK_ASSESSMENT:?\s*\n([\s\S]*?)(?=\n\w|$)/i)?.[1] || analysis
    
    const private_benefit_risk = risk_section.match(/PRIVATE_BENEFIT_RISK:?\s*(\w+)/i)?.[1]
    if (!private_benefit_risk || !['LOW', 'MEDIUM', 'HIGH'].includes(private_benefit_risk)) {
      console.error('Invalid private benefit risk:', private_benefit_risk)
      throw new Error('Invalid private benefit risk value')
    }

    const mission_alignment = risk_section.match(/MISSION_ALIGNMENT:?\s*(\w+)/i)?.[1]
    if (!mission_alignment || !['STRONG', 'MODERATE', 'WEAK'].includes(mission_alignment)) {
      console.error('Invalid mission alignment:', mission_alignment)
      throw new Error('Invalid mission alignment value')
    }

    const implementation_complexity = risk_section.match(/IMPLEMENTATION_COMPLEXITY:?\s*(\w+)/i)?.[1]
    if (!implementation_complexity || !['LOW', 'MEDIUM', 'HIGH'].includes(implementation_complexity)) {
      console.error('Invalid implementation complexity:', implementation_complexity)
      throw new Error('Invalid implementation complexity value')
    }

    // Helper function to safely extract list items
    const extractList = (text: string, section: string) => {
      const sectionRegex = new RegExp(`${section}:?\\s*\\n((?:[-•\\*]\\s*.+\\n?)+)`, 'i')
      const match = text.match(sectionRegex)
      if (!match) {
        console.warn(`Failed to extract ${section}`)
        return []
      }
      return match[1]
        .split('\n')
        .filter(Boolean)
        .map(s => s.replace(/^[-•\\*]\\s*/, '').trim())
    }

    const result: AIAnalysisResult = {
      classification: classification as Classification,
      primary_purpose,
      allowable_elements: extractList(analysis, 'ALLOWABLE_ELEMENTS'),
      unallowable_elements: extractList(analysis, 'UNALLOWABLE_ELEMENTS'),
      required_modifications: extractList(analysis, 'REQUIRED_MODIFICATIONS'),
      risk_assessment: {
        private_benefit_risk: private_benefit_risk as RiskLevel,
        mission_alignment: mission_alignment as MissionAlignment,
        implementation_complexity: implementation_complexity as RiskLevel
      },
      key_considerations: extractList(analysis, 'KEY_CONSIDERATIONS')
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Analysis failed:', error)
    
    // Handle structured errors
    if ((error as AnalysisError).field) {
      const analysisError = error as AnalysisError
      res.status(400).json({ 
        error: `${analysisError.field}: ${analysisError.message}`,
        details: {
          field: analysisError.field,
          received: analysisError.received,
          expected: analysisError.expected
        }
      })
      return
    }

    // Handle other errors
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Analysis failed',
      details: error instanceof Error ? error.stack : undefined
    })
  }
} 