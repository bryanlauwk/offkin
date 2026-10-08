import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BuildProposalRequest from './BuildProposalRequest';
import { webcrypto } from 'node:crypto';
import { exportFixture } from '@/test/proposal-export-fixture';
import { CONCEPT_PREVIEW_NOTE, proposalExportSnapshot } from '@/lib/proposal-export';
import * as exporter from '@/lib/proposal-export';

beforeEach(()=>{localStorage.clear();vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('createImageBitmap',vi.fn(async()=>({width:1,height:1,close:vi.fn()}))); });
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('Local quote and build-proposal handoff',()=>{
  it('downloads only a clearly labelled request draft with the chosen brief and optional context',async()=>{
    let blob:Blob|undefined;
    URL.createObjectURL=vi.fn((value:Blob)=>{blob=value;return 'blob:local-draft';});URL.revokeObjectURL=vi.fn();
    const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
    const fetch=vi.spyOn(globalThis,'fetch');
    const f=exportFixture();render(<BuildProposalRequest brief="Fallback" snapshot={proposalExportSnapshot(f.session,f.all)} hasPending/>);
    expect(screen.getByText(CONCEPT_PREVIEW_NOTE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));
    const dialog=within(screen.getByRole('dialog'));
    expect(dialog.getByText(/Nothing is sent automatically/)).toBeInTheDocument();
    expect(dialog.getByText(/unfinished sections/)).toBeInTheDocument();
    fireEvent.change(dialog.getByLabelText(/Desired quantity/),{target:{value:'50'}});
    fireEvent.change(dialog.getByLabelText(/Budget direction/),{target:{value:'To discuss in MYR'}});
    fireEvent.change(dialog.getByLabelText(/What matters most/),{target:{value:'Keep the layered silhouette'}});
    fireEvent.click(dialog.getByRole('button',{name:'Download full brief (HTML)'}));
    await waitFor(()=>expect(blob).toBeDefined());
    const exported=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsText(blob!);});
    expect(exported).toContain('Paper Finch');expect(exported).toContain('Desired quantity: 50');expect(exported).toContain('Keep the layered silhouette');expect(exported).toContain('has not been sent');
    expect(blob?.type).toBe('text/html;charset=utf-8');expect(click).toHaveBeenCalledOnce();expect(fetch).not.toHaveBeenCalled();
    expect(dialog.getByRole('status')).toHaveTextContent('It has not been sent, and no order has been placed');
  });
  it('closes on Escape and restores focus without creating a draft or making an inquiry',async()=>{
    URL.createObjectURL=vi.fn();render(<BuildProposalRequest brief="Local brief"/>);
    const trigger=screen.getByRole('button',{name:'Request a Quote & Build Proposal'});fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape',code:'Escape'});
    await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());expect(trigger).toHaveFocus();expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('keeps optional request fields bounded and waits for an explicit download click',()=>{
    URL.createObjectURL=vi.fn();render(<BuildProposalRequest brief="Local brief"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));
    expect(screen.getByLabelText(/Desired quantity/)).toHaveAttribute('maxlength','120');expect(screen.getByLabelText(/What matters most/)).toHaveAttribute('maxlength','2000');
    fireEvent.change(screen.getByLabelText(/Target timing/),{target:{value:'Next spring'}});expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('requires an explicit partial download when no images can be included',async()=>{
    URL.createObjectURL=vi.fn(()=> 'blob:partial');URL.revokeObjectURL=vi.fn();const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
    render(<BuildProposalRequest brief="Showcase-only text"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));fireEvent.click(screen.getByRole('button',{name:'Download full brief (HTML)'}));
    await screen.findByText(/Partial request: 0 of 4/);expect(click).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Download partial request draft'}));expect(click).toHaveBeenCalledOnce();
  });
  it('blocks repeated download clicks while preparing, then saves only once',async()=>{
    let resolve!:(value:exporter.PreparedRequest)=>void;const prepare=vi.spyOn(exporter,'prepareProposalRequest').mockImplementation(()=>new Promise(done=>{resolve=done;}));
    URL.createObjectURL=vi.fn(()=> 'blob:ready');URL.revokeObjectURL=vi.fn();const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
    render(<BuildProposalRequest brief="Saved direction"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));const download=screen.getByRole('button',{name:'Download full brief (HTML)'});fireEvent.click(download);fireEvent.click(download);
    expect(prepare).toHaveBeenCalledOnce();expect(download).toBeDisabled();expect(screen.getByLabelText(/Desired quantity/)).toBeDisabled();
    await act(async()=>resolve({html:'complete',missing:[],embedded:4}));expect(click).toHaveBeenCalledOnce();
  });
  it.each(['cancel','escape','unmount','new revision','generation starts'])('ignores late export completion after %s',async action=>{
    let resolve!:(value:exporter.PreparedRequest)=>void;const prepare=vi.spyOn(exporter,'prepareProposalRequest').mockImplementation(()=>new Promise(done=>{resolve=done;}));URL.createObjectURL=vi.fn();
    const view=render(<BuildProposalRequest brief="Old direction"/>);const trigger=screen.getByRole('button',{name:'Request a Quote & Build Proposal'});fireEvent.click(trigger);fireEvent.click(screen.getByRole('button',{name:'Download full brief (HTML)'}));
    const signal=prepare.mock.calls[0][3];
    if(action==='cancel')fireEvent.click(screen.getByRole('button',{name:'Cancel download'}));
    if(action==='escape')fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape',code:'Escape'});
    if(action==='unmount')view.unmount();
    if(action==='new revision')view.rerender(<BuildProposalRequest brief="New chosen direction"/>);
    if(action==='generation starts')view.rerender(<BuildProposalRequest brief="Old direction" disabled/>);
    expect(signal.aborted).toBe(true);await act(async()=>resolve({html:'stale',missing:[],embedded:4}));expect(URL.createObjectURL).not.toHaveBeenCalled();
    if(action==='escape'){await waitFor(()=>expect(trigger).toHaveFocus());fireEvent.click(trigger);expect(screen.queryByText(/Request draft downloaded/)).not.toBeInTheDocument();}
  });
  it('clears a prepared partial result when request notes change and requires a new snapshot',async()=>{
    vi.spyOn(exporter,'prepareProposalRequest').mockResolvedValue({html:'partial',missing:['Packaging missing'],embedded:3});URL.createObjectURL=vi.fn();
    render(<BuildProposalRequest brief="Direction"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));fireEvent.click(screen.getByRole('button',{name:'Download full brief (HTML)'}));await screen.findByRole('button',{name:'Download partial request draft'});
    fireEvent.change(screen.getByLabelText(/Target timing/),{target:{value:'June'}});expect(screen.queryByRole('button',{name:'Download partial request draft'})).not.toBeInTheDocument();expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('reports preparation failures and allows a retry without a false success',async()=>{
    const prepare=vi.spyOn(exporter,'prepareProposalRequest').mockRejectedValue(new Error('private URL must not leak'));URL.createObjectURL=vi.fn();
    render(<BuildProposalRequest brief="Direction"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));fireEvent.click(screen.getByRole('button',{name:'Download full brief (HTML)'}));await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('could not be prepared');expect(screen.getByRole('alert')).not.toHaveTextContent('private URL');expect(screen.queryByText(/Request draft downloaded/)).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Download full brief (HTML)'}));await waitFor(()=>expect(prepare).toHaveBeenCalledTimes(2));
  });

});

describe('Buyer-pilot enquiry flow', () => {
  const open = () => fireEvent.click(screen.getByRole('button', { name: 'Plan my project' }));
  const details = () => fireEvent.click(screen.getByRole('button', { name: 'Continue to project details' }));
  it('progressively collects an optional project, preserves it on back, close, remount and clear', async () => {
    const view = render(<BuildProposalRequest compact projectEntry brief="New enquiry" />); open();
    expect(screen.queryByLabelText(/Desired quantity/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Personal commission' }));
    fireEvent.change(screen.getByLabelText(/Project name/), { target: { value: 'Birthday scene' } });
    fireEvent.change(screen.getByLabelText(/Your idea and who/), { target: { value: 'A gift for a friend' } }); details();
    fireEvent.change(screen.getByLabelText(/Desired quantity/), { target: { value: 'One' } });
    fireEvent.change(screen.getByLabelText(/Preferred contact/), { target: { value: 'buyer@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Back to the idea' }));
    expect(screen.getByLabelText(/Project name/)).toHaveValue('Birthday scene');
    fireEvent.click(screen.getByRole('button', { name: 'Save & close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    view.unmount(); render(<BuildProposalRequest compact projectEntry brief="New enquiry" />); open();
    expect(screen.getByRole('radio', { name: 'Personal commission' })).toBeChecked();
    expect(screen.getByLabelText(/Project name/)).toHaveValue('Birthday scene'); details();
    expect(screen.getByLabelText(/Preferred contact/)).toHaveValue('buyer@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Clear saved enquiry draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep draft' })); expect(screen.getByLabelText(/Desired quantity/)).toHaveValue('One');
    fireEvent.click(screen.getByRole('button', { name: 'Clear saved enquiry draft' })); fireEvent.click(screen.getByRole('button', { name: 'Clear draft now' }));
    expect(screen.getByLabelText(/Preferred contact/)).toHaveValue(''); expect(screen.getByLabelText(/Desired quantity/)).toHaveValue('');
  });
  it('shows the exact WhatsApp destination and reviewed summary without sending or attaching anything', () => {
    const fetch = vi.spyOn(globalThis, 'fetch'); render(<BuildProposalRequest compact projectEntry brief="Private brief" inspiration="A24: Cinema study" />); open();
    fireEvent.change(screen.getByLabelText(/Brand or company/), { target: { value: 'Finch' } }); details();
    fireEvent.change(screen.getByLabelText(/Budget direction/), { target: { value: 'MYR 8000 total' } });
    fireEvent.change(screen.getByLabelText(/What matters most/), { target: { value: 'Do not place this private note in a URL' } });
    expect(screen.queryByRole('link', { name: /Open WhatsApp/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Review WhatsApp enquiry' }));
    const link = screen.getByRole('link', { name: 'Open WhatsApp with this message' }); const url = new URL(link.getAttribute('href')!);
    expect(url.pathname).toBe('/60149303546'); expect(url.searchParams.get('text')).toContain('MYR 8000 total'); expect(url.searchParams.get('text')).toContain('Finch'); expect(url.searchParams.get('text')).not.toContain('private note');
    expect(screen.getByText(/Recipient: \+60 14-930 3546/)).toBeInTheDocument(); expect(screen.getByText(/Images and files are not attached automatically/)).toBeInTheDocument();
    expect(link).toHaveAttribute('rel', 'noopener noreferrer'); expect(link).toHaveAttribute('referrerpolicy', 'no-referrer'); expect(fetch).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Target timing/), { target: { value: 'June' } }); expect(screen.queryByRole('link', { name: /Open WhatsApp/ })).not.toBeInTheDocument();
  });
  it('downloads an intentional text-only enquiry without suggesting four missing images or requiring contact', async () => {
    let blob: Blob | undefined; URL.createObjectURL = vi.fn(value => { blob = value; return 'blob:brief'; }); URL.revokeObjectURL = vi.fn(); vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<BuildProposalRequest compact projectEntry brief="New enquiry" />); open(); details(); fireEvent.click(screen.getByRole('button', { name: 'Download full brief (HTML)' }));
    await waitFor(() => expect(blob).toBeDefined());
    const html = await new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsText(blob!); });
    expect(html).toContain('Text-only project brief. No generated images are included.'); expect(html).not.toContain('PARTIAL REQUEST'); expect(html).not.toContain('All 4 concept images'); expect(html).toContain('has not been sent');
  });
  it('warns on failed local saves and does not close as though saving succeeded', () => {
    render(<BuildProposalRequest compact projectEntry brief="New enquiry" />); open();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    fireEvent.change(screen.getByLabelText(/Brand or company/), { target: { value: 'Not lost yet' } });
    expect(screen.getByRole('alert')).toHaveTextContent('could not save the draft'); fireEvent.click(screen.getByRole('button', { name: 'Save & close' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument(); expect(screen.getByLabelText(/Brand or company/)).toHaveValue('Not lost yet');
  });
  it('keeps inspiration separate from the buyer brand and does not mutate the saved proposal', () => {
    localStorage.setItem('offkin:proposal:fixture', 'accepted work'); render(<BuildProposalRequest compact projectEntry brief="New enquiry" inspiration="Tesla: Clean energy" />); open();
    expect(screen.getByLabelText(/Brand or company/)).toHaveValue(''); expect(screen.getByText(/Inspiration: Tesla/)).toBeInTheDocument(); expect(localStorage.getItem('offkin:proposal:fixture')).toBe('accepted work');
  });
});

it('keeps an unsaved in-memory draft through Escape and repeated reopening after storage failure', async () => {
  render(<BuildProposalRequest compact projectEntry brief="New enquiry" />); fireEvent.click(screen.getByRole('button', { name: 'Plan my project' }));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
  fireEvent.change(screen.getByLabelText(/Brand or company/), { target: { value: 'Keep this unsaved idea' } });
  for (let i = 0; i < 2; i++) {
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }); await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Plan my project' })); expect(screen.getByLabelText(/Brand or company/)).toHaveValue('Keep this unsaved idea'); expect(screen.getByRole('alert')).toHaveTextContent('could not save');
  }
});
it('prevents draft clearing during export and invalidates WhatsApp review on replacement context', async () => {
  let resolve!:(value:exporter.PreparedRequest)=>void; vi.spyOn(exporter,'prepareProposalRequest').mockImplementation(()=>new Promise(done=>{resolve=done;})); URL.createObjectURL=vi.fn();
  const view=render(<BuildProposalRequest brief="Current concept" initialContext={{company:'Current Brand',projectType:'Personal commission'}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));
  fireEvent.click(screen.getByRole('button',{name:'Review WhatsApp enquiry'})); expect(new URL(screen.getByRole('link',{name:/Open WhatsApp/}).getAttribute('href')!).searchParams.get('text')).toContain('Current Brand');
  view.rerender(<BuildProposalRequest brief="Replacement concept" initialContext={{company:'New Brand'}}/>); expect(screen.queryByRole('link',{name:/Open WhatsApp/})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Clear saved enquiry draft'})); fireEvent.click(screen.getByRole('button',{name:'Download full brief (HTML)'}));
  expect(screen.getByRole('button',{name:'Clear draft now'})).toBeDisabled(); fireEvent.click(screen.getByRole('button',{name:'Cancel download'}));
  fireEvent.click(screen.getByRole('button',{name:'Clear draft now'})); await act(async()=>resolve({html:'stale',missing:[],embedded:4})); expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('saves the displayed collectible as an ordinary image without sending or automatically attaching it',async()=>{
  let blob:Blob|undefined;URL.createObjectURL=vi.fn(value=>{blob=value;return 'blob:hero';});URL.revokeObjectURL=vi.fn();const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});const f=exportFixture();
  render(<BuildProposalRequest brief="Fallback" snapshot={proposalExportSnapshot(f.session,f.all)}/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));expect(URL.createObjectURL).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Save collectible image'}));await waitFor(()=>expect(blob).toBeDefined());expect(blob?.type).toBe('image/png');expect(click).toHaveBeenCalledOnce();expect(screen.getByRole('status')).toHaveTextContent('Image download started');expect(screen.getByRole('status')).toHaveTextContent('not attached or sent automatically');
});
it.each(['cancel','escape','new revision'])('never downloads a stale collectible after %s',async action=>{
  let resolve!:(value:exporter.PreparedCollectibleImage)=>void;const prepare=vi.spyOn(exporter,'prepareCollectibleImage').mockImplementation(()=>new Promise(done=>{resolve=done;}));URL.createObjectURL=vi.fn();const f=exportFixture();const snapshot=proposalExportSnapshot(f.session,f.all);
  const view=render(<BuildProposalRequest brief="Original" snapshot={snapshot}/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));const save=screen.getByRole('button',{name:'Save collectible image'});fireEvent.click(save);fireEvent.click(save);expect(prepare).toHaveBeenCalledOnce();
  if(action==='cancel')fireEvent.click(screen.getByRole('button',{name:'Cancel download'}));if(action==='escape')fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});if(action==='new revision')view.rerender(<BuildProposalRequest brief="New" snapshot={{...snapshot,key:'different'}}/>);
  expect(prepare.mock.calls[0][1].aborted).toBe(true);await act(async()=>resolve({bytes:new Uint8Array([1]),mime:'image/png',filename:'hero.png',sourceHash:'hash'}));expect(URL.createObjectURL).not.toHaveBeenCalled();
});
it('explains a failed image save and leaves the reviewed text handoff available',async()=>{
  vi.spyOn(exporter,'prepareCollectibleImage').mockRejectedValue(new Error('private image URL must not leak'));URL.createObjectURL=vi.fn();const f=exportFixture();render(<BuildProposalRequest brief="Current" snapshot={proposalExportSnapshot(f.session,f.all)}/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));fireEvent.click(screen.getByRole('button',{name:'Save collectible image'}));
  await screen.findByRole('alert');expect(screen.getByRole('alert')).toHaveTextContent('knowing no image is attached');expect(screen.getByRole('alert')).not.toHaveTextContent('private image URL');fireEvent.click(screen.getByRole('button',{name:'Review WhatsApp enquiry'}));expect(screen.getByRole('link',{name:'Open WhatsApp with this message'})).toBeEnabled();expect(URL.createObjectURL).not.toHaveBeenCalled();
});
