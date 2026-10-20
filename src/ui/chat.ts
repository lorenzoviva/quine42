// Talking to characters: free text in, the Narrator plays the persona, the kernel applies the action.

import type { Id } from '../kernel/ecs';
import type { Kernel, Mind } from '../kernel/kernel';
import type { AgentId } from '../kernel/agents/council';
import { $, el } from './dom';

const ACTIONS: Record<string, string> = { segui: 'ti segue', resta: 'si ferma', vaga: 'riprende a girovagare', dai: 'ti dà qualcosa' };

export class Chat {
  private root = $('#chat');
  private log = el('div', { class: 'log' });
  private input = el('input', { type: 'text', placeholder: 'Scrivi e premi Invio…', maxlength: '300' });
  private title = el('div', { class: 'title' });
  private npc: Id | null = null;
  /** In the corona you talk to the Council itself. */
  private agent: AgentId | null = null;
  private waiting = false;
  onClose?: () => void;

  constructor(private k: Kernel) {
    const close = el('button', { class: 'close' }, '×');
    close.onclick = () => this.close();
    this.root.append(el('div', { class: 'head' }, this.title, close), this.log, el('div', { class: 'row' }, this.input));
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') void this.send();
      if (e.key === 'Escape') this.close();
    });
    k.bus.on('ui:chat', ({ id, name }) => this.open(id, name));
    k.bus.on('ui:agentchat', ({ agent, name }: { agent: AgentId; name: string }) => this.openAgent(agent, name));
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(id: Id, name: string): void {
    this.npc = id;
    this.agent = null;
    const mind: Mind | undefined = this.k.ecs.get(id, 'mind');
    this.title.textContent = name;
    this.log.replaceChildren(...(mind?.history ?? []).map((t) => this.line(t.who === 'giocatore' ? 'Tu' : name, t.text, t.who)));
    if (!mind?.history?.length) this.log.append(el('div', { class: 'note' }, `${name} ti guarda. Di' qualcosa.`));
    this.root.hidden = false;
    this.onClose?.();
    requestAnimationFrame(() => this.input.focus());
  }

  openAgent(agent: AgentId, name: string): void {
    this.npc = null;
    this.agent = agent;
    this.title.textContent = `${name} del Concilio`;
    this.log.replaceChildren(el('div', { class: 'note' }, `${name} alza gli occhi dal suo lavoro. Puoi chiedergli come è fatto il mondo, o di crearci qualcosa.`));
    this.root.hidden = false;
    this.onClose?.();
    requestAnimationFrame(() => this.input.focus());
  }

  private async sendToAgent(agent: AgentId, text: string): Promise<void> {
    const name = this.title.textContent ?? '';
    this.log.append(this.line('Tu', text, 'giocatore'));
    const typing = el('div', { class: 'note' }, 'riflette…');
    this.log.append(typing);
    this.waiting = true;
    this.input.disabled = true;
    const r = await this.k.talkToAgent(agent, text);
    this.waiting = false;
    this.input.disabled = false;
    typing.remove();
    if (this.agent !== agent) return;
    this.log.append(this.line(name, r.say, 'npc'));
    if (r.forged) this.log.append(el('div', { class: 'note' }, `(Fucina: ${r.forged})`));
    this.log.scrollTop = this.log.scrollHeight;
    this.input.focus();
  }

  close(): void {
    this.root.hidden = true;
    this.npc = null;
    this.agent = null;
    this.input.blur();
    this.onClose?.();
  }

  private line(who: string, text: string, kind: string): HTMLElement {
    return el('div', { class: `line ${kind}` }, el('b', {}, `${who}: `), text);
  }

  private async send(): Promise<void> {
    const text = this.input.value.trim();
    if (text && !this.waiting && this.agent) {
      this.input.value = '';
      return this.sendToAgent(this.agent, text);
    }
    if (!text || this.waiting || this.npc === null) return;
    const id = this.npc;
    const name = this.title.textContent ?? '';
    this.input.value = '';
    this.log.append(this.line('Tu', text, 'giocatore'));
    const typing = el('div', { class: 'note' }, `${name} pensa…`);
    this.log.append(typing);
    this.log.scrollTop = this.log.scrollHeight;
    this.waiting = true;
    this.input.disabled = true;
    const reply = await this.k.talk(id, text);
    this.waiting = false;
    this.input.disabled = false;
    typing.remove();
    if (this.npc !== id) return;
    this.log.append(this.line(name, reply.say, 'npc'));
    if (reply.action !== 'nessuna') this.log.append(el('div', { class: 'note' }, `(${name} ${ACTIONS[reply.action] ?? reply.action})`));
    this.log.scrollTop = this.log.scrollHeight;
    this.input.focus();
  }
}
