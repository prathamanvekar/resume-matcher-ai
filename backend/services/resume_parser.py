# backend/services/resume_parser.py

import re
import json
import spacy
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
import PyPDF2
import pdfplumber
from docx import Document
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from config import settings
from ml.model_loader import model_loader


class ResumeParser:
    def __init__(self):
        # Load spaCy for fallback
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except OSError:
            import subprocess
            try:
                subprocess.run([sys.executable, '-m', 'spacy', 'download', 'en_core_web_sm'], check=False)
                self.nlp = spacy.load('en_core_web_sm')
            except Exception:
                self.nlp = spacy.blank('en')

        self.skill_taxonomy = model_loader.get_skill_taxonomy() or {}

        # Initialize LLM
        if settings.GROQ_API_KEY:
            self.llm = ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.LLM_MODEL,
                temperature=0.1  # Low temperature for consistent extraction
            )
        else:
            self.llm = None

    # ==========================================
    # FILE EXTRACTION METHODS (unchanged)
    # ==========================================

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            # Fallback to PyPDF2
            try:
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        text += page.extract_text() + "\n"
            except Exception as e2:
                print(f"Error extracting PDF: {e2}")

        return text.strip()

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            return text.strip()
        except Exception as e:
            print(f"Error extracting DOCX: {e}")
            return ""

    def extract_text(self, file_path: str) -> str:
        """Extract text from resume file"""
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            return self.extract_text_from_docx(file_path)
        elif ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    # ==========================================
    # LLM-BASED PARSING (PRIMARY METHOD)
    # ==========================================

    def parse_with_llm(self, text: str) -> Optional[dict]:
        """Parse resume using LLM - primary parsing method"""
        if not self.llm:
            return None

        prompt = PromptTemplate(
            input_variables=["resume_text"],
            template="""You are an expert resume parser. Extract structured information from the following resume text.

Resume Text:
{resume_text}

Extract the following information and return ONLY a valid JSON object (no markdown, no explanation, just the JSON):

{{
    "name": "Full name of the candidate (string or null if not found)",
    "email": "Email address (string or null if not found)",
    "phone": "Phone number (string or null if not found)",
    "linkedin": "LinkedIn URL or username (string or null if not found)",
    "location": "City, State/Country (string or null if not found)",
    "summary": "Professional summary or objective in 2-3 sentences (string or null if not found)",
    "experience_years": "Total years of experience as a number (integer, estimate if needed, 0 if entry level)",
    "current_role": "Current or most recent job title (string or null if not found)",
    "current_company": "Current or most recent company (string or null if not found)",
    "skills": ["List of technical and professional skills as strings"],
    "education": [
        {{
            "degree": "Degree name (e.g., Bachelor's, Master's, PhD)",
            "field": "Field of study",
            "institution": "University/College name",
            "year": "Graduation year or null"
        }}
    ],
    "work_experience": [
        {{
            "title": "Job title",
            "company": "Company name",
            "duration": "Duration (e.g., '2020-2023' or '3 years')",
            "highlights": ["Key achievements or responsibilities"]
        }}
    ],
    "certifications": ["List of certifications"],
    "languages": ["List of languages spoken"],
    "projects": [
        {{
            "name": "Project name",
            "description": "Brief description",
            "technologies": ["Technologies used"]
        }}
    ]
}}

Important:
- Return ONLY the JSON object, no other text
- Use null for fields you cannot find
- For skills, include both technical skills (Python, SQL, etc.) and soft skills (leadership, communication)
- Be thorough in extracting skills - look throughout the entire resume
- Estimate experience_years based on work history if not explicitly stated
- Extract ALL skills mentioned anywhere in the resume

JSON Output:"""
        )

        try:
            # Truncate text if too long (keep first 6000 chars for context window)
            truncated_text = text[:6000] if len(text) > 6000 else text

            chain = prompt | self.llm
            response = chain.invoke({"resume_text": truncated_text})

            # Extract JSON from response
            response_text = response.content.strip()

            # Try to find JSON in the response
            parsed_data = self._extract_json(response_text)

            if parsed_data:
                # Validate and clean the parsed data
                return self._validate_llm_response(parsed_data)

            return None

        except Exception as e:
            print(f"LLM parsing error: {e}")
            return None

    def _extract_json(self, text: str) -> Optional[dict]:
        """Extract JSON from LLM response text"""
        # Try direct parsing first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to find JSON in markdown code blocks
        json_patterns = [
            r'```json\s*([\s\S]*?)\s*```',
            r'```\s*([\s\S]*?)\s*```',
            r'\{[\s\S]*\}'
        ]

        for pattern in json_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    # Clean up the match
                    clean_match = match.strip()
                    if not clean_match.startswith('{'):
                        continue
                    return json.loads(clean_match)
                except json.JSONDecodeError:
                    continue

        return None

    def _validate_llm_response(self, data: dict) -> dict:
        """Validate and clean LLM response"""
        validated = {
            'name': data.get('name'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'linkedin': data.get('linkedin'),
            'location': data.get('location'),
            'summary': data.get('summary'),
            'experience_years': 0,
            'current_role': data.get('current_role'),
            'current_company': data.get('current_company'),
            'skills': [],
            'education': [],
            'work_experience': [],
            'certifications': [],
            'languages': [],
            'projects': []
        }

        # Validate experience_years
        exp = data.get('experience_years')
        if isinstance(exp, (int, float)):
            validated['experience_years'] = int(exp)
        elif isinstance(exp, str):
            # Try to extract number from string
            numbers = re.findall(r'\d+', exp)
            if numbers:
                validated['experience_years'] = int(numbers[0])

        # Validate skills (ensure it's a list of strings)
        skills = data.get('skills', [])
        if isinstance(skills, list):
            validated['skills'] = [
                str(s).strip().lower()
                for s in skills
                if s and str(s).strip()
            ]

        # Validate education
        education = data.get('education', [])
        if isinstance(education, list):
            validated['education'] = [
                {
                    'degree': e.get('degree', ''),
                    'field': e.get('field', ''),
                    'institution': e.get('institution', ''),
                    'year': e.get('year')
                }
                for e in education
                if isinstance(e, dict)
            ]

        # Validate work experience
        work_exp = data.get('work_experience', [])
        if isinstance(work_exp, list):
            validated['work_experience'] = [
                {
                    'title': w.get('title', ''),
                    'company': w.get('company', ''),
                    'duration': w.get('duration', ''),
                    'highlights': w.get('highlights', []) if isinstance(w.get('highlights'), list) else []
                }
                for w in work_exp
                if isinstance(w, dict)
            ]

        # Validate certifications
        certs = data.get('certifications', [])
        if isinstance(certs, list):
            validated['certifications'] = [str(c) for c in certs if c]

        # Validate languages
        langs = data.get('languages', [])
        if isinstance(langs, list):
            validated['languages'] = [str(l) for l in langs if l]

        # Validate projects
        projects = data.get('projects', [])
        if isinstance(projects, list):
            validated['projects'] = [
                {
                    'name': p.get('name', ''),
                    'description': p.get('description', ''),
                    'technologies': p.get('technologies', []) if isinstance(p.get('technologies'), list) else []
                }
                for p in projects
                if isinstance(p, dict)
            ]

        return validated

    # ==========================================
    # REGEX-BASED PARSING (FALLBACK METHOD)
    # ==========================================

    def extract_email_regex(self, text: str) -> Optional[str]:
        """Extract email using regex"""
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        matches = re.findall(pattern, text)
        return matches[0] if matches else None

    def extract_phone_regex(self, text: str) -> Optional[str]:
        """Extract phone number using regex"""
        patterns = [
            r'\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b',
            r'\b[0-9]{10}\b',
            r'\b\+?[0-9]{1,3}[-.\s]?[0-9]{10}\b',
            r'\b\+91[-.\s]?[0-9]{10}\b',  # Indian format
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0]
        return None

    def extract_name_regex(self, text: str) -> Optional[str]:
        """Extract name from top lines with spaCy fallback"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        section_words = {
            'resume', 'curriculum', 'vitae', 'summary', 'experience', 'education',
            'skills', 'projects', 'certifications', 'profile', 'contact'
        }

        for line in lines[:12]:
            lower = line.lower()
            if '@' in line or any(ch.isdigit() for ch in line):
                continue
            if any(word in lower for word in section_words):
                continue

            tokens = [token for token in re.split(r'\s+', line) if token]
            if 2 <= len(tokens) <= 5 and all(re.match(r"^[A-Za-z][A-Za-z\-'\.]*$", token) for token in tokens):
                return line

        doc = self.nlp(text[:800])
        for ent in doc.ents:
            if ent.label_ == 'PERSON' and 2 <= len(ent.text.split()) <= 5:
                return ent.text

        if lines:
            first_line = lines[0].strip()
            if len(first_line) < 60 and '@' not in first_line and not any(c.isdigit() for c in first_line):
                return first_line

        return None

    def extract_skills_regex(self, text: str) -> list:
        """Extract skills using pattern matching"""
        text_lower = text.lower()
        found_skills = []

        # Skills from taxonomy
        for skill in self.skill_taxonomy.keys():
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill)

        # Additional common skills
        common_skills = [
            'python', 'java', 'javascript', 'c++', 'c#', 'sql', 'html', 'css',
            'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'spring',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'jenkins',
            'machine learning', 'deep learning', 'data analysis', 'tensorflow', 'pytorch',
            'excel', 'tableau', 'power bi', 'jira', 'agile', 'scrum',
            'communication', 'leadership', 'teamwork', 'problem solving', 'project management',
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
            'rest api', 'graphql', 'microservices', 'ci/cd', 'devops',
            'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
            'salesforce', 'sap', 'oracle', 'linux', 'windows server'
        ]

        for skill in common_skills:
            if skill not in found_skills:
                pattern = r'\b' + re.escape(skill) + r'\b'
                if re.search(pattern, text_lower):
                    found_skills.append(skill)

        return list(set(found_skills))

    def extract_education_regex(self, text: str) -> list:
        """Extract education entries from education section and degree patterns"""
        education = []

        degree_patterns = [
            r"(Bachelor'?s?|B\.?S\.?|B\.?A\.?|B\.?Tech|B\.?E\.?|B\.?Com)\s*(?:of|in)?\s*([A-Za-z\s]+?)(?:\n|,|from|\d)",
            r"(Master'?s?|M\.?S\.?|M\.?A\.?|M\.?Tech|M\.?B\.?A\.?|M\.?Com)\s*(?:of|in)?\s*([A-Za-z\s]+?)(?:\n|,|from|\d)",
            r"(Ph\.?D\.?|Doctorate|Doctor)\s*(?:of|in)?\s*([A-Za-z\s]+?)(?:\n|,|from|\d)"
        ]

        for pattern in degree_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                education.append({
                    'degree': match[0].strip(),
                    'field': match[1].strip()[:50],
                    'institution': None,
                    'year': None
                })

        section = self._extract_section(text, ['education', 'academic background', 'academics', 'qualification'])
        if section:
            section_lines = [line.strip(' •\t') for line in section.split('\n') if line.strip()]
            year_pattern = re.compile(r'\b(19|20)\d{2}\b')

            for line in section_lines:
                lower = line.lower()
                if not any(word in lower for word in ['bachelor', 'master', 'phd', 'b.tech', 'm.tech', 'b.e', 'm.e', 'b.sc', 'm.sc', 'mba', 'degree']):
                    continue

                year_match = year_pattern.search(line)
                education.append({
                    'degree': line[:120],
                    'field': '',
                    'institution': '',
                    'year': int(year_match.group()) if year_match else None
                })

        deduped = []
        seen = set()
        for item in education:
            key = (item.get('degree') or '').lower().strip()
            if not key or key in seen:
                continue
            seen.add(key)
            deduped.append(item)
        return deduped

    def extract_work_experience_regex(self, text: str) -> list:
        """Extract basic work experience entries from experience section"""
        section = self._extract_section(text, ['experience', 'work experience', 'professional experience', 'employment'])
        if not section:
            return []

        lines = [line.strip(' •\t') for line in section.split('\n') if line.strip()]
        entries = []
        date_pattern = re.compile(r'((19|20)\d{2})\s*[-–]\s*(present|(19|20)\d{2})', re.IGNORECASE)

        idx = 0
        while idx < len(lines):
            line = lines[idx]
            match = date_pattern.search(line)

            if match and idx > 0:
                title_line = lines[idx - 1]
                duration = match.group(0)
                entries.append({
                    'title': title_line[:120],
                    'company': '',
                    'duration': duration,
                    'highlights': []
                })
            idx += 1

        return entries

    def extract_experience_years_regex(self, text: str) -> int:
        """Estimate years of experience using regex"""
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s+)?experience',
            r'experience\s*:?\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s+in\s+(?:the\s+)?industry'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                return int(matches[0])

        date_ranges = re.findall(r'((19|20)\d{2})\s*[-–]\s*(present|(19|20)\d{2})', text, re.IGNORECASE)
        if date_ranges:
            starts = []
            ends = []
            current_year = datetime.utcnow().year
            for start, _, end, _ in date_ranges:
                starts.append(int(start))
                ends.append(current_year if end.lower() == 'present' else int(end))
            if starts and ends:
                estimate = max(0, max(ends) - min(starts))
                if estimate > 0:
                    return estimate

        return 0

    def parse_with_regex(self, text: str) -> dict:
        """Parse resume using regex - fallback method"""
        cleaned_text = re.sub(r'\s+', ' ', text).strip()

        return {
            'name': self.extract_name_regex(text),
            'email': self.extract_email_regex(text),
            'phone': self.extract_phone_regex(text),
            'linkedin': None,
            'location': None,
            'summary': None,
            'experience_years': self.extract_experience_years_regex(text),
            'current_role': None,
            'current_company': None,
            'skills': self.extract_skills_regex(text),
            'education': self.extract_education_regex(text),
            'work_experience': self.extract_work_experience_regex(text),
            'certifications': [],
            'languages': [],
            'projects': []
        }

    def _extract_section(self, text: str, section_titles: list[str]) -> str:
        """Extract a probable section body from resume text by heading names"""
        lines = text.split('\n')
        start_idx = -1

        for idx, line in enumerate(lines):
            normalized = re.sub(r'[^a-z ]', '', line.lower()).strip()
            if any(title in normalized for title in section_titles):
                start_idx = idx + 1
                break

        if start_idx == -1:
            return ''

        section_enders = ['education', 'experience', 'projects', 'skills', 'certifications', 'summary', 'contact']
        buffer = []
        for line in lines[start_idx:start_idx + 80]:
            normalized = re.sub(r'[^a-z ]', '', line.lower()).strip()
            if normalized and any(ender == normalized or normalized.startswith(f'{ender} ') for ender in section_enders):
                break
            buffer.append(line)

        return '\n'.join(buffer)

    # ==========================================
    # MAIN PARSING METHODS
    # ==========================================

    def parse(self, file_path: str) -> dict:
        """Parse resume from file - tries LLM first, falls back to regex"""
        text = self.extract_text(file_path)

        if not text:
            return {'error': 'Could not extract text from file'}

        return self._parse_text_internal(text)

    def parse_text(self, text: str) -> dict:
        """Parse resume from text directly - tries LLM first, falls back to regex"""
        if not text or not text.strip():
            return {'error': 'Empty text provided'}

        return self._parse_text_internal(text)

    def _parse_text_internal(self, text: str) -> dict:
        """Internal parsing logic - tries LLM first, then regex fallback"""
        cleaned_text = re.sub(r'\s+', ' ', text).strip()
        word_count = len(cleaned_text.split())

        # Try LLM parsing first
        print("🤖 Attempting LLM-based resume parsing...")
        llm_result = self.parse_with_llm(text)

        if llm_result:
            print("✅ LLM parsing successful")
            result = {
                'raw_text': text,
                'cleaned_text': cleaned_text,
                'word_count': word_count,
                'parsing_method': 'llm',
                **llm_result
            }

            # Enrich skills with taxonomy if LLM missed some
            regex_skills = self.extract_skills_regex(text)
            llm_skills = set(result.get('skills', []))

            # Add any skills found by regex that LLM missed
            for skill in regex_skills:
                if skill.lower() not in [s.lower() for s in llm_skills]:
                    result['skills'].append(skill)

            if not result.get('name'):
                result['name'] = self.extract_name_regex(text)

            if not result.get('education'):
                result['education'] = self.extract_education_regex(text)

            if not result.get('work_experience'):
                result['work_experience'] = self.extract_work_experience_regex(text)

            if not result.get('experience_years') or result.get('experience_years', 0) <= 0:
                result['experience_years'] = self.extract_experience_years_regex(text)

            return result

        # Fallback to regex parsing
        print("⚠️ LLM parsing failed, falling back to regex...")
        regex_result = self.parse_with_regex(text)

        return {
            'raw_text': text,
            'cleaned_text': cleaned_text,
            'word_count': word_count,
            'parsing_method': 'regex',
            **regex_result
        }

    def get_parsing_summary(self, parsed_data: dict) -> dict:
        """Get a summary of what was parsed"""
        return {
            'parsing_method': parsed_data.get('parsing_method', 'unknown'),
            'fields_found': {
                'name': parsed_data.get('name') is not None,
                'email': parsed_data.get('email') is not None,
                'phone': parsed_data.get('phone') is not None,
                'linkedin': parsed_data.get('linkedin') is not None,
                'location': parsed_data.get('location') is not None,
                'summary': parsed_data.get('summary') is not None,
                'skills_count': len(parsed_data.get('skills', [])),
                'education_count': len(parsed_data.get('education', [])),
                'experience_count': len(parsed_data.get('work_experience', [])),
                'certifications_count': len(parsed_data.get('certifications', [])),
                'projects_count': len(parsed_data.get('projects', [])),
            },
            'experience_years': parsed_data.get('experience_years', 0),
            'word_count': parsed_data.get('word_count', 0)
        }


# Global instance
resume_parser = ResumeParser()
