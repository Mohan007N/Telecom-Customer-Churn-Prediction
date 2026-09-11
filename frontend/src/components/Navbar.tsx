import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  Sparkles,
  LayoutDashboard,
  Home,
  ShieldCheck,
  Database
} from 'lucide-react'
import { churnAPI } from '../services/api'

export const Navbar: React.FC = () => {
  const [apiOnline, setApiOnline] = useState<boolean>(true)
  const [totalRecords, setTotalRecords] = useState<number>(7043)
  const location = useLocation()

  useEffect(() => {
    churnAPI.getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))

    churnAPI.getAnalytics()
      .then((res) => {
        if (res.data?.overview?.total_customers) {
          setTotalRecords(res.data.overview.total_customers)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <header className="bg-[#FFFFFF]/90 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Classical Branding */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B132B] to-[#1C2541] flex items-center justify-center text-[#E2C799] shadow-md border border-[#C5A059]/40 group-hover:border-[#C5A059] transition-all">
              <span className="font-display font-black text-lg tracking-wider">CP</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-editorial text-2xl font-bold tracking-tight text-[#0B132B]">
                  Churn Predictor
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#FDFBF7] text-[#8C6D2B] border border-[#C5A059]/30">
                  <Sparkles className="w-3 h-3 text-[#C5A059]" />
                  ENTERPRISE INTELLIGENCE
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                Telco Customer Retention & Risk Telemetry Platform
              </span>
            </div>
          </Link>

          {/* Right Header Navigation & Telemetry Badges */}
          <div className="flex items-center gap-3.5">
            
            {/* Real Dataset Cohort Provenance Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              <Database className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Real Cohort:</span>
              <span className="font-mono font-bold text-slate-900">{totalRecords.toLocaleString()} Accounts</span>
            </div>

            {/* Live API Health Telemetry */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              <span className={`relative flex h-2 w-2`}>
                {apiOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="font-medium text-slate-700">
                {apiOnline ? 'Model Engine Active' : 'Connecting...'}
              </span>
            </div>

            {/* Quick Destination Switcher */}
            {location.pathname === '/' ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0B132B] to-[#1C2541] hover:from-[#1C2541] hover:to-[#2A3B60] text-[#F8F9FA] text-sm font-semibold rounded-lg shadow-sm border border-[#C5A059]/30 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-[#E2C799]" />
                <span>Executive Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 shadow-sm transition-all"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Home Portal</span>
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
  )
}
