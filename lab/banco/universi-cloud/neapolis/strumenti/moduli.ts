// Ogni modulo di Neapolis passa dal validatore come un modulo della Fucina: manifest (parseManifest), Lua che compila
// (checkLua), solo l'API che esiste (apiErrors), caricamento di prova in una VM a parte (probe). Le entità passano
// proprio da validateForged; il sistema e i dati, che la Fucina non crea, dagli stessi controlli uno per uno.
// Avvisi: un'azione con `requires` che non è un oggetto del pacchetto, un modello che non è in models/, un oggetto citato in Lua che non esiste.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { apiErrors } from '../../../../../src/kernel/validator';
import type { Kernel } from '../../../../../src/kernel/kernel';
import { DIR } from './universo';

/** I 25 moduli Lua di Neapolis (12 individui, 12 cose, il sistema del quartiere). */
export const LUA_MODULES = [
  'npc.barista', 'npc.giornalista', 'npc.meccanico', 'npc.medico', 'npc.portuale', 'npc.elettricista', 'npc.edicolante', 'npc.tranviere', 'npc.cuoca', 'npc.vigile', 'npc.impiegato', 'npc.gatto',
  'obj.distributore', 'obj.espresso', 'obj.scrivania', 'obj.banco-officina', 'obj.quadro-elettrico', 'obj.edicola', 'obj.transenna', 'obj.cucina-trattoria', 'obj.lampione', 'obj.motorino', 'obj.cabina-telefonica', 'obj.cassonetto',
  'sys.quartiere',
];
/** I moduli di dati e il generatore della città. */
export const DATA_MODULES = ['items.neapolis', 'magic.runes', 'world.terrain', 'world.layouts'];

export interface ModuleReport {
  id: string;
  errors: string[];
  warnings: string[];
}

export function validateModules(k: Kernel, ids = [...LUA_MODULES, ...DATA_MODULES]): ModuleReport[] {
  const items = JSON.parse(readFileSync(join(DIR, 'modules/items.neapolis/manifest.json'), 'utf8')).items as Array<{ id: string; name: string }>;
  const magic = JSON.parse(readFileSync(join(DIR, 'modules/magic.runes/manifest.json'), 'utf8'));
  const itemIds = new Set([...items.map((i) => i.id), ...magic.items.map((i: { id: string }) => i.id)]);
  const itemNames = new Set([...items.map((i) => i.name), ...magic.items.map((i: { name: string }) => i.name)]);
  const models = new Set(readdirSync(join(DIR, 'models')).filter((f) => f.endsWith('.xml')).map((f) => f.slice(0, -4)));
  return ids.map((id) => {
    const dir = join(DIR, 'modules', id);
    const path = `modules/${id}/manifest.json`;
    const src = readFileSync(join(dir, 'manifest.json'), 'utf8');
    const { manifest, errors } = k.validator.parseManifest(path, src);
    const warnings: string[] = [];
    if (!manifest) return { id, errors, warnings };
    const logicPath = join(dir, manifest.logic ?? 'logic.lua');
    const logic = existsSync(logicPath) ? readFileSync(logicPath, 'utf8') : undefined;
    if (LUA_MODULES.includes(id) && !logic) errors.push(`${id}: manca logic.lua`);
    if (logic !== undefined) {
      if (manifest.kind === 'entity') errors.push(...k.validator.validateForged(manifest, logic, new Set()));
      else {
        errors.push(...k.validator.checkLua(`modules/${id}/logic.lua`, logic), ...apiErrors(logic));
        const probe = (k.validator as unknown as { sandbox: { probe(s: string, n: string): string | undefined } }).sandbox.probe(logic, `modules/${id}/logic.lua`);
        if (probe) errors.push(probe);
      }
      // Gli oggetti che il codice nomina (items.find("…"), "item.…") devono esistere.
      for (const m of logic.matchAll(/"(item\.[a-z0-9-]+)"/g)) if (!itemIds.has(m[1])) warnings.push(`il codice nomina ${m[1]}, che non esiste`);
      for (const m of logic.matchAll(/(?:items\.find|dai)\(\s*(?:user,\s*)?"([^"]+)"/g)) if (!itemNames.has(m[1])) warnings.push(`il codice cerca «${m[1]}», che non esiste`);
      for (const block of logic.matchAll(/local (?:SPIRALI|ATTREZZI|DENTRO) = \{([^}]*)\}/g))
        for (const m of block[1].matchAll(/"([^"]+)"/g)) if (!itemNames.has(m[1])) warnings.push(`il codice cerca «${m[1]}», che non esiste`);
      for (const m of logic.matchAll(/nome = "([^"]+)"/g)) if (!itemNames.has(m[1])) warnings.push(`il codice cerca «${m[1]}», che non esiste`);
    }
    for (const a of manifest.actions ?? []) if (a.requires && !itemIds.has(a.requires)) warnings.push(`l'azione ${a.id} chiede ${a.requires}, che non esiste`);
    const model = manifest.appearance?.model;
    if (model && !models.has(model)) warnings.push(`il modello ${model} non è in models/`);
    for (const inv of manifest.inventory ?? []) if (!itemIds.has(inv)) warnings.push(`inventario: ${inv} non esiste`);
    if (manifest.container && !(manifest.container.loot in ({ ...JSON.parse(readFileSync(join(DIR, 'modules/items.neapolis/manifest.json'), 'utf8')).loot, ...magic.loot }))) warnings.push(`contenitore: la tabella ${manifest.container.loot} non esiste`);
    return { id, errors: [...new Set(errors)], warnings };
  });
}
