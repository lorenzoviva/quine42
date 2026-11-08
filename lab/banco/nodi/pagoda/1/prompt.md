Write a single MarkovJunior XML program that **grows** the building asked for, a voxel model that one enters, climbs and jumps in. Answer with the XML only, without comments or explanations. Do not compute the program cell by cell: start from the skeleton below, which already holds, and change what is needed.

## The program runs with many seeds and more sizes
The same XML runs with at least 5 seeds and 2 sizes: a box from 100×100×80 (20 voxels per tile, step 4, a person 30 tall) to 120×120×96 (16 voxels per tile, step 3, a person 24; with 12 voxels per tile step 2, a person 18). Every seed must give another building, with a different outline, plan and rooms, and all of them must hold. So no `<box>`, no coordinates and no `size`: only rules, anchored to the centre of the floor and to what is there already.

## The format
x from left to right, y from the back to the front (the front is large y), z from bottom to top. `values` are the symbols, one per cell (the first, B, is the air): letters, or `#` and a number (`#12`) when the letters are not enough; a digit alone is not a symbol, and a `#12` has no colour until a `<color>` gives it one. A pattern: rows (growing y) separated by `/`, layers separated by spaces, **the top layer first**: `in="B t"` is t with the air above it. `*` is any cell (in `out`: it does not change), `[ab]` is a or b, `<union symbol="#1" values="ab"/>` gives a name to a set.
- `<one>` rewrites one match at random per step, `<all>` all those that do not overlap, `<prl>` each one with its own probability (`p` goes on the `<rule>`; one step only). Without `steps` a node goes as long as it can; `steps="N"` stops it after N steps. The nodes run in order.
- The symmetry of the root, `(xy)`, tries every rule in all the directions of the plane; `symmetry="()"` only as it is written, `(x)` and `(y)` also mirrored.
- `soil="E"` is the letter of the soil: before the program starts, the kernel writes it over the whole layer where the soil of the world is, at every size, and `origin="bottom"` puts there, at the centre, the second letter. Here it is z=0. `ground="Z"` fills the layer z=0, the bottom of the box.
- A letter without `<color>` uses a default colour: **every marker must disappear at the end**, rewritten by a rule. `glow="True"` gives light, `alpha="0.5"` is glass. `<action name="open" label="Apri la porta">` opens the door (the label in the language of the world).

## The body
The body is 9 voxels wide (it passes in 11), walks on the floors and does not pass if under its feet two neighbouring columns differ by more than a step. A stair 11 wide with a rise of 2 and a tread of 1 climbs at every size. That is why the body does not climb a stair from the side and does not step down sideways from its last step: the stair **comes out in line**, onto a floor at its height. Under a stair it is solid.

## What every seed must have
- **A door** at the front, in the middle, as tall as a person and 11 wide, with the road straight and uncovered to the edge (nothing above it at any height).
- **At least 2 covered floors** that one reaches on foot, the ceiling at least 30 above the floor; **at least 4 rooms** adding up the floors, with openings of at most 11-20 voxels; no room or floor walled up. **At 100×100 a bay of 29 counts as a room only if it is clear up to the walls**: a piece of furniture that juts out more than a voxel takes it out of the count (a hall of two bays joined, an open wall: that one holds the furniture). Leave at least 3 bays clear at every seed.
- **At least 2 places where the jump is needed**: an obstacle higher than a step and at most 16, that one climbs over toward a floor one also reaches on foot.
- **At least 6 windows on 3 sides** (glass or holes, at least 7 voxels a side, on the outer plane of the wall; the arrow slits are called `name="finestra…"`); **6 visible materials**, the most used under 50 % of the voxels; **4 heights of the top**; **at least 24 details** on the facades (pieces of 2-300 voxels of one letter) on all sides; **12 % of the facades out of the plane** (buttresses, balconies, wings); **at least 30 % of the plan of the box taken up, at every size** (at 120 that is at least 5 bays of 30).
- Everything attached, resting on the bottom, finished in 8 seconds at 120×120×96.

## The skeleton
It holds 19-20 seeds out of 20 at the two sizes, and it is an ordinary small block of flats: it is the starting point, not the result.
```xml
<sequence values="BNExzaPpQbOHtsgcdvefwXiIJhjMSFCWRVDLUuTYGKAknryql" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="#1" values="be"/>
  <union symbol="#2" values="tsdcfv"/>
  <union symbol="#3" values="tb"/>
  <color symbol="k" value="5a3a22" name="porta"/><color symbol="S" value="d6d2c8" name="cemento chiaro"/><color symbol="F" value="a8743f" name="legno"/><color symbol="C" value="b9b5ab" name="cemento grigio"/><color symbol="W" value="f0ece2" name="intonaco"/><color symbol="R" value="8f8f88" name="ghiaia"/><color symbol="V" value="86b8c8" alpha="0.5" name="vetro"/><color symbol="D" value="3a3d42" name="telaio"/><color symbol="L" value="7a5a3c" name="rovere"/><color symbol="T" value="e0d9c2" name="gradino"/><color symbol="K" value="c2c7cc" name="acciaio"/><color symbol="A" value="9a9590" name="lastricato"/>
  <!-- 1. lattice: arms from the centre, then the lines -->
  <prl in="***/*E*/***" out="***/*z*/***"/>
  <all in="Nz" out="*a" steps="1"/>
  <all in="[Nx]az" out="*xa" steps="14"/>
  <prl in="a" out="Q"/>
  <all in="xQz" out="*Qa" steps="1"/>
  <all in="[Qx]az" out="*xa" steps="29"/>
  <prl in="a" out="Q"/>
  <all in="z/Q/z" out="a/Q/a" symmetry="()"/>
  <all in="[Qp]/a/z" out="*/p/a" symmetry="(y)" steps="44"/>
  <prl in="a" out="p"/>
  <all in="zQz" out="aQa" symmetry="()"/>
  <all in="[Ql]a[zp]" out="*la" symmetry="(x)" steps="44"/>
  <prl><rule in="a" out="p"/><rule in="l" out="p"/></prl>
  <all in="x/Q/z" out="t/O/*" symmetry="()"/>
  <prl in="Q" out="p"/>
  <prl><rule in="x" out="z"/><rule in="N" out="z"/></prl>
  <all in="Ez" out="*E"/>
  <all><rule in="*p*/ppp/*p*" out="***/*P*/***"/><rule in="ppp/*p*" out="*P*/***"/><rule in="pp/p*" out="P*/**"/></all>
  <all in="Op" out="*O" steps="5"/>
  <all in="tz" out="*t"/>
  <!-- 2. project: the stair starts from the front bay and crosses the wall toward a neighbouring one -->
  <all in="Ot" out="*v"/>
  <all in="vt" out="*v" steps="6"/>
  <one in="*zzzzzzzzzzz/Pppppppppppp/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt" out="************/*yyyyyyyyyyy/*ggggggggggg/************/************/************/************/************/************/************/************/************/************/************/************/************/************/************/************" steps="1"/>
  <all in="[ys]/g/t" out="*/s/g" steps="16"/>
  <all in="s/g" out="c/d"/>
  <all in="z/y" out="t/*"/>
  <all in="tz" out="*t"/>
  <one in="*tttttttttttt/Ppppppppppppp/*tttttttttttt" out="*************/******H******/*************" steps="1"/>
  <!-- no doors around the stair; other bays grow through a wall -->
  <all in="[gsdc]t" out="*v"/>
  <all in="vt" out="*v" steps="9"/>
  <one in="*zzzzzzzzzzzz/Ppppppppppppp/*#3#3#3#3#3#3#3#3#3#3#3#3" out="******b******/******H******/*************" steps="1"/>
  <all in="bz" out="*b"/>
  <one in="*zzzzzzzzzzzz/Ppppppppppppp/*#3#3#3#3#3#3#3#3#3#3#3#3" out="******b******/******H******/*************" steps="1"/>
  <all in="bz" out="*b"/>
  <one in="*zzzzzzzzzzzz/Ppppppppppppp/*#3#3#3#3#3#3#3#3#3#3#3#3" out="******b******/******H******/*************" steps="1"/>
  <all in="bz" out="*b"/>
  <all in="Hp" out="*H" steps="5"/>
  <prl><rule in="tHb" out="*Ht" p="0.07"/></prl>
  <all in="tb" out="*t"/>
  <!-- an open wall with the bench -->
  <one in="bHb" out="*n*" steps="1"/>
  <all><rule in="nH" out="*n"/><rule in="np" out="*n"/></all>
  <one in="nnnnnnnnn" out="*eeeeeee*" steps="1"/>
  <prl in="v" out="t"/>
  <!-- 3. the walls from the neighbouring letters -->
  <all><rule in="[zE]p[zE]" out="*q*"/><rule in="[zE]p#1" out="*w*"/><rule in="[zE]p#2" out="*X*"/><rule in="#1p#1" out="*i*"/><rule in="#2p#2" out="*I*"/><rule in="#1p#2" out="*J*"/><rule in="#1H#1" out="*h*"/><rule in="#1H#2" out="*j*"/><rule in="EO#2" out="*M*"/></all>
  <prl in="n" out="h"/>
  <all in="P[XIJjHMy]" out="I*"/>
  <all in="P[wihO]" out="i*"/>
  <prl in="P" out="E"/>
  <one steps="6"><rule in="EEEEEEE/EEEEEEE/wwwwwww" out="*iiiii*/*iiiii*/*******"/><rule in="EEEEEEE/EEEEEEE/XXXXXXX" out="*IIIII*/*IIIII*/*******"/></one>
  <one steps="6"><rule in="qqqqqqqqq" out="GGGGGGGGG"/><rule in="zzzzzzzzz" out="GGGGGGGGG"/></one>
  <prl in="q" out="E"/>
  <all in="M/E" out="*/A" symmetry="()"/>
  <all in="A/E" out="*/A" symmetry="()"/>
  <!-- 4. the columns: every letter rises by so many layers, and leaves a letter -->
  <all steps="1" symmetry="()"><rule in="B b" out="b S"/><rule in="B t" out="t S"/><rule in="B s" out="s S"/><rule in="B d" out="d S"/><rule in="B c" out="c S"/><rule in="B e" out="e S"/><rule in="B f" out="f S"/><rule in="B w" out="w S"/><rule in="B X" out="X S"/><rule in="B i" out="i S"/><rule in="B I" out="I S"/><rule in="B J" out="J S"/><rule in="B h" out="h S"/><rule in="B H" out="H S"/><rule in="B j" out="j S"/><rule in="B M" out="M S"/><rule in="B y" out="y S"/></all>
  <all steps="1" symmetry="()"><rule in="B y" out="y K"/><rule in="B b" out="b F"/><rule in="B t" out="t F"/><rule in="B s" out="s F"/><rule in="B d" out="s T"/><rule in="B c" out="s Y"/><rule in="B e" out="b G"/><rule in="B f" out="t G"/><rule in="B h" out="h F"/><rule in="B H" out="H F"/><rule in="B j" out="j F"/><rule in="B M" out="M F"/><rule in="B w" out="w C"/><rule in="B X" out="X C"/><rule in="B i" out="i C"/><rule in="B I" out="I C"/><rule in="B J" out="J C"/></all>
  <all steps="30" symmetry="()"><rule in="B y" out="y K"/><rule in="B b" out="b B"/><rule in="B t" out="t B"/><rule in="B s" out="s B"/><rule in="B h" out="h B"/><rule in="B H" out="H B"/><rule in="B j" out="j B"/><rule in="B M" out="M k"/><rule in="B i" out="i C"/><rule in="B I" out="I C"/><rule in="B J" out="J C"/></all>
  <all steps="8" symmetry="()"><rule in="B w" out="w C"/><rule in="B X" out="X C"/></all>
  <all steps="14" symmetry="()"><rule in="B w" out="w U"/><rule in="B X" out="X U"/></all>
  <all steps="8" symmetry="()"><rule in="B w" out="w C"/><rule in="B X" out="X C"/></all>
  <all steps="2" symmetry="()"><rule in="B s" out="s B"/><rule in="B w" out="w S"/><rule in="B X" out="X S"/><rule in="B J" out="J S"/><rule in="B I" out="I S"/><rule in="B j" out="j S"/><rule in="B M" out="M S"/><rule in="B i" out="i S"/><rule in="B h" out="h S"/></all>
  <all steps="1" symmetry="()"><rule in="B y" out="y K"/><rule in="B b" out="R S"/><rule in="B t" out="t S"/><rule in="B H" out="H S"/></all>
  <all steps="1" symmetry="()"><rule in="B y" out="y B"/><rule in="B t" out="t F"/><rule in="B H" out="H F"/></all>
  <all steps="4" symmetry="()"><rule in="B w" out="w W"/></all>
  <all steps="30" symmetry="()"><rule in="B y" out="y B"/><rule in="B t" out="t B"/><rule in="B s" out="s B"/><rule in="B H" out="H B"/><rule in="B I" out="I W"/><rule in="B M" out="M W"/></all>
  <all steps="8" symmetry="()"><rule in="B X" out="X W"/><rule in="B J" out="J W"/><rule in="B j" out="j W"/></all>
  <all steps="14" symmetry="()"><rule in="B X" out="X u"/><rule in="B J" out="J u"/><rule in="B j" out="j u"/></all>
  <all steps="8" symmetry="()"><rule in="B X" out="X W"/><rule in="B J" out="J W"/><rule in="B j" out="j W"/></all>
  <all steps="1" symmetry="()"><rule in="B y" out="R S"/><rule in="B t" out="R S"/><rule in="B s" out="R S"/><rule in="B H" out="R S"/><rule in="B I" out="R S"/></all>
  <all steps="4" symmetry="()"><rule in="B X" out="X S"/><rule in="B J" out="J S"/><rule in="B j" out="j S"/><rule in="B M" out="M S"/></all>
  <!-- 5. the stair -->
  <all in="*BB *B* TY*" out="*TY *K* KK*" steps="16"/>
  <all in="K B" out="* K" symmetry="()"/>
  <!-- benches -->
  <all steps="8" symmetry="()" in="B G" out="G L"/>
  <!-- 6. windows, roof -->
  <all in="UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU" out="*********** *DDDDDDDDD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DDDDDDDDD* ***********"/>
  <all in="uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu" out="*********** *DDDDDDDDD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DDDDDDDDD* ***********"/>
  <one in="B B R" out="* D *" steps="2" symmetry="()"/>
  <all in="DB *R" out="*D **" symmetry="(x)" steps="8"/>
  <all in="D/B */R" out="*/D */*" symmetry="(y)" steps="8"/>
  <all in="B D" out="D *" steps="7" symmetry="()"/>
  <!-- 7. cleaning -->
  <prl><rule in="U" out="C"/><rule in="u" out="W"/><rule in="Y" out="T"/><rule in="G" out="L"/><rule in="E" out="B"/><rule in="z" out="B"/><rule in="w" out="C"/><rule in="X" out="C"/><rule in="J" out="C"/><rule in="j" out="C"/><rule in="M" out="C"/><rule in="i" out="R"/><rule in="h" out="R"/></prl>
</sequence>
<action name="open" label="Apri la porta"><prl in="k" out="B"/></action>
```
Why it holds, and what does not break:
- **Section 1**: a marker walks only forward if the rule looks at its trail (`[Nx]az → *xa`); if it can cross a line (`[zp]`), its trail has a different letter (`l`), otherwise it goes back. The lattice is always 3×3 bays of 30: `E` outside, `z` the bays, `p` the lines, `P` the crossings, `O` the door.
- **Section 2**: a fill (`tz → *t`) stops at the lines. One grows by passing a wall at the spot where the door is put: so everything stays connected, without paths to compute. The doors stand 1-11 from a pillar: the rest of the wall stays free. The stair is chosen **before** the other doors, in the front bay: a strip of 11×17 attached to a pillar, far from the door (`v`), that crosses the wall toward a neighbouring bay (`y`); 16 steps of stair climb 32, that is from the floor (one voxel above the ground) to the floor above, in line beyond `y`. Around it `v` keeps the other doors away. The columns `s`, `c`, `d` have no slab: it is the hole. One letter for every thing that rises in a different way.
- **Section 3**: the walls say what they are from the letters on their sides: `w` outer low, `X` outer high, `i`, `I` inner, `J` inner below and outer above, `h`, `H`, `j` inner doors. `#2` is all that is high, `#1` what is low.
- **Section 4**: `in="B t" out="t F"` makes the head `t` rise by one layer and leaves `F`; `steps` is how much it rises: **the heights are numbers of steps**, one line per stretch. What ends writes `R S` and the head disappears. A new letter on the plan (`i`, `I` are buttresses already: they are two walls in front of a wall) rises with a line of its own.
- **Time**: a rare letter in the first cell (bottom left) costs little; a pattern that starts with `*` or with the air over the whole grid costs a lot.

## What to change, according to the building
The building asked for must be recognisable at first glance: do not hand in the skeleton recoloured.
- **Colours and materials** (`<color>`), and where they go: a high band in the lines of `w`, `X`, a plinth of another letter, a floor per storey.
- **Proportions**: the lattice can be wider with a different pitch only if you redo the sums (pitch, `steps` of walkers and stair); the storeys cannot: 32 layers per storey hold at every size. A third storey is another high letter, with another stair.
- **Masses**: how many bays grow (5 out of 9: more take variety away from the outline, measured per seed, fewer do not fill the big box), how many are high (`p`), a low wing, a courtyard (a bay not built, closed by walls `q`), towers (a letter on the pillars that rises more than the others), an enclosure. A courtyard suits the strongholds: the outline is made by the bays chosen.
- **The roof**: half of what one sees. Pitched or stepped, on the layer `R`: `<all in="***/*B*/*** *R*/RRR/*R*" out="***/*R*/*** ***/***/***" steps="10" symmetry="()"/>` rises by one layer above the cells that have `R` around them, up to the ridge; with one letter per pitch or another letter on top the ridge reads; for the eaves `RB → *R` in the layer before. Battlements: `WWWWWWWW → MMMMmmmm` on the top of a wall. Lanterns, chimneys, smokestacks, antennas: `<one in="B B R" out="* D *" steps="2" symmetry="()"/>` and `<all in="B D" out="D *" steps="N" symmetry="()"/>` (a smokestack is tall and slender).
- **The facades**: rules on the walls, after the columns: bands (`U`, `u`), pipes, exposed beams, gears, buttresses, a sign above the door. The rules on the plane hold on the four faces, so every side has its own things depending on the seed.
- **Inside**: every room asked for is recognisable. In the bays that must stay clear: rugs and floors of another letter (1 high), things hung on the walls above the heads, lights. In the halls of two bays: furniture with a rule on the plan against a wall (a letter of its own, rising 8-20 layers): counter, barrels, bed, altar. Never in the middle.

## Nodes that make every seed another building
Besides `one`, `all` and `prl` the program may use the nodes of MarkovJunior that look ahead; they run on the same box, so they hold at every size:
- `<field for="m" to="O" on="z"/>` inside a node, with `temperature="1"`: a marker that walks toward the door (`O`) through the bays (`z`), winding differently at every seed: which bays grow, a courtyard path, a corridor through a block. `essential="True"` if it must arrive. Its rules have `steps`, as every growth.
- `<observe value="m" to="q"/>` with `search="True" limit="300"`: only for a small piece whose end is fixed (a stair that must come out at a height); never on the whole box, it costs.
- `wfc`, `convchain`, `import` and rule files need files of models/: use them only if the request lists some, with `tries` (at most 100) on every `wfc` and `steps` on every `convchain`.
A marker the field moves disappears at the end, as every other.

## How to do it
Decide first, in a few lines, what you add to the skeleton and which letter for what. Then write the whole program, in order: lattice, project, walls, columns, stair, facades, roof, cleaning. Check only: every letter is in the `values`, every pattern has `in` and `out` of the same shape, every marker disappears.
