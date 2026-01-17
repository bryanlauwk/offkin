export interface Level {
  id: number;
  title: string;
  description: string;
  visualPrompt: string;
  choiceA: string;  // Cooperate option
  choiceB: string;  // Defect option
  statText: string;
}

export const levels: Level[] = [
  {
    id: 1,
    title: "The Coffee Shop",
    description: "You find $10 on the floor. A stranger sees it at the same time.",
    visualPrompt: "Two cute chibi characters looking down at a realistic $10 bill on the floor. One is reaching for it.",
    choiceA: "Split It ($5 each)",
    choiceB: "Snatch It ($10 for you)",
    statText: "92% of people split the money. Faith in humanity: High."
  },
  {
    id: 2,
    title: "The Group Project",
    description: "11:59 PM. The project is due. Do you work or sleep?",
    visualPrompt: "Split screen. Chibi A is typing furiously on a laptop with dark circles under eyes. Chibi B is tucked in bed with a 'Zzz' bubble.",
    choiceA: "Do the Work",
    choiceB: "Go to Sleep",
    statText: "Everyone hates group projects. 40% chose to sleep out of spite."
  },
  {
    id: 3,
    title: "The Traffic Merge",
    description: "Lanes are merging. That car is trying to cut in.",
    visualPrompt: "Two round chibi cars (bumper car style). One is aggressively nosing in front of the other. Tiny chibi drivers visible.",
    choiceA: "Let them in",
    choiceB: "Block them!",
    statText: "Road rage incident avoided... or not."
  },
  {
    id: 4,
    title: "The Last Slice",
    description: "One slice of pizza left. You and your roommate lock eyes.",
    visualPrompt: "A single pepperoni pizza slice glowing like holy treasure. Two hungry chibis holding forks, drooling.",
    choiceA: "Split the slice",
    choiceB: "Eat it whole",
    statText: "Greed is rising. 55% of players ate the slice."
  },
  {
    id: 5,
    title: "The Corporate Ladder",
    description: "The boss is mad. You can blame your partner to save yourself.",
    visualPrompt: "Office setting. A giant angry boss shadow looms over two tiny chibis in ties. One is pointing a finger at the other.",
    choiceA: "Stay Silent",
    choiceB: "Snitch",
    statText: "The world is getting colder."
  },
  {
    id: 6,
    title: "The Parachute",
    description: "Plane is going down. One parachute. It *might* hold two.",
    visualPrompt: "Mid-air skydiving scene. One parachute bag. Two chibis falling through clouds. One is trying to kick the other away.",
    choiceA: "Hold on tight",
    choiceB: "Kick them off",
    statText: "Survival instincts kicking in. Cooperators dropped to 25%."
  },
  {
    id: 7,
    title: "The Hostage Exchange",
    description: "Spy exchange. Briefcase for briefcase. Honor or betrayal?",
    visualPrompt: "A foggy bridge. Two chibis in trench coats and sunglasses handing over briefcases. One briefcase is overflowing with newspapers.",
    choiceA: "Give Real Docs",
    choiceB: "Give Trash",
    statText: "Trust is dead. 80% of players gave the newspapers."
  },
  {
    id: 8,
    title: "The Nuclear Button",
    description: "Radar shows a possible launch. Do you wait or fire back?",
    visualPrompt: "A chibi President sitting at a desk with a giant red button protected by a glass case. They are sweating profusely.",
    choiceA: "Wait & Verify",
    choiceB: "LAUNCH!!!",
    statText: "Mutually Assured Destruction loaded."
  },
  {
    id: 9,
    title: "The Alien Zoo",
    description: "Aliens say: 'Eat the Gloop and go free. Or refuse.'",
    visualPrompt: "Sci-fi cage. A green alien offers a bowl of purple glowing slime (Gloop) to two disgusted human chibis.",
    choiceA: "Refuse Gloop",
    choiceB: "Eat Gloop",
    statText: "Enjoy the Gloop."
  },
  {
    id: 10,
    title: "The Simulation Reboot",
    description: "You are AI. Server RAM is low. Delete the other AI to survive?",
    visualPrompt: "Matrix code background. Two chibis made of wireframe/glitch pixels. One is holding a 'Delete' key weapon.",
    choiceA: "Compress Code",
    choiceB: "Delete Opponent",
    statText: "404: Morality Not Found."
  }
];

export type Choice = 'cooperate' | 'defect';

export type Outcome = 'win-win' | 'you-betray' | 'they-betray' | 'both-betray';

export interface RoundResult {
  levelId: number;
  playerChoice: Choice;
  opponentChoice: Choice;
  outcome: Outcome;
}

export interface Archetype {
  id: string;
  name: string;
  title: string;
  description: string;
  minCooperateRate: number;
  maxCooperateRate: number;
}

export const archetypes: Archetype[] = [
  {
    id: 'saint',
    name: 'The Saint',
    title: 'Eternal Optimist',
    description: 'You trust everyone, even after being betrayed. Either you\'re incredibly pure-hearted... or you haven\'t learned yet.',
    minCooperateRate: 80,
    maxCooperateRate: 100,
  },
  {
    id: 'pragmatist',
    name: 'The Pragmatist',
    title: 'Calculated Cooperator',
    description: 'You cooperate when it makes sense. Betray when necessary. You\'d survive any game theory exam.',
    minCooperateRate: 50,
    maxCooperateRate: 79,
  },
  {
    id: 'betrayer',
    name: 'The Betrayer',
    title: 'Self-Interested Actor',
    description: 'You look out for yourself first. The world is a jungle, and you\'re not getting eaten today.',
    minCooperateRate: 20,
    maxCooperateRate: 49,
  },
  {
    id: 'chaos',
    name: 'The Chaos Agent',
    title: 'Destroyer of Trust',
    description: 'You chose violence. Every time. Society crumbles when people like you exist. Beautiful.',
    minCooperateRate: 0,
    maxCooperateRate: 19,
  },
];

export function getArchetype(results: RoundResult[]): Archetype {
  const cooperateCount = results.filter(r => r.playerChoice === 'cooperate').length;
  const cooperateRate = Math.round((cooperateCount / results.length) * 100);
  
  for (const archetype of archetypes) {
    if (cooperateRate >= archetype.minCooperateRate && cooperateRate <= archetype.maxCooperateRate) {
      return archetype;
    }
  }
  
  return archetypes[archetypes.length - 1]; // Default to chaos
}

export function getOutcome(playerChoice: Choice, opponentChoice: Choice): Outcome {
  if (playerChoice === 'cooperate' && opponentChoice === 'cooperate') return 'win-win';
  if (playerChoice === 'defect' && opponentChoice === 'cooperate') return 'you-betray';
  if (playerChoice === 'cooperate' && opponentChoice === 'defect') return 'they-betray';
  return 'both-betray';
}

export function getOpponentChoice(
  level: number, 
  previousPlayerChoice: Choice | null,
): Choice {
  // Level 1: Always cooperate to establish baseline trust
  if (level === 1) return 'cooperate';
  
  // Levels 2-9: Tit-for-Tat with 20% noise
  if (level <= 9) {
    const shouldMirror = Math.random() > 0.2;
    if (shouldMirror && previousPlayerChoice) {
      return previousPlayerChoice;
    }
    return Math.random() > 0.5 ? 'cooperate' : 'defect';
  }
  
  // Level 10: Pure random (AI simulation)
  return Math.random() > 0.5 ? 'cooperate' : 'defect';
}

export function getOutcomeText(outcome: Outcome): string {
  switch (outcome) {
    case 'win-win':
      return 'You both cooperated! 🤝';
    case 'you-betray':
      return 'You betrayed them. They trusted you. 😈';
    case 'they-betray':
      return 'They betrayed you. You trusted them. 😢';
    case 'both-betray':
      return 'Mutual destruction. Trust no one. 💥';
  }
}
