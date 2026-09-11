import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  Sparkles,
  LayoutDashboard,
  Home,
  ShieldCheck,
  Database,
  Cpu,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  UserCheck,
  FileSpreadsheet,
  Sliders
} from 'lucide-react'
import { churnAPI } from '../services/api'

export const Navbar: React.FC = () => {
  const [apiOnline, setApiOnline] = useState<boolean>(true)
  const [latencyMs, setLatencyMs] = useState<number>(3.8)
  const [totalRecords, setTotalRecords] = useState<number>(7043)
  const location = useLocation()

  useEffect(() => {
    const start = performance.now()
    churnAPI.getHealth()
      .then(() => {
        setApiOnline(true)
        setLatencyMs(Math.max(2, Math.round(performance.now() - start)))
      })
      .catch(() => setApiOnline(false))

    churnAPI.getAnalytics()
      .then((res) => {
        if (res.data?.overview?.total_customers) {
          setTotalRecords(res.data.overview.total_customers)
        }
      })
      .catch(() => {})
  }, [location.pathname])

  // Get current active route title for dashboard breadcrumbs
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
        return 'Enterprise MLOps'
    }
  }

  const isDashboard = location.pathname.startsWith('/dashboard')

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-15">
          
          {/* Left: Modern Logo & Dynamic Breadcrumbs */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-600 transition-colors">
                <Activity className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                    ChurnPredict<span className="text-indigo-600">.ai</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    XGBoost v1.0
                  </span>
                </div>
              </div>
            </Link>

            {/* Breadcrumb Navigator for Dashboard */}
            {isDashboard && (
              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs text-slate-500 font-medium">
                <Link to="/dashboard" className="hover:text-slate-900 transition-colors">Platform</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-slate-900 font-sans">{getBreadcrumbTitle()}</span>
              </div>
            )}
          </div>

          {/* Right: Live Telemetry, API Health & Executive Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Live API Health & Round-Trip Latency */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="relative flex h-2 w-2">
                {apiOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-700">
                {apiOnline ? `FastAPI :8000 • ${latencyMs}ms` : 'API Offline'}
              </span>
            </div>

            {/* Cohort Records Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-mono font-bold text-slate-800">{totalRecords.toLocaleString()}</span>
              <span className="text-slate-400">Accounts</span>
            </div>

            {/* Swagger REST Docs Link */}
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
              title="Open FastAPI Swagger Interactive Documentation"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Context Switcher Button */}
            {!isDashboard ? (
              <Link
                to="/dashboard"
                className="btn-primary text-xs py-1.5 px-3.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Launch Console</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            ) : (
              <Link
                to="/"
                className="btn-secondary text-xs py-1.5 px-3"
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


