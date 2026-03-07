// frontend/src/components/JobCard.jsx

import { Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import SkillBadge from "./SkillBadge";

function JobCard({ job, showMatchScore = true, onSelect }) {
  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const format = (num) => {
      if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
      return `$${num}`;
    };
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    if (max) return `Up to ${format(max)}`;
  };

  const salary = formatSalary(
    job.salary_min || job.min_salary,
    job.salary_max || job.max_salary,
  );

  const getScoreColor = (score) => {
    if (score >= 80) return "text-success-600 bg-success-50";
    if (score >= 60) return "text-primary-600 bg-primary-50";
    if (score >= 40) return "text-warning-600 bg-warning-50";
    return "text-danger-600 bg-danger-50";
  };

  const matchScore = job.combined_score || job.similarity_score * 100 || 0;

  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between gap-4">
        {/* Job info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
            {job.title}
          </h3>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            {job.company_name || job.company ? (
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {job.company_name || job.company}
              </span>
            ) : null}

            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            {salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {salary}
              </span>
            )}

            {job.work_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {job.work_type}
              </span>
            )}
          </div>
        </div>

        {/* Match score */}
        {showMatchScore && (
          <div className={`px-3 py-2 rounded-lg ${getScoreColor(matchScore)}`}>
            <div className="text-2xl font-bold">{Math.round(matchScore)}</div>
            <div className="text-xs">Match</div>
          </div>
        )}
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.slice(0, 5).map((skill, idx) => (
            <SkillBadge
              key={idx}
              skill={skill}
              variant={
                job.matched_skills?.includes(skill) ? "matched" : "default"
              }
              size="sm"
            />
          ))}
          {job.skills.length > 5 && (
            <span className="text-xs text-gray-500 self-center">
              +{job.skills.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Action button */}
      <div className="mt-4 flex items-center justify-between">
        {job.missing_skills && job.missing_skills.length > 0 && (
          <div className="text-xs text-gray-500">
            <span className="text-danger-600 font-medium">
              {job.missing_skills.length}
            </span>{" "}
            skills to learn
          </div>
        )}

        <button
          onClick={() => onSelect?.(job)}
          className="ml-auto flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default JobCard;
