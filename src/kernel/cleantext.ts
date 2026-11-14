// A text a player wrote, cleaned to one line (T295, ADR-0161; T374): pure and light, so that what reads the universe's files (the validator, the
// master's directives) can use it without the engine the hand-made cards bring along.

/**
 * A text a player wrote, for a page and maybe a world: one line, at most `max` characters, at least a letter or a digit, no markup, no
 * control or invisible character (no bidirectional override that turns it round on a page). Spaces collapse; nothing else is changed:
 * what is wrong goes back with the reason.
 */
export function cleanText(raw: unknown, max: number, what: string): { text: string } | { error: string } {
  if (typeof raw !== 'string') return { error: `${what}: serve un testo` };
  const text = raw.normalize('NFC').replace(/\s+/gu, ' ').trim();
  if (/[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Cs}]/u.test(text)) return { error: `${what}: contiene caratteri invisibili o di controllo` };
  if (/[<>]/.test(text)) return { error: `${what}: niente «<» né «>»` };
  if (!/[\p{L}\p{N}]/u.test(text)) return { error: `${what}: serve almeno una lettera o una cifra` };
  if ([...text].length > max) return { error: `${what}: al più ${max} caratteri` };
  return { text };
}
