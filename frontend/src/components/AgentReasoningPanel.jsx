// frontend/src/components/AgentReasoningPanel.jsx

import { useState } from 'react'
import {
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react'

function AgentReasoningPanel({ decision, outcome, title = "AI Analysis" }) {
  const [expanded, setExpanded] = useState(true)

  if (!decision && !outcome) return null

  const getDecisionIcon = (dec) => {
    switch (dec?.toUpperCase()) {
      case 'APPLY':
        return <CheckCircle className="w-6 h-6 text-success-500" />
      case 'SKIP':
        return <XCircle className="w-6 h-6 text-danger-500" />
      case 'SAVE':
        return <AlertCircle className="w-6 h-6 text-warning-500" />
      default:
        return <Brain className="w-6 h-6 text-primary-500" />
    }
  }

  const getDecisionColor = (dec) => {
    switch (dec?.toUpperCase()) {
      case 'APPLY':
        return 'bg-success-50 border-success-200 text-success-800'
      case 'SKIP':
        return 'bg-danger-50 border-danger-200 text-danger-800'
      case 'SAVE':
        return 'bg-warning-50 border-warning-200 text-warning-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="card">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">AI-powered decision analysis</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-6 space-y-6">
          {/* Decision */}
          {decision && (
            <div>
              <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border ${getDecisionColor(decision.decision)}`}>
                {getDecisionIcon(decision.decision)}
                <div>
                  <div className="font-semibold text-lg">{decision.decision}</div>
                  <div className="text-sm opacity-80">
                    Confidence: {decision.confidence?.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Reasons */}
              {decision.reasons && decision.reasons.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-warning-500" />
                    Key Factors
                  </h4>
                  <ul className="space-y-2">
                    {decision.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* LLM Reasoning */}
              {decision.llm_reasoning && (
                <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg border border-primary-100">
                  <h4 className="text-sm font-medium text-primary-800 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Reasoning
                  </h4>
                  <p className="text-sm text-gray-700">{decision.llm_reasoning}</p>
                </div>
              )}

              {/* Factors */}
              {decision.factors && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Skill Match</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {decision.factors.skill_match?.toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Overall Match</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {decision.factors.overall_match?.toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Salary Fit</div>
                    <div className="text-lg font-semibold">
                      {decision.factors.salary_fit ? (
                        <span className="text-success-600">✓ Yes</span>
                      ) : (
                        <span className="text-danger-600">✗ No</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Location Fit</div>
                    <div className="text-lg font-semibold">
                      {decision.factors.location_fit ? (
                        <span className="text-success-600">✓ Yes</span>
                      ) : (
                        <span className="text-danger-600">✗ No</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outcome Prediction */}
          {outcome && (
            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                Interview Callback Prediction
              </h4>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold text-primary-600">
                  {outcome.callback_probability?.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">
                  {outcome.interpretation}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    outcome.callback_probability >= 60 ? 'bg-success-500' :
                    outcome.callback_probability >= 40 ? 'bg-warning-500' : 'bg-danger-500'
                  }`}
                  style={{ width: `${outcome.callback_probability}%` }}
                />
              </div>

              {/* Scenarios */}
              {outcome.scenarios && outcome.scenarios.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-500" />
                    What-If Scenarios
                  </h5>
                  <div className="space-y-2">
                    {outcome.scenarios.map((scenario, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">{scenario.scenario}</span>
                        <span className={`text-sm font-semibold ${
                          scenario.change > 0 ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {scenario.change > 0 ? '+' : ''}{scenario.change?.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AgentReasoningPanel
