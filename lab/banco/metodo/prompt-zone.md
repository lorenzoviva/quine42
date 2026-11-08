Write a MarkovJunior XML program that **grows** the building asked for: a voxel model one enters, climbs and jumps in. You write it **in blocks**, and after each block the game runs what you wrote and sends back what came out, in text (views from above, from the front and the side, cuts at each storey, measures, a trace node by node): that is how you look at your model. Answer each time with the whole program so far, XML only, without explanations.

## What matters most: the composition comes from the concept
The same program runs with at least 5 seeds and 2 sizes. A seed must give another building **of the same kind**: a fort is a ring of walls with corner towers, a gate and a keep in a courtyard; a temple is terraces that shrink toward a shrine on top with a stair on the axis; a block of flats is a tall box of regular storeys with a stair core and balconies; a country house is two or three volumes of different height under pitched roofs, with a porch. Decide the **parts of this concept** and **where each goes relative to the others** (around the courtyard, at the corners, as far as possible from the gate, against a wall, on the axis of the door), and let the seeds deform them: sides, wings, how many towers, which corner, how high. Never start from a stock building and recolour it: two concepts must not have the same masses.

## The format
x left to right, y back to front (the front is large y), z bottom to top. `values` are the symbols, one per cell, the first (B) is the air: letters, or `#` and a number (`#12`); a digit alone is not a symbol. A pattern: rows (growing y) separated by `/`, layers separated by spaces, **the top layer first**: `in="B t"` is t with air above it. `*` is any cell (in `out`: unchanged), `[ab]` is a or b. `<one>` rewrites one match at random per step, `<all>` all the matches that do not overlap, `<prl>` all at once (with `p` on a `<rule>`, each with that probability). Without `steps` a node goes as long as it can. The root's `symmetry="(xy)"` turns every rule in the plane; `symmetry="()"` keeps it as written (use it for anything vertical), `(x)` also mirrored left-right. **One letter, one meaning**: a letter that is a wall must never also be a step or a marker, or a rule meant for one will hit the other.

## The method: three levels
```xml
<sequence values="BNE" symmetry="(xy)" ground="E" origin="bottom">
  <map scale="1/4 1/4 1/4" values="BNE…all the letters of the coarse grid…">
    <rule in="E" out="E"/><rule in="N" out="N"/>
    <!-- A. the composition, on the plan (z=0) of a grid four times smaller: a cell is 4 voxels -->
    <!-- B. the heights: every plan letter rises as a column -->
    <map scale="4 4 4" values="B…all the letters of the full grid…">
      <rule in="W" out="…a 4×4×4 block…"/> …one rule per coarse letter…
      <!-- C. at full scale: stairs, battlements, windows, roofs, cleaning -->
    </map>
  </map>
  <color …/>
</sequence>
<action name="open" label="Apri la porta">…</action>
```
`ground="E"` fills z=0 with E and `origin="bottom"` puts N at its centre (`soil` is not allowed with `map`). The coarse grid is 25×25×20 at the smaller size and 30×30×24 at the larger: write rules that do not depend on it (anchored to N, to what is there, to the edge). A storey is **8 coarse layers** (32 voxels: a person is at most 30). Every letter you use appears in the `values` of its grid.

### A. Composition (coarse plan, z=0)
Tested building blocks; combine and change them for the concept:
```xml
<!-- the lot: z where things may grow, 5 cells from the edge (walls and towers take the margin) -->
<prl in="***/*E*/***" out="***/*z*/***"/>
<prl in="Ez" out="*E" steps="4"/>
<!-- a rectangle with random sides around the centre: 4 walkers, 3 cells sure and up to 7 at random, then the corners filled -->
<all in="Nz" out="*a" steps="1"/>
<all in="[Nx]az" out="*xa" steps="3"/>
<prl steps="7"><rule in="xaz" out="*xa" p="0.5"/></prl>
<prl in="a" out="x"/>
<all in="[Nx]z/*[Nx]" out="*x/**"/>
<!-- a wing: a second rectangle from a random cell of the first (an L, a T, a longer body) -->
<one in="xxx/xxx/xxx" out="***/*n*/***" steps="1"/>
<all in="nx" out="*b" steps="1"/>
<all in="[nh]b[xz]" out="*hb" steps="3"/>
<prl steps="4"><rule in="hb[xz]" out="*hb" p="0.5"/></prl>
<prl><rule in="b" out="h"/><rule in="n" out="h"/></prl>
<all in="h[xz]/*h" out="*h/**"/>
<!-- a ring three cells thick around a region x, corners filled; its outer cells O -->
<all in="[Nx]E" out="*W"/>
<all in="WE" out="*W" steps="2"/>
<all in="WE/*W" out="*W/**"/>
<prl in="WE" out="O*"/>
<!-- the outer corners of a shape get a 5×5 tower (convex corners only) -->
<all in="EE/EO" out="**/*T"/>
<all steps="2"><rule in="[Tt][EWOx]" out="*t"/><rule in="[Tt]*/*[EWOx]" out="**/*t"/></all>
<!-- from the centre straight to the front: a path v, then the first wall it meets becomes the gate G, three wide -->
<all in="N/x" out="*/v" symmetry="()" steps="1"/>
<all in="v/x" out="*/v" symmetry="()"/>
<all in="v/[WO]" out="*/G" symmetry="()"/>
<all in="G/[WO]" out="*/G" symmetry="()"/>
<all in="[WO]G[WO]" out="GGG" symmetry="()" steps="1"/>
<!-- something as far as possible from the gate (or near something: to= instead of from=), then grown into a square of up to 10×10 -->
<one in="x" out="K" steps="1"><field for="K" from="v" on="xv"/></one>
<all steps="9"><rule in="[Kk]x" out="*k"/><rule in="[Kk]*/*x" out="**/*k"/></all>
<!-- the inside of a body: what has its own letter on the four sides -->
<prl in="*k*/kkk/*k*" out="***/*r*/***"/>
<!-- terraces: each one a ring smaller than the one below; here the region x shrinks by 2 cells -->
<prl in="Ex" out="*E" steps="2"/>
```
- **A door** of the building to the front, in the middle, 3 cells wide (12 voxels), with the road straight and uncovered to the edge; behind it **a covered floor as big as a room**, joined to the door: the ground floor itself, or for a gate in a wall a covered hall of at least 8×9 cells (a body must be able to stand on about 1.1 tiles² of it: 7×4 cells is not enough at the larger size).
- **Doors between parts** 3 cells wide, with 3 cells of free floor behind them: `<one in="rrr/rrr/rrr/kkk/xxx" out="***/***/***/ddd/***" steps="1"/>`. Keep the front of every door free (a marker for 2 cells, removed after the other things are placed).
- **Things to jump over** (troughs, benches, a low wall, a well), 2-3 of them, 2 cells long, between two floors one walks on, away from doors and paths.

### B. Heights: columns of 8 layers per storey
A plan letter rises by moving its head up and leaving a letter at each step: `in="B r" out="r R"` makes the head r go up one layer and leave R below. **The heights are numbers of steps.** A room with two storeys (`f` floor, `R` air, `F` the slab between storeys, `C` the roof):
```xml
<all in="B r" out="r f" steps="1" symmetry="()"/>   <!-- z=0: the floor -->
<all in="B r" out="r R" steps="7" symmetry="()"/>   <!-- 7 layers of air -->
<all in="B r" out="r F" steps="1" symmetry="()"/>   <!-- z=8: the slab of the second storey -->
<all in="B r" out="r R" steps="8" symmetry="()"/>
<prl in="r" out="C"/>                                <!-- the roof -->
<all in="B k" out="k *" steps="17" symmetry="()"/>   <!-- its walls: a solid column -->
```
A door of a room: floor, 7 of air, then wall (`B d → d f` 1, `B d → d R` 7, `B d → d k` …). The gate in a wall: the same, covered above (a gatehouse). A wall with a walk on top: 6 layers (24 voxels).

**The stair** between two storeys is a strip of 3×5 cells inside a room, **against a wall**, with 2 free cells before it and 1 after it (the landing) in its direction, and **no slab above the strip** (that is the hole):
```xml
<one in="kkkkkkkk/rrrrrrrr/rrrrrrrr/rrrrrrrr" out="********/**ijjjj*/**ijjjj*/**ijjjj*" steps="1"/>
<all in="B [ij]" out="u *" steps="1" symmetry="()"/>  <!-- air above the strip, through the slab -->
<all in="B u" out="u *" steps="15" symmetry="()"/>
<all in="B u" out="C *" steps="1" symmetry="()"/>
```
then at full scale (C) the steps. To the top of a 6-layer wall: a strip `s` + 3 cells against the inside of the wall, climbing toward it, `steps="12"`.

### C. Full scale
Each coarse letter becomes a 4×4×4 block (layers top first): a solid `WWWW/WWWW/WWWW/WWWW WWWW/WWWW/WWWW/WWWW WWWW/WWWW/WWWW/WWWW WWWW/WWWW/WWWW/WWWW`; a floor (the plan cells at z=0) `BBBB/BBBB/BBBB/BBBB BBBB/BBBB/BBBB/BBBB BBBB/BBBB/BBBB/BBBB AAAA/AAAA/AAAA/AAAA`; a slab between storeys **air on top and three solid layers below**: `BBBB/BBBB/BBBB/BBBB FFFF/FFFF/FFFF/FFFF FFFF/FFFF/FFFF/FFFF FFFF/FFFF/FFFF/FFFF`; the strips of the stairs as floors with their own letters (`i` → floor `s`, `j` → floor `e`). Then:
```xml
<!-- the stair: the step U starts on the second row of s, then 2 up and 1 forward; Y says the direction; under it solid Q -->
<all in="BBB sse" out="UY* ***" steps="1"/>
<all in="*BB *B* UY*" out="*UY *Q* QQ*" steps="17"/>
<all in="Q B" out="* Q" symmetry="()"/>
<!-- a parapet one voxel thick on the outer edge of the tops of O, T, K (air above and beside), raised 4, crenellated -->
<all in="B* [OTK]B" out="M* **"/>
<all in="B M" out="M *" steps="4" symmetry="()"/>
<all in="MMMMMM MMMMMM" out="***BBB ***BBB"/>
<!-- openings on the outer faces: a slit 2×6 (name its colour "finestra a feritoia…") or a window 6×8 with a frame -->
<one steps="30"><rule in="BT/BT BT/BT BT/BT BT/BT BT/BT BT/BT" out="*L/*L *L/*L *L/*L *L/*L *L/*L *L/*L"/></one>
<!-- a pitched roof on a flat top R: one layer more over every cell that has R around it -->
<all in="***/*B*/*** *R*/RRR/*R*" out="***/*R*/*** ***/***/***" steps="10" symmetry="()"/>
<!-- cleaning: every marker and E become what they must be -->
<prl><rule in="E" out="B"/><rule in="s" out="A"/><rule in="e" out="A"/><rule in="Y" out="Q"/><rule in="U" out="Q"/></prl>
```
Coarse-scale towers, keeps and bodies are boxes of 4-voxel cells: the full scale is where they become buildings (parapets, windows in rows on each storey, roofs of their own: cones on round towers, pitches on halls, a flat roof with a parapet on a block, chimneys, balconies, eaves). A colour per material, 6 or more, the most used under half.

## What every seed must have
A door at the front in the middle (above); **at least 2 covered storeys one reaches on foot**, ceilings at least 30 above their floor, **at least 3 rooms** in total, and a room counts only if it is clear from wall to wall for at least 8×8 cells (32 voxels: the body and the narrow passages take the rest; furniture against the walls only); **at least 2 jumps** (above); **at least 6 windows on 3 sides**; 4 heights of the top; details on all sides; at least 30 % of the plan of the box taken; nothing floating; finished in 8 seconds. The body is 9 voxels wide (passes in 11) and does not pass where two columns under its feet differ by more than a step (2 voxels at the largest size): no narrow corridors beside a stair, nothing in front of a door.

## How to answer
Block by block, as the request says. In the first, decide in a few comment lines which parts, which letters, where each goes relative to the others and what the seeds change; then write the coarse composition only. Read what comes back (the plan of three seeds side by side: is it the concept? does it vary? is anything outside the box or missing?) and correct before going on.
