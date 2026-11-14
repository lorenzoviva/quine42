# model.sculpt · gemini-3.8-flash · 28 s

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

## Your program so far
<!--
  Forte: recinto murario con torri angolari, cammino di ronda, cortile interno, mastio e porta d'ingresso con strada.
  Parti del concetto:
    - h: mastio (corpo principale a due piani con scala interna)
    - w: mura del mastio
    - s: vano scala del mastio (lungo l'asse x, sale verso +x con pianerottolo)
    - c: cortile interno acciottolato
    - W: cortina muraria esterna
    - t: torri quadrangolari agli angoli della cinta
    - G: corpo di guardia / porta della cinta (3 celle di larghezza)
    - d: ingresso al mastio (allineato con la porta principale)
    - r: strada d'accesso lastricata verso l'esterno
    - Q: pozzo / cisterna nel cortile (quando c'è spazio sufficiente)
  Variazioni e semi:
    - Ampiezza e profondità del cortile crescono organicamente attorno a H
    - Il mastio varia posizione e spessore in base all'orientamento
    - A taglia Large (20x20 celle = 100x100 voxels): mastio compatto a due piani, cortile, cinta con torri angolari e porta
    - A taglia Huge (30x30 celle = 150x150 voxels): cinta più ampia, cortile esteso con pozzo e camminamenti allargati
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtGdrQiamk" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Fondazione del mastio centrale attorno a H -->
      <!-- 2 celle verso il retro, 2 verso il fronte, 3 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <!-- Vano scala all'interno del mastio: orientato lungo x (4 celle di x, 2 di y) -->
      <!-- Lascia 2 celle libere di sbarco/accesso -->
      <one in="hhhhhh/hhhhhh" out="ssss**/ssss**" symmetry="()" steps="1"/>
      <!-- Mura perimetrali del mastio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Cortile attorno al mastio: 2 celle minime di respiro -->
      <all in="wE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Espansione del cortile a taglia maggiore se c'è spazio disponibile -->
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Pozzo nel cortile se c'è un'area 3x3 libera -->
      <one in="ccc/ccc/ccc" out="***/ *Q* /***" steps="1"/>

      <!-- Cinta muraria esterna: spessore 1 cella -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari 2x2 celle su ogni angolo esterno della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Asse d'accesso: dal centro del mastio dritto verso il fronte -->
      <!-- Traccia il corridoio di uscita m verso il fronte -->
      <all in="[Hh]/[Hh]" out="*/m" symmetry="()" steps="1"/>
      <all in="m/[Hh]" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dm]/c" out="*/n" symmetry="()"/>
      <all in="[nm]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allarga l'accesso a 3 celle di larghezza (15 voxels, porta maestosa) -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Pulizia marker temporanei del corridoio -->
      <prl><rule in="m" out="h"/><rule in="n" out="c"/></prl>
    </sequence>
  </map>
  <color symbol="E" value="#4a7038" hidden="True" name="erba"/>
  <color symbol="H" value="#808080" name="centro"/>
  <color symbol="h" value="#8c8275" area="keep" name="pavimento mastio"/>
  <color symbol="w" value="#59524c" area="keep" name="muro mastio"/>
  <color symbol="s" value="#a6998a" area="keep" name="scala mastio"/>
  <color symbol="c" value="#736e65" area="courtyard" name="cortile"/>
  <color symbol="W" value="#524d47" area="courtyard" name="cortina"/>
  <color symbol="t" value="#403c37" area="tower" name="torre"/>
  <color symbol="G" value="#694b37" area="courtyard" name="porta cinta"/>
  <color symbol="d" value="#543825" area="keep" name="porta mastio"/>
  <color symbol="r" value="#948d83" area="yard" name="strada"/>
  <color symbol="Q" value="#3b6e8c" area="courtyard" name="pozzo"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento mastio, w muro mastio, s scala mastio, c cortile, W cortina, t torre, G porta cinta, d porta mastio, r strada, Q pozzo
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEtttEEEEEEEEEtttEE
EEEtttWWWWWWWWWtttEE
EEEtttWWccccccccttEE
EEEEWWWWccccccccWEEE
EEEEWWWWcQccccccWEEE
EEEEWccWcccwwwwcWEEE
EEEEWccsssshhhwcWEEE
EEEEWccsssshhhwcWEEE
EEEEWcwhhhHhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWcdddddddddcWEEE
EEEttcccccccccccttEE
EEEtttGGGGGGGGGtttEE
EEEtttrrrrrrrrrtttEE
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
```
Front (looking from the front; the sky at the top):
```
EEErrrrrEE
```
Right side (looking from the right):
```
EEEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento mastio, w muro mastio, s scala mastio, c cortile, W cortina, t torre, G porta cinta, d porta mastio, r strada, Q pozzo
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEtttEEEEEEEEEtttEE
EEEtttWWWWWWWWWtttEE
EEEttcccccccccccttEE
EEEEWcccccccccccWEEE
EEEEWccccccQccccWEEE
EEEEWcwwwwwwwwwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWccsssshhhwcWEEE
EEEEWccsssshhhwcWEEE
EEEEWccWcccddddcWEEE
EEEtttWWccccccccttEE
EEEtttWWWWGGGGGtttEE
EEEtttEEEErrrrrtttEE
EEEEEEEEEErrrrrEEEEE
EEEEEEEEEErrrrrEEEEE
EEEEEEEEEErrrrrEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
```
Front (looking from the front; the sky at the top):
```
EEEEErrrEE
```
Right side (looking from the right):
```
EEEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento mastio, w muro mastio, s scala mastio, c cortile, W cortina, t torre, G porta cinta, d porta mastio, r strada, Q pozzo
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEtttEEEEEEEEEtttEE
EEEtttWWWWWWWWWtttEE
EEEttcccccccccccttEE
EEEEWccccQccccccWEEE
EEEEWcccccccccccWEEE
EEEEWcwwwwwwwwwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWcwhsssshhwcWEEE
EEEEWcwhsssshhwcWEEE
EEEEWcddcWWcdddcWEEE
EEEttccccWWcccccttEE
EEEtttGGGWWGGGGtttEE
EEEtttrrrEErrrrtttEE
EEEEEErrrEErrrrEEEEE
EEEEEErrrEErrrrEEEEE
EEEEEErrrEErrrrEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
```
Front (looking from the front; the sky at the top):
```
EEErrErrEE
```
Right side (looking from the right):
```
EEEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento mastio, w muro mastio, s scala mastio, c cortile, W cortina, t torre, d porta mastio, Q pozzo
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEtttEEEEEEEEEEEEEtttEEEEE
EEEEEEtttWWWWWWWWWWWWWtttEEEEE
EEEEEEtttWWWWccccccccccttEEEEE
EEEEEEEWWWWWWccccccccccWEEEEEE
EEEEEEEWWWWWWccccccccccWEEEEEE
EEEEEEEWccccWcccwwwwcccWEEEEEE
EEEEEEEWccccsssshhhwcccWEEEEEE
EEEEEEEWccccsssshhhwcccWEEEEEE
EEEEEEEWcccwhhhHhhhwcccWEEEEEE
EEEEEEEWcccwhhhhhhhwcccWEEEEEE
EEEEEEEWccQwhhhhhhhwcccWEEEEEE
EEEEEEEWcccdddddddddcccWEEEEEE
EEEEEEEWcccccccccccccccWEEEEEE
EEEEEEEWcccccccccccccccWEEEEEE
EEEEEEttcccccccccccccccttEEEEE
EEEEEEtttWWWWWWWWWWWWWtttEEEEE
EEEEEEtttEEEEEEEEEEEEEtttEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
..........
```
Right side (looking from the right):
```
..........
```
How much the plans of the seeds differ: 0.23 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Forte: cinta quadrangolare con torri d'angolo, cammino di ronda e merli,
  cortile interno acciottolato con pozzo, mastio a due piani con scala (part-stair)
  e feritoie (part-slits), porta d'accesso della cinta (part-door) e porta del mastio.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtGdrQiamk" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Corpo del mastio attorno a H: 5 celle x (25 vox) e 5 celle y (25 vox) internamente -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>

      <!-- Vano scala: lungo x, largo 2 celle y, lungo 4 celle x -->
      <!-- Lascia 2 celle a ovest di sbarco/partenza -->
      <one in="hhhhhh/hhhhhh" out="**ssss/**ssss" symmetry="()" steps="1"/>

      <!-- Mura perimetrali del mastio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Cortile c attorno al mastio: 2 celle -->
      <all in="wE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Espansione cortile se c'è spazio (taglia huge) -->
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Pozzo nel cortile se c'è spazio libero -->
      <one in="ccc/ccc/ccc" out="***/ *Q* /***" steps="1"/>

      <!-- 3. Mura esterne della cinta (W) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo 2x2 celle -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- 4. Strada e porte verso il fronte (+y) dritto dal centro mastio -->
      <all in="[Hh]/[Hh]" out="*/m" symmetry="()" steps="1"/>
      <all in="m/[Hh]" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dm]/c" out="*/n" symmetry="()"/>
      <all in="[nm]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allargamento strada e passaggi a 3 celle (15 voxels) -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <prl><rule in="m" out="h"/><rule in="n" out="c"/></prl>
    </sequence>

    <!-- Ritorno alla scala voxel 5x5x1 -->
    <map scale="5 5 1" values="BEhwscWtGdrQiamkTkOoNMULFVfpP" symmetry="()">
      <!-- Terreno ed esterno -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <!-- Cortile e pozzo -->
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="Q" out="ccccc/cPPcc/cPPcc/ccccc/ccccc"/>
      <!-- Mastio: pavimento, vano scala, mura, porta -->
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <!-- Cinta esterna: mura, porta, torri -->
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>

      <sequence symmetry="(xy)">
        <!-- B. ALTEZZE DEI VOLUMI -->
        <!-- 1. Pavimentazioni a z=0: restano sul fondo come indicatore d'area -->
        <!-- Mastio piano terra (z=0 f, z=1 strip scala, z=32 solaio F, z=64 tetto R) -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>

        <!-- Cortile e strada si alzano di un basamento in pietra -->
        <all steps="1"><rule in="B c" out="c P"/><rule in="B r" out="r r"/></all>

        <!-- Pozzo: bordo in pietra alto 10 con acqua al centro -->
        <all in="B P" out="P P" steps="9"/>

        <!-- Cinta muraria (W) e Corpo di guardia (G): cammino di ronda a quota 24 -->
        <all in="B W" out="W W" steps="23"/>
        <all in="B G" out="G W" steps="23"/>
        <prl><rule in="W" out="+"/><rule in="G" out="+"/></prl>

        <!-- Torri della cinta (t): alte 40 voxels -->
        <all in="B t" out="t W" steps="39"/>
        <prl in="t" out="+"/>

        <!-- Mura del mastio (w, d): alte 64 voxels (2 piani da 32) -->
        <all in="B w" out="w w" steps="64"/>
        <all in="B d" out="d w" steps="64"/>
        <prl><rule in="w" out="+"/><rule in="d" out="+"/></prl>

        <!-- Interno mastio: piano terra (z=1..31) -->
        <!-- Posiziona il marker T della scala a z=1 nella zona s -->
        <all in="B s" out="s T" steps="1"/>
        <!-- Aria piano terra -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>

        <!-- Solaio primo piano mastio a z=32 -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>

        <!-- Primo piano mastio (z=33..63): aria -->
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>

        <!-- Tetto/piattaforma mastio a z=64 con parapetto merlato -->
        <prl><rule in="h" out="+"/><rule in="s" out="+"/></prl>

        <!-- C. DETTAGLI E INCLUSIONE PARTI -->
        <!-- Seme della porta d'ingresso principale nella cinta (G) -->
        <!-- O è largo 15 e attraversa il muro di cinta a livello del cortile -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>

        <!-- Seme della porta del mastio -->
        <all in="+/P" out="O/*" symmetry="()" steps="1"/>
        <all in="+/O" out="O/*" symmetry="()" steps="5"/>

        <!-- Unioni per le parti standard -->
        <union symbol="+" values="W+w"/>
        <union symbol="=" values="fFP"/>
        <union symbol="%" values="W+w"/>

        <!-- Import scala mastio -->
        <import file="part-stair"/>

        <!-- Import porte cinta e mastio -->
        <import file="part-door"/>

        <!-- Import merlatura sui camminamenti e torri -->
        <import file="part-battlements"/>

        <!-- Import feritoie sulle mura merlate -->
        <import file="part-slits"/>

        <!-- Finestre al primo piano del mastio (3 lati) -->
        <all in="BBB/BBB/BBB +++" out="***/***/*** LLL" symmetry="(x)" steps="3"/>
        <all in="L+++" out="*LLB" symmetry="()" steps="2"/>

        <!-- Pulizia finale -->
        <prl><rule in="L" out="B"/><rule in="+" out="W"/></prl>
      </sequence>
    </map>
  </map>

  <!-- AZIONI INTERATTIVE -->
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="B"/><rule in="o" out="B"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="B" out="O" steps="1"/></all>
  </action>

  <!-- PALETTE COLORI -->
  <color symbol="E" value="#4a7038" hidden="True" name="erba"/>
  <color symbol="r" value="#827b73" area="yard" name="strada lastricata"/>
  <color symbol="c" value="#666159" area="courtyard" name="cortile interno"/>
  <color symbol="P" value="#8c857b" name="selciato"/>
  <color symbol="W" value="#57524b" name="pietra fortezza"/>
  <color symbol="w" value="#615b54" name="pietra mastio"/>
  <color symbol="+" value="#57524b" name="pietra solida"/>
  <color symbol="M" value="#6e685f" name="merli"/>
  <color symbol="f" value="#594230" name="pavimento legno"/>
  <color symbol="F" value="#6e543d" name="solaio legno"/>
  <color symbol="k" value="#806348" name="gradini scala"/>
  <color symbol="O" value="#4a3525" name="porta"/>
  <color symbol="o" value="#3b2b1e" name="tavole porta"/>
  <color symbol="N" value="#473e35" name="stipite"/>
  <color symbol="U" value="#1c1a17" name="feritoia"/>
</sequence>
```
