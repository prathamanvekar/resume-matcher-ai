# backend/services/job_matcher.py

from ml.embeddings import embedding_service
from ml.faiss_search import faiss_search
from ml.model_loader import model_loader
import numpy as np

class JobMatcher:
    def __init__(self):
        self.outcome_predictor = model_loader.get_outcome_predictor()
        self.outcome_config = model_loader.get_outcome_config() or {}

    def match_resume_to_jobs(self, resume_text: str, resume_skills: list, k: int = 10) -> list:
        """Find matching jobs for a resume"""
        # Create search query from resume
        skills_text = ", ".join(resume_skills[:15])
        query = f"{resume_text[:1000]} Skills: {skills_text}"

        # Search FAISS
        results = faiss_search.search(query, k=k)

        # Enhance with skill matching
        for job in results:
            job_skills = set(s.lower() for s in job.get('skills', []))
            resume_skills_set = set(s.lower() for s in resume_skills)

            # Calculate skill match
            if job_skills:
                matched_skills = job_skills.intersection(resume_skills_set)
                missing_skills = job_skills - resume_skills_set

                job['skill_match_score'] = len(matched_skills) / len(job_skills) * 100
                job['matched_skills'] = list(matched_skills)
                job['missing_skills'] = list(missing_skills)[:10]
            else:
                job['skill_match_score'] = 0
                job['matched_skills'] = []
                job['missing_skills'] = []

            # Calculate combined score
            job['combined_score'] = (
                job.get('similarity_score', 0) * 50 +
                job.get('skill_match_score', 0) * 0.5
            )

        # Sort by combined score
        results.sort(key=lambda x: x.get('combined_score', 0), reverse=True)

        return results

    def calculate_match_score(self, resume_skills: list, job_skills: list,
                               resume_text: str = "", job_description: str = "") -> dict:
        """Calculate detailed match score between resume and job"""
        resume_skills_set = set(s.lower() for s in resume_skills)
        job_skills_set = set(s.lower() for s in job_skills)

        # Skill matching
        matched_skills = resume_skills_set.intersection(job_skills_set)
        missing_skills = job_skills_set - resume_skills_set
        extra_skills = resume_skills_set - job_skills_set

        skill_match_pct = len(matched_skills) / len(job_skills_set) * 100 if job_skills_set else 0

        # Semantic similarity (if texts provided)
        semantic_score = 0
        if resume_text and job_description:
            resume_emb = embedding_service.encode(resume_text[:1500])
            job_emb = embedding_service.encode(job_description[:1500])
            semantic_score = float(np.dot(resume_emb[0], job_emb[0])) * 100

        # Combined score
        combined_score = skill_match_pct * 0.6 + semantic_score * 0.4

        return {
            'overall_score': round(combined_score, 1),
            'skill_match_score': round(skill_match_pct, 1),
            'semantic_score': round(semantic_score, 1),
            'matched_skills': list(matched_skills),
            'missing_skills': list(missing_skills)[:10],
            'extra_skills': list(extra_skills)[:10],
            'total_required': len(job_skills_set),
            'total_matched': len(matched_skills)
        }

    def predict_callback(self, skill_count: int, role_type: str,
                          seniority: str, is_remote: bool, is_tech_hub: bool) -> dict:
        """Predict interview callback probability"""
        if self.outcome_predictor is None:
            return {'probability': 0.5, 'error': 'Model not loaded'}

        # Encode role
        role_classes = self.outcome_config.get('role_encoder_classes', [])
        role_encoded = role_classes.index(role_type) if role_type in role_classes else 0

        # Encode seniority
        seniority_map = self.outcome_config.get('seniority_map', {
            'intern': 0, 'entry': 1, 'mid': 2, 'senior': 3, 'executive': 4
        })
        seniority_num = seniority_map.get(seniority, 2)

        # Prepare features
        features = [[
            skill_count,
            role_encoded,
            seniority_num,
            int(is_remote),
            int(is_tech_hub)
        ]]

        # Predict
        probability = self.outcome_predictor.predict_proba(features)[0][1]

        return {
            'probability': round(float(probability) * 100, 1),
            'interpretation': self._interpret_probability(probability)
        }

    def _interpret_probability(self, prob: float) -> str:
        if prob >= 0.8:
            return "Excellent chance of callback"
        elif prob >= 0.6:
            return "Good chance of callback"
        elif prob >= 0.4:
            return "Moderate chance of callback"
        else:
            return "Consider improving your application"


# Global instance
job_matcher = JobMatcher()
