import React from 'react'
import { Link } from 'react-router-dom'

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
        <Link to="/game" className="ed-masthead-link">
          Game &rarr;
        </Link>
        <button
          className="ed-theme-toggle"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
