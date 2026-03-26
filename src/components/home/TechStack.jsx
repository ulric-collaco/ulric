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
    <section className="ed-section ed-container">
      <span className="ed-kicker">Toolkit</span>
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
