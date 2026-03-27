import React from 'react'

const SKILLS = [
  'Python',
  'C / C++',
  'React',
  'Cloudflare',
  'Three.js',
  'UI / UX',
  'ESP32',
  'Linux',
]

export default function TechStack() {
  return (
    <section className="ed-section ed-container ed-tech">
      <div className="ed-section-header">
        <span className="ed-kicker">Toolkit</span>
        <h2 className="ed-section-title">Core Technologies</h2>
      </div>
      <div className="ed-skills-grid">
        {SKILLS.map((skill) => (
          <span key={skill} className="ed-skill-tag">
            {skill}
          </span>
        ))}
      </div>
    </section>
  )
}
