import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { 
  AIAnalysisResult, 
  RiskLevel, 
  MissionAlignment 
} from '../../types/graphql'
import systemPrompt from '../../AIPrompts/systemprompt.json'
import systemPrompt2 from '../../AIPrompts/systemprompt2.json'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ErrorResponse {
  field: string
  message: string
  received?: string
  expected?: string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIAnalysisResult | { error: string; details?: ErrorResponse }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { description, useAlternatePrompt } = req.body
  const selectedPrompt = useAlternatePrompt ? systemPrompt2 : systemPrompt

  if (!description) {
    return res.status(400).json({ error: 'Description is required' })
  }

  try {
    const prompt = `You are analyzing a Nouns DAO proposal for 501(c)(3) compliance.

${JSON.stringify(selectedPrompt, null, 2)}

Your response MUST follow this EXACT format with no deviations:

ANALYSIS:::START
CLASSIFICATION: [one of: ${selectedPrompt.output_format.structure.required_fields.classification.values.join(', ')}]
PRIMARY_PURPOSE: [write a single sentence]
ALLOWABLE_ELEMENTS:
- [list each element on a new line starting with a dash]
UNALLOWABLE_ELEMENTS:
- [list each element on a new line starting with a dash]
REQUIRED_MODIFICATIONS:
- [list each modification on a new line starting with a dash]
RISK_ASSESSMENT:
PRIVATE_BENEFIT_RISK: [one of: LOW, MEDIUM, HIGH]
MISSION_ALIGNMENT: [one of: ${selectedPrompt.output_format.structure.required_fields.risk_assessment.mission_alignment.values.join(', ')}]
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

${selectedPrompt.disclaimer}`

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
    
    // Helper function with more flexible pattern matching
    const extractList = (text: string, section: string) => {
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

    // Extract risk assessment section
    const risk_section = analysis.match(/RISK_ASSESSMENT:?\s*\n([\s\S]*?)(?=\n\w|$)/i)?.[1] || ''

    // Parse all fields with fallbacks for missing values
    const result = {
      classification: analysis.match(/CLASSIFICATION:\s*(\w+)/i)?.[1] || 'UNALLOWABLE',
      primary_purpose: analysis.match(/PRIMARY_PURPOSE:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() || '[Missing]',
      allowable_elements: extractList(analysis, 'ALLOWABLE_ELEMENTS'),
      unallowable_elements: extractList(analysis, 'UNALLOWABLE_ELEMENTS'),
      required_modifications: extractList(analysis, 'REQUIRED_MODIFICATIONS'),
      risk_assessment: {
        private_benefit_risk: (risk_section.match(/PRIVATE_BENEFIT_RISK:?\s*(\w+)/i)?.[1] || 'HIGH') as RiskLevel,
        mission_alignment: (risk_section.match(/MISSION_ALIGNMENT:?\s*(\w+)/i)?.[1] || 'WEAK') as MissionAlignment,
        implementation_complexity: (risk_section.match(/IMPLEMENTATION_COMPLEXITY:?\s*(\w+)/i)?.[1] || 'HIGH') as RiskLevel
      },
      key_considerations: extractList(analysis, 'KEY_CONSIDERATIONS')
    }

    res.status(200).json(result as AIAnalysisResult)
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