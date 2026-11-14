// What the server's routes ask of a world that is running (T127, ADR-0110). The world is another process: the routes have no kernel
// in their hands, only these calls, which there go over the channel and in a test may answer at once (`worldOf`).

import type { Kernel } from '../src/kernel/kernel';
import type { PaymentRecord } from '../src/kernel/credits';
import { walletFromKernel, type Wallet } from './wallet';
import { viewFromKernel, type WandererView } from './wanderer';

type Later<T> = T | Promise<T>;
type AccountKind = WandererView['account'];

export interface WorldCalls {
  creditRecharge(payment: PaymentRecord): Later<{ ok: boolean; motivo?: string; duplica?: boolean }>;
  isAnonymous(id: string): Later<boolean>;
  wallet(universo: string, id: string, account: AccountKind): Later<Wallet>;
  view(universo: string, id: string, account: AccountKind): Later<WandererView>;
  /** The profile kept, repaired, and the wanderer as they are now; undefined if it could not be kept. */
  keepProfile(universo: string, id: string, account: AccountKind, profilo: unknown): Later<{ profilo: unknown; riparato: string[]; viandante: WandererView } | undefined>;
  /** Whether the universe is private now (ADR-0193): the master's purse answers for an anonymous guest only then (ADR-0188). */
  setPrivate(value: boolean): Later<boolean>;
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
  };
}
