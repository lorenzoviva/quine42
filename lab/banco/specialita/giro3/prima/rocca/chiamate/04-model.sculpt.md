# model.sculpt · correzione · gemini-4-argon · 46 s · 25334 token d'ingresso (0 in cache), 5194 d'uscita, 0 di ragionamento · $0.10

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
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2); porta: 15 × 11 voxel (0,94 × 0,69 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 20 voxel (1,25 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole; cantina: dalla porta non si scende in cantina — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, f pavimento in pietra, w muro del mastio, u muro della torre, v muro del bastione, b contrafforte, p lastricato della tettoia, r strada lastricata, F solaio del mastio, P tettoia in legno, L finestra, D pavimento della cantina, V muro della cantina, k gradini in legno, O porta in legno, o assi della porta, N stipite in pietra, M merlatura, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEEEMuuuuuuMEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEEEuuuuuuuuEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEMuuuuuuuuuuMEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEuuuuuuuuuuuuEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEuuuuuuuMuwMMEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE
EEEEEEEEuuuuuFFwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEEEEE
EEEEEEEEuuuuuFFwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEEEEE
EEEEEEEEuuuuuFFwwwFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEEEEuuuuuFFwwwFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEEEEMuuuuFFwwFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEEEEEEuuwwwFFFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEEEEEEMuMwwFFFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEMMvvMvvvwwFFFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEMvvvvvvvwwFFFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEvvvvvvvMwwFFFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEvvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE
EEEEEMvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFwMEEEEEEEEEE
EEEEEMvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFbbbMMEEEEEEE
EEEEEvvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFFbbbbMEEEEEEE
EEEEEvvvFFFFFwwFFFFFFFFFFFFFFFFFFFFFFwbbbMEEEEEEEE
EEEEEMvvFFFFFwwwwwwwwwwFFFFFFFwwwwwwwwwwEEEEEEEEEE
EEEEEMvvFFFFFwwwwwwwwwwFFFFFFFwwwwwwwwwwEEEEEEEEEE
EEEEEMvvFFFFFwwwwwwwwwwMMwwMwMwwwwwwwwwwEEEEEEEEEE
EEEEEvvvFFFFFwwwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEEEEE
EEEEEvvvFFFFFMMwEMMwEMwMrMwrMMEMwEMMwEMMEEEEEEEEEE
EEEEEMvvvvvvEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEMvvvvvvMEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
7777777777777777777777777jjjjjjjjjjjjj777777777777
7777777777777777777777777jjjjjjjjjjjjj777777777777
7777777777777777777777777jjjjjjjjjjjjj777777777777
7777777777777777777777777jjjjjjjjjjjjj777777777777
7777777777777777777777777jjjjjjjjjjjjj777777777777
7777777777zzzzyzzz7777777jjjjjjjjjjjjj777777777777
7777777777zyyyyyyz7777777jjjjjjjjjjjjj777777777777
7777777777yyyyyyyy7777777jjjjjjjjjjjjj777777777777
7777777zzyyyyyyyyyzz77777jjjjjjjjjjjjj777777777777
7777777zyyyyyyyyyyyz77777jjjjjjjjjjjjj777777777777
7777777zyyyyyyyzyzzzuuwwuwwwuwwwuwwwuwww7777777777
7777777yyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
7777777zyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
7777777zyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuu7777777777
7777777zyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
7777777zzyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
7777777777zyzuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777777
7777777777zzzuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
77777qqqnqnnwuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
77777qnnnnnnuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
77777nnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuww7777777777
77777qnnnnnnuuuuuuuuuuuuuuuuuuuuuuuuuuqqqss7777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuqqqqs7777777
77777nnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuwwqss7777777
77777qnnnnnnwuuuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
77777qnnnnnnuuuuuuuuuuuuuuuuuuuuuuuuuuuu7777777777
77777qnnnnnnwuuuuuuuuuwwwuwwwwuuuuuuuuuw7777777777
77777nnnnnnnwuuuuuuuuuwuuuuuuwuuuuuuuuuw7777777777
77777qnnnnnnwwwuwwwuwwwwwwuwwwwwuwwwuwww7777777777
77777qnnnnnnq7777777777777777777777777777777777777
77777qqqnqqqq7777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
```
Front (looking from the front; the sky at the top):
```
.......MM.MMMM.MMMMM..............................
.......uuuuuMFFuuuuu..............................
.......uuuuuuuuuuuuu..............................
.......uuuuUuuuuUuuu..............................
.......uuuuUuMMuUMMu.MMMMMMMMMMM..MM..MM..........
.......uuuuuuMMuMMMuMMMMMMMMMMMM.MMM.MMM..........
.......uuuuuuMMuuMMuMMMMMMMMMMMM.MMM.MMM..........
.......uuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwww..........
.......uuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwww..........
.......uuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwww.M........
.......uuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwww.MM.......
.......uuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwww.MM.......
.......uuuuuuwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....MMuuMuMwwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....MMMwMMMMwwwwwwwwLLLwwwwwwwwwwwwwwwwbbb.......
.....MMMwMMMMwwwwwwwwLLLwLLwwwwwwwwwwwwwbbb.......
.....vvvvvvvwwwwwwwwwLLLwLLLwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwLLLwwwwwwwwLLLwbbb.......
.....vUvvvvvvwwwwwwwwwwwwwwwwwwwwwwwLLLwbbb.......
.....vUvvvvvvwwwwwwwwwwwwwwwwwwwwwwwLLLwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....wwwwwwwwwLLwwwwwwwwwwwwwwwwwwwwwwwwbbb.......
.....wwwwwwwwwLLLwwwwLLLwwwLLLwwwLLwwwwwbbb.......
.....wwwwwwwwwLLLLLwwLLLLLLLLLwwwLLLwwwwbbb.......
.....wwwwwwwwwwwLLLLwLLLLLLLLLwwwLLLwwwwbbb.......
.....wwwwwwwwwwwwLLLwwLLLLLLoLwwwwwwwwwwbbb.......
.....wwwwwwwwwwwwwwwwwNoooooooNwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwNoooooooNwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwNoooooooNwwwwwwwwwbbb.......
.....vvvvvvvvwwwwwwwwwNoooooooNwwwwwwwwwbbb.......
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
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
.......MM.MMM.MMMMMM..............................
.......uuuuuuFFFFFuu..............................
.......uuuuuuuuuuuuu..............................
.......uuuuUuuuuuuuu..............................
.......uuuuUuMMuuMuuM.MMM.MM..MMM.................
.......uuuuuuMMuuMuuM.MMM.MMM.MMM.................
.......uuuuuuMMuuMuuM.MMM.MMM.MMM.................
.......uuuuuuwwwwwwwwwwwwFFMwwwww.................
.......uuuuuuwwwwwwwwwwwwwwwwwwww.................
.......uuuuuuwwwwwwwwwwwwMMwwwwUw.................
.......uuuuuuwwwwwwwwwwwwMMMwwwUw.................
.......uuuuuuwwwwwwwwwwwwMMMwwwww.................
.......uuuuuuwwwwwwwwwwwwbbwwwwww.................
.......uuuuuuwwwwwwwwwwwwbbbwwwwwMM...............
.......wwwwwwwwwwwwwwwwwwbUbwwwwwMM...............
.......wwwwwwwwwwwwwwwwwwbUbwwwwwMM...............
.......wwwwwwwwwwLLLwwwwwbbbwwwwwvv...............
.......wwwwwwwwwwLLLwwwwwbbbwwwwwvv...............
.......wwwwwwwwwwLLLwwwwwbbbwwwwwvv...............
.......uuuuuuwwwwwwwwwwwwbbbwwwwwvv...............
.......uuuuuuwwwwwwwwwwwwbbbwwwwwvv...............
.......uuuuuuwwwwwwwwwwwwbbbwwwwwvv...............
.......uuuuuuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPPPPPPwwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPwPPwPwwwwwwwwwwwwwbbbwwwwwww...............
...PPPPwPPwPwwwwwwwwwwwwwbbbwwwwwww...............
...PPPPwPPwPwwwwwwwwwwwwwbbbwwwwwww...............
...PPPPwPPwPwwwwwwwwwwwwwbbbwwwwwww...............
...PPPPwPPwPwwwwwwwwwwwwwbbbwwwwwww...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwww...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
...PPPPuPPuPuwwwwwwwwwwwwbbbwwwwwvv...............
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
...............VVVVVVVVVVVVV......................
...............VVVVVVVVVVVVV......................
...............VVVVVVVVVVVVV......................
...............VVVVVVVVVVVVV......................
...............VVVVVVVVVVVVV......................
...............VVVVVVVVVVVVV......................
...............VVVVVVVVVVVVV......................
...............VVVVVVVVVVVVV......................
...............VVVVVVVVVVVVV......................
...............DDDDDDDDDDDDD......................
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
.................VVVVVVVVVVVVVVVVVVVVV............
.................VV.................VV............
...............VVV..................VV............
...............VV...................VV............
...............V....................VV............
...............V....................VV............
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
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
.........................PP.PPPP.PPPP.............
..........................P.P..P.P..P.............
..........................P.P..P.P..P.............
.........................PP.PPPP.PPPP.............
..........uuuuuuu.................................
..........uuuuuuuu.......PP.PPPP.PPPP.............
..........uuuuuuuu........P.P..P.P..P.............
.......uuuuuuuuuuuuu......P.P..P.P..P.............
.......uuuuuuuuuuuuu.....PP.PPPP.PPPP.............
.......uuuuuuuuuuuuuwwwwwwwwwwwwwwwwwwww..........
.......uuuuuu..wwwwwwwwwwwwwwwwwwwwwwwww..........
.......uuuuuu..wwwwwwwwwwwwwwwwwwwwwwwww..........
.......uuuuuu..www.......kkk.........www..........
.......uuuuuu..www.......kkk.........www..........
........uuuuuwwww........kkk.........www..........
..........uuuww..........kkk.........www..........
..........uuuww..........kkk.........www..........
.....vvvvvvvvww......................www..........
.....vvvvvvvvww......................www..........
.....vvvvvvvwww......................www..........
.....vvv....www......................www..........
.....vvv....www......................www..........
.....vvv....www......................bbbbbb.......
.....vvv....www......................bbbbbb.......
.....vvv....wwwwwwwwww........wwwwwwwwbbbb........
.....vvv....wwwwwwwwwww.......wwwwwwwwww..........
.....vvv....wwwwwwwwwww.......wwwwwwwwww..........
.....vvv....wwwwwwwwwwwwwwwwwwwwwwwwwwww..........
.....vvv....wwwwwwwwwwwwwwwwwwwwwwwwwwww..........
.....vvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwww..........
.....vvvvvvvv.....................................
.....vvvvvvvv.....................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
..........uuuuuuu.................................
..........uuuuuuuu................................
..........uuuuuuuu................................
.......uuuuuuuuuuuuu..............................
.......uuuuuuuuuuuuu..............................
.......uuuuuuuuuuuuuwwwwwwwwwwwwwwwwwwww..........
.......uuuuuu..wwwwwwwwwwwwwwwwwwwwwwwww..........
.......uuuuuu..wwwwwwwwwwwwwwwwwwwwwwwww..........
.......uuuuuu..www...................www..........
.......uuuuuu..www...................www..........
........uuuuuwwww....................www..........
..........uuuww......................www..........
..........uuuww......................www..........
............www......................www..........
............www......................www..........
............www......................www..........
............www......................www..........
............www......................www..........
............www..........................MM.......
............www...........................M.......
............wwwwwwwwww........wwwwwwwwww.M........
............wwwwwwwwwww.......wwwwwwwwww..........
............wwwwwwwwwww.......wwwwwwwwww..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   7777777777777777777777777jjjjjjjjjjjjj777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777777777777777777777jjjjjjjjjjjjj777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777777777777777777777jjjjjjjjjjjjj777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777777777777777777777jjjjjjjjjjjjj777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777777777777777777777jjjjjjjjjjjjj777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777777zzzyzzzz7777777jjjjjjjjjjjjj777777777777
EEEEEEEEEEMuuuuuuMEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777777zyyyyyyz7777777jjjjjjjjjjjjj777777777777
EEEEEEEEEEuuuuuuuuEEEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777777yyyyyyyy7777777jjjjjjjjjjjjj777777777777
EEEEEEEEMuuuuuuuuuuMEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777zzyyyyyyyyyzz77777jjjjjjjjjjjjj777777777777
EEEEEEEEuuuuuuuuuuuuEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777zyyyyyyyyyyyz77777jjjjjjjjjjjjj777777777777
EEEEEEEEuuuuuuuMuwMMEEEEEPPPPPPPPPPPPPEEEEEEEEEEEE   7777777zyyyyyyyzyzzzuuwwuwwwuwwwuwwwuwww7777777777
EEEEEEEEuuuuuFFwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEEEEE   7777777zyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
EEEEEEEEuuuuuFFwwwwwwwwwwwwwwwwwwwwwwwwwEEEEEEEEEE   7777777yyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
EEEEEEEEuuuuuFFwwwFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE   7777777zyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuu7777777777
EEEEEEEEuuuuuFFwwwFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE   7777777zyyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuw7777777777
EEEEEEEEMuuuuFFwwFFFFFFFFFFFFFFFFFFFFFwwEEEEEEEEEE   7777777zzyyyyyyuuuuuuuuuuuuuuuuuuuuuuuuwnnqqnqqq77
EEEEEEEEEEuuwwwFFFFFFFFFFFFFFFFFFFFFFFwwvvvvvvvMEE   7777777777zyzuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEMuMwwFFFFFFFFFFFFFFFFFFFFFFFwwvvvvvvvMEE   7777777777zzzuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvvEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnn77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvEEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvEEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvvEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnn77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEbMwFFFFFFFFFFFFFFFFFFFFFFwwwFFFFFvvMEE   7777777777sswwuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEMbbbbwwwwwwwwFFFFFFFwwwwwwwwwwFFFFFvvEEE   7777777777sqqqquuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEMbbbbwwwwwwwwFFFFFFFwwwwwwwwwwFFFFFvvvEE   7777777777ssqqquuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnn77
EEEEEEEEEEEEEMwwwwwwwwwMwMwwMMwwwwwwwwwwvvvvvvvMEE   777777777777wwuuuuuuuuwwwwuwwwuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwwwwwwwwwwwwwwwwwwwwwwwwwwvvvvvvvMEE   777777777777wuuuuuuuuuwuuuuuuwuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEMMwEMMwEMwMMwrMrMEMwEMMwEMMvvMEvMMEEE   777777777777wwwuwwwuwwwwwuwwwwwwuwwwuwwwnnqqnqqq77
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   77777777777777777jjjjjjjjjjjjj77777777777777777777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEEEEEEEEEEEEEEEEEE   77777777777777777jjjjjjjjjjjjj77777777777777777777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEEEEEEEEEEEEEEEEEE   77777777777777777jjjjjjjjjjjjj77777777777777777777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEEEEEEEEEEEEEEEEEE   77777777777777777jjjjjjjjjjjjj77777777777777777777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEEEEEEEEEEEEEEEEEE   77777777777777777jjjjjjjjjjjjj77777777777777777777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEEEEEEEEEEEEEEEEEE   77777777777777777jjjjjjjjjjjjj77777zzzyzzzz7777777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEEEMuuuuuuMEEEEEEE   77777777777777777jjjjjjjjjjjjj77777zyyyyyyz7777777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEEEuuuuuuuuEEEEEEE   77777777777777777jjjjjjjjjjjjj77777yyyyyyyy7777777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEMuuuuuuuuuuMEEEEE   77777777777777777jjjjjjjjjjjjj77zzyyyyyyyyyzz77777
EEEEEEEEEEEEEEEEEEPPPPPPPPPPPPEEEuuuuuuuuuuuuEEEEE   77777777777777777jjjjjjjjjjjjj77zyyyyyyyyyyyz77777
EEEEEEEEEEEEEEEEEMPPPPPPPPPPPPEEwMMuwMuuuuuuuEEEEE   777777777777wwwuwwwuwwwuwwwuwwuuzzzyzzyyyyyyz77777
EEEEEEEEEEEEEwwwwwwwwwwwwwwwwwwwwwwwwwFFuuuuuEEEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyy77777
EEEEEEEEEEEEEwwwwwwwwwwwwwwwwwwwwwwwwwFFuuuuuEEEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFwwwFFuuuuuEEEEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFwwwFFuuuuuEEEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyyz77777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFwwFFFuuuEMEEEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuyyyyyyzz77777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwuuEEEEEEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuuzyz7777777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwMuMEEEEEEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuuzzz7777777
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwvvvvvMMMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnqqnqqq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwvvvvvvvMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEEEEEbMwFFFFFFFFFFFFFFFFFFFFFFFwwvvvvvvvEEE   7777777777sswwuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEMbbbbFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvvEE   7777777777sqqqquuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnn77
EEEEEEEEEEMbbbbFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   7777777777ssqqquuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEMwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   777777777777wwuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFFwwFFFFFvvMEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwFFFFFFFFFFFFFFFFFFFFFFwwwFFFFFvvvEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnn77
EEEEEEEEEEEEEwwwwwwwwwwFFFFFFFwwwwwwwwwwFFFFFvvEEE   777777777777wuuuuuuuuuuuuuuuuuuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwwwwwwwwwFFFFFFFwwwwwwwwwwFFFFFvvMEE   777777777777uuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnq77
EEEEEEEEEEEEEwwwwwwwwwwMwMwwMMwwwwwwwwwwFFFFFvvMEE   777777777777wuuuuuuuuuwwwwuwwwuuuuuuuuuwnnnnnnnq77
EEEEEEEEEEEEEwwwwwwwwwwwwwwwwwwwwwwwwwwwFFFFFvvvEE   777777777777wuuuuuuuuuwuuuuuuwuuuuuuuuuwnnnnnnnn77
EEEEEEEEEEEEEMMwEMMwEMwMrMwrMMEMwEMMwEMMFFFFFvvEEE   777777777777wwwuwwwuwwwwwwuwwwwwuwwwuwwwnnnnnnnq77
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEvvvvvvvMEE   7777777777777777777777777777777777777777qnnnnnnq77
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMvvvvvvMEE   7777777777777777777777777777777777777777qqqqnqqq77
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
How much the plans of the seeds differ: 0.35 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 195 nodi, 823 passi, finito in 376 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba, h=sala sopra la cantina, f=pavimento in pietra, s=vano scala, d=soglia del mastio, w=muro del mastio, u=muro della torre, t=camera della torre, a=camera del bastione, v=muro del bastione, b=contrafforte, p=lastricato della tettoia, r=strada lastricata, m=magenta, F=solaio del mastio, P=tettoia in legno, X=fascia muraria, L=finestra, D=pavimento della cantina, V=muro della cantina, T=scala, k=gradini in legno, O=porta in legno, o=assi della porta, N=stipite in pietra, M=merlatura, U=feritoia, z=z, y=yellow, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #93=terreno di prova (marcatore).
Alla fine: w 67149, u 18153, v 8378, P 6260, E 5975, k 5870, V 4959, F 2740, b 2690, U 2137, L 1968, f 1225, M 1146, D 1100, o 713, r 525, p 500, N 110, O 52.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-35 all×14, one×6, prl×2: 177 celle x2-16 y1-19 z20, passi 2-37
   #40 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 38
#42-46 all×5: 31650 celle x25-79 y25-64 z19-41, passi 39-61
    #47 all . w → w * passi=20: ×20, 19000 celle x25-79 y25-64 z41-61, passi 62-81, .→w 19000
    #48 all . w → w X passi=12: ×12, 22800 celle x25-79 y25-64 z60-73, passi 82-93, w→X 11400, .→w 11400
#49-51 all×3: 14075 celle x25-79 y25-64 z20-85, passi 94-107
    #52 all . h → h . (+1) passi=31: ×31, 60450 celle x30-74 y30-59 z21-52, passi 108-138, h→. 27900, .→h 27900, y→. 2325, .→y 2325
      r1 . h → h . ×27900; r2 . y → y . ×2325
#53-54 all×2: 14350 celle x30-74 y30-59 z22-53, passi 139-169
    #55 all . h → h . (+2) passi=31: ×31, 72850 celle x30-74 y30-59 z53-84, passi 170-200, h→. 27900, .→h 27900, s→. 6200, .→s 6200, +2
      r1 . h → h . ×27900; r2 . y → y . ×2325; r3 . s → s . ×6200
#56-60 prl×1, all×4: 24575 celle x15-74 y15-59 z21-84, passi 201-253
#61-72 all×11, prl×1: 30350 celle x10-39 y15-69 z20-96, passi 254-401
#73-86 all×6, prl×1: 21580 celle x15-84 y5-64 z20-74, passi 402-503
    #87 all . y → y . passi=32: ×32, 20480 celle x50-74 y5-24 z21-53, passi 504-535, y→. 10240, .→y 10240
#88-94 all×2, prl×2, one×1: 13988 celle x10-79 y5-64 z21-71, passi 536-588
    #95 prl X → w: ×1, 30332 celle x10-79 y15-69 z28-72, passi 589, X→w 30332
     #113 all D . → * D: ×19, 20900 celle x30-74 y30-54 z0-18, passi 590-608, .→D 20900
     #114 prl D D → #90 * passi=1: ×1, 20900 celle x30-74 y30-54 z1-19, passi 609, D→#90 20900
#115-129 prl×7, one×1, all×6: 24150 celle x30-74 y30-54 z1-20, passi 610-651
#147-195 all×19, prl×6: 18691 celle x10-84 y15-69 z20-99, passi 652-823
Senza effetto (non hanno mai cambiato una cella):
#25 all wEEEEEEEE → *cccccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#26 all cE/*c → *c/**: in quel momento nella griglia non c'erano celle "c"
#27 all [uvb]E/*c → *c/**: in quel momento nella griglia non c'erano celle "c"
#28 all cE/*[wuvb] → *c/**: in quel momento nella griglia non c'erano celle "c"
#29 all cEE → *WE passi=1: in quel momento nella griglia non c'erano celle "c"
#30 all WE/*W → *W/**: in quel momento nella griglia non c'erano celle "W"
#31 all EE/EW → **/*q: in quel momento nella griglia non c'erano celle "W"
#32 all q[EW] → *q (+1) passi=1: in quel momento nella griglia non c'erano celle "q"
#33 one Wcccc/Wcccc/Wcccc/Wcccc/Wcccc → Wpppp/Wpppp/Wpppp/Wpppp/Wpppp passi=1: in quel momento nella griglia non c'erano celle "W", "c"
#36 all r/W → */G: in quel momento nella griglia non c'erano celle "W"
#37 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G", "W"
#38 all [Gr]/[cE] → */r: le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 63
Fix it and answer with the whole program.

## Risposta

<!--
  Rocca di confine (border fortress with cellar):
  - Main keep (mastio): rear interior 'h' (over the cellar 'D', 55x30-35 voxels), front hall 'f' (15 voxels deep before cellar), stair zone 's' (20x10 voxels along rear wall), keep walls 'w', main door 'd'. Total keep room: 55 x 45-50 voxels (>= 28 a side, clear of cellar stairs).
  - Attached watchtower (torre di guardia) 't' with wall 'u', placed on one of the rear corners of the keep.
  - Side bastion wing (bastione laterale) 'a' with wall 'v', attached to a side of the keep.
  - Timber lean-to armory 'p' (5x4 cells = 25x20 voxels, >= 30 clear under roof).
  - Seeds change: keep depth (5 or 6 rear cells), which side the bastion wing grows on, which corner the watchtower stands on, and whether a secondary corner buttress 'b' grows.
  - Size difference:
    * At Large (20x20 plan): Keep + watchtower + side bastion + lean-to armory 'p' against the keep + road 'r' to the front edge.
    * At Huge (30x30 plan): Outer bailey courtyard 'c' expands around the keep (only where 7+ cells of ground remain, so only at Huge), enclosed by a fortified curtain wall 'W' with corner watch-turrets 'q' and a front gatehouse 'G'.
-->
<sequence values="BHEhfsdwutavbcWqpGr" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhfsdwutavbcWqpGrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Center spine marker 'm' for front hall (3 cells = 15 voxels deep) -->
      <all in="H/E" out="*/m" symmetry="()" steps="3"/>

      <!-- Main keep rear core 'h': 11 cells wide (55 voxels >= 50 needed for 20-deep cellar), 5-6 cells behind H (30-35 voxels deep) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <one in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*h" symmetry="(x)" steps="5"/>
      <all in="mE" out="*f" symmetry="(x)" steps="5"/>

      <!-- Keep walls 'w' -->
      <all in="[hfm]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Front doorway 'd' of the keep (3 cells = 15 voxels wide) -->
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="m" out="f"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- Stair zone 's' along the rear wall of the keep (4 cells along x, 2 cells along y; 3 cells of landing 'h' on small-x end) -->
      <one in="wwwwwwwwwwwww/whhhhhhhhhhhw/whhhhhhhhhhhw" out="*************/****ssss*****/****ssss*****" symmetry="()" steps="1"/>

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

        <!-- Mark 'D' on the first layer under the soil (z=19) under 'h' and 's' (55x30-35 voxels >= 50x14, 15 voxels back from front wall) -->
        <all in="h B" out="* D" steps="1"/>
        <all in="s B" out="* D" steps="1"/>

        <!-- B. Heights: grow columns from the soil layer (z=20) upward -->

        <!-- Front doorway 'd' at z=20 becomes door seed 'O' through the full 5-voxel thickness, with wall 'w' rising 64 steps above (no window band above door!) -->
        <all in="B d" out="w O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="w"/>

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

        <!-- Windows 'L' in the window bands 'X' on all sides -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <!-- Internal doors connecting keep to bastion wing 'a' and watchtower 't' on ground and upper floors (11 voxels wide along wall, placed after X->w so wall above is solid 'w') -->
        <one in="fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf/fwwwwwf" out="*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*" symmetry="(xy)" steps="2"/>
        <one in="FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF/FwwwwwF" out="*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*" symmetry="(xy)" steps="2"/>

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
