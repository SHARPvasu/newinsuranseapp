# UV Insurance Agency Management App

A comprehensive full-stack application built for insurance agents and agency owners to manage customers, policies, leads, claims, and commissions.

## Features
- **Role-Based Access Control:** Separate dashboards and permissions for Agency Owners and Employees.
- **Customer & Policy Management:** Add, update, approve/reject customers and their associated insurance policies (Health, Life, Motor, etc.).
- **Lead Tracking & Calling:** Built-in tools for tracking leads and recording call details.
- **Claims & Commissions:** Process customer claims and calculate/track agent commissions.
- **Real-Time Notifications:** Event-based notification system to alert users of pending approvals, new assignments, and status updates.
- **Audit Logging:** System-wide tracking of CRUD operations for security and compliance.

## Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Zustand (State Management), React Router
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** Serverless Neon PostgreSQL
- **Language:** TypeScript across both frontend and backend

## Setup Instructions

### Environment Variables
Create a `.env` file in the root directory:
```
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
```

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Push schema to database:
   ```bash
   npx prisma db push
   ```

### Running the App
Start both the Express API server and the Vite client concurrently:
```bash
npm run dev
```
- Frontend runs on `http://localhost:5173` (or next available port like `5176`)
- Backend API runs on `http://localhost:3001`

### Default Demo Users
On initial startup, if the database is empty, the application seeds default users:
- **Owner/Admin:** `admin@uvinsurance.com` / `Admin@123`
- **Employee:** `priya@uvinsurance.com` / `Employee@123`
