import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { BookOpen, CircleUserRound, Compass, NotebookPen, Sun, TrendingUp } from 'lucide-react';
import { useStore } from '../app/store';

const TABS = [
  { to: '/', label: 'Today', icon: Sun, end: true },
  { to: '/practise', label: 'Practise', icon: Compass, end: false },
  { to: '/journal', label: 'Journal', icon: NotebookPen, end: false },
  { to: '/library', label: 'Library', icon: BookOpen, end: false },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
];

export function Layout() {
  const { pathname } = useLocation();
  const { loadIssue, dismissLoadIssue, saveError } = useStore();
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 btn-primary">Skip to content</a>
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line/60">
        <div className="mx-auto max-w-app px-5 h-14 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-semibold tracking-tight text-ink" aria-label="Equanim, go to Today">Equanim</Link>
          <Link to="/more" className="btn-ghost !min-h-[44px] !px-2.5" aria-label="More: settings, about, framework and privacy">
            <CircleUserRound size={22} aria-hidden="true" />
          </Link>
        </div>
      </header>

      {loadIssue && (
        <div role="alert" className="mx-auto max-w-app w-full px-5 pt-4">
          <div className="card !p-4 border-clay/50 bg-claysoft">
            <p className="text-sm text-ink">
              {loadIssue.kind === 'newer'
                ? 'Your saved data was created by a newer version of Equanim and could not be opened here.'
                : 'Your saved data could not be read, so Equanim started fresh.'}{' '}
              A copy of the unreadable data was kept on this device and has not been deleted. You can restore from an exported backup in Settings.
            </p>
            <button className="btn-ghost mt-2 !px-0" onClick={dismissLoadIssue}>Understood</button>
          </div>
        </div>
      )}
      {saveError && (
        <div role="alert" className="mx-auto max-w-app w-full px-5 pt-4">
          <p className="card !p-4 text-sm border-danger/40">Your latest change could not be saved on this device. Storage may be full or disabled. Consider exporting a backup from Settings.</p>
        </div>
      )}

      <main id="main" className="flex-1 mx-auto max-w-app w-full px-5 pt-5 pb-28" tabIndex={-1}>
        <Outlet />
      </main>

      <nav aria-label="Primary" className="fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto max-w-app grid grid-cols-5">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 h-16 text-[11.5px] font-medium transition-colors ${isActive ? 'text-accent' : 'text-muted hover:text-ink'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex items-center justify-center w-12 h-7 rounded-full ${isActive ? 'bg-accentsoft' : ''}`}>
                      <Icon size={20} aria-hidden="true" strokeWidth={isActive ? 2.2 : 1.8} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
