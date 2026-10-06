import { describe, expect, it } from 'vitest';
import { normalizeCompanyWebsite } from './company-website';

describe('company website input', () => {
  it('accepts bare domains and strips tracking parameters', () => {
    expect(normalizeCompanyWebsite(' Example.com/about?source=ad#team ')).toBe('https://example.com/about');
  });
  it('bounds the normalized address including percent-encoded Unicode', () => {
    const base = 'https://example.com/';
    expect(normalizeCompanyWebsite(base + 'a'.repeat(300 - base.length))).toHaveLength(300);
    expect(normalizeCompanyWebsite(base + 'a'.repeat(301 - base.length))).toBeNull();
    expect(normalizeCompanyWebsite(base + '界'.repeat(100))).toBeNull();
  });
  it('rejects unsupported schemes, credentials and invalid domains', () => {
    for (const value of ['javascript:alert(1)', 'ftp://example.com', 'https://person:secret@example.com', 'not a website', 'localhost']) {
      expect(normalizeCompanyWebsite(value)).toBeNull();
    }
  });
});

