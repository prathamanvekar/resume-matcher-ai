// frontend/src/pages/Landing.jsx

import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FileText,
  Target,
  TrendingUp,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Brain,
  Briefcase,
  BarChart3,
  Zap
} from 'lucide-react'

function Landing() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const features = [
    {
      icon: FileText,
      title: 'Smart Resume Parsing',
      description: 'AI-powered resume analysis extracts skills, experience, and achievements automatically.'
    },
    {
      icon: Target,
      title: 'ATS Optimization',
      description: 'Get detailed ATS compatibility scores and actionable recommendations to improve your resume.'
    },
    {
      icon: Briefcase,
      title: 'Job Matching',
      description: 'Find jobs that match your skills with semantic search and detailed compatibility analysis.'
    },
    {
      icon: Brain,
      title: 'AI Decision Engine',
      description: 'Get AI-powered recommendations on whether to apply, with confidence scores and reasoning.'
    },
    {
      icon: TrendingUp,
      title: 'Career Planning',
      description: 'Map your career transition path with skill gap analysis and personalized learning roadmaps.'
    },
    {
      icon: BarChart3,
      title: 'Interview Prediction',
      description: 'Predict your chances of getting a callback with our ML-powered outcome predictor.'
    },
  ]

  const steps = [
    { step: 1, title: 'Upload Resume', description: 'Upload your resume in PDF, DOCX, or TXT format' },
    { step: 2, title: 'Get Analysis', description: 'AI parses and scores your resume for ATS compatibility' },
    { step: 3, title: 'Find Jobs', description: 'Discover matching jobs with detailed skill analysis' },
    { step: 4, title: 'Apply Smart', description: 'Get AI recommendations and auto-generated cover letters' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-semibold text-gray-900">Career Intelligence</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-100/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Career Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Land Your Dream Job with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                AI Intelligence
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Optimize your resume for ATS, find matching jobs, and get AI-powered recommendations
              to maximize your chances of getting hired.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-outline text-lg px-8 py-3">
                Sign In
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-gray-600">Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-gray-600">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-gray-600">AI-powered insights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides all the tools you need to optimize your job search
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="card-hover">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item, idx) => (
              <div key={idx} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-12 h-12 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Supercharge Your Job Search?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of job seekers using AI to land their dream jobs faster.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-semibold text-white">Career Intelligence</span>
            </div>
            <p className="text-sm">© 2024 Career Intelligence. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
