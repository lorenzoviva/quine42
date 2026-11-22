# model.sculpt · correzione · gemini-4-argon · 35 s · 26307 token d'ingresso (0 in cache), 4844 d'uscita, 0 di ragionamento · $0.10

## Richiesta

Sculpt: rocca di confine
What it looks like: rocca di confine: a building one enters, with the door at the front, with a cellar under it
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.
It has a cellar under it: the box goes 20 voxels (1.25 tiles) under the soil, which the kernel writes at z=20; z=0 to 19 are under the ground. Dig it with part-cellar: mark D under the floor of a room on the soil, away from the door and from the foot of the stair, then include part-cellar after the floors rise and before part-stair, and give D, V and k your colours. The cellar must hold: a body goes down to it on foot from the door, and every floor down there is reached; if it does not, the building comes in without it.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<!--
  Concept: rocca di confine (border stronghold / keep with cellar, bastion tower, lean-to, and outer bailey at Huge).
  Parts & plan letters:
    h, g: main keep interior (two storeys + battlemented roof terrace; 'g' is the back half where the cellar D is dug, 'h' is the front half near the door).
    s: stair zone inside the main keep (climbs along x, away from the cellar hatch).
    w: keep stone walls.
    a, v: tall corner/side bastion tower (a = interior, v = tower wall) attached to the keep, varying in position and depth by seed.
    p: wooden lean-to / armory shelter against the opposite side of the keep.
    d: main front door (3 cells = 15 voxels wide) facing the front road.
    c, l: paved/flagstone bailey courtyard around the keep (grows larger where ground permits at Huge).
    m: outer curtain wall enclosing the bailey at Huge (only where space around the courtyard allows).
    t: corner watch-turrets on the outer curtain wall at Huge.
    G: outer gatehouse on the front axis through the curtain wall.
    r: paved road from the front door (and gatehouse) straight to the front edge of the box.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhgswavpdclmtGrz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- Keep center line: 4 cells behind H, 3-4 cells in front of H (total 8-9 cells deep = 40-45 voxels, 9 cells wide = 45 voxels) -->
      <all in="E/[Hh]" out="h/*" steps="4"/>
      <all in="H/E" out="*/z" steps="1"/>
      <all in="z/E" out="*/z" steps="2"/>
      <prl in="z/E" out="*/z" p="0.5" steps="1"/>
      <all in="[Hhz]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls -->
      <all in="[Hhz]E" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Front door 'd' on the front wall directly in front of the center line 'z' -->
      <all in="z/w" out="*/d"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="z" out="h"/>
      <prl in="H" out="h"/>

      <!-- Split keep floor into back zone 'g' (3 rows = 15 voxels deep, 45 voxels wide for cellar D) and front zone 'h' (25-30 voxels deep) -->
      <all in="w/h" out="*/g" steps="1"/>
      <all in="g/h" out="*/g" steps="2"/>

      <!-- Stair zone 's' in the front hall 'h' along the right side of the front wall (4 cells along x, 2 along y, with 25 voxels landing to its left) -->
      <all in="hhhhhhhhh/hhhhhhhhh/wwwdddwww" out="*****ssss/*****ssss/*********" steps="1"/>

      <!-- Attached bastion tower ('a' interior, 'v' wall) on one side of the keep, varied by seed -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <prl in="aE" out="*a" p="0.5" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" steps="1"/>
      <all in="a/E" out="*/a" steps="1"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>

      <!-- Lean-to shelter ('p') on the available side wall (4 cells along y = 20 voxels, 4 cells along x = 20 voxels) -->
      <one in="wEEE/wEEE/wEEE/wEEE/wEEE/wEEE" out="****/*ppp/*ppp/*ppp/*ppp/****" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- Inner courtyard ring around the keep, tower, and lean-to -->
      <all in="[wvpd]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- At Huge/Gargantuan, where at least 5 cells of free ground remain beyond 'c', expand courtyard and build outer curtain wall 'm' -->
      <all in="cEEEEE" out="*cc***" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEEE" out="*mEE" symmetry="(xy)" steps="1"/>
      <all in="mE/*m" out="*m/**" symmetry="(xy)"/>

      <!-- Outer corner turrets 't' on outer corners of 'm' -->
      <all in="EE/Em" out="**/*t" symmetry="(xy)"/>
      <all steps="1" symmetry="(xy)">
        <rule in="t[Em]" out="*t"/>
        <rule in="t*/*[Em]" out="**/*t"/>
      </all>

      <!-- Front path from 'd', outer gatehouse 'G', and road 'r' to the front edge -->
      <all in="[dr]/c" out="*/r"/>
      <all in="r/m" out="*/G"/>
      <all in="G/m" out="*/G"/>
      <all in="Gm" out="*G" symmetry="(x)" steps="1"/>
      <all in="[drG]/E" out="*/r"/>

      <!-- Courtyard paving texture -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>ccll/ccll/llcc/llcc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhgswavpdclmtGrfFWVJLYKPbqDRQTCUuOMNo#20#21Tk#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="()">
        <!-- Unions for the included seed parts -->
        <union symbol="+" values="WVJ"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="WVJ"/>

        <!-- Mark cellar D on the layer just under the soil (z=19) beneath 'g' -->
        <all in="g B" out="* D"/>

        <!-- B. Heights: columns by steps -->
        <!-- Main keep walls 'w' (becomes W) and door wall 'd' (becomes W): 2 storeys (64 high) + roof slab level (65 high) with window bands Y -->
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Y"/></all>
        <all steps="12"><rule in="B d" out="d W"/></all>
        <all steps="20"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Y"/><rule in="B d" out="d Y"/></all>
        <all steps="13"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="W"/><rule in="d" out="W"/></prl>

        <!-- Keep interior 'h', 'g', and stair zone 's': floor at z=20, slab at z=52, roof terrace slab at z=84 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B g" out="g f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- First flight of stairs strip T at z=21 -->
        <all in="B s" out="s T" steps="1"/>
        <all steps="30"><rule in="B s" out="s B"/></all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B g" out="g B"/>
        </all>
        <!-- Second storey slab at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B g" out="g F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B g" out="g B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Roof terrace slab at z=84 -->
        <all steps="1">
          <rule in="B h" out="h R"/>
          <rule in="B g" out="g R"/>
          <rule in="B s" out="s R"/>
        </all>
        <prl><rule in="h" out="B"/><rule in="g" out="B"/><rule in="s" out="B"/></prl>

        <!-- Bastion tower walls 'v': 77 high (taller than keep) with window bands -->
        <all in="B v" out="v V" steps="10"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v V" steps="22"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v V" steps="25"/>
        <prl in="v" out="V"/>

        <!-- Bastion tower interior 'a': floor at z=20, slab at z=52, upper roof at z=84 -->
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a R" steps="1"/>
        <prl in="a" out="B"/>

        <!-- Lean-to shelter 'p' and posts 'b': floor at z=20, posts rise 32, roof Q at z=53 (32 clear height >= 30 required) -->
        <all in="B p" out="q f" steps="1"/>
        <all in="B q" out="q B" steps="32"/>
        <all in="B q" out="q Q" steps="1"/>
        <prl in="q" out="B"/>
        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b P" steps="32"/>
        <all in="B b" out="b Q" steps="1"/>
        <prl in="b" out="B"/>
        <!-- Hollow inner posts so only outer corner/edge posts remain -->
        <all in="fPPP/fPPP" out="fBBB/fBBB" symmetry="(xy)"/>
        <all in="BPPP/BPPP" out="BBBB/BBBB" symmetry="(xy)"/>

        <!-- Outer curtain wall 'm' (24 high), corner turrets 't' (36 high), gatehouse 'G' (42 high) -->
        <all in="B m" out="m J" steps="24"/>
        <prl in="m" out="J"/>
        <all in="B t" out="t V" steps="36"/>
        <prl in="t" out="V"/>
        <all in="B G" out="G V" steps="42"/>
        <prl in="G" out="V"/>

        <!-- C. Full scale: doors, cellar, stairs, battlements, slits, windows, details -->
        <!-- Front keep door seed 'O' where road 'r' meets front wall 'W' at z=20 -->
        <all in="W/r" out="O/*" steps="1"/>
        <all in="W/O" out="O/*" steps="4"/>

        <!-- Outer gatehouse archway 'O' where road 'r' meets gatehouse 'V' at z=20 -->
        <all in="V/r" out="O/*" steps="1"/>
        <all in="V/O" out="O/*" steps="9"/>

        <!-- Internal doorway between keep ('f'/'F') and bastion tower ('f'/'F') through wall 'W'/'V' at z=20 and z=52 -->
        <one in="f/W/W/W/W/W/V/V/V/V/V/f" out="*/O/O/O/O/O/O/O/O/O/O/*" symmetry="(xy)" steps="1"/>
        <all in="O[WV]" out="OO" symmetry="(xy)" steps="5"/>
        <one in="F/W/W/W/W/W/V/V/V/V/V/F" out="*/O/O/O/O/O/O/O/O/O/O/*" symmetry="(xy)" steps="1"/>
        <all in="O[WV]" out="OO" symmetry="(xy)" steps="5"/>

        <!-- Doors -->
        <import file="part-door"/>

        <!-- Cellar under 'g' -->
        <import file="part-cellar"/>

        <!-- Stairs between ground floor and second floor -->
        <import file="part-stair"/>

        <!-- Battlements and arrow slits on keep, tower, curtain wall, turrets, and gatehouse -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the window bands 'Y' on all sides -->
        <one steps="18" symmetry="(xy)">
          <rule in="BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LYYYYB" out="*LLLL*" symmetry="(xy)"/>
        <prl in="Y" out="W"/>

        <!-- Lean-to sloped wooden roof extension -->
        <all in="Q B" out="* Q" steps="1"/>
        <all in="WQ B*" out="** *Q" symmetry="(xy)" steps="2"/>

        <!-- Stone chimney on the keep roof -->
        <one in="R B" out="* K" steps="1"/>
        <all in="K/R" out="*/K" symmetry="(xy)" steps="2"/>
        <all in="K B" out="* K" steps="14"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon style with clear contrast and distinct materials -->
  <color symbol="E" value="#6b7a4f" name="terreno" hidden="True"/>
  <color symbol="c" value="#968e7e" name="cortile" area="courtyard"/>
  <color symbol="l" value="#827a6a" name="lastricato" area="courtyard"/>
  <color symbol="r" value="#787062" name="strada" area="yard"/>
  <color symbol="f" value="#b8986c" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="#a6865a" name="solaio in legno" area="keep"/>
  <color symbol="R" value="#7e7870" name="terrazza" area="keep"/>
  <color symbol="W" value="#9a9488" name="muro del mastio" area="keep"/>
  <color symbol="V" value="#7c766c" name="muro di torre" area="tower"/>
  <color symbol="J" value="#888278" name="cinta muraria" area="courtyard"/>
  <color symbol="M" value="#8e887c" name="merlatura" area="keep"/>
  <color symbol="U" value="#2a2826" name="feritoia" area="keep"/>
  <color symbol="L" value="#384452" name="finestra" area="keep"/>
  <color symbol="P" value="#684a32" name="pilastro in legno" area="yard"/>
  <color symbol="Q" value="#9e4834" name="tetto della tettoia" area="yard"/>
  <color symbol="K" value="#645e58" name="camino in pietra" area="keep"/>
  <color symbol="O" value="#6e482c" name="portone" area="keep"/>
  <color symbol="o" value="#4e321c" name="assi del portone" area="keep"/>
  <color symbol="N" value="#5e5850" name="stipite in pietra" area="keep"/>
  <color symbol="k" value="#8c6e46" name="gradino" area="keep"/>
  <color symbol="T" value="#8c6e46" name="scala" area="keep"/>
  <color symbol="D" value="#625a50" name="pavimento della cantina" area="keep"/>
  <color symbol="#20" value="#6e482c" name="portone aperto" hidden="True"/>
  <color symbol="#21" value="#4e321c" name="assi aperte" hidden="True"/>

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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); cantina: dalla porta non si scende in cantina — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, c cortile, l lastricato, r strada, f pavimento in legno, F solaio in legno, W muro del mastio, V muro di torre, J cinta muraria, L finestra, K camino in pietra, P pilastro in legno, D pavimento della cantina, R terrazza, Q tetto della tettoia, U feritoia, O portone, M merlatura, N stipite in pietra, o assi del portone, k gradino
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEVVVVVVV
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEVVVVVVV
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJcMMVcVVV
lllllllllllllllllllllllllccccclllllcccccccccccccVV
lllllllllllllllllllllllllccccclllllcccccccccccccVV
lllllllllllllllllllllllllccccclllllcccccMMVVMcccEE
lllllllllllllllllllllllllccccclllllcccccMVVVVcccEE
lllllllllllllllllllllllllccccclllllcccccMRVVVcccEE
lllccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRVVcccEE
lllccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWMRRRVVcccEE
lllccccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllccccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllcccccccccMWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRMMRRRVVlllEE
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWRRRVVlllEE
lllQQQQQQQQQMWWRRRRRRRRRRRRRRRRRRRRRRRWWRRVVVllEEE
cccllllllllllWWRRRRRRRRRRRRRRRRRRRRRRRWWMVVVVcccEE
cccllllllllllWWRRRRRRRRRRRRRRRRRRRRRRRWWMVVVMcccEE
cccllccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWccccccccEE
cccllccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWccccccccEE
cccllccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWccccccccEE
cccccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWccccccccEE
cccccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWccccccccEE
cccccccccclllWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccccEE
cccccccccclllWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccccEE
cccccccccclllMMWlMMWcMMWrMrMWrMMWlMMWcMMccccccccEE
ccccccccccccclllllllcccrrrrrrrcccllcccccccccccccVV
ccccccccccccclllllllcccrrrrrrrcccllcccccccccccccVV
JJJJJJJJJJJJJJJJJJJJMMVVMVVMVVMMMJJJJJJJJJJMMVVVVV
JJJJJJJJJJJJJJJJJJJJMVVVVVVVVVVVMJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJEMMrVMrVMrVMMMJJJJJJJJJJVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
777777777777777777777777777777777777777777mmmkmmkk
777777777777777777777777777777777777777777mkkkkkkk
777777777777777777777777777777777777777777kkkkkkkk
ggggggggggggggggggggggggggggggggggggggggggmkkkkkkk
ggggggggggggggggggggggggggggggggggggggggggmkkkkkkk
ggggggggggggggggggggggggggggggggggggggggggmmmkmmkk
77777777777777777777777777777777777777777777777mkk
77777777777777777777777777777777777777777777777mmk
7777777777777777777777777777777777777777zzzyz77777
7777777777777777777777777777777777777777zyyyz77777
777777777777wwwuwwwuwwwuwwwwuwwwuwwwuwwwzzyyz77777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwuuyyy77777
777777777777wuuwuwwwuwwwuwwwuwwwuwwwuwwwuuyyz77777
777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77777
77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyy77777
77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77777
77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77777
77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77777
77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77777
77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyy77777
77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77777
77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77777
77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwwwuuyyz77777
77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuwuwuuyyy77777
77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwuuzzyyz77777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyyz77777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuwuuzyzzz77777
777777777777uuuuuuuuuuuuuuuuuuuuuuuuuwuu7777777777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuwuu7777777777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuwuw7777777777
777777777777uuuuuuuuuuuuuuuuuuuuuuuuuwuu7777777777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
777777777777wwwuwwwuwwwuwwwwuwwwuwwwuwww7777777mmk
77777777777777777777777777777777777777777777777mkk
77777777777777777777777777777777777777777777777kkk
ggggggggggggggggggggooomoomoomooogggggggggmmmkmmkk
ggggggggggggggggggggommmmmmmmmmmogggggggggmkkkkkkk
ggggggggggggggggggggooomoomoomooogggggggggmkkkkkkk
777777777777777777777777777777777777777777kkkkkkkk
777777777777777777777777777777777777777777mmmkmmkk
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
```
Front (looking from the front; the sky at the top):
```
........................................MMMMM.....
........................................VVVVV.....
........................................VVVVV.....
........................................VVVVV.....
............MMMMMMMMMMMMMMMM.MMM.MMM.MMMVVVVV.....
............MMMMMMMMMMMMMMMM.MMM.MMM.MMMVVVVV.....
............MMMMMMMMMMMMMMMM.MMM.MMM.MMMVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............LLLLLLWWLLWWWWWWWWWWLLWWWWWWWWWWW.....
............LLLLLLWWMMWWMWWMWWMMLLWWWWWWWWWWW.....
............LLLLLLWWMMMWMMWMMWMMMLWWWWWWWWWWW.....
............WWWWWWWWMMMWMMWMMWMMMWWWWWWWWWWWW.....
............WWWWWWWWVVVVVVVVVVVVWWWWWWWWWWWMM..MM.
............WWWWWWWWVVVVVVVVVVVVVWWWWWWWVVVMM.MMM.
............WWWWWWWWVUVVVVVVVVVUVWWWWWWWVVVMM.MMM.
............WWWWWWWWVUVVVVVVVVVUVWWWWWWWVVVVVVVVVV
............WWWWWWWWVVVVVVVVVVVVVWWWWWWWVVVVVVVVVV
..QQQQQQQQQQQWWWWWWWVVVVVVVVVVVVVWWWWWWWVVVVVVVVVV
...PPPP.PP.PWWWWWWWWNNNNNNNNNNNNWWWWWWWWVVVVVVVVVV
...PPPP.PPPPWWWWWWWWOoooooooooooOWWWWWWWVVVVVVVVVV
...PPPP.PPPPWWWWWWWWOoooooooooooOWWWWWWWVVVVVVVVVV
JJJJJJJJJJJJJJJJJJJWOoooooooooooOJJJJJJJJJVVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJJVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............DDDDDDDDDDDDDDDDDDDDDDD............
```
Right side (looking from the right):
```
..........MMM.MMM.MMMM.MMM.MMM....................
..........VVVVVVVVVVVVVVVVVVVV....................
..........VUVVVUVVVVVVVVVVVVVV....................
..........VUVVVUVVVVVVVVVVVVVV....................
..........VUVVVUVVVVVVVVVVVVVVMMMMMMMM............
..........VVVVVVVVVVVVVVVVVVVVMMMMMMMM............
..........VVVVVVVVVVVVVVVVVVVVMMMMMMMM............
..........VVVVVVVVVVVVVVVVVVVVWWWWWWWW............
..........VVVVVVVVVVVVVVVVVVVVUWWWWWUW............
..........VVVVVVVVVVVVVVVVVVVVUWWWWWUW............
..........VVVVVVVVVVVVVVVVVVVVUWWWWWUW............
..........VVVVVVVVVVVVVVVVVVVVWWWWWWWW............
..........VVVVVVVVVVVVVVVVVVVVWWWWWWWW............
..........VVVVVVVVVVVVVVVVVVVVWWWWWWWW............
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWW............
..........WWWWWWWLLWWWWWWWWWWWWWWWWWWW..MM........
..........WWWWWWWLLWWWWWWWWWWWWWWWWWWW..MMM.......
..........WWWWWWWLLWWWWWWWWWWWWWWWWWWW..MMM.......
.....MM..MWWWWWWWWWWWWWWWWWWWWWWWWWWWWM.MMM.M.....
..MM.MMMMMVVVVVVVVVVVVVVVVVVVVWWWWWWWWM.MMM.M.....
..MM.MMMMMVVVVVVVVVVVVVVVVVVVVWWWWWWWWM.MMM.M.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVUVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVUVVV.....
..VVVVUVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVUVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVWWLLWWWWWWWWWWWWWWWWWWWWWLLWVVVVVVV.....
..VVVVVVVVWWLLWWWWWWWWWWWWWWWWWWWWWLLWVVVVVVV.....
..VVVVVVVVWWLLWWWWWWWWWWWWWWWWWWWWWLLWVVVVVVV.....
..VVVVVVVVWWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVVVV.....
..VVVVVVVVWWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVV.....
EEVVVVVVVVEEEEEEEEEEEEEEEEEEEEEEEEEEEVVVVVVVVEEEEE
...............VVVVVVVV...........................
...............VVVVVVVV...........................
...............VVVVVVVV...........................
...............VVVVVVVV...........................
...............VVVVVVVV...........................
...............VVVVVVVV...........................
...............VVVVVVVV...........................
...............VVVVVVVV...........................
...............VVVVVVVV...........................
...............DDDDDDDD...........................
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
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
...............VVVVVVVVVVVVVVVVVVVVVVV............
...............V..........kkkkkkk...VV............
...............V..........kkkkkkkk..VV............
...............V..........kkkkkkkk..VV............
...............V..........kkkkkkkk..VV............
...............V..........kkkkkkkk..VV............
...............VVVVVVVVVVVkkkkkkkVVVVV............
...............VVVVVVVVVVVVVVVVVVVVVV.............
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
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
...........................................VVVVVVV
..........................................VVVVVVVV
..........................................VVVVVVVV
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJVVVVVVV
...............................................VVV
...............................................VVV
........................................VVVVV.....
........................................VVVVV.....
.............WWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..VVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
......P.P.P.WWW...........................VVV.....
...P........WWW...........................VVV.....
......P.P...WWW...........................VVV.....
....P......PWWW...........................VVV.....
............WWW...........................VVV.....
...P..P.P...WWW...........................VVV.....
...........PWWW...........................VVV.....
............WWW......................WWW..VVV.....
...P..P..PP.WWW......................WWW..VVV.....
............WWW......................WWWVVVVV.....
............WWW......................WWWVVVVV.....
............WWW......................WWWVVVVV.....
............WWW..................kkk.WWW..........
............WWW..................kkk.WWW..........
............WWW..................kkk.WWW..........
............WWW..................kkk.WWW..........
............WWW..................kkk.WWW..........
............WWWWWWWWWWNoooooooNWWWWWWWWW..........
............WWWWWWWWWWNoooooooNWWWWWWWWW..........
.............WWWWWWWWWNoooooooNWWWWWWWWW........VV
...............................................VVV
...............................................VVV
JJJJJJJJJJJJJJJJJJJJooooooooooooNJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJoooooooooooooJJJJJJJJJJVVVVVVV
JJJJJJJJJJJJJJJJJJJJOoooooooooooOJJJJJJJJJVVVVVVVV
..........................................VVVVVVVV
..........................................VVVVVVVV
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
........................................VVVVV.....
........................................VVVVV.....
.............WWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..VVV.....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW...........................VVV.....
............WWW......................WWW..VVV.....
............WWW......................WWW..VVV.....
............WWW......................WWWVVVVV.....
............WWW......................WWWVVVVV.....
............WWW......................WWWVVVVV.....
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ   gggggggggggggggggggggggggggggggggggggggggggggggggg
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ   gggggggggggggggggggggggggggggggggggggggggggggggggg
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ   gggggggggggggggggggggggggggggggggggggggggggggggggg
ccccclllllcccccccccccccccccccclllccccccccccccccccc   77777777777777777777777777777777777777777777777777
ccccclllllcccccccccccccccccccclllccccccccccccccccc   77777777777777777777777777777777777777777777777777
cccllcccccllllllllllllllllllllccccccccccMVMVVMMMcc   7777777777777777777777777777777777777777zzzzyzzz77
cccllcccccllllllllllllllllllllccccccccccMVVVVVVMcc   7777777777777777777777777777777777777777zyyyyyyz77
cccllcccccllllllllllllllllllllccccccccccMRVVVVVccc   777777777777wwwuwwwuwwwuwwwwuwwwuwwwuwwwzzzyyyyz77
ccccclllllcccWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRVVVVVcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwuuzyyyyy77
ccccclllllcccWWWWWWWWWWWWWWWWWWWWWWWWWWMRRRVVVVMcc   777777777777wuuwuwwwuwwwuwwwuwwwuwwwuwwwuuyyyyyz77
cccllccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVVVMcc   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyyyz77
cccllccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVVVccc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyyyz77
cccllccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRMVVVVcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzzyyyy77
cccllccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVMcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
cccllccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVccc   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
lllccccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVccc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
lllccccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVMcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
lllccccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVVcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyy77
lllccccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVccc   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
lllccccccccccWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVMcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRMMRRRRRVVMcc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwwwuuuuuyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWRRRRRVVVcc   77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuwuwuuuuuyyy77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWRRRRRVVccc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwuuzzzyzyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWMVVVVVVMcc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyyyyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWMVVVVVVMcc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwuuzzzzyzzz77
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWccccclllll   77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuwuu7777777777
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWccccclllll   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwuu7777777777
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWccccclllll   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWccccclllll   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwuw7777777777
lllQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWccccclllll   77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuwuu7777777777
llllllllllcccWWWWWWWWWWWWWWWWWWWWWWWWWWWccccclllll   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
llllllllllcccWWWWWWWWWWWWWWWWWWWWWWWWWWWccccclllll   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
llllllllllcccMMWcMMWcMMWrMrMWrMMWcMMWlMMccccclllll   777777777777wwwuwwwuwwwuwwwwuwwwuwwwuwww7777777777
llllllllllcccccccccccccrrrrrrrccccclllllllllllllll   77777777777777777777777777777777777777777777777777
llllllllllcccccccccccccrrrrrrrccccclllllllllllllll   77777777777777777777777777777777777777777777777777
JJJJJJJJJJJJJJJJJJJJMMVVMVVMVVMMMJJJJJJJJJJJJJJJJJ   ggggggggggggggggggggooomoomoomoooggggggggggggggggg
JJJJJJJJJJJJJJJJJJJJMVVVVVVVVVVVMJJJJJJJJJJJJJJJJJ   ggggggggggggggggggggommmmmmmmmmmoggggggggggggggggg
JJJJJJJJJJJJJJJJJJJEMMrVMrVMrVMMMJJJJJJJJJJJJJJJJJ   ggggggggggggggggggggooomoomoomoooggggggggggggggggg
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   gggggggggggggggggggggggggggggggggggggggggggggggggg
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ   gggggggggggggggggggggggggggggggggggggggggggggggggg
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ   gggggggggggggggggggggggggggggggggggggggggggggggggg
ccccccccccccclllllllllllllllllllllllllcccccccccccc   77777777777777777777777777777777777777777777777777
ccccccccccccclllllllllllllllllllllllllcccccccccccc   77777777777777777777777777777777777777777777777777
cccccccccccccllllllllllllllllllllllllMcccccccccccc   777777777777wwwuwwwuwwwuwwwuwwwuwwwuwwuuzzzzyzzz77
cccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWMVVVVVVMcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyyyyyz77
cccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWMVVVVVVMcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuzzyyyyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWRRRVVVVVcc   77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyyyyy77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRWWRRRVVVVccc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwuwuuzyyyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRMMRRRMVVVMcc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuwwwuuzzyyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVMcc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVVcc   77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyy77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVccc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVMcc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVVcc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyy77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVMcc   77jjjjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
cccQQQQQQQQQQWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVccc   77jjjjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
cccccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVVcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyy77
cccccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVMcc   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyz77
cccccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRVVMcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuwwwuuuuuyyz77
lllccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWRRRRRVVccc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuwuwuuuuuyyz77
lllccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWRRRRRVVVcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuwuuuuuuuyyy77
lllccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWMMVVMVVMcc   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuzzzyzyyz77
lllccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWMVVVVVVMcc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuwuuzyyyyyyz77
lllccccccclllWWRRRRRRRRRRRRRRRRRRRRRRRWWMMcVMcMccc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuwuwzzzyzzzz77
lllllllllllllWWRRRRRRRRRRRRRRRRRRRRRRRWWcccccccccc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
lllllllllllllWWRRRRRRRRRRRRRRRRRRRRRRRWWcccccccccc   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777777
lllllllllllllWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
lllllllllllllWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccc   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
lllllllllllllMMWlMMWlMMWrMrMWrMMWcMMWcMMcccccccccc   777777777777wwwuwwwuwwwuwwwwuwwwuwwwuwww7777777777
cccccccccccccllllllllllrrrrrrrcccccccccccccccccccc   77777777777777777777777777777777777777777777777777
cccccccccccccllllllllllrrrrrrrcccccccccccccccccccc   77777777777777777777777777777777777777777777777777
JJJJJJJJJJJJJJJJJJJJMMVVMVVMVVMMMJJJJJJJJJJJJJJJJJ   ggggggggggggggggggggooomoomoomoooggggggggggggggggg
JJJJJJJJJJJJJJJJJJJJMVVVVVVVVVVVMJJJJJJJJJJJJJJJJJ   ggggggggggggggggggggommmmmmmmmmmoggggggggggggggggg
JJJJJJJJJJJJJJJJJJJEMMrVMrVMrVMMMJJJJJJJJJJJJJJJJJ   ggggggggggggggggggggooomoomoomoooggggggggggggggggg
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
How much the plans of the seeds differ: 0.36 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 204 nodi, 861 passi, finito in 480 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=terreno (marcatore), h=honey, g=green, s=slate, w=white, a=alive, gray, v=olive, p=purple, d=dead, dark, c=cortile, l=lastricato, m=magenta, t=teal, G=Green, r=strada, z=z, f=pavimento in legno, F=solaio in legno, W=muro del mastio, V=muro di torre, J=cinta muraria, L=finestra, Y=Yellow, K=camino in pietra, P=pilastro in legno, b=black, q=aqua, D=pavimento della cantina, R=terrazza, Q=tetto della tettoia, T=scala, U=feritoia, O=portone, M=merlatura, N=stipite in pietra, o=assi del portone, k=gradino, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #93=terreno di prova (marcatore).
Alla fine: W 54115, V 32300, J 17875, o 6560, k 5870, U 2430, E 2250, f 2250, L 2156, R 2050, F 1890, M 1606, P 1536, c 1375, l 1175, Q 752, D 675, N 630, r 450, O 240, K 15.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-41 all×26, prl×2, one×2, convchain×1: 474 celle x0-19 y1-19 z20, passi 2-62
   #43 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 63
#45-48 all×4: 34675 celle x25-79 y25-74 z19-40, passi 64-96
#49-50 all×2: 54400 celle x25-79 y25-74 z40-72, passi 97-128
#51-55 all×4, prl×1: 38950 celle x25-79 y25-74 z20-85, passi 129-174
    #56 all . h → h . (+1) passi=31: ×31, 99200 celle x30-74 y30-69 z21-52, passi 175-205, h→. 28675, .→h 28675, g→. 20925, .→g 20925
      r1 . h → h . ×28675; r2 . g → g . ×20925
    #57 all . h → h F (+2) passi=1: ×1, 3600 celle x30-74 y30-69 z52-53, passi 206, h→F 925, .→h 925, g→F 675, .→g 675, +2
      r1 . h → h F ×925; r2 . g → g F ×675; r3 . s → s F ×200
    #58 all . h → h . (+2) passi=31: ×31, 111600 celle x30-74 y30-69 z53-84, passi 207-237, h→. 28675, .→h 28675, g→. 20925, .→g 20925, +2
      r1 . h → h . ×28675; r2 . g → g . ×20925; r3 . s → s . ×6200
#59-67 all×7, prl×2: 44650 celle x30-89 y20-69 z20-97, passi 238-318
#68-73 all×5, prl×1: 32762 celle x5-84 y25-54 z20-85, passi 319-384
#74-82 all×6, prl×2: 30160 celle x5-24 y35-54 z20-54, passi 385-454
    #83 all . m → m J passi=24: ×24, 34800 celle x0-84 y10-84 z20-44, passi 455-478, m→J 17400, .→m 17400
#84-85 prl×1, all×1: 25925 celle x0-99 y5-89 z20-56, passi 479-515
#86-125 prl×3, all×12: 50615 celle x30-99 y5-89 z0-62, passi 516-631
#126-198 prl×13, one×2, all×23: 37599 celle x0-99 y5-89 z1-99, passi 632-844
#199-204 prl×1, all×2, one×1: 22711 celle x5-89 y20-74 z28-83, passi 845-861
Senza effetto (non hanno mai cambiato una cella):
#8 prl z/E → */z passi=1
#21 prl aE → *a passi=1
#30 all cEEEEE → *cc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#31 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all mE/*m → *m/**: le celle cercate c'erano, ma mai disposte come nel pattern
#38 all G/m → */G: le celle cercate c'erano, ma mai disposte come nel pattern
#81 all fPPP/fPPP → f.../f...: le celle cercate c'erano, ma mai disposte come nel pattern
#93 one f/W/W/W/W/W/V/V/V/V/V/f → */O/O/O/O/O/O/O/O/O/O/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#95 one F/W/W/W/W/W/V/V/V/V/V/F → */O/O/O/O/O/O/O/O/O/O/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#98 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#99 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#100 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
… e altri 52
Fix it and answer with the whole program.

## Risposta

<!--
  Concept: rocca di confine (border stronghold / keep with cellar, bastion tower, lean-to, and outer bailey at Huge).
  Parts & plan letters:
    h, g: main keep interior (two storeys + battlemented roof terrace; 'g' is the back half where the cellar D is dug, 'h' is the front half near the door).
    s: stair zone inside the main keep (climbs along x, away from the cellar hatch and with a clear landing past its top).
    w: keep stone walls.
    a, v: tall corner/side bastion tower (a = interior, v = tower wall) attached to the keep, varying in position and depth by seed.
    p: wooden lean-to / armory shelter against the opposite side of the keep.
    d: main front door (3 cells = 15 voxels wide) facing the front road.
    c, l: paved/flagstone bailey courtyard around the keep (grows larger where ground permits at Huge).
    m: outer curtain wall enclosing the bailey at Huge (only where space around the courtyard allows).
    t: corner watch-turrets on the outer curtain wall at Huge.
    G: outer gatehouse on the front axis through the curtain wall.
    r: paved road from the front door (and gatehouse) straight to the front edge of the box.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhgswavpdclmtGrz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- Keep center line: 4 cells behind H, 3-4 cells in front of H (total 8-9 cells deep = 40-45 voxels, 9 cells wide = 45 voxels) -->
      <all in="E/[Hh]" out="h/*" steps="4"/>
      <all in="H/E" out="*/z" steps="1"/>
      <all in="z/E" out="*/z" steps="2"/>
      <prl in="z/E" out="*/z" p="0.5" steps="1"/>
      <all in="[Hhz]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls -->
      <all in="[Hhz]E" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Front door 'd' on the front wall directly in front of the center line 'z' -->
      <all in="z/w" out="*/d"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="z" out="h"/>
      <prl in="H" out="h"/>

      <!-- Split keep floor into back zone 'g' (4 rows = 20 voxels deep, 45 voxels wide for cellar D) and front zone 'h' (20-25 voxels deep) -->
      <all in="w/h" out="*/g" steps="1"/>
      <all in="g/h" out="*/g" steps="3"/>

      <!-- Stair zone 's' in the front hall 'h' along the front wall: 3 cells from left wall (15 voxels landing), 4 cells wide (20 voxels), 2 cells from right wall (10 voxels landing at top) -->
      <all in="hhhhhhhhh/hhhhhhhhh/wwwdddwww" out="***ssss**/*****ssss/*********" steps="1"/>
      <all in="hsh" out="sss"/>

      <!-- Attached bastion tower ('a' interior, 'v' wall) on one side of the keep, varied by seed -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <prl in="aE" out="*a" p="0.5" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" steps="1"/>
      <all in="a/E" out="*/a" steps="1"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>

      <!-- Lean-to shelter ('p') on the available side wall (4 cells along y = 20 voxels, 4 cells along x = 20 voxels) -->
      <one in="wEEE/wEEE/wEEE/wEEE/wEEE/wEEE" out="****/*ppp/*ppp/*ppp/*ppp/****" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- Inner courtyard ring around the keep, tower, and lean-to -->
      <all in="[wvpd]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- At Huge/Gargantuan, where at least 6 cells of free ground remain beyond 'c', expand courtyard and build outer curtain wall 'm' -->
      <all in="cEEEEEE" out="*ccc***" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="ccEEE" out="**mEE" symmetry="(xy)" steps="1"/>
      <all in="mE/*m" out="*m/**" symmetry="(xy)"/>

      <!-- Outer corner turrets 't' on outer corners of 'm' -->
      <all in="EE/Em" out="**/*t" symmetry="(xy)"/>
      <all steps="1" symmetry="(xy)">
        <rule in="t[Em]" out="*t"/>
        <rule in="t*/*[Em]" out="**/*t"/>
      </all>

      <!-- Front path from 'd', outer gatehouse 'G', and road 'r' to the front edge -->
      <all in="[dr]/c" out="*/r"/>
      <all in="r/m" out="*/G"/>
      <all in="G/m" out="*/G"/>
      <all in="Gm" out="*G" symmetry="(x)" steps="1"/>
      <all in="[drG]/E" out="*/r"/>

      <!-- Courtyard paving texture -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>ccll/ccll/llcc/llcc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhgswavpdclmtGrfFWVJLYKPbqDRQTCUuOMNo#20#21Tk#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="()">
        <!-- Unions for the included seed parts -->
        <union symbol="+" values="WVJ"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="WVJ"/>

        <!-- Mark cellar D on the layer just under the soil (z=19) beneath 'g' -->
        <all in="B g" out="D *"/>

        <!-- B. Heights: columns by steps -->
        <!-- Main keep walls 'w' (becomes W) and door wall 'd' (becomes W): 2 storeys (64 high) + roof slab level (65 high) with window bands Y -->
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Y"/></all>
        <all steps="12"><rule in="B d" out="d W"/></all>
        <all steps="20"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Y"/><rule in="B d" out="d Y"/></all>
        <all steps="13"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="W"/><rule in="d" out="W"/></prl>

        <!-- Keep interior 'h', 'g', and stair zone 's': floor at z=20, slab at z=52, roof terrace slab at z=84 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B g" out="g f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- First flight of stairs strip T at z=21 -->
        <all in="B s" out="s T" steps="1"/>
        <all steps="30"><rule in="B s" out="s B"/></all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B g" out="g B"/>
        </all>
        <!-- Second storey slab at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B g" out="g F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B g" out="g B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Roof terrace slab at z=84 -->
        <all steps="1">
          <rule in="B h" out="h R"/>
          <rule in="B g" out="g R"/>
          <rule in="B s" out="s R"/>
        </all>
        <prl><rule in="h" out="B"/><rule in="g" out="B"/><rule in="s" out="B"/></prl>

        <!-- Bastion tower walls 'v': 77 high (taller than keep) with window bands -->
        <all in="B v" out="v V" steps="10"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v V" steps="22"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v V" steps="25"/>
        <prl in="v" out="V"/>

        <!-- Bastion tower interior 'a': floor at z=20, slab at z=52, upper roof at z=84 -->
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a R" steps="1"/>
        <prl in="a" out="B"/>

        <!-- Lean-to shelter 'p' and posts 'b': floor at z=20, posts rise 32, roof Q at z=53 (32 clear height >= 30 required) -->
        <all in="B p" out="q f" steps="1"/>
        <all in="B q" out="q B" steps="32"/>
        <all in="B q" out="q Q" steps="1"/>
        <prl in="q" out="B"/>
        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b P" steps="32"/>
        <all in="B b" out="b Q" steps="1"/>
        <prl in="b" out="B"/>

        <!-- Outer curtain wall 'm' (24 high), corner turrets 't' (36 high), gatehouse 'G' (42 high) -->
        <all in="B m" out="m J" steps="24"/>
        <prl in="m" out="J"/>
        <all in="B t" out="t V" steps="36"/>
        <prl in="t" out="V"/>
        <all in="B G" out="G V" steps="42"/>
        <prl in="G" out="V"/>

        <!-- C. Full scale: doors, cellar, stairs, battlements, slits, windows, details -->
        <!-- Front keep door seed 'O' where road 'r' meets front wall 'W' at z=20 -->
        <all in="W/r" out="O/*" steps="1"/>
        <all in="W/O" out="O/*" steps="4"/>

        <!-- Outer gatehouse archway 'O' where road 'r' meets gatehouse 'V' at z=20 -->
        <all in="V/r" out="O/*" steps="1"/>
        <all in="V/O" out="O/*" steps="4"/>

        <!-- Internal doorway between keep ('f'/'F') and bastion tower ('f'/'F') through wall 'W' at z=20 and z=52 -->
        <one in="fWWWWWWf" out="*OOOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="(y)" steps="5"/>
        <one in="FWWWWWWF" out="*OOOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="(y)" steps="5"/>

        <!-- Doors -->
        <import file="part-door"/>

        <!-- Cellar under 'g' -->
        <import file="part-cellar"/>

        <!-- Stairs between ground floor and second floor -->
        <import file="part-stair"/>

        <!-- Battlements and arrow slits on keep, tower, curtain wall, turrets, and gatehouse -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the window bands 'Y' on all sides -->
        <one steps="18" symmetry="(xy)">
          <rule in="BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LYYYYB" out="*LLLL*" symmetry="(xy)"/>
        <prl in="Y" out="W"/>

        <!-- Lean-to sloped wooden roof extension -->
        <all in="B Q" out="Q *" steps="1"/>
        <all in="B* WQ" out="*Q **" symmetry="(xy)" steps="2"/>

        <!-- Stone chimney on the keep roof -->
        <one in="B R" out="K *" steps="1"/>
        <all in="K/R" out="*/K" symmetry="(xy)" steps="2"/>
        <all in="B K" out="K *" steps="14"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon style with clear contrast and distinct materials -->
  <color symbol="E" value="#6b7a4f" name="terreno" hidden="True"/>
  <color symbol="c" value="#968e7e" name="cortile" area="courtyard"/>
  <color symbol="l" value="#827a6a" name="lastricato" area="courtyard"/>
  <color symbol="r" value="#787062" name="strada" area="yard"/>
  <color symbol="f" value="#b8986c" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="#a6865a" name="solaio in legno" area="keep"/>
  <color symbol="R" value="#7e7870" name="terrazza" area="keep"/>
  <color symbol="W" value="#9a9488" name="muro del mastio" area="keep"/>
  <color symbol="V" value="#7c766c" name="muro di torre" area="tower"/>
  <color symbol="J" value="#888278" name="cinta muraria" area="courtyard"/>
  <color symbol="M" value="#8e887c" name="merlatura" area="keep"/>
  <color symbol="U" value="#2a2826" name="feritoia" area="keep"/>
  <color symbol="L" value="#384452" name="finestra" area="keep"/>
  <color symbol="P" value="#684a32" name="pilastro in legno" area="yard"/>
  <color symbol="Q" value="#9e4834" name="tetto della tettoia" area="yard"/>
  <color symbol="K" value="#645e58" name="camino in pietra" area="keep"/>
  <color symbol="O" value="#6e482c" name="portone" area="keep"/>
  <color symbol="o" value="#4e321c" name="assi del portone" area="keep"/>
  <color symbol="N" value="#5e5850" name="stipite in pietra" area="keep"/>
  <color symbol="k" value="#8c6e46" name="gradino" area="keep"/>
  <color symbol="T" value="#8c6e46" name="scala" area="keep"/>
  <color symbol="D" value="#625a50" name="pavimento della cantina" area="keep"/>
  <color symbol="#20" value="#6e482c" name="portone aperto" hidden="True"/>
  <color symbol="#21" value="#4e321c" name="assi aperte" hidden="True"/>

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
