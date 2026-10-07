import { describe, expect, it } from 'vitest';
import {
  PROPOSAL_ASSET_TIMEOUT_MS, PROPOSAL_STAGE_BUDGET_MS, PROPOSAL_STORAGE_RESERVE_MS,
  PROPOSAL_TEXT_TIMEOUT_MS, PROPOSAL_CORRECTION_TIMEOUT_MS, PROPOSAL_IMAGE_TIMEOUT_MS,
  providerCallTimeout, proposalCallTimeout,
} from '../../supabase/functions/generate-concept/proposal-budget';

describe('shared proposal stage deadlines', () => {
  it('fits both text calls, a full image window and storage inside the client deadline', () => {
    expect(PROPOSAL_ASSET_TIMEOUT_MS).toBe(220_000);
    expect(PROPOSAL_STAGE_BUDGET_MS).toBe(190_000);
    expect(PROPOSAL_TEXT_TIMEOUT_MS + PROPOSAL_CORRECTION_TIMEOUT_MS + PROPOSAL_IMAGE_TIMEOUT_MS + PROPOSAL_STORAGE_RESERVE_MS).toBeLessThanOrEqual(PROPOSAL_STAGE_BUDGET_MS);
    expect(PROPOSAL_STAGE_BUDGET_MS).toBeLessThan(PROPOSAL_ASSET_TIMEOUT_MS);
  });

  it('clips initial text and correction to leave the complete image and save window', () => {
    expect(proposalCallTimeout('design', 0)).toBe(40_000);
    expect(proposalCallTimeout('correction', 40_000)).toBe(25_000);
    expect(proposalCallTimeout('design', 50_000)).toBe(20_000);
    expect(proposalCallTimeout('correction', 65_000)).toBe(5_000);
    expect(proposalCallTimeout('image', 70_000)).toBe(100_000);
  });

  it('refuses a new provider call after the image and storage reserve is exhausted', () => {
    expect(proposalCallTimeout('design', 70_000)).toBe(0);
    expect(proposalCallTimeout('correction', 80_000)).toBe(0);
    expect(proposalCallTimeout('image', 70_001)).toBe(0);
    expect(proposalCallTimeout('image', 160_000)).toBe(0);
  });

  it('uses conservative integer milliseconds for fractional monotonic-clock readings', () => {
    expect(proposalCallTimeout('design', 0.75)).toBe(40_000);
    expect(proposalCallTimeout('correction', 65_000.25)).toBe(4_999);
    expect(proposalCallTimeout('image', 70_000.01)).toBe(0);
    expect(proposalCallTimeout('correction', 69_999.1)).toBe(0);
    expect(Number.isInteger(proposalCallTimeout('design', 45_000.125))).toBe(true);
  });

  it.each([Number.NaN, Infinity, -1, -Infinity])('fails closed for an unusable elapsed clock: %s', elapsed => {
    expect(proposalCallTimeout('design', elapsed)).toBe(0);
    expect(proposalCallTimeout('correction', elapsed)).toBe(0);
    expect(proposalCallTimeout('image', elapsed)).toBe(0);
  });

  it('preserves the legacy provider default and clamps server-only overrides', () => {
    expect(providerCallTimeout()).toBe(100_000);
    expect(providerCallTimeout(300_000)).toBe(100_000);
    expect(providerCallTimeout(40_000)).toBe(40_000);
    expect(providerCallTimeout(25_000.5)).toBe(25_000);
  });

  it.each([Number.NaN, Infinity, -1, 0, 0.5])('rejects an invalid internal provider timeout: %s', timeout => {
    expect(providerCallTimeout(timeout)).toBe(0);
  });
});
