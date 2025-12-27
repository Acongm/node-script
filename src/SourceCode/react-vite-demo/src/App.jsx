import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import KeyAntiPattern from './demos/01-KeyAntiPattern'
import MemoOptimization from './demos/02-MemoOptimization'
import React18Concurrent from './demos/03-React18Concurrent'
import React19Features from './demos/04-React19Features'
import FiberVisualization from './demos/05-FiberVisualization'
import PerformanceComparison from './demos/06-PerformanceComparison'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/key-anti-pattern" element={<KeyAntiPattern />} />
          <Route path="/memo-optimization" element={<MemoOptimization />} />
          <Route path="/concurrent-features" element={<React18Concurrent />} />
          <Route path="/react19-features" element={<React19Features />} />
          <Route path="/fiber-visualization" element={<FiberVisualization />} />
          <Route path="/performance-comparison" element={<PerformanceComparison />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
