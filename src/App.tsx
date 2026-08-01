import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Craps from './pages/Craps'
import Dashboard from './pages/Dashboard'
import './index.css'

function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Landing />} /><Route path="/craps" element={<Craps />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>
}

export default App
