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
  TrendingDown,
  ChevronRight,
  Database,
  Sparkles,
  Layers,
  Activity
} from 'lucide-react'
import { churnAPI } from '../services/api'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  badge?: string
}

interface NavGroup {
  group: string
  items: NavItem[]
}

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

  const navGroups: NavGroup[] = [
    {
      group: 'Analytics & Risk',
      items: [
        { path: '/dashboard', label: 'Executive Overview', icon: LayoutDashboard, exact: true, badge: 'Live' },
        { path: '/dashboard/single', label: 'Single Account Risk', icon: UserCheck },
      ]
    },
    {
      group: 'Data & Batch Operations',
      items: [
        { path: '/dashboard/batch', label: 'High-Speed Batch CSV', icon: UploadCloud, badge: 'Fast' },
        { path: '/dashboard/history', label: 'Prediction Audits', icon: History },
      ]
    },
    {
      group: 'MLOps & Governance',
      items: [
        { path: '/dashboard/performance', label: 'Model Telemetry & ROC', icon: BarChart3 },
        { path: '/dashboard/settings', label: 'Threshold Settings', icon: Settings },
      ]
    }
  ]

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-3.75rem)] p-3.5 flex flex-col justify-between select-none">
      
      <div className="space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.group}
            </div>

            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Modern Model Telemetry Widget Footer */}
      <div className="pt-3 border-t border-slate-200 space-y-2.5">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>XGBoost ML Core</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Ready
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>Decision Cutoff:</span>
              <span className="font-bold text-slate-800">τ = {modelStats.threshold}</span>
            </div>
            <div className="flex justify-between">
              <span>Test Accuracy:</span>
              <span className="font-bold text-slate-800">{modelStats.accuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span>ROC-AUC Score:</span>
              <span className="font-bold text-indigo-600">{modelStats.roc_auc}</span>
            </div>
          </div>
        </div>

        <div className="px-1 text-center">
          <span className="text-[10px] text-slate-400 font-mono">
            Calibrated on 7,043 Telco Cohort
          </span>
        </div>
      </div>

    </aside>
  )
}


