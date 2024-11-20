import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { useProposalDescription } from '../hooks/useSubgraphProposals'
import { analyzeProposal } from '../utils/ai/analyzeProposal'
import type { AIAnalysisResult } from '../types/graphql'
import styles from './analyze.module.css'
import Image from 'next/image'
import { assessModifications } from '../src/validation/confidenceThresholds'
import type { Components } from 'react-markdown'
import type { DetailedHTMLProps, ImgHTMLAttributes } from 'react'

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
const MarkdownComponents: Components = {
  img: function ImageComponent(props: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!props.src || isError) {
      return null;
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
          priority
        />
        {isLoading && <div className={styles.imageLoader}>Loading...</div>}
      </div>
    );
  }
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
          <path d="M12 8v5M12 16v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

// Add helper function to categorize allowable elements
const categorizeAllowableElement = (element: string) => {
  const categories = {
    governance: [
      'governance', 'oversight', 'voting', 'control', 'board',
      'decision', 'authority', 'policy', 'leadership', 'stakeholder'
    ],
    financial: [
      'budget', 'cost', 'fund', 'expense', 'revenue',
      'payment', 'allocation', 'financial', 'monetary', 'treasury'
    ],
    operational: [
      'process', 'implement', 'execute', 'manage', 'coordinate',
      'organize', 'operate', 'conduct', 'perform', 'deliver'
    ],
    community: [
      'community', 'member', 'participant', 'engagement', 'involvement',
      'collaboration', 'participation', 'contribution', 'interaction', 'network'
    ],
    educational: [
      'education', 'learning', 'training', 'knowledge', 'skill',
      'development', 'workshop', 'teaching', 'instruction', 'awareness'
    ],
    technical: [
      'technical', 'technology', 'software', 'platform', 'infrastructure',
      'system', 'protocol', 'development', 'integration', 'implementation'
    ],
    creative: [
      'creative', 'art', 'design', 'content', 'media',
      'production', 'cultural', 'artistic', 'visual', 'creative'
    ]
  }

  const elementLower = element.toLowerCase()
  const matchedCategories = Object.entries(categories)
    .filter(([_, keywords]) => keywords.some(word => elementLower.includes(word)))
    .map(([category]) => category)

  return matchedCategories.length > 0 ? matchedCategories : ['general']
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
  
  // Add grading modal state inside component
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [selectedGrading, setSelectedGrading] = useState<string | null>(null)

  // Add handler function inside component
  const handleViewGradingResponse = (gradingResponse: string) => {
    setSelectedGrading(gradingResponse)
    setShowGradingModal(true)
  }

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
            <th></th>
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
                <div className={styles.reviewStatus}>
                  {result.needs_human_review ? 
                    <>
                      <span className={styles.warningPill}>Required</span>
                      {result.reviewReasons?.map((reason, i) => (
                        <span key={i} className={styles.reviewReason}>• {reason}</span>
                      ))}
                    </> : 
                    <>
                      <span className={styles.successPill}>Not Required</span>
                      <span className={styles.reviewReason}>Automated review passed</span>
                    </>
                  }
                </div>
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
                    <li key={i} className={styles.elementItem}>
                      <div className={styles.elementContent}>
                        <div className={styles.elementCategories}>
                          {categorizeAllowableElement(element).map(category => (
                            <span key={category} className={styles.elementCategory}>
                              {category}
                            </span>
                          ))}
                        </div>
                        <span className={styles.elementText}>{element}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td>Unallowable Elements</td>
            {results.map((result, index) => (
              <td key={index}>
                {result.unallowable_elements.some(element => {
                  const lowerElement = element.toLowerCase();
                  const negativeIndicators = [
                    'no ', 
                    'none ', 
                    'not ', 
                    'there are no',
                    'none identified',
                    'no concerning',
                    'no specific',
                    'does not',
                    'not explicitly'
                  ];
                  return !negativeIndicators.some(indicator => lowerElement.includes(indicator));
                }) ? (
                  <ul className={styles.elementList}>
                    {result.unallowable_elements
                      .filter(element => {
                        const lowerElement = element.toLowerCase();
                        const negativeIndicators = [
                          'no ', 
                          'none ', 
                          'not ', 
                          'there are no',
                          'none identified',
                          'no concerning',
                          'no specific',
                          'does not',
                          'not explicitly'
                        ];
                        return !negativeIndicators.some(indicator => lowerElement.includes(indicator));
                      })
                      .map((element, i) => (
                        <li key={i}>{element}</li>
                      ))}
                  </ul>
                ) : (
                  <div className={styles.noneSection}>None</div>
                )}
              </td>
            ))}
          </tr>
          <tr>
            <td>Suggested Modifications</td>
            {results.map((result, index) => (
              <td key={index}>
                {result.required_modifications.some(mod => {
                  const lowerMod = mod.toLowerCase();
                  const negativeIndicators = [
                    'no ', 
                    'none ', 
                    'not ', 
                    'no significant',
                    'no modifications',
                    'no changes',
                    'aligns with',
                    'proposal is compliant',
                    'no required'
                  ];
                  return !negativeIndicators.some(indicator => lowerMod.includes(indicator));
                }) ? (
                  <div className={styles.modificationsSection}>
                    <div className={styles.modificationHeader}>
                      <span className={styles.severityValue}>
                        {assessModifications(result.required_modifications).severity.toLowerCase()}
                      </span>
                    </div>
                    <ul className={styles.elementList}>
                      {result.required_modifications
                        .filter(mod => {
                          const lowerMod = mod.toLowerCase();
                          const negativeIndicators = [
                            'no ', 
                            'none ', 
                            'not ', 
                            'no significant',
                            'no modifications',
                            'no changes',
                            'aligns with',
                            'proposal is compliant',
                            'no required'
                          ];
                          return !negativeIndicators.some(indicator => lowerMod.includes(indicator));
                        })
                        .map((mod, i) => {
                          const categories = Object.entries(assessModifications([mod]).categories)
                            .filter(([_, count]) => count > 0)
                            .map(([category]) => category)

                          return (
                            <li key={i} className={styles.modificationItem}>
                              <div className={styles.modificationContent}>
                                {categories.length > 0 && (
                                  <div className={styles.modificationCategories}>
                                    {categories.map(cat => (
                                      <span key={cat} className={styles.modificationCategory}>
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <span className={styles.modificationText}>{mod}</span>
                              </div>
                            </li>
                          )
                        })}
                    </ul>
                  </div>
                ) : (
                  <div className={styles.noneSection}>None</div>
                )}
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
            <td>Claude&apos;s Confidence</td>
            {results.map((result, index) => (
              <td key={index}>
                {result.native_confidence && result.native_confidence.rubric_scores ? (
                  <div className={styles.confidenceScores}>
                    <div className={styles.rubricScore}>
                      <span className={styles.rubricLabel}>Classification:</span>
                      <span className={styles.rubricValue}>
                        {result.native_confidence.rubric_scores.classification}/5
                      </span>
                    </div>
                    <div className={styles.rubricScore}>
                      <span className={styles.rubricLabel}>Risk Assessment:</span>
                      <span className={styles.rubricValue}>
                        {result.native_confidence.rubric_scores.risk_assessment}/5
                      </span>
                    </div>
                    <div className={styles.rubricScore}>
                      <span className={styles.rubricLabel}>Modifications:</span>
                      <span className={styles.rubricValue}>
                        {result.native_confidence.rubric_scores.modifications}/5
                      </span>
                    </div>
                    <div className={styles.rubricScore}>
                      <span className={styles.rubricLabel}>Elements:</span>
                      <span className={styles.rubricValue}>
                        {result.native_confidence.rubric_scores.elements}/5
                      </span>
                    </div>
                    <div className={styles.overallConfidence}>
                      <span className={styles.rubricLabel}>Overall:</span>
                      <span className={styles.rubricValue}>
                        {((result.native_confidence.response_confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    {result.native_confidence.grading_response && (
                      <div className={styles.gradingResponse}>
                        <button 
                          onClick={() => result.native_confidence?.grading_response && 
                            handleViewGradingResponse(result.native_confidence.grading_response)}
                          className={styles.viewGradingButton}
                        >
                          View Grading Details
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>Confidence metrics not available</div>
                )}
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
            <div className={`${styles.statusBar} ${!isAnalyzing && !analysisStatus.some(s => s.state === 'error') && styles.fadeOut}`}>
              {analysisStatus.map((status, index) => (
                <div 
                  key={index} 
                  className={`${styles.statusPill} ${styles[status.state]}`}
                >
                  <StatusIcon state={status.state} />
                  <div className={styles.statusInfo}>
                    <span className={styles.statusTitle}>
                      {getPromptName(selectedPrompts[index])} Analysis
                    </span>
                    <span className={styles.statusLabel}>
                      {status.state === 'pending' && 'Queued'}
                      {status.state === 'running' && 'In Progress'}
                      {status.state === 'success' && 'Complete'}
                      {status.state === 'error' && (
                        <span className={styles.errorDetail}>
                          {status.error?.includes('token') ? 'Response too long' :
                           status.error?.includes('rate limit') ? 'Rate limit exceeded' :
                           status.error?.includes('timed out') ? 'Analysis timed out' :
                           status.error?.includes('format') ? 'Invalid response format' :
                           status.error || 'Unknown error'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.results}>
            <div className={styles.comparisonGrid}>
              {analysisResults.length > 0 ? (
                renderComparisonTable(analysisResults)
              ) : (
                <table className={styles.comparisonTable}>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Moderate Analysis</th>
                      <th>Innovative Analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      'Classification',
                      'Primary Purpose',
                      'Human Review Required',
                      'Private Benefit Risk',
                      'Mission Alignment',
                      'Implementation Complexity',
                      'Allowable Elements',
                      'Unallowable Elements',
                      'Suggested Modifications',
                      'Key Considerations',
                      'Claude\'s Confidence'
                    ].map(aspect => (
                      <tr key={aspect}>
                        <td>{aspect}</td>
                        <td className={styles.emptyCell}>Awaiting analysis...</td>
                        <td className={styles.emptyCell}>Awaiting analysis...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      <RawAnalysisModal />
      
      {showGradingModal && selectedGrading && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Grading Details</h2>
              <button 
                onClick={() => setShowGradingModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <pre className={styles.rawAnalysis}>
              {selectedGrading}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
