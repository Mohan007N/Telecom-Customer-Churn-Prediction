import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardHome } from './pages/DashboardHome'
import { SinglePrediction } from './pages/SinglePrediction'
import { BatchPrediction } from './pages/BatchPrediction'
import { PredictionHistory } from './pages/PredictionHistory'
import { ModelPerformance } from './pages/ModelPerformance'
import { SettingsPage } from './pages/Settings'

function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Dashboard Routes with Sidebar */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="single" element={<SinglePrediction />} />
        <Route path="batch" element={<BatchPrediction />} />
        <Route path="history" element={<PredictionHistory />} />
        <Route path="performance" element={<ModelPerformance />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
