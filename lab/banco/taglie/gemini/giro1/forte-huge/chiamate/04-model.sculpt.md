# model.sculpt · gemini-4-argon · 37 s

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
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, i sala del mastio, s scala del mastio, K muro del mastio, d soglia del mastio, b armeria, v muro dell'armeria, u varco dell'armeria, c cortile, n lastricato, Q pozzo, W cinta muraria, G corpo di guardia, g portone di guardia, t torre d'angolo, r strada, a fossato, F solaio di legno, J tetto in coppi, L finestra, k gradino di legno, O porta di quercia, o assi della porta, N stipite in pietra, M merlo, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEttttttMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMttttttEEE
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttttEE
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttttEE
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttttEE
EEttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttttEE
EEttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttttEE
EEtttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMtttttttEE
EEttttttccccccccccccccccccccccccccccccccccttttttEE
EEttttttccccccccccccccccccccccccccccccccccttttttEE
EEEEEWWWccccccccccccccccccccccccccaaacccccWWWEEEEE
EEEEEWWWcccccccccccccccccccccccccQQQQcccccWWWEEEEE
EEEEEWWWcccccccccccccccccccccccccQQQQcccccWWWEEEEE
EEEEEWWWccccccccccccccccccccccccccccccccccWWWEEEEE
EEEEEWWWccccccccccccccccccccccccccccccccccWWWEEEEE
EEEEEWWWccvvvvvvvKKKKKKKKKKKKKKKKKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKKFFFkkkkkFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKFFFFkkkkkFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKFFFFkkkkkFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKFFFFkkkkkFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWccvvvvvvvKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWcccccccccKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWcccccccccKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWcccccccccKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWcccccccccKKFFFFFFFFFFFFFFKKcccccccWWWEEEEE
EEEEEWWWcccccccccKKKKKKKKKKKKKKKKKKcccccccWWWEEEEE
EEEEEWWWccccccccccccccnnnnnnnnccccccccccccWWWEEEEE
EEEEEWWWccccccccccccccnnnnnnnnccccccccccccWWWEEEEE
EEEEEWWWccccccccccccccnnnnnnnnccccccccccccWWWEEEEE
EEEEEWWWccccccccccccccnnnnnnnnccccccccccccWWWEEEEE
EEEEEWWWccccccccccccccnnnnnnnnccccccccccccWWWEEEEE
EEEEEWWWccccccccccccccnnnnnnnnccccccccccccWttttEEE
EEEEEWWWccccccccccccccnnnnnnnnccccccccccccttttttEE
EEEEEWWWWWWWWWWWWWWWGGGGGGGGGGGMWWWWWWWWMtttttttEE
EEEEEWWWWWWWWWWWWWWWGGGGGGGGGGGGWWWWWWWWttttttttEE
EEEEEWWWWWWWWWWWWWWWGGGGGGGGGGGGWWWWWWWWttttttttEE
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEttttttttEE
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEttttttttEE
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEttttttttEE
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEMtttttttEE
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0fffffffff000000000000000000000000000000fffffffff0
0fdddddddf000000000000000000000000000000fdddddddf0
0ddddddddd000000000000000000000000000000ddddddddd0
0fdddddddf777777777777777777777777777777fdddddddf0
0ddddddddf777777777777777777777777777777fdddddddd0
0fdddddddf777777777777777777777777777777fdddddddf0
0ddddddddf777777777777777777777777777777fdddddddd0
0fddddddf00000000000000000000000000000000fddddddf0
0ffffffff00000000000000000000000011110000ffffffff0
00000777700000000000000000000000011110000777700000
00000977700000000000000000000000011110000777700000
00000777700000000000000000000000011110000777700000
00000977700000000000000000000000000000000777700000
0000097770bbbbbbllllljllllljlllllll000000777700000
0000097770b99999ljjjjjjjjjjjjjjjjjl000000777700000
0000097770b99999ljjjjjjjjjjjjjjjjjl000000777700000
0000097770b9aaaaljjjjjcdfhjjjjjjjjl000000777700000
0000097770b9aaaaljjjjjcdfhjjjjjjjjl000000777700000
000009777099aaaajjjjjjjjjjjjjjjjjjj000000777700000
0000077770b9aaaaljjjjjjjjjjjjjjjjjl000000777700000
000009777099aaaaljjjjjjjjjjjjjjjjjl000000777700000
0000097770b9aaaaljjjjjjjjjjjjjjjjjl000000777700000
0000097770b9aaaaljjjjjjjjjjjjjjjjjl000000777700000
0000097770b99999ljjjjjjjjjjjjjjjjjl000000777700000
0000097770b99999ljjjjjjjjjjjjjjjjjl000000777700000
0000097770bbbbbbjjjjjjjjjjjjjjjjjjj000000777700000
0000097770000000ljjjjjjjjjjjjjjjjjl000000777700000
0000077770000000ljjjjjjjjjjjjjjjjjl000000777700000
0000097770000000ljjjjjjjjjjjjjjjjjl000000777700000
0000097770000000ljjjjjjjjjjjjjjjjjl000000777700000
0000097770000000llllljllllljlllllll000000777700000
00000977700000000000000000000000000000000777700000
00000977700000000000000000000000000000000777700000
00000977700000000000000000000000000000000777700000
00000977700000000000000000000000000000000777700000
00000777700000000000000000000000000000000ffffffff0
00000977700000000000000000000000000000000fddddddf0
00000977777777777777dddddddddbdd77777777fdddddddd0
00000977777777777777dbbbbbbbbbbd77777777fdddddddf0
00000977777777777777dbbbbbbbbbbd77777777fdddddddd0
00000999999979999999dddddddddbdd77777777fdddddddf0
0000000000000000000000000000000000000000ddddddddd0
0000000000000000000000000000000000000000fdddddddf0
0000000000000000000000000000000000000000fffffffff0
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.................M..M.M...M.M..M..M...............
.................M.MM.MM.MM.MM.M.MM...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKKKKKKKKKKKKKKK...............
.................KKKKKKKKKKKKKKKKKK...............
..M.MMMMMM.......KKKKKKKKKKKKKKKKKK.....MMMMMM.M..
..M.MMMMMM.......KKKKKKKKKKKKKKKLLL.....MMMMMM.M..
..tttttttt.......KKKMKKMKKKKMKMMLLL.....tttttttt..
..tttttttt.......KKKMMKMKMKMMKMMKKK.....tttttttt..
..ttttttttMM.M.MMKKKGGGGGGGGGGGGKKK.....tttttttt..
..ttttttttMM.MJMMKKKGGGGGGGGGGGGKKK.....tttttttt..
..ttttttttvvvvvvvKKKGGoooooooNGGKKK.....tttttttt..
..tttMMtMtMMvMMvMKMKGGooooooooGGKKK.....tttttttt..
..tttMMtMtMMvMMvMKMKGGooooooooGGKKK.....tttttttt..
..tttWWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWtttttttt..
..KKKWWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWKKKKKKKK..
..KKKWWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWKKKKKKKK..
..KKKWWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWKKKKKKKK..
..KKKWWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWKKKKKKKK..
..tttWWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWtttttttt..
..tttWWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWtttttttt..
.EtttWWWWWWWWWWWWWWWGEooooooooGGWWWWWWWWttttttttE.
```
Right side (looking from the right):
```
.................M..M.M....M.M..M.................
.................M.MM.MM..MM.MM.M.................
.................KKKKKKKKKKKKKKKK.................
.................KKKKKKKKKKKKKKKK.................
.................KKKKKKKKKKKKKKKK.................
.................KKKKKKKKKKKKKKKK.................
.................KKKKKKKKKKKKKKKK.................
...MM.M.MMMM.....KKKKKKKKLLKKKKKK.....MMMM.M.MM...
...MM.M.MMMM.....KKKKKLLKLLLLKKKK.....MMMM.M.MM...
...ttttttttt.....KKKKKLLKKKLLKKKK.....ttttttttt...
...ttttttttt.....KKKKKKKKKKKLKKKK.....ttttttttt...
...ttttttttt.....KKKKKKKKKKKKKKKK.....ttttttttt...
...ttttttttt.....KKKKKKKKKKKKKKKK.....ttttttttt...
...ttttttttt....KKKKKKKKKKKKKKKKK.....ttttttttt...
...ttttttttt.M.MMKKKKKKKKKKKKKKKKKM.MMttttttttt...
...ttttttttt.M.MMKKKKKKKKKKKKKKKKWMWMMttttttttt...
...tttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWttttttttt...
...KKKKLLKKKWWWWWWWWWWWWWWWWWWWWWWWWWWKKKKKKKKK...
...LKKKLLKKKWWWWWWWWWWWWWWWWWWWWWWWWWWKKKKKKKKK...
...LKKKLLKKKWWWWWWWWWWWWWWWWWWWWWWWWWWKKKKKKKKK...
...KKKKKKKKKWWWWWWWWWWWWWWWWWWWWWWWWWWKKKKKKKKK...
...tttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWttttttttt...
...tttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWttttttttt...
...tttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWttttttttt...
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..KKKKKKKK..............................KKKLKLLL..
..KKKKKKKK..............................KKKKKKKK..
..KKKKKKKK..............................KKKKKKKK..
..KKKKKKKK..............................KKKKKKKK..
..KKKKKKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKKKKKK..
..KKKKKKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKKKKKK..
..KKKKKKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKKKKKK..
..KKKKKK..................................KKKKKK..
..KKKKKK..................................KKKKKK..
.....WWW..................................WWW.....
.....WWW..................................WWW.....
.....WWW..................................WWW.....
.....WWW..................................WWW.....
.....WWW..................................WWW.....
.....WWW..KKKLLKKKKKLLKKKKKKKKKLLKK.......WWW.....
.....WWW..KK....KKK..Lkkkkk......KK.......WWW.....
.....WWW..KK.....K....kkkkk......KK.......WWW.....
.....WWW..KK.....K....kkkkk......KK.......WWW.....
.....WWW..KK.....K....kkkkk......LL.......WWW.....
.....WWW..KK.....o...............LL.......WWW.....
.....WWW..KK.....o...............LL.......WWW.....
.....WWW..KK.....o...............LL.......WWW.....
.....WWW..KK.....o...............LL.......WWW.....
.....WWW..KK....Ko...............KK.......WWW.....
.....WWW..KKKLLKKK...............KK.......WWW.....
.....WWW........KK...............KK.......WWW.....
.....WWW.........K...............KK.......WWW.....
.....WWW.........K...............LL.......WWW.....
.....WWW.........KK..............LL.......WWW.....
.....WWW.........KKLLKKoooooKKLLKKK.......WWW.....
.....WWW..................................WWW.....
.....WWW..................................WWW.....
.....WWW..................................WWW.....
.....WWW..................................WWW.....
.....WWW..................................WWW.....
.....WWW..................................KKKKKK..
.....WWW..................................KKKKKK..
.....WWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWKKKKKKKK..
.....WWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWKKKKKKKK..
.....WWWWWWWWWWWWWWWGGooooooooGGWWWWWWWWKKKKKKKK..
........................................KKKKKKKK..
........................................KKKKKKKK..
........................................KKKKKKKK..
........................................KKKKKKKK..
..................................................
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..tttttttt..............................tttttttt..
..tttttt..................................tttttt..
..tttttt..................................tttttt..
..................................................
..................................................
..................................................
..................................................
..................................................
.................KKKKKKKKKKKLLKKKKK...............
.................KK....kkkk......KK...............
.................K.....kkkk......KK...............
.................K.....kkkk......KK...............
.................K......kkk......KK...............
.................K...............LL...............
.................K...............LL...............
.................K...............KK...............
.................K...............KK...............
.................K...............KK...............
.................K...............LL...............
.................K...............LL...............
.................K...............KK...............
.................K...............KK...............
.................KK..............KK...............
.................KKKKKKKKKKKKKKKLKK...............
..................................................
..................................................
..................................................
..................................................
..................................................
..........................................tttttt..
..........................................tttttt..
........................................tttttttt..
........................................tttttttt..
........................................tttttttt..
........................................tttttttt..
........................................tttttttt..
........................................tttttttt..
........................................tttttttt..
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
EEEttttttMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0fffffffff0000000000000000000000000000000000000000
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0fdddddddf0000000000000000000000000000000000000000
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0ddddddddd0000000000000000000000000000000000000000
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0fdddddddf9997999999979999999799999997999999900000
EEttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE   0ddddddddf7777777777777777777777777777777777900000
EEttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE   0fdddddddf7777777777777777777777777777777777900000
EEtttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE   0ddddddddf7777777777777777777777777777777777900000
EEttttttccccccccccccccccccccccccccccccccccWWWEEEEE   0fddddddf00000000000000000000000000000000777900000
EEttttttccccccccccccccccccccccccccccccccccWWWEEEEE   0ffffffff00000000000000000000000000000000777700000
EEEEEWWWccccccccccccccccccccccccccccccccccWWWEEEEE   00000777700000000000000000000000000000000777900000
EEEEEWWWccccccccccccccccccccccccccccccccccWWWEEEEE   00000777700000000000000000000000000000000777900000
EEEEEWWWccccccccccccccccccccccccccccccccccWWWEEEEE   00000777700000000000000000000000000000000777900000
EEEEEWWWccccccccccccccccccccccccccccccccccWWWEEEEE   00000777700000000000000000000000000000000777900000
EEEEEWWWccccccccccccccccccccccccccccccccccWWWEEEEE   0000077770000000llllljllllljlllllll000000777900000
EEEEEWWWcccccccccKKKKKKKKKKKKKKKKKKcccccccWWWEEEEE   0000077770000000ljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWccMvvcvvvKKFFFkkkkkFFFFFFKKcccccccWWWEEEEE   0000077770bbbbbbljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWccvvvvvvvKFFFFkkkkkFFFFFFKKcccccccWWWEEEEE   0000077770b99999ljjjjjcdfhjjjjjjjjl000000777700000
EEEEEWWWccvvJJJJJKFFFFkkkkkFFFFFFKKcccccccWWWEEEEE   000007777099aaaaljjjjjcdfhjjjjjjjjl000000777900000
EEEEEWWWccvvJJJJJKFFFFkkkkkFFFFFFKKcccccccWWWEEEEE   0000077770b9aaaajjjjjjjjjjjjjjjjjjj000000777900000
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770b9aaaaljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770b9aaaaljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770b9aaaaljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770b9aaaaljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770b9aaaaljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWccvvJJJJJKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770b9aaaaljjjjjjjjjjjjjjjjjl000000777700000
EEEEEWWWccvvvvvvvKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770b99999jjjjjjjjjjjjjjjjjjj000000777900000
EEEEEWWWccMvvvvvvKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770bbbbbbljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWcccccccccKFFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770000000ljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWcccccccccKKFFFFFFFFFFFFFFKKcccccccWWWEEEEE   0000077770000000ljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWcccccccccKKKKKKKKKKKKKKKKKKcccccccWWWEEEEE   0000077770000000ljjjjjjjjjjjjjjjjjl000000777900000
EEEEEWWWcccccQQcccccccnnnnnnnnccccccccccccWWWEEEEE   0000077770011110llllljllllljlllllll000000777900000
EEEEEWWWccccaQQcccccccnnnnnnnnccccccccccccWWWEEEEE   00000777700111100000000000000000000000000777900000
EEEEEWWWccccaQQcccccccnnnnnnnnccccccccccccWWWEEEEE   00000777700111100000000000000000000000000777700000
EEEEEWWWccccaQQcccccccnnnnnnnnccccccccccccWWWEEEEE   00000777700111100000000000000000000000000777900000
EEEEEWWWccccccccccccccnnnnnnnnccccccccccccWWWEEEEE   00000777700000000000000000000000000000000777700000
EEEttttWccccccccccccccnnnnnnnnccccccccccccWttttEEE   0ffffffff00000000000000000000000000000000ffffffff0
EEttttttccccccccccccccnnnnnnnnccccccccccccttttttEE   0fddddddf00000000000000000000000000000000fddddddf0
EEtttttttMWWWWWWWWWWGGGGGGGGGGGMWWWWWWWWMtttttttEE   0ddddddddf7777777777dddddddddbdd77777777fdddddddd0
EEttttttttWWWWWWWWWWGGGGGGGGGGGGWWWWWWWWttttttttEE   0fdddddddf7777777777dbbbbbbbbbbd77777777fdddddddf0
EEttttttttWWWWWWWWWWGGGGGGGGGGGGWWWWWWWWttttttttEE   0ddddddddf7777777777dbbbbbbbbbbd77777777fdddddddd0
EEttttttttEEEEEEEEEEEErrrrrrrrEEEEEEEEEEttttttttEE   0fdddddddf7777777777dddddddddbdd77777777fdddddddf0
EEttttttttEEEEEEEEEEEErrrrrrrrEEEEEEEEEEttttttttEE   0ddddddddd000000000000000000000000000000ddddddddd0
EEttttttttEEEEEEEEEEEErrrrrrrrEEEEEEEEEEttttttttEE   0fdddddddf000000000000000000000000000000fdddddddf0
EEtttttttMEEEEEEEEEEEErrrrrrrrEEEEEEEEEEMtttttttEE   0fffffffff000000000000000000000000000000fffffffff0
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEtEtEtEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000ffdfdfdff00000000000000000000000000000000000000
EEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000fdddddddf00000000000000000000000000000000000000
EEEtttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000ddddddddd00000000000000000000000000000000000000
EEEEtttttttMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000fdddddddf79999999799999997999999979999999799000
EEEtttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   000ddddddddf77777777777777777777777777777777779000
EEEEttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   000fdddddddf77777777777777777777777777777777779000
EEEttttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEE   000dddddddff77777777777777777777777777777777779000
EEEEttttttcccccccccccccccccccccccccccccccccWWWWEEE   000fdddddf0000000000000000000000000000000007779000
EEEEtttttMcccccccccccccccccccccccccccccccccWWWWEEE   000ffdffff0000000000000111100000000000000007777000
EEEEEEEWWWccccccccccccccaaaccccccccccccccccWWWWEEE   00000077770000000000000111100000000000000007779000
EEEEEEEWWWcccccccccccccQQQQccccccccccccccccWWWWEEE   00000077770000000000000111100000000000000007779000
EEEEEEEWWWcccccccccccccQQQQccccccccccccccccWWWWEEE   00000077770000000000000111100000000000000007779000
EEEEEEEWWWcccccccccccccccccccccccccccccccccWWWWEEE   00000077770000000000000000000000000000000007779000
EEEEEEEWWWcccccccccccccccccccccccccccccccccWWWWEEE   0000007777000000llllljllllljlllllllbbbb9bb07779000
EEEEEEEWWWcccccccKKKKKKKKKKKKKKKKKKvvvvvvvcWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjl999999b07779000
EEEEEEEWWWcccccccKKFFFkkkkkFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjl999999b07779000
EEEEEEEWWWcccccccKFFFFkkkkkFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000ljjjjjcdfhjjjjjjjjlaaaaa9b07777000
EEEEEEEWWWcccccccKFFFFkkkkkFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000ljjjjjcdfhjjjjjjjjlaaaaa9b07779000
EEEEEEEWWWcccccccKFFFFkkkkkFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000jjjjjjjjjjjjjjjjjjjaaaaa9907779000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjlaaaaa9b07779000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjlaaaaa9907779000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjlaaaaa9b07779000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjlaaaaa9b07779000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKJJJJJvvcWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjl999999b07779000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKvvvvvvvcWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjl999999b07777000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKccccccccWWWWEEE   0000007777000000jjjjjjjjjjjjjjjjjjjbbbb9bb07779000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKccccccccWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjl000000007779000
EEEEEEEWWWcccccccKFFFFFFFFFFFFFFFKKccccccccWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjl000000007779000
EEEEEEEWWWcccccccKKFFFFFFFFFFFFFFKKccccccccWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjl000000007779000
EEEEEEEWWWcccccccKKKKKKKKKKKKKKKKKKccccccccWWWWEEE   0000007777000000ljjjjjjjjjjjjjjjjjl000000007779000
EEEEEEEWWWccccccccccccnnnnnnnncccccccccccccWWWWEEE   0000007777000000llllljllllljlllllll000000007779000
EEEEEEEWWWccccccccccccnnnnnnnncccccccccccccWWWWEEE   00000077770000000000000000000000000000000007779000
EEEEEEEWWWccccccccccccnnnnnnnncccccccccccccWWWWEEE   00000077770000000000000000000000000000000007777000
EEEEEEEWWWccccccccccccnnnnnnnncccccccccccccWWWWEEE   00000077770000000000000000000000000000000007779000
EEEEEEEWWWccccccccccccnnnnnnnncccccccccccccWWWWEEE   00000077770000000000000000000000000000000007777000
EEEEEtMttMccccccccccccnnnnnnnnccccccccccccccWtMttt   000ffdffff000000000000000000000000000000000ffdffff
EEEEttttttccccccccccccnnnnnnnncccccccccccccttttttt   000fdddddf000000000000000000000000000000000fdddddd
EEEttttttttMWWWWWWWWMGGGGGGGGGGMWWWWWWWWWWtttttttt   000dddddddff77777777dddddddddbdd777777777ffddddddd
EEEEttttttttWWWWWWWWGGGGGGGGGGGGWWWWWWWWWWtttttttt   000fdddddddf77777777dbbbbbbbbbbd777777777fdddddddd
EEEtttttttttWWWWWWWWGGGGGGGGGGGGWWWWWWWWWWtttttttt   000ddddddddf77777777dbbbbbbbbbbd777777777fdddddddd
EEEEttttttttEEEEEEEEEErrrrrrrrEEEEEEEEEEEEtttttttt   000fdddddddf77777777dddddddddbdd777777777fdddddddd
EEEtttttttttEEEEEEEEEErrrrrrrrEEEEEEEEEEEEtttttttt   000ddddddddd00000000000000000000000000000ddddddddd
EEEEttttttttEEEEEEEEEErrrrrrrrEEEEEEEEEEEEtttttttt   000fdddddddf00000000000000000000000000000fdddddddd
EEEEtttttttEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEtttttttt   000ffdfdfdff00000000000000000000000000000fffffdfff
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.24 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 158 nodi, 886 passi, finito in 691 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba, m=magenta, i=sala del mastio, s=scala del mastio, K=muro del mastio, d=soglia del mastio, b=armeria, v=muro dell'armeria, u=varco dell'armeria, c=cortile, n=lastricato, Q=pozzo, W=cinta muraria, G=corpo di guardia, g=portone di guardia, t=torre d'angolo, r=strada, F=solaio di legno, f=intavolato, J=tetto in coppi, L=finestra, V=oliVe, Y=Yellow, T=Teal (marcatore), k=gradino di legno, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), O=porta di quercia, o=assi della porta, N=stipite in pietra, M=merlo, U=feritoia.
Alla fine: W 79660, K 72270, t 60549, o 11640, k 7840, E 7600, U 6977, v 6291, c 4950, G 4278, L 4240, F 3280, M 3018, i 1600, N 1360, J 764, n 500, r 500, b 375, O 360, Q 320, g 250, s 200, u 75, d 75, a 36.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-39 all×26, prl×1, one×5: 677 celle x1-28 y2-29 z0, passi 2-58
   #46 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 59
#48-49 all×2: 25600 celle x50-104 y50-99 z1-20, passi 60-79
    #50 all . K → K * passi=20: ×20, 16000 celle x50-104 y50-99 z21-40, passi 80-99, .→K 16000
#51-53 all×3: 30400 celle x50-104 y50-99 z1-64, passi 100-124
    #54 all . f → f . passi=31: ×31, 99200 celle x55-99 y55-94 z1-32, passi 125-155, f→. 49600, .→f 49600
    #55 all . f → f F passi=1: ×1, 3200 celle x55-99 y55-94 z32-33, passi 156, f→F 1600, .→f 1600
    #56 all . f → f . passi=31: ×31, 99200 celle x55-99 y55-94 z33-64, passi 157-187, f→. 49600, .→f 49600
#57-63 prl×1, all×6: 27000 celle x55-99 y55-94 z1-64, passi 188-252
#64-73 prl×3, all×7: 19775 celle x35-84 y55-99 z1-64, passi 253-384
#74-79 all×5, prl×1: 38314 celle x30-49 y50-84 z1-35, passi 385-451
    #80 all . W → W * passi=24: ×24, 78000 celle x15-134 y20-129 z1-24, passi 452-475, .→W 78000
    #81 all . t → t * passi=10: ×10, 18000 celle x5-144 y10-139 z1-10, passi 476-485, .→t 18000
    #82 all . t → t V passi=10: ×10, 36000 celle x5-144 y10-139 z10-20, passi 486-495, t→V 18000, .→t 18000
    #83 all . t → t * passi=24: ×24, 43200 celle x5-144 y10-139 z21-44, passi 496-519, .→t 43200
#84-88 all×5: 22206 celle x60-109 y35-129 z1-37, passi 520-597
#89-119 prl×5, all×9: 29310 celle x65-89 y55-129 z1-64, passi 598-696
#126-129 all×4: 24600 celle x50-90 y64-129 z1-31, passi 697-728
#135-157 all×8, prl×2, one×1: 17171 celle x5-144 y10-139 z8-70, passi 729-885
    #158 prl V → K: ×1, 36860 celle x5-144 y10-139 z8-51, passi 886, V→K 36860
Senza effetto (non hanno mai cambiato una cella):
#7 prl m/E → */m passi=1
#23 all cEEEEEEEE → *ccc***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#24 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#40 all cWWEEEEEE → ***aa**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#41 all [Wt]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#42 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#43 all [rp]/a → */p: in quel momento nella griglia non c'erano celle "a"
#44 all pa → *p passi=2: in quel momento nella griglia non c'erano celle "p", "a"
#91 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#92 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#93 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#94 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
… e altri 32
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

        <!-- Keep stair s (floor at z=0, T at z=1, slab at 32, roof slab at 64) -->
        <all in="B s" out="Y *" steps="1"/>
        <all in="B Y" out="Y T" symmetry="()" steps="1"/>
        <all in="B Y" out="Y B" steps="30"/>
        <all in="B Y" out="Y F" steps="1"/>
        <all in="B Y" out="Y B" steps="31"/>
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
