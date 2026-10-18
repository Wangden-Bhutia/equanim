import { Link } from 'react-router-dom';
import { ChevronRight, Info, Layers, BookMarked, Settings as Cog, ShieldCheck } from 'lucide-react';
import { DOMAIN_LIST } from '../data/domains';
import { PageHeader } from '../components/ui';

export function More() {
  const items = [
    { to: '/settings', icon: Cog, title: 'Settings & data', desc: 'Name, theme, streaks, export, import and reset' },
    { to: '/framework', icon: Layers, title: 'Framework', desc: 'How the practice is structured' },
    { to: '/about', icon: Info, title: 'About Equanim', desc: 'What this app is, and what it is not' },
    { to: '/references', icon: BookMarked, title: 'References', desc: 'Sources and attribution' },
    { to: '/privacy', icon: ShieldCheck, title: 'Privacy', desc: 'Where your data lives' },
  ];
  return (
    <div>
      <PageHeader title="More" />
      <ul className="card !p-0 divide-y divide-line overflow-hidden">
        {items.map(({ to, icon: Icon, title, desc }) => (
          <li key={to}>
            <Link to={to} className="flex items-center gap-4 px-5 py-4 hover:bg-surface2 transition-colors">
              <Icon size={20} className="text-accent shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-0"><span className="block font-medium">{title}</span><span className="block text-sm text-muted">{desc}</span></span>
              <ChevronRight size={18} className="text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-muted mt-8">Equanim 1.0 · Clarity in the midst of life.</p>
    </div>
  );
}

export function About() {
  return (
    <article>
      <PageHeader title="About Equanim" back="/more" />
      <div className="prose-eq text-[16.5px]">
        <p>Equanim is a small companion for practising awareness in ordinary life: in conversations, in traffic, in the minutes after a difficult message. It is built around short, repeatable practice rather than long reading, because understanding an idea and living it are different skills.</p>
        <p>The practice is organised around four areas: careful words, separating events from the meaning we add, checking assumptions, and sincere effort without perfectionism. Running through all four is a fifth thread: noticing habitual reactions, so that a more deliberate response becomes possible.</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">Inspiration and independence</h2>
        <p>The broad themes of Equanim are inspired by Don Miguel Ruiz’s book <em>The Four Agreements</em>. All explanations, scenarios, exercises and essays in this app are original writing. Equanim does not reproduce the book, is not a summary or substitute for it, and is not affiliated with, authorised by or endorsed by Don Miguel Ruiz, his publishers or any related organisation. Readers interested in the original ideas are encouraged to read the book itself.</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">What Equanim is not</h2>
        <p>Equanim is an educational and self-reflection tool. It is not therapy, counselling, medical advice or a treatment for any condition. It contains no artificial intelligence: every piece of feedback was written in advance, and nothing you write is analysed or sent anywhere.</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">If you are struggling</h2>
        <p>If you are in distress or thinking about harming yourself, please contact someone you trust or local emergency services. In India you can call 112 for emergencies, or Tele-MANAS, the government’s mental health helpline, on 14416 or 1-800-891-4416.</p>
      </div>
    </article>
  );
}

export function Framework() {
  const cycle = [
    ['Something happens', 'A message, a remark, a delay, a mistake. Usually small.'],
    ['A reaction arrives', 'A feeling and a story, often before you have noticed either.'],
    ['You notice', 'The moment of seeing the reaction as a reaction. This is the gap.'],
    ['You choose', 'A response that fits what actually happened and what you value.'],
    ['You reflect', 'Later, without judgement: what did I observe, and what did I add?'],
  ];
  return (
    <article>
      <PageHeader title="The framework" back="/more" intro="How Equanim’s practice fits together." />
      <section className="card">
        <h2 className="eyebrow mb-3">The cycle of a moment</h2>
        <ol className="space-y-3">
          {cycle.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-full bg-accentsoft text-accent text-sm font-semibold flex items-center justify-center">{i + 1}</span>
              <span><span className="font-medium block">{t}</span><span className="text-muted text-[15px]">{d}</span></span>
            </li>
          ))}
        </ol>
        <p className="text-[15px] text-muted mt-4">Practice does not remove reactions. It widens step three, a little at a time.</p>
      </section>

      <h2 className="eyebrow mt-7 mb-3">Four areas of practice</h2>
      <ul className="space-y-3">
        {DOMAIN_LIST.map((d) => (
          <li key={d.id} className="card !p-4">
            <p className="font-serif text-[19px] font-semibold">{d.name}</p>
            <p className="text-sm text-muted">{d.short}</p>
            <p className="mt-2 text-[15px]">{d.description}</p>
            <p className="mt-2 text-[15px] italic">{d.question}</p>
            <Link to={`/practise?domain=${d.id}`} className="btn-ghost !px-0 mt-1 text-sm">See {d.name.toLowerCase()} scenarios<ChevronRight size={16} aria-hidden="true" /></Link>
          </li>
        ))}
      </ul>

      <section className="card mt-7">
        <h2 className="eyebrow mb-2">How the app supports it</h2>
        <ul className="space-y-2 text-[15px]">
          <li><span className="font-medium">Today:</span> one small morning intention and an evening reflection.</li>
          <li><span className="font-medium">Practise:</span> everyday scenarios with feedback on trade-offs, not right answers.</li>
          <li><span className="font-medium">Journal:</span> real moments, separated into what happened and the meaning added.</li>
          <li><span className="font-medium">Library:</span> short readings, each ending in a question, an exercise and a scenario.</li>
          <li><span className="font-medium">Progress:</span> a record of what you have practised, drawn only from your own entries.</li>
        </ul>
      </section>
    </article>
  );
}

export function References() {
  return (
    <article>
      <PageHeader title="References" back="/more" />
      <section className="card">
        <h2 className="eyebrow mb-2">Primary inspiration</h2>
        <p className="text-[15.5px]">Ruiz, Don Miguel. <em>The Four Agreements: A Practical Guide to Personal Freedom</em>. San Rafael, California: Amber-Allen Publishing, 1997. ISBN 1-878424-31-9.</p>
        <p className="text-sm text-muted mt-3">Bibliographic details checked against the Open Library catalogue record for this edition.</p>
      </section>
      <section className="card mt-4">
        <h2 className="eyebrow mb-2">Attribution and disclaimer</h2>
        <p className="text-[15.5px]">Equanim takes broad themes from the book above as a starting point. It does not quote or reproduce its text, chapters or exercises. All content in this app is original. Equanim is independent and is not endorsed by, sponsored by or affiliated with Don Miguel Ruiz, Amber-Allen Publishing or any related organisation.</p>
      </section>
      <section className="card mt-4">
        <h2 className="eyebrow mb-2">A note on sources</h2>
        <p className="text-[15.5px]">The scenarios, essays and exercises are written as reflective practice, not as summaries of research. Where Equanim makes no claim to scientific evidence, it does not cite any. Additional sources will be listed here only once their details have been verified.</p>
      </section>
    </article>
  );
}

export function Privacy() {
  return (
    <article>
      <PageHeader title="Privacy" back="/more" />
      <div className="prose-eq text-[16.5px]">
        <p><strong>Your data stays on this device.</strong> Intentions, reflections, journal entries and practice records are stored in your browser’s local storage. Equanim has no account system, no server and no database of its own.</p>
        <p><strong>No tracking.</strong> There is no analytics, advertising, telemetry or third-party script. Fonts are bundled with the app, so opening it does not contact font services.</p>
        <p><strong>No AI.</strong> Nothing you write is analysed, uploaded or used to train anything. All feedback is pre-written.</p>
        <p><strong>You are in control.</strong> You can export everything as a JSON file, import it on another device, or erase all data from Settings. Clearing your browser’s site data will also erase it, so export a backup if your entries matter to you.</p>
        <p><strong>Hosting.</strong> The app files are served by GitHub Pages. As with any website, GitHub may process technical request data such as IP addresses to deliver the files. That is outside Equanim’s control and does not include your entries.</p>
      </div>
      <Link to="/settings" className="btn-secondary mt-6">Go to Settings & data</Link>
    </article>
  );
}
