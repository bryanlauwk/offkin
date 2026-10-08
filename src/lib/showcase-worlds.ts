import airbnbBoard from '@/assets/showcase/airbnb-world-board-v3.webp';
import airbnbIllustration from '@/assets/showcase/airbnb-ink-world-v3.webp';
import a24Board from '@/assets/showcase/a24-world-board-v3.webp';
import a24Illustration from '@/assets/showcase/a24-ink-world-v3.webp';
import teslaBoard from '@/assets/showcase/tesla-world-board-v3.webp';
import teslaIllustration from '@/assets/showcase/tesla-ink-world-v3.webp';

export interface ShowcaseWorld {
  id: string;
  brand: string;
  tagline: string;
  summary: string;
  note: string;
  accent: string;
  board: string;
  illustration?: string;
  illustrationAlt?: string;
  boardAlt: string;
  elements: { title: string; copy: string }[];
  steps: { title: string; copy: string }[];
  packaging: string;
  series: string[];
}

/** Unofficial visual studies, kept separate from customer proposals and production evidence. */
export const SHOWCASE_DISCLAIMER = 'Unofficial concept studies. No affiliation, commission or endorsement. Not available products.';
export const SHOWCASE_PREVIEW_NOTE = 'Concept preview. Final design, functionality and pricing confirmed during the build proposal.';
export const SHOWCASE_IMAGE_NOTE = 'Conceptual views. AI-generated art; final geometry and functionality need validation.';

export const showcaseWorlds: ShowcaseWorld[] = [
  {
    id: 'airbnb', brand: 'Airbnb', tagline: 'A little world of big welcomes.', accent: 'coral',
    summary: 'A coral suitcase opens into a tiny home. An oversized key becomes a bridge, a globe sets the scene, and a sunny yellow route connects a chunky cabin, camper and ferry. Little travellers turn the whole thing into a world of welcome.',
    note: 'Different places. The same feeling of welcome.',
    board: airbnbBoard,
    illustration: airbnbIllustration,
    illustrationAlt: 'Airbnb-inspired unofficial illustrated travel world with a coral suitcase-home, key bridge, globe, paper plane, cabin, camper and ferry connected by a yellow path and small round travellers',
    boardAlt: 'Airbnb-inspired unofficial collectible concept board with an oversized coral suitcase-home, key bridge, globe and paper plane, chunky cabin, camper and ferry, round travellers, a continuous yellow route, conceptual views and illustrated packaging',
    elements: [
      { title: 'A world of stays', copy: 'An oversized suitcase-home and a chunky cabin make two very different little places to belong.' },
      { title: 'Hosts & travellers', copy: 'Round little characters share a map, greet an arrival and pause beside the key bridge.' },
      { title: 'The journey', copy: 'A continuous yellow route connects the cabin, camper, ferry and welcoming doorstep.' },
      { title: 'Travel, made iconic', copy: 'A globe, paper plane and oversized coral key turn travel essentials into playful landmarks.' },
    ],
    steps: [
      { title: 'Find the key', copy: 'The oversized coral key is a natural place to invite a small gesture.' },
      { title: 'A warm welcome', copy: 'A proposed key press could reveal a warm glow inside the suitcase-home and cabin.' },
      { title: 'Test the moment', copy: 'The build proposal would define the control, light routing and safe power source, then test the welcome in a prototype.' },
    ],
    packaging: 'A travel-world sleeve, a coral colour edge and a considered opening reveal could make the box feel like the first stop on the journey.',
    series: ['City stays', 'Mountain cabins', 'Island escapes', 'Neighbourhood stories'],
  },
  {
    id: 'a24', brand: 'A24', tagline: 'Strange little stories. A world to discover.', accent: 'ink',
    summary: 'A giant twin-reel projector rises above a tiny cinema world. A yellow filmstrip winds past a ticket tower, a clapperboard stage and little popcorn-sharing characters, with a friendly ghost waiting by the entrance.',
    note: 'A little cinema for a bigger imagination.',
    board: a24Board,
    illustration: a24Illustration,
    illustrationAlt: 'A24-inspired unofficial illustrated film world with an oversized twin-reel projector, ticket tower, winding yellow filmstrip, cinema entrance, ghost and clapperboard stage with round characters',
    boardAlt: 'A24-inspired unofficial collectible concept board with an oversized twin-reel projector, ticket tower, yellow filmstrip path, cinema entrance, clapperboard stage, round characters and a ghost, conceptual views and illustrated packaging',
    elements: [
      { title: 'Cinema, larger than life', copy: 'A giant projector and ticket-shaped tower give the little world its unmistakable silhouette.' },
      { title: 'A path through film', copy: 'The yellow filmstrip connects a cinema entrance, little screening spots and a clapperboard stage.' },
      { title: 'Unexpected company', copy: 'Popcorn-sharing figures, a tiny film crew and a friendly ghost make the story feel human.' },
      { title: 'The late-show mood', copy: 'Ink-black surfaces and yellow accents give the miniature its after-dark atmosphere.' },
    ],
    steps: [
      { title: 'Cue the scene', copy: 'The oversized projector lens gives the concept a clear focal point.' },
      { title: 'Light up the late show', copy: 'A proposed light reveal could warm the lens, cinema entrance and little stage in sequence.' },
      { title: 'Prototype the reveal', copy: 'The control, light routing, power source and safe enclosure would need an engineered prototype.' },
    ],
    packaging: 'An illustrated cream box with a yellow side panel carries the same film-world details. The unboxing could feel like the opening credits.',
    series: ['The late show', 'A strange encounter', 'City after dark', 'On the road'],
  },
  {
    id: 'tesla', brand: 'Tesla', tagline: 'One connected clean-energy world.', accent: 'red',
    summary: 'An oversized sun and battery turn clean energy into a playful little world. A looping red road connects a solar home, chunky electric coupe and charging stop, with small characters sharing the everyday possibilities.',
    note: 'Sun. Home. Charge. Go.',
    board: teslaBoard,
    illustration: teslaIllustration,
    illustrationAlt: 'Tesla-inspired unofficial illustrated clean-energy world with an oversized sun and battery, small solar home, looping red energy-road, chunky electric coupe, charging point and round characters',
    boardAlt: 'Tesla-inspired unofficial collectible concept board with an oversized yellow sun and home battery, chunky red electric coupe, rounded charging point, small solar home and characters, looping red energy-road, conceptual views and illustrated packaging',
    elements: [
      { title: 'Solar homes', copy: 'An oversized sun, little panel-sharing characters and a solar roof give the story its starting point.' },
      { title: 'Home storage', copy: 'A giant rounded battery becomes a landmark linking solar energy to everyday living.' },
      { title: 'Electric journeys', copy: 'A chunky red coupe, tiny scooter rider and sweeping red route make the connected world easy to follow.' },
      { title: 'A place to charge', copy: 'The rounded red-and-cream charging point and its little visitor complete the everyday energy story.' },
    ],
    steps: [
      { title: 'Follow the energy', copy: 'The colour route draws the eye from solar roof to storage, home and car.' },
      { title: 'Bring the loop to life', copy: 'A proposed energy-light sequence could trace the journey from solar roof to battery, home and charging point.' },
      { title: 'Engineer the circuit', copy: 'Any light sequence, power source, wiring access and safe enclosure would be defined and tested during development.' },
    ],
    packaging: 'A clean-energy illustration, a red side panel and a protected display tray could carry the same connected-system story into the packaging.',
    series: ['City energy', 'Mountain home', 'Coastal charging', 'Neighbourhood loop'],
  },
];
