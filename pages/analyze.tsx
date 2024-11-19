import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { useProposalDescription } from '../hooks/useSubgraphProposals'
import { analyzeProposal } from '../utils/ai/analyzeProposal'
import type { AIAnalysisResult } from '../types/graphql'
import styles from './analyze.module.css'
import Image from 'next/image'

interface RawAnalysis {
  promptVersion: number
  response: string
  timestamp: string
}

interface AnalysisResultWithMeta extends AIAnalysisResult {
  proposalId: string
  timestamp: string
  rawAnalysis?: RawAnalysis
}

interface AnalysisStatus {
  attempt: number;
  state: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

// Add this component for custom image rendering
const MarkdownComponents = {
  img: ({ node, ...props }: any) => {
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!props.src || isError) {
      return null; // Don't render anything if src is missing or there's an error
    }

    return (
      <div className={styles.imageWrapper}>
        <Image
          src={props.src}
          alt={props.alt || ''}
          width={800}
          height={400}
          className={`${styles.markdownImage} ${!isLoading ? styles.loaded : ''}`}
          unoptimized
          onError={() => setIsError(true)}
          onLoad={() => setIsLoading(false)}
          priority={false}
        />
        {isLoading && <div className={styles.imageLoader}>Loading...</div>}
      </div>
    );
  },
}

const StatusIcon = ({ state }: { state: string }) => {
  switch (state) {
    case 'pending':
      return (
        <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'running':
      return (
        <svg className={`${styles.statusIcon} ${styles.spinning}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'success':
      return (
        <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'error':
      return (
        <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

const getRiskStyle = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
  switch (risk) {
    case 'LOW':
      return styles.riskLow
    case 'HIGH':
      return styles.riskHigh
    default:
      return styles.riskMedium
  }
}

const getAlignmentStyle = (alignment: 'STRONG' | 'MODERATE' | 'WEAK') => {
  switch (alignment) {
    case 'STRONG':
      return styles.alignmentStrong
    case 'WEAK':
      return styles.alignmentWeak
    default:
      return styles.alignmentModerate
  }
}

const getComplexityStyle = (complexity: 'LOW' | 'MEDIUM' | 'HIGH') => {
  switch (complexity) {
    case 'LOW':
      return styles.complexityLow
    case 'HIGH':
      return styles.complexityHigh
    default:
      return styles.complexityMedium
  }
}

export default function AnalyzePage() {
  const [proposalId, setProposalId] = useState('')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultWithMeta[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedPrompts, setSelectedPrompts] = useState<[number, number]>([1, 3])
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus[]>([])
  const [showStatus, setShowStatus] = useState(true)
  const [showRawAnalysis, setShowRawAnalysis] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<RawAnalysis | null>(null)
  
  const { 
    data: description,
    isLoading,
    error 
  } = useProposalDescription(proposalId)

  const handleAnalyze = async () => {
    if (!description) return
    setIsAnalyzing(true)
    setShowStatus(true)
    setAnalysisResults([])
    setAnalysisStatus([
      { attempt: 1, state: 'pending' },
      { attempt: 2, state: 'pending' }
    ])

    try {
      // First Analysis
      setAnalysisStatus(prev => [
        { ...prev[0], state: 'running' },
        prev[1]
      ])
      
      const firstAnalysis = await analyzeProposal(description, selectedPrompts[0])
      const firstRawAnalysis = {
        promptVersion: selectedPrompts[0],
        response: firstAnalysis.rawResponse || 'Raw response not available',
        timestamp: new Date().toISOString()
      }
      
      setAnalysisStatus(prev => [
        { ...prev[0], state: 'success' },
        prev[1]
      ])
      
      setAnalysisResults([{
        ...firstAnalysis,
        proposalId,
        timestamp: new Date().toISOString(),
        rawAnalysis: firstRawAnalysis
      }])
      
      // Wait before second analysis
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      // Second Analysis with different prompt
      setAnalysisStatus(prev => [
        prev[0],
        { ...prev[1], state: 'running' }
      ])
      
      const secondAnalysis = await analyzeProposal(description, selectedPrompts[1])
      const secondRawAnalysis = {
        promptVersion: selectedPrompts[1],
        response: secondAnalysis.rawResponse || 'Raw response not available',
        timestamp: new Date().toISOString()
      }
      
      setAnalysisStatus(prev => [
        prev[0],
        { ...prev[1], state: 'success' }
      ])

      setAnalysisResults(prev => [...prev, {
        ...secondAnalysis,
        proposalId,
        timestamp: new Date().toISOString(),
        rawAnalysis: secondRawAnalysis
      }])

      setTimeout(() => {
        setShowStatus(false)
      }, 2000)

    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysisStatus(prev => prev.map(status => 
        status.state === 'running' ? { ...status, state: 'error', error: 'Analysis failed' } : status
      ))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleViewRawAnalysis = (rawAnalysis: RawAnalysis) => {
    setSelectedAnalysis(rawAnalysis)
    setShowRawAnalysis(true)
  }

  const RawAnalysisModal = () => {
    if (!showRawAnalysis || !selectedAnalysis) return null

    return (
      <div className={styles.modalOverlay} onClick={() => setShowRawAnalysis(false)}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Raw Analysis Output</h3>
            <div className={styles.modalMeta}>
              <span>Prompt Version: {getPromptName(selectedAnalysis.promptVersion)}</span>
              <span>Time: {new Date(selectedAnalysis.timestamp).toLocaleString()}</span>
            </div>
            <button 
              className={styles.closeButton}
              onClick={() => setShowRawAnalysis(false)}
            >
              ×
            </button>
          </div>
          <pre className={styles.rawAnalysis}>
            {selectedAnalysis.response}
          </pre>
        </div>
      </div>
    )
  }

  const getPromptName = (promptId: number) => {
    switch (promptId) {
      case 1:
        return 'Moderate'
      case 2:
        return 'Hawkish'
      case 3:
        return 'Innovative'
      default:
        return 'Unknown'
    }
  }

  const renderComparisonTable = (results: AnalysisResultWithMeta[]) => {
    return (
      <table className={styles.comparisonTable}>
        <thead>
          <tr>
            <th>Aspect</th>
            {results.map((result, index) => (
              <th key={index}>
                <div className={styles.columnHeader}>
                  <span>{getPromptName(selectedPrompts[index])} Analysis</span>
                  {result.rawAnalysis && (
                    <button 
                      className={styles.viewRawButton}
                      onClick={() => handleViewRawAnalysis(result.rawAnalysis!)}
                    >
                      View Raw
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Classification</td>
            {results.map((result, index) => (
              <td key={index}>{result.classification}</td>
            ))}
          </tr>
          <tr>
            <td>Primary Purpose</td>
            {results.map((result, index) => (
              <td key={index}>{result.primary_purpose}</td>
            ))}
          </tr>
          <tr>
            <td>Human Review Required</td>
            {results.map((result, index) => (
              <td key={index}>
                {result.needs_human_review ? 
                  <span className={styles.warningPill}>Required</span> : 
                  <span className={styles.successPill}>Not Required</span>
                }
              </td>
            ))}
          </tr>
          <tr>
            <td>Private Benefit Risk</td>
            {results.map((result, index) => (
              <td key={index}>
                <span className={getRiskStyle(result.risk_assessment.private_benefit_risk)}>
                  {result.risk_assessment.private_benefit_risk}
                </span>
              </td>
            ))}
          </tr>
          <tr>
            <td>Mission Alignment</td>
            {results.map((result, index) => (
              <td key={index}>
                <span className={getAlignmentStyle(result.risk_assessment.mission_alignment)}>
                  {result.risk_assessment.mission_alignment}
                </span>
              </td>
            ))}
          </tr>
          <tr>
            <td>Implementation Complexity</td>
            {results.map((result, index) => (
              <td key={index}>
                <span className={getComplexityStyle(result.risk_assessment.implementation_complexity)}>
                  {result.risk_assessment.implementation_complexity}
                </span>
              </td>
            ))}
          </tr>
          <tr>
            <td>Allowable Elements</td>
            {results.map((result, index) => (
              <td key={index}>
                <ul className={styles.elementList}>
                  {result.allowable_elements.map((element, i) => (
                    <li key={i}>{element}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td>Unallowable Elements</td>
            {results.map((result, index) => (
              <td key={index}>
                <ul className={styles.elementList}>
                  {result.unallowable_elements.map((element, i) => (
                    <li key={i}>{element}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td>Required Modifications</td>
            {results.map((result, index) => (
              <td key={index}>
                <ul className={styles.elementList}>
                  {result.required_modifications.map((mod, i) => (
                    <li key={i}>{mod}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td>Key Considerations</td>
            {results.map((result, index) => (
              <td key={index}>
                <ul className={styles.elementList}>
                  {result.key_considerations.map((consideration, i) => (
                    <li key={i}>{consideration}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td>Confidence Scores</td>
            {results.map((result, index) => (
              <td key={index}>
                <div>Classification: {(result.confidence_scores.classification * 100).toFixed(1)}%</div>
                <div>Private Benefit: {(result.confidence_scores.risk_assessment.private_benefit_risk * 100).toFixed(1)}%</div>
                <div>Mission Alignment: {(result.confidence_scores.risk_assessment.mission_alignment * 100).toFixed(1)}%</div>
                <div>Implementation: {(result.confidence_scores.risk_assessment.implementation_complexity * 100).toFixed(1)}%</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.inputSection}>
          <div className={styles.inputGroup}>
            <label htmlFor="proposalId" className={styles.inputLabel}>
              Proposal ID
            </label>
            <input
              id="proposalId"
              type="text"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              placeholder="Enter ID"
              className={styles.input}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="analysisType1" className={styles.inputLabel}>
              First Analysis
            </label>
            <select
              id="analysisType1"
              value={selectedPrompts[0]}
              onChange={(e) => setSelectedPrompts([Number(e.target.value), selectedPrompts[1]])}
              className={styles.select}
              disabled={isAnalyzing}
            >
              <option value={1}>Moderate Analysis</option>
              <option value={2}>Hawkish Analysis</option>
              <option value={3}>Innovative Analysis</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="analysisType2" className={styles.inputLabel}>
              Second Analysis
            </label>
            <select
              id="analysisType2"
              value={selectedPrompts[1]}
              onChange={(e) => setSelectedPrompts([selectedPrompts[0], Number(e.target.value)])}
              className={styles.select}
              disabled={isAnalyzing}
            >
              <option value={1}>Moderate Analysis</option>
              <option value={2}>Hawkish Analysis</option>
              <option value={3}>Innovative Analysis</option>
            </select>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={!description || isAnalyzing || isLoading}
            className={styles.analyzeButton}
          >
            {isLoading ? 'Loading Proposal...' : isAnalyzing ? 'Analyzing...' : 'Compare Analyses'}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            Proposal not found. Please check the ID and try again.
          </div>
        )}
      </div>

      <div className={styles.splitView}>
        <div className={styles.proposalPanel}>
          <div className={styles.panelHeader}>
            <h2>Proposal Content</h2>
            {description && <span className={styles.proposalId}>#{proposalId}</span>}
          </div>
          {description && (
            <div className={styles.proposalContent}>
              <ReactMarkdown 
                remarkPlugins={[remarkBreaks]}
                components={MarkdownComponents}
              >
                {description}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className={styles.analysisPanel}>
          <div className={styles.panelHeader}>
            <h2>Analysis Results</h2>
          </div>
          
          {analysisStatus.length > 0 && showStatus && (
            <div className={`${styles.statusBar} ${!isAnalyzing && styles.fadeOut}`}>
              {analysisStatus.map((status, index) => (
                <div 
                  key={index} 
                  className={`${styles.statusPill} ${styles[status.state]}`}
                >
                  <StatusIcon state={status.state} />
                  <div className={styles.statusInfo}>
                    <span className={styles.statusTitle}>Analysis {index + 1}</span>
                    <span className={styles.statusLabel}>
                      {status.state === 'pending' && 'Queued'}
                      {status.state === 'running' && 'In Progress'}
                      {status.state === 'success' && 'Complete'}
                      {status.state === 'error' && 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {analysisResults.length > 0 && (
            <div className={styles.results}>
              <div className={styles.comparisonGrid}>
                {renderComparisonTable(analysisResults)}
              </div>
            </div>
          )}
        </div>
      </div>
      <RawAnalysisModal />
    </div>
  )
}
