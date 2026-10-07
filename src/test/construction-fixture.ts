import { CONSTRUCTION_INTERACTION, CONSTRUCTION_ROLES, type ConstructionBinding, type ConstructionChoice } from '../../supabase/functions/generate-concept/construction';

/** Authored local test direction. Not user approval or physical engineering evidence. */
export function constructionFixture(): { binding: ConstructionBinding; choice: ConstructionChoice } {
  const elements = [
    {id:'sun',label:'Sculptural sun',description:'Large dimensional sun carrying the proposed pressing action.',kind:'proposal' as const},
    {id:'tiers',label:'Curved terraces',description:'Compact asymmetric open terraces with homes and a charging arch.',kind:'proposal' as const},
    {id:'road',label:'Red road',description:'Looping raised red ribbon through the terraces.',kind:'proposal' as const},
    {id:'car',label:'Red car',description:'One characterful static red car seated on the road.',kind:'proposal' as const},
    {id:'companions',label:'White companions',description:'Small white companions and grouped foliage.',kind:'proposal' as const},
    {id:'solar-home',label:'Solar home',description:'Dimensional home with charcoal solar roof planes.',kind:'proposal' as const},
  ];
  const visuals={
    body:{name:'Open terrace sculpture',form:'Three asymmetric off-white curved terraces with generous openings, battery tower and charging arch.',finish:'Warm off-white surfaces with selective green tree masses',stories:['tiers']},
    actuator:{name:'Sculptural sun',form:'A large warm yellow sun with broad dimensional rays; the stem and marker are integrated.',finish:'Yellow sun face and contrasting red marker',stories:['sun']},
    retainer:{name:'Rear access piece',form:'Small rear access piece following the sculpture silhouette without a full-width backing wall.',finish:'Warm off-white matching the adjacent surfaces',stories:[]},
    'form-a':{name:'Looping red road',form:'Raised curved red road ribbon sweeping through the sculpture.',finish:'Vivid red road surface',stories:['road']},
    'form-b':{name:'Red car',form:'A characterful volumetric red car, deliberately static on the road.',finish:'Red body with selective dark glazing',stories:['car']},
    'form-c':{name:'Companion group',form:'White dimensional companions with robust grouped foliage shapes.',finish:'White characters and green foliage',stories:['companions']},
    'form-d':{name:'Solar home',form:'A characterful dimensional home with a distinct solar roof mass.',finish:'Warm off-white home and charcoal solar-panel faces',stories:['solar-home']},
  };
  const binding:ConstructionBinding={version:'construction-binding-v1',action:'press-reveal-manual-reset',source:{context:{business:'An unofficial clean-energy brand collectible study',brandIdentifiers:'Tesla T and TESLA wordmark as concept branding only; no other lettering',style:'Compact asymmetric dimensional designer collectible; preserve rich story, colour and openings',interaction:CONSTRUCTION_INTERACTION,mode:'mechanical',exactWording:''},elements,heroElementId:'sun',replacements:[]},creative:{brand:'Tesla study',title:'A dimensional energy story',intent:'A characterful dimensional clean-energy collectible; every selected story remains a proposed sculptural form.',silhouette:'A compact asymmetric open terrace sculpture with large sun, looping red road, static car, white companions and solar home.',story:'A proposed small physical gesture makes the imagined solar-to-charging connection visible. It is a concept, not tested product performance.',scaleDirection:'Compact tabletop proportions; dimensions and printing scale remain unresolved.',roles:CONSTRUCTION_ROLES.map(role=>({role,storyElementIds:visuals[role].stories,appearances:[{id:'primary',name:visuals[role].name,form:visuals[role].form,finish:visuals[role].finish},{id:'rounded',name:visuals[role].name,form:visuals[role].form.replace('characterful','rounded characterful'),finish:visuals[role].finish}]}))}};
  return {binding,choice:{version:'construction-choice-v1',templateId:'press-reveal-v1',appearances:CONSTRUCTION_ROLES.map(role=>({role,appearanceId:'primary'}))}};
}
