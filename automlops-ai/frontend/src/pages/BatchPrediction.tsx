import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react'
import { churnAPI } from '../services/api'
import { addBatchPredictionRecords } from '../utils/predictionStorage'

export const BatchPrediction: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [response, setResponse] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const itemsPerPage = 10

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setValidationError('Only .csv files are supported.')
      return
    }

    setValidationError(null)
    setFile(selectedFile)
    setResponse(null)

    // Read first 10 rows for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (text) {
        const lines = text.split('\n').filter((l) => l.trim() !== '')
        if (lines.length > 0) {
          const parsedHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
          setHeaders(parsedHeaders)

          const sampleData = lines.slice(1, 11).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
            const rowObj: any = {}
            parsedHeaders.forEach((h, idx) => {
              rowObj[h] = values[idx] || ''
            })
            return rowObj
          })
          setPreviewRows(sampleData)
        }
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handlePredict = async () => {
    if (!file) return
    setLoading(true)
    setValidationError(null)

    try {
      const res = await churnAPI.predictBatch(file)
      const data = res.data
      setResponse(data)

      if (data.results && data.results.length > 0) {
        const batchRecords = data.results.slice(0, 20).map((r: any) => ({
          id: r.customer_id,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          contract: 'CSV Upload',
          monthlyCharges: '$--',
          probability: r.churn_probability_pct,
          probabilityVal: r.churn_probability,
          riskLevel: r.risk_level,
          status: r.churn_status
        }))
        addBatchPredictionRecords(batchRecords)
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'object' && detail.error) {
        setValidationError(`${detail.error} Missing: [${detail.missing_columns?.join(', ')}]`)
      } else if (typeof detail === 'string') {
        setValidationError(detail)
      } else {
        setValidationError('CSV Batch prediction failed. Check column names and formatting.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter & Pagination logic for results table
  const results = response?.results || []
  const filteredResults = results.filter((r: any) =>
    r.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.risk_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.churn_status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Batch CSV Churn Prediction</h1>
        <p className="text-sm text-gray-500 mt-1">Upload customer dataset CSV file to process predictions for entire customer base in seconds.</p>
      </div>

      {/* Upload Drag & Drop Area */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-xl p-8 text-center cursor-pointer transition-all space-y-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            accept=".csv"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">
              {file ? file.name : 'Drag and drop your CSV file here'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Supports standard customer dataset CSV (e.g. WA_Fn-UseC_-Telco-Customer-Churn.csv)
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Browse Computer</span>
          </button>
        </div>

        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* CSV Preview Section */}
        {previewRows.length > 0 && !response && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Dataset Preview (First 10 Rows)</span>
              </h3>
              <span className="text-xs font-semibold text-gray-500">{headers.length} Columns Detected</span>
            </div>

            <div className="overflow-x-auto max-h-56 border border-gray-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold">
                    {headers.map((h, i) => (
                      <th key={i} className="py-2 px-3 border-b border-gray-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {headers.map((h, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 text-gray-600 whitespace-nowrap">{row[h] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handlePredict}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Batch Predictions...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Run Batch Prediction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Results Output Table */}
      {response && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm space-y-6 p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-6 border-b border-gray-100">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs text-gray-500 font-semibold">Total Records</div>
              <div className="text-2xl font-bold text-gray-900">{response.total_records}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="text-xs text-red-600 font-semibold">Predicted Churners</div>
              <div className="text-2xl font-bold text-red-700">{response.churn_count}</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-xs text-emerald-600 font-semibold">Retained Customers</div>
              <div className="text-2xl font-bold text-emerald-700">{response.retained_count}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col justify-between">
              <div>
                <div className="text-xs text-blue-700 font-semibold">Churn Percentage</div>
                <div className="text-2xl font-bold text-blue-900">{response.churn_rate_pct}%</div>
              </div>
              {response.download_url && (
                <a
                  href={`http://localhost:8000${response.download_url}`}
                  download
                  className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </a>
              )}
            </div>
          </div>

          {/* Search & Results Table */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Customer ID or Risk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:bg-white focus:outline-none"
              />
            </div>
            <div className="text-xs text-gray-500">
              Showing {paginatedResults.length} of {filteredResults.length} records
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Prediction</th>
                  <th className="py-3 px-4">Probability</th>
                  <th className="py-3 px-4">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedResults.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">{r.customer_id}</td>
                    <td className="py-3 px-4 font-bold">
                      {r.churn_predicted === 1 ? (
                        <span className="text-red-600">Churned (1)</span>
                      ) : (
                        <span className="text-emerald-600">Retained (0)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{r.churn_probability_pct}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        r.risk_level === 'High Risk' ? 'bg-red-100 text-red-700' :
                        r.risk_level === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-2 text-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
