import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { DOMAIN_LIST } from '../data/domains';
import { SECONDARY_NAV } from '../components/nav';
import { PageHeader } from '../components/ui';
import { InstallApp } from '../components/InstallApp';

export function More() {
  return (
    <div>
      <PageHeader title="More" />
      <ul className="card !p-0 divide-y divide-line overflow-hidden">
        {SECONDARY_NAV.map(({ to, icon: Icon, label, desc }) => (
          <li key={to}>
            <Link to={to} className="flex items-center gap-4 px-5 py-4 hover:bg-surface2 transition-colors">
              <Icon size={20} className="text-accent shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-0"><span className="block font-medium">{label}</span><span className="block text-sm text-muted">{desc}</span></span>
              <ChevronRight size={18} className="text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-6" aria-label="Install App"><InstallApp variant="row" /></section>
      <p className="text-center text-xs text-muted mt-8">Equanim 1.1 · Clarity in the midst of life.</p>
    </div>
  );
}

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="font-serif text-[21px] font-semibold mt-7 mb-2">{children}</h2>;

export function About() {
  return (
    <article>
      <PageHeader title="About Equanim" back="/more" />
      <div className="prose-eq text-[16.5px]">
        <p>Equanim is a companion for practising awareness in ordinary life: in conversations, in traffic, in the minutes after a difficult message. Its purpose is to help you respond to everyday situations with more clarity, balance and personal responsibility.</p>
        <H2>The name</H2>
        <p>The name comes from equanimity: steadiness of mind, especially when things are difficult. Equanimity here does not mean feeling nothing or accepting everything. It means being steady enough to see what is happening, and to choose a response rather than be carried by a reaction.</p>
        <H2>Awareness, reflection, deliberate action</H2>
        <p>The practice moves in three steps. Awareness: noticing what happened and what you added to it. Reflection: looking back, without self-punishment, at how you responded. Deliberate action: choosing, next time, a response that better fits what you value. Equanim is built around short, repeatable practice rather than long reading, because understanding an idea and living it are different skills.</p>
        <H2>Inspiration and independence</H2>
        <p>The broad themes of Equanim are inspired by Don Miguel Ruiz’s book <em>The Four Agreements</em>. All explanations, scenarios, exercises and essays in this app are original writing. Equanim does not reproduce the book, is not a summary or substitute for it, and is not an official, authorised or endorsed product of Don Miguel Ruiz, his publishers or any related organisation.</p>
        <H2>What Equanim is not</H2>
        <p>Equanim is an educational and self-reflection tool. It is not therapy, counselling, medical advice or a treatment for any condition, and it is not a replacement for professional mental-health support. It contains no artificial intelligence: every piece of feedback was written in advance.</p>
        <H2>If you are struggling</H2>
        <p>If you are in distress or thinking about harming yourself, please contact someone you trust or emergency services. In India you can call 112 for emergencies, or Tele-MANAS, the Government of India’s 24-hour mental health helpline, on 14416 or 1-800-891-4416.</p>
      </div>
    </article>
  );
}

export function Framework() {
  const cycle = [
    ['Something happens', 'A message, a remark, a delay, a mistake. Usually small.'],
    ['A reaction arrives', 'A feeling, an impulse and a story, often before you have noticed any of them.'],
    ['You notice', 'The moment of seeing the reaction as a reaction. This is the space Equanim practises.'],
    ['You choose', 'A response that fits what actually happened and what you value.'],
    ['You reflect', 'Later, without judgement: what did I observe, and what did I add?'],
  ];
  return (
    <article>
      <PageHeader title="Practice Framework" back="/more" intro="How Equanim’s four domains work together." />
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
        <p className="text-[15px] text-muted mt-4">Practice does not remove reactions. It widens the third step, a little at a time.</p>
      </section>

      <h2 className="eyebrow mt-8 mb-3">Four domains</h2>
      <ul className="space-y-3">
        {DOMAIN_LIST.map((d) => (
          <li key={d.id} className="card !p-4">
            <p className="font-serif text-[19px] font-semibold">{d.name}</p>
            <p className="text-sm text-muted">{d.short}</p>
            <p className="mt-2 text-[15px]">{d.description}</p>
            <p className="mt-2 text-[15px] italic">{d.question}</p>
            <p className="mt-2 text-[14px] text-muted">{d.notThis}</p>
            <p className="mt-2 text-[13px] text-muted">{d.relation}</p>
            <Link to={`/practise?domain=${d.id}`} className="btn-ghost !px-0 mt-1 text-sm">See scenarios<ChevronRight size={16} aria-hidden="true" /></Link>
          </li>
        ))}
      </ul>

      <section className="card mt-7">
        <h2 className="eyebrow mb-2">How they work together</h2>
        <div className="prose-eq text-[15.5px]">
          <p>The domains are four angles on one skill. When you separate an event from the meaning you added (Freedom from Personalisation), you are less likely to speak in haste (Integrity of Speech). When you check an assumption before acting (The Discipline of Inquiry), you often discover there was less to defend. And when practice slips, as it will, Sincere Effort asks only for the next honest step, not perfection.</p>
          <p>Running through all four is the practice of observing habitual reactions, so that a more deliberate response becomes possible.</p>
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="eyebrow mb-2">What this framework is</h2>
        <p className="text-[15.5px]">A practical learning model created for Equanim. It is not a psychological assessment or a validated instrument, and Progress does not measure psychological change. The domain names are Equanim’s own and are not the source book’s chapter titles.</p>
      </section>
    </article>
  );
}

export function References() {
  return (
    <article>
      <PageHeader title="Reading and References" back="/more" />
      <section className="card">
        <h2 className="eyebrow mb-2">Major inspiration</h2>
        <p className="text-[15.5px]">Ruiz, Don Miguel. <em>The Four Agreements: A Practical Guide to Personal Freedom</em>. San Rafael, California: Amber-Allen Publishing, 1997. ISBN 1-878424-31-9.</p>
        <p className="text-sm text-muted mt-3">Bibliographic details checked against the Open Library catalogue record for this edition.</p>
      </section>
      <section className="card mt-4">
        <h2 className="eyebrow mb-2">What comes from the source, and what is Equanim’s</h2>
        <p className="text-[15.5px]">From the book: only its broad themes, which Equanim takes as a starting point for four domains of practice. Equanim’s own: the domain names, the practice framework, every scenario, option and piece of feedback, the daily practices, the essays and exercises, and the journal questions. Equanim does not quote or reproduce the book’s text, chapters or exercises, and its interpretations may differ from the author’s.</p>
      </section>
      <section className="card mt-4">
        <h2 className="eyebrow mb-2">Attribution and disclaimer</h2>
        <p className="text-[15.5px]">Equanim is independent and is not endorsed by, sponsored by or affiliated with Don Miguel Ruiz, Amber-Allen Publishing or any related organisation.</p>
      </section>
      <section className="card mt-4">
        <h2 className="eyebrow mb-2">A note on evidence</h2>
        <p className="text-[15.5px]">The content is written as reflective practice. It makes no research or clinical claims, and so cites no studies. Other sources will be listed here only if they are actually used and their details verified.</p>
      </section>
    </article>
  );
}

export function Privacy() {
  return (
    <article>
      <PageHeader title="Privacy and Storage" back="/more" />
      <div className="prose-eq text-[16.5px]">
        <p><strong>Where your data lives.</strong> Intentions, reflections, practices, scenario history, journal entries, reading progress and settings are stored in this browser’s local storage on this device. Equanim has no account system, no server and no database of its own.</p>
        <p><strong>Limits of local storage.</strong> Your data exists only in this browser on this device. Clearing browser data or site data, using a private window, or switching to another browser or device means it will not be there. Browsers also limit how much a site can store (usually a few megabytes, which is plenty for text). Equanim does not encrypt your data and does not back it up for you. Export a backup from Settings and Data if your entries matter to you.</p>
        <p><strong>No tracking.</strong> There is no analytics, advertising, telemetry or third-party script. Fonts are bundled with the app.</p>
        <p><strong>No AI.</strong> Nothing you write is analysed or uploaded. All feedback is pre-written.</p>
        <p><strong>Offline.</strong> After your first visit, the app files are kept by your browser so Equanim can open without a connection. This cache contains only the app itself, not your entries, which are always in local storage.</p>
        <p><strong>Hosting.</strong> The app files are served by GitHub Pages. As with any website, GitHub may process technical request data such as IP addresses to deliver the files. That is outside Equanim’s control and does not include your entries.</p>
      </div>
      <Link to="/settings" className="btn-secondary mt-6">Go to Settings and Data</Link>
    </article>
  );
}
