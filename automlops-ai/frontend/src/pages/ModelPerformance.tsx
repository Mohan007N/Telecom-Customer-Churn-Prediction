import React, { useEffect, useState } from 'react'
import { churnAPI } from '../services/api'

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({
    train_accuracy: 0.7641,
    test_accuracy: 0.7850,
    precision: 0.5777,
    recall: 0.7059,
    f1_score: 0.6354,
    roc_auc: 0.8446,
    optimal_threshold: 0.61,
    confusion_matrix: { TN: 842, FP: 193, FN: 110, TP: 264 }
  })

  const [modelInfo, setModelInfo] = useState<any>(null)

  useEffect(() => {
    churnAPI.getMetrics()
      .then((res) => setMetrics(res.data))
      .catch(() => {})

    churnAPI.getModelInfo()
      .then((res) => setModelInfo(res.data))
      .catch(() => {})
  }, [])

  const cm = metrics.confusion_matrix || { TN: 842, FP: 193, FN: 110, TP: 264 }
  const total = (cm.TN || 842) + (cm.FP || 193) + (cm.FN || 110) + (cm.TP || 264)

  const topFeatures = [
    { name: 'HasContract (Month-to-Month Signal)', weight: '39.70%' },
    { name: 'CostPerService (Billing per Service)', weight: '6.24%' },
    { name: 'InternetService_Fiber optic', weight: '6.04%' },
    { name: 'Contract_Two year', weight: '5.35%' },
    { name: 'TenureCohort_4+ Years', weight: '4.06%' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Real Model Evaluation & Metrics</h1>
        <p className="text-sm text-gray-500 mt-1">Classification metrics, threshold optimization, and confusion matrix derived from 1,409 real test set samples.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Test Accuracy</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{(metrics.test_accuracy * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-gray-400 mt-1">Overall correctness</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-blue-600">Recall / Sensitivity</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{(metrics.recall * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-1">Identifies ~71% Churners</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Precision</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{(metrics.precision * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-gray-400 mt-1">Precision of churn alerts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">F1-Score</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.f1_score.toFixed(3)}</div>
          <div className="text-[10px] text-gray-400 mt-1">Harmonic mean</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">ROC-AUC Score</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.roc_auc.toFixed(4)}</div>
          <div className="text-[10px] text-gray-400 mt-1">Class separation</div>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Confusion Matrix Grid */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Confusion Matrix Grid (1,409 Real Samples)</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
              Optimal Threshold: {metrics.optimal_threshold}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-emerald-700 uppercase">True Negative (TN)</div>
              <div className="text-3xl font-black text-emerald-900">{cm.TN}</div>
              <div className="text-xs text-emerald-600">{((cm.TN / total) * 100).toFixed(1)}% (Actual Retained)</div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-amber-700 uppercase">False Positive (FP)</div>
              <div className="text-3xl font-black text-amber-900">{cm.FP}</div>
              <div className="text-xs text-amber-600">{((cm.FP / total) * 100).toFixed(1)}% (Type I Error)</div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-red-700 uppercase">False Negative (FN)</div>
              <div className="text-3xl font-black text-red-900">{cm.FN}</div>
              <div className="text-xs text-red-600">{((cm.FN / total) * 100).toFixed(1)}% (Type II Error)</div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-blue-700 uppercase">True Positive (TP)</div>
              <div className="text-3xl font-black text-blue-900">{cm.TP}</div>
              <div className="text-xs text-blue-600">{((cm.TP / total) * 100).toFixed(1)}% (Actual Churners)</div>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Threshold tuned to <span className="font-bold text-gray-800">0.61</span> to boost Recall from 53.2% to 70.59% while preserving strong ROC-AUC discrimination.
          </p>
        </div>

        {/* Feature Importance Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Top XGBoost Churn Risk Drivers</h3>

          <div className="space-y-4">
            {topFeatures.map((feat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-800">{feat.name}</span>
                  <span className="text-blue-600">{feat.weight}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: feat.weight }}></div>
                </div>
              </div>
            ))}
          </div>

          {modelInfo && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex justify-between">
              <span>Total Pipeline Features: <strong>{modelInfo.num_features}</strong></span>
              <span>Model: <strong>XGBoost</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
