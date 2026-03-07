# backend/agents/strategy_agent.py

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from config import settings
from services.job_matcher import job_matcher

class StrategyAgent:
    def __init__(self):
        if settings.GROQ_API_KEY:
            self.llm = ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.LLM_MODEL,
                temperature=0.2
            )
        else:
            self.llm = None

    def decide_application(self, resume_data: dict, job_data: dict,
                           match_score: dict, user_preferences: dict = None) -> dict:
        """Decide whether to apply for a job"""

        # Calculate base decision factors
        skill_match = match_score.get('skill_match_score', 0)
        overall_match = match_score.get('overall_score', 0)

        # Check salary fit
        salary_fit = True
        if user_preferences:
            user_min = user_preferences.get('salary_min', 0)
            job_max = job_data.get('salary_max', float('inf'))
            if job_max and user_min and job_max < user_min:
                salary_fit = False

        # Check location fit
        location_fit = True
        if user_preferences and user_preferences.get('preferred_locations'):
            job_location = job_data.get('location', '').lower()
            preferred = [loc.lower() for loc in user_preferences['preferred_locations']]
            location_fit = any(loc in job_location for loc in preferred) or 'remote' in job_location

        # Decision logic
        decision = "SKIP"
        confidence = 0
        reasons = []

        if overall_match >= 70 and skill_match >= 60:
            decision = "APPLY"
            confidence = min(95, overall_match)
            reasons.append(f"Strong overall match ({overall_match:.0f}%)")
            reasons.append(f"Good skill alignment ({skill_match:.0f}%)")
        elif overall_match >= 50 and skill_match >= 40:
            if salary_fit and location_fit:
                decision = "APPLY"
                confidence = min(75, overall_match)
                reasons.append(f"Decent match ({overall_match:.0f}%)")
                reasons.append("Meets salary and location preferences")
            else:
                decision = "SAVE"
                confidence = 60
                reasons.append(f"Moderate match ({overall_match:.0f}%)")
                if not salary_fit:
                    reasons.append("Salary may not meet expectations")
                if not location_fit:
                    reasons.append("Location may not be ideal")
        else:
            decision = "SKIP"
            confidence = 80
            reasons.append(f"Low match score ({overall_match:.0f}%)")
            if match_score.get('missing_skills'):
                reasons.append(f"Missing key skills: {', '.join(match_score['missing_skills'][:3])}")

        # Get LLM reasoning if available
        llm_reasoning = None
        if self.llm and decision != "SKIP":
            llm_reasoning = self._get_llm_reasoning(resume_data, job_data, match_score, decision)

        return {
            'decision': decision,
            'confidence': confidence,
            'reasons': reasons,
            'llm_reasoning': llm_reasoning,
            'factors': {
                'skill_match': skill_match,
                'overall_match': overall_match,
                'salary_fit': salary_fit,
                'location_fit': location_fit
            }
        }

    def _get_llm_reasoning(self, resume_data: dict, job_data: dict,
                           match_score: dict, preliminary_decision: str) -> str:
        """Get detailed reasoning from LLM"""
        prompt = PromptTemplate(
            input_variables=["job_title", "company", "match_score", "matched_skills", "missing_skills", "decision"],
            template="""As a career advisor, explain why this application decision makes sense:

Job: {job_title} at {company}
Match Score: {match_score}%
Skills Match: {matched_skills}
Missing Skills: {missing_skills}
Preliminary Decision: {decision}

Provide a brief (2-3 sentences) explanation for this decision. Be specific and actionable."""
        )

        try:
            chain = prompt | self.llm
            response = chain.invoke({
                "job_title": job_data.get('title', 'Unknown'),
                "company": job_data.get('company', 'Unknown'),
                "match_score": match_score.get('overall_score', 0),
                "matched_skills": ', '.join(match_score.get('matched_skills', [])[:5]),
                "missing_skills": ', '.join(match_score.get('missing_skills', [])[:5]),
                "decision": preliminary_decision
            })
            return response.content
        except Exception as e:
            return f"Could not generate detailed reasoning: {str(e)}"


# Global instance
strategy_agent = StrategyAgent()
