import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearEnquiryDraft, emptyEnquiryDraft, ENQUIRY_DRAFT_PREFIX, ENQUIRY_LIMITS, readEnquiryDraft, saveEnquiryDraft } from './enquiry-draft';
import { enquiryWhatsAppMessage, enquiryWhatsAppUrl, OFFKIN_WHATSAPP_NUMBER } from './enquiry-handoff';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
describe('Local buyer drafts', () => {
  it('starts without a stored or cloud draft, persists only the selected enquiry, and clears it', () => {
    expect(readEnquiryDraft('first')).toMatchObject({ restored: false, unavailable: false });
    const draft = { ...emptyEnquiryDraft(), company: 'Finch', contact: 'buyer@example.test', budget: 'MYR 10000 total' };
    expect(saveEnquiryDraft('first', draft)).toBe(true);
    expect(readEnquiryDraft('first')).toMatchObject({ draft, restored: true });
    expect(readEnquiryDraft('second').draft.company).toBe('');
    localStorage.setItem('offkin:proposal:test', 'untouched');
    expect(clearEnquiryDraft('first')).toBe(true);
    expect(readEnquiryDraft('first').restored).toBe(false);
    expect(localStorage.getItem('offkin:proposal:test')).toBe('untouched');
  });
  it.each(['null', '[]', 'not json', '{"version":2,"fields":{}}', '{"version":1,"fields":null}', 'x'.repeat(20001)])('rejects malformed and excessive saved data', raw => {
    localStorage.setItem(`${ENQUIRY_DRAFT_PREFIX}project`, raw);
    expect(readEnquiryDraft('project').restored).toBe(false);
  });
  it('bounds loaded values and rejects unknown field types or project options', () => {
    localStorage.setItem(`${ENQUIRY_DRAFT_PREFIX}project`, JSON.stringify({ version: 1, fields: { company: 'a'.repeat(500), story: ['bad'], projectType: 'Invented offering', contact: 42, unexpected: 'ignored' } }));
    const { draft } = readEnquiryDraft('project');
    expect(draft.company.length).toBe(ENQUIRY_LIMITS.company); expect(draft.story).toBe(''); expect(draft.contact).toBe(''); expect(draft.projectType).toBe('Not sure yet'); expect(draft).not.toHaveProperty('unexpected');
  });
  it('reports denied storage without inventing a save', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('disabled'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('disabled'); });
    expect(readEnquiryDraft('project').unavailable).toBe(true); expect(saveEnquiryDraft('project', emptyEnquiryDraft())).toBe(false); expect(clearEnquiryDraft('project')).toBe(false);
  });
});
describe('Reviewed WhatsApp handoff', () => {
  it('targets only the owner-selected international number with encoded, bounded text', () => {
    const text = enquiryWhatsAppMessage({ ...emptyEnquiryDraft(), company: '纸世界 Café & friends', quantity: '50', budget: 'MYR 10,000 total', timing: 'May 2027' }, true);
    const url = new URL(enquiryWhatsAppUrl(text));
    expect(url.origin).toBe('https://wa.me'); expect(url.pathname).toBe(`/${OFFKIN_WHATSAPP_NUMBER}`); expect(url.searchParams.get('text')).toBe(text);
    expect(text).toContain('纸世界 Café & friends'); expect(text).toContain('attach the saved collectible image'); expect(text).not.toMatch(/sent|submitted|received/);
    expect(enquiryWhatsAppMessage({ ...emptyEnquiryDraft(), company: 'a'.repeat(5000), inspiration: 'b'.repeat(5000) }, false).length).toBeLessThanOrEqual(1500);
  });
  it('never silently shares detailed notes, contacts, story, images, UUIDs or private URLs', () => {
    const text = enquiryWhatsAppMessage({ ...emptyEnquiryDraft(), company: 'A https://private.example/image?token=secret', quantity: '00000000-0000-4000-8000-000000000001', contact: 'private@example.test', notes: 'personal information', story: 'confidential story' }, true);
    expect(text).not.toMatch(/private\.example|token=secret|00000000-0000|private@example|personal information|confidential story/);
    expect(text).toContain('[link omitted]'); expect(text).toContain('[reference omitted]');
  });
});
it('keeps emoji boundaries and repairs malformed Unicode before URL encoding', () => {
  const draft = { ...emptyEnquiryDraft(), company: '🪁'.repeat(150) + '\ud800', budget: '\udfff USD' };
  expect(() => enquiryWhatsAppUrl(enquiryWhatsAppMessage(draft, false))).not.toThrow();
  const url = new URL(enquiryWhatsAppUrl('\ud800'));
  expect(url.searchParams.get('text')).toBe('�');
});
