# Backend Runtime & Deployment Audit

## 1. BACKEND SERVICE IDENTIFICATION

* **Backend directory/path:** `e:\CV\Backend`
* **Backend name:** `ai-based-cv-classification-and-matching-system-backend`
* **Programming language:** JavaScript
* **Framework:** Node.js with Express.js
* **Runtime:** Node.js
* **Runtime version required/recommended:** `node:20-alpine` (Based on existing Dockerfile)
* **Package manager:** npm
* **Entry point:** `server.js`
* **Main application file:** `server.js`
* **Main source directory:** `e:\CV\Backend`
* **Build output directory:** NOT FOUND (The project runs directly from source)

**Overall Responsibility:**
The Backend serves as the primary API for the HR Dashboard application. It handles user authentication, job and candidate management, handles multipart file uploads for resumes (PDFs), stores and retrieves resumes from MongoDB via GridFS, and acts as an orchestration layer to route requests to external Python ML/AI microservices (Matchers and Classifiers) and third-party APIs (Groq). 

---

## 2. PROJECT / MONOREPO STRUCTURE

* **Structure:** The Backend is part of a workspace-based monorepo.
* **Root package.json:** Exists at `e:\CV\package.json` and declares workspaces for `"Backend"` and `"Frontend"`.
* **Backend package.json:** Exists at `e:\CV\Backend\package.json`.
* **Lockfiles:** There is a `package-lock.json` at the project root AND at `e:\CV\Backend\package-lock.json`.
* **Workspace configuration:** Defined in the root `package.json` using npm workspaces.

**Dependency Resolution:**
While it is part of a monorepo, the Backend has its own `package-lock.json` and can have its dependencies installed directly from the `Backend` directory using `npm install`.

---

## 3. PACKAGE.JSON ANALYSIS

### Dependencies
* **Core Web:** `express`, `cors`, `cookie-parser`, `form-data`, `multer`
* **Database:** `mongoose`
* **Security & Auth:** `bcrypt`, `bcryptjs`, `jsonwebtoken`
* **Utility:** `axios` (HTTP requests to ML services), `dotenv` (env vars), `express-validator`
* **Parsing:** `pdf-parse`

### Dev Dependencies
* `nodemon`

### Scripts
* `start`: `node server.js` - Runs the application using standard Node.js. Intended for **production**.
* `dev`: `nodemon server.js` - Runs the application with hot-reloading. Intended for **development**.

**Production Start Command:**
The exact command to start the Backend in a production environment is:
`node server.js` (or `npm start`)

---

## 4. DEVELOPMENT RUNTIME

* **Command:** `npm run dev` (which executes `nodemon server.js`)
* **Working Directory:** `e:\CV\Backend`
* **Required Services:** MongoDB, and optionally the 4 Python ML services.
* **Required Ports:** `5000` (default)
* **Hot Reload:** Yes (via `nodemon`)
* **Compilation:** No build required (it's pure ES Modules JavaScript).

**Development Workflow:**
1. Developer runs `npm install` inside the Backend or root.
2. Developer ensures MongoDB is running locally.
3. Developer runs `npm run dev` in the `Backend` directory.
4. Environment variables are loaded from `.env`.

---

## 5. PRODUCTION RUNTIME

* **Is a build required?** No. 
* **Command that starts the server:** `node server.js`
* **Artifact:** It runs standard JavaScript source code directly.
* **DevDependencies required?** No.
* **Special OS packages:** None explicitly required, but `bcrypt` sometimes requires Python/make for native compilation if pre-built binaries for the target OS architecture are unavailable.

```text
Development Runtime (nodemon server.js)
vs.
Production Runtime (node server.js)
```

---

## 6. PORT AND NETWORK BINDING

* **Listening Port:** `5000` (default)
* **Configurable:** Yes, via `PORT` environment variable.
* **Host Binding:** `app.listen(PORT, ...)` defaults to `0.0.0.0` (all interfaces) in Node.js.
* **API Base Path:** `/api` (e.g., `/api/auth`, `/api/jobs`)
* **Health Endpoint:** The root path `/` returns a JSON object confirming the server is running.

The current binding will work correctly inside a Docker container without modification.

---

## 7. ENVIRONMENT VARIABLES

| Variable | Purpose | Required? | Default? | Secret? | Used By |
| -------- | ------- | --------- | -------- | ------- | ------- |
| `PORT` | Server listening port | No | 5000 | No | `server.js` |
| `NODE_ENV` | Environment identifier | No | 'development' | No | `server.js` (to serve static files) |
| `MONGODB_URI` | Database connection string | No | `mongodb://localhost:27017/cv_project_db` | Yes | `config/database.js` |
| `JWT_SECRET` | Secret key for JWT signing | **Yes** | None | **Yes** | Auth middleware/controllers |
| `CORS_ORIGIN` | Allowed CORS origin | No | Not enforced in code | No | Not strictly used in `cors()` init |
| `ML_HOST` | URL for Model 1 (CV Matcher) | No | `http://localhost:5001` | No | `mlController.js` |
| `CV_CLASSIFIER_URL`| URL for Model 2 (Classifier) | No | `http://localhost:5002` | No | `mlController.js` |
| `SKILL_MATCHER_URL`| URL for Model 3 (Skill Analyzer)| No | `http://localhost:5003` | No | `mlController.js` |
| `CHAT_MODEL_URL` | URL for Model 4 (Chat) | No | `http://localhost:5004` | No | `mlController.js` |
| `GROQ_API_KEY` | Auth key for Groq API | No | None | **Yes** | `mlController.js` |
| `GROQ_API_URL` | Groq API Endpoint | No | `https://api.groq.com/...` | No | `mlController.js` |
| `GROQ_MODEL` | LLM Model name | No | `llama-3.3-70b-versatile` | No | `mlController.js` |
| `USE_PYTHON_MATCHER` | ML Config toggle | No | None | No | `.env.example` |

*Loaded via:* `dotenv.config()` at the very top of `server.js`.

---

## 8. DATABASE DEPENDENCIES

* **Database Type:** MongoDB
* **Driver/ODM:** Mongoose (`mongoose`)
* **Connection Logic:** Initialized in `config/database.js`. Uses `mongoose.connect()`.
* **GridFS:** Uses `GridFSBucket` from `mongodb` native driver (via Mongoose connection) to store resumes in chunks.
* **Failure Behavior:** If the database fails to connect at startup, the process explicitly calls `process.exit(1)`.
* **Retries:** NOT FOUND.
* **Migrations/Seeds:** NOT FOUND (Mongoose handles schema creation dynamically).

**Flow:**
```text
Backend startup (server.js)
        ↓
Database connection (config/database.js)
        ↓
Connection validation (process.exit on failure)
        ↓
GridFS Initialization (config/gridfs.js)
        ↓
Application accepts requests
```

---

## 9. REDIS / CACHE / QUEUE DEPENDENCIES

NOT FOUND.

---

## 10. AI / ML SERVICE DEPENDENCIES

The Backend acts as a gateway to multiple external Python-based Machine Learning services over HTTP (via Axios).

* **Model 1 (CV-Job Matcher):** `ML_HOST` (`/match-jobs`). 
* **Model 2 (CV Classifier):** `CV_CLASSIFIER_URL` (`/classify`).
* **Model 3 (Skill Analyzer):** `SKILL_MATCHER_URL` (`/analyze`).
* **Model 4 (Chat Model):** `CHAT_MODEL_URL` (`/chat`).

**Behavior:**
All ML services are called during specific API requests (e.g. `POST /api/ml/match-jobs`).
If an ML service is unavailable (HTTP timeout/error), the Backend catches the error gracefully and either returns a HTTP Error OR falls back to a basic JavaScript implementation (e.g., Javascript Hybrid Matcher for Model 1, basic keyword matching for Model 3).

```text
Backend (Node.js)
   |
   +----> Model 1 (CV Matcher) HTTP
   |
   +----> Model 2 (CV Classifier) HTTP
   |
   +----> Model 3 (Skill Analyzer) HTTP
   |
   +----> Model 4 (Chatbot) HTTP
```

---

## 11. FILE STORAGE / UPLOADS

* **Upload Handler:** `multer` 
* **Storage Type:** Memory (`multer.memoryStorage()`)
* **Persistent Storage:** MongoDB (GridFS via `GridFSBucket`)

**Behavior:**
Files (resumes) are uploaded as `multipart/form-data`, held temporarily in RAM (`req.file.buffer`), and then streamed directly into MongoDB GridFS.
*No local persistent filesystem directories are required for file storage.* 
A Docker Volume for local uploads is NOT needed.

---

## 12. EXTERNAL SERVICES AND APIs

* **Groq API:** Used in `chatModel` controller as an LLM provider if `GROQ_API_KEY` is present. Connects via HTTP. Required for runtime only (optional, falls back to Model 4 if key is absent).

---

## 13. CORS AND FRONTEND COMMUNICATION

* **CORS Configuration:** `app.use(cors())` is used without specific origin restrictions in code (allows all origins by default).
* **Serving Frontend:** 
In `server.js`, there is a block:
```javascript
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../Frontend/dist");
  app.use(express.static(distPath));
  ...
}
```
In production mode, the Backend expects the built React frontend to exist at `../Frontend/dist` relative to the `Backend` directory.

---

## 14. AUTHENTICATION AND SECURITY CONFIGURATION

* **Mechanism:** JWT (JSON Web Tokens)
* **Tokens:** Passed via headers (`Authorization: Bearer <token>`)
* **Password Hashing:** `bcrypt` / `bcryptjs`
* **Middleware:** `protect` (verifies JWT) and `authorizeRoles("hr", "employee")`
* **Rate Limiting / Helmet:** NOT FOUND.

---

## 15. HEALTH CHECKS

* **Endpoint:** `GET /`
* **Behavior:** Returns a JSON object with `{ message: "✅ HR Dashboard Backend - Server is running!", availableEndpoints: {...} }`
* **Deep Checks:** It does NOT check MongoDB connectivity or ML service status. It only checks that the Express process is alive.

---

## 16. LOGGING

* **Library:** Standard `console.log`, `console.error`, `console.warn`
* **Log Files:** NOT FOUND. Logs are written exclusively to `stdout`/`stderr`.
* **Container Compatibility:** 100% compatible with Docker logging drivers.

---

## 17. ERROR HANDLING AND PROCESS BEHAVIOR

* **Global Error Handler:** Custom `errorHandler` and `notFound` middleware.
* **Process Exit:** Will crash (`process.exit(1)`) if MongoDB fails to connect on startup.
* **Graceful Shutdown (SIGTERM/SIGINT):** NOT FOUND. The process will be forcefully killed by Docker.

---

## 18. BUILD REQUIREMENTS

* **Build Command:** None.
* **Source Code:** ES6 Modules JavaScript (`"type": "module"`).
* **Execution:** Runs directly via `node`.

```text
Source Code -> npm install -> Production Runtime
```

---

## 19. NATIVE / OS-LEVEL DEPENDENCIES

* **Native Modules:** `bcrypt` can require Python and `make`/`gcc` to compile native C++ bindings if prebuilt binaries are unavailable for Alpine Linux. Usually, `bcryptjs` is a safe JS fallback, but both are in `package.json`.
* **Other OS Packages:** None explicitly required.

---

## 20. BACKGROUND PROCESSES / WORKERS

NOT FOUND.

---

## 21. DEPENDENCY GRAPH

```text
                 ┌───────────────┐
                 │   Frontend    │
                 └───────┬───────┘
                         │ HTTP / REST
                         ▼
                 ┌───────────────┐
                 │    Backend    │
                 │   (Node.js)   │
                 └───────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      MongoDB        ML Services     Groq API
      (GridFS)       (Python x4)     (Optional)
```

---

## 22. CONTAINERIZATION REQUIREMENTS

### Build Requirements
* **Base Runtime:** Node.js. Alpine is fine.
* **Package Manager:** `npm`
* **Build Command:** None, only `npm install`.

### Runtime Requirements
* **Production Start Command:** `npm start` or `node server.js`
* **Port:** `5000`
* **Environment Variables:** `JWT_SECRET`, `MONGODB_URI`, `ML_HOST`, etc.
* **Filesystem:** No persistent volumes needed (uploads go to MongoDB).

### Networking Requirements
* Must be able to reach MongoDB.
* Must be able to reach ML Services over HTTP.

---

## 23. DOCKERFILE DESIGN NOTES — NO DOCKERFILE

* **Single vs Multi-stage:** A single-stage Dockerfile is sufficient since there is no build step.
* **Files to Copy:** `package.json`, `package-lock.json`, and all source files.
* **Working Directory:** `/app`
* **Production Command:** `CMD ["node", "server.js"]`

---

## 24. DOCKERIGNORE REQUIREMENTS — NO .DOCKERIGNORE

* **CONFIRMED SHOULD EXCLUDE:**
  * `node_modules` (Must be rebuilt inside the container)
  * `.env` (Secrets should not be baked into the image)
  * `.git` (Bloat)
  * `*.log` (Bloat)

---

## 25. PRODUCTION READINESS OBSERVATIONS

### Critical
* **Static File Serving Path:** In `server.js`, `NODE_ENV=production` assumes `../Frontend/dist` exists. If the Backend is containerized independently of the Frontend, this path will not exist inside the container, causing a crash or 404s. **Fix required:** Either disable static serving in containerized mode (let Nginx handle frontend), or copy the built frontend into the backend container during build.

### Important
* **Startup Crash on DB Failure:** If the container starts before MongoDB is ready, `process.exit(1)` will kill the container. Docker Compose `depends_on` or automatic restart policies (`restart: always`) are required.

### Minor
* **Graceful Shutdown:** Missing SIGTERM handling means Docker will wait 10 seconds and then forcefully kill the Node process, potentially interrupting active uploads to GridFS.

---

## 26. FINAL BACKEND RUNTIME SUMMARY

| Category                       | Confirmed Value |
| ------------------------------ | --------------- |
| Language                       | JavaScript (ES Modules) |
| Framework                      | Express.js |
| Runtime Version                | Node.js |
| Package Manager                | npm |
| Build Command                  | None |
| Production Start Command       | `node server.js` |
| Port                           | `5000` (default) |
| Host Binding                   | `0.0.0.0` (all interfaces) |
| Database                       | MongoDB (Mongoose + GridFS) |
| Redis                          | NOT FOUND |
| AI Services                    | 4 Python HTTP Services |
| Storage                        | MongoDB GridFS (No local FS) |
| Health Endpoint                | `GET /` |
| Build Output                   | NOT FOUND |
| Native Dependencies            | `bcrypt` (potentially) |
| Required Environment Variables | `JWT_SECRET` |
| External Services              | Groq API (Optional) |
| Background Workers             | NOT FOUND |

---

## 27. EXACT PRODUCTION STARTUP FLOW

1. Container executes `node server.js`
2. `dotenv.config()` loads environment variables.
3. `connectDB()` connects to MongoDB asynchronously.
   - If connection fails, process exits.
4. `initGridFS()` initializes the GridFS bucket.
5. Express app is instantiated.
6. Middleware (CORS, body parser, multer) is applied.
7. Routes are registered.
8. If `NODE_ENV === "production"`, static file serving for `../Frontend/dist` is registered.
9. Missing required env vars (`JWT_SECRET`) trigger a console warning, but do NOT halt startup.
10. `app.listen(PORT)` binds to the port.
11. Server logs readiness and accepts requests.
