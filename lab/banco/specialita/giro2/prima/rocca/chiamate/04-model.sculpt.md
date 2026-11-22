# model.sculpt · correzione · gemini-4-argon · 52 s · 24812 token d'ingresso (0 in cache), 5465 d'uscita, 0 di ragionamento · $0.10

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
  Rocca di confine (border stronghold with cellar):
  - Main keep (mastio): front hall `h`, back hall over cellar `z`, stair zone `s` along the front side of `h`, stone walls `w`.
    Interior width is 9 cells (45 voxels >= 44 for part-cellar), depth 8-9 cells (40-45 voxels).
    `z` is 4 cells deep (20 voxels >= 14) and stays 4-5 cells (20-25 voxels >= 10) back from the front wall.
  - Corner towers `t` on the rear corners of the keep, plus a bastion wing `a` (walls `v`) on one side chosen by the seed.
  - A timber lean-to / armory porch `p` (4 cells = 20 voxels deep, 33 clear height) against the side of the keep.
  - At Large (20x20): keep, rear corner towers, side bastion wing, lean-to, front courtyard `c` with parapet wall `u`, gate `g` and road `r`.
  - At Huge (30x30): outer courtyard `c` around the keep enclosed by curtain wall `W`, corner watchtowers `q`, gatehouse `G`, and well `Q`.
-->
<sequence values="BHEhzwstvacuWqgGdrpQ" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhzwstvacuWqgGdrpQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep interior around H: 4 behind, 3 in front (+1 by chance), 4 to each side (width 9 = 45 voxels, depth 8-9 = 40-45 voxels) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Way out marker m traced straight from H to the front before z overwrites H -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>

      <!-- Keep walls w -->
      <all in="[Hhm]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Rear corner towers t (3x3 cells = 15x15 voxels) on back outer corners of keep -->
      <all in="EE/Ew" out="**/*t" symmetry="(x)" steps="1"/>
      <all in="t[Ew]" out="*t" symmetry="(xy)" steps="1"/>
      <all in="t*/*[Ew]" out="**/*t" symmetry="(xy)" steps="1"/>
      <all in="t[Ew]" out="*t" symmetry="(xy)" steps="1"/>
      <all in="t*/*[Ew]" out="**/*t" symmetry="(xy)" steps="1"/>

      <!-- Side bastion wing a with walls v on one side of the keep (seed decides side and depth) -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Covered lean-to shelter p (4 cells = 20 voxels deep, 4 cells = 20 voxels wide) on the free side wall -->
      <one in="Ew/Ew/Ew/Ew" out="p*/p*/p*/p*" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="3"/>

      <!-- Front forecourt c -->
      <all in="[wvp]/E" out="*/c" symmetry="()" steps="2"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>

      <!-- Only at Huge (where >= 5 cells of E remain in front of the forecourt c): expand outer courtyard c around the keep and enclose with curtain wall W and corner watchtowers q -->
      <all in="c/E/E/E/E/E" out="*/c/c/c/*/*" symmetry="()" steps="1"/>
      <all in="c/c/w" out="W/*/*" symmetry="()" steps="1"/>
      <all in="Wc" out="*W" symmetry="(x)"/>
      <all in="cE" out="*c" symmetry="(x)" steps="4"/>
      <all in="E/c" out="c/*" symmetry="()" steps="9"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="W/c" out="*/W" symmetry="()"/>
      <all in="W/E" out="*/W" symmetry="()"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Outer corner watchtowers q on convex corners of the curtain wall W (only present at Huge) -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="2">
        <rule in="q[EW]" out="*q"/>
        <rule in="q*/*[EW]" out="**/*q"/>
      </all>

      <!-- Low parapet wall u around front forecourt at Large (where c still touches E) -->
      <all in="cE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Well Q in the courtyard if a 4x4 clear space of c exists (occurs at Huge) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>

      <!-- Door d in keep front wall, road r across courtyard, gatehouse G in curtain wall W, gate g in parapet u -->
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="r/u" out="*/g" symmetry="()"/>
      <all in="[Ggr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="gu" out="*g" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Mark cellar room z in the back 4 rows of the keep (9 cells = 45 wide, 4 cells = 20 deep, 20-25 voxels back from front wall) -->
      <all in="w/h" out="*/z" symmetry="()" steps="1"/>
      <all in="z/h" out="*/z" symmetry="()" steps="3"/>

      <!-- Stair zone s in the front hall h (right side, 5 cells = 25 voxels of landing before it, 4 cells long, 2 wide, clear of cellar opening) -->
      <one in="hhhhhhhhh/hhhhhhhhh/wwwdddwww" out="*****ssss/*****ssss/*********" symmetry="()" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhzwstvacuWqgGdrpQbfFRYyIJKLCPDTkVOoNMU#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="Q" out="ccccc/cWWWc/cWQWc/cWWWc/ccccc"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wvtWquGKP"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wvtWqG"/>

        <!-- Mark D under the cellar room z at z=19 (first layer under the soil) -->
        <all in="z B" out="* D" symmetry="()"/>

        <!-- Keep walls w: 2 storeys (64 steps) with window bands Y -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B w" out="w *" steps="20"/>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B w" out="w *" steps="11"/>
        <prl in="w" out="w"/>

        <!-- Front door wall d: seed O at z=20 (the floor layer), then 63 steps of wall w above -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="62"/>
        <prl in="d" out="w"/>

        <!-- Rear corner towers t: 76 steps high with window band Y -->
        <all in="B t" out="t *" steps="46"/>
        <all in="B t" out="t Y" steps="12"/>
        <all in="B t" out="t *" steps="17"/>
        <prl in="t" out="t"/>

        <!-- Side bastion walls v (40 high) and interior room a (floor f at z=20, 31 air, terrace slab F at z=52) -->
        <all in="B v" out="v *" steps="10"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v *" steps="19"/>
        <prl in="v" out="v"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <prl in="a" out="B"/>

        <!-- Lean-to shelter p and timber posts b: clear height 33 (person 24, >= 30 clear), roof J at 34 -->
        <all in="B b" out="b I" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B p" out="y f" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <prl in="y" out="J"/>

        <!-- Outer curtain wall W (26 high), corner watchtowers q (42 high), low parapet u (10 high), well water Q -->
        <all in="B W" out="W *" steps="25"/>
        <prl in="W" out="W"/>
        <all in="B q" out="q *" steps="41"/>
        <prl in="q" out="q"/>
        <all in="B u" out="u *" steps="9"/>
        <prl in="u" out="u"/>
        <all in="B Q" out="Q *" steps="4"/>
        <prl in="Q" out="Q"/>

        <!-- Outer gatehouse G: open gateway below (31 high), stone arch and chamber above up to 46 -->
        <all in="B G" out="G B" steps="31"/>
        <all in="B G" out="G W" steps="14"/>
        <prl in="G" out="W"/>

        <!-- Keep interior floors (h, z, s): ground floor f at z=20, second storey slab F at z=52, roof slab R at z=84 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B z" out="z f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=21 above s -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B z" out="z B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>

        <!-- Second floor slab F at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B z" out="z F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second stair strip T at z=53 above s to reach the roof terrace -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B z" out="z B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>

        <!-- Roof terrace R at z=84 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="z" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Dig cellar under z before part-stair -->
        <import file="part-cellar"/>

        <!-- Build interior stairs -->
        <import file="part-stair"/>

        <!-- Build front door from seed O (15 wide x 5 thick at z=20 with wall w above) -->
        <import file="part-door"/>

        <!-- Restore floor f on the threshold under the door and road r on the gatehouse floor -->
        <all in="d O" out="* f" symmetry="()"/>
        <all in="d o" out="* f" symmetry="()"/>

        <!-- Windows L in the window bands Y on all sides -->
        <one steps="18">
          <rule in="BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="w"/>

        <!-- Battlements and arrow slits on all flat wall tops -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Pitched hip roof J on the lean-to shelter -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>

        <!-- Stone chimney K on the keep roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- Wooden banner pole I with red banner C on a rear tower -->
        <one in="B B t" out="* I *" steps="1" symmetry="()"/>
        <all in="B I" out="I *" steps="12"/>
        <all in="IB" out="*C" steps="3" symmetry="()"/>
      </sequence>
    </map>
  </map>

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

  <color symbol="E" hidden="True"/>
  <color symbol="c" value="a89c86" name="cortile" area="courtyard"/>
  <color symbol="r" value="948a78" name="strada lastricata" area="road"/>
  <color symbol="g" value="948a78" name="varco del cortile" area="road"/>
  <color symbol="h" value="b89c72" name="sala di guardia" area="keep"/>
  <color symbol="z" value="b89c72" name="sala del mastio" area="keep"/>
  <color symbol="s" value="b89c72" name="vano scala" area="keep"/>
  <color symbol="a" value="b89c72" name="bastione laterale" area="keep"/>
  <color symbol="p" value="9e8c70" name="tettoia dell'armeria" area="yard"/>
  <color symbol="d" value="b89c72" name="soglia del portone" area="keep"/>
  <color symbol="G" value="948a78" name="passo del corpo di guardia" area="road"/>

  <color symbol="w" value="84827c" name="muro del mastio"/>
  <color symbol="t" value="6e6c66" name="torre angolare"/>
  <color symbol="v" value="787670" name="muro del bastione"/>
  <color symbol="W" value="74726c" name="cinta muraria"/>
  <color symbol="q" value="64625c" name="torretta di guardia"/>
  <color symbol="u" value="8c8880" name="muretto di cinta"/>
  <color symbol="M" value="7c7a74" name="merratura"/>
  <color symbol="U" value="2a2826" name="feritoia"/>
  <color symbol="P" value="7c7a74" name="parapetto"/>
  <color symbol="K" value="645e58" name="camino in pietra"/>

  <color symbol="f" value="9c744c" name="pavimento in tavole"/>
  <color symbol="F" value="8c643e" name="solaio in legno"/>
  <color symbol="R" value="78746e" name="lastrico del terrazzo"/>
  <color symbol="k" value="a67c52" name="gradini"/>
  <color symbol="I" value="6e4c2e" name="trave di quercia"/>
  <color symbol="b" value="6e4c2e" name="pilastro in legno"/>
  <color symbol="J" value="a84a32" name="tetto in coppi"/>
  <color symbol="C" value="b83228" name="stendardo di confine"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="Q" value="4a7c9b" name="acqua del pozzo"/>

  <color symbol="D" value="6e6254" name="pavimento della cantina" area="cellar"/>
  <color symbol="V" value="58524a" name="muro della cantina"/>

  <color symbol="O" value="7a4e2d" name="portone in legno"/>
  <color symbol="o" value="54341c" name="assi del portone"/>
  <color symbol="N" value="5e5c56" name="stipite in pietra"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
</sequence>
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); cantina: un pavimento sotto il suolo non si raggiunge dal piano terra — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, w muro del mastio, t torre angolare, v muro del bastione, c cortile, u muretto di cinta, g varco del cortile, r strada lastricata, f pavimento in tavole, F solaio in legno, R lastrico del terrazzo, I trave di quercia, J tetto in coppi, K camino in pietra, L finestra, C stendardo di confine, D pavimento della cantina, k gradini, V muro della cantina, O portone in legno, o assi del portone, N stipite in pietra, M merratura, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEttEEEttEEEttEEEEEEEEEEEEEttEEEttEEEttEEEEE
EEEEEEEEttEEEttEEEttEEEEEEEEEEEEEttEEEttEEEttEEEEE
EEEEEMtttttttttttttttMMEEEEEEEMtttttttttttttttMMEE
EEEEEtttttttttttttttttEEEEEEEEtttttttttttttttttEEE
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE
EEEttttttttttttttttttttttEEEtttttttttttttttttttttt
EEEtttttttttttttttttttttMEEEtttttttttttttttttttttt
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE
uuuttttttttttttttttttttttwwwtttttttttttttttttttttt
uuutttttttttttttttttttttMwwwtttttttttttttttttttttt
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE
cccttttttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttttt
cccttttttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttttt
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttcc
cccuuMtttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttMcc
cccuuMEttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttMccc
cccuuEEEttEEEttRRRRRRRRRRRRRRRRRRRRRRRttFFFttuuucc
cccuuEEEtMEEEtMRRRRRRRRRRRRRRRRRRRRRRRtMFFFtMuuucc
cccuuEEEEEEEEwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFMMMcc
cccuuEEEEEEEEwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFMvMcc
cccMMEEEEEEEMwwRRRRRRRRRRRRRRRRRRRRRRRFMFFFFFvvccc
cccJJJJJJJJJJwwRRRRRRRRRRRRRRRRRRRRRRRFFFFFFFvvvcc
cccJJJJJJJJJJwwRRRRRRRRRRRRRRRRRRRRRRRFFFFFFFMvMcc
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFMvMcc
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFvvMcc
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFvvvcc
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRwwFFFFFMvccc
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRwwFFFFFMvMcc
cccJJJJJJJJJJwwwwwwwwwwwwwwwwwwwwwwwwwwwFFFFFvvMcc
cccJJJJJJJJJJwwwwwwwwwwwwwwwwwwwwwwwwwwwFFFFFvvvcc
cccJJJJJJJJJcMMwcMMwcMMwrMrMwrMMwcMMwcMMFFFFFvvccc
cccccccccccccccccccccccrrrrrrrccccccccccMvvvvvvMcc
cccccccccccccccccccccccrrrrrrrccccccccccMvvvvvvMcc
cccccccccccccccccccccccrrrrrrrcccccccccccccccccccc
cccccccccccccccccccccccrrrrrrrcccccccccccccccccccc
cccccccccccccccccccccccrrrrrrrcccccccccccccccccccc
uuuuuuuuuuuuuuuuuuuuuuMgggggggMuuuuuuuuuuuuuuuuuuu
uuuuuuuuuuuuuuuuuuuuuuMgggggggMuuuuuuuuuuuuuuuuuuu
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
7777777zzz77zzz77zzz777777777777zzz77zzz77zzz77777
7777777zyz77zyz77zyz777777777777zyz77zyz77zyz77777
7777777yyy77yyy77yyy777777777777yyy77yyy77yyy77777
77777zzyyyyyyyyyyyyyyzz7777777zzyyyyyyyyyyyyyyzz77
77777zyyyyyyyyyyyyyyyyz7777777zyyyyyyyyyyyyyyyyz77
77zzyyyyyyyyyyyyyyyyyyyzz77zzyyyyyyyyyyyyyyyyyyyyy
77zyyyyyyyyyyyyyyyyyyyyyz77zyyyyyyyyyyyyyyyyyyyyyy
77zzyyyyyyyyyyyyyyyyyyyzz77zzyyyyyyyyyyyyyyyyyyyyy
77777yyyyyyyyyyyyyyyyyy7777777yyyyyyyyyyyyyyyyyy77
77777yyyyyyyyyyyyyyyyyy7777777yyyyyyyyyyyyyyyyyy77
aazzyyyyyyyyyyyyyyyyyyyzzttzzyyyyyyyyyyyyyyyyyyyyy
aazyyyyyyyyyyyyyyyyyyyyyzttzyyyyyyyyyyyyyyyyyyyyyy
aazzyyyyyyyyyyyzzyzzzyzzzttzzzyzzzyzzyyyyyyyyyyyyy
77aaayyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
77aaayyyzyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
77zzyyyyyyyyyyyuuuuuuuuuuuuuuuuuuuuuuyyyyyyyyyyyyy
77zyyyyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyyyy
77zzyyyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyyyy
77aaayyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
77aaazyyyyyyyyyuuuuuuuuuuuuuuuuuuuuuuyyyyyyyyyyz77
77caczzyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyzz77
77cac77zyz77zyzuuuuuuuuuuuuuuuuuuuuuuzyziizyzaaa77
77aaa77zzz77zzzuuuuuuuuuuuuuuuuuuuuuuzzziizzzaaa77
77cac7777777wttuuuuuuuuuuuuuuuuuuuuuuuttiiiiinnn77
77cac7777777tttuuuuuuuuuuyuuuuuuuuuuuutwiiiiinln77
77jjjjjjjjjjwttuuuuuuuuuuuuuuuuuuuuuuuwwiiiiinln77
77jjjjjjjjjjwttuuuuuuuuuuuuuuuuuuuuuuuiiiiiiilll77
77jjjjjjjjjjwttuuuuuuuuuuuuuuuuuuuuuuuiiiiiiinln77
77jjjkkkkkjjtttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuuwwiiiiilll77
77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuutwiiiiinln77
77jjjkkkkkjjtttuuuuuuuuuuuuulmnpqstuuutwiiiiinln77
77jjjjjjjjjjwtttttttttttttttttttttttttttiiiiinln77
77jjjjjjjjjjwttttttttttttttttttttttttttwiiiiilll77
77jjjjjjjjjjwwwtwwwtwwwtwwwwtwwwtwwwtwwwnnnlnnln77
7777777777777777777777777777777777777777nlllllln77
7777777777777777777777777777777777777777nnnlnnnn77
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
accacccacccacccacccaccc7777777cccacccacccacccaccaa
aaaaaaaaaaaaaaaaaaaaaac7777777caaaaaaaaaaaaaaaaaaa
accacccacccacccacccaccc7777777cccacccacccacccaccaa
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
```
Front (looking from the front; the sky at the top):
```
..MM.MMMMM..MMMMMMMMMMMMM..MMMMMMMMMMMMM..MMM.MM..
..MM.MMMMM..MMMMMMMMMMMMM..MMMMMMMMMMMMM..MMM.MM..
..tttttttttttttttttttttttK.ttttttttttttttttttttttt
..UUUUUUUUUUUUUUUUUUUUUUUK.UUUUUUUUUUUUUUUUUUUUUUU
..UUUUUUUUUUUUUUUUUUUUUUUK.UUUUUUUUUUUUUUUUUUUUUUU
..UUUUUUUUUUUMMUUMMUUMMUUMMMUUMMUUMMUUMMUUUUUUUUUU
..tttttttttttMMttMMttMMttMMMttMMttMMttMMtttttttttt
..tttttttttttMMRMMMRMMMRMMMMRMMMRMMMRMMMtttttttttt
..tttttttttttwwwwwwwwwwwwwwwwwwwwwwwwwwwtttttttttt
..tttttttttttwwwwwwwwwwwwwwwwwwwwwwwwwwwtttttttttt
..tttttttttttwwwwwwwwwwwwwwwwwwwwwwwwwwwtttttttttt
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwLLLLwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwLLLLwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwLLLLwwwwwwwwwwwwwwwwwwwwLLLwwwwwwwwww
..tttttttttttLLLLwwwwwwwwwwwwwwwwwwwwLLLMMMtMMMMtt
..tttttttttttwwwwwwwwwwwwwwwwwwwwwwwwLLLMMMtMMMMtt
..tttttttttttwwwwwwwwwwwwwwwwwwwwwwwwLLLMMMtMMMMtt
..tttttttttttwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvvvvvtt
..ttttJJJttttwwwwwwwwwwwwwwwwwwwwwwwwwwwUUUUUUUUtt
..ttJJJJJJJttwwwwwwwwwwwwwwwwwwwwwwwwwwwUUUUUUUUtt
..ttttttttttwwwwwwwwwwwwwwwwwwwwwwwwwwwwvUvvvUUttt
..tttttttttttwwwwwwwwwwNNNNNNNwwwwwwwwwwvvvvvvvvtt
..tttttttttttwwwwwwwwwNoooooooNwwwwwwwwwvvvvvvvvtt
..tttttttttttwwwwwwwwwNoooooooNwwwwwwwwwvvvvvvvvtt
..tttttttttttwwwwwwwwwNoooooooNwwwwwwwwwvvvvvvvvtt
..tttttttttttwwwwwwwwwNoooooooNwwwwwwwwwvvvvvvvvtt
..tttttttttttwwwwwwwwwNoooooooNwwwwwwwwwvvvvvvvvtt
..tttttttttttwwLLwwwwwwooooooowwwwwwwwwwwwwwwwwwtt
..tttttttttttwwLLLwwwwwooooooowwwwwwwwwwwwwwwwwwtt
.MMMMMMtMMMtMMMLMMMwMMMoooooooMMMwMMMwMMMwMMMwMMtt
.MMMMMMtMMMtMMMLMMMwMMMoooooooMMMwMMMwMMMwMMMwMMtt
.MMMMMMtMMMtMMMwMMMwMMMoooooooMMMwMMMwMMMwMMMwMMtt
uuuuuuuuuuuuuuuuuuuuuuuooooooouuuuuuuuuuuuuuuuuuuu
uuuuuuuuuuuuuuuuuuuuuuuooooooouuuuuuuuuuuuuuuuuuuu
uuuuuuuuuuuuuuuuuuuuuuuooooooouuuuuuuuuuuuuuuuuuuu
uuuuuuuuuuuuuuuuuuuuuuuooooooouuuuuuuuuuuuuuuuuuuu
EEEEEEEEEEEEEEEEEEEEEEEEErroEEEEEEEEEEEEEEEEEEEEEE
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................DDD......................
```
Right side (looking from the right):
```
..MM.MMMMM..MMMMMMMMMMMMM.........................
..MM.MMMMM..MMMMMMMMMMMMM.........................
..ttttttttttttttttttttttt.K.......................
..UUUUUUUUUUUUUUUUUUUUUUU.K.......................
..UUUUUUUUUUUUUUUUUUUUUUU.K.......................
..UUUUUUUUUUUUUUUUUUUUUUUMMMMM.MMMMMMM............
..tttttttttttttttttttttttMMMMM.MMMMMMM............
..tttttttttttttttttttttttRMMRRRRMMMMMM............
..tttttttttttttttttttttttwwwwwkkkwwwww............
..tttttttttttttttttttttttwwwUwkkkwwwUw............
..tttttttttttttttttttttttwwwUwkkkwwwUw............
..wwwwwwwwwwwwwwwwwwwwwwwwwwUwkkkwwwUw............
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwkkkwwwww............
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwkkkwwwww............
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwkkkwwLLL............
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwkkkwwLLL............
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwkkkwwLLL............
..tttttttttttttttttttttttMMMwMMMkMMMLMMM..........
..tttttttttttttttttttttttMMMwMMMkMMMwMMM..........
..tttttttttttttttttttttttMMMwMMMkMMMwMMM..........
..tttttttttttttttttttttttvvvvvvvvvvvvvvv..........
..tttttttttttttttttttttttUUUUUUUUUUUUUUU..........
..tttttttttttttttttttttttUUUUUUUUUUUUUUU..........
..tttttttttttttttttttttttvUvvvvvvvUvvvUv..........
..tttttttttttttttttttttttvvvvvvvvvvvvvvv..........
..tttttttttttttttttttttttvvvvvvvvvvvvvvv..........
..tttttttttttttttttttttttvvvvvvvvvvvvvvv..........
..tttttttttttttttttttttttvvvvvvvvvvvvvvv..........
..tttttttttttttttttttttttvvvvvvvvvvvvvvv..........
..tttttttttttttttttttttttvvvvvvvvvvvvvvv..........
..tttttttttttttttttttttttwwLLwwwwwwwwwww..........
..tttttttttttttttttttttttwwLLwwwwwwwwwww..........
..tttttttttttttttttttttttwwLLwwwwwwwwwww..MMM.....
..tttttttttttttttttttttttwwLLwwwwwwwwwww..MMM.....
..tttttttttttttttttttttttwwwwwwwwwwwwwww..MMM.....
..tttttttttttttttttttttuuvvvvvvvvvvvvvvv..uuu.....
..tttttttttttttttttttttuuvvvvvvvvvvvvvvv..uuu.....
..tttttttttttttttttttttuuvvvvvvvvvvvvvvv..uuu.....
..tttttttttttttttttttttuuvvvvvvvvvvvvvvv..uuu.....
EEEEEEEtttEEtttEEtttccccccccccccccccccccccuuuEEEEE
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............DDDDDDDDDD.........................
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
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
.........................VVV......................
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
........tt...tt...tt.............tt...tt...tt.....
.......ttt..ttt..ttt............ttt..ttt..ttt.....
.......ttt..ttt..ttt............ttt..ttt..ttt.....
.....tttttttttttttttttt.......tttttttttttttttttt..
.....tttttttttttttttttt.......tttttttttttttttttt..
...tttttttttttttttttttttt...tttttttttttttttttttttt
..ttttttttttttttttttttttt..ttttttttttttttttttttttt
..ttttttttttttttttttttttt..ttttttttttttttttttttttt
.....tttttttttttttttttt.......tttttttttttttttttt..
.....tttttttttttttttttt.......tttttttttttttttttt..
...ttttttttttttttttttttttwwwtttttttttttttttttttttt
..tttttttttttttttttttttttwwwtttttttttttttttttttttt
..tttttttttttttttttttttttwwwtttttttttttttttttttttt
.....tttttttttt......................ttttttttttt..
.....tttttttttt......................ttttttttttt..
...tttttttttttt......................ttttttttttttt
..ttttttttttttt......................ttttttttttttt
..ttttttttttttt......................ttttttttttttt
.....tttttttttt......................ttttttttttt..
.....tttttttttt......................ttttttttttt..
.....tttttttttt......................tttttttttt...
.......ttt..ttt......................ttt..ttt.....
.......ttt..ttt......................ttt..ttt.....
............www......................www.....vvv..
............www......................www.....vvv..
............www.......................ww.....vvv..
............www..............................vvv..
............www..............................vvv..
............www............kkkkkkkkk.........vvv..
............www............kkkkkkkkk.........vvv..
............www............kkkkkkkkk..ww.....vvv..
............www............kkkkkkkkk.www.....vvv..
............www............kkkkkkkkk.www.....vvv..
............wwwwwwwwwwNoooooooNwwwwwwwww.....vvv..
............wwwwwwwwwwNoooooooNwwwwwwwww.....vvv..
.............wwwwwwwwwNoooooooNwwwwwwwwwvvvvvvvv..
........................................vvvvvvvv..
........................................vvvvvvvv..
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
........LL...ww...LL.............ww...LL...ww.....
.......LLL..www..www............www..LLL..www.....
.......LLL..www..www............www..LLL..www.....
.....wwwwwwwwwwwwwwwwww.......LLwwwwwwwwwwwwwwww..
.....wwwwwwwwwwwwwwwwww.......wwwwwwwwwwwwwwwwww..
...wwwwwwwwwwwwwwwwwwwwww...wwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwwwwwwwwwwwww..wwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwwwwwwwwwwwww..wwwwwwwwwwwwwwwwwwwwwww
.....wwwwwwwwwwwwwwwwww.......wwwwwwwwwwwwwwwwww..
.....wwwwwwwwwwwwwwwwww.......wwwwwwwwwwwwwwwwww..
...wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
.....wwwwwwwwww......................wwwwwwwwwww..
.....wwwwwwwwww......................wwwwwwwwwww..
...wwwwwwwwwwww......................wwwwwwwwwwwww
..wwwwwwwwwwwww......................wwwwwwwwwwwww
..wwwwwwwwwwwww......................wwwwwwwwwwwww
.....wwwwwwwwww......................wwwwwwwwwww..
.....wwwwwwwwww......................wwwwwwwwwww..
.....wwwwwwwwww......................Lwwwwwwwww...
.......www..www......................LLL..www.....
.......www..www......................www..www.....
............www......................www..........
............www......................www..........
............www.......................ww..........
............www...................................
............www...................................
............www..................kkk..............
............www..................kkk..............
............www..................kkk..ww..........
............www..................kkk.www..........
............www..................kkk.www..........
............wwwwwwwwwwwwwwwwwwwwwwwwwwww..........
............wwwwwwwwwwwwwwwwwwwwwwwwwwww..........
.............wwwwwwwwwwwwwwwwwwwwwwwwwww..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   7777777zzz77zzz77zzz777777777777zzz77zzz77zzz77777
EEEEEEEEttEEEttEEEttEEEEEEEEEEEEEttEEEttEEEttEEEEE   7777777zyz77zyz77zyz777777777777zyz77zyz77zyz77777
EEEEEEEEttEEEttEEEttEEEEEEEEEEEEEttEEEttEEEttEEEEE   7777777yyy77yyy77yyy777777777777yyy77yyy77yyy77777
EEEEEMtttttttttttttttMMEEEEEEEMtttttttttttttttMMEE   77777zzyyyyyyyyyyyyyyzz7777777zzyyyyyyyyyyyyyyzz77
EEEEEtttttttttttttttttEEEEEEEEtttttttttttttttttEEE   77777zyyyyyyyyyyyyyyyyz7777777zyyyyyyyyyyyyyyyyz77
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE   77zzyyyyyyyyyyyyyyyyyyyzz77zzyyyyyyyyyyyyyyyyyyyyy
EEEttttttttttttttttttttttEEEtttttttttttttttttttttt   77zyyyyyyyyyyyyyyyyyyyyyz77zyyyyyyyyyyyyyyyyyyyyyy
EEEtttttttttttttttttttttMEEEtttttttttttttttttttttt   77zzyyyyyyyyyyyyyyyyyyyzz77zzyyyyyyyyyyyyyyyyyyyyy
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE   77777yyyyyyyyyyyyyyyyyy7777777yyyyyyyyyyyyyyyyyy77
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE   77777yyyyyyyyyyyyyyyyyy7777777yyyyyyyyyyyyyyyyyy77
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE   aazzyyyyyyyyyyyyyyyyyyyzzttzzyyyyyyyyyyyyyyyyyyyyy
uuuttttttttttttttttttttttwwwtttttttttttttttttttttt   aazyyyyyyyzzyyyyyyyyyyyyzttzyyyyyyyyyyyyyyyyyyyyyy
uuutttttttttttttttttttttMwwwtttttttttttttttttttttt   aazzyyyyyyyyyyyzzyzzzyzzzttzzzyzzzyzzyyyyyyyyyyyyy
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE   77aaayyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE   77aaayyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE   77zzyyyyyyyyyyyuuuuuuuuuuuuuuuuuuuuuuyyyyyyyyyyyyy
cccttttttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttttt   77zyyyyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyyyy
cccttttttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttttt   77zzyyyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyyyy
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttcc   77aaayyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
cccuuMtttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttMcc   77aaazyyyyyyyyyuuuuuuuuuuuuuuuuuuuuuuyyyyyyyyyyz77
cccuuMEttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttMccc   77caczzyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyzz77
cccuuEEEttEEEttRRRRRRRRRRRRRRRRRRRRRRRttvvvttuuucc   77cac77zyz77zyzuuuuuuuuuuuuuuuuuuuuuuzyzllzyzaaa77
cccuuEEEtMEEEtMRRRRRRRRRRRRRRRRRRRRRRRtMvvvtMuuucc   77aaa77zzz77zzzuuuuuuuuuuuuuuuuuuuuuuzzzllzzzaaa77
cccuuEEEEEEEEwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFMMMcc   77cac7777777wttuuuuuuuuuuuuuuuuuuuuuuutwiiiiinnn77
cccuuEEEEEEEEwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFMvMcc   77cac7777777tttuuuuuuuuuuuuuuuuuuuuuuuttiiiiinln77
cccMMEEEEEEEMwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFvvccc   77jjjjjjjjjjwttuuuuuuuuuuuuuuuuuuuuuuutwiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFvvvcc   77jjjjjjjjjjwttuuuuuuuuuuuuuuuuuuuuuuutwiiiiilll77
cccJJJJJJJJJJwwRRRRRRRRRRRRRRRRRRRRRRRwMFFFFFMvMcc   77jjjjjjjjjjwttuuuuuuuuuuuuuuuuuuuuuuuwwiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFMvMcc   77jjjkkkkkjjtttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFvvccc   77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFvvvcc   77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuuiiiiiiilll77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFMvMcc   77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFMvccc   77jjjkkkkkjjtttuuuuuyuuuuuuulmnpqstuuuiiiiiiinln77
cccJJJJJJJJJJwwwwwwwwwwwwwwwwwwwwwwwwwwMFFFFFvvvcc   77jjjjjjjjjjwtttttttttttttttttttttttttwwiiiiinll77
cccJJJJJJJJJJwwwwwwwwwwwwwwwwwwwwwwwwwwwFFFFFvvMcc   77jjjjjjjjjjwttttttttttttttttttttttttttwiiiiilln77
cccJJJJJJJJJcMMwcMMwcMMwrMrMwrMMwcMMwMMMFFFFFMvMcc   77jjjjjjjjjjwwwtwwwtwwwtwwwwtwwwtwwwtwwwiiiiinln77
cccccccccccccccccccccccrrrrrrrccccccccvvFFFFFvvccc   7777777777777777777777777777777777777nlliiiiinln77
cccccccccccccccccccccccrrrrrrrccccccccvvFFFFFvvvcc   7777777777777777777777777777777777777llliiiiilll77
cccccccccccccccccccccccrrrrrrrccccccccvvvvvvvvvMcc   7777777777777777777777777777777777777nllllllllln77
cccccccccccccccccccccccrrrrrrrccccccccvvvvvvvvvMcc   7777777777777777777777777777777777777nllllllllln77
cccccccccccccccccccccccrrrrrrrccccccccMMvcMcvMMccc   7777777777777777777777777777777777777nnnlnnnlnnn77
cccccccccccccccccccccccrrrrrrrcccccccccccccccccccc   77777777777777777777777777777777777777777777777777
cccccccccccccccccccccccrrrrrrrcccccccccccccccccccc   77777777777777777777777777777777777777777777777777
uMuuMMuuMMuuMMuuMMuuMMMgggggggMMuuMMuuMMuuMMuuMuuu   accacccacccacccacccaccc7777777cccacccacccacccaccaa
uuuuuuuuuuuuuuuuuuuuuuMgggggggMuuuuuuuuuuuuuuuuuuu   aaaaaaaaaaaaaaaaaaaaaac7777777caaaaaaaaaaaaaaaaaaa
uMEuMMEuMMEuMMEuMMEuMMEgggggggMMEuMMEuMMEuMMEuMEuu   accacccacccacccacccaccc7777777cccacccacccacccaccaa
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   7777777zzz77zzz77zzz777777777777zzz77zzz77zzz77777
EEEEEEEEttEEEttEEEttEEEEEEEEEEEEEttEEEttEEEttEEEEE   7777777zyz77zyz77zyz777777777777zyz77zyz77zyz77777
EEEEEEEEttEEEttEEEttEEEEEEEEEEEEEttEEEttEEEttEEEEE   7777777yyy77yyy77yyy777777777777yyy77yyy77yyy77777
EEEEEMtttttttttttttttMMEEEEEEEMtttttttttttttttMMEE   77777zzyyyyyyyyyyyyyyzz7777777zzyyyyyyyyyyyyyyzz77
EEEEEtttttttttttttttttEEEEEEEEtttttttttttttttttEEE   77777zyyyyyyyyyyyyyyyyz7777777zyyyyyyyyyyyyyyyyz77
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE   77zzyyyyyyyyyyyyyyyyyyyzz77zzyyyyyyyyyyyyyyyyyyyyy
EEEttttttttttttttttttttttEEEtttttttttttttttttttttt   77zyyyyyyyyyyyyyyyyyyyyyz77zyyyyyyyyyyyyyyyyyyyyyy
EEEtttttttttttttttttttttMEEEtttttttttttttttttttttt   77zzyyyyyyyyyyyyyyyyyyyzz77zzyyyyyyyyyyyyyyyyyyyyy
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE   77777yyyyyyyyyyyyyyyyyy7777777yyyyyyyyyyyyyyyyyy77
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE   77777yyyyyyyyyyyyyyyyyy7777777yyyyyyyyyyyyyyyyyy77
EEEEEttttttttttttttttttEEEEEEEttttttttttttttttttEE   aazzyyyyyyyyyyyyyyyyyyyzzttzzyyyyyyyyyyyyyyyyyyyyy
uuuttttttttttttttttttttttwwwtttttttttttttttttttttt   aazyyyyyyyyyyyyyyyyyyyyyzttzyyyyyyyyyyyyyyyyyyyyyy
uuutttttttttttttttttttttMwwwtttttttttttttttttttttt   aazzyyyyyyyyyyyzzyzzzyzzzttzzzyzzzyzzyyyyyyyyyyyyy
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE   77aaayyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE   77aaayyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttEE   77zzyyyyyyyyyyyuuuuuuuuuuuuuuuuuuuuuuyyyyyyyyyyyyy
cccttttttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttttt   77zzyyyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyyyy
cccttttttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttttt   77zzyyyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyyyy
cccuuttttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttttcc   77aaayyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyyy77
cccuuMtttttttttRRRRRRRRRRRRRRRRRRRRRRRtttttttttMcc   77aaazyyyyyyyyyuuuuuuuuuuuuuuuuuuuuuuyyyyyyyyyyz77
cccuuMEttttttttRRRRRRRRRRRRRRRRRRRRRRRttttttttMccc   77caczzyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyzz77
cccuuEEEttEEEttRRRRRRRRRRRRRRRRRRRRRRRttvvvttuuucc   77cac77zyz77zyzuuuuuuuuuuuuuuuuuuuuuuzyzllzyzaaa77
cccuuEEEtMEEEtMRRRRRRRRRRRRRRRRRRRRRRRtMvvvtMuuucc   77aaa77zzz77zzzuuuuuuuuuuuuuuuuuuuuuuzzzllzzzaaa77
cccuuEEEEEEEEwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFMMMcc   77cac7777777wttuuuuuuuuuuuuuuuuuuuuuuutwiiiiinnn77
cccuuEEEEEEEEwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFMvMcc   77cac7777777tttuuuuuuuuuuuuuuuuuuuuuuuttiiiiinln77
cccMMEEEEEEEMwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFvvccc   77jjjjjjjjjjwttuuuuuuuuuuuuyuuuuuuuuuutwiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRRRRRRRRRRRwwFFFFFvvvcc   77jjjjjjjjjjwttuuuuuuuuuuuuuuuuuuuuuuutwiiiiilll77
cccJJJJJJJJJJwwRRRRRRRRRRRRRRRRRRRRRRRwMFFFFFMvMcc   77jjjjjjjjjjwttuuuuuuuuuuuuuuuuuuuuuuuwwiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFMvMcc   77jjjkkkkkjjtttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFvvccc   77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFvvvcc   77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuuiiiiiiilll77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFMvMcc   77jjjkkkkkjjwttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
cccJJJJJJJJJJwwRRRRRRRRRRRRRkkkkkkkkRRFFFFFFFMvccc   77jjjkkkkkjjtttuuuuuuuuuuuuulmnpqstuuuiiiiiiinln77
cccJJJJJJJJJJwwwwwwwwwwwwwwwwwwwwwwwwwwMFFFFFvvvcc   77jjjjjjjjjjwtttttttttttttttttttttttttwwiiiiinll77
cccJJJJJJJJJJwwwwwwwwwwwwwwwwwwwwwwwwwwwFFFFFvvMcc   77jjjjjjjjjjwttttttttttttttttttttttttttwiiiiilln77
cccJJJJJJJJJcMMwcMMwcMMwrMrMwrMMwcMMwMMMFFFFFvvMcc   77jjjjjjjjjjwwwtwwwtwwwtwwwwtwwwtwwwtwwwiinnlnln77
cccccccccccccccccccccccrrrrrrrccccccccvvFFFvvvvccc   7777777777777777777777777777777777777nlliinlllln77
cccccccccccccccccccccccrrrrrrrccccccccvvFFFvvvvvcc   7777777777777777777777777777777777777llliillllll77
cccccccccccccccccccccccrrrrrrrccccccccvvvvvvvvvMcc   7777777777777777777777777777777777777nllllllllln77
cccccccccccccccccccccccrrrrrrrccccccccvvvvvvvvvMcc   7777777777777777777777777777777777777nllllllllln77
cccccccccccccccccccccccrrrrrrrccccccccMMvcMcvMMccc   7777777777777777777777777777777777777nnnlnnnlnnn77
cccccccccccccccccccccccrrrrrrrcccccccccccccccccccc   77777777777777777777777777777777777777777777777777
cccccccccccccccccccccccrrrrrrrcccccccccccccccccccc   77777777777777777777777777777777777777777777777777
uMuuMMuuMMuuMMuuMMuuMMMgggggggMMuuMMuuMMuuMMuuMuuu   accacccacccacccacccaccc7777777cccacccacccacccaccaa
uuuuuuuuuuuuuuuuuuuuuuMgggggggMuuuuuuuuuuuuuuuuuuu   aaaaaaaaaaaaaaaaaaaaaac7777777caaaaaaaaaaaaaaaaaaa
uMEuMMEuMMEuMMEuMMEuMMEgggggggMMEuMMEuMMEuMMEuMEuu   accacccacccacccacccaccc7777777cccacccacccacccaccaa
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
How much the plans of the seeds differ: 0.11 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 218 nodi, 898 passi, finito in 530 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=sala di guardia, z=sala del mastio, w=muro del mastio, s=vano scala, t=torre angolare, v=muro del bastione, a=bastione laterale, c=cortile, u=muretto di cinta, g=varco del cortile, d=soglia del portone, r=strada lastricata, p=tettoia dell'armeria, m=magenta, b=pilastro in legno, f=pavimento in tavole, F=solaio in legno, R=lastrico del terrazzo, Y=Yellow, y=yellow, I=trave di quercia, J=tetto in coppi, K=camino in pietra, L=finestra, C=stendardo di confine, D=pavimento della cantina, T=Teal (marcatore), k=gradini, V=muro della cantina, O=portone in legno, o=assi del portone, N=stipite in pietra, M=merratura, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: t 144820, w 54933, U 17049, k 7840, u 5750, v 4917, L 2576, M 2392, f 2381, E 2300, o 2130, F 1965, R 1640, V 1596, c 1175, J 880, N 255, r 200, O 120, D 100, g 75, K 11, I 4, C 4.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-55 all×33, one×3, prl×2: 358 celle x0-19 y1-19 z20, passi 2-77
   #57 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 78
#59-62 all×4: 19600 celle x25-79 y25-74 z19-60, passi 79-119
#63-68 all×4, prl×1: 22650 celle x25-79 y25-74 z20-83, passi 120-206
    #69 all . t → t * passi=46: ×46, 115000 celle x5-99 y5-49 z21-66, passi 207-252, .→t 115000
    #70 all . t → t Y passi=12: ×12, 60000 celle x5-99 y5-49 z66-78, passi 253-264, t→Y 30000, .→t 30000
    #71 all . t → t * passi=17: ×17, 42500 celle x5-99 y5-49 z79-95, passi 265-281, .→t 42500
#73-77 all×4: 10450 celle x75-94 y45-79 z20-59, passi 282-321
    #78 all . a → a . passi=31: ×31, 20150 celle x75-89 y45-74 z21-52, passi 322-352, a→. 10075, .→a 10075
#79-83 all×3, prl×2: 11135 celle x5-89 y45-74 z20-53, passi 353-389
#84-98 all×4, prl×1: 25815 celle x0-99 y25-89 z20-53, passi 390-433
    #99 all . h → h . passi=31: ×31, 93000 celle x30-74 y30-69 z21-52, passi 434-464, h→. 46500, .→h 46500
#100-103 all×4: 22200 celle x30-74 y30-69 z21-54, passi 465-527
    #104 all . h → h . passi=31: ×31, 93000 celle x30-74 y30-69 z53-84, passi 528-558, h→. 46500, .→h 46500
#105-106 all×2: 18200 celle x50-74 y30-69 z53-84, passi 559-619
#107-162 prl×7, all×4: 13332 celle x6-74 y30-73 z0-84, passi 620-662
#163-165 all×2, prl×1: 19520 celle x55-70 y60-69 z22-84, passi 663-693
#166-185 all×9, prl×2, one×1: 15596 celle x15-94 y5-74 z20-84, passi 694-793
    #186 prl Y → w: ×1, 38424 celle x5-99 y5-79 z28-77, passi 794, Y→w 38424
#192-218 all×11, prl×2, one×2: 21559 celle x0-99 y5-89 z30-99, passi 795-898
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#29 all c/E/E/E/E/E → */c/c/c/*/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all c/c/w → W/*/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#31 all Wc → *W: in quel momento nella griglia non c'erano celle "W"
#35 all W/c → */W: in quel momento nella griglia non c'erano celle "W"
#36 all W/E → */W: in quel momento nella griglia non c'erano celle "W"
#37 all WE/*W → *W/**: in quel momento nella griglia non c'erano celle "W"
#38 all EE/EW → **/*q: in quel momento nella griglia non c'erano celle "W"
#39 all q[EW] → *q (+1) passi=2: in quel momento nella griglia non c'erano celle "q"
#41 all uE/*u → *u/**: le celle cercate c'erano, ma mai disposte come nel pattern
#42 one cccc/cccc/cccc/cccc → ****/*Q**/****/**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#45 all r/W → */G: in quel momento nella griglia non c'erano celle "W"
… e altri 79
Fix it and answer with the whole program.

## Risposta

<!--
  Rocca di confine (border stronghold with cellar):
  - Main keep (mastio): front hall `h`, back hall over cellar `z`, stair zone `s`, stone walls `w`.
    Interior width is 10 cells (50 voxels >= 44 for part-cellar), depth 8-9 cells (40-45 voxels).
    `z` is 10 cells wide (50 voxels) and 4 cells deep (20 voxels >= 14), leaving a 10x16 clear cellar room
    at z=0 that the cellar stair reaches directly.
    `s` is placed 1 cell away from the right wall so there is 5 voxels of landing past the top step at z=52,
    allowing the wanderer to step off onto the covered second storey.
  - Corner towers `t` on the rear corners of the keep, plus a bastion wing `a` (walls `v`) on one side chosen by the seed,
    connected to the keep interior by an internal doorway.
  - A timber lean-to / armory porch `p` (4 cells = 20 voxels deep, 33 clear height) against the side of the keep.
  - At Large (20x20): keep, rear corner towers, side bastion wing, lean-to, front courtyard `c` with parapet wall `u`, gate `g` and road `r`.
  - At Huge (30x30): outer courtyard `c` around the keep enclosed by curtain wall `W`, corner watchtowers `q`, gatehouse `G`, and well `Q`.
-->
<sequence values="BHEhzwstvacuWqgGdrpQ" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhzwstvacuWqgGdrpQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep interior around H: 4 behind, 3 in front (+1 by chance), 4 left and 5 right (width 10 = 50 voxels, depth 8-9 = 40-45 voxels) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*h" symmetry="()" steps="1"/>

      <!-- Way out marker m traced straight from H to the front before z overwrites H -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>

      <!-- Keep walls w -->
      <all in="[Hhm]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Rear corner towers t (3x3 cells = 15x15 voxels) on back outer corners of keep -->
      <all in="EE/Ew" out="**/*t" symmetry="(x)" steps="1"/>
      <all in="t[Ew]" out="*t" symmetry="(xy)" steps="2"/>
      <all in="t*/*[Ew]" out="**/*t" symmetry="(xy)" steps="2"/>

      <!-- Side bastion wing a with walls v on one side of the keep (seed decides side, position and size) -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <one in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <one in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Covered lean-to shelter p (4 cells = 20 voxels deep, 4-5 cells wide) on the free side wall -->
      <one in="Ew/Ew/Ew/Ew" out="p*/p*/p*/p*" symmetry="(x)" steps="1"/>
      <one in="E/p" out="p/*" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="3"/>

      <!-- Front forecourt c -->
      <all in="[wvp]/E" out="*/c" symmetry="()" steps="2"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>

      <!-- Only at Huge (where >= 5 cells of E remain in front of the forecourt c): expand outer courtyard c around the keep and enclose with curtain wall W and corner watchtowers q -->
      <all in="c/E/E/E/E/E" out="*/c/c/c/*/*" symmetry="()" steps="1"/>
      <all in="c/c/w" out="W/*/*" symmetry="()" steps="1"/>
      <all in="Wc" out="*W" symmetry="(x)"/>
      <all in="cE" out="*c" symmetry="(x)" steps="4"/>
      <all in="E/c" out="c/*" symmetry="()" steps="9"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="W/c" out="*/W" symmetry="()"/>
      <all in="W/E" out="*/W" symmetry="()"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Outer corner watchtowers q on convex corners of the curtain wall W (only present at Huge) -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="2">
        <rule in="q[EW]" out="*q"/>
        <rule in="q*/*[EW]" out="**/*q"/>
      </all>

      <!-- Low parapet wall u around front forecourt at Large (where c still touches E) -->
      <all in="cE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Well Q in the courtyard if a 4x4 clear space of c exists (occurs at Huge) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>

      <!-- Door d in keep front wall, road r across courtyard, gatehouse G in curtain wall W, gate g in parapet u -->
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="r/u" out="*/g" symmetry="()"/>
      <all in="[Ggr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="gu" out="*g" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Mark cellar room z in the back 4 rows of the keep (10 cells = 50 wide, 4 cells = 20 deep, 20-25 voxels back from front wall) -->
      <all in="w/h" out="*/z" symmetry="()" steps="1"/>
      <all in="z/h" out="*/z" symmetry="()" steps="3"/>

      <!-- Stair zone s in the front hall h: 5 cells (25 voxels) of landing before it, 4 cells (20 voxels) long, 1 cell (5 voxels) landing after it before the right wall -->
      <one in="hhhhhhhhhh/hhhhhhhhhh/wwwwdddwww" out="*****ssss*/*****ssss*/**********" symmetry="()" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhzwstvacuWqgGdrpQbfFRYyIJKLCPDTkVOoNMU#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="Q" out="ccccc/cWWWc/cWQWc/cWWWc/ccccc"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wvtWquGKP"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wvtWqG"/>

        <!-- Mark D under the cellar room z at z=19 (first layer under the soil) -->
        <all in="z B" out="* D" symmetry="()"/>

        <!-- Keep walls w: 2 storeys (64 steps) with window bands Y -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B w" out="w *" steps="20"/>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B w" out="w *" steps="11"/>
        <prl in="w" out="w"/>

        <!-- Front door wall d: seed O at z=20 (the floor layer), then 63 steps of wall w above -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="62"/>
        <prl in="d" out="w"/>

        <!-- Rear corner towers t: 74 steps high with window band Y -->
        <all in="B t" out="t *" steps="46"/>
        <all in="B t" out="t Y" steps="12"/>
        <all in="B t" out="t *" steps="15"/>
        <prl in="t" out="t"/>

        <!-- Side bastion walls v (40 high) and interior room a (floor f at z=20, 31 air, terrace slab F at z=52) -->
        <all in="B v" out="v *" steps="10"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v *" steps="19"/>
        <prl in="v" out="v"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <prl in="a" out="B"/>

        <!-- Lean-to shelter p and timber posts b: clear height 33 (person 24, >= 30 clear), roof J at 34 -->
        <all in="B b" out="b I" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B p" out="y f" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <prl in="y" out="J"/>

        <!-- Outer curtain wall W (26 high), corner watchtowers q (42 high), low parapet u (10 high), well water Q -->
        <all in="B W" out="W *" steps="25"/>
        <prl in="W" out="W"/>
        <all in="B q" out="q *" steps="41"/>
        <prl in="q" out="q"/>
        <all in="B u" out="u *" steps="9"/>
        <prl in="u" out="u"/>
        <all in="B Q" out="Q *" steps="4"/>
        <prl in="Q" out="Q"/>

        <!-- Outer gatehouse G: open gateway below (31 high), stone arch and chamber above up to 46 -->
        <all in="B G" out="G B" steps="31"/>
        <all in="B G" out="G W" steps="14"/>
        <prl in="G" out="W"/>

        <!-- Keep interior floors (h, z, s): ground floor f at z=20, second storey slab F at z=52, roof slab R at z=84 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B z" out="z f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=21 above s (only 1 stair strip so the second storey landing at z=53..83 is open and walkable) -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B z" out="z B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>

        <!-- Second floor slab F at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B z" out="z F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all in="B h" out="h B" steps="31"/>
        <all in="B z" out="z B" steps="31"/>
        <all in="B s" out="s B" steps="31"/>

        <!-- Roof terrace R at z=84 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="z" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Dig cellar under z before part-stair -->
        <import file="part-cellar"/>

        <!-- Build interior stairs -->
        <import file="part-stair"/>

        <!-- Build front door from seed O (15 wide x 5 thick at z=20 with wall w above) -->
        <import file="part-door"/>

        <!-- Restore floor f on the threshold under the door -->
        <all in="d O" out="* f" symmetry="()"/>
        <all in="d o" out="* f" symmetry="()"/>

        <!-- Windows L in the window bands Y on all sides -->
        <one steps="18">
          <rule in="BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="w"/>

        <!-- Battlements and arrow slits on all flat wall tops -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Pitched hip roof J on the lean-to shelter -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>

        <!-- Stone chimney K on the keep roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- Wooden banner pole I with red banner C on a rear tower -->
        <one in="B B t" out="* I *" steps="1" symmetry="()"/>
        <all in="B I" out="I *" steps="12"/>
        <all in="IB" out="*C" steps="3" symmetry="()"/>
      </sequence>
    </map>
  </map>

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

  <color symbol="E" hidden="True"/>
  <color symbol="c" value="a89c86" name="cortile" area="courtyard"/>
  <color symbol="r" value="948a78" name="strada lastricata" area="road"/>
  <color symbol="g" value="948a78" name="varco del cortile" area="road"/>
  <color symbol="h" value="b89c72" name="sala di guardia" area="keep"/>
  <color symbol="z" value="b89c72" name="sala del mastio" area="keep"/>
  <color symbol="s" value="b89c72" name="vano scala" area="keep"/>
  <color symbol="a" value="b89c72" name="bastione laterale" area="keep"/>
  <color symbol="p" value="9e8c70" name="tettoia dell'armeria" area="yard"/>
  <color symbol="d" value="b89c72" name="soglia del portone" area="keep"/>
  <color symbol="G" value="948a78" name="passo del corpo di guardia" area="road"/>

  <color symbol="w" value="84827c" name="muro del mastio"/>
  <color symbol="t" value="6e6c66" name="torre angolare"/>
  <color symbol="v" value="787670" name="muro del bastione"/>
  <color symbol="W" value="74726c" name="cinta muraria"/>
  <color symbol="q" value="64625c" name="torretta di guardia"/>
  <color symbol="u" value="8c8880" name="muretto di cinta"/>
  <color symbol="M" value="7c7a74" name="merratura"/>
  <color symbol="U" value="2a2826" name="feritoia"/>
  <color symbol="P" value="7c7a74" name="parapetto"/>
  <color symbol="K" value="645e58" name="camino in pietra"/>

  <color symbol="f" value="9c744c" name="pavimento in tavole"/>
  <color symbol="F" value="8c643e" name="solaio in legno"/>
  <color symbol="R" value="78746e" name="lastrico del terrazzo"/>
  <color symbol="k" value="a67c52" name="gradini"/>
  <color symbol="I" value="6e4c2e" name="trave di quercia"/>
  <color symbol="b" value="6e4c2e" name="pilastro in legno"/>
  <color symbol="J" value="a84a32" name="tetto in coppi"/>
  <color symbol="C" value="b83228" name="stendardo di confine"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="Q" value="4a7c9b" name="acqua del pozzo"/>

  <color symbol="D" value="6e6254" name="pavimento della cantina" area="cellar"/>
  <color symbol="V" value="58524a" name="muro della cantina"/>

  <color symbol="O" value="7a4e2d" name="portone in legno"/>
  <color symbol="o" value="54341c" name="assi del portone"/>
  <color symbol="N" value="5e5c56" name="stipite in pietra"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
</sequence>
