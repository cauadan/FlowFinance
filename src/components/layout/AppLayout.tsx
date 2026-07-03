import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import TopBar from './TopBar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#fafaf5]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* Main Content */}
      <div className="lg:ml-[280px]">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="px-4 pb-24 pt-4 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
