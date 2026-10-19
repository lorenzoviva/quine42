// The universe as shipped on disk (universe/**). At runtime the repo may hold a newer version.
import type { FileMap } from './types';

const raw = import.meta.glob('/universe/**/*', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const bundledFiles: FileMap = Object.fromEntries(
  Object.entries(raw).map(([path, content]) => [path.replace(/^\/universe\//, ''), content.replace(/\r\n/g, '\n')]),
);
