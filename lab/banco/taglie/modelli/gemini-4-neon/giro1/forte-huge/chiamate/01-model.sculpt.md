# model.sculpt · gemini-4-neon · 83 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
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
```

