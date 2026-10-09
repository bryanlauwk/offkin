import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy, Download, Flag, Building2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { achievementBrief, achievementNarration, emptyAchievementDraft, loadAchievementDraft, saveAchievementDraft, type AchievementDraft } from '@/lib/achievement-draft';
import runner from '@/assets/achievements/offkin-runner.jpg';
import store from '@/assets/achievements/offkin-first-store.jpg';

export default function AchievementWizard({ mode, initialType = 'personal', onClose }: { mode: AchievementDraft['mode']; initialType?: AchievementDraft['type']; onClose: () => void }) {
  const [draft, setDraft] = useState<AchievementDraft>(() => ({ ...emptyAchievementDraft(mode), type: initialType }));
  const [saved] = useState(loadAchievementDraft);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const quest = draft.mode === 'quest';
  function update(key: keyof AchievementDraft, value: string) { setDraft(current => ({ ...current, [key]: value })); setStatus(''); setCopied(false); }
  function save() { setStatus(saveAchievementDraft(draft) ? 'Saved on this device only. Nothing has been sent.' : 'Device storage is unavailable. Download your brief to keep it.'); }
  function download() { const url = URL.createObjectURL(new Blob([achievementBrief(draft)], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'OFFKIN-achievement-brief.txt'; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
  async function copy() { try { await navigator.clipboard.writeText(achievementNarration(draft)); setCopied(true); } catch { setStatus('Copy is unavailable. Select the narration below to copy it.'); } }
  const chips = draft.type === 'personal' ? ['My first marathon', 'Graduation day', 'A career milestone', 'Finished a creative project'] : ['Opened our first store', 'A merchandise milestone', 'Employee recognition', 'A team achievement'];
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="ah-wizard ah-theme">
    <div className="ah-eyebrow"><Flag size={14} /> {quest ? 'A future chapter' : 'A milestone worth keeping'} <span>{step} / 3</span></div>
    <DialogTitle>{step === 1 ? 'Whose story are we celebrating?' : step === 2 ? quest ? 'What are you working toward?' : 'What did you achieve?' : quest ? 'A reward to look forward to.' : 'Your story, taking shape.'}</DialogTitle>
    <DialogDescription>{step === 1 ? 'Personal moments. Business milestones. Both deserve a little magic.' : step === 2 ? 'One sentence is enough. The rest is optional.' : 'A written preview specification with an illustrative example — not newly generated artwork.'}</DialogDescription>
    {step === 1 && <><div className="ah-type-options">
      <Button variant="outline" aria-pressed={draft.type === 'personal'} onClick={() => { update('type', 'personal'); update('milestone', ''); }}><UserRound /><strong>Personal</strong><span>A chapter in your life</span></Button>
      <Button variant="outline" aria-pressed={draft.type === 'business'} onClick={() => { update('type', 'business'); update('milestone', ''); }}><Building2 /><strong>Business</strong><span>A chapter in your brand</span></Button>
    </div>{saved && <Button variant="link" className="ah-text-action" onClick={() => { setDraft(saved); setStep(saved.milestone.trim() ? 3 : 2); }}>Resume my saved {saved.mode === 'quest' ? 'goal' : 'milestone'}</Button>}
    <Button className="ah-primary" onClick={() => setStep(2)}>Continue <ArrowRight /></Button></>}
    {step === 2 && <form onSubmit={event => { event.preventDefault(); if (draft.milestone.trim()) setStep(3); }}>
      <label htmlFor="achievement-milestone">{quest ? 'Your future goal' : 'Your achievement'} <Textarea id="achievement-milestone" required maxLength={200} value={draft.milestone} onChange={e => update('milestone', e.target.value)} placeholder={quest ? 'I want to finish my first marathon…' : 'I finished my first marathon…'} autoFocus /></label>
      <div className="ah-chips">{chips.map(chip => <Button key={chip} type="button" variant="outline" onClick={() => update('milestone', quest ? `Work toward: ${chip}` : chip)}>{chip}</Button>)}</div>
      <details className="ah-details"><summary>Add a name, date or details <span>Optional</span></summary><div className="ah-fields"><label htmlFor="achievement-name">{draft.type === 'personal' ? 'Name' : 'Company / team'}<Input id="achievement-name" maxLength={120} value={draft.name} onChange={e => update('name', e.target.value)} /></label><label htmlFor="achievement-date">{quest ? 'Target date' : 'Milestone date'}<Input id="achievement-date" type="date" value={draft.date} onChange={e => update('date', e.target.value)} /></label><label htmlFor="achievement-details">What makes this meaningful?<Textarea id="achievement-details" maxLength={500} value={draft.details} onChange={e => update('details', e.target.value)} /></label></div></details>
      <div className="ah-wizard-actions"><Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft /> Back</Button><Button type="submit" className="ah-primary" disabled={!draft.milestone.trim()}>Preview my direction <ArrowRight /></Button></div>
    </form>}
    {step === 3 && <><div className="ah-wizard-preview"><figure><img src={draft.type === 'business' ? store : runner} width={1024} height={1024} alt={draft.type === 'business' ? 'Inspirational shop miniature and illustrated card, not your generated design' : 'Inspirational runner figure and illustrated card, not your generated design'} /><figcaption>Example artwork · not your custom collectible</figcaption></figure><div><span className="ah-eyebrow">{quest ? 'Future reward direction' : 'Your collectible brief'}</span><h3>{draft.milestone}</h3><p>{draft.type === 'business' ? 'A signature object or miniature that represents the milestone, paired with its illustrated story.' : 'A character or symbolic miniature that represents this chapter, paired with its illustrated story.'}</p>{draft.details && <p className="ah-supplied">Your detail: {draft.details}</p>}</div></div>
      <div className="ah-narration"><div><span>Story-card narration · editable draft</span><Button size="icon" variant="ghost" aria-label="Copy story-card narration" onClick={() => void copy()}>{copied ? <Check /> : <Copy />}</Button></div><p>{achievementNarration(draft)}</p></div>
      {quest && <div className="ah-goal-route"><span><Flag size={16} /> Set the intention</span><ArrowRight size={16} /><span>Reach your milestone</span><ArrowRight size={16} /><span>Celebrate it</span><p>A planning metaphor only. No activity tracking or automatic reward unlocks. When you finish, return and create an achievement brief.</p></div>}
      <details className="ah-details" open><summary>How to turn this into a collectible</summary><p>This brief stays on your device. Custom generation is not part of this preview. Physical production needs a saved concept, technical review and an agreed price; an image is not print-ready.</p><p>{draft.type === 'business' ? 'Continue to the existing brand studio and use your brief as context. If generation is unavailable, keep your brief or open an existing saved proposal.' : 'Personal custom generation and direct inquiry from this brief are not connected yet. Keep your brief; if you already have a complete saved concept, its proposal form can send a request for owner review.'}</p><div className="ah-inline-actions">{draft.type === 'business' && <Button asChild variant="outline"><Link to="/?studio=brand">Open brand studio <ArrowRight /></Link></Button>}<Button asChild variant="link"><Link to="/?proposal=1">Open saved proposals <ArrowRight /></Link></Button></div></details>
      <div className="ah-wizard-actions"><Button variant="ghost" onClick={() => { setStep(2); setStatus(''); }}><ArrowLeft /> Edit</Button><Button variant="outline" onClick={download}><Download /> Download brief</Button><Button className="ah-primary" onClick={save}>Save {quest ? 'goal' : 'brief'} locally</Button></div>
    </>}
    <p className="ah-status" role="status">{status || 'No sign-up, payment or order. Your words stay here unless you choose another flow.'}</p>
  </DialogContent></Dialog>;
}