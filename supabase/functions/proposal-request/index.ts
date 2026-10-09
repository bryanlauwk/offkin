import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@3.25.76';
import { PAIRED_CONTRACT_VERSION, parsePairedStoredManifest } from '../generate-concept/paired-design.ts';
import { PROPOSAL_CONTRACT_VERSION, parseProposalManifest } from '../generate-concept/proposal.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const RequestSchema = z.object({
  buyerName: z.string().trim().min(1).max(120),
  workEmail: z.string().trim().email().max(254),
  company: z.string().trim().min(1).max(160),
  quantity: z.string().trim().max(120).default(''),
  timing: z.string().trim().max(120).default(''),
  budget: z.string().trim().max(160).default(''),
  priorities: z.string().trim().max(2000).default(''),
  brandName: z.string().trim().min(1).max(120),
  website: z.string().trim().max(300).default(''),
  conceptStory: z.string().trim().min(1).max(6000),
  assetIds: z.array(z.string().uuid()).min(2).max(4).refine(ids => new Set(ids).size === ids.length),
  conceptSummary: z.object({
    title: z.string().trim().max(240),
    stages: z.array(z.object({ stage: z.enum(['world', 'physical', 'details', 'packaging', 'collectible', 'story-card']), title: z.string().trim().max(240) })).min(2).max(4),
  }),
  websiteField: z.string().max(0).optional(),
});

async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !service) return json({ error: 'Proposal requests are not configured.' }, 503);
  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const parsed = RequestSchema.safeParse(raw);
  if (!parsed.success || parsed.data.websiteField) return json({ error: 'Check the highlighted request details.' }, 400);
  const input = parsed.data;
  const clientHint = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const db = createClient(url, service, { auth: { persistSession: false } });
  const { data: reserved, error: limitError } = await db.rpc('reserve_proposal_request', { client_key: await digest(clientHint) });
  if (limitError) return json({ error: 'The request could not be saved right now.' }, 503);
  if (!reserved) return json({ error: 'Too many requests were submitted today. Please try again tomorrow.' }, 429);

  const { data: assets, error: assetError } = await db.from('brick_concepts').select('id,brand,story,prompt_version').in('id', input.assetIds);
  if (assetError || !assets || assets.length !== input.assetIds.length || new Set(assets.map(asset => asset.id)).size !== input.assetIds.length) {
    return json({ error: 'Restore the complete concept before submitting this request.' }, 400);
  }
  const paired = assets.length === 2 && assets.every(asset => asset.prompt_version === PAIRED_CONTRACT_VERSION);
  const legacy = assets.length === 4 && assets.every(asset => asset.prompt_version === PROPOSAL_CONTRACT_VERSION && Boolean(parseProposalManifest(asset.story)));
  if (paired) {
    const manifests = await Promise.all(assets.map(asset => parsePairedStoredManifest(asset.story)));
    const collectible = manifests.find(manifest => manifest?.role === 'collectible');
    const card = manifests.find(manifest => manifest?.role === 'story-card');
    if (!collectible || !card || collectible.manifest.manifestId !== card.manifest.manifestId || collectible.specDigest !== card.specDigest || card.sourceCollectibleId !== assets[manifests.indexOf(collectible)]?.id || assets.some(asset => asset.brand !== input.brandName)) {
      return json({ error: 'Restore the complete matching concept pair before submitting this request.' }, 400);
    }
  } else if (!legacy) return json({ error: 'Restore a complete verified concept before submitting this request.' }, 400);
  const { data, error } = await db.from('proposal_requests').insert({
    buyer_name: input.buyerName,
    work_email: input.workEmail.toLowerCase(),
    company: input.company,
    quantity: input.quantity,
    timing: input.timing,
    budget: input.budget,
    priorities: input.priorities,
    brand_name: input.brandName,
    website: input.website,
    concept_story: input.conceptStory,
    asset_ids: input.assetIds,
    concept_summary: input.conceptSummary,
  }).select('reference').single();
  if (error || !data) return json({ error: 'The request could not be saved right now.' }, 500);
  return json({ ok: true, reference: data.reference });
});