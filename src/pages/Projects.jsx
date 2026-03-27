import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import h1Img from '../../h1.jpg'
import chatrtxImg from '../../chatrtx.png'
import '../styles/projects.css'

// Reusable Tilt Card
function TiltCard({ project }) {
  const cardRef = React.useRef(null)
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    cardRef.current.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2}px 40px rgba(0,0,0,0.05)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
    cardRef.current.style.boxShadow = `none`
  }

  const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="prj-minor-card"
      ref={cardRef}
      onMouseMove={isTouchDevice() ? null : handleMouseMove}
      onMouseLeave={isTouchDevice() ? null : handleMouseLeave}
    >
      <h3>{project.title}</h3>
      <p>{project.desc}</p>
      <span className="prj-tag">{project.tags[0]}</span>
    </a>
  )
}

export default function Projects() {
  useEffect(() => {
    // Set editorial data-style for view transition animations
    document.documentElement.setAttribute('data-style', 'slides')

    // Default to light mode if no preference saved
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  const minorProjects = [
    { title: 'Pastry', desc: 'A brutally simple, lightning-fast text pastebin and sharing utility.', url: 'https://paste.ulriccollaco.me', tags: ['Utility Tool'] },
    { title: 'SemRank', desc: 'Semester leaderboard & analytics tracking system built on Next.js.', url: 'https://semrank.vercel.app', tags: ['React App'] },
    { title: 'Discord Automator', desc: 'Custom server management and administrative microservices.', url: '#', tags: ['Node.js'] },
    { title: 'Terminal UI', desc: 'Command-line portfolio aesthetic exploration.', url: '#', tags: ['Archive'] },
  ]

  return (
    <div className="projects-root">
      
      {/* Editorial navigation header */}
      <header className="prj-nav-header">
        <Link to="/" className="prj-nav-link">
          &larr; Return
        </Link>
        <ThemeToggle />
      </header>

      <main>
        {/* Page Hero */}
        <section className="ed-container prj-header">
          <span className="ed-kicker">Vol. I &mdash; Selected Work</span>
          <h1 className="prj-title">Projects Directory</h1>
        </section>

        {/* Major Projects: Editorial Columns */}
        <section className="ed-container prj-major-list">
          
          <a href="https://www.linkedin.com/posts/ulric-collaco_my-first-major-software-project-chatrtx-activity-7405875933292916737-zImQ" target="_blank" rel="noreferrer" className="prj-major-card">
            <div className="prj-major-content">
              <span className="ed-kicker">Software &mdash; 01</span>
              <h2 className="prj-major-title">ChatRTX Clone</h2>
              <p className="prj-major-desc">Self-hosted AI study assistant — an Ollama wrapper inspired by NVIDIA ChatRTX. Deployed locally for internal use and document querying with privacy in mind.</p>
              <div className="prj-tag-list">
                <span className="prj-tag">AI</span>
                <span className="prj-tag">LLM</span>
                <span className="prj-tag">Ollama</span>
              </div>
            </div>
            <div className="prj-major-image-wrap">
              <img src={chatrtxImg} alt="ChatRTX App" className="prj-major-image" />
            </div>
          </a>

          <a href="https://www.linkedin.com/pulse/esp32-gyro-controlled-car-my-first-year-hardware-project-collaco-jncof" target="_blank" rel="noreferrer" className="prj-major-card">
            <div className="prj-major-image-wrap" style={{order: -1}}>
              <img src={h1Img} alt="Gyro Car" className="prj-major-image" />
            </div>
            <div className="prj-major-content">
              <span className="ed-kicker">Hardware &mdash; 01</span>
              <h2 className="prj-major-title">Gyro Control</h2>
              <p className="prj-major-desc">Smartphone gyroscope-controlled ESP32 RC car. Built entirely by hand to explore physical engineering mapping digital accelerometer data to physical motor drives over WiFi.</p>
              <div className="prj-tag-list">
                <span className="prj-tag">ESP32</span>
                <span className="prj-tag">C++</span>
                <span className="prj-tag">Sensors</span>
              </div>
            </div>
          </a>
          
        </section>

        {/* Minor Projects: Bento Tilt Grid */}
        <section className="ed-container prj-minor-section">
          <span className="ed-kicker">Small / Deployed</span>
          
          <div className="prj-minor-grid">
            {minorProjects.map((proj, idx) => (
              <TiltCard key={idx} project={proj} />
            ))}
          </div>

        </section>

      </main>

    </div>
  )
}
