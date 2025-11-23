# Backend - Attendance Tracker API

RESTful API for attendance tracking with Google OAuth 2.0 authentication, Google Calendar integration, and PostgreSQL database.

## 🚀 Features

- **Google OAuth 2.0** - Secure user authentication
- **Google Calendar API** - Automatic event creation with color coding
- **JWT Authentication** - Stateless session management
- **PostgreSQL Database** - Relational data storage with Prisma ORM
- **Performance Optimized** - Database indexes for fast queries
- **CORS Enabled** - Secure cross-origin requests
- **Vercel Ready** - Serverless deployment configuration

## 📦 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - Modern ORM for PostgreSQL
- **PostgreSQL** - Relational database (Neon.tech)
- **google-auth-library** - OAuth 2.0 client
- **jsonwebtoken** - JWT token generation
- **bcrypt** - Password hashing (if needed)
- **helmet** - Security middleware
- **cors** - CORS middleware

## 🏗️ Project Structure

```
backend/
├── prisma/
│   ├── migrations/            # Database migrations
│   │   ├── 20251118141037_init/
│   │   ├── 20251118142514_init/
│   │   ├── 20251119192537_init/
│   │   └── 20251123102524_add_performance_indexes/
│   └── schema.prisma         # Database schema
├── src/
│   ├── routes/              # API route handlers
│   │   ├── auth.js         # Authentication endpoints
│   │   └── attendance.js   # Course and attendance CRUD
│   ├── utils/              # Utility functions
│   │   └── calendar.js     # Google Calendar integration
│   └── index.js            # Express app entry point
├── package.json            # Dependencies
├── vercel.json            # Vercel serverless config
└── .env                   # Environment variables (not in repo)
```

## 🛠️ Installation

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL database (or Neon.tech account)
- Google Cloud Project with OAuth 2.0 credentials

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your_client_secret"
   
   # JWT
   JWT_SECRET="your_super_secret_jwt_key_here"
   
   # Frontend URL
   FRONTEND_URL="http://localhost:5173"
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   Server will be running at `http://localhost:3000`

## 📝 Available Scripts

- `npm run dev` - Start dev server with nodemon
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create new migration

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id            Int      @id @default(autoincrement())
  email_address String   @unique
  name          String?
  user_name     String?
  image         String?
  verified      Boolean  @default(false)
  googleId      String?  @unique
  refreshToken  String?
  courses       Course[]
}
```

### Course Model
```prisma
model Course {
  id           Int    @id @default(autoincrement())
  IndivCourse  String
  timeofcourse String
  Totaldays    Int    @default(35)
  present      Int    @default(0)
  absent       Int    @default(0)
  cancelled    Int    @default(0)
  criteria     Int    @default(75)
  userId       Int
  userDetails  User   @relation(fields: [userId], references: [id])
  thatday      Day_Course[]

  @@unique([userId, IndivCourse])
  @@index([userId])  // Performance index
}
```

### Days & Day_Course Models
```prisma
model Days {
  id      Int          @id @default(autoincrement())
  day     String       @unique
  courses Day_Course[]
}

model Day_Course {
  courseId   Int
  course     Course   @relation(fields: [courseId], references: [id])
  dayId      Int
  day        Days     @relation(fields: [dayId], references: [id])
  assignedAt DateTime @default(now())
  assignedBy String

  @@id([dayId, courseId])
  @@index([courseId])  // Performance index
}
```

## 🔌 API Endpoints

### Authentication

#### **POST** `/auth/login`
Login with Google OAuth authorization code

**Request:**
```json
{
  "code": "google_authorization_code"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email_address": "user@example.com",
    "name": "John Doe",
    "image": "https://...",
    "verified": true
  }
}
```

#### **GET** `/auth/me`
Get current user (requires JWT cookie)

**Response:**
```json
{
  "user": { /* user object */ }
}
```

#### **POST** `/auth/logout`
Logout user (clears JWT cookie)

### Attendance/Courses

#### **GET** `/attendance/:userId`
Get all courses for a user

**Response:**
```json
{
  "attendance": [
    {
      "id": 1,
      "IndivCourse": "Web Development",
      "timeofcourse": "10:00 AM - 11:30 AM",
      "Totaldays": 35,
      "present": 28,
      "absent": 5,
      "cancelled": 2,
      "criteria": 75,
      "days": ["mon", "wed", "fri"]
    }
  ]
}
```

#### **POST** `/attendance`
Create new course

**Request:**
```json
{
  "IndivCourse": "Data Structures",
  "timeofcourse": "2:00 PM - 3:30 PM",
  "Totaldays": 35,
  "present": 0,
  "absent": 0,
  "cancelled": 0,
  "criteria": 75,
  "days": ["tue", "thu"]
}
```

#### **PUT** `/attendance/:id`
Update course (including attendance marking)

**Request:**
```json
{
  "present": 29,
  "absent": 5
}
```

**Note:** When updating present/absent/cancelled, a Google Calendar event is automatically created.

#### **DELETE** `/attendance/:id`
Delete a course

#### **DELETE** `/attendance/user/:userId`
Delete all courses for a user

## 🔐 Authentication Flow

1. **Frontend** receives Google authorization code
2. **POST /auth/login** with code
3. **Backend** exchanges code for tokens via Google API
4. **Backend** creates/updates user in database
5. **Backend** generates JWT token
6. **Backend** sets HTTP-only cookie with JWT
7. **Frontend** receives user data

## 📅 Google Calendar Integration

When attendance is marked (present/absent/cancelled):

1. Backend receives course update
2. Detects change in present/absent/cancelled count
3. Uses user's refresh token to get access token
4. Creates calendar event with:
   - Summary: `{CourseName} - {Status}`
   - Color: Green (Present), Red (Absent), Yellow (Cancelled)
   - Duration: 1 hour from current time
   - Timezone: Asia/Kolkata

## 🔒 Security

- **JWT Tokens** - Stored in HTTP-only, secure cookies
- **CORS** - Configured for specific frontend origin
- **Helmet** - Security headers enabled
- **Input Validation** - All inputs validated
- **SQL Injection Prevention** - Prisma parameterized queries

## ⚡ Performance Optimizations

### Database Indexes
- `Course.userId` - Fast user course lookups
- `Day_Course.courseId` - Efficient day filtering
- Unique constraints on email and composite keys

### Query Optimization
- Relations preloaded with Prisma `include`
- Minimal data transfer
- Efficient joins

## 🚀 Deployment

### Vercel (Recommended)

1. **Configure `vercel.json`**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/index.js"
       }
     ]
   }
   ```

2. **Set environment variables in Vercel**
   - All variables from `.env`
   - Ensure `DATABASE_URL` points to production database

3. **Deploy**
   ```bash
   git push origin main
   ```

### Database Migrations

**Production deployment:**
```bash
npx prisma migrate deploy
```

**Development:**
```bash
npx prisma migrate dev --name migration_name
```

## 🗄️ Database Setup (Neon.tech)

1. Create account at [Neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Update `DATABASE_URL` in `.env`
5. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## 🐛 Common Issues

### "Can't reach database server"
- Check `DATABASE_URL` is correct
- Ensure database is running
- For Neon: Check project is not paused

### "Google OAuth error"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URIs in Google Console
- Ensure Calendar API is enabled

### "Prisma Client not found"
- Run `npx prisma generate`
- Check `@prisma/client` is installed

## 📚 API Documentation

For detailed API documentation, see the [API.md](./API.md) file (if exists) or use tools like:
- Postman collection
- Swagger/OpenAPI spec
- Thunder Client in VS Code

## 🧪 Testing

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Test endpoints with curl or Postman
curl http://localhost:3000/health
```

## 🔄 Migration History

1. **init** - Initial schema setup
2. **add_performance_indexes** - Added userId and courseId indexes

## 📄 License

[Your License Here]
