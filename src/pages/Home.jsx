import React, { useEffect } from 'react'
import Masthead from '../components/home/Masthead'
import HeroAbout from '../components/home/HeroAbout'
import TechStack from '../components/home/TechStack'
import ProjectsSection from '../components/home/ProjectsSection'
import ContactFooter from '../components/home/ContactFooter'
import '../styles/home.css'

export default function Home() {
  useEffect(() => {
    // Ensure editorial data-style is set for view transition animations
    document.documentElement.setAttribute('data-style', 'slides')

    // Default to light mode if no preference saved
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'light')
    }

    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  return (
    <div className="home-root">
      <Masthead />
      <main>
        <HeroAbout />
        <TechStack />
        <ProjectsSection />
        <ContactFooter />
      </main>
    </div>
  )
}
