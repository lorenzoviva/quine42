import { bootNeapolis } from './universo';
import { validateModules } from './moduli';
const k = await bootNeapolis();
const r = validateModules(k);
for (const m of r) console.log(`${m.errors.length ? '✗' : m.warnings.length ? '!' : '✓'} ${m.id}${[...m.errors, ...m.warnings].map((e) => '\n    ' + e).join('')}`);
process.exit(r.some((m) => m.errors.length || m.warnings.length) ? 1 : 0);
