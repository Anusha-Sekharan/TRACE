from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import requests
from collections import Counter
from ai_matcher import TRACE_AI_Matcher, VERIFIED_USER_PROFILES

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# GitHub OAuth Configuration
GITHUB_CLIENT_ID = 'Ov23liIt1XSZ2ivavD12'
GITHUB_CLIENT_SECRET = 'You need a client secret to authenticate as the application to the API.'

# Route for the main page
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Route for static files
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/api/github/callback', methods=['POST'])
def github_callback():
    code = request.json.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400

    # Exchange code for access token
    response = requests.post(
        'https://github.com/login/oauth/access_token',
        data={
            'client_id': GITHUB_CLIENT_ID,
            'client_secret': GITHUB_CLIENT_SECRET,
            'code': code
        },
        headers={'Accept': 'application/json'}
    )

    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to get access token'}), 400

@app.route('/api/update-skills', methods=['POST'])
def update_skills():
    data = request.json
    username = data.get('username')
    skills = data.get('skills')

    if not username or not skills:
        return jsonify({'error': 'Missing username or skills'}), 400

    # Convert skills to Counter format
    skill_counter = Counter({k: int(v) for k, v in skills.items()})

    # Update the verified profiles
    VERIFIED_USER_PROFILES[username] = {
        'Goal': 'GitHub Verified Developer',
        'Skills': skill_counter
    }

    return jsonify({
        'status': 'success',
        'message': 'Skills updated successfully',
        'skills': dict(skill_counter)
    })

if __name__ == '__main__':
    print("Server starting... Access the website at http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)