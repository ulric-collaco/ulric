import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import GameWorld from '../game/GameWorld'
import './GamePortfolio.css'

// ─────────────────────────────────────────────
//  Zone content
// ─────────────────────────────────────────────
const ZONE_DATA = {
  projects: {
    title: 'Projects',
    subtitle: 'Drive close to a board to see details!',
    cards: [
      {
        name:  'Gyro Controlled Car',
        desc:  'Smartphone gyroscope-controlled ESP32 RC Car. First-year hardware project.',
        url:   'https://www.linkedin.com/pulse/esp32-gyro-controlled-car-my-first-year-hardware-project-collaco-jncof',
        color: '#81C784',
      },
      {
        name:  'ChatRTX Clone',
        desc:  'Self-hosted AI study assistant — an Ollama wrapper inspired by NVIDIA ChatRTX.',
        url:   'https://www.linkedin.com/posts/ulric-collaco_my-first-major-software-project-chatrtx-activity-7405875933292916737-zImQ',
        color: '#64B5F6',
      },
    ],
  },
  about: {
    title: 'About Me',
    name:  'Ulric Collaco',
    bio:   'Passionate developer and curious learner, honing skills in Python, C/C++, and UI/UX design with Figma. Working towards becoming a cybersecurity expert and building innovative solutions.',
    skills: ['Python', 'C / C++', 'React', 'Three.js', 'Figma', 'UI/UX', 'ESP32', 'Linux'],
  },
  contact: {
    title: 'Contact',
    links: [
      { name: 'GitHub',    url: 'https://github.com/ulric-collaco',                color: '#1a1a1a' },
      { name: 'Instagram', url: 'https://www.instagram.com/ulric_collaco/',          color: '#C13584' },
    ],
  },
}

// ─────────────────────────────────────────────
//  Zone overlay content components
// ─────────────────────────────────────────────
function ZoneContent({ zone }) {
  const data = ZONE_DATA[zone]
  if (!data) return null

  if (zone === 'projects') {
    return (
      <>
        <h2 className="gp-card-title">{data.title}</h2>
        <div className="gp-proj-grid">
          {data.cards.map((card) => (
            <a
              key={card.name}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-proj-card"
              style={{ '--card-accent': card.color }}
            >
              <div className="gp-proj-card-dot" style={{ background: card.color }} />
              <h3>{card.name}</h3>
              <p>{card.desc}</p>
              <span className="gp-proj-link">View on LinkedIn →</span>
            </a>
          ))}
        </div>
      </>
    )
  }

  if (zone === 'about') {
    return (
      <>
        <h2 className="gp-card-title">{data.title}</h2>
        <p className="gp-about-name">{data.name}</p>
        <p className="gp-about-bio">{data.bio}</p>
        <div className="gp-skill-tags">
          {data.skills.map((s) => (
            <span key={s} className="gp-skill-tag">{s}</span>
          ))}
        </div>
      </>
    )
  }

  if (zone === 'contact') {
    return (
      <>
        <h2 className="gp-card-title">{data.title}</h2>
        <div className="gp-contact-links">
          {data.links.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-contact-link"
              style={{ '--link-color': link.color }}
            >
              {link.name}
            </a>
          ))}
        </div>
      </>
    )
  }

  if (zone === 'playground') {
    return (
      <>
        <h2 className="gp-card-title">{data.title}</h2>
        <p className="gp-playground-msg">{data.message}</p>
      </>
    )
  }

  return null
}

// ─────────────────────────────────────────────
//  Main page component
// ─────────────────────────────────────────────
export default function GamePortfolio() {
  const containerRef = useRef(null)
  const gameRef      = useRef(null)

  const [loading,    setLoading]    = useState(true)
  const [activeZone, setActiveZone] = useState(null)
  const [hintVisible, setHintVisible] = useState(true)

  // ── Touch joystick state ──
  const joystickOriginRef = useRef({ x: 0, y: 0 })
  const joystickAreaRef   = useRef(null)
  const JOYSTICK_R = 48
  const [joystickNub,    setJoystickNub]    = useState({ x: 0, y: 0 })
  const [joystickActive, setJoystickActive] = useState(false)

  // ── Boot game ──
  useEffect(() => {
    if (!containerRef.current) return
    let world = null
    const timer = setTimeout(() => {
      world = new GameWorld(
        containerRef.current,
        (zone) => setActiveZone(zone),
        ()     => setActiveZone(null),
      )
      gameRef.current = world
      setLoading(false)
    }, 150)

    // Fade out hint after 6 seconds
    const hintTimer = setTimeout(() => setHintVisible(false), 6000)

    return () => {
      clearTimeout(timer)
      clearTimeout(hintTimer)
      if (world) { world.dispose(); world = null }
    }
  }, [])

  // ── Touch joystick handlers (native listeners to allow preventDefault in passive context) ──
  const onJoyStart = useCallback((e) => {
    e.preventDefault()
    const t = e.touches[0]
    joystickOriginRef.current = { x: t.clientX, y: t.clientY }
    setJoystickActive(true)
    setJoystickNub({ x: 0, y: 0 })
  }, [])

  const onJoyMove = useCallback((e) => {
    e.preventDefault()
    const t  = e.touches[0]
    const dx = t.clientX - joystickOriginRef.current.x
    const dy = t.clientY - joystickOriginRef.current.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    const c  = Math.min(d, JOYSTICK_R)
    const a  = Math.atan2(dy, dx)
    const nx = Math.cos(a) * c
    const ny = Math.sin(a) * c
    setJoystickNub({ x: nx, y: ny })
    gameRef.current?.setJoystick(nx / JOYSTICK_R, ny / JOYSTICK_R)
  }, [])

  const onJoyEnd = useCallback((e) => {
    e.preventDefault()
    setJoystickActive(false)
    setJoystickNub({ x: 0, y: 0 })
    gameRef.current?.setJoystick(0, 0)
  }, [])

  // Attach native non-passive touch listeners so preventDefault works
  useEffect(() => {
    const el = joystickAreaRef.current
    if (!el) return
    el.addEventListener('touchstart',  onJoyStart, { passive: false })
    el.addEventListener('touchmove',   onJoyMove,  { passive: false })
    el.addEventListener('touchend',    onJoyEnd,   { passive: false })
    el.addEventListener('touchcancel', onJoyEnd,   { passive: false })
    return () => {
      el.removeEventListener('touchstart',  onJoyStart)
      el.removeEventListener('touchmove',   onJoyMove)
      el.removeEventListener('touchend',    onJoyEnd)
      el.removeEventListener('touchcancel', onJoyEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, onJoyStart, onJoyMove, onJoyEnd])

  return (
    <div className="gp-root">

      {/* Loading screen */}
      {loading && (
        <div className="gp-loading">
          <div className="gp-loading-inner">
            <div className="gp-loading-car" aria-hidden="true" />
            <p>Loading world…</p>
            <h1 style={{ fontWeight: 'bold', fontSize: '2rem', marginTop: '1rem', textAlign: 'center' }}>THIS IS A BIG WORK IN PROGRESS</h1>
            <p style={{ marginTop: '0.5rem', opacity: 0.8, textAlign: 'center' }}>Does not work on mobile</p>
          </div>
        </div>
      )}

      {/* Three.js canvas container */}
      <div ref={containerRef} className="gp-canvas" />

      {/* ── UI HUD ── */}
      {!loading && (
        <>
          {/* Exit */}
          <Link to="/" className="gp-exit-btn" aria-label="Back to home">
            ← Exit
          </Link>

          {/* Controls hint */}
          <div className={`gp-hint ${hintVisible ? '' : 'gp-hint--hidden'}`} aria-live="polite">
            <span className="gp-hint-desktop">W A S D &nbsp;·&nbsp; Arrow Keys to drive</span>
            <span className="gp-hint-mobile">Drag joystick to drive</span>
          </div>

          {/* Mini zone indicator */}
          {activeZone && (
            <div className="gp-zone-badge" key={activeZone}>
              {activeZone.toUpperCase()} ZONE
            </div>
          )}

          {/* Touch joystick (shown only on coarse-pointer devices via CSS) */}
          <div
            ref={joystickAreaRef}
            className="gp-joystick-area"
            aria-hidden="true"
          >
            <div className={`gp-joystick-base ${joystickActive ? 'active' : ''}`}>
              <div
                className="gp-joystick-nub"
                style={{ transform: `translate(${joystickNub.x}px, ${joystickNub.y}px)` }}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Zone side panel ── */}
      {activeZone && ZONE_DATA[activeZone] && (
        <div
          className="gp-panel"
          role="complementary"
          aria-label={`${activeZone} zone info`}
          key={activeZone}
        >
          <button
            className="gp-panel-close"
            onClick={() => setActiveZone(null)}
            aria-label="Close"
          >
            ✕
          </button>
          <ZoneContent zone={activeZone} />
        </div>
      )}
    </div>
  )
}
