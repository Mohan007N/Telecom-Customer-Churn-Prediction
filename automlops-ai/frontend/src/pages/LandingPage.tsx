import React from 'react'
import { Link } from 'react-router-dom'
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
  Layers
} from 'lucide-react'
import { Navbar } from '../components/Navbar'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
                <Zap className="w-3.5 h-3.5" />
                <span>Production-Ready MLOps Architecture</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Telecom Customer <br />
                <span className="text-blue-600">Churn Prediction</span> Platform
              </h1>

              <p className="text-lg md:text-xl text-gray-600 font-normal leading-relaxed max-w-xl">
                Predict customer churn using an AI-powered machine learning platform. Identify at-risk customers early, analyze retention drivers, and automate batch predictions.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/dashboard/single"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-105"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-base font-semibold rounded-xl shadow-sm transition-all"
                >
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                  <span>View Dashboard</span>
                </Link>
              </div>

              {/* Metric Highlights */}
              <div className="pt-8 grid grid-cols-3 gap-6 border-t border-gray-100">
                <div>
                  <div className="text-2xl font-bold text-gray-900">78.50%</div>
                  <div className="text-xs text-gray-500 font-medium">Model Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">70.59%</div>
                  <div className="text-xs text-gray-500 font-medium">Churn Recall</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">0.8446</div>
                  <div className="text-xs text-gray-500 font-medium">ROC-AUC Score</div>
                </div>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl p-1 shadow-2xl shadow-blue-500/10">
                <div className="bg-white rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Churn Risk Analyzer</span>
                  </div>

                  {/* Visual Prediction Card Mockup */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        C01
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Month-to-Month Customer</div>
                        <div className="text-xs text-gray-500">Fiber Optic | $89.85/mo</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      High Risk (87.4%)
                    </span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        C02
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">2-Year Contract Customer</div>
                        <div className="text-xs text-gray-500">DSL Internet | $55.00/mo</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                      Low Risk (12.1%)
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-900">Batch Processing Status</span>
                    <span className="text-xs font-bold text-blue-700">1,409 Records Processed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Platform Capabilities</h2>
            <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything Needed to Manage Churn Risk
            </p>
            <p className="text-base text-gray-600">
              Designed with enterprise accuracy, transparent metrics, and fast CSV batch processing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Predict Customer</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Evaluate individual customer churn probability, risk tier, and key cost factors instantaneously.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Upload CSV</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Batch process thousands of customer records from CSV files with automatic column validation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Analytics Dashboard</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Gain deep visual insights on churn distributions, monthly charge impacts, and contract lengths.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">FastAPI Prediction API</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Lightweight, high-performance REST API with pre-loaded in-memory model inference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">End-to-End Pipeline</h2>
            <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              MLOps Workflow Architecture
            </p>
          </div>

          {/* Step Sequence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <Database className="w-8 h-8 text-blue-600 mx-auto" />
              <div className="text-xs font-bold uppercase text-gray-400">Step 1</div>
              <div className="text-sm font-bold text-gray-900">Dataset</div>
            </div>

            <div className="hidden md:flex items-center justify-center text-gray-300">→</div>

            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <Cpu className="w-8 h-8 text-blue-600 mx-auto" />
              <div className="text-xs font-bold uppercase text-gray-400">Step 2</div>
              <div className="text-sm font-bold text-gray-900">XGBoost Training</div>
            </div>

            <div className="hidden md:flex items-center justify-center text-gray-300">→</div>

            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <Zap className="w-8 h-8 text-blue-600 mx-auto" />
              <div className="text-xs font-bold uppercase text-gray-400">Step 3</div>
              <div className="text-sm font-bold text-gray-900">Prediction API</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-gray-400 text-sm py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                CP
              </div>
              <span className="text-lg font-bold text-white">Churn Predictor</span>
            </div>

            <div className="flex items-center gap-6 text-xs font-medium">
              <span>MLOps Telco Project</span>
              <span>•</span>
              <span>FastAPI & React</span>
              <span>•</span>
              <span>Version 1.0.0</span>
            </div>

            <div className="text-xs text-gray-500">
              © 2026 Churn Predictor. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
