// The site's videos (T244, ADR-0131), on the client: what the server lists → HTML. The titles come from a file on the server, so they come out escaped, like a news item's text.

import { escapeHtml } from './shared';

export interface SiteVideo {
  titolo: string;
  descrizione?: string;
  url: string;
}

const VIDEO_URL_RE = /^\/api\/video\/[A-Za-z0-9._-]+$/;

/** What in an answer is a video to show. */
export function readVideos(body: unknown): SiteVideo[] {
  const list = (body as { video?: unknown } | undefined)?.video;
  if (!Array.isArray(list)) return [];
  return (list as Partial<SiteVideo>[]).filter((v): v is SiteVideo => typeof v?.titolo === 'string' && typeof v.url === 'string' && VIDEO_URL_RE.test(v.url));
}

/** The videos of this server; none if it does not answer. */
export async function fetchVideos(): Promise<SiteVideo[]> {
  try {
    const r = await fetch('/api/video', { cache: 'no-store' });
    return r.ok ? readVideos(await r.json()) : [];
  } catch {
    return [];
  }
}

/** `preload="metadata"`: a page with many long videos asks only for what tells how long they are; the rest when someone presses play. */
export function renderVideos(videos: SiteVideo[]): string {
  return videos
    .map(
      (v) => `<figure class="video-item">
      <video controls preload="metadata" playsinline src="${escapeHtml(v.url)}"></video>
      <figcaption>
        <h3 class="video-title">${escapeHtml(v.titolo)}</h3>
        ${typeof v.descrizione === 'string' ? `<p class="video-about">${escapeHtml(v.descrizione)}</p>` : ''}
      </figcaption>
    </figure>`,
    )
    .join('');
}
