from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from coursera_validator import CourseraCertificateValidator
from PIL import Image
import re

# Configure Flask to serve static files
app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)  # Enable CORS for all routes

# Route for the main page
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Route for other static files
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize the certificate validator
validator = CourseraCertificateValidator()

def analyze_certificate(file_path):
    """Analyze certificate content and extract relevant information."""
    # For now, we'll use the filename to determine the course
    filename = os.path.basename(file_path).lower()
    
    # Map common keywords in filenames to course names
    course_name = None
    if 'python' in filename:
        course_name = "Python Programming"
    elif 'data' in filename and 'science' in filename:
        course_name = "Data Science Professional Certificate"
    elif 'machine' in filename and 'learning' in filename:
        course_name = "Machine Learning Specialization"
    elif 'web' in filename:
        course_name = "Web Development"
    elif 'sql' in filename:
        course_name = "SQL for Data Science"
    elif 'project' in filename and 'management' in filename:
        course_name = "Project Management Professional Certificate"
    elif 'agile' in filename:
        course_name = "Agile Development"
    else:
        # Default to Python Programming if no match found
        course_name = "Python Programming"

    # Generate a certificate ID based on timestamp and filename
    certificate_id = f"CERT{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Use current date as completion date
    completion_date = datetime.now().strftime('%Y-%m-%d')

    return {
        "course_name": course_name,
        "certificate_id": certificate_id,
        "completion_date": completion_date,
        "verification_url": f"https://coursera.org/verify/{certificate_id}"
    }

@app.route('/api/upload-certificate', methods=['POST'])
def upload_certificate():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if 'username' not in request.form:
        return jsonify({"error": "No username provided"}), 400

    username = request.form['username']
    
    # Register user if not already registered
    validator.register_user(username, f"{username}@example.com")

    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Analyze certificate
        certificate_data = analyze_certificate(file_path)
        
        if not certificate_data:
            return jsonify({"error": "Could not extract certificate information"}), 400

        # Validate certificate
        result = validator.validate_certificate(username, certificate_data)
        
        # Clean up the temporary file
        os.remove(file_path)

        if result['status'] == 'success':
            return jsonify({
                "status": "success",
                "certificate": certificate_data,
                "verified_skills": result['verified_skills']
            })
        else:
            return jsonify({"error": result['message']}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-profile', methods=['GET'])
def get_profile():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "No username provided"}), 400

    profile = validator.export_profile_to_matcher(username)
    if not profile:
        return jsonify({"error": "User not found"}), 404

    return jsonify(profile)

if __name__ == '__main__':
    print("Server starting... Access the website at http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)