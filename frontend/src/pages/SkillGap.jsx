// frontend/src/pages/SkillGap.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { careerAPI, resumeAPI } from '../api/axios'
import { ArrowLeft, Target, Loader2, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import SkillBadge from '../components/SkillBadge'

const ROLES = [
  'data_analyst', 'data_scientist', 'data_engineer', 'ml_engineer',
  'software_engineer', 'product_manager', 'project_manager',
  'devops_engineer', 'qa_engineer', 'ui_ux_designer',
  'marketing', 'sales', 'hr', 'finance'
]

function SkillGap() {
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState(null)
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      const response = await resumeAPI.list()
      setResumes(response.data)
      if (response.data.length > 0) {
        setSelectedResume(response.data[0])
      }
    } catch (error) {
      console.error('Error loading resumes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!targetRole) return

    setAnalyzing(true)
    try {
      const response = await careerAPI.skillGap(
        { target_role: targetRole },
        selectedResume?.id
      )
      setAnalysis(response.data)
    } catch (error) {
      console.error('Error analyzing:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/career" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
          <p className="text-gray-600 mt-1">Identify skills needed for your target role</p>
        </div>
      </div>

      {/* Analysis Form */}
      <div className="card">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Resume
            </label>
            <select
              value={selectedResume?.id || ''}
              onChange={(e) => setSelectedResume(resumes.find(r => r.id === parseInt(e.target.value)))}
              className="input"
            >
              <option value="">Select resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="input"
            >
              <option value="">Select target</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAnalyze}
              disabled={!targetRole || analyzing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Target className="w-5 h-5" />
                  Analyze Gap
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>

            <div className="grid sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {analysis.current_skills_count}
                </div>
                <div className="text-sm text-gray-500">Your Skills</div>
              </div>
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-3xl font-bold text-primary-600">
                  {analysis.target_skills_count}
                </div>
                <div className="text-sm text-gray-500">Required Skills</div>
              </div>
              <div className="text-center p-4 bg-success-50 rounded-lg">
                <div className="text-3xl font-bold text-success-600">
                  {analysis.matched_count}
                </div>
                <div className="text-sm text-gray-500">Matched</div>
              </div>
              <div className="text-center p-4 bg-warning-50 rounded-lg">
                <div className="text-3xl font-bold text-warning-600">
                  {analysis.gap_count}
                </div>
                <div className="text-sm text-gray-500">To Learn</div>
              </div>
            </div>

            {/* Coverage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Skill Coverage</span>
                <span className="text-sm font-bold text-primary-600">
                  {analysis.coverage_percentage?.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.coverage_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Matched Skills */}
          {analysis.matched_skills && analysis.matched_skills.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Skills You Have ✓</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.matched_skills.map((skill, idx) => (
                  <SkillBadge key={idx} skill={skill} variant="matched" />
                ))}
              </div>
            </div>
          )}

          {/* Skills to Learn */}
          {analysis.skills_to_learn && analysis.skills_to_learn.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Skills to Learn</h3>
              <div className="space-y-3">
                {['HIGH', 'MEDIUM', 'LOW'].map((priority) => {
                  const skills = analysis.skills_to_learn.filter(s => s.priority === priority)
                  if (skills.length === 0) return null

                  return (
                    <div key={priority}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        priority === 'HIGH' ? 'text-danger-600' :
                        priority === 'MEDIUM' ? 'text-warning-600' : 'text-gray-600'
                      }`}>
                        {priority} Priority
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s, idx) => (
                          <SkillBadge
                            key={idx}
                            skill={s.skill}
                            variant={`priority_${priority.toLowerCase()}`}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="card bg-gradient-to-r from-primary-50 to-purple-50 border-primary-100">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Next Steps</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Ready to start your learning journey? Create a detailed roadmap with our Career Planning tool.
            </p>
            <Link to="/career" className="btn-primary inline-flex items-center gap-2">
              Plan My Transition
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default SkillGap
