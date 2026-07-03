# FlowFinance

A beautiful, modern, local-first personal finance dashboard that runs entirely on your computer. No cloud, no subscriptions, no data sharing.

![FlowFinance Dashboard](screenshot.png)

## Features

- **Dashboard** - Beautiful overview with net worth, income, expenses, savings, investments, and budget tracking
- **Transactions** - Full CRUD with search, sort, filter, pagination, duplicate, and favorites
- **Categories** - Custom income and expense categories with icons and colors
- **Budgets** - Monthly budget tracking with progress bars and warnings
- **Goals** - Savings goals with progress tracking and estimated completion
- **Investments** - Portfolio tracking with profit/loss calculations
- **Analytics** - Cash flow charts, category breakdowns, and net worth growth
- **Settings** - Currency, language, theme, and auto-backup configuration
- **Backups** - Manual and automatic database backups with restore capability
- **Export** - CSV export for all transactions

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- Recharts (charts)
- TanStack Query (data fetching)
- Axios (API client)

**Backend:**
- Express.js
- Prisma ORM
- SQLite (local database)

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Clone or download the project
cd flowfinance

# Install dependencies
npm install

# Initialize the database (creates SQLite file and seeds default data)
npm run db:push
npm run db:seed

# Start the application (runs both frontend and backend)
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

### Production Build

```bash
# Build the frontend
npm run build

# Start the production server (serves frontend + API)
npm start
```

### Access from Other Devices

To access FlowFinance from your phone or other devices on the same Wi-Fi network:

1. Find your computer's local IP address:
   - **Windows:** `ipconfig` (look for IPv4 Address)
   - **Mac/Linux:** `ifconfig` or `ip addr` (look for inet)

2. Start the servers:
   ```bash
   npm run dev
   ```

3. On your other device, open:
   ```
   http://YOUR_COMPUTER_IP:3000
   ```

## Project Structure

```
flowfinance/
├── api/                      # Express backend
│   ├── lib/
│   │   └── prisma.ts         # Prisma client setup
│   └── server.ts             # Express server with all routes
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Seed data (categories, payment methods, sample data)
│   └── finance.db            # SQLite database (auto-created)
├── backups/                  # Backup files (auto-created)
├── src/
│   ├── components/
│   │   ├── layout/           # Sidebar, TopBar, MobileNav, AppLayout
│   │   └── transactions/     # TransactionForm
│   ├── lib/
│   │   ├── api.ts            # API functions and types
│   │   └── utils.ts          # Utility functions (formatCurrency, etc.)
│   ├── pages/                # All page components
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Categories.tsx
│   │   ├── Budgets.tsx
│   │   ├── Goals.tsx
│   │   ├── Investments.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   └── Backups.tsx
│   ├── App.tsx               # Main app with routing
│   └── main.tsx              # Entry point
├── .env                      # Environment variables
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Default Data

The database comes pre-seeded with:
- **29 Categories** - Food, Rent, Transport, Salary, Freelance, etc.
- **7 Payment Methods** - Cash, Debit Card, Credit Card, PIX, etc.
- **12 Sample Transactions** - Realistic demo data
- **3 Budgets** - Food, Transport, Groceries
- **3 Goals** - Emergency Fund, Vacation, Laptop
- **3 Investments** - Apple Stock, S&P 500 ETF, Bitcoin

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/summary` | GET | Dashboard summary data |
| `/api/dashboard/charts` | GET | Chart data (cashflow, categories, trends) |
| `/api/dashboard/recent` | GET | Recent transactions |
| `/api/transactions` | GET/POST | List/Create transactions |
| `/api/transactions/:id` | PUT/DELETE | Update/Delete transaction |
| `/api/transactions/:id/duplicate` | POST | Duplicate transaction |
| `/api/categories` | GET/POST | List/Create categories |
| `/api/payment-methods` | GET/POST | List/Create payment methods |
| `/api/budgets` | GET/POST | List/Create budgets |
| `/api/goals` | GET/POST | List/Create goals |
| `/api/investments` | GET/POST | List/Create investments |
| `/api/reports/cashflow` | GET | Cash flow report |
| `/api/reports/categories` | GET | Category analysis |
| `/api/reports/networth` | GET | Net worth report |
| `/api/settings` | GET/PUT | Get/Update settings |
| `/api/backup/create` | POST | Create backup |
| `/api/backup/list` | GET | List backups |
| `/api/backup/restore/:id` | POST | Restore backup |
| `/api/export/csv` | GET | Export CSV |

## Database Schema

```
Category        - id, name, icon, color, type, isDefault
PaymentMethod   - id, name, icon, color, isDefault
Transaction     - id, title, amount, type, categoryId, paymentMethodId, date, time, merchant, installments, tags, notes, isFavorite
Budget          - id, categoryId, amount, period, month, year
Goal            - id, name, targetAmount, currentAmount, targetDate, color, icon
Investment      - id, name, category, broker, amountInvested, currentValue, purchaseDate, notes
Settings        - id, currency, language, theme, autoBackup, backupInterval
Backup          - id, filename, path, size, createdAt
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development (frontend + backend) |
| `npm run server` | Start backend only |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:push` | Sync schema to database |
| `npm run db:seed` | Seed default data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database and re-seed |

## PWA Support

FlowFinance can be installed as a Progressive Web App:
- **Chrome/Edge:** Click the install icon in the address bar
- **Safari (iOS):** Share → Add to Home Screen
- **Chrome (Android):** Menu → Add to Home Screen

## Security

- All form inputs are validated
- SQL injection prevention via Prisma ORM
- Input sanitization on all API endpoints
- No external API calls - completely offline-capable
- No authentication needed - single user local app

## License

MIT License - Free for personal and commercial use.
