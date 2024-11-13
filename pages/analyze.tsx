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

interface AnalysisErrorDetails {
  field: string
  received?: string
  expected?: string[]
}

interface AnalysisResult {
  status: 'fulfilled' | 'rejected'
  value?: AnalysisResultWithMeta
  reason?: Error
}

export default function AnalyzePage() {
  const [proposalId, setProposalId] = useState('')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultWithMeta[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true)
  const [errorDetails, setErrorDetails] = useState<AnalysisErrorDetails | null>(null)
  
  const { 
    data: description,
    isLoading,
    error 
  } = useProposalDescription(proposalId)

  const handleAnalyze = async () => {
    if (!description) return
    setIsAnalyzing(true)
    setAnalysisError(null)
    setErrorDetails(null)

    try {
      const results: AnalysisResult[] = []
      for (let i = 0; i < 2; i++) {
        try {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 10000))
          }
          
          const aiResult = await analyzeProposal(description)
          results.push({
            status: 'fulfilled',
            value: {
              proposalId,
              timestamp: new Date().toISOString(),
              ...aiResult
            }
          })
        } catch (error) {
          results.push({
            status: 'rejected',
            reason: error instanceof Error ? error : new Error('Unknown error')
          })
        }
      }
      
      const successfulResults = results
        .filter((result): result is { status: 'fulfilled', value: AnalysisResultWithMeta } => 
          result.status === 'fulfilled' && !!result.value
        )
        .map(result => result.value)

      const errors = results
        .filter((result): result is { status: 'rejected', reason: Error } => 
          result.status === 'rejected' && !!result.reason
        )
        .map(result => result.reason)

      if (successfulResults.length > 0) {
        setAnalysisResults(prev => [...successfulResults, ...prev])
      }

      if (errors.length > 0) {
        setAnalysisError(`${errors.length} out of 2 analyses failed`)
        console.error('Analysis errors:', errors)
      }
    } catch (error) {
      console.error('Analysis failed completely:', error)
      setAnalysisError('All analyses failed')
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
          onChange={(e) => {
            const value = e.target.value.trim()
            if (value === '' || /^\d+$/.test(value)) {
              setProposalId(value)
            }
          }}
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
          <div>Analysis Error: {analysisError}</div>
          {errorDetails && (
            <div className={styles.errorDetails}>
              {errorDetails.received && (
                <div>Received: {errorDetails.received}</div>
              )}
              {errorDetails.expected && (
                <div>Expected: {errorDetails.expected.join(', ')}</div>
              )}
            </div>
          )}
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
          
          <div className={styles.analysisCard}>
            <div className={styles.cardHeader}>
              <h3>Proposal {analysisResults[0].proposalId} - Comparative Analysis</h3>
            </div>

            <div className={styles.comparisonTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Aspect</th>
                    <th>Analysis 1 ({new Date(analysisResults[0].timestamp).toLocaleTimeString()})</th>
                    {analysisResults[1] && (
                      <th>Analysis 2 ({new Date(analysisResults[1].timestamp).toLocaleTimeString()})</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Classification</td>
                    <td><span className={getClassificationStyle(analysisResults[0].classification)}>{analysisResults[0].classification}</span></td>
                    {analysisResults[1] && (
                      <td><span className={getClassificationStyle(analysisResults[1].classification)}>{analysisResults[1].classification}</span></td>
                    )}
                  </tr>
                  <tr>
                    <td>Primary Purpose</td>
                    <td>{analysisResults[0].primary_purpose}</td>
                    {analysisResults[1] && (
                      <td>{analysisResults[1].primary_purpose}</td>
                    )}
                  </tr>
                  <tr>
                    <td>Private Benefit Risk</td>
                    <td><span className={getRiskStyle(analysisResults[0].risk_assessment.private_benefit_risk)}>{analysisResults[0].risk_assessment.private_benefit_risk}</span></td>
                    {analysisResults[1] && (
                      <td><span className={getRiskStyle(analysisResults[1].risk_assessment.private_benefit_risk)}>{analysisResults[1].risk_assessment.private_benefit_risk}</span></td>
                    )}
                  </tr>
                  <tr>
                    <td>Mission Alignment</td>
                    <td><span className={getAlignmentStyle(analysisResults[0].risk_assessment.mission_alignment)}>{analysisResults[0].risk_assessment.mission_alignment}</span></td>
                    {analysisResults[1] && (
                      <td><span className={getAlignmentStyle(analysisResults[1].risk_assessment.mission_alignment)}>{analysisResults[1].risk_assessment.mission_alignment}</span></td>
                    )}
                  </tr>
                  <tr>
                    <td>Implementation Complexity</td>
                    <td><span className={getComplexityStyle(analysisResults[0].risk_assessment.implementation_complexity)}>{analysisResults[0].risk_assessment.implementation_complexity}</span></td>
                    {analysisResults[1] && (
                      <td><span className={getComplexityStyle(analysisResults[1].risk_assessment.implementation_complexity)}>{analysisResults[1].risk_assessment.implementation_complexity}</span></td>
                    )}
                  </tr>
                  <tr>
                    <td>Allowable Elements</td>
                    <td>
                      <ul className={styles.listInTable}>
                        {analysisResults[0].allowable_elements.map((element, i) => (
                          <li key={i}>{element}</li>
                        ))}
                      </ul>
                    </td>
                    {analysisResults[1] && (
                      <td>
                        <ul className={styles.listInTable}>
                          {analysisResults[1].allowable_elements.map((element, i) => (
                            <li key={i}>{element}</li>
                          ))}
                        </ul>
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td>Unallowable Elements</td>
                    <td>
                      <ul className={styles.listInTable}>
                        {analysisResults[0].unallowable_elements.map((element, i) => (
                          <li key={i}>{element}</li>
                        ))}
                      </ul>
                    </td>
                    {analysisResults[1] && (
                      <td>
                        <ul className={styles.listInTable}>
                          {analysisResults[1].unallowable_elements.map((element, i) => (
                            <li key={i}>{element}</li>
                          ))}
                        </ul>
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td>Required Modifications</td>
                    <td>
                      <ul className={styles.listInTable}>
                        {analysisResults[0].required_modifications.map((mod, i) => (
                          <li key={i}>{mod}</li>
                        ))}
                      </ul>
                    </td>
                    {analysisResults[1] && (
                      <td>
                        <ul className={styles.listInTable}>
                          {analysisResults[1].required_modifications.map((mod, i) => (
                            <li key={i}>{mod}</li>
                          ))}
                        </ul>
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td>Key Considerations</td>
                    <td>
                      <ul className={styles.listInTable}>
                        {analysisResults[0].key_considerations.map((consideration, i) => (
                          <li key={i}>{consideration}</li>
                        ))}
                      </ul>
                    </td>
                    {analysisResults[1] && (
                      <td>
                        <ul className={styles.listInTable}>
                          {analysisResults[1].key_considerations.map((consideration, i) => (
                            <li key={i}>{consideration}</li>
                          ))}
                        </ul>
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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