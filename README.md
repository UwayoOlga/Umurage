# Umurage

> **Modern savings group management for Rwanda's Ibimina/SACCO ecosystem.**

Umurage digitizes traditional rotating savings groups with secure contributions, loan management, member tracking, and full financial transparency — all in one app.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (access + refresh tokens) |

---

## Screenshots

### Home Page
![Home Page](documentation/screenshots/homepage.jpeg)

### Dashboard
![Dashboard](documentation/screenshots/dashboard.jpeg)

### Members
![Members Page](documentation/screenshots/members%20page.jpeg)

### Savings
![Savings Page](documentation/screenshots/savings%20page.jpeg)

### Loans
![Loans Page](documentation/screenshots/loans%20page.jpeg)

### Transactions
![Transactions Page](documentation/screenshots/transactions%20page.jpeg)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:4000
```

> The SQLite database is created automatically at `backend/database/umurage.db` on first run. No external database setup required.

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Environment Variables

Copy `backend/.env` and update:

```env
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

### Creating an Admin User

Register via the app, then run this SQL to promote yourself:

```sql
UPDATE users SET role = 'admin' WHERE phone = 'YOUR_PHONE_NUMBER';
```

---

## Features

- 🔐 **Auth** — Phone + password login, JWT, role-based access (member / admin / treasurer / secretary)
- 📊 **Dashboard** — Group stats, recent transactions, quick actions
- 👥 **Members** — Invite, manage roles and statuses
- 💰 **Savings** — Track contributions, goals, and interest earned
- 🏦 **Loans** — Request, approve, track repayments with risk indicators
- 📋 **Transactions** — Full audit log with CSV export
- 🛡️ **Admin Panel** — System analytics, user management, group oversight

---

© 2026 Umurage Ltd. Built for Rwanda 🇷🇼
