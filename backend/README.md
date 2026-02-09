# Umurage Backend

Node.js + TypeScript + Express backend for the Umurage Ibimina management platform.

## Features

- ✅ RESTful API with Express
- ✅ TypeScript for type safety
- ✅ PostgreSQL database
- ✅ Redis for caching and sessions
- ✅ JWT authentication
- ✅ USSD interface support
- ✅ Mobile money integration ready
- ✅ SACCO API integration ready

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
# Create database
createdb umurage_db

# Run schema
psql -d umurage_db -f database/schema.sql
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configuration
```

### 4. Start Redis

```bash
# On Windows (if installed)
redis-server

# On Linux/Mac
sudo service redis-server start
```

## Development

```bash
# Start development server with hot reload
npm run dev
```

Server will start on `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Groups
- `GET /api/groups` - Get all groups (authenticated)
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Members
- `GET /api/groups/:groupId/members` - Get group members
- `POST /api/groups/:groupId/members` - Add member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Remove member

### Savings
- `GET /api/members/:id/savings` - Get member savings
- `POST /api/savings` - Record contribution
- `GET /api/savings/:id` - Get saving details

### Loans
- `GET /api/groups/:groupId/loans` - Get group loans
- `POST /api/loans` - Request loan
- `PUT /api/loans/:id/approve` - Approve loan
- `PUT /api/loans/:id/disburse` - Disburse loan
- `POST /api/loans/:id/repayment` - Record repayment

### Transactions
- `GET /api/groups/:groupId/transactions` - Get group transactions
- `GET /api/transactions/:id` - Get transaction details

### USSD
- `POST /api/ussd` - USSD callback endpoint

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts      # PostgreSQL connection
│   │   └── redis.ts         # Redis connection
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   ├── auth.ts          # JWT authentication
│   │   ├── errorHandler.ts  # Error handling
│   │   └── logger.ts        # Request logging
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── group.routes.ts
│   │   ├── member.routes.ts
│   │   ├── saving.routes.ts
│   │   ├── loan.routes.ts
│   │   ├── transaction.routes.ts
│   │   └── ussd.routes.ts
│   └── server.ts            # Main application
├── database/
│   └── schema.sql           # Database schema
├── .env.example             # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Building for Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Testing API

### Register User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "250788123456",
    "password": "password123",
    "name": "Jean Uwimana"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "250788123456",
    "password": "password123"
  }'
```

### Health Check
```bash
curl http://localhost:4000/health
```

## Next Steps

1. Implement group management controllers
2. Implement savings and loan controllers
3. Add mobile money integration
4. Add SACCO API integration
5. Implement AI credit scoring service
6. Add comprehensive testing
7. Set up CI/CD pipeline

## License

ISC
