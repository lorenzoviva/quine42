# model.sculpt · correzione · gemini-4-argon · 42 s · 25862 token d'ingresso (0 in cache), 5326 d'uscita, 0 di ragionamento · $0.10

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
  - h, q, s: interior floor of the main keep (h = back/rear floor over cellar D; q = front/side floor clear of cellar; s = stair zone, 4x2 along back wall)
  - w: thick stone walls of the main keep
  - b, v: fortified corner bastion tower (b = interior floor, v = bastion walls), placed on one or two rear/side corners by seed
  - a, u: side armory / guard annex wing (a = interior floor, u = wing walls), grown on a side at random
  - p: covered wooden lean-to / porch along the keep wall
  - c, l: inner bailey courtyard around the keep (textured with convchain flagstones l and dirt c)
  - W: outer curtain wall enclosing the bailey (fits at Huge and Gargantuan where ground extends past the keep)
  - t: outer watchtowers on the corners of the curtain wall (at Huge / Gargantuan)
  - G: fortified gatehouse through the outer curtain wall
  - d: main keep doorway (3 cells wide at front center)
  - n, r: paved approach road from the keep door through the bailey and gatehouse to the map edge
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhqswbvaucpWtlGdnrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep interior: 5 cells wide each side of H (11 cells = 55 voxels wide along x) -->
      <!-- 4 to 5 cells behind H (h: cellar zone, 20-25 voxels deep), 3 cells in front of H (q: front zone, 15 voxels deep) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/q" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <all in="qE" out="*q" symmetry="(x)" steps="5"/>

      <!-- Keep walls w -->
      <all in="[hq]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Corner bastion tower (v/b) on a rear corner of the keep -->
      <one in="EEw/EEw/www" out="bbv/bbv/vvv" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="1"/>
      <all in="E/b" out="b/*" symmetry="()" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Guard annex wing (u/a) on a side wall of the keep, where space allows -->
      <one in="EEw/EEw/EEw/EEw" out="aau/aau/aau/aau" symmetry="(x)" steps="1"/>
      <all in="aE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Stair zone s (4 cells along x, 2 cells along y) against the back wall, with 2 cells landing on small-x -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/w**ssss*/w**ssss*" symmetry="()" steps="1"/>

      <!-- Keep front door d (3 cells wide) and road axis m -->
      <all in="H/q" out="*/m" symmetry="()" steps="3"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="q"/><rule in="H" out="q"/></prl>

      <!-- Ensure front 2 rows of interior are q (so cellar D under h stays >=10 voxels back from front wall and clear of stair s) -->
      <all in="h/w" out="q/*" symmetry="()" steps="1"/>
      <all in="h/q" out="q/*" symmetry="()" steps="1"/>

      <!-- Outer bailey courtyard c and curtain wall W where ground E extends at least 4 cells around the keep (fits at Huge & Gargantuan) -->
      <all in="[wvu]EEEE" out="*ccc*" steps="1"/>
      <all in="cE/*c" out="*c/**" steps="12"/>
      <all in="c[wvu]/*E" out="**/*c" steps="6"/>
      <all in="cE/*c" out="*c/**" steps="12"/>

      <!-- Expand courtyard further if even more ground exists -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**" steps="20"/>

      <!-- Wooden lean-to / porch p (at least 4 cells = 20 voxels deep) against keep wall -->
      <one in="wwww/cccc/cccc/cccc/cccc" out="****/pppp/pppp/pppp/pppp" symmetry="(xy)" steps="1"/>
      <one in="www/EEE/EEE/EEE/EEE" out="***/ppp/ppp/ppp/ppp" symmetry="(x)" steps="1"/>

      <!-- Outer curtain wall W around courtyard c -->
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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); cantina: un pavimento sotto il suolo non si raggiunge dal piano terra — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba di confine, w muro del mastio, u muro armeria, c cortile d'armi, W cinta muraria, t torretta di guardia, l lastricato del cortile, d soglia del mastio, r strada di confine, f pavimento in assi, F solaio in legno, R lastrico del terrazzo, K camino in pietra, L finestra, O portone in quercia, o assi del portone, N stipite in pietra, M merlatura, D pavimento cantina, V muro cantina, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt
ccccclllllccccclllllcccccccccccccccccccccccccttttt
ccccclllllccccclllllcccccccccccccccccccccccccMtttt
ccccclllllccccclllllcccccccccccccccccccccccccMMMtM
cccllccccclllllllllllllllccccccccccccccccccllWWWEE
cccllccccclllllllllllllllccccccccccccccccccllWWWEE
ccccccccccccccclllllllllllllcccccccccccccccccWWWEE
ccccccccccccccclllllllllllllcccccccccccccccccWWWEE
cccccccccccccccllllllllllllwcccccccccccccccccWWWEE
cccuuuuuuuMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccWWWEE
cccuuuuuuuMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccWWWEE
WWWuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwWWWWWEE
WWWuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwWWWWWWEE
WWMuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMWWWWWEE
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMWWWWWEE
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwWWWWWEE
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccWWWEE
EEEuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccWWWEE
EEMuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccWWWEE
WWWuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccWWWEE
WWWuuRRRRRuuuRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccWWWEE
cccuuuuuuuMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccWWWEE
cccuuuuuuuMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccWWWEE
cccMMucMuuwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccWWWEE
cccllcccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccWWWEE
cccllcccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccWWWEE
cccllcccccwwwwwwwwwwwwwdddddddwwwwwwwwwwwwMccWWWEE
cccllcccccMwwwwwwwwwwwwdddddddwwwwwwwwwwwwMccWWWEE
cccllcccccMMMwMMcwMMcwMdddddddcwMMcwMMlwMMlccWWWEE
cccllccccclllcccccllcccWWrrrWWcccccccclllllllWWWEE
cccllccccclllcccccllcccWWrrrWWcccccccclllllllWWWEE
cccccccccccccccccccccccWWrrrWWcccccccccclllllWWWEE
cccccccccccccccccccccccWWrrrWWcccccccccclllllWWWEE
cccccccccccccccccccccccWWrrrWWcccccccccclllllWWWEE
lllccccccclllcccccccllltttttttcccccccccclllccMtttt
lllccccccclllcccccccllltttttttcccccccccclllccttttt
WWWWWWWWWWWWWWWWWWWWMttttttttttMMWWWWWWWWWWMtttttt
WWWWWWWWWWWWWWWWWWWWttttttttttttMWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWttttttttttttMWWWWWWWWWWttttttt
EEEEEEEEEEEEEEEEEEEEMttttttttttttEEEEEEEEEEttttttt
EEEEEEEEEEEEEEEEEEEEMtttttttttttMEEEEEEEEEEttttttt
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
777777777777777777777777777777777777777777mkkkkkkk
777777777777777777777777777777777777777777kkkkkkkk
ffffffffffffffffffffffffffffffffffffffffffmkkkkkkk
ffffffffffffffffffffffffffffffffffffffffffmkkkkkkk
ffffffffffffffffffffffffffffffffffffffffffmmkkkkkk
777777777777777777777777777777777777777777777kkkkk
777777777777777777777777777777777777777777777mkkkk
777777777777777777777777777777777777777777777mmmkm
777777777777777777777777777777777777777777777fff77
777777777777777777777777777777777777777777777fff77
777777777777777777777777777777777777777777777fff77
777777777777777777777777777777777777777777777fff77
77lllilliiwwwuwwwuwwwuwwuwwuwwwuwwwuwwwuwww77fff77
77liiiiiiiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
77liiiiiiiwwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
ffiiiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuufffff77
ffliiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwfffff77
ffliiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwfffff77
77liiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwfffff77
77iiiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuufffff77
77liiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
77liiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
ffliiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu77fff77
ffliiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
ffiiiiiiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
77liiiiiiiwwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu77fff77
77liiiiiiiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
77lllilliiwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu77fff77
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw77fff77
7777777777wwwuwwwuwwwuwuuuuuuuwuwwwuwwwuwww77fff77
7777777777777777777777fff77fff777777777777777fff77
7777777777777777777777fff77fff777777777777777fff77
7777777777777777777777fff77fff777777777777777fff77
7777777777777777777777fff77fff777777777777777fff77
7777777777777777777777mmmmkmmm777777777777777mmmkm
7777777777777777777777mkkkkkkm777777777777777mkkkk
7777777777777777777777kkkkkkkk777777777777777kkkkk
ffffffffffffffffffffmmkkkkkkkkkmmfffffffffmmkkkkkk
ffffffffffffffffffffkkkkkkkkkkkkmfffffffffkkkkkkkk
ffffffffffffffffffffmkkkkkkkkkkkmfffffffffmkkkkkkk
77777777777777777777mkkkkkkkkkkkk777777777mkkkkkkk
77777777777777777777mmmkmmkmmkmmm777777777mmmkmmkk
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
```
Front (looking from the front; the sky at the top):
```
..........MM..MM..MM..M..M..MM..MM..MM..MM........
..........MMM.MMM.MMM.MM.MM.MMM.MMM.MMM.MMM.......
..........MMM.MMM.MMM.MM.MM.MMM.MMM.MMM.MMM.......
..........wwwwwwwwwwwwMdddddddwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wUwwwUwwwUwwwwwwwwwwwwwUwwwUwwwUw.......
..........wUwwwUwwwUwwwwwwwwwwwwwUwwwUwwwUw.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwLLLwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwLLLwwww.......
..........wwwwwwwwwwMMMMMMwMMMMMMwwwLLLwwwwMMMMM.M
..........wwwwwwwwwwMMMMMMwMMMMMMwwwLLLwwwwMMMMM.M
...MM..M..wwwwwwwwwwMMMMMMwMMMMMMwwwwwwwwwwMMMMM.M
..MMM.MM..wwwwwwwwwwtttttttttttttwwwwwwwwwwttttttt
..MMM.MM..wwwwwwwwwwtUtttttttttUtwwwwwwwwwwtttUttt
..uuuuuuuuwwwwwwwwwwtUtttttttttUtwwwwwwwwwwtttUttt
..uuuuuuuuwwwwwwwwwwtUtttttttttUtwwwwwwwwwwtttUttt
..uuuuuuuuwwwwwwwwwwtttttttttttttwwwwwwwwwwttttttt
..uuuuuuuuwwwwwwwwwwtttttttttttttwwwwwwwwwwttttttt
..uuuuuuuuwwwwwwwwwwtttttttttttttwwwwwwwwwwttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
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
.............MM..MM..M.M.MMM.MMM..................
............MMM.MMM.MM.MMMMMMMMMM.................
............MMM.MMM.MM.MMMMMMMMMM.................
............wwwwwwwwwwwwwwwwwwwww.................
............wwwwwwwwwwwwwwwwwwwww.................
............wwwwwwwwwwwwwwwUwwwUw.................
............wwwwwwwwwwwwwwwUwwwUw.................
............wwwwwwwwwwwwwwwwwwwww.................
............wwwwwwwwwwwwwwwwwwwww.................
............wwwwwwwwwwwwwwwwwwwww.................
............wwwwwwwwwwwwwwwwwwwww.................
............wwwwwwwwwwwwwwwwwLLww.................
............LwwwwwwwwwwwwwwwwLLLw.................
............LwwwwwwwwwwwwwwwwLLLw.................
M.MMM.MM....LwwwwwwwwwwwwwwwwLLLw....MM.MMMMM.....
M.MMM.MM....Lwwwwwwwwwwwwwwwwwwww....MM.MMMMM.....
M.MMM.MM....wwwwwwwwwwwwwwwwwwwww....MM.MMMMM.....
tttttttt....wwwwwwwwwwwwwwwwwwwww....tttttttt.....
tttttttt....wwwwwwwwwwwwwwwwwwwww....tttttttt.....
tttttttt....wwwwwwwwwwwwwwwwwwwww....tttttttt.....
tttttttt....wwwwwwwwwwwwwwwwwwwww....tttttttt.....
tttttttt....wwwwwwwwwwwwwwwwwwwww....tttttttt.....
tttttttt....wwwwwwwwwwwwwwwwwwwww....tttttttt.....
tttttttt....wwwwwwwwwwwwwwwwwwwww....tttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
ttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttttEEEEE
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
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV...........VV............V..........
............VV..........VVVV...........V..........
............VV..........V..VV..........V..........
............VVVVVVVVVVVVV..VVVVVVVVVVVVV..........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
..........................................tttttttt
..........................................tttttttt
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt
.............................................ttttt
.............................................ttttt
.............................................ttttt
.............................................WWW..
.............................................WWW..
.............................................WWW..
.............................................WWW..
...uuuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww...WWW..
..uuuuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..WWW..
..uuuuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..WWW..
WWWuu.....uuu...........................wwwWWWWW..
WWWuu.....uuu...........................wwwWWWWW..
WWuuu.....uuu...........................wwwWWWWW..
..uuu.....uuu...........................wwwWWWWW..
..uuu.....uuu...........................wwwWWWWW..
..uuu.....uuu...........................www..WWW..
..uuu.....uuu...........................www..WWW..
WWuuu.....uuu...........................www..WWW..
WWWuu.....uuu...........................www..WWW..
WWWuu.....uuu...........................www..WWW..
..uuuuuuuuwww...........................www..WWW..
..uuuuuuuuwww...........................www..WWW..
...uuuuuuuwww...........................www..WWW..
..........www...........................www..WWW..
..........www...........................www..WWW..
..........wwwwwwwwwwwwNoooooooNwwwwwwwwwwww..WWW..
..........wwwwwwwwwwwwNoooooooNwwwwwwwwwwww..WWW..
..........wwwwwwwwwwwwNooooooNNwwwwwwwwwww...WWW..
......................WWW..WWW...............WWW..
......................WWW..WWW...............WWW..
......................WWW..WWW...............WWW..
......................WWW..WWW...............WWW..
......................WWWtttWW...............WWttt
......................tttttttt...............ttttt
......................tttttttt...............ttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWWttttttt
WWWWWWWWWWWWWWWWWWWWtttttttttttttWWWWWWWWWtttttttt
....................ttttttttttttt.........tttttttt
....................ttttttttttttt.........tttttttt
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
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww........
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
........................................www.......
........................................www.......
........................................www.......
........................................www.......
........................................www.......
........................................www.......
........................................www.......
........................................www.......
........................................www.......
........................................www.......
..........www...........................www.......
..........www...........................www.......
..........www...........................www.......
..........www...........................www.......
..........www...........................www.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   ffffffffffffffffffffffffffffffffffffffffffffffffff
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   ffffffffffffffffffffffffffffffffffffffffffffffffff
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   ffffffffffffffffffffffffffffffffffffffffffffffffff
WWWcclllccccccclllcccccccccccclllllcccccccccclllcc   fff77777777777777777777777777777777777777777777777
WWWcclllccccccclllcccccccccccclllllcccccccccclllcc   fff77777777777777777777777777777777777777777777777
WWWcclllcccccccllccccccccccccclllllccccccccccllccc   fff77777777777777777777777777777777777777777777777
WWWcclllcccccccccclllllccccccccccccccccccccccccccc   fff77777777777777777777777777777777777777777777777
WWWcclllcccccccccclllllccccccccccccccccccccccccccc   fff77777777777777777777777777777777777777777777777
WWWcclllccccccccccllllllllllccccccclllcccccccccccc   fff77777777777777777777777777777777777777777777777
WWWcclllccccccccccllllllllllccccccclllcccccccccccc   fff77777777777777777777777777777777777777777777777
WWWccllccccccccccwlllllllllwcccccccllMcccccccccccc   fff7777777wwwuwwwuwwwuwwuwwuwwwuwwwuwwwuwww7777777
WWWllcccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMcclllcc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWllcccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMcclllcc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWlllllccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwuuuuuuu   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiii
WWWlllllccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwuuuuuuuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
WWWllllcccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwMuuuuuuuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwwiiiiiii
WWWcccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWllcccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWllcccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWllcccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRuuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwwiiiiiii
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwuuuuuuuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwuuuuuuu   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiii
WWWlllllllMwwwwwwwwwwwwdddddddwwwwwwwwwwwwMccccccc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWlllllllMwwwwwwwwwwwwdddddddwwwwwwwwwwwwMccccccc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWlllllllMMMwMMlwMMcwMdddddddlwMMlwMMcwMMcccccccc   fff7777777wwwuwwwuwwwuwuuuuuuuwuwwwuwwwuwww7777777
WWWcclllccccclllllcccccWWrrrWWlllllccccccccllccccc   fff7777777777777777777fff77fff77777777777777777777
WWWcclllccccclllllcccccWWrrrWWlllllccccccccllccccc   fff7777777777777777777fff77fff77777777777777777777
WWWcclllccllllllllcccccWWrrrWWcccccccccccccllccccc   fff7777777777777777777fff77fff77777777777777777777
WWWcclllccllllllllcccccWWrrrWWcccccccccccccllccccc   fff7777777777777777777fff77fff77777777777777777777
WWWcclllcclllllllccccccWWrrMWWcccccccccccccllccccc   fff7777777777777777777mmmkmmmm77777777777777777777
WWWcclllcclllcccccccccctttttttcccccccccccccccccccc   fff7777777777777777777mkkkkkkm77777777777777777777
WWWcclllcclllcccccccccctttttttcccccccccccccccccccc   fff7777777777777777777kkkkkkkk77777777777777777777
WWWWWWWWWWWWWWWWWWWWMttttttttttMMWWWWWWWWWWWWWWWWW   ffffffffffffffffffffmmkkkkkkkkkmmfffffffffffffffff
WWWWWWWWWWWWWWWWWWWWMtttttttttttMWWWWWWWWWWWWWWWWW   ffffffffffffffffffffmkkkkkkkkkkkmfffffffffffffffff
WWWWWWWWWWWWWWWWWWWWttttttttttttMWWWWWWWWWWWWWWWWW   ffffffffffffffffffffmkkkkkkkkkkkmfffffffffffffffff
EEEEEEEEEEEEEEEEEEEEtttttttttttttEEEEEEEEEEEEEEEEE   77777777777777777777kkkkkkkkkkkkk77777777777777777
EEEEEEEEEEEEEEEEEEEEMtttttttttttMEEEEEEEEEEEEEEEEE   77777777777777777777mmmkmmkmmkmmm77777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   ffffffffffffffffffffffffffffffffffffffffffffffffff
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   ffffffffffffffffffffffffffffffffffffffffffffffffff
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   ffffffffffffffffffffffffffffffffffffffffffffffffff
WWWcclllllcccccccccccccccccccccccccccccccccccccccc   fff77777777777777777777777777777777777777777777777
WWWcclllllcccccccccccccccccccccccccccccccccccccccc   fff77777777777777777777777777777777777777777777777
WWWcclllllcccccccccccccccccccccccccccccccccccccccc   fff77777777777777777777777777777777777777777777777
WWWllcccccccclllllcccccccccccclllllccccccccllccccc   fff77777777777777777777777777777777777777777777777
WWWllcccccccclllllcccccccccccclllllccccccccllccccc   fff77777777777777777777777777777777777777777777777
WWWllcccccccclllllcccccccllllllllccccccccccccccccc   fff77777777777777777777777777777777777777777777777
WWWllcccccccclllllcccccccllllllllccccccccccccccccc   fff77777777777777777777777777777777777777777777777
WWWllccccccccllllwccccccclllllllMccccccccccccccccc   fff7777777wwwuwwwuwwwuwwuwwuwwwuwwwuwwwuwww7777777
WWWcccccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccccccc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWcccccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccccccc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWcclllllwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
WWWcclllllwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccccccc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWcclllllMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWcccccllMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccccccc   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
WWWcccccllwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMuuuuuuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
WWWcccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMuuuuuuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiii
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwMuuuuuuuu   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwwiiiiiii
WWWcccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWllcccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWllcccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWllcccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWlllllccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWlllllccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRuuuRRRRRuu   fff7777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccMwwwwwwwwwwwwdddddddwwwwwwwwwwuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiiiiiiiiii
WWWcccccccMwwwwwwwwwwwwdddddddwwwwwwwwwwuuuRRRRRuu   fff7777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuwiiiiiiiiii
WWWcccccccMMlwMMcwMMnwndddddddJMwJMMwJMMuuuRRRRuuu   fff7777777wwwuwwwuwwwuwuuuuuuuwwuwwwuwwwiiiiiiiiii
WWWccccclllllllcccccnnnnnnnnnnJJJJJJJJJJuuuuuuuuuu   fff777777777777777777777777777ijjjjjjjjiiiiiiiiiii
WWWccccclllllllcccccnnnnnnnnnnJJJJJJJJJJuuuuuuuuuu   fff777777777777777777777777777ijjjjjjjjiiiiiiiiiii
WWWllcccccccccccccccnnnnnnnnnnJJJJJJJJJJcccccccccc   fff777777777777777777777777777ijjjjjjjji7777777777
WWWllcccccccccccccccnnnnnnnnnnJJJJJJJJJJcccccccccc   fff777777777777777777777777777ijjjkkjjji7777777777
WWWllcccccccccccccccnnnnnnnnnnJJJJJJJJJJcccccccccc   fff777777777777777777777777777ijjjkkjjji7777777777
WWWccccccccccllcccccnnnnnnnnnnJJJJJJJJJJcccccccccc   fff777777777777777777777777777ijjjkkjjji7777777777
WWWccccccccccllcccccnnnnnnnnnnJJJJJJJJJJcccccccccc   fff777777777777777777777777777ijjjjjjjji7777777777
WWWccccccclllcccccccnnnnnnnnnnJJJJJJJJJJccclllllll   fff777777777777777777777777777ijjjjjjjji7777777777
WWWccccccclllcccccccnnnnnnnnnnJJJJJJJJJJccclllllll   fff777777777777777777777777777ijjjjjjjji7777777777
WWWcccccccllWcccccccnnnnnnnnnnJJJJJJJJJJccclllllll   ffffffffffffffffffffllljlljlljllliiiimmmmkmmmfffff
WWWWWWWWWWWWWWWWWWWWMGGGGGGGGGGGMEEEEEtttttttWWWWW   ffffffffffffffffffffljjjjjjjjjjjl7777mkkkkkkmfffff
WWWWWWWWWWWWWWWWWWWWMGGGGGGGGGGGMEEEEEtttttttWWWWW   ffffffffffffffffffffllljljjjjjjjl7777kkkkkkkmfffff
EEEEEEEEEEEEEEEEEEEErrrrrGGGGGGGGEEEEEtttttttEEEEE   7777777777777777777777777jjjjjjjj7777mkkkkkkk77777
EEEEEEEEEEEEEEEEEEEErrrrrMGGGGGGEEEEEEtttttttEEEEE   7777777777777777777777777ljjjjjjl7777mkkkkkkm77777
EEEEEEEEEEEEEEEEEEEErrrrrMrMrGMMEEEEEEMMtEMEMEEEEE   7777777777777777777777777lllljlll7777mmmkmmmm77777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
How much the plans of the seeds differ: 0.43 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 201 nodi, 491 passi, finito in 401 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro rocca (marcatore), E=erba di confine, h=sala superiore, q=ingresso rocca, w=muro del mastio, a=armeria laterale, u=muro armeria, c=cortile d'armi, W=cinta muraria, t=torretta di guardia, l=lastricato del cortile, d=soglia del mastio, r=strada di confine, m=asse ingresso (marcatore), f=pavimento in assi, F=solaio in legno, R=lastrico del terrazzo, P=fascia muraria, K=camino in pietra, L=finestra, O=portone in quercia, o=assi del portone, N=stipite in pietra, M=merlatura, D=pavimento cantina, V=muro cantina, U=feritoia, #90=? (marcatore), #91=? (marcatore).
Alla fine: w 50982, W 29160, t 26674, u 6978, V 5662, L 3664, U 3072, o 2530, c 2100, E 2075, f 1850, R 1850, F 1650, M 1440, D 1075, l 775, N 495, O 120, d 75, r 50, K 1.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-45 all×22, one×1, prl×1, convchain×1: 582 celle x0-19 y0-17 z20, passi 2-50
   #47 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 51
#49-51 all×3: 28875 celle x20-84 y25-64 z19-40, passi 52-72
    #52 all . w → w * (+1) passi=20: ×20, 18500 celle x20-84 y25-64 z40-60, passi 73-92, .→w 15500, d→w 1500, .→d 1500
      r1 . w → w * ×15500; r2 . d → d w ×1500
#53-55 all×3: 34800 celle x20-84 y25-64 z20-84, passi 93-117
    #58 all . h → h . (+1) passi=31: ×31, 102300 celle x25-79 y30-59 z21-52, passi 118-148, h→. 33325, .→h 33325, q→. 17825, .→q 17825
      r1 . h → h . ×33325; r2 . q → q . ×17825
    #59 all . h → h F (+2) passi=1: ×1, 3300 celle x25-79 y30-59 z52-53, passi 149, h→F 1075, .→h 1075, q→F 575, .→q 575
      r1 . h → h F ×1075; r2 . q → q F ×575; r3 . s → s F ×0
    #60 all . h → h . (+2) passi=31: ×31, 102300 celle x25-79 y30-59 z53-84, passi 150-180, h→. 33325, .→h 33325, q→. 17825, .→q 17825
      r1 . h → h . ×33325; r2 . q → q . ×17825; r3 . s → s . ×0
#61-77 prl×2, all×5: 29650 celle x5-79 y25-59 z20-84, passi 181-245
    #86 all . W → W * passi=23: ×23, 28175 celle x0-94 y5-84 z21-43, passi 246-268, .→W 28175
    #87 all . t → t * passi=37: ×37, 26825 celle x40-99 y0-89 z21-57, passi 269-305, .→t 26825
     #106 all D . → * D: ×19, 20425 celle x25-79 y30-49 z0-18, passi 306-324, .→D 20425
     #107 prl D D → #90 * passi=1: ×1, 20425 celle x25-79 y30-49 z1-19, passi 325, D→#90 20425
#108-122 prl×3: 20425 celle x25-79 y30-49 z1-19, passi 326-328
#153-197 all×16, prl×2, one×1: 16092 celle x0-99 y0-89 z20-90, passi 329-489
#198-199 prl×1, one×1: 19137 celle x5-84 y25-64 z28-83, passi 490-491
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/h → h/* passi=1
#12 one EEw/EEw/www → bbv/bbv/vvv passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#13 all bE → *b passi=1: in quel momento nella griglia non c'erano celle "b"
#14 all E/b → b/* passi=1: in quel momento nella griglia non c'erano celle "b"
#15 all bE → *v: in quel momento nella griglia non c'erano celle "b"
#16 all vE/*v → *v/**: in quel momento nella griglia non c'erano celle "v"
#20 one wwwwwwww/whhhhhhh/whhhhhhh → ********/w**ssss*/w**ssss* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#25 all h/w → q/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all cE/*c → *c/** passi=20: le celle cercate c'erano, ma mai disposte come nel pattern
#33 one wwww/cccc/cccc/cccc/cccc → ****/pppp/pppp/pppp/pppp passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#34 one www/EEE/EEE/EEE/EEE → ***/ppp/ppp/ppp/ppp passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#39 all [dn]/c → */n: le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 107
Fix it and answer with the whole program.

## Risposta

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
