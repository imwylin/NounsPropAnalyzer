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
    const prompt = `${JSON.stringify(systemPrompt.output_format, null, 2)}

Evaluation Context:
${JSON.stringify(systemPrompt.evaluation_context, null, 2)}

Analyze this Nouns DAO proposal:
${description}

Remember: Your response must start with ${systemPrompt.output_format.structure.start_marker} and end with ${systemPrompt.output_format.structure.end_marker}.

${systemPrompt.disclaimer}`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].text
    
    const analysisMatch = content.match(
      new RegExp(`${systemPrompt.output_format.structure.start_marker}\\n?([\\s\\S]*?)\\n?${systemPrompt.output_format.structure.end_marker}`)
    )
    
    if (!analysisMatch) {
      console.error('Raw response:', content)
      throw new Error('Response did not contain expected markers')
    }
    
    const analysis = analysisMatch[1].trim()

    const classification = analysis.match(/CLASSIFICATION:\s*(\w+)/i)?.[1]
    if (!classification || !systemPrompt.output_format.structure.required_fields.classification.values.includes(classification)) {
      throw new Error('Invalid classification value')
    }

    const primary_purpose = analysis.match(/PRIMARY[_\s]PURPOSE:?\s*(.+?)(?=\n|$)/i)?.[1]?.trim()
    if (!primary_purpose) {
      console.error('Missing primary purpose')
      throw new Error('Missing primary purpose')
    }

    const risk_section = analysis.match(/RISK[_\s]ASSESSMENT:?\s*\n([\s\S]*?)(?=\n\w|$)/i)?.[1] || analysis
    
    const private_benefit_risk = risk_section.match(/PRIVATE[_\s]BENEFIT[_\s]RISK:?\s*(\w+)/i)?.[1]
    if (!private_benefit_risk || !['LOW', 'MEDIUM', 'HIGH'].includes(private_benefit_risk)) {
      console.error('Invalid private benefit risk:', private_benefit_risk)
      throw new Error('Invalid private benefit risk value')
    }

    const mission_alignment = risk_section.match(/MISSION[_\s]ALIGNMENT:?\s*(\w+)/i)?.[1]
    if (!mission_alignment || !['STRONG', 'MODERATE', 'WEAK'].includes(mission_alignment)) {
      console.error('Invalid mission alignment:', mission_alignment)
      throw new Error('Invalid mission alignment value')
    }

    const implementation_complexity = risk_section.match(/IMPLEMENTATION[_\s]COMPLEXITY:?\s*(\w+)/i)?.[1]
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
      allowable_elements: extractList(analysis, 'ALLOWABLE[_\\s]ELEMENTS'),
      unallowable_elements: extractList(analysis, 'UNALLOWABLE[_\\s]ELEMENTS'),
      required_modifications: extractList(analysis, 'REQUIRED[_\\s]MODIFICATIONS'),
      risk_assessment: {
        private_benefit_risk: private_benefit_risk as RiskLevel,
        mission_alignment: mission_alignment as MissionAlignment,
        implementation_complexity: implementation_complexity as RiskLevel
      },
      key_considerations: extractList(analysis, 'KEY[_\\s]CONSIDERATIONS')
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Analysis failed:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Analysis failed',
      details: error instanceof Error ? error.stack : undefined
    })
  }
} 