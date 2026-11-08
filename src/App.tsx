import { useEffect, useState } from 'react'
import { Learn } from './pages/Learn'
import { Games } from './pages/Games'
import { Sandbox } from './pages/Sandbox'
import { Quiz } from './pages/Quiz'

type Page = 'learn' | 'sandbox' | 'games' | 'quiz'
const TABS: { id: Page; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'sandbox', label: 'Sandbox' },
  { id: 'games', label: 'Games' },
  { id: 'quiz', label: 'Quiz' },
]

function parse(): { page: Page; arg?: string } {
  const [, page, arg] = location.hash.replace(/^#/, '').split('/')
  return { page: (TABS.map((t) => t.id) as string[]).includes(page) ? (page as Page) : 'learn', arg }
}

export default function App() {
  const [route, setRoute] = useState(parse)
  const [tutorialRequest, setTutorialRequest] = useState(0)
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#/learn">
          <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden>
            <rect width="32" height="32" rx="6" className="logo-bg" />
            <circle cx="16" cy="16" r="6.2" className="logo-line" />
            <circle cx="16" cy="16" r="2" className="logo-line" />
            <path d="M16 4.5v3M16 24.5v3M4.5 16h3M24.5 16h3M7.9 7.9l2.1 2.1M22 22l2.1 2.1M24.1 7.9L22 10M10 22l-2.1 2.1" className="logo-line" />
          </svg>
          Mekanikz
        </a>
        <nav>
          {TABS.map((t) => (
            <a key={t.id} href={`#/${t.id}`} className={route.page === t.id ? 'active' : ''}>{t.label}</a>
          ))}
        </nav>
        <button className="btn" onClick={() => { if (route.page !== 'sandbox') location.hash = '#/sandbox'; setTutorialRequest((n) => n + 1) }}>Tutorial</button>
      </header>
      <main>
        {route.page === 'learn' && <Learn lessonId={route.arg} />}
        {route.page === 'sandbox' && <Sandbox tutorialRequest={tutorialRequest} />}
        {route.page === 'games' && <Games game={route.arg} />}
        {route.page === 'quiz' && <Quiz />}
      </main>
    </>
  )
}
