// Prova rapida: il kernel apre Neapolis con i piani di maps/, sviluppa i luoghi attorno e gira qualche secondo.
import { bootNeapolis } from './universo';
const k = await bootNeapolis();
for (let i = 0; i < 120; i++) {
  k.tick(1 / 60);
  await new Promise((r) => setTimeout(r, 10));
}
const planned = [...k.chunks.values()].filter((c) => c.stage === 'planned');
console.log('luoghi:', planned.map((c) => `${c.key} ${c.place?.name}`).join(' | '));
console.log('individui:', k.ecs.query('identity').map((id) => k.ecs.get(id, 'identity').name).join(', '));
console.log('entità di moduli:', k.ecs.query('module').length, 'rune a terra:', k.ecs.query('rune').length);
console.log('chiamate ai modelli:', JSON.stringify(k.ai.usage.text ?? k.ai.usage));
console.log('faults:', k.faults.size, [...(k.faults as any).list?.() ?? []].map((f: any) => `${f.key}: ${f.message}`).join('\n'));
process.exit(0);
