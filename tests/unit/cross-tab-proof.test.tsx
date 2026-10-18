/**
 * Before/after proof for the cross-tab race (docs/cross-tab-fix-brief.md). These three tests FAILED on the
 * code before the fix (commit recorded in docs/audit.md) and must pass after it. They use only the public store
 * API, so they run unchanged against both versions.
 */
import { describe, expect, it } from 'vitest';
import { deliver, journalTexts, openNewTab, openOldTab, settle, v1Seed } from './helpers/tabs';

const draft = (text: string) => ({ type: 'free' as const, answers: { text }, domain: null, scenarioId: null, themes: [] });
const LEGACY = 'equanim:data';

describe('cross-tab race: Equanim 1.0 tab + 1.1 tab (proof)', () => {
  it('1.0 tab saves while a 1.1 tab upgrades, notifications delivered: nothing is lost', async () => {
    localStorage.setItem(LEGACY, JSON.stringify(v1Seed()));
    const a = openOldTab(); // 1.0 tab already open
    const b = await openNewTab(); // 1.1 tab opens and upgrades
    a.addJournal('A1');
    await deliver(LEGACY);
    b.store().createJournal(draft('B1'));
    await settle();
    a.addJournal('A2'); // 1.0 writes its whole, older copy again
    await deliver(LEGACY);
    b.store().createJournal(draft('B2'));
    await settle();
    b.unmount();
    const c = await openNewTab();
    expect(journalTexts(c.store())).toEqual(['A1', 'A2', 'B1', 'B2', 'seed']);
  });

  it('notifications missed entirely: nothing is lost', async () => {
    localStorage.setItem(LEGACY, JSON.stringify(v1Seed()));
    const a = openOldTab();
    const b = await openNewTab();
    a.addJournal('A1'); // no storage event reaches tab B (suspended tab)
    b.store().createJournal(draft('B1'));
    await settle();
    a.addJournal('A2');
    b.store().createJournal(draft('B2'));
    await settle();
    b.unmount();
    const c = await openNewTab();
    expect(journalTexts(c.store())).toEqual(['A1', 'A2', 'B1', 'B2', 'seed']);
  });

  it('a 1.0 tab opened after the upgrade cannot wipe upgraded data', async () => {
    localStorage.setItem(LEGACY, JSON.stringify(v1Seed()));
    const b = await openNewTab();
    b.store().createJournal(draft('B1'));
    await settle();
    const a = openOldTab(); // e.g. an old cached copy of 1.0
    a.addJournal('A1');
    await deliver(LEGACY);
    b.unmount();
    const c = await openNewTab();
    expect(journalTexts(c.store())).toEqual(['A1', 'B1', 'seed']);
  });
});
