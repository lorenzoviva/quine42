// The wanderer's profile (T44a): the name the world calls them by, the seed of the program `viandante` and the colour
// of its cloak, a few lines they say of themselves. The preview is a photograph of the model, as the icons are. What is
// chosen goes to whoever keeps it (the server in a game of many, the kernel alone), which repairs it and says what.

import type { Kernel } from '../kernel/kernel';
import { PROFILE_LIMITS, type Profile } from '../kernel/wanderers';
import { icons } from './hud';
import { $, el } from './dom';

/** Keeps a profile: the answer is the profile as it was repaired, and what was repaired (in words). */
export type ProfileKeeper = (p: Partial<Profile>) => Promise<{ ok: boolean; profilo?: Profile; testo?: string; motivo?: string }>;

const PREVIEW = 96;

export class ProfilePanel {
  private root = $('#profile');
  private nome = el('input', { type: 'text', maxlength: String(PROFILE_LIMITS.nome[1]), placeholder: 'Come ti chiamano' });
  private tinta = el('input', { type: 'color', value: '#c06030' });
  private presentazione = el('textarea', { rows: String(PROFILE_LIMITS.righe), maxlength: String(PROFILE_LIMITS.presentazione), placeholder: 'Poche righe: chi sei, da dove vieni' });
  private seeds = el('div', { class: 'seeds' });
  private status = el('div', { class: 'status' });
  private seme = 1;
  onClose?: () => void;

  constructor(
    private k: Kernel,
    private keep: ProfileKeeper,
    private current: () => Profile | undefined,
  ) {
    const close = el('button', { class: 'close' }, '×');
    close.onclick = () => this.close();
    const save = el('button', { class: 'primary' }, 'Salva');
    save.onclick = () => void this.save();
    this.tinta.addEventListener('input', () => this.paint());
    this.root.append(
      el('div', { class: 'head' }, el('div', { class: 'title' }, 'Il tuo viandante'), close),
      el('label', {}, 'Nome', this.nome),
      el('div', { class: 'label' }, 'Aspetto'),
      this.seeds,
      el('label', { class: 'row' }, 'Mantello', this.tinta),
      el('label', {}, 'Presentazione', this.presentazione),
      el('div', { class: 'row' }, save),
      this.status,
    );
    this.root.addEventListener('keydown', (e) => {
      // Typing is not playing.
      e.stopPropagation();
      if (e.key === 'Escape') this.close();
    });
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  open(): void {
    const p = this.current();
    const form = this.k.ecs.get(this.k.playerId, 'form');
    this.nome.value = p?.nome && p.nome !== 'Viandante' ? p.nome : '';
    this.seme = p?.seme ?? (Number(form?.seed) || 1);
    this.tinta.value = p?.tinta ?? form?.tint ?? '#c06030';
    this.presentazione.value = p?.presentazione ?? '';
    this.status.textContent = '';
    this.root.hidden = false;
    this.paint();
    this.nome.focus();
  }

  close(): void {
    this.root.hidden = true;
    this.onClose?.();
  }

  /** One photograph per seed of the program, in the cloak's colour: the chosen one framed. */
  private paint(): void {
    const model = String(this.k.ecs.get(this.k.playerId, 'form')?.model ?? 'viandante');
    const n = this.k.forms.seedsOf(model);
    const tint = this.tinta.value;
    this.seeds.replaceChildren(
      ...Array.from({ length: n }, (_, i) => {
        const seed = i + 1;
        const b = el('button', { class: seed === this.seme ? 'seed on' : 'seed', title: `seme ${seed}` }, String(seed));
        b.onclick = () => {
          this.seme = seed;
          this.paint();
        };
        void icons.model?.(model, tint, seed).then((src) => {
          if (src && this.tinta.value === tint) b.replaceChildren(el('img', { src, alt: `seme ${seed}`, width: String(PREVIEW), height: String(PREVIEW) }));
        });
        return b;
      }),
    );
  }

  private async save(): Promise<void> {
    this.status.textContent = '…';
    const r = await this.keep({ nome: this.nome.value, seme: this.seme, tinta: this.tinta.value, presentazione: this.presentazione.value });
    if (!r.ok || !r.profilo) {
      this.status.textContent = r.motivo ?? 'Non è stato possibile.';
      return;
    }
    this.nome.value = r.profilo.nome === 'Viandante' ? '' : r.profilo.nome;
    if (r.profilo.tinta) this.tinta.value = r.profilo.tinta;
    if (r.profilo.seme) this.seme = r.profilo.seme;
    this.presentazione.value = r.profilo.presentazione ?? '';
    this.status.textContent = r.testo ? `Fatto, ma: ${r.testo}.` : 'Fatto.';
    this.paint();
  }
}
