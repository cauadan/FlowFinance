import { Routes, Route } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import EmergencyFund from './pages/EmergencyFund'
import Investments from './pages/Investments'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Backups from './pages/Backups'
import Assistant from './pages/Assistant'

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/emergency-fund" element={<EmergencyFund />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/backups" element={<Backups />} />
        </Route>
      </Routes>
      <Toaster position="top-center" />
    </>
  )
}

export default App
