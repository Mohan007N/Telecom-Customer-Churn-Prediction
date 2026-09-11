import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  Home,
  BarChart2,
  CheckCircle2,
  Sparkles,
  Activity
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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              {/* Colorful Vibrant Gradient Corporate Logo */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 20h.01" />
                  <path d="M7 20v-4" />
                  <path d="M12 20v-8" />
                  <path d="M17 20V8" />
                  <path d="M22 4v16" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-slate-900">
                    Telecom
                  </span>
                  <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Churn Portal
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Customer Retention & Risk Analytics
                </span>
              </div>
            </Link>

            {/* Breadcrumb Hierarchy */}
            {isDashboard && (
              <div className="hidden md:flex items-center gap-2 pl-6 border-l border-slate-200 text-xs text-slate-500">
                <Link to="/dashboard" className="hover:text-indigo-600 transition-colors font-medium">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-slate-900 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {getBreadcrumbTitle()}
                </span>
              </div>
            )}
          </div>

          {/* Right Status & Navigation Controls */}
          <div className="flex items-center gap-3.5">
            {/* Live Operational Status with glowing pulse */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-700 shadow-xs">
              <span className="relative flex h-2 w-2">
                {apiOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-700">
                {apiOnline ? 'Live ML Core' : 'Offline'}
              </span>
            </div>

            {/* Main Action Button */}
            {!isDashboard ? (
              <Link
                to="/dashboard"
                className="btn-primary text-xs py-2 px-4 shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Executive Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="btn-secondary text-xs py-2 px-3.5 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
              >
                <Home className="w-3.5 h-3.5 text-indigo-600" />
                <span>Home</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
