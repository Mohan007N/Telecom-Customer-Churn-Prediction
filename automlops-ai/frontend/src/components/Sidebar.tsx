import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  UserCheck,
  UploadCloud,
  History,
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/single', label: 'Single Prediction', icon: UserCheck },
    { path: '/dashboard/batch', label: 'Batch Prediction', icon: UploadCloud },
    { path: '/dashboard/history', label: 'Prediction History', icon: History },
    { path: '/dashboard/performance', label: 'Model Performance', icon: BarChart3 },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>

      {/* Model Status Card Footer */}
      <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-700">Model Engine</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">XGBoost</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">
          Recall-Optimized Threshold: <span className="font-semibold text-gray-800">0.61</span>
        </div>
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full w-[78.5%]"></div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
          <span>Accuracy</span>
          <span>78.50%</span>
        </div>
      </div>
    </aside>
  )
}
