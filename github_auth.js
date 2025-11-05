const GITHUB_CLIENT_ID = 'Ov23liIt1XSZ2ivavD12'; // We'll need to set this up
const REDIRECT_URI = 'http://localhost:5000/callback';

// Language to skill mapping
const LANGUAGE_SKILLS = {
    'JavaScript': ['JavaScript', 'Web Development'],
    'TypeScript': ['TypeScript', 'JavaScript', 'Web Development'],
    'Python': ['Python', 'Programming'],
    'Java': ['Java', 'Programming'],
    'HTML': ['HTML', 'Web Development'],
    'CSS': ['CSS', 'Web Development'],
    'React': ['React', 'Frontend Development'],
    'Vue': ['Vue.js', 'Frontend Development'],
    'Node': ['Node.js', 'Backend Development'],
    'Express': ['Express.js', 'Backend Development'],
    'MongoDB': ['MongoDB', 'Database'],
    'PostgreSQL': ['PostgreSQL', 'Database'],
    'Docker': ['Docker', 'DevOps'],
    'Kubernetes': ['Kubernetes', 'DevOps']
};

// User profiles with their skills
const userProfiles = {
    'anusha': {
        name: 'Anusha',
        skills: ['Python', 'AIML', 'Full Stack', 'HTML/CSS', 'Flask']
    },
    'reanooka': {
        name: 'Reanooka',
        skills: ['Python', 'ML', 'Data Science', 'Cloud']
    },
    'dharshini': {
        name: 'Dharshini',
        skills: ['Python', 'HTML/CSS', 'Java', 'C++', 'React']
    },
    'mohan': {
        name: 'Mohan',
        skills: ['Cyber Security', 'Python', 'AWS', 'Azure', 'Networking', 'Linux']
    }
};

// Initialize GitHub auth
function handleGitHubAuth() {
    // Show username input prompt
    const username = prompt("Enter username to view their skills:");
    if (!username) return;

    // Convert to lowercase for case-insensitive matching
    const lowercaseUsername = username.toLowerCase();
    const userProfile = userProfiles[lowercaseUsername];

    if (userProfile) {
        // Show the GitHub profile section
        const profileSection = document.getElementById('github-profile');
        profileSection.style.display = 'block';

        // Update username
        document.getElementById('github-username').textContent = userProfile.name;
        
        // Add a generic avatar
        document.getElementById('github-avatar').src = 'https://avatars.githubusercontent.com/u/0?v=4';
        
        // Update bio
        document.getElementById('github-bio').textContent = "Developer Profile";

        // Clear and update skills
        const skillsContainer = document.getElementById('github-skills');
        skillsContainer.innerHTML = '';
        userProfile.skills.forEach(skill => {
            const skillTag = document.createElement('span');
            skillTag.className = 'skill-tag';
            skillTag.textContent = skill;
            skillsContainer.appendChild(skillTag);
        });

        // Hide repos section since we're not using actual GitHub data
        document.querySelector('.repo-list').style.display = 'none';
    } else {
        alert("User not found. Please try again with one of these usernames: anusha, reanooka, dharshini, mohan");
    }
}

// Generate random state for security
function generateRandomState() {
    return Math.random().toString(36).substring(2);
}

// Handle the OAuth callback
async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        try {
            // Exchange code for access token (this would be handled by your backend)
            const response = await fetch('/api/github/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });
            
            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('github_token', data.access_token);
                await fetchGitHubProfile();
            }
        } catch (error) {
            console.error('Error during GitHub authentication:', error);
        }
    }
}

// Fetch GitHub profile and repositories
async function fetchGitHubProfile() {
    const token = localStorage.getItem('github_token');
    if (!token) return;

    try {
        // Fetch user profile
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const userData = await userResponse.json();

        // Fetch repositories
        const reposResponse = await fetch(`https://api.github.com/users/${userData.login}/repos?sort=stars&per_page=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const reposData = await reposResponse.json();

        // Process and display the data
        if (userData.skills) {
            // If it's our custom user profile
            displayGitHubProfile(userData);
        } else {
            // If it's actual GitHub data
            displayGitHubProfile(userData, reposData);
            
            // Analyze repositories for skills
            const skills = await analyzeRepositories(reposData);
            displaySkills(skills);
            
            // Update AI matcher with the skills
            updateAIMatcher(userData.login, skills);
        }
        
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
    }
}

// Analyze repositories for skills
// Display GitHub profile and skills
function displayGitHubProfile(userData, reposData = null) {
    const profileSection = document.getElementById('github-profile');
    profileSection.style.display = 'block';

    // Update username
    document.getElementById('github-username').textContent = userData.name || userData.login;

    // Handle skills display
    const skillsContainer = document.getElementById('github-skills');
    skillsContainer.innerHTML = '';

    if (userData.skills) {
        // For our custom user profiles
        userData.skills.forEach(skill => {
            const skillTag = document.createElement('span');
            skillTag.className = 'skill-tag';
            skillTag.textContent = skill;
            skillsContainer.appendChild(skillTag);
        });
        // Hide repos section for custom profiles
        document.querySelector('.repo-list').style.display = 'none';
    } else if (reposData) {
        // For actual GitHub profiles
        // Handle repository display here
        document.querySelector('.repo-list').style.display = 'block';
        const reposContainer = document.getElementById('github-repos');
        reposContainer.innerHTML = '';
        reposData.forEach(repo => {
            // Add repository display logic here
        });
    }
}

async function analyzeRepositories(repos) {
    const skills = new Map();
    
    for (const repo of repos) {
        // Fetch languages used in the repository
        const headersObj = {};
        const token = localStorage.getItem('github_token');
        if (token) headersObj['Authorization'] = `Bearer ${token}`;
        const languagesResponse = await fetch(repo.languages_url, { headers: headersObj });
        const languages = await languagesResponse.json();
        
        // Process languages and map them to skills
        for (const [language, bytes] of Object.entries(languages)) {
            if (LANGUAGE_SKILLS[language]) {
                for (const skill of LANGUAGE_SKILLS[language]) {
                    const currentValue = skills.get(skill) || 0;
                    skills.set(skill, currentValue + Math.log10(bytes));
                }
            }
        }
    }
    
    // Normalize skill levels to 1-10 scale
    const normalizedSkills = new Map();
    const maxValue = Math.max(...skills.values());
    
    for (const [skill, value] of skills.entries()) {
        normalizedSkills.set(skill, Math.ceil((value / maxValue) * 10));
    }
    
    return normalizedSkills;
}

// Fetch user and repos by username (unauthenticated, public data)
async function fetchUserAndRepos(username) {
    try {
        const userResp = await fetch(`https://api.github.com/users/${username}`);
        if (!userResp.ok) return null;
        const user = await userResp.json();

        const reposResp = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=10`);
        const repos = reposResp.ok ? await reposResp.json() : [];

        return { user, repos };
    } catch (e) {
        console.error('Error fetching user/repos:', e);
        return null;
    }
}

// Handle manual lookup by username(s) entered in the UI
async function handleLookupByUsername() {
    const input = document.getElementById('github-lookup');
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) {
        alert('Please enter at least one GitHub username.');
        return;
    }

    const usernames = raw.split(',').map(s => s.trim()).filter(Boolean);
    const teamContainer = document.getElementById('github-team');
    if (teamContainer) teamContainer.innerHTML = '';

    for (const uname of usernames) {
        const data = await fetchUserAndRepos(uname);
        if (!data) {
            const errDiv = document.createElement('div');
            errDiv.textContent = `Could not fetch data for ${uname}`;
            teamContainer.appendChild(errDiv);
            continue;
        }

        const skills = await analyzeRepositoriesFromMock(data.repos);

        // If first username, also populate main profile area
        const profileSection = document.getElementById('github-profile');
        if (profileSection && profileSection.style.display === 'none') {
            displayGitHubProfile(data.user, data.repos);
            displaySkills(skills);
        } else {
            displayTeamMember(data.user, data.repos, skills);
        }
    }
}

// Append a team member card to the team container
function displayTeamMember(user, repos, skills) {
    const teamContainer = document.getElementById('github-team');
    if (!teamContainer) return;

    const card = document.createElement('div');
    card.className = 'repo-card';
    const skillHtml = Array.from(skills.entries()).slice(0,5).map(([s,l]) => `<span class="skill-tag">${s} <span class="level">${l}/10</span></span>`).join(' ');
    card.innerHTML = `
        <div style="display:flex; gap:12px; align-items:center;">
            <img src="${user.avatar_url}" style="width:48px;height:48px;border-radius:50%;border:2px solid #4a148c;" />
            <div>
                <strong>${user.name || user.login}</strong>
                <div style="color:#666">${user.bio || ''}</div>
            </div>
        </div>
        <div style="margin-top:10px">${skillHtml || '<em>No detected skills</em>'}</div>
    `;
    teamContainer.appendChild(card);
}

// Lightweight analyzer for demo repos (uses repo.language field)
async function analyzeRepositoriesFromMock(repos) {
    const skills = new Map();
    for (const repo of repos) {
        const language = repo.language;
        if (!language) continue;
        // Some repo.language values may be null or generic; handle common cases
        const langKey = Object.keys(LANGUAGE_SKILLS).find(l => l.toLowerCase() === language.toLowerCase());
        if (langKey) {
            const mapped = LANGUAGE_SKILLS[langKey];
            // use repo.stargazers_count as weight to increase importance
            const weight = Math.log10((repo.stargazers_count || 1) + 1);
            for (const skill of mapped) {
                const current = skills.get(skill) || 0;
                skills.set(skill, current + weight);
            }
        }
    }

    if (skills.size === 0) return new Map();

    const maxValue = Math.max(...skills.values());
    const normalized = new Map();
    for (const [skill, value] of skills.entries()) {
        normalized.set(skill, Math.ceil((value / maxValue) * 10));
    }
    return normalized;
}

// Simulate a GitHub login and populate the UI with demo data
async function simulateGitHubDemo() {
    const demoUser = {
        login: 'demo-user',
        name: 'Demo User',
        avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
        bio: 'Demo developer for UI testing'
    };

    const demoRepos = [
        { name: 'awesome-python', description: 'Python utilities', stargazers_count: 120, forks_count: 12, language: 'Python' , languages_url: ''},
        { name: 'web-ui', description: 'Frontend UI components', stargazers_count: 80, forks_count: 5, language: 'JavaScript' , languages_url: ''},
        { name: 'data-tools', description: 'Data science helpers', stargazers_count: 45, forks_count: 3, language: 'Python' , languages_url: ''},
        { name: 'devops-scripts', description: 'Docker and CI configs', stargazers_count: 22, forks_count: 2, language: 'Docker' , languages_url: ''},
        { name: 'sql-examples', description: 'SQL queries and migrations', stargazers_count: 10, forks_count: 1, language: 'SQL' , languages_url: ''}
    ];

    // Display profile and repos
    displayGitHubProfile(demoUser, demoRepos);

    // Analyze demo repos for skills
    const skills = await analyzeRepositoriesFromMock(demoRepos);
    displaySkills(skills);

    // Update AI matcher (best effort; backend may not be running)
    try {
        await updateAIMatcher(demoUser.login, skills);
    } catch (e) {
        console.warn('Could not update AI matcher (backend may be offline).', e);
    }
}

// Display GitHub profile and repositories (handles both real GitHub users and our custom demo profiles)
function displayGitHubProfile(user, repos) {
    const profileSection = document.getElementById('github-profile');
    const avatar = document.getElementById('github-avatar');
    const username = document.getElementById('github-username');
    const bio = document.getElementById('github-bio');
    const reposList = document.getElementById('github-repos');
    const skillsGrid = document.getElementById('github-skills');

    profileSection.style.display = 'block';

    // If this is one of our custom profiles (we store skills directly)
    if (user && user.skills) {
        avatar.src = user.avatar_url || 'https://avatars.githubusercontent.com/u/0?v=4';
        username.textContent = user.name || 'Unknown';
        bio.textContent = user.bio || 'Developer Profile';

        // Render skills
        skillsGrid.innerHTML = '';
        user.skills.forEach(skill => {
            const el = document.createElement('div');
            el.className = 'skill-tag';
            el.textContent = skill;
            skillsGrid.appendChild(el);
        });

        // Hide repos section for custom profiles
        const repoSection = document.querySelector('.repo-list');
        if (repoSection) repoSection.style.display = 'none';
        return;
    }

    // Otherwise assume real GitHub user + repos
    avatar.src = (user && user.avatar_url) ? user.avatar_url : 'https://avatars.githubusercontent.com/u/9919?v=4';
    username.textContent = user ? (user.name || user.login) : 'Unknown';
    bio.textContent = user ? (user.bio || 'GitHub Developer') : '';

    // Show repos (guard against null)
    repos = repos || [];
    const repoSection = document.querySelector('.repo-list');
    if (repoSection) repoSection.style.display = repos.length ? 'block' : 'none';

    reposList.innerHTML = repos.map(repo => `
        <div class="repo-card">
            <h5>${repo.name}</h5>
            <p>${repo.description || 'No description available'}</p>
            <div class="repo-stats">
                <span>⭐ ${repo.stargazers_count}</span>
                <span>🔄 ${repo.forks_count}</span>
                <span>${repo.language || 'Various'}</span>
            </div>
        </div>
    `).join('');
}

// Display detected skills
function displaySkills(skills) {
    const skillsGrid = document.getElementById('github-skills');
    
    skillsGrid.innerHTML = Array.from(skills.entries())
        .map(([skill, level]) => `
            <div class="skill-tag">
                ${skill}
                <span class="level">${level}/10</span>
            </div>
        `).join('');
}

// Role / skill search: find best matching profile for a typed role like 'ml engineer'
function handleRoleSearch() {
    const input = document.getElementById('role-search');
    if (!input) return;
    const raw = input.value.trim().toLowerCase();
    if (!raw) {
        alert('Please enter a role or skill to search (e.g. "ml engineer").');
        return;
    }

    // Tokenize query words and expand some common synonyms
    const tokens = raw.match(/\w+/g) || [];
    const expanded = new Set(tokens);
    const synonyms = {
        'ml': ['ml', 'aiml', 'machine', 'machinelearning', 'machine-learning', 'data', 'data science'],
        'data': ['data', 'data science', 'datascience'],
        'cyber': ['cyber', 'security', 'cybersecurity', 'cyber security'],
        'full': ['full', 'fullstack', 'full stack', 'full-stack', 'full stack developer']
    };
    tokens.forEach(t => {
        if (synonyms[t]) synonyms[t].forEach(s => expanded.add(s));
    });

    // Score each profile by how many skills match the expanded tokens
    const results = [];
    for (const [key, profile] of Object.entries(userProfiles)) {
        let score = 0;
        for (const skill of profile.skills) {
            const s = skill.toLowerCase().replace(/\s+/g, '');
            for (const t of expanded) {
                const tt = t.toLowerCase().replace(/\s+/g, '');
                if (s === tt) {
                    score += 3; // exact match
                } else if (s.includes(tt) || tt.includes(s)) {
                    score += 1;
                }
            }
        }
        results.push({ key, profile, score });
    }

    results.sort((a, b) => b.score - a.score);
    const best = results[0];
    if (!best || best.score === 0) {
        alert('No matching profile found for that role. Try simpler terms like "ml", "python", "cyber", "full stack".');
        return;
    }

    // Display the best matching profile (single shortlist)
    displayGitHubProfile(best.profile);
}

// Update AI matcher with GitHub skills
async function updateAIMatcher(username, skills) {
    try {
        const response = await fetch('/api/update-skills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                skills: Object.fromEntries(skills)
            })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            console.log('Skills updated in AI matcher');
        }
    } catch (error) {
        console.error('Error updating AI matcher:', error);
    }
}

// Check for GitHub callback on page load
window.onload = function() {
    if (window.location.pathname === '/callback') {
        handleCallback();
    }
};