import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Agent from './pages/Agent'
import Products from './pages/Products'
import Customers from './pages/Customers'
import CallLogs from './pages/CallLogs'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/calls" element={<CallLogs />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}