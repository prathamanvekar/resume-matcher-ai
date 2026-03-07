# backend/services/skill_analyzer.py

from ml.model_loader import model_loader
from collections import defaultdict

class SkillAnalyzer:
    def __init__(self):
        self.skill_job_mapping = model_loader.get_skill_job_mapping() or {}
        self.transition_graph = model_loader.get_transition_graph() or {}
        self.transition_model_data = model_loader.get_transition_model()

    def analyze_skill_gap(self, current_skills: list, target_role: str) -> dict:
        """Analyze skill gap for a target role"""
        current_skills_set = set(s.lower() for s in current_skills)

        # Get skills commonly associated with target role
        target_skills = set()
        for skill, data in self.skill_job_mapping.items():
            top_roles = data.get('top_roles', {})
            if target_role in top_roles and top_roles[target_role] >= 5:
                target_skills.add(skill.lower())

        # Calculate gaps
        matched_skills = current_skills_set.intersection(target_skills)
        missing_skills = target_skills - current_skills_set

        # Prioritize missing skills by frequency
        prioritized_missing = []
        for skill in missing_skills:
            skill_data = self.skill_job_mapping.get(skill, {})
            total_jobs = skill_data.get('total_jobs', 0)
            prioritized_missing.append({
                'skill': skill,
                'demand': total_jobs,
                'priority': 'HIGH' if total_jobs > 500 else 'MEDIUM' if total_jobs > 100 else 'LOW'
            })

        # Sort by demand
        prioritized_missing.sort(key=lambda x: x['demand'], reverse=True)

        return {
            'current_skills_count': len(current_skills_set),
            'target_skills_count': len(target_skills),
            'matched_count': len(matched_skills),
            'gap_count': len(missing_skills),
            'coverage_percentage': round(len(matched_skills) / len(target_skills) * 100, 1) if target_skills else 0,
            'matched_skills': list(matched_skills),
            'skills_to_learn': prioritized_missing[:20]
        }

    def get_career_transition_paths(self, current_role: str, target_role: str = None) -> dict:
        """Get career transition paths from current role"""
        if current_role not in self.transition_graph:
            return {
                'current_role': current_role,
                'available_transitions': [],
                'message': f"No transition data for {current_role}"
            }

        transitions = self.transition_graph[current_role]

        if target_role:
            # Specific transition
            if target_role in transitions:
                return {
                    'current_role': current_role,
                    'target_role': target_role,
                    'transition': transitions[target_role],
                    'is_viable': transitions[target_role]['feasibility'] > 0.4
                }
            else:
                return {
                    'current_role': current_role,
                    'target_role': target_role,
                    'transition': None,
                    'message': f"No direct transition path from {current_role} to {target_role}"
                }
        else:
            # All available transitions
            sorted_transitions = sorted(
                transitions.items(),
                key=lambda x: x[1]['feasibility'],
                reverse=True
            )

            return {
                'current_role': current_role,
                'available_transitions': [
                    {'target': t[0], **t[1]} for t in sorted_transitions
                ]
            }

    def generate_learning_roadmap(self, current_skills: list, target_role: str) -> dict:
        """Generate a learning roadmap to reach target role"""
        gap_analysis = self.analyze_skill_gap(current_skills, target_role)
        skills_to_learn = gap_analysis['skills_to_learn']

        # Organize into phases
        roadmap = {
            'target_role': target_role,
            'total_skills_to_learn': len(skills_to_learn),
            'current_coverage': gap_analysis['coverage_percentage'],
            'phases': []
        }

        # Phase 1: High priority skills (first 1-2 months)
        high_priority = [s for s in skills_to_learn if s['priority'] == 'HIGH'][:5]
        if high_priority:
            roadmap['phases'].append({
                'phase': 1,
                'name': 'Foundation',
                'duration': '1-2 months',
                'skills': high_priority,
                'focus': 'Most in-demand skills for this role'
            })

        # Phase 2: Medium priority skills (months 2-4)
        medium_priority = [s for s in skills_to_learn if s['priority'] == 'MEDIUM'][:5]
        if medium_priority:
            roadmap['phases'].append({
                'phase': 2,
                'name': 'Building Expertise',
                'duration': '2-4 months',
                'skills': medium_priority,
                'focus': 'Important complementary skills'
            })

        # Phase 3: Low priority / nice-to-have (months 4-6)
        low_priority = [s for s in skills_to_learn if s['priority'] == 'LOW'][:5]
        if low_priority:
            roadmap['phases'].append({
                'phase': 3,
                'name': 'Advanced Skills',
                'duration': '4-6 months',
                'skills': low_priority,
                'focus': 'Nice-to-have skills for competitive edge'
            })

        return roadmap


# Global instance
skill_analyzer = SkillAnalyzer()
