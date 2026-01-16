export interface Level {
  id: number;
  title: string;
  description: string;
  choiceNow: string;
  choiceLater: string;
  visualType: 'marshmallow' | 'battery' | 'tv' | 'wallet' | 'embarrassment' | 'teeth' | 'timer';
}

export const levels: Level[] = [
  {
    id: 1,
    title: "The Classic",
    description: "A single marshmallow sits before you. The researcher has left the room.",
    choiceNow: "Eat 1 Marshmallow NOW",
    choiceLater: "Wait 15 mins for 2 Marshmallows",
    visualType: 'marshmallow',
  },
  {
    id: 2,
    title: "The Battery",
    description: "Your phone shows 1% battery. The Uber is 2 minutes away. The charger is right there.",
    choiceNow: "Charge to 5% NOW (Enough for one Uber)",
    choiceLater: "Wait 45 mins in silence for 100%",
    visualType: 'battery',
  },
  {
    id: 3,
    title: "The Spoiler",
    description: "The finale of your favorite show just dropped. Your internet connection is struggling.",
    choiceNow: "Watch NOW in 240p buffering quality",
    choiceLater: "Wait 3 years for the 4K remaster",
    visualType: 'tv',
  },
  {
    id: 4,
    title: "The Wealth",
    description: "A mysterious benefactor offers you a choice. There are no loopholes.",
    choiceNow: "Get $50 deposited NOW",
    choiceLater: "Get $10,000,000 on your 99th Birthday",
    visualType: 'wallet',
  },
  {
    id: 5,
    title: "The Embarrassment",
    description: "You just tripped spectacularly in public. A crowd witnessed everything. They are laughing.",
    choiceNow: "Erase everyone's memory NOW",
    choiceLater: "Keep the memory, receive $500 in 10 years",
    visualType: 'embarrassment',
  },
  {
    id: 6,
    title: "The Physical",
    description: "A popcorn kernel is lodged between your teeth. It has been there for hours. You can feel it.",
    choiceNow: "Remove the kernel NOW",
    choiceLater: "Leave it for a week, never get a cavity again",
    visualType: 'teeth',
  },
];

export interface Archetype {
  id: string;
  name: string;
  title: string;
  description: string;
  minLaterCount: number;
  maxLaterCount: number;
  requiresLevel7: boolean;
}

export const archetypes: Archetype[] = [
  {
    id: 'toddler',
    name: 'The Toddler',
    title: 'Instant Gratification Specialist',
    description: 'You want it and you want it now. Delayed gratification is a myth invented by people with better impulse control. At least you are honest about it.',
    minLaterCount: 0,
    maxLaterCount: 2,
    requiresLevel7: false,
  },
  {
    id: 'consumer',
    name: 'The Consumer',
    title: 'Strategic Impulse Manager',
    description: 'You weigh your options carefully, then usually pick the one that feels good right now. This is called being human. Congratulations on your humanity.',
    minLaterCount: 3,
    maxLaterCount: 4,
    requiresLevel7: false,
  },
  {
    id: 'economist',
    name: 'The Economist',
    title: 'Future-Oriented Decision Maker',
    description: 'You understand compound interest and it shows. Your spreadsheets have spreadsheets. You probably meal prep on Sundays.',
    minLaterCount: 5,
    maxLaterCount: 6,
    requiresLevel7: false,
  },
  {
    id: 'monk',
    name: 'The Monk',
    title: 'Master of Delayed Gratification',
    description: 'Your patience is superhuman. You waited for the full 60 seconds. You probably read the terms and conditions too. Disturbing.',
    minLaterCount: 6,
    maxLaterCount: 6,
    requiresLevel7: true,
  },
];

export function getArchetype(laterCount: number, passedLevel7: boolean): Archetype {
  // The Monk requires both all "later" choices AND passing level 7
  if (laterCount === 6 && passedLevel7) {
    return archetypes.find(a => a.id === 'monk')!;
  }
  
  // Find the matching archetype based on later count
  const archetype = archetypes.find(
    a => laterCount >= a.minLaterCount && laterCount <= a.maxLaterCount && !a.requiresLevel7
  );
  
  return archetype || archetypes[0];
}
