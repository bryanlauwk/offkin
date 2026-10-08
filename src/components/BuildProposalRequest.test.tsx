import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BuildProposalRequest, { CONCEPT_PREVIEW_NOTE } from './BuildProposalRequest';

afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe('Local quote and build-proposal handoff',()=>{
  it('downloads only a clearly labelled request draft with the chosen brief and optional context',async()=>{
    let blob:Blob|undefined;
    URL.createObjectURL=vi.fn((value:Blob)=>{blob=value;return 'blob:local-draft';});URL.revokeObjectURL=vi.fn();
    const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
    const fetch=vi.spyOn(globalThis,'fetch');
    render(<BuildProposalRequest brief={'BRAND: Paper Finch\nWORLD: Layered paper city'} hasPending/>);
    expect(screen.getByText(CONCEPT_PREVIEW_NOTE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Request a Quote & Build Proposal'}));
    const dialog=within(screen.getByRole('dialog'));
    expect(dialog.getByText(/Nothing is sent automatically/)).toBeInTheDocument();
    expect(dialog.getByText(/unfinished sections/)).toBeInTheDocument();
    fireEvent.change(dialog.getByLabelText(/Desired quantity/),{target:{value:'50'}});
    fireEvent.change(dialog.getByLabelText(/Budget direction/),{target:{value:'To discuss in MYR'}});
    fireEvent.change(dialog.getByLabelText(/What matters most/),{target:{value:'Keep the layered silhouette'}});
    fireEvent.click(dialog.getByRole('button',{name:'Download request draft'}));
    const exported=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsText(blob!);});
    expect(exported).toContain('BRAND: Paper Finch');expect(exported).toContain('Desired quantity: 50');expect(exported).toContain('Keep the layered silhouette');expect(exported).toContain('has not been sent');
    expect(blob?.type).toBe('text/plain;charset=utf-8');expect(click).toHaveBeenCalledOnce();expect(fetch).not.toHaveBeenCalled();
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
});
