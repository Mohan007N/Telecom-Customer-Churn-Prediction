import React, { useState } from 'react'
import { UserCheck, AlertCircle, RefreshCw, Zap, BookmarkPlus } from 'lucide-react'
import { churnAPI } from '../services/api'
import { addPredictionRecord } from '../utils/predictionStorage'

// Real Customer Examples from Telco Dataset CSV
const REAL_SAMPLE_CUSTOMERS = [
  {
    name: 'Customer 3668-QPYBK (High Risk - Month-to-Month, Short Tenure)',
    data: {
      customerID: '3668-QPYBK',
      gender: 'Male',
      SeniorCitizen: 0,
      Partner: 'No',
      Dependents: 'No',
      tenure: 2,
      PhoneService: 'Yes',
      MultipleLines: 'No',
      InternetService: 'DSL',
      OnlineSecurity: 'Yes',
      OnlineBackup: 'Yes',
      DeviceProtection: 'No',
      TechSupport: 'No',
      StreamingTV: 'No',
      StreamingMovies: 'No',
      Contract: 'Month-to-month',
      PaperlessBilling: 'Yes',
      PaymentMethod: 'Mailed check',
      MonthlyCharges: 53.85,
      TotalCharges: 108.15
    }
  },
  {
    name: 'Customer 9305-CDSKC (High Risk - Fiber Optic, High Bill)',
    data: {
      customerID: '9305-CDSKC',
      gender: 'Female',
      SeniorCitizen: 0,
      Partner: 'No',
      Dependents: 'No',
      tenure: 8,
      PhoneService: 'Yes',
      MultipleLines: 'Yes',
      InternetService: 'Fiber optic',
      OnlineSecurity: 'No',
      OnlineBackup: 'No',
      DeviceProtection: 'Yes',
      TechSupport: 'No',
      StreamingTV: 'Yes',
      StreamingMovies: 'Yes',
      Contract: 'Month-to-month',
      PaperlessBilling: 'Yes',
      PaymentMethod: 'Electronic check',
      MonthlyCharges: 99.65,
      TotalCharges: 820.50
    }
  },
  {
    name: 'Customer 5575-GNVDE (Low Risk - 1-Year Contract, 34 Mos)',
    data: {
      customerID: '5575-GNVDE',
      gender: 'Male',
      SeniorCitizen: 0,
      Partner: 'No',
      Dependents: 'No',
      tenure: 34,
      PhoneService: 'Yes',
      MultipleLines: 'No',
      InternetService: 'DSL',
      OnlineSecurity: 'Yes',
      OnlineBackup: 'No',
      DeviceProtection: 'Yes',
      TechSupport: 'No',
      StreamingTV: 'No',
      StreamingMovies: 'No',
      Contract: 'One year',
      PaperlessBilling: 'No',
      PaymentMethod: 'Mailed check',
      MonthlyCharges: 56.95,
      TotalCharges: 1889.50
    }
  },
  {
    name: 'Customer 7795-CFOCW (Low Risk - 1-Year Contract, High Tenure)',
    data: {
      customerID: '7795-CFOCW',
      gender: 'Male',
      SeniorCitizen: 0,
      Partner: 'No',
      Dependents: 'No',
      tenure: 45,
      PhoneService: 'No',
      MultipleLines: 'No phone service',
      InternetService: 'DSL',
      OnlineSecurity: 'Yes',
      OnlineBackup: 'No',
      DeviceProtection: 'Yes',
      TechSupport: 'Yes',
      StreamingTV: 'No',
      StreamingMovies: 'No',
      Contract: 'One year',
      PaperlessBilling: 'No',
      PaymentMethod: 'Bank transfer (automatic)',
      MonthlyCharges: 42.30,
      TotalCharges: 1840.75
    }
  }
]

export const SinglePrediction: React.FC = () => {
  const [formData, setFormData] = useState<any>(REAL_SAMPLE_CUSTOMERS[0].data)
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSampleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value)
    if (!isNaN(idx) && REAL_SAMPLE_CUSTOMERS[idx]) {
      setFormData(REAL_SAMPLE_CUSTOMERS[idx].data)
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await churnAPI.predictSingle(formData)
      const data = response.data
      setResult(data)

      // Save real prediction to local prediction storage
      addPredictionRecord({
        id: data.customer_id,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        contract: formData.Contract,
        monthlyCharges: `$${formData.MonthlyCharges.toFixed(2)}`,
        probability: data.churn_probability_pct,
        probabilityVal: data.churn_probability,
        riskLevel: data.risk_level,
        status: data.churn_status,
        customerData: formData
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate prediction. Ensure FastAPI backend is active.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Single Customer Prediction</h1>
        <p className="text-sm text-gray-500 mt-1">Predict customer churn probability and risk tier using real Telco Customer attributes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          {/* Preset Real Sample Customer Loader */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <BookmarkPlus className="w-4 h-4 text-blue-600" />
              <span>Load Real Sample Customer from Telco Dataset:</span>
            </label>
            <select
              onChange={handleSampleSelect}
              className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none"
            >
              {REAL_SAMPLE_CUSTOMERS.map((s, idx) => (
                <option key={idx} value={idx}>{s.name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Customer Attributes & Service Contract
            </h2>

            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer ID</label>
                <input
                  type="text"
                  name="customerID"
                  value={formData.customerID}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tenure (Months)</label>
                <input
                  type="number"
                  name="tenure"
                  min="0"
                  max="100"
                  value={formData.tenure}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Charges ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="MonthlyCharges"
                  value={formData.MonthlyCharges}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Total Charges ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="TotalCharges"
                  value={formData.TotalCharges}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contract Type</label>
                <select
                  name="Contract"
                  value={formData.Contract}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none"
                >
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Internet Service</label>
                <select
                  name="InternetService"
                  value={formData.InternetService}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none"
                >
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="DSL">DSL</option>
                  <option value="No">No Internet</option>
                </select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                <select name="PaymentMethod" value={formData.PaymentMethod} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs">
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (auto)</option>
                  <option value="Credit card (automatic)">Credit card (auto)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Online Security</label>
                <select name="OnlineSecurity" value={formData.OnlineSecurity} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tech Support</label>
                <select name="TechSupport" value={formData.TechSupport} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Paperless Billing</label>
                <select name="PaperlessBilling" value={formData.PaperlessBilling} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing XGBoost Inference...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Predict Churn</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Real Model Prediction Output
            </h2>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {result ? (
              <div className="space-y-6 animate-fadeIn">
                {/* Status Badge */}
                <div className={`p-5 rounded-xl text-center border ${
                  result.churn_predicted === 1
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1">
                    Prediction Outcome
                  </div>
                  <div className="text-2xl font-extrabold">
                    {result.churn_predicted === 1 ? 'CHURN RISK DETECTED 🔴' : 'CUSTOMER RETAINED 🟢'}
                  </div>
                  <div className="text-xs font-medium mt-1">
                    {result.churn_predicted === 1 ? 'High likelihood of account cancellation' : 'Customer expected to remain active'}
                  </div>
                </div>

                {/* Probability Meter */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                    <span>Churn Probability</span>
                    <span className="text-base font-bold text-gray-900">{result.churn_probability_pct}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.churn_probability >= 0.61 ? 'bg-red-500' :
                        result.churn_probability >= 0.40 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${result.churn_probability * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs border-t border-gray-100 pt-4">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Risk Tier</span>
                    <span className="font-bold text-gray-900">{result.risk_level}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Decision Threshold</span>
                    <span className="font-bold text-gray-900">{result.threshold_used}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Customer ID</span>
                    <span className="font-mono text-gray-900">{result.customer_id}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <UserCheck className="w-12 h-12 mx-auto text-gray-300 stroke-[1.5]" />
                <p className="text-xs font-medium">Select a sample customer or fill form to evaluate churn risk.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
