import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { AIAnalysisResult } from '../../types/graphql'

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
    const prompt = `You are analyzing Nouns DAO proposals for 501(c)(3) compliance. Consider charitable intent, public benefit, and potential risks.

Context:
The Nouns DAO is transitioning to a 501(c)(3) organization. Revenue comes from daily NFT auctions and donations. All artistic assets are CC0. The organization uses blockchain-based democratic governance and can handle crypto transactions/accounting.

Proposal to Analyze:
${description}

Provide your analysis in this exact format:
ANALYSIS:::START
CLASSIFICATION: [CHARITABLE/OPERATIONAL/MARKETING/PROGRAM_RELATED/UNALLOWABLE]
PRIMARY_PURPOSE: [Single sentence description]
ALLOWABLE_ELEMENTS: 
- [element 1]
- [element 2]
UNALLOWABLE_ELEMENTS:
- [element 1]
- [element 2]
REQUIRED_MODIFICATIONS:
- [modification 1]
- [modification 2]
RISK_ASSESSMENT:
PRIVATE_BENEFIT_RISK: [LOW/MEDIUM/HIGH]
MISSION_ALIGNMENT: [STRONG/MODERATE/WEAK]
IMPLEMENTATION_COMPLEXITY: [LOW/MEDIUM/HIGH]
KEY_CONSIDERATIONS:
- [consideration 1]
- [consideration 2]
ANALYSIS:::END`

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
    
    const analysis = analysisMatch[1]

    // Parse the structured response
    const classification = analysis.match(/CLASSIFICATION: (\w+)/)?.[1] as AIAnalysisResult['classification']
    const primary_purpose = analysis.match(/PRIMARY_PURPOSE: (.+)/)?.[1] || ''
    const allowable_elements = analysis.match(/ALLOWABLE_ELEMENTS:\n((?:- .+\n?)+)/)?.[1].split('\n').filter(Boolean).map(s => s.replace('- ', ''))
    const unallowable_elements = analysis.match(/UNALLOWABLE_ELEMENTS:\n((?:- .+\n?)+)/)?.[1].split('\n').filter(Boolean).map(s => s.replace('- ', ''))
    const required_modifications = analysis.match(/REQUIRED_MODIFICATIONS:\n((?:- .+\n?)+)/)?.[1].split('\n').filter(Boolean).map(s => s.replace('- ', ''))
    const private_benefit_risk = analysis.match(/PRIVATE_BENEFIT_RISK: (\w+)/)?.[1] as AIAnalysisResult['risk_assessment']['private_benefit_risk']
    const mission_alignment = analysis.match(/MISSION_ALIGNMENT: (\w+)/)?.[1] as AIAnalysisResult['risk_assessment']['mission_alignment']
    const implementation_complexity = analysis.match(/IMPLEMENTATION_COMPLEXITY: (\w+)/)?.[1] as AIAnalysisResult['risk_assessment']['implementation_complexity']
    const key_considerations = analysis.match(/KEY_CONSIDERATIONS:\n((?:- .+\n?)+)/)?.[1].split('\n').filter(Boolean).map(s => s.replace('- ', ''))

    const result: AIAnalysisResult = {
      classification,
      primary_purpose,
      allowable_elements: allowable_elements || [],
      unallowable_elements: unallowable_elements || [],
      required_modifications: required_modifications || [],
      risk_assessment: {
        private_benefit_risk,
        mission_alignment,
        implementation_complexity
      },
      key_considerations: key_considerations || []
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Analysis failed:', error)
    res.status(500).json({ error: 'Analysis failed' })
  }
} 