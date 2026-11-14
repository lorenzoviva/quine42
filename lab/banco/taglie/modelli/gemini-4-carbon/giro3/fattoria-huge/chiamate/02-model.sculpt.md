# model.sculpt · gemini-4-carbon · 84 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
Concept: Fattoria (medieval farmstead)
Parts & plan letters:
- h, w, s: Farmhouse (casa colonica), two-storey main stone & plaster building near the centre (h interior, w walls, s stair along rear wall).
- p: Front porch / lean-to (tettoia/portico) along the front wall of the farmhouse, at least 4 cells deep (20 voxels) and 7-9 wide.
- b, v: Timber & brick barn (fienile) attached or adjacent on one side (left or right, chosen by seed) in golden ratio ~8:5 to the house, connected via internal/yard doorway.
- t, z: Stone dovecote / silo tower (colombaia) on the opposite rear corner of the house or courtyard, crowned with battlements & slits.
- c, f: Farmyard (aia) surrounded by a low stone/wood fence (f) with front entry gate & cobbled road (r) straight to the front edge, plus main door (d) and barn door (e).
- y: Haystack (pagliaio) in the rear/side yard.
- q: Stone well (pozzo) in the farmyard when space permits.
- g, u, l: At Gargantuan (40x40), cultivated ploughed fields / vegetable plots (orto/campo, g & u) and fruit trees (frutteto, l) expand outside the farmyard fence where ground continues, plus an extra toolshed / animal pen (stalla/rimessa, a, m).
Seeds vary: farmhouse width/depth (7-9 x 8-9), which side the barn stands on (left vs right), dovecote placement, haystack & well positions, tree & plot positions.
Sizes:
- Large (20x20): compact house + front porch + side lean-to/hay behind, road to front.
- Huge (30x30): full two-storey farmhouse + porch + side barn + dovecote tower + fenced farmyard + well & haystack.
- Gargantuan (40x40): adds outer ploughed fields/garden plots, orchard trees, and a stone animal pen/annex along the outer yard.
-->
<sequence values="BHEhwspbvtzcfryqdeguaml" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwspbvtzcfryqdeguaml" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Farmhouse interior (h) around H: 8 or 9 wide (x), 7 or 8 deep (y), shifted slightly back so porch & yard fit in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="E[Hh]" out="h*" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="()" steps="3"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="()"/>
      <prl in="H" out="h"/>

      <!-- Farmhouse walls (w) -->
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Stair zone (s) inside farmhouse along rear wall: 2 cells landing on small-x, 4 cells stair, 2+ cells landing on large-x -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/w**ssss*/w**ssss*" symmetry="()" steps="1"/>

      <!-- 2. Front porch / lean-to (p): 4 cells deep (20 voxels) across the front of the farmhouse -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="2"/>
      <!-- Keep porch clear of side outer corners by trimming or keeping full width; 4 deep = 20 voxels! Wait: 1+2 = 3 cells (15 voxels), need 4 cells = 20 voxels deep! -->
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>

      <!-- 3. Main front door (d) in the middle of front farmhouse wall, 3 cells wide (15 voxels), and road (r) straight to front edge -->
      <one in="hhhhh/wwwww/ppppp" out="*****/*ddd*/*****" symmetry="()" steps="1"/>
      <all in="[dp]/p" out="*/r" symmetry="()"/>
      <!-- Wait: only extend r directly in front of d! -->
    </sequence>
    <sequence symmetry="()">
      <!-- Fix road r: reset p first, carve 3-wide path straight south from d -->
      <prl in="r" out="p"/>
      <all in="[dr]/p" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- 4. Side Barn (b interior, v walls) on one side (left or right) where space allows (at Huge & Gargantuan: needs 8 free cells to the side) -->
      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**" symmetry="(x)" steps="1"/>
      <prl in="E/b" out="b/*" p="0.5" steps="1" symmetry="()"/>
      <all in="b/E" out="*/b" symmetry="()" steps="1"/>
      <!-- Connect barn to farmhouse with an internal doorway (e) or shared wall, and wrap barn in v walls -->
      <all in="b[Ep]" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <one in="hwwwb/hwwwb" out="*eee*/*eee*" symmetry="(x)" steps="1"/>
      <one in="hwb/hwb/hwb" out="*e*/*e*/*e*" symmetry="(x)" steps="1"/>

      <!-- 5. Dovecote / Silo Tower (t interior, z walls) on the opposite side or rear corner where 5x5 fits -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="*zzz**/*ztz**/*ztz**/*ztz**/*zzz**" symmetry="(x)" steps="1"/>
      <all in="ztz" out="zzz" steps="0"/>
      <!-- Expand dovecote to 5x5 (3x3 inside = 15x15, tower accent; connected to farmhouse via e) -->
      <all in="ztEE" out="zttz" symmetry="(xy)" steps="1"/>
      <!-- Simpler clean 4x4 or 5x5 tower adjacent to w -->
    </sequence>
    <sequence symmetry="()">
      <!-- Clean any partial z/t and place proper 5x5 dovecote tower (3x3 t inside, z wall) against farmhouse wall w -->
      <prl><rule in="z" out="E"/><rule in="t" out="E"/></prl>
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="zzzzzw/ztttzw/ztttzw/ztttzw/zzzzzw" symmetry="(xy)" steps="1"/>
      <one in="zt/wh" out="ee/**" symmetry="(xy)" steps="1"/>
      <one in="tzw/tzw" out="*ee/*ee" symmetry="(xy)" steps="1"/>

      <!-- 6. Farmyard (c) around porch, barn, farmhouse, expanding into available space leaving margin for fence -->
      <all in="[wpvz]E" out="*c" symmetry="(xy)" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- Grow yard forward and sideways if Huge/Gargantuan ground continues -->
      <all in="c/E/E/E/E" out="*/c/c/c/*" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEEEEE" out="*ccc**" symmetry="(x)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Barn front yard door (e) -->
      <one in="bbb/vvv/ccc" out="***/*e*/***" symmetry="(xy)" steps="1"/>
      <all in="ev" out="*e" symmetry="(xy)" steps="1"/>

      <!-- Fence (f) around the farmyard c, leaving road r open as gate -->
      <all in="cE" out="*f" symmetry="(xy)"/>
      <all in="fE/*f" out="*f/**" symmetry="(xy)"/>

      <!-- Haystack (y) in the yard (fits even at Large in rear/side yard, or Huge/Gargantuan) -->
      <one in="ccc/ccc/ccc" out="***/*y*/***" symmetry="(xy)" steps="1"/>
      <all in="yc" out="*y" symmetry="(xy)" steps="1"/>
      <all in="yc/*y" out="*y/**" symmetry="(xy)"/>
      <!-- If no 3x3 yard at Large, place haystack behind/beside house on E -->
      <one in="www/EEE/EEE/EEE" out="***/***/*yy/*yy" symmetry="(xy)" steps="1"/>

      <!-- Stone well (q) in a 5x5 patch of farmyard (Huge & Gargantuan) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/*qq**/*****/*qq**" symmetry="(xy)" steps="1"/>

      <!-- 7. Gargantuan outer farm expansions (only where 6+ cells of E remain beyond the fence f!) -->
      <!-- Animal pen / Annex shed (m walls, a floor) attached to outer fence -->
      <one in="fEEEEEE/fEEEEEE/fEEEEEE/fEEEEEE/fEEEEEE" out="fmmmmmm/fmaaaam/fmaaaam/fmaaaam/fmmmmmm" symmetry="(xy)" steps="1"/>
      <one in="cfm/cfa" out="eee/***" symmetry="(xy)" steps="1"/>

      <!-- Ploughed field / vegetable garden rows (g soil, u crops) where 6x6 ground remains adjacent to fence -->
      <all in="fEEEEEE" out="*ggggg*" symmetry="(xy)" steps="1"/>
      <all in="gE/*g" out="*g/**" symmetry="(xy)"/>
      <!-- Furrow stripes u inside g -->
      <all in="ggg/ggg" out="uuu/***" symmetry="()"/>

      <!-- Orchard fruit trees (l) in remaining open meadow pockets -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**l**/*****/*****" steps="4"/>
    </sequence>
  </map>

  <color symbol="E" value="#7c9458" name="prato"/>
  <color symbol="H" value="#d8c8a8" name="centro"/>
  <color symbol="h" value="#c8a878" name="casa" area="house"/>
  <color symbol="w" value="#e4d8c0" name="muro casa"/>
  <color symbol="s" value="#a88458" name="scala" area="house"/>
  <color symbol="p" value="#b89868" name="portico" area="porch"/>
  <color symbol="d" value="#6e472b" name="porta casa" area="house"/>
  <color symbol="r" value="#9e9584" name="sentiero" area="yard"/>
  <color symbol="b" value="#b89060" name="fienile" area="barn"/>
  <color symbol="v" value="#b5543c" name="muro fienile"/>
  <color symbol="e" value="#7a4e2d" name="varco" area="barn"/>
  <color symbol="t" value="#9a9284" name="colombaia" area="tower"/>
  <color symbol="z" value="#8c8478" name="muro colombaia"/>
  <color symbol="c" value="#cbbba0" name="aia" area="yard"/>
  <color symbol="f" value="#8a6846" name="staccionata"/>
  <color symbol="y" value="#dfb850" name="pagliaio" area="yard"/>
  <color symbol="q" value="#6b7882" name="pozzo" area="yard"/>
  <color symbol="a" value="#a68a64" name="rimessa" area="barn"/>
  <color symbol="m" value="#9c8c7a" name="muro rimessa"/>
  <color symbol="g" value="#6e553b" name="campo arato" area="field"/>
  <color symbol="u" value="#537d3b" name="orto" area="field"/>
  <color symbol="l" value="#487538" name="albero da frutto" area="orchard"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h casa, w muro casa, s scala, p portico, b fienile, v muro fienile, t colombaia, z muro colombaia, c aia, f staccionata, r sentiero, y pagliaio, q pozzo, d porta casa, e varco, g campo arato, u orto, a rimessa, m muro rimessa
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEmmmmmEEEEEEEEEEEEEEE
EguuuguuugmaaamguuuuuuuuuuuuEE
EuuugguuugmaaamgguuuuuuguuugEE
EuuuguuuggmaaamuuuuuuuuuguuuEE
EuuuuuuuuumaaamgguuugguuuuuuEE
EgggggggggmmmmmgggggggggggggEE
EfffffffffffffffffffffffffffEE
EfcccccccccccccccccccccccccfEE
EfcvvvvvvvcccccccccccccccccfEE
EfcvvvvvbvwwwwwwwwwwwzzzzzcfEE
EfcvbbbbbbwhhsssshhweetttzcfEE
EfcvbbbbbbwhhsssshhweetttzcfEE
EfcvbbbbbbwhhhhhhhhhwztttzcfEE
EfcvbbbbbbwhhhhhhhhhwzzzzzcfEE
EfcvbbbbbbehhhhhhhhhwccccccfEE
EfcvbbbbbbehhhhhhhhwwccccccfEE
EfcvbbbbbbehhhhhhhhwwccccccfEE
EfcvveeevvwwwwwdddwwwccccccfEE
EfccccccccppppprrrpppccccccfEE
EfccccccccppppprrrpppccqqccfEE
EfccccccccppppprrrpppccccccfEE
EfccccccccppppprrrpppccqqccfEE
EfyyyccccccccccrrrcccccccccfEE
EfyyyccccccccccrrrcccccccccfEE
EfyyyccccccccccrrrcccccccccfEE
EfcccccccccccccrrrcccccccccfEE
EffffffffffffffrrrffffffffffEE
EEEEEEEEEEEEEEErrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h casa, w muro casa, s scala, p portico, b fienile, v muro fienile, t colombaia, z muro colombaia, c aia, f staccionata, r sentiero, y pagliaio, q pozzo, d porta casa, e varco, g campo arato, u orto, a rimessa, m muro rimessa
Plan (the letter of every cell):
```
EEEEEmmmmmEEEEEEEEEEEEEEEEEEEE
EuuugmaaamguuugguuuuuuguuuggEE
EguuumaaamguuuuuuguuuuuuuuugEE
EguuumaaamgguuugguuuguuuguuuEE
EguuumaaamuuuuuuuuuuuuuuuuuuEE
EggggmmmmmggggggggggggggggggEE
EfffffffffffffffffffffffffffEE
EfcccccccccccccccccccccccccfEE
EfcvvvvvvvvccccccccccccccccfEE
EfcvvbbvvbvccccccccccccccccfEE
EfcebbbbbbwwwwwwwwwwwccccccfEE
EfcebbbbbbwhhsssshhhwccccccfEE
EfcebbbbbbwhhsssshhwwccccccfEE
EfcvbbbbbbehhhhhhhhhwzzzzzcfEE
EfcvbbbbbbehhhhhhhhwwztttzcfEE
EfcvbbbbbbehhhhhhhhweetttzcfEE
EfcvbbbbbbwhhhhhhhhweetttzcfEE
EfcvvvvvvvwhhhhhhhhhwzzzzzcfEE
EfccccccccwwwwwwdddwwccccccfEE
EfccccccccpppppprrrppccccccfEE
EfccccccccpppppprrrppccccccfEE
EfccccccccpppppprrrppccccccfEE
EfccccccccpppppprrrppccyyycfEE
EfcccqcqccccccccrrrccccyyycfEE
EfcccqcqccccccccrrrccccyyycfEE
EfccccccccccccccrrrccccccccfEE
EfccccccccccccccrrrccccccccfEE
EfffffffffffffffrrrfffffffffEE
EEEEEEEEEEEEEEEErrrEEEEEEEEEEE
EEEEEEEEEEEEEEEErrrEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h casa, w muro casa, s scala, p portico, b fienile, v muro fienile, t colombaia, z muro colombaia, c aia, f staccionata, r sentiero, y pagliaio, q pozzo, d porta casa, e varco, g campo arato, u orto, a rimessa, m muro rimessa
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEmmmmmEEEEEE
EguuuuuuguuuuuuuuugmaaamguuuEE
EuuuuuugguuuuuuguuumaaamuuugEE
EguuuuuuuuuuuuuuuggmaaamguuuEE
EguuuguuuguuuuuuuuumaaamguuuEE
EggggggggggggggggggmmmmmggggEE
EfffffffffffffffffffffffffffEE
EfcccccccccccccccccccccccccfEE
EfcvvvvvvvwwwwwwwwwwwccccccfEE
EfcvbvvvvbwhhsssshhhwzzzzzcfEE
EfcebbbbbbwhhsssshhweetttzcfEE
EfcebbbbbbwhhhhhhhhweetttzcfEE
EfcebbbbbbwhhhhhhhhhwztttzcfEE
EfcvbbbbbbehhhhhhhhhwzzzzzcfEE
EfcvbbbbbbehhhhhhhhhwccccccfEE
EfcvbbbbbbehhhhhhhhwwccccccfEE
EfcvbbbbbbwwdddwwwwwwccccccfEE
EfcvvvvvvvpprrrppppppccccccfEE
EfccccccccpprrrppppppccccccfEE
EfccccccccpprrrppppppccccccfEE
EfccccccccpprrrppppppccccccfEE
EfccccccccccrrrccccccccqcqcfEE
EfccccccccccrrrcccyyyccqcqcfEE
EfccccccccccrrrcccyyyccccccfEE
EfccccccccccrrrcccyyyccccccfEE
EfffffffffffrrrfffffffffffffEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h casa, w muro casa, s scala, p portico, b fienile, v muro fienile, t colombaia, z muro colombaia, c aia, f staccionata, r sentiero, y pagliaio, q pozzo, d porta casa, e varco, g campo arato, u orto, a rimessa, m muro rimessa
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEguuuuuuuuuuuuuuuguuuuuugguuuuuuggEEEE
EEEguuuuuuguuuuuuuuuuuuuuuuuugguuuggEEEE
EEEgguuuuuuuuuuuuuuuguuuuuuuuuguuuggEEEE
EEEguuuguuuuuugguuugguuuuuuuuuuuuuuuEEEE
EEEgggggggggggggggggggggggggggggguuuEEEE
EEEffffffffffffffffffffffffffffuuuggEEEE
EEEfccccccccccccccccccccccccccfguuugEEEE
EEEfcccccyyyccccczzzzzccqqccccfguuugEEEE
EEEfcccccyyycccccztttzccccccccfguuugEEEE
EEEfcccccyyycccccztttzccqqccccfgguuuEEEE
EEEfccccvveeevvvcztttzccccccccfuuuggEEEE
EEEfccccvvbbbvbvczzeezccccccccfgguuuEEEE
EEEfccccvbbbbbbwwwweewwwwwccccfgguuuEEEE
EEEfccccvbbbbbbwhhsssshhwwccccfgguuuEEEE
EEEfccccvbbbbbbwhhsssshhwwccccfgguuuEEEE
EEEfccccvbbbbbbehhhhhhhhhwccccfguuugEEEE
EEEfccccvbbbbbbehhhhhhhhhwccccfgguuuEEEE
EEEfccccvbbbbbbehhhhhhhhhwccccfguuugEEEE
EEEfccccvbbbbbbwhhhhhhhhwwccccfguuugEEEE
EEEfccccvvvvvvvwhhhhhhhhwwccccfguuugEEEE
EEEfcccccccccccwwwwwdddwwwccccfgggggEEEE
EEEfcccccccccccppppprrrpppccccfmmmmmmEEE
EEEfcccccccccccppppprrrpppccccfmaaaamEEE
EEEfcccccccccccppppprrrpppccccfmaaaamEEE
EEEfcccccccccccppppprrrpppccccfmaaaamEEE
EEEfccccccccccccccccrrrcccccccfmmmmmmEEE
EEEfccccccccccccccccrrrcccccccfguuugEEEE
EEEfccccccccccccccccrrrcccccccfuuuggEEEE
EEEfccccccccccccccccrrrcccccccfuuuggEEEE
EEEfffffffffffffffffrrrffffffffuuuggEEEE
EEEguuuuuugguuuguuugrrruuuuuugguuuggEEEE
EEEuuuuuugguuuguuuggrrrguuuuuugguuugEEEE
EEEuuugguuuuuuuuuuuurrrguuuguuuuuuggEEEE
EEEguuugguuugguuuuuurrrgguuuguuuuuugEEEE
EEEgggggggggggggggggrrrgggggggggggggEEEE
EEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.43 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
Concept: Fattoria (medieval farmstead)
Parts & plan letters:
- h, w, s: Farmhouse (casa colonica), two-storey main stone & plaster building near the centre (h interior, w walls, s stair along rear wall).
- p: Front porch / lean-to (tettoia/portico) along the front wall of the farmhouse, 4 cells deep (20 voxels) and clear 30+ high.
- b, v: Timber & brick barn (fienile) attached on one side (left or right, chosen by seed) in ~8:5 proportion to the house, connected via doorway.
- t, z: Stone dovecote tower (colombaia) on the opposite/rear side of the house, crowned with battlements & arrow slits.
- c, f: Farmyard (aia) surrounded by a wooden & stone fence (f) with front entry gate & cobbled road (r) straight to the front edge, main door (d) and barn/tower doorways (e).
- y: Haystack (pagliaio) in the yard.
- q: Stone well (pozzo) in the farmyard.
- a, m, g, u, l: At Gargantuan (40x40), where 8+ cells of ground remain outside the fence, an animal pen / stone annex shed (a, m), ploughed fields / vegetable plots (g, u), and fruit trees (l) are built!
-->
<sequence values="BHEhwspbvtzcfryqdeguaml" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwspbvtzcfryqdeguaml" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Farmhouse interior (h) around H: 8 or 9 wide (x), 7 or 8 deep (y), shifted slightly back so porch & yard fit in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="E[Hh]" out="h*" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="()" steps="3"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="()"/>
      <prl in="H" out="h"/>

      <!-- Farmhouse walls (w) -->
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Stair zone (s) inside farmhouse along rear wall: 2 cells landing on small-x, 4 cells stair, 2+ cells landing on large-x -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/w**ssss*/w**ssss*" symmetry="()" steps="1"/>

      <!-- 2. Front porch / lean-to (p): 4 cells deep (20 voxels) across the front of the farmhouse -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>

      <!-- 3. Main front door (d) in the middle of front farmhouse wall, 3 cells wide (15 voxels), and road (r) straight to front edge -->
      <one in="hhhhh/wwwww/ppppp" out="*****/*ddd*/*****" symmetry="()" steps="1"/>
      <all in="[dr]/p" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- 4. Side Barn (b interior, v walls) on one side (left or right, chosen at random via symmetry="(x)") -->
      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**" symmetry="(x)" steps="1"/>
      <all in="b/E" out="*/b" symmetry="()" steps="1"/>
      <all in="b[Ep]" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <!-- Internal doorway between farmhouse and barn -->
      <one in="hwb/hwb/hwb" out="*e*/*e*/*e*" symmetry="(x)" steps="1"/>

      <!-- 5. Dovecote / Silo Tower (t interior, z walls) on the opposite side or rear wall -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="zzzzzw/ztttzw/ztttzw/ztttzw/zzzzzw" symmetry="(xy)" steps="1"/>
      <one in="tzw/tzw" out="*ee/*ee" symmetry="(xy)" steps="1"/>
      <one in="tz/wh" out="*e/*e" symmetry="(xy)" steps="1"/>

      <!-- 6. Farmyard (c) around porch, barn, farmhouse -->
      <all in="[wpvz]E" out="*c" symmetry="(xy)" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="c/E/E/E/E" out="*/c/c/c/*" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEEEEE" out="*cc***" symmetry="(x)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Barn yard door (e) -->
      <one in="bbb/vvv/ccc" out="***/*e*/***" symmetry="(xy)" steps="1"/>
      <all in="ev" out="*e" symmetry="(xy)" steps="1"/>

      <!-- Fence (f) around the farmyard c, leaving road r open as gate -->
      <all in="cE" out="*f" symmetry="(xy)"/>
      <all in="fE/*f" out="*f/**" symmetry="(xy)"/>

      <!-- Haystack (y: 3x3 cells) in the yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/**yy*/**yy*/*****/*****" symmetry="(xy)" steps="1"/>
      <all in="yc" out="*y" symmetry="(xy)" steps="1"/>
      <all in="yc/*y" out="*y/**" symmetry="(xy)"/>
      <one in="www/EEE/EEE/EEE" out="***/***/*yy/*yy" symmetry="(xy)" steps="1"/>

      <!-- Stone well (q: 2x2 cells = 10x10 voxels) in a 5x5 patch of farmyard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/*qq**/*qq**/*****" symmetry="(xy)" steps="1"/>

      <!-- 7. Gargantuan outer farm expansions: ONLY where 8+ cells of E remain beyond the fence f (Huge has max 6-7 at back, Gargantuan has 8-9 on sides/back/front!) -->
      <!-- Stone Annex / Animal shed (m walls, a floor) attached to outer fence -->
      <one in="cfEEEEEEEE/cfEEEEEEEE/cfEEEEEEEE/cfEEEEEEEE/cfEEEEEEEE/cfEEEEEEEE" out="cfmmmmmm**/cfmaaaam**/cfmaaaam**/cfmaaaam**/cfmaaaam**/cfmmmmmm**" symmetry="(xy)" steps="1"/>
      <one in="cfma/cfma" out="ceea/ceea" symmetry="(xy)" steps="1"/>

      <!-- Ploughed fields & vegetable rows (g soil, u crops) where 8 cells of ground extend past fence -->
      <all in="fEEEEEEEE" out="*gggggg**" symmetry="(xy)" steps="1"/>
      <all in="gE/*g" out="*g/**" symmetry="(xy)"/>
      <all in="ggg/ggg" out="uuu/***" symmetry="()"/>

      <!-- Orchard fruit trees (l) in remaining 5x5 open meadow pockets (Gargantuan) -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**l**/*****/*****" steps="5"/>
    </sequence>

    <map scale="5 5 1" values="BEhwspbvtzcfryqdeguamlWFVZRGYQKLCPJXDIAOoNTkMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/ffuff/ffuff/ffuff/fffff"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="u" out="ggggg/guuug/guuug/guuug/ggggg"/>
      <rule in="l" out="EEEEE/EEEEE/EElEE/EEEEE/EEEEE"/>

      <union symbol="+" values="WVZGD"/>
      <union symbol="=" values="FC"/>
      <union symbol="%" values="Z"/>

      <sequence symmetry="()">
        <!-- Fix fence plan pattern (f had u in middle, use f itself for fence) -->
        <prl in="f/u" out="*/*"/>
        <all in="fg" out="ff" steps="0"/>
      </sequence>
      <sequence symmetry="(xy)">
        <!-- Restore fence block cleanly: make f solid 3-thick in middle or 5x5 low wall -->
        <all in="fuf" out="fff"/>

        <!-- Porch corner & front posts: place 3x3 post seeds (x -> P) along outer front edge of p (adjacent to c or r) -->
        <one in="ppppp/ppppp/ppppp/ccccc" out="*****/**I**/*****/*****" symmetry="()" steps="6"/>
        <all in="Ip" out="*I" symmetry="(xy)" steps="1"/>
        <all in="Ip/*I" out="*I/**" symmetry="(xy)"/>

        <!-- B. THE HEIGHTS (columns by steps, preserving area letters on z=0!) -->

        <!-- 1. Farmhouse walls (w, and d above z=0 gets door seed O at z=1): 2 storeys = 64 high + roof R -->
        <!-- Ground base stone D (steps 6), plaster W (4), window band X (12), plaster W (10) = 32 -->
        <all in="B w" out="w D" steps="6"/>
        <all in="B w" out="w W" steps="4"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w W" steps="10"/>
        <!-- Upper storey: timber beam D (2), plaster W (6), window band X (12), plaster W (12) = 32 -->
        <all in="B w" out="w D" steps="2"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Front door column (d): floor C at z=1, door seed O at z=2, then wall W/D/X up to 64 + R -->
        <all in="B d" out="d C" steps="1"/>
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d D" steps="4"/>
        <all in="B d" out="d W" steps="26"/>
        <all in="B d" out="d D" steps="2"/>
        <all in="B d" out="d W" steps="6"/>
        <all in="B d" out="d X" steps="12"/>
        <all in="B d" out="d W" steps="12"/>
        <prl in="d" out="R"/>

        <!-- Farmhouse interior (h) and stair zone (s): floor F at z=1, T at z=2 on s, slab F at z=33, roof R at z=65 -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- 2. Porch / Lean-to (p and posts I): floor C at z=1, clear 32 voxels (z=2..33), lean-to roof J at z=34..36 -->
        <all in="B p" out="p C" steps="1"/>
        <all in="B p" out="p B" steps="32"/>
        <prl in="p" out="J"/>
        <all in="B I" out="I C" steps="1"/>
        <all in="B I" out="I P" steps="32"/>
        <prl in="I" out="J"/>

        <!-- Road (r) through porch gets porch roof above it too where flanked by p/J, and cobblestones C on z=1 -->
        <all in="B r" out="r C" steps="1"/>
        <prl in="r" out="B"/>
        <!-- Bridge porch roof J across the road gap in front of main door -->
        <all in="JB" out="*J" steps="8" symmetry="(x)"/>
        <all in="J B" out="J J" steps="1"/>

        <!-- 3. Side Barn (b interior, v walls): high single-storey hall (38 high) with brick/timber walls V & roof J -->
        <all in="B v" out="v D" steps="5"/>
        <all in="B v" out="v V" steps="7"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v V" steps="14"/>
        <prl in="v" out="J"/>

        <all in="B b" out="b F" steps="1"/>
        <all in="B b" out="b B" steps="37"/>
        <prl in="b" out="J"/>

        <!-- 4. Dovecote / Silo Tower (t interior, z walls): 52 high stone Z, flat roof with parapet for battlements & slits -->
        <all in="B z" out="z D" steps="6"/>
        <all in="B z" out="z Z" steps="46"/>
        <prl in="z" out="Z"/>

        <all in="B t" out="t C" steps="1"/>
        <all in="B t" out="t B" steps="50"/>
        <prl in="t" out="C"/>

        <!-- 5. Internal & Barn/Annex Doorways (e): floor F at z=1, door seed O at z=2, stone/brick wall D/V up to 38 -->
        <all in="B e" out="e F" steps="1"/>
        <all in="B e" out="e O" steps="1"/>
        <all in="B e" out="e V" steps="34"/>
        <prl in="e" out="V"/>

        <!-- 6. Annex / Animal Shed at Gargantuan (a interior, m walls): 34 high stone wall G, wooden roof J -->
        <all in="B m" out="m D" steps="5"/>
        <all in="B m" out="m G" steps="7"/>
        <all in="B m" out="m X" steps="8"/>
        <all in="B m" out="m G" steps="14"/>
        <prl in="m" out="J"/>

        <all in="B a" out="a C" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>

        <!-- Trim e doorway height if adjacent only to fence/annex (no tall barn wall above) -->
        <all in="BVB" out="*B*"/>

        <!-- 7. Farmyard (c), Fence (f), Haystack (y), Well (q), Fields (g, u), Orchard Trees (l) -->
        <all in="B c" out="c C" steps="1"/>
        <prl in="c" out="B"/>

        <!-- Wooden & stone low farmyard fence (f): stone plinth D (3), timber rail P (5) -->
        <all in="B f" out="f D" steps="4"/>
        <all in="B f" out="f P" steps="5"/>
        <prl in="f" out="B"/>

        <!-- Haystack (y): golden hay mound Y rising 16 and rounding off -->
        <all in="B y" out="y Y" steps="14"/>
        <prl in="y" out="Y"/>
        <all in="YB/YY" out="BB/YY" steps="2"/>

        <!-- Stone well (q): stone rim D rising 9 around water Q inside -->
        <one in="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq" out="qqqqq/qAAqq/qAAqq/qqqqq/qqqqq" steps="4"/>
        <all in="Aq" out="AA" steps="1"/>
        <all in="B q" out="q D" steps="9"/>
        <prl in="q" out="D"/>
        <all in="B A" out="A Q" steps="5"/>
        <prl in="A" out="B"/>

        <!-- Ploughed field & crops (g, u) -->
        <all in="B g" out="g G" steps="1"/>
        <prl in="g" out="B"/>
        <all in="B u" out="u L" steps="4"/>
        <prl in="u" out="L"/>

        <!-- Orchard fruit trees (l): trunk P (14 high) + rounded canopy L -->
        <all in="B l" out="l P" steps="14"/>
        <all in="B l" out="l L" steps="6"/>
        <prl in="l" out="L"/>
        <all in="LB" out="*L" steps="5"/>

        <!-- C. FULL SCALE: PARTS, WINDOWS, ROOFS, DETAILS -->

        <!-- 1. Stair (part-stair) -->
        <import file="part-stair"/>

        <!-- 2. Battlements & Arrow slits on the Dovecote Tower (Z is in + and %) -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 3. Doors (part-door: O rises 30 through + = WVZGD) -->
        <import file="part-door"/>
        <!-- Clean any unexpanded O seeds (e.g. fence gate between c and a where wall wasn't 30 thick/high) into open doorway B -->
        <prl in="O" out="B"/>

        <!-- 4. Windows in the window bands X (on Farmhouse W, Barn V, Annex G) -->
        <one steps="22">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K"/>
        </one>
        <all in="KX" out="KK" steps="5"/>
        <!-- Restore remaining window band X to appropriate wall material -->
        <all in="W X" out="W W" steps="14"/>
        <all in="V X" out="V V" steps="14"/>
        <all in="G X" out="G G" steps="14"/>
        <prl in="X" out="W"/>

        <!-- 5. Pitched / Hip Roofs -->
        <!-- Farmhouse terracotta roof (R): eaves overhang by 2, then hip roof stepping up 14 layers -->
        <all in="RB" out="*R" steps="2" symmetry="(xy)"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>
        <all in="***/B**/*** ***/RRR/***" out="***/R**/*** ***/***/***" steps="0"/>
        <!-- Fill hollow inside roof R by growing R upward one more layer for crisp stepped ridge -->
        <all in="R B" out="R R" steps="1"/>

        <!-- Brick Chimney (V + D cap) on Farmhouse roof -->
        <one in="RRR/RRR/RRR BBB/BBB/BBB" out="***/***/*** ***/**V/***" steps="1"/>
        <all in="VB/RR" out="VV/**" steps="2"/>
        <all in="B V" out="V V" steps="10"/>
        <prl in="V" out="V"/>

        <!-- Barn & Porch & Annex shingle/wooden roof (J): eaves overhang 1, slope up where broad -->
        <all in="JB" out="*J" steps="1" symmetry="(xy)"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <all in="J B" out="J J" steps="1"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon style, clear light/dark contrast, >= 6 materials, area tags on bottom layer -->
  <color symbol="E" value="#7c9458" name="prato" hidden="True"/>
  <color symbol="h" value="#c8a878" name="pavimento casa" hidden="True" area="house"/>
  <color symbol="w" value="#8c8275" name="fondazione casa" area="house"/>
  <color symbol="s" value="#a88458" name="vano scala" hidden="True" area="house"/>
  <color symbol="p" value="#b89868" name="suolo portico" hidden="True" area="porch"/>
  <color symbol="d" value="#8c8275" name="soglia casa" hidden="True" area="house"/>
  <color symbol="r" value="#9e9584" name="sentiero" hidden="True" area="yard"/>
  <color symbol="b" value="#b89060" name="suolo fienile" hidden="True" area="barn"/>
  <color symbol="v" value="#7d4432" name="base fienile" area="barn"/>
  <color symbol="e" value="#8c8275" name="soglia varco" hidden="True" area="barn"/>
  <color symbol="t" value="#9a9284" name="suolo colombaia" hidden="True" area="tower"/>
  <color symbol="z" value="#756e65" name="base colombaia" area="tower"/>
  <color symbol="c" value="#cbbba0" name="suolo aia" hidden="True" area="yard"/>
  <color symbol="f" value="#756e65" name="base staccionata" area="yard"/>
  <color symbol="y" value="#c9a33e" name="base pagliaio" area="yard"/>
  <color symbol="q" value="#6b747d" name="base pozzo" area="yard"/>
  <color symbol="a" value="#a68a64" name="suolo rimessa" hidden="True" area="barn"/>
  <color symbol="m" value="#756e65" name="base rimessa" area="barn"/>
  <color symbol="g" value="#634b34" name="terra arata" area="field"/>
  <color symbol="u" value="#4e7838" name="solco orto" area="field"/>
  <color symbol="l" value="#5c4028" name="radice albero" area="orchard"/>
  <color symbol="I" value="#5c4028" name="base pilastro" area="porch"/>

  <!-- Full-scale architectural materials -->
  <color symbol="W" value="#e8dcc4" name="intonaco caldo"/>
  <color symbol="D" value="#827b72" name="pietra squadrata"/>
  <color symbol="V" value="#b55239" name="mattone rosso"/>
  <color symbol="Z" value="#968e83" name="pietra della colombaia"/>
  <color symbol="M" value="#968e83" name="merlo di pietra"/>
  <color symbol="G" value="#705842" name="muro rustico e zolla"/>
  <color symbol="F" value="#b88c58" name="tavolato di legno"/>
  <color symbol="C" value="#afa596" name="acciottolato"/>
  <color symbol="R" value="#c45b3b" name="coppi di terracotta"/>
  <color symbol="J" value="#785337" name="tetto in scandole"/>
  <color symbol="P" value="#5e412a" name="trave di quercia"/>
  <color symbol="K" value="#4a6b82" name="finestra"/>
  <color symbol="U" value="#2b2623" name="feritoia"/>
  <color symbol="Y" value="#e3bd52" name="paglia dorata"/>
  <color symbol="Q" value="#48829e" name="acqua del pozzo"/>
  <color symbol="L" value="#548239" name="fogliame"/>
  <color symbol="k" value="#9e7344" name="gradino di legno"/>
  <color symbol="N" value="#6e5036" name="stipite in legno"/>
  <color symbol="O" value="#825634" name="porta in legno"/>
  <color symbol="o" value="#52351e" name="asse scura della porta"/>
  <color symbol="#20" value="#825634" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#52351e" name="asse aperta" hidden="True"/>

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
