// Product identity only. Existing custom admin settings remain authoritative.
export const studioBrand = {
  name: 'OFFKIN',
  chineseName: '异趣伙伴',
  displayName: 'OFFKIN｜异趣伙伴',
  headline: 'Your business DNA. Made collectible.',
  description: 'An independent creative studio for stories you can hold. AI-assisted ideas. Thoughtful physical objects.',
};
export const displayStudioName = (name: string) => name === studioBrand.name ? studioBrand.displayName : name;
