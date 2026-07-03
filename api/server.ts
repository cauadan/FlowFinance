import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import fs from 'fs'
import { prisma } from './lib/prisma'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Ensure directories exist
const backupsDir = process.env.BACKUP_PATH || './backups'
const uploadsDir = './uploads'
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

// ============ DASHBOARD ROUTES ============
app.get('/api/dashboard/summary', async (_req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const monthStart = startOfMonth.toISOString().split('T')[0]
    const monthEnd = endOfMonth.toISOString().split('T')[0]

    const [incomeAgg, expenseAgg, allInvestments, allBudgets] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.investment.findMany(),
      prisma.budget.findMany({ include: { category: true } }),
    ])

    const monthlyIncome = incomeAgg._sum.amount || 0
    const monthlyExpense = expenseAgg._sum.amount || 0
    const monthlySavings = monthlyIncome - monthlyExpense
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

    const totalInvested = allInvestments.reduce((s, i) => s + i.amountInvested, 0)
    const totalInvestValue = allInvestments.reduce((s, i) => s + i.currentValue, 0)
    const investmentGrowth = totalInvested > 0 ? ((totalInvestValue - totalInvested) / totalInvested) * 100 : 0

    // Credit card spending
    const creditCardPM = await prisma.paymentMethod.findFirst({ where: { name: 'Credit Card' } })
    let creditCardSpending = 0
    if (creditCardPM) {
      const ccAgg = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', paymentMethodId: creditCardPM.id, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      })
      creditCardSpending = ccAgg._sum.amount || 0
    }

    // Pending payments (installments not yet paid)
    const pendingPayments = await prisma.transaction.count({
      where: { installments: true, currentInstallment: { lt: prisma.transaction.fields.totalInstallments } },
    })

    // Budget used %
    let budgetUsedPercent = 0
    if (allBudgets.length > 0) {
      const totalBudget = allBudgets.reduce((s, b) => s + b.amount, 0)
      // Calculate actual spending per budget category this month
      for (const budget of allBudgets) {
        const spent = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        budgetUsedPercent += (spent._sum.amount || 0)
      }
      budgetUsedPercent = totalBudget > 0 ? (budgetUsedPercent / totalBudget) * 100 : 0
    }

    // Net worth: (all income - all expenses) + investment value
    const [allIncome, allExpense] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: 'INCOME' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: 'EXPENSE' }, _sum: { amount: true } }),
    ])
    const netWorth = (allIncome._sum.amount || 0) - (allExpense._sum.amount || 0) + totalInvestValue

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

app.get('/api/dashboard/charts', async (_req, res) => {
  try {
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
          prisma.transaction.aggregate({ where: { type: 'INCOME', date: { gte: start, lte: end } }, _sum: { amount: true } }),
          prisma.transaction.aggregate({ where: { type: 'EXPENSE', date: { gte: start, lte: end } }, _sum: { amount: true } }),
        ])
        return { month: m, income: inc._sum.amount || 0, expense: exp._sum.amount || 0 }
      })
    )

    // Category breakdown (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const categoryBreakdown = await prisma.$queryRaw`
      SELECT c.name, c.color, SUM(t.amount) as total
      FROM Transaction t
      JOIN Category c ON t.categoryId = c.id
      WHERE t.type = 'EXPENSE' AND t.date >= ${monthStart} AND t.date <= ${monthEnd}
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT 6
    ` as Array<{ name: string; color: string; total: number }>

    // Weekly trend (last 7 days)
    const days: { date: string; income: number; expense: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({ where: { type: 'INCOME', date: dateStr }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { type: 'EXPENSE', date: dateStr }, _sum: { amount: true } }),
      ])
      days.push({ date: dateStr, income: inc._sum.amount || 0, expense: exp._sum.amount || 0 })
    }

    res.json({ cashFlow, categoryBreakdown, weeklyTrend: days })
  } catch (err) {
    console.error('Dashboard charts error:', err)
    res.status(500).json({ error: 'Failed to fetch dashboard charts' })
  }
})

app.get('/api/dashboard/recent', async (_req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
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
    const { query, categoryId, paymentMethodId, from, to, type, sort = 'date', order = 'desc', page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    const where: any = {}
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
    const data = req.body
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
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
    const { id } = req.params
    const data = req.body
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
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
    const { id } = req.params
    await prisma.transaction.delete({ where: { id: parseInt(id) } })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete transaction error:', err)
    res.status(500).json({ error: 'Failed to delete transaction' })
  }
})

app.post('/api/transactions/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params
    const original = await prisma.transaction.findUnique({ where: { id: parseInt(id) } })
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
app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

app.post('/api/categories', async (req, res) => {
  try {
    const category = await prisma.category.create({ data: req.body })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' })
  }
})

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const category = await prisma.category.update({ where: { id: parseInt(id) }, data: req.body })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' })
  }
})

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.category.delete({ where: { id: parseInt(id) } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// ============ PAYMENT METHOD ROUTES ============
app.get('/api/payment-methods', async (_req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } })
    res.json(methods)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment methods' })
  }
})

app.post('/api/payment-methods', async (req, res) => {
  try {
    const method = await prisma.paymentMethod.create({ data: req.body })
    res.json(method)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment method' })
  }
})

// ============ BUDGET ROUTES ============
app.get('/api/budgets', async (req, res) => {
  try {
    const { month, year } = req.query
    const now = new Date()
    const targetMonth = month ? parseInt(month as string) : now.getMonth() + 1
    const targetYear = year ? parseInt(year as string) : now.getFullYear()

    const budgets = await prisma.budget.findMany({
      where: { month: targetMonth, year: targetYear },
      include: { category: true },
    })

    // Calculate actual spending for each budget
    const monthStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
    const monthEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`

    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        const spentAmount = spent._sum.amount || 0
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
    const budget = await prisma.budget.create({
      data: req.body,
      include: { category: true },
    })
    res.json(budget)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create budget' })
  }
})

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params
    const budget = await prisma.budget.update({
      where: { id: parseInt(id) },
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
    const { id } = req.params
    await prisma.budget.delete({ where: { id: parseInt(id) } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget' })
  }
})

// ============ GOAL ROUTES ============
app.get('/api/goals', async (_req, res) => {
  try {
    const goals = await prisma.goal.findMany({ orderBy: { createdAt: 'asc' } })
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
    const goal = await prisma.goal.create({ data: req.body })
    res.json(goal)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal' })
  }
})

app.put('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params
    const goal = await prisma.goal.update({ where: { id: parseInt(id) }, data: req.body })
    res.json(goal)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal' })
  }
})

app.delete('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.goal.delete({ where: { id: parseInt(id) } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' })
  }
})

// ============ INVESTMENT ROUTES ============
app.get('/api/investments', async (_req, res) => {
  try {
    const investments = await prisma.investment.findMany({ orderBy: { createdAt: 'asc' } })
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
    const investment = await prisma.investment.create({ data: req.body })
    res.json(investment)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create investment' })
  }
})

app.put('/api/investments/:id', async (req, res) => {
  try {
    const { id } = req.params
    const investment = await prisma.investment.update({ where: { id: parseInt(id) }, data: req.body })
    res.json(investment)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update investment' })
  }
})

app.delete('/api/investments/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.investment.delete({ where: { id: parseInt(id) } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete investment' })
  }
})

// ============ REPORTS ROUTES ============
app.get('/api/reports/cashflow', async (req, res) => {
  try {
    const { from, to } = req.query
    const where: any = {}
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
    const { from, to, type = 'EXPENSE' } = req.query
    const where: any = { type: type as string }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = from as string
      if (to) where.date.lte = to as string
    }

    const result = await prisma.$queryRaw`
      SELECT c.name, c.color, c.icon, SUM(t.amount) as total, COUNT(t.id) as count
      FROM Transaction t
      JOIN Category c ON t.categoryId = c.id
      WHERE t.type = ${type as string}
      ${from ? prisma.$queryRaw`AND t.date >= ${from as string}` : prisma.$queryRaw``}
      ${to ? prisma.$queryRaw`AND t.date <= ${to as string}` : prisma.$queryRaw``}
      GROUP BY c.id
      ORDER BY total DESC
    ` as Array<{ name: string; color: string; icon: string; total: number; count: number }>

    res.json(result)
  } catch (err) {
    console.error('Categories report error:', err)
    res.status(500).json({ error: 'Failed to fetch categories report' })
  }
})

app.get('/api/reports/networth', async (_req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({ orderBy: { date: 'asc' } })
    const investments = await prisma.investment.findMany()
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
app.get('/api/settings', async (_req, res) => {
  try {
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({
        data: { currency: 'USD', language: 'en', theme: 'system' },
      })
    }
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

app.put('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({ data: req.body })
    } else {
      settings = await prisma.settings.update({ where: { id: settings.id }, data: req.body })
    }
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// ============ BACKUP ROUTES ============
app.post('/api/backup/create', async (_req, res) => {
  try {
    const dbPath = path.resolve(process.cwd(), 'prisma', 'finance.db')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `finance_${timestamp}.db`
    const backupPath = path.resolve(backupsDir, filename)

    fs.copyFileSync(dbPath, backupPath)
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

    const dbPath = path.resolve(process.cwd(), 'prisma', 'finance.db')

    // Create a safety backup of current state
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const safetyFilename = `finance_pre_restore_${timestamp}.db`
    const safetyPath = path.resolve(backupsDir, safetyFilename)
    fs.copyFileSync(dbPath, safetyPath)

    // Restore
    fs.copyFileSync(backup.path, dbPath)

    res.json({ success: true, message: 'Database restored successfully' })
  } catch (err) {
    console.error('Restore error:', err)
    res.status(500).json({ error: 'Failed to restore backup' })
  }
})

// ============ EXPORT ROUTES ============
app.get('/api/export/csv', async (req, res) => {
  try {
    const { from, to, type } = req.query
    const where: any = {}
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

    const headers = Object.keys(rows[0] || {})
    let csv = headers.join(',') + '\n'
    for (const row of rows) {
      csv += headers.map((h) => `"${(row as any)[h]}"`).join(',') + '\n'
    }

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV' })
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
