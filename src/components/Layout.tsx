import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useStore } from '../app/store';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav';

export function Layout() {
  const { pathname } = useLocation();
  const { loadIssue, dismissLoadIssue, saveError } = useStore();
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 btn-primary">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-line bg-bg px-5 py-7" aria-label="Sidebar">
        <Link to="/" className="font-serif text-2xl font-semibold text-ink px-3">Equanim</Link>
        <p className="text-xs text-muted px-3 mt-1">Clarity in the midst of life.</p>
        <nav aria-label="Primary" className="mt-8">
          <ul className="space-y-1">
            {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end}
                  className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-[15px] font-medium ${isActive ? 'bg-accent text-onaccent' : 'text-ink hover:bg-surface2'}`}>
                  <Icon size={19} aria-hidden="true" />{label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Secondary" className="mt-auto pt-6 border-t border-line">
          <ul className="space-y-0.5">
            {SECONDARY_NAV.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => `block rounded-lg px-3 py-2 text-[13.5px] ${isActive ? 'text-accent font-semibold' : 'text-muted hover:text-ink'}`}>{label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-line">
          <div className="mx-auto max-w-app px-5 h-14 flex items-center justify-between">
            <Link to="/" className="font-serif text-xl font-semibold tracking-tight text-ink" aria-label="Equanim, go to Today">Equanim</Link>
            <Link to="/more" className="btn-ghost !min-h-[44px] !px-2.5" aria-label="More: about, framework, references, settings and privacy">
              <Menu size={22} aria-hidden="true" />
            </Link>
          </div>
        </header>

        {loadIssue && (
          <div role="alert" className="mx-auto max-w-app lg:max-w-wide w-full px-5 pt-4">
            <div className="card !p-4 border-terracotta/50 bg-claysoft">
              <p className="text-sm text-ink">
                {loadIssue.kind === 'newer'
                  ? 'Your saved data was created by a newer version of Equanim and could not be opened here.'
                  : 'Your saved data could not be read, so Equanim started fresh.'}{' '}
                A copy of the unreadable data was kept on this device and has not been deleted. You can restore from an exported backup in Settings and Data.
              </p>
              <button className="btn-ghost mt-2 !px-0" onClick={dismissLoadIssue}>Understood</button>
            </div>
          </div>
        )}
        {saveError && (
          <div role="alert" className="mx-auto max-w-app lg:max-w-wide w-full px-5 pt-4">
            <p className="card !p-4 text-sm border-danger/40">Your latest change could not be saved on this device. Storage may be full or disabled. Consider exporting a backup from Settings and Data.</p>
          </div>
        )}

        <main id="main" className="flex-1 mx-auto max-w-app lg:max-w-wide w-full px-5 lg:px-10 pt-5 lg:pt-10 pb-28 lg:pb-16" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label="Primary" className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto max-w-app grid grid-cols-5">
          {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end}
                className={({ isActive }) => `flex flex-col items-center justify-center gap-1 h-16 text-[11.5px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`}>
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
