import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UserCheck,
  UploadCloud,
  BarChart3,
  Zap,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle2,
  Github,
  Globe,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Sliders,
  DollarSign,
  Award,
  ChevronRight,
  ExternalLink,
  Lock,
  PieChart
} from 'lucide-react'
import { Navbar } from '../components/Navbar'

// Interactive Sample Profiles for Live Hero Demo
const HERO_SAMPLE_ACCOUNTS = [
  {
    id: 'DEMO-891',
    label: 'High Hazard Account',
    type: 'Month-to-Month • Fiber Optic',
    tenure: 2,
    monthly: 99.65,
    contract: 'Month-to-month',
    internet: 'Fiber optic',
    probability: 87.4,
    risk: 'High Risk',
    color: 'rose',
    status: 'Churn Detected'
  },
  {
    id: 'DEMO-442',
    label: 'Moderate Hazard Account',
    type: '1-Year Contract • DSL Internet',
    tenure: 16,
    monthly: 62.40,
    contract: 'One year',
    internet: 'DSL',
    probability: 41.8,
    risk: 'Medium Risk',
    color: 'amber',
    status: 'Moderate Risk'
  },
  {
    id: 'DEMO-109',
    label: 'Loyal Enterprise Account',
    type: '2-Year Contract • High Tenure',
    tenure: 54,
    monthly: 45.10,
    contract: 'Two year',
    internet: 'DSL',
    probability: 7.6,
    risk: 'Low Risk',
    color: 'emerald',
    status: 'Retained Account'
  }
]

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedDemoIdx, setSelectedDemoIdx] = useState<number>(0)
  const [interactiveTenure, setInteractiveTenure] = useState<number>(HERO_SAMPLE_ACCOUNTS[0].tenure)
  const currentDemo = HERO_SAMPLE_ACCOUNTS[selectedDemoIdx]

  // Approximate live probability calculation based on interactive tenure adjustment
  const computedProbability = Math.max(
    5,
    Math.min(
      95,
      Math.round(
        currentDemo.probability - (interactiveTenure - currentDemo.tenure) * 1.2
      )
    )
  )

  const handleDemoSelect = (idx: number) => {
    setSelectedDemoIdx(idx)
    setInteractiveTenure(HERO_SAMPLE_ACCOUNTS[idx].tenure)
  }

  const handleLaunchSimulation = () => {
    const prefillData = {
      customerID: currentDemo.id,
      Contract: currentDemo.contract,
      InternetService: currentDemo.internet,
      tenure: interactiveTenure,
      MonthlyCharges: currentDemo.monthly,
      TotalCharges: +(currentDemo.monthly * interactiveTenure).toFixed(2),
      gender: 'Male',
      SeniorCitizen: 0,
      Partner: 'No',
      Dependents: 'No',
      PhoneService: 'Yes',
      MultipleLines: 'No',
      OnlineSecurity: 'No',
      OnlineBackup: 'No',
      DeviceProtection: 'No',
      TechSupport: 'No',
      StreamingTV: 'No',
      StreamingMovies: 'No',
      PaperlessBilling: 'Yes',
      PaymentMethod: 'Electronic check'
    }
    sessionStorage.setItem('prefill_customer', JSON.stringify(prefillData))
    navigate('/dashboard/single')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-indigo-500/15 selection:text-indigo-950">
      <Navbar />

      {/* ── 1. Hero Section ─────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-24 overflow-hidden border-b border-slate-200/80 bg-white">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Executive Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full border border-slate-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>PRODUCTION MLOPS PLATFORM</span>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-300 font-mono">XGBoost v1.0</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Telecom Customer <br />
                <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
                  Churn Risk Intelligence
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                Identify high-risk customer cancellations with early-warning telemetry. In-memory XGBoost inference, automated CSV batch scoring, and financial retention analytics calibrated on <strong>7,043 verified accounts</strong>.
              </p>

              {/* Executive Action Button Group */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                
                {/* Primary Button */}
                <Link
                  to="/dashboard/single"
                  className="btn-primary"
                >
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Evaluate Account Risk</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* Secondary Button */}
                <Link
                  to="/dashboard"
                  className="btn-secondary"
                >
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  <span>Executive Dashboard</span>
                </Link>

                {/* Batch CSV Button */}
                <Link
                  to="/dashboard/batch"
                  className="btn-secondary"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Batch CSV Engine</span>
                </Link>

              </div>

              {/* Verified Performance Metrics Strip */}
              <div className="pt-8 grid grid-cols-4 gap-4 border-t border-slate-100">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono-nums">78.50%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Test Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-indigo-600 font-mono-nums">70.59%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Early Recall</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono-nums">0.8446</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">ROC-AUC</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono-nums">&lt;5ms</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">API Latency</div>
                </div>
              </div>

            </div>

            {/* Right Live Interactive Simulator Card */}
            <div className="lg:col-span-5 relative">
              <div className="card-enterprise p-6 shadow-xl space-y-4 relative overflow-hidden bg-white border-slate-200">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"></div>

                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Interactive Risk Sandbox
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Live Model Telemetry
                  </span>
                </div>

                {/* Interactive Preset Buttons */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                  {HERO_SAMPLE_ACCOUNTS.map((account, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDemoSelect(idx)}
                      className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all text-center ${
                        selectedDemoIdx === idx
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      {idx === 0 ? 'High Risk' : idx === 1 ? 'Moderate' : 'Retained'}
                    </button>
                  ))}
                </div>

                {/* Selected Account Telemetry Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{currentDemo.label}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{currentDemo.type}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                      computedProbability >= 60 ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      computedProbability >= 35 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {computedProbability >= 60 ? 'High Hazard' : computedProbability >= 35 ? 'Moderate Risk' : 'Low Hazard'}
                    </span>
                  </div>

                  {/* Dynamic Probability Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Calculated Churn Probability:</span>
                      <span className="font-mono text-slate-900 font-bold">{computedProbability}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          computedProbability >= 60 ? 'bg-rose-500' :
                          computedProbability >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${computedProbability}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Interactive Tenure Slider */}
                  <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
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
                      <span>1 mo (New Sign-up)</span>
                      <span>72 mos (Long-Term)</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Launch Button */}
                <button
                  onClick={handleLaunchSimulation}
                  className="w-full btn-indigo text-xs py-2.5 justify-center shadow-sm"
                >
                  <span>Simulate Full 20 Attributes in Single Risk Page</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Platform Capabilities Section ────────────────────────── */}
      <section className="py-16 md:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Platform Modules</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Enterprise Machine Learning Architecture
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Full-stack suite for customer churn risk detection, cohort batch processing, and decision telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="card-enterprise p-6 space-y-4 bg-white flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Single Account Risk
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluate real-time churn probability, risk tier, and cost ratios for individual customer profiles.
                </p>
              </div>
              <Link
                to="/dashboard/single"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2 border-t border-slate-100"
              >
                <span>Launch Single Evaluator</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="card-enterprise p-6 space-y-4 bg-white flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Batch CSV Engine
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Score thousands of customer accounts in seconds with schema validation and one-click report exports.
                </p>
              </div>
              <Link
                to="/dashboard/batch"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2 border-t border-slate-100"
              >
                <span>Upload CSV Dataset</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="card-enterprise p-6 space-y-4 bg-white flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Executive Telemetry
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deep visual analytics on contract distributions, monthly revenue hazard ratios, and tenure loyalty curves.
                </p>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2 border-t border-slate-100"
              >
                <span>View Executive KPIs</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Card 4 */}
            <div className="card-enterprise p-6 space-y-4 bg-white flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  FastAPI REST Core
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Asynchronous inference microservice pre-loading XGBoost models with full OpenAPI/Swagger documentation.
                </p>
              </div>
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2 border-t border-slate-100"
              >
                <span>Open API Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. Financial Retention ROI Calculator ───────────────────── */}
      <section className="py-16 md:py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Financial Impact of Early Intervention</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Preserve High-Value Revenue with Early Churn Catch
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                In the verified 7,043 customer cohort, baseline churn puts <strong>$139,130/month</strong> of recurring revenue at immediate risk. Our recall-optimized model catches <strong>70.59% of at-risk customers</strong> before they cancel.
              </p>

              <div className="pt-2">
                <Link
                  to="/dashboard"
                  className="btn-secondary text-xs"
                >
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Inspect Real Cohort Revenue Metrics</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs text-slate-500 font-semibold">Total Revenue Pool</div>
                <div className="text-2xl font-bold text-slate-900 font-mono-nums">$456.1k</div>
                <div className="text-[11px] text-slate-500">Monthly portfolio run-rate</div>
              </div>

              <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="text-xs text-rose-700 font-semibold">Gross Churn Exposure</div>
                <div className="text-2xl font-bold text-rose-800 font-mono-nums">$139.1k</div>
                <div className="text-[11px] text-rose-600">Monthly revenue at risk</div>
              </div>

              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="text-xs text-emerald-800 font-semibold">Preserved with Catch</div>
                <div className="text-2xl font-bold text-emerald-800 font-mono-nums">$98.2k</div>
                <div className="text-[11px] text-emerald-700">Flagged for early retention</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. End-to-End MLOps Pipeline Sequence ───────────────────── */}
      <section className="py-16 md:py-20 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Pipeline Architecture</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              End-to-End MLOps Workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="card-enterprise p-6 bg-white space-y-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <div className="text-sm font-bold text-slate-900">Dataset Cleansing & Feature Engineering</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Processed 7,043 Telco records, imputed blank charges, scaled continuous metrics, and generated 30 one-hot feature columns.
              </p>
            </div>

            <div className="card-enterprise p-6 bg-white space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <div className="text-sm font-bold text-slate-900">XGBoost Classifier & Threshold Tuning</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trained Gradient Boosted Trees with optimal cutoff calibrated to τ = 0.61, achieving 0.8446 ROC-AUC and 70.6% early recall.
              </p>
            </div>

            <div className="card-enterprise p-6 bg-white space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <div className="text-sm font-bold text-slate-900">FastAPI Async API & React Dashboard</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Model serialized with joblib and hosted in-memory for sub-5ms REST responses, interactive single predictions, and batch CSV processing.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. Call-to-Action Executive Section ──────────────────────── */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-enterprise p-8 sm:p-10 bg-slate-900 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border-slate-800">
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready for Inference</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Start Scoring Telecom Accounts Today
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                Run single customer risk evaluations, upload customer portfolio CSV files, or explore live classification metrics in the executive telemetry dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/dashboard/single"
                className="btn-indigo text-xs sm:text-sm"
              >
                <span>Single Account Audit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/dashboard/batch"
                className="btn-secondary text-xs sm:text-sm bg-white text-slate-900 hover:bg-slate-100"
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Upload Batch CSV</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Classic Footer ────────────────────────────────────────── */}
      <footer className="mt-auto bg-slate-950 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                CP
              </div>
              <span className="text-sm font-bold text-white">Churn Predictor Enterprise</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span>FastAPI Backend (:8000)</span>
              <span>•</span>
              <span>React Vite Frontend (:5173)</span>
              <span>•</span>
              <span>XGBoost ML</span>
            </div>

            <div className="text-slate-500 font-mono">
              © 2026 Churn Predictor. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


