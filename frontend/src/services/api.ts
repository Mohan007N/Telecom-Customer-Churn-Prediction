/// <reference types="vite/client" />
import axios from 'axios'

const normalizeApiUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL
  if (!envUrl) return 'http://localhost:8000/api/v1'
  let url = String(envUrl).trim().replace(/\/+$/, '')
  if (!url.endsWith('/api/v1') && !url.includes('/api/')) {
    url = `${url}/api/v1`
  }
  return url
}

export const API_BASE_URL = normalizeApiUrl()

export const getBackendBaseUrl = (): string => {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '')
}

export const getDownloadUrl = (path: string): string => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = getBackendBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export interface FeatureDriftInfo {
  psi: number
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'INSUFFICIENT_DATA'
  severity: string
  status_color?: string
  sample_count: number
  mean_observed?: number
  median_observed?: number
  message?: string
  observed_breakdown?: Record<string, number>
}

export interface DriftReport {
  timestamp: string
  global_drift_status: 'HEALTHY' | 'MODERATE_DRIFT' | 'CRITICAL_DRIFT'
  global_recommendation: string
  max_psi_score: number
  critical_features_count: number
  warning_features_count: number
  features: Record<string, FeatureDriftInfo>
}

export interface MonitoringMetrics {
  uptime_seconds: number
  uptime_formatted: string
  total_inferences: number
  single_inferences: number
  batch_inferences: number
  batch_files_processed: number
  error_count: number
  error_rate_pct: number
  memory_usage_mb: number
  latency_ms: {
    p50: number
    p95: number
    p99: number
    average: number
    min: number
    max: number
  }
  prediction_summary: {
    total_scored: number
    churn_count: number
    retained_count: number
    observed_churn_rate_pct: number
    baseline_churn_rate_pct: number
    risk_breakdown: {
      LOW: number
      MEDIUM: number
      HIGH: number
    }
    probability_histogram: Array<{
      range: string
      count: number
    }>
  }
  recent_predictions: Array<{
    timestamp: string
    customer_id: string
    churn_predicted: number
    churn_probability: number
    risk_level: string
    latency_ms: number
    contract: string
    monthly_charges: number
    tenure: number
  }>
}

export const churnAPI = {
  // Single prediction: POST /predict
  predictSingle: (data: any) => api.post('/predict', data),

  // Batch CSV prediction: POST /predict-batch
  predictBatch: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/predict-batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Health check: GET /health
  getHealth: () => api.get('/health'),

  // Metrics: GET /metrics
  getMetrics: () => api.get('/metrics'),

  // Model Info: GET /model-info
  getModelInfo: () => api.get('/model-info'),

  // Real Dataset & Model Analytics: GET /analytics
  getAnalytics: () => api.get('/analytics'),

  // Real-time Model Monitoring: GET /monitoring/metrics
  getMonitoringMetrics: () => api.get<MonitoringMetrics>('/monitoring/metrics'),

  // Population Stability Index (PSI) Drift Report: GET /monitoring/drift
  getMonitoringDrift: () => api.get<DriftReport>('/monitoring/drift'),
  getDriftReport: () => api.get<DriftReport>('/monitoring/drift'),

  // Model Health & Memory Telemetry: GET /monitoring/health
  getMonitoringHealth: () => api.get('/monitoring/health'),
  getSystemHealth: () => api.get('/monitoring/health'),

  // Reset Monitoring Telemetry: POST /monitoring/reset
  resetMonitoring: () => api.post('/monitoring/reset'),

  // Simulate traffic for live demo: POST /monitoring/simulate-traffic
  simulateTraffic: (count: number = 15, driftMode: boolean = false) =>
    api.post(`/monitoring/simulate-traffic?count=${count}&drift_mode=${driftMode}`),
}
