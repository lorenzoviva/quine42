// What the server's routes ask of a world that is running (T127, ADR-0110). The world is another process: the routes have no kernel
// in their hands, only these calls, which there go over the channel and in a test may answer at once (`worldOf`).

import type { Kernel } from '../src/kernel/kernel';
import type { PaymentRecord } from '../src/kernel/credits';
import { walletFromKernel, type Wallet } from './wallet';
import { viewFromKernel, type WandererView } from './wanderer';
import type { WorldPace } from '../src/kernel/worldPace';
import type { KeyHolders } from '../src/kernel/credits';
import { campaignEdit, campaignSeen, type CampaignDone, type CampaignEdit, type CampaignSeen } from '../src/kernel/campaignEdit';

type Later<T> = T | Promise<T>;
type AccountKind = WandererView['account'];

export interface WorldCalls {
  creditRecharge(payment: PaymentRecord): Later<{ ok: boolean; motivo?: string; duplica?: boolean }>;
  isAnonymous(id: string): Later<boolean>;
  wallet(universo: string, id: string, account: AccountKind): Later<Wallet>;
  view(universo: string, id: string, account: AccountKind): Later<WandererView>;
  /** The profile kept, repaired, and the wanderer as they are now; undefined if it could not be kept. */
  keepProfile(universo: string, id: string, account: AccountKind, profilo: unknown): Later<{ profilo: unknown; riparato: string[]; viandante: WandererView } | undefined>;
  /** Whether the universe is private now (ADR-0194): the master's purse answers for an anonymous guest only then (ADR-0188). */
  setPrivate(value: boolean): Later<boolean>;
  /** The pace of the world as the master set it through the route (T373): the world repairs it and answers how it took it. */
  setPace(pace: WorldPace): Later<WorldPace>;
  /** Who holds a key of OpenRouter now (T363, ADR-0197), by value: the ids that can pay, and those whose key said 402. */
  setKeys(keys: KeyHolders): Later<void>;
  /**
   * The campaign from the site (T377): the master's directives and regions as the world has them now, and, with an edit, the edit made first (checked
   * as in the game, written with a commit of the main line). The server asks only for the master, through its `campaign` route.
   */
  campaign(edit?: CampaignEdit): Later<{ seen: CampaignSeen; done?: CampaignDone }>;
}

/** An edit of the campaign in a world: checked on its files and environments, then published as the master publishes (`Kernel.publish`). */
function editCampaign(k: Kernel, edit: CampaignEdit): CampaignDone {
  const change = campaignEdit(k.files, edit, k.content.layouts);
  if (!('path' in change)) return change;
  const r = k.publish({ [change.path]: change.text }, change.message);
  if (!r.ok) return { ok: false, reasons: [r.motivo ?? 'il mondo non l’ha preso'] };
  k.council.say('kernel', 'info', `${change.message} (dal sito)`);
  return change.done;
}

/** The calls answered by a kernel at hand: in the world's own process, and in the tests. */
export function worldOf(k: Kernel): WorldCalls {
  return {
    creditRecharge: (payment) => k.creditRecharge(payment),
    isAnonymous: (id) => k.isAnonymous(id),
    wallet: (universo, id, account) => walletFromKernel(k, universo, id, account),
    view: (universo, id, account) => viewFromKernel(k, universo, id, account),
    keepProfile(universo, id, account, profilo) {
      const r = k.keepProfile(id, profilo);
      return r ? { profilo: r.profilo, riparato: r.riparato, viandante: viewFromKernel(k, universo, id, account) } : undefined;
    },
    setPrivate(value) {
      k.privateWorld = value === true;
      return k.privateWorld;
    },
    // Quiet: the server already keeps it.
    setPace: (pace) => k.applyPace(pace, true),
    setKeys: (keys) => k.setKeys(keys),
    campaign(edit) {
      const done = edit ? editCampaign(k, edit) : undefined;
      return { seen: campaignSeen(k.files, k.content.layouts), ...(done ? { done } : {}) };
    },
  };
}
