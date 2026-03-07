// frontend/src/pages/Jobs.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jobsAPI, resumeAPI } from "../api/axios";
import { Search, Plus, FileText, Briefcase, X, Loader2 } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import JobCard from "../components/JobCard";
import toast from "react-hot-toast";

function Jobs() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddJob, setShowAddJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    required_skills: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const response = await resumeAPI.list();
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResume(response.data[0]);
      }
    } catch (error) {
      console.error("Error loading resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setSearching(true);
    try {
      const response = await jobsAPI.search(searchQuery, 20);
      setJobs(response.data.jobs || []);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleMatchJobs = async () => {
    if (!selectedResume) {
      toast.error("Please select a resume first");
      return;
    }

    navigate(`/jobs/match/${selectedResume.id}`);
  };

  const handleAddJob = async (e) => {
    e.preventDefault();

    try {
      const jobData = {
        ...newJob,
        required_skills: newJob.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await jobsAPI.add(jobData);
      toast.success("Job added successfully!");
      setShowAddJob(false);
      setNewJob({
        title: "",
        company: "",
        description: "",
        location: "",
        required_skills: "",
      });
    } catch {
      toast.error("Failed to add job");
    }
  };

  const handleJobSelect = (job) => {
    if (selectedResume) {
      const routeJobId =
        job?.id ??
        job?.job_id ??
        (Number.isNaN(Number(job?.job_id)) ? 0 : Number(job?.job_id));

      // Navigate to job apply page
      navigate(`/jobs/${routeJobId}/apply`, {
        state: { job, resumeId: selectedResume.id },
      });
    } else {
      toast.error("Please select a resume first");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Matching</h1>
          <p className="text-gray-600 mt-1">Find jobs that match your skills</p>
        </div>
        <button
          onClick={() => setShowAddJob(!showAddJob)}
          className="btn-outline flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Job Manually
        </button>
      </div>

      {/* Resume Selector */}
      {resumes.length > 0 ? (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Select Resume for Matching
          </h2>
          <div className="flex flex-wrap gap-3">
            {resumes.map((resume) => (
              <button
                key={resume.id}
                onClick={() => setSelectedResume(resume)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  selectedResume?.id === resume.id
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">{resume.filename}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    resume.ats_score >= 70
                      ? "bg-success-100 text-success-700"
                      : "bg-warning-100 text-warning-700"
                  }`}
                >
                  {resume.ats_score?.toFixed(0)}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleMatchJobs}
            disabled={!selectedResume}
            className="btn-primary mt-4 flex items-center gap-2"
          >
            <Briefcase className="w-5 h-5" />
            Find Matching Jobs
          </button>
        </div>
      ) : (
        <div className="card text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            Upload a resume to start matching jobs
          </p>
          <button onClick={() => navigate("/resumes")} className="btn-primary">
            Upload Resume
          </button>
        </div>
      )}

      {/* Add Job Form */}
      {showAddJob && (
        <div className="card animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Add Job Posting
            </h2>
            <button
              onClick={() => setShowAddJob(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleAddJob} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) =>
                    setNewJob({ ...newJob, title: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={newJob.company}
                  onChange={(e) =>
                    setNewJob({ ...newJob, company: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Google"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={newJob.location}
                onChange={(e) =>
                  setNewJob({ ...newJob, location: e.target.value })
                }
                className="input"
                placeholder="e.g., San Francisco, CA or Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                value={newJob.description}
                onChange={(e) =>
                  setNewJob({ ...newJob, description: e.target.value })
                }
                className="input min-h-30"
                placeholder="Paste the job description here..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Skills (comma-separated)
              </label>
              <input
                type="text"
                value={newJob.required_skills}
                onChange={(e) =>
                  setNewJob({ ...newJob, required_skills: e.target.value })
                }
                className="input"
                placeholder="e.g., Python, Machine Learning, SQL"
              />
            </div>

            <button type="submit" className="btn-primary">
              Add Job
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Search Jobs
        </h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="input pl-10"
              placeholder="Search for jobs... (e.g., Python developer with ML experience)"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="btn-primary flex items-center gap-2"
          >
            {searching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Search Results */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Search Results ({jobs.length} jobs)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map((job, idx) => (
              <JobCard
                key={idx}
                job={job}
                resumeId={selectedResume?.id}
                onSelect={handleJobSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
