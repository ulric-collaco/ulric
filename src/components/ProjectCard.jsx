import React from 'react'
import './ProjectCard.css'

export default function ProjectCard({ title, subtitle, img, href }) {
  return (
    <a className="project-link" href={href} target="_blank" rel="noopener noreferrer">
      <article className="project-card" aria-label={title}>
        <div className="project-image">
          <img src={img} alt={title} />
        </div>
        <div className="project-info">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </article>
    </a>
  )
}
