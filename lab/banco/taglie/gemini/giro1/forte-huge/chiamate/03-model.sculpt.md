# model.sculpt · gemini-4-argon · 45 s

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
It does not pass: taglia Enorme, seme 1: piani: 0 (serve ≥ 2); porta: 15 × 1 voxel (0,75 × 0,05 caselle), una porta è almeno 11 × 30 a ogni taglia — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, s scala del mastio, K muro del mastio, d soglia del mastio, b armeria, v muro dell'armeria, u varco dell'armeria, c cortile, Q pozzo, W cinta muraria, a fossato, F solaio di legno, J tetto in coppi, L finestra, k gradino di legno, O porta di quercia, o assi della porta, N stipite in pietra, M merlo, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEEEE
EEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEEEE
EEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEEEE
EEEEEMWWMWWaWaWWaWWaWaWWWWaWWaWaWWaWWaWaWWEEEEEEEE
EEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEEEE
EEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEEEE
EEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEEEE
EEEEEWWWccccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEWWWccccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEWWWccccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEWWWccccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEWWWccccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEWWWccvvvvvvvKKKKKKKKKKKKKKKKKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKKkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvJJJJJKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWccvvvvvvvKkkkkkkFFFFFFFFFKKcccccWWWEEEEEEE
EEEEEWWWcccccccccKKKKKKKKKKKKKKKKKKcccccWWWEEEEEEE
EEEEEWWWcccccccccKKKKKKKKKKKKKKKKKMcccccWWWEEEEEEE
EEEEEWWWcccccccccccccccMMEEWccccccccccccWWWEEEEEEE
EEEEEWWWcccccccccccccccWWEEWccccccccccccWWWEEEEEEE
EEEEEWWWcccccccccccccccWWEEWccccccccccccWWWEEEEEEE
EEEEEWWWcccccccQQcccccccWEEWccccccccccccWWWEEEEEEE
EEEEEWWWcccccccQQacccccWWEEWccccccccccccWWWEEEEEEE
EEEEEWWWcccccccQQacccccWWEEWccccccccccccWWWEEEEEEE
EEEEEWWWcccccccQQaccccccWEEWccccccccccccWWWEEEEEEE
EEEEEWWWcccccccccccccccWWEEWccccccccccccWWWEEEEEEE
EEEEEWWWccccccccccccccccWEEWccccccccccccWWWEEEEEEE
EEEEEWWWcccccccccccccccWWEEWccccccccccccWWWEEEEEEE
EEEEEWWWWWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWEEEEEEE
EEEEEWWWWWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWEEEEEEE
EEEEEWWWWWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000999999979999999799999999979999999799999000000
00000977777777777777777777777777777777777779000000
00000777777777777777777777777777777777777777000000
00000977777777777777777777777777777777777779000000
00000977700000000000000000000000000000007779000000
00000977700000000000000000000000000000007779000000
00000977700000000000000000000000000000007779000000
00000977700000000000000000000000000000007779000000
0000097770bbbbbbllllljllllljlllllll000007779000000
0000097770b99999ljjjjjjjjjjjjjjjjjl000007779000000
0000077770b99999ljjjjjjjjjjjjjjjjjl000007777000000
0000097770b9aaaalllceghjjjjjjjjjjjl000007779000000
0000097770b9aaaa99aceghjjjjjjjjjjjl000007779000000
000009777099aaaa99aceghjjjjjjjjjjjj000007779000000
0000097770b9aaaa99aceghjjjjjjjjjjjl000007779000000
000009777099aaaa99aceghjjjjjjjjjjjl000007779000000
0000097770b9aaaa99aceghjjjjjjjjjjjl000007779000000
0000097770b9aaaalllceghjjjjjjjjjjjl000007779000000
0000097770b99999ljlceghjjjjjjjjjjjl000007779000000
0000097770b99999ljlceghjjjjjjjjjjjl000007779000000
0000097770bbbbbbljljjjjjjjjjjjjjjjl000007779000000
0000097770000000llllljllllljlllllll000007779000000
00000777700000000000000990999000000000007777000000
00000977700000000000000990979000000000007779000000
00000977700000000000000990979000000000007779000000
00000977700000011110000990979000000000007779000000
00000977700000011110000990979000000000007779000000
00000977700000011110000990979000000000007779000000
00000977700000011110000990979000000000007779000000
00000977700000000000000790977000000000007779000000
00000777700000000000000970779000000000007777000000
00000977700000000000000790977000000000007779000000
00000977777777777777777790977777777777777779000000
00000977777777777777777790977777777777777779000000
00000977777777777777777790977777777777777779000000
00000999999979999799999990999997999999799999000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.................M.MM.MM.MM.MM.M.MM...............
.................M.MM.MM.MM.MM.M.MM...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKLLKKKKKKKKKKLK...............
.................KKKKLLKKKKKKKKKLLK...............
.................KKKKKKKKKKKKKKKLLK...............
.................KKKKKKKKKKKKKKKKKK...............
..........MM.M.MMKKKKKKKKKKKKKKKKKK...............
..........MM.MJMMKKKKKKKKKKKKKKKKKK...............
..........vvvvvvvKKKKKKKFFFFKKKKKKK...............
.....MM.M.MMvMvMMKMMKMKMMKKMKMMKMMK.MM.MM.M.......
.....MMWMWMMvMvMMKMMKMKMMKKMKMMKMMKWMM.MMWM.......
.....WWWWWWWWWWWWWWWWWWWWKKWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWLKWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWLLWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWLLWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWKKWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWKKWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWKKWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWE......
```
Right side (looking from the right):
```
.................M.MM.M.MMMMMM....................
.................M.MM.M.MMMMMM....................
.................KKKKKKKKKKKKK....................
.................KKKKKKKKKKKKK....................
.................KKKKKKKKKKKKK....................
.................KKKKKKKKKKKKK....................
.................KKKKKKKKKKKKK....................
.................KKKKKLLKKKKKK....................
.................KKKLLLLKKKKKK....................
.................KKKLLKKKKKKKK....................
.................KKKLLKKKKKKKK....................
.................KKKKKKKKKKKKK....................
.................KKKKKKKKKKKKK....................
.................KKKKKKKKKKKKK....................
........MM.MM.M.MMKMMKMKMKMKMMMMMMMMMMMMM.M.......
........MM.MMWMWMMKMMKMKMKMKMMMMMMMMMMMMMWM.......
........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWE......
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWW................................WWW.......
.....WWW................................WWW.......
.....WWW................................WWW.......
.....WWW................................WWW.......
.....WWW................................WWW.......
.....WWW..KKKKLLKKKKKKKKKKKKLKLKKKK.....WWW.......
.....WWW..KK....KKKkkkkk.........KK.....WWW.......
.....WWW..LL.....Kkkkkkk.........LL.....WWW.......
.....WWW..LL.....okkkkkk.........LL.....WWW.......
.....WWW..KK.....okkkkkk.........KK.....WWW.......
.....WWW..KK.....okkkkkk.........LL.....WWW.......
.....WWW..KK.....okkkkkk.........LL.....WWW.......
.....WWW..KK.....okkkkkk.........KK.....WWW.......
.....WWW..KK.....Kkkkkkk.........KK.....WWW.......
.....WWW..KK....KKkkkkkk.........KK.....WWW.......
.....WWW..KKLLLLKKkkkkkk.........KK.....WWW.......
.....WWW........KKKKKKK......KKKKKK.....WWW.......
.....WWW.........KKKKKK.....KKKKKKK.....WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWW...............WW..W............WWW.......
.....WWWWWWWWWWWWWWWWWWWW..WWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWW..WWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWW..WWWWWWWWWWWWWWWW.......
..................................................
..................................................
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
.................KKKKKKKKKKKKKKKKKK...............
.................KK.kkkk.........KK...............
.................K..kkkk.........KK...............
....................kkkk.........LL...............
....................kkkk.........LL...............
....................kkkk.........KK...............
....................kkkk.........KK...............
....................kkkk.........KK...............
.................K..kkkk.........KK...............
.................K..kkkk.........KK...............
.................K..kkkk.........KK...............
.................KKKKKKKKKKKKKKKLKK...............
.................KKKKKKKKKKKKKKKLLK...............
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEWMWWaWWaWaWWaWWaWaWaWWaWWaWaWWaWWMWEEEEE   00000000997999999979999999797999999979999999799000
EEEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777777777777777777777777779000
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   00000000777777777777777777777777777777777777777000
EEEEEEEEMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777777777777777777777777779000
EEEEEaaaWWWWcccccccccccccccccccccccccccccccWWWWEEE   00000000977700000000000000000000000000000007779000
EEEEEaaaWWWWcccccccccccccccccccccccccccccccWWWWEEE   00000000977700000000000000000000000000000007779000
EEEEEaaaaWWWcccccccccccccccccccccccccccccccWWWWEEE   00000000977700000000000000000000000000000007779000
EEEEEaaaWWWWcccccccccccccccccccccccccccccccWWWWEEE   00000000977700000000000000000000000000000007779000
EEEEEaaaWWWWcccccccccccccccccccccccccccccccWWWWEEE   0000000097770000llllljllllljlllllll000000007779000
EEEEEaaaaWWWcccccKKKKKKKKKKKKKKKKKKccccccccWWWWEEE   0000000097770000ljjjjjjjjjjjjjjjjjl000000007779000
EEEEEaaaWWWWcccccKKkkkkkFFFFFFFFFKKvvvcvcccWWWWEEE   0000000077770000ljjjjjjjjjjjjjjjjjlbbbb9bb07777000
EEEEEaaaaWWWcccccKkkkkkkFFFFFFFFFKKvvvvvvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjll999999b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjllaaaaa9907779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000jjjceghjjjjjjjjjjllaaaaa9b07779000
EEEEEaaaaWWWcccccKkkkkkkFFFFFFFFFFKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjllaaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjllaaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjj9aaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjj9aaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjj9aaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjj9aaaaa9b07779000
EEEEEaaaWWWWcccccKKKkKKMKKFKFKKFKKKvvvvvvvcWWWWEEE   0000000097770000ljljllllllljlllllll999999b07779000
EEEEEaaaaWWWcccccKKKKKKKKKKKKKKKKKMvvvvvvMcWWWWEEE   0000000097770000llllljllllljlllllllbbbb9bb07779000
EEEEEaaaWWWWcccccccccccMMEEWcccccccccccccccWWWWEEE   00000000777700000000000990999000000000000007777000
EEEEEaaaaWWWcccccccccccWWEEWcccccccccccccccWWWWEEE   00000000977700000000000990979000000000000007779000
EEEEEaaaWWWWcccccccccccWWEEWcccccccccccccccWWWWEEE   00000000977700000000000990979000000000000007779000
EEEEEaaaWWWWccccccccccccWEEWcccccccccccccccWWWWEEE   00000000977700000000000990979000000000000007779000
EEEEEaaaaWWWcccccccccccWWEEWcccccccccccccccWWWWEEE   00000000977700000000000990979000000000000007779000
EEEEEaaaWWWWcccccccccccWWEEWcccccccQQacccccWWWWEEE   00000000977700000000000990979000000111100007779000
EEEEEaaaWWWWccccccccccccWEEWcccccccQQQcccccWWWWEEE   00000000977700000000000990979000000111100007779000
EEEEEaaaaWWWcccccccccccWWEEWcccccccaQacccccWWWWEEE   00000000977700000000000790977000000110100007779000
EEEEEaaaWWWWccccccccccccWEEWcccccccccccccccWWWWEEE   00000000777700000000000970779000000111100007777000
EEEEEaaaaWWWcccccccccccWWEEWcccccccccccccccWWWWEEE   00000000977700000000000790977000000000000007779000
EEEEEEEEWWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777790977777777777777777779000
EEEEEEEEWWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777790977777777777777777779000
EEEEEEEEEWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777790977777777777777777779000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000997999999799999990999997999979999999799000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEWMWWaWWaWaWWaWWaWaWaWWaWWaWaWWaWWMWEEEEE   00000000997999999979999999797999999979999999799000
EEEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777777777777777777777777779000
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   00000000777777777777777777777777777777777777777000
EEEEEEEEMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777777777777777777777777779000
EEEEEaaaWWWWcccccccccccccccccccccccccccccccWWWWEEE   00000000977700000000000000000000000000000007779000
EEEEEaaaWWWWcccccccccccccccccccccccccccccccWWWWEEE   00000000977700000000000000000000000000000007779000
EEEEEaaaaWWWcccccccccccccccccccccccccccccccWWWWEEE   00000000977700000000000000000000000000000007779000
EEEEEaaaWWWWcccccccccccccccccccccccccccccccWWWWEEE   00000000977700000000000000000000000000000007779000
EEEEEaaaWWWWcccccccccccccccccccccccccccccccWWWWEEE   0000000097770000llllljllllljlllllll000000007779000
EEEEEaaaaWWWcccccKKKKKKKKKKKKKKKKKKccccccccWWWWEEE   0000000097770000ljjjjjjjjjjjjjjjjjl000000007779000
EEEEEaaaWWWWcccccKKkkkkkFFFFFFFFFKKvvvcvcccWWWWEEE   0000000077770000ljjjjjjjjjjjjjjjjjlbbbb9bb07777000
EEEEEaaaaWWWcccccKkkkkkkFFFFFFFFFMKvvvvvvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjll999999b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjj9aaaaa9907779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000jjjceghjjjjjjjjjjj9aaaaa9b07779000
EEEEEaaaaWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjj9aaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjj9aaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjj9aaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFMMJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjllaaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjllaaaaa9b07779000
EEEEEaaaWWWWcccccKkkkkkkFFFFFFFFFKKJJJJJvvcWWWWEEE   0000000097770000ljjceghjjjjjjjjjjllaaaaa9b07779000
EEEEEaaaWWWWcccccKKKKKKKKKKKKKKKKKKvvvvvvvcWWWWEEE   0000000097770000ljjjjjjjjjjjjjjjjll999999b07779000
EEEEEaaaaWWWcccccKKKKKKKKKKKKKKKKKMvvvvvvMcWWWWEEE   0000000097770000llllljllllljlllllllbbbb9bb07779000
EEEEEaaaWWWWcccccccccccMMEEWcccccccccccccccWWWWEEE   00000000777700000000000990999000000000000007777000
EEEEEaaaaWWWcccccccccccWWEEWcccccccccccccccWWWWEEE   00000000977700000000000990979011110000000007779000
EEEEEaaaWWWWcccccccccccWWEEWccaQaccccccccccWWWWEEE   00000000977700000000000990979011010000000007779000
EEEEEaaaWWWWccccccccccccWEEWccQQQccccccccccWWWWEEE   00000000977700000000000990979011110000000007779000
EEEEEaaaaWWWcccccccccccWWEEWccQQaccccccccccWWWWEEE   00000000977700000000000990979011110000000007779000
EEEEEaaaWWWWcccccccccccWWEEWcccccccccccccccWWWWEEE   00000000977700000000000990979000000000000007779000
EEEEEaaaWWWWccccccccccccWEEWcccccccccccccccWWWWEEE   00000000977700000000000990979000000000000007779000
EEEEEaaaaWWWcccccccccccWWEEWcccccccccccccccWWWWEEE   00000000977700000000000790977000000000000007779000
EEEEEaaaWWWWccccccccccccWEEWcccccccccccccccWWWWEEE   00000000777700000000000970779000000000000007777000
EEEEEaaaaWWWcccccccccccWWEEWcccccccccccccccWWWWEEE   00000000977700000000000790977000000000000007779000
EEEEEEEEWWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777790977777777777777777779000
EEEEEEEEWWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777790977777777777777777779000
EEEEEEEEEWWWWWWWWWWWWWWWWEEWWWWWWWWWWWWWWWWWWWWEEE   00000000977777777777777790977777777777777777779000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000997999999799999990999997999979999999799000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.27 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 164 nodi, 606 passi, finito in 600 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba, m=magenta, i=sala del mastio, s=scala del mastio, K=muro del mastio, d=soglia del mastio, b=armeria, v=muro dell'armeria, u=varco dell'armeria, c=cortile, Q=pozzo, W=cinta muraria, a=fossato, F=solaio di legno, f=intavolato, J=tetto in coppi, L=finestra, V=oliVe, Y=Yellow, T=Teal (marcatore), k=gradino di legno, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), O=porta di quercia, o=assi della porta, N=stipite in pietra, M=merlo, U=feritoia.
Alla fine: W 100780, K 46645, k 23040, E 9675, U 7644, v 6291, c 4625, L 3640, M 3234, F 2965, o 2201, a 986, J 764, b 375, Q 320, N 275, s 200, O 124, u 75, d 75.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-40 all×20, prl×1, one×4: 532 celle x3-25 y3-25 z0, passi 2-37
   #47 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 38
    #49 all . K → K * passi=8: ×8, 5600 celle x50-104 y50-89 z1-8, passi 39-46, .→K 5600
    #50 all . K → K V passi=12: ×12, 16800 celle x50-104 y50-89 z8-20, passi 47-58, K→V 8400, .→K 8400
    #51 all . K → K * passi=20: ×20, 14000 celle x50-104 y50-89 z21-40, passi 59-78, .→K 14000
    #52 all . K → K V passi=12: ×12, 16800 celle x50-104 y50-89 z40-52, passi 79-90, K→V 8400, .→K 8400
#53-55 all×3: 13150 celle x50-104 y50-89 z1-65, passi 91-105
    #57 all . Y → Y . passi=29: ×29, 78300 celle x55-99 y55-84 z2-31, passi 106-134, Y→. 39150, .→Y 39150
#58-59 all×2: 5400 celle x55-99 y55-84 z31-33, passi 135-136
    #61 all . Y → Y . passi=30: ×30, 81000 celle x55-99 y55-84 z33-63, passi 137-166, Y→. 40500, .→Y 40500
#62-74 prl×3, all×10: 17425 celle x35-99 y55-89 z0-65, passi 167-267
    #75 all . f → f . passi=31: ×31, 23250 celle x35-49 y55-79 z1-32, passi 268-298, f→. 11625, .→f 11625
#76-80 prl×1, all×4: 15064 celle x30-49 y50-84 z1-35, passi 299-334
    #81 all . W → W * passi=24: ×24, 102000 celle x15-129 y25-129 z1-24, passi 335-358, .→W 102000
#85-116 all×4, prl×1: 6496 celle x45-99 y55-109 z1-33, passi 359-380
     #117 all . #90 → #90 *: ×29, 27360 celle x55-70 y55-84 z3-62, passi 381-409, .→#90 27360
     #118 all = #90 → #90 *: ×1, 960 celle x55-70 y55-84 z31-63, passi 410, F→#90 960
     #119 prl #90 → . passi=1: ×1, 29280 celle x55-70 y55-84 z2-63, passi 411, #90→. 29280
#120-124 all×3, prl×2: 3720 celle x55-70 y55-84 z1-63, passi 412-430
     #125 all k . → * k: ×30, 21150 celle x55-70 y55-84 z2-62, passi 431-460, .→k 21150
#132-160 all×10, prl×2: 11298 celle x15-129 y25-129 z1-71, passi 461-511
#161-163 all×2, one×1: 10708 celle x16-128 y26-128 z8-63, passi 512-605
    #164 prl V → K: ×1, 17060 celle x30-104 y50-89 z8-51, passi 606, V→K 17060
Senza effetto (non hanno mai cambiato una cella):
#8 prl m/E → */m passi=1
#25 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all EEE/EEW/EWW → ***/**t/*tt: le celle cercate c'erano, ma mai disposte come nel pattern
#31 one tt/tt → WW/WW passi=1: in quel momento nella griglia non c'erano celle "t"
#32 all t[EW] → *t (+1) passi=2: in quel momento nella griglia non c'erano celle "t"
#33 all [dn]/c → */n: le celle cercate c'erano, ma mai disposte come nel pattern
#34 all [nG]/W → */G: in quel momento nella griglia non c'erano celle "nG"
#35 all [Gr]/E → */r: in quel momento nella griglia non c'erano celle "Gr"
#36 all nc → *n passi=1: in quel momento nella griglia non c'erano celle "n"
#37 all GW → *G passi=2: in quel momento nella griglia non c'erano celle "G"
#38 all rE → *r passi=1: in quel momento nella griglia non c'erano celle "r"
#41 all [Wt]E/*a → **/*a: le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 55
Fix it and answer with the whole program.

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
      W, G, g, t: curtain wall (2 cells thick), gatehouse walls G and gatehouse door g on the front axis, corner towers t
      r, p: road to the front edge, bridge p over moat
      a: outer moat around the fort (grows only where enough ground E remains, at gargantuan 40x40)
  -->
  <map scale="1/5 1/5 1" values="BHEmisKdbvucnQWGgtrpa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Central Keep body around H: 9 wide (4 each side of H), 8 or 9 deep -->
      <all in="E/[Hi]" out="i/*" symmetry="()" steps="4"/>
      <all in="[Hm]/E" out="*/m" symmetry="()" steps="3"/>
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
      <all in="[Kdv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*ccc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Curtain wall (2 cells thick) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Corner towers on the outer corners of the curtain wall (4x4, 3 or 4 towers varied by seed) -->
      <all in="EE/EW" out="**/*t"/>
      <one in="t" out="W" p="0.5" steps="1"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Paved path across courtyard, Gatehouse G & g, and road r to the front edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/W" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="gW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- 7. Courtyard well in a 4x4 patch of free courtyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- 8. Outer moat at Gargantuan size (where at least 6 cells of E remain beyond the curtain wall) -->
      <all in="cWWEEEEEE" out="***aa****" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="[rp]/a" out="*/p" symmetry="()"/>
      <all in="pa" out="*p" symmetry="(x)" steps="2"/>
    </sequence>

    <map scale="5 5 1" values="BEisKdbvucnQWGgtrpaFfJLVY#20#21Tk#90#91#92#94OoNMU" symmetry="()">
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
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
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
        <all in="B K" out="K *" steps="12"/>

        <!-- Keep interior i (floor at z=0, slab at 32, roof slab at 64) -->
        <all in="B i" out="f *" steps="1"/>
        <all in="B f" out="f B" steps="31"/>
        <all in="B f" out="f F" steps="1"/>
        <all in="B f" out="f B" steps="31"/>
        <prl in="f" out="F"/>

        <!-- Keep stair s (floor at z=0, T at z=1, slab at 32, T at z=33, roof slab at 64) -->
        <all in="B s" out="Y *" steps="1"/>
        <all in="B Y" out="Y T" symmetry="()" steps="1"/>
        <all in="B Y" out="Y B" steps="30"/>
        <all in="B Y" out="Y F" steps="1"/>
        <all in="B Y" out="Y T" symmetry="()" steps="1"/>
        <all in="B Y" out="Y B" steps="30"/>
        <prl in="Y" out="F"/>

        <!-- Keep door zone d: door seed O at z=1, wall K from z=2..64 -->
        <all in="B d" out="f *" steps="1"/>
        <all in="B f" out="f O" steps="1"/>
        <all in="B f" out="f K" steps="62"/>
        <prl in="f" out="K"/>

        <!-- Internal doorway u between keep and barracks: door seed O at z=1, wall K above -->
        <all in="B u" out="f *" steps="1"/>
        <all in="B f" out="f O" steps="1"/>
        <all in="B f" out="f K" steps="62"/>
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

        <!-- Gatehouse walls G (38 high) and Gatehouse door g (door seed O at z=1, G wall from z=2..37) -->
        <all in="B G" out="G *" steps="37"/>
        <all in="B g" out="f *" steps="1"/>
        <all in="B f" out="f O" steps="1"/>
        <all in="B f" out="f G" steps="35"/>
        <prl in="f" out="G"/>

        <!-- C. Full scale: parts, windows, details -->
        <import file="part-stair"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in V bands of keep, barracks, and towers -->
        <one steps="24">
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
  <color symbol="g" value="6e5037" name="portone di guardia" area="courtyard"/>
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
