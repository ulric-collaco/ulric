import React from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'

export default function Masthead({ isDark, onToggleTheme }) {
  return (
    <header className="ed-masthead">
      <div className="ed-masthead-left">
        <span className="ed-masthead-logo">Ulric Collaco</span>
      </div>

      <div className="ed-masthead-center">
        Portfolio &middot; Issue No. 01
      </div>

      <div className="ed-masthead-right">
        <Link to="/projects" className="ed-masthead-link">
          Projects
        </Link>
        <Link to="/game" className="ed-masthead-link">
          Game &rarr;
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
