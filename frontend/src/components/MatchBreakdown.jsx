// frontend/src/components/MatchBreakdown.jsx

import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Target,
} from "lucide-react";
import SkillBadge from "./SkillBadge";
import ScoreGauge from "./ScoreGauge";

function MatchBreakdown({ match, explanation }) {
  if (!match) return null;

  const {
    overall_score,
    skill_match_score,
    semantic_score,
    matched_skills = [],
    missing_skills = [],
    extra_skills = [],
  } = match;

  const getMatchLevel = (score) => {
    if (score >= 80)
      return {
        label: "Excellent Match",
        color: "text-success-600",
        bg: "bg-success-50",
      };
    if (score >= 60)
      return {
        label: "Good Match",
        color: "text-primary-600",
        bg: "bg-primary-50",
      };
    if (score >= 40)
      return {
        label: "Moderate Match",
        color: "text-warning-600",
        bg: "bg-warning-50",
      };
    return { label: "Low Match", color: "text-danger-600", bg: "bg-danger-50" };
  };

  const matchLevel = getMatchLevel(overall_score);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Match Analysis
            </h3>
            <div
              className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${matchLevel.bg}`}
            >
              <Target className={`w-4 h-4 ${matchLevel.color}`} />
              <span className={`text-sm font-medium ${matchLevel.color}`}>
                {matchLevel.label}
              </span>
            </div>
          </div>
          <ScoreGauge score={overall_score} size="lg" label="Overall Match" />
        </div>

        {/* Score breakdown bars */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Skill Match</span>
              <span className="text-sm font-semibold text-gray-900">
                {skill_match_score?.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${skill_match_score}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Content Match</span>
              <span className="text-sm font-semibold text-gray-900">
                {semantic_score?.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${semantic_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="card">
        <h4 className="font-semibold text-gray-900 mb-4">Skills Analysis</h4>

        <div className="flex items-center gap-6 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success-500" />
            <span>
              <strong>{matched_skills.length}</strong> matched
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger-500" />
            <span>
              <strong>{missing_skills.length}</strong> missing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary-500" />
            <span>
              <strong>{extra_skills.length}</strong> extra
            </span>
          </div>
        </div>

        {/* Matched Skills */}
        {matched_skills.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-500" />
              Skills You Have
            </h5>
            <div className="flex flex-wrap gap-2">
              {matched_skills.map((skill, idx) => (
                <SkillBadge
                  key={idx}
                  skill={skill}
                  variant="matched"
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {missing_skills.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-danger-500" />
              Skills to Develop
            </h5>
            <div className="flex flex-wrap gap-2">
              {missing_skills.map((skill, idx) => (
                <SkillBadge
                  key={idx}
                  skill={skill}
                  variant="missing"
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Extra Skills */}
        {extra_skills.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              Additional Skills You Bring
            </h5>
            <div className="flex flex-wrap gap-2">
              {extra_skills.map((skill, idx) => (
                <SkillBadge key={idx} skill={skill} variant="extra" size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Explanation */}
      {explanation && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-3">AI Analysis</h4>

          {explanation.summary && (
            <p className="text-gray-700 mb-4">{explanation.summary}</p>
          )}

          {explanation.strengths && explanation.strengths.length > 0 && (
            <div className="mb-3">
              <h5 className="text-sm font-medium text-success-700 mb-2">
                Strengths
              </h5>
              <ul className="space-y-1">
                {explanation.strengths.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explanation.recommendations &&
            explanation.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-primary-700 mb-2">
                  Recommendations
                </h5>
                <ul className="space-y-1">
                  {explanation.recommendations.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <AlertCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {explanation.detailed_analysis && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {explanation.detailed_analysis}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MatchBreakdown;
