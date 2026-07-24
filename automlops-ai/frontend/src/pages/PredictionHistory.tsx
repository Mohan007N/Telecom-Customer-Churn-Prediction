import React, { useState, useEffect } from 'react'
import { History, Search, Filter, RefreshCw } from 'lucide-react'
import { getPredictionHistory, PredictionRecord } from '../utils/predictionStorage'

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

  const filteredData = historyData.filter((item) => {
    const matchesSearch = item.id.toLowerCase().includes(search.toLowerCase()) ||
                          item.contract.toLowerCase().includes(search.toLowerCase())
    if (filter === 'ALL') return matchesSearch
    if (filter === 'CHURN') return matchesSearch && item.status === 'Churn'
    if (filter === 'RETAINED') return matchesSearch && item.status === 'Retained'
    if (filter === 'HIGH_RISK') return matchesSearch && item.riskLevel === 'High Risk'
    return matchesSearch
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Prediction History Log</h1>
          <p className="text-sm text-gray-500 mt-1">Audit log of customer churn predictions performed on real dataset records.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Log</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Customer ID or Contract..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Predictions ({historyData.length})</option>
              <option value="CHURN">Churn Predictions Only</option>
              <option value="RETAINED">Retained Predictions Only</option>
              <option value="HIGH_RISK">High Risk Tier Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Contract</th>
                <th className="py-3 px-4">Monthly Charges</th>
                <th className="py-3 px-4">Probability</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Prediction Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{row.id}</td>
                    <td className="py-3.5 px-4 text-gray-500">{row.timestamp}</td>
                    <td className="py-3.5 px-4 text-gray-700">{row.contract}</td>
                    <td className="py-3.5 px-4 text-gray-900 font-semibold">{row.monthlyCharges}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{row.probability}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                        row.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' :
                        row.riskLevel === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {row.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {row.status === 'Churn' ? (
                        <span className="text-red-600">Churned (1)</span>
                      ) : (
                        <span className="text-emerald-600">Retained (0)</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No prediction records matching search filter.
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
