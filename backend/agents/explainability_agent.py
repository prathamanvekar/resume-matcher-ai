# backend/agents/explainability_agent.py

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from config import settings

class ExplainabilityAgent:
    def __init__(self):
        if settings.GROQ_API_KEY:
            self.llm = ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.LLM_MODEL,
                temperature=0.3
            )
        else:
            self.llm = None

    def explain_match_score(self, match_data: dict, job_data: dict) -> dict:
        """Generate human-readable explanation for match score"""

        explanation = {
            'summary': '',
            'strengths': [],
            'weaknesses': [],
            'recommendations': []
        }

        # Analyze strengths
        if match_data.get('skill_match_score', 0) >= 70:
            explanation['strengths'].append(
                f"Strong skill alignment ({match_data['skill_match_score']:.0f}% match)"
            )
        if match_data.get('matched_skills'):
            explanation['strengths'].append(
                f"Key matching skills: {', '.join(match_data['matched_skills'][:5])}"
            )

        # Analyze weaknesses
        if match_data.get('missing_skills'):
            explanation['weaknesses'].append(
                f"Missing skills: {', '.join(match_data['missing_skills'][:5])}"
            )
        if match_data.get('skill_match_score', 0) < 50:
            explanation['weaknesses'].append(
                "Significant skill gap with job requirements"
            )

        # Generate recommendations
        missing = match_data.get('missing_skills', [])
        if missing:
            explanation['recommendations'].append(
                f"Consider learning: {', '.join(missing[:3])}"
            )

        # Generate summary
        score = match_data.get('overall_score', 0)
        if score >= 80:
            explanation['summary'] = "Excellent match! You're a strong candidate for this position."
        elif score >= 60:
            explanation['summary'] = "Good match with some areas for improvement."
        elif score >= 40:
            explanation['summary'] = "Moderate match. Consider addressing skill gaps before applying."
        else:
            explanation['summary'] = "Low match. This role may require significant skill development."

        # Get LLM detailed explanation
        if self.llm:
            explanation['detailed_analysis'] = self._get_detailed_explanation(match_data, job_data)

        return explanation

    def _get_detailed_explanation(self, match_data: dict, job_data: dict) -> str:
        """Get detailed explanation from LLM"""
        prompt = PromptTemplate(
            input_variables=["job_title", "match_score", "matched_skills", "missing_skills"],
            template="""Explain this job match analysis in a helpful, conversational way:

Position: {job_title}
Match Score: {match_score}%
Skills You Have: {matched_skills}
Skills to Develop: {missing_skills}

Write 2-3 sentences explaining what this means for the candidate and what they should do next."""
        )

        try:
            chain = prompt | self.llm
            response = chain.invoke({
                "job_title": job_data.get('title', 'this position'),
                "match_score": match_data.get('overall_score', 0),
                "matched_skills": ', '.join(match_data.get('matched_skills', [])[:5]) or 'None identified',
                "missing_skills": ', '.join(match_data.get('missing_skills', [])[:5]) or 'None identified'
            })
            return response.content
        except Exception as e:
            return ""

    def explain_ats_score(self, ats_data: dict) -> dict:
        """Generate explanation for ATS score"""
        score = ats_data.get('total_score', 0)
        breakdown = ats_data.get('breakdown', {})

        explanation = {
            'overall_assessment': '',
            'score_breakdown': [],
            'improvement_priority': []
        }

        # Overall assessment
        if score >= 80:
            explanation['overall_assessment'] = "Your resume is well-optimized for ATS systems."
        elif score >= 60:
            explanation['overall_assessment'] = "Your resume passes ATS requirements but has room for improvement."
        else:
            explanation['overall_assessment'] = "Your resume needs optimization to pass ATS screening."

        # Score breakdown explanations
        score_explanations = {
            'length_score': 'Resume length optimization',
            'skill_score': 'Skills section strength',
            'section_score': 'Section organization',
            'contact_score': 'Contact information completeness',
            'density_score': 'Keyword density',
            'action_score': 'Action verb usage'
        }

        for key, label in score_explanations.items():
            if key in breakdown:
                value = breakdown[key]
                status = "✅" if value >= 70 else "⚠️" if value >= 50 else "❌"
                explanation['score_breakdown'].append({
                    'category': label,
                    'score': value,
                    'status': status
                })

        # Prioritize improvements
        low_scores = [(k, v) for k, v in breakdown.items() if v < 70]
        low_scores.sort(key=lambda x: x[1])

        for key, score in low_scores[:3]:
            explanation['improvement_priority'].append({
                'area': score_explanations.get(key, key),
                'current_score': score,
                'recommendation': ats_data.get('recommendations', ['Improve this area'])[0] if ats_data.get('recommendations') else 'Focus on improving this area'
            })

        return explanation


# Global instance
explainability_agent = ExplainabilityAgent()
