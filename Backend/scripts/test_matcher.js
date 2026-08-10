// Quick test for Python matcher script
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cvText = `Artificial Intelligence undergraduate with experience in back-end and full-stack development using Node.js, Express.js, and
MongoDB. Skilled in RESTful API design, role-based access control, and database optimization with practical exposure to realtime data processing and scalable architectures.`;

const jobDescriptions = [
    `Back-End Developer (Node.js & Express) As a Back-End Developer, you will be responsible for designing and building scalable RESTful APIs and managing server-side logic and database interactions. Skills: Node.js, Express.js, MongoDB/MySQL, JWT, Git, REST API design, Error handling, Performance optimization.`
];

async function testMatcher() {
    console.log('🧪 Testing Python Matcher...\n');

    const scriptPath = path.join(__dirname, 'match_jobs.py');
    const python = spawn('python', [scriptPath]);

    let outputData = '';
    let errorData = '';

    const input = JSON.stringify({
        cv_text: cvText,
        job_descriptions: jobDescriptions,
        top_k: 10
    });

    python.stdin.write(input);
    python.stdin.end();

    python.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    python.stderr.on('data', (data) => {
        errorData += data.toString();
        console.log('📝 Python log:', data.toString());
    });

    python.on('close', (code) => {
        console.log(`\n🏁 Process exited with code: ${code}\n`);

        if (code !== 0) {
            console.error('❌ Error:', errorData);
            return;
        }

        try {
            const result = JSON.parse(outputData);
            console.log('✅ Success:', result.success);
            console.log('📊 Matches:', JSON.stringify(result.matches, null, 2));
        } catch (e) {
            console.error('❌ Failed to parse output:', outputData);
            console.error('Parse error:', e.message);
        }
    });
}

testMatcher().catch(console.error);
