// The launcher of the home (T233): what the panel says comes only from what the server answers, nothing that is not there is promised,
// and the page keeps the skins' contract (the base only, every skin).

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAUNCH_LIMITS, launchNote, launchOf, playHref, readSessions, readUniverses } from '../site/launcher-core';

const ROOT = path.resolve(__dirname, '..');
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');

describe('what the server answers', () => {
  it('the universes: only names, once, and none if the server keeps none', () => {
    expect(readUniverses({ available: true, universes: ['aurora', 'neapolis', 'aurora'] })).toEqual(['aurora', 'neapolis']);
    expect(readUniverses({ available: true, universes: ['ok', '<b>x</b>', '../su', 7, null, 'Maiuscola', 'nul'] })).toEqual(['ok']);
    expect(readUniverses({ available: true })).toEqual([]);
    for (const body of [undefined, null, 'testo', { available: false, universes: ['a'] }, { universes: ['a'] }]) expect(readUniverses(body)).toBeUndefined();
    const many = Array.from({ length: 400 }, (_, i) => `u${i}`);
    expect(readUniverses({ available: true, universes: many })).toHaveLength(LAUNCH_LIMITS.universes);
  });

  it('the sessions: only worlds with someone in them, with a number that is one', () => {
    const body = {
      sessions: [
        { name: 'aurora', active: true, clients: 3 },
        { name: 'vuoto', active: true, clients: 0 },
        { name: 'spento', active: false, clients: 2 },
        { name: 'strano', active: true, clients: 'molti' },
        { name: 'rotto', active: true, clients: Number.NaN },
        { name: '<script>', active: true, clients: 1 },
        { name: 'enorme', active: true, clients: 1e12 },
        { name: 'mezzo', clients: 2.7 },
        null,
        'x',
      ],
    };
    expect(readSessions(body)).toEqual([
      { name: 'aurora', clients: 3 },
      { name: 'enorme', clients: 9999 },
      { name: 'mezzo', clients: 2 },
    ]);
    for (const nothing of [undefined, null, {}, { sessions: 'no' }]) expect(readSessions(nothing)).toEqual([]);
  });
});

describe('the panel', () => {
  it('without the server, GIOCA starts the game in this browser and nothing else is offered', () => {
    const launch = launchOf(undefined, [{ name: 'aurora', clients: 2 }], 'aurora', 'aurora');
    expect(launch).toEqual({ online: false, universes: [], live: [], playing: 0, href: '../index.html' });
    expect(launchNote(launch)).toMatch(/non risponde/);
  });

  it('a server without universes says so, and promises none', () => {
    const launch = launchOf([], [], null, null);
    expect(launch.online).toBe(true);
    expect(launch.chosen).toBeUndefined();
    expect(launch.href).toBe('../index.html');
    expect(launchNote(launch)).toBe('Ancora nessun universo su questo server.');
  });

  it('the universes being played come first, the most crowded first; one the list does not name is not offered', () => {
    const launch = launchOf(['aurora', 'neapolis', 'sidera'], [{ name: 'sidera', clients: 1 }, { name: 'neapolis', clients: 4 }, { name: 'altrove', clients: 9 }], null, null);
    expect(launch.universes).toEqual(['neapolis', 'sidera', 'aurora']);
    expect(launch.live.map((l) => l.name)).toEqual(['neapolis', 'sidera']);
    expect(launch.playing).toBe(5);
    expect(launch.chosen).toBe('neapolis');
    expect(launch.href).toBe('../index.html?universo=neapolis');
    expect(launchNote(launch)).toBe('3 universi su questo server, 5 viandanti in gioco ora.');
  });

  it('the address wins, then the universe the site remembers, then the first', () => {
    const list = ['aurora', 'neapolis'];
    expect(launchOf(list, [], 'neapolis', 'aurora').chosen).toBe('neapolis');
    expect(launchOf(list, [], 'altrove', 'neapolis').chosen).toBe('neapolis');
    expect(launchOf(list, [], null, 'sparito').chosen).toBe('aurora');
    expect(launchNote(launchOf(['solo'], [], null, null))).toBe('1 universo su questo server.');
  });

  it('a few rows of those being played, not the sessions hub', () => {
    const names = Array.from({ length: 9 }, (_, i) => `u${i}`);
    const launch = launchOf(names, names.map((name, i) => ({ name, clients: i + 1 })), null, null);
    expect(launch.live).toHaveLength(LAUNCH_LIMITS.live);
    expect(launch.live[0]).toEqual({ name: 'u8', clients: 9 });
    expect(launch.playing).toBe(45);
  });

  it('the link to the game is built, never written', () => {
    expect(playHref()).toBe('../index.html');
    expect(playHref('aurora')).toBe('../index.html?universo=aurora');
    expect(playHref('a&b=c')).toBe('../index.html?universo=a%26b%3Dc');
  });
});

describe('the home', () => {
  const html = read('site/index.html');

  it('is the launcher: the panel with GIOCA in the hero, next to the stage', () => {
    const hero = html.slice(html.indexOf('<section class="hero"'), html.indexOf('</section>', html.indexOf('<section class="hero"')));
    for (const id of ['launch', 'launch-universe', 'launch-play', 'launch-note', 'launch-live', 'hero-3d']) expect(hero, id).toContain(`id="${id}"`);
    expect(html).toContain('<main class="launcher">');
  });

  it('what has no content yet stays hidden, and nothing says it is coming but the other universes', () => {
    for (const id of ['notizie', 'video', 'showcase']) expect(html, id).toMatch(new RegExp(`<section class="section-wrap" id="${id}" hidden>`));
    for (const id of ['nav-news', 'nav-video', 'nav-showcase', 'nav-guide', 'hero-guide', 'launch-live']) expect(html, id).toMatch(new RegExp(`id="${id}"[^>]* hidden`));
    expect(html.match(/coming soon/gi)).toHaveLength(1);
    expect(html).toContain('ALTRI UNIVERSI ALL\'ORIZZONTE');
    expect(html).not.toMatch(/presto|in arrivo|prossimamente/i);
  });

  it('does not name the crown', () => {
    expect(html).not.toMatch(/corona/i);
  });

  it('the landing reads what the server already says: no route of its own', () => {
    const code = read('site/landing.ts') + read('site/launcher-core.ts');
    const routes = new Set([...code.matchAll(/['`](\/api\/[a-z/]+)/g)].map((m) => m[1]));
    expect([...routes].sort()).toEqual(['/api/session', '/api/universe']);
  });
});
