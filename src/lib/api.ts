import axios from 'axios'

// Axios instance using relative path since Vite proxy is configured
const api = axios.create({
  baseURL: '/api',
})

// ============ TYPES ============

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  type: string // 'INCOME' | 'EXPENSE'
  isDefault: boolean
  createdAt: string
}

export interface PaymentMethod {
  id: number
  name: string
  icon: string
  color: string
  isDefault: boolean
  createdAt: string
}

export interface Transaction {
  id: number
  title: string
  description?: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  categoryId: number
  paymentMethodId: number
  date: string
  time: string
  merchant?: string
  installments: boolean
  currentInstallment?: number
  totalInstallments?: number
  tags: string // JSON string array
  notes?: string
  receiptImage?: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  category?: Category
  paymentMethod?: PaymentMethod
}

export interface Budget {
  id: number
  categoryId: number
  amount: number
  period: string
  month: number
  year: number
  createdAt: string
  category?: Category
  spent: number
  remaining: number
  percentage: number
}

export interface Goal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string | null
  color: string
  icon: string
  createdAt: string
  percentage: number
  remaining: number
}

export interface Investment {
  id: number
  name: string
  category: string
  broker?: string
  amountInvested: number
  currentValue: number
  purchaseDate?: string
  notes?: string
  createdAt: string
  profitLoss: number
  profitLossPercent: number
}

export interface Settings {
  id: number
  currency: string
  language: string
  theme: string
  defaultView: string
  autoBackup: boolean
  backupInterval: string
  backupPath: string
  createdAt: string
  updatedAt: string
}

export interface Backup {
  id: number
  filename: string
  path: string
  size: number
  createdAt: string
}

export interface DashboardSummary {
  netWorth: number
  monthlyIncome: number
  monthlyExpense: number
  monthlySavings: number
  savingsRate: number
  investmentValue: number
  investmentGrowth: number
  creditCardSpending: number
  pendingPayments: number
  budgetUsedPercent: number
}

export interface DashboardCharts {
  cashFlow: { month: string; income: number; expense: number }[]
  categoryBreakdown: { name: string; color: string; total: number }[]
  weeklyTrend: { date: string; income: number; expense: number }[]
}

export interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  totalPages: number
}

// ============ API CALLS ============

// --- Dashboard ---
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary')
  return data
}

export const getDashboardCharts = async (): Promise<DashboardCharts> => {
  const { data } = await api.get<DashboardCharts>('/dashboard/charts')
  return data
}

export const getRecentTransactions = async (): Promise<Transaction[]> => {
  const { data } = await api.get<Transaction[]>('/dashboard/recent')
  return data
}

// --- Transactions ---
export interface GetTransactionsParams {
  query?: string
  categoryId?: number
  paymentMethodId?: number
  from?: string
  to?: string
  type?: 'INCOME' | 'EXPENSE'
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export const getTransactions = async (params?: GetTransactionsParams): Promise<TransactionsResponse> => {
  const { data } = await api.get<TransactionsResponse>('/transactions', { params })
  return data
}

export const createTransaction = async (transaction: Partial<Transaction>): Promise<Transaction> => {
  const { data } = await api.post<Transaction>('/transactions', transaction)
  return data
}

export const updateTransaction = async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
  const { data } = await api.put<Transaction>(`/transactions/${id}`, transaction)
  return data
}

export const deleteTransaction = async (id: number): Promise<{ success: boolean }> => {
  const { data } = await api.delete<{ success: boolean }>(`/transactions/${id}`)
  return data
}

export const duplicateTransaction = async (id: number): Promise<Transaction> => {
  const { data } = await api.post<Transaction>(`/transactions/${id}/duplicate`)
  return data
}

// --- Categories ---
export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[]>('/categories')
  return data
}

export const createCategory = async (category: Partial<Category>): Promise<Category> => {
  const { data } = await api.post<Category>('/categories', category)
  return data
}

export const updateCategory = async (id: number, category: Partial<Category>): Promise<Category> => {
  const { data } = await api.put<Category>(`/categories/${id}`, category)
  return data
}

export const deleteCategory = async (id: number): Promise<{ success: boolean }> => {
  const { data } = await api.delete<{ success: boolean }>(`/categories/${id}`)
  return data
}

// --- Payment Methods ---
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const { data } = await api.get<PaymentMethod[]>('/payment-methods')
  return data
}

export const createPaymentMethod = async (method: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  const { data } = await api.post<PaymentMethod>('/payment-methods', method)
  return data
}

// --- Budgets ---
export interface GetBudgetsParams {
  month?: number
  year?: number
}

export const getBudgets = async (params?: GetBudgetsParams): Promise<Budget[]> => {
  const { data } = await api.get<Budget[]>('/budgets', { params })
  return data
}

export const createBudget = async (budget: Partial<Budget>): Promise<Budget> => {
  const { data } = await api.post<Budget>('/budgets', budget)
  return data
}

export const updateBudget = async (id: number, budget: Partial<Budget>): Promise<Budget> => {
  const { data } = await api.put<Budget>(`/budgets/${id}`, budget)
  return data
}

export const deleteBudget = async (id: number): Promise<{ success: boolean }> => {
  const { data } = await api.delete<{ success: boolean }>(`/budgets/${id}`)
  return data
}

// --- Goals ---
export const getGoals = async (): Promise<Goal[]> => {
  const { data } = await api.get<Goal[]>('/goals')
  return data
}

export const createGoal = async (goal: Partial<Goal>): Promise<Goal> => {
  const { data } = await api.post<Goal>('/goals', goal)
  return data
}

export const updateGoal = async (id: number, goal: Partial<Goal>): Promise<Goal> => {
  const { data } = await api.put<Goal>(`/goals/${id}`, goal)
  return data
}

export const deleteGoal = async (id: number): Promise<{ success: boolean }> => {
  const { data } = await api.delete<{ success: boolean }>(`/goals/${id}`)
  return data
}

// --- Investments ---
export const getInvestments = async (): Promise<Investment[]> => {
  const { data } = await api.get<Investment[]>('/investments')
  return data
}

export const createInvestment = async (investment: Partial<Investment>): Promise<Investment> => {
  const { data } = await api.post<Investment>('/investments', investment)
  return data
}

export const updateInvestment = async (id: number, investment: Partial<Investment>): Promise<Investment> => {
  const { data } = await api.put<Investment>(`/investments/${id}`, investment)
  return data
}

export const deleteInvestment = async (id: number): Promise<{ success: boolean }> => {
  const { data } = await api.delete<{ success: boolean }>(`/investments/${id}`)
  return data
}

// --- Reports ---
export interface GetReportParams {
  from?: string
  to?: string
}

export const getCashflowReport = async (params?: GetReportParams): Promise<{ month: string; income: number; expense: number }[]> => {
  const { data } = await api.get<{ month: string; income: number; expense: number }[]>('/reports/cashflow', { params })
  return data
}

export const getCategoriesReport = async (params?: GetReportParams & { type?: 'INCOME' | 'EXPENSE' }): Promise<{ name: string; color: string; icon: string; total: number; count: number }[]> => {
  const { data } = await api.get<{ name: string; color: string; icon: string; total: number; count: number }[]>('/reports/categories', { params })
  return data
}

export const getNetworthReport = async (): Promise<{ month: string; networth: number }[]> => {
  const { data } = await api.get<{ month: string; networth: number }[]>('/reports/networth')
  return data
}

// --- Settings ---
export const getSettings = async (): Promise<Settings> => {
  const { data } = await api.get<Settings>('/settings')
  return data
}

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  const { data } = await api.put<Settings>('/settings', settings)
  return data
}

// --- Backups ---
export const getBackups = async (): Promise<Backup[]> => {
  const { data } = await api.get<Backup[]>('/backup/list')
  return data
}

export const createBackup = async (): Promise<Backup> => {
  const { data } = await api.post<Backup>('/backup/create')
  return data
}

export const restoreBackup = async (id: number): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post<{ success: boolean; message: string }>(`/backup/restore/${id}`)
  return data
}

export const exportTransactionsCsvUrl = '/api/export/csv'
