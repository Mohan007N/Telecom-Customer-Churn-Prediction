import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  Home,
  BarChart2,
  CheckCircle2
} from 'lucide-react'
import { churnAPI } from '../services/api'

export const Navbar: React.FC = () => {
  const [apiOnline, setApiOnline] = useState<boolean>(true)
  const location = useLocation()

  useEffect(() => {
    churnAPI.getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
  }, [location.pathname])

  const getBreadcrumbTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Executive Overview'
      case '/dashboard/single':
        return 'Single Account Risk'
      case '/dashboard/batch':
        return 'High-Speed Batch CSV'
      case '/dashboard/history':
        return 'Prediction Audits'
      case '/dashboard/performance':
        return 'Model Telemetry & ROC'
      case '/dashboard/settings':
        return 'Threshold Settings'
      default:
        return 'Dashboard'
    }
  }

  const isDashboard = location.pathname.startsWith('/dashboard')

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              {/* Professional Corporate Logo */}
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1E293B] transition-colors">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Telecom Churn Portal
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Customer Retention & Risk Analytics
                </span>
              </div>
            </Link>

            {/* Breadcrumb Hierarchy */}
            {isDashboard && (
              <div className="hidden md:flex items-center gap-2 pl-6 border-l border-slate-200 text-xs text-slate-500">
                <Link to="/dashboard" className="hover:text-slate-900 transition-colors font-medium">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-slate-900">{getBreadcrumbTitle()}</span>
              </div>
            )}
          </div>

          {/* Right Status & Navigation Controls */}
          <div className="flex items-center gap-4">
            {/* Live Operational Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span>{apiOnline ? 'System Operational' : 'Connecting...'}</span>
            </div>

            {/* Main Action Button */}
            {!isDashboard ? (
              <Link
                to="/dashboard"
                className="btn-primary text-xs py-2 px-4 shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Executive Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="btn-secondary text-xs py-2 px-3.5"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>Home</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}



