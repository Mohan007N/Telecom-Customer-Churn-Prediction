import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Activity, ShieldCheck, ArrowRight, LayoutDashboard, Home } from 'lucide-react'
import { churnAPI } from '../services/api'

export const Navbar: React.FC = () => {
  const [apiOnline, setApiOnline] = useState<boolean>(true)
  const location = useLocation()

  useEffect(() => {
    churnAPI.getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
  }, [])

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Churn Predictor</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-200">MLOps v1.0</span>
            </div>
          </Link>

          {/* Center Navigation / Actions */}
          <div className="flex items-center gap-4">
            {/* System API Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700">
              <span className={`w-2.5 h-2.5 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>{apiOnline ? 'API Status: Online' : 'Connecting to API...'}</span>
            </div>

            {location.pathname === '/' ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>View Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Landing Page</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
