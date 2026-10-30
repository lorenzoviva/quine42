// The credit system (T45a, ADR-0081; P#1 of the multiplayer plan): wanderers have a credit balance in
// `world/giocatori/<id>.json` written only by the server. The master gives credits by hand (via console
// or the Referente). Every model call deducts its cost + 1% (P#1) from its payer (`payerOf`). Common expenses
// (`comune`) are split equally among all currently connected players (master included). When credits are
// exhausted, what the wanderer asks for is answered by local models (like without an API key).
// Anonymous wanderers have no credits and always use local models.

/** Platform fee on top of model cost (P#1): 1%. */
export const PLATFORM_FEE = 0.01;

/** Total cost with the 1% platform fee. */
export function costWithFee(baseCost: number): number {
  if (baseCost <= 0) return 0;
  return Math.round(baseCost * (1 + PLATFORM_FEE) * 1e6) / 1e6;
}

/** Split a common cost among eligible connected wanderers into exact shares summing to total. */
export function splitCost(total: number, count: number): number[] {
  if (total <= 0 || count <= 0) return Array(Math.max(0, count)).fill(0);
  const base = Math.floor((total / count) * 1e6) / 1e6;
  const shares = Array(count).fill(base);
  let remainder = Math.round((total - base * count) * 1e6);
  for (let i = 0; i < count && remainder > 0; i++, remainder--) {
    shares[i] = Math.round((shares[i] + 1e-6) * 1e6) / 1e6;
  }
  return shares;
}
