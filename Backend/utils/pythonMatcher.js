/**
 * Persistent Python Matcher Manager
 * Keeps Python process alive for fast BERT matching
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PythonMatcherService {
    constructor() {
        this.pythonProcess = null;
        this.isReady = false;
        this.requestQueue = [];
        this.currentRequest = null;
    }

    start() {
        return new Promise((resolve, reject) => {
            if (this.pythonProcess) {
                console.log('⚠️  Python service already running');
                return resolve();
            }

            const scriptPath = path.join(__dirname, '..', 'scripts', 'matcher_service.py');
            const scriptsDir = path.join(__dirname, '..', 'scripts');
            console.log('🐍 Starting persistent Python BERT Matcher Service...');
            console.log('   Script:', scriptPath);
            console.log('   CWD:', scriptsDir);

            this.pythonProcess = spawn('python', [scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false,
                cwd: scriptsDir,  // Run from scripts directory for correct paths
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }  // Fix Unicode encoding
            });

            let outputBuffer = '';
            let errorBuffer = '';

            this.pythonProcess.stdout.on('data', (data) => {
                outputBuffer += data.toString();

                // Process complete JSON responses (one per line)
                const lines = outputBuffer.split('\n');
                outputBuffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const response = JSON.parse(line);
                            this._handleResponse(response);
                        } catch (e) {
                            console.error('❌ Failed to parse Python response:', line);
                        }
                    }
                }
            });

            this.pythonProcess.stderr.on('data', (data) => {
                const message = data.toString();
                errorBuffer += message;
                console.log('🐍 Python:', message.trim());

                // Check if service is ready
                if (message.includes('Service ready')) {
                    this.isReady = true;
                    console.log('✅ Python BERT service is ready!');
                    resolve();
                }
            });

            this.pythonProcess.on('close', (code) => {
                console.log(`🐍 Python service exited with code ${code}`);
                this.isReady = false;
                this.pythonProcess = null;

                // Reject all pending requests
                if (this.currentRequest) {
                    this.currentRequest.reject(new Error('Python service terminated'));
                    this.currentRequest = null;
                }

                for (const req of this.requestQueue) {
                    req.reject(new Error('Python service terminated'));
                }
                this.requestQueue = [];
            });

            this.pythonProcess.on('error', (error) => {
                console.error('❌ Python service error:', error);
                reject(error);
            });

            // Timeout for startup
            setTimeout(() => {
                if (!this.isReady) {
                    reject(new Error('Python service startup timeout (60s)'));
                }
            }, 60000); // 60 second startup timeout for BERT loading
        });
    }

    async match(cvText, jobDescriptions, topK = 10) {
        if (!this.isReady) {
            throw new Error('Python service not ready. Call start() first.');
        }

        return new Promise((resolve, reject) => {
            const request = {
                cv_text: cvText,
                job_descriptions: jobDescriptions,
                top_k: topK
            };

            const requestData = {
                request,
                resolve,
                reject,
                timestamp: Date.now()
            };

            // Queue the request
            this.requestQueue.push(requestData);

            // Process queue if no current request
            if (!this.currentRequest) {
                this._processNextRequest();
            }
        });
    }

    _processNextRequest() {
        if (this.requestQueue.length === 0) {
            this.currentRequest = null;
            return;
        }

        this.currentRequest = this.requestQueue.shift();
        const requestJson = JSON.stringify(this.currentRequest.request) + '\n';

        try {
            this.pythonProcess.stdin.write(requestJson);
        } catch (error) {
            this.currentRequest.reject(error);
            this.currentRequest = null;
            this._processNextRequest();
        }
    }

    _handleResponse(response) {
        if (!this.currentRequest) {
            console.error('❌ Received response without pending request');
            return;
        }

        if (response.success) {
            this.currentRequest.resolve(response.matches);
        } else {
            this.currentRequest.reject(new Error(response.error || 'Python matcher failed'));
        }

        // Process next request
        this._processNextRequest();
    }

    stop() {
        if (this.pythonProcess) {
            console.log('🛑 Stopping Python service...');
            this.pythonProcess.stdin.write('QUIT\n');

            setTimeout(() => {
                if (this.pythonProcess) {
                    this.pythonProcess.kill();
                }
            }, 2000);
        }
    }
}

// Singleton instance
let serviceInstance = null;

export function getPythonMatcher() {
    if (!serviceInstance) {
        serviceInstance = new PythonMatcherService();
    }
    return serviceInstance;
}

// Cleanup on process exit
process.on('exit', () => {
    if (serviceInstance) {
        serviceInstance.stop();
    }
});

process.on('SIGINT', () => {
    if (serviceInstance) {
        serviceInstance.stop();
    }
    process.exit(0);
});
