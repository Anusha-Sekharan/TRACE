from flask import Flask, request, jsonify
from flask_cors import CORS
from models import User, SkillVerifier, users_db
import uuid

app = Flask(__name__)
CORS(app)

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    user_id = str(uuid.uuid4())
    user = User(user_id, data['name'], data['email'], data.get('skills', []))
    users_db[user_id] = user
    return jsonify({'message': 'User registered successfully', 'user_id': user_id})

@app.route('/verify_skills/<user_id>', methods=['POST'])
def verify_skills(user_id):
    if user_id not in users_db:
        return jsonify({'error': 'User not found'}), 404
    user = users_db[user_id]
    verified = []
    for skill in user.skills:
        if SkillVerifier.verify_skill(skill):
            verified.append(skill)
    user.verified_skills = verified
    return jsonify({'verified_skills': verified})

@app.route('/match/<user_id>', methods=['GET'])
def match(user_id):
    if user_id not in users_db:
        return jsonify({'error': 'User not found'}), 404
    user = users_db[user_id]
    matches = []
    for uid, other_user in users_db.items():
        if uid != user_id and other_user.verified_skills:
            common_skills = set(user.verified_skills) & set(other_user.verified_skills)
            if common_skills:
                matches.append({
                    'user_id': uid,
                    'name': other_user.name,
                    'common_skills': list(common_skills)
                })
    return jsonify({'matches': matches})

@app.route('/interview/<user_id>', methods=['POST'])
def interview(user_id):
    if user_id not in users_db:
        return jsonify({'error': 'User not found'}), 404
    data = request.json
    question = data.get('question', '')
    # Mock AI response
    responses = {
        'tell me about yourself': 'I am an AI interviewer. Please describe your background.',
        'what are your skills': 'Based on your profile, you have skills in programming.',
        'why do you want this job': 'This is a great opportunity to grow.'
    }
    response = responses.get(question.lower(), 'Thank you for your response. Next question?')
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)
