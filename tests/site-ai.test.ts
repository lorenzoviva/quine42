// The page «Come usiamo l'IA» (T368): it is built, every page of the site points to it, and it says what the open beta promises
// (the player's OpenRouter key, the common costs in turn, where the text goes, the player's text to Jev only through OpenRouter with zero retention, never to TypeSafe directly: D45, D55.2).

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const page = readFileSync(path.join(ROOT, 'site/ia.html'), 'utf8');
const text = page.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe("la pagina «Come usiamo l'IA»", () => {
  it('è nella build', () => {
    expect(readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8')).toContain("path.resolve('site/ia.html')");
  });

  it('ogni pagina del sito la nomina nel piè di pagina', () => {
    for (const f of readdirSync(path.join(ROOT, 'site')).filter((f) => f.endsWith('.html'))) {
      const html = readFileSync(path.join(ROOT, 'site', f), 'utf8');
      const foot = html.slice(html.indexOf('<div class="footer-links">'));
      expect(foot, f).toContain('href="./ia.html"');
    }
  });

  it('dice chi paga, dove va il testo e che cosa non va a Jev', () => {
    expect(text).toMatch(/chiave di OpenRouter/);
    expect(text).toMatch(/a turno/);
    expect(text).toMatch(/paga il master/i);
    expect(text).toMatch(/modelli locali/);
    expect(text).toMatch(/OpenRouter a Google/);
    expect(text).toMatch(/solo da OpenRouter con la ritenzione zero, mai a TypeSafe direttamente/);
    expect(text).not.toMatch(/Jev di TypeSafe non riceve mai il testo che scrivi/);
    expect(text).toMatch(/Nessuna immagine generata/);
  });

  it('niente script né stili scritti nella pagina (la CSP)', () => {
    expect(page).not.toMatch(/<script(?![^>]*\bsrc=)/);
    expect(page).not.toMatch(/\son[a-z]+=/);
  });
});
