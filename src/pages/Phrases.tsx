import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PHRASE_BANKS } from '../data/programme';
import { DOMAIN_LIST } from '../data/domains';
import { PhraseBankCard } from '../components/journey';
import { PageHeader } from '../components/ui';

export function Phrases() {
  const { hash } = useLocation();
  useEffect(() => {
    const id = hash.replace('#', '');
    if (id) document.getElementById(id)?.scrollIntoView();
  }, [hash]);
  return (
    <div>
      <PageHeader eyebrow="Keep practising" title="Phrase banks" back="/library"
        intro="Short words to have ready for common moments. Say one quietly aloud, or adapt it to your own voice." />
      {DOMAIN_LIST.map((d) => (
        <section key={d.id} aria-label={d.name} className="mb-6">
          <h2 className="eyebrow mb-3">{d.name}</h2>
          <div className="space-y-3">
            {PHRASE_BANKS.filter((b) => b.domain === d.id).map((b) => <div key={b.id} id={b.id} className="scroll-mt-20"><PhraseBankCard id={b.id} /></div>)}
          </div>
        </section>
      ))}
    </div>
  );
}
