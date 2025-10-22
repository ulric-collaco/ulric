import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Projects from './pages/Projects'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects" element={<Projects />} />
      {/* Fallback to Home for unknown routes */}
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
