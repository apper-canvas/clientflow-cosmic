import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "@/components/organisms/Sidebar"
import Header from "@/components/organisms/Header"

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800">
      <Sidebar isOpen={isMobileMenuOpen} onToggle={toggleMobileMenu} />
      
      <div className="lg:ml-64">
        <Header onMenuToggle={toggleMobileMenu} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout