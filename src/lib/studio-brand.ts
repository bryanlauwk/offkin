// Product identity only. Existing custom admin settings remain authoritative.
export const studioBrand = {
  name: 'OFFKIN',
  chineseName: '异趣伙伴',
  displayName: 'OFFKIN｜异趣伙伴',
  headline: 'Your business DNA. Made collectible.',
  description: 'An independent creative studio connecting art, technology and commercial purpose through physical stories. Co-create curious brand worlds. Let the story choose the form.',
  // Browser-tab / search-result wording. The on-page headline above stays exact.
  pageTitleSuffix: 'Turn Your Achievements Into Collectibles',
  metaDescription: 'Celebrate personal and business milestones with OFFKIN collectible concepts and illustrated story cards. Physical editions require design review and agreed pricing.',
};
export const displayStudioName = (name: string) => name === studioBrand.name ? studioBrand.displayName : name;
