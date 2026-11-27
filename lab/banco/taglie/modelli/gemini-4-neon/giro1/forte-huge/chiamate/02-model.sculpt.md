# model.sculpt · gemini-4-neon · 101 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (9.375 × 9.375 × 7.5 tiles, 16 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 9.375 × 9.375 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 500 × 500 × 160, 31.25 × 31.25 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

## Your program so far
<!--
  Forte — Composizione in pianta (Blocco 1 di 2)
  Parti e lettere:
    c, l : cortile interno (pietra e ciuffi d'erba, unione di rettangoli attorno al centro)
    W    : mura di cinta (spesse 2 celle, con camminamento in cima e merli)
    t    : torri d'angolo (5x5 su ogni angolo esterno convesso delle mura)
    G    : corpo di guardia sul lato frontale, largo 3 celle, più alto delle mura
    r    : strada esterna dritta dal corpo di guardia fino al bordo frontale
    n    : lastricato interno dal corpo di guardia alla porta del mastio
    K, i : mastio (mura K e sala interna i) nella parte arretrata del cortile
    s    : zona scala interna al mastio (4x2 lungo la parete di fondo, con pianerottolo)
    d    : porta del mastio, larga 3 celle, allineata al corpo di guardia
    b, v : caserma nel cortile (sala b e mura v), presente quando il cortile è ampio
    Q    : pozzo nel cortile, dove c'è uno spazio libero 5x5
    a    : fossato esterno alle mura, dove il terreno prosegue oltre la cinta
    g    : alberi nel terreno esterno
  Variazione tra i semi:
    - profondità del cortile e bracci laterali casuali che rompono il rettangolo
    - larghezza e profondità del mastio
    - posizione della caserma, del pozzo e degli alberi
    - trama del cortile (pietra ed erba) tramite convchain
  Adattamento alle dimensioni:
    - Huge (30x30 in pianta): mastio con scala, cortile con braccio laterale, mura di cinta, torri d'angolo, corpo di guardia e strada.
    - Gargantuan (100x100 in pianta): cortile molto più esteso con secondo braccio, caserma, pozzo, fossato attraversato dalla strada e alberi esterni.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEcWtiKsdnGrbvaQlgm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Cortile di base attorno al centro H -->
      <all in="E/[Hc]" out="c/*" symmetry="()" steps="6"/>
      <all in="[Hc]/E" out="*/c" symmetry="()" steps="6"/>
      <prl in="c/E" out="*/c" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hc]E" out="*c" symmetry="(x)" steps="6"/>

      <!-- Espansione del cortile solo dove c'è molto terreno libero (Gargantuan) -->
      <all in="cEEEEEEEEE" out="*ccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEEE" out="*cccccc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEEE" out="*cccccc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Bracci laterali casuali del cortile (unione di rettangoli, varia per seme) -->
      <one in="EEEEc/EEEEc/EEEEc/EEEEc/EEEEc" out="*****/*****/***m*/*****/*****" symmetry="(xy)" steps="1"/>
      <all in="mE" out="*m" symmetry="(xy)" steps="2"/>
      <all in="E/m" out="m/*" symmetry="()" steps="3"/>
      <all in="m/E" out="*/m" symmetry="()" steps="3"/>
      <prl in="m" out="c"/>

      <one in="EEEEEEc/EEEEEEc/EEEEEEc/EEEEEEc/EEEEEEc/EEEEEEc/EEEEEEc" out="*******/*******/*******/*****m*/*******/*******/*******" symmetry="(xy)" steps="1"/>
      <all in="mE" out="*m" symmetry="(xy)" steps="4"/>
      <all in="E/m" out="m/*" symmetry="()" steps="4"/>
      <all in="m/E" out="*/m" symmetry="()" steps="4"/>
      <prl in="m" out="c"/>

      <!-- Mura di cinta (2 celle di spessore, angoli pieni) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri 5x5 su ogni angolo esterno convesso delle mura -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Corpo di guardia frontale (3 celle) e strada fino al bordo frontale -->
      <all in="H/c" out="*/m" symmetry="()" steps="1"/>
      <all in="m/c" out="*/m" symmetry="()"/>
      <all in="[mG]/W" out="*/G" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="c"/>

      <!-- Mastio nella parte arretrata del cortile (sala almeno 8x6 + mura K) -->
      <all in="c/[Hi]" out="i/*" symmetry="()" steps="3"/>
      <all in="[Hi]/c" out="*/i" symmetry="()" steps="2"/>
      <prl in="i/c" out="*/i" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hi]c" out="*i" symmetry="(x)" steps="3"/>
      <all in="ic" out="*i" symmetry="()" steps="1"/>
      <one in="ci" out="i*" symmetry="(x)" steps="1"/>
      <all in="ic" out="*K" steps="1"/>
      <all in="Kc/*K" out="*K/**"/>

      <!-- Zona scala interna al mastio (4x2 lungo la parete nord, con pianerottolo a ovest) -->
      <one in="KKKKKKKK/Kiiiiiii/Kiiiiiii" out="********/Kiiissss/Kiiissss" symmetry="()" steps="1"/>

      <!-- Porta del mastio e lastricato interno fino al corpo di guardia -->
      <all in="H/i" out="*/m" symmetry="()" steps="1"/>
      <all in="m/i" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="i"/>
        <rule in="H" out="i"/>
      </prl>

      <!-- Caserma nel cortile dove c'è spazio libero 9x7 (Gargantuan) -->
      <one in="ccccccccc/ccccccccc/ccccccccc/ccccccccc/ccccccccc/ccccccccc/ccccccccc" out="*********/*********/**bbbbb**/**bbbbb**/**bbbbb**/*********/*********" symmetry="(xy)" steps="1"/>
      <all in="bc" out="*v" steps="1"/>
      <all in="vc/*v" out="*v/**"/>

      <!-- Pozzo in uno spazio libero 5x5 del cortile -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove il terreno prosegue oltre le mura (Gargantuan) -->
      <all in="cWWEEEEEE" out="***aa****" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Alberi sparsi nel terreno esterno (dove c'è spazio 7x7) -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***g***/*******/*******/*******" steps="6"/>

      <!-- Trama del cortile: pietra ed erba -->
      <convchain on="c" black="c" white="l" n="3" steps="6">
        <sample>cccllll/cccllll/ccclllc/llccccc/llcccll/lllccll/cllllcc</sample>
      </convchain>
    </sequence>
  </map>

  <color symbol="E" value="8A9A5B" hidden="True" name="terreno"/>
  <color symbol="H" value="E6C229" name="centro"/>
  <color symbol="c" value="C2B280" area="courtyard" name="cortile"/>
  <color symbol="l" value="93A864" area="courtyard" name="erba del cortile"/>
  <color symbol="W" value="7E8287" area="wall" name="mura di cinta"/>
  <color symbol="t" value="5E6368" area="tower" name="torre"/>
  <color symbol="K" value="6C7075" area="keep" name="mura del mastio"/>
  <color symbol="i" value="D4B483" area="keep" name="sala del mastio"/>
  <color symbol="s" value="A67C52" area="keep" name="scala del mastio"/>
  <color symbol="d" value="6E472B" area="keep" name="porta del mastio"/>
  <color symbol="G" value="8C3B2B" area="gatehouse" name="corpo di guardia"/>
  <color symbol="n" value="B0A490" area="courtyard" name="lastricato"/>
  <color symbol="r" value="C7B299" area="road" name="strada"/>
  <color symbol="b" value="C9A87C" area="barracks" name="caserma"/>
  <color symbol="v" value="787C82" area="barracks" name="mura della caserma"/>
  <color symbol="Q" value="4F86C6" area="courtyard" name="pozzo"/>
  <color symbol="a" value="3B7A9E" area="moat" name="fossato"/>
  <color symbol="g" value="4A7C3F" area="grounds" name="albero"/>
  <color symbol="m" value="D95D39" name="marcatore"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, c cortile, W mura di cinta, t torre, i sala del mastio, K mura del mastio, s scala del mastio, d porta del mastio, n lastricato, G corpo di guardia, r strada, b caserma, v mura della caserma, a fossato, Q pozzo, l erba del cortile
Plan (the letter of every cell):
```
EEWWWlllccWWWWWWWWWWWWccWWWWWE
EEWWWlllllWWWWWWWWWWWWcllWWWWE
EEWWWcllllWWWWWWWWWWWWcllcWWWE
EEWWWcllllWWWWWWWWWWWWcccccWWE
EEWWccllllcccccccccccclllccWWE
EEWWcccllccccccvvvvvvvlllccWWE
EEWWcccllccccccvbbbbbvlllllWWE
EEWWcllllcllcccvbbbbbvlllllWWE
EEWWcllllQcccllvbbbbbvlllllWWE
EEWWcccllccccllvvvvvvvlllllWWE
EEWWcccllccccccccllcccllcllWWE
EEWWlllllcKKKKKKKKKKKcllcllWWE
EEWWlllcccKKiiissssiKccllcWWWE
EEWWcllcccKKiiissssiKccllWWWWE
EEWWcllcllKKiiiiiiiiKcccWWWWWE
EEWWcllcllKiiiiiiiiiKllWWWWWWE
EEWWccccllKKiiiiiiiiKcWWWWWWWE
EEWWcllcllKKiiiiiiiiKcWWWWWWWE
EEWWcllcllKKiiiiiiiiKcWWWWWWWE
EEWWccccllKKKKdddKKKKcWWWWWWWE
EEWWccclllccccnnnlllllWWWWWWWE
ttttccclllccllnnnlllllWWWWtttt
tttttWWWWWWWWWGGGWWWWWWWWWtttt
tttttWWWWWWWWWGGGWWWWWWWWWtttt
tttttaaaaaaaarrrrraaaaEEEEtttt
tttttaaaaaaaarrrrraaaaEEEEtttt
EEEEEEEEEEEEErrrrrEEEEEEEEEEEE
EEEEEEEEEEEEErrrrrEEEEEEEEEEEE
EEEEEEEEEEEEErrrrrEEEEEEEEEEEE
EEEEEEEEEEEEErrrrrEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, c cortile, W mura di cinta, t torre, i sala del mastio, K mura del mastio, s scala del mastio, d porta del mastio, n lastricato, G corpo di guardia, r strada, b caserma, v mura della caserma, Q pozzo, l erba del cortile
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEtttt
EEEEEEEEEEEEEEEEEEEEEEEEEEtttt
WWWWWWWWWWWWWWWWWWWWWWWWWWtttt
WWWWWWWWWWWWWWWWWWWWWWWWWWtttt
WWWWcccccllcccccccclllWWWWtttt
WWWWccvvvvvvvcccccclllWWWWWWWE
WWWlllvbbbbbvccQccccllWWWWWWWE
WWclllvbbbbbvlllccccccWWWWWWWE
WccllcvbbbbbvlllllcccccWWWWWWE
WccllcvvvvvvvlllllcccllcWWWWWE
WccccclllccccllccccccllccWWWWE
WccccclllcKKKKKKKKKKKcccccWWWE
WcccccllllKKiiissssiKccllccWWE
WcccclllllKKiiissssiKccllccWWE
WllccllcccKKiiiiiiiiKcccllcWWE
WWcllcccccKKiiiiiiiiKcccllcWWE
WWWllcclllKiiiiiiiiiKcclllcWWE
WWWWccclllKKiiiiiiiiKcclllcWWE
WWWWccccllKKKKdddKKKKcccllcWWE
WWWWlllcccllccnnnccclccclllWWE
WWWWlllcccllllnnnccccclllllWWE
WWWWlllcccccllnnncccccllccWWWE
WWWWWWWWWWWWWWGGGWWWWWcccWWWWE
WWWWWWWWWWWWWWGGGWWWWWccWWWWWE
WWWWWWWWWWWWWWGGGWWWWWcWWWtttt
WWWWWWWWWWWWWWGGGWWWWWWWWWtttt
WWWWWWWWWWWWWWGGGWWWWWWWWWtttt
EEEEEEEEEEEEErrrrrEEEEEEEEtttt
EEEEEEEEEEEEErrrrrEEEEEEEEtttt
EEEEEEEEEEEEErrrrrEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, c cortile, W mura di cinta, i sala del mastio, K mura del mastio, s scala del mastio, d porta del mastio, n lastricato, b caserma, v mura della caserma, a fossato, Q pozzo, l erba del cortile
Plan (the letter of every cell):
```
EEWWWWWcccccWWWWWWWWWWWWEEEEEE
EEWWWWWllcllWWWWWWWWWWWWEEEEEE
EEWWWWWllcllWWWWWWWWWWWWEEEEEE
EEWWWWWcccllWWWWWWWWWWWWEEEEEE
EEWWcccccclllccllcccllWWaaEEEE
EEWWcccccclllccllcccllWWaaEEEE
EEWWlvvvvvlllcccccQcccWWaaEEEE
EEWWlvbbbvccccccccllccWWaaEEEE
EEWWcvbbbvccllllccllccWWaaEEEE
EEWWcvbbbvccllllclllccWWaaEEEE
EEWWcvbbbvccllllclllccWWaaEEEE
EEWWcvbbbvcKKKKKKKKKKKWWEEEEEE
EEWWcvvvvvcKiiissssiKKWWEEEEEE
EEWWlllccccKiiissssiiKWWEEEEEE
EEWWlllccllKiiiiiiiiKKWWEEEEEE
EEWWlllllccKiiiiiiiiKKWWEEEEEE
EEWWcccllccKiiiiiiiiKKWWEEEEEE
EEWWcccllllKiiiiiiiiKKWWEEEEEE
EEWWcccccllKKKdddKKKKKWWEEEEEE
EEWWcccccllcccnnnllcllWWaaEEEE
EEWWclcccllcllnnnllcllWWaaEEEE
EEWWclccccccllnnnllcccWWaaEEEE
EEWWWWWWWWWWllnnnlllcWWWEEEEEE
EEWWWWWWWWWWllnnnlllcWWWEEEEEE
EEWWWWWWWWWWllnnnccllWWWEEEEEE
EEWWWWWWWWWWllnnnccllWWWEEEEEE
EEWWWWWWWWWWccnnnllccWWWEEEEEE
EEWWWWWWWWWWWcnnnllcWWWWEEEEEE
EEWWWWWWWWWWWWnnnllWWWWWEEEEEE
EEWWWWWWWWWWWWWnncWWWWWWEEEEEE
```
### gargantuan, seed 1: grid 100×100×160, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, c cortile, W mura di cinta, t torre, i sala del mastio, K mura del mastio, s scala del mastio, d porta del mastio, n lastricato, G corpo di guardia, r strada, b caserma, v mura della caserma, a fossato, Q pozzo, l erba del cortile, g albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEtttaEEEEEEEEEEEEEEEEEEEEEEEttEEEEEEEEEEE
EEEEEEEEEEtttWWWWWWWWWWWWWWWWWWWWWWWWttEEEEEEEEEEE
EEEEEEEEEEttWcWWWWWWWWWWWWWWWWWWWWWWcttEEEEEEEEEEE
EEEEEEEEEEaWcclclllcclllllclllcclllccWaEEEEEEEEEEE
EEEEEEEEEEaWclcccccclllcclllcllccllllWaEEEEEEEEEEE
EEEEEEEEEEaWcclllclclccclcllllcllcllcWaEEEEEEEEEEE
EEEEEEEEEEaWccclclllclcccccllccllccccWaEEEEEEEEEEE
EEEEEEEEEEEWWcclcllcllllcllllclclccllWaEEEEEEEEEEE
EEEEEEEEEEEWWWllccllllllllllllcllccllWaEEEEEEEEEEE
EEEEEEEEEEEWWWclclccllclcllclllccllclWaEEEEEEEEEEE
EEEEEEEEEEEWWWlcccccclllcccllllllclccWaEEEEEEEEEEE
EEEEEEEEEEEWWWlclllclllclcclccllllcllWaEEEEEEEEEEE
EEEEEEEEEEEWWWlccclccclKKKKKclcccccclWaEEEEEEEEEEE
EEEEEEEEEEEWWWlccccllllKissiclllcccccWaEEEEEEEEEEE
EEEEEEEEEEEWWWlccclllllKiiiicclcclcllWaEEEEEEEEEEE
EEEEEEEEEEEWWWlccclcccliiiiilcccccllcWaEEEEEEEEEEE
EEEEEEEEEEEWWWllclllcclKKdKKcclccccccWaEEEEEEEEEEE
EEEEEEEEEEEWWWclccclcclccncllcclcccclWaEEEEEEEEEEE
EEEEEEEEEEEWWWcclcllcllccnlllllccccccWaEEEEEEEEEEE
EEEEEEEEEEEWWWlllcclclclcnlllcclcllllWaEEEEEEEEEEE
EEEEEEEEEEEWWWlcllllclclcnlllcllclcllWaEEEEEEEEEEE
EEEEEEEEEEEWWWlcclvvvvlccnlcclcllllclWaEEEEEEEEEEE
EEEEEEEEEEEWWWlccccbbblllnlccllllccllWaEEEEEEEEEEE
EEEEEEEEEEEWWWllcclvvvllcncclclccclccWaEEEEEEEEEEE
EEEEEEEEEEEWWWcccccllccllncllccclclllWaEEEEEEEEEEE
EEEEEEEEEEEWWWcccccclcllcncccllllcllcWaEEEEEEEEEEE
EEEEEEEEEEEWWWWWWWWWWWWWWGWclllWWWWWWWEEEEEEEEEEEE
EEEEEEEEEEEWWWWWWWWWWWWWWGWllccWWWWWWWEEEEEEEEEEEE
EEEEEEEEEEEWWWWWWWWWWWWWWGWllllWWWWWWWEEEEEEEEEEEE
EEEEEEEEEEEWWWWWWWWWWWWWWGWWccWWWWWWWWEEEEEEEEEEEE
EEEEEEEEEEtttWWWWWWWWWWWWGWWWWWWWWWWWttEEEEEEEEEEE
EEEEEEEEEEtttWWWWWWWWWWWrGWWWWWWWWWWtttEEEEEEEEEEE
EEEEEEEEEEttEEEEEEEEEEEErrrEEEEEEEEEEttEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.67 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Forte — Programma completo (Blocco 2 di 2)
  Parti e lettere (pianta):
    c, l : cortile interno (pietra ed erba, unione di rettangoli attorno al centro)
    W    : mura di cinta (spesse 2 celle, con camminamento in cima, merli e feritoie)
    t    : torri d'angolo (5x5 su ogni angolo esterno convesso delle mura)
    G    : corpo di guardia sul lato frontale, largo 3 celle, più alto delle mura
    r    : strada esterna dritta dal corpo di guardia fino al bordo frontale
    n    : lastricato interno dal corpo di guardia alla porta del mastio
    K, i : mastio (mura K e sala interna i su due piani coperti)
    s    : zona scala interna al mastio (4x2 lungo la parete nord, con pianerottolo)
    d    : porta del mastio, larga 3 celle, allineata al corpo di guardia
    b, v : caserma nel cortile con tetto spiovente (solo su Gargantuan)
    Q    : pozzo nel cortile, dove c'è spazio libero 5x5
    a    : fossato esterno alle mura (solo su Gargantuan)
    g    : alberi nel terreno esterno
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEcWtiKsdnGrbvaQlgm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Cortile di base attorno al centro H -->
      <all in="E/[Hc]" out="c/*" symmetry="()" steps="6"/>
      <all in="[Hc]/E" out="*/c" symmetry="()" steps="5"/>
      <prl in="c/E" out="*/c" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hc]E" out="*c" symmetry="(x)" steps="6"/>

      <!-- Espansione del cortile solo dove c'è molto terreno libero (Gargantuan) -->
      <all in="cEEEEEEEEEEEE" out="*cccccc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEEE" out="*cccccc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEEE" out="*cccccc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Bracci laterali casuali del cortile (solo sui fianchi, mai sul fronte) -->
      <one in="EEEEEEc/EEEEEEc/EEEEEEc/EEEEEEc/EEEEEEc" out="*******/*******/*****m*/*******/*******" symmetry="(x)" steps="1"/>
      <all in="mE" out="*m" symmetry="(x)" steps="2"/>
      <all in="E/m" out="m/*" symmetry="()" steps="2"/>
      <all in="m/E" out="*/m" symmetry="()" steps="2"/>
      <prl in="m" out="c"/>

      <one in="EEEEEEEEEEc/EEEEEEEEEEc/EEEEEEEEEEc/EEEEEEEEEEc/EEEEEEEEEEc/EEEEEEEEEEc/EEEEEEEEEEc" out="***********/***********/***********/*********m*/***********/***********/***********" symmetry="(x)" steps="1"/>
      <all in="mE" out="*m" symmetry="(x)" steps="4"/>
      <all in="E/m" out="m/*" symmetry="()" steps="3"/>
      <all in="m/E" out="*/m" symmetry="()" steps="3"/>
      <prl in="m" out="c"/>

      <!-- Mura di cinta (2 celle di spessore, angoli pieni) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri 5x5 su ogni angolo esterno convesso delle mura -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Corpo di guardia frontale (3 celle) e strada fino al bordo frontale -->
      <all in="H/c" out="*/m" symmetry="()" steps="1"/>
      <all in="m/c" out="*/m" symmetry="()"/>
      <all in="[mG]/W" out="*/G" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <prl in="m" out="c"/>

      <!-- Mastio nel cortile (sala 7x6 o 7x7 + mura K) -->
      <all in="c/[Hi]" out="i/*" symmetry="()" steps="3"/>
      <all in="[Hi]/c" out="*/i" symmetry="()" steps="2"/>
      <prl in="i/c" out="*/i" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hi]c" out="*i" symmetry="(x)" steps="3"/>
      <all in="ic" out="*K" steps="1"/>
      <all in="Kc/*K" out="*K/**"/>

      <!-- Zona scala interna al mastio (4x2 lungo la parete nord, pianerottolo 2 celle a ovest) -->
      <one in="KKKKKKKKK/KiiiiiiiK/KiiiiiiiK" out="*********/KiissssiK/KiissssiK" symmetry="()" steps="1"/>

      <!-- Porta del mastio e lastricato interno fino al corpo di guardia -->
      <all in="H/i" out="*/m" symmetry="()" steps="1"/>
      <all in="m/i" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="i"/>
        <rule in="H" out="i"/>
      </prl>

      <!-- Caserma nel cortile dove c'è spazio libero 9x7 (Gargantuan) -->
      <one in="ccccccccc/ccccccccc/ccccccccc/ccccccccc/ccccccccc/ccccccccc/ccccccccc" out="*********/*********/**bbbbb**/**bbbbb**/**bbbbb**/*********/*********" symmetry="(xy)" steps="1"/>
      <all in="bc" out="*v" steps="1"/>
      <all in="vc/*v" out="*v/**"/>

      <!-- Pozzo in uno spazio libero 5x5 del cortile -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove il terreno prosegue oltre le mura (Gargantuan) -->
      <all in="cWWEEEEEEEE" out="***aa******" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Alberi sparsi nel terreno esterno (dove c'è spazio 7x7) -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***g***/*******/*******/*******" steps="8"/>

      <!-- Trama del cortile: pietra ed erba -->
      <convchain on="c" black="c" white="l" n="3" steps="6">
        <sample>cccllll/cccllll/ccclllc/llccccc/llcccll/lllccll/cllllcc</sample>
      </convchain>
    </sequence>

    <!-- Livello B e C: scala piena (5x5x1 per ogni cella di pianta) -->
    <map scale="5 5 1" values="BEclnraWKtvfFRLYwhpxisdubQgTkMNOoUG#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="W" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="t" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="G" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="K" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="v" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="Q" out="QQQQQ/QaaaQ/QaaaQ/QaaaQ/QQQQQ"/>
      <rule in="g" out="EEEEE/EEEEE/EEgEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WKt"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Wt"/>

        <!-- B. Altezze: mura di cinta (24), torri (42), corpo di guardia (38) -->
        <all in="B w" out="w W" steps="23"/>
        <prl in="w" out="W"/>

        <all in="B h" out="h t" steps="41"/>
        <prl in="h" out="t"/>

        <all in="B p" out="p O" steps="1"/>
        <all in="B p" out="p K" steps="36"/>
        <prl in="p" out="K"/>

        <!-- Mastio: mura con fasce finestre U su due piani (altezza 64) -->
        <all in="B x" out="x K" steps="8"/>
        <all in="B x" out="x U" steps="12"/>
        <all in="B x" out="x K" steps="12"/>
        <all in="B x" out="x K" steps="8"/>
        <all in="B x" out="x U" steps="12"/>
        <all in="B x" out="x K" steps="12"/>
        <prl in="x" out="K"/>

        <!-- Porta del mastio: seme O a terra, poi muro K sopra fino a 64 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="63"/>
        <prl in="d" out="K"/>

        <!-- Solai e striscia della scala T del mastio (2 piani coperti) -->
        <all steps="1">
          <rule in="B i" out="i f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B i" out="i B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B i" out="i F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B i" out="i B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="i" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Caserma: 1 piano (32) + tetto spiovente R -->
        <all in="B u" out="u v" steps="32"/>
        <prl in="u" out="R"/>
        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <prl in="b" out="R"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Pozzo: bordo in pietra alto 6 -->
        <all in="B Q" out="Q W" steps="5"/>
        <prl in="Q" out="W"/>

        <!-- Alberi: tronco alto 10 e chioma tondeggiante -->
        <all in="B g" out="g Y" steps="10"/>
        <prl in="g" out="L"/>
        <all in="LB" out="*L" steps="3"/>
        <all in="B L" out="L *" steps="3"/>
        <all in="L B" out="* L" steps="2"/>

        <!-- C. Parti a scala piena: porte e scala (in pezzi per Gargantuan) -->
        <pieces piece="125" margin="24">
          <import file="part-door"/>
          <import file="part-stair"/>
        </pieces>

        <!-- Finestre sul mastio, poi merli e feritoie sulle fortificazioni -->
        <import file="part-window"/>
        <prl in="U" out="K"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="8A9A5B" hidden="True" name="terreno"/>
  <color symbol="#20" value="000000" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="000000" hidden="True" name="assi aperte"/>
  <color symbol="c" value="C2B280" area="courtyard" name="cortile"/>
  <color symbol="l" value="93A864" area="courtyard" name="erba del cortile"/>
  <color symbol="n" value="B0A490" area="courtyard" name="lastricato"/>
  <color symbol="r" value="C7B299" area="road" name="strada"/>
  <color symbol="a" value="3B7A9E" area="moat" name="fossato"/>
  <color symbol="W" value="7E8287" area="wall" name="mura di cinta"/>
  <color symbol="K" value="6C7075" area="keep" name="mura del mastio"/>
  <color symbol="t" value="5E6368" area="tower" name="torre"/>
  <color symbol="v" value="9B9284" area="barracks" name="mura della caserma"/>
  <color symbol="f" value="C49A6C" area="keep" name="pavimento in legno"/>
  <color symbol="F" value="8B6B4A" area="keep" name="solaio"/>
  <color symbol="R" value="A84A32" area="barracks" name="tetto"/>
  <color symbol="L" value="4A7C3F" area="grounds" name="chioma"/>
  <color symbol="Y" value="6B4423" area="grounds" name="tronco"/>
  <color symbol="M" value="8A8E94" name="merli"/>
  <color symbol="N" value="52463C" name="stipiti"/>
  <color symbol="O" value="7A4B2A" name="porta"/>
  <color symbol="o" value="4E2E18" name="assi della porta"/>
  <color symbol="k" value="9E8C7A" name="gradini"/>
  <color symbol="U" value="2B2623" name="feritoia"/>
  <color symbol="G" value="7FB3D5" name="vetro"/>

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

