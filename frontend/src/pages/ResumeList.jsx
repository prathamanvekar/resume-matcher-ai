// frontend/src/pages/ResumeList.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resumeAPI } from "../api/axios";
import {
  FileText,
  Upload,
  Eye,
  Sparkles,
  Briefcase,
  Star,
  Clock,
  Trash2,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import ResumeUpload from "../components/ResumeUpload";
import ScoreGauge from "../components/ScoreGauge";
import toast from "react-hot-toast";

function ResumeList() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const response = await resumeAPI.list();
      setResumes(response.data);
    } catch (error) {
      console.error("Error loading resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (data) => {
    setShowUpload(false);
    navigate(`/resume/${data.id}`);
  };

  const handleDeleteResume = async (resume) => {
    const confirmed = window.confirm(
      `Delete "${resume.filename}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await resumeAPI.delete(resume.id);
      setResumes((prev) => prev.filter((item) => item.id !== resume.id));
      toast.success("Resume deleted");
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast.error("Failed to delete resume");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Resumes</h1>
          <p className="text-gray-600 mt-1">Manage and optimize your resumes</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Resume
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="card animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload New Resume
          </h2>
          <ResumeUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No resumes yet
          </h2>
          <p className="text-gray-600 mb-6">
            Upload your first resume to get started
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div key={resume.id} className="card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate max-w-45">
                      {resume.filename}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {new Date(resume.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {resume.is_primary === 1 && (
                  <span className="badge badge-primary flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Primary
                  </span>
                )}
              </div>

              {/* ATS Score */}
              <div className="flex items-center justify-center my-6">
                <ScoreGauge
                  score={resume.ats_score || 0}
                  size="md"
                  label="ATS Score"
                />
              </div>

              {/* Category */}
              {resume.predicted_category && (
                <div className="text-center mb-4">
                  <span className="badge badge-gray">
                    {resume.predicted_category}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Link
                  to={`/resume/${resume.id}`}
                  className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Link>
                <Link
                  to={`/resume/${resume.id}/optimize`}
                  className="flex-1 btn-outline text-sm py-2 flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  Optimize
                </Link>
                <Link
                  to={`/jobs/match/${resume.id}`}
                  className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1"
                >
                  <Briefcase className="w-4 h-4" />
                  Jobs
                </Link>
                <button
                  onClick={() => handleDeleteResume(resume)}
                  className="btn-danger text-sm py-2 px-3 flex items-center justify-center gap-1"
                  title="Delete resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResumeList;
