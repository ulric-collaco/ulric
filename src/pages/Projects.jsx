import React from 'react'
import { Link } from 'react-router-dom'
import './projects.css'

export default function Projects() {
  return (
    <div className="projects-page">
      <div className="projects-header">
  <Link to="/" target="_blank" rel="noreferrer" className="btn back-btn">Back to Home</Link>
      </div>

      <div className="projects-container">
        <div className="year-section">
          <h2 className="year-heading">First Year Projects</h2>
          <div className="project-cards-grid">
            <a
              href="https://www.linkedin.com/pulse/esp32-gyro-controlled-car-my-first-year-hardware-project-collaco-jncof"
              className="project-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="project-card">
                <img src="/h1.jpg" alt="Hardware Project" />
                <div className="project-info">
                  <h3>Gyro Controlled Car</h3>
                  <p>Smartphone Gyro-Controlled ESP32 Car.</p>
                </div>
              </div>
            </a>

            <a href="javascript:void(0);" className="project-link" target="_blank" rel="noreferrer">
              <div className="project-card">
                <img src="/path/to/software_project_image.jpg" alt="Software Project" />
                <div className="project-info">
                  <h3>Software Project Title</h3>
                  <p>Brief description of your software project.</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="year-section">
          <h2 className="year-heading">Second Year Projects</h2>
          <div className="project-cards-grid">
            <p style={{ color: '#ccc', fontSize: '1.6rem' }}>Projects coming soon...</p>
          </div>
        </div>

        <div className="year-section">
          <h2 className="year-heading">Third Year Projects</h2>
          <div className="project-cards-grid">
            <p style={{ color: '#ccc', fontSize: '1.6rem' }}>Projects coming soon...</p>
          </div>
        </div>

        <div className="year-section">
          <h2 className="year-heading">Fourth Year Projects</h2>
          <div className="project-cards-grid">
            <p style={{ color: '#ccc', fontSize: '1.6rem' }}>Projects coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
