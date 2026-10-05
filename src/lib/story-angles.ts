import type { WebsiteEvidence } from './concept-api';

export const storyAngles = [
  { id: 'ritual', title: 'The unseen ritual', label: 'Look behind the scenes', question: 'What quiet, repeated act makes the result possible?', object: 'A tiny working scene. One press reveals the care usually out of sight.', keywords: /make|made|craft|process|pack|build|care|hand|work|design/i },
  { id: 'change', title: 'The turning point', label: 'Catch a transformation', question: 'What changes because your business exists?', object: 'One before-and-after moment. A sliding part makes the transformation tangible.', keywords: /transform|change|turn|grow|create|help|solution|deliver|energy|better/i },
  { id: 'human', title: 'The human trace', label: 'Find the person in it', question: 'What small moment would your people recognise instantly?', object: 'A familiar scene with one telling detail. A simple action brings someone into the story.', keywords: /people|team|customer|community|together|home|share|guest|family|experience/i },
] as const;
export type StoryAngleId = typeof storyAngles[number]['id'];
export function getStoryAngle(id: string) { return storyAngles.find(angle => angle.id === id); }
export function angleEvidence(evidence: WebsiteEvidence | null, business: string) {
  const text = evidence?.excerpt || business;
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map(value => value.trim()).filter(value => value.length > 15);
  const used = new Set<string>();
  return storyAngles.map(angle => {
    const match = sentences.find(sentence => !used.has(sentence) && angle.keywords.test(sentence));
    if (match) used.add(match);
    return match ? match.slice(0, 210) : '';
  });
}
