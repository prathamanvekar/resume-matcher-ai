# backend/agents/outcome_agent.py

from services.job_matcher import job_matcher
from ml.model_loader import model_loader
import numpy as np

class OutcomePredictionAgent:
    def __init__(self):
        self.outcome_predictor = model_loader.get_outcome_predictor()
        self.outcome_config = model_loader.get_outcome_config() or {}

    def predict_application_outcome(self, resume_data: dict, job_data: dict,
                                    match_score: dict) -> dict:
        """Predict the outcome of a job application"""

        # Extract features
        skill_count = len(resume_data.get('skills', []))

        # Determine role type
        job_title = job_data.get('title', '').lower()
        role_type = self._determine_role_type(job_title)

        # Determine seniority
        seniority = self._determine_seniority(job_title, job_data.get('experience_level', ''))

        # Check location
        location = job_data.get('location', '').lower()
        is_remote = 'remote' in location
        is_tech_hub = any(city in location for city in
                         ['san francisco', 'new york', 'seattle', 'boston', 'austin'])

        # Get prediction
        prediction = job_matcher.predict_callback(
            skill_count=skill_count,
            role_type=role_type,
            seniority=seniority,
            is_remote=is_remote,
            is_tech_hub=is_tech_hub
        )

        # Add match score influence
        match_boost = match_score.get('overall_score', 50) / 100 * 15
        adjusted_probability = min(95, prediction['probability'] + match_boost)

        # Generate what-if scenarios
        scenarios = self._generate_scenarios(
            skill_count, role_type, seniority, is_remote, is_tech_hub, adjusted_probability
        )

        return {
            'callback_probability': round(adjusted_probability, 1),
            'interpretation': self._interpret_probability(adjusted_probability),
            'factors': {
                'skill_count': skill_count,
                'role_type': role_type,
                'seniority': seniority,
                'is_remote': is_remote,
                'is_tech_hub': is_tech_hub,
                'match_score': match_score.get('overall_score', 0)
            },
            'scenarios': scenarios
        }

    def _determine_role_type(self, title: str) -> str:
        """Determine role type from job title"""
        role_mapping = {
            'data_analyst': ['data analyst', 'business analyst'],
            'data_scientist': ['data scientist', 'research scientist'],
            'software_engineer': ['software', 'developer', 'engineer'],
            'product_manager': ['product manager', 'product owner'],
            'marketing': ['marketing', 'growth'],
            'sales': ['sales', 'account executive'],
        }

        for role, keywords in role_mapping.items():
            if any(kw in title for kw in keywords):
                return role
        return 'other'

    def _determine_seniority(self, title: str, level: str) -> str:
        """Determine seniority level"""
        combined = f"{title} {level}".lower()

        if any(word in combined for word in ['senior', 'sr', 'lead', 'principal']):
            return 'senior'
        elif any(word in combined for word in ['junior', 'jr', 'entry', 'associate']):
            return 'entry'
        elif any(word in combined for word in ['intern']):
            return 'intern'
        else:
            return 'mid'

    def _interpret_probability(self, prob: float) -> str:
        """Interpret probability as human-readable text"""
        if prob >= 80:
            return "Very High - Excellent chance of getting a callback"
        elif prob >= 65:
            return "High - Good chance of getting a callback"
        elif prob >= 50:
            return "Moderate - Reasonable chance, consider improving application"
        elif prob >= 35:
            return "Low - May need to strengthen application"
        else:
            return "Very Low - Consider other opportunities or skill development"

    def _generate_scenarios(self, skill_count, role_type, seniority,
                           is_remote, is_tech_hub, current_prob) -> list:
        """Generate what-if scenarios"""
        scenarios = []

        # Scenario 1: More skills
        if skill_count < 15:
            new_prob = job_matcher.predict_callback(
                skill_count + 5, role_type, seniority, is_remote, is_tech_hub
            )
            scenarios.append({
                'scenario': 'Add 5 more relevant skills',
                'new_probability': new_prob['probability'],
                'change': round(new_prob['probability'] - current_prob, 1)
            })

        # Scenario 2: Target non-tech hub
        if is_tech_hub:
            new_prob = job_matcher.predict_callback(
                skill_count, role_type, seniority, is_remote, False
            )
            scenarios.append({
                'scenario': 'Apply to jobs outside tech hubs',
                'new_probability': new_prob['probability'],
                'change': round(new_prob['probability'] - current_prob, 1)
            })

        return scenarios


# Global instance
outcome_agent = OutcomePredictionAgent()
