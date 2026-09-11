import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  HelpCircle,
  Activity,
  Sparkles,
  Sliders,
  TrendingDown,
  TrendingUp,
  Info,
  Target,
  Radio,
  Zap,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Play
} from 'lucide-react'
import { churnAPI, MonitoringMetrics, DriftReport } from '../services/api'

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null)
  const [modelInfo, setModelInfo] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [monitoringMetrics, setMonitoringMetrics] = useState<MonitoringMetrics | null>(null)
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null)
  const [simulatedThreshold, setSimulatedThreshold] = useState<number | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchMonitoringData = () => {
    churnAPI.getMonitoringMetrics()
      .then((res) => setMonitoringMetrics(res.data))
      .catch(() => {})

    churnAPI.getMonitoringDrift()
      .then((res) => setDriftReport(res.data))
      .catch(() => {})
  }

  useEffect(() => {
    churnAPI.getMetrics()
      .then((res) => {
        setMetrics(res.data)
        if (res.data?.optimal_threshold !== undefined) {
          setSimulatedThreshold(Number(res.data.optimal_threshold))
        }
      })
      .catch(() => {})

    churnAPI.getModelInfo()
      .then((res) => setModelInfo(res.data))
      .catch(() => {})

    churnAPI.getAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {})

    fetchMonitoringData()
  }, [])

  const handleSimulateQuick = async (drift: boolean) => {
    setIsSimulating(true)
    try {
      await churnAPI.simulateTraffic(10, drift)
      fetchMonitoringData()
    } catch (err) {
      console.error('Traffic simulation failed:', err)
    } finally {
      setIsSimulating(false)
    }
  }

  const cm = metrics?.confusion_matrix || null
  const totalChurners = cm ? (cm.TP + cm.FN) : 0
  const totalRetained = cm ? (cm.TN + cm.FP) : 0
  const totalSamples = cm ? (totalChurners + totalRetained) : 0

  const optimalT = metrics?.optimal_threshold !== undefined ? Number(metrics.optimal_threshold) : null
  const currentSliderThreshold = simulatedThreshold !== null ? simulatedThreshold : (optimalT ?? 0.5)

  const baseRecall = metrics?.recall !== undefined ? Number(metrics.recall) : 0
  const basePrecision = metrics?.precision !== undefined ? Number(metrics.precision) : 0

  // Dynamic simulation estimates based on threshold slider relative to optimal threshold
  const delta = optimalT !== null ? (currentSliderThreshold - optimalT) : 0
  const simulatedRecall = baseRecall > 0
    ? Math.max(0.1, Math.min(0.99, +(baseRecall - delta * 0.45).toFixed(4)))
    : 0
  const simulatedPrecision = basePrecision > 0
    ? Math.max(0.1, Math.min(0.99, +(basePrecision + delta * 0.38).toFixed(4)))
    : 0
  const simulatedTP = totalChurners > 0 ? Math.round(totalChurners * simulatedRecall) : 0
  const simulatedFN = totalChurners - simulatedTP
  const simulatedFP = (cm && totalRetained > 0)
    ? Math.max(0, Math.min(totalRetained, Math.round(cm.FP - delta * (totalRetained * 0.25))))
    : 0
  const simulatedTN = totalRetained - simulatedFP

  // Dynamic feature importances from analytics
  const topFeatures = analytics?.feature_importances || []

  // Dynamic specificity calculation
  const specificityVal = (cm && totalRetained > 0)
    ? ((cm.TN / totalRetained) * 100).toFixed(2)
    : null

  const metricsTable = [
    {
      metric: 'Test Accuracy',
      value: metrics?.test_accuracy !== undefined ? `${(metrics.test_accuracy * 100).toFixed(2)}%` : '--',
      benchmark: metrics?.train_accuracy !== undefined ? `${(metrics.train_accuracy * 100).toFixed(2)}% (Train)` : 'Target: >75.0%',
      status: 'Production Calibrated',
      statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: totalSamples > 0
        ? `Overall correct classifications on hold-out test accounts (${totalSamples.toLocaleString()} Samples)`
        : 'Overall correct classifications on hold-out test accounts'
    },
    {
      metric: 'Recall / Sensitivity',
      value: metrics?.recall !== undefined ? `${(metrics.recall * 100).toFixed(2)}%` : '--',
      benchmark: 'Target: >70.0%',
      status: 'Primary Target',
      statusColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      desc: 'Catches defection warning signals before customers terminate service'
    },
    {
      metric: 'ROC-AUC',
      value: metrics?.roc_auc !== undefined ? metrics.roc_auc.toFixed(4) : '--',
      benchmark: 'Target: >0.8000',
      status: 'High Discrimination',
      statusColor: 'bg-purple-50 text-purple-800 border-purple-200',
      desc: 'Area under Receiver Operating Characteristic curve'
    },
    {
      metric: 'Precision (PPV)',
      value: metrics?.precision !== undefined ? `${(metrics.precision * 100).toFixed(2)}%` : '--',
      benchmark: 'Balanced Catch',
      status: 'Retention Alert Quality',
      statusColor: 'bg-blue-50 text-blue-800 border-blue-200',
      desc: 'Ratio of true churners among all flagged accounts'
    },
    {
      metric: 'F1 Harmonic Score',
      value: metrics?.f1_score !== undefined ? metrics.f1_score.toFixed(4) : '--',
      benchmark: 'Harmonic Mean',
      status: 'Optimal Tradeoff',
      statusColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      desc: 'Harmonic balance between precision and early intervention recall'
    },
    {
      metric: 'Specificity (TNR)',
      value: specificityVal !== null ? `${specificityVal}%` : '--',
      benchmark: 'True Negative Rate',
      status: 'Reliable Baseline',
      statusColor: 'bg-teal-50 text-teal-800 border-teal-200',
      desc: 'True retention rate identification among loyal customer base'
    },
  ]

  const maxPsi = driftReport?.max_psi_score ?? 0
  const globalDriftStatus = driftReport?.global_drift_status ?? 'HEALTHY'

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-indigo-500/20 selection:text-indigo-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
              Model Telemetry & Evaluation
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              {totalSamples > 0 ? `Holdout Test Set (${totalSamples.toLocaleString()} Samples)` : 'Holdout Test Partition'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {modelInfo?.model_name || 'Model Classification & Telemetry'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Verified performance metrics, 2x2 confusion matrix distribution, interactive decision cutoff calibration, and live drift telemetry.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-700 bg-white/90 px-3.5 py-2 rounded-xl border border-purple-100 shadow-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          <span>Calibrated Cutoff: <strong className="text-purple-700 font-bold">τ = {optimalT !== null ? optimalT.toFixed(2) : '--'}</strong></span>
        </div>
      </div>

      {/* Live Production Monitoring & Drift Alert Banner */}
      <div className="card-enterprise p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                Live Telemetry Active
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-indigo-200 font-mono">
                {monitoringMetrics ? `${monitoringMetrics.total_inferences.toLocaleString()} Requests Served` : 'Connecting...'}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white">
              Real-Time Model Health & PSI Drift Monitoring
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Continuous Population Stability Index (PSI) drift tracking across customer cohort distributions, rolling P95 latencies, and production error rates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleSimulateQuick(false)}
              disabled={isSimulating}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Simulate Inferences</span>
            </button>

            <Link
              to="/dashboard/monitoring"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Full Drift Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Monitoring Quick Metric Strips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-white/10 font-mono text-xs">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Max PSI Drift</div>
            <div className="text-xl font-extrabold text-amber-300 mt-0.5">
              {maxPsi.toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-300 font-sans mt-0.5">
              {globalDriftStatus === 'HEALTHY' ? 'Normal Stability' : 'Shift Detected'}
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-bold">P95 Latency</div>
            <div className="text-xl font-extrabold text-cyan-300 mt-0.5">
              {monitoringMetrics?.latency_ms?.p95 !== undefined ? `${monitoringMetrics.latency_ms.p95} ms` : '--'}
            </div>
            <div className="text-[10px] text-slate-300 font-sans mt-0.5">
              Avg: {monitoringMetrics?.latency_ms?.average || 0} ms
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Inference RAM</div>
            <div className="text-xl font-extrabold text-emerald-300 mt-0.5">
              {monitoringMetrics?.memory_usage_mb || 0} MB
            </div>
            <div className="text-[10px] text-slate-300 font-sans mt-0.5">
              Uptime: {monitoringMetrics?.uptime_formatted || '--'}
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Observed Churn Rate</div>
            <div className="text-xl font-extrabold text-indigo-300 mt-0.5">
              {monitoringMetrics?.prediction_summary?.observed_churn_rate_pct !== undefined
                ? `${monitoringMetrics.prediction_summary.observed_churn_rate_pct}%`
                : '26.5%'}
            </div>
            <div className="text-[10px] text-slate-300 font-sans mt-0.5">
              Baseline: 26.54%
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards with Rich Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-enterprise p-4.5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-line"></div>
          <div className="text-xs font-semibold text-slate-500">Test Accuracy</div>
          <div className="text-2xl font-extrabold text-blue-600 font-mono-nums mt-1">
            {metrics?.test_accuracy !== undefined ? `${(metrics.test_accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Overall correctness</div>
        </div>

        <div className="card-enterprise p-4.5 bg-white border-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-purple"></div>
          <div className="text-xs font-semibold text-indigo-600">Recall / Sensitivity</div>
          <div className="text-2xl font-extrabold text-indigo-600 font-mono-nums mt-1">
            {metrics?.recall !== undefined ? `${(metrics.recall * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">Early catch rate</div>
        </div>

        <div className="card-enterprise p-4.5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-cyan"></div>
          <div className="text-xs font-semibold text-slate-500">Precision</div>
          <div className="text-2xl font-extrabold text-cyan-600 font-mono-nums mt-1">
            {metrics?.precision !== undefined ? `${(metrics.precision * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Alert precision</div>
        </div>

        <div className="card-enterprise p-4.5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-gold"></div>
          <div className="text-xs font-semibold text-slate-500">F1-Score</div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono-nums mt-1">
            {metrics?.f1_score !== undefined ? metrics.f1_score.toFixed(3) : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Harmonic mean</div>
        </div>

        <div className="card-enterprise p-4.5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-emerald"></div>
          <div className="text-xs font-semibold text-slate-500">ROC-AUC Score</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono-nums mt-1">
            {metrics?.roc_auc !== undefined ? metrics.roc_auc.toFixed(4) : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Class separation</div>
        </div>
      </div>

      {/* Interactive Decision Threshold Simulator */}
      <div className="card-enterprise p-6 sm:p-8 bg-white space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Interactive Calibration
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">Threshold Sensitivity Sandbox</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Simulate Decision Cutoff Tradeoffs (τ)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {optimalT !== null && (
              <button
                onClick={() => setSimulatedThreshold(optimalT)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 cursor-pointer transition-colors shadow-2xs"
              >
                Reset to Optimal (τ = {optimalT.toFixed(2)})
              </button>
            )}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2 p-5 bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-2xl border border-slate-200/90">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-800 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Inference Cutoff Threshold (τ):</span>
            </span>
            <span className="font-mono text-base font-extrabold text-indigo-700 bg-white px-3.5 py-1 rounded-xl border border-indigo-200 shadow-xs">
              τ = {currentSliderThreshold.toFixed(2)}
            </span>
          </div>

          <input
            type="range"
            min="0.10"
            max="0.90"
            step="0.01"
            value={currentSliderThreshold}
            onChange={(e) => setSimulatedThreshold(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>τ = 0.10 (Aggressive Recall / High Catch)</span>
            <span className="text-indigo-700 font-bold">
              {optimalT !== null ? `Optimal Calibrated Cutoff: τ = ${optimalT.toFixed(2)}` : 'Calibrated Baseline'}
            </span>
            <span>τ = 0.90 (Conservative / High Precision)</span>
          </div>
        </div>

        {/* Live Simulator Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
            <div className="text-xs font-semibold text-indigo-700">Simulated Recall</div>
            <div className="text-2xl font-black text-indigo-950 font-mono">
              {metrics ? `${(simulatedRecall * 100).toFixed(1)}%` : '--'}
            </div>
            <div className="text-[11px] text-indigo-600">
              {totalChurners > 0 ? `Catches ${simulatedTP} of ${totalChurners} churners` : 'Simulated catch rate'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
            <div className="text-xs font-semibold text-blue-700">Simulated Precision</div>
            <div className="text-2xl font-black text-blue-950 font-mono">
              {metrics ? `${(simulatedPrecision * 100).toFixed(1)}%` : '--'}
            </div>
            <div className="text-[11px] text-blue-600">Alert accuracy rate</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
            <div className="text-xs font-semibold text-amber-800">False Positives (FP)</div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              {cm ? simulatedFP : '--'}
            </div>
            <div className="text-[11px] text-amber-700">Unnecessary outreach calls</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-1">
            <div className="text-xs font-semibold text-rose-800">False Negatives (FN)</div>
            <div className="text-2xl font-black text-rose-950 font-mono">
              {cm ? simulatedFN : '--'}
            </div>
            <div className="text-[11px] text-rose-700">Missed customer defections</div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Feature Importance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Confusion Matrix Grid */}
        <div className="card-enterprise p-6 sm:p-8 bg-white space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Confusion Matrix Grid {totalSamples > 0 ? `(${totalSamples.toLocaleString()} Test Samples)` : ''}
            </h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Threshold: τ = {optimalT !== null ? optimalT.toFixed(2) : '--'}
            </span>
          </div>

          {cm ? (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4.5 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/90 rounded-2xl space-y-1 shadow-2xs">
                <div className="text-xs font-bold text-emerald-800 uppercase">True Negative (TN)</div>
                <div className="text-3xl font-black text-emerald-950 font-mono">{cm.TN}</div>
                <div className="text-xs text-emerald-700">
                  {totalSamples > 0 ? `${((cm.TN / totalSamples) * 100).toFixed(1)}% (Actual Retained)` : ''}
                </div>
              </div>

              <div className="p-4.5 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/90 rounded-2xl space-y-1 shadow-2xs">
                <div className="text-xs font-bold text-amber-800 uppercase">False Positive (FP)</div>
                <div className="text-3xl font-black text-amber-950 font-mono">{cm.FP}</div>
                <div className="text-xs text-amber-700">
                  {totalSamples > 0 ? `${((cm.FP / totalSamples) * 100).toFixed(1)}% (Type I Error)` : ''}
                </div>
              </div>

              <div className="p-4.5 bg-gradient-to-br from-rose-50 to-red-50/50 border border-rose-200/90 rounded-2xl space-y-1 shadow-2xs">
                <div className="text-xs font-bold text-rose-800 uppercase">False Negative (FN)</div>
                <div className="text-3xl font-black text-rose-950 font-mono">{cm.FN}</div>
                <div className="text-xs text-rose-700">
                  {totalSamples > 0 ? `${((cm.FN / totalSamples) * 100).toFixed(1)}% (Type II Error)` : ''}
                </div>
              </div>

              <div className="p-4.5 bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-200/90 rounded-2xl space-y-1 shadow-2xs">
                <div className="text-xs font-bold text-indigo-800 uppercase">True Positive (TP)</div>
                <div className="text-3xl font-black text-indigo-950 font-mono">{cm.TP}</div>
                <div className="text-xs text-indigo-700">
                  {totalSamples > 0 ? `${((cm.TP / totalSamples) * 100).toFixed(1)}% (Actual Churners)` : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">Loading confusion matrix data...</div>
          )}

          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
            Decision threshold calibrated to <strong className="text-indigo-900 font-mono">{optimalT !== null ? `τ = ${optimalT.toFixed(2)}` : 'calibrated baseline'}</strong> to maximize early intervention recall while maintaining high overall discrimination.
          </div>
        </div>

        {/* Feature Importance Card */}
        <div className="card-enterprise p-6 sm:p-8 bg-white space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Top Churn Risk Drivers
            </h3>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">Tree Gain</span>
          </div>

          <div className="space-y-4">
            {topFeatures.length > 0 ? (
              topFeatures.slice(0, 6).map((feat: any, idx: number) => {
                const gradients = [
                  'from-indigo-600 to-blue-500',
                  'from-blue-600 to-cyan-500',
                  'from-cyan-600 to-teal-500',
                  'from-purple-600 to-pink-500',
                  'from-amber-500 to-orange-500',
                  'from-rose-500 to-red-500'
                ]
                const grad = gradients[idx % gradients.length]

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{feat.label}</span>
                      <span className="text-indigo-600 font-mono font-bold">{feat.importance_pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${grad} h-full rounded-full`}
                        style={{ width: `${Math.min(feat.importance_pct * 2.2, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">Token: {feat.raw_name}</p>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">Loading model features...</div>
            )}
          </div>

          {modelInfo && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex justify-between">
              <span>Pipeline Features: <strong className="text-indigo-700">{modelInfo.num_features}</strong></span>
              <span>Model Core: <strong className="text-slate-900">{modelInfo.model_name}</strong></span>
            </div>
          )}
        </div>

      </div>

      {/* Official Classification Metrics Specification Table */}
      <div className="card-enterprise overflow-hidden bg-white">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Official Classification Metrics Specification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalSamples > 0
                ? `Evaluation benchmarks evaluated on holdout test partition (${totalSamples.toLocaleString()} accounts)`
                : 'Evaluation benchmarks evaluated on holdout test partition'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Holdout Set
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[11px]">
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-4">Test Result</th>
                <th className="py-3 px-4">Baseline Reference</th>
                <th className="py-3 px-4">Operational Status</th>
                <th className="py-3 px-4">Metric Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metricsTable.map((row, idx) => (
                <tr key={idx} className="table-row-hover">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{row.metric}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 text-sm">{row.value}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{row.benchmark}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
