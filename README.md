# Attendance Tracker - Backend ⚙️

A robust Node.js/Express API powering the Attendance Tracker application. Handles authentication, data persistence, and business logic.

## 🚀 Features

- **RESTful API**: Clean endpoints for courses, attendance, and user management.
- **Secure Auth**: Google OAuth 2.0 integration with JWT session management.
- **Database**: PostgreSQL with Prisma ORM for type-safe database access.
- **Security**: Helmet headers, CORS configuration, and HttpOnly cookies.
- **Error Handling**: Centralized error handling with `express-async-errors`.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Google Auth Library + JWT
- **Security**: Helmet, CORS, BCrypt

## 📂 Project Structure

```
src/
├── controllers/    # Request handlers (logic)
├── routes/         # API route definitions
├── middleware/     # Auth checks & error handling
├── prisma/         # Database schema & migrations
└── index.js        # Entry point & server setup
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/google` - Exchange Google code for session token
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get current user profile

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Attendance
- `POST /api/attendance/mark` - Mark attendance (Present/Absent)
- `GET /api/attendance/stats` - Get overall statistics

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
    ```

3.  **Run Migrations**
    ```bash
    npx prisma migrate dev
    ```

4.  **Start Server**
    ```bash
    npm run dev
    ```

## 🔒 Security Features

- **HttpOnly Cookies**: Prevents XSS attacks on session tokens.
- **CORS**: Restricted to frontend origin only.
- **Helmet**: Sets secure HTTP headers.
- **Input Validation**: Prisma ensures data integrity.
