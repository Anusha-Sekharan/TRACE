import json
from datetime import datetime
from collections import Counter

class CourseraCertificateValidator:
    def __init__(self):
        self.verified_certificates = {}
        self.skill_mappings = {
            "Python Programming": ["Python"],
            "Data Science Professional Certificate": ["Data Science Certificate", "Python", "Machine Learning"],
            "Machine Learning Specialization": ["Machine Learning", "Python"],
            "Web Development": ["JavaScript", "HTML/CSS"],
            "SQL for Data Science": ["SQL"],
            "Project Management Professional Certificate": ["Project Management", "Team Leadership"],
            "Agile Development": ["Agile Methodology"]
        }

    def register_user(self, username, email):
        """Register a new user in the system."""
        if username not in self.verified_certificates:
            self.verified_certificates[username] = {
                "email": email,
                "certificates": [],
                "verified_skills": Counter()
            }
            return True
        return False

    def validate_certificate(self, username, certificate_data):
        """
        Validate and process a Coursera certificate.
        certificate_data should include:
        - course_name: str
        - certificate_id: str
        - completion_date: str (YYYY-MM-DD)
        - verification_url: str
        """
        if username not in self.verified_certificates:
            raise ValueError("User not registered")

        # Validate certificate format and required fields
        required_fields = ['course_name', 'certificate_id', 'completion_date', 'verification_url']
        if not all(field in certificate_data for field in required_fields):
            return {
                "status": "error",
                "message": "Missing required certificate information"
            }

        # Validate completion date format
        try:
            completion_date = datetime.strptime(certificate_data['completion_date'], '%Y-%m-%d')
            if completion_date > datetime.now():
                return {
                    "status": "error",
                    "message": "Invalid completion date"
                }
        except ValueError:
            return {
                "status": "error",
                "message": "Invalid date format. Use YYYY-MM-DD"
            }

        # Add certificate to user's profile
        user_profile = self.verified_certificates[username]
        certificate_data['verified'] = True
        user_profile['certificates'].append(certificate_data)

        # Update verified skills based on the certificate
        if certificate_data['course_name'] in self.skill_mappings:
            for skill in self.skill_mappings[certificate_data['course_name']]:
                user_profile['verified_skills'][skill] += 5  # Base skill value for verified certificates

        return {
            "status": "success",
            "message": "Certificate validated successfully",
            "verified_skills": dict(user_profile['verified_skills'])
        }

    def get_verified_skills(self, username):
        """Get all verified skills for a user."""
        if username not in self.verified_certificates:
            return None
        return dict(self.verified_certificates[username]['verified_skills'])

    def export_profile_to_matcher(self, username):
        """Export the verified profile in a format compatible with TRACE_AI_Matcher."""
        if username not in self.verified_certificates:
            return None

        user_data = self.verified_certificates[username]
        return {
            "Goal": "Verified Coursera Graduate",  # Default goal, can be updated later
            "Skills": user_data['verified_skills']  # Already a Counter object
        }