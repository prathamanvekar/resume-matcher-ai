// frontend/src/pages/ResumeOptimize.jsx

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { resumeAPI } from "../api/axios";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle,
  TrendingUp,
  FileText,
  History,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import ScoreGauge from "../components/ScoreGauge";
import toast from "react-hot-toast";

function ResumeOptimize() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [optimizationResult, setOptimizationResult] = useState(null);

  useEffect(() => {
    const loadResumeData = async () => {
      try {
        const [resumeRes, versionsRes] = await Promise.all([
          resumeAPI.get(id),
          resumeAPI.getVersions(id),
        ]);
        setResume(resumeRes.data);
        setVersions(versionsRes.data);
        setTargetRole(resumeRes.data.target_role || "");
      } catch (error) {
        console.error("Error loading resume:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResumeData();
  }, [id]);

  const handleOptimize = async () => {
    if (!targetRole.trim()) {
      toast.error("Please enter a target role");
      return;
    }

    setOptimizing(true);
    setOptimizationResult(null);

    try {
      const response = await resumeAPI.optimize(id, targetRole);
      setOptimizationResult(response.data);
      toast.success("Resume optimized successfully!");

      if (response.data?.version_id) {
        await resumeAPI.applyVersion(id, response.data.version_id);
        toast.success("Optimized version applied");
      }

      const [resumeRes, versionsRes] = await Promise.all([
        resumeAPI.get(id),
        resumeAPI.getVersions(id),
      ]);
      setResume(resumeRes.data);
      setVersions(versionsRes.data);
    } catch (error) {
      toast.error("Optimization failed. Please try again.");
      console.error("Optimization error:", error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleUseVersion = async (versionId) => {
    try {
      await resumeAPI.applyVersion(id, versionId);
      const [resumeRes, versionsRes] = await Promise.all([
        resumeAPI.get(id),
        resumeAPI.getVersions(id),
      ]);
      setResume(resumeRes.data);
      setVersions(versionsRes.data);
      toast.success("Version activated");
    } catch (error) {
      console.error("Error applying version:", error);
      toast.error("Could not activate selected version");
    }
  };

  const handleRestoreOriginal = async () => {
    try {
      await resumeAPI.restoreOriginal(id);
      const [resumeRes, versionsRes] = await Promise.all([
        resumeAPI.get(id),
        resumeAPI.getVersions(id),
      ]);
      setResume(resumeRes.data);
      setVersions(versionsRes.data);
      toast.success("Original version restored");
    } catch (error) {
      console.error("Error restoring original:", error);
      toast.error("Could not restore original version");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/resume/${id}`} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Optimize Resume</h1>
          <p className="text-gray-600 mt-1">{resume?.filename}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Optimization Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              AI Resume Optimization
            </h2>
            <p className="text-gray-600 mb-6">
              Our AI will analyze your resume and optimize it for better ATS
              compatibility and relevance to your target role.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="input"
                placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
              />
              <p className="text-sm text-gray-500 mt-1">
                The AI will optimize your resume for this specific role
              </p>
            </div>

            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Optimizing... This may take a minute
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Optimize Resume
                </>
              )}
            </button>
          </div>

          {/* Optimization Result */}
          {optimizationResult && (
            <div className="card animate-fadeIn">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-success-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Optimization Complete!
                </h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">
                    Original Score
                  </div>
                  <div className="text-2xl font-bold text-gray-600">
                    {optimizationResult.original_score?.toFixed(0)}
                  </div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-sm text-primary-600 mb-1">New Score</div>
                  <div className="text-2xl font-bold text-primary-700">
                    {optimizationResult.final_score?.toFixed(0)}
                  </div>
                </div>
                <div className="text-center p-4 bg-success-50 rounded-lg">
                  <div className="text-sm text-success-600 mb-1 flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Improvement
                  </div>
                  <div className="text-2xl font-bold text-success-700">
                    +{optimizationResult.improvement?.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Changes Made */}
              {optimizationResult.changes &&
                optimizationResult.changes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Changes Made
                    </h3>
                    <ul className="space-y-2">
                      {optimizationResult.changes.map((change, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="w-4 h-4 text-success-500 shrink-0 mt-0.5" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Score */}
          <div className="card text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Current ATS Score
            </h3>
            <ScoreGauge
              score={resume?.ats_score || 0}
              size="lg"
              showLabel={false}
            />
          </div>

          {/* Version History */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Version History</h3>
            </div>

            <div className="space-y-3">
              {/* Original */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Original
                    </span>
                    {versions.original?.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success-50 text-success-600">
                        Active
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      versions.original?.ats_score >= 70
                        ? "text-success-600"
                        : "text-warning-600"
                    }`}
                  >
                    {versions.original?.ats_score?.toFixed(0) ||
                      resume?.ats_score?.toFixed(0)}
                  </span>
                </div>
                {!versions.original?.is_active && (
                  <button
                    onClick={handleRestoreOriginal}
                    className="mt-2 text-xs btn-secondary py-1 px-2"
                  >
                    Use Original
                  </button>
                )}
              </div>

              {/* Versions */}
              {versions.versions?.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg ${
                    version.is_active ? "bg-success-50" : "bg-primary-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles
                          className={`w-4 h-4 ${
                            version.is_active
                              ? "text-success-600"
                              : "text-primary-600"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            version.is_active
                              ? "text-success-700"
                              : "text-primary-700"
                          }`}
                        >
                          {version.version_name ||
                            `Version ${version.version_number}`}
                        </span>
                        {version.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success-100 text-success-700">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-success-600">
                        {version.ats_score?.toFixed(0)}
                      </span>
                      {!version.is_active && (
                        <div>
                          <button
                            onClick={() => handleUseVersion(version.id)}
                            className="mt-2 text-xs btn-outline py-1 px-2"
                          >
                            Use Version
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!versions.versions || versions.versions.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-2">
                  No optimized versions yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeOptimize;
