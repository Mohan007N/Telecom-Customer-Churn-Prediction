/// <reference types="vite/client" />
import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

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
}
