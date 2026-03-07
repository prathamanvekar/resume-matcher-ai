// frontend/src/components/ScoreGauge.jsx

function ScoreGauge({ score, size = 'md', label = 'Score', showLabel = true }) {
  const sizeConfig = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, strokeWidth: 10, fontSize: 'text-3xl' },
    xl: { width: 200, strokeWidth: 12, fontSize: 'text-4xl' },
  }

  const config = sizeConfig[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = ((100 - score) / 100) * circumference

  const getColor = (score) => {
    if (score >= 80) return { stroke: '#22c55e', bg: '#f0fdf4', text: 'text-success-600' }
    if (score >= 60) return { stroke: '#3b82f6', bg: '#eff6ff', text: 'text-primary-600' }
    if (score >= 40) return { stroke: '#f59e0b', bg: '#fffbeb', text: 'text-warning-600' }
    return { stroke: '#ef4444', bg: '#fef2f2', text: 'text-danger-600' }
  }

  const colors = getColor(score)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
        >
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
          />
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${config.fontSize} font-bold ${colors.text}`}>
            {Math.round(score)}
          </span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>

      {showLabel && (
        <span className="mt-2 text-sm font-medium text-gray-600">{label}</span>
      )}
    </div>
  )
}

export default ScoreGauge
