import React from 'react'
import { Link } from 'react-router-dom'
import h1Img from '../../../h1.jpg'
import chatrtxImg from '../../../chatrtx.png'

const PROJECTS_BY_YEAR = [
  {
    year: 'First Year',
    projects: [
      {
        name: 'Gyro Controlled Car',
        desc: 'Smartphone gyroscope-controlled ESP32 RC car — a hands-on hardware build.',
        url: 'https://www.linkedin.com/pulse/esp32-gyro-controlled-car-my-first-year-hardware-project-collaco-jncof',
        image: h1Img,
      },
      {
        name: 'ChatRTX Clone',
        desc: 'Self-hosted AI study assistant — an Ollama wrapper inspired by NVIDIA ChatRTX.',
        url: 'https://www.linkedin.com/posts/ulric-collaco_my-first-major-software-project-chatrtx-activity-7405875933292916737-zImQ',
        image: chatrtxImg,
      },
    ],
  },
  {
    year: 'Second Year',
    projects: [
      {
        name: 'From-Scratch Character-Level GPT (PyTorch)',
        desc: 'Second-year main software project: built and trained a GPT-style character LLM from scratch, with loss dropping from 4.86 to 1.23 over 25 epochs.',
        url: 'https://www.linkedin.com/posts/ulric-collaco_machinelearning-pytorch-softwareengineering-activity-7453675907627671552-fvG6?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAAFNpyBUBqrXYNPwksTsuXOiMsR-xOrt-0xg',
        image: '/images/llm-loss-curve.png',
      },
    ],
  },
  {
    year: 'Third Year',
    projects: [],
  },
  {
    year: 'Fourth Year',
    projects: [],
  },
]

export default function ProjectsSection() {
  const activeYears = PROJECTS_BY_YEAR.filter((g) => g.projects.length > 0)
  const upcomingYears = PROJECTS_BY_YEAR.filter((g) => g.projects.length === 0)

  return (
    <section className="ed-section ed-container">
      <div className="ed-section-header">
        <span className="ed-kicker">Index</span>
        <div className="ed-section-title-row">
          <h2 className="ed-section-title">Selected Work</h2>
          <Link to="/projects" className="ed-section-cta">
            Other Works
          </Link>
        </div>
      </div>

      {activeYears.map((yearGroup, index) => (
        <div key={yearGroup.year} className="ed-year-section">
          <h2 className="ed-year-heading" data-index={`0${index + 1}`}>
            {yearGroup.year}
          </h2>

          <div className="ed-projects-list">
            {yearGroup.projects.map((proj) => (
              <a
                key={proj.name}
                href={proj.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-project-row"
              >
                <img
                  className="ed-project-thumb"
                  src={proj.image}
                  alt={proj.name}
                  loading="lazy"
                />
                <div className="ed-project-info">
                  <h3>{proj.name}</h3>
                  <p>{proj.desc}</p>
                </div>
                <span className="ed-project-arrow" aria-hidden="true">
                  &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>
      ))}

      {upcomingYears.length > 0 && (
        <p className="ed-coming-soon">
          {upcomingYears.map((y) => y.year).join(', ')} &mdash; Projects coming soon…
        </p>
      )}
    </section>
  )
}
