import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import ProposalBoard, { type ProposalAssets, type ProposalBoardProps } from './ProposalBoard';
import { makeProductPlan } from '../test/product-plan-fixture';
import type { ProposalConcept, ProposalStage } from '@/lib/proposal-api';

const ids = {
  world:'00000000-0000-4000-8000-000000000001',
  physical:'00000000-0000-4000-8000-000000000002',
  details:'00000000-0000-4000-8000-000000000003',
  packaging:'00000000-0000-4000-8000-000000000004',
};
const elements = [
  { id:'fold',label:'Folded garden',description:'Paper flowers make a shared neighbourhood.',kind:'fact' as const },
  { id:'ribbon',label:'Ribbon road',description:'A looping path connects the stories.',kind:'proposal' as const },
];
function asset(stage:ProposalStage, overrides:Partial<ProposalConcept>={}):ProposalConcept {
  return {
    contractVersion:'offkin-proposal-v10',stageVersion:'proposal-assets-v1',stage,id:ids[stage],brand:'Paper Studio',
    title:({world:'A world of paper',physical:'Paper town, made tangible',details:'Garden pieces and turning paths',packaging:'A box that opens into a story'})[stage],
    story:`The ${stage} story belongs to Paper Studio.`,design:`Design notes for ${stage}.`,image:`https://images.example/${stage}.png`,
    interaction:stage==='details'?'Turn the ribbon dial to reveal the garden.':stage==='physical'?'A turning path is proposed.':'',
    sourceUrl:'',sourceTitle:'',context:{business:'We make paper keepsakes.',exactWording:'  纸世界\nCafé 🪁 EXACT!\t  '},worldElements:elements,
    sourceImageIds:stage==='world'?[]:stage==='physical'?[ids.world]:stage==='details'?[ids.physical]:[ids.physical,ids.world],
    ...(stage!=='world'?{sourceWorldId:ids.world,selectedElementIds:['fold','ribbon'],heroElementId:'fold',replacements:[]}:{}),
    ...(['details','packaging'].includes(stage)?{sourcePhysicalId:ids.physical}:{}),...overrides,
  };
}
const fullAssets = ():ProposalAssets => ({world:asset('world'),physical:asset('physical'),details:asset('details'),packaging:asset('packaging')});
const props = (overrides:Partial<ProposalBoardProps>={}):ProposalBoardProps => ({assets:fullAssets(),imageErrors:{},onImageError:vi.fn(),onRetryImage:vi.fn(),onEnlarge:vi.fn(),...overrides});
afterEach(cleanup);

describe('ProposalBoard',()=>{
  it('shows four distinct complete generated visuals with real component and packaging sections',()=>{
    const input=props();const {container}=render(<ProposalBoard {...input}/>);
    expect(screen.getAllByRole('img').map(img=>img.getAttribute('src'))).toEqual(['physical','world','details','packaging'].map(stage=>`https://images.example/${stage}.png`));
    expect(screen.getByRole('heading',{name:'Components & interaction'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'Packaging concept'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'A box that opens into a story'})).toBeInTheDocument();
    expect(screen.getByText('Generated component & interaction sheet')).toBeInTheDocument();
    expect(screen.getByText('Generated packaging study')).toBeInTheDocument();
    expect(container.querySelectorAll('[style*="background-image"], [style*="object-position"]')).toHaveLength(0);
    expect(container.querySelector('img[src*="canvas-worlds"]')).toBeNull();
  });
  it('shows unverified parts and prototype gates only when a valid saved physical plan exists',()=>{
    const assets=fullAssets();assets.physical!.productPlan=makeProductPlan(['fold','ribbon']);
    render(<ProposalBoard {...props({assets})}/>);
    expect(screen.getByRole('region',{name:'Proposed construction plan'})).toHaveTextContent('2 proposed printed parts');
    expect(screen.getByText(/No CAD, sliced file or physical sample has been validated/)).toBeInTheDocument();
    expect(screen.getByText(/Parts, joins, assembly and checks before production/)).toBeInTheDocument();
  });
  it('labels old visual-only proposals without inventing construction evidence',()=>{render(<ProposalBoard {...props()}/>);expect(screen.getByText('Concept preview. Final design, functionality and pricing confirmed during the build proposal.')).toBeInTheDocument();});
  it('renders exact wording unchanged and keeps element descriptions independently readable',()=>{
    const input=props();const {container}=render(<ProposalBoard {...input}/>);
    expect(container.querySelector('.pb-exact-wording')?.textContent).toBe(input.assets.world!.context.exactWording);
    const disclosure=screen.getByText('Meet the 2 story elements').closest('details')!;
    expect(disclosure).not.toHaveAttribute('open');
    expect(within(disclosure).getByRole('heading',{name:'Folded garden'})).toBeInTheDocument();
    expect(within(disclosure).getByText(elements[0].description)).toBeInTheDocument();
    expect(within(disclosure).getByText('Creative proposal')).toBeInTheDocument();
  });
  it('uses the details asset’s actual interaction rather than fabricating steps',()=>{
    const input=props();render(<ProposalBoard {...input}/>);
    const section=screen.getByRole('region',{name:'Proposed interaction'});
    expect(section).toHaveTextContent(input.assets.details!.interaction);
    expect(section).not.toHaveTextContent(input.assets.physical!.interaction);
    expect(section).toHaveTextContent('to be tested in a physical prototype');
  });
  it('keeps accepted images and wording stable while a different pending version builds',()=>{
    const input=props();const {rerender}=render(<ProposalBoard {...input}/>);
    const first=screen.getAllByRole('img')[0];
    const pendingWorld=asset('world',{id:'00000000-0000-4000-8000-000000000011',title:'A changed direction',image:'https://images.example/pending-world.png',context:{business:'Next private direction'}});
    rerender(<ProposalBoard {...input} updating pendingAssets={{world:pendingWorld}} progress="Creating the next collectible…"/>);
    expect(screen.getAllByRole('img')[0]).toBe(first);
    expect(screen.getAllByRole('img')).toHaveLength(4);
    expect(screen.queryByRole('img',{name:/changed direction/i})).not.toBeInTheDocument();
    expect(screen.queryByText('Next private direction')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 / 4 visuals');
    expect(screen.getByRole('status')).toHaveTextContent('Your current version stays here');
    expect(screen.getByRole('heading',{name:'Paper town, made tangible'})).toBeInTheDocument();
  });
  it('shows progress but no pending imagery during first generation',()=>{
    const input=props({assets:{},pendingAssets:fullAssets(),updating:true});render(<ProposalBoard {...input}/>);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('4 / 4 visuals');
    expect(screen.queryByText('Packaging concept is not ready yet')).not.toBeInTheDocument();expect(screen.getByText(/Its dimensional concept is next/)).toBeInTheDocument();
    expect(screen.queryByText('A box that opens into a story')).not.toBeInTheDocument();
  });
  it('does not count empty-image metadata as a completed pending visual',()=>{
    render(<ProposalBoard {...props({assets:{},pendingAssets:{world:asset('world',{image:''})},updating:true})}/>);
    expect(screen.getByRole('status')).toHaveTextContent('0 / 4 visuals');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
  it('does not show or count a mismatched-stage pending asset',()=>{
    render(<ProposalBoard {...props({assets:{},pendingAssets:{world:asset('packaging')},updating:true})}/>);
    expect(screen.getByRole('status')).toHaveTextContent('0 / 4 visuals');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
  it.each(['physical','details','packaging'] as const)('hides a %s image with mismatched source lineage',stage=>{
    const assets=fullAssets();assets[stage]={...assets[stage]!,sourceWorldId:'00000000-0000-4000-8000-000000000099'};
    render(<ProposalBoard {...props({assets})}/>);
    expect(screen.queryAllByRole('img').some(img=>img.getAttribute('src')===assets[stage]!.image)).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('Some saved panels do not match this version');
    if(stage==='physical')expect(screen.getAllByRole('img')).toHaveLength(1);
  });
  it.each(['details','packaging'] as const)('hides %s when its physical parent or actual source-image references disagree',stage=>{
    const assets=fullAssets();assets[stage]={...assets[stage]!,sourcePhysicalId:'00000000-0000-4000-8000-000000000099'};
    const {rerender}=render(<ProposalBoard {...props({assets})}/>);
    expect(screen.queryAllByRole('img').some(img=>img.getAttribute('src')===assets[stage]!.image)).toBe(false);
    assets[stage]=asset(stage,{sourceImageIds:[]});rerender(<ProposalBoard {...props({assets})}/>);
    expect(screen.queryAllByRole('img').some(img=>img.getAttribute('src')===assets[stage]!.image)).toBe(false);
  });
  it('accepts a packaging-only revision with different context and correct image lineage',()=>{
    const assets=fullAssets();assets.packaging=asset('packaging',{id:'00000000-0000-4000-8000-000000000014',context:{business:'We make paper keepsakes.',revisionNotes:'Use a brighter box'},title:'A brighter package'});
    render(<ProposalBoard {...props({assets})}/>);
    expect(screen.getAllByRole('img')).toHaveLength(4);
    expect(screen.getByRole('heading',{name:'A brighter package'})).toBeInTheDocument();
    expect(screen.queryByText('Some saved panels do not match this version')).not.toBeInTheDocument();
  });
  it('reports image errors, offers per-image retry and never substitutes other art',()=>{
    const input=props();const {rerender}=render(<ProposalBoard {...input}/>);
    const image=screen.getByRole('img',{name:/generated packaging concept study/i});fireEvent.error(image);
    expect(input.onImageError).toHaveBeenCalledWith(input.assets.packaging!.image);
    rerender(<ProposalBoard {...input} imageErrors={{[input.assets.packaging!.image]:true}}/>);
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByText('Packaging concept image couldn’t load')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Retry packaging concept image'}));
    expect(input.onRetryImage).toHaveBeenCalledWith(input.assets.packaging!.image);
    expect(screen.queryByRole('button',{name:'Enlarge packaging concept'})).not.toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'A box that opens into a story'})).toBeInTheDocument();
  });
  it('does not present metadata with an empty image URL as a generated visual',()=>{
    const assets=fullAssets();assets.details=asset('details',{image:''});
    render(<ProposalBoard {...props({assets})}/>);
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByText('Components & interaction image is unavailable')).toBeInTheDocument();
    expect(screen.getByText('Turn the ribbon dial to reveal the garden.')).toBeInTheDocument();
  });
  it('opens the matching complete source image from each panel and supports static presentation',()=>{
    const input=props();const {rerender}=render(<ProposalBoard {...input}/>);
    for(const [label,stage] of [['brand world','world'],['collectible','physical'],['components & interaction','details'],['packaging concept','packaging']] as const){
      fireEvent.click(screen.getByRole('button',{name:`Enlarge ${label}`}));expect(input.onEnlarge).toHaveBeenLastCalledWith(input.assets[stage],screen.getByRole('button',{name:`Enlarge ${label}`}));
      fireEvent.click(screen.getByRole('button',{name:`Open ${label} image`}));expect(input.onEnlarge).toHaveBeenLastCalledWith(input.assets[stage],screen.getByRole('button',{name:`Open ${label} image`}));
    }
    rerender(<ProposalBoard {...input} onEnlarge={undefined}/>);
    expect(screen.queryByRole('button',{name:/Enlarge/})).not.toBeInTheDocument();expect(screen.getAllByRole('img')).toHaveLength(4);
  });
  it('keeps long narratives fully available but off the visual hierarchy until opened',()=>{
    const assets=fullAssets();assets.physical=asset('physical',{story:'A paper world brings the neighbourhood together. '+ 'A detailed account of its people, places and rituals. '.repeat(15)});
    const {container}=render(<ProposalBoard {...props({assets})}/>);
    expect(container.querySelector('.pb-story .pb-summary')).toHaveTextContent('A paper world brings the neighbourhood together.');
    const narrative=container.querySelector('.pb-story .pb-narrative')!;
    expect(narrative).not.toHaveAttribute('open');expect(narrative.querySelector('p')?.textContent).toBe(assets.physical.story);
  });
  it('renders untrusted metadata as text without introducing executable markup',()=>{
    const assets=fullAssets();assets.packaging=asset('packaging',{story:'<img src="https://evil.example/a" onerror="alert(1)">',title:'<script>alert(1)</script>'});
    const {container}=render(<ProposalBoard {...props({assets})}/>);
    expect(screen.getByRole('heading',{name:'<script>alert(1)</script>'})).toBeInTheDocument();
    expect(container.querySelector('script,img[src^="https://evil.example"]')).toBeNull();
  });
});
