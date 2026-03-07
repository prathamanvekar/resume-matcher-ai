// frontend/src/pages/JobMatch.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { jobsAPI, resumeAPI } from "../api/axios";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import JobCard from "../components/JobCard";

function JobMatch() {
  const { resumeId } = useParams();
  const [resume, setResume] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMatchingJobs = async () => {
      try {
        const [resumeRes, jobsRes] = await Promise.all([
          resumeAPI.get(resumeId),
          jobsAPI.match(resumeId, 20),
        ]);
        setResume(resumeRes.data);
        setJobs(jobsRes.data.matches || []);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMatchingJobs();
  }, [resumeId]);

  const handleJobSelect = (job) => {
    const routeJobId =
      job?.id ??
      job?.job_id ??
      (Number.isNaN(Number(job?.job_id)) ? 0 : Number(job?.job_id));

    navigate(`/jobs/${routeJobId}/apply`, {
      state: { job, resumeId },
    });
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
        <Link to="/jobs" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Matching Jobs</h1>
          <p className="text-gray-600 mt-1">
            Jobs matching{" "}
            <span className="font-medium">{resume?.filename}</span>
          </p>
        </div>
      </div>

      {/* Results */}
      {jobs.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No matching jobs found
          </h2>
          <p className="text-gray-600">Try searching for jobs manually</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((job, idx) => (
            <JobCard
              key={idx}
              job={job}
              resumeId={resumeId}
              onSelect={handleJobSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default JobMatch;
