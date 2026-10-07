// Product identity only. Existing custom admin settings remain authoritative.
export const studioBrand = {
  name: 'OFFKIN',
  chineseName: '异趣伙伴',
  displayName: 'OFFKIN｜异趣伙伴',
  headline: 'Your business DNA. Made collectible.',
  description: 'An independent creative studio connecting art, technology and commercial purpose through physical stories. Co-create curious brand worlds. Let the story choose the form.',
  // Browser-tab / search-result wording. The on-page headline above stays exact.
  pageTitleSuffix: 'Illustrated Brand Worlds, Made Collectible',
  metaDescription: 'OFFKIN｜异趣伙伴 is an independent creative studio. Co-create an illustrated brand world and shape it into a physical collectible concept — prototyped offline.',
};
export const displayStudioName = (name: string) => name === studioBrand.name ? studioBrand.displayName : name;
