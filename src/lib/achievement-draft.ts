export type AchievementDraft = { version: 1; mode: 'achievement' | 'quest'; type: 'personal' | 'business'; milestone: string; name: string; date: string; details: string };
export const ACHIEVEMENT_DRAFT_KEY = 'offkin:achievement:v1';
export const emptyAchievementDraft = (mode: AchievementDraft['mode'] = 'achievement'): AchievementDraft => ({ version: 1, mode, type: 'personal', milestone: '', name: '', date: '', details: '' });
export function validAchievementDraft(value: unknown): value is AchievementDraft {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && ['achievement', 'quest'].includes(String(v.mode)) && ['personal', 'business'].includes(String(v.type)) &&
    typeof v.milestone === 'string' && v.milestone.length <= 200 && typeof v.name === 'string' && v.name.length <= 120 &&
    typeof v.date === 'string' && v.date.length <= 10 && typeof v.details === 'string' && v.details.length <= 500;
}
export function loadAchievementDraft(): AchievementDraft | null {
  try { const draft: unknown = JSON.parse(localStorage.getItem(ACHIEVEMENT_DRAFT_KEY) || 'null'); return validAchievementDraft(draft) ? draft : null; } catch { return null; }
}
export function saveAchievementDraft(draft: AchievementDraft): boolean {
  if (!validAchievementDraft(draft)) return false;
  try { localStorage.setItem(ACHIEVEMENT_DRAFT_KEY, JSON.stringify(draft)); return true; } catch { return false; }
}
export function achievementNarration(draft: AchievementDraft): string {
  const who = draft.name.trim() || (draft.type === 'business' ? 'Our team' : 'I');
  const milestone = draft.milestone.trim();
  return draft.mode === 'quest' ? `${who} is working toward: ${milestone}. This collectible would celebrate the moment that goal becomes a real achievement.` : `${who} reached a milestone: ${milestone}. A collectible and illustrated story card would preserve this chapter${draft.date ? `, dated ${draft.date}` : ''}.`;
}
export function achievementBrief(draft: AchievementDraft): string {
  return `OFFKIN — ${draft.mode === 'quest' ? 'Future-goal plan' : 'Achievement concept brief'}\nType: ${draft.type}\nMilestone: ${draft.milestone}\nName / company: ${draft.name || 'Not supplied'}\nDate: ${draft.date || 'Not supplied'}\nDetails: ${draft.details || 'Not supplied'}\n\nStory-card narration (draft):\n${achievementNarration(draft)}\n\nIllustrative specification only. No custom images generated. Not CAD or print-ready. Not submitted; no quote, payment or order. Physical feasibility, design and pricing require technical review.\n`;
}