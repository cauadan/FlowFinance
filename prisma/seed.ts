import { prisma } from '../api/lib/prisma'

const defaultCategories = [
  // Income categories
  { name: 'Salary', icon: 'banknote', color: '#84a98c', type: 'INCOME', isDefault: true },
  { name: 'Freelance', icon: 'laptop', color: '#457b9d', type: 'INCOME', isDefault: true },
  { name: 'Investments', icon: 'trending-up', color: '#2a9d8f', type: 'INCOME', isDefault: true },
  { name: 'Gifts', icon: 'gift', color: '#e9c46a', type: 'INCOME', isDefault: true },
  { name: 'Other Income', icon: 'plus-circle', color: '#a8a29e', type: 'INCOME', isDefault: true },
  // Expense categories
  { name: 'Food', icon: 'utensils', color: '#e76f51', type: 'EXPENSE', isDefault: true },
  { name: 'Restaurants', icon: 'chef-hat', color: '#e76f51', type: 'EXPENSE', isDefault: true },
  { name: 'Groceries', icon: 'shopping-basket', color: '#84a98c', type: 'EXPENSE', isDefault: true },
  { name: 'Transport', icon: 'bus', color: '#457b9d', type: 'EXPENSE', isDefault: true },
  { name: 'Fuel', icon: 'fuel', color: '#e9c46a', type: 'EXPENSE', isDefault: true },
  { name: 'Rent', icon: 'home', color: '#2f3e46', type: 'EXPENSE', isDefault: true },
  { name: 'Mortgage', icon: 'building', color: '#2f3e46', type: 'EXPENSE', isDefault: true },
  { name: 'Utilities', icon: 'zap', color: '#e9c46a', type: 'EXPENSE', isDefault: true },
  { name: 'Water', icon: 'droplets', color: '#457b9d', type: 'EXPENSE', isDefault: true },
  { name: 'Electricity', icon: 'lightbulb', color: '#e9c46a', type: 'EXPENSE', isDefault: true },
  { name: 'Internet', icon: 'wifi', color: '#2a9d8f', type: 'EXPENSE', isDefault: true },
  { name: 'Phone', icon: 'smartphone', color: '#457b9d', type: 'EXPENSE', isDefault: true },
  { name: 'Healthcare', icon: 'heart-pulse', color: '#e76f51', type: 'EXPENSE', isDefault: true },
  { name: 'Insurance', icon: 'shield', color: '#2f3e46', type: 'EXPENSE', isDefault: true },
  { name: 'Education', icon: 'graduation-cap', color: '#84a98c', type: 'EXPENSE', isDefault: true },
  { name: 'Entertainment', icon: 'film', color: '#e9c46a', type: 'EXPENSE', isDefault: true },
  { name: 'Streaming', icon: 'play-circle', color: '#e76f51', type: 'EXPENSE', isDefault: true },
  { name: 'Gaming', icon: 'gamepad-2', color: '#457b9d', type: 'EXPENSE', isDefault: true },
  { name: 'Shopping', icon: 'shopping-bag', color: '#e9c46a', type: 'EXPENSE', isDefault: true },
  { name: 'Travel', icon: 'plane', color: '#2a9d8f', type: 'EXPENSE', isDefault: true },
  { name: 'Taxes', icon: 'file-text', color: '#2f3e46', type: 'EXPENSE', isDefault: true },
  { name: 'Pets', icon: 'paw-print', color: '#84a98c', type: 'EXPENSE', isDefault: true },
  { name: 'Family', icon: 'users', color: '#e76f51', type: 'EXPENSE', isDefault: true },
  { name: 'Other', icon: 'more-horizontal', color: '#a8a29e', type: 'EXPENSE', isDefault: true },
]

const defaultPaymentMethods = [
  { name: 'Cash', icon: 'banknote', color: '#84a98c', isDefault: true },
  { name: 'Debit Card', icon: 'credit-card', color: '#457b9d', isDefault: true },
  { name: 'Credit Card', icon: 'credit-card', color: '#2f3e46', isDefault: true },
  { name: 'PIX', icon: 'qr-code', color: '#2a9d8f', isDefault: true },
  { name: 'Bank Transfer', icon: 'arrow-left-right', color: '#e9c46a', isDefault: true },
  { name: 'Digital Wallet', icon: 'wallet', color: '#e76f51', isDefault: true },
  { name: 'Other', icon: 'more-horizontal', color: '#a8a29e', isDefault: true },
]

async function main() {
  console.log('Seeding database...')

  // Check if already seeded
  const existingCategories = await prisma.category.count()
  if (existingCategories > 0) {
    console.log('Database already seeded. Skipping...')
    return
  }

  // Seed categories
  for (const cat of defaultCategories) {
    await prisma.category.create({ data: cat })
  }
  console.log(`Created ${defaultCategories.length} default categories`)

  // Seed payment methods
  for (const pm of defaultPaymentMethods) {
    await prisma.paymentMethod.create({ data: pm })
  }
  console.log(`Created ${defaultPaymentMethods.length} default payment methods`)

  // Seed default settings
  await prisma.settings.create({
    data: {
      currency: 'USD',
      language: 'en',
      theme: 'system',
      autoBackup: false,
      backupInterval: 'weekly',
    },
  })
  console.log('Created default settings')

  // Seed sample transactions for demonstration
  const foodCategory = await prisma.category.findFirst({ where: { name: 'Food' } })
  const salaryCategory = await prisma.category.findFirst({ where: { name: 'Salary' } })
  const transportCategory = await prisma.category.findFirst({ where: { name: 'Transport' } })
  const rentCategory = await prisma.category.findFirst({ where: { name: 'Rent' } })
  const groceriesCategory = await prisma.category.findFirst({ where: { name: 'Groceries' } })
  const entertainmentCategory = await prisma.category.findFirst({ where: { name: 'Entertainment' } })
  const shoppingCategory = await prisma.category.findFirst({ where: { name: 'Shopping' } })
  const freelanceCategory = await prisma.category.findFirst({ where: { name: 'Freelance' } })

  const cashPM = await prisma.paymentMethod.findFirst({ where: { name: 'Cash' } })
  const debitPM = await prisma.paymentMethod.findFirst({ where: { name: 'Debit Card' } })
  const creditPM = await prisma.paymentMethod.findFirst({ where: { name: 'Credit Card' } })
  const transferPM = await prisma.paymentMethod.findFirst({ where: { name: 'Bank Transfer' } })

  const today = new Date()
  const formatDate = (d: Date) => d.toISOString().split('T')[0]
  const daysAgo = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return formatDate(d)
  }

  const sampleTransactions = [
    { title: 'Monthly Salary', amount: 5200, type: 'INCOME', categoryId: salaryCategory!.id, paymentMethodId: transferPM!.id, date: daysAgo(2), time: '09:00', merchant: 'Employer Inc.', tags: '[]' },
    { title: 'Freelance Project', amount: 850, type: 'INCOME', categoryId: freelanceCategory!.id, paymentMethodId: transferPM!.id, date: daysAgo(5), time: '14:30', merchant: 'Client ABC', tags: '[]' },
    { title: 'Weekly Groceries', amount: 127.45, type: 'EXPENSE', categoryId: groceriesCategory!.id, paymentMethodId: debitPM!.id, date: daysAgo(1), time: '10:15', merchant: 'Whole Foods', tags: '["food","weekly"]' },
    { title: 'Gas Station', amount: 45.00, type: 'EXPENSE', categoryId: transportCategory!.id, paymentMethodId: creditPM!.id, date: daysAgo(3), time: '08:30', merchant: 'Shell', tags: '["fuel","car"]' },
    { title: 'Monthly Rent', amount: 1500, type: 'EXPENSE', categoryId: rentCategory!.id, paymentMethodId: transferPM!.id, date: daysAgo(1), time: '00:00', merchant: 'Landlord', tags: '["housing","monthly"]', installments: false },
    { title: 'Netflix Subscription', amount: 15.99, type: 'EXPENSE', categoryId: entertainmentCategory!.id, paymentMethodId: creditPM!.id, date: daysAgo(1), time: '03:00', merchant: 'Netflix', tags: '["streaming","monthly"]' },
    { title: 'Restaurant Dinner', amount: 68.50, type: 'EXPENSE', categoryId: foodCategory!.id, paymentMethodId: creditPM!.id, date: daysAgo(4), time: '19:30', merchant: 'Olive Garden', tags: '["dining","social"]' },
    { title: 'New Headphones', amount: 199.99, type: 'EXPENSE', categoryId: shoppingCategory!.id, paymentMethodId: debitPM!.id, date: daysAgo(7), time: '15:00', merchant: 'Best Buy', tags: '["electronics","tech"]' },
    { title: 'Bus Pass', amount: 30.00, type: 'EXPENSE', categoryId: transportCategory!.id, paymentMethodId: cashPM!.id, date: daysAgo(10), time: '09:00', merchant: 'Metro Transit', tags: '["transit","monthly"]' },
    { title: 'Coffee Shop', amount: 5.75, type: 'EXPENSE', categoryId: foodCategory!.id, paymentMethodId: cashPM!.id, date: daysAgo(0), time: '08:00', merchant: 'Starbucks', tags: '["coffee","daily"]' },
    { title: 'Internet Bill', amount: 79.99, type: 'EXPENSE', categoryId: rentCategory!.id, paymentMethodId: debitPM!.id, date: daysAgo(1), time: '00:00', merchant: 'Comcast', tags: '["utilities","monthly"]' },
    { title: 'Gym Membership', amount: 49.99, type: 'EXPENSE', categoryId: entertainmentCategory!.id, paymentMethodId: creditPM!.id, date: daysAgo(15), time: '00:00', merchant: 'Planet Fitness', tags: '["fitness","health"]' },
  ]

  for (const tx of sampleTransactions) {
    await prisma.transaction.create({ data: tx })
  }
  console.log(`Created ${sampleTransactions.length} sample transactions`)

  // Seed sample budgets
  if (foodCategory && transportCategory && groceriesCategory) {
    await prisma.budget.create({
      data: { categoryId: foodCategory.id, amount: 400, period: 'MONTHLY', month: today.getMonth() + 1, year: today.getFullYear() },
    })
    await prisma.budget.create({
      data: { categoryId: transportCategory.id, amount: 200, period: 'MONTHLY', month: today.getMonth() + 1, year: today.getFullYear() },
    })
    await prisma.budget.create({
      data: { categoryId: groceriesCategory.id, amount: 600, period: 'MONTHLY', month: today.getMonth() + 1, year: today.getFullYear() },
    })
    console.log('Created 3 sample budgets')
  }

  // Seed sample goals
  await prisma.goal.create({
    data: { name: 'Emergency Fund', targetAmount: 10000, currentAmount: 4500, color: '#84a98c', icon: 'shield' },
  })
  await prisma.goal.create({
    data: { name: 'Vacation to Japan', targetAmount: 5000, currentAmount: 2100, color: '#e76f51', icon: 'plane' },
  })
  await prisma.goal.create({
    data: { name: 'New Laptop', targetAmount: 2500, currentAmount: 1800, color: '#457b9d', icon: 'laptop' },
  })
  console.log('Created 3 sample goals')

  // Seed sample investments
  await prisma.investment.create({
    data: { name: 'Apple Inc.', category: 'Stocks', broker: 'Fidelity', amountInvested: 5000, currentValue: 6750, purchaseDate: daysAgo(365), notes: 'Long term hold' },
  })
  await prisma.investment.create({
    data: { name: 'S&P 500 ETF', category: 'ETF', broker: 'Vanguard', amountInvested: 10000, currentValue: 11200, purchaseDate: daysAgo(180), notes: 'Dollar cost averaging' },
  })
  await prisma.investment.create({
    data: { name: 'Bitcoin', category: 'Crypto', broker: 'Coinbase', amountInvested: 2000, currentValue: 2450, purchaseDate: daysAgo(90), notes: 'Small allocation' },
  })
  console.log('Created 3 sample investments')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
