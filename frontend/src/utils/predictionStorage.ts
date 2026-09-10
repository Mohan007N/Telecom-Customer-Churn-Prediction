export interface PredictionRecord {
  id: string
  timestamp: string
  contract: string
  monthlyCharges: string
  probability: string
  probabilityVal: number
  riskLevel: string
  status: string
  customerData?: any
}

const STORAGE_KEY = 'churn_predictor_real_history'

export const getPredictionHistory = (): PredictionRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error("Failed to read prediction history", e)
  }
  // Default: Starts clean at 0 records
  return []
}

export const savePredictionHistory = (records: PredictionRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (e) {
    console.error("Failed to save prediction history", e)
  }
}

export const addPredictionRecord = (record: PredictionRecord): void => {
  const current = getPredictionHistory()
  const updated = [record, ...current.filter(r => r.id !== record.id)].slice(0, 100)
  savePredictionHistory(updated)
}

export const addBatchPredictionRecords = (records: PredictionRecord[]): void => {
  const current = getPredictionHistory()
  const updated = [...records, ...current].slice(0, 100)
  savePredictionHistory(updated)
}

export const clearPredictionHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error("Failed to clear prediction history", e)
  }
}
