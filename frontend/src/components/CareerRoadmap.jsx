// frontend/src/components/CareerRoadmap.jsx

import { Clock, BookOpen, CheckCircle, ArrowRight, Target } from 'lucide-react'
import SkillBadge from './SkillBadge'

function CareerRoadmap({ roadmap }) {
  if (!roadmap) return null

  const { target_role, total_skills_to_learn, current_coverage, phases } = roadmap

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Learning Roadmap</h3>
            <p className="text-sm text-gray-500 mt-1">
              Your personalized path to becoming a <span className="font-medium text-primary-600">{target_role}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600">{current_coverage?.toFixed(0)}%</div>
            <div className="text-sm text-gray-500">Current Coverage</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-500" />
            <span><strong>{total_skills_to_learn}</strong> skills to learn</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>~{phases?.length * 2 || 6} months estimated</span>
          </div>
        </div>
      </div>

      {/* Phases Timeline */}
      <div className="relative">
        {phases?.map((phase, idx) => (
          <div key={idx} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline line */}
            {idx < phases.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Phase number */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary-600">{phase.phase}</span>
            </div>

            {/* Phase content */}
            <div className="flex-1 card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                <span className="badge badge-primary">
                  <Clock className="w-3 h-3 mr-1" />
                  {phase.duration}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{phase.focus}</p>

              {/* Skills to learn */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Skills to Learn
                </h5>
                <div className="flex flex-wrap gap-2">
                  {phase.skills?.map((skill, skillIdx) => (
                    <SkillBadge
                      key={skillIdx}
                      skill={skill.skill}
                      variant={`priority_${skill.priority?.toLowerCase() || 'medium'}`}
                      size="sm"
                    />
                  ))}
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Phase Progress</span>
                  <span className="font-medium text-gray-700">Not Started</span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-300 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion */}
      <div className="card bg-gradient-to-r from-success-50 to-primary-50 border-success-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Goal: {target_role}</h4>
            <p className="text-sm text-gray-600">
              Complete all phases to maximize your chances of transitioning successfully
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CareerRoadmap
