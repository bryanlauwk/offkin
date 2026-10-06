/** Shared, bounded website-reading policy and safe client-facing failure messages. */
// Modern homepages include substantial inline CSS/SVG. Keep a hard 2 MB wire
// ceiling (identity encoding only) while accepting pages such as Tesla's 1.25 MB homepage.
export const WEBSITE_MAX_BYTES = 2_000_000;
export const WEBSITE_TIMEOUT_MS = 10_000;
export const WEBSITE_READ_MESSAGES = {
  unsafe_url: 'Use a public company website with a domain name, without login details or a custom port.',
  dns: 'We could not verify that website address. Check the company URL and try again.',
  unavailable: 'Secure website reading is unavailable right now. Please try again shortly.',
  secure: 'That website could not be read securely. Check its HTTPS address or try a different public company page.',
  too_large: 'That page is too large to read. Try a shorter public About page.',
  timeout: 'That website took too long to respond. Try again or use a faster company page.',
  blocked: 'That page does not allow automated reading or requires login. Try another public page or describe the business.',
  unsupported: 'Use a company web page rather than a download, image, or document.',
  encoding: 'That page could not be read as plain website content. Try another public company page.',
  empty: 'That page has too little readable text. Try the company’s About page or another public page.',
  redirect: 'We could not safely follow that website. Try its final public HTTPS address.',
  unreadable: 'That page could not be read. Try another public company page, such as About, or describe the business.',
} as const;
export type WebsiteReadCode = keyof typeof WEBSITE_READ_MESSAGES;
export function websiteReadMessage(code: unknown): string {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(WEBSITE_READ_MESSAGES, code)
    ? WEBSITE_READ_MESSAGES[code as WebsiteReadCode] : WEBSITE_READ_MESSAGES.unreadable;
}
export class WebsiteReadError extends Error {
  constructor(public status: number, message: string, public code: WebsiteReadCode = 'unreadable') {
    super(message);
    this.name = 'WebsiteReadError';
  }
}
