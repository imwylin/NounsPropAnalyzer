import type { ParsedAnalysis } from '../../types/parser'

interface CharitableBreakdownProps {
  analysis: ParsedAnalysis
}

/**
 * Displays detailed breakdown of charitable elements and compliance concerns
 */
export function CharitableBreakdown({ analysis }: CharitableBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Allowable Elements */}
      <section>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Charitable Elements
        </h3>
        <ul className="divide-y divide-gray-200">
          {analysis.allowable_elements.map((element, i) => (
            <li key={i} className="py-3 flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
              <p className="ml-3 text-gray-700">{element}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Unallowable Elements */}
      {analysis.unallowable_elements.length > 0 && (
        <section>
          <h3 className="text-lg font-medium text-red-600 mb-3">
            Compliance Concerns
          </h3>
          <ul className="divide-y divide-gray-200">
            {analysis.unallowable_elements.map((element, i) => (
              <li key={i} className="py-3 flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-red-500">✕</span>
                <p className="ml-3 text-red-700">{element}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Required Modifications */}
      {analysis.required_modifications.length > 0 && (
        <section>
          <h3 className="text-lg font-medium text-yellow-800 mb-3">
            Required Modifications
          </h3>
          <ul className="divide-y divide-gray-200">
            {analysis.required_modifications.map((modification, i) => (
              <li key={i} className="py-3 flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-yellow-500">!</span>
                <p className="ml-3 text-yellow-800">{modification}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
} 