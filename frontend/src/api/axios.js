// frontend/src/api/axios.js

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);
    return api.post("/api/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  getMe: () => api.get("/api/auth/me"),
  updatePreferences: (data) => api.put("/api/auth/preferences", data),
};

// Resume API
export const resumeAPI = {
  upload: (file, targetRole) => {
    const formData = new FormData();
    formData.append("file", file);
    if (targetRole) formData.append("target_role", targetRole);
    return api.post("/api/resume/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: () => api.get("/api/resume/"),
  get: (id) => api.get(`/api/resume/${id}`),
  getATSReport: (id) => api.get(`/api/resume/${id}/ats-report`),
  optimize: (id, targetRole) =>
    api.post(`/api/resume/${id}/optimize`, null, {
      params: { target_role: targetRole },
    }),
  getVersions: (id) => api.get(`/api/resume/${id}/versions`),
  applyVersion: (id, versionId) =>
    api.post(`/api/resume/${id}/versions/apply`, null, {
      params: { version_id: versionId },
    }),
  restoreOriginal: (id) => api.post(`/api/resume/${id}/versions/apply`),
  delete: (id) => api.delete(`/api/resume/${id}`),
};

// Jobs API
export const jobsAPI = {
  add: (data) => api.post("/api/jobs/add", data),
  search: (query, k = 10) =>
    api.get("/api/jobs/search", { params: { query, k } }),
  match: (resumeId, k = 10) =>
    api.post(`/api/jobs/match/${resumeId}`, null, { params: { k } }),
  get: (id) => api.get(`/api/jobs/${id}`),
  analyze: (jobId, resumeId, job) =>
    api.post(`/api/jobs/${jobId}/analyze`, {
      resume_id: resumeId,
      ...(job ? { job } : {}),
    }),
  decide: (jobId, resumeId, job) =>
    api.post(`/api/jobs/${jobId}/decide`, {
      resume_id: resumeId,
      ...(job ? { job } : {}),
    }),
  generateCoverLetter: (jobId, resumeId, job) =>
    api.post(`/api/jobs/${jobId}/cover-letter`, {
      resume_id: resumeId,
      ...(job ? { job } : {}),
    }),
  apply: (jobId, resumeId, job) =>
    api.post(`/api/jobs/${jobId}/apply`, {
      resume_id: resumeId,
      ...(job ? { job } : {}),
    }),
};

// Career API
export const careerAPI = {
  skillGap: (data, resumeId) =>
    api.post("/api/career/skill-gap", data, {
      params: resumeId ? { resume_id: resumeId } : {},
    }),
  transitionPlan: (data, resumeId) =>
    api.post("/api/career/transition-plan", data, {
      params: resumeId ? { resume_id: resumeId } : {},
    }),
  transitionPaths: (currentRole) =>
    api.get(`/api/career/transition-paths/${currentRole}`),
  roadmap: (targetRole, resumeId) =>
    api.post("/api/career/roadmap", null, {
      params: { target_role: targetRole, resume_id: resumeId },
    }),
  intermediateRoles: (currentRole, targetRole) =>
    api.get("/api/career/intermediate-roles", {
      params: { current_role: currentRole, target_role: targetRole },
    }),
};

// Dashboard API
export const dashboardAPI = {
  stats: () => api.get("/api/dashboard/stats"),
  applications: (limit = 50, status) =>
    api.get("/api/dashboard/applications", {
      params: { limit, status },
    }),
  submitFeedback: (applicationId, data) =>
    api.post(`/api/dashboard/feedback/${applicationId}`, null, {
      params: data,
    }),
  insights: () => api.get("/api/dashboard/insights"),
};

export default api;
