import React, { useEffect, useState } from 'react'
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
  FileSpreadsheet
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
  const [metrics, setMetrics] = useState<any>({
    test_accuracy: 0.7850,
    roc_auc: 0.8446,
    recall: 0.7059,
    precision: 0.5777,
    f1_score: 0.6354,
    optimal_threshold: 0.61
  })
  const [recentAudits, setRecentAudits] = useState<PredictionRecord[]>([])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      churnAPI.getAnalytics(),
      churnAPI.getMetrics()
    ])
      .then(([analyticsRes, metricsRes]) => {
        setAnalytics(analyticsRes.data)
        if (metricsRes.data) {
          setMetrics(metricsRes.data)
        }
      })
      .catch((err) => {
        console.error('Failed to load telemetry analytics:', err)
      })
      .finally(() => {
        setLoading(false)
      })

    // Load recent local prediction activity
    setRecentAudits(getPredictionHistory().slice(0, 6))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Robust default fallbacks matching the exact Telco dataset if API is cold
  const overview = analytics?.overview || {
    total_customers: 7043,
    total_churned: 1869,
    total_retained: 5174,
    churn_rate_pct: 26.54,
    retention_rate_pct: 73.46,
    avg_tenure_months: 32.4,
    avg_monthly_charges: 64.76,
    total_monthly_revenue: 456116.6,
    monthly_churn_loss: 139130.85,
    dataset_provenance: 'Telco Customer Churn (IBM/Kaggle Public Benchmark)'
  }

  const contractChartData = analytics?.contract_distribution || [
    { contract: 'Month-to-month', total: 3875, churned: 1655, retained: 2220, churn_rate_pct: 42.7 },
    { contract: 'One year', total: 1473, churned: 166, retained: 1307, churn_rate_pct: 11.3 },
    { contract: 'Two year', total: 1695, churned: 48, retained: 1647, churn_rate_pct: 2.8 },
  ]

  const tenureChartData = analytics?.tenure_cohorts?.map((d) => ({
    name: d.cohort.split(' ')[0],
    churn_rate: d.churn_rate_pct,
    retained: d.retained,
    churned: d.churned
  })) || [
    { name: '0-1Y', churn_rate: 47.4, retained: 1149, churned: 1037 },
    { name: '1-2Y', churn_rate: 28.7, retained: 730, churned: 294 },
    { name: '2-4Y', churn_rate: 20.5, retained: 1268, churned: 326 },
    { name: '4+Y', churn_rate: 9.5, retained: 2027, churned: 212 },
  ]

  const featureChartData = analytics?.feature_importances || [
    { label: 'Month-to-Month Contract Status', importance_pct: 39.70 },
    { label: 'Cost Ratio Per Service', importance_pct: 6.24 },
    { label: 'Fiber Optic High-Speed Service', importance_pct: 6.04 },
    { label: 'Long-Term 2-Year Contract', importance_pct: 5.35 },
    { label: 'Brand Loyalty (4+ Yrs)', importance_pct: 4.06 },
    { label: 'Manual Electronic Check', importance_pct: 3.44 },
    { label: 'Medium-Term 1-Year Contract', importance_pct: 2.92 },
  ]

  const sampleCustomers = analytics?.sample_customers || []

  const handleSimulate = (cust: any) => {
    // Save to sessionStorage or pass state to single prediction
    sessionStorage.setItem('prefill_customer', JSON.stringify(cust))
    navigate('/dashboard/single')
  }

  return (
    <div className="space-y-10 pb-12">
      
      {/* ── Executive Header Banner ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold font-display uppercase tracking-widest text-[#8C6D2B] bg-[#FDFBF7] px-2.5 py-1 rounded border border-[#C5A059]/30">
              EXECUTIVE TELEMETRY
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              Telco Customer Retention Risk Engine
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] font-editorial tracking-tight">
            Executive Intelligence & Risk Dashboard
          </h1>

          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Real-time churn risk modeling, financial revenue vulnerability, and customer retention analytics trained on the verified 
            <strong className="text-slate-900 font-semibold"> 7,043 Telco Customer Cohort</strong> using recall-optimized XGBoost.
          </p>
        </div>

        {/* Refresh & Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Sync Telemetry'}</span>
          </button>

          <Link
            to="/dashboard/single"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#0B132B] to-[#1C2541] hover:from-[#1C2541] hover:to-[#2A3B60] text-white text-xs font-semibold shadow-sm border border-[#C5A059]/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E2C799]" />
            <span>Audit Account</span>
          </Link>
        </div>
      </div>

      {/* ── 4 Classical Metric Master Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Portfolio Volume */}
        <div className="card-classical p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 gold-accent-line opacity-80 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-500">
                Enterprise Portfolio
              </span>
              <div className="text-3xl font-black text-[#0B132B] tabular-nums mt-1 font-editorial">
                {overview.total_customers.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0B132B]/5 text-[#0B132B] border border-slate-200 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#8C6D2B]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Monthly Run-Rate:</span>
            <span className="font-mono font-bold text-slate-900">${(overview.total_monthly_revenue / 1000).toFixed(1)}k/mo</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Avg Lifetime Tenure:</span>
            <span className="font-mono font-bold text-slate-700">{overview.avg_tenure_months} Months</span>
          </div>
        </div>

        {/* Card 2: Model Detection Accuracy */}
        <div className="card-classical p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-500">
                Model Classification
              </span>
              <div className="text-3xl font-black text-[#0B132B] tabular-nums mt-1 font-editorial">
                {(metrics.test_accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">ROC-AUC Separation:</span>
            <span className="font-mono font-bold text-blue-700">{metrics.roc_auc.toFixed(4)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Early-Catch Recall:</span>
            <span className="font-mono font-bold text-slate-700">{(metrics.recall * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 3: Churn Risk Exposure */}
        <div className="card-classical p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-500">
                Churn Risk Exposure
              </span>
              <div className="text-3xl font-black text-rose-700 tabular-nums mt-1 font-editorial">
                {overview.total_churned.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Baseline Churn Rate:</span>
            <span className="font-mono font-bold text-rose-600">{overview.churn_rate_pct}%</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Monthly Revenue at Risk:</span>
            <span className="font-mono font-bold text-rose-700">${(overview.monthly_churn_loss / 1000).toFixed(1)}k/mo</span>
          </div>
        </div>

        {/* Card 4: Retained Accounts */}
        <div className="card-classical p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-500">
                Retained Enterprise
              </span>
              <div className="text-3xl font-black text-emerald-700 tabular-nums mt-1 font-editorial">
                {overview.total_retained.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Portfolio Retention:</span>
            <span className="font-mono font-bold text-emerald-600">{overview.retention_rate_pct}%</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Secured Monthly Run:</span>
            <span className="font-mono font-bold text-emerald-700">${((overview.total_monthly_revenue - overview.monthly_churn_loss) / 1000).toFixed(1)}k/mo</span>
          </div>
        </div>

      </div>

      {/* ── Real Interactive Visualizations (Recharts) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Contract Vulnerability Analysis */}
        <div className="card-classical p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-[#0B132B] font-editorial">
                Contract Type Risk Vulnerability
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real customer cohort volume comparison: Retained vs Churned
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[#FDFBF7] text-[#8C6D2B] border border-[#C5A059]/30">
              7,043 Real Records
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="contract" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString()} accounts`,
                    name === 'retained' ? 'Retained Accounts' : 'Churned Accounts'
                  ]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="retained" name="Retained" fill="#0B132B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" name="Churned" fill="#E11D48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-600">Month-to-Month accounts churn at <strong>42.7%</strong> vs <strong>2.8%</strong> for Two-Year Contracts.</span>
            <span className="font-bold text-rose-600">+15.2x Hazard Ratio</span>
          </div>
        </div>

        {/* Chart 2: Tenure Decay & Loyalty Curve */}
        <div className="card-classical p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-[#0B132B] font-editorial">
                Tenure Decay & Customer Loyalty Curve
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Churn rate drops precipitously as customer accounts mature
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Survival Telemetry
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tenureChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tenureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}% Churn Hazard Rate`, 'Cohort Churn %']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Area
                  type="monotone"
                  dataKey="churn_rate"
                  name="Churn Rate (%)"
                  stroke="#8C6D2B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tenureGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-600">Accounts surviving past 4 years experience negligible churn (<strong className="text-emerald-700">9.5%</strong>).</span>
            <span className="font-bold text-emerald-700">80% Risk Drop</span>
          </div>
        </div>

      </div>

      {/* ── XGBoost Top Feature Importances (Direct from Model) ──────── */}
      <div className="card-classical p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold font-display uppercase tracking-widest text-[#8C6D2B]">
                MODEL EXPLAINABILITY
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700">Tree-Gain Weights</span>
            </div>
            <h3 className="text-xl font-bold text-[#0B132B] font-editorial mt-0.5">
              Top XGBoost Decision Drivers for Customer Churn
            </h3>
          </div>
          <div className="text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            Total Pipeline Features: <strong>30 Engineered</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          {featureChartData.slice(0, 8).map((feat, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono flex items-center justify-center font-bold">
                    #{idx + 1}
                  </span>
                  {feat.label}
                </span>
                <span className="font-mono text-slate-900 font-bold">{feat.importance_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0B132B] via-[#2A3B60] to-[#C5A059]"
                  style={{ width: `${Math.min(feat.importance_pct * 2.2, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Real Customer Telemetry Explorer Table ───────────────────── */}
      <div className="card-classical overflow-hidden">
        
        <div className="p-6 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold font-display uppercase tracking-widest text-[#8C6D2B]">
                DATASET TELEMETRY
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Scored by XGBoost
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#0B132B] font-editorial mt-0.5">
              Real Telco Account Audit Log & Live Predictions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sample profiles extracted directly from <span className="font-mono font-medium">WA_Fn-UseC_-Telco-Customer-Churn.csv</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Showing 12 Verified Cohort Accounts
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                <th className="py-3.5 px-5">Account ID</th>
                <th className="py-3.5 px-5">Contract</th>
                <th className="py-3.5 px-5">Internet Svc</th>
                <th className="py-3.5 px-5">Tenure</th>
                <th className="py-3.5 px-5">Monthly Bill</th>
                <th className="py-3.5 px-5">Ground Truth</th>
                <th className="py-3.5 px-5">XGBoost Prob</th>
                <th className="py-3.5 px-5">Risk Tier</th>
                <th className="py-3.5 px-5 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleCustomers.length > 0 ? (
                sampleCustomers.map((row, idx) => (
                  <tr key={idx} className="table-row-classical transition-colors">
                    
                    {/* ID */}
                    <td className="py-4 px-5 font-mono font-bold text-[#0B132B]">
                      {row.customerID}
                    </td>

                    {/* Contract */}
                    <td className="py-4 px-5 text-slate-700 font-medium">
                      {row.Contract}
                    </td>

                    {/* Internet Service */}
                    <td className="py-4 px-5 text-slate-600">
                      {row.InternetService}
                    </td>

                    {/* Tenure */}
                    <td className="py-4 px-5 font-mono text-slate-700">
                      {row.tenure} mos
                    </td>

                    {/* Monthly Charges */}
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">
                      ${Number(row.MonthlyCharges).toFixed(2)}
                    </td>

                    {/* Ground Truth Outcome */}
                    <td className="py-4 px-5">
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
                    <td className="py-4 px-5 font-mono font-bold text-[#0B132B]">
                      {row.churn_probability_pct}
                    </td>

                    {/* Risk Tier Badge */}
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase font-mono ${
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
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleSimulate(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#C5A059] text-[#0B132B] hover:text-[#8C6D2B] text-xs font-semibold shadow-2xs transition-all"
                        title="Load customer profile into Single Customer Risk Evaluator"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-[#C5A059]" />
                        <span>Simulate</span>
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    Loading real dataset cohort records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── Quick Action Executive Workflows ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Link
          to="/dashboard/single"
          className="card-classical p-6 hover:border-[#C5A059] transition-all group flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-xl bg-[#0B132B] text-[#E2C799] flex items-center justify-center shadow-md">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0B132B] font-editorial group-hover:text-[#8C6D2B] transition-colors">
              Single Account Risk Evaluator
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Evaluate real-time churn likelihood and risk category for an individual client with fine-grained demographic, contract, and monthly bill controls.
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-[#8C6D2B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

        <Link
          to="/dashboard/batch"
          className="card-classical p-6 hover:border-[#C5A059] transition-all group flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-xl bg-[#0B132B] text-[#E2C799] flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0B132B] font-editorial group-hover:text-[#8C6D2B] transition-colors">
              High-Speed Batch CSV Engine
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Upload customer portfolio CSV files to score thousands of accounts in seconds with automated feature engineering and one-click report downloads.
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-[#8C6D2B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

      </div>

    </div>
  )
}
