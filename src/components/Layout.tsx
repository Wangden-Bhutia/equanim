import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useStore } from '../app/store';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav';
import { InstallApp } from './InstallApp';
import { applyUpdate, useUpdateAvailable } from '../engine/sw';

export function Layout() {
  const { pathname } = useLocation();
  const onAlso = (also?: string[]) => !!also?.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const { loadIssue, dismissLoadIssue, writeIssue, setAsideNotice, dismissSetAside } = useStore();
  const updateReady = useUpdateAvailable();
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 btn-primary">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-line bg-bg px-5 py-7" aria-label="Sidebar">
        <Link to="/" className="font-serif text-2xl font-semibold text-ink px-3">Equanim</Link>
        <p className="text-xs text-muted px-3 mt-1">Clarity in the midst of life.</p>
        <nav aria-label="Primary" className="mt-8">
          <ul className="space-y-1">
            {PRIMARY_NAV.map(({ to, label, icon: Icon, end, also }) => (
              <li key={to}>
                <NavLink to={to} end={end}
                  className={({ isActive: navActive }) => `flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-[15px] font-medium ${(navActive || onAlso(also)) ? 'bg-accent text-onaccent' : 'text-ink hover:bg-surface2'}`}>
                  <Icon size={19} aria-hidden="true" />{label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-6"><InstallApp variant="sidebar" /></div>
        <nav aria-label="Secondary" className="mt-4 pt-4 border-t border-line">
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
            <Link to="/more" className="btn-ghost !min-h-[44px] !px-2.5" aria-label="More: keep practising, about, evidence, settings and privacy">
              <Menu size={22} aria-hidden="true" />
            </Link>
          </div>
        </header>

        {updateReady && (
          <div role="status" className="mx-auto max-w-app lg:max-w-wide w-full px-5 pt-4">
            <div className="card !p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink">A new version of Equanim is ready. Your entries are not affected.</p>
              <button className="btn-primary !min-h-[44px]" onClick={applyUpdate}>Update now</button>
            </div>
          </div>
        )}
        {loadIssue && (
          <div role="alert" className="mx-auto max-w-app lg:max-w-wide w-full px-5 pt-4">
            <div className="card !p-4 border-terracotta/50 bg-claysoft">
              <p className="text-sm text-ink">
                {loadIssue.kind === 'newer' && loadIssue.backupKey === null &&
                  'Equanim was updated in another tab or window. Reload this tab to continue. Nothing has been deleted, and this tab will not save until it is reloaded.'}
                {loadIssue.kind === 'newer' && loadIssue.backupKey !== null &&
                  'Your saved data was created by a newer version of Equanim and could not be opened here, so Equanim started fresh. The original was kept on this device and has not been deleted.'}
                {loadIssue.kind === 'unreadable' &&
                  'Your saved data could not be read, so Equanim started fresh. The unreadable copy was kept on this device and has not been deleted.'}
                {loadIssue.kind === 'partial' &&
                  `Some saved values could not be read (${loadIssue.dropped} ${loadIssue.dropped === 1 ? 'item' : 'items'}). Everything else was opened as normal, and the original was kept on this device.`}
                {loadIssue.kind === 'backup-failed' &&
                  'Equanim could not make a safety copy of your saved data (storage may be full), so saving is paused to protect what is already stored. Export a backup, then free some browser storage.'}{' '}
                Recovery copies are listed in Settings and Data.
              </p>
              <button className="btn-ghost mt-2 !px-0" onClick={dismissLoadIssue}>Understood</button>
            </div>
          </div>
        )}
        {writeIssue && (
          <div role="alert" className="mx-auto max-w-app lg:max-w-wide w-full px-5 pt-4">
            <div className="card !p-4 border-danger/40">
              <p className="text-sm text-ink">
                {writeIssue.reason === 'newer'
                  ? 'Another tab is running a newer version of Equanim, so this tab cannot save. Your latest change is still on screen'
                  : writeIssue.reason === 'locked' || writeIssue.reason === 'backup-failed'
                    ? 'Saving is paused because a safety copy could not be written. Your latest change is still on screen'
                    : 'Your latest change could not be saved on this device yet. It is still on screen and will be saved with your next change'}
                {writeIssue.unsavedKey ? ', and a copy was kept under Recovery copies in Settings and Data.' : '.'}
                {writeIssue.reason === 'newer' ? ' Reload this tab to continue.' : ' Storage may be full: consider exporting a backup from Settings and Data.'}
              </p>
              {writeIssue.reason === 'newer' && (
                <button className="btn-secondary mt-3 !min-h-[44px]" onClick={() => window.location.reload()}>Reload this tab</button>
              )}
            </div>
          </div>
        )}
        {setAsideNotice > 0 && (
          <div role="status" className="mx-auto max-w-app lg:max-w-wide w-full px-5 pt-4">
            <div className="card !p-4">
              <p className="text-sm text-ink">
                The same {setAsideNotice === 1 ? 'item was' : 'items were'} changed in two places at once (for example, two tabs). The most recent version was kept, and the other was saved under Recovery copies in Settings and Data, so nothing was lost.
              </p>
              <button className="btn-ghost mt-2 !px-0" onClick={dismissSetAside}>Understood</button>
            </div>
          </div>
        )}

        <main id="main" className="flex-1 mx-auto max-w-app lg:max-w-wide w-full px-5 lg:px-10 pt-5 lg:pt-10 pb-28 lg:pb-16" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label="Primary" className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto max-w-app grid grid-cols-4">
          {PRIMARY_NAV.map(({ to, label, icon: Icon, end, also }) => (
            <li key={to}>
              <NavLink to={to} end={end}
                className={({ isActive: navActive }) => `flex flex-col items-center justify-center gap-1 h-16 text-[11.5px] font-medium ${(navActive || onAlso(also)) ? 'text-accent' : 'text-muted'}`}>
                {({ isActive: navActive }) => (
                  <>
                    <span className={`flex items-center justify-center w-12 h-7 rounded-full ${(navActive || onAlso(also)) ? 'bg-accentsoft' : ''}`}>
                      <Icon size={20} aria-hidden="true" strokeWidth={(navActive || onAlso(also)) ? 2.2 : 1.8} />
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
