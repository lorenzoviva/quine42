# model.sculpt · gemini-4-argon · 52 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
Concept: Forte (medieval fortress with central keep, courtyard, curtain wall, corner towers, gatehouse, and moat/well at larger sizes).
Parts & Letters:
- H, h: interior floor of the central keep (mastio), with s as the stair zone (4x2 cells along the back wall).
- w: stone walls of the central keep.
- a, v: side annex (arme / guardhouse) attached to the keep, with floor a and wall v (varies by seed side/position).
- c: courtyard (cortile) around the keep.
- W: outer curtain wall (mura di cinta) surrounding the courtyard.
- t: corner towers (torri angolari) on the outer corners of the curtain wall (number and corners vary with seed/size).
- d, n, G, r: main axis to the front (+y) — d: keep doorway, n: paved path across courtyard, G: gatehouse through curtain wall, r: road to edge.
- Q: courtyard well (pozzo) placed where courtyard is wide enough (Huge/Gargantuan).
- m: outer moat (fossato) outside the curtain wall where enough ground remains (Huge/Gargantuan).
What fits at each size:
- Large (20x20): Keep (9x8 or 9x9 inside) + side annex + compact courtyard + curtain wall + gatehouse + 1-2 corner towers.
- Huge (30x30) & Gargantuan (40x40): Courtyard expands outward, accommodates a well (Q), all 4 corner towers (t) of 4x4, and a water moat (m) around the fortress.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavcdWtnGrQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep (mastio) interior: 3 behind H, 3 in front (+1 by chance), 4 to each side -> 9 wide, 7-8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>

      <!-- Keep walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Side wing / annex (corpo di guardia) on one random side of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stair zone inside the keep along the back wall (2 cells landing on left, 4x2 stair strip) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Courtyard around keep and annex: 2 cells at Large, expands by 3 more where ground allows (Huge/Gargantuan) -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall around the courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers: at Large, 2 random outer corners get 3x3 towers; where ground is wide (Huge+), all corners get 4x4 towers -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <all in="EEE/EEE/EEW" out="***/***/*t*"/>
      <all steps="2">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Well in the courtyard where a 4x4 patch of courtyard is free (fits at Huge and Gargantuan) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <all in="Qc" out="*Q" steps="1"/>
      <all in="Q*/*c" out="**/*Q" steps="1"/>

      <!-- Entrance axis from the keep front straight to the south edge (+y) -->
      <one in="whw/hhh/hhh/hhh/www" out="***/***/***/***/*d*" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Moat around the curtain wall and towers where at least 4 cells of ground remain to the edge (fits at Huge+) -->
      <all in="[Wt]EEEE" out="*mm**" steps="1"/>
      <all in="mE/*m" out="*m/**" steps="2"/>
    </sequence>
  </map>

  <color symbol="E" value="118,138,88" name="prato"/>
  <color symbol="H" value="185,155,115" name="sala del mastio"/>
  <color symbol="h" value="185,155,115" name="sala del mastio"/>
  <color symbol="s" value="160,125,85" name="vano scala"/>
  <color symbol="w" value="135,132,125" name="muro del mastio"/>
  <color symbol="a" value="175,145,105" name="corpo di guardia"/>
  <color symbol="v" value="125,122,115" name="muro del corpo di guardia"/>
  <color symbol="c" value="195,180,145" name="cortile"/>
  <color symbol="W" value="150,146,138" name="mura di cinta"/>
  <color symbol="t" value="118,115,108" name="torre angolare"/>
  <color symbol="d" value="110,75,45" name="portale del mastio"/>
  <color symbol="n" value="168,162,152" name="lastricato"/>
  <color symbol="G" value="105,102,96" name=" corpo di guardia del portone"/>
  <color symbol="r" value="158,142,112" name="strada"/>
  <color symbol="Q" value="85,125,155" name="pozzo"/>
  <color symbol="m" value="72,118,148" name="fossato"/>
</sequence>

## What the game made of it
It does not run: large, seed 1: riga 87, <color>: "value" è un colore esadecimale (rrggbb), non "118,138,88"

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Concept: Forte (medieval fortress with central keep, side guardhouse annex, courtyard, curtain wall, corner towers, gatehouse, and well/moat at larger sizes).
Parts & Letters:
- H, h: interior floor of the central keep (mastio), with s as the stair zone (4x2 cells along the back wall).
- w: stone walls of the central keep.
- a, v: side annex (corpo di guardia) attached to the keep, with floor a and wall v (varies by seed side/position).
- c: courtyard (cortile) around the keep.
- W: outer curtain wall (mura di cinta) surrounding the courtyard.
- t: corner towers (torri angolari) on the outer corners of the curtain wall (number and corners vary with seed/size).
- d, n, G, r: main axis to the front (+y) — d: keep doorway, n: paved path across courtyard, G: gatehouse through curtain wall, r: road to edge.
- Q: courtyard well (pozzo) placed where courtyard is wide enough (Huge/Gargantuan).
- m: outer moat (fossato) outside the curtain wall where enough ground remains (Huge/Gargantuan).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEshwavcdWtnGrQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep (mastio) interior: 3 behind H, 3 in front (+1 by chance), 4 to each side -> 9 wide, 7-8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Side wing / annex (corpo di guardia) on one random side of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Entrance axis from H straight to the front (+y) -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Stair zone inside the keep along the back wall (2 cells landing on left, 4x2 stair strip) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Courtyard around keep and annex: 2 cells at Large, expands where ground allows (Huge/Gargantuan) -->
      <all in="[wvd]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall around the courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers: at Large, 2 random outer corners get 3x3 towers; where ground is wide (Huge+), all corners get 4x4 towers -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <all in="EEE/EEE/EEW" out="***/***/*t*"/>
      <all steps="2">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Well in the courtyard where a 4x4 patch of courtyard is free (fits at Huge and Gargantuan) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <all in="Qc" out="*Q" steps="1"/>
      <all in="Q*/*c" out="**/*Q" steps="1"/>

      <!-- Continue entrance path across courtyard, gatehouse through curtain wall, road to edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Moat around the curtain wall and towers where at least 4 cells of ground remain to the edge (fits at Huge+) -->
      <all in="[Wt]EEEE" out="*mm**" steps="1"/>
      <all in="mE/*m" out="*m/**" steps="2"/>
    </sequence>

    <map scale="5 5 1" values="BEshwavcdWtnGrQmPZfFYTJkLRIKVXUMk#90#91#92#94OoN#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QmmmQ/QmmmQ/QmmmQ/QQQQQ"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="PV"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="PV"/>

        <!-- Internal doorway seed between keep (h) and side annex (a) -->
        <one in="hwwwwwa" out="*OOOOO*" symmetry="()" steps="1"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="5"/>

        <!-- Front door seed (O) of the keep at d, and outer gate seed (O) at G -->
        <all in="d/n" out="O/*" symmetry="()" steps="1"/>
        <all in="d/O" out="O/*" symmetry="()" steps="4"/>
        <all in="G/r" out="O/*" symmetry="()" steps="1"/>
        <all in="G/O" out="O/*" symmetry="()" steps="4"/>

        <!-- B. Heights: grow columns from the bottom layer while preserving area letters at z=0 -->
        <!-- Keep walls (w) and keep doorway above door (d): 2 storeys = 64 + 1 parapet = 65 -->
        <all in="B [wd]" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="13"/>
        <prl in="B w" out="P *"/>

        <!-- Keep interior (h) and stair zone (s): 2 covered storeys (z=1..31, slab at 32, z=33..63, roof slab at 64) -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B h" out="h B" steps="31"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="B h" out="F *"/>
          <rule in="B s" out="F *"/>
        </prl>

        <!-- Side annex (a, v): 1 storey + pitched roof -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v Z" steps="12"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="B v" out="R *"/>

        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <prl in="B a" out="R *"/>

        <!-- Curtain wall (W): height 24 -->
        <all in="B W" out="W P" steps="23"/>
        <prl in="B W" out="P *"/>

        <!-- Gatehouse (G): height 36 -->
        <all in="B G" out="G V" steps="35"/>
        <prl in="B G" out="V *"/>

        <!-- Corner towers (t): solid base + upper room + battlements at 44, plus conical spire marker on top -->
        <all in="B t" out="t V" steps="43"/>
        <prl in="B t" out="V *"/>

        <!-- Well (Q): low stone rim of 5 -->
        <all in="B Q" out="Q P" steps="5"/>
        <prl in="Q" out="P"/>

        <!-- C. Full scale details: stairs, doors, battlements, slits, windows, roofs -->
        <!-- 1. Stair inside the keep -->
        <import file="part-stair"/>

        <!-- 2. Doors (keep entrance, internal annex door, outer gatehouse door) -->
        <all in="B O" out="P O" steps="1"/>
        <import file="part-door"/>

        <!-- 3. Battlements and arrow slits on keep, curtain wall, gatehouse, towers -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 4. Windows in the Z bands of the keep and annex (at least 6 windows on 3+ sides) -->
        <one steps="18">
          <rule in="BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LZZZZB" out="*LLLL*"/>
        <prl in="Z" out="P"/>

        <!-- 5. Pitched roof on the side annex (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- 6. Chimney / turret on the keep roof -->
        <one in="B B F" out="* K *" steps="1" symmetry="()"/>
        <all in="K F" out="* K" symmetry="(x)" steps="2"/>
        <all in="K/F" out="*/K" symmetry="(y)" steps="2"/>
        <all in="B K" out="K V" steps="10"/>
        <prl in="K" out="R"/>
      </sequence>
    </map>
  </map>

  <!-- Palette and Area Tags -->
  <color symbol="E" value="768a58" name="prato"/>
  <color symbol="h" value="b99b73" name="pavimento del mastio" area="keep"/>
  <color symbol="s" value="b99b73" name="vano scala" area="keep"/>
  <color symbol="w" value="87847d" name="fondazione del mastio" area="keep"/>
  <color symbol="a" value="af9169" name="corpo di guardia" area="house"/>
  <color symbol="v" value="7d7a73" name="muro del corpo di guardia" area="house"/>
  <color symbol="c" value="c3b491" name="cortile" area="courtyard"/>
  <color symbol="d" value="a8a298" name="soglia del mastio" area="keep"/>
  <color symbol="W" value="96928a" name="base delle mura" area="courtyard"/>
  <color symbol="t" value="76736c" name="base della torre" area="tower"/>
  <color symbol="n" value="a8a298" name="lastricato" area="courtyard"/>
  <color symbol="G" value="696660" name="soglia del portone" area="courtyard"/>
  <color symbol="r" value="9e8e70" name="strada" area="yard"/>
  <color symbol="Q" value="87847d" name="pozzo" area="courtyard"/>
  <color symbol="m" value="487694" name="acqua del fossato" area="yard"/>

  <!-- Full-scale Building Materials -->
  <color symbol="P" value="96928a" name="pietra chiara"/>
  <color symbol="V" value="78746d" name="pietra scura"/>
  <color symbol="M" value="96928a" name="merlatura"/>
  <color symbol="U" value="2b2927" name="feritoia"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="f" value="9e7b56" name="tavolato"/>
  <color symbol="F" value="856646" name="solaio in legno"/>
  <color symbol="k" value="9e7b56" name="gradini in legno"/>
  <color symbol="T" value="9e7b56" name="scala"/>
  <color symbol="R" value="a84a38" name="tetto in coppi"/>
  <color symbol="K" value="78746d" name="torretta"/>
  <color symbol="O" value="6e472b" name="porta in legno"/>
  <color symbol="o" value="4a2e1b" name="assi della porta"/>
  <color symbol="N" value="5c5852" name="stipite in pietra"/>
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
```
