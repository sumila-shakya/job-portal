# 🏢 Job Portal API

A production-ready RESTful API for a full-featured job portal built with **Node.js**, **TypeScript**, and **Polyglot Persistence** (MySQL + MongoDB). Designed with real-world architectural patterns including distributed transaction management, finite state machines, and automated lifecycle management.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Advanced Concepts Implemented](#advanced-concepts-implemented)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Design](#database-design)
- [Academic Connections](#academic-connections)

---

## 🏗️ Architecture Overview

This project implements **Polyglot Persistence** — using two databases, each chosen for what it does best:

```
┌─────────────────────────────────────────────────────┐
│                   Express Server                    │
│                  (Node.js + TS)                     │
└──────────────────┬──────────────────────────────────┘
                   │
       ┌───────────┴─────────────┐
       │                         │
┌──────▼─────────┐         ┌──────▼────────┐
│    MySQL       │         │   MongoDB     │
│  (Drizzle)     │         │ (Mongoose)    │
│                │         │               │
│ • users        │         │ • profiles    │
│ • jobs         │         │ • job_details │
│ • applications │         │ • companies   │
│ • tokens       │         │               │
└────────────────┘         └───────────────┘
```

**Why two databases?**
- **MySQL** handles structured, relational, ACID-critical data (users, jobs, applications)
- **MongoDB** handles flexible, document-shaped data (profiles, job details with optional fields)

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| MySQL ORM | Drizzle ORM |
| MongoDB ODM | Mongoose |
| Authentication | JWT (Access + Refresh Token Rotation) |
| Validation | Zod |
| Password Hashing | bcrypt |
| File Upload | Multer + Cloudinary |
| Scheduling | node-cron |
| Cookie Parsing | cookie-parser |

---

## ✨ Key Features

### Authentication & Security
- JWT-based authentication with **refresh token rotation**
- HttpOnly cookie for refresh tokens (XSS prevention)
- `sameSite: strict` cookie policy (CSRF prevention)
- bcrypt password hashing with cost factor 10

### User Management
- Role-based access control (`job_seeker`, `company`, `admin`)
- Account deactivation with **30-day grace period**
- Auto-reactivation on login within grace period
- Automated permanent deletion via cron job

### Job Management
- Rich job postings split across MySQL (metadata) and MongoDB (details)
- Advanced search with **three-strategy polyglot query system**
- Soft delete with grace period (consistent with account deletion)
- Automated job expiry via cron job
- Employer dashboard with job status tracking

### Application System
- **Finite State Machine** for application status transitions
- Duplicate application prevention at DB constraint level
- Bulk application cancellation on job/account deletion
- Company applicant viewing with profile enrichment from MongoDB

### File Management
- PDF resume upload via Multer
- Cloudinary CDN storage with public access configuration
- File type and size validation (PDF only, 5MB max)

---

## 🧠 Advanced Concepts Implemented

### 1. Polyglot Persistence
Using multiple databases, each for what it does best. MySQL for relational integrity, MongoDB for flexible document storage.

### 2. Distributed Transaction Management (Saga Pattern)
Two-step saga with compensating transactions:
```
Step 1: Insert MySQL user     → Compensating: Delete MySQL user
Step 2: Create MongoDB profile → If fails → trigger compensation
```

### 3. Finite State Machine (Application Status)
```
pending ──→ shortlisted ──→ interviewed ──→ accepted
   │              │               │
   └──────────────┴───────────────┴──→ rejected
   │              │               │
withdrawn / cancelled (terminal states)
```

### 4. Polyglot Search Strategy
Three query strategies based on present filters:
- **Strategy A** (title search): MySQL leads → enrich with MongoDB
- **Strategy B** (filter search): MongoDB leads → validate with MySQL
- **Strategy C** (browse all): MySQL paginates → MongoDB enriches

### 5. Refresh Token Rotation
Every refresh token use generates a new token and invalidates the old one, enabling stolen token detection.

### 6. Tombstone Pattern (Soft Delete)
Records marked as deleted with timestamp, permanently purged after grace period by cron job. Consistent across jobs and user accounts.

---

## 📁 Project Structure

```
src/
├── config/
│   ├── mysql.config.ts           # Drizzle MySQL connection
│   ├── mongodb.config.ts         # Mongoose connection
│   └── env.config.ts             # Fail-fast env validation
│
├── models/
│   ├── mysql.models.ts           # Drizzle schemas (users, jobs, applications, tokens)
│   └── mongodb.models.ts         # Mongoose schemas (profiles, job details)
│
├── @types/
│   ├── express.d.ts              # Request user definition
│   └── interface.d.ts            # Interface definition
│
├── controllers/
│   ├── application.controller.ts
│   ├── auth.controller.ts
│   ├── job.controller.ts     
│   └── profile.controller.ts
│
├── cron/
│   ├── auth.cron.ts              # Account cleanup
│   └── job.cron.ts               # Purge after grace period and auto-close expired job listings
│
├── middlewares/
│   ├── auth.middleware.ts        # JWT verification
│   ├── active.middleware.ts      # Account status check
│   ├── error.middleware.ts       # Global Error handler
│   ├── role.middleware.ts        # Role-based access
│   └── multer.middleware.ts      # Resume upload
│
├── routes/
│   ├── application.route.ts
│   ├── auth.route.ts
│   ├── job.route.ts     
│   └── profile.route.ts
│
├── services/
│   ├── application.service.ts
│   ├── auth.service.ts
│   ├── job.service.ts     
│   └── profile.service.ts
│
├── utils/
│   ├── jwt.ts                    # Token generation & verification
│   ├── apiError.ts               # Custom error class
│   ├── apiResponse.ts            # Standardized response wrapper
│   ├── constants.ts              # Enums as const arrays (single source of truth)
│   ├── validator.ts              # User data validation schema
│   ├── statusTransition.ts       # Finite State Machine implementation
│   └── cloudinary.ts             # File upload utility
│
└── server.ts                     # Express app setup & cron registration
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MySQL 8.0+
- MongoDB 6.0+
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone job-portal
cd job-portal-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate and run database migrations
npm run db:generate  
npm run db:push      

# Start development server
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000

# MySQL Credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=job_portal_db

# MongoDB URI
MONGODB_URI=mongodb://localhost:27017/job_portal_db

# JWT Secrets (use long random strings in production)
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_API_KEY=your_api_key
```

> ⚠️ The app uses a **fail-fast** pattern — it crashes immediately at startup with a clear message if any required environment variable is missing, rather than failing silently on first request.

---

## 📡 API Reference

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login + receive tokens |
| POST | `/logout` | Auth | Logout + revoke refresh token |
| POST | `/refresh` | Public | Get new access token |
| GET | `/account` | Auth | Get current user info |
| DELETE | `/deactivate` | Auth | Deactivate account (30-day grace period) |

### Profile Routes (`/api/profile`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/me` | Job Seeker | Get own profile |
| GET | `company/me` | Company | Get company profile |
| PATCH | `/me` | Job Seeker | Update profile + resume upload |
| PATCH | `/company/me` | Company | Update company profile |
| GET | `/:userId` | Public | View any job seeker profile |
| GET | `/company/:userId` | Public | View any company profile |

### Job Routes (`/api/jobs`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Company | Post a new job |
| GET | `/` | Public | Browse/search/filter jobs |
| GET | `/myJobs` | Company | View own job listings |
| GET | `/myJobs/:jobId` | Company | View job details |
| DELETE | `/:jobId` | Company | Soft delete job |
| POST | `/:jobId/apply` | Job Seeker | Apply to a job |

### Application Routes (`/api/application`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/me` | Job Seeker | View own applications |
| PATCH | `/:applicationId/withdraw` | Job Seeker | Withdraw application |
| GET | `/job/:jobId` | Company | View all applicants for a job |
| PATCH | `/:applicationId/status` | Company | Update application status |

### Query Parameters — Job Search

```
GET /api/jobs?title=Engineer&city=Kathmandu&employmentType=full&page=1&limit=10

Available filters:
  title          string   Job title keyword search
  city           string   Filter by city
  country        string   Filter by country
  employmentType string   full | part | intern | contract | freelance
  workType       string   remote | on-site | hybrid
  position       string   junior | senior 
  category       string   Industry category
  salary_min     number   Minimum salary filter
  salary_max     number   Maximum salary filter
  experience_min number   Minimum years experience
  experience_max number   Maximum years experience
  page           number   Page number (default: 1)
  limit          number   Results per page (default: 5, max: 5)
```

---

## 🗄️ Database Design

### MySQL Tables (Drizzle ORM)

```
users
├── user_id (PK)
├── name, email (unique), password
├── role (job_seeker | company | admin)
├── is_active, deactivated_at
└── created_at, updated_at

jobs
├── job_id (PK)
├── posted_by (FK → users)
├── title, deadline_date
├── is_closed, is_deleted, deleted_at
└── created_at, updated_at

job_applications
├── application_id (PK)
├── job_id (FK → jobs), applicant_id (FK → users)
├── application_status (FSM-controlled)
├── applied_date, updated_at
└── UNIQUE(job_id, applicant_id)

refresh_tokens
├── token_id (PK)
├── user_id (FK → users, CASCADE DELETE)
├── refresh_token (unique), expires_at
└── created_at
```

### MongoDB Collections (Mongoose)

```
jobSeekerProfiles
├── jobSeekerId (bridges to MySQL user_id)
├── bio, skills[], phone_no
├── education[] { level, field, institution, year }
├── experience[] { company, year, role }
├── address { country, city }
├── resume_url, is_hidden
└── Indexes: jobSeekerId(unique)

companyProfiles
├── companyId (bridges to MySQL user_id)
├── about_us, specialties[], contact_no
├── hq_location { country, city }
├── company_website_url, is_hidden
└── Indexes: companyId(unique)

jobDetails
├── jobId (bridges to MySQL job_id)
├── description, requirement[]
├── position, employment_type, work_type
├── education { level, field }
├── location { country, city }
├── salary { min, max, currency }
├── experience { min, max }, category
└── Indexes: jobId(unique), location+type composite, cateogory+location+position composite, salary(partial), experience(partial)
```

---

## 🎓 Academic Connections

This project was built alongside BSc CSIT coursework and demonstrates:

### System Analysis & Design (SAD)
- **Use Case Analysis** — identified actors (Job Seeker, Company, Admin) and their interactions
- **ER Diagram** — designed before writing a single schema
- **Polyglot Persistence** — architectural pattern for mixed database systems
- **Saga Pattern** — distributed transaction management
- **Tombstone Pattern** — soft delete with grace period lifecycle

### Design & Analysis of Algorithms (DAA)
- **B-Tree Indexing** — database indexes implement B-Tree search O(log n) vs full scan O(n)
- **Parallel vs Sequential Execution** — Promise.all reduces O(a+b) to O(max(a,b))
- **Finite State Machine** — application status transitions modeled as FSM
- **Three-Strategy Search Algorithm** — adaptive query strategy based on input parameters

### Web Technology II
- **REST API Design** — resource-oriented URL structure
- **HTTP Semantics** — correct status codes (200, 201, 401, 403, 404, 409, 429)
- **JWT Authentication** — stateless auth with stateful refresh tokens
- **Cookie Security** — HttpOnly, sameSite, secure flags
- **Middleware Architecture** — composable request pipeline

---

## 🔒 Security Measures

- Passwords hashed with bcrypt (cost factor 10)
- JWT access tokens expire in 15 minutes
- Refresh tokens rotated on every use
- HttpOnly cookies prevent XSS token theft
- User enumeration prevention (same error for wrong email/password)
- Role-based access enforced at middleware level
- Resource ownership verified in service layer
- Input validation with Zod on all endpoints

---

## ⏰ Automated Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Expire Jobs | Daily 12 AM | Mark jobs with passed deadline as closed |
| Permanent Delete Jobs | Daily 12 AM | Purge soft-deleted jobs after 30-day grace period |
| Permanent Delete Users | Daily 12 AM | Purge deactivated accounts after 30-day grace period |


---

## 👤 Author

**Sumila Shakya**
- Student ID: 80010269
- Course: BSc CSIT (5th Semester)
- Institution: Amrit Science College
- GitHub: [@sumila-shakya](https://github.com/sumila-shakya)

---

## 📄 License

This project is built for educational and portfolio purposes.