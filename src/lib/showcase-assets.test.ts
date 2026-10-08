import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { showcaseWorlds } from './showcase-worlds';

describe('showcase web artwork', () => {
  it('ships six full-resolution WebP assets within the web delivery budget', () => {
    let totalBytes = 0;
    for (const world of showcaseWorlds) {
      expect(world.board).toContain(`${world.id}-world-board-v3.webp`);
      expect(world.illustration).toContain(`${world.id}-ink-world-v3.webp`);
      for (const kind of ['world-board', 'ink-world']) {
        const file = `src/assets/showcase/${world.id}-${kind}-v3.webp`;
        const bytes = readFileSync(file);
        totalBytes += bytes.length;
        expect(bytes.length, file).toBeLessThanOrEqual(600_000);
        expect(bytes.toString('ascii', 0, 4), file).toBe('RIFF');
        expect(bytes.toString('ascii', 8, 12), file).toBe('WEBP');
        expect(bytes.readUInt32LE(4) + 8, file).toBe(bytes.length);
        // These opaque images use a VP8 keyframe, whose frame header stores dimensions.
        expect(bytes.toString('ascii', 12, 16), file).toBe('VP8 ');
        expect(bytes.subarray(23, 26).toString('hex'), file).toBe('9d012a');
        expect(bytes.readUInt16LE(26) & 0x3fff, file).toBe(1536);
        expect(bytes.readUInt16LE(28) & 0x3fff, file).toBe(1024);
      }
    }
    expect(totalBytes).toBeLessThan(2_500_000);
  });
});
