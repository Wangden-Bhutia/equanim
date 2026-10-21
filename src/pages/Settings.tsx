import { useRef, useState } from 'react';
import { CalendarPlus, Download, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../app/store';
import { exportFileName, exportJson, parseImport, summarize, type DataSummary } from '../storage/transfer';
import { dateKey, formatShort } from '../engine/dates';
import { reminderIcs } from '../engine/programme';
import type { AppData, ThemePreference } from '../types';
import { ConfirmDialog, PageHeader } from '../components/ui';
import { InstallApp } from '../components/InstallApp';

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

function SummaryList({ s }: { s: DataSummary }) {
  return (
    <ul className="mt-2 text-[15px] text-ink space-y-0.5">
      <li>{s.intentions} intentions and {s.reflections} evening reflections</li>
      <li>{s.practices} daily practices completed</li>
      <li>{s.scenarios} scenario completions ({s.attempts} responses explored)</li>
      <li>{s.journal} journal entries</li>
      <li>{s.library} reading records</li>
    </ul>
  );
}

const COPY_LABEL = { unreadable: 'Unreadable data', 'pre-migration': 'Original before upgrade', recovered: 'Original before recovery', 'set-aside': 'Edits set aside', unsaved: 'Unsaved change' } as const;

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lists safety copies kept on this device so they can be saved as files. They are never deleted automatically. */
function RecoveryCopies() {
  const { safetyCopies, readSafetyCopy } = useStore();
  const copies = safetyCopies();
  if (copies.length === 0) return null;
  return (
    <section className="card" aria-labelledby="rec-h">
      <h2 id="rec-h" className="eyebrow">Recovery copies</h2>
      <p className="text-[15px] text-muted mt-1">Equanim keeps an exact copy of your saved data before upgrading it or recovering from damaged values. When the same item was changed in two tabs at once, the version not kept is saved as "Edits set aside". A change that could not be saved is kept as "Unsaved change". These copies stay on this device until you erase all data. An "original before upgrade" copy can be imported here like a backup.</p>
      <ul className="mt-3 space-y-2">
        {copies.map((c) => (
          <li key={c.key} className="flex items-center justify-between gap-3 text-[15px]">
            <span className="min-w-0">
              <span className="block font-medium">{COPY_LABEL[c.kind]}</span>
              <span className="block text-[13px] text-muted">{c.at ? formatShort(new Date(c.at).toISOString()) : 'Date unknown'} · {Math.max(1, Math.round(c.size / 1024))} KB</span>
            </span>
            <button className="btn-secondary !min-h-[44px] shrink-0" onClick={() => { const raw = readSafetyCopy(c.key); if (raw !== null) download(`equanim-${c.kind}-${c.at || 'copy'}.json`, raw); }}>
              <Download size={16} aria-hidden="true" />Download<span className="sr-only"> {COPY_LABEL[c.kind].toLowerCase()}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReminderSection() {
  const { data, updateSettings } = useStore();
  const [time, setTime] = useState(data.settings.reminderTime ?? '08:00');
  const get = () => {
    const ok = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    if (!ok) return;
    updateSettings({ reminderTime: time });
    const blob = new Blob([reminderIcs(time, dateKey())], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'equanim-daily-reminder.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="card" aria-labelledby="rem-h">
      <h2 id="rem-h" className="eyebrow">Daily reminder (optional)</h2>
      <p className="text-[15px] text-muted mt-1">Equanim cannot send notifications. Instead, download a calendar file with a daily event at the time you choose. <strong className="text-ink font-semibold">It only reminds you once you add it to your calendar app</strong>; to stop it, delete the event there.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="rem-time" className="label">Time</label>
          <input id="rem-time" type="time" className="field !w-auto" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <button className="btn-secondary" onClick={get} disabled={!time}><CalendarPlus size={17} aria-hidden="true" />Download calendar reminder (.ics)</button>
      </div>
    </section>
  );
}

export function Settings() {
  const store = useStore();
  const { data, updateSettings } = store;
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [pending, setPending] = useState<{ data: AppData; summary: DataSummary; exportedAt: string | null } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const backup = store.backupInfo();

  const doExport = () => {
    const blob = new Blob([exportJson(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    store.markExported();
    setStatus('Backup file created. Keep it somewhere safe; it contains your private entries.');
  };

  const onFile = async (file: File | undefined) => {
    setImportError('');
    setStatus('');
    if (!file) return;
    const text = await readFileText(file);
    const r = parseImport(text);
    if (!r.ok) setImportError(r.error);
    else setPending({ data: r.data, summary: r.summary, exportedAt: r.exportedAt });
    if (fileRef.current) fileRef.current.value = '';
  };

  const applyImport = (mode: 'merge' | 'replace') => {
    if (!pending) return;
    store.importData(pending.data, mode);
    setPending(null);
    setStatus(mode === 'merge' ? 'Backup merged with your existing data. Your previous data was kept as a restore point.' : 'Your data was replaced with the backup. Your previous data was kept as a restore point.');
  };

  const themes: { id: ThemePreference; label: string }[] = [
    { id: 'system', label: 'Automatic' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Settings and Data" back="/more" />

      {status && <p role="status" className="card !p-4 bg-accentsoft border-accent/30 text-[15px]">{status}</p>}

      <section className="card space-y-5" aria-labelledby="pref-h">
        <h2 id="pref-h" className="eyebrow">Preferences</h2>
        <div>
          <label htmlFor="s-name" className="label">Name</label>
          <input id="s-name" className="field" maxLength={80} value={data.settings.displayName} onChange={(e) => updateSettings({ displayName: e.target.value })} placeholder="Optional" />
        </div>
        <fieldset>
          <legend className="label">Theme</legend>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button key={t.id} type="button" aria-pressed={data.settings.theme === t.id} onClick={() => updateSettings({ theme: t.id })}
                className={`rounded-xl border min-h-[44px] text-sm font-medium ${data.settings.theme === t.id ? 'bg-accent text-onaccent border-accent' : 'border-line text-muted'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="font-medium text-[15px]" id="streak-l">Show practice streaks</p>
            <p className="text-[13px] text-muted" id="streak-d">Off by default. Streaks can motivate some people and pressure others. Missed days never remove past practice.</p>
          </div>
          <button type="button" role="switch" aria-checked={data.settings.streaksEnabled} aria-labelledby="streak-l" aria-describedby="streak-d"
            onClick={() => updateSettings({ streaksEnabled: !data.settings.streaksEnabled })}
            className="shrink-0 min-h-[44px] min-w-[56px] flex items-center justify-center rounded-full">
            <span aria-hidden="true" className={`relative block w-12 h-7 rounded-full transition-colors ${data.settings.streaksEnabled ? 'bg-accent' : 'bg-line'}`}>
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.settings.streaksEnabled ? 'translate-x-5' : ''}`} />
            </span>
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="inst-h">
        <h2 id="inst-h" className="eyebrow">App</h2>
        <p className="text-[15px] text-muted mt-1 mb-4">Install Equanim to open it from its own icon and use it offline. Installing changes nothing about where your data is kept.</p>
        <InstallApp variant="card" />
      </section>

      <ReminderSection />

      <section className="card" aria-labelledby="data-h">
        <h2 id="data-h" className="eyebrow">Your data</h2>
        <p className="text-[15px] text-muted mt-1">Everything is stored in this browser on this device, with no account or server. Clearing browser data, or using another browser or device, means your entries will not be there, so export a backup if they matter to you. The backup file is plain, unencrypted JSON. <Link to="/privacy" className="underline">Privacy and Storage</Link></p>
        <p className="text-[14.5px] mt-2" data-testid="last-export">Last export: {data.settings.lastExportAt ? formatShort(data.settings.lastExportAt) : 'never'}</p>
        <SummaryList s={summarize(data)} />
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn-secondary" onClick={doExport}><Download size={17} aria-hidden="true" />Export backup (JSON)</button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload size={17} aria-hidden="true" />Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a backup file to import" data-testid="import-input" onChange={(e) => void onFile(e.target.files?.[0])} />
          {backup && (
            <button className="btn-secondary" onClick={() => setRestoreOpen(true)}><RotateCcw size={17} aria-hidden="true" />Undo last import</button>
          )}
        </div>
        {importError && <p role="alert" className="text-danger text-sm mt-3">{importError}</p>}
      </section>

      <RecoveryCopies />

      <section className="card border-danger/30" aria-labelledby="reset-h">
        <h2 id="reset-h" className="eyebrow !text-danger">Erase everything</h2>
        <p className="text-[15px] text-muted mt-1">Permanently removes all intentions, reflections, journal entries, practice records and settings from this device.</p>
        <button className="btn-secondary !text-danger mt-4" onClick={() => { setResetText(''); setResetOpen(true); }}><Trash2 size={17} aria-hidden="true" />Erase all data</button>
      </section>

      <ConfirmDialog open={!!pending} title="Import this backup?" confirmLabel="Replace my data" danger onConfirm={() => applyImport('replace')} onCancel={() => setPending(null)}>
        {pending && (
          <>
            <p>{pending.exportedAt ? `Exported ${formatShort(pending.exportedAt)}. ` : ''}The file contains:</p>
            <SummaryList s={pending.summary} />
            <p className="mt-3"><strong>Merge</strong> adds the backup to what is already here. <strong>Replace</strong> removes your current data first. Either way, your current data is kept as a restore point.</p>
            <button type="button" className="btn-primary w-full mt-4" onClick={() => applyImport('merge')}>Merge with my data</button>
          </>
        )}
      </ConfirmDialog>

      <ConfirmDialog open={restoreOpen} title="Undo last import?" confirmLabel="Restore" onCancel={() => setRestoreOpen(false)}
        onConfirm={() => { store.restoreBackup(); setRestoreOpen(false); setStatus('Your data was restored to how it was before the last import.'); }}>
        {backup && <>This restores the data saved on {formatShort(backup.savedAt)}, just before your last import. Changes made since then will be lost.</>}
      </ConfirmDialog>

      <ConfirmDialog open={resetOpen} title="Erase all data?" confirmLabel="Erase everything" danger confirmDisabled={resetText.trim().toUpperCase() !== 'ERASE'}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { store.resetAll(); setResetOpen(false); navigate('/', { replace: true }); }}>
        <p>This cannot be undone. Consider exporting a backup first.</p>
        <label htmlFor="reset-confirm" className="label mt-3">Type ERASE to confirm</label>
        <input id="reset-confirm" className="field" value={resetText} onChange={(e) => setResetText(e.target.value)} autoComplete="off" />
      </ConfirmDialog>
    </div>
  );
}
