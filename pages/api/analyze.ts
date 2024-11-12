import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { AIAnalysisResult } from '../../types/graphql'
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
    const prompt = `${JSON.stringify(systemPrompt, null, 2)}

Proposal to Analyze:
${description}

Remember to follow the exact output format specified above.`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].text
    
    // Extract content between markers
    const analysisMatch = content.match(/ANALYSIS:::START\n([\s\S]*)\nANALYSIS:::END/)
    if (!analysisMatch) {
      throw new Error('Failed to parse analysis response')
    }
    
    // Helper function to safely extract list items
    const extractList = (text: string, section: string) => {
      const sectionRegex = new RegExp(`${section}:\\s*\\n((?:[-•]\\s*.+\\n?)+)`, 'i')
      const match = text.match(sectionRegex)
      if (!match) return []
      return match[1]
        .split('\n')
        .filter(Boolean)
        .map(s => s.replace(/^[-•]\s*/, '').trim())
    }

    const analysis = analysisMatch[1]

    // Parse the structured response with more flexible patterns
    const classification = analysis.match(/CLASSIFICATION:\s*(\w+)/i)?.[1] as AIAnalysisResult['classification']
    const primary_purpose = analysis.match(/PRIMARY_PURPOSE:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() || ''
    
    const allowable_elements = extractList(analysis, 'ALLOWABLE_ELEMENTS')
    const unallowable_elements = extractList(analysis, 'UNALLOWABLE_ELEMENTS')
    const required_modifications = extractList(analysis, 'REQUIRED_MODIFICATIONS')
    const key_considerations = extractList(analysis, 'KEY_CONSIDERATIONS')

    const risk_assessment = analysis.match(/RISK_ASSESSMENT:\s*\n([\s\S]*?)(?=\n\w|$)/i)?.[1]
    const private_benefit_risk = risk_assessment?.match(/PRIVATE_BENEFIT_RISK:\s*(\w+)/i)?.[1] as AIAnalysisResult['risk_assessment']['private_benefit_risk']
    const mission_alignment = risk_assessment?.match(/MISSION_ALIGNMENT:\s*(\w+)/i)?.[1] as AIAnalysisResult['risk_assessment']['mission_alignment']
    const implementation_complexity = risk_assessment?.match(/IMPLEMENTATION_COMPLEXITY:\s*(\w+)/i)?.[1] as AIAnalysisResult['risk_assessment']['implementation_complexity']

    // Validate required fields
    if (!classification || !private_benefit_risk || !mission_alignment || !implementation_complexity) {
      throw new Error('Missing required fields in analysis response')
    }

    const result: AIAnalysisResult = {
      classification,
      primary_purpose,
      allowable_elements,
      unallowable_elements,
      required_modifications,
      risk_assessment: {
        private_benefit_risk,
        mission_alignment,
        implementation_complexity
      },
      key_considerations
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Analysis failed:', error)
    res.status(500).json({ error: 'Analysis failed' })
  }
} 