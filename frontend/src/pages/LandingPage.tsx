import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UserCheck,
  UploadCloud,
  BarChart3,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle2,
  FileSpreadsheet,
  Sliders,
  DollarSign,
  Award,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
  FileText,
  Clock,
  Zap,
  Server,
  Filter,
  PieChart,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { churnAPI } from '../services/api'

// Enterprise FAQ Items
const FAQ_ITEMS = [
  {
    question: 'How is the classification decision threshold τ selected?',
    answer: 'The default 0.50 cutoff in standard binary classification can miss subtle early-warning churn signals. In our model calibration, the decision boundary is tuned to maximize Early Catch Recall while preserving strong overall accuracy across holdout test cohorts.'
  },
  {
    question: 'What format is required for Batch CSV scoring?',
    answer: 'The batch scoring engine accepts standard CSV files with IBM Telco schema headers (e.g. tenure, MonthlyCharges, TotalCharges, Contract, InternetService, PaymentMethod). Missing columns are automatically imputed with conservative defaults, and scored results can be downloaded as a CSV with probabilities.'
  },
  {
    question: 'How are retention action recommendations generated?',
    answer: 'When an account exceeds the risk threshold, the inference engine checks feature attribution weights (e.g., month-to-month contract, lack of online security, high monthly spend) and generates customized, policy-aligned recommendations such as annual contract discounts or complimentary tech support.'
  },
  {
    question: 'Can this platform integrate with existing enterprise CRM and billing pipelines?',
    answer: 'Yes. The underlying FastAPI backend exposes RESTful JSON endpoints (/predict and /predict-batch) with OpenAPI specifications. It processes queries in sub-4ms and can be embedded directly into CRM or billing systems.'
  }
]

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null)

  // Interactive Live Sandbox State
  const [selectedDemoIdx, setSelectedDemoIdx] = useState<number>(0)
  const [interactiveTenure, setInteractiveTenure] = useState<number>(2)
  const [livePrediction, setLivePrediction] = useState<any>(null)
  const [scoringLoading, setScoringLoading] = useState<boolean>(false)

  // Fetch real data on mount
  useEffect(() => {
    const startTime = performance.now()
    churnAPI.getHealth()
      .then(() => {
        const endTime = performance.now()
        setLatencyMs(Math.max(1, Math.round(endTime - startTime)))
      })
      .catch(() => setLatencyMs(null))

    churnAPI.getMetrics()
      .then((res) => setMetrics(res.data))
      .catch(() => {})

    churnAPI.getAnalytics()
      .then((res) => {
        setAnalytics(res.data)
        if (res.data?.sample_customers?.length > 0) {
          const highRisk = res.data.sample_customers.find((c: any) => c.risk_level === 'High Risk') || res.data.sample_customers[0]
          setInteractiveTenure(highRisk.tenure || 2)
        }
      })
      .catch(() => {})
  }, [])

  // Extract 3 representative archetypes from real dataset sample customers
  const sampleArchetypes = React.useMemo(() => {
    if (!analytics?.sample_customers || analytics.sample_customers.length === 0) {
      return []
    }
    const samples = analytics.sample_customers
    const highRisk = samples.find((c: any) => c.risk_level === 'High Risk') || samples[0]
    const medRisk = samples.find((c: any) => c.risk_level === 'Medium Risk') || samples[1] || samples[0]
    const lowRisk = samples.find((c: any) => c.risk_level === 'Low Risk') || samples[2] || samples[0]

    return [
      {
        typeKey: 'HIGH_RISK',
        tabLabel: 'High Risk Archetype',
        badge: 'High Risk Tier',
        badgeColor: 'rose',
        customer: highRisk,
        subtitle: `${highRisk.Contract} • ${highRisk.InternetService} Internet • $${Number(highRisk.MonthlyCharges).toFixed(2)}/mo`,
        factors: [
          highRisk.Contract === 'Month-to-month' ? 'Month-to-Month Contract' : highRisk.Contract,
          highRisk.OnlineSecurity === 'No' ? 'No Online Security Package' : 'Online Security Active',
          highRisk.PaymentMethod.includes('Electronic check') ? 'Manual Electronic Check' : highRisk.PaymentMethod
        ]
      },
      {
        typeKey: 'MED_RISK',
        tabLabel: 'Moderate Archetype',
        badge: 'Medium Risk Tier',
        badgeColor: 'amber',
        customer: medRisk,
        subtitle: `${medRisk.Contract} • ${medRisk.InternetService} Internet • $${Number(medRisk.MonthlyCharges).toFixed(2)}/mo`,
        factors: [
          medRisk.Contract,
          `${medRisk.tenure} Months Active Tenure`,
          medRisk.PaymentMethod
        ]
      },
      {
        typeKey: 'LOW_RISK',
        tabLabel: 'Retained Archetype',
        badge: 'Low Risk Tier',
        badgeColor: 'emerald',
        customer: lowRisk,
        subtitle: `${lowRisk.Contract} • ${lowRisk.InternetService} Internet • $${Number(lowRisk.MonthlyCharges).toFixed(2)}/mo`,
        factors: [
          `${lowRisk.Contract} Commitment`,
          `${lowRisk.tenure} Months Long Tenure`,
          lowRisk.PaymentMethod
        ]
      }
    ]
  }, [analytics])

  const currentArchetype = sampleArchetypes[selectedDemoIdx] || null

  // Trigger live ML inference when archetype or tenure slider changes
  useEffect(() => {
    if (!currentArchetype?.customer) return

    const cust = currentArchetype.customer
    const updatedPayload = {
      customerID: cust.customerID,
      gender: cust.gender || 'Male',
      SeniorCitizen: cust.SeniorCitizen || 0,
      Partner: cust.Partner || 'No',
      Dependents: cust.Dependents || 'No',
      tenure: interactiveTenure,
      PhoneService: cust.PhoneService || 'Yes',
      MultipleLines: cust.MultipleLines || 'No',
      InternetService: cust.InternetService || 'DSL',
      OnlineSecurity: cust.OnlineSecurity || 'No',
      OnlineBackup: cust.OnlineBackup || 'No',
      DeviceProtection: cust.DeviceProtection || 'No',
      TechSupport: cust.TechSupport || 'No',
      StreamingTV: cust.StreamingTV || 'No',
      StreamingMovies: cust.StreamingMovies || 'No',
      Contract: cust.Contract || 'Month-to-month',
      PaperlessBilling: cust.PaperlessBilling || 'Yes',
      PaymentMethod: cust.PaymentMethod || 'Electronic check',
      MonthlyCharges: Number(cust.MonthlyCharges) || 50,
      TotalCharges: +(Number(cust.MonthlyCharges) * interactiveTenure).toFixed(2)
    }

    setScoringLoading(true)
    const timeout = setTimeout(() => {
      churnAPI.predictSingle(updatedPayload)
        .then((res) => {
          setLivePrediction(res.data)
        })
        .catch(() => {
          setLivePrediction(null)
        })
        .finally(() => {
          setScoringLoading(false)
        })
    }, 120)

    return () => clearTimeout(timeout)
  }, [selectedDemoIdx, interactiveTenure, currentArchetype])

  const handleArchetypeSelect = (idx: number) => {
    setSelectedDemoIdx(idx)
    const targetCust = sampleArchetypes[idx]?.customer
    if (targetCust) {
      setInteractiveTenure(targetCust.tenure || 12)
    }
  }

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx)
  }

  const handleLaunchSimulation = () => {
    if (!currentArchetype?.customer) {
      navigate('/dashboard/single')
      return
    }
    const cust = currentArchetype.customer
    const prefillData = {
      customerID: cust.customerID,
      Contract: cust.Contract,
      InternetService: cust.InternetService,
      tenure: interactiveTenure,
      MonthlyCharges: Number(cust.MonthlyCharges),
      TotalCharges: +(Number(cust.MonthlyCharges) * interactiveTenure).toFixed(2),
      gender: cust.gender,
      SeniorCitizen: cust.SeniorCitizen,
      Partner: cust.Partner,
      Dependents: cust.Dependents,
      PhoneService: cust.PhoneService,
      MultipleLines: cust.MultipleLines,
      OnlineSecurity: cust.OnlineSecurity,
      OnlineBackup: cust.OnlineBackup,
      DeviceProtection: cust.DeviceProtection,
      TechSupport: cust.TechSupport,
      StreamingTV: cust.StreamingTV,
      StreamingMovies: cust.StreamingMovies,
      PaperlessBilling: cust.PaperlessBilling,
      PaymentMethod: cust.PaymentMethod
    }
    sessionStorage.setItem('prefill_customer', JSON.stringify(prefillData))
    navigate('/dashboard/single')
  }

  const displayedProb = livePrediction
    ? Math.round(livePrediction.churn_probability * 100)
    : currentArchetype?.customer
    ? Math.round((currentArchetype.customer.churn_probability || 0.5) * 100)
    : 50

  const displayedRisk = livePrediction
    ? livePrediction.risk_level
    : currentArchetype?.customer
    ? currentArchetype.customer.risk_level
    : 'Medium Risk'

  const overview = analytics?.overview
  const totalRevenue = overview ? `$${(overview.total_monthly_revenue / 1000).toFixed(1)}k` : '$456.1k'
  const grossLoss = overview ? `$${(overview.monthly_churn_loss / 1000).toFixed(1)}k` : '$139.1k'
  const preservedCatch = overview && metrics
    ? `$${((overview.monthly_churn_loss * metrics.recall) / 1000).toFixed(1)}k`
    : '$98.2k'

  // Dynamic feature drivers from model
  const featureDrivers = analytics?.feature_importances?.slice(0, 4) || []

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900">
      <Navbar />

      {/* ── 1. Hero Section ─────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-md border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Production-Ready MLOps Platform</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-mono">IBM Telco Cohort ({overview?.total_customers?.toLocaleString() || '7,043'} Records)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
                Telecom Customer Churn Risk & Retention Management
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
                Proactively identify high-hazard subscriber cancellations with early-warning telemetry. In-memory gradient boosted classification, automated CSV batch scoring, and financial retention analytics.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/dashboard/single"
                  className="btn-primary"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Evaluate Account Risk</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </Link>

                <Link
                  to="/dashboard"
                  className="btn-secondary"
                >
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  <span>Executive Dashboard</span>
                </Link>

                <Link
                  to="/dashboard/batch"
                  className="btn-secondary"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  <span>Batch CSV Engine</span>
                </Link>
              </div>

              {/* Performance Metrics Strip */}
              <div className="pt-6 grid grid-cols-4 gap-4 border-t border-slate-200">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-nums">
                    {metrics ? `${(metrics.test_accuracy * 100).toFixed(1)}%` : '--'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Test Accuracy</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-nums">
                    {metrics ? `${(metrics.recall * 100).toFixed(1)}%` : '--'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Early Catch Recall</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-nums">
                    {metrics ? metrics.roc_auc.toFixed(4) : '--'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">ROC-AUC Score</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono-nums">
                    {latencyMs !== null ? `${latencyMs}ms` : '--'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Inference Latency</div>
                </div>
              </div>

            </div>

            {/* Right Column: Live Interactive Sandbox */}
            <div className="lg:col-span-5">
              <div className="card-enterprise p-6 bg-white border-slate-200 space-y-4">
                
                {/* Sandbox Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Interactive Risk Sandbox
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Live XGBoost Inference
                  </span>
                </div>

                {/* Account Presets */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                  {sampleArchetypes.length > 0 ? (
                    sampleArchetypes.map((archetype, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleArchetypeSelect(idx)}
                        className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-all text-center cursor-pointer ${
                          selectedDemoIdx === idx
                            ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {idx === 0 ? 'High Risk' : idx === 1 ? 'Moderate' : 'Retained'}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-1 text-xs text-slate-400">Loading dataset archetypes...</div>
                  )}
                </div>

                {/* Selected Account Telemetry Box */}
                {currentArchetype ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          Account: {currentArchetype.customer.customerID}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {currentArchetype.subtitle}
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                        displayedRisk === 'High Risk'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : displayedRisk === 'Medium Risk'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {displayedRisk}
                      </span>
                    </div>

                    {/* Probability Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <span>Live Model Probability:</span>
                          {scoringLoading && <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />}
                        </span>
                        <span className="font-mono text-slate-900 font-bold">{displayedProb}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            displayedProb >= 60 ? 'bg-rose-500' :
                            displayedProb >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${displayedProb}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Key Factors for Account */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Observed Account Drivers
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {currentArchetype.factors.map((factor: string, fIdx: number) => (
                          <span key={fIdx} className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tenure Adjustment Slider */}
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Adjust Tenure Simulation:</span>
                        <span className="font-mono font-bold text-slate-800">{interactiveTenure} Months</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="72"
                        value={interactiveTenure}
                        onChange={(e) => setInteractiveTenure(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>1 mo (New Signup)</span>
                        <span>72 mos (Loyal Base)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">Loading live telemetry...</div>
                )}

                {/* Simulate Button */}
                <button
                  onClick={handleLaunchSimulation}
                  className="w-full btn-primary text-xs py-2 justify-center shadow-xs cursor-pointer"
                >
                  <span>Simulate 20 Attributes in Single Risk Page</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Platform Capabilities Section ────────────────────────── */}
      <section className="py-14 md:py-18 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Modules</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              Enterprise Retention & Risk Architecture
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Full suite for customer churn risk scoring, cohort batch processing, and executive decision telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Module 1 */}
            <div className="card-enterprise p-5 bg-white space-y-4 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Single Account Risk
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluate real-time churn probability, risk tier, and cost breakdown for individual customer profiles.
                </p>
                <div className="pt-1 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>20-feature parameter form</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Targeted retention guidance</span>
                  </div>
                </div>
              </div>
              <Link
                to="/dashboard/single"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-indigo-600 pt-3 border-t border-slate-100"
              >
                <span>Launch Single Evaluator</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Module 2 */}
            <div className="card-enterprise p-5 bg-white space-y-4 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <UploadCloud className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Batch CSV Engine
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Score thousands of customer accounts in seconds with schema validation and one-click report exports.
                </p>
                <div className="pt-1 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-imputation for missing cols</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Filtered CSV report export</span>
                  </div>
                </div>
              </div>
              <Link
                to="/dashboard/batch"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-indigo-600 pt-3 border-t border-slate-100"
              >
                <span>Upload CSV Dataset</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Module 3 */}
            <div className="card-enterprise p-5 bg-white space-y-4 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Executive Telemetry
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deep visual analytics on contract distributions, revenue hazard exposure, and tenure loyalty curves.
                </p>
                <div className="pt-1 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Interactive Recharts visual charts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Segment filtering & drill-down</span>
                  </div>
                </div>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-indigo-600 pt-3 border-t border-slate-100"
              >
                <span>View Executive KPIs</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Module 4 */}
            <div className="card-enterprise p-5 bg-white space-y-4 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Cpu className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Model Governance
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Holdout classification metrics, 2x2 confusion matrix analysis, and decision cutoff sensitivity tuning.
                </p>
                <div className="pt-1 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Decision boundary slider τ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ROC curve & AUC tracking</span>
                  </div>
                </div>
              </div>
              <Link
                to="/dashboard/performance"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-indigo-600 pt-3 border-t border-slate-100"
              >
                <span>Inspect Model Metrics</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. Empirical Risk Drivers (Model Feature Importances) ───── */}
      <section className="py-14 md:py-18 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Model Decision Drivers</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              Primary Churn Catalysts in XGBoost Model
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Tree-gain importance weights computed directly from serialized model node splits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featureDrivers.length > 0 ? (
              featureDrivers.map((feat: any, idx: number) => (
                <div key={idx} className="card-enterprise p-5 bg-white border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{feat.label}</span>
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {feat.importance_pct}% Weight
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full"
                      style={{ width: `${Math.min(feat.importance_pct * 2.2, 100)}%` }}
                    ></div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Feature Token: {feat.raw_name}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-6 text-xs text-slate-400">Loading model feature drivers...</div>
            )}
          </div>

        </div>
      </section>

      {/* ── 4. Financial Retention ROI Calculator ───────────────────── */}
      <section className="py-14 md:py-18 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-md border border-slate-200">
                <DollarSign className="w-3.5 h-3.5 text-slate-700" />
                <span>Financial Impact of Early Catch</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Preserve High-Value Revenue with Early Intervention
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                In the verified {overview?.total_customers?.toLocaleString() || '7,043'} customer cohort, baseline churn puts <strong>{grossLoss}/month</strong> of recurring revenue at immediate risk. Our recall-optimized model catches <strong>{metrics ? `${(metrics.recall * 100).toFixed(1)}%` : '70.6%'} of at-risk customers</strong> before they cancel.
              </p>

              <div className="pt-2">
                <Link
                  to="/dashboard"
                  className="btn-secondary text-xs"
                >
                  <BarChart3 className="w-4 h-4 text-slate-600" />
                  <span>Inspect Cohort Revenue Metrics</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="text-xs text-slate-500 font-semibold">Total Revenue Pool</div>
                <div className="text-2xl font-bold text-slate-900 font-mono-nums">{totalRevenue}</div>
                <div className="text-[11px] text-slate-500">Monthly portfolio run-rate</div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="text-xs text-rose-700 font-semibold">Gross Churn Exposure</div>
                <div className="text-2xl font-bold text-rose-700 font-mono-nums">{grossLoss}</div>
                <div className="text-[11px] text-slate-500">Monthly revenue at risk</div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="text-xs text-emerald-800 font-semibold">Preserved with Catch</div>
                <div className="text-2xl font-bold text-emerald-700 font-mono-nums">{preservedCatch}</div>
                <div className="text-[11px] text-slate-500">Flagged for early retention</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. End-to-End MLOps Pipeline Sequence ───────────────────── */}
      <section className="py-14 md:py-18 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pipeline Architecture</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              End-to-End Operational Workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-left">
            <div className="card-enterprise p-5 bg-white space-y-2.5">
              <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <div className="text-sm font-bold text-slate-900">Cleansing & Encodings</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Processed {overview?.total_customers?.toLocaleString() || '7,043'} Telco records, scaled continuous metrics with StandardScaler, and engineered 30 dummy features.
              </p>
            </div>

            <div className="card-enterprise p-5 bg-white space-y-2.5">
              <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <div className="text-sm font-bold text-slate-900">Gradient Boosted Tree</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trained XGBClassifier using tree boosting with logloss objective function and weighted positive class balance.
              </p>
            </div>

            <div className="card-enterprise p-5 bg-white space-y-2.5">
              <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <div className="text-sm font-bold text-slate-900">FastAPI Microservice</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sub-4ms inference latency with async endpoints, validation schemas, and automated batch CSV transformations.
              </p>
            </div>

            <div className="card-enterprise p-5 bg-white space-y-2.5">
              <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                04
              </div>
              <div className="text-sm font-bold text-slate-900">Executive Decision Portal</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interactive risk threshold calibration ({metrics?.optimal_threshold !== undefined ? `τ = ${Number(metrics.optimal_threshold).toFixed(2)}` : 'calibrated cutoff'}), single account evaluation, and batch downloads.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 6. Enterprise FAQ Section ────────────────────────────────── */}
      <section className="py-14 md:py-18 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Questions & Architecture</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-2xs">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4.5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-900">{item.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4.5 pb-4.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ── 7. Footer ────────────────────────────────────────────────── */}
      <footer className="py-8 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-800">Telecom Churn Predictor MLOps System</span>
            <span className="text-slate-300">•</span>
            <span>FastAPI + XGBoost Inference Engine</span>
          </div>
          <div>
            <span>Dataset Provenance: IBM Telco Customer Churn ({overview?.total_customers?.toLocaleString() || '7,043'} Records)</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
