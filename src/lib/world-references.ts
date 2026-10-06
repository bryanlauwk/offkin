/**
 * Authored references from the three supplied October 2026 concept boards.
 * These are examples, not generated results or independently verified brand research.
 * Display crops are deterministic, colour-preserving WebP crops of those boards;
 * boardImage preserves the byte-for-byte original PNG for full inspection.
 */
export type WorldReferenceId = 'airbnb' | 'a24' | 'tesla';
export type WorldReferenceElementKind = 'fact' | 'proposal';

export type WorldReferenceElement = {
  /** Stable, preauthored reference ID; never assigned to a fresh generated image. */
  id: string;
  label: string;
  description: string;
  /** "fact" means stated in the supplied board, not independently verified. */
  kind: WorldReferenceElementKind;
  /** Percent coordinates within worldImage, origin at its top-left corner. */
  x: number;
  y: number;
  thumbnailImage: string;
};

export type WorldReference = {
  id: WorldReferenceId;
  name: string;
  title: string;
  story: string;
  facts: string[];
  /** An explicitly proposed artistic interpretation, not a business claim. */
  narrative: string;
  accent: string;
  worldImage: string;
  worldWidth: number;
  worldHeight: number;
  worldAlt: string;
  physicalImage: string;
  physicalAlt: string;
  boardImage: string;
  sourceLabel: string;
  disclosure: string;
  elements: WorldReferenceElement[];
};

export const WORLD_REFERENCE_FACT_LABEL = 'From the supplied board';
export const WORLD_REFERENCE_PROPOSAL_LABEL = 'Proposed interpretation';
export const WORLD_REFERENCE_DISCLOSURE = 'Unofficial, unvalidated concept studies. Source-board statements have not been independently verified. No brand affiliation, client work or available product is implied.';

const asset = (name: string) => `/canvas-worlds/${name}`;
/** Coordinates are measured on the source pixels, then normalized to the exact crop. */
const point = (x: number, y: number, width: number, height: number) => ({
  x: Number((x / width * 100).toFixed(3)),
  y: Number((y / height * 100).toFixed(3)),
});

export const worldReferences: WorldReference[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    title: 'A world of belonging',
    story: 'Homes, hosts and journeys become one connected neighbourhood, with the Bélo as a landmark you can find your way back to.',
    facts: [
      'The supplied board describes stays, hosting, travel and belonging as its source themes.',
      'Its key elements are the Bélo, homes, community, travel and exploration.',
      'The coral identity, varied architecture and welcoming characters are visible in the supplied artwork.',
    ],
    narrative: 'Proposed interpretation: turn belonging into a place to explore. A winding yellow route connects distinctive homes and little encounters, while a monumental Bélo anchors the skyline. The physical study translates that layered world into a scene with a welcoming centre.',
    accent: '#ef4658',
    worldImage: asset('airbnb-world.webp'),
    worldWidth: 1068,
    worldHeight: 424,
    worldAlt: 'The original Airbnb concept world: a giant coral Bélo, winding yellow routes, varied homes, hosts, travellers, a van, boats and destinations in a densely illustrated city.',
    physicalImage: asset('airbnb-physical.webp'),
    physicalAlt: 'Supplied Airbnb physical concept panel with a coral Bélo, glowing house, trees, welcoming figures and a raised yellow route on a sculptural base.',
    boardImage: asset('airbnb-board.png'),
    sourceLabel: 'Supplied Airbnb concept board · October 2026',
    disclosure: WORLD_REFERENCE_DISCLOSURE + ' The depicted movement, lighting and scale are proposals requiring prototype review.',
    elements: [
      {
        id: 'airbnb-belo', label: 'Bélo landmark', kind: 'fact',
        description: 'The supplied board names the Bélo as its recognizable anchor. Making it an oversized landmark is the artwork’s proposed spatial interpretation.',
        ...point(522, 190, 1068, 424), thumbnailImage: asset('airbnb-belo.webp'),
      },
      {
        id: 'airbnb-homes', label: 'Different homes, different stories', kind: 'fact',
        description: 'Homes and distinctive stays are named in the supplied board. Its A-frame house becomes one of many destinations along the illustrated route.',
        ...point(732, 221, 1068, 424), thumbnailImage: asset('airbnb-homes.webp'),
      },
      {
        id: 'airbnb-community', label: 'Hosts and guests', kind: 'fact',
        description: 'Community is described through hosts and guests in the supplied board. The small welcoming figures are proposed characters, not real people or official mascots.',
        ...point(573, 378, 1068, 424), thumbnailImage: asset('airbnb-community.webp'),
      },
      {
        id: 'airbnb-travel', label: 'Journeys that connect', kind: 'fact',
        description: 'Travel is one of the board’s stated themes. The illustrated van and looping route make movement between places visible in the concept world.',
        ...point(622, 296, 1068, 424), thumbnailImage: asset('airbnb-travel.webp'),
      },
      {
        id: 'airbnb-explore', label: 'Local discoveries', kind: 'fact',
        description: 'The board names destinations, culture and local experiences. Its varied buildings and landmarks suggest a world of discoveries rather than a literal travel itinerary.',
        ...point(910, 142, 1068, 424), thumbnailImage: asset('airbnb-explore.webp'),
      },
    ],
  },
  {
    id: 'a24',
    name: 'A24',
    title: 'A neighbourhood of stories',
    story: 'Cinema becomes a place you can wander: stacked theatres, glowing signs, projectors, strange characters and another story around every corner.',
    facts: [
      'The supplied board describes independent cinema, bold stories and original voices as its source themes.',
      'Its named elements are the logo, film culture, stories and characters, places, and community.',
      'Projectors, cinema façades, clapperboards and film-related imagery are visible in the concept artwork.',
    ],
    narrative: 'Proposed interpretation: build a vertical neighbourhood where every façade opens onto another story. The giant cinema sign, winding yellow streets and curious characters share one world; the physical study condenses it into a layered theatre scene.',
    accent: '#edc32d',
    worldImage: asset('a24-world.webp'),
    worldWidth: 1078,
    worldHeight: 482,
    worldAlt: 'The original A24 concept world: giant A24 lettering and a cinema façade, winding yellow streets, a projector, ghost-like character, moon screens, theatres and crowds.',
    physicalImage: asset('a24-physical.webp'),
    physicalAlt: 'Supplied A24 physical concept panel showing a layered black-and-cream cinema, projector reel, lit entrance, moon screen, figures, trees and steps.',
    boardImage: asset('a24-board.png'),
    sourceLabel: 'Supplied A24 concept board · October 2026',
    disclosure: WORLD_REFERENCE_DISCLOSURE + ' Film references are unlicensed concept artwork; no official partnership or permission to produce is implied.',
    elements: [
      {
        id: 'a24-logo', label: 'The logo becomes architecture', kind: 'fact',
        description: 'The supplied board identifies the A24 logo as a core visual reference. The oversized cinema façade is its proposed architectural translation.',
        ...point(489, 140, 1078, 482), thumbnailImage: asset('a24-logo.webp'),
      },
      {
        id: 'a24-film', label: 'Film culture', kind: 'fact',
        description: 'The source board explicitly names projectors, screens, posters and clapperboards. A large reel crowns the illustrated neighbourhood.',
        ...point(795, 62, 1078, 482), thumbnailImage: asset('a24-film.webp'),
      },
      {
        id: 'a24-characters', label: 'Strange little stories', kind: 'proposal',
        description: 'The ghost-like figure and other characters make the cinema world feel curious and human. These film-related references are unlicensed concept artwork, not approved merchandise.',
        ...point(719, 264, 1078, 482), thumbnailImage: asset('a24-characters.webp'),
      },
      {
        id: 'a24-places', label: 'Places to wander', kind: 'fact',
        description: 'The board names theatres, streets and late nights as a source theme. Its cinema entrance sits at street level beneath the layered story world.',
        ...point(647, 430, 1078, 482), thumbnailImage: asset('a24-places.webp'),
      },
      {
        id: 'a24-community', label: 'Stories bring people together', kind: 'fact',
        description: 'Fans, creators and seekers form the community described in the supplied board. Gathering figures and shared streets express that theme as a proposed scene.',
        ...point(854, 357, 1078, 482), thumbnailImage: asset('a24-community.webp'),
      },
    ],
  },
  {
    id: 'tesla',
    name: 'Tesla',
    title: 'A connected energy world',
    story: 'Sunlight, homes, stored energy and mobility connect through a red road, turning separate source themes into one richly layered landscape.',
    facts: [
      'The supplied board groups solar, the home, Powerwall, a Tesla vehicle and Supercharger as its source themes.',
      'It depicts a red vehicle route connecting domestic spaces, charging and energy infrastructure.',
      'The rocket is a speculative horizon motif, not an established Tesla business or a SpaceX fact.',
    ],
    narrative: 'Proposed interpretation: follow energy through an inhabited landscape, from the sun to a home, storage, a vehicle and a charging stop. The red route makes that relationship tangible. The distant rocket is an optional speculative horizon motif and can be removed from a brand-grounded direction.',
    accent: '#d9473c',
    worldImage: asset('tesla-world.webp'),
    worldWidth: 1102,
    worldHeight: 490,
    worldAlt: 'The original Tesla concept world: Tesla identity, solar roofs, houses, Powerwall, red cars and winding roads, charging stations, characters, and a speculative rocket at the horizon.',
    physicalImage: asset('tesla-physical.webp'),
    physicalAlt: 'Supplied Tesla physical concept panel with layered homes, solar panels, storage, a red vehicle route and charging station; the rocket is a speculative horizon motif.',
    boardImage: asset('tesla-board.png'),
    sourceLabel: 'Supplied Tesla concept board · October 2026',
    disclosure: WORLD_REFERENCE_DISCLOSURE + ' The rocket is a speculative horizon motif, not an official Tesla business claim or SpaceX fact. Lighting and movement remain unvalidated proposals.',
    elements: [
      {
        id: 'tesla-solar', label: 'Solar', kind: 'fact',
        description: 'Solar is named in the supplied board. The large roof panels beneath the sun establish the first stop in its proposed energy story.',
        ...point(549, 90, 1102, 490), thumbnailImage: asset('tesla-solar.webp'),
      },
      {
        id: 'tesla-home', label: 'A lived-in energy story', kind: 'fact',
        description: 'The home is one of the source board’s named elements. Warm interiors and nearby characters place the energy theme in an everyday setting.',
        ...point(628, 236, 1102, 490), thumbnailImage: asset('tesla-home.webp'),
      },
      {
        id: 'tesla-powerwall', label: 'Powerwall', kind: 'fact',
        description: 'The supplied board names Powerwall and describes stored energy. Its exaggerated scale makes it a landmark in this concept rather than a literal installation.',
        ...point(839, 186, 1102, 490), thumbnailImage: asset('tesla-powerwall.webp'),
      },
      {
        id: 'tesla-vehicle', label: 'Mobility along the red route', kind: 'fact',
        description: 'A Tesla vehicle is a named source-board element. The red car and winding route connect the illustrated neighbourhood and its energy landmarks.',
        ...point(605, 320, 1102, 490), thumbnailImage: asset('tesla-vehicle.webp'),
      },
      {
        id: 'tesla-supercharger', label: 'Supercharger', kind: 'fact',
        description: 'Supercharger is explicitly identified in the supplied board. Its illustrated station is a meeting point along the proposed red-road narrative.',
        ...point(858, 322, 1102, 490), thumbnailImage: asset('tesla-supercharger.webp'),
      },
      {
        id: 'tesla-horizon', label: 'Speculative horizon', kind: 'proposal',
        description: 'The rocket and distant planet are an optional imaginative horizon motif in this artwork. They do not represent an official Tesla business or an established SpaceX fact.',
        ...point(974, 89, 1102, 490), thumbnailImage: asset('tesla-horizon.webp'),
      },
    ],
  },
];

export function getWorldReference(id: string): WorldReference | undefined {
  return worldReferences.find(reference => reference.id === id);
}
