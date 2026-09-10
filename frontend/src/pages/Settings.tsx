import React, { useState } from 'react'
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle2 } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000/api/v1')
  const [threshold, setThreshold] = useState<number>(0.61)
  const [saved, setSaved] = useState<boolean>(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure FastAPI backend connection and inference settings.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">API & Model Parameters</h2>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">FastAPI Backend Endpoint URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700">Decision Threshold ($\tau$)</label>
              <span className="text-xs font-bold text-blue-600">{threshold}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[11px] text-gray-400 mt-1">Probabilities $\ge$ threshold are classified as Churn (1).</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  )
}
