# Attendance Tracker - Backend ⚙️

A robust Node.js/Express API powering the Attendance Tracker application. Handles authentication, data persistence, and business logic with a focus on security and performance.

## 🚀 Features

- **RESTful API**: Clean endpoints for courses, attendance, and user management.
- **Secure Auth**: Google OAuth 2.0 integration (Authorization Code Flow) with JWT session management.
- **Google Calendar Sync**: Background integration to push attendance events to user's Google Calendar.
- **Database**: PostgreSQL with Prisma ORM (Optimized Schema).
- **Security**: Helmet headers, CORS configuration, and HttpOnly cookies.
- **Error Handling**: Centralized error handling.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (NeonDB / Local)
- **ORM**: Prisma (Schema optimized for read performance)
- **Authentication**: `google-auth-library` + `jsonwebtoken`
- **Security**: Helmet, CORS, Cookie-Parser

## 📂 Project Structure

```
src/
├── routes/         # API route definitions
│   ├── auth.js       # Google OAuth & Session handling
│   ├── attendance.js # Course & Attendance logic
│   └── health.js     # Health check endpoint
├── middleware/     # Auth checks (jwtAuth.js)
├── utils/          # Helper functions
│   └── calendar.js   # Google Calendar API integration
├── prisma/         # Database schema & migrations
└── index.js        # Entry point & server setup
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/google` - Exchange Google code for session token
- `POST /auth/logout` - Clear session cookie
- `GET /auth/me` - Get current user profile

### Attendance & Courses
- `GET /attendance/:userId` - List all courses for a user
- `POST /attendance/:userId` - Create new course
- `GET /attendance/:userId/:courseId` - Get course details
- `PUT /attendance/:userId/:courseId` - Update course (triggers Calendar sync)
- `DELETE /attendance/:userId/:courseId` - Delete course
- `POST /attendance/:userId/:courseId/reset` - Reset course stats

## 💾 Database Schema

Simplified relational schema optimized for performance:

- **User**: Stores Google profile, Refresh Token (for offline calendar access).
- **Course**: Stores course details and attendance stats.
    - Uses **PostgreSQL Arrays** (`String[]`) for storing class days (Mon, Tue, etc.) to avoid complex joins.
    - **Indexes**: `userId` (for dashboard), `IndivCourse` (for search/uniqueness).

## 🏃‍♂️ Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Database Setup**
    Ensure PostgreSQL is running and update `.env`:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/attendance_db"
    JWT_SECRET="your_super_secret_key"
    GOOGLE_CLIENT_ID="your_google_client_id"
    GOOGLE_CLIENT_SECRET="your_google_client_secret"
    FRONTEND_URL="http://localhost:5173"
    ```

3.  **Push Schema**
    ```bash
    npx prisma db push
    ```

4.  **Start Server**
    ```bash
    npm run dev
    ```

## 🔒 Security Features

- **HttpOnly Cookies**: Prevents XSS attacks on session tokens.
- **SameSite=None**: Configured for cross-site usage (required for some deployments).
- **Secure Flag**: Cookies are only sent over HTTPS (in production).
- **CORS**: Restricted to specific frontend origins.
- **Input Validation**: Prisma ensures data integrity.
