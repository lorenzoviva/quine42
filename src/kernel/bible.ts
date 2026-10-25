// The Library of the World's lectern (T47a): the world bible as pages, with touching graph nodes.
// Pure functions, deterministic, headless-testable.

import type { Bible } from './agents/council';
import type { GraphNode, WorldGraph } from './graph';

export type BibleSection = 'prologo' | 'luoghi' | 'personaggi' | 'fatti' | 'misteri';

export interface BiblePage {
  index: number;
  sezione: BibleSection;
  titolo: string;
  testo: string;
  voceIndex: number;
}

export interface BibleShown {
  page: BiblePage;
  index: number;
  count: number;
  nodes: GraphNode[];
}

function normName(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const hasWords = (text: string, name: string) => ` ${text} `.includes(` ${name} `);

/**
 * Turns a bible into an ordered list of pages covering the whole bible:
 * prologue (title, summary, story), then one page per item of places, characters, facts, mysteries.
 */
export function biblePages(bible: Bible): BiblePage[] {
  const pages: BiblePage[] = [];

  // Prologue page with title, summary, story
  if (bible.titolo || bible.sintesi || bible.storia) {
    pages.push({
      index: pages.length,
      sezione: 'prologo',
      titolo: bible.titolo || 'Prologo',
      testo: [bible.sintesi, bible.storia].filter(Boolean).join('\n\n'),
      voceIndex: 0,
    });
  }

  // Places: one page per place
  for (let i = 0; i < (bible.luoghi ?? []).length; i++) {
    const item = bible.luoghi[i];
    const parts = item.split(' — ');
    pages.push({
      index: pages.length,
      sezione: 'luoghi',
      titolo: parts[0].trim(),
      testo: item.trim(),
      voceIndex: i,
    });
  }

  // Characters: one page per character
  for (let i = 0; i < (bible.personaggi ?? []).length; i++) {
    const item = bible.personaggi[i];
    const parts = item.split(' — ');
    pages.push({
      index: pages.length,
      sezione: 'personaggi',
      titolo: parts[0].trim(),
      testo: item.trim(),
      voceIndex: i,
    });
  }

  // Facts: one page per fact
  for (let i = 0; i < (bible.fatti ?? []).length; i++) {
    const item = bible.fatti[i];
    const parts = item.split(' — ');
    pages.push({
      index: pages.length,
      sezione: 'fatti',
      titolo: parts.length > 1 ? parts[0].trim() : (item.length > 44 ? item.slice(0, 41).trim() + '…' : item.trim()),
      testo: item.trim(),
      voceIndex: i,
    });
  }

  // Mysteries: one page per mystery
  for (let i = 0; i < (bible.misteri ?? []).length; i++) {
    const item = bible.misteri![i];
    const parts = item.split(' — ');
    pages.push({
      index: pages.length,
      sezione: 'misteri',
      titolo: parts.length > 1 ? parts[0].trim() : (item.length > 44 ? item.slice(0, 41).trim() + '…' : item.trim()),
      testo: item.trim(),
      voceIndex: i,
    });
  }

  return pages;
}

/**
 * Finds graph nodes touching a page of the bible:
 * - by direct name match (`graph.find`)
 * - by fact / mystery citation links in the graph
 * - by scanning nodes (people, places, regions) mentioned in the page text
 * - including direct neighbors of matched core nodes
 */
export function touchingNodes(page: BiblePage, g: WorldGraph, bible?: Bible | null): GraphNode[] {
  const seen = new Set<string>();
  const result: GraphNode[] = [];

  const add = (node?: GraphNode) => {
    if (node && !seen.has(node.id)) {
      seen.add(node.id);
      result.push(node);
    }
  };

  const textNorm = normName(`${page.titolo} ${page.testo}`);

  // 1. Direct match by title via find
  for (const n of g.find(page.titolo)) {
    add(n);
  }

  // 2. Fact/mystery graph node and its cited neighbors
  if (page.sezione === 'fatti' || page.sezione === 'misteri') {
    const fattiLen = bible?.fatti?.length ?? 0;
    const factIdx = page.sezione === 'fatti' ? page.voceIndex + 1 : fattiLen + page.voceIndex + 1;
    const factNode = g.node(`fatto:${factIdx}`);
    if (factNode) {
      add(factNode);
      for (const neighbor of g.neighbors(factNode.id)) {
        add(neighbor);
      }
    }
  }

  // 3. Scan all nodes in the graph: if their label is mentioned in page text as whole words, add them
  for (const n of g.nodes.values()) {
    const labelNorm = normName(n.label);
    if (labelNorm.length >= 3 && hasWords(textNorm, labelNorm)) {
      add(n);
    }
  }

  // 4. For directly matched core nodes, include 1-hop neighbors (places where they live, people in places...)
  const coreNodes = [...result];
  for (const n of coreNodes) {
    if (n.tipo === 'persona' || n.tipo === 'luogo' || n.tipo === 'regione') {
      for (const neighbor of g.neighbors(n.id, 1)) {
        add(neighbor);
      }
    }
  }

  return result;
}
