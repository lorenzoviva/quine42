# model.sculpt · claude-opus-5-5 · 55 s

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

The program you wrote:
<!--
FORTE. Parts and letters on the plan:
  h  floor of the keep (mastio): a body around H, 2 cells behind, 4 in front plus one by chance, 4 to each side
  w  the keep's walls, corners filled; d the keep's door in its front wall
  s  the stair zone, inside the keep along the back wall, with 2 cells of landing before it
  c  the courtyard around the keep, larger where the ground allows
  W  the curtain wall, a ring 2 cells thick; G the gatehouse on the axis of the keep's door
  t  the corner towers; u one tower, at a random corner, taller (the donjon of the watch)
  n  the paving, r the road to the front edge
  Q  the well, b the barracks against the ring (rotated by chance), a the moat beyond the ring
Seeds change: which corner holds the tall tower, where the well and the barracks stand, the keep's depth.
Sizes: 5x5 the keep in a thin yard with ring and towers; 7.5 the yard grows with well and barracks; 10 the moat too.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtudnGrmQba" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wa]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EWa]" out="*t"/><rule in="t*/*[EWa]" out="**/*t"/></all>
      <one in="t" out="u" steps="1"/>
      <all in="ut" out="*u"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/[Ea]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="ra" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*bbbbb*/*bbbbb*/*bbbbb*/*******/*******" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwscgtuDnGrqvbaPILfFRYZMOoNTkAJV#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qvvvq/qvvvq/qvvvq/qqqqq"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <sequence symmetry="(xy)">
        <!-- B. keep walls and its door -->
        <all in="B D" out="D O" steps="1"/>
        <all in="B w" out="w P" steps="1"/>
        <prl in="D" out="w"/>
        <all in="B w" out="w P" steps="5"/><all in="B w" out="w I" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w I" steps="14"/><all in="B w" out="w P" steps="13"/>
        <prl in="w" out="P"/>
        <!-- keep floors, stair strip, slab, roof platform -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- curtain, gatehouse, towers -->
        <all in="B g" out="g Y" steps="24"/><prl in="g" out="Y"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Z" steps="40"/><prl in="G" out="Z"/>
        <all in="B t" out="t Z" steps="40"/><prl in="t" out="Z"/>
        <all in="B u" out="u Z" steps="56"/><prl in="u" out="Z"/>
        <!-- barracks with a hip roof, the well -->
        <all in="B b" out="b A" steps="21"/><prl in="b" out="J"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="B q" out="q V" steps="6"/><prl in="q" out="V"/>
        <!-- C. windows of the keep -->
        <one steps="14"><rule in="BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I" out="P"/>
        <union symbol="+" values="PYZ"/>
        <union symbol="%" values="YZ"/>
        <union symbol="=" values="fF"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="c" value="b9ad7e" name="cortile" area="courtyard"/>
  <color symbol="f" value="9a7448" name="assito del mastio" area="keep"/>
  <color symbol="F" value="7a5a38" name="solaio"/>
  <color symbol="R" value="8c8a84" name="terrazza del mastio"/>
  <color symbol="P" value="a8a090" name="pietra del mastio"/>
  <color symbol="L" value="2e3440" name="finestra"/>
  <color symbol="Y" value="c2b8a0" name="mura di cinta"/>
  <color symbol="Z" value="7c766c" name="pietra delle torri" area="tower"/>
  <color symbol="M" value="9a9488" name="merli"/>
  <color symbol="U" value="1e1e24" name="feritoia"/>
  <color symbol="O" value="7a4a24" name="porta"/>
  <color symbol="o" value="4a2c14" name="assi della porta"/>
  <color symbol="N" value="3a2e24" name="stipiti"/>
  <color symbol="k" value="b08a5a" name="gradini"/>
  <color symbol="T" value="b08a5a" name="scala"/>
  <color symbol="A" value="c9b48a" name="muro della caserma" area="barracks"/>
  <color symbol="J" value="a0503a" name="tetto della caserma"/>
  <color symbol="V" value="8a8478" name="vera del pozzo"/>
  <color symbol="v" value="4f7fa6" name="acqua del pozzo"/>
  <color symbol="n" value="a39a88" name="selciato" area="courtyard"/>
  <color symbol="r" value="9c8358" name="strada"/>
  <color symbol="a" value="5a86a8" name="fossato"/>
  <color symbol="h" value="b8a88a" name="pavimento del mastio"/>
  <color symbol="w" value="8a8478" name="muro del mastio"/>
  <color symbol="s" value="a07850" name="zona della scala"/>
  <color symbol="W" value="9a9488" name="mura"/>
  <color symbol="t" value="7c766c" name="torre"/>
  <color symbol="u" value="6c665c" name="torre alta"/>
  <color symbol="d" value="6a4a2a" name="porta del mastio"/>
  <color symbol="G" value="6e685e" name="torre di porta"/>
  <color symbol="Q" value="4f7fa6" name="pozzo"/>
  <color symbol="b" value="a0503a" name="caserma"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Grande, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c cortile, n selciato, r strada, v acqua del pozzo, P pietra del mastio, L finestra, f assito del mastio, F solaio, R terrazza del mastio, Y mura di cinta, Z pietra delle torri, M merli, O porta, o assi della porta, N stipiti, k gradini, V vera del pozzo, U feritoia
Plan (the letter on top of every column):
```
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccVVVcccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccVvVcccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccVVccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRPPPcccYYYYYEE
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPMcccYYYYYEE
ZMZZMMZZMMcccccccccccccnnnnnnncccccccccccccMMZZMZZ
ZZZZZZZZZZcccccccccccccnnnnnnncccccccccccccZZZZZZZ
ZZZZZZZZZZcccccccccccccnnnnnnnccccccccccccZZZZZZZZ
ZZZZZZZZZZZZMYYYYYYYYYNZZZZZZZNYYYYYYYYYMZZZZZZZZZ
ZZZZZZZZZZZZMYYYYYYYYYNZZZZZZZNYYYYYYYYYMZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNZZZZZZZNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZYYYYYYYYYYNZZZZZZZNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZMYYYYYYYYYEMEMZZMMEYYYYYYYYYMZZZZZZZZZ
ZZZZZZZZZZZZZEEEEEEEEEEEErrrEEEEEEEEEEEEZZZZZZZZZZ
ZZZZZZZZZZZZZEEEEEEEEEEEErrrEEEEEEEEEEEEZZZZZZZZZZ
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00000000000000033300000000000000bbbbbb00
00000bbbbb00000000000000030300000000000000bbbbbb00
00000bbbbb00000000000000033300000000000000bbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00000000000000000000000000000000bbbbbb00
00000bbbbb00wwwtwwwtwwwtwwwwtwwwtwwwtwww00bbbbbb00
00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
00000bbbbb00wwwtwwwtwwwtwwwwtwwwtwwwtwww00bbbbbb00
sspssspsss00000000000000000000000000000000kkkikkii
ppppppppps00000000000000000000000000000000kiiiiiii
pppppppppppssbbbbbbbbblllillllbbbbbbbbbbkkiiiiiiii
ppppppppppppsbbbbbbbbbliiiiiilbbbbbbbbbbkiiiiiiiii
ppppppppppppsbbbbbbbbbiiiiiiiibbbbbbbbbbkiiiiiiiii
pppppppppppppbbbbbbbbbliiiiiilbbbbbbbbbbiiiiiiiiii
ppppppppppppsbbbbbbbbbliiiiiilbbbbbbbbbbkiiiiiiiii
ppppppppppppsbbbbbbbbbllllilllbbbbbbbbbbkiiiiiiiii
ppppppppppppp000000000000000000000000000iiiiiiiiii
ppppppppppppp000000000000000000000000000iiiiiiiiii
```
Front (looking from the front; the sky at the top):
```
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
.M..MM..MM.MPPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
MM.MMM.MMM.MMPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
MM.MMM.MMM.MMPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
ZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
ZZZZZZZZZZZZZPPPPPPPPPPLLLPPPPPPPPPPPPPP..........
ZZZZZZZZZZZZZPPPPPPPPPPLLLPPPPPPPPPPPPPP..........
ZZZZZZZZZZZZZPPPPPPPPPPMMMPMMMPPPPPPPPPPM..MM..M..
ZZZZZZZZZZZZZPPPPPPPPPPMMMPMMMPPPPPPPPPPMMMMM.MM..
ZZZZZZZZZZZZZPPPPPPPPPPMMMPMMMPPPPPPPPPPMMMMM.MM..
ZZZZZZZZZZZZZPPPPPPPPPPZZZZZZZPPPPPPPPPPZZZZZZZZZZ
ZZZZZZZZZZZZZPPPPPPPPPPZZZZZZZPPPPPPPPPPZZZZZZZZZZ
ZZZZZZZZZZZZZPPPPPPPPPPZZZZZZZPPPPPPPPPPZZZZZZZZZZ
ZZZZZZZZZZZZZPPPPPPPPPPZZZZZZZPPPPPPPPPPZZZZZZZZZZ
ZZZZZZZZZZZZZPPPPPPPPPPZZZZZZZPPPPPPPPPPZZZZZZZZZZ
ZZZZZZZZZZZZZPPPPPPPPPPNNNNNNNPPPPPPPPPPZZZZZZZZZZ
ZZZZZZZZZZZZZPPPPPPPPPNoooooooNPPPPPPPPPZZZZZZZZZZ
ZZZZZZZZZZZZZPPPPPPPPPNoooooooNPPPPPPPPPZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZEEEEEEEEEEEErroEEEEEEEEEEEEZZZZZZZZZZ
```
Right side (looking from the right):
```
.................MMM.MMM.MMM.MMM.MMM.MMM..........
.................MMM.MMM.MMM.MMM.MMM.MMM..........
.................MMM.MMM.MMM.MMM.MMM.MMM..........
.................PPPPPPPPPPPPPPPPPPPPPPP..........
.................PPPPPPPPPPPPPPPPPPPPPPPM..MM..M..
.................PPPPPPPPPPPPPPPPPPPPPPPMMMMM.MM..
.................PPPPPPPPPPPPPPPPPPPPPPPMMMMM.MM..
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPLLPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPLLLPLLLPZZZZZZZZZZ
.................PPPPPPPLLLPLLLLLLLPLLLPMZZMMMMMZZ
.................PPPLLLPLLLPLLLLLLLPLLLPMMZMMMMMZZ
.................PPPLLLPLLLPLLLLLLPPLLLPMMZMMMMMZZ
.................PPPLLLPLLLPLLLLLLPPPPPPZZZZZZZZZZ
.................PPPLLLPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
.................PPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYZZZZZZZZZZ
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZ
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY..
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY..
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY..
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY..
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY................................YYYYYY..
.....YYYYY...PPPLLLPPPPPPPPPPLLLPPPPPPPP..YYYYYY..
.....YYYYY..PPPPLLLPPPPPPPPPPLLLPPPPPPPP..YYYYYY..
.....YYYYY..PPPPLLLPPPPPPPPPPLLLPPPPPPPP..YYYYYY..
.....YYYYY..PPP.......kkkkkk.........PPP..YYYYYY..
.....YYYYY..PPP.......kkkkkk.........PPP..YYYYYY..
.....YYYYY..PPP.......kkkkkk.........PPP..YYYYYY..
.....YYYYY..PPP.......kkkkkk.........PPP..YYYYYY..
.....YYYYY..PPP.......kkkkkk.........PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPP......................PPP..YYYYYY..
.....YYYYY..PPPPPPPPPPNoOLLLooNLLLLPPPPP..YYYYYY..
.....YYYYY..PPPPPPPPPPNooLLLooNLPPLPPPPP..YYYYYY..
.....YYYYY..PPPPPPPPPPNoLLLLooNLPPLPPPPP..YYYYYY..
ZZZZZZZZZZ................................ZZZZZZZZ
ZZZZZZZZZZ................................ZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZYYYYYYYYYNoooooooNYYYYYYYYYZZZZZZZZZZ
ZZZZZZZZZZZZZ...........................ZZZZZZZZZZ
ZZZZZZZZZZZZZ...........................ZZZZZZZZZZ
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
.............LLLPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPLPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPLPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................PPP..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................PPP..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................LPP..........
............PPP......................LPL..........
............PPP......................LLL..........
............PPP......................PPP..........
............PPP......................LLL..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPLL..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
ZZZZZZZZZZ................................MMM..M..
ZZZZZZZZZZ........................................
ZZZZZZZZZZZZ...........MM..M.M..........M.........
ZZZZZZZZZZZZZ...........................M.........
ZZZZZZZZZZZZZ...........................M.........
ZZZZZZZZZZZZZ.........M......M....................
ZZZZZZZZZZZZZ.........M......M....................
ZZZZZZZZZZZZZ..........M.M..MM..........M.........
ZZZZZZZZZZZZZ.....................................
ZZZZZZZZZZZZZ.....................................
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
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYcccccccccccccJJJJJJJJJJJJccccccccYYYYYEE   00000bbbbb00000000000099999999999990000000bbbbbb00
EEEEEYYYYYcccccccccccccJJJJJJJJJJJJccccccccYYYYYEE   00000bbbbb0000000000009aaaaaaaaaaa90000000bbbbbb00
EEEEEYYYYYcccccccccccccJJJJJJJJJJJJccccccccYYYYYEE   00000bbbbb0000000000009aaaaaaaaaaa90000000bbbbbb00
EEEEEYYYYYcccccccccccccJJJJJJJJJJJJccccccccYYYYYEE   00000bbbbb0000000000009aabbbbbbbaa90000000bbbbbb00
EEEEEYYYYYcccccccccccccJJJJJJJJJJJJccccccccYYYYYEE   00000bbbbb0000000000009aabbbbbbbaa90000000bbbbbb00
EEEEEYYYYYccccccccVVcccJJJJJJJJJJJJccccccccYYYYYEE   00000bbbbb0000000333009aaaaaaaaaaa90000000bbbbbb00
EEEEEYYYYYccccccccvvcccJJJJJJJJJJJJccccccccYYYYYEE   00000bbbbb0000000303009aaaaaaaaaaa90000000bbbbbb00
EEEEEYYYYYccccccccVVcccJJJJJJJJJJJJccccccccYYYYYEE   00000bbbbb00000003330099999999999990000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00000000000000000000000000000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00000000000000000000000000000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00000000000000000000000000000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00000000000000000000000000000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00wwwtwwwtwwwtwwwwtwwwtwwwtwww00bbbbbb00
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE   00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE   00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRPPPcccYYYYYEE   00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE   00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPMcccYYYYYEE   00000bbbbb00wwwtwwwtwwwtwwwwtwwwtwwwtwww00bbbbbb00
ZMZZMMZZMMcccccccccccccnnnnnnncccccccccccccMMZZMZZ   sspssspsss00000000000000000000000000000000kkkikkii
ZZZZZZZZZZcccccccccccccnnnnnnncccccccccccccZZZZZZZ   ppppppppps00000000000000000000000000000000kiiiiiii
ZZZZZZZZZZcccccccccccccnnnnnnnccccccccccccZZZZZZZZ   pppppppppppssbbbbbbbbblllillllbbbbbbbbbbkkiiiiiiii
ZZZZZZZZZZZZMYYYYYYYYYNZZZZZZZNYYYYYYYYYMZZZZZZZZZ   ppppppppppppsbbbbbbbbbliiiiiilbbbbbbbbbbkiiiiiiiii
ZZZZZZZZZZZZMYYYYYYYYYNZZZZZZZNYYYYYYYYYMZZZZZZZZZ   ppppppppppppsbbbbbbbbbiiiiiiilbbbbbbbbbbkiiiiiiiii
ZZZZZZZZZZZZZYYYYYYYYYNZZZZZZZNYYYYYYYYYZZZZZZZZZZ   pppppppppppppbbbbbbbbbliiiiiiibbbbbbbbbbiiiiiiiiii
ZZZZZZZZZZZZYYYYYYYYYYNZZZZZZZNYYYYYYYYYZZZZZZZZZZ   ppppppppppppsbbbbbbbbbliiiiiilbbbbbbbbbbkiiiiiiiii
ZZZZZZZZZZZZMYYYYYYYYYEMEMZZMMEYYYYYYYYYMZZZZZZZZZ   ppppppppppppsbbbbbbbbbllllilllbbbbbbbbbbkiiiiiiiii
ZZZZZZZZZZZZZEEEEEEEEEEEErrrEEEEEEEEEEEEZZZZZZZZZZ   ppppppppppppp000000000000000000000000000iiiiiiiiii
ZZZZZZZZZZZZZEEEEEEEEEEEErrrEEEEEEEEEEEEZZZZZZZZZZ   ppppppppppppp000000000000000000000000000iiiiiiiiii
```
### Seed 3: plan and heights side by side
```
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   00000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00
EEEEEYYYYYccccccccccccccccccJJJJJJJJJJJJcccYYYYYEE   00000bbbbb00000000000000000999999999999900bbbbbb00
EEEEEYYYYYccccccccccccccccccJJJJJJJJJJJJcccYYYYYEE   00000bbbbb000000000000000009aaaaaaaaaaa900bbbbbb00
EEEEEYYYYYccccccccccccccccccJJJJJJJJJJJJcccYYYYYEE   00000bbbbb000000000000000009aaaaaaaaaaa900bbbbbb00
EEEEEYYYYYccccccccccccccccccJJJJJJJJJJJJcccYYYYYEE   00000bbbbb000000000000000009aabbbbbbbaa900bbbbbb00
EEEEEYYYYYccccccccccccccccccJJJJJJJJJJJJcccYYYYYEE   00000bbbbb000000000000000009aabbbbbbbaa900bbbbbb00
EEEEEYYYYYccccccccccVVVcccccJJJJJJJJJJJJcccYYYYYEE   00000bbbbb000000000033300009aaaaaaaaaaa900bbbbbb00
EEEEEYYYYYccccccccccVvVcccccJJJJJJJJJJJJcccYYYYYEE   00000bbbbb000000000030300009aaaaaaaaaaa900bbbbbb00
EEEEEYYYYYccccccccccVVccccccJJJJJJJJJJJJcccYYYYYEE   00000bbbbb00000000003330000999999999999900bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00000000000000000000000000000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00000000000000000000000000000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00000000000000000000000000000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00000000000000000000000000000000bbbbbb00
EEEEEYYYYYcccccccccccccccccccccccccccccccccYYYYYEE   00000bbbbb00wwwtwwwtwwwtwwwwtwwwtwwwtwww00bbbbbb00
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE   00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE   00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00wttssssssssssssssssssssssttw00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRRPPcccYYYYYEE   00000bbbbb00tttssssssssssssssssssssssttt00bbbbbb00
EEEEEYYYYYcccPPRRRRRRRRRRRRRRRRRRRRRRPPPcccYYYYYEE   00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccYYYYYEE   00000bbbbb00wttttttttttttttttttttttttttw00bbbbbb00
EEEEEYYYYYcccPPPPPPPPPPPPPPPPPPPPPPPPPPMcccYYYYYEE   00000bbbbb00wwwtwwwtwwwtwwwwtwwwtwwwtwww00bbbbbb00
ZMZZMMZZMMcccccccccccccnnnnnnncccccccccccccMMZZMZZ   sspssspsss00000000000000000000000000000000kkkikkii
ZZZZZZZZZZcccccccccccccnnnnnnncccccccccccccZZZZZZZ   ppppppppps00000000000000000000000000000000kiiiiiii
ZZZZZZZZZZcccccccccccccnnnnnnnccccccccccccZZZZZZZZ   pppppppppppssbbbbbbbbbllllilllbbbbbbbbbbkkiiiiiiii
ZZZZZZZZZZZZMYYYYYYYYYNZZZZZZZNYYYYYYYYYMZZZZZZZZZ   ppppppppppppsbbbbbbbbbliiiiiilbbbbbbbbbbkiiiiiiiii
ZZZZZZZZZZZZMYYYYYYYYYNZZZZZZZNYYYYYYYYYMZZZZZZZZZ   ppppppppppppsbbbbbbbbbliiiiiilbbbbbbbbbbkiiiiiiiii
ZZZZZZZZZZZZZYYYYYYYYYNZZZZZZZNYYYYYYYYYZZZZZZZZZZ   pppppppppppppbbbbbbbbbiiiiiiiibbbbbbbbbbiiiiiiiiii
ZZZZZZZZZZZZYYYYYYYYYYNZZZZZZZNYYYYYYYYYZZZZZZZZZZ   ppppppppppppsbbbbbbbbbliiiiiilbbbbbbbbbbkiiiiiiiii
ZZZZZZZZZZZZMYYYYYYYYYEMMZrMEMEYYYYYYYYYMZZZZZZZZZ   ppppppppppppsbbbbbbbbblllillllbbbbbbbbbbkiiiiiiiii
ZZZZZZZZZZZZZEEEEEEEEEEEErrrEEEEEEEEEEEEZZZZZZZZZZ   ppppppppppppp000000000000000000000000000iiiiiiiiii
ZZZZZZZZZZZZZEEEEEEEEEEEErrrEEEEEEEEEEEEZZZZZZZZZZ   ppppppppppppp000000000000000000000000000iiiiiiiiii
```
How much the plans of the seeds differ: 0.06 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 144 nodi, 565 passi, finito in 422 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=pavimento del mastio, w=muro del mastio, s=zona della scala, c=cortile, W=mura, t=torre, u=torre alta, d=porta del mastio, n=selciato, G=torre di porta, r=strada, m=magenta, Q=pozzo, g=green, D=Dead, Dark, q=aqua, P=pietra del mastio, I=Indigo (marcatore), L=finestra, f=assito del mastio, F=solaio, R=terrazza del mastio, Y=mura di cinta, Z=pietra delle torri, M=merli, O=porta, o=assi della porta, N=stipiti, T=scala, k=gradini, V=vera del pozzo, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), U=feritoia.
Alla fine: Y 65750, P 54565, Z 43290, o 5830, k 2720, L 2720, c 2300, f 1575, R 1575, E 1450, F 1415, M 1230, N 1115, U 810, O 320, V 112, n 75, r 25, v 9.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-40 all×24, one×3, prl×1: 406 celle x0-19 y0-19 z0, passi 2-44
   #43 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 45
#45-49 all×4, prl×1: 36075 celle x25-79 y35-79 z0-20, passi 46-67
#50-51 all×2: 32400 celle x25-79 y35-79 z20-38, passi 68-85
    #52 all . w → w I passi=14: ×14, 25200 celle x25-79 y35-79 z38-52, passi 86-99, w→I 12600, .→w 12600
#53-56 all×3, prl×1: 27850 celle x25-79 y35-79 z0-65, passi 100-115
    #57 all . h → h . passi=31: ×31, 85250 celle x30-74 y40-74 z1-32, passi 116-146, h→. 42625, .→h 42625
#58-59 all×2: 15150 celle x30-74 y40-74 z2-33, passi 147-177
    #60 all . h → h . (+1) passi=31: ×31, 97650 celle x30-74 y40-74 z33-64, passi 178-208, h→. 42625, .→h 42625, s→. 6200, .→s 6200
      r1 . h → h . ×42625; r2 . s → s . ×6200
    #61 prl h → R (+1): ×1, 1575 celle x30-74 y40-74 z64, passi 209, h→R 1375, s→R 200
      r1 h → R ×1375; r2 s → R ×200
    #62 all . g → g Y passi=24: ×24, 127200 celle x10-94 y0-94 z0-24, passi 210-233, g→Y 63600, .→g 63600
#63-66 prl×2, all×2: 15100 celle x10-94 y0-94 z0-41, passi 234-276
#67-68 all×1, prl×1: 30375 celle x80-99 y80-99 z0-40, passi 277-317
    #69 all . u → u Z passi=56: ×56, 53200 celle x0-24 y80-99 z0-56, passi 318-373, u→Z 26600, .→u 26600
#70-78 prl×3, all×2, one×1: 25883 celle x0-79 y20-99 z0-56, passi 374-397
#84-144 all×20, prl×6: 30614 celle x0-99 y0-99 z0-71, passi 398-565
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#15 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#16 all cEEEEEEE → *ccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#17 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all cWWEEEEE → ***aa*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#23 all [Wa]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#24 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#38 all ra → *r passi=1: in quel momento nella griglia non c'erano celle "a"
#41 one WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc → *******/*bbbbb*/*bbbbb*/*bbbbb*/*******/******* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#71 all . b → b A passi=21: in quel momento nella griglia non c'erano celle "b"
#72 prl b → J: in quel momento nella griglia non c'erano celle "b"
#73 all *****/*****/**.**/*****/***** **J**/**J**/JJJJJ… → *****/*****/**J**/*****/***** *****/*****/*****… passi=10: in quel momento nella griglia non c'erano celle "J"
… e altri 36
Fix it and answer with the whole program.

## Risposta

```xml
<!--
FORTE. Parts and letters on the plan:
  h  floor of the keep (mastio): a body around H, 3 cells behind, 5 in front plus one by chance, 4 to each side
  w  the keep's walls, corners filled; d the keep's door in its front wall
  s  the stair zone, inside the keep along the back wall, with 2 cells of landing before it
  c  the courtyard around the keep, larger where the ground allows
  W  the curtain wall, a ring 2 cells thick; G the gatehouse on the axis of the keep's door
  t  the corner towers; u one tower, at a random corner, taller (the donjon of the watch)
  n  the paving, r the road to the front edge
  Q  the well, b the barracks against the ring, a the moat beyond the ring
Seeds change: which corner holds the tall tower, where the stair, the well and the barracks stand, the keep's depth.
Sizes: 5x5 the keep in a thin yard with ring and towers; 7.5 the yard grows with well and barracks; 10 the moat too.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtudnGrmQba" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wa]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EWa]" out="*t"/><rule in="t*/*[EWa]" out="**/*t"/></all>
      <one in="t" out="u" steps="1"/>
      <all in="ut" out="*u"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/[Ea]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="ra" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*bbbbb*/*bbbbb*/*bbbbb*/*******/*******" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwscgtuDnGrqvbaPILfFRYZMOoNTkAJV#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qvvvq/qvvvq/qvvvq/qqqqq"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <sequence symmetry="(xy)">
        <all in="B D" out="D O" steps="1"/>
        <all in="B w" out="w P" steps="1"/>
        <prl in="D" out="w"/>
        <all in="B w" out="w P" steps="5"/><all in="B w" out="w I" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w I" steps="14"/><all in="B w" out="w P" steps="13"/>
        <prl in="w" out="P"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <all in="B g" out="g Y" steps="24"/><prl in="g" out="Y"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Z" steps="40"/><prl in="G" out="Z"/>
        <all in="B t" out="t Z" steps="40"/><prl in="t" out="Z"/>
        <all in="B u" out="u Z" steps="56"/><prl in="u" out="Z"/>
        <all in="B b" out="b A" steps="21"/><prl in="b" out="J"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="B q" out="q V" steps="6"/><prl in="q" out="V"/>
        <one steps="14"><rule in="BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I" out="P"/>
        <union symbol="+" values="PYZ"/>
        <union symbol="%" values="YZ"/>
        <union symbol="=" values="fF"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="c" value="b9ad7e" name="cortile" area="courtyard"/>
  <color symbol="f" value="9a7448" name="assito del mastio" area="keep"/>
  <color symbol="F" value="7a5a38" name="solaio"/>
  <color symbol="R" value="8c8a84" name="terrazza del mastio"/>
  <color symbol="P" value="a8a090" name="pietra del mastio"/>
  <color symbol="L" value="2e3440" name="finestra"/>
  <color symbol="Y" value="c2b8a0" name="mura di cinta"/>
  <color symbol="Z" value="7c766c" name="pietra delle torri" area="tower"/>
  <color symbol="M" value="9a9488" name="merli"/>
  <color symbol="U" value="1e1e24" name="feritoia"/>
  <color symbol="O" value="7a4a24" name="porta"/>
  <color symbol="o" value="4a2c14" name="assi della porta"/>
  <color symbol="N" value="3a2e24" name="stipiti"/>
  <color symbol="k" value="b08a5a" name="gradini"/>
  <color symbol="T" value="b08a5a" name="scala"/>
  <color symbol="A" value="c9b48a" name="muro della caserma" area="barracks"/>
  <color symbol="J" value="a0503a" name="tetto della caserma"/>
  <color symbol="V" value="8a8478" name="vera del pozzo"/>
  <color symbol="v" value="4f7fa6" name="acqua del pozzo"/>
  <color symbol="n" value="a39a88" name="selciato" area="courtyard"/>
  <color symbol="r" value="9c8358" name="strada"/>
  <color symbol="a" value="5a86a8" name="fossato"/>
  <color symbol="h" value="b8a88a" name="pavimento del mastio"/>
  <color symbol="w" value="8a8478" name="muro del mastio"/>
  <color symbol="s" value="a07850" name="zona della scala"/>
  <color symbol="W" value="9a9488" name="mura"/>
  <color symbol="t" value="7c766c" name="torre"/>
  <color symbol="u" value="6c665c" name="torre alta"/>
  <color symbol="d" value="6a4a2a" name="porta del mastio"/>
  <color symbol="G" value="6e685e" name="torre di porta"/>
  <color symbol="Q" value="4f7fa6" name="pozzo"/>
  <color symbol="b" value="a0503a" name="caserma"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
