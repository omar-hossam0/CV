# HR Dashboard Backend API

Backend system for AI-based CV Classification and Matching System with comprehensive HR management features.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Job Management**: CRUD operations for job postings with search and filtering
- **Candidate Management**: Comprehensive candidate profiles with application tracking
- **Company Profiles**: Company information and branding management
- **Analytics Dashboard**: Real-time metrics, charts, and insights
- **Notifications System**: User notifications with read/unread status
- **AI Matching**: Calculate match percentage between candidates and jobs
- **Input Validation**: Robust validation for all endpoints
- **Error Handling**: Centralized error handling middleware

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM 8.19.1
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Security**: bcryptjs 3.0.2, CORS 2.8.5
- **Validation**: express-validator 7.2.1

## 🛠️ Installation

```bash
# Navigate to Backend directory
cd Backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update environment variables in .env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
NODE_ENV=development
```

## 🏃 Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start

# Test database connection
node testDB.js
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

---

## 🔐 Authentication Endpoints

### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "hr"
}
```

### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User Profile

```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Update Profile

```http
PUT /api/auth/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### Update Password

```http
PATCH /api/auth/me/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

### Delete Account

```http
DELETE /api/auth/me
Authorization: Bearer {token}
```

---

## 💼 Job Endpoints (HR Only)

### Get All Jobs

```http
GET /api/jobs
Authorization: Bearer {token}
```

### Get Single Job

```http
GET /api/jobs/:id
Authorization: Bearer {token}
```

### Create Job

```http
POST /api/jobs
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Senior Full Stack Developer",
  "description": "We are looking for an experienced full stack developer...",
  "department": "Engineering",
  "requiredSkills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "experienceLevel": "Senior",
  "salary": {
    "min": 80000,
    "max": 120000,
    "currency": "USD"
  },
  "location": "Remote",
  "jobType": "Full-time"
}
```

### Update Job

```http
PUT /api/jobs/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Job Title",
  "status": "Closed"
}
```

### Delete Job

```http
DELETE /api/jobs/:id
Authorization: Bearer {token}
```

### Search Jobs

```http
GET /api/jobs/search?q=developer&status=Active&experienceLevel=Senior
Authorization: Bearer {token}
```

### Get Job Applicants

```http
GET /api/jobs/:id/applicants
Authorization: Bearer {token}
```

---

## 👥 Candidate Endpoints

### Get All Candidates (HR Only)

```http
GET /api/candidates
Authorization: Bearer {token}
```

### Get Single Candidate

```http
GET /api/candidates/:id
Authorization: Bearer {token}
```

### Create Candidate Profile

```http
POST /api/candidates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "university": "MIT",
  "degree": "Computer Science",
  "skills": ["JavaScript", "React", "Python"],
  "experience": 5,
  "experienceLevel": "Senior",
  "resumeUrl": "https://example.com/resume.pdf",
  "linkedinUrl": "https://linkedin.com/in/janesmith",
  "location": "San Francisco, CA",
  "availability": "Immediate"
}
```

### Update Candidate

```http
PUT /api/candidates/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "skills": ["JavaScript", "React", "Python", "Django"],
  "experience": 6
}
```

### Delete Candidate

```http
DELETE /api/candidates/:id
Authorization: Bearer {token}
```

### Search Candidates (HR Only)

```http
GET /api/candidates/search?q=developer&skills=JavaScript,React&experienceLevel=Senior&minExperience=3
Authorization: Bearer {token}
```

### Apply for Job

```http
POST /api/candidates/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "candidateId": "candidate_id_here",
  "jobId": "job_id_here",
  "matchPercentage": 85
}
```

### Update Application Status (HR Only)

```http
PUT /api/candidates/application/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "candidateId": "candidate_id_here",
  "jobId": "job_id_here",
  "status": "Interview"
}
```

**Application Status Values**: `Applied`, `Reviewed`, `Interview`, `Offered`, `Hired`, `Rejected`

### Calculate Match Percentage (HR Only)

```http
POST /api/candidates/match
Authorization: Bearer {token}
Content-Type: application/json

{
  "candidateId": "candidate_id_here",
  "jobId": "job_id_here"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matchPercentage": 85,
    "matchingSkills": ["JavaScript", "React", "Node.js"],
    "missingSkills": ["TypeScript", "GraphQL"]
  }
}
```

---

## 🏢 Company Endpoints (HR Only)

### Get All Companies (Public)

```http
GET /api/company/all
```

### Get Company Profile

```http
GET /api/company
Authorization: Bearer {token}
```

### Create Company Profile

```http
POST /api/company
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Tech Solutions Inc",
  "logo": "https://example.com/logo.png",
  "industry": "Technology",
  "description": "Leading provider of innovative tech solutions",
  "website": "https://techsolutions.com",
  "location": "San Francisco, CA",
  "size": "201-500",
  "founded": 2010,
  "socialMedia": {
    "linkedin": "https://linkedin.com/company/techsolutions",
    "twitter": "https://twitter.com/techsolutions"
  }
}
```

### Update Company Profile

```http
PUT /api/company
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated company description",
  "size": "501-1000"
}
```

### Delete Company Profile

```http
DELETE /api/company
Authorization: Bearer {token}
```

**Company Size Values**: `1-10`, `11-50`, `51-200`, `201-500`, `501-1000`, `1000+`

---

## 📊 Analytics Endpoints (HR Only)

### Get Dashboard Analytics

```http
GET /api/analytics/dashboard
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalJobs": 25,
      "totalCandidates": 150,
      "totalApplications": 320,
      "avgMatchRate": 78,
      "interviewsScheduled": 45,
      "hiredCount": 12
    },
    "topSkills": [
      { "skill": "JavaScript", "count": 120 },
      { "skill": "React", "count": 95 }
    ],
    "matchRateDistribution": [
      { "range": "0-20", "count": 10 },
      { "range": "21-40", "count": 25 },
      { "range": "41-60", "count": 50 },
      { "range": "61-80", "count": 80 },
      { "range": "81-100", "count": 155 }
    ],
    "applicationsOverTime": []
  }
}
```

### Get Historical Analytics

```http
GET /api/analytics/history?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

### Save Analytics Snapshot

```http
POST /api/analytics
Authorization: Bearer {token}
Content-Type: application/json

{
  "metrics": {
    "totalJobs": 25,
    "totalCandidates": 150,
    "totalApplications": 320,
    "avgMatchRate": 78
  },
  "topSkills": [...],
  "matchRateDistribution": [...]
}
```

---

## 🔔 Notification Endpoints

### Get All Notifications

```http
GET /api/notifications
Authorization: Bearer {token}
```

### Get Unread Count

```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

### Create Notification

```http
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Application Received",
  "message": "John Doe applied for Senior Developer position",
  "type": "application",
  "link": "/jobs/job_id/applicants"
}
```

**Notification Types**: `application`, `interview`, `system`, `message`

### Mark Notification as Read

```http
PUT /api/notifications/:id
Authorization: Bearer {token}
```

### Mark All as Read

```http
PUT /api/notifications/mark-all-read
Authorization: Bearer {token}
```

### Delete Notification

```http
DELETE /api/notifications/:id
Authorization: Bearer {token}
```

### Delete All Notifications

```http
DELETE /api/notifications
Authorization: Bearer {token}
```

---

## 🔒 Admin/HR User Management

### Get All Users (HR Only)

```http
GET /api/auth/users
Authorization: Bearer {token}
```

### Get User by ID (HR Only)

```http
GET /api/auth/users/:id
Authorization: Bearer {token}
```

### Update User (HR Only)

```http
PUT /api/auth/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "user"
}
```

### Delete User (HR Only)

```http
DELETE /api/auth/users/:id
Authorization: Bearer {token}
```

---

## 📋 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "count": 10
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcryptjs
- Role-based access control (HR vs User)
- Input validation on all endpoints
- CORS protection
- MongoDB injection prevention
- Error handling middleware

---

## 🧪 Testing

You can test the API using:

- **Postman**: Import the endpoints from this documentation
- **Thunder Client** (VS Code Extension)
- **cURL**: Command line testing

Example cURL request:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## 📝 Models Schema

### User Model

- name, email, password, role (user/hr)
- Timestamps

### Job Model

- title, description, department, requiredSkills[], experienceLevel
- salary {min, max, currency}, location, jobType, status
- applicantsCount, postedBy (ref User), companyId (ref Company)
- Text search index

### Candidate Model

- name, email, phone, photo, university, degree
- skills[], experience, experienceLevel, resumeUrl
- applications[] {jobId, appliedAt, status, matchPercentage}
- linkedinUrl, portfolioUrl, location, availability
- Text search index

### Company Model

- name, logo, industry, description, website
- location, size, founded, ownerId (ref User)
- socialMedia {linkedin, twitter, facebook}

### Analytics Model

- userId, date, metrics {totalJobs, totalCandidates, avgMatchRate, etc.}
- applicationsOverTime[], topSkills[], matchRateDistribution[]

### Notification Model

- userId (ref User), title, message, type, read, link
- Timestamps

---

## 🚧 Future Enhancements

- File upload for resumes and company logos (Multer)
- Email notifications (Nodemailer)
- Advanced AI matching algorithm
- Real-time notifications (Socket.io)
- Rate limiting
- API documentation with Swagger
- Unit and integration tests

---

## 👨‍💻 Development

```bash
# Start development server with nodemon
npm run dev

# Run in production
npm start

# Test database connection
node testDB.js
```

---

## 📄 License

This project is part of an AI-based CV Classification and Matching System.

---

## 🤝 Support

For issues or questions, please contact the development team.
