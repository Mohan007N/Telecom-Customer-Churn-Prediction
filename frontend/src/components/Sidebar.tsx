import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  UserCheck,
  UploadCloud,
  History,
  BarChart3,
  Settings,
  ShieldAlert,
  Cpu,
  TrendingDown
} from 'lucide-react'
import { churnAPI } from '../services/api'

export const Sidebar: React.FC = () => {
  const [modelStats, setModelStats] = useState({
    accuracy: 78.50,
    roc_auc: 0.8446,
    threshold: 0.61
  })

  useEffect(() => {
    churnAPI.getMetrics()
      .then((res) => {
        if (res.data?.test_accuracy) {
          setModelStats({
            accuracy: +(res.data.test_accuracy * 100).toFixed(1),
            roc_auc: +(res.data.roc_auc || 0.8446).toFixed(4),
            threshold: res.data.optimal_threshold || 0.61
          })
        }
      })
      .catch(() => {})
  }, [])

  const menuItems = [
    { path: '/dashboard', label: 'Executive Overview', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/single', label: 'Single Account Risk', icon: UserCheck },
    { path: '/dashboard/batch', label: 'High-Speed Batch CSV', icon: UploadCloud },
    { path: '/dashboard/history', label: 'Prediction Audits', icon: History },
    { path: '/dashboard/performance', label: 'Model Telemetry & ROC', icon: BarChart3 },
    { path: '/dashboard/settings', label: 'Threshold Configuration', icon: Settings },
  ]

  return (
    <aside className="w-72 bg-[#FFFFFF] border-r border-slate-200/90 min-h-[calc(100vh-5rem)] p-5 flex flex-col justify-between select-none">
      
      <div className="space-y-6">
        
        {/* Section Header */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#8C6D2B] font-display flex items-center gap-1.5 px-3">
            <span>COMMAND CONSOLE</span>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-[#C5A059]/40 to-transparent mt-2 mb-3"></div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#0B132B] text-[#FFFFFF] shadow-md border-l-4 border-[#C5A059] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#E2C799]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

      </div>

      {/* Classical Telemetry Card Footer */}
      <div className="pt-4 border-t border-slate-200/80 space-y-3">
        <div className="p-4 rounded-xl bg-[#F8F9FB] border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-xs font-bold text-[#0B132B] font-display uppercase tracking-wide">
                XGBoost ML Core
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              v1.0 ACTIVE
            </span>
          </div>

          <div className="text-xs text-slate-500 flex justify-between items-center font-mono">
            <span>Optimal Decision Threshold:</span>
            <span className="font-bold text-slate-800">{modelStats.threshold}</span>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#0B132B] via-[#2A3B60] to-[#C5A059] h-full rounded-full" style={{ width: `${modelStats.accuracy}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>ROC-AUC: <strong>{modelStats.roc_auc}</strong></span>
              <span>Acc: <strong>{modelStats.accuracy}%</strong></span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[11px] text-slate-400 font-medium">
            Trained on 7,043 Telco Customer Records
          </span>
        </div>
      </div>

    </aside>
  )
}
