# model.sculpt · gemini-4-argon · 47 s

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
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2); porta: 25 × 1 voxel (1,25 × 0,05 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, s vano scala, h pavimento del mastio, w fondazione del mastio, a corpo di guardia, v muro del corpo di guardia, c cortile, W base delle mura, t base della torre, n lastricato, G soglia del portone, r strada, m acqua del fossato, P pietra chiara, F solaio in legno, k gradini in legno, L finestra, R tetto in coppi, V pietra scura, M merlatura, O porta in legno, o assi della porta
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEmmEEEmmEEEmmmmmmmmmmmmmmmmmmmmmmmmmmmMVVVVVVVVV
EEEmmEEEmmEEEmmmmmmmmmmmmmmmmmmmmmmmmmmmMVVVVVVVVV
EEEmmEEEmmEEEmmmmmmmmmmmmmmmmmmmmmmmmmmmVVVVVVVVVV
EEEmmEEEmmEEEmmmmmmmmmmmmmmmmmmmmmmmmmmmVVVVVVVVVV
EEPmmEEPmmEEPmmmmmmmmmmmmmmmmmmmmmmmmmmmMVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV
PPPccMMMccMMMcccccccccccccccccccccccccccMVVVVVVVVV
PPPccMmMccMmMcccccccccccccccccccccccccccVVVVVVVVVV
PPPccMMMccMMMcccccccccccccccccccccccccccVVVVVVVVVV
PPPmmMmMmmMmMmmcccccccccccccccccccccccccMVVVVVVVVV
PPPmMMmPmPPmPmMcccccccccccccccccccccccccMVVVVVVVVV
PPPccMMPPPPPPMMPPMMPPMMPPMPMPPMMPPMMPPMMcccccPPPEE
PPPccMmPmmPmPPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPEE
PPPccMMPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPEE
PPPmmMmPmmPmPPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPmMMmPmRRmMPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccMMRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccMmRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccMMRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPMFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRMMFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE
PPPcccccRRRRMPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPEE
PPPccccccccccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPEE
PPPccccccccccMMPcMMPnMMPnMnMPnMMPcMMPcMMcccccPPVEE
PPPcccccccccccccccccnnnnnnnnnnnnncccccccMVVVVVVVVV
PPPcccccccccccccccccnnnnnnnnnnnnncccccccMVVVVVVVVV
PPPcccccccccccccccccnnnnnnnnnnnnncccccccVVVVVVVVVV
PPPcccccccccccccccccnnnnnnnnnnnnncccccccVVVVVVVVVV
PPPcccccccccccccccccnnnnnnnnnnnnncccccccMVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPMVVVVVVVVVVVMPPPPPPPMVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPMVVVVVVVVVVVMPPPPPPPVVVVVVVVVV
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
bbb0055500555000000000000000000000000000mkkkkkkkkk
bbb0050500505000000000000000000000000000kkkkkkkkkk
bbb5555555555550000000000000000000000000mkkkkkkkkk
bbb0550505505050000000000000000000000000mkkkkkkkkk
bbb5555525225550000000000000000000000000mmmkmmmkmm
bbb005522222wwwtwwwtwwwtwwwwtwwwtwwwtwww00000bbb00
bbb005020220wttttttttttttttttttttttttttw00000bbb00
bbb555522222wttttttttttttttttttttttttttw00000bbb00
bbb055020220tttssssssssssssssssssssssttt00000bbb00
bbb5555fffffwtwssssssssssssssssssssssttw00000bbb00
bbb0055fffffwtwssssssssssssssssssssssttw00000bbb00
bbb0050ffggftttssssssssssssssssssssssttw00000bbb00
bbb0055ffggfwtwssssssssssssssssssssssttt00000bbb00
bbb0000ffggfwtwssssssssssssssssssssssttw00000bbb00
bbb0000ffggfwwwssssssssssssssssssssssttw00000bbb00
bbb0000ffgggfffssssssssssssssssssssssttw00000bbb00
bbb0000ffggggffssssssssssssssssssssssttt00000bbb00
bbb0000ffgggggfssssssssssssssssssssssttw00000bbb00
bbb0000ffggggffssssssssssssssssssssssttw00000bbb00
bbb0000ffgggfffssssssssssssssssssssssttw00000bbb00
bbb0000ffggfwwwssssssssssssssssssssssttt00000bbb00
bbb0000ffggfwtwssssssssssssssssssssssttw00000bbb00
bbb0000ffggfwtwssssssssssssssssssssssttw00000bbb00
bbb0000ffggfwttssssssssssssssssssssssttw00000bbb00
bbb0000fffffttwssssssssssssssssssssssttt00000bbb00
bbb0000fffffwttttttttttttttttttttttttttw00000bbb00
bbb000000000wttttttttttttttttttttttttttw00000bbb00
bbb000000000wwwtwwwtwwwtwwwwtwwwtwwwtwwwmmmkmmmkmm
bbb0000000000000000000000000000000000000mkkkkkkkkk
bbb0000000000000000000000000000000000000mkkkkkkkkk
bbb0000000000000000000000000000000000000kkkkkkkkkk
bbb0000000000000000000000000000000000000mkkkkkkkkk
bbbbbbbbbbbbbbbbbbbbjjjgjjgjjgjjjbbbbbbbmkkkkkkkkk
bbbbbbbbbbbbbbbbbbbbjgggggggggggjbbbbbbbmkkkkkkkkk
bbbbbbbbbbbbbbbbbbbbjjjgjjgjjgjjjbbbbbbbkkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
0000000000000000000000000000000000000000kkkkkkkkkk
0000000000000000000000000000000000000000mkkkkkkkkk
```
Front (looking from the front; the sky at the top):
```
.............MM..MM..MM..M.M..MM..MM..MM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPLLLPLMM..MM..M.
............PPPPPPPPPPPPPPPPPPPPPPPLLLPPMMM.MMM.MM
............PPPPPPPPPPPPPPPPPPPPPPPLLLPPMMM.MMM.MM
............PPPPPPPPPPPPPPPPPPPPPPPLLLPPVVVVVVVVVV
............PPPPPPPPMMPPMPPMPPMMPPPPPPPPVVVVVVVVVV
............PPPPPPPPMMMPMMPMMPMMMPPPPPPPVVVVVVVVVV
............PPPPPPPPMMMPMMPMMPMMMPPPPPPPVVVVVVVVVV
..........RRPPPPPPPPVVVVVVVVVVVVPPPPPPPPVVVVVVVVVV
........RRRRRPPPPPPPGoooooooooooPPPPPPPPVVVVVVVVVV
.......RvvvvPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
.......VVVVVVPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
.......VVVVVVPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
.......VVVVVVPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEVVVVVVVVVV
```
Right side (looking from the right):
```
...............MM..MM..MM..MM.MMM.MMM.............
...............MMM.MMMMMMM.MMMMMMMMMMM............
...............MMM.MMMMMMM.MMMMMMMMMMM............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...............PPPPPPPPPPPPPPPPPPPPPPP............
...MM..M..M..MMPPPPPPPPPPPPPPPPPPPPLLLMM..MM..MM..
..MMM.MM.MM.MMMPPPPPPPPPLLPPPPPLLLPLLLMM.MMM.MMM.M
..MMM.MM.MM.MMMPPPPPPPPPLLLPPPPLLLPLLLMM.MMM.MMM.M
..VVVVVVVVVVVVVPPPPPPPPPLLLPPPPLLLPLLLVVVVVVVVVVVV
..VVVVVVVVVVVVVPPPPPPPPPLLLPPPPLLLPPPPVVVVVVVVVVVV
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
EEVVVVVVVVVVVVVEEEEEEEEEEEEEEEEEEEEEEVVVVVVVVVVVVV
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
PPP..MMM..MMM...........................VVVVVVVVVV
PPP..M.M..M.M...........................VVVVVVVVVV
PPPMMMMMMMMMMMM.........................VVVVVVVVVV
PPP.MM.M.MM.M.M.........................VVVVVVVVVV
PPPMMM........M.........................VVVVVVVVVV
PPP..MM.....PPPPPPPPPPPPPPPPLLLPPPPPLLPP.....PPP..
PPP..M......PPPPPPPPPPPPPPPPPPPPPPPPLLPP.....PPP..
PPPMMMM.....PPPPPPPPPPPPPPPPLLLPPPPPLPPP.....PPP..
PPP.MM......PPP.......kkkkkk.........PPP.....PPP..
PPPMMM......PPP.......kkkkkk.........PPP.....PPP..
PPP..MMPPPPPPPP.......kkkkkk.........PPP.....PPP..
PPP..M.MPPPPPPP.......kkkkkk.........LLL.....PPP..
PPP..MMPPPPPPPP........kkkkk.........LPP.....PPP..
PPP....PPP..PPP......................LPP.....PPP..
PPP....PPP..PPP......................LLL.....PPP..
PPP....PPP...........................PPP.....PPP..
PPP....PPP...........................PPP.....PPP..
PPP....PPP...........................PPP.....PPP..
PPP....PPP...........................LLL.....PPP..
PPP....PPP...........................LLL.....PPP..
PPP....PPP..PPP......................LLL.....PPP..
PPP....PPP..PPP......................PPP.....PPP..
PPP....PPPPPPPP......................PPP.....PPP..
PPP....PPPPPPPP......................PPP.....PPP..
PPP....PPPPPPPP......................PPP.....PPP..
PPP.........PPPPPPPPLLLPPPLLLPPPPPPPPLPP.....PPP..
PPP.........PPPPPPPPLLLPPPLLLPPPPPPPPLPP.....PPP..
PPP..........PPPPPPPLLLPPPLLLPPPPPPPPLLLVVVVVPPVVV
PPP.....................................VVVVVVVVVV
PPP.....................................VVVVVVVVVV
PPP.....................................VVVVVVVVVV
PPP.....................................VVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
PPPPPPPPPPPPPPPPPPPPVVVVVVVVVVVVVPPPPPPPVVVVVVVVVV
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
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPP......................PPP..........
............PPP......................PPP..........
............PPP......................PPP..........
............LLL......................PPP..........
............LLL......................PPP..........
............LLL......................PPP..........
............PPP......................LLL..........
.....................................LLL..........
.....................................LLL..........
.....................................PPP..........
.....................................PPP..........
.....................................PPP..........
............PPP......................PPP..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................LLL..........
............PPP......................PPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
............PPPPPPPPPPPPPPPPPPPPPPPPPPPP..........
.............PPPPPPPPPPPPPPPPPPPPPPPPPPPtttttttttt
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0000000000000000000000000000000000000000mmmkmmmkmm
EEEEEmmmEEmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmMVVVVVVVVV   0000000000000000000000000000000000000000mkkkkkkkkk
EEEEEmmmEEmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmMVVVVVVVVV   0000000000000000000000000000000000000000mkkkkkkkkk
EEEEEmmmEEmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmVVVVVVVVVV   0000000000000000000000000000000000000000kkkkkkkkkk
EEEEEmmmEEmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmVVVVVVVVVV   0000000000000000000000000000000000000000mkkkkkkkkk
EEEEEmmPEEmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmMVVVVVVVVV   bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbmkkkkkkkkk
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV   bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbkkkkkkkkkk
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPVVVVVVVVVV   bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbmkkkkkkkkk
PPPmMcccMMccccccccccccccccccccccccccccccMVVVVVVVVV   bbb5500555000000000000000000000000000000mkkkkkkkkk
PPPmmcccmmccccccccccccccccccccccccccccccVVVVVVVVVV   bbb0500505000000000000000000000000000000kkkkkkkkkk
PPPMMccMMMccccccccccccccccccccccccccccccVVVVVVVVVV   bbb5555555555000000000000000000000000000mkkkkkkkkk
PPPmmMmMmmMmMcccccccccccccccccccccccccccMVVVVVVVVV   bbb0550505505000000000000000000000000000mkkkkkkkkk
PPPmPPmPmMMmMcccccccccccccccccccccccccccMVVVVVVVVV   bbb2252555555000000000000000000000000000mmmkmmmkmm
PPPPPPPPMMcccMMPPMMPPMMPPMPMPPMMPPMMPPMMcccccPPPEE   bbb222225500wwwtwwwtwwwtwwwwtwwwtwwwtwww00000bbb00
PPPmmPmPmmcccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPEE   bbb022020500wttttttttttttttttttttttttttw00000bbb00
PPPPPPPPMMccMPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPEE   bbb222225555wttttttttttttttttttttttttttw00000bbb00
PPPmmMmMmmMmMPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb055050550ttwssssssssssssssssssssssttt00000bbb00
PPPmMMmMmMMmMPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb555555555wtwssssssssssssssssssssssttw00000bbb00
PPPMMcccMMcccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb550055500wttssssssssssssssssssssssttw00000bbb00
PPPmmcccmmcccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb050050500ttwssssxsssssssssssssssssttw00000bbb00
PPPMMccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb5500fffffwtwssssxsssssssssssssssssttt00000bbb00
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000fffffwtwssssxsssssssssssssssssttw00000bbb00
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffggftttssssssssssssssssssssssttw00000bbb00
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffggfwtwssssssssssssssssssssssttw00000bbb00
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffggfwtwssssssssssssssssssssssttt00000bbb00
PPPccccRRRRRRMMFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffgggwwwssssssssssssssssssssssttw00000bbb00
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffggggffssssssssssssssssssssssttw00000bbb00
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffgggggfssssssssssssssssssssssttw00000bbb00
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffgggggfssssssssssssssssssssssttt00000bbb00
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffggggffssssssssssssssssssssssttw00000bbb00
PPPccccRRRRRRRRFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffgggwwwssssssssssssssssssssssttw00000bbb00
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffggfwtwssssssssssssssssssssssttw00000bbb00
PPPccccRRRRRRPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccPPPEE   bbb0000ffggftttssssssssssssssssssssssttt00000bbb00
PPPccccRRRRRRPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPEE   bbb0000ffggfwttttttttttttttttttttttttttw00000bbb00
PPPccccRRRRRRPPPPPPPPPPPPPPPPPPPPPPPPPPPcccccPPPEE   bbb0000fffffwttttttttttttttttttttttttttw00000bbb00
PPPccccRRRRRRMMPcMMPnMMPnMnMPnMMPcMMPcMMcccccPPVEE   bbb0000fffffwwwtwwwtwwwtwwwwtwwwtwwwtwwwmmmkmmmkmm
PPPcccccccccccccccccnnnnnnnnnnnnncccccccMVVVVVVVVV   bbb0000000000000000000000000000000000000mkkkkkkkkk
PPPcccccccccccccccccnnnnnnnnnnnnncccccccMVVVVVVVVV   bbb0000000000000000000000000000000000000mkkkkkkkkk
PPPcccccccccccccccccnnnnnnnnnnnnncccccccVVVVVVVVVV   bbb0000000000000000000000000000000000000kkkkkkkkkk
PPPcccccccccccccccccnnnnnnnnnnnnncccccccVVVVVVVVVV   bbb0000000000000000000000000000000000000mkkkkkkkkk
PPPcccccccccccccccccnnnnnnnnnnnnncccccccMVVVVVVVVV   bbbbbbbbbbbbbbbbbbbbjjjgjjgjjgjjjbbbbbbbmkkkkkkkkk
PPPPPPPPPPPPPPPPPPPPMVVVVVVVVVVVMPPPPPPPMVVVVVVVVV   bbbbbbbbbbbbbbbbbbbbjgggggggggggjbbbbbbbmkkkkkkkkk
PPPPPPPPPPPPPPPPPPPPMVVVVVVVVVVVMPPPPPPPVVVVVVVVVV   bbbbbbbbbbbbbbbbbbbbjjjgjjgjjgjjjbbbbbbbkkkkkkkkkk
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEVVVVVVVVVV   0000000000000000000000000000000000000000mkkkkkkkkk
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEMVVVVVVVVV   0000000000000000000000000000000000000000mkkkkkkkkk
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEMVVVVVVVVV   0000000000000000000000000000000000000000mkkkkkkkkk
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEVVVVVVVVVV   0000000000000000000000000000000000000000kkkkkkkkkk
EEEEEEEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEVVVVVVVVVV   0000000000000000000000000000000000000000mkkkkkkkkk
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   mkmmmkmmmkmmm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmEEmmmEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmEEmmmEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVVmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmEEmmmEE   kkkkkkkkkkkkk0000000000000000000000000000000000000
VVVVVVVVVVVVmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmEEmmmEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMmmmmmmmmmmmmmmmmmmmmmmmmmmmmmPEEmmPEE   kkkkkkkkkkkkmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkkbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVMccccccccccccccccccccccccccccccMMcccMP   kkkkkkkkkkkkm0000000000000000000000000000055500552
VVVVVVVVVVVVVccccccccccccccccccccccccccccccmmcccmm   kkkkkkkkkkkkk0000000000000000000000000000050500502
VVVVVVVVVVVVccccccccccccccccccccccccccccccMMMccMMP   kkkkkkkkkkkkm0000000000000000000000000005555555555
VVVVVVVVVVVVMcccccccccccccccccccccccccccMmMmmMmMmm   kkkkkkkkkkkkm0000000000000000000000000005050550502
VVVVVVVVVVVVMcccccccccccccccccccccccccccMmMmPPmPmP   mkmmmkmmmkmmm0000000000000000000000000005555252522
EEEEEPPPcccccMMPPMMPPMMPPMPMPPMMPPMMPPMMcccMPPPPPP   00000bbb0000wwwtwwwtwwwtwwwwtwwwtwwwtwww0055522222
EEEEEPPPcccccPPPPPPPPPPPPPPPPPPPPPPPPPPPcccmmPmPmm   00000bbb0000wttttttttttttttttttttttttttw0050220202
EEEEEPPPcccccPPPPPPPPPPPPPPPPPPPPPPPPPPPccMMPPPPPP   00000bbb0000wttttttttttttttttttttttttwtw5555522222
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPMmMmmMmMmm   00000bbb0000tttssssssssssssssssssssssttt5050550502
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPMmMmMMmMmP   00000bbb0000wttssssssxssssssssssssssswtw5555555552
EEEEEPPPcccccPPFFFFFFRFFFFFFFFFFFFFFFFPPcccMMcccMP   00000bbb0000wttssssssxssssssssssssssswtw0055500555
EEEEEPPPcccccPPFFFFFFRFFFFFFFFFFFFFFFFPPcccmmcccmm   00000bbb0000wttssssssxssssssssssssssswtw0050500505
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccMMcccMM   00000bbb0000tttssssssssssssssssssssssttt0055500555
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccccccc   00000bbb0000wttsssssssssssssssssssssswtw0000000000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPcccccccccc   00000bbb0000wttsssssssssssssssssssssswtwfffff00000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssswtwffffff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssstttffggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssswtwffggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPPRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssswtwffggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFPMRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssswwwffggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssssfffgggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssffggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssfgggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000wttsssssssssssssssssssssssffggggff0000
EEEEEPPPcccccPPFFFFFFFFFFFFFFFFFFFFFFFRRRRRRRRcccc   00000bbb0000tttsssssssssssssssssssssssfffgggff0000
EEEEEPPPcccccPPMPPMMPPMMPPMMPPMMPPMMPPMMRRRRRRcccc   00000bbb0000wttwtwwwtwwwtwwwtwwwtwwwtwwwffggff0000
EEEEEPPPcccccPPPPPPPPPPPPPPPPPPPPPPPPPPPRRRRRRcccc   00000bbb0000wttttttttttttttttttttttttttwffggff0000
EEEEEPPPcccccMMPcMMPnMMPnMnMPnMMPcMMPcMMRRRRRRcccc   00000bbb0000wwwtwwwtwwwtwwwwtwwwtwwwtwwwfgggff0000
EEEEEPPPccccccccccccnnnnnnnnnnnnncccccccRRRRRRcccc   00000bbb0000000000000000000000000000000ffgggff0000
EEEEEPPPccccccccccccnnnnnnnnnnnnncccccccRRRRRRcccc   00000bbb0000000000000000000000000000000fffffff0000
VVMMVVMMVVMMMcccccccnnnnnnnnnnnnncccccccRRRRRccccc   mkmmmkmmmkmmm000000000000000000000000000fffff00000
VVVVVVVVVVVVMcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVccccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVVcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkk0000000000000000000000000000000000000
VVVVVVVVVVVVMcccccccnnnnnnnnnnnnnccccccccccccccccc   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVMPPPPPPPMMVVMVVMVVMMMPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkmbbbbbbbjjjgjjgjjgjjjbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVPPPPPPPPMVVVVVVVVVVVMPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkmbbbbbbbjgggggggggggjbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVVPPPPPPPMMrVMrVMrVMMMPPPPPPPPPPPPPPPPP   kkkkkkkkkkkkkbbbbbbbjjjgjjgjjgjjjbbbbbbbbbbbbbbbbb
VVVVVVVVVVVVMEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
VVVVVVVVVVVVEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   kkkkkkkkkkkkm0000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.38 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 159 nodi, 542 passi, finito in 380 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=prato, s=vano scala, h=pavimento del mastio, w=fondazione del mastio, a=corpo di guardia, v=muro del corpo di guardia, c=cortile, d=soglia del mastio, W=base delle mura, t=base della torre, n=lastricato, G=soglia del portone, r=strada, Q=pozzo, m=acqua del fossato, P=pietra chiara, Z=Z, F=solaio in legno, T=scala, k=gradini in legno, L=finestra, R=tetto in coppi, K=torretta, V=pietra scura, M=merlatura, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), O=porta in legno, o=assi della porta.
Alla fine: P 86512, V 52405, F 3137, L 2828, k 2720, M 2328, c 1925, E 1425, h 1375, W 1225, t 1000, w 850, R 790, m 785, n 250, r 250, v 200, s 200, a 150, G 125, o 121, O 4.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-44 all×29, one×4, prl×1: 410 celle x0-19 y1-19 z0, passi 2-50
   #48 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 51
#50-51 all×2: 34000 celle x25-79 y30-74 z0-20, passi 52-71
#52-53 all×2: 34000 celle x25-79 y30-74 z20-40, passi 72-91
    #54 all . w → w Z passi=12: ×12, 20400 celle x25-79 y30-74 z40-52, passi 92-103, w→Z 10200, .→w 10200
    #55 all . w → w P passi=13: ×13, 22100 celle x25-79 y30-74 z52-65, passi 104-116, w→P 11050, .→w 11050
#56-58 prl×1, all×2: 13250 celle x25-79 y30-74 z0-66, passi 117-148
    #59 all . h → h . passi=31: ×31, 85250 celle x30-74 y35-69 z0-31, passi 149-179, h→. 42625, .→h 42625
    #60 all . h → h F (+1) passi=1: ×1, 3150 celle x30-74 y35-69 z31-32, passi 180, h→F 1375, .→h 1375, s→F 200, .→s 200
      r1 . h → h F ×1375; r2 . s → s F ×200
    #61 all . h → h . (+1) passi=31: ×31, 97650 celle x30-74 y35-69 z32-63, passi 181-211, h→. 42625, .→h 42625, s→. 6200, .→s 6200
      r1 . h → h . ×42625; r2 . s → s . ×6200
#62-69 prl×3, all×5: 24325 celle x15-74 y35-69 z0-64, passi 212-278
    #70 all . W → W P passi=23: ×23, 56350 celle x0-94 y15-89 z0-23, passi 279-301, W→P 28175, .→W 28175
#71-73 prl×2, all×1: 10100 celle x0-94 y15-89 z0-36, passi 302-338
    #74 all . t → t V passi=43: ×43, 86000 celle x80-99 y5-99 z0-43, passi 339-381, t→V 43000, .→t 43000
#75-151 prl×8, all×18, one×1: 24974 celle x0-99 y5-99 z0-72, passi 382-521
#152-159 prl×2, all×5, one×1: 20476 celle x14-79 y30-74 z8-51, passi 522-542
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#26 all cEEEEE → *ccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#27 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all cEEEEEE → *ccc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#29 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all EEE/EEE/EEW → ***/***/*t*: le celle cercate c'erano, ma mai disposte come nel pattern
#45 all [Wt]E/*m → **/*m: le celle cercate c'erano, ma mai disposte come nel pattern
#46 all mE/*m → *m/**: le celle cercate c'erano, ma mai disposte come nel pattern
#79 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#80 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#81 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#82 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
… e altri 42
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
      <!-- Central Keep (mastio) interior: 4 behind H, 3 in front (+1 by chance), 4 to each side -> 9 wide, 8-9 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
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

      <!-- Well in the courtyard where a 4x4 patch of courtyard is free (fits at Huge+) -->
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

      <!-- Moat around the curtain wall where at least 4 cells of ground remain (fits at Huge+) -->
      <all in="cWEEEE" out="**mm**" steps="1"/>
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
        <!-- Keep walls (w): 2 storeys = 64 + 1 parapet = 65 -->
        <all in="B w" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w P" steps="12"/>
        <prl in="B w" out="P *"/>

        <!-- Keep doorway (d): seed O at z=1 (through full wall thickness), then wall P above it up to 65 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d P" steps="7"/>
        <all in="B d" out="d Z" steps="12"/>
        <all in="B d" out="d P" steps="12"/>
        <all in="B d" out="d P" steps="8"/>
        <all in="B d" out="d Z" steps="12"/>
        <all in="B d" out="d P" steps="12"/>
        <prl in="B d" out="P *"/>

        <!-- Keep interior (h) and stair zone (s): 2 covered storeys (z=1..31, slab at 32, z=33..63, roof slab at 64) -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B s" out="s B" steps="30" symmetry="()"/>
        <all in="B h" out="h B" steps="31" symmetry="()"/>
        <all steps="1" symmetry="()">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31" symmetry="()">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl symmetry="()">
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

        <!-- Gatehouse (G): seed O at z=1 (through full wall thickness), then wall V above it up to 36 -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G V" steps="34"/>
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

        <!-- 2. Internal doorway between keep (h) and side annex (a): place O at z=1 in shared wall -->
        <one in="hwwwwva PPPPPVB" out="******* *OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/P" out="*/O" symmetry="(y)" steps="5"/>
        <all in="O/V" out="*/O" symmetry="(y)" steps="5"/>

        <import file="part-door"/>

        <!-- 3. Battlements and arrow slits on keep, curtain wall, gatehouse, towers -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 4. Windows in the Z bands of the keep and annex -->
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
