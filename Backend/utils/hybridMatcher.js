/**
 * REAL CV-Job Matching System
 * Extracts skills from job description and compares with CV skills
 * Returns realistic match percentages
 */

/**
 * MASTER LIST of all technical skills to look for
 * Organized by category for better matching
 */
const SKILLS_DATABASE = {
    // Programming Languages
    languages: [
        'javascript', 'typescript', 'python', 'java', 'csharp', 'c#', 'cpp', 'c++',
        'ruby', 'php', 'golang', 'go', 'rust', 'swift', 'kotlin', 'scala',
        'r', 'matlab', 'perl', 'lua', 'dart', 'objective-c',
        'html', 'css', 'sass', 'scss', 'less'
    ],

    // Frontend Frameworks & Libraries
    frontend: [
        'react', 'reactjs', 'angular', 'angularjs', 'vue', 'vuejs', 'vue.js',
        'nextjs', 'next.js', 'nuxt', 'nuxtjs', 'gatsby', 'svelte',
        'jquery', 'bootstrap', 'tailwind', 'tailwindcss', 'material-ui', 'mui',
        'redux', 'mobx', 'zustand', 'webpack', 'vite', 'babel', 'eslint'
    ],

    // Backend Frameworks
    backend: [
        'nodejs', 'node.js', 'express', 'expressjs', 'fastify', 'nestjs', 'koa',
        'django', 'flask', 'fastapi', 'spring', 'springboot', 'spring boot',
        'laravel', 'symfony', 'rails', 'ruby on rails', 'asp.net', 'dotnet', '.net',
        'gin', 'echo', 'fiber'
    ],

    // Databases
    databases: [
        'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
        'sqlite', 'oracle', 'mssql', 'sql server', 'mariadb', 'cassandra',
        'dynamodb', 'firestore', 'firebase', 'supabase', 'prisma', 'sequelize',
        'mongoose', 'typeorm', 'sql', 'nosql', 'graphql'
    ],

    // Cloud & DevOps
    devops: [
        'aws', 'amazon web services', 'azure', 'gcp', 'google cloud',
        'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins',
        'gitlab ci', 'github actions', 'circleci', 'travis',
        'nginx', 'apache', 'linux', 'ubuntu', 'centos', 'bash', 'shell',
        'ci/cd', 'cicd', 'devops', 'prometheus', 'grafana', 'elk', 'datadog'
    ],

    // Mobile Development
    mobile: [
        'react native', 'flutter', 'swift', 'swiftui', 'kotlin', 'android',
        'ios', 'xcode', 'android studio', 'ionic', 'cordova', 'xamarin'
    ],

    // AI/ML/Data Science
    datascience: [
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
        'scikit-learn', 'sklearn', 'pandas', 'numpy', 'scipy', 'matplotlib',
        'nlp', 'natural language processing', 'computer vision', 'opencv',
        'neural network', 'ai', 'artificial intelligence', 'data science',
        'data analysis', 'data engineering', 'spark', 'hadoop', 'tableau',
        'power bi', 'jupyter'
    ],

    // Testing
    testing: [
        'jest', 'mocha', 'chai', 'jasmine', 'cypress', 'selenium', 'playwright',
        'pytest', 'unittest', 'junit', 'testing', 'unit testing', 'e2e',
        'integration testing', 'tdd', 'bdd'
    ],

    // Version Control & Tools
    tools: [
        'git', 'github', 'gitlab', 'bitbucket', 'svn',
        'jira', 'confluence', 'trello', 'slack', 'figma', 'postman',
        'swagger', 'api', 'rest', 'restful', 'soap', 'grpc', 'websocket'
    ],

    // Methodologies
    methodologies: [
        'agile', 'scrum', 'kanban', 'waterfall', 'lean',
        'microservices', 'monolithic', 'serverless', 'event-driven',
        'oop', 'functional programming', 'design patterns', 'solid'
    ],

    // Security
    security: [
        'oauth', 'jwt', 'authentication', 'authorization', 'security',
        'encryption', 'ssl', 'tls', 'https', 'owasp', 'penetration testing',
        'cybersecurity'
    ]
};

// Flatten all skills into one set for quick lookup
const ALL_SKILLS = new Set();
Object.values(SKILLS_DATABASE).forEach(skills => {
    skills.forEach(skill => {
        ALL_SKILLS.add(skill.toLowerCase());
    });
});

/**
 * Normalize text for comparison
 */
function normalizeText(text) {
    return (text || '')
        .toLowerCase()
        .replace(/node\.?js/gi, 'nodejs')
        .replace(/react\.?js/gi, 'react')
        .replace(/vue\.?js/gi, 'vue')
        .replace(/next\.?js/gi, 'nextjs')
        .replace(/c\+\+/g, 'cpp')
        .replace(/c#/g, 'csharp')
        .replace(/\.net/g, 'dotnet');
}

/**
 * Extract skills from text
 * Returns array of found skills
 */
function extractSkills(text) {
    const normalized = normalizeText(text);
    const foundSkills = new Set();

    // Check each skill in our database
    Object.values(SKILLS_DATABASE).forEach(skills => {
        skills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            // Create regex with word boundaries for accurate matching
            try {
                const escaped = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                if (regex.test(normalized)) {
                    foundSkills.add(skillLower);
                }
            } catch (e) {
                // Simple includes check as fallback
                if (normalized.includes(skillLower)) {
                    foundSkills.add(skillLower);
                }
            }
        });
    });

    return Array.from(foundSkills);
}

/**
 * Check if two skills are similar/equivalent
 */
function areSkillsSimilar(skill1, skill2) {
    const s1 = skill1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = skill2.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Exact match
    if (s1 === s2) return true;

    // Common equivalents
    const equivalents = {
        'nodejs': ['node', 'expressjs', 'express'],
        'javascript': ['js'],
        'typescript': ['ts'],
        'postgresql': ['postgres'],
        'mongodb': ['mongo'],
        'kubernetes': ['k8s'],
        'react': ['reactjs'],
        'vue': ['vuejs'],
        'angular': ['angularjs'],
        'python': ['py'],
        'golang': ['go'],
    };

    for (const [main, aliases] of Object.entries(equivalents)) {
        if ((s1 === main || aliases.includes(s1)) && (s2 === main || aliases.includes(s2))) {
            return true;
        }
    }

    return false;
}

/**
 * Calculate match percentage between CV skills and Job Description skills ONLY
 * IGNORES requiredSkills from HR - uses ONLY skills extracted from job description text
 */
function calculateSkillMatch(cvSkills, jobDescriptionSkills) {
    // Use ONLY skills extracted from job description - not HR's requiredSkills
    const jobSkills = [...new Set(jobDescriptionSkills.map(s => s.toLowerCase()))];

    if (jobSkills.length === 0) {
        return {
            percentage: 0,
            matched: [],
            missing: [],
            total: 0,
            matchedCount: 0,
            details: 'No skills found in job description'
        };
    }

    const cvSkillsSet = new Set(cvSkills.map(s => s.toLowerCase()));

    const matched = [];
    const missing = [];

    jobSkills.forEach(jobSkill => {
        let found = false;

        // Check for exact or similar match
        for (const cvSkill of cvSkillsSet) {
            if (areSkillsSimilar(jobSkill, cvSkill)) {
                matched.push(jobSkill);
                found = true;
                break;
            }
        }

        if (!found) {
            missing.push(jobSkill);
        }
    });

    const totalRequired = jobSkills.length;
    const matchedCount = matched.length;

    // Simple percentage: matched / total from job description
    const percentage = (matchedCount / totalRequired) * 100;

    return {
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
        matched,
        missing,
        total: totalRequired,
        matchedCount,
        details: `Matched ${matchedCount}/${totalRequired} skills from job description`
    };
}

/**
 * Main matching function
 * @param {string} cvText - The CV text
 * @param {Array} jobs - Array of job objects
 * @param {number} topK - Number of top matches to return
 */
function hybridMatch(cvText, jobs, topK = 10) {
    console.log('🔍 Starting REAL Skill-Based Matching...');
    console.log(`📄 CV Length: ${cvText.length} characters`);
    console.log(`💼 Jobs to match: ${jobs.length}`);

    // Extract skills from CV
    const cvSkills = extractSkills(cvText);
    console.log(`\n📋 CV Skills Found (${cvSkills.length}):`);
    console.log(`   ${cvSkills.join(', ')}`);

    // Process each job
    const scoredJobs = jobs.map((job, idx) => {
        // Get job description ONLY - this is what we use for matching
        const jobDescription = job.description || '';
        const title = (job.title || '').toLowerCase();

        // Extract skills from job description TEXT ONLY
        // We IGNORE job.requiredSkills - only use what's in the description
        const jobDescSkills = extractSkills(jobDescription);

        // Calculate skill match based on job description ONLY
        const matchResult = calculateSkillMatch(cvSkills, jobDescSkills);

        // Log first 5 jobs for debugging
        if (idx < 5) {
            console.log(`\n📊 Job ${idx + 1}: "${job.title}"`);
            console.log(`   Skills from Description: [${jobDescSkills.join(', ')}]`);
            console.log(`   ✅ Matched: [${matchResult.matched.join(', ')}]`);
            console.log(`   ❌ Missing: [${matchResult.missing.join(', ')}]`);
            console.log(`   📈 Score: ${matchResult.percentage}% (${matchResult.matchedCount}/${matchResult.total})`);
        }

        // Apply domain filtering - if completely unrelated domain, score = 0
        const isUnrelatedDomain = /(marketing manager|accountant|accounting|financial analyst|sales manager|hr manager|recruiter|graphic design|copywriter|nurse|doctor|lawyer|teacher|chef)/.test(title);
        if (isUnrelatedDomain) {
            return { job, matchScore: 0, matchResult };
        }

        // DevOps jobs need DevOps skills
        const isDevOps = /(devops|sre|site reliability|infrastructure|platform engineer|cloud engineer)/.test(title);
        if (isDevOps) {
            const devopsSkills = ['docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'aws', 'azure', 'gcp', 'cicd', 'ci/cd', 'devops'];
            const hasDevOps = matchResult.matched.some(skill =>
                devopsSkills.some(ds => areSkillsSimilar(skill, ds))
            );
            if (!hasDevOps) {
                // No DevOps skills at all = very low score
                return { job, matchScore: Math.min(matchResult.percentage * 0.2, 10), matchResult };
            }
        }

        // Data Science jobs need DS skills
        const isDataScience = /(data scientist|machine learning|ml engineer|ai engineer|data engineer|data analyst)/.test(title);
        if (isDataScience) {
            const dsSkills = ['python', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'machine learning', 'deep learning', 'data science', 'sql', 'keras', 'scikit-learn'];
            const hasDS = matchResult.matched.some(skill =>
                dsSkills.some(ds => areSkillsSimilar(skill, ds))
            );
            if (!hasDS) {
                return { job, matchScore: Math.min(matchResult.percentage * 0.2, 10), matchResult };
            }
        }

        // Mobile jobs need mobile skills
        const isMobile = /(ios developer|android developer|mobile developer|flutter developer|react native developer)/.test(title);
        if (isMobile) {
            const mobileSkills = ['ios', 'android', 'flutter', 'react native', 'swift', 'kotlin', 'mobile', 'xcode'];
            const hasMobile = matchResult.matched.some(skill =>
                mobileSkills.some(ms => areSkillsSimilar(skill, ms))
            );
            if (!hasMobile) {
                return { job, matchScore: Math.min(matchResult.percentage * 0.2, 10), matchResult };
            }
        }

        return {
            job,
            matchScore: matchResult.percentage,
            matchResult
        };
    });

    // Sort by score descending
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Return top K
    const topMatches = scoredJobs.slice(0, topK);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ TOP ${Math.min(topMatches.length, 5)} MATCHES:`);
    console.log(`${'='.repeat(50)}`);
    topMatches.slice(0, 5).forEach((match, idx) => {
        const mr = match.matchResult;
        console.log(`${idx + 1}. "${match.job.title}"`);
        console.log(`   Score: ${match.matchScore}% (${mr?.matchedCount || 0}/${mr?.total || 0} skills matched)`);
        if (mr?.matched?.length > 0) {
            console.log(`   Matched: ${mr.matched.slice(0, 5).join(', ')}${mr.matched.length > 5 ? '...' : ''}`);
        }
    });

    return topMatches;
}

/**
 * Match CVs to a single Job Description (for HR)
 * Reverse of hybridMatch - matches multiple CVs against ONE job
 * @param {string} jobDescription - The job description text
 * @param {Array} candidates - Array of candidate objects with resumeText
 * @param {number} topK - Number of top matches to return
 */
function hybridMatchCVsToJob(jobDescription, candidates, topK = 10) {
    console.log('🔍 Starting REAL Skill-Based CV Matching (HR)...');
    console.log(`💼 Job Description Length: ${jobDescription.length} characters`);
    console.log(`👥 Candidates to match: ${candidates.length}`);

    // Extract skills from job description
    const jobSkills = extractSkills(jobDescription);
    console.log(`\n📋 Job Skills Required (${jobSkills.length}):`);
    console.log(`   ${jobSkills.join(', ')}`);

    if (jobSkills.length === 0) {
        console.log('⚠️ No skills found in job description, using text similarity');
    }

    // Process each candidate
    const scoredCandidates = candidates.map((candidate, idx) => {
        const cvText = candidate.resumeText || '';

        // Extract skills from CV
        const cvSkills = extractSkills(cvText);

        // Calculate skill match
        const matchResult = calculateSkillMatch(cvSkills, jobSkills);

        // Log first 5 candidates for debugging
        if (idx < 5) {
            console.log(`\n📊 Candidate ${idx + 1}: "${candidate.name}"`);
            console.log(`   CV Skills: [${cvSkills.slice(0, 10).join(', ')}${cvSkills.length > 10 ? '...' : ''}]`);
            console.log(`   ✅ Matched: [${matchResult.matched.join(', ')}]`);
            console.log(`   ❌ Missing: [${matchResult.missing.join(', ')}]`);
            console.log(`   📈 Score: ${matchResult.percentage}% (${matchResult.matchedCount}/${matchResult.total})`);
        }

        return {
            candidate,
            matchScore: matchResult.percentage,
            matchResult
        };
    });

    // Sort by score descending
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    // Return top K
    const topMatches = scoredCandidates.slice(0, topK);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ TOP ${Math.min(topMatches.length, 5)} CV MATCHES:`);
    console.log(`${'='.repeat(50)}`);
    topMatches.slice(0, 5).forEach((match, idx) => {
        const mr = match.matchResult;
        console.log(`${idx + 1}. "${match.candidate.name}"`);
        console.log(`   Score: ${match.matchScore}% (${mr?.matchedCount || 0}/${mr?.total || 0} skills matched)`);
        if (mr?.matched?.length > 0) {
            console.log(`   Matched: ${mr.matched.slice(0, 5).join(', ')}${mr.matched.length > 5 ? '...' : ''}`);
        }
    });

    return topMatches;
}

export { hybridMatch, hybridMatchCVsToJob, extractSkills, calculateSkillMatch };
