// frontend/src/pages/ResumeDetail.jsx

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { resumeAPI } from "../api/axios";
import {
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Download,
  Code,
  Award,
  Calendar,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import ATSReportCard from "../components/ATSReportCard";
import SkillBadge from "../components/SkillBadge";

function ResumeDetail() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [atsReport, setATSReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadResumeData = async () => {
      try {
        const [resumeRes, atsRes] = await Promise.all([
          resumeAPI.get(id),
          resumeAPI.getATSReport(id),
        ]);
        setResume(resumeRes.data);
        setATSReport(atsRes.data);
      } catch (error) {
        console.error("Error loading resume:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResumeData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900">
          Resume not found
        </h2>
        <Link
          to="/resumes"
          className="text-primary-600 hover:underline mt-2 inline-block"
        >
          Back to resumes
        </Link>
      </div>
    );
  }

  const parsedData = resume.parsed_data || {};

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "ats", label: "ATS Report" },
    { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/resumes" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {resume.filename}
          </h1>
          <p className="text-gray-600 mt-1">
            Uploaded on {new Date(resume.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link
          to={`/resume/${id}/optimize`}
          className="btn-primary flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Optimize Resume
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {activeTab === "overview" && (
          <>
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {parsedData.name && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">
                          {parsedData.name}
                        </p>
                      </div>
                    </div>
                  )}
                  {parsedData.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">
                          {parsedData.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {parsedData.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">
                          {parsedData.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {parsedData.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">
                          {parsedData.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {parsedData.summary && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Professional Summary
                    </h3>
                    <p className="text-gray-600">{parsedData.summary}</p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="card text-center">
                  <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {parsedData.experience_years || 0}
                  </div>
                  <div className="text-sm text-gray-500">Years Experience</div>
                </div>
                <div className="card text-center">
                  <Code className="w-8 h-8 text-success-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {resume.extracted_skills?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Skills</div>
                </div>
                <div className="card text-center">
                  <GraduationCap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {parsedData.education?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Degrees</div>
                </div>
              </div>
            </div>

            {/* ATS Score Preview */}
            <div>
              <ATSReportCard report={atsReport} showDetails={false} />
              <Link
                to={`/jobs/match/${id}`}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                <Briefcase className="w-5 h-5" />
                Find Matching Jobs
              </Link>
            </div>
          </>
        )}

        {activeTab === "ats" && (
          <div className="lg:col-span-3">
            <ATSReportCard report={atsReport} showDetails={true} />
          </div>
        )}

        {activeTab === "skills" && (
          <div className="lg:col-span-3 card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Extracted Skills
            </h2>
            {resume.extracted_skills && resume.extracted_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resume.extracted_skills.map((skill, idx) => (
                  <SkillBadge key={idx} skill={skill} size="md" />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills extracted</p>
            )}
          </div>
        )}

        {activeTab === "experience" && (
          <div className="lg:col-span-3 space-y-6">
            {/* Work Experience */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Work Experience
              </h2>
              {parsedData.work_experience &&
              parsedData.work_experience.length > 0 ? (
                <div className="space-y-6">
                  {parsedData.work_experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="relative pl-6 pb-6 last:pb-0 border-l-2 border-gray-200 last:border-transparent"
                    >
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full" />
                      <h3 className="font-semibold text-gray-900">
                        {exp.title}
                      </h3>
                      <p className="text-primary-600">{exp.company}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {exp.duration}
                      </p>
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {exp.highlights.map((highlight, hIdx) => (
                            <li
                              key={hIdx}
                              className="text-sm text-gray-600 flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 shrink-0" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No work experience found</p>
              )}
            </div>

            {/* Education */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Education
              </h2>
              {parsedData.education && parsedData.education.length > 0 ? (
                <div className="space-y-4">
                  {parsedData.education.map((edu, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {edu.degree}
                        </h3>
                        <p className="text-gray-600">{edu.field}</p>
                        {edu.institution && (
                          <p className="text-sm text-gray-500">
                            {edu.institution}
                          </p>
                        )}
                        {edu.year && (
                          <p className="text-sm text-gray-400">{edu.year}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No education found</p>
              )}
            </div>

            {/* Certifications */}
            {parsedData.certifications &&
              parsedData.certifications.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Certifications
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="badge badge-primary flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeDetail;
