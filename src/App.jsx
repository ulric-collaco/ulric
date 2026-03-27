import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Projects from './pages/Projects'

// Lazy-load heavy pages to avoid bundling Three.js/cannon-es on every page load
const GamePortfolio = React.lazy(() => import('./pages/GamePortfolio'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/game" element={<GamePortfolio />} />

        {/* Fallback to Home for unknown routes */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  )
}