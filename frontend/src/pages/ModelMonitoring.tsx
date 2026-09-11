import React, { useEffect, useState, useCallback } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Cpu,
  Zap,
  Radio,
  Play,
  RotateCcw,
  Sliders,
  Flame,
  CheckCircle,
  Database,
  ArrowUpRight,
  TrendingUp,
  Server
} from 'lucide-react'
import { churnAPI, MonitoringMetrics, DriftReport } from '../services/api'

export const ModelMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null)
  const [drift, setDrift] = useState<DriftReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [simulating, setSimulating] = useState<boolean>(false)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
  const [driftMode, setDriftMode] = useState<boolean>(false)
  const [simulationMsg, setSimulationMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [mRes, dRes] = await Promise.all([
        churnAPI.getMonitoringMetrics(),
        churnAPI.getMonitoringDrift()
      ])
      setMetrics(mRes.data)
      setDrift(dRes.data)
    } catch (err) {
      console.error('Error fetching monitoring data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh timer every 6 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchData()
    }, 6000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const handleSimulate = async () => {
    setSimulating(true)
    setSimulationMsg(null)
    try {
      const res = await churnAPI.simulateTraffic(15, driftMode)
      setSimulationMsg(res.data.message)
      await fetchData()
    } catch (err) {
      console.error('Simulation error:', err)
    } finally {
      setSimulating(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset dynamic inference telemetry buffers?')) return
    try {
      await churnAPI.resetMonitoring()
      await fetchData()
    } catch (err) {
      console.error('Reset error:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL_DRIFT':
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          text: 'Critical Shift (Retrain Recommended)'
        }
      case 'MODERATE_DRIFT':
      case 'WARNING':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          text: 'Moderate Shift'
        }
      case 'HEALTHY':
      case 'NORMAL':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          text: 'Healthy (No Drift)'
        }
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          text: 'Collecting Baseline'
        }
    }
  }

  const globalStatus = drift?.global_drift_status || 'HEALTHY'
  const globalBadge = getStatusBadge(globalStatus)

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-indigo-500/20 selection:text-indigo-950">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
              Live Serving Telemetry
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              Real-Time Feature Drift & PSI Monitor
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Production Model Monitoring & PSI Drift Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Population Stability Index (PSI) drift tracking, real-time prediction distribution shifts, rolling latency percentiles, and telemetry diagnostics.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            Auto-Sync {autoRefresh ? 'On (6s)' : 'Off'}
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Buffers
          </button>
        </div>
      </div>

      {/* Synthetic Traffic Simulator Sandbox */}
      <div className="card-enterprise p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl rounded-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                Live Traffic Sandbox
              </span>
              <span className="text-xs text-indigo-300 font-medium">Inject Synthetic Inferences</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Simulate Live Production Traffic & Drift Scenarios
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Inject 15 scored inference requests to test telemetry reaction times, latency percentiles, and PSI drift alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <input
                type="checkbox"
                checked={driftMode}
                onChange={(e) => setDriftMode(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 accent-indigo-500 cursor-pointer"
              />
              <span>Trigger Synthetic Data Drift</span>
            </label>

            <button
              onClick={handleSimulate}
              disabled={simulating}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                driftMode
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-rose-900/40'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-indigo-900/40'
              }`}
            >
              {simulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{simulating ? 'Injecting Traffic...' : driftMode ? 'Inject Drifted Traffic' : 'Inject Normal Traffic'}</span>
            </button>
          </div>
        </div>

        {simulationMsg && (
          <div className="mt-3 text-xs bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-indigo-200 font-mono flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{simulationMsg}</span>
          </div>
        )}
      </div>

      {/* Executive Telemetry Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Inferences */}
        <div className="card-enterprise p-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-line"></div>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500">Total Inferences Served</div>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono-nums mt-1.5">
            {metrics ? metrics.total_inferences.toLocaleString() : '--'}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
            <span>Single: {metrics?.single_inferences || 0}</span>
            <span>•</span>
            <span>Batch: {metrics?.batch_inferences || 0}</span>
          </div>
        </div>

        {/* Latency P95 */}
        <div className="card-enterprise p-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-purple"></div>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-indigo-600">P95 Inference Latency</div>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 font-mono-nums mt-1.5">
            {metrics?.latency_ms?.p95 !== undefined ? `${metrics.latency_ms.p95} ms` : '--'}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
            <span>P50: {metrics?.latency_ms?.p50 || 0}ms</span>
            <span>•</span>
            <span>Avg: {metrics?.latency_ms?.average || 0}ms</span>
          </div>
        </div>

        {/* Global Drift Status */}
        <div className="card-enterprise p-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-gold"></div>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500">Max PSI Drift Metric</div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono-nums mt-1.5">
            {drift?.max_psi_score !== undefined ? drift.max_psi_score.toFixed(3) : '--'}
          </div>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${globalBadge.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${globalBadge.dot}`}></span>
              {globalBadge.text}
            </span>
          </div>
        </div>

        {/* Memory & Health */}
        <div className="card-enterprise p-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-emerald"></div>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500">Engine Uptime & RAM</div>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-nums mt-2">
            {metrics?.uptime_formatted || '--'}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
            <span>RAM: {metrics?.memory_usage_mb || 0} MB</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">Errors: {metrics?.error_count || 0}</span>
          </div>
        </div>

      </div>

      {/* Feature Drift (PSI) Table */}
      <div className="card-enterprise overflow-hidden bg-white">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Population Stability Index (PSI) Feature Drift Detection
              </h3>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Telco Training Baseline
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              PSI &lt; 0.10: Normal (Green) | 0.10 &le; PSI &lt; 0.20: Moderate Shift (Yellow) | PSI &ge; 0.20: Significant Drift (Red)
            </p>
          </div>

          <div className="text-xs text-slate-600 font-mono">
            {drift?.global_recommendation && (
              <span className="font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs block">
                {drift.global_recommendation}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[11px]">
                <th className="py-3 px-4">Feature Name</th>
                <th className="py-3 px-4">Serving Samples</th>
                <th className="py-3 px-4">PSI Score</th>
                <th className="py-3 px-4">Stability Gauge</th>
                <th className="py-3 px-4">Drift Classification</th>
                <th className="py-3 px-4">Serving Distribution Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {drift && drift.features ? (
                Object.entries(drift.features).map(([featName, featInfo]) => {
                  const badge = getStatusBadge(featInfo.status)
                  const psiVal = featInfo.psi || 0
                  const gaugeWidth = Math.min(100, Math.max(8, psiVal * 300))

                  let gaugeColor = 'from-emerald-500 to-teal-400'
                  if (featInfo.status === 'WARNING') gaugeColor = 'from-amber-500 to-orange-400'
                  if (featInfo.status === 'CRITICAL') gaugeColor = 'from-rose-500 to-red-600'

                  return (
                    <tr key={featName} className="table-row-hover">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          <span>{featName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {featInfo.sample_count} reqs
                      </td>
                      <td className="py-3.5 px-4 font-bold text-sm text-slate-900">
                        {featInfo.psi.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 w-44">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${gaugeColor}`}
                            style={{ width: `${gaugeWidth}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {featInfo.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {featInfo.mean_observed !== undefined ? (
                          <span>Mean: <strong>{featInfo.mean_observed}</strong> | Median: <strong>{featInfo.median_observed}</strong></span>
                        ) : featInfo.observed_breakdown ? (
                          <span>{Object.entries(featInfo.observed_breakdown).slice(0, 2).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`).join(' • ')}</span>
                        ) : (
                          <span className="text-slate-400">{featInfo.message || 'Tracking'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-sans">
                    Loading feature drift calculations...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prediction Distribution & Histogram Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Prediction Probability Histogram */}
        <div className="card-enterprise p-6 bg-white space-y-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Serving Prediction Probability Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of output churn probabilities across inference serving requests
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded font-bold">
              Histogram
            </span>
          </div>

          <div className="space-y-3.5">
            {metrics?.prediction_summary?.probability_histogram ? (
              metrics.prediction_summary.probability_histogram.map((bucket, idx) => {
                const total = metrics.prediction_summary.total_scored || 1
                const pct = Math.round((bucket.count / total) * 100)
                const colors = [
                  'from-emerald-500 to-teal-400',
                  'from-cyan-500 to-blue-400',
                  'from-amber-500 to-orange-400',
                  'from-orange-500 to-rose-400',
                  'from-rose-600 to-red-600'
                ]

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{bucket.range}</span>
                      <span className="font-mono text-slate-900">{bucket.count} samples ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colors[idx % colors.length]}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">Loading distribution...</div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex justify-between font-mono">
            <span>Observed Churn Rate: <strong className="text-rose-600">{metrics?.prediction_summary?.observed_churn_rate_pct || 0}%</strong></span>
            <span>Baseline Churn Rate: <strong className="text-slate-700">{metrics?.prediction_summary?.baseline_churn_rate_pct || 26.54}%</strong></span>
          </div>
        </div>

        {/* Recent Inferences Log */}
        <div className="card-enterprise p-6 bg-white space-y-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Recent Serving Inference Stream
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time request log with latency and risk score
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live Stream
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Account ID</th>
                  <th className="pb-2">Risk</th>
                  <th className="pb-2">Probability</th>
                  <th className="pb-2">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {metrics?.recent_predictions && metrics.recent_predictions.length > 0 ? (
                  metrics.recent_predictions.slice(0, 8).map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 font-bold text-slate-800">{rec.customer_id}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.churn_predicted === 1
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {rec.risk_level}
                        </span>
                      </td>
                      <td className="py-2 text-indigo-600 font-bold">
                        {(rec.churn_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 text-slate-500">
                        {rec.latency_ms} ms
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-sans text-xs">
                      No recent inference requests logged yet. Use the Sandbox above to inject traffic!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-400 text-center font-mono">
            Logs rolling buffer persists the last 200 real-time inference transactions.
          </div>
        </div>

      </div>

    </div>
  )
}
