import React, { useState, useEffect, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle2,
  UserX,
  UserCheck,
  Download,
  ShieldAlert,
  BarChart3,
  TrendingDown,
  Sparkles
} from 'lucide-react'
import { getPredictionHistory, clearPredictionHistory, PredictionRecord } from '../utils/predictionStorage'

export const PredictionHistory: React.FC = () => {
  const [historyData, setHistoryData] = useState<PredictionRecord[]>([])
  const [filter, setFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')

  useEffect(() => {
    setHistoryData(getPredictionHistory())
  }, [])

  const handleRefresh = () => {
    setHistoryData(getPredictionHistory())
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all prediction audit records?')) {
      clearPredictionHistory()
      setHistoryData([])
    }
  }

  const handleExportCSV = () => {
    if (historyData.length === 0) return
    const headers = ['ID', 'Timestamp', 'Contract', 'MonthlyCharges', 'Probability', 'RiskLevel', 'Status']
    const rows = historyData.map(r => [
      r.id,
      r.timestamp,
      `"${r.contract}"`,
      r.monthlyCharges,
      r.probability,
      `"${r.riskLevel}"`,
      r.status
    ])

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `churn_prediction_audits_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredData = useMemo(() => {
    return historyData.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.contract.toLowerCase().includes(search.toLowerCase()) ||
        item.riskLevel.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false
      if (filter === 'ALL') return true
      if (filter === 'CHURN') return item.status === 'Churn'
      if (filter === 'RETAINED') return item.status === 'Retained'
      if (filter === 'HIGH_RISK') return item.riskLevel === 'High Risk'
      return true
    })
  }, [historyData, search, filter])

  // Summary KPIs for historical predictions
  const totalAudits = historyData.length
  const churnCount = historyData.filter(h => h.status === 'Churn').length
  const highRiskCount = historyData.filter(h => h.riskLevel === 'High Risk').length
  const avgProb = totalAudits > 0
    ? (historyData.reduce((acc, h) => acc + (h.probabilityVal || 0), 0) / totalAudits * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-indigo-500/20 selection:text-indigo-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs">
              Audit Trail & Governance
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-500" />
              Persistent Local Storage
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Prediction Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Chronological audit log of single and batch customer churn predictions performed across active operational sessions.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 shrink-0">
          {historyData.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="btn-secondary text-xs py-2 px-3.5 shadow-xs hover:border-indigo-200 hover:text-indigo-600 cursor-pointer"
                title="Export all audit records to CSV"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Clear</span>
              </button>
            </>
          )}

          <button
            onClick={handleRefresh}
            className="btn-secondary text-xs py-2 px-3.5 shadow-xs hover:border-indigo-200 hover:text-indigo-600 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit KPI Cards with Color Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-enterprise p-4.5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-line"></div>
          <div className="text-xs font-semibold text-slate-500">Total Accounts Audited</div>
          <div className="text-2xl font-extrabold text-blue-600 font-mono-nums mt-1">{totalAudits}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Recorded across sessions</div>
        </div>

        <div className="card-enterprise p-4.5 bg-white border-rose-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-rose"></div>
          <div className="text-xs font-semibold text-rose-700">Flagged Churn Predictions</div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono-nums mt-1">{churnCount}</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            {totalAudits > 0 ? `${((churnCount / totalAudits) * 100).toFixed(1)}% of audit pool` : '0%'}
          </div>
        </div>

        <div className="card-enterprise p-4.5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-gold"></div>
          <div className="text-xs font-semibold text-slate-500">High Risk Tier Accounts</div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono-nums mt-1">{highRiskCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">High risk category</div>
        </div>

        <div className="card-enterprise p-4.5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 card-accent-purple"></div>
          <div className="text-xs font-semibold text-slate-500">Average Risk Probability</div>
          <div className="text-2xl font-extrabold text-purple-600 font-mono-nums mt-1">{avgProb}%</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Mean likelihood score</div>
        </div>
      </div>

      {/* Audit Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-blue-500"></div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-600" />
              <span>Filter:</span>
            </span>

            {[
              { key: 'ALL', label: `All (${historyData.length})` },
              { key: 'CHURN', label: 'Churn Only' },
              { key: 'RETAINED', label: 'Retained Only' },
              { key: 'HIGH_RISK', label: 'High Risk Tier' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Account ID or Contract..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-enterprise w-full pl-8.5 pr-3 py-1.5 text-xs font-mono"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase text-[11px]">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Contract</th>
                <th className="py-3 px-4">Monthly Bill</th>
                <th className="py-3 px-4">Probability</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Prediction Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="table-row-hover">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{row.id}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{row.timestamp}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{row.contract}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold font-mono">{row.monthlyCharges}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{row.probability}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                        row.riskLevel === 'High Risk' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        row.riskLevel === 'Medium Risk' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {row.status === 'Churn' ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                          <UserX className="w-3.5 h-3.5" />
                          Churn (1)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          <UserCheck className="w-3.5 h-3.5" />
                          Retained (0)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500">No prediction records matching search or filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
