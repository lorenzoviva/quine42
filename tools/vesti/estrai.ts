// Writes the lettering, the still SVG and the icon of the futuristic skin from the proposal (T284): `npx vite-node --script tools/vesti/estrai.ts`.

import { writeLettering } from './scritta';

try {
  for (const file of writeLettering(process.cwd())) console.log(`scritto ${file}`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
