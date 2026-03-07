# backend/agents/career_agent.py

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from config import settings
from services.skill_analyzer import skill_analyzer

class CareerPlanningAgent:
    def __init__(self):
        if settings.GROQ_API_KEY:
            self.llm = ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.LLM_MODEL,
                temperature=0.4
            )
        else:
            self.llm = None

    def plan_career_transition(self, current_role: str, target_role: str,
                               current_skills: list, experience_years: int = 0) -> dict:
        """Create a comprehensive career transition plan"""

        # Get transition data
        transition = skill_analyzer.get_career_transition_paths(current_role, target_role)
        gap_analysis = skill_analyzer.analyze_skill_gap(current_skills, target_role)
        roadmap = skill_analyzer.generate_learning_roadmap(current_skills, target_role)

        # Calculate timeline
        transition_data = transition.get('transition', {})
        base_months = transition_data.get('avg_months', 24)

        # Adjust based on experience
        if experience_years >= 5:
            adjusted_months = int(base_months * 0.8)
        elif experience_years >= 3:
            adjusted_months = base_months
        else:
            adjusted_months = int(base_months * 1.2)

        plan = {
            'current_role': current_role,
            'target_role': target_role,
            'feasibility': transition_data.get('feasibility', 0.3),
            'estimated_timeline_months': adjusted_months,
            'skill_gap': gap_analysis,
            'learning_roadmap': roadmap,
            'transition_path': transition
        }

        # Get LLM advice if available
        if self.llm:
            plan['ai_advice'] = self._get_career_advice(plan)

        return plan

    def _get_career_advice(self, plan: dict) -> str:
        """Get personalized career advice from LLM"""
        prompt = PromptTemplate(
            input_variables=["current_role", "target_role", "feasibility", "timeline", "top_skills"],
            template="""As a career coach, provide actionable advice for this career transition:

Current Role: {current_role}
Target Role: {target_role}
Feasibility: {feasibility}%
Estimated Timeline: {timeline} months
Top Skills to Learn: {top_skills}

Provide 3-4 specific, actionable recommendations for making this transition successful. Be concise and practical."""
        )

        try:
            top_skills = [s['skill'] for s in plan['skill_gap'].get('skills_to_learn', [])[:5]]

            chain = prompt | self.llm
            response = chain.invoke({
                "current_role": plan['current_role'],
                "target_role": plan['target_role'],
                "feasibility": int(plan['feasibility'] * 100),
                "timeline": plan['estimated_timeline_months'],
                "top_skills": ', '.join(top_skills)
            })
            return response.content
        except Exception as e:
            return f"Could not generate advice: {str(e)}"

    def suggest_intermediate_roles(self, current_role: str, target_role: str) -> list:
        """Suggest intermediate roles for career progression"""
        all_transitions = skill_analyzer.get_career_transition_paths(current_role)
        available = all_transitions.get('available_transitions', [])

        # Find roles that could be stepping stones
        intermediate = []
        for trans in available:
            role = trans.get('target')
            if role != target_role:
                # Check if this role can transition to target
                next_trans = skill_analyzer.get_career_transition_paths(role, target_role)
                if next_trans.get('transition'):
                    intermediate.append({
                        'role': role,
                        'step1_feasibility': trans.get('feasibility', 0),
                        'step2_feasibility': next_trans['transition'].get('feasibility', 0),
                        'total_months': trans.get('avg_months', 18) + next_trans['transition'].get('avg_months', 18)
                    })

        # Sort by combined feasibility
        intermediate.sort(
            key=lambda x: x['step1_feasibility'] * x['step2_feasibility'],
            reverse=True
        )

        return intermediate[:3]


# Global instance
career_agent = CareerPlanningAgent()
