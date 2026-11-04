// The four themes offered by the Genesis screen (T152, ADR-0134): plain text, the same free text the player can rewrite.
// A theme is not a seed of its own: what a universe keeps of it is `prompts/theme.md`, like any theme written by hand.

export interface WorldTheme {
  id: 'medievale' | 'steampunk' | 'moderno' | 'futuristico';
  name: string;
  text: string;
}

/** The first is the seed's own `prompts/theme.md`: a test keeps them equal. */
export const WORLD_THEMES: readonly WorldTheme[] = [
  {
    id: 'medievale',
    name: 'Medievale',
    text: `# Tema: Il Regno di Valmora

Un regno medievale quieto: prati, boschi, laghi, colline, borghi di gente semplice, castelli lontani,
strade che portano a terre sempre più diverse. Contadini, artigiani, mercanti, guardie, maghi di
villaggio, briganti nei boschi, animali di casa e di bosco.

Tono: concreto, caldo, con un pizzico di meraviglia. Il mondo è vivo e coerente, e per chi ci vive è reale.
Le storie nascono dalle persone: lavoro, famiglie, amori, debiti, feste, rivalità, viaggi, bestie, magia.
Qua e là, sul suolo, ci sono le rune: lastre con un segno inciso che manda una luce tenue. La gente le
raccoglie, le studia, le vende, le teme; ciò che fanno davvero è scritto nel canone delle rune.`,
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    text: `# Tema: Le Città del Vapore

Un'età del vapore e dell'ottone: città di mattoni sotto un cielo di fuliggine, ferrovie sui viadotti, dirigibili
ormeggiati alle torri, officine che non dormono; fuori, miniere, campagne con le trebbiatrici a caldaia, porti di
bastimenti. Macchinisti, fuochisti, orologiai, operaie dei telai, inventori squattrinati, giornalai, ladri di rame,
cavalli da tiro e gatti di fabbrica.

Tono: concreto, caldo, con un pizzico di meraviglia. Il mondo è vivo e coerente, e per chi ci vive è reale.
Le storie nascono dalle persone: lavoro, famiglie, amori, debiti, scioperi, brevetti, rivalità, viaggi.
Qua e là, sul suolo, ci sono le rune: lastre con un segno inciso che manda una luce tenue. Gli inventori provano a
capirle, i collezionisti le pagano bene, i vecchi le temono; c'è chi chiama magia ciò che fanno e chi una scienza
ancora da scrivere. Ciò che fanno davvero è scritto nel canone delle rune.`,
  },
  {
    id: 'moderno',
    name: 'Moderno',
    text: `# Tema: La Grande Città, anni Novanta

Una grande città negli anni Novanta: condomini e palazzi, viali di platani, tram e metropolitana, cantieri, centri
commerciali; ai margini la tangenziale, i campi, il porto, le colline dove si va la domenica. Baristi, tranvieri,
idraulici, commesse, infermiere, studenti, vigili, tassisti, piccoli truffatori, cani e gatti di quartiere. Cabine
telefoniche, radio private, videocassette, motorini.

Tono: concreto, caldo, con un pizzico di meraviglia. Il mondo è vivo e coerente, e per chi ci vive è reale.
Le storie nascono dalle persone: lavoro, famiglie, amori, debiti, sfratti, feste di quartiere, rivalità, viaggi.
Qua e là, sul suolo, ci sono le rune: lastre con un segno inciso che manda una luce tenue, sul prato come
sul marciapiede. Alla radio ci ridono sopra; le raccolgono i ragazzi, le vendono ai mercatini, le studia qualche
professore, e chi ne ha pronunciata una lo racconta sottovoce. Ciò che fanno davvero è scritto nel canone delle rune.`,
  },
  {
    id: 'futuristico',
    name: 'Futuristico',
    text: `# Tema: Neon sulla Pioggia

Una metropoli del futuro: torri di vetro, insegne al neon sotto una pioggia che non smette, treni sospesi, mercati
sotto i viadotti, serre verticali; oltre le mura, coste allagate e distese di rottami. Riparatori di automi, piloti di
navette, cuoche di strada, medici senza licenza, corrieri, guardie delle compagnie, gatti e corvi di tetto.

Tono: concreto, caldo sotto la pioggia, con un pizzico di meraviglia. Il mondo è vivo e coerente, e per chi ci vive è reale.
Le storie nascono dalle persone: lavoro, famiglie, amori, debiti, turni, contrabbando, rivalità, viaggi.
Qua e là, sul suolo, ci sono le rune: lastre con un segno inciso che manda una luce tenue, nel fango come
sull'asfalto. Le compagnie le comprano, i corrieri le contrabbandano, gli ambulanti ne vendono di false; per strada
c'è chi chiama magia ciò che fanno, senza vergognarsi. Ciò che fanno davvero è scritto nel canone delle rune.`,
  },
];

/** The theme a text is, as it is or with only its blank ends and line endings changed; a text rewritten is no theme of the list. */
export function themeOfText(text: string): WorldTheme | undefined {
  const plain = (s: string) => s.replace(/\r\n/g, '\n').trim();
  return WORLD_THEMES.find((t) => plain(t.text) === plain(text));
}
