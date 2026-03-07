// frontend/src/components/Sidebar.jsx

import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  TrendingUp,
  Settings,
  X,
  Target,
  Sparkles
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Resumes', href: '/resumes', icon: FileText },
  { name: 'Job Matching', href: '/jobs', icon: Briefcase },
  { name: 'Career Path', href: '/career', icon: TrendingUp },
  { name: 'Skill Gap', href: '/career/skill-gap', icon: Target },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function Sidebar({ open, onClose }) {
  const location = useLocation()

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href ||
                     (item.href !== '/dashboard' && location.pathname.startsWith(item.href))

    return (
      <NavLink
        to={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
        <span>{item.name}</span>
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />
        )}
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:transform-none lg:top-16 lg:h-[calc(100vh-4rem)] ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-semibold text-gray-900">Career AI</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">AI Powered</span>
            </div>
            <p className="text-sm text-primary-100">
              Get personalized career recommendations powered by AI
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
