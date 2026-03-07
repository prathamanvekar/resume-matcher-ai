// frontend/src/pages/JobApply.jsx

import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { jobsAPI } from "../api/axios";
import {
  ArrowLeft,
  Send,
  FileText,
  Loader2,
  Building2,
  MapPin,
  Copy,
  Check,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import MatchBreakdown from "../components/MatchBreakdown";
import AgentReasoningPanel from "../components/AgentReasoningPanel";
import toast from "react-hot-toast";

function JobApply() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [job] = useState(location.state?.job || null);
  const [resumeId] = useState(location.state?.resumeId);
  const [loading, setLoading] = useState(true);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [applying, setApplying] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [decision, setDecision] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const effectiveJobId = useMemo(
    () =>
      job?.id ??
      job?.job_id ??
      (jobId && !Number.isNaN(Number(jobId)) ? Number(jobId) : null),
    [job?.id, job?.job_id, jobId],
  );

  const effectiveJobPayload = useMemo(
    () =>
      job
        ? {
            id: job.id,
            job_id: job.job_id,
            title: job.title,
            company: job.company,
            company_name: job.company_name,
            description: job.description,
            location: job.location,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            min_salary: job.min_salary,
            max_salary: job.max_salary,
            work_type: job.work_type,
            experience_level: job.experience_level,
            required_skills: job.required_skills,
            skills: job.skills,
          }
        : null,
    [job],
  );

  useEffect(() => {
    const analyzeJob = async () => {
      if (!resumeId || !effectiveJobId) {
        console.log("Missing resume or job id for deep analysis");
        return;
      }

      try {
        const [analysisRes, decisionRes] = await Promise.all([
          jobsAPI.analyze(effectiveJobId, resumeId, effectiveJobPayload),
          jobsAPI.decide(effectiveJobId, resumeId, effectiveJobPayload),
        ]);

        setAnalysis(analysisRes.data);
        setDecision(decisionRes.data);
      } catch {
        console.log("Analysis not available for this job");
      } finally {
        setLoading(false);
      }
    };

    if (job) {
      analyzeJob();
    } else {
      setLoading(false);
    }
  }, [effectiveJobId, effectiveJobPayload, job, resumeId]);

  const handleGenerateCoverLetter = async () => {
    if (!resumeId || !effectiveJobId) {
      toast.error("Job details unavailable for cover letter");
      return;
    }

    setGeneratingCover(true);
    try {
      const response = await jobsAPI.generateCoverLetter(
        effectiveJobId,
        resumeId,
        effectiveJobPayload,
      );
      setCoverLetter(response.data.cover_letter);
      toast.success("Cover letter generated!");
    } catch {
      toast.error("Failed to generate cover letter");
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    if (!resumeId || !effectiveJobId) {
      toast.error("Job details unavailable");
      return;
    }

    setApplying(true);
    try {
      await jobsAPI.apply(effectiveJobId, resumeId, effectiveJobPayload);
      toast.success("Application recorded!");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to record application");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <Link
          to="/jobs"
          className="text-primary-600 hover:underline mt-2 inline-block"
        >
          Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-gray-600">
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
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Analysis */}
          {analysis?.match && (
            <MatchBreakdown
              match={analysis.match}
              explanation={analysis.explanation}
            />
          )}

          {/* Job Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Job Description
            </h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              {job.description
                ?.split("\n")
                .map((para, idx) => <p key={idx}>{para}</p>) ||
                "No description available"}
            </div>
          </div>

          {/* Cover Letter */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Cover Letter
              </h2>
              {coverLetter && (
                <button
                  onClick={handleCopy}
                  className="btn-secondary text-sm py-1.5 flex items-center gap-1"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {coverLetter ? (
              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm text-gray-700">
                {coverLetter}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  Generate a tailored cover letter
                </p>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={generatingCover}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  {generatingCover ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  Generate Cover Letter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Decision */}
          {decision && (
            <AgentReasoningPanel
              decision={decision.decision}
              outcome={decision.outcome_prediction}
              title="AI Recommendation"
            />
          )}

          {/* Apply Button */}
          <div className="card">
            <button
              onClick={handleApply}
              disabled={applying}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {applying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Mark as Applied
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              This will track your application in the dashboard
            </p>
          </div>

          {/* Match Score */}
          {job.combined_score && (
            <div className="card text-center">
              <div
                className={`text-4xl font-bold ${
                  job.combined_score >= 70
                    ? "text-success-600"
                    : job.combined_score >= 50
                      ? "text-warning-600"
                      : "text-gray-600"
                }`}
              >
                {job.combined_score.toFixed(0)}%
              </div>
              <p className="text-sm text-gray-500 mt-1">Match Score</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobApply;
