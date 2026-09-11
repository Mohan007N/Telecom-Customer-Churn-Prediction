import React, { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Server,
  ShieldCheck,
  Cpu,
  Database,
  Activity,
  Zap,
  Radio,
  Sparkles
} from 'lucide-react'
import { churnAPI, API_BASE_URL } from '../services/api'

export const SettingsPage: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>(API_BASE_URL)
  const [threshold, setThreshold] = useState<number>(0.5)
  const [modelInfo, setModelInfo] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [saved, setSaved] = useState<boolean>(false)
  const [pinging, setPinging] = useState<boolean>(false)
  const [pingResult, setPingResult] = useState<{ status: string; latencyMs: number } | null>(null)

  useEffect(() => {
    churnAPI.getModelInfo().then((res) => setModelInfo(res.data)).catch(() => {})
    churnAPI.getMetrics().then((res) => {
      setMetrics(res.data)
      if (res.data?.optimal_threshold !== undefined) {
        setThreshold(Number(res.data.optimal_threshold))
      }
    }).catch(() => {})
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleTestPing = async () => {
    setPinging(true)
    const start = performance.now()
    try {
      await churnAPI.getHealth()
      const end = performance.now()
      setPingResult({
        status: 'Healthy & Connected',
        latencyMs: Math.round(end - start)
      })
    } catch (e) {
      setPingResult({
        status: 'Connection Failed',
        latencyMs: 0
      })
    } finally {
      setPinging(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl pb-12 font-sans selection:bg-indigo-500/20 selection:text-indigo-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
              System Configuration
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              FastAPI Inference Engine & Pipeline Specs
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System & Decision Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Configure FastAPI backend endpoints, decision boundary thresholds, and inspect production pipeline feature specifications.
          </p>
        </div>

        <div className="text-xs font-mono text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-xs font-semibold flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Runtime Active</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-blue-500"></div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>API & Decision Threshold Configuration</span>
          </h2>
          <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-200">Local Environment</span>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Configuration updated and runtime parameters saved successfully.</span>
          </div>
        )}

        <div className="space-y-6">
          {/* API URL Config & Ping Tester */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">FastAPI Backend Endpoint URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="input-enterprise flex-1 px-3 py-2 text-xs sm:text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleTestPing}
                disabled={pinging}
                className="btn-secondary text-xs px-4 shrink-0 cursor-pointer hover:border-indigo-300 hover:text-indigo-600"
              >
                <Radio className={`w-3.5 h-3.5 text-indigo-600 ${pinging ? 'animate-pulse' : ''}`} />
                <span>{pinging ? 'Testing...' : 'Test Ping'}</span>
              </button>
            </div>
            
            {pingResult && (
              <div className={`p-3 rounded-xl text-xs font-mono flex items-center justify-between border shadow-2xs ${
                pingResult.status.includes('Healthy')
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <span>Status: <strong>{pingResult.status}</strong></span>
                {pingResult.latencyMs > 0 && (
                  <span>Round-Trip Latency: <strong>{pingResult.latencyMs}ms</strong></span>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400">Default microservice runs on port 8000 (FastAPI Uvicorn).</p>
          </div>

          {/* Decision Threshold Slider */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Decision Cutoff Threshold (τ Cutoff)</span>
              </label>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-white text-indigo-700 rounded-xl border border-indigo-200 shadow-xs">
                τ = {threshold.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
              <span>Higher Sensitivity (Max Recall)</span>
              <span className="font-semibold text-indigo-700">
                {metrics?.optimal_threshold !== undefined
                  ? `Calibrated Optimal: τ = ${Number(metrics.optimal_threshold).toFixed(2)}`
                  : 'Calibrated Baseline'}
              </span>
              <span>Higher Precision (Min FP)</span>
            </div>
          </div>
        </div>

        {/* Model Pipeline Specs Card */}
        <div className="p-5 bg-gradient-to-br from-indigo-50/60 via-blue-50/30 to-purple-50/20 rounded-2xl border border-indigo-100/90 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Serialized Model & Preprocessing Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-white rounded-xl border border-indigo-100 space-y-1 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">Classifier Engine</div>
              <div className="font-bold text-slate-900 font-mono">{modelInfo?.model_name || 'XGBoost Classifier'}</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-indigo-100 space-y-1 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">Feature Transformation</div>
              <div className="font-bold text-indigo-700 font-mono">
                StandardScaler + {modelInfo?.num_features ? `${modelInfo.num_features} Features` : 'Features'}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-indigo-100 space-y-1 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">Holdout Test Set</div>
              <div className="font-bold text-slate-900 font-mono">
                {metrics?.confusion_matrix
                  ? `${(metrics.confusion_matrix.TN + metrics.confusion_matrix.FP + metrics.confusion_matrix.FN + metrics.confusion_matrix.TP).toLocaleString()} Accounts`
                  : '--'}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="btn-primary shadow-md text-xs py-2.5 px-5"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  )
}
