// The wanderer's profile (T44a): the name the world calls them by, the seed of the program `viandante` and the colour
// of its cloak, a few lines they say of themselves. The preview is a photograph of the model, as the icons are. What is
// chosen goes to whoever keeps it (the server in a multiplayer game, the kernel alone), which repairs it and says what.

import type { Kernel } from '../kernel/kernel';
import { PROFILE_LIMITS, type Profile } from '../kernel/wanderers';
import { icons } from './hud';
import { $, el } from './dom';

/** Keeps a profile: the answer is the profile as it was repaired, and what was repaired (in words). */
export type ProfileKeeper = (p: Partial<Profile>) => Promise<{ ok: boolean; profilo?: Profile; testo?: string; motivo?: string }>;

const PREVIEW = 96;

/** The account behind the wanderer (T44b): anonymous ones may link to Google and keep the wanderer. */
export interface AccountView {
  anonimo: boolean;
  linkGoogle(): Promise<void>;
  signOut(): Promise<void>;
  /** Wanderer's current credit balance (T45e). */
  crediti?: () => number;
  /** Initiates Stripe Checkout to buy credits (T45e). */
  recharge?: (amount: number) => Promise<{ ok: boolean; url?: string; motivo?: string }>;
}

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
    account?: AccountView,
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
    if (account) this.root.append(this.accountRow(account));
    this.root.addEventListener('keydown', (e) => {
      // Typing is not playing.
      e.stopPropagation();
      if (e.key === 'Escape') this.close();
    });
  }

  private accountRow(a: AccountView): HTMLElement {
    const container = el('div', { class: 'account-section' });
    const out = el('button', {}, 'Esci');
    out.onclick = () => void a.signOut();
    const row = el(
      'div',
      { class: 'row account' },
      a.anonimo ? 'Account anonimo: giochi con i modelli locali e non puoi recuperarlo.' : 'Account Google.',
    );
    if (a.anonimo) {
      const link = el('button', { class: 'primary' }, 'Lega a Google');
      link.onclick = () => a.linkGoogle().catch((e: Error) => (this.status.textContent = e.message));
      row.append(link);
    }
    row.append(out);
    container.append(row);

    // If not anonymous and recharge is available, show credit balance and Stripe top-up presets (T45e)
    if (!a.anonimo && a.crediti && a.recharge) {
      const creditsRow = el('div', { class: 'row ricarica' });
      const balanceEl = el('div', { class: 'saldo' }, `Saldo crediti: $${a.crediti().toFixed(2)}`);
      const ricaricaTitle = el('div', { class: 'label' }, 'Ricarica crediti (Stripe / Google Pay):');
      const buttons = el('div', { class: 'presets' });

      const amounts = [5, 10, 20];
      for (const amount of amounts) {
        const b = el('button', { class: 'preset-btn primary' }, `+${amount} $`);
        b.onclick = async () => {
          this.status.textContent = `Apertura Stripe Checkout (+${amount} $)...`;
          try {
            const res = await a.recharge!(amount);
            if (res.ok && res.url) {
              window.location.href = res.url;
            } else {
              this.status.textContent = res.motivo ?? 'Ricarica non riuscita.';
            }
          } catch (e) {
            this.status.textContent = (e as Error).message;
          }
        };
        buttons.append(b);
      }
      creditsRow.append(balanceEl, ricaricaTitle, buttons);
      container.append(creditsRow);
    }
    return container;
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
    const form = this.k.ecs.get(this.k.wandererEntity, 'form');
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
    const model = String(this.k.ecs.get(this.k.wandererEntity, 'form')?.model ?? 'viandante');
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
