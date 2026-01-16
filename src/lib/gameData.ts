export type Phase = 'classic' | 'reliability' | 'economic' | 'modern';

export interface Level {
  id: number;
  phase: Phase;
  phaseTitle: string;
  phaseSubtitle: string;
  title: string;
  description: string;
  researcherDialogue: string;
  choiceNow: string;
  choiceLater: string;
  lesson?: string;
  visualType: 'marshmallow' | 'fatigue' | 'unreliable' | 'broken' | 'starvation' | 'inflation' | 'lootbox' | 'treadmill' | 'mirror' | 'void' | 'battery' | 'tv' | 'wallet' | 'embarrassment' | 'teeth';
}

export const levels: Level[] = [
  // Phase 1: The Classic Era (Willpower)
  {
    id: 1,
    phase: 'classic',
    phaseTitle: 'The Classic Era',
    phaseSubtitle: 'The 1970s view: "Patience is a virtue. Impatience is a flaw."',
    title: 'The Control Group',
    description: 'A perfect white room. One marshmallow sits on a plate before you.',
    researcherDialogue: 'I will leave the room. If you wait, you get two.',
    choiceNow: 'Eat it.',
    choiceLater: 'Wait.',
    lesson: 'You acted according to standard behavioral expectations.',
    visualType: 'marshmallow',
  },
  {
    id: 2,
    phase: 'classic',
    phaseTitle: 'The Classic Era',
    phaseSubtitle: 'Willpower is a finite resource.',
    title: 'The Fatigue',
    description: 'Same room, but you look tired. Your eyes are heavy. The day has been long.',
    researcherDialogue: 'We are running late. If you wait twice as long, you get two.',
    choiceNow: "I'm too tired. Eat it.",
    choiceLater: 'I can suffer. Wait.',
    lesson: 'Ego Depletion theory suggests willpower is a finite resource.',
    visualType: 'fatigue',
  },
  // Phase 2: The Reliability Era (Trust)
  {
    id: 3,
    phase: 'reliability',
    phaseTitle: 'The Reliability Era',
    phaseSubtitle: 'The 2010s re-evaluation: "Waiting is only rational if the system is honest."',
    title: 'The Unreliable Narrator',
    description: 'The room is messy. The researcher\'s lab coat is stained. He looks disorganized.',
    researcherDialogue: "I'll be right back with another one. I promise. Trust me.",
    choiceNow: "He's lying. Eat the one I have.",
    choiceLater: 'Trust the authority. Wait.',
    lesson: 'Rational Impatience: In unstable environments, taking what you have is the smart move.',
    visualType: 'unreliable',
  },
  {
    id: 4,
    phase: 'reliability',
    phaseTitle: 'The Reliability Era',
    phaseSubtitle: 'Previous trauma dictates future patience.',
    title: 'The Broken Contract',
    description: 'You waited in the last round. The researcher returns empty-handed.',
    researcherDialogue: 'Sorry, we ran out. But if you wait again, I might find a third one.',
    choiceNow: 'Fool me once. Eat it.',
    choiceLater: 'Sunk Cost Fallacy. Keep waiting.',
    lesson: 'Previous trauma dictates future patience.',
    visualType: 'broken',
  },
  // Phase 3: The Economic Era (Scarcity & Inflation)
  {
    id: 5,
    phase: 'economic',
    phaseTitle: 'The Economic Era',
    phaseSubtitle: 'The Sociological view: "Patience is a luxury of the rich."',
    title: 'The Starvation',
    description: 'Your character is visibly shaking from hunger. The health bar is blinking red.',
    researcherDialogue: 'You are starving. But if you wait, you can have a feast later.',
    choiceNow: 'Survive now. Eat.',
    choiceLater: 'Risk death for abundance. Wait.',
    lesson: "Maslow's Hierarchy: You cannot self-actualize if you cannot survive.",
    visualType: 'starvation',
  },
  {
    id: 6,
    phase: 'economic',
    phaseTitle: 'The Economic Era',
    phaseSubtitle: 'Hyperbolic Discounting.',
    title: 'The Inflation',
    description: 'The marshmallow is slowly shrinking in real-time. Its value decreases every second.',
    researcherDialogue: 'The value of the marshmallow decreases by 10% every minute.',
    choiceNow: 'Cash out now before it disappears.',
    choiceLater: 'Wait for two (tiny) marshmallows.',
    lesson: 'Hyperbolic Discounting: If future value drops, patience becomes a bad investment.',
    visualType: 'inflation',
  },
  // Phase 4: The Modern Era (Dopamine & The Void)
  {
    id: 7,
    phase: 'modern',
    phaseTitle: 'The Modern Era',
    phaseSubtitle: 'The Current view: "We are waiting for things that don\'t matter."',
    title: 'The Algorithm',
    description: 'The marshmallow is now a "Mystery Box" with a glowing loot-box aura.',
    researcherDialogue: 'This box might contain 10 marshmallows. Or zero. It\'s random.',
    choiceNow: 'Take the safe 1 marshmallow.',
    choiceLater: 'Gamble on the box.',
    lesson: 'We have replaced "Working" with "Gambling."',
    visualType: 'lootbox',
  },
  {
    id: 8,
    phase: 'modern',
    phaseTitle: 'The Modern Era',
    phaseSubtitle: 'Accumulation does not equal satisfaction.',
    title: 'The Hedonic Treadmill',
    description: 'You are sitting on a pile of 1,000 marshmallows. You are full. You feel nothing.',
    researcherDialogue: 'If you wait, I will give you 1,000 more.',
    choiceNow: 'I have enough. Eat one just for fun.',
    choiceLater: 'I need more. Wait.',
    lesson: 'Accumulation does not equal satisfaction.',
    visualType: 'treadmill',
  },
  {
    id: 9,
    phase: 'modern',
    phaseTitle: 'The Modern Era',
    phaseSubtitle: 'We delay gratification to signal virtue to others.',
    title: 'The Identity',
    description: 'A mirror. You see yourself. Behind you, an audience of thousands is watching.',
    researcherDialogue: 'You can eat the marshmallow, but everyone watching this stream will know you did it.',
    choiceNow: 'Satisfy myself. Eat.',
    choiceLater: 'Perform for the audience. Wait.',
    lesson: 'We delay gratification to signal virtue to others.',
    visualType: 'mirror',
  },
];

// Level 10 is special - handled separately
export const level10 = {
  id: 10,
  phase: 'modern' as Phase,
  phaseTitle: 'The Final Test',
  phaseSubtitle: 'Sometimes, the test is knowing when to stop testing.',
  title: 'The Pause',
  description: '',
  researcherDialogue: '',
  visualType: 'void' as const,
};

export const philosophicalTexts = [
  'You are still waiting.',
  'Are you waiting for a reward?',
  'There is no code for a reward here.',
  'Sometimes, the test isn\'t about ability. It\'s about knowing when to stop testing.',
];

export interface Archetype {
  id: string;
  name: string;
  title: string;
  description: string;
}

export const archetypes: Archetype[] = [
  {
    id: 'stoic',
    name: 'The Stoic',
    title: 'Endurer of Future Suffering',
    description: 'You endure suffering for a future that isn\'t guaranteed. You probably have a 10-year plan. You definitely floss.',
  },
  {
    id: 'hedonist',
    name: 'The Hedonist',
    title: 'Liver of the Now',
    description: 'You live in the now. You will likely die happy but broke. At least you enjoyed the marshmallow.',
  },
  {
    id: 'skeptic',
    name: 'The Skeptic',
    title: 'Rational Doubter of Systems',
    description: 'You don\'t lack patience; you lack faith in the system. You noticed when the researcher was lying. You are smart.',
  },
  {
    id: 'nihilist',
    name: 'The Nihilist',
    title: 'Seer of the Void',
    description: 'You realized the game was rigged. There was never a second marshmallow. There was never even a first one.',
  },
];

export interface ChoiceRecord {
  levelId: number;
  choice: 'now' | 'later';
}

export function getArchetype(choices: ChoiceRecord[], level10IdleTime: number, level10Clicked: boolean): Archetype {
  const nowCount = choices.filter(c => c.choice === 'now').length;
  const laterCount = choices.filter(c => c.choice === 'later').length;
  
  // Check for Skeptic: ate during trust levels (3-4) or inflation (6)
  const trustLevelChoices = choices.filter(c => [3, 4, 6].includes(c.levelId) && c.choice === 'now');
  const isSkeptic = trustLevelChoices.length >= 2;
  
  // Check for Nihilist: clicked LEAVE immediately at Level 10 (< 5 seconds idle)
  const isNihilist = level10Clicked && level10IdleTime < 5;
  
  if (isNihilist) {
    return archetypes.find(a => a.id === 'nihilist')!;
  }
  
  if (isSkeptic) {
    return archetypes.find(a => a.id === 'skeptic')!;
  }
  
  // Stoic: mostly waited
  if (laterCount >= 6) {
    return archetypes.find(a => a.id === 'stoic')!;
  }
  
  // Hedonist: mostly ate
  return archetypes.find(a => a.id === 'hedonist')!;
}

export function getPhaseColor(phase: Phase): string {
  switch (phase) {
    case 'classic': return 'hsl(0 0% 40%)';
    case 'reliability': return 'hsl(30 30% 40%)';
    case 'economic': return 'hsl(200 30% 40%)';
    case 'modern': return 'hsl(270 20% 40%)';
    default: return 'hsl(0 0% 40%)';
  }
}
