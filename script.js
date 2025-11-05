// --- Dynamic Logic for TRACE Onboarding (Final Professional Transition) ---

// Simulated profile data for users who link APIs (The verified path)
const SIMULATED_VERIFIED_PROFILE = {
    name: "ANUSHA S", // Default name for the verified path demonstration
    verified_sources: ["LinkedIn", "GitHub", "Coursera"], 
    key_skills: ["Python (Verified)", "Project Mgt (Certified)", "Team Leadership (Endorsed)"]
};

// --- Toggle Function for Registration Form ---
function toggleRegisterForm() {
    const form = document.getElementById('registerForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// --- Registration Handler (Email/Password) ---
function handleRegistration(event) {
    event.preventDefault(); // Stop the form from submitting normally
    const name = document.getElementById('regName').value; // Get Name
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) { 
        alert("Please enter your name, email, and password.");
        return;
    }

    const statusBox = document.getElementById('status-message');
    statusBox.style.display = 'block';
    statusBox.style.backgroundColor = '#ffc107'; // Yellow
    statusBox.innerHTML = `⏳ Registering account for **${name}**...`;

    setTimeout(() => {
        statusBox.style.backgroundColor = '#4CAF50'; // Green
        statusBox.innerHTML = `✅ Registration successful. Redirecting to Profile Setup.`;
        
        // Pass the name and email context to the display function
        displayNextStep({ type: 'Registration', name: name, context: email });

    }, 2000); 
}


// --- API Link Handler (Core PoC Path) ---
function handleLogin(source) {
    const statusBox = document.getElementById('status-message');
    
    if (source === 'Coursera') {
        // Show Coursera login modal
        const modal = document.getElementById('courseraModal');
        modal.style.display = 'block';
        return;
    }
    
    // For other sources (GitHub, LinkedIn)
    statusBox.style.display = 'block';
    statusBox.style.backgroundColor = '#ffc107'; 
    statusBox.innerHTML = `⏳ Requesting API access and consent via **${source}**...`;
    
    setTimeout(() => {
        statusBox.style.backgroundColor = '#4CAF50'; 
        statusBox.innerHTML = `✅ **${source}** linked successfully! Consent granted (100% compliance).`;
        displayNextStep({ type: 'API', context: source }); 
    }, 2500); 
}

// --- Coursera Certificate Upload Integration ---
let uploadedFiles = [];

function handleFileSelect(event) {
    const files = event.target.files;
    const fileList = document.getElementById('fileList');
    
    for (let file of files) {
        if (!uploadedFiles.find(f => f.name === file.name)) {
            uploadedFiles.push(file);
            
            // Create file preview element
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <button class="remove-file" onclick="removeFile('${file.name}')">✕</button>
            `;
            fileList.appendChild(fileItem);
        }
    }
}

function removeFile(fileName) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
    const fileList = document.getElementById('fileList');
    const fileItem = fileList.querySelector(`[data-filename="${fileName}"]`);
    if (fileItem) fileList.removeChild(fileItem);
}

async function handleCertificateUpload(event) {
    event.preventDefault();
    const statusBox = document.getElementById('status-message');
    const modal = document.getElementById('courseraModal');
    
    if (uploadedFiles.length === 0) {
        alert('Please upload at least one certificate.');
        return;
    }
    
    // Show loading state
    statusBox.style.display = 'block';
    statusBox.style.backgroundColor = '#ffc107';
    statusBox.innerHTML = '⏳ Analyzing certificates...';
    
    // Generate a unique username for this session
    const username = 'user_' + Date.now();
    const certificates = [];
    const verifiedSkills = {};
    
    try {
        // Process each file
        for (const file of uploadedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('username', username);
            
            // Upload and analyze certificate
            const response = await fetch('/api/upload-certificate', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                certificates.push({
                    courseName: result.certificate.course_name,
                    certificateId: result.certificate.certificate_id,
                    completionDate: result.certificate.completion_date,
                    verificationUrl: result.certificate.verification_url,
                    fileName: file.name
                });
                
                // Update verified skills
                Object.assign(verifiedSkills, result.verified_skills);
            } else {
                console.error(`Failed to process certificate ${file.name}:`, result.error);
            }
        }
        
        // Update status
        statusBox.style.backgroundColor = '#4CAF50';
        statusBox.innerHTML = '✅ Certificates verified successfully!';
        
        // Reset uploaded files
        uploadedFiles = [];
        document.getElementById('fileList').innerHTML = '';
        
        // Close the modal
        modal.style.display = 'none';
        
        // Display certificates and skills
        displayCourseraCertificates(certificates, verifiedSkills);
        
        // Get the complete profile
        const profileResponse = await fetch(`/api/get-profile?username=${username}`);
        const profile = await profileResponse.json();
        
        // Update the next steps
        displayNextStep({ 
            type: 'Coursera', 
            context: 'Coursera Certificates',
            certificates: certificates,
            profile: profile
        });
        
    } catch (error) {
        console.error('Error processing certificates:', error);
        statusBox.style.backgroundColor = '#f44336';
        statusBox.innerHTML = '❌ Error processing certificates. Please try again.';
    }
}

function displayCourseraCertificates(certificates, verifiedSkills) {
    const container = document.getElementById('next-step-instructions');
    if (!container) return;
    
    const certificatesList = certificates.map(cert => `
        <div class="certificate-item">
            <h4>${cert.courseName}</h4>
            <p>Completed: ${cert.completionDate}</p>
            <p>Certificate ID: ${cert.certificateId}</p>
            <a href="${cert.verificationUrl}" target="_blank" class="verify-link">Verify Certificate</a>
        </div>
    `).join('');
    
    // Use the verified skills directly from the backend
    const skills = Object.entries(verifiedSkills).map(([skill, level]) => ({
        name: skill,
        level: level
    }));
    
    container.innerHTML = `
        <div class="next-step-box">
            <h3>✅ Coursera Certificates Verified</h3>
            <div class="verified-skills">
                <h4>Verified Skills:</h4>
                <div class="skills-tags">
                    ${Array.from(skills).map(skill => `
                        <span class="skill-tag">${skill}</span>
                    `).join('')}
                </div>
            </div>
            <div class="certificates-section">
                <h4>Your Certificates:</h4>
                ${certificatesList}
            </div>
        </div>
    `;
}


// --- Core Next Step & Profile Display Function ---
function displayNextStep(data) {
    const verificationPrompt = document.querySelector('.verification-prompt');
    const registerSection = document.querySelector('.register-section');
    const statusBox = document.getElementById('status-message');
    let nextStepContainer = document.getElementById('next-step-instructions'); 

    // Determine which profile data to use for display
    let profileData = {};
    if (data.type === 'API') {
        profileData = {
            name: SIMULATED_VERIFIED_PROFILE.name,
            status: 'Verified via APIs',
            context: 'Data linked from ' + data.context,
            skills: SIMULATED_VERIFIED_PROFILE.key_skills
        };
    } else { // Registration path
        profileData = {
            name: data.name, // Use the name entered in the form
            status: 'Basic Registration',
            context: data.context,
            // Professional placeholder until API verification is done
            skills: ["Self-Declared", "Verification Pending"] 
        };
    }


    setTimeout(() => {
        
        // Hide the input areas
        if (verificationPrompt) verificationPrompt.style.display = 'none'; 
        if (registerSection) registerSection.style.display = 'none'; 
        if (statusBox) statusBox.style.display = 'none';

        // Inject the next step instructions and PROFILE DATA dynamically 
        if (!nextStepContainer) {
            const container = document.createElement('div');
            container.id = 'next-step-instructions';
            
            // --- CLEANED HTML CONTENT (FINAL VERSION) ---
            container.innerHTML = `
                <div class="next-step-box">
                    <h3>✅ Profile Status: ${profileData.status}</h3>
                    
                    <div class="profile-details">
                        <p><strong>User:</strong> ${profileData.name}</p>
                        <p><strong>Context:</strong> ${profileData.context}</p>
                        
                        <p><strong>Key Skills:</strong> ${profileData.skills.join(' | ')}</p>
                    </div>

                    
                    
            `;
            // --- END OF CLEANED HTML CONTENT ---
            
            document.querySelector('.login-container').appendChild(container);
            nextStepContainer = container; 
        } 
        nextStepContainer.style.display = 'block'; 
        
    }, 2000); 
}