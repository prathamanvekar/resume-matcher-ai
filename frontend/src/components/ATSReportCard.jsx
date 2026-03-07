// frontend/src/components/ATSReportCard.jsx

import { CheckCircle, XCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import ScoreGauge from './ScoreGauge'

function ATSReportCard({ report, showDetails = true }) {
  const [expanded, setExpanded] = useState(false)

  if (!report) return null

  const { total_score, passed, breakdown, recommendations, explanation } = report

  const getStatusIcon = (score) => {
    if (score >= 70) return <CheckCircle className="w-5 h-5 text-success-500" />
    if (score >= 50) return <AlertTriangle className="w-5 h-5 text-warning-500" />
    return <XCircle className="w-5 h-5 text-danger-500" />
  }

  const breakdownLabels = {
    length_score: { label: 'Resume Length', description: 'Optimal word count (400-800 words)' },
    skill_score: { label: 'Skills Section', description: 'Number and relevance of skills' },
    section_score: { label: 'Section Organization', description: 'Key sections present' },
    contact_score: { label: 'Contact Information', description: 'Email, phone, LinkedIn' },
    density_score: { label: 'Keyword Density', description: 'Skills distribution in content' },
    action_score: { label: 'Action Verbs', description: 'Achievement-oriented language' },
  }

  return (
    <div className="card">
      {/* Header with score */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ATS Compatibility Score</h3>
          <p className="text-sm text-gray-500">
            {passed ? 'Your resume is optimized for ATS' : 'Your resume needs optimization'}
          </p>
        </div>
        <ScoreGauge score={total_score} size="md" showLabel={false} />
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 ${
        passed ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
      }`}>
        {passed ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        <span className="text-sm font-medium">
          {passed ? 'Likely to pass ATS screening' : 'May struggle with ATS screening'}
        </span>
      </div>

      {/* Breakdown */}
      {showDetails && breakdown && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-gray-700">Score Breakdown</h4>

          {Object.entries(breakdown).map(([key, score]) => {
            const info = breakdownLabels[key] || { label: key, description: '' }
            return (
              <div key={key} className="flex items-center gap-3">
                {getStatusIcon(score)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{info.label}</span>
                    <span className={`text-sm font-semibold ${
                      score >= 70 ? 'text-success-600' :
                      score >= 50 ? 'text-warning-600' : 'text-danger-600'
                    }`}>
                      {score}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 70 ? 'bg-success-500' :
                        score >= 50 ? 'bg-warning-500' : 'bg-danger-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h4 className="text-sm font-medium text-gray-700">
              Recommendations ({recommendations.length})
            </h4>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expanded && (
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Explanation */}
      {explanation?.overall_assessment && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{explanation.overall_assessment}</p>
        </div>
      )}
    </div>
  )
}

export default ATSReportCard
