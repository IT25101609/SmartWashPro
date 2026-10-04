# SmartWash Pro
## Enterprise Web-Based Laundry Management System
### Crystal Clean Laundry (Pvt) Ltd.

---

<div align="center">

![SmartWash Pro](https://img.shields.io/badge/SmartWash-Pro-FF6B00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJhMTAgMTAgMCAxIDAgMTAgMTBBMTAgMTAgMCAwIDAgMTIgMnoiIGZpbGw9IiNGRjZCMDAiLz48L3N2Zz4=)
![Java](https://img.shields.io/badge/Java-17+-ED8B00?style=for-the-badge&logo=java&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens)

**University Final-Year Software Engineering Project**

*Replacing manual phone/paper workflows with a centralized digital laundry management platform*

</div>

---

## Table of Contents

1. [Project Introduction](#1-project-introduction)
2. [Project Objectives](#2-project-objectives)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Database ER Description](#6-database-er-description)
7. [Folder Structure](#7-folder-structure)
8. [Prerequisites](#8-prerequisites)
9. [MySQL Setup](#9-mysql-setup)
10. [Backend Setup](#10-backend-setup)
11. [Frontend Setup](#11-frontend-setup)
12. [Environment Variables](#12-environment-variables)
13. [API Documentation](#13-api-documentation)
14. [User Roles](#14-user-roles)
15. [Feature List](#15-feature-list)
16. [Business Rules](#16-business-rules)
17. [Sample Credentials](#17-sample-credentials)
18. [Testing Instructions](#18-testing-instructions)
19. [Demo Workflow](#19-demo-workflow)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Project Introduction

**SmartWash Pro** is a full-stack enterprise web application developed for **Crystal Clean Laundry (Pvt) Ltd.** as a university final-year Software Engineering project.

The system replaces the company's current manual, phone-call and paper-based workflow with a centralized digital platform. It handles the complete lifecycle of laundry operations — from customer registration and order placement, through processing, delivery, and payment — while providing comprehensive dashboards for all stakeholder roles.

### Key Highlights

- 🔐 **Secure** — JWT authentication, BCrypt password hashing, role-based access control
- 📱 **Responsive** — Works on desktop, laptop, tablet, and mobile
- 🎯 **Role-Based** — 6 distinct portals for each stakeholder type
- 📊 **Analytics** — Real-time dashboards with charts and KPI cards
- 🔔 **Notifications** — Internal notification system for all major events
- 🗄️ **MySQL Backed** — Fully relational, normalized database

---

## 2. Project Objectives

1. Digitize order placement and reduce manual phone-call handling
2. Provide real-time order tracking for customers
3. Enable efficient staff task assignment and monitoring
4. Automate payment recording and receipt generation
5. Monitor equipment health and schedule maintenance
6. Track inventory levels and trigger low-stock alerts
7. Provide analytics dashboards for management decision-making
8. Enable customers to submit feedback and complaints digitally
9. Support pickup scheduling and delivery management

---

## 3. Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Language | Java 17+ |
| Framework | Spring Boot 3.x |
| ORM | Spring Data JPA + Hibernate |
| Security | Spring Security + JWT (JJWT 0.11.5) |
| Password Hashing | BCrypt |
| Build Tool | Apache Maven |
| Validation | Jakarta Bean Validation |
| Database Driver | MySQL Connector/J |
| Utilities | Lombok |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 + Vite 5 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | React Icons |
| Notifications | React Hot Toast |
| Forms | React Hook Form |
| Date Utilities | date-fns |

### Database
| Component | Technology |
|-----------|-----------|
| RDBMS | MySQL 8.x |
| Schema | `smartwash_pro` |
| Access Pattern | Spring Data JPA Repositories |
| Query Building | JPA Specifications, JPQL |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SMARTWASH PRO                            │
│                                                                 │
│  ┌─────────────────┐              ┌──────────────────────────┐  │
│  │  React Frontend │◄────REST────►│  Spring Boot Backend     │  │
│  │  (Vite + React) │   API/JSON   │  (Port 8080)             │  │
│  │  (Port 5173)    │              │                          │  │
│  │                 │              │  ┌─────────────────────┐ │  │
│  │  ┌───────────┐  │              │  │  Spring Security     │ │  │
│  │  │Auth Context│  │              │  │  + JWT Filter        │ │  │
│  │  └───────────┘  │              │  └─────────────────────┘ │  │
│  │  ┌───────────┐  │              │  ┌─────────────────────┐ │  │
│  │  │ Role-Based │  │              │  │  REST Controllers    │ │  │
│  │  │  Routing  │  │              │  │  (20+ endpoints)     │ │  │
│  │  └───────────┘  │              │  └─────────────────────┘ │  │
│  │  ┌───────────┐  │              │  ┌─────────────────────┐ │  │
│  │  │6 Dashboards│  │              │  │  Service Layer       │ │  │
│  │  └───────────┘  │              │  │  (Business Logic)    │ │  │
│  └─────────────────┘              │  └─────────────────────┘ │  │
│                                   │  ┌─────────────────────┐ │  │
│                                   │  │  Spring Data JPA     │ │  │
│                                   │  │  Repositories        │ │  │
│                                   │  └──────────┬──────────┘ │  │
│                                   └─────────────┼────────────┘  │
│                                                 │               │
│                                   ┌─────────────▼────────────┐  │
│                                   │     Hibernate ORM        │  │
│                                   └─────────────┬────────────┘  │
│                                                 │               │
│                                   ┌─────────────▼────────────┐  │
│                                   │    MySQL 8.x Database    │  │
│                                   │    (smartwash_pro)       │  │
│                                   └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Architecture

The `smartwash_pro` database contains **20+ normalized tables**:

```
users                  ← All system users (all roles)
customers              ← Customer profile (extends users)
employees              ← Employee profile (extends users)
laundry_services       ← Available laundry services + pricing
orders                 ← Main order records
order_items            ← Line items per order
order_status_history   ← Every status change with who/when/why
payments               ← Payment records + receipts
equipment              ← Laundry machines and equipment
maintenance            ← Scheduled and completed maintenance
breakdowns             ← Equipment breakdown records
inventory              ← Stock items (detergents, chemicals, etc.)
suppliers              ← Supplier directory
stock_transactions     ← Every inventory movement (in/out)
employee_tasks         ← Tasks assigned to employees
attendance             ← Daily employee attendance
pickups                ← Customer pickup requests
deliveries             ← Delivery assignments
feedback               ← Customer ratings and reviews
complaints             ← Customer complaints
notifications          ← System notifications for all users
```

---

## 6. Database ER Description

### Core Relationships

**User is the root entity:**
- A `User` can be either a `Customer` or an `Employee` (via OneToOne relationships)
- `User.role` determines which profile exists

**Order is the central operational entity:**
- An `Order` belongs to a `Customer`
- An `Order` may be created by a `Receptionist` (User)
- An `Order` has multiple `OrderItems` (the selected services)
- An `Order` has one `Payment`
- An `Order` has multiple `OrderStatusHistory` records
- An `Order` may have one `Pickup` and one `Delivery`
- An `Order` may receive `Feedback` and `Complaints`

**Employee relationships:**
- An `Employee` can have multiple `EmployeeTasks`
- An `Employee` has daily `Attendance` records
- An `Employee` (as Driver) can be assigned to `Pickups` and `Deliveries`

**Equipment relationships:**
- `Equipment` has multiple `Maintenance` records
- `Equipment` has multiple `Breakdown` records

**Inventory relationships:**
- `Inventory` items belong to a `Supplier`
- Every stock movement creates a `StockTransaction`

---

## 7. Folder Structure

```
SMARTWASH-PRO/
│
├── backend/                               ← Spring Boot Maven Project
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/smartwashpro/
│           │   ├── SmartWashProApplication.java
│           │   ├── config/               ← Security, CORS, App config
│           │   ├── controller/           ← 20+ REST controllers
│           │   ├── service/              ← Business logic layer
│           │   ├── repository/           ← Spring Data JPA repos
│           │   ├── model/                ← JPA entities + enums
│           │   ├── dto/                  ← Request + Response DTOs
│           │   ├── mapper/               ← Entity ↔ DTO mappers
│           │   ├── security/             ← JWT + Spring Security
│           │   ├── exception/            ← Global exception handling
│           │   └── util/                 ← Helper utilities
│           └── resources/
│               ├── application.properties
│               └── application-dev.properties
│
├── frontend/                              ← React + Vite Project
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── context/                       ← AuthContext, NotificationContext
│       ├── hooks/                         ← Custom React hooks
│       ├── services/                      ← Axios API service files
│       ├── routes/                        ← ProtectedRoute, RoleRoute
│       ├── components/
│       │   ├── common/                    ← Shared UI components
│       │   ├── layout/                    ← Sidebar, Topbar, Layout
│       │   ├── charts/                    ← Chart components
│       │   ├── tables/                    ← DataTable
│       │   ├── modals/                    ← Modal components
│       │   └── forms/                     ← Form input components
│       └── pages/
│           ├── auth/                      ← Login, Register
│           ├── customer/                  ← Customer portal (9 pages)
│           ├── manager/                   ← Manager portal (12 pages)
│           ├── receptionist/              ← Receptionist portal (4 pages)
│           ├── laundryStaff/              ← Staff portal (3 pages)
│           ├── driver/                    ← Driver portal (3 pages)
│           └── finance/                   ← Finance portal (3 pages)
│
├── database/
│   ├── schema.sql                         ← Complete MySQL schema
│   └── data.sql                           ← Sample data + demo accounts
│
├── docs/
│   ├── API.md                             ← REST API reference
│   ├── DATABASE.md                        ← Schema + ER documentation
│   └── ARCHITECTURE.md                    ← System architecture
│
├── .env.example                           ← Environment variable template
├── .gitignore
└── README.md                              ← This file
```

---

## 8. Prerequisites

Ensure the following are installed on your system:

| Software | Version | Check Command |
|----------|---------|---------------|
| Java JDK | 17+ | `java -version` |
| Apache Maven | 3.8+ | `mvn -version` |
| Node.js | 18+ | `node -version` |
| npm | 9+ | `npm -version` |
| MySQL Server | 8.x | `mysql --version` |
| Git | Any | `git --version` |

---

## 9. MySQL Setup

### Step 1 — Start MySQL Server
```bash
# Windows (if using XAMPP)
# Start MySQL from XAMPP Control Panel

# Windows (if installed as service)
net start MySQL80

# Linux/Mac
sudo service mysql start
```

### Step 2 — Create Database and Load Schema
```bash
# Login to MySQL
mysql -u root -p

# Inside MySQL prompt:
mysql> CREATE DATABASE IF NOT EXISTS smartwash_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> USE smartwash_pro;
mysql> SOURCE /path/to/database/schema.sql;
mysql> SOURCE /path/to/database/data.sql;
mysql> exit;
```

Or run in one command:
```bash
mysql -u root -p smartwash_pro < database/schema.sql
mysql -u root -p smartwash_pro < database/data.sql
```

### Step 3 — Verify
```sql
USE smartwash_pro;
SHOW TABLES;
SELECT COUNT(*) FROM users;  -- Should show 6 demo users
```

---

## 10. Backend Setup

### Step 1 — Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set your MySQL password:
DB_PASSWORD=your_mysql_root_password
JWT_SECRET=YourVeryLongSecureJWTSecretKeyHere2024SmartWashPro
```

### Step 2 — Build and Run
```bash
cd backend

# Build (skip tests for quick start)
mvn clean install -DskipTests

# Run
mvn spring-boot:run
```

Or with environment variables:
```bash
DB_PASSWORD=yourpassword mvn spring-boot:run
```

### Step 3 — Verify
```
# Backend running at:
http://localhost:8080

# Health check (should return 200):
curl http://localhost:8080/api/auth/me
# Expected: 401 Unauthorized (not logged in — that's correct!)

# Test login:
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@smartwash.com","password":"password123"}'
```

---

## 11. Frontend Setup

### Step 1 — Install Dependencies
```bash
cd frontend
npm install
```

### Step 2 — Configure
```bash
# Create frontend .env
echo "VITE_API_BASE_URL=http://localhost:8080/api" > .env
```

### Step 3 — Run
```bash
npm run dev
```

### Step 4 — Open
```
http://localhost:5173
```

---

## 12. Environment Variables

### Backend (`backend/` or root `.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | MySQL JDBC URL | `jdbc:mysql://localhost:3306/smartwash_pro?...` |
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `root` |
| `JWT_SECRET` | JWT signing secret (min 256-bit) | Built-in default |
| `JWT_EXPIRATION_MS` | Token expiry in ms | `86400000` (24h) |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api` |

---

## 13. API Documentation

See [`docs/API.md`](docs/API.md) for the complete REST API reference.

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new customer |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/orders` | List orders (paginated) |
| POST | `/api/orders` | Place new order |
| PUT | `/api/orders/{id}/status` | Update order status |
| GET | `/api/dashboard/manager` | Manager analytics |
| GET | `/api/inventory` | List inventory |
| GET | `/api/employees` | List employees |
| ... | | See full API docs |

---

## 14. User Roles

| Role | Description | Portal |
|------|-------------|--------|
| `CUSTOMER` | Laundry customers | `/customer/dashboard` |
| `BRANCH_MANAGER` | Branch manager / admin | `/manager/dashboard` |
| `RECEPTIONIST` | Front desk staff | `/reception/dashboard` |
| `LAUNDRY_STAFF` | Washing/ironing staff | `/staff/dashboard` |
| `DELIVERY_DRIVER` | Pickup/delivery drivers | `/driver/dashboard` |
| `FINANCE_LEAD` | Finance team | `/finance/dashboard` |

---

## 15. Feature List

### Customer Features
- ✅ Registration and login
- ✅ 6-step order placement wizard
- ✅ Real-time order tracking with status timeline
- ✅ Pickup scheduling with time slot selection
- ✅ Payment history and receipts
- ✅ 5-star feedback with text review
- ✅ Complaint submission and tracking
- ✅ Push notifications for order events
- ✅ Profile management

### Manager Features
- ✅ Full analytics dashboard with charts
- ✅ Employee management (CRUD)
- ✅ Task assignment to employees
- ✅ Attendance monitoring
- ✅ Equipment management with maintenance scheduling
- ✅ Inventory management with low-stock alerts
- ✅ Supplier management
- ✅ Financial reports
- ✅ Feedback review and complaint management

### Receptionist Features
- ✅ Order intake for walk-in customers
- ✅ Customer search and management
- ✅ Payment processing
- ✅ Receipt generation

### Laundry Staff Features
- ✅ View assigned tasks and orders
- ✅ View special handling instructions
- ✅ Update processing status

### Delivery Driver Features
- ✅ View assigned pickups and deliveries
- ✅ Confirm collections and deliveries
- ✅ Record cash-on-delivery payments

### Finance Lead Features
- ✅ Revenue dashboards with charts
- ✅ Transaction search and filtering
- ✅ Payment method breakdown
- ✅ Financial reports

---

## 16. Business Rules

### Order Rules
- Only authenticated customers/receptionists can place orders
- Orders must contain at least one service
- Total price is always calculated by the backend (not trusted from frontend)
- Invalid status transitions are rejected (e.g., PLACED → DELIVERED not allowed)
- Status history is recorded for every change

### Payment Rules
- Payment amount must match order total
- Paid orders cannot be incorrectly marked unpaid
- Unique receipt numbers are auto-generated

### Inventory Rules
- Stock quantity cannot go negative
- Low-stock notifications are auto-generated when quantity ≤ minimumStockLevel

### Security Rules
- Passwords are always BCrypt-hashed (never plain-text)
- JWT tokens are validated on every request
- Customers can only access their own orders/payments/pickups
- Role-based endpoint protection enforced in Spring Security

---

## 17. Sample Credentials

> All passwords: `password123`

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@smartwash.com` | `password123` |
| Branch Manager | `manager@smartwash.com` | `password123` |
| Receptionist | `reception@smartwash.com` | `password123` |
| Laundry Staff | `staff@smartwash.com` | `password123` |
| Delivery Driver | `driver@smartwash.com` | `password123` |
| Finance Lead | `finance@smartwash.com` | `password123` |

---

## 18. Testing Instructions

### Backend Tests
```bash
cd backend
mvn test
```

### Manual API Testing (with curl or Postman)
```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@smartwash.com","password":"password123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Place an order
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"serviceId":1,"quantity":2}],"specialInstructions":"Delicate","paymentMethod":"CASH"}'

# 3. Get my orders
curl http://localhost:8080/api/orders/my \
  -H "Authorization: Bearer $TOKEN"
```

### Postman Collection
Import the API base URL `http://localhost:8080` and test endpoints manually using the credentials above.

---

## 19. Demo Workflow

### Scenario 1 — Customer Places Order
1. Open `http://localhost:5173` → Login as `customer@smartwash.com`
2. Click **"Place New Order"**
3. Select services (e.g., Washing + Ironing)
4. Enter quantity/weight
5. Add special instructions
6. Choose pickup option
7. Select payment method
8. Review and confirm → Order saved to MySQL

### Scenario 2 — Manager Monitors Dashboard
1. Login as `manager@smartwash.com`
2. View analytics dashboard (charts, KPI cards)
3. Navigate to Orders → see new customer order
4. Navigate to Inventory → check stock levels

### Scenario 3 — Receptionist Processes Walk-in
1. Login as `reception@smartwash.com`
2. Create new order for walk-in customer
3. Record weight and services
4. Process payment → generate receipt

### Scenario 4 — Staff Processes Laundry
1. Login as `staff@smartwash.com`
2. View assigned tasks and orders
3. Update order status (PROCESSING → IN_WASH → READY)

### Scenario 5 — Driver Completes Delivery
1. Login as `driver@smartwash.com`
2. View assigned deliveries
3. Update status to OUT_FOR_DELIVERY → DELIVERED

### Scenario 6 — Customer Tracks Order
1. Login as `customer@smartwash.com`
2. Go to **My Orders** → select the order
3. View real-time status timeline

### Scenario 7 — Customer Submits Feedback
1. Login as `customer@smartwash.com`
2. Go to **Feedback** → select completed order
3. Give 5-star rating + write review

### Scenario 8 — Finance Checks Reports
1. Login as `finance@smartwash.com`
2. View revenue dashboard
3. Check payment method breakdown
4. Review transaction history

---

## 20. Troubleshooting

### Backend Won't Start
```
# Check Java version
java -version  # Must be 17+

# Check MySQL is running
mysql -u root -p

# Check application.properties DB_URL is correct
# Ensure database exists:
mysql -u root -p -e "SHOW DATABASES;" | grep smartwash_pro
```

### Frontend Can't Connect to Backend
```
# Check backend is running on port 8080
curl http://localhost:8080/api/auth/me

# Check CORS: backend must allow http://localhost:5173
# Verify VITE_API_BASE_URL in frontend/.env
```

### Login Returns 401
```
# Verify data.sql was loaded correctly
mysql -u root -p smartwash_pro -e "SELECT email, status FROM users;"

# Confirm the BCrypt hash in data.sql is correct
# The hash for 'password123' is:
# $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

### npm install Fails
```bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and retry
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# Kill process on port 8080 (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## License

This project is developed for academic purposes as a university final-year Software Engineering project.

**Crystal Clean Laundry (Pvt) Ltd.** — SmartWash Pro v1.0.0

---

<div align="center">
Built with ❤️ using Java Spring Boot + React + MySQL
</div>
