# backend/services/ats_scorer.py

import re
from ml.model_loader import model_loader

class ATSScorer:
    def __init__(self):
        self.config = model_loader.get_ats_config() or {
            'weights': {
                'length_score': 0.10,
                'skill_score': 0.30,
                'section_score': 0.20,
                'contact_score': 0.10,
                'density_score': 0.15,
                'action_score': 0.15
            },
            'pass_threshold': 60
        }
        self.weights = self.config.get('weights', {})

    def calculate_length_score(self, text: str) -> float:
        """Score based on resume length"""
        word_count = len(text.split())

        if 400 <= word_count <= 800:
            return 1.0
        elif 300 <= word_count < 400 or 800 < word_count <= 1000:
            return 0.75
        elif 200 <= word_count < 300 or 1000 < word_count <= 1200:
            return 0.5
        else:
            return 0.3

    def calculate_skill_score(self, skills: list) -> float:
        """Score based on number of skills"""
        skill_count = len(skills)

        if 10 <= skill_count <= 20:
            return 1.0
        elif 5 <= skill_count < 10 or 20 < skill_count <= 25:
            return 0.75
        elif skill_count < 5:
            return skill_count / 5
        else:
            return 0.6

    def calculate_section_score(self, text: str) -> float:
        """Score based on presence of key sections"""
        text_lower = text.lower()

        sections = {
            'experience': r'\b(experience|employment|work history|professional background)\b',
            'education': r'\b(education|degree|university|college|bachelor|master|phd)\b',
            'skills': r'\b(skills|technical skills|competencies|proficiencies)\b',
            'summary': r'\b(summary|objective|profile|about)\b',
            'contact': r'\b(email|phone|linkedin|contact)\b'
        }

        found = sum(1 for pattern in sections.values() if re.search(pattern, text_lower))
        return found / len(sections)

    def calculate_contact_score(self, text: str) -> float:
        """Score based on contact information"""
        has_email = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text))
        has_phone = bool(re.search(r'\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b', text))
        has_linkedin = bool(re.search(r'linkedin', text.lower()))

        return (has_email + has_phone + has_linkedin) / 3

    def calculate_density_score(self, text: str, skills: list) -> float:
        """Score based on keyword density"""
        word_count = len(text.split())
        if word_count == 0:
            return 0

        density = (len(skills) / word_count) * 100

        if 2 <= density <= 5:
            return 1.0
        elif 1 <= density < 2 or 5 < density <= 7:
            return 0.75
        else:
            return 0.5

    def calculate_action_score(self, text: str) -> float:
        """Score based on action verbs"""
        text_lower = text.lower()

        action_verbs = [
            'achieved', 'managed', 'developed', 'created', 'implemented',
            'increased', 'reduced', 'improved', 'led', 'designed',
            'built', 'launched', 'delivered', 'generated', 'established',
            'optimized', 'streamlined', 'coordinated', 'executed', 'analyzed'
        ]

        found = sum(1 for verb in action_verbs if verb in text_lower)
        return min(found / 10, 1.0)

    def score(self, text: str, skills: list) -> dict:
        """Calculate complete ATS score"""
        # Calculate individual scores
        scores = {
            'length_score': self.calculate_length_score(text),
            'skill_score': self.calculate_skill_score(skills),
            'section_score': self.calculate_section_score(text),
            'contact_score': self.calculate_contact_score(text),
            'density_score': self.calculate_density_score(text, skills),
            'action_score': self.calculate_action_score(text)
        }

        # Calculate weighted total
        total_score = sum(
            scores[key] * self.weights.get(key, 0.15)
            for key in scores
        ) * 100

        # Determine pass/fail
        passed = total_score >= self.config.get('pass_threshold', 60)

        # Generate recommendations
        recommendations = self._generate_recommendations(scores, text, skills)

        return {
            'total_score': round(total_score, 1),
            'passed': passed,
            'breakdown': {k: round(v * 100, 1) for k, v in scores.items()},
            'recommendations': recommendations,
            'word_count': len(text.split()),
            'skill_count': len(skills)
        }

    def _generate_recommendations(self, scores: dict, text: str, skills: list) -> list:
        """Generate improvement recommendations"""
        recommendations = []

        if scores['length_score'] < 0.7:
            word_count = len(text.split())
            if word_count < 400:
                recommendations.append("Add more details to your resume. Aim for 400-800 words.")
            else:
                recommendations.append("Consider condensing your resume. Aim for 400-800 words.")

        if scores['skill_score'] < 0.7:
            recommendations.append("Add more relevant skills. Aim for 10-20 skills.")

        if scores['section_score'] < 0.8:
            recommendations.append("Ensure your resume has clear sections: Experience, Education, Skills, Summary.")

        if scores['contact_score'] < 0.7:
            recommendations.append("Add complete contact information: email, phone, and LinkedIn profile.")

        if scores['action_score'] < 0.5:
            recommendations.append("Use more action verbs (achieved, managed, developed, created, etc.)")

        if not recommendations:
            recommendations.append("Your resume is well-optimized for ATS!")

        return recommendations


# Global instance
ats_scorer = ATSScorer()
