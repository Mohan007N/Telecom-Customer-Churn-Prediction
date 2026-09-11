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
  colorClass: string
  exact?: boolean
  badge?: string
}

interface NavGroup {
  group: string
  badgeColor: string
  items: NavItem[]
}

export const Sidebar: React.FC = () => {
  const [modelStats, setModelStats] = useState<{
    accuracy: number | null
    roc_auc: number | null
    threshold: number | null
  } | null>(null)

  useEffect(() => {
    churnAPI.getMetrics()
      .then((res) => {
        if (res.data) {
          setModelStats({
            accuracy: res.data.test_accuracy !== undefined ? +(res.data.test_accuracy * 100).toFixed(1) : null,
            roc_auc: res.data.roc_auc !== undefined ? +Number(res.data.roc_auc).toFixed(4) : null,
            threshold: res.data.optimal_threshold !== undefined ? +Number(res.data.optimal_threshold).toFixed(2) : null
          })
        }
      })
      .catch(() => {})
  }, [])

  const navGroups: NavGroup[] = [
    {
      group: 'Analytics & Risk',
      badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      items: [
        { path: '/dashboard', label: 'Executive Overview', icon: LayoutDashboard, colorClass: 'text-blue-500', exact: true, badge: 'Live' },
        { path: '/dashboard/single', label: 'Single Account Risk', icon: UserCheck, colorClass: 'text-indigo-500' },
      ]
    },
    {
      group: 'Data & Batch Operations',
      badgeColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      items: [
        { path: '/dashboard/batch', label: 'High-Speed Batch CSV', icon: UploadCloud, colorClass: 'text-cyan-500', badge: 'Fast' },
        { path: '/dashboard/history', label: 'Prediction Audits', icon: History, colorClass: 'text-teal-500' },
      ]
    },
    {
      group: 'MLOps & Governance',
      badgeColor: 'text-purple-600 bg-purple-50 border-purple-200',
      items: [
        { path: '/dashboard/performance', label: 'Model Telemetry & ROC', icon: BarChart3, colorClass: 'text-purple-500' },
        { path: '/dashboard/settings', label: 'Threshold Settings', icon: Settings, colorClass: 'text-amber-500' },
      ]
    }
  ]

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/90 min-h-[calc(100vh-4rem)] p-3.5 flex flex-col justify-between select-none">
      
      <div className="space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{group.group}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            </div>

            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                          : 'text-slate-600 hover:bg-indigo-50/60 hover:text-indigo-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-white' : `${item.colorClass} group-hover:scale-110 transition-transform`
                          }`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-100 text-indigo-700 border border-indigo-200/80'
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
      <div className="pt-3 border-t border-slate-200/90 space-y-2.5">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/60 via-blue-50/30 to-slate-50 border border-indigo-100/80 shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xs">
                <Cpu className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-slate-800">XGBoost ML</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] text-slate-600 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Decision Cutoff:</span>
              <span className="font-bold text-slate-900">
                τ = {modelStats?.threshold !== null && modelStats?.threshold !== undefined ? modelStats.threshold : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Accuracy:</span>
              <span className="font-bold text-emerald-600">
                {modelStats?.accuracy !== null && modelStats?.accuracy !== undefined ? `${modelStats.accuracy}%` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ROC-AUC:</span>
              <span className="font-bold text-indigo-600">
                {modelStats?.roc_auc !== null && modelStats?.roc_auc !== undefined ? modelStats.roc_auc : '--'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-1 text-center">
          <span className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
            MLOps Telemetry Engine
          </span>
        </div>
      </div>

    </aside>
  )
}
