# model.sculpt · gemini-4-argon · 63 s

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
Concept: Forte (medieval fortress with central keep, side guardhouse annex, courtyard, curtain wall, corner towers, gatehouse, and well/moat at larger sizes).
Parts & Letters:
- H, h: interior floor of the central keep (mastio), with s as the stair zone (4x2 cells along the back wall).
- w: stone walls of the central keep.
- a, v: side annex (corpo di guardia) attached to the keep, with floor a and wall v (varies by seed side/position).
- c: courtyard (cortile) around the keep.
- W: outer curtain wall (mura di cinta) surrounding the courtyard.
- t: corner towers (torri angolari) on the outer corners of the curtain wall (number and corners vary with seed/size).
- d, n, G, r: main axis to the front (+y) — d: keep doorway, n: paved path across courtyard, G: gatehouse through curtain wall, r: road to edge.
- Q: courtyard well (pozzo) placed where courtyard is wide enough (Huge/Gargantuan).
- m: outer moat (fossato) outside the curtain wall where enough ground remains (Huge/Gargantuan).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEshwavcdWtnGrQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep (mastio) interior: 3 behind H, 3 in front (+1 by chance), 4 to each side -> 9 wide, 7-8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Side wing / annex (corpo di guardia) on one random side of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Entrance axis from H straight to the front (+y) -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Stair zone inside the keep along the back wall (2 cells landing on left, 4x2 stair strip) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Courtyard around keep and annex: 2 cells at Large, expands where ground allows (Huge/Gargantuan) -->
      <all in="[wvd]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall around the courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers: at Large, 2 random outer corners get 3x3 towers; where ground is wide (Huge+), all corners get 4x4 towers -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <all in="EEE/EEE/EEW" out="***/***/*t*"/>
      <all steps="2">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Well in the courtyard where a 4x4 patch of courtyard is free (fits at Huge and Gargantuan) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <all in="Qc" out="*Q" steps="1"/>
      <all in="Q*/*c" out="**/*Q" steps="1"/>

      <!-- Continue entrance path across courtyard, gatehouse through curtain wall, road to edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Moat around the curtain wall and towers where at least 4 cells of ground remain to the edge (fits at Huge+) -->
      <all in="[Wt]EEEE" out="*mm**" steps="1"/>
      <all in="mE/*m" out="*m/**" steps="2"/>
    </sequence>

    <map scale="5 5 1" values="BEshwavcdWtnGrQmPZfFYTJkLRIKVXUMk#90#91#92#94OoN#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QmmmQ/QmmmQ/QmmmQ/QQQQQ"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="PV"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="PV"/>

        <!-- Internal doorway seed between keep (h) and side annex (a) -->
        <one in="hwwwwwa" out="*OOOOO*" symmetry="()" steps="1"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="5"/>

        <!-- Front door seed (O) of the keep at d, and outer gate seed (O) at G -->
        <all in="d/n" out="O/*" symmetry="()" steps="1"/>
        <all in="d/O" out="O/*" symmetry="()" steps="4"/>
        <all in="G/r" out="O/*" symmetry="()" steps="1"/>
        <all in="G/O" out="O/*" symmetry="()" steps="4"/>

        <!-- B. Heights: grow columns from the bottom layer while preserving area letters at z=0 -->
        <!-- Keep walls (w) and keep doorway above door (d): 2 storeys = 64 + 1 parapet = 65 -->
        <all in="B [wd]" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="13"/>
        <prl in="B w" out="P *"/>

        <!-- Keep interior (h) and stair zone (s): 2 covered storeys (z=1..31, slab at 32, z=33..63, roof slab at 64) -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B h" out="h B" steps="31"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="B h" out="F *"/>
          <rule in="B s" out="F *"/>
        </prl>

        <!-- Side annex (a, v): 1 storey + pitched roof -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v Z" steps="12"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="B v" out="R *"/>

        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <prl in="B a" out="R *"/>

        <!-- Curtain wall (W): height 24 -->
        <all in="B W" out="W P" steps="23"/>
        <prl in="B W" out="P *"/>

        <!-- Gatehouse (G): height 36 -->
        <all in="B G" out="G V" steps="35"/>
        <prl in="B G" out="V *"/>

        <!-- Corner towers (t): solid base + upper room + battlements at 44, plus conical spire marker on top -->
        <all in="B t" out="t V" steps="43"/>
        <prl in="B t" out="V *"/>

        <!-- Well (Q): low stone rim of 5 -->
        <all in="B Q" out="Q P" steps="5"/>
        <prl in="Q" out="P"/>

        <!-- C. Full scale details: stairs, doors, battlements, slits, windows, roofs -->
        <!-- 1. Stair inside the keep -->
        <import file="part-stair"/>

        <!-- 2. Doors (keep entrance, internal annex door, outer gatehouse door) -->
        <all in="B O" out="P O" steps="1"/>
        <import file="part-door"/>

        <!-- 3. Battlements and arrow slits on keep, curtain wall, gatehouse, towers -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 4. Windows in the Z bands of the keep and annex (at least 6 windows on 3+ sides) -->
        <one steps="18">
          <rule in="BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LZZZZB" out="*LLLL*"/>
        <prl in="Z" out="P"/>

        <!-- 5. Pitched roof on the side annex (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- 6. Chimney / turret on the keep roof -->
        <one in="B B F" out="* K *" steps="1" symmetry="()"/>
        <all in="K F" out="* K" symmetry="(x)" steps="2"/>
        <all in="K/F" out="*/K" symmetry="(y)" steps="2"/>
        <all in="B K" out="K V" steps="10"/>
        <prl in="K" out="R"/>
      </sequence>
    </map>
  </map>

  <!-- Palette and Area Tags -->
  <color symbol="E" value="768a58" name="prato"/>
  <color symbol="h" value="b99b73" name="pavimento del mastio" area="keep"/>
  <color symbol="s" value="b99b73" name="vano scala" area="keep"/>
  <color symbol="w" value="87847d" name="fondazione del mastio" area="keep"/>
  <color symbol="a" value="af9169" name="corpo di guardia" area="house"/>
  <color symbol="v" value="7d7a73" name="muro del corpo di guardia" area="house"/>
  <color symbol="c" value="c3b491" name="cortile" area="courtyard"/>
  <color symbol="d" value="a8a298" name="soglia del mastio" area="keep"/>
  <color symbol="W" value="96928a" name="base delle mura" area="courtyard"/>
  <color symbol="t" value="76736c" name="base della torre" area="tower"/>
  <color symbol="n" value="a8a298" name="lastricato" area="courtyard"/>
  <color symbol="G" value="696660" name="soglia del portone" area="courtyard"/>
  <color symbol="r" value="9e8e70" name="strada" area="yard"/>
  <color symbol="Q" value="87847d" name="pozzo" area="courtyard"/>
  <color symbol="m" value="487694" name="acqua del fossato" area="yard"/>

  <!-- Full-scale Building Materials -->
  <color symbol="P" value="96928a" name="pietra chiara"/>
  <color symbol="V" value="78746d" name="pietra scura"/>
  <color symbol="M" value="96928a" name="merlatura"/>
  <color symbol="U" value="2b2927" name="feritoia"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="f" value="9e7b56" name="tavolato"/>
  <color symbol="F" value="856646" name="solaio in legno"/>
  <color symbol="k" value="9e7b56" name="gradini in legno"/>
  <color symbol="T" value="9e7b56" name="scala"/>
  <color symbol="R" value="a84a38" name="tetto in coppi"/>
  <color symbol="K" value="78746d" name="torretta"/>
  <color symbol="O" value="6e472b" name="porta in legno"/>
  <color symbol="o" value="4a2e1b" name="assi della porta"/>
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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); porta: 15 × 2 voxel (0,75 × 0,10 caselle), una porta è almeno 11 × 30 a ogni taglia — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h pavimento del mastio, w fondazione del mastio, a corpo di guardia, v muro del corpo di guardia, c cortile, W base delle mura, t base della torre, n lastricato, r strada, m acqua del fossato, P pietra chiara, F solaio in legno, L finestra, R tetto in coppi, V pietra scura, M merlatura, O porta in legno, o assi della porta, N stipite in pietra
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEmmmmmMVVVVVVVVV
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEmmmmmMVVVVVVVVV
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEmmmmmVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEmmmmmVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEmmmmmMVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPcccccccccccccccccccccccccccccccccccccMVVVVVVVVV
PPPcccccccccccccccccccccccccccccccccccccVVVVVVVVVV
PPPcccccccccccccccccccccccccccccccccccccVVVVVVVVVV
PPPcccccccccccccccccccccccccccccccccccccMVVVVVVVVV
PPPcccccccccccccccccccccccccccccccccccccMVVVVVVVVV
PPPccccRRRRRRMMPPMMPPMMPPMPMPPMMPPMMPPMMcccccPPPmm
PPPccccRRRRRRPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPmm
PPPccccRRRRRRPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPmm
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPmm
PPPccccRRRRRRPMFFFFFFFFFFFFFFFFFFFRFFFPPcccccPPPmm
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFRFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRMMFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccMMMRRRRPPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccMmMccMmPPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccMMMccMMPPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPmmMmMmmMmPPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPmm
PPPmMMmPmPPmPPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPmm
PPPccMMPPPPPPPPPPMPPMMMoooooooMMPPMPPPPPcccccPPPmm
PPPccMmPmmPmPPPPPPPPPPMoooooooMPPPPPPPPPcccccPPPmm
PPPccMMPPPPPPMMPcMcPMMnoooooonMMMPMMPcMMcccccPPVmm
PPPmmMmMmmmmMmmcccccnnnnnnnnnnnnncccccccMVVVVVVVVV
PPPmMMmMmMMmMmMcccccnnnnnnnnnnnnncccccccMVVVVVVVVV
PPPccMMMccMMMcccccccnnnnnnnnnnnnncccccccVVVVVVVVVV
PPPccMmMccMmMcccccccnnnnnnnnnnnnncccccccVVVVVVVVVV
PPPccMMMccMMPcccccccnnnnnnnnnnnnncccccccMVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPoooooooooooooPPPPPPPMVVVVVVVVV
PPPPPPPPPPPPPPPPPPPMooooooooooooMPPPPPPPVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEMVVVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEMVVVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEVVVVVVVVVV
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000mmmkmmmkmm
0000000000000000000000000000000000000000mkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
0000000000000000000000000000000000000000kkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbmkkkkkkkkk
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbkkkkkkkkkk
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbmkkkkkkkkk
bbb0000000000000000000000000000000000000mkkkkkkkkk
bbb0000000000000000000000000000000000000kkkkkkkkkk
bbb0000000000000000000000000000000000000mkkkkkkkkk
bbb0000000000000000000000000000000000000mkkkkkkkkk
bbb0000ffffff000000000000000000000000000mmmkmmmkmm
bbb0000fffffwwwtwwwtwwwtwwwwtwwwtwwwtwww00000bbb00
bbb0000ffggfwttttttttttttttttttttttttttw00000bbb00
bbb0000ffggfwttttttttttttttttttttttttttw00000bbb00
bbb0000ffggfttwssssssssssssssssssssssttt00000bbb00
bbb0000ffggfwwwsssssssssssssssssssxssttw00000bbb00
bbb0000ffgggfffsssssssssssssssssssxssttw00000bbb00
bbb0000ffggggffsssssssssssssssssssxssttw00000bbb00
bbb0000ffgggggfssssssssssssssssssssssttt00000bbb00
bbb0000ffggggffssssssssssssssssssssssttw00000bbb00
bbb0000ffgggfffssssssssssssssssssssssttw00000bbb00
bbb0000ffggfwwwssssssssssssssssssssssttw00000bbb00
bbb0000ffggfwtwssssssssssssssssssssssttt00000bbb00
bbb0000ffggfwtwssssssssssssssssssssssttw00000bbb00
bbb0000ffggftttssssssssssssssssssssssttw00000bbb00
bbb0000fffffwtwssssssssssssssssssssssttw00000bbb00
bbb0055fffffwtwssssssssssssssssssssssttt00000bbb00
bbb005050050ttwssssssssssssssssssssssttw00000bbb00
bbb555555555wttssssssssssssssssssssssttw00000bbb00
bbb055050550wtwssssssssssssssssssssssttw00000bbb00
bbb555552522ttwssssssssssssssssssssssttt00000bbb00
bbb005522222wttttwwtwww0000000wwwtwwtttw00000bbb00
bbb005020220wtttttttttw0000000wttttttttw00000bbb00
bbb555522222wwwtwwwtwww0000000wwwtwwtwwwmmmkmmmkmm
bbb0550505505050000000000000000000000000mkkkkkkkkk
bbb5555555555550000000000000000000000000mkkkkkkkkk
bbb0055500555000000000000000000000000000kkkkkkkkkk
bbb0050500505000000000000000000000000000mkkkkkkkkk
bbddbdddbdddbdddbddd000000000000dddbddbbmkkkkkkkkk
bbbbbbbbbbbbbbbbbbbd000000000000dbbbbbbbmkkkkkkkkk
bbddbdddbdddbdddbddd000000000000dddbddbbkkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
0000000000000000000000000000000000000000kkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
```
Front (looking from the front; the sky at the top):
```
..................................R...............
.............MM..MM.MMM..M.M..MM..MM..MM..........
............MMM.MMM.MMM.MMMM.MMMMMMM.MMM..........
............MMM.MMM.MMM.MMMM.MMMMMMM.MMM..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPwFFFFFFFPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPLLLLLLPPPPPPPPPPPMM..MM..M.
............LLLLLLPPPPPLLLLLLPPPPPPPPPPPMMM.MMM.MM
............LLLLLLPPPPPLLLLLLPPPPPPPPPPPMMM.MMM.MM
............LLLLLLPPPPPLLLLLLPPPPPPPPPPPVVVVVVVVVV
............LLLLLLPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
............PPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
............PPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
..........RRPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
........RRRRRPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
.......RvvvvPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
...M..MMVVMMVPMMPPMMPPPPPPPPPPPPPMMPPMPPVVVVVVVVVV
..MM.MMMVVMMVPMMPPMMPPPPPPPPPPPPPMMPPMPPVVVVVVVVVV
..MM.MMMVVMMVPMMPPMMPPPPPPPPPPPPPMMPPMPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLLPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLLPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLLPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLLPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEVVVVVVVVVV
```
Right side (looking from the right):
```
...................RR.............................
...............MM..MMM.MMMMMMMMMMM.MM.............
...............MMMMMMM.MMMMMMMMMMMMMMM............
...............MMMMMMM.MMMMMMMMMMMMMMM............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...MM..M..M..MMPPPPPPPPPPPLLLPPPPPPPPPMM..MM..MM..
..MMM.MM.MM.MMMPPPPPPLLPPPLLLPPPPPPPPPMM.MMM.MMM.M
..MMM.MM.MM.MMMPPPPPPLLLPPLLLPPPPPPPPPMM.MMM.MMM.M
..VVVVVVVVVVVVVPPPPPPLLLPPLLLPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPLLLPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVV
EEVVVVVVVVVVVVVmmmmmEEEEEEEEEEEEPmmmmVVVVVVVVVVVVV
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
........................................VVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPP.....................................VVVVVVVVVV
PPP.....................................VVVVVVVVVV
PPP.....................................VVVVVVVVVV
PPP.....................................VVVVVVVVVV
PPP.....................................VVVVVVVVVV
PPP....PPPPPPPPPLLLPLLLPPPPPPPLLLPPPPPPP.....PPP..
PPP....PPPPPPPPPLLLPLLLPPPPPPPLLLPPPPPPP.....PPP..
PPP....PPPPPPPPPLLLPLLLPPPPPPPLLLPPPPPPP.....PPP..
PPP....PPP..PPP......................PPP.....PPP..
PPP....LLL..PPP......................PPP.....PPP..
PPP....LLL...........................PPP.....PPP..
PPP....LLL...........................PPP.....PPP..
PPP....PPP...........................PPP.....PPP..
PPP....PPP...........................PPP.....PPP..
PPP....PPP...........................PPP.....PPP..
PPP....PPP..PPP......................PPP.....PPP..
PPP....PPP..PPP......................PPP.....PPP..
PPP....PPPPPPPP......................PPP.....PPP..
PPP....PPPPPPPP......................PPP.....PPP..
PPP....PPPPPPPP......................PPP.....PPP..
PPP..MMM..M.PPP......................PPP.....PPP..
PPP..M.M..M.PPP......................PPP.....PPP..
PPPMMMMMMMMMPPP......................PPP.....PPP..
PPP.MM.M.MM.PPP......................PPP.....PPP..
PPPMMM......PPP......................PPP.....PPP..
PPP..MM.....PPPPPPPPPPP.......PLLLPPPPPP.....PPP..
PPP..M......PPPPPPPPPPP.......PLLLPPPPPP.....PPP..
PPPMMMM......PPPPPPPPP........PLLLPPPPPPVVVVVPPVVV
PPP.MM.M.M..M.M.........................VVVVVVVVVV
PPPMMMMMMMMMMMM.........................VVVVVVVVVV
PPP..MMM..MMM...........................VVVVVVVVVV
PPP..M.M..M.M...........................VVVVVVVVVV
PPPPPMMPPPMMPPPPPPPP.............PPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPP............PPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPP............PPPPPPPPVVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
............PPPLLLPPPPPPPPLLLPPLLLPPPPPP..........
............PPPLLLPPPPPPPPLLLPPLLLPPPPPP..........
............PPPLLLPPPPPPPPLLLPPLLLPPPPPP..........
............PPP......................PPP..........
............PPP......................PPP..........
.....................................PPP..........
.....................................LLL..........
.....................................LLL..........
.....................................LLL..........
.....................................PPP..........
............PPP......................PPP..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................PPP..........
............PPP......................PPP..........
............LLL......................PPP..........
............LLL......................PPP..........
............LPL......................PPP..........
............LLL......................PPP..........
............LPPLLLPPPPP.......PPPPPPPPPP..........
............PPPPLLPPPPP.......PPPPPPPPPP..........
.............LLLLLPPPP........PPPPPPPPPPtttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
........................................tttttttttt
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   mkmmmkmmmkmmm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmmEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmmEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVVmmmmmEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkk0000000000000000000000000000000000000
VVVVVVVVVVVVmmmmmmEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkkbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVMcccccccccccccccccccccccccccMmPPPPPPPP   kkkkkkkkkkkkm0000000000000000000000000005552222222
VVVVVVVVVVVVVcccccccccccccccccccccccccccMmMmmPmPmm   kkkkkkkkkkkkk0000000000000000000000000005050220202
VVVVVVVVVVVVccccccccccccccccccccccccccccMMMMPPPPPP   kkkkkkkkkkkkm0000000000000000000000000005555522222
VVVVVVVVVVVVMccccccccccccccccccccccccccccccmmPmPmm   kkkkkkkkkkkkm0000000000000000000000000000050220202
VVVVVVVVVVVVMccccccccccccccccccccccccccccccmPPmPmP   mkmmmkmmmkmmm0000000000000000000000000000055522222
mmmmmPPPcccccMMPPMMPPMMPPMPMPPMMPPMMPPMMMMMMPPPPPP   00000bbb0000wwwtwwwtwwwtwwwwtwwwtwwwtwww5555252522
mmmmmPPPcccccPPPPPPPPPPPPPPPPPPPPPPPPPPPMmMmmMmMmm   00000bbb0000wttttttttttttttttttttttttttw5050550502
mmmmmPPPcccccPPPPPPPPPPPPPPPPPPPPPPPPPPPMMMMMMMMMP   00000bbb0000wttttttttttttttttttttttttttw5555555555
mmmmmPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccmmcccmm   00000bbb0000tttssssssssssssssssssssssttt0050500505
mmmmmPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPccRmRcccmM   00000bbb0000wttsssssssssssssssssssssswtwfffff00555
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssswtwffffff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssstttffggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssswtwffggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssswtwffggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPMRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssswwwffggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssfffgggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssssffggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssfgggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssfgggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssfgggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssssffggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFooRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssss0ffgggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFooRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssss0ffgggff0000
mmmmmPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFoMRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssswwwfgggff0000
mmmmmPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssswtwffffff0000
mmmmmPPPcccccPPPPMPPMMMoooooooMMPPMPPPPPRRRRRccccc   00000bbb0000wttttwwtwww0000000wwwtwwttttfffff00000
mmmmmPPPcccccPPPPPPPPPMoooooooMPPPPPPPPPcccccccccc   00000bbb0000wtttttttttw0000000wttttttttw0000000000
mmmmmPPMccccMMMPcMcPMMnoooooonMMMPMMPcMMcccccccccc   mkmmmkmmmkmmwwwtwwwtwww0000000wwwtwwtwww0000000000
VVVVVVVVVVVVMcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVVcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkk0000000000000000000000000000000000000
VVVVVVVVVVVVccccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkmbddbddd000000000000dddbdddbdddbdddbdd
VVVVVVVVVVVVMPPPPPPPoooooooooooooPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkmbbbbbbd000000000000dbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVVPPPPPPMooooooooooooMPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkkbddbddd000000000000dddbdddbdddbdddbdd
VVVVVVVVVVVVEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVVEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkk0000000000000000000000000000000000000
VVVVVVVVVVVVEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   mkmmmkmmmkmmm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmmEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmmEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVVmmmmmEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkk0000000000000000000000000000000000000
VVVVVVVVVVVVmmmmmmEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkkbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVMccccccccccccccccccccccccccccccMMcccMP   kkkkkkkkkkkkm0000000000000000000000000000055500552
VVVVVVVVVVVVVccccccccccccccccccccccccccccccmmcccmm   kkkkkkkkkkkkk0000000000000000000000000000050500502
VVVVVVVVVVVVccccccccccccccccccccccccccccccMMMccMMP   kkkkkkkkkkkkm0000000000000000000000000005555555555
VVVVVVVVVVVVMcccccccccccccccccccccccccccMmMmmMmMmm   kkkkkkkkkkkkm0000000000000000000000000005050550502
VVVVVVVVVVVVMcccccccccccccccccccccccccccMmMmPPmPmP   mkmmmkmmmkmmm0000000000000000000000000005555252522
mmmmmPPPcccccMMPPMMPPMMPPMPMPPMMPPMMPPMMcccMPPPPPP   00000bbb0000wwwtwwwtwwwtwwwwtwwwtwwwtwww0055522222
mmmmmPPPcccccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccmmPmPmm   00000bbb0000wttttttttttttttttttttttttttw0050220202
mmmmmPPPcccccPPPPPPPPPPPPPPPPPPPPPPPPPPPccMMPPPPPP   00000bbb0000wttttttttttttttttttttttttttw5555522222
mmmmmPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPMmMmmMmMmm   00000bbb0000tttssssssssssssssssssssssttt5050550502
mmmmmPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPMmMmMMmMmP   00000bbb0000wttsssssssssssssssssssssswtw5555555552
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccMMcccMP   00000bbb0000wttsssssssssssssssssssssswtw0055500555
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccmmcccmm   00000bbb0000wttssssssssssssssssssssssttt0050500505
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccMMcccMM   00000bbb0000tttsssssssssssssssssssssswtw0055500555
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccccccc   00000bbb0000wttsssssssssssssssssssssswtw0000000000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPMcccccccccc   00000bbb0000wttsssssssssssssssssssssswwwfffff00000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFooRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssss0fffffff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFooRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssss0ffgggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFooRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssss0ffgggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFooRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssss0ffgggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFoRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssffggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssssfgggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssfgggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsxsssssssssssssssssssssfgggggff0000
EEEEEPPPcccccPPFRFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsxsssssssssssssssssssssffggggff0000
EEEEEPPPcccccPPFRFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000tttsxsssssssssssssssssssssfffgggff0000
mmmmmPPPcccccPPPPMPPMMMoooooooMMPPMMPPMMRRRRRRcccc   00000bbb0000wttttwwtwww0000000wwwtwwtwwwffggff0000
mmmmmPPPcccccPPPPPPPPPMoooooooMPPPPPPPPPRRRRRRcccc   00000bbb0000wtttttttttw0000000wttttttttwffggff0000
mmmmmPPPcccccMMPcMcPMMnoooooonMMMPMMPcMMRRRRRRcccc   00000bbb0000wwwtwwwtwww0000000wwwtwwtwwwfgggff0000
mmmmmPPPccccccccccccnnnnnnnnnnnnncccccccRRRRRRcccc   00000bbb0000000000000000000000000000000ffgggff0000
mmmmmPPPccccccccccccnnnnnnnnnnnnncccccccRRRRRRcccc   00000bbb0000000000000000000000000000000fffffff0000
VVMMVVMMVVMMMcccccccnnnnnnnnnnnnncccccccRRRRRccccc   mkmmmkmmmkmmm000000000000000000000000000fffff00000
VVVVVVVVVVVVMcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVccccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVVcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkk0000000000000000000000000000000000000
VVVVVVVVVVVVMcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMPPMPPMMooooooooooooMMMPPMMPPMMPPMMPPM   kkkkkkkkkkkkmbddbddd000000000000dddbdddbdddbdddbdd
VVVVVVVVVVVVPPPPPPPPoooooooooooooPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkmbbbbbbd000000000000dbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVVPEMPEMMroooooooooooOMMPEMMPEMMPEMMPEM   kkkkkkkkkkkkkbddbddd000000000000dddbdddbdddbdddbdd
VVVVVVVVVVVVMEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.42 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 159 nodi, 390 passi, finito in 361 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=prato, h=pavimento del mastio, w=fondazione del mastio, a=corpo di guardia, v=muro del corpo di guardia, c=cortile, d=soglia del mastio, W=base delle mura, t=base della torre, n=lastricato, G=soglia del portone, r=strada, Q=pozzo, m=acqua del fossato, P=pietra chiara, Z=Z, F=solaio in legno, L=finestra, R=tetto in coppi, K=torretta, V=pietra scura, M=merlatura, #90=? (marcatore), #91=? (marcatore), O=porta in legno, o=assi della porta, N=stipite in pietra.
Alla fine: P 80598, V 48050, L 3848, F 3295, M 2766, c 1900, E 1875, h 1575, W 1225, t 1000, R 792, w 775, o 384, m 344, n 250, r 250, v 200, a 150, N 40, O 16.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-44 all×29, one×3, prl×1: 385 celle x0-19 y1-19 z0, passi 2-50
   #47 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 51
#51-55 all×5: 12600 celle x25-79 y30-89 z0-8, passi 52-69
    #56 all . w → w Z passi=12: ×12, 18600 celle x25-79 y30-74 z8-20, passi 70-81, w→Z 9300, .→w 9300
    #57 all . w → w P passi=12: ×12, 18600 celle x25-79 y30-74 z20-32, passi 82-93, w→P 9300, .→w 9300
    #58 all . w → w P passi=8: ×8, 12400 celle x25-79 y30-74 z32-40, passi 94-101, w→P 6200, .→w 6200
    #59 all . w → w Z passi=12: ×12, 18600 celle x25-79 y30-74 z40-52, passi 102-113, w→Z 9300, .→w 9300
    #60 all . w → w P passi=13: ×13, 20150 celle x25-79 y30-74 z52-65, passi 114-126, w→P 10075, .→w 10075
    #61 prl . w → P *: ×1, 775 celle x25-79 y30-74 z66, passi 127, .→P 775
    #64 all . h → h . passi=31: ×31, 97650 celle x30-74 y35-69 z0-31, passi 128-158, h→. 48825, .→h 48825
    #65 all . h → h F (+1) passi=1: ×1, 3150 celle x30-74 y35-69 z31-32, passi 159, h→F 1575, .→h 1575
      r1 . h → h F ×1575; r2 . s → s F ×0
    #66 all . h → h . (+1) passi=31: ×31, 97650 celle x30-74 y35-69 z32-63, passi 160-190, h→. 48825, .→h 48825
      r1 . h → h . ×48825; r2 . s → s . ×0
#67-71 prl×2, all×3: 14575 celle x15-74 y30-69 z0-64, passi 191-224
#72-74 all×2, prl×1: 9750 celle x20-29 y35-54 z0-33, passi 225-257
    #75 all . W → W P passi=23: ×23, 56350 celle x0-94 y15-89 z0-23, passi 258-280, W→P 28175, .→W 28175
    #76 prl . W → P *: ×1, 1225 celle x0-94 y15-89 z24, passi 281, .→P 1225
    #79 all . t → t V passi=43: ×43, 86000 celle x80-99 y5-99 z0-43, passi 282-324, t→V 43000, .→t 43000
#80-151 prl×4, all×11, one×1: 13539 celle x0-99 y5-99 z0-72, passi 325-369
#152-159 prl×2, all×5, one×1: 17700 celle x14-79 y29-74 z8-75, passi 370-390
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#21 one wwwwwwwww/whhhhhhhh/whhhhhhhh → *********/***ssss**/***ssss** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#26 all cEEEEEE → *ccc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#27 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all cEEEEEEE → *ccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#29 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all EEE/EEE/EEW → ***/***/*t*: le celle cercate c'erano, ma mai disposte come nel pattern
#45 all mE/*m → *m/** passi=2: le celle cercate c'erano, ma mai disposte come nel pattern
#49 one hwwwwwa → *OOOOO* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#50 all O/w → */O passi=5: in quel momento nella griglia non c'erano celle "O"
#62 all . s → s T passi=1: in quel momento nella griglia non c'erano celle "s"
#63 all . s → s . passi=30: in quel momento nella griglia non c'erano celle "s"
… e altri 54
Fix it and answer with the whole program.

## Risposta

<!--
Concept: Forte (medieval fortress with central keep, side guardhouse annex, courtyard, curtain wall, corner towers, gatehouse, and well/moat at larger sizes).
Parts & Letters:
- H, h: interior floor of the central keep (mastio), with s as the stair zone (4x2 cells along the back wall).
- w: stone walls of the central keep.
- a, v: side annex (corpo di guardia) attached to the keep, with floor a and wall v (varies by seed side/position).
- c: courtyard (cortile) around the keep.
- W: outer curtain wall (mura di cinta) surrounding the courtyard.
- t: corner towers (torri angolari) on the outer corners of the curtain wall (number and corners vary with seed/size).
- d, n, G, r: main axis to the front (+y) — d: keep doorway, n: paved path across courtyard, G: gatehouse through curtain wall, r: road to edge.
- Q: courtyard well (pozzo) placed where courtyard is wide enough (Huge/Gargantuan).
- m: outer moat (fossato) outside the curtain wall where enough ground remains (Huge/Gargantuan).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEshwavcdWtnGrQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep (mastio) interior: 3 behind H, 3 in front (+1 by chance), 4 to each side -> 9 wide, 7-8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside the keep along the back wall (2 cells landing on left, 4x2 stair strip, 3 cells landing on right) -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Side wing / annex (corpo di guardia) on one random side of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Entrance axis from H straight to the front (+y) -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Courtyard around keep and annex: 2 cells at Large, expands where ground allows (Huge/Gargantuan) -->
      <all in="[wvd]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall around the courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers: at Large, 2 random outer corners get 3x3 towers; where ground is wide (Huge+), all corners get towers -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <all in="EEE/EEE/EEW" out="***/***/*t*"/>
      <all steps="2">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Well in the courtyard where a 4x4 patch of courtyard is free (fits at Huge and Gargantuan) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <all in="Qc" out="*Q" steps="1"/>
      <all in="Q*/*c" out="**/*Q" steps="1"/>

      <!-- Continue entrance path across courtyard, gatehouse through curtain wall, road to edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Moat around the curtain wall and towers where at least 3 cells of ground remain (fits at Huge+) -->
      <all in="cWEEE" out="**mm*" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
    </sequence>

    <map scale="5 5 1" values="BEshwavcdWtnGrQmPZfFYTJkLRIKVXUMk#90#91#92#94OoN#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QmmmQ/QmmmQ/QmmmQ/QQQQQ"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="PV"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="PV"/>

        <!-- Internal doorway seed between keep (h) and side annex (a) -->
        <one in="hwwwwwa" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/w" out="*/O" symmetry="(y)" steps="5"/>

        <!-- Front door seed (O) of the keep at d, and outer gate seed (O) at G -->
        <all in="d/n" out="O/*" symmetry="()" steps="1"/>
        <all in="d/O" out="O/*" symmetry="()" steps="4"/>
        <all in="G/r" out="O/*" symmetry="()" steps="1"/>
        <all in="G/O" out="O/*" symmetry="()" steps="4"/>

        <!-- B. Heights: grow columns from the bottom layer while preserving area letters at z=0 -->
        <!-- Keep walls (w) and keep doorway above door (O): 2 storeys = 64 + 1 parapet = 65 -->
        <all in="B w" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="13"/>
        <prl in="w" out="P"/>

        <!-- Keep interior (h) and stair zone (s): 2 covered storeys (floor at z=0, air 1..31, slab at 32, air 33..63, roof slab at 64) -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B h" out="h B" steps="31"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Side annex (a, v): 1 storey + pitched roof -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v Z" steps="12"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="R"/>

        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <prl in="a" out="R"/>

        <!-- Curtain wall (W): height 24 -->
        <all in="B W" out="W P" steps="23"/>
        <prl in="W" out="P"/>

        <!-- Gatehouse (G): height 36 -->
        <all in="B G" out="G V" steps="35"/>
        <prl in="G" out="V"/>

        <!-- Doors (O): wall above O up to the height of the wall around it, leaving O at z=0 for part-door -->
        <all in="B O" out="O P" steps="1"/>
        <all in="P/O" out="*/*" symmetry="(xy)">
          <rule in="B O" out="O P"/>
        </all>
        <prl in="O" out="P"/>
        <all in="P O" out="O P" steps="1"/>

        <!--Wait: instead of moving O up and down, let's keep O at z=0 and grow a wall column above it! -->
      </sequence>
    </map>
  </map>
</sequence>
<!-- Let's make sure the XML is a single clean root without trailing comments -->bfaddf
Wait—let me output only the clean XML without any extra text!
```xml
<!--
Concept: Forte (medieval fortress with central keep, side guardhouse annex, courtyard, curtain wall, corner towers, gatehouse, and well/moat at larger sizes).
Parts & Letters:
- H, h: interior floor of the central keep (mastio), with s as the stair zone (4x2 cells along the back wall).
- w: stone walls of the central keep.
- a, v: side annex (corpo di guardia) attached to the keep, with floor a and wall v (varies by seed side/position).
- c: courtyard (cortile) around the keep.
- W: outer curtain wall (mura di cinta) surrounding the courtyard.
- t: corner towers (torri angolari) on the outer corners of the curtain wall (number and corners vary with seed/size).
- d, n, G, r: main axis to the front (+y) — d: keep doorway, n: paved path across courtyard, G: gatehouse through curtain wall, r: road to edge.
- Q: courtyard well (pozzo) placed where courtyard is wide enough (Huge/Gargantuan).
- m: outer moat (fossato) outside the curtain wall where enough ground remains (Huge/Gargantuan).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEshwavcdWtnGrQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep (mastio) interior: 3 behind H, 3 in front (+1 by chance), 4 to each side -> 9 wide, 7-8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside the keep along the back wall (2 cells landing on left, 4x2 stair strip, 3 cells landing on right) -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Side wing / annex (corpo di guardia) on one random side of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Entrance axis from H straight to the front (+y) -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Courtyard around keep and annex: 2 cells at Large, expands where ground allows (Huge/Gargantuan) -->
      <all in="[wvd]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall around the courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers: at Large, 2 random outer corners get 3x3 towers; where ground is wide (Huge+), all corners get towers -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <all in="EEE/EEE/EEW" out="***/***/*t*"/>
      <all steps="2">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Well in the courtyard where a 4x4 patch of courtyard is free (fits at Huge and Gargantuan) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <all in="Qc" out="*Q" steps="1"/>
      <all in="Q*/*c" out="**/*Q" steps="1"/>

      <!-- Continue entrance path across courtyard, gatehouse through curtain wall, road to edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Moat around the curtain wall and towers where at least 3 cells of ground remain (fits at Huge+) -->
      <all in="cWEEE" out="**mm*" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
    </sequence>

    <map scale="5 5 1" values="BEshwavcdWtnGrQmPZfFYTJkLRIKVXUMk#90#91#92#94OoN#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QmmmQ/QmmmQ/QmmmQ/QQQQQ"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="PV"/>
        <union symbol="=" values="fFhsa"/>
        <union symbol="%" values="PV"/>

        <!-- B. Heights: grow columns from the bottom layer while preserving area letters at z=0 -->
        <!-- Keep walls (w) and keep doorway (d): 2 storeys = 64 + 1 parapet = 65 -->
        <all in="B [wd]" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="13"/>
        <prl in="B w" out="P *"/>

        <!-- Keep interior (h) and stair zone (s): 2 covered storeys (z=1..31, slab at 32, z=33..63, roof slab at 64) -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B h" out="h B" steps="31"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="B h" out="F *"/>
          <rule in="B s" out="F *"/>
        </prl>

        <!-- Side annex (a, v): 1 storey + pitched roof -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v Z" steps="12"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="B v" out="R *"/>

        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <prl in="B a" out="R *"/>

        <!-- Curtain wall (W): height 24 -->
        <all in="B W" out="W P" steps="23"/>
        <prl in="B W" out="P *"/>

        <!-- Gatehouse (G): height 36 -->
        <all in="B G" out="G V" steps="35"/>
        <prl in="B G" out="V *"/>

        <!-- Corner towers (t): height 44 -->
        <all in="B t" out="t V" steps="43"/>
        <prl in="B t" out="V *"/>

        <!-- Well (Q): low stone rim of 5 -->
        <all in="B Q" out="Q P" steps="5"/>
        <prl in="Q" out="P"/>

        <!-- C. Full scale details: stairs, doors, battlements, slits, windows, roofs -->
        <!-- 1. Stair inside the keep -->
        <import file="part-stair"/>

        <!-- 2. Door seeds at z=1 (layer of the floor/ground walk) where wall P/V is above -->
        <!-- Keep front door: at z=0 d meets n, put O at z=1 above d -->
        <all in="d B" out="* O"/>
        <!-- Outer gatehouse door: at z=0 G meets r, put O at z=1 above G -->
        <all in="G B" out="* O"/>
        <!-- Wait: above d is P (at z=1..65) and above G is V (at z=1..36)! So d P -> * O and G V -> * O at z=0..1! -->
        <all in="d P" out="* O"/>
        <all in="G V" out="* O"/>

        <!-- Internal doorway between keep (h) and side annex (a): place O at z=1 in shared wall -->
        <one in="hwwwwwwa PPPPPPPP" out="******** *OOOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/P" out="*/O" symmetry="(y)" steps="4"/>

        <import file="part-door"/>

        <!-- 3. Battlements and arrow slits on keep, curtain wall, gatehouse, towers -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 4. Windows in the Z bands of the keep and annex (at least 6 windows on 3+ sides) -->
        <one steps="18">
          <rule in="BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LZZZZB" out="*LLLL*"/>
        <prl in="Z" out="P"/>

        <!-- 5. Pitched roof on the side annex (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- 6. Chimney / turret on the keep roof -->
        <one in="B B F" out="* K *" steps="1" symmetry="()"/>
        <all in="K F" out="* K" symmetry="(x)" steps="2"/>
        <all in="K/F" out="*/K" symmetry="(y)" steps="2"/>
        <all in="B K" out="K V" steps="10"/>
        <prl in="K" out="R"/>
      </sequence>
    </map>
  </map>

  <!-- Palette and Area Tags -->
  <color symbol="E" value="768a58" name="prato"/>
  <color symbol="h" value="b99b73" name="pavimento del mastio" area="keep"/>
  <color symbol="s" value="b99b73" name="vano scala" area="keep"/>
  <color symbol="w" value="87847d" name="fondazione del mastio" area="keep"/>
  <color symbol="a" value="af9169" name="corpo di guardia" area="house"/>
  <color symbol="v" value="7d7a73" name="muro del corpo di guardia" area="house"/>
  <color symbol="c" value="c3b491" name="cortile" area="courtyard"/>
  <color symbol="d" value="a8a298" name="soglia del mastio" area="keep"/>
  <color symbol="W" value="96928a" name="base delle mura" area="courtyard"/>
  <color symbol="t" value="76736c" name="base della torre" area="tower"/>
  <color symbol="n" value="a8a298" name="lastricato" area="courtyard"/>
  <color symbol="G" value="696660" name="soglia del portone" area="courtyard"/>
  <color symbol="r" value="9e8e70" name="strada" area="yard"/>
  <color symbol="Q" value="87847d" name="pozzo" area="courtyard"/>
  <color symbol="m" value="487694" name="acqua del fossato" area="yard"/>

  <!-- Full-scale Building Materials -->
  <color symbol="P" value="96928a" name="pietra chiara"/>
  <color symbol="V" value="78746d" name="pietra scura"/>
  <color symbol="M" value="96928a" name="merlatura"/>
  <color symbol="U" value="2b2927" name="feritoia"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="f" value="9e7b56" name="tavolato"/>
  <color symbol="F" value="856646" name="solaio in legno"/>
  <color symbol="k" value="9e7b56" name="gradini in legno"/>
  <color symbol="T" value="9e7b56" name="scala"/>
  <color symbol="R" value="a84a38" name="tetto in coppi"/>
  <color symbol="K" value="78746d" name="torretta"/>
  <color symbol="O" value="6e472b" name="porta in legno"/>
  <color symbol="o" value="4a2e1b" name="assi della porta"/>
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
