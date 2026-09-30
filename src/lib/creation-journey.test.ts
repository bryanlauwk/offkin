import { describe, expect, it } from 'vitest';
import { emptyDraft, makeCreationContext } from './creation-journey';
describe('customer direction', () => {
 it('preserves exact supplied wording, including whitespace and punctuation', () => { const wording = '  MY brand™\nSame. Words!  '; const result = JSON.parse(makeCreationContext({ ...emptyDraft, business: 'Gift personalisation.', wording })); expect(result.exactWording).toBe(wording); });
 it('never silently truncates a long direction', () => { expect(() => makeCreationContext({ ...emptyDraft, business: 'x'.repeat(601) })).toThrow(/shorten/); });
 it('requires a customer-confirmed business story', () => { expect(() => makeCreationContext({ ...emptyDraft })).toThrow(/known for/); });
});
