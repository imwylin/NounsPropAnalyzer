import Anthropic from '@anthropic-ai/sdk'

export interface AIAnalysisResult {
  is501c3Compliant: boolean
  category: string
  riskLevel: 'Low' | 'Medium' | 'High'
  reasoning: string
  recommendations: string
}

export async function analyzeProposal(description: string): Promise<AIAnalysisResult> {
  if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is not configured')
  }

  const anthropic = new Anthropic({
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
  })

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

  return {
    is501c3Compliant: compliant,
    category,
    riskLevel,
    reasoning,
    recommendations,
  }
} 