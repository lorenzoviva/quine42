# model.sculpt · correzione · gemini-4-argon · 38 s · 26066 token d'ingresso (0 in cache), 5219 d'uscita, 0 di ragionamento · $0.10

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
  Concept: Rocca di confine (border stronghold / fortified keep with cellar)
  Parts & Letters:
  - h, q, s: interior floor of the main keep (h = middle cellar zone over D, 11x4 cells = 55x20 voxels; s = stair zone along back wall, 4x2 cells; q = back landing & front entrance zone clear of cellar, 10 voxels deep at front)
  - w: thick stone walls of the main keep
  - b, v: fortified corner bastion tower (b = interior floor, v = bastion walls), placed on a rear corner
  - a, u: side armory / guard annex wing (a = interior floor, u = wing walls), grown on a side at random
  - p: covered wooden lean-to / porch along the keep wall (at least 4 cells = 20 voxels deep)
  - c, l: inner bailey courtyard around the keep (textured with convchain flagstones l and dirt c), grown where space allows (Huge)
  - W: outer curtain wall enclosing the bailey (at Huge)
  - t: outer watchtowers on the corners of the curtain wall (at Huge)
  - G: fortified gatehouse through the outer curtain wall (at Huge)
  - d: main keep doorway (3 cells wide at front center)
  - n, r: paved approach road from the keep door through the bailey and gatehouse to the map edge
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhqswbvaucpWtlGdnrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep interior: 11 cells wide along x (5 each side of H = 55 voxels) -->
      <!-- 5 cells behind H (rows y_H-5 to y_H-1) and 2 cells in front of H (rows y_H+1 to y_H+2) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="5"/>
      <all in="[Hh]/E" out="*/q" symmetry="()" steps="2"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <all in="qE" out="*q" symmetry="(x)" steps="5"/>

      <!-- Keep walls w -->
      <all in="[hq]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Back 2 rows inside keep become s (stair zone, 4x2) and q (back landing, clear of cellar D) -->
      <!-- This leaves rows y_H-3 to y_H as h: 11x4 cells = 55x20 voxels for cellar D, and 10 voxels of q in front of D -->
      <one in="wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw" out="wwwwwwwwwww/wqqqssssqqw/wqqqssssqqw" symmetry="()" steps="1"/>

      <!-- Corner bastion tower (v/b) on a rear corner of the keep -->
      <one in="EEw/EEw/EEw" out="bbv/bbv/vvv" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="1"/>
      <all in="E/b" out="b/*" symmetry="()" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Guard annex wing (u/a) on a side wall of the keep -->
      <one in="EEw/EEw/EEw/EEw" out="aau/aau/aau/aau" symmetry="(x)" steps="1"/>
      <prl in="E/a" out="a/*" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Keep front door d (3 cells wide) and road axis m -->
      <all in="H/q" out="*/m" symmetry="()" steps="2"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="q"/><rule in="H" out="h"/></prl>

      <!-- Outer bailey courtyard c and curtain wall W ONLY where at least 6 cells of ground E extend past the keep (Huge size) -->
      <all in="[wvu]EEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**" steps="15"/>
      <all in="c[wvu]/*E" out="**/*c" steps="8"/>
      <all in="cE/*c" out="*c/**" steps="15"/>

      <!-- Wooden lean-to / porch p (at least 4 cells = 20 voxels deep) against keep or wing wall -->
      <one in="www/ccc/ccc/ccc/ccc" out="***/ppp/ppp/ppp/ppp" symmetry="(xy)" steps="1"/>
      <one in="www/EEE/EEE/EEE/EEE" out="***/ppp/ppp/ppp/ppp" symmetry="(xy)" steps="1"/>

      <!-- Outer curtain wall W around courtyard c (at Huge) -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner watchtowers t on outer corners of curtain wall W -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Road and Gatehouse G from front door d straight to the front edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[ndGr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Courtyard texture with flagstones l -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>cccll/cccll/clllc/lllcc/cllcc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhqswbvaucpWtlGdnrfFRJPKLxyOoNTkMDVU#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pxxxp/pxxxp/pxxxp/ppppp"/>

      <sequence symmetry="(xy)">
        <!-- Unions for parts -->
        <union symbol="+" values="wvuWtG"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wvuWtG"/>

        <!-- Mark cellar D under room h on the first layer under the soil (z=19) before h rises -->
        <all in="h B" out="* D" symmetry="()"/>

        <!-- B. Heights -->
        <!-- Main keep walls w and door column d: 2 storeys = 64 high (with window bands P) -->
        <all steps="8"><rule in="B w" out="w *"/><rule in="B d" out="d w"/></all>
        <all steps="12"><rule in="B w" out="w P"/><rule in="B d" out="d w"/></all>
        <all steps="20"><rule in="B w" out="w *"/><rule in="B d" out="d w"/></all>
        <all steps="12"><rule in="B w" out="w P"/><rule in="B d" out="d w"/></all>
        <all steps="12"><rule in="B w" out="w *"/><rule in="B d" out="d w"/></all>

        <!-- Main keep interior h, q, s: 2 covered storeys (floor f at z=20, slab F at z=52, roof slab R at z=84) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B q" out="q f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=21 (just above floor f) -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all steps="30"><rule in="B s" out="s B"/></all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B q" out="q B"/>
        </all>
        <!-- First floor slab F at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B q" out="q F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second storey air (31 high) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B q" out="q B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Roof terrace slab R at z=84 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="q" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Corner bastion tower (v walls, b floor): 72 high (taller than main keep) -->
        <all steps="10"><rule in="B v" out="v *"/></all>
        <all steps="12"><rule in="B v" out="v P"/></all>
        <all steps="22"><rule in="B v" out="v *"/></all>
        <all steps="12"><rule in="B v" out="v P"/></all>
        <all steps="16"><rule in="B v" out="v *"/></all>

        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <all in="B b" out="b F" steps="1"/>
        <all in="B b" out="b B" steps="38"/>
        <prl in="b" out="R"/>

        <!-- Side armory wing (u walls, a floor): 1 storey = 32 high -->
        <all steps="8"><rule in="B u" out="u *"/></all>
        <all steps="12"><rule in="B u" out="u P"/></all>
        <all steps="12"><rule in="B u" out="u *"/></all>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="30"/>
        <prl in="a" out="R"/>

        <!-- Wooden lean-to p / x: clear height 31, roof J at 32 -->
        <all in="B x" out="x f" steps="1"/>
        <all in="B x" out="x y" steps="31"/>
        <prl in="x" out="J"/>
        <all in="B p" out="y f" steps="1"/>
        <all in="B y" out="y B" steps="31"/>
        <prl in="y" out="J"/>
        <!-- Corner posts of the lean-to -->
        <all in="fJ/ff" out="*y/**" steps="1"/>
        <all in="B y" out="y *" steps="31"/>

        <!-- Outer curtain wall W (24 high), corner watchtowers t (38 high), gatehouse G (34 high) -->
        <all in="B W" out="W *" steps="23"/>
        <all in="B t" out="t *" steps="37"/>
        <all in="B G" out="G *" steps="33"/>

        <!-- C. Full scale: cellar, stairs, doors, battlements, slits, windows, details -->
        <!-- 1. Cellar under h (dug before part-stair) -->
        <import file="part-cellar"/>

        <!-- 2. Main stair inside keep -->
        <import file="part-stair"/>

        <!-- 3. Door seeds O -->
        <!-- Front keep door where road n or r meets door wall w -->
        <all in="w/[nr]" out="O/*" symmetry="()" steps="1"/>
        <all in="w/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Gatehouse passage through G where road r meets G -->
        <all in="G/r" out="O/*" symmetry="()" steps="1"/>
        <all in="G/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Internal doors between keep (f) and bastion (b) or armory (a) -->
        <one in="fwwwwwf" out="*OOOOO*" symmetry="(xy)" steps="2"/>
        <all in="O/[wv]" out="*/O" symmetry="(xy)" steps="5"/>
        <all in="[wv]/O" out="O/*" symmetry="(xy)" steps="5"/>

        <!-- Raise all doors -->
        <import file="part-door"/>

        <!-- 4. Battlements and arrow slits on fortifications -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 5. Windows in wall bands P -->
        <one steps="18">
          <rule in="BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LPPPPB" out="*LLLL*"/>
        <prl in="P" out="w"/>

        <!-- 6. Chimney / watch-brazier K on the roof -->
        <one in="R B B" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- Lean-to roof pitch -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="4" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette -->
  <color symbol="E" value="7a8a58" name="erba di confine"/>
  <color symbol="H" value="8c7355" name="centro rocca" hidden="True"/>
  <color symbol="h" value="947858" name="sala superiore" area="keep"/>
  <color symbol="q" value="9c805e" name="ingresso rocca" area="keep"/>
  <color symbol="s" value="846648" name="vano scala" area="keep"/>
  <color symbol="w" value="827e78" name="muro del mastio" area="keep"/>
  <color symbol="b" value="8e7254" name="interno torrione" area="tower"/>
  <color symbol="v" value="74706c" name="muro del torrione" area="tower"/>
  <color symbol="a" value="967a5a" name="armeria laterale" area="keep"/>
  <color symbol="u" value="7c7872" name="muro armeria" area="keep"/>
  <color symbol="p" value="a48458" name="tettoia in legno" area="yard"/>
  <color symbol="x" value="a48458" name="interno tettoia" area="yard"/>
  <color symbol="y" value="6e5236" name="trave in legno"/>
  <color symbol="J" value="9e4b34" name="tetto della tettoia"/>
  <color symbol="c" value="888068" name="cortile d'armi" area="courtyard"/>
  <color symbol="l" value="98948a" name="lastricato del cortile" area="courtyard"/>
  <color symbol="W" value="76726c" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="6a6660" name="torretta di guardia" area="tower"/>
  <color symbol="G" value="807a72" name="corpo di guardia" area="courtyard"/>
  <color symbol="d" value="6e5236" name="soglia del mastio" area="keep"/>
  <color symbol="n" value="a09a8e" name="via lastricata" area="courtyard"/>
  <color symbol="r" value="928c7e" name="strada di confine" area="yard"/>
  <color symbol="m" value="9c805e" name="asse ingresso" hidden="True"/>
  <color symbol="f" value="8c6d4e" name="pavimento in assi"/>
  <color symbol="F" value="7a5c3e" name="solaio in legno"/>
  <color symbol="R" value="706c66" name="lastrico del terrazzo"/>
  <color symbol="P" value="827e78" name="fascia muraria"/>
  <color symbol="L" value="384858" name="finestra"/>
  <color symbol="K" value="5c5652" name="camino in pietra"/>
  <color symbol="O" value="6e4c2e" name="portone in quercia"/>
  <color symbol="o" value="4e341e" name="assi del portone"/>
  <color symbol="N" value="64605a" name="stipite in pietra"/>
  <color symbol="T" value="846648" name="traccia scala"/>
  <color symbol="k" value="785a3c" name="gradini"/>
  <color symbol="M" value="7a7670" name="merlatura"/>
  <color symbol="U" value="2a2826" name="feritoia"/>
  <color symbol="D" value="68625a" name="pavimento cantina"/>
  <color symbol="V" value="58544e" name="muro cantina"/>
  <color symbol="#20" value="6e4c2e" hidden="True"/>
  <color symbol="#21" value="4e341e" hidden="True"/>

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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); porta: 21 × 8 voxel (1,31 × 0,50 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 24 voxel (1,50 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba di confine, w muro del mastio, v muro del torrione, u muro armeria, c cortile d'armi, W cinta muraria, t torretta di guardia, l lastricato del cortile, d soglia del mastio, r strada di confine, f pavimento in assi, F solaio in legno, R lastrico del terrazzo, J tetto della tettoia, K camino in pietra, L finestra, O portone in quercia, o assi del portone, N stipite in pietra, k gradini, M merlatura, D pavimento cantina, V muro cantina, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEMtttttttEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEttttttttEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEtttttttMEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
WWWWWWWWWWMttttttEEEEEEEEJJJJJJJJEEMttttttEEEEEEEE
WWWWWWWWWWMtttttttEEEEEEEJJJJJJJJEEMtttttttEEEEEEE
cccccccccccccttttMEEEEEEEJJJJJJJJEEtttttttMWWWWWWW
cccccccccccccttttMEEEEEEEJJJJJJJJEEtttttttMWWWWWWW
cccccccccccccWtMMEEEEEEEEJJJJJJJJEEMtttttMcWWWWWWW
cccllccccclllWWEEEEEEEEEEJJJJJJJJEEtttttccccccccll
cccllccccclllWWEEEEEEEEEEJJJJJJJJEEtttttccccccccll
ccccccccccMMwwMMwwMMwwMwwMwwMMwwMMwwMMwwMMMccccccc
ccccccccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccccccc
ccccccccccwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccc
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc
ccccccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc
vMvvMMvvMMwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccccccc
vvvvvvvvvvwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc
vvvvRMvRMMwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc
vvvRRRRRRRwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwuuuuuuuu
vvvRRRRRRRwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwuuuuuuu
vvvRRRRRRRMMMRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMRRRRRuu
vvvRRRRRRRMvMRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMRRRRRuu
vvvRRRRRRRvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRwMRRRRRRuu
vvvRRRRRRRvvvRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu
vvvRRRRRRRMvMRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu
vvvvvvvvvvvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu
vvvvvvvvvvvvMRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu
cvMMcvMMcvMMRRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu
ccccccccccMwwwwwwwwwwwwdddddddwwwwwwwwwwuuuRRRRRuu
ccccccccccMwwwwwwwwwwwwdddddddwwwwwwwwwwuuuRRRRRuu
ccccccccccMMcwMMcwMMcwMdddddddcMwJMMwJMMuuuRRRRuuu
cccllcccccccccccccllcccWWrrrWWcccJJJJJJJuuuuuuuuuu
cccllcccccccccccccllcccWWrrrWWcccJJJJJJJuuuuuuuuuu
lllllccccccccccccccccccWWrrrWWcccJJJJJJJcccllccccc
lllllccccccccccccccccccWWrrrWWcccJJJJJJJcccllccccc
lllllcccccccccccccccccWWWrrrWWcccJJJJJJJcclllccccc
lllllccccccccccccclllllWWrrrWWcccJJJJJJJllllllllll
lllllccccccccccccclllllWWrrrWWcccJJJJJJJllllllllll
lllllccccccccccccccccccttMMMWWcccJJJJJJJccclllllll
lllllccccccccccccccccccttttWWWcccJJJJJJJccclllllll
lllllcccccccccccccccccttttttWWcccJJJJJJJccclllllll
WWWWWWWWWWWWWWWWWWWWMtttttttttlllcclllllccccccccll
WWWWWWWWWWWWWWWWWWWWMtttttttttlllcclllllccccccccll
EEEEEEEEEEEEEEEEEEEEtttttttttttMMWWWWWWWWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEttttttttttttMWWWWWWWWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEMMEtMtttttttMWWWWWWWWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEEEEEEttttttttEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEtttttttMEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
7777777777mkkkkkkk7777777iiiiiiii77777777777777777
7777777777kkkkkkkk7777777ijjjjjji77777777777777777
ffffffffffmkkkkkkm7777777ijjjjjji77mmmmkmmm7777777
ffffffffffmkkkkkkm7777777ijjjjjji77mkkkkkkm7777777
ffffffffffmmkkkkkk7777777ijjjjjji77mkkkkkkk7777777
777777777777kkkkkm7777777ijjjjjji77kkkkkkkmfffffff
777777777777mkkkkm7777777ijjjjjji77mkkkkkkmfffffff
777777777777mmkmmm7777777ijjjjjji77mkkkkkmmfffffff
777777777777fff7777777777ijjjjjji77kkkkk7777777777
777777777777fff7777777777iiiiiiii77kkkkk7777777777
7777777777wwwuwwwuwwwuwwuwwuwwwuwwwuwwwuwww7777777
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
zzxzzzxzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
xxxxxxxxxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
xxxxzzxzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
xxxwwwwwwwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
xxxwwwwwwwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiii
xxxwwwwwwwzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
xxxwwwwwwwzxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
xxxwwwwwwwzxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuwwiiiiiii
xxxwwwwwwwxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
xxxwwwwwwwzxzuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
xxxxxxxxxxxxzuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
xxxxxxxxxxxxzuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
zxzzzxzzzxzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiiiiii
7777777777wwwuwwwuwwwuwuuuuuuuwwuwwwuwwwiiiiiiiiii
7777777777777777777777fff77fff77ijjjjjjiiiiiiiiiii
7777777777777777777777fff77fff77ijjjjjjiiiiiiiiiii
7777777777777777777777fff77fff77ijjjjjji7777777777
7777777777777777777777fff77fff77ijjjjjji7777777777
7777777777777777777777fff77fff77ijjjjjji7777777777
7777777777777777777777fff77fff77ijjjjjji7777777777
7777777777777777777777fff77fff77ijjjjjji7777777777
7777777777777777777777mmkmmmff77ijjjjjji7777777777
7777777777777777777777mkkkkmff77ijjjjjji7777777777
ffffffffffffffffffffmmkkkkkkmm77iiiiiiii7777777777
ffffffffffffffffffffmkkkkkkkkm77777777777777777777
ffffffffffffffffffffmkkkkkkkkk77777777777777777777
77777777777777777777kkkkkkkkkkkmmfffffffffffffffff
77777777777777777777mkkkkkkkkkkkmfffffffffffffffff
77777777777777777777mmmkmkkkkkkkmfffffffffffffffff
7777777777777777777777777kkkkkkkk77777777777777777
7777777777777777777777777kkkkkkkm77777777777777777
```
Front (looking from the front; the sky at the top):
```
MMMMMMMMMMMM......................................
MMMMMMMMMMMMM.....................................
MMMMMMMMMMMMM.....................................
vvvvvvvvvvvvv.....................................
vvvvvvvvvvMMM.MM..MM..M..M..MMMMMMMMMMMMMM........
vvvUvvvUvvMMM.MMM.MMM.MM.MM.MMMMMMMMMMMMMMM.......
vvvUvvvUvvMMM.MMM.MMM.MM.MM.MMMMMMMMMMMMMMM.......
vvvvvvvvvvwwwwwwwwwwwwMdddddddwwwwwwwwwwwww.......
vvvvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
vvvvvvvvvvwUwwwUwwwUwwwwwwwwwwwwwwwwwwwwwUw.......
vvvvvvvvvvwUwwwUwwwUwwwwwwwwwwwwwwwwwwwwwUw.......
vvvvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
wwwwwwwwwwwwwwwLLLwwwwwwwwwwwwwwwwwwLLLwwww.......
wwwwwwwwwwwwwwwLLLwwwwwwwwwwwwwLLLwwLLLwwww.......
wwwwwwwwwwwwwwwLLLwwwwwwwwwwwwwLLLwwLLLwwww.......
wwwwwwwwwwwwwwwLLLwwwwwwwwwwwwwLLLwwLLLwwww.......
vvvvvvvvvvwwwwwwwwwwMMMMMMMMwMwMMLwwwwwwwww.......
vvvvvvvvvvwwwwwwwwwwMMMMMMMMwMwMMwwwwwwwwww.......
vvvvvvvvvvwwwwwwwwwwMMMMMMMMwMwMMwwwwwwwwww.......
vvvvvvvvvvwwwwwwwwwwtttttttttttttwwwwwwwwww.......
vvvvvvvvvvwwwwwwwwwwtUttttUttttttwwJJJwwwww.......
vvvvvvvvvvwwwwwwwwwwtUttttUttttttJJJJJJJuuuuuuuuuu
vvvvvvvvvvwwwwwwwwwwtUttttUttttttJJwJwJJuuuuuuuuuu
vvvvvvvvvvwwwwwwwwwwtttttttttttttJJwJwJJuuuuuuuuuu
vvvvvvvvvvwwwwwwwwwwtttttttttttttJJwJwJJuuuuuuuuuu
vvvvvvvvvvwwwwwwwwwwtttttttttttttJJwJwJJuuuuuuuuuu
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEEEEEEttttttttEEEEEEEEEEEEEEEEE
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............DDDDDDDDDDDDDDDDDDDDDDDDDDDD..........
```
Right side (looking from the right):
```
...............MM...MM..M.M.......................
...............MMM..MMM.MMMM......................
...............MMM..MMM.MMMM......................
...............vvvvvvvvvvvvv......................
..........MM..MvvMRvMMvvvvvv..MM..................
..........MMM.MMUMMvMMMvvvvvM.MMM.................
..........MMM.MMUMMvMMMvvvvvM.MMM.................
..........wwwwwwwwwwwwwRRRRRRRwww.................
..........wwwwwwwwwwwwwvvvvvwwwww.................
..........wUwwwwwwwwwUwvvvvvwwwUw.................
..........wUwwwwwwwwwUwvvvvvwwwUw.................
..........wwwwwwwwwwwwwvvvvvwwwww.................
..........wwwwwwwwwwwwwwwwwwwwwww.................
..........wwwwwwwwwwwwwwwwwwwwwww.................
..........wwwwwwwwwLLLwwwwwwwwwww.................
..........wwwwwwwwwLLLwwwwwwwwwww.................
..........wwwwwwwwwLLLwwwwwwwwwww.................
..........wwwwwwwwwLLLwwwwwwwwwww.................
M.MMMMMM..wwwwwwwwwwwwwvvvvvwwwww.......MMMMMMMM.M
M.MMMMMM..wwwwwwwwwwwwwvvvvvwwwww.......MMMMMMMM.M
M.MMMMMM..wwwwwwwwwwwwwvvvvvwwwww.......MMMMMMMM.M
ttttttttttwwwwwwwwwwwwwvvvvvwwwww.......tttttttttt
ttttttUtttwwwwwwwwwwwwwvvvvvwwwww..JJJJJttttttUttt
JJJtttUtttwwwwwwwwuuuuuuuuuuuuuuuuuJJJJJJJttttUttt
tJttttUtttwwwwwwwwuuuuuuuuuuuuuuuuuJJ.JJtJttttUttt
tJttttttttwwwwwwwwuuuuuuuuuuuuuuuuuJJ.JJtJtttttttt
tJttttttttwwwwwwwwuuuuuuuuuuuuuuuuuJJ.JJtJtttttttt
tJttttttttwwwwwwwwuuuuuuuuuuuuuuuuuJJ.JJtJtttttttt
tJtttWWWttwwwwwwwwuuuuuuuuuuuuuuuuuWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwuuuuuuuuuuuuuuuuuWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwwwwwwwwwwwwwwwwwwWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwwwwwwwwwwwwwwwwwwWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwwwwwwwwwwwwwwwwwwWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwwwwwwwwwwwwwwwwwwWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwwwwwwwwwwwwwwwwwwWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwwwwwwwwwwwwwwwwwwWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwuuuuuuuuuuuuuuuuuWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwuuuuuuuuuuuuuuuuuWJWJJWJWttWWWtt
tJtttWWWttwwwwwwwwuuuuuuuuuuuuuuuuuWJWJJWJWttWWWtt
EEEEEWWWllcccccccuuuuuuuuuuuuuuuuuuccWlllllllWWWEE
............VVVVVVVVVVVVVVVV......................
............VVVVVVVVVVVVVVVV......................
............VVVVVVVVVVVVVVVV......................
............VVVVVVVVVVVVVVVV......................
............VVVVVVVVVVVVVVVV......................
............VVVVVVVVVVVVVVVV......................
............VVVVVVVVVVVVVVVV......................
............VVVVVVVVVVVVVVVV......................
............VVVVVVVVVVVVVVVV......................
............DDDDDDDDDDDDDDDD......................
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
.............VVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV..............kkkkkkk....V..........
............VV.............kkkkkkkk....V..........
............VV.............kkkkkkkk....V..........
............VV.............kkkkkkkk....V..........
............VV.............kkkkkkkk....V..........
............VVVVVVVVVVVVVVVVkkkkkkkVVVVV..........
.............VVVVVVVVVVVVVVVVVVVVVVVVVVV..........
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
..........tttttttt........J.J..J..................
..........tttttttt.......JJ.JJJJ..................
WWWWWWWWWWtttttttt.................ttttttt........
WWWWWWWWWWtttttttt.......JJ.JJJJ...tttttttt.......
WWWWWWWWWWtttttttt........J.J..J...tttttttt.......
............tttttt........J.J..J...ttttttttWWWWWWW
............tttttt.......JJ.JJJJ...ttttttttWWWWWWW
............ttttt..................ttttttttWWWWWWW
............WWW..........JJ.JJJJ...ttttt..........
............WWW...........J.J..J...ttttt..........
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........www...........................www.......
..........www...........................www.......
vvvvvvvvvvwww...........................www.......
vvvvvvvvvvwww...........................www.......
vvvvvvvvvvwww...........................wwwuuuuuuu
vvv.......www...........................wwwuuuuuuu
vvv.......www...........................wwwuuuuuuu
vvv.......vvv...........................www....uuu
vvv.......vvv...........................www....uuu
vvv.......vvv...........................www....uuu
vvv.......vvv...........................uuu....uuu
vvv.......vvv...........................uuu....uuu
vvvvvvvvvvvvv...........................uuu....uuu
vvvvvvvvvvvvv...........................uuu....uuu
vvvvvvvvvvvvv...........................uuu....uuu
..........www...........................uuu....uuu
..........www...........................uuu....uuu
..........wwwwwwwwwwwwNoooooooNwwwwwwwwwuuu....uuu
..........wwwwwwwwwwwwNoooooooNwwwwwwwwwuuu....uuu
..........wwwwwwwwwwwwNooooooNNwwwwwwwwwuuuuuuuuuu
......................WWW..WWW...JJJJ.JJuuuuuuuuuu
......................WWW..WWW...J..J.J.uuuuuuuuuu
......................WWW..WWW...J..J.J...........
......................WWW..WWW...JJJJ.JJ..........
......................WWW..WWW....................
......................WWW..WWW...JJJJ.JJ..........
......................WWW..WWW...J..J.J...........
......................ttttttWW...J..J.J...........
......................ttttttWW...JJJJ.JJ..........
WWWWWWWWWWWWWWWWWWWWttttttttWW....................
WWWWWWWWWWWWWWWWWWWWtttttttttt....................
WWWWWWWWWWWWWWWWWWWWtttttttttt....................
....................tttttttttttttWWWWWWWWWWWWWWWWW
....................tttttttttttttWWWWWWWWWWWWWWWWW
....................tttttttttttttWWWWWWWWWWWWWWWWW
.........................tttttttt.................
.........................tttttttt.................
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
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........www...........................www.......
..........www...........................www.......
wwwwwwwwwwwww...........................www.......
wwwwwwwwwwwww...........................www.......
wwwwwwwwwwwww...........................www.......
www.......www...........................www.......
www.......www...........................www.......
www.......www...........................www.......
www.......www...........................www.......
www.......www...........................ww........
www.......www.....................................
www.......www.....................................
wwwwwwwwwwwww.....................................
wwwwwwwwwwwww.....................................
wwwwwwwwwwwww.....................................
..........www.....................................
..........www.....................................
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwww..........
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwww..........
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwww..........
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
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777iiiiiiii7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777ijjjjjji7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777ijjjjjji7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777ijjjjjji7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777ijjjjjji7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777ijjjjjji7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777ijjjjjji7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777ijjjjjji7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777ijjjjjji7777777777777777777777777
EEEEEEEEEEEEEEEEEEJJJJJJJEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777iiiiiiii7777777777777777777777777
EEEMMuuMuuMMwwMMwwMMwwMwwMwwMMwwMMwwMMwwMMMEEEEEEE   77lllilliiwwwuwwwuwwwuwwuwwuwwwuwwwuwwwuwww7777777
EEEuuuuuuuMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEEE   77liiiiiiiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
EEEuuuuuuuMuwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEE   77liiiiiiiwwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzzzxzzxx
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwvvvvvvv   77iiiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzxxxxxxx
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwvvvvvvv   77liiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzzzxzzxx
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwRRRRRRR   77liiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwwwwwwww
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwRRRRRRR   77liiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwwwwwwww
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwRRRRRRRR   77iiiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuzzzwwwwwww
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRMvMRRRRRRR   77liiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuzxzwwwwwww
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRvvMRRRRRRR   77liiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuzxzwwwwwww
WWWuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRMvvRRRRRRR   ffliiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuzxxwwwwwww
WWWuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRvvRRRRRRRR   ffiiiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxzwwwwwww
WWMuuRRRRRuuRRRRRRRRRRRRRRRRRRRRRRRRRRRRvvvRRRRRRR   ffliiiiiiiwwuuuuuuuuuuuuuuuuuuuuuuuuuuuuzxzxxxxxxx
cccuuuuuuuMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRMvvvvvvvvv   77liiiiiiiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzxxxxxxxxx
cccuuuuuuuMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRMvvvvvvvvv   77iiiiiiiiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzzzxzzzxzz
JJJJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwcclllcc   iiiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
JJJJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwcclllcc   ijjjjjjjjiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
JJJJJJJJJJMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMcclllcc   ijjjjjjjjiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
JJJJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwccclllcc   ijjjjjjjjiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
JJJJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwcclllcc   ijjjjjjjjiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
JJJJJJJJJJMwwwwwwwwwwwwdddddddwwwwwwwwwwwwMccccccc   ijjjjjjjjiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
JJJJJJJJJJMwwwwwwwwwwwwdddddddwwwwwwwwwwwwMccccccc   ijjjjjjjjiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
JJJJJJJJJJMMcwMMcwMMcwMdddddddlwMMcwMMcwMMcccccccc   iiiiiiiiiiwwwuwwwuwwwuwuuuuuuuwuwwwuwwwuwww7777777
ccclllllcccccccccccccccWWrrrWWlllcclllcccccllccccc   7777777777777777777777fff77fff77777777777777777777
ccclllllcccccccccccccccWWrrrWWlllcclllcccccllccccc   7777777777777777777777fff77fff77777777777777777777
cccccccccccccccccccccccWWrrrWWcccccccccccccccccccc   7777777777777777777777fff77fff77777777777777777777
cccccccccccccccccccccccWWrrrWWcccccccccccccccccccc   7777777777777777777777fff77fff77777777777777777777
cccccccccccccccccccccccWWrrrWWcccccccccccccccccccc   7777777777777777777777fff77fff77777777777777777777
ccccclllcccccccccccccccWWrrrWWcccccccccccccccccccc   7777777777777777777777fff77fff77777777777777777777
ccccclllcccccccccccccccWWrrrWWcccccccccccccccccccc   7777777777777777777777fff77fff77777777777777777777
cccccccccccccccccccccccMtMttMMccccclllccccccccccll   7777777777777777777777mmmmkmmm77777777777777777777
ccccccccccccccccccccccctttttttccccclllccccccccccll   7777777777777777777777mkkkkkkm77777777777777777777
ccccccccccccccccccccccttttttttcccccllWcccccccccWll   ffffffffffffffffffffmmkkkkkkkkkmmfffffffffffffffff
WWWWWWWWWWWWWWWWWWWWMtttttttttttMWWWWWWWWWWWWWWWWW   ffffffffffffffffffffmkkkkkkkkkkkmfffffffffffffffff
WWWWWWWWWWWWWWWWWWWWMtttttttttttMWWWWWWWWWWWWWWWWW   ffffffffffffffffffffmkkkkkkkkkkkmfffffffffffffffff
EEEEEEEEEEEEEEEEEEEEtttttttttttttEEEEEEEEEEEEEEEEE   77777777777777777777kkkkkkkkkkkkk77777777777777777
EEEEEEEEEEEEEEEEEEEEttttttttttttEEEEEEEEEEEEEEEEEE   77777777777777777777mkkkkkkkkkkkm77777777777777777
EEEEEEEEEEEEEEEEEEEEMMEtMEtMEtMMEEEEEEEEEEEEEEEEEE   77777777777777777777mmmkmmkmmkmmm77777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
### Seed 3: plan and heights side by side
```
EEEtttttttEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   77kkkkkkkm7777777777iiiiiiii7777777777777777777777
EEEtttttttEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   77kkkkkkkk7777777777ijjjjjji7777777777777777777777
EEEtttttttEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   77kkkkkkkmhhfhhhfhhhijjjjjji7777777777777777777777
EEEtttttttWWWWWWWWWWJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   77kkkkkkkmfffffffffhijjjjjji7777777777777777777777
EEEttttttMWWWWWWWWWMJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   77kkkkkkmmhhfhhhfhhhijjjjjji7777777777777777777777
EEEtttttccccccccccccJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   77kkkkkk777777777777ijjjjjji7777777777777777777777
EEEtttttccccccccccccJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   77kkkkkk777777777777ijjjjjji7777777777777777777777
EEvtttttccccccccccccJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   zzxzzzxzzz7777777777ijjjjjji7777777777777777777777
vvvvvvvvvvccccccccccJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   xxxxxxxxxz7777777777ijjjjjji7777777777777777777777
vvvvvvvvvMccccccccccJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   xxxxzzxzzz7777777777iiiiiiii7777777777777777777777
vvvRRRRRRRMMwwMMwwMMwwMwwMwwMMwwMMwwMMwwMMMEEEEEEE   xxxwwwwwwwwwwuwwwuwwwuwwuwwuwwwuwwwuwwwuwww7777777
vvvRRRRRRRwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMEEEEEEE   xxxwwwwwwwwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
vvvRRRRRRRwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMEEEEEEE   xxxwwwwwwwzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
vvvRRRRRRRMvMRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwuuuuuuu   xxxwwwwwwwzxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiii
vvvRRRRRRRMvRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMuuuuuuu   xxxwwwwwwwzxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
vvvRRRRRRRvvMRRRRRRRRRRRRRRRRRRRRRRRRRRRwwRRRRRRuu   xxxwwwwwwwxxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
vvvRRRRRRRvvvRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMRRRRRuu   xxxwwwwwwwzxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
vvvRRRRRRRvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRwMRRRRRRuu   xxxxxxxxxxzxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuwwiiiiiii
vvvvvvvvvvvvMRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   xxxxxxxxxxxxzuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
vvvvvvvvvvvvMRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   zxzzzxzzzxzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
ccccccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
lllcccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
lllcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
lllcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
lllcccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
lllcccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRuuu   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwwiiiiiii
llllllllccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMuuuuuuu   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
llllllllccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMuuuuuuu   7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
ccccccccccMwwwwwwwwwwwwdddddddwwwwwwwwwwwwwccccccc   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
ccccccccccMwwwwwwwwwwwwdddddddwwwwwwwwwwwwcccccccc   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
ccccccccccMMMwMMJwMMcwMdddddddcwMMcwMMcwMMcccccccc   7777777777wwwuwwwuwwwuwuuuuuuuwuwwwuwwwuwww7777777
cccccccclllllJJJJJJJcccWWrrrWWccccclllcccccccccccc   777777777777ijjjjjji77fff77fff77777777777777777777
cccccccclllllJJJJJJJcccWWrrrWWccccclllcccccccccccc   777777777777ijjjjjji77fff77fff77777777777777777777
lllllccccccccJJJJJJJcccWWrrrWWcccccccccccccccccccc   777777777777ijjjjjji77fff77fff77777777777777777777
lllllccccccccJJJJJJJcccWWrrrWWcccccccccccccccccccc   777777777777ijjjjjji77fff77fff77777777777777777777
lllllccccccccJJJJJJJcccWWrrrWWcccccccccccccccccccc   777777777777ijjjjjji77fff77fff77777777777777777777
cccccccccccccJJJJJJJcccWWrrrWWcccccccccccccccccccc   777777777777ijjjjjji77fff77fff77777777777777777777
cccccccccccccJJJJJJJcccWWrrrWWcccccccccccccccccccc   777777777777ijjjjjji77fff77fff77777777777777777777
ccclllllcccccJJJJJJJlllMtMttMMcccccccccccccccccccc   777777777777ijjjjjji77mmmmkmmm77777777777777777777
ccclllllcccccJJJJJJJllltttttttcccccccccccccccccccc   777777777777ijjjjjji77mkkkkkkm77777777777777777777
ccWlllllcccccJJJJJJJllttttttttcccccccccccccccccccc   fffffffmmmmkmmmiimmmkmmkkkkkkkkmmfffffffffffffffff
WWWWWWWWtttttttEEEttttttttttttttWWWWWWWWWWWWWWWWWW   fffffffmkkkkkkm77mkkkkkkkkkkkkkkmfffffffffffffffff
WWWWWWWWtttttttEEEtttttttttttttttWWWWWWWWWWWWWWWWW   fffffffkkkkkkkk77kkkkkkkkkkkkkkkkfffffffffffffffff
EEEEEEEEtttttttEEEttttttttttttttMEEEEEEEEEEEEEEEEE   7777777mkkkkkkm77mkkkkkkkkkkkkkkm77777777777777777
EEEEEEEEtttttttEEEttttttttttttttMEEEEEEEEEEEEEEEEE   7777777mkkkkkkm77mkkkkkkkkkkkkkkm77777777777777777
EEEEEEEEMEMtEMMEEEMMtEMMEtMMEtMMEEEEEEEEEEEEEEEEEE   7777777mmmmkmmm77mmmkmmmmkmmmkmmm77777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
How much the plans of the seeds differ: 0.52 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 197 nodi, 728 passi, finito in 516 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro rocca (marcatore), E=erba di confine, h=sala superiore, q=ingresso rocca, w=muro del mastio, b=interno torrione, v=muro del torrione, a=armeria laterale, u=muro armeria, c=cortile d'armi, p=tettoia in legno, W=cinta muraria, t=torretta di guardia, l=lastricato del cortile, d=soglia del mastio, r=strada di confine, m=asse ingresso (marcatore), f=pavimento in assi, F=solaio in legno, R=lastrico del terrazzo, J=tetto della tettoia, P=fascia muraria, K=camino in pietra, L=finestra, x=interno tettoia, y=trave in legno, O=portone in quercia, o=assi del portone, N=stipite in pietra, k=gradini, M=merlatura, D=pavimento cantina, V=muro cantina, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #93=terreno di prova (marcatore).
Alla fine: w 57223, t 27618, W 17760, v 15968, u 8400, J 7864, V 6156, o 4454, L 3800, k 3150, f 2800, U 2616, R 2400, F 2150, c 1850, D 1650, M 1512, E 1375, N 715, l 625, O 246, r 75, d 75, K 1.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-41 all×24, one×4, prl×2, convchain×1: 562 celle x0-19 y0-19 z20, passi 2-57
   #43 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 58
#45-48 all×4: 46650 celle x20-84 y20-64 z19-60, passi 59-99
#49-51 all×3: 34450 celle x20-84 y20-64 z20-84, passi 100-124
    #54 all . h → h . (+1) passi=31: ×31, 119350 celle x25-79 y25-59 z21-52, passi 125-155, h→. 51150, .→h 51150, q→. 8525, .→q 8525
      r1 . h → h . ×51150; r2 . q → q . ×8525
    #55 all . h → h F (+2) passi=1: ×1, 3850 celle x25-79 y25-59 z52-53, passi 156, h→F 1650, .→h 1650, q→F 275, .→q 275
      r1 . h → h F ×1650; r2 . q → q F ×275; r3 . s → s F ×0
    #56 all . h → h . (+2) passi=31: ×31, 119350 celle x25-79 y25-59 z53-84, passi 157-187, h→. 51150, .→h 51150, q→. 8525, .→q 8525
      r1 . h → h . ×51150; r2 . q → q . ×8525; r3 . s → s . ×0
#57-65 prl×1, all×8: 50375 celle x0-79 y25-59 z20-92, passi 188-293
#66-71 all×5, prl×1: 35425 celle x5-99 y35-69 z20-91, passi 294-365
#72-77 all×4, prl×2: 30058 celle x50-94 y0-84 z20-52, passi 366-430
#78-82 all×2, prl×1: 48138 celle x0-99 y0-94 z21-52, passi 431-485
#83-102 all×2: 59100 celle x20-84 y0-99 z0-57, passi 486-541
     #103 prl D D → #90 * passi=1: ×1, 31350 celle x25-79 y25-54 z1-19, passi 542, D→#90 31350
#104-118 prl×7, one×1, all×6: 34600 celle x25-79 y25-54 z1-20, passi 543-584
#149-197 all×17, one×3, prl×3: 47764 celle x0-99 y0-99 z20-98, passi 585-728
Senza effetto (non hanno mai cambiato una cella):
#11 one wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw → wwwwwwwwwww/wqqqssssqqw/wqqqssssqqw passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all [dn]/c → */n: le celle cercate c'erano, ma mai disposte come nel pattern
#36 all [nG]/[Wt] → */G: in quel momento nella griglia non c'erano celle "nG"
#38 all nc → *n passi=1: in quel momento nella griglia non c'erano celle "n"
#39 all G[Wt] → *G passi=1: in quel momento nella griglia non c'erano celle "G"
#40 all rE → *r passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#52 all . s → s T passi=1: in quel momento nella griglia non c'erano celle "s"
#53 all . s → s . passi=30: in quel momento nella griglia non c'erano celle "s"
#80 all fJ/ff → *y/** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#81 all . y → y * passi=31: in quel momento nella griglia non c'erano celle "y"
#84 all . G → G * passi=33: in quel momento nella griglia non c'erano celle "G"
#86 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
… e altri 68
Fix it and answer with the whole program.

## Risposta

<!--
  Concept: Rocca di confine (border stronghold / fortified keep with cellar)
  Parts & Letters:
  - h, q, s: interior floor of the main keep (h = middle cellar zone over D, 11x4 cells = 55x20 voxels; s = stair zone along back wall, 4x2 cells = 20x10 voxels; q = back landing & front entrance zone clear of cellar, 10 voxels deep at front)
  - w: thick stone walls of the main keep
  - b, v: fortified corner bastion tower (b = interior floor, v = bastion walls), placed on a rear corner
  - a, u: side armory / guard annex wing (a = interior floor, u = wing walls), grown on a side at random
  - p: covered wooden lean-to / porch along the keep wall (at least 4 cells = 20 voxels deep)
  - c, l: inner bailey courtyard around the keep (textured with convchain flagstones l and dirt c), grown ONLY where 7 cells of ground extend past the keep (Huge size)
  - W: outer curtain wall enclosing the bailey (at Huge)
  - t: outer watchtowers on the corners of the curtain wall (at Huge)
  - G: fortified gatehouse through the outer curtain wall (at Huge)
  - d: main keep doorway (3 cells wide at front center)
  - n, r: paved approach road from the keep door through the bailey and gatehouse to the map edge
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhqswbvaucpWtlGdnrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep interior: 11 cells wide along x (5 each side of H = 55 voxels) -->
      <!-- 2 cells behind H (rows y_H-2 to y_H-1) for back stair & landing, 3 cells behind for h, and 2 cells in front for q -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="E/h" out="q/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/q" symmetry="()" steps="2"/>
      <all in="H" out="h" symmetry="()"/>
      <all in="hE" out="*h" symmetry="(x)" steps="5"/>
      <all in="qE" out="*q" symmetry="(x)" steps="5"/>

      <!-- Keep walls w (13 cells wide: w + 11 interior + w) -->
      <all in="[hq]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Back 2 rows of q inside keep get s (stair zone, 4x2 = 20x10 voxels) with 3 cells (15 voxels) of q landing on the small-x side -->
      <one in="wwwwwwwwwwwww/wqqqqqqqqqqqw/wqqqqqqqqqqqw" out="wwwwwwwwwwwww/wqqqssssqqqqw/wqqqssssqqqqw" symmetry="()" steps="1"/>

      <!-- Corner bastion tower (v/b) on a rear corner of the keep -->
      <one in="EEw/EEw/EEw" out="bbv/bbv/vvv" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="1"/>
      <all in="E/b" out="b/*" symmetry="()" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Guard annex wing (u/a) on a side wall of the keep -->
      <one in="EEw/EEw/EEw/EEw" out="aau/aau/aau/aau" symmetry="(x)" steps="1"/>
      <prl in="E/a" out="a/*" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Keep front door d (3 cells wide) -->
      <one in="qqqqqqqqqqq/wwwwwwwwwww" out="qqqqqqqqqqq/wwwwdddwwww" symmetry="()" steps="1"/>

      <!-- Outer bailey courtyard c and curtain wall W ONLY where at least 7 cells of ground E extend past the central keep w (Huge size only) -->
      <all in="wEEEEEEE" out="*ccccc**" steps="1"/>
      <all in="cE/*c" out="*c/**" steps="18"/>
      <all in="c[wvu]/*E" out="**/*c" steps="10"/>
      <all in="cE/*c" out="*c/**" steps="18"/>

      <!-- Wooden lean-to / porch p (4 cells = 20 voxels deep) against keep wall -->
      <one in="wwww/cccc/cccc/cccc/cccc" out="****/pppp/pppp/pppp/pppp" symmetry="(xy)" steps="1"/>
      <one in="wwww/EEEE/EEEE/EEEE/EEEE" out="****/pppp/pppp/pppp/pppp" symmetry="(xy)" steps="1"/>

      <!-- Outer curtain wall W around courtyard c (at Huge) -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner watchtowers t on outer corners of curtain wall W -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Road and Gatehouse G from front door d straight to the front edge -->
      <all in="[dn]/[cp]" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[dnGr]/E" out="*/r" symmetry="()"/>

      <!-- Courtyard texture with flagstones l -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>cccll/cccll/clllc/lllcc/cllcc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhqswbvaucpWtlGdnrfFRJPKLxyOoNTkMDVU#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pxxxp/pxxxp/pxxxp/ppppp"/>

      <sequence symmetry="(xy)">
        <!-- Unions for parts -->
        <union symbol="+" values="wvuWtG"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wvuWtG"/>

        <!-- Mark cellar D under room h on the first layer under the soil (z=19) before h rises -->
        <all in="h B" out="* D" symmetry="()"/>

        <!-- B. Heights -->
        <!-- Main keep walls w: 2 storeys = 64 high (with window bands P) -->
        <all steps="8"><rule in="B w" out="w *"/></all>
        <all steps="12"><rule in="B w" out="w P"/></all>
        <all steps="20"><rule in="B w" out="w *"/></all>
        <all steps="12"><rule in="B w" out="w P"/></all>
        <all steps="12"><rule in="B w" out="w *"/></all>

        <!-- Doorway column d: seed O at floor level (z=20), then 64 layers of w above it -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="w"/>

        <!-- Gatehouse column G: seed O at floor level (z=20), then 34 layers of G above it -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G *" steps="33"/>

        <!-- Main keep interior h, q, s: 2 covered storeys (floor f at z=20, slab F at z=52, roof slab R at z=84) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B q" out="q f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=21 (just above floor f) -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all steps="30"><rule in="B s" out="s B"/></all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B q" out="q B"/>
        </all>
        <!-- First floor slab F at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B q" out="q F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second storey air (31 high) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B q" out="q B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Roof terrace slab R at z=84 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="q" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Corner bastion tower (v walls, b floor): 72 high (taller than main keep) -->
        <all steps="10"><rule in="B v" out="v *"/></all>
        <all steps="12"><rule in="B v" out="v P"/></all>
        <all steps="22"><rule in="B v" out="v *"/></all>
        <all steps="12"><rule in="B v" out="v P"/></all>
        <all steps="16"><rule in="B v" out="v *"/></all>

        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <all in="B b" out="b F" steps="1"/>
        <all in="B b" out="b B" steps="38"/>
        <prl in="b" out="R"/>

        <!-- Side armory wing (u walls, a floor): 1 storey = 32 high -->
        <all steps="8"><rule in="B u" out="u *"/></all>
        <all steps="12"><rule in="B u" out="u P"/></all>
        <all steps="12"><rule in="B u" out="u *"/></all>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="30"/>
        <prl in="a" out="R"/>

        <!-- Wooden lean-to p / x: clear height 31 (p rises as air, corner posts rise as y), roof J at 32 -->
        <all in="B p" out="p f" steps="1"/>
        <all in="B p" out="p B" steps="31"/>
        <prl in="p" out="J"/>
        <all in="B x" out="x f" steps="1"/>
        <all in="B x" out="x B" steps="31"/>
        <prl in="x" out="J"/>

        <!-- Outer curtain wall W (24 high), corner watchtowers t (38 high) -->
        <all in="B W" out="W *" steps="23"/>
        <all in="B t" out="t *" steps="37"/>

        <!-- C. Full scale: cellar, stairs, doors, battlements, slits, windows, details -->
        <!-- 1. Cellar under h (dug before part-stair) -->
        <import file="part-cellar"/>

        <!-- 2. Main stair inside keep -->
        <import file="part-stair"/>

        <!-- 3. Internal doors between keep and bastion/armory (11 wide, through 5-thick wall w) -->
        <one in="f/w/w/w/w/w/f" out="f/O/O/O/O/O/f" symmetry="(xy)" steps="2"/>
        <all in="Ow" out="*O" symmetry="(xy)" steps="5"/>

        <!-- Raise all doors (front keep door d, gatehouse G, and internal doors) -->
        <import file="part-door"/>

        <!-- 4. Battlements and arrow slits on fortifications -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 5. Windows in wall bands P -->
        <one steps="18">
          <rule in="BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LPPPPB" out="*LLLL*"/>
        <prl in="P" out="w"/>

        <!-- 6. Chimney / watch-brazier K on the roof -->
        <one in="R B B" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- Lean-to roof pitch and wooden corner posts -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="4" symmetry="()"/>
        <one in="fEE/EEE" out="yEE/EEE" symmetry="(xy)" steps="4"/>
        <all in="y B" out="* y" steps="31" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette -->
  <color symbol="E" value="7a8a58" name="erba di confine"/>
  <color symbol="H" value="8c7355" name="centro rocca" hidden="True"/>
  <color symbol="h" value="947858" name="sala superiore" area="keep"/>
  <color symbol="q" value="9c805e" name="ingresso rocca" area="keep"/>
  <color symbol="s" value="846648" name="vano scala" area="keep"/>
  <color symbol="w" value="827e78" name="muro del mastio" area="keep"/>
  <color symbol="b" value="8e7254" name="interno torrione" area="tower"/>
  <color symbol="v" value="74706c" name="muro del torrione" area="tower"/>
  <color symbol="a" value="967a5a" name="armeria laterale" area="keep"/>
  <color symbol="u" value="7c7872" name="muro armeria" area="keep"/>
  <color symbol="p" value="a48458" name="tettoia in legno" area="yard"/>
  <color symbol="x" value="a48458" name="interno tettoia" area="yard"/>
  <color symbol="y" value="6e5236" name="trave in legno"/>
  <color symbol="J" value="9e4b34" name="tetto della tettoia"/>
  <color symbol="c" value="888068" name="cortile d'armi" area="courtyard"/>
  <color symbol="l" value="98948a" name="lastricato del cortile" area="courtyard"/>
  <color symbol="W" value="76726c" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="6a6660" name="torretta di guardia" area="tower"/>
  <color symbol="G" value="807a72" name="corpo di guardia" area="courtyard"/>
  <color symbol="d" value="6e5236" name="soglia del mastio" area="keep"/>
  <color symbol="n" value="a09a8e" name="via lastricata" area="courtyard"/>
  <color symbol="r" value="928c7e" name="strada di confine" area="yard"/>
  <color symbol="m" value="9c805e" name="asse ingresso" hidden="True"/>
  <color symbol="f" value="8c6d4e" name="pavimento in assi"/>
  <color symbol="F" value="7a5c3e" name="solaio in legno"/>
  <color symbol="R" value="706c66" name="lastrico del terrazzo"/>
  <color symbol="P" value="827e78" name="fascia muraria"/>
  <color symbol="L" value="384858" name="finestra"/>
  <color symbol="K" value="5c5652" name="camino in pietra"/>
  <color symbol="O" value="6e4c2e" name="portone in quercia"/>
  <color symbol="o" value="4e341e" name="assi del portone"/>
  <color symbol="N" value="64605a" name="stipite in pietra"/>
  <color symbol="T" value="846648" name="traccia scala"/>
  <color symbol="k" value="785a3c" name="gradini"/>
  <color symbol="M" value="7a7670" name="merlatura"/>
  <color symbol="U" value="2a2826" name="feritoia"/>
  <color symbol="D" value="68625a" name="pavimento cantina"/>
  <color symbol="V" value="58544e" name="muro cantina"/>
  <color symbol="#20" value="6e4c2e" hidden="True"/>
  <color symbol="#21" value="4e341e" hidden="True"/>

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
