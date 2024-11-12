import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { AIAnalysisResult } from '../../utils/ai/analyzeProposal'

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
    const prompt = `Analyze this Nouns DAO proposal for 501(c)(3) compliance. Consider charitable intent, public benefit, and potential risks.

Proposal:
${description}

Provide a structured analysis in this exact format:
COMPLIANT: [true/false]
CATEGORY: [category name]
RISK_LEVEL: [Low/Medium/High]
REASONING: [detailed explanation]
RECOMMENDATIONS: [specific suggestions]`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].text

    // Parse the response
    const compliant = /COMPLIANT: (true|false)/i.exec(content)?.[1] === 'true'
    const category = /CATEGORY: (.+)/i.exec(content)?.[1] || 'Uncategorized'
    const riskLevel = /RISK_LEVEL: (Low|Medium|High)/i.exec(content)?.[1] as 'Low' | 'Medium' | 'High' || 'Medium'
    const reasoning = /REASONING: (.+)/i.exec(content)?.[1] || 'No reasoning provided'
    const recommendations = /RECOMMENDATIONS: (.+)/i.exec(content)?.[1] || 'No recommendations provided'

    const result: AIAnalysisResult = {
      is501c3Compliant: compliant,
      category,
      riskLevel,
      reasoning,
      recommendations,
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Analysis failed:', error)
    res.status(500).json({ error: 'Analysis failed' })
  }
} 