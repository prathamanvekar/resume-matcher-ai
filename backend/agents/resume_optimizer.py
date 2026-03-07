# backend/agents/resume_optimizer.py

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from config import settings
from services.ats_scorer import ats_scorer

class ResumeOptimizerAgent:
    def __init__(self):
        if settings.GROQ_API_KEY:
            self.llm = ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.LLM_MODEL,
                temperature=0.3
            )
        else:
            self.llm = None

    def optimize(self, resume_text: str, target_role: str = None,
                 current_score: dict = None, max_iterations: int = 3) -> dict:
        """Optimize resume for better ATS score"""

        if not self.llm:
            return {
                'original_score': current_score.get('total_score', 0) if current_score else 0,
                'optimized_text': resume_text,
                'final_score': current_score.get('total_score', 0) if current_score else 0,
                'changes': ['LLM not available - no optimization performed'],
                'error': 'GROQ_API_KEY not configured'
            }

        # Get initial score if not provided
        if not current_score:
            from services.resume_parser import resume_parser
            parsed = resume_parser.parse_text(resume_text)
            current_score = ats_scorer.score(resume_text, parsed.get('skills', []))

        original_score = current_score['total_score']
        optimized_text = resume_text
        all_changes = []

        prompt = PromptTemplate(
            input_variables=["resume", "target_role", "recommendations", "score"],
            template="""You are an expert resume optimizer. Improve the following resume to achieve a higher ATS score.

Current ATS Score: {score}/100
Target Role: {target_role}
Recommendations to address:
{recommendations}

Original Resume:
{resume}

Optimize the resume by:
1. Adding more relevant keywords and skills
2. Using action verbs (achieved, managed, developed, etc.)
3. Ensuring clear section headers
4. Improving readability and structure

Return ONLY the improved resume text, no explanations."""
        )

        for iteration in range(max_iterations):
            # Check if score is already good
            if current_score['total_score'] >= 85:
                break

            try:
                chain = prompt | self.llm
                response = chain.invoke({
                    "resume": optimized_text,
                    "target_role": target_role or "general",
                    "recommendations": "\n".join(current_score.get('recommendations', [])),
                    "score": current_score['total_score']
                })

                new_text = response.content.strip()

                # Re-score
                from services.resume_parser import resume_parser
                new_parsed = resume_parser.parse_text(new_text)
                new_score = ats_scorer.score(new_text, new_parsed.get('skills', []))

                # Check if improved
                if new_score['total_score'] > current_score['total_score']:
                    all_changes.append(f"Iteration {iteration + 1}: Score improved from {current_score['total_score']} to {new_score['total_score']}")
                    optimized_text = new_text
                    current_score = new_score
                else:
                    all_changes.append(f"Iteration {iteration + 1}: No improvement")
                    break

            except Exception as e:
                all_changes.append(f"Iteration {iteration + 1}: Error - {str(e)}")
                break

        return {
            'original_score': original_score,
            'optimized_text': optimized_text,
            'final_score': current_score['total_score'],
            'improvement': current_score['total_score'] - original_score,
            'changes': all_changes,
            'final_breakdown': current_score.get('breakdown', {}),
            'iterations_used': len(all_changes)
        }


# Global instance
resume_optimizer = ResumeOptimizerAgent()
