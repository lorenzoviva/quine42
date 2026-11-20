// The vessel the Sculptor answers with offline (T440, `docs/design/acqua-spazio.md` § 1.6): a simple boat written for the box the request
// asks, as the kernel's checks want a vessel (`src/mj/vessel.ts`): a hull like half an egg, long along y, the stern cut flat and the bow
// narrowing toward large y, its waterline on the root; a dinghy is open, a floor of planks over the water inside it; from the sailing boat up
// a deck with a low rail, a gap in it amidships where one boards, the helm aft, the hold under the deck, one mast for every size up to three,
// each with its sail, which the actions «Ammaina le vele» and «Issa le vele» take away and put back. A vessel is not one program for every
// size (its sizes are other ships): the Sculptor writes one at each, and offline this writes it with the box's numbers. The seed's generic
// vessel (`universe/models/vessel.xml`) is this at the class's own size. Here, not in the prompt: a program in the prompt is copied (T337).

import type { Vec3 } from '../../mj/engine';

/** The numbers of a box's boat (T440): where its deck (or its gunwale) is, its waterline, its masts. */
export function mockVesselShape([, Y, Z]: Vec3): { decked: boolean; deck: number; waterline: number; masts: number } {
  const decked = Y >= 80;
  const deck = decked ? Math.max(8, Math.round(Z * 0.3)) : Math.max(4, Math.round(Z * 0.5));
  const waterline = decked ? Math.max(3, Math.round(deck * 0.55)) : Math.max(1, Math.round(Z * 0.28));
  const masts = !decked ? 0 : Y >= 240 ? 3 : Y >= 150 ? 2 : 1;
  return { decked, deck, waterline, masts };
}

const n = (v: number) => String(Math.round(v * 2) / 2);
const at = (x: number, y: number, z: number) => `at="${n(x)} ${n(y)} ${n(z)}"`;
const size = (x: number, y: number, z: number) => `size="${Math.max(1, Math.round(x))} ${Math.max(1, Math.round(y))} ${Math.max(1, Math.round(z))}"`;

/** The offline vessel for a box in voxels (at `VESSEL_VPT`): a program with the box written in, its waterline on the root. */
export function mockVesselProgram(box: Vec3, name = 'Barca'): string {
  const [X, Y, Z] = box.map((v) => Math.max(4, Math.round(v))) as Vec3;
  const { decked, deck, waterline, masts } = mockVesselShape([X, Y, Z]);
  const cx = (X - 1) / 2, cy = (Y - 1) / 2;
  const t = 2;
  // The stern cut flat: the rows behind it are sea.
  const cut = Math.max(1, Math.round(Y * 0.06));
  const lines: string[] = [];
  const add = (s: string) => lines.push(`  ${s}`);
  add('<!-- The hull: the lower half of an egg as long and as wide as the box, hollow, the stern cut flat and closed by a transom. -->');
  add(`<ellipsoid ${at(cx, cy, 0)} ${size(X, Y, 2 * deck)} color="H"/>`);
  add(`<ellipsoid ${at(cx, cy, t)} ${size(X - 2 * t, Y - 2 * t, 2 * deck - 2 * t)} color="I" on="H"/>`);
  add(`<box ${at(cx, cy, deck)} ${size(X, Y, Z - deck)} color="B"/>`);
  add(`<box ${at(cx, (cut - 1) / 2, 0)} ${size(X, cut, Z)} color="B"/>`);
  add(`<box ${at(cx, cut, 0)} ${size(X, 1, deck)} color="H" on="I"/>`);
  if (!decked) {
    add('<!-- Open: a floor of planks over the water inside, the middle plank where one steps in, the tiller aft. -->');
    add(`<box ${at(cx, cy, 0)} ${size(X, Y, waterline + 1)} color="F" on="I"/>`);
    add('<prl in="I" out="B"/>');
    add(`<box ${at(cx, cy, waterline)} ${size(X, Math.max(2, Math.round(Y / 12)), 1)} color="G" on="F"/>`);
    add(`<box ${at(cx, cut + 3, waterline + 1)} ${size(2, 3, Math.max(2, deck - waterline - 2))} color="T"/>`);
  } else {
    add('<!-- The deck over the hold, the planks at the bottom of the hold, a low rail round the deck. -->');
    add(`<box ${at(cx, cy, deck - 1)} ${size(X, Y, 1)} color="D" on="I"/>`);
    add('<all in="I H" out="O *" steps="1"/>');
    add('<prl in="I" out="B"/>');
    add('<all in="B H" out="R *" steps="1"/>');
    add('<all in="B R" out="R *" steps="1"/>');
    add('<!-- Where one boards: the rail opens amidships on both sides, a step of planks in the gap. -->');
    add(`<box ${at(cx, cy, deck + 1)} ${size(X, 16, 1)} color="B" on="R"/>`);
    add(`<box ${at(cx, cy, deck)} ${size(X, 16, 1)} color="G" on="R"/>`);
    add('<!-- The helm aft, on the middle line: a post and its wheel. -->');
    const hy = cut + Math.max(6, Math.round(Y * 0.1));
    add(`<box ${at(cx, hy, deck)} ${size(2, 2, 12)} color="T"/>`);
    add(`<box ${at(cx, hy + 1.5, deck + 7)} ${size(7, 1, 7)} color="T"/>`);
    add('<!-- The masts, a sail on each above the head of whoever walks the deck, its yard on top. -->');
    const where = masts === 1 ? [0.55] : masts === 2 ? [0.4, 0.7] : [0.3, 0.52, 0.74];
    const mw = Y >= 240 ? 3 : 2;
    const sail0 = deck + 26, top = Z - 3;
    for (const f of where) {
      const my = Math.round(Y * f);
      // The sail and its yard just in front of the mast, touching it: one body.
      const sy = my + Math.floor((mw - 1) / 2) + 1;
      add(`<box ${at(cx, my, deck)} ${size(mw, mw, top - deck)} color="M"/>`);
      if (top - sail0 >= 8) {
        add(`<box ${at(cx, sy, sail0)} ${size(Math.round(X * 0.78), 1, top - sail0 - 2)} color="S"/>`);
        add(`<box ${at(cx, sy, top - 2)} ${size(Math.round(X * 0.84), 1, 2)} color="N"/>`);
      }
    }
  }
  const colors = [
    '<color symbol="H" value="6b4423" name="scafo"/>',
    '<color symbol="D" value="b08850" name="ponte"/>',
    '<color symbol="F" value="a07a48" name="pagliolo"/>',
    '<color symbol="R" value="4a2e17" name="parapetto"/>',
    '<color symbol="G" value="8a6a3a" name="imbarco" area="boarding"/>',
    '<color symbol="T" value="5a3a1e" name="timone" area="helm"/>',
    '<color symbol="O" value="7a5634" name="fondo della stiva" area="hold"/>',
    '<color symbol="M" value="5e3f22" name="albero"/>',
    '<color symbol="N" value="4a3020" name="pennone"/>',
    '<color symbol="S" value="ece4d0" name="vela"/>',
    '<color symbol="I" hidden="True" name="dentro lo scafo"/>',
    '<color symbol="s" hidden="True" name="vela ammainata"/>',
  ];
  const actions = masts
    ? ['<action name="furl" label="Ammaina le vele"><all in="S" out="s"/></action>', '<action name="hoist" label="Issa le vele"><all in="s" out="S"/></action>']
    : [];
  return [
    `<!-- ${name}: the vessel of the local models (T440), ${decked ? `decked, ${masts} ${masts === 1 ? 'mast' : 'masts'}` : 'open'}; the bow toward large y. -->`,
    `<sequence values="BHIDFRGTOMNSs" size="${X} ${Y} ${Z}" waterline="${waterline}">`,
    ...lines,
    ...colors.map((c) => `  ${c}`),
    ...actions.map((a) => `  ${a}`),
    '</sequence>',
    '',
  ].join('\n');
}
