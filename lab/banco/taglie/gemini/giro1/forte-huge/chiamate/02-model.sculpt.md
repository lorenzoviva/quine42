# model.sculpt · gemini-4-argon · 50 s

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

## Your program so far
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <!--
    Concept: forte (fortress with central keep, courtyard, curtain wall, corner towers, gatehouse, barracks wing, and outer moat at gargantuan size).
    Plan letters:
      i, s: keep interior and stair zone (9x9 to 9x10 clear interior, surrounded by keep wall K)
      K, d: keep wall and keep door
      b, v, u: barracks/armory wing attached to a random side of the keep, its wall v, internal doorway u
      c, n, Q: courtyard around the keep, paved road n from keep door to gatehouse, courtyard well Q
      W, G, t: curtain wall (2 cells thick), gatehouse G on the front axis, corner towers t (3 to 4 towers varied by seed)
      r, p: road to the front edge, bridge p over moat
      a: outer moat around the fort (grows only where enough ground E remains, at gargantuan 40x40)
    Seeds change: keep depth, side and placement of the barracks wing, which corner towers rise, well position in the courtyard.
    Sizes:
      Large (20x20): keep + thin courtyard + curtain wall.
      Huge (30x30): full keep + barracks wing + expanded courtyard + well + 2-thick curtain wall + corner towers + gatehouse.
      Gargantuan (40x40): adds wider courtyard + outer moat (a) with bridge (p) and outer watch posts.
  -->
  <map scale="1/5 1/5 1" values="BHEisKdbvucnQWGtrpa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Central Keep body around H: 9 wide (4 each side of H), 9 or 10 deep -->
      <all in="E/[Hh]" out="i/*" symmetry="()" steps="4"/>
      <all in="H/E" out="*/i" symmetry="()" steps="1"/>
      <all in="i/E" out="*/i" symmetry="()" steps="4"/>
      <prl in="i/E" out="*/i" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hi]E" out="*i" symmetry="(x)" steps="4"/>
      <prl in="H" out="i"/>
      <all in="iE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- Stair zone inside the keep: along back wall, 2 cells landing on small-x, 4 cells long (20 voxels), 2 cells wide (10 voxels) -->
      <one in="KKKKKKKKKKK/KiiiiiiiiiK/KiiiiiiiiiK" out="***********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- 2. Barracks wing against a random side of the keep where space allows (at Huge & Gargantuan) -->
      <one in="KEEEEEEE/KEEEEEEE/KEEEEEEE/KEEEEEEE/KEEEEEEE/KEEEEEEE/KEEEEEEE" out="*******/*bbbbb*/*bbbbb*/*bbbbb*/*bbbbb*/*bbbbb*/*******" symmetry="(x)" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="ib/ib/ib" out="*u/*u/*u" symmetry="(x)" steps="1"/>
      <all in="K/u" out="u/*" symmetry="(xy)" steps="1"/>

      <!-- 3. Courtyard around the keep and wing -->
      <all in="[Kv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard where ground allows (Huge and Gargantuan) -->
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*cc*******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Curtain wall (1 cell at Large, 2 cells where room allows at Huge & Gargantuan) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEE" out="*W*" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Corner towers on the outer corners of the curtain wall (4x4, only where space outside allows) -->
      <all in="EEE/EEW/EWW" out="***/**t/*tt"/>
      <!-- One corner may stay a low bastion by seed choice -->
      <one in="tt/tt" out="WW/WW" p="0.5" steps="1"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Way out: from keep centre straight to the front (large y) -->
      <all in="i/K" out="*/d" symmetry="()" steps="1"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- 7. Courtyard well in a 4x4 patch of free courtyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- 8. Outer moat at Gargantuan size (where at least 4 cells of E remain beyond the curtain wall) -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="ra" out="*a" symmetry="(x)" steps="1"/>
      <prl in="a/r" out="p/*" symmetry="(xy)"/>
      <all in="pa" out="*p" symmetry="(xy)" steps="2"/>
    </sequence>
  </map>
  <color symbol="E" value="120,145,95" name="erba"/>
  <color symbol="H" value="180,170,150" name="centro"/>
  <color symbol="i" value="195,180,155" name="sala del mastio" area="keep"/>
  <color symbol="s" value="175,150,120" name="scala del mastio" area="keep"/>
  <color symbol="K" value="130,128,122" name="muro del mastio" area="keep"/>
  <color symbol="d" value="110,80,55" name="porta del mastio" area="keep"/>
  <color symbol="b" value="185,170,145" name="armeria" area="barn"/>
  <color symbol="v" value="140,135,128" name="muro dell'armeria" area="barn"/>
  <color symbol="u" value="120,90,60" name=" varco dell'armeria" area="barn"/>
  <color symbol="c" value="165,155,135" name="cortile" area="courtyard"/>
  <color symbol="n" value="150,145,138" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="95,125,145" name="pozzo" area="courtyard"/>
  <color symbol="W" value="145,142,135" name="cinta muraria" area="courtyard"/>
  <color symbol="G" value="125,120,115" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="115,112,108" name="torre d'angolo" area="tower"/>
  <color symbol="r" value="160,148,125" name="strada" area="yard"/>
  <color symbol="p" value="135,100,65" name="ponte" area="yard"/>
  <color symbol="a" value="75,115,140" name="fossato" area="yard"/>
</sequence>

## What the game made of it
It does not run: huge, seed 1: riga 88, <color>: "value" è un colore esadecimale (rrggbb), non "120,145,95"

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <!--
    Concept: forte (fortress with central keep, courtyard, curtain wall, corner towers, gatehouse, barracks wing, and outer moat at gargantuan size).
    Plan letters:
      i, s: keep interior and stair zone (9x9 to 9x10 clear interior, surrounded by keep wall K)
      K, d: keep wall and keep door
      b, v, u: barracks/armory wing attached to a random side of the keep, its wall v, internal doorway u
      c, n, Q: courtyard around the keep, paved road n from keep door to gatehouse, courtyard well Q
      W, G, t: curtain wall (2 cells thick), gatehouse G on the front axis, corner towers t (3 to 4 towers varied by seed)
      r, p: road to the front edge, bridge p over moat
      a: outer moat around the fort (grows only where enough ground E remains, at gargantuan 40x40)
    Seeds change: keep depth, side and placement of the barracks wing, which corner towers rise, well position in the courtyard.
    Sizes:
      Large (20x20): keep + thin courtyard + curtain wall.
      Huge (30x30): full keep + barracks wing + expanded courtyard + well + 2-thick curtain wall + corner towers + gatehouse.
      Gargantuan (40x40): adds wider courtyard + outer moat (a) with bridge (p).
  -->
  <map scale="1/5 1/5 1" values="BHEmisKdbvucnQWGtrpa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Central Keep body around H: 9 wide (4 each side of H), 9 or 10 deep -->
      <all in="E/H" out="i/*" symmetry="()" steps="4"/>
      <all in="E/i" out="i/*" symmetry="()" steps="3"/>
      <all in="H/E" out="*/m" symmetry="()" steps="4"/>
      <prl in="m/E" out="*/m" p="0.5" steps="1" symmetry="()"/>
      <all in="[Him]E" out="*i" symmetry="(x)" steps="4"/>
      <all in="[im]E" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- Way out from centre m straight to the front through keep wall K -->
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="i"/><rule in="H" out="i"/></prl>

      <!-- Stair zone inside the keep: along back wall, 2 cells landing on small-x, 4 cells long (20 voxels), 2 cells wide (10 voxels) -->
      <one in="KKKKKKKKKKK/KiiiiiiiiiK/KiiiiiiiiiK" out="***********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- 2. Barracks wing against a random side of the keep where space allows (at Huge & Gargantuan) -->
      <one in="KEEEE/KEEEE/KEEEE/KEEEE/KEEEE/KEEEE/KEEEE" out="*****/*bbb*/*bbb*/*bbb*/*bbb*/*bbb*/*****" symmetry="(x)" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="iKb/iKb/iKb" out="*u*/*u*/*u*" symmetry="(x)" steps="1"/>

      <!-- 3. Courtyard around the keep and wing -->
      <all in="[Kv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*ccc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Curtain wall (1 cell at Large, 2 cells where room allows at Huge & Gargantuan) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEE" out="*W*" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Corner towers on the outer corners of the curtain wall (4x4, only where space outside allows) -->
      <all in="EEE/EEW/EWW" out="***/**t/*tt"/>
      <one in="tt/tt" out="WW/WW" p="0.5" steps="1"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Paved path across courtyard, Gatehouse G, and road r to the front edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- 7. Courtyard well in a 4x4 patch of free courtyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- 8. Outer moat at Gargantuan size (where at least 5 cells of E remain beyond the curtain wall) -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="r/a" out="p/*" symmetry="(xy)"/>
      <all in="p/a" out="*/p" symmetry="(xy)"/>
      <all in="pa" out="*p" symmetry="(xy)" steps="2"/>
    </sequence>

    <map scale="5 5 1" values="BEisKdbvucnQWGtrpaFfJLVY#20#21Tk#90#91#92#94OoNMU" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="QQQQQ/QaaaQ/QaaaQ/QaaaQ/QQQQQ"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="KWGvt"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="KWGvt"/>

        <!-- B. Heights -->
        <!-- Keep walls K: 65 high (z=0..64) with window bands V at floor 1 and floor 2 -->
        <all in="B K" out="K *" steps="8"/>
        <all in="B K" out="K V" steps="12"/>
        <all in="B K" out="K *" steps="20"/>
        <all in="B K" out="K V" steps="12"/>
        <all in="B K" out="K *" steps="13"/>

        <!-- Keep interior i and stair s: 2 covered storeys + roof walk at z=64 -->
        <all steps="1">
          <rule in="B i" out="Y i"/>
          <rule in="B s" out="Y s"/>
        </all>
        <all in="B Y" out="Y T" symmetry="()" steps="1"/>
        <all in="B i" out="i B" steps="30"/>
        <all in="B Y" out="Y B" steps="29"/>
        <all steps="1">
          <rule in="B i" out="i F"/>
          <rule in="B Y" out="Y F"/>
        </all>
        <all in="B Y" out="Y T" symmetry="()" steps="1"/>
        <all in="B i" out="i B" steps="31"/>
        <all in="B Y" out="Y B" steps="30"/>
        <prl>
          <rule in="i" out="F"/>
          <rule in="Y" out="F"/>
        </prl>

        <!-- Keep door zone d: floor at z=0, air 1..31, slab at 32, air 33..39, wall K from 40..65 -->
        <all in="B d" out="f *" steps="1"/>
        <all in="B f" out="f O" steps="1"/>
        <all in="B f" out="f B" steps="30"/>
        <all in="B f" out="f F" steps="1"/>
        <all in="B f" out="f B" steps="7"/>
        <all in="B f" out="f K" steps="25"/>
        <prl in="f" out="K"/>

        <!-- Internal doorway u between keep and barracks: floor at z=0, door seed O at z=1, wall K above -->
        <all in="B u" out="f *" steps="1"/>
        <all in="B f" out="f O" steps="1"/>
        <all in="B f" out="f K" steps="30"/>
        <prl in="f" out="K"/>

        <!-- Barracks wing: interior b (floor + 31 air + pitched roof J) and walls v (33 high) -->
        <all in="B b" out="f *" steps="1"/>
        <all in="B f" out="f B" steps="31"/>
        <prl in="f" out="J"/>
        <all in="B v" out="v *" steps="8"/>
        <all in="B v" out="v V" steps="12"/>
        <all in="B v" out="v *" steps="12"/>
        <!-- Pitched roof on barracks -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>

        <!-- Curtain wall W (25 high), Corner towers t (45 high), Well curb Q (5 high) -->
        <all in="B W" out="W *" steps="24"/>
        <all in="B t" out="t *" steps="10"/>
        <all in="B t" out="t V" steps="10"/>
        <all in="B t" out="t *" steps="24"/>
        <all in="B Q" out="Q *" steps="4"/>

        <!-- Gatehouse G: outer ring rises as G wall (38 high), inner passage has door O at front and arch above -->
        <all in="G/[cnr]" out="f/*" symmetry="()" steps="1"/>
        <all in="B f" out="f O" steps="1"/>
        <all in="B f" out="f G" steps="36"/>
        <prl in="f" out="G"/>
        <all in="G/O" out="f/*" symmetry="(xy)" steps="3"/>
        <all in="B f" out="f B" steps="31"/>
        <all in="B f" out="f G" steps="5"/>
        <prl in="f" out="G"/>
        <all in="B G" out="G *" steps="37"/>

        <!-- Restore ground f where overwritten -->
        <prl in="f" out="n"/>

        <!-- C. Full scale: parts, windows, details -->
        <import file="part-stair"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in V bands of keep, barracks, and towers -->
        <one steps="20">
          <rule in="BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="K"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="78915f" name="erba"/>
  <color symbol="i" value="c3b49b" name="sala del mastio" area="keep"/>
  <color symbol="s" value="af9678" name="scala del mastio" area="keep"/>
  <color symbol="K" value="8a867e" name="muro del mastio" area="keep"/>
  <color symbol="d" value="6e5037" name="soglia del mastio" area="keep"/>
  <color symbol="b" value="b9aa91" name="armeria" area="barn"/>
  <color symbol="v" value="969188" name="muro dell'armeria" area="barn"/>
  <color symbol="u" value="785a3c" name="varco dell'armeria" area="barn"/>
  <color symbol="c" value="a59b87" name="cortile" area="courtyard"/>
  <color symbol="n" value="96918a" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="6e6b65" name="pozzo" area="courtyard"/>
  <color symbol="W" value="918e87" name="cinta muraria" area="courtyard"/>
  <color symbol="G" value="7d7873" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="73706c" name="torre d'angolo" area="tower"/>
  <color symbol="r" value="a0947d" name="strada" area="yard"/>
  <color symbol="p" value="876441" name="ponte di legno" area="yard"/>
  <color symbol="a" value="4b738c" name="fossato" area="yard"/>
  <color symbol="F" value="8c6d4e" name="solaio di legno"/>
  <color symbol="f" value="8c6d4e" name="intavolato"/>
  <color symbol="J" value="a84a38" name="tetto in coppi"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="M" value="9e9a92" name="merlo"/>
  <color symbol="U" value="2b2927" name="feritoia"/>
  <color symbol="k" value="9c7a56" name="gradino di legno"/>
  <color symbol="O" value="6b4c30" name="porta di quercia"/>
  <color symbol="o" value="4a331f" name="assi della porta"/>
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
