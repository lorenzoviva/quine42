// Writes the lettering, the still SVG and the icon of the futuristic skin (T284) and the logo and the icon of the sober one (T286) from the
// proposals: `npx vite-node --script tools/vesti/estrai.ts`.

import { writeLettering } from './scritta';
import { writeLogo } from './logo';

try {
  for (const file of [...writeLettering(process.cwd()), ...writeLogo(process.cwd())]) console.log(`scritto ${file}`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
