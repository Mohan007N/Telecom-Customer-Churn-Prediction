import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  UserX,
  UserCheck,
  Award,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  RefreshCw,
  SlidersHorizontal,
  FileSpreadsheet,
  Cpu,
  Database,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts'
import { churnAPI } from '../services/api'
import { getPredictionHistory, PredictionRecord } from '../utils/predictionStorage'

interface AnalyticsData {
  overview: {
    total_customers: number
    total_churned: number
    total_retained: number
    churn_rate_pct: number
    retention_rate_pct: number
    avg_tenure_months: number
    avg_monthly_charges: number
    total_monthly_revenue: number
    monthly_churn_loss: number
    dataset_provenance: string
  }
  contract_distribution: Array<{
    contract: string
    total: number
    churned: number
    retained: number
    churn_rate_pct: number
  }>
  internet_service_distribution: Array<{
    service: string
    total: number
    churned: number
    retained: number
    churn_rate_pct: number
  }>
  tenure_cohorts: Array<{
    cohort: string
    total: number
    churned: number
    retained: number
    churn_rate_pct: number
  }>
  payment_methods: Array<{
    method: string
    total: number
    churned: number
    retained: number
    churn_rate_pct: number
  }>
  feature_importances: Array<{
    raw_name: string
    label: string
    importance_pct: number
  }>
  sample_customers: Array<any>
}

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [modelInfo, setModelInfo] = useState<any>(null)
  const [recentAudits, setRecentAudits] = useState<PredictionRecord[]>([])
  const [cohortFilter, setCohortFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      churnAPI.getAnalytics(),
      churnAPI.getMetrics(),
      churnAPI.getModelInfo()
    ])
      .then(([analyticsRes, metricsRes, modelInfoRes]) => {
        setAnalytics(analyticsRes.data)
        if (metricsRes.data) {
          setMetrics(metricsRes.data)
        }
        if (modelInfoRes.data) {
          setModelInfo(modelInfoRes.data)
        }
      })
      .catch((err) => {
        console.error('Failed to load telemetry analytics:', err)
      })
      .finally(() => {
        setLoading(false)
      })

    setRecentAudits(getPredictionHistory().slice(0, 6))
  }

  useEffect(() => {
    loadData()
  }, [])

  const overview = analytics?.overview
  const contractChartData = analytics?.contract_distribution || []
  const tenureChartData = analytics?.tenure_cohorts?.map((d) => ({
    name: d.cohort.split(' ')[0],
    churn_rate: d.churn_rate_pct,
    retained: d.retained,
    churned: d.churned
  })) || []
  const featureChartData = analytics?.feature_importances || []
  const rawSampleCustomers = analytics?.sample_customers || []

  // Dynamic contract hazard calculations
  const m2mRow = contractChartData.find((c) => c.contract === 'Month-to-month')
  const twoYrRow = contractChartData.find((c) => c.contract === 'Two year')
  const m2mRate = m2mRow ? m2mRow.churn_rate_pct : 0
  const twoYrRate = twoYrRow ? twoYrRow.churn_rate_pct : 0
  const hazardMultiplier = twoYrRate > 0 ? (m2mRate / twoYrRate).toFixed(1) : null

  // Dynamic tenure retention calculations
  const fourYrCohort = analytics?.tenure_cohorts?.find((t) => t.cohort.includes('4+'))
  const zeroOneCohort = analytics?.tenure_cohorts?.find((t) => t.cohort.includes('0-1'))
  const fourYrRate = fourYrCohort ? fourYrCohort.churn_rate_pct : 0
  const zeroOneRate = zeroOneCohort ? zeroOneCohort.churn_rate_pct : 0
  const tenureRiskDrop = zeroOneRate > 0 ? Math.round(((zeroOneRate - fourYrRate) / zeroOneRate) * 100) : null

  // Filtered Cohort Data
  const filteredCustomers = useMemo(() => {
    return rawSampleCustomers.filter((row) => {
      const matchesSearch =
        row.customerID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.Contract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.InternetService.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.risk_level.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (cohortFilter === 'ALL') return true
      if (cohortFilter === 'HIGH_RISK') return row.risk_level === 'High Risk'
      if (cohortFilter === 'MONTH_TO_MONTH') return row.Contract === 'Month-to-month'
      if (cohortFilter === 'FIBER') return row.InternetService === 'Fiber optic'
      if (cohortFilter === 'RETAINED') return row.actual_churn === 'No'
      return true
    })
  }, [rawSampleCustomers, cohortFilter, searchQuery])

  const handleSimulate = (cust: any) => {
    sessionStorage.setItem('prefill_customer', JSON.stringify(cust))
    navigate('/dashboard/single')
  }

  const optimalThresholdVal = metrics?.optimal_threshold !== undefined
    ? Number(metrics.optimal_threshold).toFixed(2)
    : '--'

  const totalFeaturesCount = modelInfo?.num_features || featureChartData.length || '--'

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-slate-200 selection:text-slate-900">
      
      {/* ── 1. Top System Status Strip ───────────────────────────────── */}
      <div className="card-enterprise p-3 bg-white flex flex-wrap items-center justify-between gap-3 text-xs border-slate-200">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-900">Gradient Boosted Telemetry</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-mono">
              Active Cutoff τ = {optimalThresholdVal}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
            <span>Model:</span>
            <span className="font-semibold text-slate-900 font-mono">{modelInfo?.model_name || 'XGBoost'}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-500">
            <span>Features:</span>
            <span className="font-semibold text-slate-900 font-mono">{totalFeaturesCount} Encodings</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-500">
            <span>Dataset:</span>
            <span className="font-semibold text-slate-900">
              {overview?.dataset_provenance || 'Telco Dataset'} {overview?.total_customers ? `(${overview.total_customers.toLocaleString()} Records)` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary text-xs py-1 px-2.5 cursor-pointer"
            title="Reload telemetry data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Updating...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Executive Header Banner ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Customer Risk & Retention Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Portfolio churn risk modeling, customer cancellation exposure, and retention distribution analysis.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/dashboard/single"
            className="btn-primary"
          >
            <UserCheck className="w-4 h-4" />
            <span>Audit Single Account</span>
          </Link>

          <Link
            to="/dashboard/batch"
            className="btn-secondary"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Batch CSV Engine</span>
          </Link>
        </div>
      </div>

      {/* ── 3. Four Key KPI Master Cards ─────────────────────────────── */}
      {overview ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total Portfolio Volume */}
          <div className="card-enterprise p-5 relative overflow-hidden bg-white group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F172A]"></div>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">
                  Total Enterprise Portfolio
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono-nums mt-0.5">
                  {overview.total_customers.toLocaleString()}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-800" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Monthly Run-Rate:</span>
              <span className="font-mono font-bold text-slate-900">${(overview.total_monthly_revenue / 1000).toFixed(1)}k/mo</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Avg Account Tenure:</span>
              <span className="font-mono font-bold text-slate-700">{overview.avg_tenure_months} Months</span>
            </div>
          </div>

          {/* Card 2: Model Performance & Accuracy */}
          <div className="card-enterprise p-5 relative overflow-hidden bg-white group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">
                  Model Detection Accuracy
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono-nums mt-0.5">
                  {metrics?.test_accuracy !== undefined ? `${(metrics.test_accuracy * 100).toFixed(1)}%` : '--'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-indigo-700" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">ROC-AUC Score:</span>
              <span className="font-mono font-bold text-indigo-600">
                {metrics?.roc_auc !== undefined ? metrics.roc_auc.toFixed(4) : '--'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Early Catch Recall:</span>
              <span className="font-mono font-bold text-slate-700">
                {metrics?.recall !== undefined ? `${(metrics.recall * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
          </div>

          {/* Card 3: Churn Risk Exposure */}
          <div className="card-enterprise p-5 relative overflow-hidden bg-white group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">
                  Churn Risk Exposure
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-rose-600 font-mono-nums mt-0.5">
                  {overview ? overview.total_churned.toLocaleString() : '--'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
                <UserX className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Baseline Churn Rate:</span>
              <span className="font-mono font-bold text-rose-600">
                {overview ? `${overview.churn_rate_pct}%` : '--'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Monthly Revenue at Risk:</span>
              <span className="font-mono font-bold text-rose-600">
                {overview ? `$${(overview.monthly_churn_loss / 1000).toFixed(1)}k/mo` : '--'}
              </span>
            </div>
          </div>

          {/* Card 4: Retained Accounts */}
          <div className="card-enterprise p-5 relative overflow-hidden bg-white group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">
                  Retained Enterprise Base
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono-nums mt-0.5">
                  {overview ? overview.total_retained.toLocaleString() : '--'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Portfolio Retention:</span>
              <span className="font-mono font-bold text-emerald-600">
                {overview ? `${overview.retention_rate_pct}%` : '--'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Secured Monthly Run:</span>
              <span className="font-mono font-bold text-emerald-600">
                {overview ? `$${((overview.total_monthly_revenue - overview.monthly_churn_loss) / 1000).toFixed(1)}k/mo` : '--'}
              </span>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card-enterprise p-5 bg-white animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. Real Interactive Visualizations ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Contract Vulnerability Analysis */}
        <div className="card-enterprise p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Contract Type Risk Vulnerability
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cohort comparison: Retained vs Churned accounts
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {overview?.total_customers ? `${overview.total_customers.toLocaleString()} Records` : 'Active Portfolio'}
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="contract" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString()} accounts`,
                    name === 'retained' ? 'Retained Accounts' : 'Churned Accounts'
                  ]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="retained" name="Retained" fill="#0F172A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" name="Churned" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Month-to-Month accounts churn at <strong>{m2mRate}%</strong> vs <strong>{twoYrRate}%</strong> for 2-Year Contracts.
            </span>
            {hazardMultiplier && (
              <span className="font-bold text-rose-600">+{hazardMultiplier}x Hazard Ratio</span>
            )}
          </div>
        </div>

        {/* Chart 2: Tenure Decay & Loyalty Curve */}
        <div className="card-enterprise p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tenure Longevity & Retention Curve
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Churn hazard drops sharply as customer tenure increases
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
              Tenure Curve
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tenureChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="tenureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}% Churn Hazard Rate`, 'Cohort Churn %']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                />
                <Area
                  type="monotone"
                  dataKey="churn_rate"
                  name="Churn Rate (%)"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tenureGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Accounts active for 4+ years experience only <strong className="text-emerald-700">{fourYrRate}%</strong> churn.
            </span>
            {tenureRiskDrop !== null && (
              <span className="font-bold text-emerald-700">{tenureRiskDrop}% Risk Drop</span>
            )}
          </div>
        </div>

      </div>

      {/* ── 5. Top XGBoost Decision Drivers (Feature Importance) ──────── */}
      <div className="card-enterprise p-6 space-y-5 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                Model Explainability
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">Tree-Gain Feature Weights</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Top Decision Drivers for Customer Churn
            </h3>
          </div>
          <div className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            Pipeline Features: <strong>{totalFeaturesCount} Engineered</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          {featureChartData.length > 0 ? (
            featureChartData.slice(0, 8).map((feat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono flex items-center justify-center font-bold border border-slate-200">
                      #{idx + 1}
                    </span>
                    {feat.label}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">{feat.importance_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0F172A]"
                    style={{ width: `${Math.min(feat.importance_pct * 2.2, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-4 text-xs text-slate-400">Loading model features...</div>
          )}
        </div>
      </div>

      {/* ── 6. Verified Customer Cohort Telemetry Explorer Table ──────── */}
      <div className="card-enterprise overflow-hidden bg-white">
        
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                Verified Cohort Audit
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Scored by XGBoost
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Customer Account Profiles & Live Predictions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Benchmark records with real features from <span className="font-mono font-medium">WA_Fn-UseC_-Telco-Customer-Churn.csv</span>.
            </p>
          </div>

          {/* Interactive Search Bar & Row Count */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Account ID, Contract, or Service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-enterprise w-full pl-8.5 pr-3 py-1.5 text-xs font-mono"
              />
            </div>
            <div className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 shrink-0">
              {filteredCustomers.length} Shown
            </div>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter Cohort:</span>
          </span>

          {[
            { key: 'ALL', label: 'All Profiles' },
            { key: 'HIGH_RISK', label: 'High Churn Hazard' },
            { key: 'MONTH_TO_MONTH', label: 'Month-to-Month' },
            { key: 'FIBER', label: 'Fiber Optic Line' },
            { key: 'RETAINED', label: 'Retained Base' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCohortFilter(tab.key)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                cohortFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Contract</th>
                <th className="py-3 px-4">Internet Svc</th>
                <th className="py-3 px-4">Tenure</th>
                <th className="py-3 px-4">Monthly Bill</th>
                <th className="py-3 px-4">Ground Truth</th>
                <th className="py-3 px-4">XGBoost Prob</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((row, idx) => (
                  <tr key={idx} className="table-row-hover transition-colors">
                    
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {row.customerID}
                    </td>

                    {/* Contract */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {row.Contract}
                    </td>

                    {/* Internet Service */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {row.InternetService}
                    </td>

                    {/* Tenure */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {row.tenure} mos
                    </td>

                    {/* Monthly Charges */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${Number(row.MonthlyCharges).toFixed(2)}
                    </td>

                    {/* Ground Truth Outcome */}
                    <td className="py-3.5 px-4">
                      {row.actual_churn === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                          <UserX className="w-3.5 h-3.5" />
                          Churned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <UserCheck className="w-3.5 h-3.5" />
                          Retained
                        </span>
                      )}
                    </td>

                    {/* Model Probability */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {row.churn_probability_pct}
                    </td>

                    {/* Risk Tier Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase font-mono ${
                        row.risk_level === 'High Risk'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : row.risk_level === 'Medium Risk'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {row.risk_level}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleSimulate(row)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-400 text-slate-800 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        title="Load customer profile into Single Risk Evaluator"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-slate-600" />
                        <span>Simulate</span>
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    {loading ? 'Loading verified cohort telemetry...' : 'No verified cohort records matching filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── 7. Quick Action Navigation Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <Link
          to="/dashboard/single"
          className="card-enterprise p-5 hover:border-slate-400 transition-all group flex items-start justify-between bg-white"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Single Account Risk Evaluator
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Evaluate real-time churn probability and risk tier for an individual customer with contract and demographic controls.
            </p>
          </div>
          <ArrowUpRight className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

        <Link
          to="/dashboard/batch"
          className="card-enterprise p-5 hover:border-slate-400 transition-all group flex items-start justify-between bg-white"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              High-Speed Batch CSV Engine
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Upload customer portfolio CSV files to score thousands of accounts in seconds with automated feature engineering.
            </p>
          </div>
          <ArrowUpRight className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

      </div>

    </div>
  )
}
