// The news of the site (T234, ADR-0129): the files of site/notizie/, gathered by Vite when the site is built. No route and no database.

import { loadNews } from './notizie-testo';

const files = import.meta.glob(['./notizie/*.md', '!./notizie/LEGGIMI.md'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const { news, problems } = loadNews(files);
