// frontend/src/pages/Dashboard.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, resumeAPI } from '../api/axios'
import {
  FileText,
  Briefcase,
  TrendingUp,
  Target,
  ArrowRight,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ScoreGauge from '../components/ScoreGauge'

function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [resumes, setResumes] = useState([])
  const [applications, setApplications] = useState([])
  const [insights, setInsights] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, resumesRes, appsRes, insightsRes] = await Promise.all([
        dashboardAPI.stats(),
        resumeAPI.list(),
        dashboardAPI.applications(5),
        dashboardAPI.insights()
      ])

      setStats(statsRes.data)
      setResumes(resumesRes.data)
      setApplications(appsRes.data)
      setInsights(insightsRes.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: Briefcase,
      color: 'bg-primary-100 text-primary-600'
    },
    {
      label: 'Interviews',
      value: stats?.interviews || 0,
      icon: CheckCircle,
      color: 'bg-success-50 text-success-600'
    },
    {
      label: 'Offers',
      value: stats?.offers || 0,
      icon: Target,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      label: 'Interview Rate',
      value: `${stats?.interview_rate || 0}%`,
      icon: TrendingUp,
      color: 'bg-warning-50 text-warning-600'
    },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your career progress
          </p>
        </div>

        {resumes.length === 0 ? (
          <Link to="/resumes" className="btn-primary flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Resume
          </Link>
        ) : (
          <Link to="/jobs" className="btn-primary flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Find Jobs
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Resume Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Best Resume */}
          {stats?.best_resume && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Best Resume</h2>
                <Link to={`/resume/${stats.best_resume.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View Details
                </Link>
              </div>

              <div className="flex items-center gap-6">
                <ScoreGauge score={stats.best_resume.ats_score || 0} size="md" label="ATS Score" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{stats.best_resume.filename}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.best_resume.ats_score >= 70
                      ? 'Great! Your resume is optimized for ATS'
                      : 'Consider optimizing your resume for better results'}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <Link to={`/resume/${stats.best_resume.id}/optimize`} className="btn-outline text-sm py-1.5">
                      Optimize
                    </Link>
                    <Link to={`/jobs/match/${stats.best_resume.id}`} className="btn-primary text-sm py-1.5">
                      Find Matching Jobs
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Applications */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <Link to="/dashboard/applications" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No applications yet</p>
                <Link to="/jobs" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
                  Start applying to jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{app.job_title}</p>
                      <p className="text-sm text-gray-500">{app.company}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          app.match_score >= 70 ? 'text-success-600' :
                          app.match_score >= 50 ? 'text-warning-600' : 'text-gray-600'
                        }`}>
                          {app.match_score?.toFixed(0)}% match
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`badge ${
                        app.status === 'offered' ? 'badge-success' :
                        app.status === 'interviewing' ? 'badge-primary' :
                        app.status === 'applied' ? 'badge-gray' :
                        'badge-danger'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/resumes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Upload Resume</p>
                  <p className="text-xs text-gray-500">Add a new resume</p>
                </div>
              </Link>

              <Link to="/jobs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Find Jobs</p>
                  <p className="text-xs text-gray-500">Discover opportunities</p>
                </div>
              </Link>

              <Link to="/career" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Career Planning</p>
                  <p className="text-xs text-gray-500">Plan your next move</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Insights */}
          {insights?.insights && insights.insights.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-warning-500" />
                <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
              </div>
              <div className="space-y-3">
                {insights.insights.slice(0, 3).map((insight, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Average Scores */}
          {stats && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Avg Match Score</span>
                    <span className="font-medium">{stats.average_match_score?.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${stats.average_match_score}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Avg Callback Probability</span>
                    <span className="font-medium">{stats.average_callback_probability?.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success-500 rounded-full"
                      style={{ width: `${stats.average_callback_probability}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
