import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from './lib/prisma'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me'
const BCRYPT_ROUNDS = 12

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Ensure directories exist
const backupsDir = process.env.BACKUP_PATH || './backups'
const uploadsDir = './uploads'
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

// ============ TYPE AUGMENTATION ============
declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

// ============ DEFAULT DATA HELPERS ============
const DEFAULT_CATEGORIES = [
  // Income
  { name: 'Salary', icon: 'banknote', color: '#22c55e', type: 'INCOME', isDefault: true },
  { name: 'Freelance', icon: 'laptop', color: '#10b981', type: 'INCOME', isDefault: true },
  { name: 'Investments', icon: 'trending-up', color: '#14b8a6', type: 'INCOME', isDefault: true },
  { name: 'Gifts', icon: 'gift', color: '#f59e0b', type: 'INCOME', isDefault: true },
  { name: 'Other Income', icon: 'plus-circle', color: '#6ee7b7', type: 'INCOME', isDefault: true },
  // Expense
  { name: 'Food', icon: 'utensils', color: '#ef4444', type: 'EXPENSE', isDefault: true },
  { name: 'Restaurants', icon: 'chef-hat', color: '#f97316', type: 'EXPENSE', isDefault: true },
  { name: 'Groceries', icon: 'shopping-cart', color: '#fb923c', type: 'EXPENSE', isDefault: true },
  { name: 'Transport', icon: 'car', color: '#3b82f6', type: 'EXPENSE', isDefault: true },
  { name: 'Fuel', icon: 'fuel', color: '#60a5fa', type: 'EXPENSE', isDefault: true },
  { name: 'Rent', icon: 'home', color: '#8b5cf6', type: 'EXPENSE', isDefault: true },
  { name: 'Mortgage', icon: 'building', color: '#a78bfa', type: 'EXPENSE', isDefault: true },
  { name: 'Utilities', icon: 'zap', color: '#eab308', type: 'EXPENSE', isDefault: true },
  { name: 'Water', icon: 'droplet', color: '#06b6d4', type: 'EXPENSE', isDefault: true },
  { name: 'Electricity', icon: 'lightbulb', color: '#facc15', type: 'EXPENSE', isDefault: true },
  { name: 'Internet', icon: 'wifi', color: '#6366f1', type: 'EXPENSE', isDefault: true },
  { name: 'Phone', icon: 'smartphone', color: '#818cf8', type: 'EXPENSE', isDefault: true },
  { name: 'Healthcare', icon: 'heart-pulse', color: '#ec4899', type: 'EXPENSE', isDefault: true },
  { name: 'Insurance', icon: 'shield', color: '#f472b6', type: 'EXPENSE', isDefault: true },
  { name: 'Education', icon: 'graduation-cap', color: '#0ea5e9', type: 'EXPENSE', isDefault: true },
  { name: 'Entertainment', icon: 'gamepad-2', color: '#d946ef', type: 'EXPENSE', isDefault: true },
  { name: 'Streaming', icon: 'tv', color: '#c084fc', type: 'EXPENSE', isDefault: true },
  { name: 'Gaming', icon: 'gamepad', color: '#a855f7', type: 'EXPENSE', isDefault: true },
  { name: 'Shopping', icon: 'shopping-bag', color: '#f43f5e', type: 'EXPENSE', isDefault: true },
  { name: 'Travel', icon: 'plane', color: '#0d9488', type: 'EXPENSE', isDefault: true },
  { name: 'Taxes', icon: 'receipt', color: '#78716c', type: 'EXPENSE', isDefault: true },
  { name: 'Pets', icon: 'paw-print', color: '#b45309', type: 'EXPENSE', isDefault: true },
  { name: 'Family', icon: 'users', color: '#be185d', type: 'EXPENSE', isDefault: true },
  { name: 'Other', icon: 'circle', color: '#a8a29e', type: 'EXPENSE', isDefault: true },
]

const DEFAULT_PAYMENT_METHODS = [
  { name: 'Cash', icon: 'banknote', color: '#22c55e', isDefault: true },
  { name: 'Debit Card', icon: 'credit-card', color: '#3b82f6', isDefault: true },
  { name: 'Credit Card', icon: 'credit-card', color: '#ef4444', isDefault: true },
  { name: 'PIX', icon: 'qr-code', color: '#8b5cf6', isDefault: true },
  { name: 'Bank Transfer', icon: 'building-2', color: '#0ea5e9', isDefault: true },
  { name: 'Digital Wallet', icon: 'wallet', color: '#f59e0b', isDefault: true },
  { name: 'Other', icon: 'circle', color: '#a8a29e', isDefault: true },
]

// ============ AUTH ROUTES (public — no token required) ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      },
    })

    // Create default categories for the new user
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id })),
    })

    // Create default payment methods for the new user
    await prisma.paymentMethod.createMany({
      data: DEFAULT_PAYMENT_METHODS.map((pm) => ({ ...pm, userId: user.id })),
    })

    // Create default settings for the new user
    await prisma.settings.create({
      data: { userId: user.id, currency: 'USD', language: 'en', theme: 'system' },
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Failed to create account' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Failed to login' })
  }
})

// ============ AUTH MIDDLEWARE (all /api/* routes after this require a valid JWT) ============
app.use('/api', (req, res, next) => {
  // Skip auth routes
  if (req.path.startsWith('/auth')) return next()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: number }
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})

// GET /api/auth/me — validate token and return user info (placed after middleware)
app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user info' })
  }
})

// ============ DASHBOARD ROUTES ============
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const userId = req.userId!
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const monthStart = startOfMonth.toISOString().split('T')[0]
    const monthEnd = endOfMonth.toISOString().split('T')[0]

    const [incomeAgg, expenseAgg, allInvestments, allBudgets] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId }, include: { category: true } }),
    ])

    const monthlyIncome = incomeAgg._sum?.amount || 0
    const monthlyExpense = expenseAgg._sum?.amount || 0
    const monthlySavings = monthlyIncome - monthlyExpense
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

    const totalInvested = allInvestments.reduce((s, i) => s + i.amountInvested, 0)
    const totalInvestValue = allInvestments.reduce((s, i) => s + i.currentValue, 0)
    const investmentGrowth = totalInvested > 0 ? ((totalInvestValue - totalInvested) / totalInvested) * 100 : 0

    // Credit card spending
    const creditCardPM = await prisma.paymentMethod.findFirst({ where: { userId, name: 'Credit Card' } })
    let creditCardSpending = 0
    if (creditCardPM) {
      const ccAgg = await prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', paymentMethodId: creditCardPM.id, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      })
      creditCardSpending = ccAgg._sum?.amount || 0
    }

    // Pending payments (installments not yet paid)
    const pendingResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "Transaction"
      WHERE "userId" = ${userId} AND installments = true AND "currentInstallment" < "totalInstallments"
    ` as Array<{ count: number }>
    const pendingPayments = pendingResult[0]?.count || 0

    // Budget used % (optimized with groupBy)
    let budgetUsedPercent = 0
    if (allBudgets.length > 0) {
      const totalBudget = allBudgets.reduce((s, b) => s + b.amount, 0)
      const budgetCategoryIds = allBudgets.map((b) => b.categoryId)

      const categorySpending = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          categoryId: { in: budgetCategoryIds },
          type: 'EXPENSE',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      })

      const spendingMap = new Map(categorySpending.map((s) => [s.categoryId, s._sum?.amount || 0]))
      const totalSpentOnBudgets = allBudgets.reduce((sum, b) => sum + (spendingMap.get(b.categoryId) || 0), 0)

      budgetUsedPercent = totalBudget > 0 ? (totalSpentOnBudgets / totalBudget) * 100 : 0
    }

    // Net worth: (all income - all expenses) + investment value
    const [allIncome, allExpense] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId, type: 'INCOME' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE' }, _sum: { amount: true } }),
    ])
    const netWorth = (allIncome._sum?.amount || 0) - (allExpense._sum?.amount || 0) + totalInvestValue

    res.json({
      netWorth,
      monthlyIncome,
      monthlyExpense,
      monthlySavings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      investmentValue: totalInvestValue,
      investmentGrowth: Math.round(investmentGrowth * 100) / 100,
      creditCardSpending,
      pendingPayments,
      budgetUsedPercent: Math.round(budgetUsedPercent * 100) / 100,
    })
  } catch (err) {
    console.error('Dashboard summary error:', err)
    res.status(500).json({ error: 'Failed to fetch dashboard summary' })
  }
})

app.get('/api/dashboard/charts', async (req, res) => {
  try {
    const userId = req.userId!
    const now = new Date()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(d.toISOString().slice(0, 7)) // YYYY-MM
    }

    const cashFlow = await Promise.all(
      months.map(async (m) => {
        const start = `${m}-01`
        const end = `${m}-31`
        const [inc, exp] = await Promise.all([
          prisma.transaction.aggregate({ where: { userId, type: 'INCOME', date: { gte: start, lte: end } }, _sum: { amount: true } }),
          prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } }, _sum: { amount: true } }),
        ])
        return { month: m, income: inc._sum?.amount || 0, expense: exp._sum?.amount || 0 }
      })
    )

    // Category breakdown (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const categoryBreakdownRaw = await prisma.$queryRaw`
      SELECT c.name, c.color, CAST(SUM(t.amount) AS DOUBLE PRECISION) as total
      FROM "Transaction" t
      JOIN "Category" c ON t."categoryId" = c.id
      WHERE t."userId" = ${userId} AND t.type = 'EXPENSE' AND t.date >= ${monthStart} AND t.date <= ${monthEnd}
      GROUP BY c.id, c.name, c.color
      ORDER BY total DESC
      LIMIT 6
    ` as Array<{ name: string; color: string; total: number }>
    const categoryBreakdown = categoryBreakdownRaw.map(r => ({ ...r, total: Number(r.total) }))

    // Weekly trend (last 7 days)
    const days: { date: string; income: number; expense: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({ where: { userId, type: 'INCOME', date: dateStr }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: dateStr }, _sum: { amount: true } }),
      ])
      days.push({ date: dateStr, income: inc._sum?.amount || 0, expense: exp._sum?.amount || 0 })
    }

    res.json({ cashFlow, categoryBreakdown, weeklyTrend: days })
  } catch (err) {
    console.error('Dashboard charts error:', err)
    res.status(500).json({ error: 'Failed to fetch dashboard charts' })
  }
})

app.get('/api/dashboard/recent', async (req, res) => {
  try {
    const userId = req.userId!
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      take: 10,
      orderBy: { date: 'desc' },
      include: { category: true, paymentMethod: true },
    })
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent transactions' })
  }
})

// ============ TRANSACTION ROUTES ============
app.get('/api/transactions', async (req, res) => {
  try {
    const userId = req.userId!
    const { query, categoryId, paymentMethodId, from, to, type, sort = 'date', order = 'desc', page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    const where: any = { userId }
    if (query) {
      where.OR = [
        { title: { contains: query as string, mode: 'insensitive' } },
        { description: { contains: query as string, mode: 'insensitive' } },
        { merchant: { contains: query as string, mode: 'insensitive' } },
        { notes: { contains: query as string, mode: 'insensitive' } },
        { tags: { contains: query as string, mode: 'insensitive' } },
      ]
    }
    if (categoryId) where.categoryId = parseInt(categoryId as string)
    if (paymentMethodId) where.paymentMethodId = parseInt(paymentMethodId as string)
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = from as string
      if (to) where.date.lte = to as string
    }
    if (type) where.type = type as string

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sort as string]: order === 'asc' ? 'asc' : 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: { category: true, paymentMethod: true },
      }),
      prisma.transaction.count({ where }),
    ])

    res.json({ transactions, total, page: pageNum, totalPages: Math.ceil(total / limitNum) })
  } catch (err) {
    console.error('Transactions list error:', err)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

app.post('/api/transactions', async (req, res) => {
  try {
    const userId = req.userId!
    const data = req.body
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId,
        tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags || '[]',
      },
      include: { category: true, paymentMethod: true },
    })
    res.json(transaction)
  } catch (err) {
    console.error('Create transaction error:', err)
    res.status(500).json({ error: 'Failed to create transaction' })
  }
})

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const data = req.body
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id), userId },
      data: {
        ...data,
        tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags,
      },
      include: { category: true, paymentMethod: true },
    })
    res.json(transaction)
  } catch (err) {
    console.error('Update transaction error:', err)
    res.status(500).json({ error: 'Failed to update transaction' })
  }
})

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    await prisma.transaction.delete({ where: { id: parseInt(id), userId } })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete transaction error:', err)
    res.status(500).json({ error: 'Failed to delete transaction' })
  }
})

app.post('/api/transactions/:id/duplicate', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const original = await prisma.transaction.findFirst({ where: { id: parseInt(id), userId } })
    if (!original) return res.status(404).json({ error: 'Transaction not found' })

    const { id: _, createdAt, updatedAt, ...data } = original
    const transaction = await prisma.transaction.create({
      data: { ...data, title: `${data.title} (Copy)` },
      include: { category: true, paymentMethod: true },
    })
    res.json(transaction)
  } catch (err) {
    console.error('Duplicate transaction error:', err)
    res.status(500).json({ error: 'Failed to duplicate transaction' })
  }
})

// ============ CATEGORY ROUTES ============
app.get('/api/categories', async (req, res) => {
  try {
    const userId = req.userId!
    const categories = await prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

app.post('/api/categories', async (req, res) => {
  try {
    const userId = req.userId!
    const category = await prisma.category.create({ data: { ...req.body, userId } })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' })
  }
})

app.put('/api/categories/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const category = await prisma.category.update({ where: { id: parseInt(id), userId }, data: req.body })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' })
  }
})

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    await prisma.category.delete({ where: { id: parseInt(id), userId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// ============ PAYMENT METHOD ROUTES ============
app.get('/api/payment-methods', async (req, res) => {
  try {
    const userId = req.userId!
    const methods = await prisma.paymentMethod.findMany({ where: { userId }, orderBy: { name: 'asc' } })
    res.json(methods)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment methods' })
  }
})

app.post('/api/payment-methods', async (req, res) => {
  try {
    const userId = req.userId!
    const method = await prisma.paymentMethod.create({ data: { ...req.body, userId } })
    res.json(method)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment method' })
  }
})

// ============ BUDGET ROUTES ============
app.get('/api/budgets', async (req, res) => {
  try {
    const userId = req.userId!
    const { month, year } = req.query
    const now = new Date()
    const targetMonth = month ? parseInt(month as string) : now.getMonth() + 1
    const targetYear = year ? parseInt(year as string) : now.getFullYear()

    const budgets = await prisma.budget.findMany({
      where: { userId, month: targetMonth, year: targetYear },
      include: { category: true },
    })

    // Calculate actual spending for each budget
    const monthStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
    const monthEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`

    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        const spentAmount = spent._sum?.amount || 0
        return {
          ...budget,
          spent: spentAmount,
          remaining: budget.amount - spentAmount,
          percentage: budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0,
        }
      })
    )

    res.json(budgetsWithSpending)
  } catch (err) {
    console.error('Budgets error:', err)
    res.status(500).json({ error: 'Failed to fetch budgets' })
  }
})

app.post('/api/budgets', async (req, res) => {
  try {
    const userId = req.userId!
    const budget = await prisma.budget.create({
      data: { ...req.body, userId },
      include: { category: true },
    })
    res.json(budget)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create budget' })
  }
})

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const budget = await prisma.budget.update({
      where: { id: parseInt(id), userId },
      data: req.body,
      include: { category: true },
    })
    res.json(budget)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update budget' })
  }
})

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    await prisma.budget.delete({ where: { id: parseInt(id), userId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget' })
  }
})

// ============ GOAL ROUTES ============
app.get('/api/goals', async (req, res) => {
  try {
    const userId = req.userId!
    const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
    const goalsWithProgress = goals.map((g) => ({
      ...g,
      percentage: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
      remaining: g.targetAmount - g.currentAmount,
    }))
    res.json(goalsWithProgress)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' })
  }
})

app.post('/api/goals', async (req, res) => {
  try {
    const userId = req.userId!
    const goal = await prisma.goal.create({ data: { ...req.body, userId } })
    res.json(goal)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal' })
  }
})

app.put('/api/goals/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const goal = await prisma.goal.update({ where: { id: parseInt(id), userId }, data: req.body })
    res.json(goal)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal' })
  }
})

app.delete('/api/goals/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    await prisma.goal.delete({ where: { id: parseInt(id), userId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' })
  }
})

// ============ INVESTMENT ROUTES ============
app.get('/api/investments', async (req, res) => {
  try {
    const userId = req.userId!
    const investments = await prisma.investment.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
    const withPL = investments.map((i) => ({
      ...i,
      profitLoss: i.currentValue - i.amountInvested,
      profitLossPercent: i.amountInvested > 0 ? ((i.currentValue - i.amountInvested) / i.amountInvested) * 100 : 0,
    }))
    res.json(withPL)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch investments' })
  }
})

app.post('/api/investments', async (req, res) => {
  try {
    const userId = req.userId!
    const investment = await prisma.investment.create({ data: { ...req.body, userId } })
    res.json(investment)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create investment' })
  }
})

app.put('/api/investments/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const investment = await prisma.investment.update({ where: { id: parseInt(id), userId }, data: req.body })
    res.json(investment)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update investment' })
  }
})

app.delete('/api/investments/:id', async (req, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    await prisma.investment.delete({ where: { id: parseInt(id), userId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete investment' })
  }
})

// ============ REPORTS ROUTES ============
app.get('/api/reports/cashflow', async (req, res) => {
  try {
    const userId = req.userId!
    const { from, to } = req.query
    const where: any = { userId }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = from as string
      if (to) where.date.lte = to as string
    }

    // Group by month
    const transactions = await prisma.transaction.findMany({ where, orderBy: { date: 'asc' } })
    const grouped: Record<string, { month: string; income: number; expense: number }> = {}

    for (const t of transactions) {
      const month = t.date.slice(0, 7)
      if (!grouped[month]) grouped[month] = { month, income: 0, expense: 0 }
      if (t.type === 'INCOME') grouped[month].income += t.amount
      else grouped[month].expense += t.amount
    }

    res.json(Object.values(grouped))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cashflow report' })
  }
})

app.get('/api/reports/categories', async (req, res) => {
  try {
    const userId = req.userId!
    const { from, to, type = 'EXPENSE' } = req.query
    const where: any = { userId, type: type as string }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = from as string
      if (to) where.date.lte = to as string
    }

    // Use Prisma groupBy + manual category lookup
    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    })

    // Fetch category details for the grouped results
    const categoryIds = grouped.map(g => g.categoryId)
    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    const catMap = new Map(categories.map(c => [c.id, c]))

    const result = grouped.map(g => {
      const cat = catMap.get(g.categoryId)
      return {
        name: cat?.name || 'Unknown',
        color: cat?.color || '#a8a29e',
        icon: cat?.icon || 'circle',
        total: g._sum.amount || 0,
        count: g._count.id || 0,
      }
    })

    res.json(result)
  } catch (err) {
    console.error('Categories report error:', err)
    res.status(500).json({ error: 'Failed to fetch categories report' })
  }
})

app.get('/api/reports/networth', async (req, res) => {
  try {
    const userId = req.userId!
    const transactions = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'asc' } })
    const investments = await prisma.investment.findMany({ where: { userId } })
    const totalInvestValue = investments.reduce((s, i) => s + i.currentValue, 0)

    const grouped: Record<string, { month: string; networth: number }> = {}
    let runningTotal = 0

    for (const t of transactions) {
      const month = t.date.slice(0, 7)
      if (t.type === 'INCOME') runningTotal += t.amount
      else runningTotal -= t.amount
      grouped[month] = { month, networth: runningTotal + totalInvestValue }
    }

    res.json(Object.values(grouped))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch networth report' })
  }
})

// ============ SETTINGS ROUTES ============
app.get('/api/settings', async (req, res) => {
  try {
    const userId = req.userId!
    let settings = await prisma.settings.findFirst({ where: { userId } })
    if (!settings) {
      settings = await prisma.settings.create({
        data: { userId, currency: 'USD', language: 'en', theme: 'system' },
      })
    }
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

app.put('/api/settings', async (req, res) => {
  try {
    const userId = req.userId!
    let settings = await prisma.settings.findFirst({ where: { userId } })
    if (!settings) {
      settings = await prisma.settings.create({ data: { ...req.body, userId } })
    } else {
      settings = await prisma.settings.update({ where: { id: settings.id }, data: req.body })
    }
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// ============ BACKUP ROUTES ============
app.post('/api/backup/create', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `finance_${timestamp}.json`
    const backupPath = path.resolve(backupsDir, filename)

    // For PostgreSQL, export all data as JSON instead of copying a file
    const userId = req.userId!
    const [categories, paymentMethods, transactions, budgets, goals, investments, settings] = await Promise.all([
      prisma.category.findMany({ where: { userId } }),
      prisma.paymentMethod.findMany({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.settings.findFirst({ where: { userId } }),
    ])

    const backupData = JSON.stringify({ categories, paymentMethods, transactions, budgets, goals, investments, settings }, null, 2)
    fs.writeFileSync(backupPath, backupData)
    const stats = fs.statSync(backupPath)

    const backup = await prisma.backup.create({
      data: { filename, path: backupPath, size: stats.size },
    })

    res.json(backup)
  } catch (err) {
    console.error('Backup error:', err)
    res.status(500).json({ error: 'Failed to create backup' })
  }
})

app.get('/api/backup/list', async (_req, res) => {
  try {
    const backups = await prisma.backup.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(backups)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch backups' })
  }
})

app.post('/api/backup/restore/:id', async (req, res) => {
  try {
    const { id } = req.params
    const backup = await prisma.backup.findUnique({ where: { id: parseInt(id) } })
    if (!backup) return res.status(404).json({ error: 'Backup not found' })
    if (!fs.existsSync(backup.path)) return res.status(404).json({ error: 'Backup file not found' })

    res.json({ success: true, message: 'Backup restore is available for JSON backups. Contact support for full restore.' })
  } catch (err) {
    console.error('Restore error:', err)
    res.status(500).json({ error: 'Failed to restore backup' })
  }
})

// ============ EXPORT ROUTES ============
app.get('/api/export/csv', async (req, res) => {
  try {
    const userId = req.userId!
    const { from, to, type } = req.query
    const where: any = { userId }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = from as string
      if (to) where.date.lte = to as string
    }
    if (type) where.type = type as string

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, paymentMethod: true },
      orderBy: { date: 'desc' },
    })

    const headers = [
      'Date',
      'Time',
      'Title',
      'Description',
      'Amount',
      'Type',
      'Category',
      'Payment Method',
      'Merchant',
      'Notes',
      'Tags',
      'Favorite',
    ]

    const rows = transactions.map((t) => ({
      Date: t.date,
      Time: t.time,
      Title: t.title,
      Description: t.description || '',
      Amount: t.amount,
      Type: t.type,
      Category: t.category?.name || '',
      'Payment Method': t.paymentMethod?.name || '',
      Merchant: t.merchant || '',
      Notes: t.notes || '',
      Tags: JSON.parse(t.tags || '[]').join(', '),
      Favorite: t.isFavorite ? 'Yes' : 'No',
    }))

    let csv = headers.join(',') + '\n'
    for (const row of rows) {
      csv += headers.map((h) => `"${(row as any)[h] ?? ''}"`).join(',') + '\n'
    }

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV' })
  }
})

// ============ AI ASSISTANT ROUTE ============
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const userId = req.userId!
    const { message, history } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'AI assistant is not configured. Set GEMINI_API_KEY in .env' })
    }

    // Gather user financial context
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const [incomeAgg, expenseAgg, recentTxns, budgets, goals, investments] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        take: 20,
        orderBy: { date: 'desc' },
        include: { category: true },
      }),
      prisma.budget.findMany({ where: { userId }, include: { category: true } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.investment.findMany({ where: { userId } }),
    ])

    const monthlyIncome = incomeAgg._sum?.amount || 0
    const monthlyExpense = expenseAgg._sum?.amount || 0
    const totalInvested = investments.reduce((s, i) => s + i.amountInvested, 0)
    const totalInvestValue = investments.reduce((s, i) => s + i.currentValue, 0)

    const txnSummary = recentTxns.map(t => `${t.date} | ${t.type} | ${t.category?.name || 'N/A'} | ${t.title} | $${t.amount}`).join('\n')
    const budgetSummary = budgets.map(b => `${b.category?.name}: $${b.amount}/month`).join(', ')
    const goalSummary = goals.map(g => `${g.name}: $${g.currentAmount}/$${g.targetAmount}`).join(', ')

    const systemPrompt = `You are a helpful, friendly personal financial assistant for FlowFinance.
You have access to the user's real financial data. Use it to give specific, actionable advice.
Always respond in the same language the user writes to you (Portuguese, English, Spanish, etc.).

=== USER'S FINANCIAL CONTEXT (current month: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}) ===
Monthly Income: $${monthlyIncome.toFixed(2)}
Monthly Expenses: $${monthlyExpense.toFixed(2)}
Monthly Savings: $${(monthlyIncome - monthlyExpense).toFixed(2)}
Savings Rate: ${monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome * 100).toFixed(1) : '0'}%

Investments: $${totalInvestValue.toFixed(2)} (invested: $${totalInvested.toFixed(2)}, return: ${totalInvested > 0 ? ((totalInvestValue - totalInvested) / totalInvested * 100).toFixed(1) : '0'}%)

Budgets: ${budgetSummary || 'None set'}
Goals: ${goalSummary || 'None set'}

Recent Transactions (last 20):
${txnSummary || 'No transactions yet'}
=== END CONTEXT ===

Guidelines:
- Be concise but thorough
- Use real numbers from the data above
- Suggest concrete actions
- If asked about trends, analyze the transaction data
- Format currency values properly
- Use emoji sparingly for visual appeal`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Build chat history
    const chatHistory = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemPrompt,
    })

    const result = await chat.sendMessage(message)
    const responseText = result.response.text()

    res.json({ response: responseText })
  } catch (err) {
    console.error('Assistant error:', err)
    res.status(500).json({ error: 'Failed to get AI response. Check your GEMINI_API_KEY.' })
  }
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(process.cwd(), 'dist')))
  app.get('*any', (_req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'))
  })
}

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`FlowFinance API server running on http://localhost:${PORT}`)
})
