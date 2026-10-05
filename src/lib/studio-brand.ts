// Product identity only. Existing custom admin settings remain authoritative.
export const studioBrand = {
  name: 'OFFKIN',
  chineseName: '异趣伙伴',
  displayName: 'OFFKIN｜异趣伙伴',
  headline: 'Your business DNA. Made collectible.',
  description: 'An independent creative studio connecting art, technology and commercial purpose through physical stories. Start small; keep the format open.',
};
export const displayStudioName = (name: string) => name === studioBrand.name ? studioBrand.displayName : name;
