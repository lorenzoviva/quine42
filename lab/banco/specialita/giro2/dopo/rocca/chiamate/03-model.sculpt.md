# model.sculpt · correzione · gemini-4-argon · 44 s · 26291 token d'ingresso (0 in cache), 4752 d'uscita, 0 di ragionamento · $0.10

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
           Keep H as center axis marker! Grow 3 behind (b), 3 in front (h), and 4 to each side. -->
      <all in="E/H" out="m/*" symmetry="()" steps="3"/>
      <prl in="E/m" out="m/*" p="0.5" steps="1" symmetry="()"/>
      <all in="H/E" out="*/m" symmetry="()" steps="3"/>
      <prl in="m/E" out="*/m" p="0.5" steps="1" symmetry="()"/>

      <!-- Expand sideways 4 cells to each side (width 9 = 45 voxels); optional +1 on one side by seed -->
      <all in="mE" out="*b" symmetry="(x)" steps="4"/>
      <all in="HE" out="*h" symmetry="(x)" steps="4"/>
      <!-- Front rows become h, back rows stay b -->
      <all in="[Hh]/m" out="*/h" symmetry="()"/>
      <all in="h/[mb]" out="*/h" symmetry="()"/>
      <all in="h[mb]" out="*h" symmetry="(x)"/>
      <prl in="m" out="b"/>

      <!-- Keep walls -->
      <all in="[Hhb]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Entrance axis straight from H to the front wall before turning H into h -->
      <all in="[Hd]/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()"/>
      <all in="dh" out="*h" symmetry="(x)"/>
      <prl in="d/d" out="h/*" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="H" out="h"/>

      <!-- Stair zone in back room against the back wall, 4 along +x and 2 wide, with 2 cells landing before it -->
      <one in="wwwwwwwwwww/wbbbbbbbbbw/wbbbbbbbbbw" out="***********/****ssss***/****ssss***" symmetry="()" steps="1"/>

      <!-- 3. Attached Watchtower Bastion on left, right, or back of the keep (varies strongly by seed) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/**" symmetry="(xy)" steps="1"/>
      <all in="aE" out="*a" symmetry="(xy)" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Lean-to porch / armory shed (p) against a free side of the keep -->
      <one in="wE/wE/wE/wE" out="*p/*p/*p/*p" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- 5. Courtyard around the keep, bastion and lean-to -->
      <all in="[wvp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand courtyard only where 5+ cells of ground remain (Huge size) -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 6. Outer Curtain Wall and Corner Towers where space allows (Huge size) -->
      <all in="cEEE" out="*WEE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="cE/WW" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers on outer corners of the curtain wall -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 7. Path across courtyard, gatehouse through curtain wall, road to front edge (3 cells wide) -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[ndGr]/E" out="*/r" symmetry="()"/>
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

        <!-- Mark D under the back room 'b' and 's' on the layer below the soil (z=19) for part-cellar -->
        <all in="b B" out="* D" symmetry="()"/>
        <all in="s B" out="* D" symmetry="()"/>

        <!-- B. THE HEIGHTS -->
        <!-- Keep doorway 'd': floor at z=20, then rises as wall 'w' above floor so part-door can carve into it -->
        <all in="B d" out="w f" steps="1"/>

        <!-- Gatehouse 'G': path at z=20, open gateway 30 high, then masonry bridge from z=51 to 56 -->
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

        <!-- Watchtower bastion walls 'v' and interior 'a': taller than keep (76 high) -->
        <all in="B v" out="v *" steps="42"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v *" steps="22"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="11"/>
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
        <!-- Front door seed O where path 'n' meets keep wall 'w' above doorway floor -->
        <all in="w/n" out="O/*" symmetry="()" steps="1"/>
        <all in="w/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Internal door seed O between keep room (f/F) and bastion room through wall 'v' -->
        <one in="fvvvvvf" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <one in="FvvvvvF" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/v" out="*/O" symmetry="(xy)" steps="5"/>

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
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2); stanza: la più grande in cui si sta in piedi ha il lato di 14 voxel (0,88 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole; cantina: un pavimento sotto il suolo non si raggiunge dal piano terra — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra di confine, w muro del mastio, v muro del torrione, c cortile lastricato, l pietra del cortile, W cinta muraria, t torre d'angolo, f pavimento di tavole, F solaio di legno, R terrazza del mastio, J tetto della tettoia, K camino di pietra, L finestra, M merlo, D lastricato della cantina, V muro della cantina, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEMttttttEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttEEEEE
EEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEtttttttEEEEE
EEEEEMttttttMWWWWWWWWWWWWWWWWWWWWWWWWWtttttttEEEEE
EEEEEtttttttMWWWWWWWWWWWWWWWWWWWWWWWWWtttttttEEEEE
EEEEEttttttMcWWWWWWWWWWWWWWWWWWWWWWWWcMttttttEEEEE
EEEEEMttttcccccccccccccccccccccccccccccctttttEEEEE
EEEEEMtttMccccccccccccccccccccccccccccccMtttMEEEEE
EEEEEEEEWWccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEWWccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEWWccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEWWlllcccccccccccccccccccccccccllWWWEEEEEEE
EEEEEEEEWWlllcccccccccccccccccccccccccllWWWEEEEEEE
EEEEEEEEWWccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEWWccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEWWccccccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEWWcccvvvvvvvlllcccccccccccccccllWWWEEEEEEE
EEEEEEEEWWcccvvvvvvvlllcccccccccccccccllWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRwwMMwwMMwwMMMcccccllWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRwwwwwwwwwwwwMcccccllWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRwwwwwwwwwwwwMcccccllWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwwJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwwJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwJJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRwwwRRRRRRRwwMJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRwwwRRRRRRRwwwJJJJJccWWWEEEEEEE
EEEEEEEEWWcccvvRRRRRwwwRRRRRRRwwwJJJJcccWWWEEEEEEE
EEEEEEEEWWlllvvvvvvvwwwwwwwwwwwwMcccccccWWWEEEEEEE
EEEEEEEEWWlllvvvvvvMwwwwwwwwwMwwMcccccccWWWEEEEEEE
EEEEEEEEWWlllcccccllllltttttttccccccccccWWWEEEEEEE
EEEEEEEEWWlllcccccllllltttttttccccccccccWWWEEEEEEE
EEEEEEEEWWllccccclllllltttttttccccccccccWWWEEEEEEE
EEEEEEEEWWccclllllllllltttttttccccccccccWWWEEEEEEE
EEEEEEEEWWccclllllllllltttttttccccccccccWWWEEEEEEE
EEEEEMttMMccccccccccccctttttttcccllcccccMMttMEEEEE
EEEEEMttttccccccccccccctttttttcccllcccccMttttEEEEE
EEEEEtttttccccccccccccctttttttcccllccccctttttEEEEE
EEEEEtttttccccccccccccctttttttcccccccccctttttEEEEE
EEEEEMttttcccccccccccccttttttMccccccccccMttttEEEEE
EEEEEttttttMMEEEEEEEMtttttttEEEEEEEEEEMttttttEEEEE
EEEEEMttttttMEEEEEEEMttttttMEEEEEEEEEEtttttttEEEEE
EEEEEMMEtMEMEEEEEEEEMEMEtMMEEEEEEEEEEEMMtEMEMEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777nnnnlnnn777777777777777777777777nnnnlnnn77777
77777nlllllln777777777777777777777777nlllllln77777
77777nlllllll777777777777777777777777llllllln77777
77777nllllllnggggggggggggggggggggggggnlllllll77777
77777lllllllnggggggggggggggggggggggggnlllllln77777
77777nlllllnnggggggggggggggggggggggggnnllllln77777
77777nllln777777777777777777777777777777nllln77777
77777nlnnn777777777777777777777777777777nlnnn77777
7777777ggg777777777777777777777777777777ggg7777777
7777777ggg777777777777777777777777777777ggg7777777
7777777ggg777777777777777777777777777777ggg7777777
7777777ggg777777777777777777777777777777ggg7777777
7777777ggg777777777777777777777777777777ggg7777777
7777777ggg777777777777777777777777777777ggg7777777
7777777ggg777777777777777777777777777777ggg7777777
7777777ggg77zzzzyzzz77777777777777777777ggg7777777
7777777ggg77zyyyyyyz77777777777777777777ggg7777777
7777777ggg77zyyyyyyy77777777777777777777ggg7777777
7777777ggg77yyyyyyyywuwwwuwwwuwww7777777ggg7777777
7777777ggg77zyyyyyyyuuuuuuuuuuuuw7777777ggg7777777
7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
7777777ggg77zyyyyyyyyyyuuuuuuuuuujjjjj77ggg7777777
7777777ggg77yyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
7777777ggg77yyyyyyyyyyyuuuuuuuuuujjjjj77ggg7777777
7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
7777777ggg77zyyyyyyyuuuuuuuuuuuuwjjjjj77ggg7777777
7777777ggg77yyyyyyyyuuuuuuuuuuuuujjjjj77ggg7777777
7777777ggg77zyyyyyyyuuwwwwuwwwuuwjjjjj77ggg7777777
7777777ggg77zyyyyyyzuuwuuuuuuwuuw7777777ggg7777777
7777777ggg77zzzzyzzzuuwwwuwwwwuww7777777ggg7777777
7777777ggg777777777777llllllln7777777777ggg7777777
7777777ggg777777777777llllllln7777777777ggg7777777
7777777ggg777777777777llllllll7777777777ggg7777777
7777777ggg777777777777llllllln7777777777ggg7777777
7777777ggg777777777777llllllln7777777777ggg7777777
77777nlnnn777777777777llllllln7777777777nnnln77777
77777nllln777777777777llllllll7777777777nllln77777
77777nllln777777777777llllllln7777777777nllln77777
77777lllll777777777777llllllln7777777777lllll77777
77777nllln777777777777llllllnn7777777777nllln77777
77777nlllllnn7777777nnllllll777777777nnllllln77777
77777nlllllln7777777nlllllln777777777nlllllln77777
77777nnnlnnnn7777777nnnnlnnn777777777nnnlnnnn77777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
```
Front (looking from the front; the sky at the top):
```
............MMMM.MMM..............................
............vvvvvvvvRR............................
............vvvvvvvv..K...........................
............vvvvvvvv..K...........................
............vvvvvvvv..MMMMMMMMMM..................
............vvvvvvvvM.MMMMMMMMMMM.................
............vvvvvvvvM.MMMMMMMMMMM.................
............vvvvvvvvwwwwwwwwwwwww.................
............vvvvvvvvwwwwwwwwwwwww.................
............vvvvvvvvwwwwwwwwwwwUw.................
............vvvvvvvvwwwwwwwwwwwUw.................
............vvvvvvvvwwwwwwwwwwwww.................
............vvvvvvvvwwwwwwwwwwwww.................
............wwwwwwwwwwwwwwwwwwwww.................
............wwwwwwwwwwwLLLwwwwwww.................
............wwwwwwwwLLLLLLLLLwwwL.................
............wwwwwwwwLLLLLLLLLwwwL.................
.....MMMMMMMwwwwwwwwMLMLLMMLLMwwL.....MMMMMMM.....
.....MMMMMMMMwwwwwwwMMMMwMMMLMwwL....MMMMMMMM.....
.....MMMMMMMMvvvvvvvMMMMwMMMMMwww....MMMMMMMM.....
.....tttttttvvvvvvvvttttttttttwww....tttttttt.....
.....ttttttttvvvvvvvttttttttttwww....tttttttt.....
.....tUttttttvvvvvvvttttttUtttwww....ttttUttt.....
.....tUttttttvvvvvvvttttttUtttwwwJJJJttttUttt.....
.....ttttttttvvvvvvvttttttttttwwwJJJJtttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJJJtttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJJJtttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJJJtttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
.....ttttttttvvvvvvvttttttttttwwwJJWJWttttttt.....
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
......................VVVVVVVV....................
......................VVVVVVVV....................
......................VVVVVVVV....................
......................VVVVVVVV....................
......................VVVVVVVV....................
......................VVVVVVVV....................
......................VVVVVVVV....................
......................VVVVVVVV....................
......................VVVVVVVV....................
......................DDDDDDDD....................
```
Right side (looking from the right):
```
.................MMM.MMM.MM.MMM.MMM...............
.................vvvRRRRRRRRRRRRRvv...............
.................vvvvvvvvvvvvvvvvvv...............
.................vvvvvvvvvvvvvvvvvv...............
.................vvvMMUvMMMvvMMvvMM...............
.................vvvMMMvMMMvvMMvvMM...............
.................vvvMMMvMMMvvMMvvMM...............
.................vvvwwwwwwwwwwwwwww...............
.................vvvwwwwwwwwwwwwwww...............
.................vvvwUwwwwwwwwwwwww...............
.................vvvwUwwwwwwwwwwwww...............
.................vvvwwwwwwwwwwwwwww...............
.................vvvwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwLLLwwwwww...............
.................wwwwwwwLLLLLwwwLLL...............
.................wwwwwwwLLLLLwwwLLL...............
...MMMMMMM.......wwwwwwwLLLLLwwwLLL.M..MMMMMMMM...
..MMMMMMMM.......wwwwwwwLLLwwwwwLLLMM.MMMMMMMMMM..
..MMMMMMMM.......vvvwwwwwwwwwwwwwwwMM.MMMMMMMMMM..
..tttttttt.......vvvwwwwwwwwwwwwwwwttttttttttttt..
..tttttttt.......vvvwwwwwwwwwwwwwwwttttttttttttt..
..ttttUttt.......vvvwwwwwwwwwwwwwwwttttttUttttUt..
..ttttUttt.......vvvwwwJJJJwJJJJwwwttttttUttttUt..
..tttttttt.......vvvwwwJJwJwJJwJwwwttttttttttttt..
..tttttttt.......vvvwwwJJwJwJJwJwwwttttttttttttt..
..tttttttt.......vvvwwwJJwJwJJwJwwwttttttttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
......................VVV.........................
......................VVV.........................
......................VVV.........................
......................VVV.........................
......................VVV.........................
......................VVV.........................
......................VVV.........................
......................VVV.........................
......................VVV.........................
......................DDD.........................
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
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.......................VVVVVVV....................
......................VVVVVVVV....................
......................VVVVVVVV....................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
.....ttttttt..........................ttttttt.....
.....tttttttt........................tttttttt.....
.....tttttttt........................tttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttt..............................ttttt.....
.....ttttt..............................ttttt.....
.......WWW..............................WWW.......
.......WWW..............................WWW.......
.......WWW..............................WWW.......
.......WWW..............................WWW.......
.......WWW..............................WWW.......
.......WWW..............................WWW.......
.......WWW..............................WWW.......
.......WWW...vvvvvvv....................WWW.......
.......WWW..vvvvvvvv....................WWW.......
.......WWW..vvvvvvvv....................WWW.......
.......WWW..vvv.....wwwwwwwwwwwww.......WWW.......
.......WWW..vvv.....wwwwwwwwwwwww.......WWW.......
.......WWW..vvv.....wwwwwwwwwwwww.......WWW.......
.......WWW..vvv...............wwwJJJJ...WWW.......
.......WWW..vvv...............wwwJ..J...WWW.......
.......WWW..vvv...............wwwJ..J...WWW.......
.......WWW..vvv...............wwwJJJJ...WWW.......
.......WWW..vvv...............www.......WWW.......
.......WWW..vvv...............wwwJJJJ...WWW.......
.......WWW..vvv...............wwwJ..J...WWW.......
.......WWW..vvv.....www.......wwwJ..J...WWW.......
.......WWW..vvv.....www.......wwwJJJJ...WWW.......
.......WWW..vvvvvvvvwwwwwwwwwwwww.......WWW.......
.......WWW..vvvvvvvvwwwwwwwwwwwww.......WWW.......
.......WWW..vvvvvvvvwwwwwwwwwwwww.......WWW.......
.......WWW............tttttttt..........WWW.......
.......WWW............tttttttt..........WWW.......
.......WWW............tttttttt..........WWW.......
.......WWW............tttttttt..........WWW.......
.......WWW............tttttttt..........WWW.......
.....ttttt............tttttttt..........ttttt.....
.....ttttt............tttttttt..........ttttt.....
.....ttttt............tttttttt..........ttttt.....
.....ttttt............tttttttt..........ttttt.....
.....ttttt............tttttttt..........ttttt.....
.....tttttttt.......tttttttt.........tttttttt.....
.....tttttttt.......tttttttt.........tttttttt.....
.....ttttttt........ttttttt...........ttttttt.....
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
.............vvvvvvv..............................
............vvvvvvvv..............................
............vvvvvvvv..............................
............vvv.....wwwwwwwwwwwww.................
............vvv.....wwwwwwwwwwwww.................
............vvv.....wwwwwwwwwwwww.................
............vvv...............www.................
............vvv...............www.................
............vvv...............www.................
............vvv...............www.................
............vvv...............www.................
............vvv...............www.................
............vvv...............www.................
............vvv.....www.......www.................
............vvv.....www.......www.................
............vvvvvvvvwwwwwwwwwwwww.................
............vvvvvvvvwwwwwwwwwwwww.................
............vvvvvvvvwwwwwwwwwwwww.................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
EEEEEMMttMtMMEEEEEEEEEEEEEEEEEEEEEEEEEMtMttMMEEEEE   77777nnnlnnnn777777777777777777777777nnnnlnnn77777
EEEEEtttttttMEEEEEEEEEEEEEEEEEEEEEEEEEtttttttEEEEE   77777nlllllln777777777777777777777777llllllln77777
EEEEEMttttttMEEEEEEEEEEEEEEEEEEEEEEEEEtttttttEEEEE   77777nllllllnggggggggggggggggggggggggnlllllln77777
EEEEEttttttttWWWWWWWWWWWWWWWWWWWWWWWWWtttttttEEEEE   77777nlllllllggggggggggggggggggggggggnlllllln77777
EEEEEtttttttMWWWWWWWWWWWWWWWWWWWWWWWWWtttttttEEEEE   77777llllllnnggggggggggggggggggggggggnnllllll77777
EEEEEMttttccccccccllcccllccclllllllccccctttttEEEEE   77777nllll777777777777777777777777777777lllln77777
EEEEEMttttccccccccllcccllccclllllllcccccMttttEEEEE   77777nllln777777777777777777777777777777nllln77777
EEEEEMttMMccccccccllcccllccllllllllcccccMMMtMEEEEE   77777nlnnn777777777777777777777777777777nnnln77777
EEEEEEEEWWcccccccccccccllllllllllllcccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccccccccccccllllllllllllcccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWccccccccccccccclllllccccccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWccccccccccccccclllllccccccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWccccccccccccccclllllccccccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWccccccccccccccclllllccccccccllWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWccccccccccccccclllllccccccccllWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccMvMvvMMwwMMwwMMwwMMMcccccllWWWEEEEEEE   7777777ggg77zzzzyzzzwuwwwuwwwuwww7777777ggg7777777
EEEEEEEEWWcccvvvvvvvwwwwwwwwwwwwMcccccllWWWEEEEEEE   7777777ggg77zyyyyyyzuuuuuuuuuuuuw7777777ggg7777777
EEEEEEEEWWcccvvvvvvvwwwwwwwwwwwwccccccllWWWEEEEEEE   7777777ggg77zyyyyyyyuuuuuuuuuuuuw7777777ggg7777777
EEEEEEEEWWcccvvRRRRRwwwRRRRRRRwwwcccccccWWWEEEEEEE   7777777ggg77yyyyyyyyuuuuuuuuuuuuu7777777ggg7777777
EEEEEEEEWWcccvvRRRRRwwwRRRRRRRwwMcccccccWWWEEEEEEE   7777777ggg77zyyyyyyyuuuuuuuuuuuuw7777777ggg7777777
EEEEEEEEWWlllvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWlllvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuyuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWlllvvRRRRRRRRRRRRRRRwwwJJJJJccWWWEEEEEEE   7777777ggg77yyyyyyyyyyyuuuuuuuuuujjjjj77ggg7777777
EEEEEEEEWWlllvvRRRRRRRRRRRRRRRwwJJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWlllvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE   7777777ggg77yyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwwJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuujjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwJJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyywwuwwwwuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRwwwwwwwwwwwwMJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyuuwuuuuuuwuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRwwwwwwwwwMwwMJJJJJccWWWEEEEEEE   7777777ggg77yyyyyyyyuuwwwwuwwwuwwjjjjj77ggg7777777
EEEEEEEEWWcccvvvvvvvnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg77zyyyyyyy77777777777777777777ggg7777777
EEEEEEEEWWcccvvvvvvvnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg77zyyyyyyz77777777777777777777ggg7777777
EEEEEEEEWWcccMMvcMcMnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg77zzzyzzzz77777777777777777777ggg7777777
EEEEEEEEWWccccccccccnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWccccccccccnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEMMttMccccccccccnnnnnnnnnnnnncclllccMttMMEEEEE   77777nnnln777777777777777777777777777777nlnnn77777
EEEEEtttttccccccccccnnnnnnnnnnnnncclllccMttttEEEEE   77777nllln777777777777777777777777777777nllln77777
EEEEEMttttccccccccccnnnnnnnnnnnnnccllccctttttEEEEE   77777nllln777777777777777777777777777777nllln77777
EEEEEtttttccccccccccnnnnnnnnnnnnnccccccctttttEEEEE   77777nllll777777777777777777777777777777lllll77777
EEEEEtttttccccccccccnnnnnnnnnnnnncccccccMttttEEEEE   77777lllln777777777777777777777777777777nllln77777
EEEEEMtttttMMEEEEEEErrrrrrrrrrrrrEEEEEMttttttEEEEE   77777nlllllnn777777777777777777777777nnllllln77777
EEEEEMttttttMEEEEEEErrrrrrrrrrrrrEEEEEtttttttEEEEE   77777nlllllln777777777777777777777777nlllllln77777
EEEEEMEMEtMMEEEEEEEErrrrrrrrrrrrrEEEEEMMtEMEMEEEEE   77777nnnnlnnn777777777777777777777777nnnlnnnn77777
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
EEEEEMtMttMMMEEEEEEEEEEEEEEEEEEEEEEEEEMtMttMMEEEEE   77777nnnnlnnn777777777777777777777777nnnnlnnn77777
EEEEEMtttttttEEEEEEEEEEEEEEEEEEEEEEEEEtttttttEEEEE   77777nlllllll777777777777777777777777nlllllln77777
EEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEtttttttEEEEE   77777nllllllnggggggggggggggggggggggggnlllllln77777
EEEEEtttttttMWWWWWWWWWWWWWWWWWWWWWWWWWtttttttEEEEE   77777lllllllnggggggggggggggggggggggggllllllll77777
EEEEEMttttttMWWWWWWWWWWWWWWWWWWWWWWWWWtttttttEEEEE   77777nlllllnnggggggggggggggggggggggggnnllllln77777
EEEEEtttttccccccccccccccccccccllllllllcctttttEEEEE   77777nllll777777777777777777777777777777lllln77777
EEEEEMttttccccccccccccccccccccllllllllccMttttEEEEE   77777nllln777777777777777777777777777777nllln77777
EEEEEMMMtMcccccccccccccccccccclllllllcccMMMtMEEEEE   77777nnnln777777777777777777777777777777nnnln77777
EEEEEEEEWWcccccccclllllcccccllcccllcccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccccccclllllcccccllcccllcccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccccccclllllcccccllcccllcccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccccccclllllcccccllcccllcccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccccccclllllcccclllcccllcccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccccccccclllcclllccccccccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccccccccclllcclllccccccccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWcccMMvvMvMwwMMwwMMwwMMMcccccccWWWEEEEEEE   7777777ggg77zzzyzzzzwuwwwuwwwuwww7777777ggg7777777
EEEEEEEEWWcccvvvvvvvwwwwwwwwwwwwMcccccccWWWEEEEEEE   7777777ggg77zyyyyyyzuuuuuuuuuuuuw7777777ggg7777777
EEEEEEEEWWcccvvvvvvvwwwwwwwwwwwwMcccccccWWWEEEEEEE   7777777ggg77zyyyyyyyuuuuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRwwwRRRRRRRwwwJJJJJllWWWEEEEEEE   7777777ggg77yyyyyyyyuuuuuuuuuuuuujjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRwwwRRRRRRRwwMJJJJJllWWWEEEEEEE   7777777ggg77zyyyyyyyuuuuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwwJJJJJccWWWEEEEEEE   7777777ggg77yyyyyyyyyyyuuuuuuuuuujjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwJJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwMJJJJJccWWWEEEEEEE   7777777ggg77yyyyyyyyyyzuuuuuuuuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwwJJJJJccWWWEEEEEEE   7777777ggg77zyyyyyyyyyyuuuuuuuuuujjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRRRRRRRRRRRwwwJJJJcccWWWEEEEEEE   7777777ggg77zyyyyyyyyyywwwuwwwuuwjjjjj77ggg7777777
EEEEEEEEWWcccvvRRRRRwwwwwwwwwwwwMcccccccWWWEEEEEEE   7777777ggg77zyyyyyyyuuwuuuuuuwuuw7777777ggg7777777
EEEEEEEEWWcccvvRRRRRwwwwwwwwwMwwMcccccccWWWEEEEEEE   7777777ggg77yyyyyyyyuuwwwuwwwwuww7777777ggg7777777
EEEEEEEEWWcccvvvvvvvnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg77zyyyyyyy77777777777777777777ggg7777777
EEEEEEEEWWcccvvvvvvvnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg77zyyyyyyz77777777777777777777ggg7777777
EEEEEEEEWWcccMcMvcMMnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg77zzzzyzzz77777777777777777777ggg7777777
EEEEEEEEWWlllcccccccnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEEEEWWlllcccccccnnnnnnnnnnnnncccccccWWWEEEEEEE   7777777ggg777777777777777777777777777777ggg7777777
EEEEEMMttMccccccccccnnnnnnnnnnnnncccccccMMttMEEEEE   77777nnnln777777777777777777777777777777nnnln77777
EEEEEMttttccccccccccnnnnnnnnnnnnncccccccMttttEEEEE   77777nllln777777777777777777777777777777nllln77777
EEEEEtttttccccccccccnnnnnnnnnnnnnccccccctttttEEEEE   77777nllln777777777777777777777777777777nllln77777
EEEEEtttttlllcccccccnnnnnnnnnnnnnccccccctttttEEEEE   77777lllll777777777777777777777777777777lllll77777
EEEEEMttttlllcccccccnnnnnnnnnnnnncccccccMttttEEEEE   77777nllln777777777777777777777777777777nllln77777
EEEEEttttttMMEEEEEEErrrrrrrrrrrrrEEEEEMttttttEEEEE   77777nlllllnn777777777777777777777777nnllllln77777
EEEEEMttttttMEEEEEEErrrrrrrrrrrrrEEEEEtttttttEEEEE   77777nlllllln777777777777777777777777nlllllln77777
EEEEEMEMEtMMEEEEEEEErrrrrrrrrrrrrEEEEEMMtEMEMEEEEE   77777nnnnlnnn777777777777777777777777nnnlnnnn77777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
How much the plans of the seeds differ: 0.32 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 196 nodi, 601 passi, finito in 278 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=terra di confine, m=magenta, h=sala di guardia, b=sala sopra la cantina, w=muro del mastio, a=interno del torrione, v=muro del torrione, c=cortile lastricato, l=pietra del cortile, W=cinta muraria, t=torre d'angolo, d=soglia del mastio, p=tettoia delle armi, q=pilastro di legno, u=blue, f=pavimento di tavole, F=solaio di legno, R=terrazza del mastio, J=tetto della tettoia, K=camino di pietra, L=finestra, X=X, M=merlo, D=lastricato della cantina, V=muro della cantina, U=feritoia, #90=? (marcatore), #91=? (marcatore).
Alla fine: t 42375, w 24365, W 21250, v 17497, E 3825, L 2688, J 2576, U 2500, c 2375, M 1653, V 1216, F 950, f 828, R 625, l 350, D 75, K 11.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-46 all×23, prl×4, one×2, convchain×1: 440 celle x2-17 y1-18 z20, passi 2-47
   #48 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 48
#50-58 all×4: 12225 celle x40-64 y40-69 z19-41, passi 49-70
    #59 all . w → w * passi=20: ×20, 7500 celle x40-64 y40-69 z41-61, passi 71-90, .→w 7500
    #60 all . w → w X passi=12: ×12, 9000 celle x40-64 y40-69 z60-73, passi 91-102, w→X 4500, .→w 4500
#61-62 all×2: 5100 celle x40-64 y40-69 z20-85, passi 103-115
    #64 all . h → h . passi=31: ×31, 13950 celle x45-59 y50-64 z21-52, passi 116-146, h→. 6975, .→h 6975
#65-67 all×2: 5250 celle x45-59 y45-64 z21-53, passi 147-178
    #68 all . h → h . (+2) passi=31: ×31, 18600 celle x45-59 y45-64 z53-84, passi 179-209, h→. 6975, .→h 6975, b→. 2325, .→b 2325
      r1 . h → h . ×6975; r2 . b → b . ×2325; r3 . s → s . ×0
#69-70 prl×1, all×1: 11850 celle x25-59 y35-69 z21-84, passi 210-252
    #71 all . v → v X passi=12: ×12, 6600 celle x25-39 y35-69 z62-74, passi 253-264, v→X 3300, .→v 3300
#72-73 all×2: 6700 celle x25-44 y35-69 z20-96, passi 265-287
    #74 all . a → a . passi=31: ×31, 20150 celle x30-44 y40-64 z21-52, passi 288-318, a→. 10075, .→a 10075
    #75 all . a → a F passi=1: ×1, 650 celle x30-44 y40-64 z52-53, passi 319, a→F 325, .→a 325
    #76 all . a → a . passi=31: ×31, 20150 celle x30-44 y40-64 z53-84, passi 320-350, a→. 10075, .→a 10075
#77-80 all×3, prl×1: 8381 celle x30-74 y40-64 z20-96, passi 351-364
#81-84 all×2, prl×2: 13144 celle x65-74 y45-64 z20-53, passi 365-431
    #85 all . W → W * passi=24: ×24, 20400 celle x15-84 y10-79 z21-44, passi 432-455, .→W 20400
    #86 all . t → t * passi=38: ×38, 42750 celle x10-89 y5-94 z21-58, passi 456-493, .→t 42750
#109-193 all×9, prl×6, one×1: 12921 celle x10-89 y5-94 z0-99, passi 494-589
#194-196 prl×1, one×1, all×1: 9623 celle x25-64 y35-69 z28-95, passi 590-601
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/m → m/* passi=1
#13 all h[mb] → *h: le celle cercate c'erano, ma mai disposte come nel pattern
#19 all dh → *h: le celle cercate c'erano, ma mai disposte come nel pattern
#23 one wwwwwwwwwww/wbbbbbbbbbw/wbbbbbbbbbw → ***********/****ssss***/****ssss*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#34 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#37 all cE/WW → *W/**: le celle cercate c'erano, ma mai disposte come nel pattern
#40 all [dn]/c → */n: le celle cercate c'erano, ma mai disposte come nel pattern
#41 all [nG]/W → */G: in quel momento nella griglia non c'erano celle "nG"
#42 all [ndGr]/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#43 all nc → *n passi=1: in quel momento nella griglia non c'erano celle "n"
#44 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G"
#45 all r[Ec] → *r passi=1: in quel momento nella griglia non c'erano celle "r"
… e altri 93
Fix it and answer with the whole program.

## Risposta

```xml
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
```
