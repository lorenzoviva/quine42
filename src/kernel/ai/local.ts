// The models of a world where some wanderers play offline (T44b): what such a wanderer pays for (`TextCall.chi`) is
// made by the local models, the rest by the world's. An anonymous account has nothing to recover it with, so it
// pays nothing: it plays with the local models until it is linked to a Google account (ADR-0081).

import type { Limits, Models, TextCall } from './models';
import type { CallRecord } from './usage';

export class PayerModels implements Models {
  readonly name: string;

  constructor(
    private main: Models,
    private local: Models,
    /** Whether a payer plays offline now. */
    private offline: (chi: string | undefined) => boolean,
  ) {
    this.name = main.name;
  }

  get usage() {
    return this.main.usage;
  }
  get limits(): Limits {
    return this.main.limits;
  }
  set limits(l: Limits) {
    this.main.limits = l;
  }
  get onCall() {
    return this.main.onCall;
  }
  set onCall(f: ((r: CallRecord) => void) | undefined) {
    this.main.onCall = f;
  }

  /** Whether a call goes to the local models. */
  isLocal(call: Pick<TextCall, 'chi'>): boolean {
    return this.offline(call.chi);
  }

  text(call: TextCall): Promise<string> {
    return (this.isLocal(call) ? this.local : this.main).text(call);
  }
}
