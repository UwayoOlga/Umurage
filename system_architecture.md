# Umurage System Architecture
**PWA + USSD Platform for Ibimina Management**

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │   PWA Web App        │      │   USSD Interface     │    │
│  │   (Next.js)          │      │   (*123#)            │    │
│  │                      │      │                      │    │
│  │  • Mobile Browser    │      │  • Feature Phones    │    │
│  │  • Tablet Browser    │      │  • No Internet       │    │
│  │  • Desktop Browser   │      │  • SMS Fallback      │    │
│  │  • Offline-capable   │      │                      │    │
│  └──────────┬───────────┘      └──────────┬───────────┘    │
│             │                               │                │
└─────────────┼───────────────────────────────┼────────────────┘
              │                               │
              │ HTTPS/WSS                     │ HTTP
              │                               │
┌─────────────▼───────────────────────────────▼────────────────┐
│                    API GATEWAY LAYER                          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Nginx Reverse Proxy                      │   │
│  │  • SSL/TLS Termination                               │   │
│  │  • Load Balancing                                    │   │
│  │  • Rate Limiting                                     │   │
│  │  • Request Routing                                   │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  APPLICATION LAYER                            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Main API       │  │  USSD Service   │  │  AI Service │ │
│  │  (Node.js)      │  │  (Node.js)      │  │  (Python)   │ │
│  │                 │  │                 │  │             │ │
│  │  • Auth         │  │  • Menu Handler │  │  • Credit   │ │
│  │  • Groups       │  │  • Session Mgmt │  │    Scoring  │ │
│  │  • Members      │  │  • AT Gateway   │  │  • Fraud    │ │
│  │  • Savings      │  │                 │  │    Detection│ │
│  │  • Loans        │  │                 │  │             │ │
│  │  • Transactions │  │                 │  │             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                    │        │
└───────────┼────────────────────┼────────────────────┼────────┘
            │                    │                    │
            └────────────────────┴────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────┐
│                    DATA LAYER                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ PostgreSQL   │  │    Redis     │  │  File Storage    │ │
│  │              │  │              │  │                  │ │
│  │ • Users      │  │ • Sessions   │  │ • Documents      │ │
│  │ • Groups     │  │ • Cache      │  │ • Images         │ │
│  │ • Members    │  │ • Job Queue  │  │ • Reports        │ │
│  │ • Savings    │  │ • USSD State │  │                  │ │
│  │ • Loans      │  │              │  │                  │ │
│  │ • Transactions│ │              │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Mobile Money │  │ SACCO APIs   │  │ Africa's Talking│ │
│  │              │  │              │  │                  │ │
│  │ • MTN MoMo   │  │ • 416 SACCOs │  │ • USSD Gateway  │ │
│  │ • Airtel $   │  │ • Account    │  │ • SMS           │ │
│  │              │  │   Sync       │  │ • Voice (future)│ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📱 Frontend Architecture (PWA)

### Technology Stack
```javascript
Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: Tailwind CSS
UI Components: Shadcn/ui
State Management: Zustand + React Query
Offline: Service Workers + IndexedDB
PWA: next-pwa
```

### Key Features
```
┌─────────────────────────────────────┐
│         PWA Features                │
├─────────────────────────────────────┤
│ ✓ Installable (Add to Home Screen) │
│ ✓ Offline-first (Service Workers)  │
│ ✓ Push Notifications               │
│ ✓ Background Sync                  │
│ ✓ Responsive (Mobile/Tablet/Desktop)│
│ ✓ Fast Loading (Code Splitting)    │
│ ✓ Secure (HTTPS Required)          │
└─────────────────────────────────────┘
```

### Offline Strategy
```javascript
// Service Worker Cache Strategy
{
  // Static assets: Cache First
  images: 'CacheFirst',
  fonts: 'CacheFirst',
  css: 'CacheFirst',
  
  // API calls: Network First, fallback to Cache
  api: 'NetworkFirst',
  
  // User data: Queue when offline, sync when online
  mutations: 'BackgroundSync'
}
```

### Responsive Breakpoints
```css
Mobile:  320px - 640px   (Single column, bottom nav)
Tablet:  641px - 1024px  (Two columns, side nav)
Desktop: 1025px+         (Multi-column, full dashboard)
```

---

## 🔧 Backend Architecture

### Main API (Node.js + Express)

**Structure:**
```
server/
├── src/
│   ├── routes/          # API endpoints
│   │   ├── auth.routes.ts
│   │   ├── groups.routes.ts
│   │   ├── members.routes.ts
│   │   ├── savings.routes.ts
│   │   ├── loans.routes.ts
│   │   └── transactions.routes.ts
│   ├── controllers/     # Business logic
│   ├── models/          # Database models
│   ├── middleware/      # Auth, validation, etc.
│   ├── services/        # External integrations
│   │   ├── mobileMoneyService.ts
│   │   ├── saccoService.ts
│   │   └── aiService.ts
│   └── utils/           # Helpers
├── tests/
└── package.json
```

**API Endpoints:**
```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

Groups:
GET    /api/groups
POST   /api/groups
GET    /api/groups/:id
PUT    /api/groups/:id
DELETE /api/groups/:id

Members:
GET    /api/groups/:groupId/members
POST   /api/groups/:groupId/members
PUT    /api/members/:id
DELETE /api/members/:id

Savings:
GET    /api/members/:id/savings
POST   /api/savings
GET    /api/savings/:id

Loans:
GET    /api/groups/:groupId/loans
POST   /api/loans
PUT    /api/loans/:id/approve
PUT    /api/loans/:id/disburse
POST   /api/loans/:id/repayment

Transactions:
GET    /api/groups/:groupId/transactions
GET    /api/transactions/:id

Mobile Money:
POST   /api/payments/momo/initiate
POST   /api/payments/momo/callback

SACCO:
POST   /api/sacco/link
GET    /api/sacco/balance
POST   /api/sacco/transfer

Sync (Offline):
POST   /api/sync/bulk
```

---

## 📞 USSD Architecture

### Flow Diagram
```
User dials *123#
       ↓
Africa's Talking Gateway
       ↓
POST /api/ussd (our endpoint)
       ↓
┌─────────────────────────┐
│   USSD Session Manager  │
│   (Redis-based)         │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│   Menu State Machine    │
│                         │
│  Main Menu              │
│  ├─ 1. Check Balance    │
│  ├─ 2. Contribute       │
│  ├─ 3. Request Loan     │
│  ├─ 4. Loan Status      │
│  ├─ 5. Group Info       │
│  └─ 6. Help             │
└───────────┬─────────────┘
            ↓
    Call Main API
            ↓
    Return Response
            ↓
Africa's Talking → User's Phone
```

### USSD Menu Structure
```
*123#
├─ 1. Reba Amafaranga (Check Balance)
│  └─ Display: "Amafaranga yawe: RWF 45,000"
├─ 2. Tanga Umusanzu (Make Contribution)
│  ├─ Enter amount
│  ├─ Confirm
│  └─ Success message
├─ 3. Saba Inguzanyo (Request Loan)
│  ├─ Enter amount
│  ├─ Enter purpose
│  └─ Confirmation
├─ 4. Reba Inguzanyo (Check Loan Status)
│  └─ Display loan details
├─ 5. Amakuru y'Ikimina (Group Info)
│  └─ Display group stats
└─ 6. Ubufasha (Help)
   └─ Contact information
```

---

## 🗄️ Database Schema

### PostgreSQL Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  admin_id UUID REFERENCES users(id),
  contribution_amount DECIMAL(10,2),
  contribution_frequency VARCHAR(20),
  model_type VARCHAR(10), -- 'ROSCA' or 'ASCA'
  sacco_account_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Members
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20), -- 'admin', 'treasurer', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active'
);

-- Savings
CREATE TABLE savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(20), -- 'regular', 'penalty', 'bonus'
  payment_method VARCHAR(20), -- 'cash', 'momo', 'sacco'
  transaction_ref VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Loans
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  amount DECIMAL(10,2) NOT NULL,
  interest_rate DECIMAL(5,2),
  purpose TEXT,
  status VARCHAR(20), -- 'pending', 'approved', 'disbursed', 'repaid', 'defaulted'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  disbursed_at TIMESTAMP,
  due_date DATE,
  ai_score DECIMAL(3,2), -- Credit score from AI
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  type VARCHAR(20), -- 'contribution', 'loan_disbursement', 'loan_repayment', 'share_out'
  amount DECIMAL(10,2) NOT NULL,
  from_member_id UUID REFERENCES members(id),
  to_member_id UUID REFERENCES members(id),
  reference_id UUID, -- Links to savings/loan record
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sync Queue (for offline operations)
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  synced BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_members_group ON members(group_id);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_savings_member ON savings(member_id);
CREATE INDEX idx_loans_member ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_transactions_group ON transactions(group_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_sync_queue_user ON sync_queue(user_id, synced);
```

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login (Phone + Password)
   ↓
2. Server validates credentials
   ↓
3. Generate JWT Access Token (15 min expiry)
   ↓
4. Generate Refresh Token (7 days expiry)
   ↓
5. Store refresh token in Redis
   ↓
6. Return both tokens to client
   ↓
7. Client stores in secure storage
   ↓
8. Include access token in API requests
   ↓
9. When access token expires, use refresh token
```

### Security Layers
```
┌─────────────────────────────────────┐
│  1. Transport Layer (HTTPS/TLS)    │
│     • SSL certificate               │
│     • Encrypted communication       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  2. API Gateway (Nginx)             │
│     • Rate limiting                 │
│     • IP whitelisting (admin)       │
│     • DDoS protection               │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  3. Application Layer               │
│     • JWT authentication            │
│     • Input validation (Joi)        │
│     • SQL injection prevention      │
│     • XSS protection                │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  4. Database Layer                  │
│     • Encrypted at rest (AES-256)   │
│     • Parameterized queries         │
│     • Row-level security            │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  5. Monitoring & Logging            │
│     • Audit logs                    │
│     • Intrusion detection           │
│     • Error tracking (Sentry)       │
└─────────────────────────────────────┘
```

---

## 🔄 Data Flow Examples

### Example 1: Member Makes Contribution via PWA
```
1. Member opens PWA → Dashboard
2. Clicks "Make Contribution"
3. Enters amount (RWF 5,000)
4. Selects payment method (Mobile Money)
5. Clicks "Pay"
   ↓
6. Frontend calls: POST /api/savings
   {
     member_id: "uuid",
     amount: 5000,
     payment_method: "momo"
   }
   ↓
7. Backend validates request
8. Calls Mobile Money API (MTN/Airtel)
9. Waits for payment confirmation
10. Creates savings record in database
11. Updates member balance
12. Creates transaction record
13. Returns success response
    ↓
14. Frontend shows success message
15. Updates local cache (IndexedDB)
16. Sends push notification to group admin
```

### Example 2: Loan Request via USSD
```
1. User dials *123#
2. Selects "3. Request Loan"
3. Enters amount: 50000
4. Enters purpose: "Business"
5. Confirms
   ↓
6. USSD service calls: POST /api/loans
   {
     member_id: "uuid",
     amount: 50000,
     purpose: "Business"
   }
   ↓
7. Backend calls AI Service for credit scoring
8. AI returns score: 0.85 (85% likely to repay)
9. Creates loan record with status "pending"
10. Notifies group admin (push notification)
11. Returns confirmation to USSD
    ↓
12. User receives SMS: "Loan request submitted. Awaiting approval."
```

### Example 3: Offline Contribution Sync
```
1. Member is offline (no internet)
2. Opens PWA (works from cache)
3. Records contribution (RWF 5,000)
4. Saved to IndexedDB
5. Added to sync queue
   ↓
6. Internet connection restored
7. Service Worker detects online status
8. Triggers background sync
   ↓
9. POST /api/sync/bulk
   {
     operations: [
       {
         action: "create_saving",
         data: {...}
       }
     ]
   }
   ↓
10. Backend processes queued operations
11. Returns sync results
12. Frontend updates UI
13. Clears sync queue
```

---

## 🔌 External Integrations

### 1. Mobile Money Integration

**MTN Mobile Money:**
```javascript
// Collection (Receive Payment)
POST https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay
Headers:
  X-Reference-Id: uuid
  X-Target-Environment: sandbox
  Ocp-Apim-Subscription-Key: {key}
Body:
  {
    amount: "5000",
    currency: "RWF",
    externalId: "transaction_id",
    payer: { partyIdType: "MSISDN", partyId: "250788123456" },
    payerMessage: "Contribution to Ikimina",
    payeeNote: "Umurage Platform"
  }

// Check Status
GET https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/{referenceId}

// Disbursement (Send Money)
POST https://sandbox.momodeveloper.mtn.com/disbursement/v1_0/transfer
```

**Airtel Money:**
```javascript
// Similar API structure
POST https://openapiuat.airtel.africa/merchant/v1/payments/
```

### 2. SACCO Integration

**Account Linking:**
```javascript
// Step 1: Group opens SACCO account (manual)
// Step 2: Link in app
POST /api/sacco/link
{
  group_id: "uuid",
  sacco_id: "umurenge_kigali_001",
  account_number: "1234567890",
  api_credentials: {
    client_id: "...",
    client_secret: "..."
  }
}

// Step 3: Sync balance
GET /api/sacco/balance
Response: {
  account_number: "1234567890",
  balance: 2450000,
  currency: "RWF",
  last_updated: "2026-02-08T20:00:00Z"
}

// Step 4: Transfer funds
POST /api/sacco/transfer
{
  from_account: "1234567890",
  to_account: "mobile_wallet",
  amount: 50000,
  purpose: "Loan disbursement"
}
```

### 3. Africa's Talking (USSD + SMS)

**USSD:**
```javascript
// Receive USSD request
POST /api/ussd
{
  sessionId: "ATUid_...",
  serviceCode: "*123#",
  phoneNumber: "+250788123456",
  text: "1*2*5000" // User selections
}

// Response format
{
  response: "CON Enter amount:\n1. RWF 5,000\n2. RWF 10,000\n3. Custom"
  // CON = Continue, END = End session
}
```

**SMS:**
```javascript
// Send SMS
POST https://api.africastalking.com/version1/messaging
{
  username: "umurage",
  to: "+250788123456",
  message: "Your loan of RWF 50,000 has been approved."
}
```

---

## 🚀 Deployment Architecture

### Infrastructure Setup
```
┌──────────────────────────────────────────────┐
│     Rwanda Data Center VPS (Ubuntu 22.04)    │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Nginx (Port 80/443)                   │ │
│  │  • Reverse proxy                       │ │
│  │  • SSL termination (Let's Encrypt)     │ │
│  │  • Static file serving                 │ │
│  └────────────┬───────────────────────────┘ │
│               │                              │
│  ┌────────────▼───────────────────────────┐ │
│  │  Next.js (Port 3000)                   │ │
│  │  • PWA frontend                        │ │
│  │  • Server-side rendering               │ │
│  │  • PM2 process manager                 │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Node.js API (Port 4000)               │ │
│  │  • Express server                      │ │
│  │  • PM2 cluster mode (4 instances)      │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  PostgreSQL (Port 5432)                │ │
│  │  • Main database                       │ │
│  │  • Daily backups                       │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Redis (Port 6379)                     │ │
│  │  • Cache + sessions                    │ │
│  │  • Job queue                           │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Python AI Service (Port 5000)         │ │
│  │  • FastAPI                             │ │
│  │  • ML models                           │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Domain & SSL
```
Domain: umurage.rw
SSL: Let's Encrypt (auto-renewal)
DNS: CloudFlare (CDN + DDoS protection)
```

### Process Management (PM2)
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'umurage-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/umurage/web',
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'umurage-api',
      script: 'dist/server.js',
      cwd: '/var/www/umurage/api',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
```

---

## 📊 Monitoring & Logging

### Application Monitoring
```
Sentry: Error tracking & performance
- Frontend errors
- Backend exceptions
- Performance metrics

DataDog/New Relic: Infrastructure monitoring
- CPU/Memory usage
- API response times
- Database query performance
```

### Logging Strategy
```javascript
// Winston logger configuration
{
  levels: {
    error: 0,   // Critical errors
    warn: 1,    // Warnings
    info: 2,    // General info
    debug: 3    // Debug info
  },
  
  transports: [
    // Console (development)
    new winston.transports.Console(),
    
    // File (production)
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ]
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        run: |
          ssh user@vps "cd /var/www/umurage && git pull"
          ssh user@vps "cd /var/www/umurage && npm install"
          ssh user@vps "pm2 restart all"
```

---

## 📈 Scalability Considerations

### Horizontal Scaling
```
Load Balancer (Nginx)
       ↓
┌──────┴──────┐
│   API 1     │
│   API 2     │  ← PM2 Cluster
│   API 3     │
│   API 4     │
└─────────────┘
       ↓
  PostgreSQL (Read Replicas)
```

### Caching Strategy
```
Level 1: Browser Cache (PWA)
Level 2: CDN Cache (Static assets)
Level 3: Redis Cache (API responses)
Level 4: Database Query Cache
```

---

## 💰 Infrastructure Costs

### MVP (First 6 months)
```
VPS (4GB RAM, 2 CPU):        $40/month
Domain (umurage.rw):         $15/year
SSL (Let's Encrypt):         Free
CloudFlare CDN:              Free tier
Africa's Talking:            $20/month (USSD)
Sentry:                      Free tier
Total:                       ~$62/month
```

### Production (After launch)
```
VPS (8GB RAM, 4 CPU):        $80/month
Database Backups:            $10/month
CDN (CloudFlare Pro):        $20/month
SMS Notifications:           $50/month
Monitoring (DataDog):        $30/month
Total:                       ~$190/month
```

---

## 📋 Summary

This architecture provides:

✅ **Scalable** - Can handle 100,000+ users
✅ **Reliable** - 99.9% uptime with proper monitoring
✅ **Secure** - Bank-level security standards
✅ **Cost-effective** - <$100/month for MVP
✅ **Offline-capable** - Works without internet
✅ **Mobile-first** - Responsive PWA
✅ **Accessible** - USSD for feature phones
✅ **Maintainable** - Clean architecture, good documentation

**Ready for development!** 🚀
