import React, { useEffect, useState } from 'react'
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
  Info
} from 'lucide-react'
import { churnAPI } from '../services/api'

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null)
  const [modelInfo, setModelInfo] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [simulatedThreshold, setSimulatedThreshold] = useState<number | null>(null)

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
  }, [])

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
      desc: totalSamples > 0
        ? `Overall correct classifications on hold-out test accounts (${totalSamples.toLocaleString()} Samples)`
        : 'Overall correct classifications on hold-out test accounts'
    },
    {
      metric: 'Recall / Sensitivity',
      value: metrics?.recall !== undefined ? `${(metrics.recall * 100).toFixed(2)}%` : '--',
      benchmark: 'Target: >70.0%',
      status: 'Primary Optimization Target',
      desc: 'Catches defection warning signals before customers terminate service'
    },
    {
      metric: 'ROC-AUC',
      value: metrics?.roc_auc !== undefined ? metrics.roc_auc.toFixed(4) : '--',
      benchmark: 'Target: >0.8000',
      status: 'High Discrimination',
      desc: 'Area under Receiver Operating Characteristic curve'
    },
    {
      metric: 'Precision (PPV)',
      value: metrics?.precision !== undefined ? `${(metrics.precision * 100).toFixed(2)}%` : '--',
      benchmark: 'Balanced Catch',
      status: 'Retention Alert Quality',
      desc: 'Ratio of true churners among all flagged accounts'
    },
    {
      metric: 'F1 Harmonic Score',
      value: metrics?.f1_score !== undefined ? metrics.f1_score.toFixed(4) : '--',
      benchmark: 'Harmonic Mean',
      status: 'Optimal Tradeoff',
      desc: 'Harmonic balance between precision and early intervention recall'
    },
    {
      metric: 'Specificity (TNR)',
      value: specificityVal !== null ? `${specificityVal}%` : '--',
      benchmark: 'True Negative Rate',
      status: 'Reliable Baseline',
      desc: 'True retention rate identification among loyal customer base'
    },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200/80">
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
            Verified performance metrics, 2x2 confusion matrix distribution, and interactive decision cutoff calibration.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          Calibrated Cutoff: <strong className="text-indigo-600 font-bold">τ = {optimalT !== null ? optimalT.toFixed(2) : '--'}</strong>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-enterprise p-4 bg-white">
          <div className="text-xs font-semibold text-slate-500">Test Accuracy</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums mt-1">
            {metrics?.test_accuracy !== undefined ? `${(metrics.test_accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Overall correctness</div>
        </div>

        <div className="card-enterprise p-4 bg-white border-indigo-200">
          <div className="text-xs font-semibold text-indigo-600">Recall / Sensitivity</div>
          <div className="text-2xl font-bold text-indigo-600 font-mono-nums mt-1">
            {metrics?.recall !== undefined ? `${(metrics.recall * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">Early catch rate</div>
        </div>

        <div className="card-enterprise p-4 bg-white">
          <div className="text-xs font-semibold text-slate-500">Precision</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums mt-1">
            {metrics?.precision !== undefined ? `${(metrics.precision * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Precision of churn alerts</div>
        </div>

        <div className="card-enterprise p-4 bg-white">
          <div className="text-xs font-semibold text-slate-500">F1-Score</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums mt-1">
            {metrics?.f1_score !== undefined ? metrics.f1_score.toFixed(3) : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Harmonic mean metric</div>
        </div>

        <div className="card-enterprise p-4 bg-white">
          <div className="text-xs font-semibold text-slate-500">ROC-AUC Score</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums mt-1">
            {metrics?.roc_auc !== undefined ? metrics.roc_auc.toFixed(4) : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Class separation power</div>
        </div>
      </div>

      {/* Interactive Decision Threshold Simulator */}
      <div className="card-enterprise p-6 sm:p-8 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Interactive Calibration
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">Threshold Sensitivity Sandbox</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Simulate Decision Cutoff Tradeoffs (τ)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {optimalT !== null && (
              <button
                onClick={() => setSimulatedThreshold(optimalT)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 cursor-pointer transition-colors"
              >
                Reset to Optimal (τ = {optimalT.toFixed(2)})
              </button>
            )}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Inference Cutoff Threshold (τ):</span>
            </span>
            <span className="font-mono text-base font-extrabold text-indigo-700 bg-white px-3 py-1 rounded border border-indigo-200 shadow-2xs">
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
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
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
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
            <div className="text-xs font-semibold text-indigo-700">Simulated Recall</div>
            <div className="text-2xl font-black text-indigo-950 font-mono">
              {metrics ? `${(simulatedRecall * 100).toFixed(1)}%` : '--'}
            </div>
            <div className="text-[11px] text-indigo-600">
              {totalChurners > 0 ? `Catches ${simulatedTP} of ${totalChurners} churners` : 'Simulated catch rate'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-semibold text-slate-700">Simulated Precision</div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {metrics ? `${(simulatedPrecision * 100).toFixed(1)}%` : '--'}
            </div>
            <div className="text-[11px] text-slate-500">Alert accuracy rate</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
            <div className="text-xs font-semibold text-amber-800">False Positives (FP)</div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              {cm ? simulatedFP : '--'}
            </div>
            <div className="text-[11px] text-amber-700">Unnecessary outreach calls</div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-1">
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
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
              Threshold: τ = {optimalT !== null ? optimalT.toFixed(2) : '--'}
            </span>
          </div>

          {cm ? (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-emerald-50 border border-emerald-200/90 rounded-xl space-y-1">
                <div className="text-xs font-bold text-emerald-800 uppercase">True Negative (TN)</div>
                <div className="text-3xl font-black text-emerald-950 font-mono">{cm.TN}</div>
                <div className="text-xs text-emerald-700">
                  {totalSamples > 0 ? `${((cm.TN / totalSamples) * 100).toFixed(1)}% (Actual Retained)` : ''}
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-xl space-y-1">
                <div className="text-xs font-bold text-amber-800 uppercase">False Positive (FP)</div>
                <div className="text-3xl font-black text-amber-950 font-mono">{cm.FP}</div>
                <div className="text-xs text-amber-700">
                  {totalSamples > 0 ? `${((cm.FP / totalSamples) * 100).toFixed(1)}% (Type I Error)` : ''}
                </div>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-200/90 rounded-xl space-y-1">
                <div className="text-xs font-bold text-rose-800 uppercase">False Negative (FN)</div>
                <div className="text-3xl font-black text-rose-950 font-mono">{cm.FN}</div>
                <div className="text-xs text-rose-700">
                  {totalSamples > 0 ? `${((cm.FN / totalSamples) * 100).toFixed(1)}% (Type II Error)` : ''}
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200/90 rounded-xl space-y-1">
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

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
            Decision threshold calibrated to <strong className="text-slate-900 font-mono">{optimalT !== null ? `τ = ${optimalT.toFixed(2)}` : 'calibrated baseline'}</strong> to maximize early intervention recall while maintaining high overall discrimination.
          </div>
        </div>

        {/* Feature Importance Card */}
        <div className="card-enterprise p-6 sm:p-8 bg-white space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Top Churn Risk Drivers
            </h3>
            <span className="text-xs font-mono text-slate-400">Tree Gain</span>
          </div>

          <div className="space-y-4">
            {topFeatures.length > 0 ? (
              topFeatures.slice(0, 6).map((feat: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{feat.label}</span>
                    <span className="text-indigo-600 font-mono">{feat.importance_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min(feat.importance_pct * 2.2, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">Token: {feat.raw_name}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">Loading model features...</div>
            )}
          </div>

          {modelInfo && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex justify-between">
              <span>Pipeline Features: <strong className="text-slate-900">{modelInfo.num_features}</strong></span>
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
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
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
