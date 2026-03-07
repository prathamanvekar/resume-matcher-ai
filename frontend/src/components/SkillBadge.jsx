// frontend/src/components/SkillBadge.jsx

import { Check, X, AlertCircle } from 'lucide-react'

function SkillBadge({ skill, variant = 'default', size = 'md', showIcon = false }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    matched: 'bg-success-50 text-success-700 border-success-200',
    missing: 'bg-danger-50 text-danger-700 border-danger-200',
    extra: 'bg-primary-50 text-primary-700 border-primary-200',
    priority_high: 'bg-danger-50 text-danger-700 border-danger-200',
    priority_medium: 'bg-warning-50 text-warning-700 border-warning-200',
    priority_low: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  const icons = {
    matched: <Check className="w-3 h-3" />,
    missing: <X className="w-3 h-3" />,
    priority_high: <AlertCircle className="w-3 h-3" />,
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${variants[variant]} ${sizes[size]}`}
    >
      {showIcon && icons[variant] && icons[variant]}
      {skill}
    </span>
  )
}

export default SkillBadge
