import React, { useState, useEffect } from 'react'
import Masthead from '../components/home/Masthead'
import HeroAbout from '../components/home/HeroAbout'
import TechStack from '../components/home/TechStack'
import ProjectsSection from '../components/home/ProjectsSection'
import ContactFooter from '../components/home/ContactFooter'
import '../styles/home.css'

export default function Home() {
  const [isDark, setIsDark] = useState(() => {
    // Respect saved preference, fallback to system preference
    const saved = localStorage.getItem('ed-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light'
    )
    localStorage.setItem('ed-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Clean up data-theme when leaving the page
  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  const toggleTheme = () => setIsDark((prev) => !prev)

  return (
    <div className="home-root">
      <Masthead isDark={isDark} onToggleTheme={toggleTheme} />
      <main>
        <HeroAbout />
        <TechStack />
        <ProjectsSection />
        <ContactFooter />
      </main>
    </div>
  )
}
