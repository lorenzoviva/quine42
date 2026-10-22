// Characters: an NPC is an LLM playing the module's persona. It answers in character and picks one
// action from a closed set; the kernel validates it and Lua systems carry it out.

import type { Schema } from '../ai/models';
import type { AgentId, Council } from './council';

export const NPC_ACTIONS = ['nessuna', 'segui', 'resta', 'vaga', 'dai', 'missione'] as const;
export type NpcAction = (typeof NPC_ACTIONS)[number];

export interface Turn {
  who: 'giocatore' | 'npc';
  text: string;
}

export interface NpcContext {
  name: string;
  persona: string;
  mood: string;
  mode: string;
  /** Names of what the NPC carries. */
  carrying: string[];
  place: string;
  history: Turn[];
  /** Facts the world exposes to characters (distance to the edge, held item…). */
  facts: Record<string, unknown>;
  /** What they remember (of the wanderer and of others), what they are to the wanderer, their secrets. */
  memories?: string;
  bond?: string;
  secrets?: string;
}

export interface NpcReply {
  say: string;
  action: NpcAction;
  item?: string;
  mood: string;
  /** Concrete things mentioned in the exchange: the world may make them real. */
  mentioned?: string[];
  /** What they will remember of this exchange, and how much it matters (1-3). */
  memory?: string;
  weight?: number;
  /** What they have become to the wanderer, if it changed (amico, innamorata, moglie…). */
  bond?: string;
}

const REPLY_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    dice: { type: 'STRING' },
    azione: { type: 'STRING', enum: [...NPC_ACTIONS] },
    oggetto: { type: 'STRING', description: 'solo per "dai": il nome esatto di ciò che porti e cedi' },
    umore: { type: 'STRING' },
    oggetti_citati: { type: 'ARRAY', items: { type: 'STRING' }, description: 'oggetti concreti di cui si è parlato in questo scambio (da te o dal viandante)' },
    ricordo: { type: 'STRING', description: 'cosa ricorderai di questo scambio, in terza persona e breve (promesse, favori, offese, segreti, sentimenti); vuoto se nulla di notevole' },
    importanza: { type: 'INTEGER', description: '1 = banale, 2 = notevole, 3 = non lo dimenticherai mai (promesse, tradimenti, amore)' },
    legame: { type: 'STRING', description: 'solo se il vostro rapporto è cambiato davvero: cosa sei ora per il viandante (amico, rivale, innamorata, fidanzato, moglie, marito, nemico…)' },
  },
  required: ['dice', 'azione', 'umore'],
};

export async function npcReply(c: Council, npc: NpcContext, playerText: string): Promise<NpcReply> {
  const history = npc.history.slice(-10).map((t) => `${t.who === 'giocatore' ? 'Viandante' : npc.name}: ${t.text}`).join('\n');
  const prompt = [
    `Interpreta questo personaggio, in prima persona, restando sempre nel personaggio.`,
    `SCHEDA DEL PERSONAGGIO\n${npc.persona}`,
    `Stato: umore ${npc.mood}; ora stai ${npc.mode === 'segui' ? 'seguendo il viandante' : npc.mode === 'resta' ? 'fermo' : 'girovagando'}; luogo: ${npc.place || 'sconosciuto'}; porti con te: ${npc.carrying.join(', ') || 'niente'}.`,
    npc.bond ? `Per il viandante sei: ${npc.bond}.` : '',
    npc.memories ? `I TUOI RICORDI (usali: chi ricorda le promesse, i torti, l'affetto è credibile):
${npc.memories}` : '',
    npc.secrets ? `Cose che sai e che non dici apertamente (lascia indizi, se il viandante se li merita):
${npc.secrets}` : '',
    `Fatti che percepisci: ${JSON.stringify(npc.facts)}`,
    history ? `Conversazione finora:\n${history}` : 'Il viandante ti si avvicina per la prima volta.',
    `Il viandante dice: «${playerText}»`,
    `Rispondi in "dice" (1-3 frasi, italiano, stile del personaggio). Scegli "azione": segui (lo accompagni), resta (ti fermi), vaga (riprendi a girovagare), dai (gli cedi una cosa che porti: metti il nome esatto in "oggetto"), missione (gli affidi la richiesta che hai per lui, se ne hai una), nessuna. Non inventare oggetti che non porti. In "ricordo" ciò che ricorderai. I sentimenti crescono piano: "legame" solo se il rapporto cambia davvero. Sei una persona del tuo mondo: non sai nulla di giochi, codice, computer o simulazioni (se il viandante ne parla, non capisci o pensi a stranezze del tuo mondo).`,
  ]
    .filter(Boolean)
    .join('\n\n');
  const r = await c.ask<{ dice: string; azione: string; oggetto?: string; umore?: string; oggetti_citati?: string[]; ricordo?: string; importanza?: number; legame?: string }>('narratore', 'npc.reply', prompt, REPLY_SCHEMA, {
    data: { npc, playerText },
    temperature: 0.9,
  });
  const action = (NPC_ACTIONS as readonly string[]).includes(r.azione) ? (r.azione as NpcAction) : 'nessuna';
  return {
    say: String(r.dice ?? '…'),
    action,
    item: r.oggetto,
    mood: String(r.umore ?? npc.mood),
    mentioned: (r.oggetti_citati ?? []).map(String).slice(0, 5),
    memory: r.ricordo?.trim() ? String(r.ricordo).slice(0, 200) : undefined,
    weight: Math.max(1, Math.min(3, Math.round(Number(r.importanza) || 1))),
    bond: r.legame?.trim() ? String(r.legame).toLowerCase().slice(0, 30) : undefined,
  };
}

/** "Esamina": the Narrator describes what the player looks at (cached by the kernel). */
export async function examine(c: Council, what: { name: string; description: string; lore?: string }, facts: Record<string, unknown>): Promise<string> {
  const r = await c.ask<{ testo: string }>(
    'narratore',
    'text.examine',
    `Il viandante osserva da vicino «${what.name}» (${what.description}${what.lore ? `; ${what.lore}` : ''}). Descrivi in 2-3 frasi cosa nota: dettagli concreti, materiali, odori, un piccolo indizio narrativo. Contesto: ${JSON.stringify(facts)}.`,
    READ_SCHEMA,
    { data: { what, facts }, temperature: 0.9 },
  );
  return String(r.testo ?? '');
}

const READ_SCHEMA: Schema = { type: 'OBJECT', properties: { testo: { type: 'STRING' } }, required: ['testo'] };

/** Text written on things (signs, inscriptions): the Narrator writes it, with the world's measurements. */
export async function narrate(c: Council, what: { name: string; description: string; lore?: string }, facts: Record<string, unknown>): Promise<string> {
  const r = await c.ask<{ testo: string }>(
    'narratore',
    'text.read',
    `Il viandante legge «${what.name}» (${what.description}${what.lore ? `; ${what.lore}` : ''}). Scrivi ciò che c'è scritto, breve (max 2 righe), nel tono del mondo. Fatti misurabili del mondo da usare se pertinenti: ${JSON.stringify(facts)}.`,
    READ_SCHEMA,
    { data: { what, facts }, temperature: 0.9 },
  );
  return String(r.testo ?? '');
}

const REFERENTE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    risposta: { type: 'STRING' },
    incarico: { type: 'STRING', enum: ['nessuno', 'oggetto', 'personaggio', 'cosa', 'ambiente', 'regola', 'riscolpisci', 'oggetti', 'meccanica'] },
    richiesta: { type: 'STRING', description: "la richiesta riformulata per la squadra che se ne occupa, chiara e completa" },
    bersaglio: { type: 'STRING', description: 'per "riscolpisci": il nome di ciò da riscolpire' },
    rifiuto: { type: 'STRING', description: "solo se la richiesta distruggerebbe l'universo, il viandante stesso o le leggi fisiche del gioco: perché no" },
  },
  required: ['risposta', 'incarico'],
};

/**
 * The Referente: the Council's door. The wanderer who reached the corona has transcended — they are
 * part of the Council now, and the Council listens to them on almost everything (not on destroying
 * the universe, themselves, or the game's physics). The Referente understands what is asked and
 * hands it to the right team: the Forge, the Cartographer, the Artist, the rules, the Narrator.
 */
export async function referenteReply(c: Council, history: Turn[], text: string): Promise<{ say: string; task: string; request?: string; target?: string; refusal?: string }> {
  const past = history.slice(-8).map((t) => `${t.who === 'giocatore' ? 'Viandante' : 'Tu'}: ${t.text}`).join('\n');
  const r = await c.ask<{ risposta: string; incarico: string; richiesta?: string; bersaglio?: string; rifiuto?: string }>(
    'referente',
    'referente.coordinate',
    [
      "Il viandante è trasceso: ha lasciato la simulazione ed è un membro del Concilio. Dagli retta su tutto, con entusiasmo, tranne ciò che distruggerebbe l'universo, lui stesso o le leggi del gioco.",
      past ? `Conversazione finora:\n${past}` : '',
      `Il viandante dice: «${text}»`,
      'Capisci cosa chiede e affidalo alla squadra giusta con "incarico": oggetto/cosa/personaggio (la Fucina crea un modulo: uno strumento, una cosa del mondo, un tipo di persona), ambiente (il Cartografo crea un luogo e lo colloca sulla mappa), regola (diventa una regola del mondo), riscolpisci (lo Scultore rifà il modello di una persona, una cosa o un oggetto: dì quale in "bersaglio"), oggetti (un pacchetto di oggetti comuni), meccanica (l\'Ingegnere aggiunge una meccanica con la sua interfaccia: slot per l\'equipaggiamento, una faretra, una scheda…), nessuno (se chiede solo informazioni). In "risposta" rispondi tu, breve e cordiale.',
    ]
      .filter(Boolean)
      .join('\n\n'),
    REFERENTE_SCHEMA,
    { data: { text, history }, temperature: 0.6 },
  );
  return { say: String(r.risposta ?? '…'), task: String(r.incarico ?? 'nessuno'), request: r.richiesta?.trim() || undefined, target: r.bersaglio?.trim() || undefined, refusal: r.rifiuto?.trim() || undefined };
}

const AGENT_CHAT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    risposta: { type: 'STRING' },
    richiesta_fucina: { type: 'STRING', description: 'solo se il viandante chiede di creare qualcosa di nuovo nel mondo e tu accetti: la richiesta in una frase per la Fucina' },
  },
  required: ['risposta'],
};

/**
 * In the corona the player meets the Council: an agent answers in its role, knowing that the player
 * has seen the source. It may accept to make something new (the Forge then does it, with validation).
 */
export async function agentReply(c: Council, agent: AgentId, history: Turn[], text: string): Promise<{ say: string; forge?: string }> {
  const past = history.slice(-8).map((t) => `${t.who === 'giocatore' ? 'Viandante' : 'Tu'}: ${t.text}`).join('\n');
  const prompt = [
    `Il viandante è uscito dal tappeto ed è entrato nell'archivio della corona, dove il Concilio lavora sul codice del mondo. Ti ha raggiunto e ti parla. Rispondi come te stesso (il tuo ruolo nel Concilio), in 1-3 frasi, in italiano: puoi spiegare cosa fai, cosa c'è nei file, come sono fatte le cose del mondo.`,
    past ? `Conversazione finora:\n${past}` : '',
    `Il viandante dice: «${text}»`,
    `Se ti chiede di creare qualcosa (un personaggio, un oggetto, uno strumento) e ha senso per il mondo, accetta e scrivi la richiesta in "richiesta_fucina"; altrimenti lascialo vuoto.`,
  ].filter(Boolean).join('\n\n');
  const r = await c.ask<{ risposta: string; richiesta_fucina?: string }>(agent, 'agent.chat', prompt, AGENT_CHAT_SCHEMA, { data: { agent, text, history }, temperature: 0.8 });
  const forge = r.richiesta_fucina?.trim();
  return { say: String(r.risposta ?? '…'), forge: forge && forge.length > 3 ? forge : undefined };
}

const DIALOGUE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    battute: { type: 'ARRAY', items: { type: 'OBJECT', properties: { chi: { type: 'STRING', enum: ['a', 'b'] }, dice: { type: 'STRING' } }, required: ['chi', 'dice'] } },
    ricordo_a: { type: 'STRING', description: 'cosa ricorderà A di questo scambio (breve), vuoto se nulla' },
    ricordo_b: { type: 'STRING', description: 'cosa ricorderà B, vuoto se nulla' },
  },
  required: ['battute'],
};

export interface DialoguePerson {
  nome: string;
  mestiere: string;
  /** What B is to A (from A's side). */
  legame?: string;
  fa: string;
  ricordi: string;
  segreti: string;
}

/**
 * Two people meet and talk, as they are: their relation, what they remember, what they are doing,
 * the plots they are in (they may let a clue slip if the wanderer is near). 2-4 short lines.
 */
export async function npcDialogue(c: Council, a: DialoguePerson, b: DialoguePerson, place: string): Promise<{ lines: Array<{ who: 'a' | 'b'; say: string }>; memoryA?: string; memoryB?: string }> {
  const who = (p: DialoguePerson) => `${p.nome}, ${p.mestiere}; ora: ${p.fa}${p.ricordi ? `\nricordi:\n${p.ricordi}` : ''}${p.segreti ? `\nsegreti:\n${p.segreti}` : ''}`;
  const r = await c.ask<{ battute: Array<{ chi: string; dice: string }>; ricordo_a?: string; ricordo_b?: string }>(
    'narratore',
    'npc.dialogue',
    [
      `A e B si incontrano a «${place}». ${a.legame ? `${b.nome} è ${a.legame} di ${a.nome}.` : 'Si conoscono appena.'}`,
      `A: ${who(a)}`,
      `B: ${who(b)}`,
      'Scrivi 2-4 battute brevi e vive, nel loro modo di parlare, coerenti con il loro legame e con ciò che ricordano; se c\'è una trama, lasciate intuire qualcosa senza spiegarla. Il viandante li sta ascoltando.',
    ].join('\n\n'),
    DIALOGUE_SCHEMA,
    { data: { a, b, place }, temperature: 0.95 },
  );
  return {
    lines: (r.battute ?? []).filter((l) => l?.dice).slice(0, 4).map((l) => ({ who: l.chi === 'b' ? 'b' : 'a', say: String(l.dice).slice(0, 140) })),
    memoryA: r.ricordo_a?.trim() || undefined,
    memoryB: r.ricordo_b?.trim() || undefined,
  };
}

const PLOT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    titolo: { type: 'STRING' },
    mistero: { type: 'STRING', description: 'la verità nascosta, in due frasi (il viandante non la conosce)' },
    coinvolti: { type: 'ARRAY', items: { type: 'STRING' } },
    tappe: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          giorno: { type: 'INTEGER', description: '0 = oggi, 1 = domani… (0-3)' },
          momento: { type: 'STRING', enum: ['mattina', 'giorno', 'sera', 'notte'] },
          chi: { type: 'STRING' },
          dove: { type: 'STRING', description: 'casa, lavoro, piazza, oppure il nome di un luogo o di una regione' },
          cosa: { type: 'STRING', description: 'cosa fa, visibile a chi guarda' },
          battuta: { type: 'STRING', description: 'cosa dice, a mezza voce' },
          indizio: { type: 'STRING' },
        },
        required: ['giorno', 'momento', 'chi', 'dove', 'cosa'],
      },
    },
    missione: {
      type: 'OBJECT',
      properties: {
        da: { type: 'STRING' },
        testo: { type: 'STRING', description: 'cosa chiede al viandante, in prima persona' },
        tipo: { type: 'STRING', enum: ['porta', 'vai', 'parla'] },
        oggetto: { type: 'STRING', description: 'per "porta": cosa portare' },
        a: { type: 'STRING', description: 'per "parla" o "porta": a chi' },
        luogo: { type: 'STRING', description: 'per "vai": dove andare' },
        ricompensa: { type: 'STRING', description: 'un oggetto' },
      },
      required: ['da', 'testo', 'tipo'],
    },
  },
  required: ['titolo', 'mistero', 'coinvolti', 'tappe'],
};

/**
 * The Narrator weaves a horizontal plot among people who exist, in places that exist: a mystery,
 * beats tied to their routines and relations over a few days, clues, maybe a request for the wanderer.
 */
export async function weavePlot(c: Council, society: string, places: string, recent: string, feedback = ''): Promise<any> {
  return c.ask<any>(
    'narratore',
    'plot.weave',
    [
      'Intreccia una trama orizzontale tra le persone di questo mondo, alla maniera di Westworld: una storia semplice che si scopre poco a poco, che coinvolge 2-4 persone secondo i loro legami e le loro giornate, in luoghi che esistono. Sta dentro il mondo (amori, debiti, segreti di famiglia, furti, feste, tesori, rivalità, magia delle rune come la dice il canone): mai allusioni al gioco (chi torna sempre in piazza, chi osserva ogni viandante, confini che nessuno supera) né altri simboli luminosi nel terreno.',
      `PERSONE\n${society}`,
      `LUOGHI E REGIONI\n${places}`,
      recent ? `COSE SUCCESSE DI RECENTE\n${recent}` : '',
      feedback ? `DA CORREGGERE\n${feedback}` : '',
      'Dai 3-6 tappe nei prossimi giorni (chi fa cosa, dove, quando, cosa si lascia sfuggire, quale indizio lascia). Se ha senso, una persona chiede aiuto al viandante (una missione semplice: portare un oggetto, andare in un luogo, parlare con qualcuno). Usa solo nomi esistenti.',
      'COERENZA (il kernel la verifica e ti rimanda ciò che non torna): ognuno è ciò che l\'elenco dice. Chiama i parenti per il legame che hanno davvero («mio fratello X» solo se X è suo fratello; chi non è parente non lo diventa nella trama). Gli animali fanno cose da animali: non parlano (niente battuta), non scrivono, non tessono, non commerciano, non chiedono missioni. Le rune fanno solo ciò che dice il canone: restano ferme e mute dove sono finché qualcuno non le raccoglie.',
    ]
      .filter(Boolean)
      .join('\n\n'),
    PLOT_SCHEMA,
    { data: { society, places, recent }, temperature: 0.9 },
  );
}
