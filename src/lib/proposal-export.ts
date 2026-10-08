import { OFFKIN_WHATSAPP_DISPLAY } from './enquiry-handoff';
import { PROPOSAL_STAGES, type ProposalConcept, type ProposalStage } from './proposal-api';
import { assetsForVersion, proposalBrief, type ProposalSession } from './proposal-session';

export const CONCEPT_PREVIEW_NOTE = 'Concept preview. Final design, functionality and pricing confirmed during the build proposal.';
export const EXPORT_IMAGE_LIMIT = 8 * 1024 * 1024;
export const EXPORT_TOTAL_LIMIT = 24 * 1024 * 1024;
export const EXPORT_IMAGE_TIMEOUT = 15000;
const labels: Record<ProposalStage, string> = { world: 'Brand world', physical: 'Collectible hero', details: 'Components & proposed interaction', packaging: 'Packaging concept' };
export type ExportSnapshot = { key: string; versionKey?: string; referenceSeed: string; brief: string; state: string; stages: { stage: ProposalStage; asset?: ProposalConcept; unavailable: string }[] };
export type RequestNotes = { quantity: string; timing: string; budget: string; notes: string; projectType?: string; company?: string; story?: string; name?: string; contact?: string; size?: string; destination?: string; inspiration?: string };
export type PreparedRequest = { html: string; missing: string[]; embedded: number };
const active = (signal: AbortSignal) => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** Capture only the displayed version; never mix an unfinished revision with accepted visuals. */
export function proposalExportSnapshot(session: ProposalSession, all: Record<string, ProposalConcept>): ExportSnapshot {
  const version = session.accepted || session.pending;
  const assets = assetsForVersion(version, all);
  const connected = (stage: ProposalStage, asset: ProposalConcept) => stage === 'world' ||
    asset.sourceImageIds.includes(version?.assets.world || '') && stage === 'physical' ||
    (stage === 'details' || stage === 'packaging') && asset.sourceImageIds.includes(version?.assets.physical || '') &&
      (stage !== 'packaging' || asset.sourceImageIds.includes(version?.assets.world || ''));
  const stages = PROPOSAL_STAGES.map(stage => {
    const asset = assets[stage];
    const valid = asset && asset.id === version?.assets[stage] && connected(stage, asset);
    return { stage, ...(valid ? { asset: structuredClone(asset) } : {}), unavailable: version?.assets[stage] ? 'Saved image or matching metadata unavailable. Restore this proposal and try again.' : 'Not generated for this version.' };
  });
  // The version UUID is used only for local change detection. It is never written into the file.
  const current = version ? { ...session, customerIdentity: version.customerIdentity, context: version.context, website: version.website } : session;
  const brief = proposalBrief(current, Object.fromEntries(stages.filter(s => s.asset).map(s => [s.asset!.id, s.asset!])), false);
  return { key: JSON.stringify([version?.id || session.id, brief, stages]), versionKey: version?.id || session.id, referenceSeed: JSON.stringify([version?.id || session.id, version?.assets, brief]), brief, stages,
    state: session.accepted ? session.pending ? 'Accepted version shown. An unfinished revision is excluded from this request.' : 'Current accepted concept revision.' : 'Partial concept direction. No complete proposal has been accepted.' };
}

function mimeOf(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((byte, i) => bytes[i] === byte)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') return 'image/webp';
  return null;
}
const validateImage = (bytes: Uint8Array, mime: string) => {
  if (!bytes.length || bytes.length > EXPORT_IMAGE_LIMIT) throw new Error('Image exceeds the 8 MiB per-image limit or is empty.');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime) || mimeOf(bytes) !== mime) throw new Error('Image is not a supported PNG, JPEG or WebP raster.');
  return bytes;
};
function allowedImageUrl(asset: ProposalConcept): string {
  const origin = new URL(import.meta.env.VITE_SUPABASE_URL);
  const url = new URL(asset.image);
  if (origin.protocol !== 'https:' || url.origin !== origin.origin || url.username || url.password || url.hash ||
    !['png', 'jpeg', 'jpg', 'webp'].some(extension => url.pathname === `/storage/v1/object/sign/brick-concepts/${asset.id}.${extension}`)) throw new Error('Image source is not the saved private image for this section.');
  return url.href;
}
async function readImage(asset: ProposalConcept, signal: AbortSignal): Promise<Uint8Array> {
  active(signal);
  if (!asset.image) throw new Error('Saved image is unavailable. Refresh saved images and try again.');
  if (asset.image.startsWith('data:')) {
    if (asset.image.length > Math.ceil(EXPORT_IMAGE_LIMIT * 4 / 3) + 64) throw new Error('Image exceeds the 8 MiB per-image limit.');
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(asset.image);
    if (!match) throw new Error('Inline image is not a supported raster.');
    return validateImage(Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)), match[1]);
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, EXPORT_IMAGE_TIMEOUT);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetch(allowedImageUrl(asset), { signal: controller.signal, credentials: 'omit', redirect: 'error', mode: 'cors', referrerPolicy: 'no-referrer' });
    active(signal); active(controller.signal);
    if (!response.ok) throw new Error('Saved image could not be downloaded; it may have expired. Refresh saved images and try again.');
    const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw new Error('Image is not a supported PNG, JPEG or WebP raster.');
    if (Number(response.headers.get('content-length')) > EXPORT_IMAGE_LIMIT) throw new Error('Image exceeds the 8 MiB per-image limit.');
    if (!response.body) throw new Error('Image download is unavailable in this browser.');
    reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const chunk = await reader.read(); active(signal); active(controller.signal);
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > EXPORT_IMAGE_LIMIT) throw new Error('Image exceeds the 8 MiB per-image limit.');
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return validateImage(bytes, mime);
  } catch (error) {
    active(signal);
    if (controller.signal.aborted) throw new Error('Image download timed out. Refresh saved images and try again.');
    if (error instanceof TypeError) throw new Error('Saved image could not be downloaded. Refresh saved images and try again.');
    throw error;
  } finally {
    clearTimeout(timer); signal.removeEventListener('abort', cancel);
    if (reader) void reader.cancel().catch(() => {});
    controller.abort();
  }
}
const MAX_IMAGE_SIDE = 8192;
const MAX_IMAGE_PIXELS = 16 * 1024 * 1024;
function dimensions(bytes: Uint8Array): [number, number] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u24 = (offset: number) => bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16;
  if (mimeOf(bytes) === 'image/png' && bytes.length >= 24 && String.fromCharCode(...bytes.slice(12, 16)) === 'IHDR') return [view.getUint32(16), view.getUint32(20)];
  if (mimeOf(bytes) === 'image/webp' && bytes.length >= 30) {
    const kind = String.fromCharCode(...bytes.slice(12, 16));
    if (kind === 'VP8X') return [u24(24) + 1, u24(27) + 1];
    if (kind === 'VP8 ' && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) return [view.getUint16(26, true) & 16383, view.getUint16(28, true) & 16383];
    if (kind === 'VP8L' && bytes[20] === 47) return [1 + bytes[21] + ((bytes[22] & 63) << 8), 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 15) << 10)];
  }
  if (mimeOf(bytes) === 'image/jpeg') {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218 || offset + 2 > bytes.length) break;
      if (marker === 1 || marker >= 208 && marker <= 215) continue;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 8) return [view.getUint16(offset + 5), view.getUint16(offset + 3)];
      offset += length;
    }
  }
  throw new Error('Image is incomplete or its dimensions could not be validated.');
}
function boundedDimensions(width: number, height: number) {
  if (!width || !height || width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE || width * height > MAX_IMAGE_PIXELS) throw new Error('Image dimensions exceed the safe export limit (8,192 pixels per side and 16 megapixels).');
}
/** Header limits apply before decoding; actual decoding rejects truncated/corrupt rasters. */
async function decodeImage(bytes: Uint8Array, signal: AbortSignal): Promise<void> {
  active(signal); boundedDimensions(...dimensions(bytes));
  await new Promise<void>((resolve, reject) => {
    let settled = false; let image: HTMLImageElement | undefined;
    const finish = (error?: Error) => {
      if (settled) return; settled = true; clearTimeout(timer); signal.removeEventListener('abort', cancel);
      if (image) { image.onload = null; image.onerror = null; image.src = ''; }
      if (error) reject(error); else resolve();
    };
    const cancel = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('Image validation timed out.')), 5000);
    signal.addEventListener('abort', cancel, { once: true });
    const checked = (width: number, height: number) => { try { boundedDimensions(width, height); finish(); } catch (error) { finish(error as Error); } };
    try { if (typeof createImageBitmap === 'function') {
      void createImageBitmap(new Blob([new Uint8Array(bytes)], { type: mimeOf(bytes)! })).then(bitmap => {
        if (!settled) checked(bitmap.width, bitmap.height);
        bitmap.close();
      }, () => finish(new Error('Image could not be decoded. It may be incomplete or damaged.')));
    } else if (typeof Image !== 'undefined') {
      image = new Image(); image.onload = () => checked(image!.naturalWidth, image!.naturalHeight);
      image.onerror = () => finish(new Error('Image could not be decoded. It may be incomplete or damaged.'));
      image.src = dataUrl(bytes);
    } else finish(new Error('This browser cannot validate the image. Try a current browser.'));
    } catch { finish(new Error('Image could not be decoded. It may be incomplete or damaged.')); }
  });
  active(signal);
}
async function digest(bytes: Uint8Array): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes))), value => value.toString(16).padStart(2, '0')).join('');
}
function dataUrl(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return `data:${mimeOf(bytes)};base64,${btoa(binary)}`;
}

/** Reads only already-generated images on explicit download. No generation, upload or inquiry. */
export async function prepareProposalRequest(snapshot: ExportSnapshot | undefined, brief: string, notes: RequestNotes, signal: AbortSignal, options: { textOnly?: boolean } = {}): Promise<PreparedRequest> {
  active(signal);
  const textOnly = !snapshot && options.textOnly === true;
  const missing: string[] = []; const panels: string[] = []; let total = 0; let embedded = 0;
  for (const item of snapshot?.stages || []) {
    active(signal);
    const title = labels[item.stage]; const asset = item.asset; let image = '';
    try {
      if (!asset) throw new Error(item.unavailable);
      const bytes = await readImage(asset, signal);
      total += bytes.length;
      if (total > EXPORT_TOTAL_LIMIT) throw new Error('The request exceeds the 24 MiB total-image limit.');
      await decodeImage(bytes, signal);
      const hash = await digest(bytes); active(signal);
      image = `<img src="${dataUrl(bytes)}" alt="${escape(`${asset.brand}: ${asset.title}, generated ${title.toLowerCase()} study`)}"><p class="reference">Image SHA-256: ${hash}</p>`;
      embedded++;
    } catch (error) {
      active(signal);
      const reason = error instanceof Error ? error.message : 'Image unavailable.';
      missing.push(`${title}: ${reason}`); image = `<p class="warning">Image omitted: ${escape(reason)}</p>`;
    }
    panels.push(`<section><h2>${escape(title)}</h2>${image}${asset ? `<h3>${escape(asset.title)}</h3><p>${escape(asset.story)}</p><h3>Proposed interaction</h3><p>${escape(asset.interaction || 'Not specified')}</p><h3>Generated design direction (unverified)</h3><p>${escape(asset.design)}</p><details open><summary>Original section brief and story elements</summary><pre>${escape(JSON.stringify({ context: asset.context, worldElements: asset.worldElements, ...(asset.detailsRefinement ? { detailsRefinement: asset.detailsRefinement } : {}) }, null, 2))}</pre></details>` : ''}</section>`);
  }
  if (!snapshot && !textOnly) missing.push('No generated images or saved visual revision were supplied. This is a text-only direction.');
  const reference = snapshot ? (await digest(new TextEncoder().encode(snapshot.referenceSeed))).slice(0, 20) : 'No saved visual revision';
  active(signal);
  const buyerContext = [notes.projectType && `Project type: ${notes.projectType}`, notes.company && `Brand / company / project: ${notes.company}`, notes.story && `Your idea: ${notes.story}`, notes.name && `Contact name: ${notes.name}`, notes.contact && `Preferred contact: ${notes.contact}`, notes.size && `Size / display setting: ${notes.size}`, notes.destination && `Delivery country / city: ${notes.destination}`, notes.inspiration && `Inspiration only, not a customer result: ${notes.inspiration}`].filter(Boolean).join('\n\n');
  const context = [buyerContext, `Desired quantity: ${notes.quantity.trim() || 'To discuss'}`, `Target timing: ${notes.timing.trim() || 'To discuss'}`, `Budget direction (not an agreed price): ${notes.budget.trim() || 'To discuss'}`, `Priorities and questions: ${notes.notes.trim() || 'To discuss'}`].filter(Boolean).join('\n\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>OFFKIN — Quote &amp; Build Proposal request draft</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#242321;background:#fffdf8;max-width:1100px;margin:0 auto;padding:32px}h1{font-size:clamp(28px,5vw,48px);line-height:1.15}h2{margin-top:36px}p,pre{white-space:pre-wrap;overflow-wrap:anywhere}pre{font:inherit}img{display:block;max-width:100%;height:auto}section{border-top:1px solid #ccc;padding:16px 0}.warning{background:#fff0d5;padding:16px;border:1px solid #b56c11}.reference{font-size:12px}.label{text-transform:uppercase;letter-spacing:.1em;font-size:12px}@media print{body{background:white;padding:0;font-size:11pt}img{max-height:230mm;object-fit:contain}h2,h3{break-after:avoid}img,.warning{break-inside:avoid}}</style></head><body><p class="label">OFFKIN · Private local draft · Concept preview</p><h1>Quote &amp; Build Proposal request</h1><p>Status: local draft only. This request has not been sent. Intended enquiry contact: OFFKIN on WhatsApp at ${OFFKIN_WHATSAPP_DISPLAY}. No order has been placed.</p><p>${escape(CONCEPT_PREVIEW_NOTE)}</p><p>${escape(snapshot?.state || 'Text-only concept direction.')}</p><p>Visual revision reference: ${escape(reference)}</p>${textOnly ? '<p>Text-only project brief. No generated images are included.</p>' : missing.length ? `<div class="warning"><strong>PARTIAL REQUEST: ${embedded} of 4 concept images embedded.</strong><p>${missing.map(escape).join('\n')}</p><p>The missing visuals are not included. Restore or refresh the matching proposal and download again before relying on this as a complete visual handoff.</p></div>` : '<p>All 4 concept images are embedded in this file and available offline.</p>'}<section><h2>Your request</h2><pre>${escape(context)}</pre><p>Requested next step: assess the creative direction and propose a realistic scope, construction route, materials, mechanisms, prototype plan, timeline and quotation. This draft does not approve spending or place an order.</p></section><section><h2>Chosen direction and original brief</h2><pre>${escape(snapshot?.brief || brief)}</pre></section>${panels.join('')}<footer><p>${escape(CONCEPT_PREVIEW_NOTE)} Engineering and prototype checks follow before production. Generated views are not CAD, validated fits or working mechanisms.</p><p>This file contains the brief and embedded images above. Review its contents before sharing it yourself.</p></footer></body></html>`;
  return { html, missing, embedded };
}

export type PreparedCollectibleImage = { bytes: Uint8Array; mime: string; filename: string; sourceHash: string };
/** Save only the actual displayed collectible hero, with the same private-source,
 * raster signature, byte, decoded-dimension, timeout and cancellation checks. */
export async function prepareCollectibleImage(snapshot: ExportSnapshot | undefined, signal: AbortSignal): Promise<PreparedCollectibleImage> {
  active(signal);
  const asset = snapshot?.stages.find(item => item.stage === 'physical')?.asset;
  if (!asset) throw new Error('The chosen collectible image is unavailable. Refresh the saved images and try again.');
  const bytes = await readImage(asset, signal);
  await decodeImage(bytes, signal); active(signal);
  const mime = mimeOf(bytes)!; const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
  const sourceHash = await digest(bytes); active(signal);
  return { bytes: new Uint8Array(bytes), mime, filename: `OFFKIN-collectible-concept.${extension}`, sourceHash };
}
