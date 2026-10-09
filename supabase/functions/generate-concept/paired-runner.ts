import { buildPairedArtifacts, PairedDesignError, type FrozenPairedDesign, type PairedArtifact } from './paired-design.ts';
export type ReviewAsset = { role: PairedArtifact['role']; id: string; identityId: string; manifestId: string; specDigest: string; sourceCollectibleId: string | null; status: 'offline-mock' };
export type ReviewProgress = { manifestId: string; identityId: string; assets: Partial<Record<PairedArtifact['role'],ReviewAsset>> };
export type OfflineRenderRuntime = {
  mode: 'offline-mock';
  render: (artifact: PairedArtifact,source: ReviewAsset | null,signal: AbortSignal) => Promise<ReviewAsset>;
  persist: (progress: ReviewProgress) => Promise<void>;
};
function failure(message:string): never {throw new PairedDesignError([{gate:'pair',code:'unsafe-progress',message}]);}
function validAsset(asset:ReviewAsset,artifact:PairedArtifact,source:ReviewAsset|null):boolean {
  return Boolean(asset.id && asset.id.length<=100 && asset.status==='offline-mock' && asset.role===artifact.role && asset.identityId===artifact.identityId && asset.manifestId===artifact.manifestId && asset.specDigest===artifact.specDigest && asset.sourceCollectibleId===(source?.id||null));
}
/** Offline harness, not a production renderer or billing/concurrency guarantee. */
export async function runOfflinePair(manifest:FrozenPairedDesign,runtime:OfflineRenderRuntime,signal:AbortSignal,previous?:ReviewProgress):Promise<ReviewProgress> {
  if (runtime.mode!=='offline-mock') failure('The paired renderer is an offline draft; production activation is not available.');
  const artifacts=await buildPairedArtifacts(manifest);
  if (previous && (previous.manifestId!==manifest.manifestId || previous.identityId!==manifest.identityId || Object.keys(previous.assets).some(role=>!['collectible','story-card'].includes(role)))) failure('Saved progress belongs to a different locked pair.');
  let progress:ReviewProgress=previous?JSON.parse(JSON.stringify(previous)):{manifestId:manifest.manifestId,identityId:manifest.identityId,assets:{}};
  for (const artifact of artifacts) {
    const saved=progress.assets[artifact.role];const source=artifact.role==='story-card'?progress.assets.collectible||null:null;
    if (saved && (!validAsset(saved,artifact,source) || artifact.role==='story-card'&&!source)) failure('Saved artifact identity or collectible lineage disagrees with the locked specification.');
  }
  if (progress.assets.collectible && progress.assets.collectible.id===progress.assets['story-card']?.id) failure('The pair must contain distinct assets.');
  for (const artifact of artifacts) {
    signal.throwIfAborted();if (progress.assets[artifact.role]) continue;
    const source=artifact.role==='story-card'?progress.assets.collectible||null:null;
    const asset=await runtime.render(artifact,source,signal);signal.throwIfAborted();
    if (!validAsset(asset,artifact,source) || source?.id===asset.id) failure('Returned artifact lost identity or lineage. Accepted version is unchanged.');
    progress={...progress,assets:{...progress.assets,[artifact.role]:{...asset}}};
    await runtime.persist(JSON.parse(JSON.stringify(progress)));
  }
  return progress;
}
export async function acceptOfflinePair(manifest:FrozenPairedDesign,pending:ReviewProgress):Promise<Readonly<ReviewProgress>> {
  if (!pending.assets.collectible || !pending.assets['story-card']) failure('Finish both linked artifacts before accepting the next version.');
  const checked=await runOfflinePair(manifest,{mode:'offline-mock',render:async()=>failure('Acceptance must not generate.'),persist:async()=>{}},new AbortController().signal,pending);
  Object.values(checked.assets).forEach(Object.freeze);Object.freeze(checked.assets);return Object.freeze(checked);
}