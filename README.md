# KlubCRM — Lead Generation & Management CRM

A production-ready Full-Stack Lead Management CRM built for software/web/app development sales teams. 

## Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS, React Router, Axios, Lucide React
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT Authentication
- **Architecture**: Role-Based Access Control (Admin, Team Leader, Sales Executive)

## Features
- **Authentication**: Secure JWT login with role-based access control.
- **Lead Management**: Full lifecycle tracking (New, Contacted, Qualified, Proposal Sent, Negotiation, Won, Lost, Future Follow-up).
- **Activity & Auditing**: Automatic timeline and activity tracking for every lead interaction.
- **Call & Follow-up Logging**: Track communication history, outcomes, and set next action dates.
- **Dashboard & Analytics**: Comprehensive metrics including conversion rates, pipeline value, and team performance.
- **Bulk Import**: Import leads via JSON/CSV data.

## Project Structure
- `/frontend` - Vite + React application
- `/backend`  - Node.js + Express API

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (or local MongoDB instance)

### Installation

1. Clone the repository and install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. Configure environment variables:
Update `backend/.env` with your correct MongoDB URI.

3. Seed the database (Optional but recommended):
```bash
cd backend
npm run seed
```
*Note: The seed script will create default users: `admin@crm.com`, `tl@crm.com`, and `sales@crm.com` with the password `password123`.*

4. Run the development servers:
```bash
# In backend terminal
npm run dev

# In frontend terminal
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.
