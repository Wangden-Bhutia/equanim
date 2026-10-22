import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { DOMAIN_LIST } from '../data/domains';
import { WEEKS } from '../data/programme';
import { DOMAIN_TEXT, WeekMotif } from '../components/journey';
import { SECONDARY_NAV } from '../components/nav';
import { PageHeader } from '../components/ui';
import { InstallApp } from '../components/InstallApp';
import { SafetyFooter } from '../components/programme';

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
      <SafetyFooter className="mt-6 text-center" />
      <p className="text-center text-xs text-muted mt-8">Equanim 1.2 · Clarity in the midst of life.</p>
    </div>
  );
}


export function About() {
  const path = [
    { w: 0, t: 'Day 0', d: 'Choose three values and take a private snapshot of where you are starting.' },
    ...WEEKS.map((w) => ({ w: w.week, t: `Week ${w.week}: ${w.title}`, d: w.summary })),
  ];
  return (
    <article className="space-y-5">
      <PageHeader title="About Equanim" back="/more" intro="A six-week, few-minutes-a-day programme for responding to everyday moments with more clarity and less reactivity." />

      <section aria-labelledby="ab-what" className="prose-eq text-[16px]">
        <h2 id="ab-what" className="font-serif text-[21px] font-semibold mb-2">What it does</h2>
        <p>Equanim helps you notice the moment between something happening and how you respond, and use it a little more often. It does this with short daily sessions, small plans for real moments, and a weekly look back. Everything stays private on your device.</p>
        <h2 className="font-serif text-[21px] font-semibold mt-6 mb-2">Who it is for</h2>
        <p>Adults who want to take things less personally, check assumptions before acting on them, speak with more care, and keep going without demanding perfection. It suits people who can spare about eight minutes most days. It is not designed for crisis, trauma or clinical conditions.</p>
      </section>

      <section aria-labelledby="ab-skills">
        <h2 id="ab-skills" className="font-serif text-[21px] font-semibold mb-3">The four skills, and what they are not</h2>
        <ul className="space-y-3">
          {DOMAIN_LIST.map((d) => (
            <li key={d.id} className="card !p-4">
              <p className={`font-serif text-[18px] font-semibold ${DOMAIN_TEXT[d.id]}`}>{d.name}</p>
              <p className="text-[15px] mt-1">{d.short}</p>
              <p className="text-[14px] text-muted mt-1.5"><span className="font-semibold text-ink">Not this: </span>{d.notThis}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ab-path" className="card">
        <h2 id="ab-path" className="font-serif text-[21px] font-semibold mb-3">The six-week path</h2>
        <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
          {path.map((p) => (
            <li key={p.w} className="relative flex gap-3">
              <span className="relative z-10 w-8 h-8 shrink-0 rounded-full bg-surface border border-line flex items-center justify-center">
                {p.w === 0 ? <span className="text-[12px] font-semibold">0</span> : <WeekMotif week={p.w} size={16} />}
              </span>
              <span><span className="font-medium block text-[15px]">{p.t}</span><span className="text-[14px] text-muted">{p.d}</span></span>
            </li>
          ))}
        </ol>
        <p className="text-[15px] mt-4"><span className="font-semibold">By the end, </span>you will have practised each skill in real moments, made and reviewed your own plans, compared Day 0 with Week 6 in your own words, and set up a light way to keep going. Equanim does not promise or measure change.</p>
      </section>

      <section aria-labelledby="ab-day" className="card">
        <h2 id="ab-day" className="font-serif text-[21px] font-semibold mb-2">A typical day</h2>
        <ol className="space-y-2 text-[15px] list-decimal pl-5">
          <li><span className="font-medium">Morning (1 min):</span> make one if-then plan: “When ___, I will ___.”</li>
          <li><span className="font-medium">Any time (6–10 min):</span> today’s session. Think it through, or write it down.</li>
          <li><span className="font-medium">Evening (1 min):</span> did the moment come up? What did you do?</li>
        </ol>
        <p className="text-[14px] text-muted mt-2">Day 6 of each week is a 15-minute review; Day 7 is rest. Sessions wait for you: missing a day changes nothing.</p>
      </section>

      <section aria-labelledby="ab-how" className="prose-eq text-[16px]">
        <h2 id="ab-how" className="font-serif text-[21px] font-semibold mb-2">How change tends to happen</h2>
        <p>Understanding an idea and living it are different skills. Each week moves from understanding, to recognising the pattern in others’ situations, to rehearsing words, to trying it in your own life, to recalling it later. Small, specific plans and spaced recall are borrowed from research on learning and habits; the <Link to="/evidence" className="underline underline-offset-2">Evidence and sources</Link> page lists real studies, and is clear that Equanim itself has not been tested.</p>
      </section>

      <section aria-labelledby="ab-not" className="card border-terracotta/50 bg-claysoft">
        <h2 id="ab-not" className="font-serif text-[21px] font-semibold mb-2">What Equanim isn’t</h2>
        <p className="text-[15px]">It is not therapy, counselling, medical advice or a treatment for any condition, and it does not diagnose anything. It contains no AI: every piece of feedback was written in advance. Its ratings are a private snapshot, not a validated test.</p>
        <p className="text-[15px] mt-2"><span className="font-semibold">If you are struggling</span>, or thinking about harming yourself, please contact someone you trust or emergency services. In India: call 112 for emergencies, or Tele-MANAS, the Government of India’s 24-hour mental health helpline, on 14416 or 1-800-891-4416. If a situation involves abuse or a risk to your safety, these skills are not the answer; please reach out for help.</p>
      </section>

      <section aria-labelledby="ab-credit" className="prose-eq text-[16px]">
        <h2 id="ab-credit" className="font-serif text-[21px] font-semibold mb-2">Credit and independence</h2>
        <p>The broad themes of Equanim are inspired by Don Miguel Ruiz’s book <em>The Four Agreements</em>. All explanations, scenarios, phrases, exercises and essays are original writing. Equanim does not reproduce or summarise the book, and it is not an official, authorised or endorsed product of Don Miguel Ruiz, his publishers or any related organisation. The skill names and the programme are Equanim’s own.</p>
      </section>

      <aside className="card border-accent/40" aria-labelledby="ab-most">
        <h2 id="ab-most" className="font-serif text-[19px] font-semibold mb-2">How to get the most from it</h2>
        <ul className="space-y-1.5 text-[15px] list-disc pl-5">
          <li>Pick a fixed moment for your session, like after morning tea.</li>
          <li>Keep plans small enough for a rushed day.</li>
          <li>Treat “I didn’t manage it” as information, not a verdict.</li>
          <li>Coming back after a gap is part of the practice. Pick up where you left off.</li>
          <li>Export a backup now and then: your data lives only on this device.</li>
        </ul>
      </aside>
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
