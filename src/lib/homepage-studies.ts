import type { ConceptKind } from '@/components/ConceptStudy';

export type HomepageStudy = {
  kind: ConceptKind;
  brand: string;
  title: string;
  line: string;
  image: string;
  imageAlt: string;
  visualNote: string;
  mode: 'mechanical' | 'electronic';
};

// These are authored, complete captions for inspected, unofficial concept images.
// Never use expiring signed storage URLs or raw, potentially truncated model copy here.
export const homepageStudies: readonly HomepageStudy[] = [
  {
    kind: 'a24', brand: 'A24', title: 'OFF-SCREEN', line: 'The frame hides its making.',
    image: '/concept-studies/offkin-a24-concept.webp', mode: 'mechanical',
    imageAlt: 'A24 Off-screen visual concept: an ivory film-set miniature with a sliding charcoal flat, red director’s chair and camera',
    visualNote: 'A small scene about the work outside the frame. Fine details and the sliding mechanism need a physical prototype.',
  },
  {
    kind: 'airbnb', brand: 'Airbnb', title: 'A PLACE IS MADE', line: 'A place becomes yours when someone makes room.',
    image: '/concept-studies/offkin-airbnb-concept.webp', mode: 'mechanical',
    imageAlt: 'Airbnb A place is made visual concept: a miniature table set for two, a terracotta chair on a rail and a sage window planter',
    visualNote: 'One small gesture of welcome: making room at the table. Chair travel, strength and assembly still need testing.',
  },
  {
    kind: 'tesla', brand: 'Tesla', title: 'STORED AFTERNOON', line: 'What if you could keep a little of the afternoon?',
    image: '/concept-studies/offkin-tesla-concept.webp', mode: 'electronic',
    imageAlt: 'Tesla Stored afternoon electronic visual concept: a solar-roof cutaway with an amber storage block, front button, blank display and light',
    visualNote: 'An electronic story-scene proposal. The glow and screen are illustrative; circuitry, firmware and any AI response need validation.',
  },
];
