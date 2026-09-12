# IntelliSpend with Plaid 💳📊

> **A full-stack personal finance management dashboard with Plaid Sandbox integration, transaction tracking, budgeting, financial goals, analytics, and AI-powered insights.**

IntelliSpend is a modern personal finance management application designed to help users understand, organize, and monitor their financial activity in one place.

The Plaid version extends the original IntelliSpend application by integrating **Plaid Sandbox**, allowing users to securely connect a simulated bank account and import financial transactions while preserving the existing manual transaction system.

---

## ✨ Features

### 🔐 Authentication

* User registration and login
* Secure password hashing using `bcryptjs`
* Session-based authentication with NextAuth
* Protected user-specific financial data

### 💳 Plaid Bank Integration

* Connect a simulated bank account using Plaid Sandbox
* Generate Plaid Link tokens
* Exchange public tokens securely on the server
* Retrieve connected bank accounts
* Import transactions from connected accounts
* Synchronize transactions using Plaid's transaction sync mechanism
* Store Plaid account and item information
* Automatically identify imported transactions as `PLAID` transactions

### 💰 Transaction Management

* Add transactions manually
* View transaction history
* Categorize transactions
* Support income and expense transactions
* Track transaction dates
* Distinguish between:

  * `MANUAL` transactions
  * `PLAID` imported transactions
* Prevent duplicate Plaid transactions

### 📊 Financial Analytics

* Expense and income analysis
* Category-based spending analysis
* Financial summaries
* Visual dashboard insights
* Transaction-based financial overview

### 🎯 Budgets

* Create budgets
* Track budget progress
* Monitor spending against budget limits

### 🏆 Financial Goals

* Create financial goals
* Track target amounts
* Monitor goal progress

### 🤖 AI Financial Insights

* Generate financial insights from transaction data
* Identify spending patterns
* Provide useful financial observations

### ⚙️ Settings

* User account settings
* Profile management
* Application configuration

---

# 🛠️ Tech Stack

| Technology          | Purpose                                  |
| ------------------- | ---------------------------------------- |
| **Next.js 16**      | Full-stack React framework               |
| **React 19**        | Frontend UI                              |
| **TypeScript**      | Type-safe development                    |
| **Tailwind CSS v4** | Styling                                  |
| **PostgreSQL 18**   | Relational database                      |
| **Prisma 7**        | ORM and database management              |
| **NextAuth**        | Authentication                           |
| **bcryptjs**        | Password hashing                         |
| **Plaid Sandbox**   | Bank account and transaction integration |
| **Node.js 24**      | Runtime                                  |
| **Git & GitHub**    | Version control                          |

---

# 🏗️ Project Architecture

```text
IntelliSpend_with_Plaid
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── analytics/
│   ├── budgets/
│   ├── dashboard/
│   ├── goals/
│   ├── insights/
│   ├── settings/
│   ├── transactions/
│   ├── welcome/
│   │
│   └── api/
│       ├── auth/
│       └── plaid/
│           ├── accounts/
│           ├── create-link-token/
│           ├── exchange-token/
│           ├── remap-transactions/
│           └── transactions/
│
├── components/
│   └── PlaidLink.tsx
│
├── lib/
│   ├── prisma.ts
│   └── ...
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed-user.ts
│
├── public/
│
├── types/
│   └── next-auth.d.ts
│
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

---

# 🗄️ Database Design

The application uses **PostgreSQL** with **Prisma ORM**.

### Main database models

```text
User
 │
 ├── Transactions
 ├── Budgets
 ├── Goals
 ├── AIInsights
 └── PlaidItems
       │
       └── PlaidAccounts
              │
              └── Transactions
```

### Core Models

#### User

Stores authenticated user information.

```text
User
├── id
├── name
├── email
├── passwordHash
├── createdAt
└── updatedAt
```

#### Transaction

Stores both manually created and Plaid-imported transactions.

```text
Transaction
├── id
├── description
├── amount
├── type
├── category
├── subcategory
├── date
├── source
├── plaidTransactionId
├── userId
└── timestamps
```

### Transaction Sources

```text
MANUAL
PLAID
```

This allows IntelliSpend to maintain the existing manual transaction functionality while also supporting bank-imported transactions.

#### PlaidItem

Represents a connected Plaid institution.

```text
PlaidItem
├── id
├── itemId
├── accessToken
├── institutionId
├── institutionName
├── syncCursor
├── userId
└── timestamps
```

#### PlaidAccount

Stores accounts retrieved from Plaid.

```text
PlaidAccount
├── id
├── accountId
├── name
├── officialName
├── mask
├── type
├── subtype
├── plaidItemId
└── timestamps
```

---

# 🔄 How Plaid Integration Works

The Plaid integration follows this flow:

```text
User
  │
  ▼
Connect Bank Account
  │
  ▼
Plaid Link
  │
  ▼
Create Link Token
  │
  ▼
User selects Sandbox institution
  │
  ▼
Public Token
  │
  ▼
Exchange Public Token
  │
  ▼
Plaid Access Token
  │
  ▼
Retrieve Accounts
  │
  ▼
Sync Transactions
  │
  ▼
Map Plaid Transactions
  │
  ▼
Store in PostgreSQL
  │
  ▼
Display in IntelliSpend
  │
  ├── Dashboard
  ├── Transactions
  ├── Analytics
  └── Insights
```

### Transaction separation

IntelliSpend keeps two transaction sources:

```text
                 Transactions
                      │
            ┌─────────┴─────────┐
            │                   │
         MANUAL                PLAID
            │                   │
     Cash / manual       Bank/card imports
       entries            from Plaid Sandbox
```

This means adding Plaid does **not** remove or replace the existing transaction system.

---

# 🔑 Environment Variables

Create a local `.env` file in the project root.

```env
DATABASE_URL="your_postgresql_database_url"
NEXTAUTH_SECRET="your_nextauth_secret"

PLAID_CLIENT_ID="your_plaid_client_id"
PLAID_SECRET="your_plaid_secret"
PLAID_ENV="sandbox"
```

A safe template is provided in:

```text
.env.example
```

### Important

Never commit the real `.env` file to GitHub.

The repository ignores:

```text
.env*
```

while allowing:

```text
.env.example
```

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/SKAVYA25/IntelliSpend_with_Plaid.git
```

Move into the project:

```bash
cd IntelliSpend_with_Plaid
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure PostgreSQL

Create a PostgreSQL database.

Example:

```sql
CREATE DATABASE intelli_spend_plaid;
```

Then configure:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/intelli_spend_plaid"
```

Replace the username and password with your local PostgreSQL credentials.

---

# 🧬 Prisma Setup

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply existing migrations:

```bash
npx prisma migrate deploy
```

For local development where schema changes are being created:

```bash
npx prisma migrate dev
```

Example:

```bash
npx prisma migrate dev --name add_feature_name
```

---

# ▶️ Run the Application

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🏭 Production Build

Before deployment, test the production build:

```bash
npm run build
```

If the build succeeds, start the production server:

```bash
npm start
```

---

# 🧪 Plaid Sandbox Setup

The application uses **Plaid Sandbox** for development and testing.

Configure:

```env
PLAID_ENV="sandbox"
```

The Plaid credentials are obtained from the Plaid developer dashboard.

The application uses Plaid's:

```text
Transactions
```

product.

### Typical flow

1. Start IntelliSpend.
2. Log in.
3. Open the Plaid connection section.
4. Click **Connect Bank Account**.
5. Plaid Link opens.
6. Select a Sandbox institution.
7. Complete the Sandbox authentication flow.
8. The application exchanges the public token.
9. The connected account is stored.
10. Transactions are synchronized.
11. Imported transactions appear in IntelliSpend.

---

# 🧪 Testing Manual Transactions

Manual transactions continue to work independently from Plaid.

For example:

```text
Add Transaction
      │
      ▼
Enter description
      │
      ▼
Enter amount
      │
      ▼
Select income/expense
      │
      ▼
Select category
      │
      ▼
Save
```

These transactions are stored with:

```text
source = MANUAL
```

Plaid-imported transactions are stored with:

```text
source = PLAID
```

---

# 🔍 Useful Development Commands

## Next.js

Start development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

Start production server:

```bash
npm start
```

Check installed packages:

```bash
npm list
```

---

# 🧬 Prisma Commands

Generate Prisma Client:

```bash
npx prisma generate
```

Create and apply a migration:

```bash
npx prisma migrate dev --name migration_name
```

Apply migrations:

```bash
npx prisma migrate deploy
```

Check migration status:

```bash
npx prisma migrate status
```

Open Prisma Studio:

```bash
npx prisma studio
```

Format Prisma schema:

```bash
npx prisma format
```

Validate Prisma schema:

```bash
npx prisma validate
```

---

# 🐘 PostgreSQL Commands

Open PostgreSQL using `psql`:

```bash
psql -U postgres
```

List databases:

```sql
\l
```

Connect to IntelliSpend:

```sql
\c intelli_spend_plaid
```

List tables:

```sql
\dt
```

Describe a table:

```sql
\d "User"
```

View transactions:

```sql
SELECT * FROM "Transaction";
```

View users:

```sql
SELECT * FROM "User";
```

View Plaid items:

```sql
SELECT * FROM "PlaidItem";
```

View Plaid accounts:

```sql
SELECT * FROM "PlaidAccount";
```

Exit PostgreSQL:

```sql
\q
```

---

# 🐛 Troubleshooting

## Check Node.js version

```bash
node --version
```

Expected development environment:

```text
v24.x
```

## Check npm

```bash
npm --version
```

## Check Git

```bash
git --version
```

## Check PostgreSQL

```bash
psql --version
```

---

## Prisma Database Connection Error

Check:

```env
DATABASE_URL
```

Then run:

```bash
npx prisma validate
```

and:

```bash
npx prisma migrate status
```

---

## Prisma Client Error

Run:

```bash
npx prisma generate
```

Then restart the development server:

```bash
npm run dev
```

---

## Migration Error

Check migration status:

```bash
npx prisma migrate status
```

For development:

```bash
npx prisma migrate dev
```

For an existing production-style database:

```bash
npx prisma migrate deploy
```

---

## Build Error

Run:

```bash
npm run build
```

Read the first actual error in the output and fix that issue before retrying.

After making changes:

```bash
npm run build
```

---

# 🔐 Security Considerations

This project follows several basic security practices:

* Passwords are hashed using `bcryptjs`.
* Authentication is handled using NextAuth.
* Database credentials are stored in environment variables.
* Plaid credentials are stored in environment variables.
* `.env` is excluded from Git.
* `.env.example` contains only placeholder values.
* User-specific database records are associated with authenticated users.
* Plaid access tokens are not exposed to the frontend.
* Plaid API communication is handled through server-side API routes.

### Never commit secrets

Do **not** commit:

```text
.env
PLAID_SECRET
NEXTAUTH_SECRET
DATABASE_URL
```

---

# 📁 Important API Routes

| Route                           | Purpose                          |
| ------------------------------- | -------------------------------- |
| `/api/plaid/create-link-token`  | Creates a Plaid Link token       |
| `/api/plaid/exchange-token`     | Exchanges the Plaid public token |
| `/api/plaid/accounts`           | Retrieves connected accounts     |
| `/api/plaid/transactions`       | Synchronizes transactions        |
| `/api/plaid/remap-transactions` | Handles transaction remapping    |

---

# 🔄 Git Workflow

Check project status:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "your commit message"
```

Push:

```bash
git push
```

Pull latest changes:

```bash
git pull
```

View commit history:

```bash
git log --oneline
```

---

# 📦 Project Database Migrations

Current migration history includes:

```text
20260908132852_init
20260908174410_add_user_password
20260910121729_add_plaid_support
20260910152339_add_transaction_subcategory
```

The migrations represent the evolution of the application from the original IntelliSpend database structure to the Plaid-enabled version.

---

# 🌱 Development Philosophy

The Plaid integration was implemented as an extension of the existing IntelliSpend application rather than replacing its original functionality.

The core financial features remain available:

```text
Authentication
      +
Transactions
      +
Budgets
      +
Goals
      +
Analytics
      +
AI Insights
      +
Plaid Integration
```

This allows IntelliSpend to support both:

* **Manual financial entries**
* **Automatically imported bank transactions**

---

# 🚀 Future Improvements

Possible future enhancements include:

* Production Plaid environment support
* More financial institutions
* Improved transaction categorization
* Advanced spending analytics
* Recurring transaction detection
* Budget alerts
* Financial forecasting
* Enhanced AI-generated insights
* Deployment with managed PostgreSQL
* Improved mobile responsiveness
* Additional financial visualizations

---

# 🎓 Project Purpose

IntelliSpend was developed as a full-stack academic/project application to demonstrate practical implementation of:

* Full-stack web development
* Database design
* Authentication
* REST API development
* ORM-based database management
* Third-party API integration
* Financial data visualization
* Transaction management
* AI-assisted financial insights
* Secure environment configuration
* Git/GitHub version control

---

# 👩‍💻 Author

**Kavya Suresh**

B.Tech Computer Science Engineering

Interested in:

* Full-Stack Development
* Java
* Python
* Artificial Intelligence
* Financial Technology

---

# 📜 License

This project is intended for educational and portfolio purposes.
