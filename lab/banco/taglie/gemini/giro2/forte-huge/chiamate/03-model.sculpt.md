# model.sculpt · gemini-4-argon · 38 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<!--
  Concept: Forte (medieval fortress with central keep, side wing, courtyard, curtain wall, corner towers, gatehouse, moat).
  Letters:
    h, s, w, d: keep interior (h), stair zone (s), keep walls (w), keep door (d).
    a, v, e: side wing interior (a), wing walls (v), shared doorway (e).
    c, n, Q: courtyard (c), paved path (n), courtyard well (Q).
    W, G, t: curtain wall (W), gatehouse (G), corner towers (t).
    m, r: outer moat (m) and bridge/road to the front edge (r).
  What seeds change: keep depth/width, side and position of the wing, position of the stair and well.
  What fits by size:
    Huge (30x30): Keep with wing, courtyard with well, curtain wall with 4 corner towers, gatehouse.
    Gargantuan (40x40): Expanded courtyard and a water moat surrounding the curtain wall and towers.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavecQWGtnmr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep: 9 to 10 cells wide, 8 to 9 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="hE/*h" out="*h/**"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Side wing attached to keep (random side and position) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="aw" out="*e" symmetry="(x)" steps="1"/>
      <all in="a[Ew]" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stair zone inside the keep along the back wall: 4 cells along X, 2 along Y, with 2 cells landing before it -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Initial courtyard around keep and wing -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand courtyard if Huge (30x30) or larger -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand courtyard again if Gargantuan (40x40) -->
      <all in="cEEEEEEEE" out="*ccc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Curtain wall around courtyard -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers (4x4) on all 4 outer corners of the curtain wall -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Moat around curtain wall and towers only where 6 cells of ground remain (Gargantuan) -->
      <all in="cWEEEEEE" out="**mm****" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
      <all in="mE" out="*m" steps="1"/>
      <all in="mE/*m" out="*m/**"/>

      <!-- Way out from H straight to the front edge (single line first, then widened to 3 cells) -->
      <all in="H/h" out="*/n" symmetry="()" steps="1"/>
      <all in="n/h" out="*/n" symmetry="()"/>
      <all in="n/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[Gr]/[Em]" out="*/r" symmetry="()"/>

      <!-- Clean temporary path inside keep -->
      <prl in="H" out="h"/>
      <prl in="n/h" out="h/*" symmetry="()"/>
      <prl in="n/d" out="h/*" symmetry="()"/>

      <!-- Widen door, path, gatehouse and road to 3 cells along X only -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[Em]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Courtyard well where a 4x4 patch of yard is free -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavecQWGtnmrfFIJLZzOolkTNUWM#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="(xy)">
        <!-- Unions for included parts -->
        <union symbol="+" values="wvdgWGt"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="wvdgWGt"/>

        <!-- B. THE HEIGHTS: columns by steps -->
        <!-- Keep walls (w): 2 storeys + parapet = 66 high, with window bands I -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w I" steps="14"/>
        <all in="B w" out="w *" steps="18"/>
        <all in="B w" out="w I" steps="14"/>
        <all in="B w" out="w *" steps="11"/>

        <!-- Keep front door wall (d): seed O on floor (z=0), then w up to 65 -->
        <all in="d/n" out="O/*" symmetry="()" steps="5"/>
        <prl in="d" out="w"/>
        <all in="B O" out="w *" steps="65"/>

        <!-- Shared wall doorway (e) between keep and wing: seed O on floor, then w up to 65 -->
        <one in="feeeeef" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/e" out="*/O" symmetry="()" steps="5"/>
        <all in="e/O" out="O/*" symmetry="()" steps="5"/>
        <prl in="e" out="w"/>

        <!-- Keep interior (h) and stair zone (s): 2 covered storeys (z=0 floor, z=32 slab, z=64 roof slab) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=1 -->
        <all in="B s" out="s T" steps="1"/>
        <!-- Storey 1 air -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- Storey 1 ceiling / Storey 2 floor slab at z=32 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second stair strip T at z=33 so player can also climb to roof battle-platform! -->
        <all in="B s" out="s T" steps="1"/>
        <!-- Storey 2 air -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- Roof slab at z=64 -->
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Side wing walls (v) and interior (a): 1 storey + roof slab at z=32, parapet at z=34 -->
        <all in="B v" out="v *" steps="8"/>
        <all in="B v" out="v I" steps="14"/>
        <all in="B v" out="v *" steps="11"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="F"/>

        <!-- Curtain wall (W): 24 high -->
        <all in="B W" out="W *" steps="23"/>

        <!-- Corner towers (t): 42 high -->
        <all in="B t" out="t *" steps="41"/>

        <!-- Gatehouse (G): seed O at z=0, then G rises 38 high -->
        <all in="G/r" out="O/*" symmetry="()" steps="5"/>
        <all in="B G" out="G *" steps="37"/>

        <!-- Courtyard well (Q): stone rim 6 high with water inside -->
        <all in="Q[cn]" out="z*"/>
        <all in="B z" out="z *" steps="5"/>

        <!-- C. THE FULL SCALE: doors, parts, windows, roofs, cleaning -->
        <!-- Raise Gatehouse wall above its door seed O -->
        <all in="B O" out="G *" steps="37"/>

        <!-- Windows in keep and wing walls (I -> L) -->
        <one steps="18">
          <rule in="BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I" out="w"/>

        <!-- Include seed parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Pitched roof on the central part of the keep roof or watchtower turret -->
        <one in="FFFFF/FFFFF/FFFFF/FFFFF/FFFFF" out="*****/**J**/**J**/**J**/*****" steps="1"/>
        <all in="B J" out="J *" steps="10"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: medieval cartoon style, warm stone, distinct wood, slate/brick accents -->
  <color symbol="E" value="#7a8c56" name="erba"/>
  <color symbol="h" value="#c8b89a" name="sala del mastio" area="keep"/>
  <color symbol="s" value="#b09070" name="scala del mastio" area="keep"/>
  <color symbol="a" value="#bfa888" name="ala laterale" area="keep"/>
  <color symbol="f" value="#9c7a54" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="#856846" name="solaio in legno" area="keep"/>
  <color symbol="w" value="#9e988e" name="muro del mastio" area="keep"/>
  <color symbol="v" value="#918b82" name="muro dell'ala" area="keep"/>
  <color symbol="W" value="#807a72" name="mura di cinta" area="courtyard"/>
  <color symbol="G" value="#736d65" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="#666058" name="torre d'angolo" area="tower"/>
  <color symbol="M" value="#aba59b" name="merlatura" area="keep"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>
  <color symbol="L" value="#527a8c" name="finestra"/>
  <color symbol="O" value="#593e25" name="porta in legno"/>
  <color symbol="o" value="#3d2917" name="assi della porta"/>
  <color symbol="N" value="#635d55" name="stipite in pietra"/>
  <color symbol="k" value="#785c3c" name="gradini in legno" area="keep"/>
  <color symbol="T" value="#785c3c" name="rampa"/>
  <color symbol="c" value="#b8ae9c" name="cortile" area="courtyard"/>
  <color symbol="n" value="#8c8478" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="#3b6e8c" name="acqua del pozzo" area="courtyard"/>
  <color symbol="z" value="#6e685f" name="bordo del pozzo" area="courtyard"/>
  <color symbol="m" value="#36647d" name="fossato"/>
  <color symbol="r" value="#827562" name="ponte e strada"/>
  <color symbol="J" value="#9e4736" name="camino in mattoni"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2); porta: 15 × 2 voxel (0,75 × 0,10 caselle), una porta è almeno 11 × 30 a ogni taglia — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, w muro del mastio, v muro dell'ala, c cortile, Q acqua del pozzo, W mura di cinta, G corpo di guardia, t torre d'angolo, n lastricato, r ponte e strada, f pavimento in legno, F solaio in legno, J camino in mattoni, L finestra, z bordo del pozzo, O porta in legno, o assi della porta, k gradini in legno, N stipite in pietra, U feritoia, M merlatura
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttttMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMtttttttEE
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttttEE
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttttEE
EEttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttttEE
EEtttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMtttttttEE
EEtttttcccccccccccccccccccccccccccccccccccctttttEE
EEtttttcccccccccccccccccccccccccccccccccccctttttEE
EEtttttccccccccccccccccccccQQQccccccccccccccttttEE
EEEEEWWccccccccccccccccccccQQQcccccccccccccWWEEEEE
EEEEEWWccccccccccccccccccccQQzcccccccccccccWWEEEEE
EEEEEWWccccccccccccccccccccccccccccccccccccWWEEEEE
EEEEEWWccccccccccccccccccccccccccccccccccccWWEEEEE
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccWWEEEEE
EEEEEWWccccccccwwFFFkkkkkFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWccccccccwwFFFkkkkkFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWccccccccwwFFFkkkkkFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWccccccccwwFFFkkkkkFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWccvvvvvvwwFFFFFFFFFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWcvvFFFFFwwFFFFFFFFFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWcvvFFFFFwwFFFFFFFFFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWccvFFFFFwwFFFFFFFFFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWcvvFFFFFwwFFFFFFFFFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWccvFFFFFwwFFFFFFFFnnFFFFFFFFwwccccccWWEEEEE
EEEEEWWcvvFFFFFwwFFFFFFFFnnFFFFFFFFwwccccccWWEEEEE
EEEEEWWccvFFFFFwwFFFFFFFFnnFFFFFFFFwwccccccWWEEEEE
EEEEEWWcvvFFFFFwwFFFFFFFFFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWcvvFFFFFwwFFFFFFFFFFFFFFFFFFwwccccccWWEEEEE
EEEEEWWccvvvvvvwwwwwwwwwwwwwwwwwwwwwwccccccWWEEEEE
EEEEEWWccccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEWWccccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEWWccccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEWWccccccccccccccccnnnnncccccccccccccccWWEEEEE
EEtttttccccccccccccccccnnnnnccccccccccccccccttttEE
EEtttttccccccccccccccccnnnnnccccccccccccccctttttEE
EEtttttccccccccccccccccnnnnnccccccccccccccctttttEE
EEtttttttMWWWWWWWWWWWWWMGGGGWWWWWWWWWWWWMtttttttEE
EEttttttttWWWWWWWWWWWWWMMGMoWWWWWWWWWWWWttttttttEE
EEttttttttEEEEEEEEEEEEErrrrrEEEEEEEEEEEEttttttttEE
EEttttttttEEEEEEEEEEEEErrrrrEEEEEEEEEEEEttttttttEE
EEtttttttMEEEEEEEEEEEEErrrrrEEEEEEEEEEEEMtttttttEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0eeeeeeeee000000000000000000000000000000eeeeeeeee0
0eccccccce000000000000000000000000000000eccccccce0
0eccccccce000000000000000000000000000000eccccccce0
0eccccccce777777777777777777777777777777eccccccce0
0ecccceeee777777777777777777777777777777eeeecccce0
0ecccce000000000000000000000000000000000000ecccce0
0ecccce000000000000000000011110000000000000ecccce0
0ecccce000000000000000000010010000000000000ecccce0
0eeecee000000000000000000010010000000000000eeceee0
00000770000000000000000000111100000000000007700000
00000770000000000000000000000000000000000007700000
000007700000000llllllljllllllllllljll0000007700000
000007700000000ljjjjjjjjjjjjjjjjjjjjl0000007700000
000007700000000ljjjjjjjjjjjjjjjjjjjjl0000007700000
000007700000000lljjjbdfgijjjjjjjjjjjl0000007700000
000007700000000lljjjbdfgijjjjjjjjjjjl0000007700000
00000770bbabbbblljjjjjjjjjjjjjjjjjjjj0000007700000
00000770baaaaaalljjjjjjjjjjjjjjjjjjjl0000007700000
00000770baaaaaalljjjjjjjjjjjjjjjjjjjl0000007700000
00000770ba999990jjjjjjjjjjjjjjjjjjjjl0000007700000
00000770ba999990jjjjjjjjjjjjjjjjjjjjl0000007700000
00000770aa999990jjjjjjjjjjjjjjjjjjjjl0000007700000
00000770ba999990jjjjjjjjj0jjjjjjjjjjl0000007700000
00000770aa999c90jjjjjjjjj0jjjjjjjjjjj0000007700000
00000770ba999990jjjjjjjjj0jjjjjjjjjjl0000007700000
00000770ba999990jjjjjjjjjjjjjjjjjjjjl0000007700000
00000770baaaaaallllllllljjjjlljlllljl0000007700000
00000770baaaaaaljjjjjjjl0000ljjjjjjjl0000007700000
00000770bbabbbblllllllll0000lljljljll0000007700000
00000770000000000000000000000000000000000007700000
00000770000000000000000000000000000000000007700000
0eeeeee000000000000000000000000000000000000eeeeee0
0ecccce000000000000000000000000000000000000ecccce0
0ecccce000000000000000000000000000000000000ecccce0
0ecccce000000000000000000000000000000000000ecccce0
0ecccceeee7777777777777dddddd77777777777eeeecccce0
0eccccccce7777777777777ddbddd77777777777eccccccce0
0eccccccce000000000000000000000000000000eccccccce0
0eccccccce000000000000000000000000000000eccccccce0
0eeeeeeeee000000000000000000000000000000eeeeeeeee0
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
...............MM.MMMMMMM.M.MMMMMMMMM.............
...............MM.MMMMMMM.M.MMMMMMMMM.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwkwwwwwwwwwwww.............
...............wwwwwwwwwkwwwwwwwwwwww.............
...............wwwwwwwwkkwwwwwwwwwwww.............
...............wLwwwwwwkkwwwwwwwwwwww.............
..MMMMM.MM.....wLLwwwwwkkwwLwwwwwwwww...MM.MMMMM..
..MMMMM.MM.....wLLwwwwwMMMMMwwwwwwwww...MM.MMMMM..
..tttttttt.....wwwwwwwwMMMMMwwwwwwwww...tttttttt..
..tttttttt.MM.MwwwwwwwwGGGGGwwwwwwwww...tttttttt..
..tttttttt.MMvMwwwwwwwwGGGGGwwwwwwwww...tttttttt..
..ttttttttvvvvvwwwwwwwwGGGGGwwwwwwwww...tttttttt..
..ttttttttvvvvvwwwwwwwwGGGGGwwwwwwwww...tttttttt..
..ttttttttvvvvvwwwwwwwwGGGGGwwwwwwwww...tttttttt..
..ttttttttWWWWWWWWWWWWWGGGGGWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWGGGGGWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWGGGGGWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWGGGGGWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWGGGGGWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWGGGGGWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWGGGGGWWWWWWWWWWWWtttttttt..
.EttttttttWWWWWWWWWWWWWrrrrrWWWWWWWWWWWWttttttttE.
```
Right side (looking from the right):
```
.................M.MM.MM..MM.MM.M.................
.................M.MM.MM..MM.MM.M.................
.................wwwwwwwwwwwwwwww.................
.................wwwwwwwwwwwwwwww.................
.................wwwwwwwwwwwwwwww.................
.................wwwwwwwwwwwwwwww.................
.................wwwwwwwwwwLLwwww.................
.................wwwLLwwLLLLLwwww.................
.....MMMMMM.M....wwwLLwwLLLLLwLLL....M.MMMMMM.....
.....MMMMMM.M....wwwLLwwLLwwwwLLL....M.MMMMMM.....
.....tttttttt....wwwwwwwwwwwwwwww....tttttttt.....
.....tttttttt....wwwwwwwwwwwwwwww....tttttttt.....
.....tttttttt....wwwwwwwwwwwwwwww....tttttttt.....
.....tttttttt....wwwwwwwwwwwwwwww....tttttttt.....
.....tttttttt....wwwwwwwwwwwwwwww....tttttttt.....
.....tttttttt....wwwwwwwwwwwwwwww....tttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWtttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWtttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWtttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWtttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWtttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWtttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWtttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWtttttttt.....
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttt....................................ttttt..
..ttttt....................................ttttt..
..ttttt....................................ttttt..
.....WW....................................WW.....
.....WW....................................WW.....
.....WW....................................WW.....
.....WW....................................WW.....
.....WW........wwLwwwwwwwwwwwwwwwwwww......WW.....
.....WW........ww...kkkkkw.........ww......WW.....
.....WW........ww...kkkkk..........LL......WW.....
.....WW........ww...kkkkk..........LL......WW.....
.....WW........ww...kkkkk..........ww......WW.....
.....WW.wwwwwwwww..................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.ww.........................ww......WW.....
.....WW.wwwwwwwwwwwLLww.....wwwwwwwww......WW.....
.....WW....................................WW.....
.....WW....................................WW.....
.....WW....................................WW.....
.....WW....................................WW.....
..ttttt....................................ttttt..
..ttttt....................................ttttt..
..ttttt....................................ttttt..
..ttttttttWWWWWWWWWWWWWGGGGGWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWW.....WWWWWWWWWWWWtttttttt..
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.........M..............................M.........
..................................................
..................................................
..................................................
.........M..............................M.........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
...............wwwwwwwwwwwwLLwwwwwwww.............
...............ww....wkkkw.........ww.............
...............ww.....kkk..........ww.............
...............ww.....kkk..........LL.............
...............LL.....kkk..........LL.............
...............LL..................ww.............
...................................ww.............
...................................LL.............
...................................LL.............
...................................ww.............
...................................ww.............
...................................ww.............
...................................ww.............
...................................LL.............
...................................LL.............
...............wLLwwwww.....wwwwwwwww.............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.........M..............................M.........
..................................................
..................................................
..................................................
.........M..............................M.........
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=75 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
### Seed 2: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEtEtEtEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttEtEtt   000eecececee00000000000000000000000000000eeeeeceee
EEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   000eccccccce00000000000000000000000000000ecccccccc
EEEtttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   000ccccccccc00000000000000000000000000000ecccccccc
EEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   000eccccccce77777777777777777777777777777ecccccccc
EEEtttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt   000cccccccce77777777777777777777777777777ecccccccc
EEEEttttMccccccccccccccccccccccccccccccccccccttttt   000eccccecee77777777777777777777777777777eeeeecccc
EEEtttttcccccccccccccccccccccccccccccccccccccttttt   000cccccc000000000000000000000000000000000000ccccc
EEEEttttcccccccccccccccccccccccccccccccccccccttttt   000ecccce000000000000000000000000000000000000ecccc
EEEEttttcccccccccccccccccccccccccccccccccccccMtttt   000eeceee000000000000000000000000000000000000eeeec
EEEEEEEWcccccccccccccccccccccccccccccccccccccWWEEE   00000077700000000000000000000000000000000000077000
EEEEEEEWcccccccccccccccccccccccccccccccccccccWWEEE   00000077700000000000000000000000000000000000077000
EEEEEEEWcccccccccccccccccccccccccccccccccccccWWEEE   00000077700000000000000000000000000000000000077000
EEEEEEEWcccccccccccccccccccccccccccccvvvvvvccWWEEE   000000777000000000000000000000000000bbbbbbbb077000
EEEEEEEWcccccccccccccccccccccccccccccvvvvvvccWWEEE   000000777000000llllllljlllljlllllll0bbbbbaab077000
EEEEEEEWcccccccwwwwwwwwwwwwwwwwwwwwwwFFFFFvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjl099999aab077000
EEEEEEEWcccccccwwFFFkkkkkFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjljllllllljlllllll099999aab077000
EEEEEEEWcccccccwwFFFkkkkkFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjbdfgijjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFkkkkkFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjbdfgijjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFkkkkkFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000jjjjjjjjjjjjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjj099999aaa077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFMMvvvvvvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjjllaaaaaab077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwvvvvvvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjjllbabbbbb077000
EEEEEEEWcccccccwwFFFFFFFFnnFFFFFFFFwwccccccccWWEEE   000000777000000ljjjjjjjjj0jjjjjjjjjll0000000077000
EEEEEEEWcccccccwwFFFFFFFFnnFFFFFFFFwwccccccccWWEEE   000000777000000jjjjjjjjjj0jjjjjjjjjll0000000077000
EEEEEEEWcccccccwwFFFFFFFFnnFFFFFFFFwwccccccccWWEEE   000000777000000ljjjmjjjjj0jjjjjjjjjll0000000077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   000000777000000ljjjmjjjjjjjjjjjjjjjll0000000077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   000000777011110ljljllllljjjjlljllllll0000000077000
EEEEEEEWccQQQccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE   000000777010010ljjjjjjjl0000ljjjjjjjl0000000077000
EEEEEEEWccQQQccccccccccnnnnncccccccccccccccccWWEEE   000000777010010lllllllll0000lljljljll0000000077000
EEEEEEEWcczQQccccccccccnnnnncccccccccccccccccWWEEE   00000077701111000000000000000000000000000000077000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccccWWEEE   00000077700000000000000000000000000000000000077000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccccWWEEE   000eeeeee000000000000000000000000000000000000eeeec
EEEEttttcccccccccccccccnnnnncccccccccccccccccttttt   000ecccce000000000000000000000000000000000000ecccc
EEEtttttcccccccccccccccnnnnncccccccccccccccccttttt   000ecccce000000000000000000000000000000000000ecccc
EEEtttttcccccccccccccccnnnnncccccccccccccccccttttt   000ecccce000000000000000000000000000000000000ecccc
EEEttttttttMWWWWWWWWWWWMGGGGWWWWWWWWWWWWWWtttttttt   000eccccecee77777777777ddbddd777777777777eeeeccccc
EEEtttttttttWWWWWWWWWWWMMGMoWWWWWWWWWWWWWWtttttttt   000eccccccce77777777777ddbddd777777777777ecccccccc
EEEtttttttttEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttttt   000eccccccce00000000000000000000000000000ecccccccc
EEEtttttttttEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttttt   000eccccccce00000000000000000000000000000ecccccccc
EEEMtttttttMEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttttt   000eecececee00000000000000000000000000000eeeeeceee
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEMtttttttMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   000eecececee00000000000000000000000000000eeeeeceee
EEEtttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   000eccccccce00000000000000000000000000000ecccccccc
EEEtttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   000eccccccce00000000000000000000000000000ecccccccc
EEEtttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt   000eccccccce77777777777777777777777777777ecccccccc
EEEttttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt   000eccccecee77777777777777777777777777777eeeeccccc
EEEtttttcccccccccccccccccccccccccccccccccccccttttt   000ecccce000000000000000000000000000000000000ecccc
EEEtttttcccccccccccccccccccccccccccccccccccccttttt   000ecccce000000000000000000000000000001111000ecccc
EEEEttttcccccccccccccccccccccccccccccccQQQcccttttt   000ecccce000000000000000000000000000001001000ecccc
EEEEEEEWcccccccccccccccccccccccccccccccQQQcccWWEEE   000eeceee000000000000000000000000000001001000eeeec
EEEEEEEWcccccccccccccccccccccccccccccczQQzcccWWEEE   00000077700000000000000000000000000000111100077000
EEEEEEEWcccccccccccccccccccccccccccccccccccccWWEEE   00000077700000000000000000000000000000000000077000
EEEEEEEWcccccccccccccccccccccccccccccccccccccWWEEE   000000777000000llllllljljljllllllljllbabbbbb077000
EEEEEEEWcccccccwwwwwwwwwwwwwwwwwwwwwwvvvvvvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjjjlaaaaaab077000
EEEEEEEWcccccccwwFFFkkkkkFFFFFFFFFFwwFFFFvvccWWEEE   000000777000000ljljllllllljllllllljllaaaaaab077000
EEEEEEEWcccccccwwFFFkkkkkFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjbdfgijjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFkkkkkFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjbdfgijjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFkkkkkFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000jjjjjjjjjjjjjjjjjjjj099999aaa077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjj099999aaa077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwFFFFFvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjj099999aab077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwFFFFvvccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjjllaaaaaab077000
EEEEEEEWcccccccwwFFFFFFFFnnFFFFFFFFwwvvvvvvccWWEEE   000000777000000ljjjjjjjjj0jjjjjjjjjllaaaaaab077000
EEEEEEEWcccccccwwFFFFFFFFnnFFFFFFFFwwccccccccWWEEE   000000777000000jjjjjjjjjj0jjjjjjjjjllbabbbbb077000
EEEEEEEWcccccccwwFFFFFFFFnnFFFFFFFFwwccccccccWWEEE   000000777000000ljjjjjjjjj0jjjjjjjjjll0000000077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   000000777000000ljjjjjjjjjjjjjjjjjjjll0000000077000
EEEEEEEWcccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   000000777000000ljljllllljjjjlljlllljl0000000077000
EEEEEEEWcccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE   000000777000000ljjjjjjjl0000ljjjjjjjl0000000077000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccccWWEEE   000000777000000lllllllll0000lljljljll0000000077000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccccWWEEE   00000077700000000000000000000000000000000000077000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccccWWEEE   00000077700000000000000000000000000000000000077000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccccWWEEE   000eeceee000000000000000000000000000000000000eeeec
EEEEttttcccccccccccccccnnnnncccccccccccccccccttttt   000ecccce000000000000000000000000000000000000ecccc
EEEtttttcccccccccccccccnnnnncccccccccccccccccttttt   000ecccce000000000000000000000000000000000000ecccc
EEEtttttcccccccccccccccnnnnncccccccccccccccccttttt   000ecccce000000000000000000000000000000000000ecccc
EEEttttttttMWWWWWWWWWWWMGGGGWWWWWWWWWWWWWWtttttttt   000eccccecee77777777777dddddd777777777777eeeeccccc
EEEtttttttttWWWWWWWWWWWMoooMWWWWWWWWWWWWWWtttttttt   000eccccccce77777777777dddddd777777777777ecccccccc
EEEtttttttttEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttttt   000eccccccce00000000000000000000000000000ecccccccc
EEEtttttttttEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttttt   000eccccccce00000000000000000000000000000ecccccccc
EEEMtttttttMEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttttt   000eecececee00000000000000000000000000000eeeeeceee
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.27 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 158 nodi, 631 passi, finito in 649 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba, h=sala del mastio, s=scala del mastio, w=muro del mastio, d=dead, dark, a=ala laterale, v=muro dell'ala, e=emerald, c=cortile, Q=acqua del pozzo, W=mura di cinta, G=corpo di guardia, t=torre d'angolo, n=lastricato, r=ponte e strada, f=pavimento in legno, F=solaio in legno, I=Indigo (marcatore), J=camino in mattoni, L=finestra, z=bordo del pozzo, O=porta in legno, o=assi della porta, k=gradini in legno, T=rampa, N=stipite in pietra, U=feritoia, M=merlatura, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: t 85806, w 55112, W 36596, E 8525, k 7840, v 5966, c 5550, U 4584, F 4352, L 4096, M 2940, f 2525, G 2202, r 375, n 350, z 216, Q 64, N 53, o 52, J 33, O 8.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-50 all×30, prl×3, one×3: 618 celle x1-28 y3-29 z0, passi 2-68
   #52 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 69
    #54 all . w → w * passi=8: ×8, 6800 celle x45-109 y50-99 z1-8, passi 70-77, .→w 6800
    #55 all . w → w I passi=14: ×14, 23800 celle x45-109 y50-99 z8-22, passi 78-91, w→I 11900, .→w 11900
    #56 all . w → w * passi=18: ×18, 15300 celle x45-109 y50-99 z23-40, passi 92-109, .→w 15300
    #57 all . w → w I passi=14: ×14, 23800 celle x45-109 y50-99 z40-54, passi 110-123, w→I 11900, .→w 11900
#58-67 all×5, prl×2: 14265 celle x45-109 y50-99 z0-65, passi 124-140
    #68 all . h → h . passi=31: ×31, 120900 celle x50-104 y55-94 z1-32, passi 141-171, h→. 60450, .→h 60450
#69-71 all×3: 16700 celle x50-104 y55-94 z2-34, passi 172-203
    #72 all . h → h . passi=31: ×31, 120900 celle x50-104 y55-94 z33-64, passi 204-234, h→. 60450, .→h 60450
#73-75 all×2, prl×1: 16750 celle x25-104 y55-99 z1-64, passi 235-273
#76-78 all×3: 13425 celle x25-44 y65-99 z0-33, passi 274-299
    #79 all . a → a . passi=31: ×31, 23250 celle x30-44 y70-94 z1-32, passi 300-330, a→. 11625, .→a 11625
    #80 prl a → F: ×1, 375 celle x30-44 y70-94 z32, passi 331, a→F 375
    #81 all . W → W * passi=23: ×23, 35075 celle x15-134 y25-124 z1-23, passi 332-354, .→W 35075
    #82 all . t → t * passi=41: ×41, 86100 celle x5-144 y15-134 z1-41, passi 355-395, .→t 86100
#83-89 all×6, one×1: 6562 celle x45-109 y35-124 z0-52, passi 396-459
    #90 prl I → w: ×1, 24254 celle x25-109 y50-99 z8-53, passi 460, I→w 24254
#97-123 all×8, prl×1: 10815 celle x60-85 y55-124 z0-64, passi 461-511
     #124 prl #90 → . passi=1: ×1, 9920 celle x60-75 y55-64 z2-64, passi 512, #90→. 9920
#125-130 all×4, prl×2: 8460 celle x60-75 y55-64 z1-64, passi 513-561
#136-158 all×8, prl×2, one×1: 11080 celle x5-144 y15-134 z24-71, passi 562-631
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#17 all aE/*a → *a/**: le celle cercate c'erano, ma mai disposte come nel pattern
#26 all cEEEEEEEE → *ccc***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#27 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all cWEEEEEE → **mm**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all [Wt]E/*m → **/*m: in quel momento nella griglia non c'erano celle "m"
#34 all mE/*m → *m/**: in quel momento nella griglia non c'erano celle "m"
#35 all mE → *m passi=1: in quel momento nella griglia non c'erano celle "m"
#36 all mE/*m → *m/**: in quel momento nella griglia non c'erano celle "m"
#44 prl n/h → h/*: le celle cercate c'erano, ma mai disposte come nel pattern
#62 one feeeeef → *OOOOO* passi=1: in quel momento nella griglia non c'erano celle "f"
#63 all O/e → */O passi=5: le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 38
Fix it and answer with the whole program.

## Risposta

<!--
  Concept: Forte (medieval fortress with central keep, side wing, courtyard, curtain wall, corner towers, gatehouse, moat).
  Letters:
    h, s, w, d: keep interior (h), stair zone (s), keep walls (w), keep door (d).
    a, v, e: side wing interior (a), wing walls (v), shared doorway (e).
    c, n, Q: courtyard (c), paved path (n), courtyard well (Q).
    W, G, t: curtain wall (W), gatehouse (G), corner towers (t).
    m, r: outer moat (m) and bridge/road to the front edge (r).
  What seeds change: keep depth/width, side and position of the wing, position of the stair and well.
  What fits by size:
    Huge (30x30): Keep with wing, courtyard with well, curtain wall with 4 corner towers, gatehouse.
    Gargantuan (40x40): Expanded courtyard and a water moat surrounding the curtain wall and towers.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavecQWGtnmr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep: 9 to 10 cells wide, 8 to 9 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="hE/*h" out="*h/**"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Side wing attached to keep (random side and position) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="aw" out="*e" symmetry="(x)" steps="1"/>
      <all in="a[Ew]" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stair zone inside the keep along the back wall: 4 cells along X, 2 along Y, with 2 cells landing before it -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Initial courtyard around keep and wing -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand courtyard if Huge (30x30) or larger -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand courtyard again if Gargantuan (40x40) -->
      <all in="cEEEEEEEE" out="*ccc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Curtain wall around courtyard -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers (4x4) on all 4 outer corners of the curtain wall -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Moat around curtain wall and towers only where 6 cells of ground remain (Gargantuan) -->
      <all in="cWEEEEEE" out="**mm****" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
      <all in="mE" out="*m" steps="1"/>
      <all in="mE/*m" out="*m/**"/>

      <!-- Way out from H straight to the front edge (single line first, then widened to 3 cells) -->
      <all in="H/h" out="*/n" symmetry="()" steps="1"/>
      <all in="n/h" out="*/n" symmetry="()"/>
      <all in="n/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[Gr]/[Em]" out="*/r" symmetry="()"/>

      <!-- Clean temporary path inside keep -->
      <prl in="H" out="h"/>
      <prl in="n/c" out="d/*" symmetry="()"/>
      <prl in="n/h" out="h/*" symmetry="()"/>
      <prl in="n/d" out="h/*" symmetry="()"/>

      <!-- Widen door, path, gatehouse and road to 3 cells along X only -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[Em]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Courtyard well where a 4x4 patch of yard is free -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavecQWGtnmrfFIJLZzOolkTNUWM#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="(xy)">
        <!-- Unions for included parts -->
        <union symbol="+" values="wvdgWGt"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="wvdgWGt"/>

        <!-- B. THE HEIGHTS: columns by steps -->
        <!-- Keep walls (w): 2 storeys + parapet = 66 high, with window bands I -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w I" steps="14"/>
        <all in="B w" out="w *" steps="18"/>
        <all in="B w" out="w I" steps="14"/>
        <all in="B w" out="w *" steps="11"/>

        <!-- Keep front door wall (d): seed O on floor (z=0), then w up to 65 -->
        <prl in="d" out="O"/>
        <all in="B O" out="w *" steps="65"/>

        <!-- Shared wall doorway (e) between keep and wing: seed O on floor, then w up to 65 -->
        <one in="heeeeea" out="*OOOOO*" symmetry="()" steps="1"/>
        <all in="O/e" out="*/O" symmetry="()" steps="5"/>
        <all in="e/O" out="O/*" symmetry="()" steps="5"/>
        <prl in="e" out="w"/>
        <all in="B O" out="w *" steps="65"/>

        <!-- Keep interior (h) and stair zone (s): 2 covered storeys (z=0 floor, z=32 slab, z=64 roof slab) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=1 (only on ground floor so it doesn't overwrite upper slab before part-stair runs) -->
        <all in="B s" out="s T" steps="1"/>
        <!-- Storey 1 air -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- Storey 1 ceiling / Storey 2 floor slab at z=32 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Storey 2 air -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="31"/>
        <!-- Roof slab at z=64 -->
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Side wing walls (v) and interior (a): 1 storey + roof slab at z=32, parapet at z=34 -->
        <all in="B v" out="v *" steps="8"/>
        <all in="B v" out="v I" steps="14"/>
        <all in="B v" out="v *" steps="11"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="F"/>

        <!-- Curtain wall (W): 24 high -->
        <all in="B W" out="W *" steps="23"/>

        <!-- Corner towers (t): 42 high -->
        <all in="B t" out="t *" steps="41"/>

        <!-- Gatehouse (G): convert entire 15x5 gatehouse footprint to door seed O at z=0, then G rises 37 high above it -->
        <prl in="G" out="O"/>
        <all in="B O" out="G *" steps="37"/>

        <!-- Courtyard well (Q): stone rim 6 high with water inside -->
        <all in="Q[cn]" out="z*"/>
        <all in="B z" out="z *" steps="5"/>

        <!-- C. THE FULL SCALE: doors, parts, windows, roofs, cleaning -->
        <!-- Windows in keep and wing walls (I -> L) -->
        <one steps="18">
          <rule in="BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I" out="w"/>

        <!-- Include seed parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Pitched roof on the central part of the keep roof or watchtower turret -->
        <one in="FFFFF/FFFFF/FFFFF/FFFFF/FFFFF" out="*****/**J**/**J**/**J**/*****" steps="1"/>
        <all in="B J" out="J *" steps="10"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: medieval cartoon style, warm stone, distinct wood, slate/brick accents -->
  <color symbol="E" value="#7a8c56" name="erba"/>
  <color symbol="h" value="#c8b89a" name="sala del mastio" area="keep"/>
  <color symbol="s" value="#b09070" name="scala del mastio" area="keep"/>
  <color symbol="a" value="#bfa888" name="ala laterale" area="keep"/>
  <color symbol="f" value="#9c7a54" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="#856846" name="solaio in legno" area="keep"/>
  <color symbol="w" value="#9e988e" name="muro del mastio" area="keep"/>
  <color symbol="v" value="#918b82" name="muro dell'ala" area="keep"/>
  <color symbol="W" value="#807a72" name="mura di cinta" area="courtyard"/>
  <color symbol="G" value="#736d65" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="#666058" name="torre d'angolo" area="tower"/>
  <color symbol="M" value="#aba59b" name="merlatura" area="keep"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>
  <color symbol="L" value="#527a8c" name="finestra"/>
  <color symbol="O" value="#593e25" name="porta in legno"/>
  <color symbol="o" value="#3d2917" name="assi della porta"/>
  <color symbol="N" value="#635d55" name="stipite in pietra"/>
  <color symbol="k" value="#785c3c" name="gradini in legno" area="keep"/>
  <color symbol="T" value="#785c3c" name="rampa"/>
  <color symbol="c" value="#b8ae9c" name="cortile" area="courtyard"/>
  <color symbol="n" value="#8c8478" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="#3b6e8c" name="acqua del pozzo" area="courtyard"/>
  <color symbol="z" value="#6e685f" name="bordo del pozzo" area="courtyard"/>
  <color symbol="m" value="#36647d" name="fossato"/>
  <color symbol="r" value="#827562" name="ponte e strada"/>
  <color symbol="J" value="#9e4736" name="camino in mattoni"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
