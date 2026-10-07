import { readFileSync } from 'node:fs';
import { parse } from 'postcss';
import { describe, expect, it } from 'vitest';

const sheet = parse(readFileSync('src/components/proposal-studio.css', 'utf8'));

// A stylesheet contract check, not a browser layout/paint measurement. Resolve
// the named layout selectors at each width so later media rules cannot quietly
// reintroduce the absolute positioning that covered the live entry form.
function declarations(selectors: string[], viewport: number) {
  const result: Record<string, string> = {};
  sheet.walkRules(rule => {
    if (!rule.selectors.some(selector => selectors.includes(selector))) return;
    let parent: typeof rule.parent | typeof sheet.parent = rule.parent;
    while (parent) {
      if (parent.type === 'atrule' && parent.name === 'media') {
        const constraints = [...parent.params.matchAll(/(min|max)-width\s*:\s*(\d+)px/g)];
        if (!constraints.length || constraints.some(([, bound, width]) => bound === 'min' ? viewport < Number(width) : viewport > Number(width))) return;
      }
      parent = parent.parent;
    }
    rule.walkDecls(declaration => { result[declaration.prop] = declaration.value; });
  });
  return result;
}

describe('Public entry layout boundaries', () => {
  it.each([801, 960, 1024, 1164, 1179, 1440, 1700, 1920, 2560])('keeps desktop artwork in its own in-flow column at %ipx', viewport => {
    const opening = declarations(['.op-opening', '.op-started .op-opening'], viewport);
    const intro = declarations(['.op-intro'], viewport);
    const entry = declarations(['.op-entry-panel'], viewport);
    const art = declarations(['.op-hero-art'], viewport);
    expect(opening.display).toBe('grid');
    expect(opening['grid-template-columns']).toBe('minmax(0,48fr) minmax(0,52fr)');
    expect(opening['column-gap']).toBe('clamp(20px,2vw,36px)');
    expect(intro['grid-column']).toBe('1');
    expect(entry['grid-column']).toBe('1');
    expect(intro['grid-row']).toBe('1');
    expect(entry['grid-row']).toBe('2');
    expect(art['grid-column']).toBe('2');
    expect(art['grid-row']).toBe('1 / span 2');
    expect(art.position).toBe('relative');
    expect(art.top).toBe('auto');
    expect(art.right).toBe('auto');
    expect(art.width).toBe('100%');
    expect(art['max-width']).toBe('100%');
    expect(art.margin).toBe('0');
  });

  it.each([320, 390, 485, 640, 800])('stacks artwork below the form in normal flow at %ipx', viewport => {
    const opening = declarations(['.op-opening', '.op-started .op-opening'], viewport);
    const art = declarations(['.op-hero-art'], viewport);
    expect(opening.display).toBe('flex');
    expect(opening['flex-direction']).toBe('column');
    expect(art.position).toBe('relative');
    expect(art.top).toBe('auto');
    expect(art.right).toBe('auto');
    expect(art.order).toBe('3');
    expect(art.margin).toBe('16px calc(-1 * var(--op-gutter)) 22px');
  });

  it('keeps CJK brand runs together while allowing an oversized name to wrap', () => {
    const board = parse(readFileSync('src/components/proposal-board.css', 'utf8'));
    const brand: Record<string,string> = {};
    board.walkRules(rule => { if(rule.selectors.includes('.pb-brand')) rule.walkDecls(declaration => { brand[declaration.prop] = declaration.value; }); });
    expect(brand['word-break']).toBe('keep-all');
    expect(brand['overflow-wrap']).toBe('anywhere');
  });

  it('reserves unbroken two-digit application labels at every breakpoint', () => {
    for (const viewport of [320, 485, 801, 1164, 1920]) {
      const number = declarations(['.op-application-number'], viewport);
      expect(number['flex-shrink']).toBe('0');
      expect(number['white-space']).toBe('nowrap');
      expect(number['min-width']).toBe('2ch');
      expect(declarations(['.op-application-copy>div'], viewport)['min-width']).toBe('0');
    }
  });
});
