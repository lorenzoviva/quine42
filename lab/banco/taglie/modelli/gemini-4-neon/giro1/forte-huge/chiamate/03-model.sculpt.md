# model.sculpt · gemini-4-neon · 57 s

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

The program you wrote:
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
It does not pass: taglia Enorme, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 24 voxel (1,50 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, c cortile, W mura di cinta, t torre, K mura del mastio, n lastricato, G vetro, r strada, a fossato, l erba del cortile, f pavimento in legno, F solaio, L chioma, Y tronco, k gradini, M merli, N stipiti, O porta, o assi della porta, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEELEEEEEEELLEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEELEEEEEEELEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEtEtEtEEEEEEEEEEEEEEEEEEEEEEEEEMttttttEEE
EEEEEEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE
EEEEEEEEtttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE
EEEEEEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE
EEEEEEEEtttttttttWWWWWWWWWWWWWWWWWWWWWWWttttttttEE
EEEEEEEEEttttttttWWWWWWWWWWWWWWWWWWWWWWWttttttttEE
EEEEEEEEttttttttMWWWWWWWWWWWWWWWWWWWWWWWttttttttEE
EEEEEEEEEttttttccllllllllcccllllcccccWWWttttttttEE
EEEEEEEEEtttttMccllllllllccccllccccccWWWMtttttttEE
EEEEEEEEEEEEWWWccllllllllccccccccllllWWWWWWWWEEEEE
EEEEEEEEEEEEWWWccclMKNKKMKKMKMKKcllllWWWWWWWWEEEEE
EEEEEEEEEEEEWWWcccMKKKKKKKKKKKKKKllllWWWWWWWWEEEEE
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKKlllWWWWWWWWEEEEE
EEEEEEEEEEEEWWWcccNKFFFFFFFFFFFFKMlllWWWWWWWWEEEEE
EEEEELLEEEEEWWWcccKKFFFFFFFFFFFFKccccWWWWWWWWEEEEE
EEEEEEEEEEEEWWWcclKKFFFFFFFFFFFFKccccWWWWWWWWEEEEE
EEEEEEEEEEEEWWWcclMKFFFFFFFFFFFFKccccWWWWWWWWEEEEE
EEEEEEEEEEEEWWWcclKKFFFFFFFFFFFFKNccccllllWWWEEEEE
EEEEEEEEEEEEWWWcclKKFFFFFFFFFFFFKNccccclllWWWEEEEE
EEEEEEEEEEEEWWWcccMKFFFFFFFFFFFFKllllcccccWWWEEEEE
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKllllcccccWWWEEEEE
EEEEEEEEEEEEWWWcccMKFFFFFFFFFFFFKllllaccccWWWEEEEE
EEEEEEEEEEEEWWWlllKKFFFFFFFFFFFFKNclllllllWWWEEEEE
EEEEEEEEEEEEWWWlllKKFFFFFFFFFFFKKNclllllllWWWEEEEE
EEEEEEEEEEEEWWWllllKKKKKKKKKKKKKKcclllllllWWWEEEEE
EEEEEEEEEEtMttMlllccKMcnnnnnllNNccccclWWMttttttEEE
EEEEEEEEEttttttlllcccccnnnnnllllcccccWWWttttttttEE
EEEEEEEEttttttttMWWWWWWMKKKKNWWWWWWWWWWWttttttttEE
EEEEEEEEEttttttttWWWWWWKKKKKNWWWWWWWWWWWttttttttEE
EEEEEEEEtttttttttWWWWWWNKKKKMWWWWWWWWWWWttttttttEE
EEEEEEEEEttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE
EEEEEEEEtttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE
EEEEEEEEEttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE
EEEEEEEEEtttttttEEEEEEErrrrrEEEEEEEEEEEEMtttttttEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEELEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEELLEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000004000000040000000000000000000
00000000000000000000044400000444000000000000000000
00000000000000000000044400000044000000000000000000
00000000000000000000000000000000000000000000000000
00000000eecececee00000000000000000000000eeeeeeeee0
00000000eccccccce00000000000000000000000eccccccce0
00000000ccccccccc00000000000000000000000ccccccccc0
00000000eccccccce77777777777777777777777eccccccce0
00000000cccccccce77777777777777777777777ccccccccc0
00000000eccccccce77777777777777777777777eccccccce0
00000000cccccccee77777777777777777777777ccccccccc0
00000000eccccce0000000000000000000007777eccccccce0
00000000eeceeee0000000000000000000008777eeeeeeeee0
00000000000777700000000000000000000077777777700000
000000000007777000lljllllllljlllll0087777777700000
000000000007777000ljjjjjjjjjjjjjjl0087777777700000
000000000007777000jjjjjjjjjjjjjjjj0087777777700000
000004400007777000ljjjjjjjjjjjjjjl0087777777700000
000044400007777000ljjjjjjjjjjjjjjl0087777777700000
000004400007777000ljjjjjjjjjjjjjjl0087777777700000
000000000007777000ljjjjjjjjjjjjjjl0088888777700000
000000000007777000ljjjjjjjjjjjjjjl0000000777700000
000000000007777000ljjjjjjjjjjjjjjl0000000777700000
000000000007777000ljjjjjjjjjjjjjjl0000000777700000
000000000007777000jjjjjjjjjjjjjjjj0033300777700000
000000000007777000ljjjjjjjjjjjjjjl0033300777700000
000000000007777000ljjjjjjjjjjjjjjl0000000777700000
000000000007777000ljjjjjjjjjjjjjjl0000000777700000
000000000007777000ljjjjjjjjjjjjjjl0000000777700000
00000000eeceeee000lljllllllljlllll008888eeeeeeeee0
00000000eccccce0000000000000000000008777eccccccce0
00000000cccccccee777777ddbddd77777777777ccccccccc0
00000000eccccccce777777dbbbbd77777777777eccccccce0
00000000cccccccce777777dbbbbd77777777777ccccccccc0
00000000eccccccce777777ddbddd77777777777eccccccce0
00000000ccccccccc00000000000000000000000ccccccccc0
00000000eccccccce00000000000000000000000eccccccce0
00000000eecececee00000000000000000000000eeeeeeeee0
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000044000000000000000
00000000000000000000000000000000044400000000000000
00000000000000000000000000000000004000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
...................M.M..M..M.M..M.................
..................MM.MM.M.MM.MM.M.................
..................KKKKKKKKKKKKKKK.................
..................KKKKKKKKKKKKKKK.................
..................KKKKKKKKKKKKKKK.................
..................KKKKKKKKKKKKKKK.................
..................KKKKKKKKKKKKKKK.................
..................KKGGKKKKKKKKGGK.................
........MM.M.MMMM.KKGGKKKKKKKKGGK.......MM.M.M.M..
........MM.M.MMMM.KKGGKKMKMKKKGGK.......MM.M.M.M..
........ttttttttt.KKKKKMMKMMKKKKK.......tttttttt..
........ttttttttt.KKKKKKKKKKKKKKK.......tttttttt..
........ttttttttt.KKKKKKKKKKKKKKK.......tttttttt..
........ttttttttt.KKKKKKKKKKKKKKK.......tttttttt..
........ttttttttt.KKKKKNooooOKKKK....M.Mtttttttt..
........ttttttttt.KKKKKNooooOKKKK....M.Mtttttttt..
........tttttttttWWWWWWNooooOWWWWWWWWWWWtttttttt..
........tttttttttWWWWWWNooooOWWWWWWWWWWWtttttttt..
........tttttttttWWWWWWNooooOWWWWWWWWWWWtttttttt..
.....LL.tttttttttWWWWWWNooooOWWWWLLWWWWWtttttttt..
.....LL.tttttttttWWWWWWNooooOWWWWLLWWWWWtttttttt..
.....L..tttttttttWWWWWWNooooOWWWWWWWWWWWtttttttt..
........tttttttttWWWWWWNooooOWWWWWWWWWWWtttttttt..
.....E..tttttttttWWWWWWrooooEWWWWWWWWWWWttttttttE.
```
Right side (looking from the right):
```
...................M.M..M..M.M..M.................
..................MM.MM.M.MM.MM.M.................
..................KKKKKKKKKKKKKKK.................
..................KKKKKKKKKKKKKKK.................
..................KKKKKKKKKKKKKKK.................
..................KKKKKKKKKKKKKKK.................
..................KKKKKKKKKKKKKKK.................
..................KKGGKKKGGKKKGGK.................
........MM.M.MMMM.KKGGKKKGGKKKGGKMMMM.M.MM........
........MM.M.MMMM.KKGGKKKGGKKKGGKMMMMMM.MM........
........ttttttttt.KKKKKKKKKKKKKNKttttttttt........
........ttttttttt.KKKKKKKKKKKKKKKttttttttt........
........ttttttttt.KKKKKKKKKKKKKKKttttttttt........
........ttttttttt.KKKKKKKKKKKKKKKttttttttt........
........ttttttttt.MMKMKMMKKKKKKKKttttttttt........
........ttttttttt.MMKMKMMKKKKKKKKttttttttt........
........tttttttttWWWWWWWWWWWWWWWWttttttttt........
........tttttttttWWWWWWWWWWWWWWWWttttttttt........
........tttttttttWWWWWWWWWWWWWWWWttttttttt........
.....LL.tttttttttWWWWWWWWWWWWWWWWttttttttt.LL.....
.....LL.tttttttttWWWWWWWWWWWWWWWWttttttttt.LL.....
.....L..tttttttttWWWWWWWWWWWWWWWWttttttttt..L.....
........tttttttttWWWWWWWWWWWWWWWWttttttttt........
.....E..tttttttttWWWWWWWWWWWWWWWWttttttttt..E.....
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
......................L.......LL..................
......................L.......L...................
..................................................
.........ttttttt........................tttttttt..
........ttttttttt.......................tttttttt..
........ttttttttt.......................tttttttt..
........ttttttttt.......................tttttttt..
........tttttttttWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
........tttttttttWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
........tttttttttWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
........ttttttt......................WWWtttttttt..
.........tttttt......................WWWtttttttt..
............WWW......................WWWWWWWW.....
............WWW....K..KKK..KKK..K....WWWWWWWW.....
............WWW...KK..KKK..KKK..K....WWWWWWWW.....
............WWW..........kkkk........WWWWWWWW.....
............WWW..........kkkk........WWWWWWWW.....
.....LL.....WWW...KK.....kkkk...K....WWWWWWWW.....
............WWW...KK............K....WWWWWWWW.....
............WWW...KK............K....WWWWWWWW.....
............WWW...........................WWW.....
............WWW...........................WWW.....
............WWW...KK............K.........WWW.....
............WWW...KK............K.........WWW.....
............WWW...KK............K.........WWW.....
............WWW...........................WWW.....
............WWW...........................WWW.....
............WWW...KK..KoooooKK..K.........WWW.....
.........tttttt......................WWWtttttttt..
........ttttttt......................WWWtttttttt..
........tttttttttWWWWWWoooooNWWWWWWWWWWWtttttttt..
........tttttttttWWWWWWooooooWWWWWWWWWWWtttttttt..
........tttttttttWWWWWWooooooWWWWWWWWWWWtttttttt..
........ttttttttt.......................tttttttt..
........ttttttttt.......................tttttttt..
........ttttttttt.......................tttttttt..
.........ttttttt........................tttttttt..
..................................................
..................................L...............
.................................LL...............
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
...................K..KKK..KKK..K.................
..................KK..KKK..KKK..K.................
..................................................
..................................................
..................KK............K.................
..................KK............K.................
..................KK............K.................
..................................................
..................................................
..................KK............K.................
..................KK............K.................
..................KK............K.................
..................................................
..................................................
..................KK..KKKKKKKK..K.................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000040000000400000000000000000
EEEEEEEEEEEEEEEEEEEEEEELLEEEEEEELEEEEEEEEEEEEEEEEE   00000000000000000000000444000004440000000000000000
EEEEEEEEEEEEEEEEEEEEEEEELEEEEEEELEEEEEEEEEEEEEEEEE   00000000000000000000000440000004440000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEtEtEtEEEEEEEEEEEEEEEEEEEEEEEEEMttttttEEE   00000000eecececee00000000000000000000000eeeeeeeee0
EEEEEEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE   00000000eccccccce00000000000000000000000eccccccce0
EEEEEEEEtttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE   00000000ccccccccc00000000000000000000000ccccccccc0
EEEEEEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE   00000000eccccccce77777777777777777777777eccccccce0
EEEEEEEEtttttttttWWWWWWWWWWWWWWWWWWWWWWWttttttttEE   00000000cccccccce77777777777777777777777ccccccccc0
EEEEEEEEEttttttttWWWWWWWWWWWWWWWWWWWWWWWttttttttEE   00000000eccccccce77777777777777777777777eccccccce0
EEEEEEEEttttttttMWWWWWWWWWWWWWWWWWWWWWWWttttttttEE   00000000cccccccee77777777777777777777777ccccccccc0
EEEEEEEEEttttttcclllccccclllcccccccccWWWttttttttEE   00000000eccccce0000000000000000000008777eccccccce0
EEEEEEEEEtttttMcclllccccclllcccccccccWWWMtttttttEE   00000000eeceeee0000000000000000000008777eeeeeeeee0
EEEEEEEEEEEEWWWcccccccccclllcccccccccWWWWWWWWEEEEE   00000000000777700000000000000000000087777777700000
EEEEEEEEEEEEWWWlcccMKNKKMKKMKMKKcccccWWWWWWWWEEEEE   000000000007777000lljllllllljlllll0077777777700000
EEEEEEEEEEEEWWWllccKKKKKKKKKKKKKKccccWWWWWWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0087777777700000
EEEEEEEEEEEEWWWllcKKFFFFFFFFFFFFKccccWWWWWWWWEEEEE   000000000007777000jjjjjjjjjjjjjjjj0087777777700000
EEEEEEEEEEEEWWWlcccKFFFFFFFFFFFFKccccWWWWWWWWEEEEE   000004400007777000ljjjjjjjjjjjjjjl0087777777700000
EEEEELLEEEEEWWWcccKKFFFFFFFFFFFFKllllWWWWWWWWEEEEE   000044400007777000ljjjjjjjjjjjjjjl0087777777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKlllllcccWWWWEEEEE   000004400007777000ljjjjjjjjjjjjjjl0088888777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKNllllccccWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0000000777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKNllllccccWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0000000777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKlllllccccWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0033300777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKllllaccccWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0030300777700000
EEEEEEEEEEEEWWWccccKFFFFFFFFFFFFKcclllllccWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0033300777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKcclllllccWWWEEEEE   000000000007777000jjjjjjjjjjjjjjjj0000000777700000
EEEEEEEEEEEEWWWccccKKKKKKKKKKKKKKcclllllccWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0000000777700000
EEEEEEEEEEEEWWWcccMKKKKKKKKKKKKKKcclllllcWWWWEEEEE   000000000007777000lljllllllljlllll0088888777700000
EEEEEEEEEEEEWWWcccllllcnnnnnlllllccccWWWWWWWWEEEEE   00000000000777700000000000000000000087777777700000
EEEEEEEEEEtMttMcccllllcnnnnnlllllccccWWWMttttttEEE   00000000eeceeee0000000000000000000008777eeeeeeeee0
EEEEEEEEEttttttcccllllcnnnnnlllllccccWWWttttttttEE   00000000eccccce0000000000000000000008777eccccccce0
EEEEEEEEttttttttMWWWWWWMKKKKMWWWWWWWWWWWttttttttEE   00000000cccccccee777777dddddd77777777777ccccccccc0
EEEEEEEEEttttttttWWWWWWKKKKKNWWWWWWWWWWWttttttttEE   00000000eccccccce777777dbbbbd77777777777eccccccce0
EEEEEEEEtttttttttWWWWWWKKKKKNWWWWWWWWWWWttttttttEE   00000000cccccccce777777dbbbbd77777777777ccccccccc0
EEEEEEEEEttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE   00000000eccccccce777777dddddd77777777777eccccccce0
EEEEEEEEtttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE   00000000ccccccccc00000000000000000000000ccccccccc0
EEEEEEEEEttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE   00000000eccccccce00000000000000000000000eccccccce0
EEEEEEEEEtttttttEEEEEEErrrrrEEEEEEEEEEEEMtttttttEE   00000000eecececee00000000000000000000000eeeeeeeee0
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEELEEEEEEEEEEEEEEE   00000000000000000000000000000000044000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEELLEEEEEEEEEEEEEEE   00000000000000000000000000000000044400000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000004000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000040000000400000000000000000
EEEEEEEEEEEEEEEEEEEEEEELLEEEEEEELEEEEEEEEEEEEEEEEE   00000000000000000000000444000004440000000000000000
EEEEEEEEEEEEEEEEEEEEEEEELEEEEEEELEEEEEEEEEEEEEEEEE   00000000000000000000000440000004440000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEtEtEtEEEEEEEEEEEEEEEEEEEEEEEEEMttttttEEE   00000000eecececee00000000000000000000000eeeeeeeee0
EEEEEEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE   00000000eccccccce00000000000000000000000eccccccce0
EEEEEEEEtttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE   00000000ccccccccc00000000000000000000000ccccccccc0
EEEEEEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEttttttttEE   00000000eccccccce77777777777777777777777eccccccce0
EEEEEEEEtttttttttWWWWWWWWWWWWWWWWWWWWWWWttttttttEE   00000000cccccccce77777777777777777777777ccccccccc0
EEEEEEEEEttttttttWWWWWWWWWWWWWWWWWWWWWWWttttttttEE   00000000eccccccce77777777777777777777777eccccccce0
EEEEEEEEttttttttMWWWWWWWWWWWWWWWWWWWWWWWttttttttEE   00000000cccccccee77777777777777777777777ccccccccc0
EEEEEEEEEttttttlllllllcccllllllllccccWWWttttttttEE   00000000eccccce0000000000000000000008777eccccccce0
EEEEEEEEEtttttMlllllllcccllllllllccccWWWMtttttttEE   00000000eeceeee0000000000000000000008777eeeeeeeee0
EEEEEEEEEEEEWWWlllllllcccllllllllccccWWWWWWWWEEEEE   00000000000777700000000000000000000087777777700000
EEEEEEEEEEEEWWWllllMKNKKMKKMKMKKlcclllcccWWWWEEEEE   000000000007777000lljllllllljlllll0088888777700000
EEEEEEEEEEEEWWWllllKKKKKKKKKKKKKKcclllccccWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0000000777700000
EEEEEEEEEEEEWWWlllKKFFFFFFFFFFFFKlllllllllWWWEEEEE   000000000007777000jjjjjjjjjjjjjjjj0000000777700000
EEEEEEEEEEEEWWWllllKFFFFFFFFFFFFKlllllllllWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0033300777700000
EEEEEEEEEEEEWWWlllKKFFFFFFFFFFFFKllllallllWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0030300777700000
EEEEELEEEEEEWWWcccKKFFFFFFFFFFFFKcccccllllWWWEEEEE   000004400007777000ljjjjjjjjjjjjjjl0033300777700000
EEEEELLEEEEEWWWcccKKFFFFFFFFFFFFKNccccllllWWWEEEEE   000044400007777000ljjjjjjjjjjjjjjl0000000777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKNccccllllWWWEEEEE   000004000007777000ljjjjjjjjjjjjjjl0000000777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKccccclllWWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0088888777700000
EEEEEEEEEEEEWWWlllKKFFFFFFFFFFFFKllccWWWWWWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0087777777700000
EEEEEEEEEEEEWWWcccMKFFFFFFFFFFFFKllccWWWWWWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0087777777700000
EEEEEEEEEEEEWWWcccKKFFFFFFFFFFFFKllccWWWWWWWWEEEEE   000000000007777000jjjjjjjjjjjjjjjj0087777777700000
EEEEEEEEEEEEWWWccccKKKKKKKKKKKKKKccccWWWWWWWWEEEEE   000000000007777000ljjjjjjjjjjjjjjl0087777777700000
EEEEEEEEEEEEWWWccccKKKKKKKKKKKKKKccccWWWWWWWWEEEEE   000000000007777000lljllllllljlllll0077777777700000
EEEEEEEEEEEEWWWccccccccnnnnncclllccccWWWWWWWWEEEEE   00000000000777700000000000000000000087777777700000
EEEEEEEEEEtMttMccccllccnnnnncccccccccWWWMttttttEEE   00000000eeceeee0000000000000000000008777eeeeeeeee0
EEEEEEEEEttttttcccllllcnnnnncccccccccWWWttttttttEE   00000000eccccce0000000000000000000008777eccccccce0
EEEEEEEEttttttttMWWWWWWMKKKKMWWWWWWWWWWWttttttttEE   00000000cccccccee777777ddbddd77777777777ccccccccc0
EEEEEEEEEttttttttWWWWWWKKKKKNWWWWWWWWWWWttttttttEE   00000000eccccccce777777dbbbbd77777777777eccccccce0
EEEEEEEEtttttttttWWWWWWKKKKKNWWWWWWWWWWWttttttttEE   00000000cccccccce777777dbbbbd77777777777ccccccccc0
EEEEEEEEEttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE   00000000eccccccce777777ddbddd77777777777eccccccce0
EEEEEEEEtttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE   00000000ccccccccc00000000000000000000000ccccccccc0
EEEEEEEEEttttttttEEEEEErrrrrEEEEEEEEEEEEttttttttEE   00000000eccccccce00000000000000000000000eccccccce0
EEEEEEEEEtttttttEEEEEEErrrrrEEEEEEEEEEEEMtttttttEE   00000000eecececee00000000000000000000000eeeeeeeee0
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEELEEEEEEEEEEEEEEE   00000000000000000000000000000000044000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEELLEEEEEEEEEEEEEEE   00000000000000000000000000000000044400000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000004000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.19 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 204 nodi, 727 passi, finito in 852 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=terreno (marcatore), c=cortile, W=mura di cinta, t=torre, i=indigo, K=mura del mastio, s=slate, d=dead, dark, n=lastricato, G=vetro, r=strada, Q=aQua, l=erba del cortile, g=green, m=magenta, f=pavimento in legno, F=solaio, L=chioma, Y=tronco, w=white, h=honey, p=purple, x=x, T=Teal (marcatore), k=gradini, M=merli, N=stipiti, O=porta, o=assi della porta, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #94=porta di prova, #93=terreno di prova (marcatore), #95=solaio di prova, #96=pavimento di prova, #97=? (marcatore).
Alla fine: t 100164, W 64254, K 42633, E 12371, o 6510, U 3498, k 2720, M 2640, F 2290, N 1883, G 1420, f 1225, c 1100, l 1050, L 592, r 525, O 240, n 75, Y 40, a 9.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-59 all×28, one×4, prl×4, convchain×1: 647 celle x3-28 y3-29 z0, passi 2-87
   #61 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 88
    #63 all . w → w W passi=23: ×23, 125350 celle x35-134 y35-114 z0-23, passi 89-111, w→W 62675, .→w 62675
    #64 prl w → W: ×1, 2725 celle x35-134 y35-114 z23, passi 112, w→W 2725
    #65 all . h → h t passi=41: ×41, 200900 celle x25-144 y25-124 z0-41, passi 113-153, h→t 100450, .→h 100450
#66-70 prl×2, all×3: 25300 celle x25-144 y25-124 z0-41, passi 154-200
    #71 all . x → x U passi=12: ×12, 17400 celle x55-99 y55-99 z8-20, passi 201-212, x→U 8700, .→x 8700
    #72 all . x → x K passi=12: ×12, 17400 celle x55-99 y55-99 z20-32, passi 213-224, x→K 8700, .→x 8700
    #73 all . x → x K passi=8: ×8, 11600 celle x55-99 y55-99 z32-40, passi 225-232, x→K 5800, .→x 5800
    #74 all . x → x U passi=12: ×12, 17400 celle x55-99 y55-99 z40-52, passi 233-244, x→U 8700, .→x 8700
    #75 all . x → x K passi=12: ×12, 17400 celle x55-99 y55-99 z52-64, passi 245-256, x→K 8700, .→x 8700
#76-81 prl×2, all×4: 13250 celle x55-99 y55-99 z0-64, passi 257-324
    #82 all . i → i . passi=31: ×31, 63550 celle x60-94 y60-94 z1-32, passi 325-355, i→. 31775, .→i 31775
#83-84 all×2: 14450 celle x60-94 y60-94 z2-33, passi 356-386
    #85 all . i → i . (+1) passi=31: ×31, 75950 celle x60-94 y60-94 z33-64, passi 387-417, i→. 31775, .→i 31775, s→. 6200, .→s 6200
      r1 . i → i . ×31775; r2 . s → s . ×6200
#86-101 prl×3, all×5, pieces×1: 12610 celle x14-114 y14-135 z0-64, passi 418-444
#153-169 all×5, prl×9: 18019 celle x54-100 y54-100 z8-51, passi 445-506
#170-177 prl×2, all×4: 13778 celle x54-100 y54-100 z8-51, passi 507-512
#178-204 prl×3, all×7: 18376 celle x25-144 y25-124 z6-70, passi 513-565
Senza effetto (non hanno mai cambiato una cella):
#7 prl c/E → */c passi=1
#9 all cEEEEEEEEEEEE → *cccccc****** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#10 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#11 all cEEEEEEEEEEEE → *cccccc****** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#12 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#13 all cEEEEEEEEEEEE → *cccccc****** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#14 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#20 one EEEEEEEEEEc/EEEEEEEEEEc/EEEEEEEEEEc/EEEEEEEEEEc… → ***********/***********/***********/*********m*… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#21 all mE → *m passi=4: in quel momento nella griglia non c'erano celle "m"
#22 all E/m → m/* passi=3: in quel momento nella griglia non c'erano celle "m"
#23 all m/E → */m passi=3: in quel momento nella griglia non c'erano celle "m"
#24 prl m → c: in quel momento nella griglia non c'erano celle "m"
… e altri 42
Fix it and answer with the whole program.

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
    K, i : mastio (mura K e sala interna i 9x8 o 9x9 su due piani coperti)
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
      <!-- Cortile di base attorno al centro H (15x13 o 15x14) -->
      <all in="E/[Hc]" out="c/*" symmetry="()" steps="6"/>
      <all in="[Hc]/E" out="*/c" symmetry="()" steps="6"/>
      <prl in="c/E" out="*/c" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hc]E" out="*c" symmetry="(x)" steps="7"/>

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

      <!-- Mastio nel cortile (sala 9x8 o 9x9 + mura K) -->
      <all in="c/[Hi]" out="i/*" symmetry="()" steps="4"/>
      <all in="[Hi]/c" out="*/i" symmetry="()" steps="3"/>
      <prl in="i/c" out="*/i" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hi]c" out="*i" symmetry="(x)" steps="4"/>
      <all in="ic" out="*K" steps="1"/>
      <all in="Kc/*K" out="*K/**"/>

      <!-- Zona scala interna al mastio (4x2 lungo la parete nord, pianerottolo 3 celle a ovest) -->
      <one in="KKKKKKKKKKK/KiiiiiiiiiK/KiiiiiiiiiK" out="***********/KiiissssiiK/KiiissssiiK" symmetry="()" steps="1"/>

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

