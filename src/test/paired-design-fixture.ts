import type { PairedDesignInput } from '../../supabase/functions/generate-concept/paired-design';

/** Offline hypotheses supplied for contract testing, NOT verified public brand evidence. */
export const pairedBrandFixtures = [
  {brand:'STIVE Asia',truth:'Print on demand',object:'heat press mini clicker',silhouette:'An open C-shaped press arch with a broad floating platen',action:'press',symbolism:'The platen closing over a small blank tile represents turning an idea into a print'},
  {brand:'KL Durian Experience Centre',truth:'Durian discovery',object:'split durian reveal collectible',silhouette:'A rounded spiked fruit shell opening along one curved seam',action:'slide',symbolism:'Opening the fruit reveals the story hidden inside its distinctive shell'},
  {brand:'DHL',truth:'Logistics connects destinations',object:'routing ribbon collectible',silhouette:'An upright asymmetric loop with a parcel-shaped moving bead',action:'turn',symbolism:'A single continuous route gives the parcel a visible destination'},
  {brand:'A24',truth:'Film storytelling',object:'film portal collectible',silhouette:'A freestanding stepped film-frame arch with a sliding scene tab',action:'slide',symbolism:'A frame revealing a scene expresses the act of discovering a film story'},
] as const;

export function makePairedFixture(index=0): PairedDesignInput {
  const fixture=pairedBrandFixtures[index];
  if (!fixture) throw new Error('Choose one of the four offline fixtures.');
  return {
    brand:fixture.brand,exactText:'  Your business DNA. Made collectible.\n异趣伙伴  ',
    evidence:[{id:'owner-story',kind:'owner-statement',text:fixture.truth,sourceUrl:'',sourceTitle:'Offline test hypothesis — not verified brand research'}],
    evidenceConfirmed:true,lens:'signature-product',truth:{evidenceId:'owner-story',quote:fixture.truth},symbolism:fixture.symbolism,
    plan:{status:'unverified-concept',object:fixture.object,silhouette:fixture.silhouette,
      components:[{id:'body',name:'Signature body',form:fixture.silhouette,role:'body'},
        {id:'actuator',name:'Story actuator',form:'One captive moving element integrated into the signature body',role:'moving'},
        {id:'base',name:'Small stable foot',form:'A compact integral support, not a rectangular presentation box',role:'support'}],
      purchasedParts:[{id:'retainer',name:'Off-the-shelf retaining insert',purpose:'Retention concept to investigate in prototyping'}],
      mechanic:{kind:fixture.action,inputPartId:'actuator',outputPartId:'actuator',purchasedPartIds:['retainer'],effect:'A single tactile action reveals the story detail'},
      process:'undecided',caveats:['Print orientation, tolerances, retention, supports, durability and small-part safety need CAD and physical prototype review.']},
    card:{headline:fixture.brand,narrative:`Because ${fixture.truth}, the ${fixture.object} proposes a ${fixture.action} to reveal that story.`,frames:2},localizedBrandAccents:[],
  };
}