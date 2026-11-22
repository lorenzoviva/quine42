# model.sculpt · correzione · gemini-4-argon · 45 s · 25585 token d'ingresso (0 in cache), 5127 d'uscita, 0 di ragionamento · $0.10

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
  Rocca di confine (border fortress with cellar):
  - Main keep (mastio): rear interior 'h' (over the cellar 'D', 45x20 voxels), front hall 'f' (10 voxels deep before cellar), stair zone 's' (20x10 voxels along rear wall), keep walls 'w', main door 'd'.
  - Attached watchtower (torre di guardia) 't' with wall 'u', placed on one of the rear corners of the keep.
  - Side bastion wing (bastione laterale) 'a' with wall 'v', attached to a side of the keep.
  - Timber lean-to armory 'p' (4x4 cells = 20x20 voxels, >= 30 clear under roof).
  - Seeds change: keep depth (3 or 4 rear cells), which side the bastion wing grows on, which corner the watchtower stands on, and whether a secondary corner buttress 'b' grows.
  - Size difference:
    * At Large (20x20 plan): Keep + watchtower + side bastion + lean-to armory 'p' against the keep + road 'r' to the front edge.
    * At Huge (30x30 plan): Outer bailey courtyard 'c' expands around the keep (where 7+ cells of ground remain), enclosed by a fortified curtain wall 'W' with corner watch-turrets 'q' and a front gatehouse 'G'.
-->
<sequence values="BHEhfsdwutavbcWqpGr" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhfsdwutavbcWqpGrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Center spine marker 'm' for a 3-cell wide front door and road -->
      <all in="H/E" out="*/m" symmetry="()" steps="2"/>

      <!-- Main keep core: 9 cells wide (45 voxels >= 44 for cellar), 3-4 cells behind H, 2 cells in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*h" symmetry="(x)" steps="4"/>
      <all in="mE" out="*f" symmetry="(x)" steps="4"/>

      <!-- Keep walls 'w' -->
      <all in="[hfm]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Front doorway 'd' of the keep (3 cells = 15 voxels wide) -->
      <all in="m/w" out="f/d" symmetry="()" steps="1"/>
      <prl in="m" out="f"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- Stair zone 's' along the rear wall of the keep (4 cells along x, 2 cells along y) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Corner watchtower 't' (interior) and 'u' (wall) on one rear corner of the keep -->
      <one in="EEE/Eww/Ewh" out="uuu/utw/utw" symmetry="(x)" steps="1"/>
      <all in="E[tu]" out="u*" symmetry="(xy)" steps="1"/>

      <!-- Side bastion wing 'a' (interior) and 'v' (wall) on one flank of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="a*/a*/a*/a*" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Optional opposite flank buttress tower 'b' -->
      <one in="Ew/Ew/Ew" out="**/*b/**" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(xy)" steps="1"/>

      <!-- Huge size expansion: outer bailey courtyard 'c' only where 7+ cells of ground remain around the keep -->
      <all in="wEEEEEEE" out="*ccccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="[uvb]E/*c" out="*c/**"/>
      <all in="cE/*[wuvb]" out="*c/**"/>

      <!-- Outer curtain wall 'W' around the bailey courtyard (only forms at Huge when 'c' exists) -->
      <all in="cEE" out="*WE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner turrets 'q' on the outer curtain wall -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="1">
        <rule in="q[EW]" out="*q"/>
        <rule in="q*/*[EW]" out="**/*q"/>
      </all>

      <!-- Timber lean-to armory 'p' (4x4 cells = 20x20 voxels): against curtain wall at Huge, or against keep wall at Large -->
      <one in="Wcccc/Wcccc/Wcccc/Wcccc" out="Wpppp/Wpppp/Wpppp/Wpppp" symmetry="(xy)" steps="1"/>
      <one in="wEEEE/wEEEE/wEEEE/wEEEE" out="wpppp/wpppp/wpppp/wpppp" symmetry="(xy)" steps="1"/>

      <!-- Gatehouse 'G' in the curtain wall and road 'r' from front door 'd' straight to the front edge -->
      <all in="d/[cE]" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[cE]" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="G/[cE]" out="*/r" symmetry="()"/>
      <all in="r/[cE]" out="*/r" symmetry="()"/>
    </sequence>

    <map scale="5 5 1" values="BEhfsdwutavbcWqpGrfFPXLDVTkOoNMUzy#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="p" out="ppppp/pzzzp/pzzzp/pzzzp/ppppp"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="(xy)">
        <!-- Unions for the included parts -->
        <union symbol="+" values="wuvbWqGX"/>
        <union symbol="%" values="wuvbWqG"/>
        <union symbol="=" values="fF"/>

        <!-- Mark 'D' on the first layer under the soil (z=19) under 'h' and 's' (45x20 voxels >= 44x14, 10 voxels back from front wall) -->
        <all in="h B" out="* D" steps="1"/>
        <all in="s B" out="* D" steps="1"/>

        <!-- B. Heights: grow columns from the soil layer (z=20) upward -->

        <!-- Main keep walls 'w' and doorway wall 'd': 2 storeys (64 steps) with window bands 'X' -->
        <all steps="8">
          <rule in="B w" out="w *"/>
          <rule in="B d" out="d *"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d *"/>
        </all>
        <all steps="20">
          <rule in="B w" out="w *"/>
          <rule in="B d" out="d *"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d *"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w *"/>
          <rule in="B d" out="d *"/>
        </all>

        <!-- Doorway 'd' at z=20 becomes floor 'f' with door seed 'O' along the outer edge, and wall 'w' above -->
        <all in="d/[rc]" out="O/*" symmetry="()" steps="1"/>
        <all in="d/O" out="O/*" symmetry="()" steps="4"/>
        <prl in="B d" out="w f"/>
        <prl in="d" out="w"/>

        <!-- Keep interior 'h', front hall 'f', and stair zone 's': 2 covered storeys (z=20 floor, z=52 slab, z=84 roof slab) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B f" out="y f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip 'T' at z=21 above 's' -->
        <all in="B s" out="s T" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B y" out="y B"/>
        </all>
        <all in="B s" out="s B" steps="30"/>
        <!-- First floor slab 'F' at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B y" out="y F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second storey air (31 steps) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B y" out="y B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Roof terrace slab 'F' at z=84 -->
        <prl>
          <rule in="h" out="F"/>
          <rule in="y" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Corner watchtower walls 'u' (76 steps) and interior 't' -->
        <all in="B u" out="u *" steps="10"/>
        <all in="B u" out="u X" steps="10"/>
        <all in="B u" out="u *" steps="22"/>
        <all in="B u" out="u X" steps="10"/>
        <all in="B u" out="u *" steps="24"/>

        <all in="B t" out="t f" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t F" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t F" steps="1"/>
        <all in="B t" out="t B" steps="11"/>
        <prl in="t" out="F"/>

        <!-- Side bastion wing walls 'v' (46 steps) and interior 'a' -->
        <all in="B v" out="v *" steps="8"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v *" steps="26"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="13"/>
        <prl in="a" out="F"/>

        <!-- Flank buttress 'b' (54 steps) -->
        <all in="B b" out="b *" steps="54"/>

        <!-- Outer curtain wall 'W' (24 steps) and corner turrets 'q' (38 steps) -->
        <all in="B W" out="W *" steps="24"/>
        <all in="B q" out="q *" steps="12"/>
        <all in="B q" out="q X" steps="8"/>
        <all in="B q" out="q *" steps="18"/>

        <!-- Gatehouse 'G': arch opening over road in the middle, side bastions 36 steps -->
        <all in="B G" out="G *" steps="36"/>

        <!-- Timber lean-to armory 'p' (floor) and 'z' (3x3 posts): 32 clear height under roof 'P' at z=53 -->
        <all in="B p" out="y p" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <prl in="y" out="P"/>
        <all in="B z" out="z P" steps="33"/>
        <prl in="z" out="P"/>
        <!-- Hollow out the inner posts of the 4x4 lean-to so only corner/edge posts remain around a 20x20 space -->
        <all in="p/P/P/P/p" out="p/p/p/p/p" symmetry="(xy)"/>
        <all in="B p" out="* B"/>

        <!-- C. Full scale: doors, cellar, stairs, battlements, slits, windows -->

        <!-- Internal doors connecting keep to bastion wing 'a' and watchtower 't' on ground and upper floors -->
        <one in="fwwwwwf" out="*OOOOO*" symmetry="(xy)" steps="2"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="4"/>
        <all in="w/O" out="O/*" symmetry="(xy)" steps="4"/>

        <one in="FwwwwwF" out="*OOOOO*" symmetry="(xy)" steps="2"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="4"/>
        <all in="w/O" out="O/*" symmetry="(xy)" steps="4"/>

        <!-- Outer gatehouse 'G' door seed 'O' when present at Huge -->
        <one in="rGGGGGr" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/G" out="*/O" symmetry="(xy)" steps="6"/>
        <all in="G/O" out="O/*" symmetry="(xy)" steps="6"/>

        <!-- Windows 'L' in the window bands 'X' on all sides -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <!-- 1. Cellar under the keep (after floors rise, before part-stair) -->
        <import file="part-cellar"/>

        <!-- 2. Stairs inside the keep -->
        <import file="part-stair"/>

        <!-- 3. Doors -->
        <import file="part-door"/>

        <!-- 4. Battlements on flat wall tops -->
        <import file="part-battlements"/>

        <!-- 5. Arrow slits under merlons -->
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval stone, timber accents, earthy courtyard and grass -->
  <color symbol="E" value="#7a8f52" name="erba"/>
  <color symbol="h" value="#c8b08a" name="sala sopra la cantina" area="keep"/>
  <color symbol="f" value="#bfa57e" name="pavimento in pietra" area="keep"/>
  <color symbol="F" value="#a8926f" name="solaio del mastio" area="keep"/>
  <color symbol="s" value="#9e7a52" name="vano scala" area="keep"/>
  <color symbol="d" value="#6b4428" name="soglia del mastio" area="keep"/>
  <color symbol="w" value="#8c8881" name="muro del mastio" area="keep"/>
  <color symbol="u" value="#75716b" name="muro della torre" area="tower"/>
  <color symbol="t" value="#b59d78" name="camera della torre" area="tower"/>
  <color symbol="a" value="#b09975" name="camera del bastione" area="keep"/>
  <color symbol="v" value="#7e7a74" name="muro del bastione" area="keep"/>
  <color symbol="b" value="#696560" name="contrafforte" area="keep"/>
  <color symbol="c" value="#b8a88a" name="cortile della rocca" area="courtyard"/>
  <color symbol="W" value="#706c66" name="cinta muraria" area="courtyard"/>
  <color symbol="q" value="#5e5a55" name="torretta d'angolo" area="tower"/>
  <color symbol="p" value="#9e8565" name="lastricato della tettoia" area="courtyard"/>
  <color symbol="P" value="#8c5332" name="tettoia in legno" area="courtyard"/>
  <color symbol="G" value="#857f78" name="corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#9e927d" name="strada lastricata" area="road"/>
  <color symbol="L" value="#3b4d5e" name="finestra"/>
  <color symbol="X" value="#8c8881" name="fascia muraria"/>
  <color symbol="D" value="#73634d" name="pavimento della cantina" area="cellar"/>
  <color symbol="V" value="#59544f" name="muro della cantina" area="cellar"/>
  <color symbol="T" value="#8c6239" name="scala"/>
  <color symbol="k" value="#8c6239" name="gradini in legno"/>
  <color symbol="O" value="#6b4428" name="porta in legno"/>
  <color symbol="o" value="#4a2e19" name="assi della porta"/>
  <color symbol="N" value="#59544f" name="stipite in pietra"/>
  <color symbol="M" value="#8c8881" name="merlatura"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>
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
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2); porta: 11 × 1 voxel (0,69 × 0,06 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 19 voxel (1,19 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole; cantina: dalla porta non si scende in cantina — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, f pavimento in pietra, w muro del mastio, u muro della torre, v muro del bastione, b contrafforte, c cortile della rocca, W cinta muraria, q torretta d'angolo, p lastricato della tettoia, F solaio del mastio, P tettoia in legno, L finestra, D pavimento della cantina, V muro della cantina, k gradini in legno, O porta in legno, o assi della porta, N stipite in pietra, M merlatura, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEMMuuMuMMEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEuuuuuuuEEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEuuuuuuuuEEEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEuuuuuuuuuuuuEEEEE
EEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEuuuuuuuuuuuuEEEEE
EEEEEMMvvMvvvMMwwMMwwMMwwMMwwMwwwNoooFFFuuuuuEEEEE
EEEEEMvvvvvvvwwwwwwwwwwwwwwwwwwwNoooooFFuuuuuEEEEE
EEEEEvvvvvvvvwwwwwwwwwwwwwwwwwwFFoooooFFuuuuuEEEEE
EEEEEvvvFFFFFwwFFFFFFFFFFFFFFFFFFFFoooFFuuuuuEEEEE
EEEEEMvvFFFFFwwFFFFFFFFFFFFFFFFFFFFooFFFuuuuMEEEEE
EEEEEMvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFwwuuuEEEEEEE
EEEEEvvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFwwMuMEEEEEEE
EEEEEvvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFwwMMEEEEEEEE
EEEEEMvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEMvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFwMEEEEEEEEEE
EEEEEMvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFbbbMMEEEEEEE
EEEEEvvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFbbbbMEEEEEEE
EEEEEvvvFFFFMwwFFFFFFFFFFFFFFFFFFFFFFwbbbMEEEEEEEE
EEEEEMvvvvvvNwwwwwwwwwwFFFFFFFwwwwwwwwwwEEEEEEEEEE
EEEEEMvvvvvvNwwwwwwwwwwFFFFFFFwwwwwwwwwwEEEEEEEEEE
EEEEEEEEqqqqqwwwwwwwwwwMMwwMwMwwwwwwwwwwMqqMMEEEEE
EEEEEEEEqqqqqwwwwwwwwwwwwwwwwwwwwwwwwwwwqqqqqEEEEE
EEEEEEEEqqqqMMMwcMMwcMwMMwqMqMcMwcMMwcMMqqqqqEEEEE
EEEEEEEEqqqqcccccccccccqqqqqqqccccccccccqqqqqEEEEE
EEEEEEEEqqqqqccccccccccqqqqqqqccccccccccqqqqqEEEEE
EEEEEEEEqqqqMccccccccccqqqqqqqccccccccccMqqqqEEEEE
EEEEEEEEqqqqMccccccccccqqqqqqqccccccccccMqqqqEEEEE
EEEEEEEEEqMMcccccccccccqqqqqqqccccccccccMMMqMEEEEE
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccWWWEEEEEEE
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccWWWEEEEEEE
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccWWWEEEEEEE
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccWWWEEEEEEE
EEEEEEEEEEWWcccccccccccqqqqqqqccccccccccWWWEEEEEEE
EEEEEEEEqqqqMccccccccccqqqqqqqccccccccccMqqqqEEEEE
EEEEEEEEqqqqqccccccccccqqqqqqqccccccccccqqqqqEEEEE
EEEEEEEEqqqqqqMWWWWWMqqqqqqqqqMqqMMWWWMqqqqqqEEEEE
EEEEEEEEqqqqqqqWWWWWMqqqqqqqqqqqqqqWWWqqqqqqqEEEEE
EEEEEEEEqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqqEEEEE
EEEEEEEEqqqqqqqEEEEEqqqqqqqqqqqqqqqEEEqqqqqqqEEEEE
EEEEEEEEqqqqqqqEEEEEMqqqqqqqqqqqqqqEEEqqqqqqqEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
777777777777jjjjjjjjjjj777777777777777777777777777
777777777777jjjjjjjjjjj777777777777777777777777777
777777777777jjjjjjjjjjj777777777777777777777777777
777777777777jjjjjjjjjjj777777777777777777777777777
777777777777jjjjjjjjjjj777777777777777777777777777
777777777777jjjjjjjjjjj777777777777zzzyzzzz7777777
777777777777jjjjjjjjjjj777777777777zyyyyyyz7777777
777777777777jjjjjjjjjjj777777777zzyyyyyyyyyzz77777
777777777777jjjjjjjjjjj777777777zyyyyyyyyyyyz77777
777777777777jjjjjjjjjjj777777777zzzyzzyyyyyyz77777
77777qqqnqqnwwwuwwwuwwwuwwwuwwuuuuuuuyyyyyyyy77777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
77777nnnnnnnuuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyzz77777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuuuyyy7777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuuuzyz7777777
77777nnnnnnnuuuuuuuuuuuuuuuuuuuuuuuuuuuuzzz7777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuww7777777777
77777qnnnnnnuuuuuuuuuuuuuuuuuuuuuuuuuuqqqss7777777
77777nnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuqqqqs7777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuwwqss7777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
77777qqqnqqnuuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
7777777lllllwuuuuuuuuuwwwuwwwwuuuuuuuuuunlnnn77777
7777777lllllwuuuuuuuuuwuuuuuuwuuuuuuuuuwlllln77777
7777777nllllwwwuwwwuwwwwwuwwwwwwuwwwuwwwnllln77777
7777777nlllln777777777llllllll7777777777nllll77777
7777777llllll777777777llllllll7777777777lllln77777
7777777nlllln777777777llllllll7777777777nllln77777
7777777nlllln777777777llllllll7777777777nllln77777
7777777nnlnnn777777777llllllll7777777777nnnln77777
7777777777ggg777777777llllllll7777777777ggg7777777
7777777777ggg777777777llllllll7777777777ggg7777777
7777777777ggg777777777llllllll7777777777ggg7777777
7777777777ggg777777777llllllll7777777777ggg7777777
7777777nnnlnn777777777llllllll7777777777nnnln77777
7777777nlllln777777777llllllll7777777777nllln77777
7777777nlllll777777777llllllll7777777777lllln77777
7777777llllllnngggggnnllllllllnlnnnggnnllllll77777
7777777nllllllngggggnlllllllllllllnggnlllllln77777
7777777nllllllngggggnlllllllllllllnggnlllllln77777
7777777llllllll77777lllllllllllllll77llllllll77777
7777777llllllln77777nllllllllllllln77nlllllll77777
```
Front (looking from the front; the sky at the top):
```
................................MMMMMM.MMMMMM.....
................................uuuuuuFFuuuuu.....
................................uuuuuuuuuuuuu.....
................................uuuuUuuuuUuuu.....
.............MM..MM..MMMMMMMMM.MuuMMUuMMuUuuu.....
............MMM.MMM.MMMMMMMMMMMMuuMMuuMMuuuuu.....
............MMM.MMM.MMMMMMMMMMMMuuMMuuMMuuuuu.....
............wwwwwwwwwwwfffffffwwwwwwwwwwuuuuu.....
............wwwwwwwwwwwwwwwwwwwwwwwwwwwwuuuuu.....
............wwwwwwwwwwwwwwwwwwwwwwwwwwwwuMuuu.....
............wwwwwwwwwwwwwwwwwwwwwwwwwwwwuMMuu.....
............wwwwwwwwwwwwwwwwwwwwwwwwwwwwuMMuu.....
............wwwwwwwwwwwwwwwwwwwwwwwwwwwwbbuuu.....
.....MM..M..wwwwwwwwwwwwwwwwwwwwwwwwwwwwbbbuu.....
.....MMM.MM.wwwwwwwwwwwwwwwwwwwwwwwwwwwwbbbww.....
.....MMM.MM.wwwwwwLLwwwwwwwwwwwwwwwwwwwwbbbww.....
.....vvvvvvvwwwwwwLLLwwwwwwwwwwwwwwwwwwwbbbww.....
.....vvvMMMMwwMwwwLLMwwwwwwwwwMwwMMwwwMwMMMMM.....
.....vUvMMMMMwMwwwwwMMwwwwwwwwMwwMMwwwMwMMMMM.....
.....vUvMMMMMwMwwwwwMMwwwwwwwwMwwMMwwwMwMMMMM.....
.....vvvqqqqqqqwwwwwqqqqqqqqqqqqqqqwwwqqqqqqq.....
.....vvvqqqqqqqwwwwwqqqqqqqqqqqqqqqwwwqqqqqqq.....
.....vvvqqqqqqqwwwwwqqqqqqqqqqqqqqqwwwqqqUqqq.....
.....vvvqqqqqqqwwwwwqqqqqqqqqqqqqqqwwwqqqUqqq.....
.....vvvqqqqqqqwwwwwqqqqqqqqqqqqqqqwwwqqqqqqq.....
.....vvvqqqqqqqwwwwwqqqqqqqqqqqqqqqwwwqqqqqqq.....
.....vvvqqqqqqqwwwwwqqqqqqqqqqqqqqqwwwqqqqqqq.....
.....vvvqqqqqqqWWWWWqqqqqqqqqqqqqqqWWqqqqqqqq.....
.....vvvqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
.....vvvqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
.....wwwwwwwwwwWWWWWwwwwwwwwwwwwwwwWWWwwwwwww.....
.....wwwwwwwwwwWWWWWwwwwwwwwwwwwwwwWWWwwwwwww.....
.....wwwwwwwwwwWWWWWwwwwwwwwwwwwwwwWWWwwwwwww.....
.....wwwwwwwwwwWWWWWwwwwwwwwwwwwwwwWWWwwwwwww.....
.....wwwqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
.....wwwqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
.....vvvqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
.....vvvqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
.....vvvqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
EEEEEEEqqqqqqqqEEEEEqqqqqqqqqqqqqqqEEqqqqqqqqEEEEE
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
..........MMMMM.MMMM.MM...........................
..........uuuuuuuuuuuuu...........................
..........uuuuuuuuuuuuu...........................
..........uuuuuuuuuuuuu...........................
..........uuuuuuuuuuuuuMM.MMMMMMM.................
..........uuuuuuuuuuuuuMM.MMMMMMM.................
..........uuuuuuuuuuuuuMM.MMMMMMM.................
..........uuuuuuuuuuuuuwwFFMwwwww.................
..........uuuuuuuuuuuuuwwNNwwwwww.................
..........uuuuuuuuuuuuuwwMMwwwwUw.................
..........uuuuuuuuuuuuuwwMMMwwwUw.................
..........uuuuuuuuuuuuuwwMMMwwwww.................
..........uuuuuuuuuuuuuwwbbwwwwww.................
..........uuuuuuuuuuuuuwwbbbwwwww.................
..........wwwwwwwwwwwwwwwbUbwwwww.................
..........wwwwwLLLLLwwwwwbUbwwwww.................
..........wwwwwLLLLLwwwwwbbbwwwww.................
..........wwwwwLLLLLwwwwwbbbwwMMM.MMM......MMMMM.M
..........wwwwwwwwwwwwwwwbbbwwMMMMMMMM....MMMMMM.M
..........uuuuuuuuuuuuuwwbbbwwMMMMMMMM....MMMMMM.M
..........uuuuuuuuuuuuuwwbbbwwqqqqqqqqqqqqqqqqqqqq
..........uuuuuuuuuuuuuwwbbbwwqqqqqqqqqqqqqqqqqqqq
..........uuuuuuuuuuuuuwwbbbwwqUqqqqUqqqqqqqqqUqqq
.....PPPPPuuuuuuuuuuuuuwwbbbwwqUqqqqUqqqqqqqqqUqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqqqqqqqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqqqqqqqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqqqqqqqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqWWWWqqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqWWWWWqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqWWWWWqqqqqqq
.....PP.PPwwwwwwwwwwwwwwwbbbwwwwwwwwwwWWWWWwwwwwww
.....PP.PPwwwwwwwwwwwwwwwbbbwwwwwwwwwwWWWWWwwwwwww
.....PP.PPLwwwwwwwwwwwwwwbbbwwwwwwwwwwWWWWWwwwwwww
.....PP.PPLwwwwwwwwwwwwwwbbbwwwwwwwwwwWWWWWwwwwwww
.....PP.PPwwwwwwwwwwwwwwwbbbwwqqqqqqqqWWWWWqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqWWWWWqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqWWWWWqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqWWWWWqqqqqqq
.....PP.PPuuuuuuuuuuuuuwwbbbwwqqqqqqqqWWWWWqqqqqqq
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
.................VVVVVVVVVVV......................
.................VVVVVVVVVVV......................
.................VVVVVVVVVVV......................
.................VVVVVVVVVVV......................
.................VVVVVVVVVVV......................
.................VVVVVVVVVVV......................
.................VVVVVVVVVVV......................
.................VVVVVVVVVVV......................
.................VVVVVVVVVVV......................
.................DDDDDDDDDDD......................
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
...............VVVVVVVVVVVVVVVVVVVV...............
...............VVVVVVVVVVVVVVVVVVVV...............
...............V..................V...............
...............V...................VVV............
...............V........kkkkkkkkkk..VV............
...............V........kkkkkkkkkk..VV............
...............V..........kkkkkkkk..VV............
...............V..........kkkkkkkk..VV............
...............V..........kkkkkkkk..VV............
...............VVVVVVVVVVVVkkkkkkkVVVV............
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
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.............P..P.P..P............................
.............PPPP.PPPP............................
..................................................
.............PPPP.PPPP............................
.............P..P.P..P............................
.............P..P.P..P.............uuuuuuuu.......
.............PPPP.PPPP.............uuuuuuuu.......
.................................uuuuuuuuuuuu.....
.............PPPP.PPPP..........uuuuuuuuuuuuu.....
.............P..P.P..P..........uuuuuuuuuuuuu.....
.....vvvvvvvNooooNwwwwwwwwwwwwwwwwwwww..uuuuu.....
.....vvvvvvvNoooooNwwwwwwwwwwwwwwwwwww..uuuuu.....
.....vvvvvvvoooooooNwwwwwwwwwwwwwwwwww..uuuuu.....
.....vvv....ooo..........kkk.......www..uuuuu.....
.....vvv....ooo..........kkk.......www..uuuuu.....
.....vvv....ooo..........kkk.........wwwuuu.......
.....vvv....ooo..........kkk.........wwwuuu.......
.....vvv....ooo...........kk.........wwwuu........
.....vvv....ooo......................www..........
.....vvv....ooo......................www..........
.....vvv....ooo......................bbbbbb.......
.....vvv....ooo......................bbbbbb.......
.....vvvvvvvooooooNwww........wwwwwwwwbbbb........
.....vvvvvvvNooooNwwwww.......wwwwwwwwww..........
.....vvvvvvvNoooNwwwwww.......wwwwwwwwww..........
.......qqqqqNooNwwwwwwwwwwwwwwwwwwwwwwwwqqqqq.....
.......qqqqqqNNwwwwwwwwwwwwwwwwwwwwwwwwwqqqqq.....
.......qqqqqqwwwwwwwwwwwwwwwwwwwwwwwwwwwqqqqq.....
.......qqqqqq.........qqqqqqqq..........qqqqq.....
.......qqqqqq.........qqqqqqqq..........qqqqq.....
.......qqqqqq.........qqqqqqqq..........qqqqq.....
.......qqqqqq.........qqqqqqqq..........qqqqq.....
........qqqqq.........qqqqqqqq..........qqqqq.....
..........WWW.........qqqqqqqq..........WWW.......
..........WWW.........qqqqqqqq..........WWW.......
..........WWW.........qqqqqqqq..........WWW.......
..........WWW.........qqqqqqqq..........WWW.......
........qqWWW.........qqqqqqqq..........WWqqq.....
.......qqqqqq.........qqqqqqqq..........qqqqq.....
.......qqqqqq.........qqqqqqqq..........qqqqq.....
.......qqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
.......qqqqqqqqWWWWWqqqqqqqqqqqqqqqWWWqqqqqqq.....
.......qqqqqqqqWWWWWqqqqqqqqqqqqqqqWWqqqqqqqq.....
.......qqqqqqqq.....qqqqqqqqqqqqqqq..qqqqqqqq.....
.......qqqqqqqq.....qqqqqqqqqqqqqqq..qqqqqqqq.....
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
...................................uuuuuuuu.......
...................................uuuuuuuu.......
.................................uuuuuuuuuuuu.....
................................uuuuuuuuuuuuu.....
................................uuuuuuuuuuuuu.....
............wwwwwwwwwwwwwwwwwwwwwwwwww..uuuuu.....
............wwwwwwwwwwwwwwwwwwwwwwwwww..uuuuu.....
............wwwwwwwwwwwwwwwwwwwwwwwwww..uuuuu.....
............www....................www..uuuuu.....
............www....................www..uuuuu.....
............www......................wwwuuu.......
............NNN......................wwwuuu.......
............ooo......................wwwuu........
............ooo......................www..........
............ooo......................www..........
............ooo..........................MM.......
............ooo...........................M.......
............oooooNwwww........wwwwwwwwww.M........
............ooooNwwwwww.......wwwwwwwwww..........
............oooNwwwwwww.......wwwwwwwwww..........
............NNNwwwwwwwwwwwwwwwwwwwwwwwww..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   777777777777777777777777777777jjjjjjjjjj7777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   777777777777777777777777777777jjjjjjjjjj7777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   777777777777777777777777777777jjjjjjjjjj7777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   777777777777777777777777777777jjjjjjjjjj7777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   777777777777777777777777777777jjjjjjjjjj7777777777
EEEEEEEEEEMMuuMuMMEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   7777777777zzzyzzzz777777777777jjjjjjjjjj7777777777
EEEEEEEEEEuuuuuuuEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   7777777777zyyyyyyz777777777777jjjjjjjjjj7777777777
EEEEEEEEEEuuuuuuuuEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   7777777zzyyyyyyyyyzz7777777777jjjjjjjjjj7777777777
EEEEEEEEuuuuuuuuuuuuEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   7777777zyyyyyyyyyyyz7777777777jjjjjjjjjj7777777777
EEEEEEEEuuuuuuuuuuuMEEEEEEEEEEPPPPPPPPPPEEEEEEEEEE   7777777zyyyyyyyzyzzz7777777777jjjjjjjjjj7777777777
EEEEEEEEuuuuuFFwwwwwwwwMwwMMwwMMwwMMwwMMEEEEEEEEEE   7777777zyyyyyyyuuuuuuuwwuwwwuwwwuwwwuwww7777777777
EEEEEEEEuuuuuFFwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEEEEE   7777777yyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
EEEEEEEEuuuuuFFwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEEEEE   7777777zyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuwnnqqnqqq77
EEEEEEEEuuuuuFFwwwFFFFFFFFFFFFFFFFFFFFwwNvvvvvvMEE   7777777zyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEuuuuuFFwwwFFFFFFFFFFFFFFFFFFFFwwNvvvvvvMEE   7777777zzyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEuuuwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvvEE   7777777777yyyuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnn77
EEEEEEEEEEMuMwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvEEE   7777777777zyzuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEMMwwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   7777777777zzzuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvEEE   777777777777wwuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEMbbbbFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvvEE   7777777777ssqqquuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnn77
EEEEEEEEEEMbbbbFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   7777777777sqqqquuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEMEbbbFFFFFFFFFFFFFFFFFFFFFFwwwFFFFFvvMEE   7777777777sswwuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwwwwwwwwwFFFFFFFwwwwwwwwwwFFFFFvvEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwwwwwwwwwFFFFFFFwwwwwwwwwwFFFFFvvvEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnn77
EEEEEEEEMMqqwwwwwwwwwwwMMwwMwMwwwwwwwwwwvvvvvvvMEE   7777777nnnlnuuuuuuuuuuwwwuwwwwuuuuuuuuuwnnnnnnnq77
EEEEEEEEqqqqqwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvvvvMEE   7777777nllllwuuuuuuuuuwuuuuuuwuuuuuuuuuwnnnnnnnq77
EEEEEEEEqqqqMMMwcMMwcMwMrMwqMMcMwcMMwcMMvvMcvMMMEE   7777777nllllwwwuwwwuwwwwwwuwwwwwuwwwuwwwnnqqnqqqnl
EEEEEEEEqqqqcccccccccccrrqqqqqccccccccccccccccccqq   7777777nlllln777777777777lllll77777777777777777nll
EEEEEEEEqqqqqccccccccccrrqqqqqccccccccccccccccccqq   7777777llllll777777777777lllll77777777777777777lll
EEEEEEEEqqqqMccccccccccMqqqqqqccccccccccMWWMMqqqqq   7777777nlllln777777777nnllllll7777777777iinnnlnnll
EEEEEEEEqqqqMccccccccccqqqqqqqccccccccccMWWqqqqqqq   7777777nlllln777777777nlllllll7777777777igllllllll
EEEEEEEEEqMMcccccccccccqqqqqqqccccccccccWWWqqqqqqq   7777777nnlnnn777777777nlllllll7777777777ignlllllll
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccWWWqqqqqqq   7777777777ggg777777777llllllll7777777777ggnlllllll
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccMWWqqqqqqq   7777777777ggg777777777nlllllll7777777777ignnnlnnll
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccWWWEEEEEEE   7777777777ggg777777777nlllllll7777777777igg7777777
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccWWWEEEEEEE   7777777777ggg777777777nlllllll7777777777ggg7777777
EEEEEEEEEEWWcccccccccccqqqqqqqccccccccccWWWEEEEEEE   7777777nnlnnn777777777llllllll7777777777nlnnn77777
EEEEEEEEqqqqMccccccccccqqqqqqqccccccccccMqqqqEEEEE   7777777nlllln777777777nlllllll7777777777nllln77777
EEEEEEEEqqqqqccccccccccqqqqqqqccccccccccqqqqqEEEEE   7777777nlllll777777777nlllllll7777777777lllln77777
EEEEEEEEqqqqqqMWWWMMqqqqqqqqqqqMMWWWWWMqqqqqqEEEEE   7777777llllllnnggnnnlnnllllllllnnggggnnllllll77777
EEEEEEEEqqqqqqqWWWqqqqqqqqqqqqqqMWWWWWqqqqqqqEEEEE   7777777nllllllnggnllllllllllllllnggggnlllllln77777
EEEEEEEEqqqqqqqWWWqqqqqqqqqqqqqqMWWWWWqqqqqqqEEEEE   7777777nllllllnggnllllllllllllllnggggnlllllln77777
EEEEEEEEqqqqqqqEEEqqqqqqqqqqqqqqqEEEEEqqqqqqqEEEEE   7777777llllllll77llllllllllllllll7777llllllll77777
EEEEEEEEqqqqqqqEEEqqqqqqqqqqqqqqMEEEEEqqqqqqqEEEEE   7777777llllllln77nlllllllllllllln7777nlllllll77777
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEE   7777777777777777777777jjjjjjjjjjj77777777777777777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEE   7777777777777777777777jjjjjjjjjjj77777777777777777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEE   7777777777777777777777jjjjjjjjjjj77777777777777777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEE   7777777777777777777777jjjjjjjjjjj77777777777777777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEEEEEEEEEEEEEEEE   7777777777777777777777jjjjjjjjjjj77777777777777777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEMMuuMuMMEEEEEEE   7777777777777777777777jjjjjjjjjjj77zzzyzzzz7777777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEuuuuuuuEEEEEEEE   7777777777777777777777jjjjjjjjjjj77zyyyyyyz7777777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPEEuuuuuuuuEEEEEEE   7777777777777777777777jjjjjjjjjjzzyyyyyyyyyzz77777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPuuuuuuuuuuuuEEEEE   7777777777777777777777jjjjjjjjjjzyyyyyyyyyyyz77777
EEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPuuuuuuuuuuuuEEEEE   7777777777777777777777jjjjjjjjjjzzzyzzyyyyyyz77777
EEEEEEEEEEEEEMMwwMMwwMMwwMMwwMwwwwwNNFFFuuuuuEEEEE   777777777777wwwuwwwuwwwuwwwuwwuuuuuuuyyyyyyyy77777
EEEEEEEEEEEEEwwwwwwwwwwwwwwwwwwwwwOoooFFuuuuuEEEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
EEEEEEEEEEEEEwwwwwwwwwwwwwwwwwwwwFooooFFuuuuuEEEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFoooFFuuuuuEEEEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFooFFFuuuuMEEEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyzz77777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwuuuvvvMMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuyyynnnqq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwMuMvvvvMEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuzyznnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwMMFvvvvEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuzzznnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvvEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnn77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEbMwFFFFFFFFFFFFFFFFFFFFFFwwwFFFFFvvvEE   7777777777sswwuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnn77
EEEEEEEEEEMbbbbwwwwwwwwFFFFFFFwwwwwwwwwwFFFFFvvMEE   7777777777sqqqquuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEMbbbbwwwwwwwwFFFFFFFwwwwwwwwwwFFFFFvvMEE   7777777777ssqqquuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEMqqqqMwwwwwwwwwMMwwMwMwwwwwwwwwwFFFFFvvMEE   7777777nnlllwwuuuuuuuuwwwuwwwwuuuuuuuuuwnnnnnnnq77
EEEEEEEEqqqqqwwwwwwwwwwwwwwwwwwwwwwwwwwwFFFFFvvvEE   7777777nllllwuuuuuuuuuwuuuuuuwuuuuuuuuuwnnnnnnnn77
EEEEEEEEqqqqMMMwcMMwcMwMMwqMqMcMwcMMwcMMFFFFFvvEEE   7777777nllllwwwuwwwuwwwwwuwwwwwwuwwwuwwwnnnnnnnq77
EEEEEEEEqqqqcccccccccccrrqqqqqccccccccccvvvvvvvMEE   7777777llllln777777777777lllll7777777777qnnnnnnq77
EEEEEEEEqqqqqccccccccccrrqqqqqccccccccccMvvvvvvMEE   7777777nlllll777777777777lllll7777777777qqqnqqqq77
EEEEEEEEqqqqMccccccccccMqqqqqqccccccccccccccccccMq   7777777nlllln777777777nnllllll77777777777777777nnl
EEEEEEEEqqqqMccccccccccqqqqqqqccccccccccccccccccqq   7777777nlllln777777777nlllllll77777777777777777nll
EEEEEEEEMMqWcccccccccccqqqqqqqcccccccccccccccccqqq   7777777nnnlnn777777777nlllllll7777777777iinnnlnnll
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccMWWqqqqqqq   7777777777ggg777777777llllllll7777777777ignlllllll
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccWWWqqqqqqq   7777777777ggg777777777nlllllll7777777777ggllllllll
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccMqqqqqqqqq   7777777777ggg777777777nlllllll7777777777nnllllllll
EEEEEEEEEEWWWccccccccccqqqqqqqccccccccccMqqqqqqqqq   7777777777ggg777777777nlllllll7777777777nlllllllll
EEEEEEEEEEWWcccccccccccqqqqqqqccccccccccqqqqqqqqqq   7777777nnnlnn777777777llllllll7777777777nlllllllll
EEEEEEEEqqqqMccccccccccqqqqqqqccccccccccqqqqqEEEEE   7777777nlllln777777777nlllllll7777777777lllll77777
EEEEEEEEqqqqqccccccccccqqqqqqqccccccccccMqqqqEEEEE   7777777nlllll777777777nlllllll7777777777nllll77777
EEEEEEEEqqqqqqMWWWMMqqqqqqqqqqqMMWWWWWMqqqqqqEEEEE   7777777llllllnnggnnnlnnllllllllnnggggnnllllll77777
EEEEEEEEqqqqqqqWWWqqqqqqqqqqqqqqMWWWWWqqqqqqqEEEEE   7777777nllllllnggnllllllllllllllnggggnlllllll77777
EEEEEEEEqqqqqqqWWWqqqqqqqqqqqqqqMWWWWWqqqqqqqEEEEE   7777777nllllllnggnllllllllllllllnggggnlllllll77777
EEEEEEEEqqqqqqqEEEqqqqqqqqqqqqqqqEEEEEqqqqqqqEEEEE   7777777llllllll77llllllllllllllll7777llllllll77777
EEEEEEEEqqqqqqqEEEqqqqqqqqqqqqqqMEEEEEqqqqqqqEEEEE   7777777llllllln77nlllllllllllllln7777nlllllll77777
```
How much the plans of the seeds differ: 0.35 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 206 nodi, 951 passi, finito in 448 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba, h=sala sopra la cantina, f=pavimento in pietra, s=vano scala, d=soglia del mastio, w=muro del mastio, u=muro della torre, t=camera della torre, a=camera del bastione, v=muro del bastione, b=contrafforte, c=cortile della rocca, W=cinta muraria, q=torretta d'angolo, p=lastricato della tettoia, m=magenta, F=solaio del mastio, P=tettoia in legno, X=fascia muraria, L=finestra, D=pavimento della cantina, V=muro della cantina, T=scala, k=gradini in legno, O=porta in legno, o=assi della porta, N=stipite in pietra, M=merlatura, U=feritoia, z=z, y=yellow, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #93=terreno di prova (marcatore).
Alla fine: w 65210, q 41417, u 18146, o 8582, v 8099, k 6028, P 5008, V 4579, W 4375, E 4325, U 3581, b 2690, F 2290, M 1812, N 1713, L 1544, f 1075, c 1000, D 875, O 668, p 144.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-34 all×18, prl×1, one×5: 262 celle x2-17 y2-19 z20, passi 2-33
   #42 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 34
#44-48 all×5: 46775 celle x25-79 y30-64 z19-60, passi 35-76
#49-56 all×4, prl×2: 38675 celle x25-79 y30-64 z20-85, passi 77-104
    #57 all . h → h . (+1) passi=31: ×31, 46500 celle x30-74 y35-59 z21-52, passi 105-135, h→. 20925, .→h 20925, y→. 2325, .→y 2325
      r1 . h → h . ×20925; r2 . y → y . ×2325
#58-59 all×2: 13900 celle x30-74 y35-59 z22-53, passi 136-166
    #60 all . h → h . (+2) passi=31: ×31, 58900 celle x30-74 y35-59 z53-84, passi 167-197, h→. 20925, .→h 20925, s→. 6200, .→s 6200, +2
      r1 . h → h . ×20925; r2 . y → y . ×2325; r3 . s → s . ×6200
#61-65 prl×1, all×4: 24350 celle x30-89 y20-59 z21-84, passi 198-250
#66-77 all×11, prl×1: 30350 celle x10-89 y20-59 z20-96, passi 251-398
#78-83 all×5, prl×1: 25100 celle x15-84 y35-94 z21-74, passi 399-522
#84-85 all×2: 38500 celle x15-89 y60-99 z21-40, passi 523-542
#86-105 all×11, prl×2, one×3: 53614 celle x10-89 y10-99 z20-84, passi 543-669
    #106 prl X → w: ×1, 38756 celle x10-89 y20-99 z28-71, passi 670, X→w 38756
#124-125 all×1, prl×1: 33250 celle x30-74 y35-54 z0-19, passi 671-690
#126-163 prl×8, one×1, all×11: 25215 celle x30-74 y35-54 z1-52, passi 691-780
#164-206 prl×5, all×15: 33959 celle x10-89 y20-99 z10-99, passi 781-951
Senza effetto (non hanno mai cambiato una cella):
#7 prl E/h → h/* passi=1
#14 prl m → f: in quel momento nella griglia non c'erano celle "m"
#26 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#27 all [uvb]E/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all cE/*[wuvb] → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#33 one Wcccc/Wcccc/Wcccc/Wcccc → Wpppp/Wpppp/Wpppp/Wpppp passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all d/[cE] → */r passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#36 all r/[cE] → */r: in quel momento nella griglia non c'erano celle "r"
#37 all r/W → */G: in quel momento nella griglia non c'erano celle "r"
#38 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G"
#39 all G/[cE] → */r: in quel momento nella griglia non c'erano celle "G"
#40 all r/[cE] → */r: in quel momento nella griglia non c'erano celle "r"
… e altri 59
Fix it and answer with the whole program.

## Risposta

<!--
  Rocca di confine (border fortress with cellar):
  - Main keep (mastio): rear interior 'h' (over the cellar 'D', 45x25-30 voxels), front hall 'f' (15 voxels deep before cellar), stair zone 's' (20x10 voxels along rear wall), keep walls 'w', main door 'd'. Total keep room: 45 x 40-45 voxels (>= 28 a side, clear of cellar stairs).
  - Attached watchtower (torre di guardia) 't' with wall 'u', placed on one of the rear corners of the keep.
  - Side bastion wing (bastione laterale) 'a' with wall 'v', attached to a side of the keep.
  - Timber lean-to armory 'p' (5x4 cells = 25x20 voxels, >= 30 clear under roof).
  - Seeds change: keep depth (4 or 5 rear cells), which side the bastion wing grows on, which corner the watchtower stands on, and whether a secondary corner buttress 'b' grows.
  - Size difference:
    * At Large (20x20 plan): Keep + watchtower + side bastion + lean-to armory 'p' against the keep + road 'r' to the front edge.
    * At Huge (30x30 plan): Outer bailey courtyard 'c' expands around the keep (only where 8+ cells of ground remain, so only at Huge), enclosed by a fortified curtain wall 'W' with corner watch-turrets 'q' and a front gatehouse 'G'.
-->
<sequence values="BHEhfsdwutavbcWqpGr" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhfsdwutavbcWqpGrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Center spine marker 'm' for front hall (3 cells = 15 voxels deep) -->
      <all in="H/E" out="*/m" symmetry="()" steps="3"/>

      <!-- Main keep rear core 'h': 9 cells wide (45 voxels >= 44 for cellar), 4-5 cells behind H (25-30 voxels deep) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <one in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*h" symmetry="(x)" steps="4"/>
      <all in="mE" out="*f" symmetry="(x)" steps="4"/>

      <!-- Keep walls 'w' -->
      <all in="[hfm]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Front doorway 'd' of the keep (3 cells = 15 voxels wide) -->
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="m" out="f"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- Stair zone 's' along the rear wall of the keep (4 cells along x, 2 cells along y; 2 cells of landing 'h' on small-x end) -->
      <one in="wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw" out="***********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- Corner watchtower 't' (interior) and 'u' (wall) on one rear corner of the keep -->
      <one in="EEE/Eww/Ewh" out="uuu/utw/utw" symmetry="(x)" steps="1"/>
      <all in="E[tu]" out="u*" symmetry="(xy)" steps="1"/>

      <!-- Side bastion wing 'a' (interior) and 'v' (wall) on one flank of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="a*/a*/a*/a*" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Optional opposite flank buttress tower 'b' -->
      <one in="Ew/Ew/Ew" out="**/*b/**" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(xy)" steps="1"/>

      <!-- Huge size expansion: outer bailey courtyard 'c' only where 8+ cells of ground remain around the keep -->
      <all in="wEEEEEEEE" out="*cccccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="[uvb]E/*c" out="*c/**"/>
      <all in="cE/*[wuvb]" out="*c/**"/>

      <!-- Outer curtain wall 'W' around the bailey courtyard (only forms at Huge when 'c' exists) -->
      <all in="cEE" out="*WE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner turrets 'q' on the outer curtain wall -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="1">
        <rule in="q[EW]" out="*q"/>
        <rule in="q*/*[EW]" out="**/*q"/>
      </all>

      <!-- Timber lean-to armory 'p' (5x4 cells = 25x20 voxels): against curtain wall at Huge, or against keep wall at Large -->
      <one in="Wcccc/Wcccc/Wcccc/Wcccc/Wcccc" out="Wpppp/Wpppp/Wpppp/Wpppp/Wpppp" symmetry="(xy)" steps="1"/>
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="wpppp/wpppp/wpppp/wpppp/wpppp" symmetry="(xy)" steps="1"/>

      <!-- Road 'r' and Gatehouse 'G' from front door 'd' straight to the front edge -->
      <all in="[dr]/[cE]" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="[Gr]/[cE]" out="*/r" symmetry="()"/>
    </sequence>

    <map scale="5 5 1" values="BEhfsdwutavbcWqpGrfFPXLDVTkOoNMUzy#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="p" out="ppppp/pzzzp/pzzzp/pzzzp/ppppp"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="(xy)">
        <!-- Unions for the included parts -->
        <union symbol="+" values="wuvbWqGX"/>
        <union symbol="%" values="wuvbWqG"/>
        <union symbol="=" values="fF"/>

        <!-- Mark 'D' on the first layer under the soil (z=19) under 'h' and 's' (45x25-30 voxels >= 44x14, 15 voxels back from front wall) -->
        <all in="h B" out="* D" steps="1"/>
        <all in="s B" out="* D" steps="1"/>

        <!-- B. Heights: grow columns from the soil layer (z=20) upward -->

        <!-- Front doorway 'd' at z=20 becomes door seed 'O' through the full 5-voxel thickness, with wall 'w' rising above -->
        <all in="B d" out="w O" steps="1"/>

        <!-- Main keep walls 'w': 2 storeys (64 steps) with window bands 'X' -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w *" steps="20"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w *" steps="12"/>

        <!-- Keep interior 'h', front hall 'f', and stair zone 's': 2 covered storeys (z=20 floor, z=52 slab, z=84 roof slab) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B f" out="y f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip 'T' at z=21 above 's' -->
        <all in="B s" out="s T" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B y" out="y B"/>
        </all>
        <all in="B s" out="s B" steps="30"/>
        <!-- First floor slab 'F' at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B y" out="y F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second storey air (31 steps) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B y" out="y B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Roof terrace slab 'F' at z=84 -->
        <prl>
          <rule in="h" out="F"/>
          <rule in="y" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Corner watchtower walls 'u' (76 steps) and interior 't' -->
        <all in="B u" out="u *" steps="10"/>
        <all in="B u" out="u X" steps="10"/>
        <all in="B u" out="u *" steps="22"/>
        <all in="B u" out="u X" steps="10"/>
        <all in="B u" out="u *" steps="24"/>

        <all in="B t" out="t f" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t F" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t F" steps="1"/>
        <all in="B t" out="t B" steps="11"/>
        <prl in="t" out="F"/>

        <!-- Side bastion wing walls 'v' (46 steps) and interior 'a' -->
        <all in="B v" out="v *" steps="8"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v *" steps="26"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="13"/>
        <prl in="a" out="F"/>

        <!-- Flank buttress 'b' (54 steps) -->
        <all in="B b" out="b *" steps="54"/>

        <!-- Outer curtain wall 'W' (24 steps) and corner turrets 'q' (38 steps) -->
        <all in="B W" out="W *" steps="24"/>
        <all in="B q" out="q *" steps="12"/>
        <all in="B q" out="q X" steps="8"/>
        <all in="B q" out="q *" steps="18"/>

        <!-- Gatehouse 'G': door seed 'O' at z=20 across middle 15 voxels, with wall 'G' rising 36 steps above -->
        <all in="G/r" out="O/*" symmetry="()" steps="5"/>
        <all in="B O" out="G *" steps="1"/>
        <all in="B G" out="G *" steps="36"/>

        <!-- Timber lean-to armory 'p' (floor) and 'z' (3x3 posts): 32 clear height under roof 'P' at z=53 -->
        <all in="B p" out="y p" steps="1"/>
        <all in="B z" out="z p" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <all in="B z" out="z P" steps="32"/>
        <prl in="y" out="P"/>
        <prl in="z" out="P"/>

        <!-- C. Full scale: doors, cellar, stairs, battlements, slits, windows -->

        <!-- Internal doors connecting keep to bastion wing 'a' and watchtower 't' on ground and upper floors (11 voxels wide along wall) -->
        <one in="fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf" out="*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*" symmetry="(xy)" steps="2"/>
        <one in="FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF" out="*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*" symmetry="(xy)" steps="2"/>

        <!-- Windows 'L' in the window bands 'X' on all sides -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <!-- 1. Cellar under the keep (after floors rise, before part-stair) -->
        <import file="part-cellar"/>

        <!-- 2. Stairs inside the keep -->
        <import file="part-stair"/>

        <!-- 3. Doors -->
        <import file="part-door"/>

        <!-- 4. Battlements on flat wall tops -->
        <import file="part-battlements"/>

        <!-- 5. Arrow slits under merlons -->
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval stone, timber accents, earthy courtyard and grass -->
  <color symbol="E" value="#7a8f52" name="erba"/>
  <color symbol="h" value="#c8b08a" name="sala sopra la cantina" area="keep"/>
  <color symbol="f" value="#bfa57e" name="pavimento in pietra" area="keep"/>
  <color symbol="F" value="#a8926f" name="solaio del mastio" area="keep"/>
  <color symbol="s" value="#9e7a52" name="vano scala" area="keep"/>
  <color symbol="d" value="#6b4428" name="soglia del mastio" area="keep"/>
  <color symbol="w" value="#8c8881" name="muro del mastio" area="keep"/>
  <color symbol="u" value="#75716b" name="muro della torre" area="tower"/>
  <color symbol="t" value="#b59d78" name="camera della torre" area="tower"/>
  <color symbol="a" value="#b09975" name="camera del bastione" area="keep"/>
  <color symbol="v" value="#7e7a74" name="muro del bastione" area="keep"/>
  <color symbol="b" value="#696560" name="contrafforte" area="keep"/>
  <color symbol="c" value="#b8a88a" name="cortile della rocca" area="courtyard"/>
  <color symbol="W" value="#706c66" name="cinta muraria" area="courtyard"/>
  <color symbol="q" value="#5e5a55" name="torretta d'angolo" area="tower"/>
  <color symbol="p" value="#9e8565" name="lastricato della tettoia" area="courtyard"/>
  <color symbol="P" value="#8c5332" name="tettoia in legno" area="courtyard"/>
  <color symbol="G" value="#857f78" name="corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#9e927d" name="strada lastricata" area="road"/>
  <color symbol="L" value="#3b4d5e" name="finestra"/>
  <color symbol="X" value="#8c8881" name="fascia muraria"/>
  <color symbol="D" value="#73634d" name="pavimento della cantina" area="cellar"/>
  <color symbol="V" value="#59544f" name="muro della cantina" area="cellar"/>
  <color symbol="T" value="#8c6239" name="scala"/>
  <color symbol="k" value="#8c6239" name="gradini in legno"/>
  <color symbol="O" value="#6b4428" name="porta in legno"/>
  <color symbol="o" value="#4a2e19" name="assi della porta"/>
  <color symbol="N" value="#59544f" name="stipite in pietra"/>
  <color symbol="M" value="#8c8881" name="merlatura"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>
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
