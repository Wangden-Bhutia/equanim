import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui';

/**
 * Evidence and sources. Every reference below was checked against its Crossref DOI record or the Open Library
 * catalogue (see docs/citations.md). Summaries are Equanim's plain-language reading of each source.
 */
interface Ref { cite: string; doi?: string; note: string }
interface Topic { id: string; title: string; idea: string; inEquanim: string; refs: Ref[] }

export const EVIDENCE: Topic[] = [
  {
    id: 'restructuring', title: 'Noticing and re-examining thoughts',
    idea: 'Cognitive approaches teach people to notice an automatic thought, separate it from the facts, and consider other explanations, often by writing them down (a “thought record”).',
    inEquanim: 'The camera view, “what happened and what I made it mean”, and checking the story before acting on it.',
    refs: [
      { cite: 'Beck, A. T., Rush, A. J., Shaw, B. F., & Emery, G. (1979). Cognitive Therapy of Depression. New York: Guilford Press.', note: 'The original clinical manual describing these techniques.' },
      { cite: 'Hofmann, S. G., Asnaani, A., Vonk, I. J. J., Sawyer, A. T., & Fang, A. (2012). The efficacy of cognitive behavioral therapy: A review of meta-analyses. Cognitive Therapy and Research, 36(5), 427–440.', doi: '10.1007/s10608-012-9476-1', note: 'A review of many meta-analyses. Support is strong for some problems and weaker for others; these are clinical treatments delivered by therapists, not apps.' },
    ],
  },
  {
    id: 'defusion', title: 'Seeing thoughts as thoughts',
    idea: 'Acceptance and Commitment Therapy (ACT) includes “defusion”: noticing a thought as a passing event in the mind, rather than as a fact or an instruction.',
    inEquanim: '“That’s one explanation”, noticing the sting without obeying it, and acting on your values.',
    refs: [
      { cite: 'Masuda, A., Hayes, S. C., Sackett, C. F., & Twohig, M. P. (2004). Cognitive defusion and self-relevant negative thoughts: Examining the impact of a ninety year old technique. Behaviour Research and Therapy, 42(4), 477–485.', doi: '10.1016/j.brat.2003.10.008', note: 'A small laboratory study: a brief defusion exercise reduced how believable and uncomfortable negative self-statements felt, compared with control conditions.' },
      { cite: 'A-Tjak, J. G. L., Davis, M. L., Morina, N., Powers, M. B., Smits, J. A. J., & Emmelkamp, P. M. G. (2015). A meta-analysis of the efficacy of acceptance and commitment therapy for clinically relevant mental and physical health problems. Psychotherapy and Psychosomatics, 84(1), 30–36.', doi: '10.1159/000365764', note: 'Pooled trials of ACT as a whole therapy, not of defusion alone.' },
    ],
  },
  {
    id: 'implementation', title: 'If-then plans',
    idea: 'Plans in the form “When situation X arises, I will do Y” (implementation intentions) link a specific cue to a specific action.',
    inEquanim: 'The morning if-then plan, the Day 4 “Apply” sessions, and the hardest-situation plan in Week 5.',
    refs: [
      { cite: 'Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist, 54(7), 493–503.', doi: '10.1037/0003-066X.54.7.493', note: 'Introduces the idea and reviews early studies.' },
      { cite: 'Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 69–119.', doi: '10.1016/S0065-2601(06)38002-1', note: 'Across many studies, forming if-then plans was associated with better goal attainment on average, with effects varying by setting.' },
    ],
  },
  {
    id: 'retrieval', title: 'Remembering by recalling, spaced out',
    idea: 'Recalling something from memory (rather than rereading it), and spreading practice out over time, both tend to improve how long it is remembered.',
    inEquanim: 'The Day 5 “Retrieve” sessions, and Quick recall questions that return 2, 7 and 21 days later.',
    refs: [
      { cite: 'Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.', doi: '10.1111/j.1467-9280.2006.01693.x', note: 'Students who practised recalling a text remembered more a week later than students who reread it.' },
      { cite: 'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.', doi: '10.1037/0033-2909.132.3.354', note: 'A review of hundreds of experiments: spaced practice generally beat massed practice for later recall.' },
    ],
  },
  {
    id: 'writing', title: 'Writing things down',
    idea: 'Expressive writing, putting thoughts and feelings about events into words, has been studied for its effects on wellbeing.',
    inEquanim: 'The optional “Write it down” mode, the journal, the evening check note, and the letter to your future self.',
    refs: [
      { cite: 'Pennebaker, J. W., & Beall, S. K. (1986). Confronting a traumatic event: Toward an understanding of inhibition and disease. Journal of Abnormal Psychology, 95(3), 274–281.', doi: '10.1037/0021-843X.95.3.274', note: 'An early experiment with students writing about difficult experiences.' },
      { cite: 'Frattaroli, J. (2006). Experimental disclosure and its moderators: A meta-analysis. Psychological Bulletin, 132(6), 823–865.', doi: '10.1037/0033-2909.132.6.823', note: 'Overall effects of disclosure writing were small and depended on how and by whom it was done.' },
    ],
  },
  {
    id: 'self-compassion', title: 'Self-compassion',
    idea: 'Self-compassion means treating yourself with the kindness you would offer a friend when things go wrong, recognising that difficulty is part of being human.',
    inEquanim: '“Information, not a verdict”, accurate self-talk in Week 3, and the low-energy “smaller version” in Week 4.',
    refs: [
      { cite: 'Neff, K. (2003). Self-compassion: An alternative conceptualization of a healthy attitude toward oneself. Self and Identity, 2(2), 85–101.', doi: '10.1080/15298860309032', note: 'Defines the concept and its parts.' },
      { cite: 'Neff, K. D., & Germer, C. K. (2013). A pilot study and randomized controlled trial of the Mindful Self-Compassion program. Journal of Clinical Psychology, 69(1), 28–44.', doi: '10.1002/jclp.21923', note: 'An 8-week group programme compared with a waitlist; a structured in-person course, not an app.' },
    ],
  },
  {
    id: 'habits', title: 'How long habits take',
    idea: 'New daily behaviours become more automatic gradually, at very different speeds for different people and behaviours.',
    inEquanim: 'Why the programme is six weeks plus maintenance, and why missing a day is never treated as starting over.',
    refs: [
      { cite: 'Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998–1009.', doi: '10.1002/ejsp.674', note: 'A small study of everyday habits: the time to become automatic varied widely, and missing an occasional day did not noticeably set people back.' },
    ],
  },
];

export function Evidence() {
  return (
    <article className="space-y-4">
      <PageHeader title="Evidence and sources" back="/more"
        intro="The ideas Equanim draws on, with real sources you can look up. Please read the note below first." />
      <section className="card border-terracotta/50 bg-claysoft" aria-labelledby="ev-note">
        <h2 id="ev-note" className="font-semibold">Equanim itself has not been tested</h2>
        <p className="text-[15px] mt-1">Equanim is a self-reflection tool. It has not been studied in any trial, and it makes no claim that it improves mental health or anything else. The research below is about the ideas it borrows, usually delivered in other ways (by therapists, in classrooms or in laboratory studies). Results there do not mean the same results will happen here.</p>
      </section>
      {EVIDENCE.map((t) => (
        <section key={t.id} className="card" aria-labelledby={`ev-${t.id}`}>
          <h2 id={`ev-${t.id}`} className="font-serif text-[20px] font-semibold">{t.title}</h2>
          <p className="text-[15px] mt-1">{t.idea}</p>
          <p className="text-[14px] text-muted mt-2"><span className="font-semibold text-ink">In Equanim: </span>{t.inEquanim}</p>
          <ul className="mt-3 space-y-3">
            {t.refs.map((r) => (
              <li key={r.cite} className="text-[14px] border-l-2 border-line pl-3">
                <p className="break-words">{r.cite}{r.doi && <> <span className="text-muted">doi:{r.doi}</span></>}</p>
                <p className="text-muted mt-0.5">{r.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="card" aria-labelledby="ev-insp">
        <h2 id="ev-insp" className="font-serif text-[20px] font-semibold">Inspiration and independence</h2>
        <p className="text-[15px] mt-1">Ruiz, Don Miguel. <em>The Four Agreements: A Practical Guide to Personal Freedom</em>. San Rafael, California: Amber-Allen Publishing, 1997. ISBN 1-878424-31-9.</p>
        <p className="text-[14px] text-muted mt-2">Equanim takes only broad themes from this book as a starting point. Every explanation, scenario, phrase and exercise is original writing; Equanim does not quote, summarise or reproduce the book. It is independent and not endorsed by, sponsored by or affiliated with the author, Amber-Allen Publishing or any related organisation.</p>
      </section>
      <p className="text-[13px] text-muted">DOIs are printed as text; Equanim makes no network requests. How these were checked: each DOI against its Crossref record, and books against the Open Library catalogue. See also <Link to="/about" className="underline underline-offset-2">About Equanim</Link>.</p>
    </article>
  );
}
