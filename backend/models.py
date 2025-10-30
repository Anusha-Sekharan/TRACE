from typing import List, Dict

class User:
    def __init__(self, user_id: str, name: str, email: str, skills: List[str] = None):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.skills = skills or []
        self.verified_skills = []

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'skills': self.skills,
            'verified_skills': self.verified_skills
        }

class SkillVerifier:
    @staticmethod
    def verify_skill(skill: str) -> bool:
        # Mock verification: assume skills like 'Python', 'JavaScript' are verifiable
        verifiable_skills = ['Python', 'JavaScript', 'Java', 'C++', 'React', 'Node.js']
        return skill in verifiable_skills

# In-memory storage
users_db: Dict[str, User] = {}
