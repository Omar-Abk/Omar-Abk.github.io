// for the basic info
const BASIC_INFO_QUERY = `
    query {
        user {
            id
            login
            firstName
            lastName
            email
            campus
        }
    }
`;

// for the last projects
const LAST_PROJECTS_QUERY = `
    {
        transaction(
            where: {
                type: { _eq: "xp" }
                _and: [
                    { path: { _like: "/bahrain/bh-module%" } },
                    { path: { _nlike: "/bahrain/bh-module/checkpoint%" } },
                    { path: { _nlike: "/bahrain/bh-module/piscine-js%" } }
                ]
            }
            order_by: { createdAt: desc }
            limit: 4
        ) {
            object {
                type
                name
            }
        }
    }
`;

// for the xp
const XP_QUERY = (userId) => `
    query Transaction_aggregate {
        transaction_aggregate(
            where: {
                event: { path: { _eq: "/bahrain/bh-module" } }
                type: { _eq: "xp" }
                userId: { _eq: "${userId}" }
            }
        ) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }
`;
// for the audit ratio
const AUDIT_RATIO_QUERY = `
    {
        user {
            totalUp
            totalDown
            auditRatio
        }
    }
`;
// for the best skills
const SKILLS_QUERY = `
    {
        user {
            transactions(
                where: {
                    type: {_ilike: "%skill%"}
                },
                order_by: {amount: desc}
            ) {
                type
                amount
            }
        }
    }
`;
// for the tech skills
const TECH_SKILLS_QUERY = `
    {
        user {
            transactions(where: {
                type: {_ilike: "%skill%"}
            }) {
                type
                amount
            }
        }
    }
`;

// for the campus name
function capitalizeFirstLetter(string) {
    if (!string) return 'N/A';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// for the graphql request
async function executeGraphQLQuery(query) {
    const token = auth.getToken();
    if (!token) {
        throw new Error('No authentication token available');
    }

    const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error('Failed to fetch data');
    }

    const result = await response.json();
    if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        throw new Error(result.errors[0].message);
    }

    return result.data;
}

// for the dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }
    try {
        // First fetch user data as it contains the user ID needed for XP
        const userData = await executeGraphQLQuery(BASIC_INFO_QUERY);
        const user = userData.user[0];

        // Display user data first
        displayUserData(user);

        // Then fetch all other data in parallel
        await Promise.all([
            fetchLastProjects(),
            fetchAuditData(),
            fetchSkillsData(),
            fetchXPData(user.id),
            fetchTechSkills()
        ]);
    } catch (error) {
        handleError(error);
    }
});

//
async function fetchUserData() {
    try {
        const data = await executeGraphQLQuery(BASIC_INFO_QUERY);
        displayUserData(data.user[0]);
    } catch (error) {
        handleError(error);
    }
}
// for the recent projects
async function fetchLastProjects() {
    try {
        const data = await executeGraphQLQuery(LAST_PROJECTS_QUERY);
        displayLastProjects(data.transaction);
    } catch (error) {
        handleError(error, 'projects-list');
    }
}

// for the xp
async function fetchXPData(userId) {
    try {
        const data = await executeGraphQLQuery(XP_QUERY(userId));
        displayXPData(data.transaction_aggregate.aggregate.sum.amount);
    } catch (error) {
        handleError(error, 'xp-info');
    }
}

// for the audit ratio
async function fetchAuditData() {
    try {
        const data = await executeGraphQLQuery(AUDIT_RATIO_QUERY);
        displayAuditRatio(data.user[0]);
    } catch (error) {
        handleError(error, 'audit-ratio');
    }
}

// for the skills
async function fetchSkillsData() {
    try {
        const data = await executeGraphQLQuery(SKILLS_QUERY);
        const uniqueSkills = data.user[0].transactions.reduce((acc, curr) => {
            if (!acc.some(skill => skill.type === curr.type)) {
                acc.push(curr);
            }
            return acc;
        }, []);
        displaySkillsRadar(uniqueSkills.slice(0, 6));
    } catch (error) {
        handleError(error, 'skills-container');
    }
}

// Error handling helper
function handleError(error, elementId) {
    console.error('Error:', error);
    if (elementId) {
        document.getElementById(elementId).textContent = 'Error loading data: ' + error.message;
    } else {
        document.querySelectorAll('[id$="-list"], [id$="-info"], [id$="-ratio"], [id$="container"]')
            .forEach(element => {
                element.textContent = 'Error loading data: ' + error.message;
            });
    }

    if (error.message.includes('JWT')) {
        auth.logout();
    }
}

function displayUserData(user) {
    // Update header username
    document.getElementById('header-username').textContent = user.login || 'User';

    // Basic Information
    document.getElementById('user-id').textContent = user.id || 'N/A';
    document.getElementById('user-login').textContent = user.login || 'N/A';
    document.getElementById('user-firstname').textContent = user.firstName || 'N/A';
    document.getElementById('user-lastname').textContent = user.lastName || 'N/A';
    document.getElementById('user-email').textContent = user.email || 'N/A';
    document.getElementById('user-campus').textContent = capitalizeFirstLetter(user.campus);
}

function displayLastProjects(projects) {
    const projectsList = document.getElementById('projects-list');

    if (projects && projects.length > 0) {
        const projectsHTML = projects
            .map(project => `
                <div class="project-item">
                    <span class="project-name">${project.object.name}</span>
                  
                </div>
            `)
            .join('');

        projectsList.innerHTML = projectsHTML;
    } else {
        projectsList.textContent = 'No recent projects found';
    }
}

function displayXPData(amount) {
    const xpInfo = document.getElementById('xp-info');
    let displayValue;
    let unit;

    // Check if the amount is large enough to be displayed in MB
    if (amount >= 1000000) {
        displayValue = (amount / 1000000).toFixed(2);
        unit = 'MB';
    } else {
        displayValue = Math.round(amount / 1000);
        unit = 'kB';
    }

    xpInfo.innerHTML = `
        <div class="xp-display">
            <span class="xp-amount">${displayValue}</span>
            <span class="xp-label">${unit}</span>
        </div>
    `;
}

function displayAuditRatio(userData) {
    const auditRatio = document.getElementById('audit-ratio');
    const totalUp = userData.totalUp || 0;
    const totalDown = userData.totalDown || 0;
    const ratio = totalDown > 0 ? (totalUp / totalDown).toFixed(1) : 'N/A';

    // Convert bytes to MB
    const upMB = (totalUp / 1000000).toFixed(2);
    const downMB = (totalDown / 1000000).toFixed(2);

    // Calculate max value for progress bars
    const maxValue = Math.max(totalUp, totalDown);

    // Create SVG progress bars
    auditRatio.innerHTML = `
        <div class="audit-stats">
            <div class="audit-bar-container">
                <div class="audit-label">Done: ${upMB} MB</div>
                <svg width="100%" height="30">
                    <rect class="bar-bg" width="100%" height="20" rx="5"></rect>
                    <rect class="bar-fill done-bar" 
                          width="${(totalUp / maxValue) * 100}%" 
                          height="20" 
                          rx="5"></rect>
                </svg>
            </div>
            <div class="audit-bar-container">
                <div class="audit-label">Received: ${downMB} MB</div>
                <svg width="100%" height="30">
                    <rect class="bar-bg" width="100%" height="20" rx="5"></rect>
                    <rect class="bar-fill received-bar" 
                          width="${(totalDown / maxValue) * 100}%" 
                          height="20" 
                          rx="5"></rect>
                </svg>
            </div>
            <div class="audit-ratio-value">
                Ratio: ${ratio}
            </div>
        </div>
    `;
}

function displaySkillsRadar(skills) {
    const container = document.getElementById('skills-container');
    const size = 400;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.3;

    // Find max amount for scaling
    const maxAmount = Math.max(...skills.map(s => s.amount));

    // Calculate points for each skill
    const points = skills.map((skill, i) => {
        const angle = (i * 2 * Math.PI / skills.length) - Math.PI / 2;
        const value = (skill.amount / maxAmount) * radius;
        return {
            x: centerX + value * Math.cos(angle),
            y: centerY + value * Math.sin(angle),
            label: skill.type.replace('skill_', ''),
            value: skill.amount
        };
    });

    // Create SVG
    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <!-- Background circles -->
            ${[0.2, 0.4, 0.6, 0.8, 1].map(scale => `
                <circle 
                    cx="${centerX}" 
                    cy="${centerY}" 
                    r="${radius * scale}"
                    fill="none"
                    stroke="#ddd"
                    stroke-width="1"
                />
            `).join('')}
            
            <!-- Skill lines -->
            ${points.map((_, i) => {
        const angle = (i * 2 * Math.PI / skills.length) - Math.PI / 2;
        return `
                    <line 
                        x1="${centerX}"
                        y1="${centerY}"
                        x2="${centerX + radius * Math.cos(angle)}"
                        y2="${centerY + radius * Math.sin(angle)}"
                        stroke="#ddd"
                        stroke-width="1"
                    />
                `;
    }).join('')}
            
            <!-- Skill area -->
            <path
                d="${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + 'Z'}"
                fill="rgba(40, 167, 69, 0.3)"
                stroke="#28a745"
                stroke-width="2"
            />
            
            <!-- Skill points -->
            ${points.map(p => `
                <circle
                    cx="${p.x}"
                    cy="${p.y}"
                    r="4"
                    fill="#28a745"
                />
1            `).join('')}
            
            <!-- Labels -->
            ${points.map((p, i) => {
        const angle = (i * 2 * Math.PI / skills.length) - Math.PI / 2;
        const labelRadius = radius + 40;
        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);

        // Determine text anchor based on position
        let textAnchor;
        if (angle < -Math.PI / 2 || angle > Math.PI / 2) {
            textAnchor = 'end';
        } else if (angle === -Math.PI / 2 || angle === Math.PI / 2) {
            textAnchor = 'middle';
        } else {
            textAnchor = 'start';
        }

        return `
            <text
                x="${labelX}"
                y="${labelY}"
                text-anchor="${textAnchor}"
                class="skill-label"
                dominant-baseline="middle"
            >${p.label}</text>
        `;
    }).join('')}
        </svg>
    `;

    container.innerHTML = svg;
}

/*Last Graph Tech skills*/

async function fetchTechSkills() {
    try {
        const response = await executeGraphQLQuery(TECH_SKILLS_QUERY);
        const transactions = response.user[0].transactions;

        // Define the tech skills we want to track
        const techSkills = {
            'go': 'skill_go',
            'javascript': 'skill_js',
            'html': 'skill_html',
            'css': 'skill_css',
            'unix': 'skill_unix',
            'docker': 'skill_docker',
            'sql': 'skill_sql'
        };

        // Process the skills data
        const skillsData = Object.entries(techSkills).map(([key, skillType]) => {
            const skill = transactions.find(t => t.type === skillType);
            return {
                skill: key.toUpperCase(),
                amount: skill ? skill.amount : 0
            };
        });

        // Find the maximum value for scaling
        const maxValue = Math.max(...skillsData.map(s => s.amount));
        const scale = maxValue === 0 ? 1 : maxValue;

        // Create the radar chart
        createTechSkillsRadar(skillsData, scale);
    } catch (error) {
        console.error('Error fetching tech skills:', error);
        document.getElementById('tech-skills-container').innerHTML = 'Error loading tech skills';
    }
}

function createTechSkillsRadar(skills, maxAmount) {
    const container = document.getElementById('tech-skills-container');
    const size = 400;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.3;

    // Create SVG
    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <!-- Background circles -->
            ${[0.2, 0.4, 0.6, 0.8, 1.0].map(scale => `
                <circle 
                    cx="${centerX}" 
                    cy="${centerY}" 
                    r="${radius * scale}"
                    fill="none"
                    stroke="#ddd"
                    stroke-width="1"
                />
            `).join('')}
            
            <!-- Skill lines -->
            ${skills.map((_, i) => {
        const angle = (i * 2 * Math.PI / skills.length) - Math.PI / 2;
        return `
                    <line 
                        x1="${centerX}"
                        y1="${centerY}"
                        x2="${centerX + radius * Math.cos(angle)}"
                        y2="${centerY + radius * Math.sin(angle)}"
                        stroke="#ddd"
                        stroke-width="1"
                    />
                `;
    }).join('')}
            
            <!-- Skill area -->
            <path
                d="${skills.map((skill, i) => {
        const angle = (i * 2 * Math.PI / skills.length) - Math.PI / 2;
        const value = (skill.amount / maxAmount) * radius;
        const x = centerX + value * Math.cos(angle);
        const y = centerY + value * Math.sin(angle);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + 'Z'}"
                fill="rgba(40, 167, 69, 0.3)"
                stroke="#28a745"
                stroke-width="2"
            />
            
            <!-- Skill points -->
            ${skills.map((skill, i) => {
        const angle = (i * 2 * Math.PI / skills.length) - Math.PI / 2;
        const value = (skill.amount / maxAmount) * radius;
        const x = centerX + value * Math.cos(angle);
        const y = centerY + value * Math.sin(angle);
        return `
                    <circle
                        cx="${x}"
                        cy="${y}"
                        r="4"
                        fill="#28a745"
                    />
                `;
    }).join('')}
            
            <!-- Labels -->
            ${skills.map((skill, i) => {
        const angle = (i * 2 * Math.PI / skills.length) - Math.PI / 2;
        const labelRadius = radius + 30;
        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);

        // Determine text anchor based on position
        let textAnchor;
        if (angle < -Math.PI / 2 || angle > Math.PI / 2) {
            textAnchor = 'end';
        } else if (angle === -Math.PI / 2 || angle === Math.PI / 2) {
            textAnchor = 'middle';
        } else {
            textAnchor = 'start';
        }

        return `
            <text
                x="${labelX}"
                y="${labelY}"
                text-anchor="${textAnchor}"
                class="tech-skill-label"
                dominant-baseline="middle"
            >${skill.skill}</text>
        `;
    }).join('')}
        </svg>
    `;

    container.innerHTML = svg;
}
