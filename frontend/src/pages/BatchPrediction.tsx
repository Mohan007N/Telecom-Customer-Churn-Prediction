import React, { useState, useRef, useMemo } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Filter,
  Sparkles,
  BarChart3,
  TrendingDown,
  Layers,
  ArrowRight,
  Zap,
  HelpCircle
} from 'lucide-react'
import { churnAPI, getDownloadUrl } from '../services/api'
import { addBatchPredictionRecords } from '../utils/predictionStorage'

const SAMPLE_CSV_CONTENT = `customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.3,1840.75
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,151.65
9305-CDSKC,Female,0,No,No,8,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Electronic check,99.65,820.5
1452-KIOVK,Male,0,No,Yes,22,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,No,Month-to-month,Yes,Credit card (automatic),89.1,1949.4
6713-OKOMC,Female,0,No,No,10,No,No phone service,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,29.75,301.9
7892-POOKP,Female,0,Yes,No,28,Yes,Yes,Fiber optic,No,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,104.8,3046.05
6388-TABGU,Male,0,No,Yes,62,Yes,No,DSL,Yes,Yes,No,No,No,No,One year,No,Bank transfer (automatic),56.15,3487.95
9763-GRSKD,Male,0,Yes,Yes,13,Yes,No,DSL,Yes,No,No,No,No,No,Month-to-month,Yes,Mailed check,49.95,587.45
7469-LKBCI,Male,0,No,No,16,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Credit card (automatic),18.95,326.8`

export const BatchPrediction: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [response, setResponse] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [riskFilter, setRiskFilter] = useState<string>('ALL')
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

  // Generate and load sample CSV directly in browser memory
  const handleLoadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' })
    const sampleFile = new File([blob], 'telco_benchmark_sample.csv', { type: 'text/csv' })
    handleFileSelect(sampleFile)
  }

  // Download sample CSV template directly to user's disk
  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'telco_batch_upload_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        const batchRecords = data.results.slice(0, 25).map((r: any, idx: number) => {
          const match = previewRows.find((p) => (p.customerID || p.CustomerID || p['Customer ID']) === r.customer_id) || previewRows[idx]
          const contract = match?.Contract || 'Batch CSV'
          const monthly = match?.MonthlyCharges ? `$${Number(match.MonthlyCharges).toFixed(2)}` : '$--'
          return {
            id: r.customer_id,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            contract: contract,
            monthlyCharges: monthly,
            probability: r.churn_probability_pct,
            probabilityVal: r.churn_probability,
            riskLevel: r.risk_level,
            status: r.churn_status
          }
        })
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
  const filteredResults = useMemo(() => {
    return results.filter((r: any) => {
      const matchesSearch =
        r.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.risk_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.churn_status.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (riskFilter === 'ALL') return true
      if (riskFilter === 'HIGH') return r.risk_level === 'High Risk'
      if (riskFilter === 'MEDIUM') return r.risk_level === 'Medium Risk'
      if (riskFilter === 'LOW') return r.risk_level === 'Low Risk'
      return true
    })
  }, [results, searchQuery, riskFilter])

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-indigo-500/20 selection:text-indigo-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200 shadow-2xs">
              Batch CSV Inference
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-600" />
              Vectorized Schema Validation
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            High-Speed Batch CSV Prediction Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Upload customer portfolio CSV datasets to score thousands of accounts in seconds with automated feature scalers and instant audit exports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="btn-secondary text-xs py-2 px-3.5 shadow-2xs hover:border-cyan-300 hover:text-cyan-700 hover:bg-cyan-50/40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600" />
            <span>Download CSV Template</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleCSV}
            className="btn-secondary text-xs py-2 px-3.5 shadow-2xs hover:border-cyan-300 hover:text-cyan-700 hover:bg-cyan-50/40 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
            <span>Load 12-Account Sample</span>
          </button>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-cyan-200 hover:border-cyan-500 bg-gradient-to-b from-slate-50/80 to-cyan-50/20 hover:bg-cyan-50/40 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            accept=".csv"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-cyan-500/25">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {file ? file.name : 'Click to select or drag and drop customer CSV file'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Supports standard Telco dataset format (e.g. <span className="font-mono text-cyan-700">WA_Fn-UseC_-Telco-Customer-Churn.csv</span>)
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-cyan-200 text-cyan-800 text-xs font-semibold rounded-xl shadow-xs hover:bg-cyan-50 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
            <span>Select Local File</span>
          </button>
        </div>

        {/* Required columns helper badge */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
            <span>Essential Columns: <strong className="text-slate-800 font-mono">tenure, MonthlyCharges, TotalCharges, Contract</strong></span>
          </div>
          <span className="text-slate-400 font-mono">All 16 other Telco features auto-default if omitted</span>
        </div>

        {validationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* CSV Preview Section */}
        {previewRows.length > 0 && !response && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-600" />
                <span>Dataset Preview (Top 10 Sample Rows)</span>
              </h3>
              <span className="text-xs font-mono font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">{headers.length} Columns Detected</span>
            </div>

            <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    {headers.map((h, i) => (
                      <th key={i} className="py-2.5 px-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="table-row-hover">
                      {headers.map((h, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">{row[h] || '-'}</td>
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
                className="btn-primary disabled:opacity-50 shadow-md text-xs py-2.5 px-5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Batch Predictions...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-cyan-200" />
                    <span>Execute Batch Scoring</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Results Output Table */}
      {response && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 p-6 sm:p-8 animate-fadeIn relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500"></div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
              <div className="text-xs text-blue-800 font-semibold">Total Scored Records</div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono-nums mt-0.5">{response.total_records.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
              <div className="text-xs text-rose-800 font-semibold">Predicted Churners</div>
              <div className="text-2xl font-extrabold text-rose-600 font-mono-nums mt-0.5">{response.churn_count.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <div className="text-xs text-emerald-800 font-semibold">Retained Customers</div>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono-nums mt-0.5">{response.retained_count.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-col justify-between">
              <div>
                <div className="text-xs text-indigo-800 font-semibold">Cohort Churn Percentage</div>
                <div className="text-2xl font-extrabold text-indigo-600 font-mono-nums mt-0.5">{response.churn_rate_pct}%</div>
              </div>
              {response.download_url && (
                <a
                  href={getDownloadUrl(response.download_url)}
                  download
                  className="mt-2 btn-primary text-xs py-1.5 px-3 justify-center shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Prediction CSV</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-600" />
                <span>Filter:</span>
              </span>

              {[
                { key: 'ALL', label: `All (${results.length})` },
                { key: 'HIGH', label: 'High Risk' },
                { key: 'MEDIUM', label: 'Medium Risk' },
                { key: 'LOW', label: 'Low Risk' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setRiskFilter(tab.key)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    riskFilter === tab.key
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Account ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input-enterprise w-full pl-8.5 pr-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase text-[11px]">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Prediction</th>
                  <th className="py-3 px-4">Probability</th>
                  <th className="py-3 px-4">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedResults.length > 0 ? (
                  paginatedResults.map((r: any, idx: number) => (
                    <tr key={idx} className="table-row-hover">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.customer_id}</td>
                      <td className="py-3 px-4 font-bold">
                        {r.churn_predicted === 1 ? (
                          <span className="text-rose-600 inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full">
                            Churned (1)
                          </span>
                        ) : (
                          <span className="text-emerald-600 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Retained (0)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.churn_probability_pct}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          r.risk_level === 'High Risk' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                          r.risk_level === 'Medium Risk' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {r.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      No records match the current search or risk filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-2 text-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
              >
                Previous
              </button>
              <span className="text-slate-500 font-medium font-mono">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
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
