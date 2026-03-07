// frontend/src/pages/Career.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { careerAPI, resumeAPI } from '../api/axios'
import {
  TrendingUp,
  Target,
  Loader2,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import CareerRoadmap from '../components/CareerRoadmap'

const ROLES = [
  'data_analyst', 'data_scientist', 'data_engineer', 'ml_engineer',
  'software_engineer', 'product_manager', 'project_manager',
  'devops_engineer', 'qa_engineer', 'ui_ux_designer',
  'marketing', 'sales', 'hr', 'finance'
]

function Career() {
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState(null)
  const [currentRole, setCurrentRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [planning, setPlanning] = useState(false)
  const [plan, setPlan] = useState(null)
  const [roadmap, setRoadmap] = useState(null)

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

  const handlePlanTransition = async () => {
    if (!currentRole || !targetRole) return

    setPlanning(true)
    try {
      const [planRes, roadmapRes] = await Promise.all([
        careerAPI.transitionPlan({
          current_role: currentRole,
          target_role: targetRole,
          experience_years: 0
        }, selectedResume?.id),
        careerAPI.roadmap(targetRole, selectedResume?.id)
      ])

      setPlan(planRes.data)
      setRoadmap(roadmapRes.data)
    } catch (error) {
      console.error('Error creating plan:', error)
    } finally {
      setPlanning(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Planning</h1>
          <p className="text-gray-600 mt-1">Plan your career transition with AI</p>
        </div>
        <Link to="/career/skill-gap" className="btn-outline flex items-center gap-2">
          <Target className="w-5 h-5" />
          Skill Gap Analysis
        </Link>
      </div>

      {/* Transition Planner */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Career Transition Planner</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Resume Selection */}
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

          {/* Current Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Role
            </label>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="input"
            >
              <option value="">Select role</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Target Role */}
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

          {/* Button */}
          <div className="flex items-end">
            <button
              onClick={handlePlanTransition}
              disabled={!currentRole || !targetRole || planning}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {planning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Plan Transition
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Transition Plan Results */}
      {plan && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transition Overview</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Current Role</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {currentRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>

              <ArrowRight className="w-6 h-6 text-gray-400" />

              <div className="flex-1 text-center p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-600">Target Role</p>
                <p className="font-semibold text-primary-700 mt-1">
                  {targetRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-success-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {(plan.feasibility * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-500">Feasibility</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {plan.estimated_timeline_months}
                </div>
                <div className="text-sm text-gray-500">Months (Est.)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Target className="w-8 h-8 text-warning-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {plan.skill_gap?.gap_count || 0}
                </div>
                <div className="text-sm text-gray-500">Skills to Learn</div>
              </div>
            </div>

            {/* AI Advice */}
            {plan.ai_advice && (
              <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg border border-primary-100">
                <h3 className="text-sm font-medium text-primary-800 mb-2">AI Career Advice</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{plan.ai_advice}</p>
              </div>
            )}
          </div>

          {/* Learning Roadmap */}
          {roadmap && <CareerRoadmap roadmap={roadmap} />}
        </div>
      )}
    </div>
  )
}

export default Career
