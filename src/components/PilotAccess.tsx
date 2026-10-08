import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkPilotAccess, currentPilotAccess, forgetPilotInvite, parsePilotInvite, setPilotInvite, subscribePilotAccess, type PilotAccess as Access } from '@/lib/pilot-access';

export default function PilotAccess({ onChange }: { onChange: () => void }) {
  const location = useLocation(); const navigate = useNavigate();
  const [input, setInput] = useState(''); const [access, setAccess] = useState<Access | null>(currentPilotAccess);
  const [checking, setChecking] = useState(false); const [message, setMessage] = useState('');
  const controller = useRef<AbortController | null>(null); const change = useRef(onChange); change.current = onChange;
  const imported = useRef('');
  async function verify(candidate?: string) {
    if (controller.current) return;
    const code = candidate || parsePilotInvite(input, window.location.origin);
    if (!code || !setPilotInvite(code)) { setMessage('Paste the full OFFKIN invitation link or its invitation code.'); return; }
    setInput(''); const abort = new AbortController(); controller.current = abort; setChecking(true); setMessage('');
    try { const result = await checkPilotAccess(abort.signal); if (!abort.signal.aborted) { setAccess(result); change.current(); } }
    catch (error) { if (!abort.signal.aborted) { setAccess(null); setMessage(error instanceof Error ? error.message : 'Pilot access could not be checked. Try again.'); change.current(); } }
    finally { if (controller.current === abort) { controller.current = null; setChecking(false); } }
  }
  useEffect(() => {
    if (!location.hash.startsWith('#invite=')) { imported.current = ''; return; }
    const fragmentKey = `${location.key}:${location.hash}`;
    const code = parsePilotInvite(location.hash, window.location.origin);
    // Strip every invitation navigation, including replacements in an existing tab.
    navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true });
    if (imported.current === fragmentKey) return;
    imported.current = fragmentKey;
    controller.current?.abort(); controller.current = null; setChecking(false);
    if (code) void verify(code); else setMessage('This invitation link is incomplete. Ask for the original link.');
  // The effect handles only navigation credentials, never ordinary proposal-share hashes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, location.key]);
  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, []);
  useEffect(() => subscribePilotAccess(() => setAccess(currentPilotAccess())), []);
  function forget() { controller.current?.abort(); controller.current = null; forgetPilotInvite(); setChecking(false); setAccess(null); setInput(''); setMessage('Invitation removed from this tab. Your saved concept and enquiry draft are unchanged.'); change.current(); }
  return <details className="op-pilot-access" open={Boolean(access || checking || message)}><summary>{access ? 'Your private pilot access' : 'Have a pilot invitation?'}</summary>
    {access ? <><p>{access.images_remaining} unused image slot{access.images_remaining === 1 ? '' : 's'} and {access.planners_remaining} revision-planning slot{access.planners_remaining === 1 ? '' : 's'}. Access expires {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(access.expires_at))} UTC.</p><p className="op-subtle">Each initial section and one details-only or packaging-only revision can be attempted once. These are fixed slots, not a retry pool. A failed or uncertain attempt may block later steps and needs recovery or review with OFFKIN. A broader redesign needs a separate agreement.</p>{access.blocked_attempt&&<p className="op-warning">An unfinished attempt is blocking new generation. Recover saved output from your proposal, or discuss it with OFFKIN. Unused slots cannot retry a consumed stage.</p>}<button className="op-secondary" onClick={forget}>Forget invitation on this tab</button></> : <form onSubmit={event => { event.preventDefault(); void verify(); }}><label htmlFor="pilot-invitation">Invitation link or code</label><div className="op-invite-input"><input id="pilot-invitation" type="password" autoComplete="off" spellCheck={false} maxLength={2048} value={input} onChange={event => setInput(event.target.value)} disabled={checking} aria-describedby="pilot-invitation-help"/><button className="op-secondary" disabled={checking || !input.trim()}>{checking ? 'Checking invitation…' : 'Open my pilot access'}</button></div><p id="pilot-invitation-help" className="op-subtle">The code stays in this tab’s memory. Keep your original invitation to reopen access after a reload. Checking access does not generate an image.</p></form>}
    {checking && <p role="status">Checking your private pilot access…</p>}{message && <p role="status">{message}</p>}
  </details>;
}
