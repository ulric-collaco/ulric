import React from 'react'

const RESUME_URL =
  'https://docs.google.com/document/d/1ZoXj8BsS6Tt3jwWa3_aBEwCPbt4QCxXRsfCo8dGsEOU/edit?usp=sharing'

const SOCIALS = [
  { name: 'GitHub',    url: 'https://github.com/ulric-collaco' },
  { name: 'Instagram', url: 'https://www.instagram.com/ulric_collaco/' },
  { name: 'LinkedIn',  url: 'https://www.linkedin.com/in/ulric-collaco/' },
]

export default function ContactFooter() {
  return (
    <section className="ed-section ed-container">
      <div className="ed-section-header">
        <span className="ed-kicker">Connect</span>
        <h2 className="ed-section-title">Get in Touch</h2>
      </div>

      <div className="ed-contact-row">
        {SOCIALS.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ed-contact-link"
          >
            {s.name}
          </a>
        ))}

        <a
          href={RESUME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ed-resume-btn"
        >
          View Résumé &darr;
        </a>
      </div>

      <footer className="ed-footer">
        <span>&copy; Ulric Collaco</span>
        <span>Built with intention.</span>
      </footer>
    </section>
  )
}
