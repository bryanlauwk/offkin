import { CUSTOMER_IDENTITY_VERSION, type CustomerIdentity } from '../../supabase/functions/generate-concept/proposal';
import { CONSTRUCTION_INTENT_VERSION, constructionInteraction, type ConstructionIntent } from '../../supabase/functions/generate-concept/construction-intent';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addProposalAsset, assetsForVersion, confirmedPackagingChange, decodeProposalShare, emptyProposalSession, encodeProposalShare, isComplete, loadProposalSession, loadProposalSnapshot, parseProposalSession, pendingProposal, proposalBrief, requestForStage, saveProposalSession, saveProposalSnapshot, type ProposalSession } from './proposal-session';
import { makeProductPlan } from '../test/product-plan-fixture';
import { type ProposalConcept, type ProposalStage } from './proposal-api';
const ids={world:'00000000-0000-4000-8000-000000000001',physical:'00000000-0000-4000-8000-000000000002',details:'00000000-0000-4000-8000-000000000003',packaging:'00000000-0000-4000-8000-000000000004'};
function session():ProposalSession{const s=emptyProposalSession();s.context.business='We make paper gifts';s.accepted={id:'accepted',website:'',context:s.context,assets:{...ids},selected:['house'],hero:'house',replacements:[]};return s;}
function asset(stage:ProposalStage):ProposalConcept {const s=session();return {contractVersion:'offkin-proposal-v10',stageVersion:'proposal-assets-v1',stage,id:ids[stage],brand:'Paper',title:stage,story:'Paper world story',design:'One rich world',interaction:'Turn to reveal',context:s.context,worldElements:[{id:'house',label:'House',description:'Proposed paper house',kind:'proposal'}],sourceImageIds:stage==='world'?[]:stage==='physical'?[ids.world]:stage==='details'?[ids.physical]:[ids.physical,ids.world],image:`https://images.example/${stage}.png?signed=secret`,sourceUrl:'',sourceTitle:'',...(stage!=='world'?{sourceWorldId:ids.world,selectedElementIds:['house'],heroElementId:'house',replacements:[]}:{}),...(['details','packaging'].includes(stage)?{sourcePhysicalId:ids.physical}:{})};}
afterEach(()=>{localStorage.clear();vi.restoreAllMocks();});
describe('Proposal sessions and immutable versions',()=>{
 it('preserves exact authoritative customer identity through sessions, versions, shares and briefs',()=>{
   const s=session();const identity:CustomerIdentity={version:CUSTOMER_IDENTITY_VERSION,name:'  Fable Finch 字 Café 🪁  '};s.customerIdentity=identity;s.accepted!.customerIdentity={...identity};
   expect(saveProposalSession(s)).toBe(true);expect(loadProposalSession()?.customerIdentity).toEqual(identity);
   const pending=pendingProposal(s,'packaging',s.context);expect(pending.customerIdentity).toEqual(identity);expect(pending.customerIdentity).not.toBe(identity);
   expect(requestForStage(pending,'packaging')).toMatchObject({brand:'no-website',customerIdentity:identity});
   expect(decodeProposalShare(encodeProposalShare(s))?.customerIdentity).toEqual(identity);
   const images=decodeProposalShare(encodeProposalShare(s,true))!;expect(images.customerIdentity).toEqual(identity);expect(images.accepted?.customerIdentity).toEqual(identity);
   expect(decodeProposalShare(encodeProposalShare({...s,customerIdentity:undefined}))?.customerIdentity).toEqual(identity);
   expect(proposalBrief(s,{})).toContain(`Exact brand name: ${JSON.stringify(identity.name)}`);
   const world={...asset('world'),customerIdentity:identity,brand:identity.name};expect(saveProposalSnapshot(world)).toBe(true);expect(loadProposalSnapshot(world.id)?.customerIdentity).toEqual(identity);
 });
 it('keeps saved accepted identity authoritative over editable drafts for every revision scope',()=>{
   const s=session();const identity:CustomerIdentity={version:CUSTOMER_IDENTITY_VERSION,name:'Fable Finch'};s.accepted!.customerIdentity=identity;s.customerIdentity={version:CUSTOMER_IDENTITY_VERSION,name:'Unrelated Orchard'};
   for(const scope of ['world','physical','packaging'] as const)expect(pendingProposal(s,scope,s.context).customerIdentity).toEqual(identity);
   expect(confirmedPackagingChange(s,'A navy box').customerIdentity).toEqual(identity);
   delete s.accepted!.customerIdentity;expect(pendingProposal(s,'physical',s.context).customerIdentity).toBeUndefined();
 });
 it('rejects malformed identity at each saved-state boundary while accepting old sessions',()=>{
   expect(parseProposalSession(session())).not.toBeNull();
   for(const identity of [{version:CUSTOMER_IDENTITY_VERSION,name:''},{version:CUSTOMER_IDENTITY_VERSION,name:'   '},{version:CUSTOMER_IDENTITY_VERSION,name:'a'.repeat(121)},{version:'customer-brand-v2',name:'Fable Finch'},{version:CUSTOMER_IDENTITY_VERSION,name:'Fable Finch',inferred:true}]){
     const s=session();expect(parseProposalSession({...s,customerIdentity:identity})).toBeNull();expect(parseProposalSession({...s,accepted:{...s.accepted,customerIdentity:identity}})).toBeNull();expect(parseProposalSession({...s,pending:{...pendingProposal(s,'world',s.context),customerIdentity:identity}})).toBeNull();
   }
 });
 it('requires explicit identity for a new world and legacy world revisions without guessing from prose',()=>{
   const s=emptyProposalSession();s.context={...s.context,business:'Fable Finch brings the Sunbeam community together',brandIdentifiers:'Orange Sunbeam emblem',interaction:'Display only'};s.constructionIntent={version:CONSTRUCTION_INTENT_VERSION,action:'static'};
   const pending=pendingProposal(s,'world',s.context);expect(pending.customerIdentity).toBeUndefined();expect(()=>requestForStage(pending,'world')).toThrow(/exact brand name/);
   const revision={...pendingProposal(session(),'world',s.context),constructionIntent:s.constructionIntent};expect(()=>requestForStage(revision,'world')).toThrow(/exact brand name/);
 });
 it('rejects missing or changed identity before accepting or displaying an expected customer asset',()=>{
   const s=session();const identity:CustomerIdentity={version:CUSTOMER_IDENTITY_VERSION,name:'Fable Finch'};s.accepted!.customerIdentity=identity;
   const pending=pendingProposal(s,'packaging',s.context);
   for(const changed of [asset('packaging'),{...asset('packaging'),customerIdentity:{...identity,name:'Unrelated Orchard'},brand:'Unrelated Orchard'},{...asset('packaging'),customerIdentity:identity,brand:'Unrelated Orchard'}]){
     expect(()=>addProposalAsset(pending,changed)).toThrow(/different customer brand/);expect(assetsForVersion(s.accepted,{[changed.id]:changed})).toEqual({});
   }
   const matching={...asset('packaging'),customerIdentity:identity,brand:identity.name};expect(addProposalAsset(pending,matching).assets.packaging).toBe(matching.id);expect(assetsForVersion(s.accepted,{[matching.id]:matching}).packaging).toEqual(matching);
 });

 it.each(['static','press-reveal-manual-reset'] as const)('persists optional %s intent in schema 10 without marking it reviewed',action=>{
   const s=emptyProposalSession();s.customerIdentity={version:CUSTOMER_IDENTITY_VERSION,name:'Fable Finch'};const intent:ConstructionIntent={version:CONSTRUCTION_INTENT_VERSION,action};s.constructionIntent=intent;s.context={...s.context,mode:'mechanical',interaction:constructionInteraction(intent)};
   s.pending=pendingProposal(s,'world',s.context);expect(s.pending.constructionIntent).toEqual(intent);expect(saveProposalSession(s)).toBe(true);expect(loadProposalSession()).toEqual(s);expect(JSON.stringify(s)).not.toContain('reviewed');
   for(const stage of ['world','physical'] as const)expect(requestForStage(s.pending,stage)).not.toHaveProperty('constructionIntent');
   for(const stage of ['details','packaging'] as const)expect(requestForStage(s.pending,stage)).not.toHaveProperty('constructionIntent');
 });
 it('does not require legacy engineering intent for new previews while retaining saved metadata',()=>{
   const s=session();s.accepted!.customerIdentity={version:CUSTOMER_IDENTITY_VERSION,name:'Fable Finch'};const intent:ConstructionIntent={version:CONSTRUCTION_INTENT_VERSION,action:'static'};s.constructionIntent=intent;s.accepted!.constructionIntent=intent;s.accepted!.context={...s.context,mode:'mechanical',interaction:'Display only'};
   for(const scope of ['world','physical'] as const){const p=pendingProposal(s,scope,s.context);expect(p.constructionIntent).toBeUndefined();expect(requestForStage(p,scope)).not.toHaveProperty('constructionIntent');}
   expect(confirmedPackagingChange(s,'Blue packaging only').constructionIntent).toEqual(intent);expect(s.accepted!.constructionIntent).toEqual(intent);
 });
 it('does not carry a draft action into a different initial context',()=>{const s=emptyProposalSession();s.constructionIntent={version:CONSTRUCTION_INTENT_VERSION,action:'static'};s.context.interaction='Display only';expect(pendingProposal(s,'world',{...s.context,business:'A changed business'}).constructionIntent).toBeUndefined();});
 it('preserves freeform proposed interaction rather than overriding it with a legacy mechanism',()=>{
   const s=emptyProposalSession();s.customerIdentity={version:CUSTOMER_IDENTITY_VERSION,name:'Fable Finch'};s.constructionIntent={version:CONSTRUCTION_INTENT_VERSION,action:'static'};s.context.interaction='Press a panel';
   expect(requestForStage(pendingProposal(s,'world',s.context),'world').context.interaction).toBe('Press a panel');
 });
 it('rejects unknown actions, versions and reviewed flags without rejecting old schema 10 state',()=>{
   const old=session();expect(parseProposalSession(old)).toEqual(old);
   for(const intent of [{version:'construction-intent-v2',action:'static'},{version:CONSTRUCTION_INTENT_VERSION,action:'automatic-reset'},{version:CONSTRUCTION_INTENT_VERSION,action:'static',reviewed:true}])expect(parseProposalSession({...session(),constructionIntent:intent})).toBeNull();
 });
 it('omits active intent from ordinary shares and never imports pending confirmation',()=>{
   const s=session();s.constructionIntent={version:CONSTRUCTION_INTENT_VERSION,action:'static'};s.accepted!.constructionIntent=s.constructionIntent;
   expect(decodeProposalShare(encodeProposalShare(s))?.constructionIntent).toBeUndefined();expect(decodeProposalShare(encodeProposalShare(s,true))?.accepted?.constructionIntent).toEqual(s.constructionIntent);
   s.pending={...pendingProposal(s,'physical',s.context),constructionIntent:s.constructionIntent};
   const raw='#proposal='+btoa(JSON.stringify(s)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const imported=decodeProposalShare(raw)!;
   expect(imported.constructionIntent).toBeUndefined();expect(imported.pending?.constructionIntent).toBeUndefined();expect(imported.accepted?.constructionIntent).toEqual(s.constructionIntent);
 });

 it('starts with no example story, IDs, elements or hero',()=>{const s=emptyProposalSession();expect(s.accepted).toBeNull();expect(s.pending).toBeNull();expect(s.context.interaction).toBe('');expect(JSON.stringify(s)).not.toMatch(/airbnb|tesla|a24/i);expect(parseProposalSession(s)).toEqual(s);});
 it('persists and reloads exact Unicode wording',()=>{const s=emptyProposalSession();s.context.exactWording='  纸世界\nCafé 🪁 EXACT!\t ';expect(saveProposalSession(s)).toBe(true);expect(loadProposalSession()).toEqual(s);});
 it.each([['schema',9],['website',3],['context',{business:'x',unauthorized:'secret'}],['turns',[{role:'system',text:'x'}]],['accepted',{...session().accepted,assets:{world:ids.world}}]])('rejects malformed %s', (key,value)=>{expect(parseProposalSession({...emptyProposalSession(),[key]:value})).toBeNull();});
 it('rejects duplicate asset IDs, unknown fields and unsupported selection identities',()=>{const s=session();expect(parseProposalSession({...s,extra:true})).toBeNull();expect(parseProposalSession({...s,accepted:{...s.accepted,assets:{...ids,packaging:ids.world}}})).toBeNull();expect(parseProposalSession({...s,accepted:{...s.accepted,selected:['Airbnb!']}})).toBeNull();});
 it('keeps accepted assets immutable and invalidates only dependency closure',()=>{const s=session();const original=JSON.stringify(s);const pack=pendingProposal(s,'packaging',{...s.context,revisionNotes:'Blue package'});expect(pack.assets).toEqual({world:ids.world,physical:ids.physical,details:ids.details});expect(pendingProposal(s,'physical',s.context).assets).toEqual({world:ids.world});expect(pendingProposal(s,'world',s.context).assets).toEqual({});expect(JSON.stringify(s)).toBe(original);});
 it('requires a complete accepted version for an explicit packaging-only recovery',()=>{expect(()=>confirmedPackagingChange(emptyProposalSession(),'Blue box')).toThrow(/accepted complete/);const s=session();s.pending=pendingProposal(s,'packaging',s.context);expect(()=>confirmedPackagingChange(s,'Blue box')).toThrow(/accepted complete/);});
 it('preserves every accepted field and asset except the exact packaging instruction in revisionNotes',()=>{const s=session();s.context={business:'An unrelated editable draft'};s.website='https://another.example';s.accepted!.context={...s.accepted!.context,exactWording:'  异趣伙伴\nEXACT!  ',materials:'Existing material',mode:'mechanical',interaction:'Display only',scale:'Let the story decide',revisionNotes:'Earlier notes'};const original=JSON.stringify(s);const instruction='  Keep the object. Make only the packaging deep navy blue.\n';const p=confirmedPackagingChange(s,instruction);expect(p.scope).toBe('packaging');expect(p.website).toBe(s.accepted!.website);expect(p.context).toEqual({...s.accepted!.context,revisionNotes:instruction});expect(p.assets).toEqual({world:ids.world,physical:ids.physical,details:ids.details});expect(p.previous.packaging).toBe(ids.packaging);expect(JSON.stringify(s)).toBe(original);});
 it('propagates source IDs and same-role image references on revisions',()=>{const p=pendingProposal(session(),'packaging',session().context);expect(requestForStage(p,'packaging')).toMatchObject({sourceWorldId:ids.world,sourcePhysicalId:ids.physical,previousAssetId:ids.packaging});expect(requestForStage(p,'packaging')).not.toHaveProperty('selectedElementIds');});
 it('stores real element IDs only after the generated world arrives',()=>{let p=pendingProposal(emptyProposalSession(),'world',session().context);expect(p.selected).toEqual([]);p=addProposalAsset(p,asset('world'));expect(p.selected).toEqual(['house']);expect(p.hero).toBe('house');expect(isComplete(p)).toBe(false);});
 it('rejects mismatched world or physical parent before accepting an asset',()=>{const p=pendingProposal(session(),'packaging',session().context);expect(()=>addProposalAsset(p,{...asset('packaging'),sourceWorldId:ids.details})).toThrow(/different proposal/);expect(()=>addProposalAsset(p,{...asset('packaging'),sourcePhysicalId:ids.world})).toThrow(/different proposal/);});
 it('only assembles matching lineage from restored snapshots',()=>{const s=session();const all=Object.fromEntries(Object.keys(ids).map(stage=>{const c=asset(stage as ProposalStage);return [c.id,c];}));all[ids.packaging].sourcePhysicalId=ids.details;expect(Object.keys(assetsForVersion(s.accepted,all))).toEqual(['world','physical','details']);});
 it('saves narrative metadata without signed URLs',()=>{const c=asset('world');expect(saveProposalSnapshot(c)).toBe(true);expect(loadProposalSnapshot(c.id)?.image).toBe('');expect(loadProposalSnapshot(c.id)?.context).toEqual(c.context);expect(localStorage.getItem(`offkin:proposal-asset:${c.id}`)).not.toContain('signed=secret');});
 it('rejects old local metadata snapshots that contain prior-version capability IDs',()=>{const c=asset('world');const previous='00000000-0000-4000-8000-000000000091';localStorage.setItem(`offkin:proposal-asset:${c.id}`,JSON.stringify({...c,image:'',previousAssetId:previous,sourceImageIds:[previous]}));expect(loadProposalSnapshot(c.id)).toBeNull();});
 it('discloses a storage failure instead of claiming save',()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('full');});expect(saveProposalSession(session())).toBe(false);expect(saveProposalSnapshot(asset('world'))).toBe(false);});
 it('shares bounded current text only unless original image access is opted in',()=>{const s=session();s.turns=[{role:'user',text:'Earlier private direction'}];const clean=decodeProposalShare(encodeProposalShare(s))!;expect(clean.accepted).toBeNull();expect(clean.pending).toBeNull();expect(clean.turns).toEqual([]);expect(encodeProposalShare(s)).not.toContain('Earlier private direction');const included=decodeProposalShare(encodeProposalShare(s,true))!;expect(included.accepted?.assets).toEqual(ids);expect(included.id).not.toBe(s.id);});
 it('rejects invalid shares and refuses incomplete image links',()=>{expect(decodeProposalShare('#proposal=%%%')).toBeNull();expect(decodeProposalShare('#proposal='+ 'a'.repeat(29000))).toBeNull();expect(()=>encodeProposalShare(emptyProposalSession(),true)).toThrow(/Complete/);});
 it('exports and restores the complete proposed construction plan without claiming verification',()=>{const c=asset('physical');c.productPlan=makeProductPlan(['house']);expect(saveProposalSnapshot(c)).toBe(true);expect(loadProposalSnapshot(c.id)?.productPlan).toEqual(c.productPlan);const text=proposalBrief(session(),{[c.id]:c});expect(text).toContain('Proposed joins (unverified)');expect(text).toContain('Manufacturing unknowns');expect(text).toContain('not a CAD model');});
 it('preserves a preliminary saved world plan when physical generation is unfinished',()=>{const s=emptyProposalSession();const world=asset('world');world.productPlan=makeProductPlan(['house']);s.pending=addProposalAsset(pendingProposal(s,'world',s.context),world);const text=proposalBrief(s,{[world.id]:world});expect(text).toContain('Preliminary product plan; the physical hero is not available here yet');expect(text).not.toContain('This saved version has no construction plan');});
 it('exports a customer-only brief with truthful incomplete sections',()=>{const s=emptyProposalSession();s.context.business='A new customer idea';const text=proposalBrief(s,{});expect(text).toContain('A new customer idea');expect(text).toContain('PACKAGING: Not generated');expect(text).not.toMatch(/Airbnb|Tesla|A24/);expect(text).toContain('Recipient / submission destination: not set');});
});
