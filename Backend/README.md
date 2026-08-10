# AI-Based CV Classification and Matching System - Backend

## 📋 Description

Backend authentication system for CV classification and matching application with role-based access control.

## 🚀 Features

- User registration and authentication
- JWT-based authentication (7 days validity)
- Password hashing with bcrypt
- Role-based access control (User/HR)
- MongoDB integration
- User dashboard (CRUD on own data)
- HR dashboard (manage all users)

## 🛠️ Technologies

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT (jsonwebtoken)
- bcryptjs
- dotenv

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Create `.env` file:

```env
JWT_SECRET=your-secret-key
PORT=5000
MONGO_URI=your-mongodb-connection-string
```

## 🚀 Running

```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Public Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### User Dashboard (Protected)

- `GET /api/auth/me` - Get profile
- `PUT /api/auth/me` - Update profile
- `PATCH /api/auth/me/password` - Change password
- `DELETE /api/auth/me` - Delete account

### HR Dashboard (HR Only)

- `GET /api/auth/users` - Get all users
- `GET /api/auth/users/:id` - Get user by ID
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user

## 👤 Author

Omar Hossam

## 📄 License

ISC
