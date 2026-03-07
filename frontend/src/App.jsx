// frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ResumeList from './pages/ResumeList'
import ResumeDetail from './pages/ResumeDetail'
import ResumeOptimize from './pages/ResumeOptimize'
import Jobs from './pages/Jobs'
import JobMatch from './pages/JobMatch'
import JobApply from './pages/JobApply'
import Career from './pages/Career'
import SkillGap from './pages/SkillGap'
import Settings from './pages/Settings'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resumes"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumeList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resume/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumeDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resume/:id/optimize"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumeOptimize />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <Layout>
              <Jobs />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs/match/:resumeId"
        element={
          <ProtectedRoute>
            <Layout>
              <JobMatch />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs/:jobId/apply"
        element={
          <ProtectedRoute>
            <Layout>
              <JobApply />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/career"
        element={
          <ProtectedRoute>
            <Layout>
              <Career />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/career/skill-gap"
        element={
          <ProtectedRoute>
            <Layout>
              <SkillGap />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to dashboard if authenticated, else landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
