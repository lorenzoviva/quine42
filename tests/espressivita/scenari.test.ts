// T183: the scenarios of the author, each a real module in the kernel in miniature. See docs/design/espressivita.md.

import { describe, expect, it } from 'vitest';
import { runScenario, series } from './banco';

const WATER = ['wwwww', 'wwwww', 'wwwww', 'wwwww', 'wwwww'];

describe('the boat', () => {
  it('sails on water with the helm, the wanderer and the hull together, and runs aground at the shore', async () => {
    const run = await runScenario(
      'mech.barca',
      {
        titolo: 'A vela',
        racconto: 'Il viandante sale e va verso riva.',
        terreno: WATER,
        cose: [{ modulo: 'veicolo.barca', x: 0, y: 0 }],
        viandante: { componenti: { barca: { stato: 'a terra' } } },
        passi: [{ tipo: 'pulsante', azione: 'sali' }, { tipo: 'cammina', verso: 'destra', secondi: 3 }],
        durata: 0,
        guarda: ['barca.stato', '0:pos.x'],
      },
      ['veicolo.barca'],
    );
    expect(run.prima['barca.stato']).toBe('a terra');
    expect(series(run, 'barca.stato')).toContain('in mare');
    expect(run.dopo['barca.stato']).toBe('incagliata');
    // The scene is water up to the column 2: the hull stops there, the wanderer aboard.
    const last = run.frames.at(-1)!;
    expect(last.pos[1]![0]).toBeGreaterThan(2);
    expect(last.pos[1]![0]).toBeLessThan(3);
    expect(Math.abs(last.pos[0]![0] - last.pos[1]![0])).toBeLessThan(0.2);
  });
});

describe('the balloon', () => {
  it('burns gas and climbs as a number; the wind carries it over what blocks on foot', async () => {
    const run = await runScenario('mech.mongolfiera', {
      titolo: 'Si sale',
      racconto: 'La fiamma alza il pallone, il vento lo porta oltre il muro.',
      terreno: ['ggggg', 'ggggg', 'gggbb', 'ggggg', 'ggggg'],
      viandante: { componenti: { pallone: { gas: 100, quota: 0, fiamma: false, z_letta: 0 } } },
      passi: [{ tipo: 'pulsante', azione: 'fiamma' }],
      durata: 4,
      guarda: ['pallone.gas', 'pallone.quota', 'pallone.z_letta'],
    });
    expect(run.dopo['pallone.gas'] as number).toBeLessThan(70);
    expect(run.dopo['pallone.quota'] as number).toBeGreaterThan(5);
    // Over the wall of column 1: on foot it would have stopped.
    expect(run.frames.at(-1)!.pos[0]![0]).toBeGreaterThan(3);
  });

  it('LIMIT (movement): the height does not reach the world, the kernel clears `pos.z` at every tick', async () => {
    const run = await runScenario('mech.mongolfiera', {
      titolo: 'La quota',
      racconto: 'Ciò che il sistema legge di ciò che ha scritto.',
      viandante: { componenti: { pallone: { gas: 100, quota: 3, fiamma: true, z_letta: 0 } } },
      durata: 1,
      guarda: ['pallone.z_letta'],
    });
    // Written every tick, read at the next: -1 means it was not there any more.
    expect(run.dopo['pallone.z_letta']).toBe(-1);
  });
});

describe('the rifle', () => {
  it('a real projectile: it flies, hits, wounds; a second shot kills; out of bullets it clicks', async () => {
    const run = await runScenario(
      'mech.fucile',
      {
        titolo: 'Due colpi',
        racconto: 'Il bandito è a due passi: due colpi lo abbattono.',
        cose: [{ modulo: 'bersaglio.uomo', x: 2, y: 0 }],
        viandante: { componenti: { fucile: { colpi: 2 } } },
        passi: [
          { tipo: 'cammina', verso: 'destra', secondi: 0.1 },
          { tipo: 'pulsante', azione: 'spara' },
          { tipo: 'attendi', secondi: 0.5 },
          { tipo: 'pulsante', azione: 'spara' },
          { tipo: 'attendi', secondi: 0.5 },
          { tipo: 'pulsante', azione: 'spara' },
        ],
        durata: 0.5,
        guarda: ['fucile.colpi', '0:salute.valore'],
      },
      ['bersaglio.uomo'],
    );
    expect(run.prima['0:salute.valore']).toBe(20);
    expect(series(run, '0:salute.valore')).toContain(10);
    expect(run.dopo['0:salute.valore']).toBe('assente');
    expect(run.dopo['fucile.colpi']).toBe(0);
    expect(run.messaggi).toContain('Click. Il caricatore è vuoto.');
  });

  it('a wall stops the bullet', async () => {
    const run = await runScenario(
      'mech.fucile',
      {
        titolo: 'Il muro',
        racconto: 'Tra il viandante e il bandito c’è un muro.',
        terreno: ['ggggg', 'ggggg', 'gggbg', 'ggggg', 'ggggg'],
        cose: [{ modulo: 'bersaglio.uomo', x: 2, y: 0 }],
        viandante: { componenti: { fucile: { colpi: 2 } } },
        passi: [{ tipo: 'cammina', verso: 'destra', secondi: 0.1 }, { tipo: 'pulsante', azione: 'spara' }],
        durata: 1,
        guarda: ['fucile.colpi', '0:salute.valore'],
      },
      ['bersaglio.uomo'],
    );
    expect(run.dopo['0:salute.valore']).toBe(20);
    expect(run.dopo['fucile.colpi']).toBe(1);
  });
});

describe('the computer of the 90s', () => {
  it('a menu of files and a little game, on four lines and four keys', async () => {
    const run = await runScenario('mech.computer', {
      titolo: 'DIR',
      racconto: 'Si scorre, si apre, si gioca.',
      passi: [{ tipo: 'pulsante', azione: 'giu' }, { tipo: 'pulsante', azione: 'invio' }, { tipo: 'pulsante', azione: 'esc' }, { tipo: 'pulsante', azione: 'giu' }, { tipo: 'pulsante', azione: 'invio' }],
      durata: 0.1,
      guarda: ['schermo.r1', 'schermo.r2', 'schermo.r3'],
    });
    const lines = series(run, 'schermo.r1');
    expect(lines).toContain('C:\\>DIR');
    expect(lines).toContain('Grano: 1200');
    expect(run.dopo['schermo.r1']).toBe('Tiri un dado col computer:');
    expect(String(run.dopo['schermo.r3'])).toMatch(/HAI VINTO|HA VINTO LUI/);
  });
});

describe('the gambling den', () => {
  const den = () =>
    runScenario(
      'mech.bisca',
      {
        titolo: 'Tre puntate',
        racconto: 'Si punta, la ruota gira, alla terza arriva la ronda.',
        viandante: { componenti: { bisca: { sospetto: 0, vinte: 0, esito: 'si punta', fino: 0 } }, oggetti: [{ nome: 'Gettone' }, { nome: 'Gettone' }, { nome: 'Gettone' }] },
        passi: [
          { tipo: 'pulsante', azione: 'rosso' },
          { tipo: 'attendi', secondi: 2.2 },
          { tipo: 'pulsante', azione: 'nero' },
          { tipo: 'attendi', secondi: 2.2 },
          { tipo: 'pulsante', azione: 'rosso' },
          { tipo: 'attendi', secondi: 2.2 },
        ],
        durata: 0,
        guarda: ['bisca.esito', 'bisca.sospetto'],
      },
      ['dati.bisca'],
    );

  it('bets, the wheel turns for its time, the bank pays or takes; at the third the raid', async () => {
    const run = await den();
    const said = series(run, 'bisca.esito').map(String);
    expect(said).toContain('la ruota gira…');
    expect(said.some((s) => /^esce (rosso|nero): /.test(s))).toBe(true);
    expect(run.dopo['bisca.esito']).toBe('La ronda! Il banco sparisce coi gettoni.');
    expect(run.dopo['bisca.sospetto']).toBe(0);
  });

  it('the wheel is the same in every kernel of the universe: the random of the module comes from the shared seed (ADR-0055)', async () => {
    const [a, b] = [await den(), await den()];
    expect(series(a, 'bisca.esito')).toEqual(series(b, 'bisca.esito'));
  });
});

describe('the invented sport, one against one', () => {
  it('the ball flies, the opponent runs at it, the goals count', async () => {
    const run = await runScenario(
      'mech.partita',
      {
        titolo: 'Una partita',
        racconto: 'La palla parte verso l’avversario: chi la tocca la rimanda.',
        cose: [{ modulo: 'gioco.palla', x: 0, y: 0 }, { modulo: 'gioco.avversario', x: 2, y: -1 }],
        viandante: { componenti: { partita: { noi: 0, loro: 0, via: false } } },
        passi: [{ tipo: 'pulsante', azione: 'fischio' }],
        durata: 25,
        guarda: ['partita.noi', 'partita.loro'],
      },
      ['gioco.palla', 'gioco.avversario'],
    );
    expect((run.dopo['partita.noi'] as number) + (run.dopo['partita.loro'] as number)).toBeGreaterThan(0);
    const ball = run.frames.map((f) => f.pos[1]![0]);
    expect(new Set(ball).size).toBeGreaterThan(5);
    const opponent = run.frames.map((f) => f.pos[2]!.join());
    expect(new Set(opponent).size).toBeGreaterThan(5);
  });
});

describe('the building site', () => {
  it('two masons go to the pile and back, in the bench: the house itself only in a whole kernel (durata.test.ts)', async () => {
    const run = await runScenario(
      'mech.cantiere',
      {
        titolo: 'I muratori',
        racconto: 'Due muratori portano le pietre dalla catasta.',
        cose: [{ modulo: 'npc.muratore', x: -2, y: 2 }, { modulo: 'npc.muratore', x: -1, y: 2 }, { modulo: 'cantiere.catasta', x: 0, y: 0 }],
        passi: [{ tipo: 'attendi', secondi: 10 }, { tipo: 'pulsante', azione: 'guarda' }],
        durata: 1,
        guarda: ['cantiere_visto.fase', 'cantiere_visto.finite', '0:muratore.lavoro'],
      },
      ['npc.muratore', 'cantiere.catasta'],
    );
    expect(new Set(run.frames.map((f) => f.pos[1]![0])).size).toBeGreaterThan(5);
    // LIMIT (the bench): its places are never planned, `world.set_tile` says no: a case cannot show a mechanic that changes the ground.
    expect(run.dopo['cantiere_visto.fase']).toBe('platea');
    expect(run.dopo['cantiere_visto.finite']).toBe(0);
  });
});

describe('the market, in a session', () => {
  it('a price everybody shares: it rises as one buys, comes down by itself', async () => {
    const run = await runScenario('mech.mercato', {
      titolo: 'Il prezzo',
      racconto: 'Tre sacchi comprati e il prezzo sale, poi scende piano.',
      passi: [{ tipo: 'pulsante', azione: 'compra' }, { tipo: 'pulsante', azione: 'compra' }, { tipo: 'pulsante', azione: 'compra' }],
      durata: 5,
      guarda: ['mercato_visto.prezzo'],
    });
    const prices = series(run, 'mercato_visto.prezzo').filter((p) => p !== null) as number[];
    expect(Math.max(...prices)).toBeGreaterThanOrEqual(12.9);
    expect(run.dopo['mercato_visto.prezzo'] as number).toBeLessThan(13);
  });
});

describe('laws and factions', () => {
  it('a crime is seen by counting, the bounty grows, the guard comes', async () => {
    const run = await runScenario(
      'mech.fazioni',
      {
        titolo: 'La statua',
        racconto: 'Il viandante abbatte la statua del fondatore: la guardia lo raggiunge.',
        cose: [{ modulo: 'gente.statua', x: 1, y: 0 }, { modulo: 'gente.guardia', x: -2, y: -2 }],
        viandante: { componenti: { fedina: { taglia: 0, reati: 0 } } },
        passi: [{ tipo: 'attendi', secondi: 0.2 }, { tipo: 'pulsante', azione: 'abbatti' }],
        durata: 3,
        guarda: ['fedina.taglia', 'fedina.reati', '0:protetto.da'],
      },
      ['gente.statua', 'gente.guardia'],
    );
    expect(run.dopo['fedina.taglia']).toBe(50);
    expect(run.dopo['fedina.reati']).toBe(1);
    expect(run.dopo['0:protetto.da']).toBe('assente');
    const guard = run.frames.map((f) => f.pos[2]!);
    const dist = ([x, y]: number[]) => Math.hypot(x - 0.5, y - 0.5);
    expect(dist(guard.at(-1)!)).toBeLessThan(dist(guard[0]));
  });
});
