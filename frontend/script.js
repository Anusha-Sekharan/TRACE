const API_BASE = 'http://localhost:5000';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const skills = document.getElementById('skills').value.split(',').map(s => s.trim());
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, skills })
        });
        const data = await response.json();
        document.getElementById('registerMessage').textContent = data.message + ' User ID: ' + data.user_id;
    } catch (error) {
        document.getElementById('registerMessage').textContent = 'Error registering user';
    }
});

document.getElementById('verifyBtn').addEventListener('click', async () => {
    const userId = document.getElementById('userId').value;
    try {
        const response = await fetch(`${API_BASE}/verify_skills/${userId}`, { method: 'POST' });
        const data = await response.json();
        document.getElementById('verifyMessage').textContent = 'Verified skills: ' + data.verified_skills.join(', ');
    } catch (error) {
        document.getElementById('verifyMessage').textContent = 'Error verifying skills';
    }
});

document.getElementById('matchBtn').addEventListener('click', async () => {
    const userId = document.getElementById('matchUserId').value;
    try {
        const response = await fetch(`${API_BASE}/match/${userId}`);
        const data = await response.json();
        const list = document.getElementById('matchesList');
        list.innerHTML = '';
        data.matches.forEach(match => {
            const li = document.createElement('li');
            li.textContent = `${match.name} - Common skills: ${match.common_skills.join(', ')}`;
            list.appendChild(li);
        });
    } catch (error) {
        document.getElementById('matchesList').innerHTML = '<li>Error finding matches</li>';
    }
});

document.getElementById('askBtn').addEventListener('click', async () => {
    const userId = document.getElementById('interviewUserId').value;
    const question = document.getElementById('question').value;
    try {
        const response = await fetch(`${API_BASE}/interview/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        const data = await response.json();
        document.getElementById('interviewResponse').textContent = data.response;
    } catch (error) {
        document.getElementById('interviewResponse').textContent = 'Error in interview';
    }
});
