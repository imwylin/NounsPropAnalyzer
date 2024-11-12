import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { useProposalDescription } from '../hooks/useSubgraphProposals'
import { analyzeProposal } from '../utils/ai/analyzeProposal'
import type { AIAnalysisResult } from '../types/graphql'
import styles from './analyze.module.css'

interface AnalysisResultWithMeta extends AIAnalysisResult {
  proposalId: string
  timestamp: string
}

export default function AnalyzePage() {
  const [proposalId, setProposalId] = useState('')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultWithMeta[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true)
  
  const { 
    data: description,
    isLoading,
    error 
  } = useProposalDescription(proposalId)

  const handleAnalyze = async () => {
    if (!description) return
    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const aiResult = await analyzeProposal(description)
      const result: AnalysisResultWithMeta = {
        proposalId,
        timestamp: new Date().toISOString(),
        ...aiResult
      }
      setAnalysisResults(prev => [result, ...prev])
    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExport = () => {
    const headers = [
      'Timestamp',
      'Proposal ID',
      'Classification',
      'Primary Purpose',
      'Allowable Elements',
      'Unallowable Elements',
      'Required Modifications',
      'Risk Assessment - Private Benefit Risk',
      'Risk Assessment - Mission Alignment',
      'Risk Assessment - Implementation Complexity',
      'Key Considerations'
    ]

    const rows = analysisResults.map(result => [
      new Date(result.timestamp).toISOString(),
      result.proposalId,
      result.classification,
      result.primary_purpose,
      `"${result.allowable_elements.join(';\n')}"`,
      `"${result.unallowable_elements.join(';\n')}"`,
      `"${result.required_modifications.join(';\n')}"`,
      result.risk_assessment.private_benefit_risk,
      result.risk_assessment.mission_alignment,
      result.risk_assessment.implementation_complexity,
      `"${result.key_considerations.join(';\n')}"`
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nouns-501c3-analysis-${new Date().toISOString()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>501(c)(3) Compliance Analyzer</h1>
      
      <div className={styles.inputGroup}>
        <input
          type="text"
          value={proposalId}
          onChange={(e) => setProposalId(e.target.value)}
          placeholder="Enter Proposal ID"
          className={styles.input}
        />
        <button 
          onClick={handleAnalyze}
          disabled={!description || isAnalyzing || isLoading}
          className={styles.analyzeButton}
        >
          {isLoading ? 'Loading...' : isAnalyzing ? 'Analyzing...' : 'Analyze Compliance'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          Error: {error.message}
        </div>
      )}

      {analysisError && (
        <div className={styles.error}>
          Analysis Error: {analysisError}
        </div>
      )}

      {description && (
        <div className={styles.section}>
          <div className={styles.descriptionHeader}>
            <h2 className={styles.subtitle}>Proposal Description</h2>
            <button 
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className={styles.toggleButton}
            >
              {isDescriptionExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <div className={`${styles.description} ${isDescriptionExpanded ? '' : styles.collapsed}`}>
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>
              {description}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {analysisResults.length > 0 && (
        <div className={styles.section}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.subtitle}>Analysis Results</h2>
            <button onClick={handleExport} className={styles.exportButton}>
              Export to CSV
            </button>
          </div>
          
          {analysisResults.map((result, index) => (
            <div key={index} className={styles.analysisCard}>
              <div className={styles.cardHeader}>
                <h3>Proposal {result.proposalId}</h3>
                <span className={styles.timestamp}>
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              </div>

              <div className={styles.mainInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Classification:</span>
                  <span className={getClassificationStyle(result.classification)}>
                    {result.classification}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Primary Purpose:</span>
                  <span>{result.primary_purpose}</span>
                </div>
              </div>

              <div className={styles.riskAssessment}>
                <div className={getRiskStyle(result.risk_assessment.private_benefit_risk)}>
                  Private Benefit Risk: {result.risk_assessment.private_benefit_risk}
                </div>
                <div className={getAlignmentStyle(result.risk_assessment.mission_alignment)}>
                  Mission Alignment: {result.risk_assessment.mission_alignment}
                </div>
                <div className={getComplexityStyle(result.risk_assessment.implementation_complexity)}>
                  Implementation: {result.risk_assessment.implementation_complexity}
                </div>
              </div>

              <div className={styles.lists}>
                <div className={styles.listSection}>
                  <h4>Allowable Elements</h4>
                  <ul>
                    {result.allowable_elements.map((element, i) => (
                      <li key={i}>{element}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.listSection}>
                  <h4>Unallowable Elements</h4>
                  <ul>
                    {result.unallowable_elements.map((element, i) => (
                      <li key={i}>{element}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.listSection}>
                  <h4>Required Modifications</h4>
                  <ul>
                    {result.required_modifications.map((mod, i) => (
                      <li key={i}>{mod}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.listSection}>
                  <h4>Key Considerations</h4>
                  <ul>
                    {result.key_considerations.map((consideration, i) => (
                      <li key={i}>{consideration}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getClassificationStyle(classification: AIAnalysisResult['classification']) {
  switch (classification) {
    case 'CHARITABLE':
      return styles.tagSuccess
    case 'UNALLOWABLE':
      return styles.tagError
    default:
      return styles.tagWarning
  }
}

function getRiskStyle(risk: 'LOW' | 'MEDIUM' | 'HIGH') {
  switch (risk) {
    case 'LOW':
      return styles.tagSuccess
    case 'HIGH':
      return styles.tagError
    default:
      return styles.tagWarning
  }
}

function getAlignmentStyle(alignment: 'STRONG' | 'MODERATE' | 'WEAK') {
  switch (alignment) {
    case 'STRONG':
      return styles.tagSuccess
    case 'WEAK':
      return styles.tagError
    default:
      return styles.tagWarning
  }
}

function getComplexityStyle(complexity: 'LOW' | 'MEDIUM' | 'HIGH') {
  switch (complexity) {
    case 'LOW':
      return styles.tagSuccess
    case 'HIGH':
      return styles.tagError
    default:
      return styles.tagWarning
  }
} 