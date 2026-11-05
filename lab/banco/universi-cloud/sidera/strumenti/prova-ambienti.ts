import { Kernel } from '../../../../../src/kernel/kernel';
import { memoryStore } from '../../../../../src/kernel/repo';
import { MockAiModels } from '../../../../../src/kernel/ai/mock';
import { fileDi } from './carica';
const files = fileDi();
const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
const S = k.config.chunkSize;
const drafts: string[][] = [];
for (const [cx, cy] of [[0,0],[1,0],[3,0],[0,-3],[-3,-3],[3,3],[8,-6],[-7,6],[2,2],[-2,0]]) {
  const d = (k as any).genDraft(cx, cy) as string;
  drafts.push(Array.from({ length: S }, (_, r) => d.slice(r * S, (r + 1) * S)));
}
for (const r of drafts.slice(0, 3)) console.log(r.join('\n') + '\n');
for (const [id, def] of Object.entries(k.content.layouts)) {
  const e = k.validator.validateLayout(id, def as any, k.palette, drafts);
  console.log(id, e.length ? e : 'ok');
}
console.log('faults', [...k.faults.list?.() ?? []]);
