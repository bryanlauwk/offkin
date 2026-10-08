import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BuildProposalRequest from './BuildProposalRequest';
import { webcrypto } from 'node:crypto';
import { exportFixture } from '@/test/proposal-export-fixture';
import { CONCEPT_PREVIEW_NOTE, proposalExportSnapshot } from '@/lib/proposal-export';
import * as exporter from '@/lib/proposal-export';

beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('createImageBitmap',vi.fn(async()=>({width:1,height:1,close:vi.fn()}))); });
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
    fireEvent.click(dialog.getByRole('button',{name:'Download request draft'}));
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
    render(<BuildProposalRequest brief="Showcase-only text"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));fireEvent.click(screen.getByRole('button',{name:'Download request draft'}));
    await screen.findByText(/Partial request: 0 of 4/);expect(click).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Download partial request draft'}));expect(click).toHaveBeenCalledOnce();
  });
  it('blocks repeated download clicks while preparing, then saves only once',async()=>{
    let resolve!:(value:exporter.PreparedRequest)=>void;const prepare=vi.spyOn(exporter,'prepareProposalRequest').mockImplementation(()=>new Promise(done=>{resolve=done;}));
    URL.createObjectURL=vi.fn(()=> 'blob:ready');URL.revokeObjectURL=vi.fn();const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
    render(<BuildProposalRequest brief="Saved direction"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));const download=screen.getByRole('button',{name:'Download request draft'});fireEvent.click(download);fireEvent.click(download);
    expect(prepare).toHaveBeenCalledOnce();expect(download).toBeDisabled();expect(screen.getByLabelText(/Desired quantity/)).toBeDisabled();
    await act(async()=>resolve({html:'complete',missing:[],embedded:4}));expect(click).toHaveBeenCalledOnce();
  });
  it.each(['cancel','escape','unmount','new revision','generation starts'])('ignores late export completion after %s',async action=>{
    let resolve!:(value:exporter.PreparedRequest)=>void;const prepare=vi.spyOn(exporter,'prepareProposalRequest').mockImplementation(()=>new Promise(done=>{resolve=done;}));URL.createObjectURL=vi.fn();
    const view=render(<BuildProposalRequest brief="Old direction"/>);const trigger=screen.getByRole('button',{name:'Request a Quote & Build Proposal'});fireEvent.click(trigger);fireEvent.click(screen.getByRole('button',{name:'Download request draft'}));
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
    render(<BuildProposalRequest brief="Direction"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));fireEvent.click(screen.getByRole('button',{name:'Download request draft'}));await screen.findByRole('button',{name:'Download partial request draft'});
    fireEvent.change(screen.getByLabelText(/Target timing/),{target:{value:'June'}});expect(screen.queryByRole('button',{name:'Download partial request draft'})).not.toBeInTheDocument();expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('reports preparation failures and allows a retry without a false success',async()=>{
    const prepare=vi.spyOn(exporter,'prepareProposalRequest').mockRejectedValue(new Error('private URL must not leak'));URL.createObjectURL=vi.fn();
    render(<BuildProposalRequest brief="Direction"/>);fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));fireEvent.click(screen.getByRole('button',{name:'Download request draft'}));await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('could not be prepared');expect(screen.getByRole('alert')).not.toHaveTextContent('private URL');expect(screen.queryByText(/Request draft downloaded/)).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Download request draft'}));await waitFor(()=>expect(prepare).toHaveBeenCalledTimes(2));
  });

});
