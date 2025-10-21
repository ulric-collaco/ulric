import React from 'react'
import mainImg from '../main.jpg'

export default function App() {
  return (
    <>
      <section className="home">
        <div className="home-img">
          <img src={mainImg} alt="Ulric" />
        </div>
        <div className="home-content">
          <h1>Hi, It's <span>Ulric</span></h1>
          <h3 className="typing-text">I'm a <span></span></h3>
          <p>Welcome! I'm <span style={{color: '#A7B500', fontSize: '2rem'}}>Ulric Collaco</span>, a passionate developer and curious learner, currently honing my skills in Python, Tkinter, and UI/UX design with Figma. Exploring C and C++ as I work towards my dream of becoming a cybersecurity expert, I'm dedicated to expanding my knowledge and building innovative solutions.</p>

          <div className="social-icons">
            <a href="https://github.com/ulric-collaco"><i className="fa-brands fa-github"></i></a>
            <a href="https://www.instagram.com/ulric_collaco/"><i className="fa-brands fa-instagram"></i></a>
            <a href="https://www.linkedin.com/in/ulric-collaco/"><i className="fa-brands fa-linkedin"></i></a>
          </div>

          <a href="/proj.html" className="btn">My Projects</a>
        </div>
      </section>
    </>
  )
}
