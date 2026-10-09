import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACHIEVEMENT_DRAFT_KEY, achievementBrief, achievementNarration, emptyAchievementDraft, loadAchievementDraft, saveAchievementDraft } from './achievement-draft';
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
describe('Local achievement planning', () => {
  it('keeps a future goal aspirational rather than claiming completion', () => {
    const draft = { ...emptyAchievementDraft('quest'), milestone: 'Run my first marathon', name: 'Alex' };
    expect(achievementNarration(draft)).toBe('Alex is working toward: Run my first marathon. This collectible would celebrate the moment that goal becomes a real achievement.');
  });
  it('preserves personal and business fields locally without creating concept IDs', () => {
    const draft = { ...emptyAchievementDraft(), type: 'business' as const, milestone: 'Opened our first store', name: 'STIVE', details: 'Owner-supplied milestone', date: '2026-10-09' };
    expect(saveAchievementDraft(draft)).toBe(true); expect(loadAchievementDraft()).toEqual(draft);
    expect(JSON.parse(localStorage.getItem(ACHIEVEMENT_DRAFT_KEY) || '{}')).not.toHaveProperty('assetIds');
  });
  it('rejects unsupported and oversized stored drafts', () => {
    localStorage.setItem(ACHIEVEMENT_DRAFT_KEY, JSON.stringify({ ...emptyAchievementDraft(), version: 2 })); expect(loadAchievementDraft()).toBeNull();
    expect(saveAchievementDraft({ ...emptyAchievementDraft(), milestone: 'x'.repeat(201) })).toBe(false);
  });
  it('does not report saved progress when device storage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Unavailable'); });
    expect(saveAchievementDraft(emptyAchievementDraft('quest'))).toBe(false);
  });
  it('exports supplied facts without claiming submission or production readiness', () => {
    const brief = achievementBrief({ ...emptyAchievementDraft(), milestone: 'Graduated', details: '<b>Exact supplied detail</b>' });
    expect(brief).toContain('<b>Exact supplied detail</b>'); expect(brief).toContain('Not submitted; no quote, payment or order.');
  });
});