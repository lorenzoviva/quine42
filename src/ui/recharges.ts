// Whether this server takes top-ups (ADR-0189), for the game and the site alike. With the payments off (the open beta, `QUINE_PAGAMENTI=spenti`)
// Stripe's routes are not mounted and its config is not found; a server that does not answer, or answers that it cannot charge, takes none
// either. Whoever shows a top-up asks here first: no button that leads to a refusal.

/** True only if `/api/stripe/config` answers that a payment can be taken. */
export async function rechargesAvailable(fetchFn: typeof fetch = fetch): Promise<boolean> {
  try {
    const r = await fetchFn('/api/stripe/config', { cache: 'no-store' });
    return r.ok && (await r.json())?.available === true;
  } catch {
    return false;
  }
}
