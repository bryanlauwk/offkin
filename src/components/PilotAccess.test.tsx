import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PilotAccess from './PilotAccess';
import { forgetPilotInvite, pilotInviteTokenPresent } from '@/lib/pilot-access';
const token='a'.repeat(43);const access={version:'offkin-pilot-v1',authorized:true,images_remaining:5,planners_remaining:1,expires_at:'2099-01-01T00:00:00Z'};
function InviteNavigation(){const navigate=useNavigate();return <button onClick={()=>navigate('/?pilot=1#invite='+ 'b'.repeat(43))}>Open another invitation</button>;}
function Location(){const location=useLocation();return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>;}
function mount(route='/'){return render(<MemoryRouter initialEntries={[route]}><PilotAccess onChange={vi.fn()}/><Location/><InviteNavigation/></MemoryRouter>);}
beforeEach(()=>{forgetPilotInvite();localStorage.clear();vi.stubEnv('VITE_SUPABASE_URL','https://test.invalid');vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','public-key');});
afterEach(()=>{cleanup();forgetPilotInvite();vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('Pilot invitation entry',()=>{
  it('does not check or generate on typing and exposes an explicit read-only access action',async()=>{
    const fetch=vi.fn(async()=>new Response(JSON.stringify({pilot_access:access})));vi.stubGlobal('fetch',fetch);mount();
    fireEvent.click(screen.getByText('Have a preview invitation?'));fireEvent.change(screen.getByLabelText('Invitation link or code'),{target:{value:token}});expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Open my pilot access'}));await screen.findByText(/5 unused image slots and 1 revision-planning slot/);expect(fetch).toHaveBeenCalledOnce();expect(screen.queryByDisplayValue(token)).not.toBeInTheDocument();expect(localStorage.length).toBe(0);
    fireEvent.click(screen.getByText('Preview access · active'));fireEvent.click(screen.getByRole('button',{name:'Forget invitation on this tab'}));expect(pilotInviteTokenPresent()).toBe(false);expect(screen.getByText(/Invitation removed from this tab/)).toBeInTheDocument();
  });
  it('consumes an invite fragment, removes it from router history and never stores it',async()=>{
    const fetch=vi.fn(async()=>new Response(JSON.stringify({pilot_access:access})));vi.stubGlobal('fetch',fetch);mount(`/?pilot=1#invite=${token}`);
    await waitFor(()=>expect(screen.getByTestId('location')).toHaveTextContent('/?pilot=1'));expect(screen.getByTestId('location')).not.toHaveTextContent('#invite=');await screen.findByText('Preview access · active');expect(fetch).toHaveBeenCalledOnce();expect(localStorage.length).toBe(0);
  });
  it('leaves ordinary proposal-share fragments unchanged and never consumes their contents',()=>{
    const fetch=vi.fn();vi.stubGlobal('fetch',fetch);mount('/#proposal=public-snapshot');expect(screen.getByTestId('location')).toHaveTextContent('#proposal=public-snapshot');expect(fetch).not.toHaveBeenCalled();expect(pilotInviteTokenPresent()).toBe(false);
  });
  it('leaves the project usable after an invalid, expired or unavailable invite',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({error:'expired'}),{status:403})));mount();fireEvent.click(screen.getByText('Have a preview invitation?'));fireEvent.change(screen.getByLabelText('Invitation link or code'),{target:{value:token}});fireEvent.click(screen.getByRole('button',{name:'Open my pilot access'}));await screen.findByText(/This invitation could not be verified/);expect(screen.getByText(/You can still plan your project/)).toBeInTheDocument();
  });
});

it('consumes a second invitation navigation in the same mounted tab and removes that fragment too',async()=>{
  const fetch=vi.fn(async(_url:string,_init:RequestInit)=>new Response(JSON.stringify({pilot_access:access})));vi.stubGlobal('fetch',fetch);mount(`/?pilot=1#invite=${token}`);
  await screen.findByText('Preview access · active');await waitFor(()=>expect(screen.getByTestId('location')).not.toHaveTextContent('#invite='));
  fireEvent.click(screen.getByRole('button',{name:'Open another invitation'}));await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
  expect(fetch.mock.calls[1][1].headers).toMatchObject({'x-offkin-invite':'b'.repeat(43)});expect(screen.getByTestId('location')).not.toHaveTextContent('#invite=');expect(localStorage.length).toBe(0);
});
