import { useState } from 'react';
import { Check, Download, Share } from 'lucide-react';
import { currentPlatform, promptInstall, useInstall, type Platform } from '../engine/install';
import { Dialog } from './ui';

function IosSteps({ browser }: { browser: Extract<Platform, { os: 'ios' }>['browser'] }) {
  const where =
    browser === 'safari'
      ? 'Tap the Share button (a square with an arrow pointing up). On iPhone it is usually in the toolbar at the bottom; on iPad, at the top. If you do not see it, tap the ••• button first.'
      : browser === 'chrome'
        ? 'Tap the Share button to the right of the address bar.'
        : 'Open the browser’s Share option (in the toolbar or the menu).';
  return (
    <>
      <p>iPhone and iPad do not let websites install themselves. You can add Equanim to your Home Screen by hand:</p>
      <ol className="list-decimal pl-5 mt-3 space-y-2 text-ink">
        <li>{where}</li>
        <li>Scroll down the list and tap <strong>Add to Home Screen</strong>.</li>
        <li>Check that <strong>Open as Web App</strong> is switched on if you see it, then tap <strong>Add</strong>.</li>
      </ol>
      {browser !== 'safari' && (
        <p className="mt-3">In browsers other than Safari this needs iOS or iPadOS 16.4 or later. If Add to Home Screen is missing, open this page in Safari and try again.</p>
      )}
      <p className="mt-3">Equanim then opens from its own icon and works offline. Your entries stay in that app’s storage on this device; they are not shared with the browser tab, so export a backup first if you want to bring them across.</p>
    </>
  );
}

function ManualSteps({ platform, dismissed }: { platform: Platform; dismissed: boolean }) {
  const steps =
    platform.os === 'android'
      ? platform.browser === 'samsung'
        ? 'Open the menu (☰), tap Add page to, then Home screen.'
        : platform.browser === 'firefox'
          ? 'Open the menu (⋮) and tap Add app to Home screen (or Install).'
          : 'Open the browser menu (⋮) and tap Install app or Add to Home screen.'
      : platform.os === 'desktop'
        ? platform.browser === 'chromium'
          ? 'In Chrome or Edge, use the install icon at the right of the address bar, or the menu (⋮ or …) › Install Equanim / Apps › Install this site as an app.'
          : platform.browser === 'safari'
            ? 'In Safari on macOS Sonoma (14) or later, choose File › Add to Dock.'
            : 'This browser does not offer installing web apps on desktop. Chrome or Edge, or Safari on macOS Sonoma or later, can install Equanim.'
        : 'Open the browser menu and look for Install or Add to Home Screen.';
  return (
    <>
      <p>
        {dismissed
          ? 'The install prompt was closed. This browser decides when it can be shown again, so Equanim will not keep asking.'
          : 'This browser has not offered to install Equanim here. That can happen when it is already installed on this device, when the browser does not support installing web apps, or before the page has fully loaded.'}
      </p>
      <p className="mt-3 text-ink">{steps}</p>
      <p className="mt-3">If Equanim is already installed, open it from your home screen or app list. Equanim works fully in the browser too.</p>
    </>
  );
}

/** "Install App" control. `variant="sidebar"` is compact for the desktop sidebar; `"card"` is for Settings. */
export function InstallApp({ variant }: { variant: 'sidebar' | 'card' | 'row' }) {
  const { status, justInstalled } = useInstall();
  const [guide, setGuide] = useState(false);
  const [message, setMessage] = useState('');
  const platform = currentPlatform();

  if (status === 'installed') {
    if (variant === 'sidebar' && !justInstalled) return null;
    return (
      <p role="status" className={variant === 'sidebar' ? 'flex items-center gap-2 px-3 text-[13px] text-muted' : 'flex items-center gap-2 text-[15px] text-muted'}>
        <Check size={16} className="text-accent" aria-hidden="true" />
        {justInstalled ? 'Equanim is installed. Open it from your home screen or app list.' : 'You are using the installed app.'}
      </p>
    );
  }

  const onClick = async () => {
    setMessage('');
    if (status === 'available') {
      const r = await promptInstall();
      if (r === 'dismissed') setMessage('Not installed. You can install later from here or from the browser menu.');
      if (r === 'unavailable') setGuide(true);
      return;
    }
    setGuide(true);
  };

  const cls =
    variant === 'sidebar'
      ? 'flex w-full items-center gap-3 rounded-xl px-3 min-h-[44px] text-[14px] font-medium text-accent border border-line hover:bg-surface2'
      : variant === 'row'
        ? 'btn-secondary w-full'
        : status === 'available' ? 'btn-primary' : 'btn-secondary';
  const hint =
    status === 'available' ? null
      : status === 'ios' ? 'Shows how to add Equanim to your Home Screen.'
        : 'Install is not offered by this browser right now. Shows how to install manually.';

  return (
    <div>
      <button type="button" className={cls} onClick={() => void onClick()} disabled={status === 'prompting'} aria-describedby={hint ? `install-hint-${variant}` : undefined}>
        {status === 'ios' ? <Share size={17} aria-hidden="true" /> : <Download size={17} aria-hidden="true" />}
        Install App
      </button>
      {hint && <p id={`install-hint-${variant}`} className={variant === 'sidebar' ? 'sr-only' : 'text-[13px] text-muted mt-2'}>{hint}</p>}
      <p role="status" className={message ? 'text-[13px] text-muted mt-2' : 'sr-only'}>{message}</p>
      <Dialog open={guide} title={status === 'ios' ? 'Add Equanim to your Home Screen' : 'Installing Equanim'} onClose={() => setGuide(false)}
        footer={<button type="button" className="btn-primary" onClick={() => setGuide(false)}>Done</button>}>
        {platform.os === 'ios' ? <IosSteps browser={platform.browser} /> : <ManualSteps platform={platform} dismissed={status === 'dismissed'} />}
      </Dialog>
    </div>
  );
}
