# model.sculpt · correzione · gemini-4-argon · 46 s · 25600 token d'ingresso (0 in cache), 4844 d'uscita, 0 di ragionamento · $0.10

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
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEmhbswavclWtGdnrp" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Main Keep core around H:
           Grow 4 behind (b: 20 voxels deep) and 2 in front (h: 15 voxels deep with H, total 35 voxels along y).
           Grow 5 to each side (width 11 = 55 voxels along x) so the room is 55 x 35 voxels (>= 28x28 and >= 44x14 for cellar). -->
      <all in="E/H" out="b/*" symmetry="()" steps="1"/>
      <all in="E/b" out="b/*" symmetry="()" steps="3"/>
      <all in="H/E" out="*/h" symmetry="()" steps="1"/>
      <all in="h/E" out="*/h" symmetry="()" steps="1"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>

      <!-- Keep H as the front-axis center marker while expanding sideways 5 cells to each side -->
      <all in="HE" out="*m" symmetry="(x)" steps="1"/>
      <all in="mE" out="*m" symmetry="(x)" steps="4"/>
      <all in="hE" out="*h" symmetry="(x)" steps="5"/>
      <all in="bE" out="*b" symmetry="(x)" steps="5"/>
      <prl in="m" out="h"/>

      <!-- Keep walls -->
      <all in="[Hhb]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Entrance axis straight from H to the front wall (3 cells wide = 15 voxels) -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/G" symmetry="()" steps="1"/>
      <all in="Gw" out="*G" symmetry="(x)" steps="1"/>
      <prl in="d" out="h"/>
      <prl in="H" out="h"/>
      <prl in="G" out="d"/>

      <!-- Stair zone in back room against the back wall: 4 cells along +x (20 voxels) and 2 cells wide (10 voxels), with 3 cells landing before it -->
      <one in="wwwwwwwwwwwww/wbbbbbbbbbbbw/wbbbbbbbbbbbw" out="*************/****ssss*****/****ssss*****" symmetry="()" steps="1"/>

      <!-- 3. Attached Watchtower Bastion on left, right, or back of the keep (varies by seed; never on front wall where d is) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/**" symmetry="(x)" steps="1"/>
      <one in="EEEEE/wwwww" out="*aaa*/*****" symmetry="()" steps="1"/>
      <all in="aE" out="*a" symmetry="(xy)" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Lean-to armory shed (p) against a free side of the keep (4x3 cells = 20x15 voxels, expanded to 20x20 when space permits) -->
      <one in="wEE/wEE/wEE/wEE" out="*pp/*pp/*pp/*pp" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- 5. Courtyard around the keep, bastion and lean-to -->
      <all in="[wvp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- At Huge size (where 5+ cells of ground remain), expand courtyard and add outer curtain wall & corner towers -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="cEE" out="*WE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers only on outer corners of the curtain wall (Huge size) -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Path across courtyard, gatehouse through curtain wall, road to front edge (3 cells wide) -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[dnG]/W" out="*/G" symmetry="()"/>
      <all in="[dnGr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[Ec]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Texture the courtyard paving -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>cccll/cccll/clllc/llccc/llccc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhbswavclWtGdnrpqufFRJKLXYOToNMDVkU#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pqqqp/pqqqp/pqqqp/ppppp"/>

      <sequence symmetry="(xy)">
        <!-- Unions for the included parts -->
        <union symbol="+" values="wvWtGK"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wvWt"/>

        <!-- Mark D under the back room 'b' and 's' on the layer below the soil (z=19) for part-cellar.
             Because 'h' is 15 voxels deep in front of 'b', D stays 15 voxels back from the front wall (>= 10 required) and is 55 x 20 voxels (>= 44 x 14). -->
        <all in="b B" out="* D" symmetry="()"/>
        <all in="s B" out="* D" symmetry="()"/>

        <!-- B. THE HEIGHTS -->
        <!-- Keep doorway 'd': floor at z=20, then rises as wall 'w' above floor so part-door can carve into it -->
        <all in="B d" out="w f" steps="1"/>

        <!-- Gatehouse 'G' (at Huge size): path at z=20, open gateway 30 high, then masonry arch above -->
        <all in="B G" out="G n" steps="1"/>
        <all in="B G" out="G B" steps="30"/>
        <all in="B G" out="G W" steps="6"/>
        <prl in="G" out="W"/>

        <!-- Keep walls 'w': 2 storeys = 64 high, with window bands X -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w *" steps="20"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w *" steps="12"/>

        <!-- Keep interior 'h', 'b', 's': 2 storeys (ground floor f at z=20, slab F at z=52, roof R at z=84) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B b" out="b f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=21 -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B b" out="b B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- 2nd storey slab F at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B b" out="b F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B b" out="b B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Ceiling / roof terrace R at z=84 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="b" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Watchtower bastion walls 'v' and interior 'a': taller than keep (74 high) -->
        <all in="B v" out="v *" steps="42"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v *" steps="20"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="9"/>
        <prl in="a" out="R"/>

        <!-- Lean-to shed 'p' (floor) and 'q' (posts): 32 clear height, roof J at z=53 -->
        <all in="B p" out="u f" steps="1"/>
        <all in="B u" out="u B" steps="32"/>
        <prl in="u" out="J"/>
        <all in="B q" out="q *" steps="33"/>
        <prl in="q" out="J"/>

        <!-- Outer curtain wall 'W': 24 high -->
        <all in="B W" out="W *" steps="24"/>

        <!-- Corner towers 't': 38 high -->
        <all in="B t" out="t *" steps="38"/>

        <!-- C. FULL SCALE: DOORS, CELLAR, STAIRS, BATTLEMENT, WINDOWS -->
        <!-- Front door seed O at z=20: where path 'n' or road 'r' meets doorway floor 'f' with wall 'w' at z=21 above it -->
        <all in="f/[nr] w/B" out="O/* */*" symmetry="()" steps="1"/>
        <all in="f/O w/w" out="O/* */*" symmetry="()" steps="4"/>

        <!-- Internal door seed O between keep room (f/F) and bastion room through wall 'w' or 'v' -->
        <one in="fwwwwwa" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <one in="FwwwwwF" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="5"/>

        <!-- 1. Dig cellar under back room -->
        <import file="part-cellar"/>

        <!-- 2. Build stairs between ground and 2nd floor -->
        <import file="part-stair"/>

        <!-- 3. Build doors -->
        <import file="part-door"/>

        <!-- 4. Battlements and arrow slits on all fortification walls -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 5. Windows in the X bands on keep and bastion facades -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <!-- Chimney / beacon turret on the keep roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: distinct medieval cartoon colours with area tags -->
  <color symbol="E" value="#7a8c56" name="terra di confine"/>
  <color symbol="h" value="#b8a484" name="sala di guardia" area="keep"/>
  <color symbol="b" value="#a69272" name="sala sopra la cantina" area="keep"/>
  <color symbol="s" value="#8c7355" name="vano scala" area="keep"/>
  <color symbol="w" value="#8c857b" name="muro del mastio" area="keep"/>
  <color symbol="a" value="#9c8a6e" name="interno del torrione" area="tower"/>
  <color symbol="v" value="#736c64" name="muro del torrione" area="tower"/>
  <color symbol="c" value="#aba396" name="cortile lastricato" area="courtyard"/>
  <color symbol="l" value="#968e82" name="pietra del cortile" area="courtyard"/>
  <color symbol="W" value="#7d776f" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="#69635c" name="torre d'angolo" area="tower"/>
  <color symbol="G" value="#7d776f" name="corpo di guardia" area="courtyard"/>
  <color symbol="d" value="#634832" name="soglia del mastio" area="keep"/>
  <color symbol="n" value="#bfb7a8" name="via del cortile" area="courtyard"/>
  <color symbol="r" value="#9e927f" name="strada di accesso" area="yard"/>
  <color symbol="p" value="#947856" name="tettoia delle armi" area="yard"/>
  <color symbol="q" value="#5c4328" name="pilastro di legno" area="yard"/>
  <color symbol="f" value="#8f6d48" name="pavimento di tavole" area="keep"/>
  <color symbol="F" value="#826240" name="solaio di legno" area="keep"/>
  <color symbol="R" value="#70583c" name="terrazza del mastio" area="keep"/>
  <color symbol="J" value="#9e4733" name="tetto della tettoia" area="yard"/>
  <color symbol="K" value="#59534d" name="camino di pietra" area="keep"/>
  <color symbol="L" value="#36454f" name="finestra" area="keep"/>
  <color symbol="O" value="#6b4423" name="porta di quercia" area="keep"/>
  <color symbol="o" value="#4a2e16" name="assi della porta" area="keep"/>
  <color symbol="N" value="#59534d" name="stipite di pietra" area="keep"/>
  <color symbol="M" value="#8c857b" name="merlo" area="keep"/>
  <color symbol="U" value="#2b2927" name="feritoia" area="keep"/>
  <color symbol="T" value="#826240" name="gradini" area="keep"/>
  <color symbol="k" value="#9c7a54" name="scalini di legno" area="keep"/>
  <color symbol="D" value="#635c54" name="lastricato della cantina" area="keep"/>
  <color symbol="V" value="#524c46" name="muro della cantina" area="keep"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="assi aperte"/>

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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); porta: 11 × 8 voxel (0,69 × 0,50 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 25 voxel (1,56 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole; cantina: dalla porta non si scende in cantina — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra di confine, w muro del mastio, v muro del torrione, c cortile lastricato, l pietra del cortile, W cinta muraria, t torre d'angolo, f pavimento di tavole, F solaio di legno, R terrazza del mastio, J tetto della tettoia, K camino di pietra, L finestra, O porta di quercia, o assi della porta, N stipite di pietra, M merlo, D lastricato della cantina, V muro della cantina, k scalini di legno, U feritoia
Plan (the letter on top of every column):
```
cccccccccclllccccccccccccccccccccccccccccccccccccc
cccccccccclllccccccccccccccccccccccccccccccccccccc
cccccccccclllccccccccccccccccccccccccccccccccccccc
cccccccccclllccccccccccccMvvvvvvvvvvvvvvvvvvvvvMcc
cccccccccclllccccccccccccMvvvvvvvvvvvvvvvvvvvvvMcc
cccccccccccccccccccccccccvvvRRRRRRRRRRRRRRRRRvvvcc
cccccccccccccccccccccccccvvvRRRRRRRRRRRRRRRRRvvccc
cccccccccccccccccccccccccMvvRRRRRRRRRRRRRRRRRvvMcc
ccccccccccccccccccllcccccvvvRRRRRRRRRRRRRRRRRvvvcc
ccccccccccccccccccllcccccvvvRRRRRRRRRRRRRRRRRvvccc
cccMvMvvMMcccccccccccccccMvvRRRRRRRRRRRRRRRRRvvMcc
cccvvvvvvvcccccccccccccccMvvRRRRRRRRRRRRRRRRRvvvcc
cccvvvvvvvcccccccccccccccMwwRRRRRRRRRRRRRRRRRvvccc
cccvvRRRRRwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvMcc
cccvvRRRRRwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvMcc
cccvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc
cccvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc
ccvvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccccccc
lllvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc
lllvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc
cccvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwJJJJJJJJ
cccvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ
cccvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ
cccvvRRRRRwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwJJJJJJJ
cccvvRRRRRwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwJJJJJJJJ
cccvvvvvvvwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ
cccvvvvvvvwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ
cccMcMvcMMwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwJJJJJJJ
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwJJJJJJJJ
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ
ccccccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccccccc
ccccccccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccccccc
ccccccccccMwwwwwwwwwwwMwwwwwwMwwwwwwwwwwwwMccccccc
lllllcccccccccccccccccctttttttccccccccccccccccccll
lllllcccccccccccccccccctttttttccccccccccccccccccll
lllllcccccccccccccccccctttttttccccccccccccccccccll
cccccccccclllcccccccccctttttttcccccccccccccccccccc
cccccccccclllcccccccccctttttttcccccccccccccccccccc
ccccccccccccccccccccccctttttttcccccccccccccccccccc
ccccccccccccccccccccccctttttttcccccccccccccccccccc
ccccccccccccccccccccccctttttttcccccccccccccccccccc
ccccccccccccccccccccccctttttttccccclllllcccccccccc
ccccccccccccccccccccccctttttttccccclllllcccccccccc
WWWWWWWWWWWWWWWWWWMMtttttttttttMMWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWttttttttttttttMWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWttttttttttttttMWWWWWWWWWWWWWWWWW
EEEEEEEEEEEEEEEEEEtttttttttttttttEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEttttttttttttttMEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
7777777777777777777777777zzzxzzzxzzzxzzzxzzzxzzz77
7777777777777777777777777zxxxxxxxxxxxxxxxxxxxxxz77
7777777777777777777777777zxxxxxxxxxxxxxxxxxxxxxz77
7777777777777777777777777xxxxxxxxxxxxxxxxxxxxxxx77
7777777777777777777777777zxxxxxxxxxxxxxxxxxxxxxz77
7777777777777777777777777zxxxxxxxxxxxxxxxxxxxxxz77
7777777777777777777777777zxxxxxxxxxxxxxxxxxxxxxx77
7777777777777777777777777xxxxxxxxxxxxxxxxxxxxxxz77
77zzzzxzzz777777777777777zxxxxxxxxxxxxxxxxxxxxxz77
77zxxxxxxz777777777777777zxxxxxxxxxxxxxxxxxxxxxx77
77zxxxxxxxuuuuuuuuuuuuuuuzzxxxxxxxxxxxxxxxxxxxxz77
77xxxxzxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzxxxxz77
77zxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzzzxzz77
77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
77xxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
77xxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
77zxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuujjjjjjj
77xxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
77zxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
77zxxxxxxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
77zzzzxzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuujjjjjjj
7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
7777777777wuuuuuuuuuuuwwwwuwwwuuuuuuuuuuuuw7777777
7777777777wuuuuuuuuuuuwuuuuuuwuuuuuuuuuuuuw7777777
7777777777wwwuwwwuwwwuwwwuwwwwwuwwwuwwwuwww7777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
7777777777777777777777llllllll77777777777777777777
gggggggggggggggggnnnlnnllllllllnnggggggggggggggggg
gggggggggggggggggnllllllllllllllnggggggggggggggggg
gggggggggggggggggnllllllllllllllnggggggggggggggggg
77777777777777777llllllllllllllll77777777777777777
77777777777777777nlllllllllllllln77777777777777777
```
Front (looking from the front; the sky at the top):
```
..MMMMKMMM...............MMM.MMM.MMM.MMM.MMMMMMM..
..MMMMKMMM...............MMM.MMM.MMM.MMM.MMMMMMM..
..vvvvvvvvRR.............vvvRRRRRRRRRRRRRRMvvvvv..
..vvvvvvvv...............vvvvvvvvvvvvvvvvvvvvvvv..
..vvvvvvvvMM..MM..MM..MMMMUMMMvvMMvvMMvvMMvvvvUv..
..vvvvvvvvMMM.MMM.MMM.MMMMUMMMMvMMMvMMMvMMMvvvUv..
..vvvvvvvvMMM.MMM.MMM.MMMMMMMMMvMMMvMMMvMMMvvvvv..
..vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvvv..
..vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvv..
..vvvvvvvvwUwwwUwwwUwwwwwwwwwwwwwUwwwUwwwUwvvvvv..
..vvvvvvvvwUwwwUwwwUwwwwwwwwwwwwwUwwwUwwwUwvvvvv..
..vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvv..
..vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvv..
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwL..
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwL..
..wwwwwLLLwLLwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwL..
..wwwwwLLLwLLLwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwL..
..wwwwwLLLwLLLwwwwMMwwwwwwwwwwwMwwwwwwwwwwwwwwww..
..wwwwwLLLwLLLwwwwMMwwMwwwwwwwwMMwwwwwwwwwwwwwww..
..vvvvvvvvwwwwwwwwMMwwMwwwwwwwwMMwwwwwwwwwwvvvvv..
..vvvvvvvvwwwwwwwwttttttttttttttwwwwwwwwwwwvvvvv..
..vvvvvvvvwwwwwwwwtttttttttttttttwwwwwwwwwwvvvvv..
..vvvvvvvvwwwwwwwwtttttttttttttttwwwwwwwwwwvvvvv..
..vvvvvvvvwwwwwwwwtttttttttttttttwwwwwwwwwwJJJJJJJ
..vvvvvvvvwwwwwwwwtttttttttttttttwwwwwwwwwwJJvJvJJ
..vvvvvvvvwwwwwwwwtttttttttttttttwwwwwwwwwwJJvJvJJ
..vvvvvvvvwwwwwwwwtttttttttttttttwwwwwwwwwwJJvJvJJ
WWWWWWWWWWWWWWWWWttttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
EEEEEEEEEEEEEEEEEttttttttttttttttEEEEEEEEEEEEEEEEE
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
..MMM.MMMMMMMMMMM.MM.MMM.MMM......................
..MMM.MMMMMMMMMMM.MM.MMM.MMM......................
..vvvvvvvvvvvvvRRRRRRRRRRvvv......................
..vvvvvvvvvvvvvvvvvvvvvvvvvv......................
..vvvvvvvvvvvvvUvvMvvMMvvMMv.MM.MMM...............
..vvvvvvvvvvvvvUvvMvvMMvvMMvMMM.MMM...............
..vvvvvvvvvvvvvvvvMvvMMvvMMvMMM.MMM...............
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwww...............
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwww...............
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwww...............
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwww...............
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwww...............
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwww...............
..wwwwwwwwwwLLLwwwwwwwwwwwwwwwwwwww...............
..wwwwwwwwwwLLLwwwwwwwwwwwwwwwLLLww...............
..wwwwwwwwwwLLLwLLwwwwwwwwwwLLLLLww...............
..wwwwwwwwwwLLLwLLLwwwwwwwwwLLLLLww...............
..wwwwwwwwwwwwwwLLLwwwwwwwwwLLLLLww..........MM..M
..wwwwwwwwwwwwwwLLLwwwwwwwwwLLLwwww..........MMM.M
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwww..........MMM.M
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwwwttttttttttttttt
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwwwttttttttttttttt
..vvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwwwtttttttttttUttt
..vvvvvvvvvvvvvwwwwwJJwJJJJwJJwwwwwtttttttttttUttt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttttttt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttttttt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttttttt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttWWttt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJLJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJLJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJLJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJLJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttWWWtt
..vvvvvvvvvvvvvwwwwwwJwJJwJwJJwwwwwttttttttttWWWtt
ccccccccccccccccccccffffffffffccccclltcccccccWWWEE
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
............VV.......kkkkkkkkkk........V..........
............VV.........kkkkkkkk........V..........
............VV.........kkkkkkkk........V..........
............VV.........kkkkkkkk........V..........
............VV.........kkkkkkkk........V..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
.........................vvvvvvvvvvvvvvvvvvvvvv...
.........................vvvvvvvvvvvvvvvvvvvvvvv..
.........................vvvvvvvvvvvvvvvvvvvvvvv..
.........................vvv.................vvv..
.........................vvv.................vvv..
.........................vvv.................vvv..
.........................vvv.................vvv..
.........................vvv.................vvv..
..vvvvvvvv...............vvv.................vvv..
..vvvvvvvv...............vvv.................vvv..
..vvvvvvvvwwwwwwwwwwwwwwwvvwwwwwwwwwwwwwwwwvvvvv..
..vvv.....wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvv..
..vvv.....wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvv..
..vvv....................kkk............www.......
..vvv....................kkk............www.......
..vvv....................kkk............www.......
..vvv....................kkk............www.......
..vvv....................kkk............www.......
..vvv...................................wwwJ..J.J.
..vvv...................................wwwJJJJ.JJ
..vvv.....ww............................www.......
..vvv.....www...........................wwwJJJJ.JJ
..vvv.....www...........................wwwJ..J.J.
..vvvvvvvvwww...........................wwwJ..J.J.
..vvvvvvvvwww...........................wwwJJJJ.JJ
...vvvvvvvwww...........................www.......
..........www...........................wwwJJJJ.JJ
..........www...........................wwwJ..J.J.
..........www...........................www.......
..........www...........................www.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
......................tttttttt....................
......................tttttttt....................
......................tttttttt....................
......................tttttttt....................
......................tttttttt....................
......................tttttttt....................
......................tttttttt....................
......................tttttttt....................
......................tttttttt....................
......................tttttttt....................
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWttttttttttttttttWWWWWWWWWWWWWWWWW
.................tttttttttttttttt.................
.................tttttttttttttttt.................
```
Cut at z=75 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
.........................vvvvvvvvvvvvvvvvvvvvvv...
.........................vvvvvvvvvvvvvvvvvvvvvvv..
.........................vvvvvvvvvvvvvvvvvvvvvvv..
.........................vvv.................vvv..
.........................vvv.................vvv..
.........................vvv.................vvv..
.........................vvv.................vvv..
.........................vvv.................vvv..
..vvvvvvvv...............vvv.................vvv..
..vvvvvvvv...............vvv.................vvv..
..vvvvvvvvwwwwwwwwwwwwwwwvvwwwwwwwwwwwwwwwwvvvvv..
..vvv.....wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvv..
..vvv.....wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvv..
..vvv...................................www.......
..vvv...................................www.......
..vvv...................................www.......
..vvv...................................www.......
..vvv...................................www.......
..vvv...................................www.......
..vvv...................................www.......
..vvv.....ww............................www.......
..vvv.....www...........................www.......
..vvv.....www...........................www.......
..vvvvvvvvwww...........................www.......
..vvvvvvvvwww...........................www.......
...vvvvvvvwww...........................www.......
..........www...........................www.......
..........www...........................www.......
..........www...........................www.......
..........www...........................www.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.......
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
ccccccccllcccccccccccccccccccccccccccccccccccccccc   77777777777777777777777777777777777777777777777777
ccccccccllcccccccccccccccccccccccccccccccccccccccc   77777777777777777777777777777777777777777777777777
ccccccccllcccccccccccccccccccccccccccccccccccccccc   77777777777777777zzzxzzzxzzzxzzzxzzzxzzz7777777777
ccccccccccccclllllvvvvvvvvvvvvvvvvvvvvvvcccccccccc   77777777777777777zxxxxxxxxxxxxxxxxxxxxxz7777777777
ccccccccccccclllllvvvvvvvvvvvvvvvvvvvvvvcccccccccc   77777777777777777zxxxxxxxxxxxxxxxxxxxxxz7777777777
ccccccccccccccccccvvRRRRRRRRRRRRRRRRRRvvccccccccll   77777777777777777xxxxxxxxxxxxxxxxxxxxxxx7777777777
ccccccccccccccccccvvRRRRRRRRRRRRRRRRRRvvccccccccll   77777777777777777zxxxxxxxxxxxxxxxxxxxxxz7777777777
cccccccccccccccccMvvRRRRRRRRRRRRRRRRRRvvccccccccll   77777777777777777zxxxxxxxxxxxxxxxxxxxxxz7777777777
ccccccccccccccclllvvRRRRRRRRRRRRRRRRRRvvcccccccccc   77777777777777777zxxxxxxxxxxxxxxxxxxxxxz7777777777
ccccccccccccccclllvvRRRRRRRRRRRRRRRRRRvvcccccccccc   77777777777777777xxxxxxxxxxxxxxxxxxxxxxx7777777777
cccMvMvvMMlllcccccvvRRRRRRRRRRRRRRRRRRvvcccccccccc   77zzzzxzzz7777777zxxxxxxxxxxxxxxxxxxxxxz7777777777
cccvvvvvvvlllcccccvvRRRRRRRRRRRRRRRRRRvvcccccccccc   77zxxxxxxz7777777zxxxxxxxxxxxxxxxxxxxxxz7777777777
cccvvvvvvvllwccccwMvRRRRRRRRRRRRRRRwRwwMcccccccccc   77zxxxxxxxuuuuuuuzzxxxxxxxxxxxxxxxxzxxzzuww7777777
cccvvRRRRRwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccccccc   77xxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
cccvvRRRRRwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccccccc   77zxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
cccvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwJJJJJJJ   77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuujjjjjjj
cccvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwJJJJJJJJ   77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
ccvvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ   77xxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
lllvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ   77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
lllvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwJJJJJJJ   77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuujjjjjjj
lllvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwJJJJJJJJ   77xxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
lllvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ   77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
llMvvRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMJJJJJJJ   77zxxxxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
cccvvRRRRRwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwJJJJJJJ   77zxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuujjjjjjj
cccvvRRRRRwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwJJJJJJJJ   77xxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuwjjjjjjj
cccvvvvvvvwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc   77zxxxxxxxuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
cccvvvvvvvwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc   77zxxxxxxzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
cccMMvcMcMwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc   77zzzxzzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccccccc   7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
llllllllccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMcccccll   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
llllllllccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwcccccll   7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
lllllllcccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwccccccll   7777777777wuuuuuuuuuuuwwwwuwwwuuuuuuuuuuuuw7777777
lllcccccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMccccccc   7777777777wuuuuuuuuuuuwuuuuuuwuuuuuuuuuuuuw7777777
lllcccccccMwwwwwwwwwwwMwwwwwwMwwwwwwwwwwwwMccccccc   7777777777wwwuwwwuwwwuwwwwuwwwwuwwwuwwwuwww7777777
ccccccccccccccclllccccctttttttcccccccccccccccccccc   7777777777777777777777llllllll77777777777777777777
ccccccccccccccclllccccctttttttcccccccccccccccccccc   7777777777777777777777llllllll77777777777777777777
ccccccccccccccclllccccctttttttcccccccccccccccccccc   7777777777777777777777llllllll77777777777777777777
ccccccccccccccclllccccctttttttcccccccccccccccccccc   7777777777777777777777llllllll77777777777777777777
ccccccccccccccclllccccctttttttcccccccccccccccccccc   7777777777777777777777llllllll77777777777777777777
lllcccccccccccclllccccctttttttccccccccccccclllllll   7777777777777777777777llllllll77777777777777777777
lllcccccccccccclllccccctttttttccccccccccccclllllll   7777777777777777777777llllllll77777777777777777777
llccccccccccccclllccccctttttttccccccccccccclllllll   7777777777777777777777llllllll77777777777777777777
ccccccccccccccclllccccctttttttllllllllllccclllllcc   7777777777777777777777llllllll77777777777777777777
ccccccccccccccclllccccctttttttllllllllllccclllllcc   7777777777777777777777llllllll77777777777777777777
WWWWWWWWWWWWWWWWWWWWMtttttttttMttMMWWWWWWWWWWWWWWW   ggggggggggggggggggggnnllllllllnlnnnggggggggggggggg
WWWWWWWWWWWWWWWWWWWWMttttttttttttttWWWWWWWWWWWWWWW   ggggggggggggggggggggnlllllllllllllnggggggggggggggg
WWWWWWWWWWWWWWWWWWWWtttttttttttttttWWWWWWWWWWWWWWW   ggggggggggggggggggggnlllllllllllllnggggggggggggggg
EEEEEEEEEEEEEEEEEEEEtttttttttttttttEEEEEEEEEEEEEEE   77777777777777777777lllllllllllllll777777777777777
EEEEEEEEEEEEEEEEEEEEMttttttttttttttEEEEEEEEEEEEEEE   77777777777777777777nllllllllllllln777777777777777
```
### Seed 3: plan and heights side by side
```
cccccccccccccccccccccccccccccccccccccccccccccccccc   77777777777777777777777777777777777777777777777777
cccccccccccccccccccccccccccccccccccccccccccccccccc   77777777777777777777777777777777777777777777777777
cccccccccccccccccccccccccccccccccccccccccccccccccc   777777777777777zzzxzzzxzzzxzzzxzzzxzzz777777777777
cccccccccccccccMvvvvvvvvvvvvvvvvvvvvvMcccccccccccc   777777777777777zxxxxxxxxxxxxxxxxxxxxxz777777777777
cccccccccccccccMvvvvvvvvvvvvvvvvvvvvvMcccccccccccc   777777777777777zxxxxxxxxxxxxxxxxxxxxxz777777777777
llllllllcccccccvvvRRRRRRRRRRRRRRRRRvvvccllllllllcc   777777777777777xxxxxxxxxxxxxxxxxxxxxxx777777777777
llllllllcccccccvvvRRRRRRRRRRRRRRRRRvvcccllllllllcc   777777777777777zxxxxxxxxxxxxxxxxxxxxxz777777777777
lllllllccccccccMvvRRRRRRRRRRRRRRRRRvvMcclllllllccc   777777777777777zxxxxxxxxxxxxxxxxxxxxxz777777777777
cccccccccccccccvvvRRRRRRRRRRRRRRRRRvvccclllccccccc   777777777777777zxxxxxxxxxxxxxxxxxxxxxz777777777777
cccccccccccccccvvvRRRRRRRRRRRRRRRRRvvvcclllccccccc   777777777777777xxxxxxxxxxxxxxxxxxxxxxx777777777777
cccllccccccccccMvvRRRRRRRRRRRRRRRRRvvMcccccccccccc   777777777777777zxxxxxxxxxxxxxxxxxxxxxz777777777777
cccllccccccccccMvvRRRRRRRRRRRRRRRRRvvMcccccccccccc   777777777777777zxxxxxxxxxxxxxxxxxxxxxz777777777777
cclllccccccccccMwwRRRRRRRRRRRRRRRRRvMMcccccccccccc   7777777777wwwuwzzxxxxxxxxxxxxxxxxxxxzzwuwww7777777
lllllcccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMcclllll   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
lllllcccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwMcclllll   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc   7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwcccccccc   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
ccccccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwMccccccc   77jjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777
cccJJJJJJJMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc   77jjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
cccJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwccccccc   77jjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777
cccJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwMMvvMvv   77jjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzzzxzzxx
cccJJJJJJJMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwvvvvvvv   77jjjjjjjjwuuuuuuuuuyuuuuuuuuuuuuuuuuuuuuuzxxxxxxx
cccJJJJJJJMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwvvvvvvv   77jjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxx
cccJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwRRRRRvv   77jjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxx
cccJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRwwwRRRRRvv   77jjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxx
cccJJJJJJJMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRvv   77jjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxxxx
cccJJJJJJJMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRvv   77jjjjjjjjwuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxxxx
cccJJJJJJJwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRvv   77jjjjjjjjuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxxxx
ccccccccllwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRvv   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxxxx
ccccccccllMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRvv   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxxxx
ccccccccccMwwRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRvv   7777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxxxx
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRvv   7777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxxxxxxxx
ccccccccccwwwRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRvv   7777777777wuuuuuuuuuuuwwwwuwwwuuuuuuuuuuxxxxxxxxxx
ccccccccccMwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwRRRRRvv   7777777777wuuuuuuuuuuuwuuuuuuwuuuuuuuuuuuuxxxxxxxx
ccccccccccMwwwwwwwwwwwMwwwwwwMwwwwwwwwwwwwwRRRRRvv   7777777777wwwuwwwuwwwuwwwuwwwwuuuuuuuuuuuuxxxxxxxx
ccccccccccccccccccccnnnnnnnnnnnnnccccccccccvvvvvvv   777777777777777777777777777777777777777777xxxxxxxx
ccccccccccccccccccccnnnnnnnnnnnnnccccccccccvvvvvvv   777777777777777777777777777777777777777777zxxxxxxx
ccccccccccccccccccccnnnnnnnnnnnnnccccccccccMMvcMvv   777777777777777777777777777777777777777777zzzxzzxx
ccccccccccccccccccccnnnnnnnnnnnnncccccllcccccccccc   77777777777777777777777777777777777777777777777777
ccccccccccccccccccccnnnnnnnnnnnnncccccllcccccccccc   77777777777777777777777777777777777777777777777777
cccllcccccccccccccccnnnnnnnnnnnnnccccclllllccccccc   77777777777777777777777777777777777777777777777777
cccllcccccccccccccccnnnnnnnnnnnnnccccclllllccccccc   77777777777777777777777777777777777777777777777777
cccllcccccccccccccccnnnnnnnnnnnnncccccllllcccccccc   77777777777777777777777777777777777777777777777777
cccccccccccccllcccccnnnnnnnnnnnnnccccccccccccccccc   77777777777777777777777777777777777777777777777777
cccccccccccccllcccccnnnnnnnnnnnnnccccccccccccccccc   77777777777777777777777777777777777777777777777777
WWWMWWMMWWMMWWMMWWMMMMWWMWWMWWMMMMMWWMMWWMMWWMMWWM   ggiigiiigiiigiiigiiivvvtvvtvvtvvviigiiigiiigiiigii
WWWWWWWWWWWWWWWWWWWWMWWWWWWWWWWWMWWWWWWWWWWWWWWWWW   gggggggggggggggggggivtttttttttttvggggggggggggggggg
WWEMWEMMWEMMWEMMWEMMMMrWMrWMrWMMMMMWEMMWEMMWEMMWEM   ggiigiiigiiigiiigiiivvvtvvtvvtvvviigiiigiiigiiigii
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
How much the plans of the seeds differ: 0.42 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 197 nodi, 798 passi, finito in 503 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=terra di confine, m=magenta, h=sala di guardia, b=sala sopra la cantina, s=vano scala, w=muro del mastio, a=interno del torrione, v=muro del torrione, c=cortile lastricato, l=pietra del cortile, W=cinta muraria, t=torre d'angolo, G=corpo di guardia, d=soglia del mastio, p=tettoia delle armi, q=pilastro di legno, u=blue, f=pavimento di tavole, F=solaio di legno, R=terrazza del mastio, J=tetto della tettoia, K=camino di pietra, L=finestra, X=X, O=porta di quercia, T=gradini, o=assi della porta, N=stipite di pietra, M=merlo, D=lastricato della cantina, V=muro della cantina, k=scalini di legno, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #93=terreno di prova (marcatore).
Alla fine: w 63356, v 43086, t 23166, W 8750, k 6100, V 5396, J 3864, c 3750, L 3656, F 3465, f 2842, R 2775, U 2241, M 1241, D 1100, o 408, E 350, l 250, N 80, O 32, K 5.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-47 all×26, prl×4, one×4, convchain×1: 623 celle x0-19 y0-19 z20, passi 2-67
   #49 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 68
#51-59 all×5: 30850 celle x20-84 y25-69 z19-41, passi 69-91
    #60 all . w → w * passi=20: ×20, 18500 celle x20-84 y25-69 z41-61, passi 92-111, .→w 18500
#61-64 all×4: 37550 celle x20-84 y25-69 z20-85, passi 112-137
    #65 all . h → h . passi=31: ×31, 51150 celle x25-79 y50-64 z21-52, passi 138-168, h→. 25575, .→h 25575
    #66 all . b → b . passi=31: ×31, 55800 celle x25-79 y30-49 z21-52, passi 169-199, b→. 27900, .→b 27900
#67-68 all×2: 15850 celle x25-79 y30-64 z22-53, passi 200-230
    #69 all . h → h . (+2) passi=31: ×31, 119350 celle x25-79 y30-64 z53-84, passi 231-261, b→. 27900, .→b 27900, h→. 25575, .→h 25575, +2
      r1 . h → h . ×25575; r2 . b → b . ×27900; r3 . s → s . ×6200
#70-71 prl×1, all×1: 31325 celle x5-94 y5-64 z21-84, passi 262-304
#72-74 all×3: 32500 celle x5-94 y5-54 z20-94, passi 305-337
    #75 all . a → a . passi=31: ×31, 52700 celle x10-89 y10-49 z21-52, passi 338-368, a→. 26350, .→a 26350
    #76 all . a → a F passi=1: ×1, 1700 celle x10-89 y10-49 z52-53, passi 369, a→F 850, .→a 850
    #77 all . a → a . passi=31: ×31, 52700 celle x10-89 y10-49 z53-84, passi 370-400, a→. 26350, .→a 26350
#78-79 all×2: 17000 celle x10-89 y10-49 z84-94, passi 401-410
#80-86 prl×3, all×4: 29350 celle x0-99 y10-94 z20-94, passi 411-503
#87-110 all×3, one×1: 43755 celle x25-79 y25-99 z0-58, passi 504-566
#111-125 prl×7, one×1, all×6: 34896 celle x25-79 y30-49 z1-20, passi 567-608
#126-194 prl×7, all×20, one×1: 32947 celle x0-99 y5-99 z1-99, passi 609-792
#195-197 prl×1, one×1, all×1: 26949 celle x5-94 y5-69 z28-99, passi 793-798
Senza effetto (non hanno mai cambiato una cella):
#9 prl h/E → */h passi=1
#36 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#41 all [dn]/c → */n: le celle cercate c'erano, ma mai disposte come nel pattern
#42 all [dnG]/W → */G: le celle cercate c'erano, ma mai disposte come nel pattern
#43 all [dnGr]/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#44 all nc → *n passi=1: in quel momento nella griglia non c'erano celle "n"
#45 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G"
#46 all r[Ec] → *r passi=1: in quel momento nella griglia non c'erano celle "r"
#54 all . G → G n passi=1: in quel momento nella griglia non c'erano celle "G"
#55 all . G → G . passi=30: in quel momento nella griglia non c'erano celle "G"
#56 all . G → G W passi=6: in quel momento nella griglia non c'erano celle "G"
#57 prl G → W: in quel momento nella griglia non c'erano celle "G"
… e altri 57
Fix it and answer with the whole program.

## Risposta

```xml
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEmhbswavclWtGdnrp" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Main Keep core around H:
           Grow 4 behind (b: 20 voxels deep) and 4 in front (h: 25 voxels deep with H, total 45 voxels along y).
           Grow 5 to each side (width 11 = 55 voxels along x) so the room is 55 x 45 voxels.
           When cellar (20x10) and stair (16x10) are placed in b, the front room h stays 55 x 25 (with 25 + 10 = 35 clear depth beside the stairs, >= 28x28). -->
      <all in="E/H" out="b/*" symmetry="()" steps="1"/>
      <all in="E/b" out="b/*" symmetry="()" steps="3"/>
      <all in="H/E" out="*/h" symmetry="()" steps="1"/>
      <all in="h/E" out="*/h" symmetry="()" steps="3"/>

      <!-- Keep H as the front-axis center marker while expanding sideways 5 cells to each side -->
      <all in="HE" out="*m" symmetry="(x)" steps="1"/>
      <all in="mE" out="*m" symmetry="(x)" steps="4"/>
      <all in="hE" out="*h" symmetry="(x)" steps="5"/>
      <all in="bE" out="*b" symmetry="(x)" steps="5"/>
      <prl in="m" out="h"/>

      <!-- Keep walls -->
      <all in="[Hhb]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Entrance axis straight from H to the front wall (3 cells wide = 15 voxels) -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/G" symmetry="()" steps="1"/>
      <all in="Gw" out="*G" symmetry="(x)" steps="1"/>
      <prl in="d" out="h"/>
      <prl in="H" out="h"/>
      <prl in="G" out="d"/>

      <!-- Stair zone in back room against the back wall: 4 cells along +x (20 voxels) and 2 cells wide (10 voxels), with 3 cells landing before it -->
      <one in="wwwwwwwwwwwww/wbbbbbbbbbbbw/wbbbbbbbbbbbw" out="*************/****ssss*****/****ssss*****" symmetry="()" steps="1"/>

      <!-- 3. Attached Watchtower Bastion on left, right, or back of the keep (varies by seed; never on front wall where d is) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/**" symmetry="(x)" steps="1"/>
      <one in="EEEEE/wwwww" out="*aaa*/*****" symmetry="()" steps="1"/>
      <all in="aE" out="*a" symmetry="(xy)" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Lean-to armory shed (p) against a free side of the keep (4x3 cells = 20x15 voxels, expanded to 20x20 when space permits) -->
      <one in="wEE/wEE/wEE/wEE" out="*pp/*pp/*pp/*pp" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- 5. Courtyard around the keep, bastion and lean-to -->
      <all in="[wvp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- At Huge size (where 5+ cells of ground remain), expand courtyard and add outer curtain wall & corner towers -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="cEEE" out="*WEE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers only on true outer corners of the curtain wall (Huge size) -->
      <all in="EE/EW" out="**/*t" symmetry="()"/>
      <all in="EE/WE" out="**/*t" symmetry="()"/>
      <all in="EW/EE" out="*t/**" symmetry="()"/>
      <all in="WE/EE" out="t*/**" symmetry="()"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Path across courtyard, gatehouse through curtain wall, road to front edge (3 cells wide) -->
      <all in="[dn]/[cW]" out="*/n" symmetry="()"/>
      <all in="[dn]/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="nW" out="nG" symmetry="(x)" steps="1"/>
      <all in="G/W" out="G/G" symmetry="()"/>
      <all in="W/G" out="G/G" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="r[EcW]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Texture the courtyard paving -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>cccll/cccll/clllc/llccc/llccc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhbswavclWtGdnrpqufFRJKLXYOToNMDVkU#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pqqqp/pqqqp/pqqqp/ppppp"/>

      <sequence symmetry="(xy)">
        <!-- Unions for the included parts -->
        <union symbol="+" values="wvWtGK"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wvWt"/>

        <!-- Mark D under the back room 'b' and 's' on the layer below the soil (z=19) for part-cellar.
             Because 'h' is 25 voxels deep in front of 'b', D stays 25 voxels back from the front wall (>= 10 required) and is 55 x 20 voxels (>= 44 x 14). -->
        <all in="b B" out="* D" symmetry="()"/>
        <all in="s B" out="* D" symmetry="()"/>

        <!-- B. THE HEIGHTS -->
        <!-- Keep doorway 'd': seed O at z=20 across the 15x5 doorway, then rises as solid wall 'w' 63 steps (total height 64, matching 'w') without window bands X so part-door can carve 30 high into it -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="w"/>

        <!-- Gatehouse 'G' (at Huge size): towers at the sides of the open path 'n' -->
        <all in="B G" out="G *" steps="34"/>

        <!-- Keep walls 'w': 2 storeys = 64 high, with window bands X -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w *" steps="20"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w *" steps="12"/>

        <!-- Keep interior 'h', 'b', 's': 2 storeys (ground floor f at z=20, slab F at z=52, roof R at z=84) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B b" out="b f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=21 -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B b" out="b B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- 2nd storey slab F at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B b" out="b F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B b" out="b B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Ceiling / roof terrace R at z=84 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="b" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Watchtower bastion walls 'v' and interior 'a': taller than keep (74 high) -->
        <all in="B v" out="v *" steps="42"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v *" steps="20"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="9"/>
        <prl in="a" out="R"/>

        <!-- Lean-to shed 'p' (floor) and 'q' (posts): 32 clear height, roof J at z=53 -->
        <all in="B p" out="u f" steps="1"/>
        <all in="B u" out="u B" steps="32"/>
        <prl in="u" out="J"/>
        <all in="B q" out="q *" steps="33"/>
        <prl in="q" out="J"/>

        <!-- Outer curtain wall 'W': 24 high -->
        <all in="B W" out="W *" steps="24"/>

        <!-- Corner towers 't': 38 high -->
        <all in="B t" out="t *" steps="38"/>

        <!-- C. FULL SCALE: DOORS, CELLAR, STAIRS, BATTLEMENT, WINDOWS -->
        <!-- Internal door seed O between keep room (f/F) and bastion room (f/F) through wall 'w' -->
        <one in="f/w/w/w/w/w/f" out="*/O/O/O/O/O/*" symmetry="(xy)" steps="1"/>
        <one in="F/w/w/w/w/w/F" out="*/O/O/O/O/O/*" symmetry="(xy)" steps="1"/>
        <all in="Ow" out="OO" symmetry="(xy)" steps="5"/>

        <!-- 1. Dig cellar under back room -->
        <import file="part-cellar"/>

        <!-- 2. Build stairs between ground and 2nd floor -->
        <import file="part-stair"/>

        <!-- 3. Build doors (front door O is 15x5 under 63 layers of solid 'w', so it rises 30 high) -->
        <import file="part-door"/>

        <!-- 4. Battlements and arrow slits on all fortification walls -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 5. Windows in the X bands on keep and bastion facades -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <!-- Chimney / beacon turret on the keep roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: distinct medieval cartoon colours with area tags -->
  <color symbol="E" value="#7a8c56" name="terra di confine"/>
  <color symbol="h" value="#b8a484" name="sala di guardia" area="keep"/>
  <color symbol="b" value="#a69272" name="sala sopra la cantina" area="keep"/>
  <color symbol="s" value="#8c7355" name="vano scala" area="keep"/>
  <color symbol="w" value="#8c857b" name="muro del mastio" area="keep"/>
  <color symbol="a" value="#9c8a6e" name="interno del torrione" area="tower"/>
  <color symbol="v" value="#736c64" name="muro del torrione" area="tower"/>
  <color symbol="c" value="#aba396" name="cortile lastricato" area="courtyard"/>
  <color symbol="l" value="#968e82" name="pietra del cortile" area="courtyard"/>
  <color symbol="W" value="#7d776f" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="#69635c" name="torre d'angolo" area="tower"/>
  <color symbol="G" value="#7d776f" name="corpo di guardia" area="courtyard"/>
  <color symbol="d" value="#634832" name="soglia del mastio" area="keep"/>
  <color symbol="n" value="#bfb7a8" name="via del cortile" area="courtyard"/>
  <color symbol="r" value="#9e927f" name="strada di accesso" area="yard"/>
  <color symbol="p" value="#947856" name="tettoia delle armi" area="yard"/>
  <color symbol="q" value="#5c4328" name="pilastro di legno" area="yard"/>
  <color symbol="f" value="#8f6d48" name="pavimento di tavole" area="keep"/>
  <color symbol="F" value="#826240" name="solaio di legno" area="keep"/>
  <color symbol="R" value="#70583c" name="terrazza del mastio" area="keep"/>
  <color symbol="J" value="#9e4733" name="tetto della tettoia" area="yard"/>
  <color symbol="K" value="#59534d" name="camino di pietra" area="keep"/>
  <color symbol="L" value="#36454f" name="finestra" area="keep"/>
  <color symbol="O" value="#6b4423" name="porta di quercia" area="keep"/>
  <color symbol="o" value="#4a2e16" name="assi della porta" area="keep"/>
  <color symbol="N" value="#59534d" name="stipite di pietra" area="keep"/>
  <color symbol="M" value="#8c857b" name="merlo" area="keep"/>
  <color symbol="U" value="#2b2927" name="feritoia" area="keep"/>
  <color symbol="T" value="#826240" name="gradini" area="keep"/>
  <color symbol="k" value="#9c7a54" name="scalini di legno" area="keep"/>
  <color symbol="D" value="#635c54" name="lastricato della cantina" area="keep"/>
  <color symbol="V" value="#524c46" name="muro della cantina" area="keep"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="assi aperte"/>

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
