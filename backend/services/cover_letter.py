# backend/services/cover_letter.py

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from config import settings

class CoverLetterGenerator:
    def __init__(self):
        if settings.GROQ_API_KEY:
            self.llm = ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.LLM_MODEL,
                temperature=0.7
            )
        else:
            self.llm = None

    def generate(self, resume_data: dict, job_data: dict, match_data: dict = None) -> str:
        """Generate a tailored cover letter"""
        if not self.llm:
            return self._generate_template(resume_data, job_data)

        prompt = PromptTemplate(
            input_variables=["name", "job_title", "company", "skills", "experience", "matched_skills", "job_description"],
            template="""Write a professional cover letter for the following job application:

Applicant Name: {name}
Applying for: {job_title} at {company}

Applicant's Key Skills: {skills}
Applicant's Experience: {experience}

Skills that match the job requirements: {matched_skills}

Job Description Summary: {job_description}

Write a compelling cover letter that:
1. Opens with enthusiasm for the specific role
2. Highlights 2-3 most relevant experiences/skills
3. Shows knowledge of the company
4. Explains how the applicant can add value
5. Closes with a call to action

Keep it professional, concise (250-350 words), and personalized.

Cover Letter:"""
        )

        # Prepare inputs
        name = resume_data.get('name', 'Applicant')
        skills = ", ".join(resume_data.get('skills', [])[:10])
        experience = f"{resume_data.get('experience_years', 0)} years of experience"
        matched_skills = ", ".join(match_data.get('matched_skills', [])[:5]) if match_data else skills
        job_desc = job_data.get('description', '')[:500]

        try:
            chain = prompt | self.llm
            response = chain.invoke({
                "name": name,
                "job_title": job_data.get('title', 'Position'),
                "company": job_data.get('company', 'Company'),
                "skills": skills,
                "experience": experience,
                "matched_skills": matched_skills,
                "job_description": job_desc
            })
            return response.content
        except Exception as e:
            print(f"Error generating cover letter: {e}")
            return self._generate_template(resume_data, job_data)

    def _generate_template(self, resume_data: dict, job_data: dict) -> str:
        """Generate a template cover letter without LLM"""
        name = resume_data.get('name', '[Your Name]')
        job_title = job_data.get('title', '[Position]')
        company = job_data.get('company', '[Company]')
        skills = resume_data.get('skills', [])[:5]

        return f"""Dear Hiring Manager,

I am writing to express my strong interest in the {job_title} position at {company}. With my background and skills in {', '.join(skills[:3])}, I am confident in my ability to contribute effectively to your team.

Throughout my career, I have developed expertise in {', '.join(skills[:5])}. These skills, combined with my passion for excellence and continuous learning, make me an ideal candidate for this role.

I am particularly drawn to {company} because of its reputation for innovation and excellence. I am excited about the opportunity to bring my unique perspective and skills to your team.

I would welcome the opportunity to discuss how my experience and skills can benefit {company}. Thank you for considering my application.

Best regards,
{name}"""


# Global instance
cover_letter_generator = CoverLetterGenerator()
