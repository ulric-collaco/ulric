import React from 'react'
import { Link } from 'react-router-dom'
import mainImg from '../../main.jpg'
import LiquidEther from '../components/LiquidEther'

export default function Home() {
  return (
    <section className="home">
      <div className="home-bg">
        <LiquidEther
          colors={['#0eeba9', '#00ffe5']}
          mouseForce={30}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>
      <div className="home-img">
        <img src={mainImg} alt="Ulric" />
      </div>
      <div className="home-content">
        <h1>Hi, It's <span>Ulric</span></h1>
        <h3 className="typing-text">I'm a <span></span></h3>
        <p>
          Welcome! I'm <span style={{ color: '#A7B500', fontSize: '2rem' }}>Ulric Collaco</span>, a passionate developer and curious learner, currently honing my skills in Python, Tkinter, and UI/UX design with Figma. Exploring C and C++ as I work towards my dream of becoming a cybersecurity expert, I'm dedicated to expanding my knowledge and building innovative solutions.
        </p>

        <div className="social-icons">
            <a href="https://github.com/ulric-collaco" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github"></i></a>
            <a href="https://www.instagram.com/ulric_collaco/" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-instagram"></i></a>
            <a href="https://www.linkedin.com/in/ulric-collaco/" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin"></i></a>
        </div>

          <Link to="/projects" className="btn">My Projects</Link>
      </div>
    </section>
  )
}
