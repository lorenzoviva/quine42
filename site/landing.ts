// The landing page of the site (T101, ADR-0095): the hero runs real MarkovJunior programs (the game's engine, src/mj/) and shows them
// growing step by step as voxels in three.js (hero-stage.ts, loaded only when the stage is about to be seen, T315); the navigation has
// status lights and follows the scroll; the showcase of the features is a set of tabs; the videos and the instructions show only when
// they are there (T244, ADR-0131).

import { news } from './notizie-file';
import { renderNewsCard } from './notizie-testo';
import { fetchVideos, renderVideos } from './video-testo';
import { guidePresent } from 'virtual:quine-istruzioni-presenti';

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
  const sections = anchors.map((a) => document.querySelector<HTMLElement>(a.getAttribute('href')!)).filter((s): s is HTMLElement => !!s);
  const light = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = sections[0];
    for (const s of sections) if (s.offsetTop <= y) current = s;
    for (const a of anchors) a.classList.toggle('active', a.getAttribute('href') === `#${current?.id}`);
  };
  window.addEventListener('scroll', light, { passive: true });
  light();

  void checkStatus();
}

function setStatus(id: string, state: 'on' | 'off' | 'wait', text: string): void {
  const pill = document.getElementById(id);
  if (!pill) return;
  pill.dataset.state = state;
  const t = pill.querySelector('.status-text');
  if (t) t.textContent = text;
}

/** Whether the world's server answers, and how many worlds it keeps. */
async function checkStatus(): Promise<void> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch('/api/universe', { signal: ctl.signal });
    clearTimeout(timer);
    const body = res.ok ? ((await res.json()) as { available?: boolean; universes?: string[] }) : undefined;
    if (!body?.available) throw new Error('no store');
    setStatus('status-server', 'on', 'MONDO ONLINE');
    const n = body.universes?.length ?? 0;
    setStatus('status-universes', n ? 'on' : 'wait', `${n} ${n === 1 ? 'UNIVERSO' : 'UNIVERSI'}`);
  } catch {
    setStatus('status-server', 'off', 'MONDO NON RAGGIUNGIBILE');
    setStatus('status-universes', 'off', 'UNIVERSI —');
  }
}

/** The showcase of the features: tabs that show one panel at a time (arrows move between them). */
function initShowcase(): void {
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

/** The latest news under the hero (T234): the section stays hidden while there are none. */
function initNews(): void {
  const list = document.getElementById('news-latest');
  const section = document.getElementById('notizie');
  if (!list || !section || !news.length) return;
  list.innerHTML = news.slice(0, LATEST_NEWS).map(renderNewsCard).join('');
  section.hidden = false;
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
    initShowcase();
    initGuide();
    void initVideos();
    initNews();
    initHero();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
