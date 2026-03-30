import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import StackingCards, { StackingCardItem } from '../components/home/StackingCards'
import '../styles/projects.css'

/* ═══════════════════════════════════════════════════════════════
   PROJECT DATA
   ───────────────────────────────────────────────────────────────
   Edit this array to add / remove projects.
   Each entry becomes a newspaper-clipping card in the stack.
   ═══════════════════════════════════════════════════════════════ */
const PROJECTS = [
  {
    headline: 'SemRank',
    subhead: '5M rows/day — that was the limit. 169M in 72 hours. A motion-first academic ranking platform.',
    body: 'A full-stack leaderboard that scrapes, ranks, and visualizes semester performance across 378+ students. Features head-to-head comparisons, a higher/lower stat game, and GSAP-driven animations — all served from the edge via Cloudflare Workers and D1.',
    tags: ['React', 'Cloudflare Workers', 'D1', 'GSAP'],
    issue: 'Issue 01',
    category: 'Full-Stack',
    date: '2026',
    type: 'Deployed',
    url: 'https://www.linkedin.com/posts/ulric-collaco_activity-7440405790236012544-S_Uz?utm_source=social_share_send&utm_medium=member_desktop_web',
    linkLabel: 'Read on LinkedIn',
    image: '/images/semrank-cover.jpg',
    imageCaption: 'SEM 3 UNLEASHED — SemRank launch graphic',
  },
  {
    headline: 'HonestBite',
    subhead: 'AI-powered nutrition transparency — scan any barcode, get the truth. MumbaiHacks 2025 Finalist.',
    body: 'A health-tech app that scans product barcodes with YOLOv8 detection, decodes them via ZXing, and cross-references Open Food Facts to deliver instant nutrition ratings, safety flags, and a Gemini-powered Q&A assistant. Built with a doctor dashboard for patient scan exports.',
    tags: ['React', 'Node.js', 'Gemini AI', 'Supabase'],
    issue: 'Issue 02',
    category: 'Hackathon',
    date: '2025',
    type: 'MumbaiHacks Finalist',
    url: 'https://github.com/ulric-collaco/HonestBite',
    linkLabel: 'View on GitHub',
    image: '/images/honestbite-dashboard.png',
    imageCaption: 'HonestBite dashboard — scan products for nutrition truth',
    deployedUrl: 'https://honestbite.vercel.app/',
  },
  {
    headline: 'personal-ssh',
    subhead: 'Try it: ssh ssh.ulriccollaco.me — a full portfolio in your terminal, no browser needed.',
    body: 'Built with Go, Bubbletea, and Lipgloss, this interactive portfolio runs inside a PTY over an anonymous public SSH connection. It features animated ASCII art, twinkling star particles, a shimmer effect, theme cycling, and a multi-scene navigation system — all served from a GCP VM via a custom rate-limited SSH wrapper.',
    tags: ['Go', 'Bubbletea', 'Lipgloss', 'GCP'],
    issue: 'Issue 03',
    category: 'Infrastructure',
    date: '2026',
    type: 'ssh ssh.ulriccollaco.me',
    url: 'https://www.linkedin.com/posts/ulric-collaco_golang-tui-ssh-activity-7441546684133806080-r2e9?utm_source=social_share_send&utm_medium=member_desktop_web',
    linkLabel: 'Read on LinkedIn',
    image: '/images/ssh-tui-cover.png',
    imageCaption: 'personal-ssh - terminal view',
    deployedUrl: 'https://github.com/ulric-collaco/personal-ssh',
    deployedLabel: 'GitHub Repo',
  },
  {
    headline: 'Pastry',
    subhead: 'Your universal cross-device clipboard & file sync. Edge-fast, privacy-first.',
    body: 'A secure tool for syncing text and files across devices instantly. Built with Cloudflare Workers for the backend API and D1 for persistent storage, with a React frontend that uses a secure passcode system to keep synced data transient yet accessible.',
    tags: ['React', 'Cloudflare Workers', 'D1', 'System Design'],
    issue: 'Issue 04',
    category: 'Full-stack',
    date: '2025',
    type: 'Deployed',
    url: 'https://www.linkedin.com/posts/ulric-collaco_systemdesign-cloudflare-privacy-activity-7444475657025368064-6EBk?utm_source=social_share_send&utm_medium=member_desktop_web',
    linkLabel: 'Read on LinkedIn',
    image: '/images/pastry-clipping.png',
    imageCaption: 'Pastry — cross-device sync dashboard',
    deployedUrl: 'https://paste.ulriccollaco.me',
    deployedLabel: 'Live Demo',
  },
]

/* ── Tilt classes for the "casually stacked clippings" effect ── */
const TILT_CLASSES = [
  '',
  'prj-clipping--tilt-right',
  'prj-clipping--tilt-left',
  'prj-clipping--tilt-right',
  '',
  'prj-clipping--tilt-left',
]

function getTiltClass(index) {
  return TILT_CLASSES[index % TILT_CLASSES.length]
}

/* ═══════════════════════════════════════════════════════════════
   NEWSPAPER CLIPPING CARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function NewspaperClipping({ project, index }) {
  const indexStr = String(index + 1).padStart(2, '0')

  return (
    <article className="prj-clipping-inner">
      {/* Watermark index number */}
      <span className="prj-article-index" aria-hidden="true">
        {indexStr}
      </span>

      {/* Dateline bar */}
      <div className="prj-article-dateline">
        <span className="prj-article-issue">
          {project.issue} &middot; {project.category}
        </span>
        <span className="prj-article-date">
          {project.date}
        </span>
      </div>

      {/* 2-column article body */}
      <div className="prj-article-body">
        {/* Left column — text */}
        <div className="prj-article-col-left">
          <h2 className="prj-article-headline">{project.headline}</h2>
          <p className="prj-article-subhead">{project.subhead}</p>
          <p className="prj-article-text">{project.body}</p>
          <div className="prj-article-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="prj-article-tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* Right column — image */}
        <div className="prj-article-col-right">
          <div className="prj-article-image-wrap">
            {project.image ? (
              <img
                className="prj-article-image"
                src={project.image}
                alt={project.headline}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--ed-font-display)',
                  fontSize: 'clamp(24px, 4vw, 40px)',
                  fontWeight: 300,
                  color: 'var(--ed-line)',
                  fontStyle: 'italic',
                  userSelect: 'none',
                }}
                aria-hidden="true"
              >
                {indexStr}
              </div>
            )}
          </div>
          {project.imageCaption && (
            <span className="prj-article-image-caption">
              {project.imageCaption}
            </span>
          )}
        </div>
      </div>

      {/* Article footer with link */}
      <div className="prj-article-footer">
        <span className="prj-article-type">{project.type}</span>
        <div className="prj-article-links">
          {project.deployedUrl && (
            <a
              href={project.deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="prj-article-link"
            >
              {project.deployedLabel || 'Live Demo'}
              <span className="prj-article-link-arrow" aria-hidden="true">→</span>
            </a>
          )}
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="prj-article-link"
            >
              {project.linkLabel || 'View Project'}
              <span className="prj-article-link-arrow" aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PROJECTS PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function Projects() {
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-style', 'slides')

    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  return (
    <div className="projects-root" ref={scrollContainerRef}>
      {/* ── Editorial Masthead ── */}
      <header className="prj-masthead">
        <div className="prj-masthead-left">
          <Link to="/" className="prj-masthead-back">
            &larr; Return
          </Link>
        </div>
        <span className="prj-masthead-center">
          The Engineer&rsquo;s Chronicle &mdash; Projects Archive
        </span>
        <div className="prj-masthead-right">
          <ThemeToggle />
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="prj-hero">
        <span className="prj-hero-kicker">Vol. I &mdash; Selected Work</span>
        <h1 className="prj-hero-title">
          Projects<br />Archive
        </h1>
        <p className="prj-hero-deck">
          A collection of smaller projects and experiments
        </p>
        <hr className="prj-hero-rule" />
      </section>

      {/* ── Stacking Newspaper Clippings ── */}
      <StackingCards
        totalCards={PROJECTS.length}
        className="prj-stack-wrapper"
        scrollOptions={{ container: scrollContainerRef }}
      >
        {PROJECTS.map((project, index) => {
          const isAlt = index % 2 !== 0
          const tiltClass = getTiltClass(index)
          const classes = [
            'prj-clipping',
            isAlt ? 'prj-clipping--alt' : '',
            tiltClass,
          ].filter(Boolean).join(' ')

          return (
            <StackingCardItem
              key={project.issue}
              index={index}
              className={classes}
            >
              <NewspaperClipping project={project} index={index} />
            </StackingCardItem>
          )
        })}
        {/* Spacer inside wrapper — gives last card scroll room to lock */}
        <div className="prj-end-spacer" aria-hidden="true" />
      </StackingCards>
    </div>
  )
}
