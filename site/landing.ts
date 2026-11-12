// The landing page of the site, a launcher (T101, ADR-0095, T233): the panel that starts the game (the universe, GIOCA, who is playing
// now: launcher-core.ts), next to the stage that runs real MarkovJunior programs (the game's engine, src/mj/) and shows them growing step
// by step as voxels in three.js (hero-stage.ts, loaded only when the stage is about to be seen, T315); the navigation has status lights
// and follows the scroll; the features are a set of tabs; news, videos, the showcase and the instructions show only when they are there
// (T234, T244, ADR-0131): nothing that is not there yet is promised.

import { news } from './notizie-file';
import { renderNewsCard } from './notizie-testo';
import { fetchVideos, renderVideos } from './video-testo';
import { guidePresent } from 'virtual:quine-istruzioni-presenti';
import { launchNote, launchOf, playHref, readSessions, readUniverses, store, stored, UNIVERSE_KEY, type Launch } from './launcher-core';

/**
 * The 3D stage: three.js and the stage's code are downloaded only when the stage is within half a screen of being seen. On a desktop
 * that is at once; on a phone, where the stage is under the text, only if one scrolls towards it.
 */
function initHero(): void {
  const stage = document.getElementById('hero-3d');
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (!stage || !canvas) return;
  const near = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      import('./hero-stage')
        .then(({ startStage }) => startStage(stage, canvas))
        .catch(() => {
          /* the stage stays as the page drew it: its frame and its caption */
        });
    },
    { rootMargin: '0px 0px 50% 0px' },
  );
  near.observe(stage);
}

/** The navigation: the link of the section on screen lights up, the menu opens on small screens, and two status lights. */
function initNav(): void {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  const actions = document.querySelector('.nav-actions');
  toggle?.addEventListener('click', () => {
    const open = !links?.classList.contains('is-open');
    links?.classList.toggle('is-open', open);
    actions?.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  links?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) {
      links.classList.remove('is-open');
      actions?.classList.remove('is-open');
    }
  });

  const anchors = [...document.querySelectorAll<HTMLAnchorElement>('.nav-link[href^="#"]')];
  // Every section counts, with a link or not: under the doors of the launcher no link lights up, rather than the one above them.
  const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')];
  const light = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = sections[0];
    for (const s of sections) if (!s.hidden && s.offsetTop <= y) current = s;
    for (const a of anchors) a.classList.toggle('active', a.getAttribute('href') === `#${current?.id}`);
  };
  window.addEventListener('scroll', light, { passive: true });
  light();

  void initLauncher();
}

function setStatus(id: string, state: 'on' | 'off' | 'wait', text: string): void {
  const pill = document.getElementById(id);
  if (!pill) return;
  pill.dataset.state = state;
  const t = pill.querySelector('.status-text');
  if (t) t.textContent = text;
}

/** An answer of the server as JSON, or undefined: a server that does not answer in time is a server that does not answer. */
async function ask(url: string, signal: AbortSignal): Promise<unknown> {
  try {
    const res = await fetch(url, { signal, cache: 'no-store' });
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  }
}

/** Where GIOCA leads, in the panel and in the bar. */
function setPlay(href: string): void {
  for (const id of ['launch-play', 'nav-play']) document.getElementById(id)?.setAttribute('href', href);
}

/** One row of those being played now: the universe, how many, and a way in. Only text nodes: a name never becomes markup. */
function liveRow(name: string, clients: number): HTMLLIElement {
  const item = document.createElement('li');
  const label = document.createElement('span');
  label.className = 'launch-live-name';
  label.textContent = name;
  const count = document.createElement('span');
  count.className = 'launch-live-count';
  count.textContent = `${clients} ${clients === 1 ? 'VIANDANTE' : 'VIANDANTI'}`;
  const enter = document.createElement('a');
  enter.className = 'comic-btn arcade cyan sm';
  enter.href = playHref(name);
  enter.textContent = 'ENTRA';
  item.append(label, count, enter);
  return item;
}

/** The panel and the bar as the launch says: the universes to choose from, the button, the line under it, who is playing now. */
function showLaunch(launch: Launch): void {
  const n = launch.universes.length;
  setStatus('status-server', launch.online ? 'on' : 'off', launch.online ? 'MONDO ONLINE' : 'MONDO NON RAGGIUNGIBILE');
  setStatus('status-universes', !launch.online ? 'off' : n ? 'on' : 'wait', launch.online ? `${n} ${n === 1 ? 'UNIVERSO' : 'UNIVERSI'}` : 'UNIVERSI —');
  setStatus('launch-state', launch.online ? 'on' : 'off', launch.online ? 'MONDO ONLINE' : 'IN QUESTO BROWSER');

  const live = new Map(launch.live.map((l) => [l.name, l.clients]));
  const select = document.getElementById('launch-universe') as HTMLSelectElement | null;
  if (select) {
    select.replaceChildren(
      ...launch.universes.map((name) => {
        const clients = live.get(name);
        const option = new Option(clients ? `${name} · ${clients} in gioco` : name, name);
        option.selected = name === launch.chosen;
        return option;
      }),
    );
    select.hidden = !n;
    document.getElementById('launch-row')?.classList.toggle('is-alone', !n);
  }
  setPlay(launch.href);
  const note = document.getElementById('launch-note');
  if (note) note.textContent = launchNote(launch);
  const box = document.getElementById('launch-live');
  const list = document.getElementById('launch-live-list');
  if (box && list) {
    list.replaceChildren(...launch.live.map((l) => liveRow(l.name, l.clients)));
    box.hidden = !launch.live.length;
  }
}

/** The launcher: the server's universes and the worlds being played, asked together; the panel waits for both, at most four seconds. */
async function initLauncher(): Promise<void> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  const [universes, sessions] = await Promise.all([ask('/api/universe', ctl.signal), ask('/api/session', ctl.signal)]);
  clearTimeout(timer);
  const launch = launchOf(readUniverses(universes), readSessions(sessions), new URLSearchParams(location.search).get('universo'), stored(UNIVERSE_KEY));
  showLaunch(launch);
  const select = document.getElementById('launch-universe') as HTMLSelectElement | null;
  select?.addEventListener('change', () => {
    if (!launch.universes.includes(select.value)) return;
    store(UNIVERSE_KEY, select.value);
    setPlay(playHref(select.value));
  });
}

/** The features of the game: tabs that show one panel at a time (arrows move between them). */
function initFeatures(): void {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('.showcase-tab')];
  const pick = (tab: HTMLButtonElement) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls')!);
      if (panel) panel.hidden = !on;
    }
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => pick(tab));
    tab.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const to = tabs[(i + d + tabs.length) % tabs.length];
      pick(to);
      to.focus();
    });
  });
}

const LATEST_NEWS = 3;

/** The latest news under the hero (T234): the section and its link stay hidden while there are none. */
function initNews(): void {
  const list = document.getElementById('news-latest');
  const section = document.getElementById('notizie');
  if (!list || !section || !news.length) return;
  list.innerHTML = news.slice(0, LATEST_NEWS).map(renderNewsCard).join('');
  section.hidden = false;
  document.getElementById('nav-news')?.removeAttribute('hidden');
}

/**
 * The showcase (famous cards, structures, the most played universes: T235) shows only when something has filled its list. Today
 * nothing does, so it stays hidden: the launcher promises nothing that is not there.
 */
function initShowcase(): void {
  if (!document.getElementById('showcase-list')?.children.length) return;
  document.getElementById('showcase')?.removeAttribute('hidden');
  document.getElementById('nav-showcase')?.removeAttribute('hidden');
}

/** The videos under the hero: what the server has, with its file. Without any, or without the server, the section stays hidden. */
async function initVideos(): Promise<void> {
  const videos = await fetchVideos();
  if (!videos.length) return;
  const list = document.getElementById('video-list');
  if (!list) return;
  list.innerHTML = renderVideos(videos);
  document.getElementById('video')?.removeAttribute('hidden');
  document.getElementById('nav-video')?.removeAttribute('hidden');
}

/** The instructions exist only if their text was in the build. */
function initGuide(): void {
  if (!guidePresent) return;
  for (const id of ['nav-guide', 'hero-guide']) document.getElementById(id)?.removeAttribute('hidden');
}

if (typeof document !== 'undefined') {
  const start = () => {
    initNav();
    initFeatures();
    initShowcase();
    initGuide();
    void initVideos();
    initNews();
    initHero();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
