import airbnbWorld from '@/assets/showcase/airbnb-world.jpg';
import airbnbHero from '@/assets/showcase/airbnb-hero.jpg';
import airbnbPack from '@/assets/showcase/airbnb-pack.jpg';
import a24World from '@/assets/showcase/a24-world.jpg';
import a24Hero from '@/assets/showcase/a24-hero.jpg';
import a24Pack from '@/assets/showcase/a24-pack.jpg';
import teslaWorld from '@/assets/showcase/tesla-world.jpg';
import teslaHero from '@/assets/showcase/tesla-hero.jpg';
import teslaPack from '@/assets/showcase/tesla-pack.jpg';

export interface ShowcaseWorld {
  id: string;
  brand: string;
  tagline: string;
  summary: string;
  note: string;
  accent: string;
  images: { world: string; hero: string; packaging: string };
  elements: { title: string; copy: string }[];
  steps: { title: string; copy: string }[];
  packaging: string;
  series: string[];
}

/** Unofficial concept studies only: not client work, endorsements or available products. */
export const SHOWCASE_DISCLAIMER = 'Unofficial concept study — not client work or an available product.';

export const showcaseWorlds: ShowcaseWorld[] = [
  {
    id: 'airbnb', brand: 'Airbnb', tagline: 'Belong anywhere.', accent: 'coral',
    summary: 'A travel community turned into a little hillside world of homes, hosts and journeys.',
    note: 'A little world of big welcomes.',
    images: { world: airbnbWorld, hero: airbnbHero, packaging: airbnbPack },
    elements: [
      { title: 'The landmark', copy: 'A soft sculptural arch that ties the scene together.' },
      { title: 'Homes', copy: 'Different stays, different stories.' },
      { title: 'Community', copy: 'Hosts and guests from around the world.' },
      { title: 'Travel', copy: 'A winding road that connects people.' },
    ],
    steps: [
      { title: 'Discover', copy: 'Press the landmark for a satisfying click.' },
      { title: 'Explore', copy: 'The road turns, revealing homes and places.' },
      { title: 'Belong', copy: 'Warm windows light up a home, anywhere.' },
    ],
    packaging: 'Small stays, a bigger world — an illustrated town wraps the box.',
    series: ['Tokyo', 'Paris', 'Bali', 'New York'],
  },
  {
    id: 'a24', brand: 'A24', tagline: 'More movies for a stranger world.', accent: 'ink',
    summary: 'An independent film studio imagined as a moonlit cinema district full of odd, human stories.',
    note: 'A little cinema for a bigger imagination.',
    images: { world: a24World, hero: a24Hero, packaging: a24Pack },
    elements: [
      { title: 'Film culture', copy: 'Projectors, reels and clapperboards.' },
      { title: 'Characters', copy: 'Quirky, emotional, human — and one friendly ghost.' },
      { title: 'Places', copy: 'Theatres, streets and late nights.' },
      { title: 'Community', copy: 'Fans and creators sharing stories.' },
    ],
    steps: [
      { title: 'Press', copy: 'Click the cinema shutter.' },
      { title: 'Lights up', copy: 'The theatre glows warm.' },
      { title: 'A new scene', copy: 'Different details from every angle.' },
    ],
    packaging: 'Different stories, a brighter world — black ink and yellow light.',
    series: ['Late show', 'Moonlight', 'Ghost story', 'Road movie'],
  },
  {
    id: 'tesla', brand: 'Tesla', tagline: 'A cleaner, brighter future.', accent: 'red',
    summary: 'Cars, energy and people connected in a terraced clean-energy hill town.',
    note: 'Same planet. Further together.',
    images: { world: teslaWorld, hero: teslaHero, packaging: teslaPack },
    elements: [
      { title: 'Solar', copy: 'Sunlight turned into possibility.' },
      { title: 'Home', copy: 'A cleaner, smarter way to live.' },
      { title: 'The car', copy: 'A red road toward a sustainable future.' },
      { title: 'Beyond Earth', copy: 'Bold ideas that go further.' },
    ],
    steps: [
      { title: 'Press', copy: 'Press the sun to start the flow.' },
      { title: 'Energy flows', copy: 'Sun to home to car, lit along the road.' },
      { title: 'A brighter world', copy: 'A small action powers a bigger tomorrow.' },
    ],
    packaging: 'Small actions move a bigger world — line art with a red spine.',
    series: ['City', 'Mountain', 'Coast', 'Mars'],
  },
];
