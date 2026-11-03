// Volume and mute, in the help panel: the one panel of the game that is about the game itself.

import type { Sfx } from '../audio/sfx';

export function bindSoundMenu(sfx: Sfx, volume: HTMLInputElement, mute: HTMLInputElement): void {
  volume.value = String(Math.round(sfx.prefs.volume * 100));
  mute.checked = sfx.prefs.muted;
  volume.addEventListener('input', () => sfx.setPrefs({ volume: Number(volume.value) / 100 }));
  mute.addEventListener('change', () => sfx.setPrefs({ muted: mute.checked }));
  // The arrows and the space bar go back to walking and jumping as soon as the choice is made.
  for (const el of [volume, mute]) el.addEventListener('change', () => el.blur());
}
