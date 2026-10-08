import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkPilotAccess, currentPilotAccess, forgetPilotInvite, isPilotAccess, parsePilotInvite, pilotInviteHeaders, pilotInviteTokenPresent, rememberPilotAccess, setPilotInvite } from './pilot-access';
const token='a'.repeat(43);
const access={version:'offkin-pilot-v1',authorized:true,images_remaining:5,planners_remaining:1,expires_at:'2099-01-01T00:00:00Z'};
beforeEach(()=>{forgetPilotInvite();localStorage.clear();sessionStorage.clear();vi.stubEnv('VITE_SUPABASE_URL','https://test.invalid');vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','public-key');});
afterEach(()=>{forgetPilotInvite();vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('Memory-only pilot credential boundary',()=>{
  it('accepts only a full code or same-origin fragment link without retaining URLs',()=>{
    expect(parsePilotInvite(token,'https://offkin.example')).toBe(token);
    expect(parsePilotInvite(`https://offkin.example/?pilot=1#invite=${token}`,'https://offkin.example')).toBe(token);
    expect(parsePilotInvite(`#invite=${token}`,'https://offkin.example')).toBe(token);
    for(const input of [`https://evil.example/#invite=${token}`,`/?invite=${token}`,token.slice(1),`${token}&secret=extra`]) expect(parsePilotInvite(input,'https://offkin.example')).toBeNull();
  });
  it('never writes credentials to localStorage or sessionStorage and clears memory explicitly',()=>{
    expect(setPilotInvite(token)).toBe(true);expect(pilotInviteTokenPresent()).toBe(true);expect(pilotInviteHeaders()).toEqual({'x-offkin-invite':token});
    expect(localStorage.length).toBe(0);expect(sessionStorage.length).toBe(0);rememberPilotAccess(access);expect(currentPilotAccess()).toEqual(access);
    forgetPilotInvite();expect(pilotInviteHeaders()).toEqual({});expect(currentPilotAccess()).toBeNull();expect(setPilotInvite('bad')).toBe(false);
  });
  it.each([{...access,version:'old'},{...access,authorized:false},{...access,images_remaining:6},{...access,planners_remaining:2},{...access,images_remaining:-1},{...access,expires_at:'2000-01-01'},null])('fails closed on missing, stale or invalid access %j',value=>{
    expect(isPilotAccess(value)).toBe(false);setPilotInvite(token);expect(rememberPilotAccess(value)).toBeNull();
  });
  it('checks an invitation read-only with the dedicated header and no request body',async()=>{
    setPilotInvite(token);const fetch=vi.fn(async(_url:string,_init:RequestInit)=>new Response(JSON.stringify({ready:true,pilot_access:access})));vi.stubGlobal('fetch',fetch);
    await expect(checkPilotAccess(new AbortController().signal)).resolves.toEqual(access);expect(fetch).toHaveBeenCalledOnce();expect(fetch.mock.calls[0][1]).not.toHaveProperty('body');expect(fetch.mock.calls[0][1]).toMatchObject({headers:{'x-offkin-invite':token},credentials:'omit',referrerPolicy:'no-referrer'});expect(String(fetch.mock.calls[0][0])).not.toContain(token);
  });
  it('rejects an old backend and avoids displaying returned raw credentials or errors',async()=>{
    setPilotInvite(token);vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({ready:true,error:`secret ${token}`}))));
    await expect(checkPilotAccess(new AbortController().signal)).rejects.toThrow('could not be verified');expect(currentPilotAccess()).toBeNull();
  });
  it('ignores a late access response after the invitation is forgotten',async()=>{
    let resolve!:(value:Response)=>void;setPilotInvite(token);vi.stubGlobal('fetch',vi.fn(()=>new Promise(done=>{resolve=done;})));
    const promise=checkPilotAccess(new AbortController().signal);forgetPilotInvite();resolve(new Response(JSON.stringify({pilot_access:access})));
    await expect(promise).rejects.toThrow('Cancelled');expect(currentPilotAccess()).toBeNull();
  });
});
