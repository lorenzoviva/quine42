# model.sculpt · gemini-4-neon · 54 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
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
  Forte medievale:
  - Parti e lettere di pianta:
    i: sala del mastio (keep), K: mura del mastio, s: zona scala interna del mastio, d: portone del mastio
    c: cortile in terra battuta, l: lastricato sparso del cortile, n: via lastricata dal portone al corpo di guardia
    W: cinta muraria con camminamento, t: torri d'angolo, G: corpo di guardia sul fronte, r: strada esterna fino al bordo
    b: caserma coperta addossata alla cinta, v: muri della caserma, Q: pozzo nel cortile, a: fossato esterno
    (h, m: marcatori temporanei di costruzione)
  - Disposizione: il mastio (i, K) sorge nella zona centrale (almeno 7x8 celle interne, così la sala davanti alla scala
    misura almeno 30x35 voxel liberi) con la scala (s) lungo il muro posteriore e il portone (d) sul fronte; intorno si
    apre il cortile (c, l) con bracci asimmetrici, racchiuso dalla cinta muraria (W) con torri sugli spigoli esterni (t);
    dal portone la via (n) attraversa il cortile fino al corpo di guardia (G) e prosegue come strada (r) fino al bordo
    anteriore; caserma (b, v) e pozzo (Q) stanno nel cortile senza intralciare la via; il fossato (a) cinge l'esterno.
  - Variazione tra i semi: posizione laterale e arretramento del mastio, profondità del mastio, bracci asimmetrici del
    cortile che piegano la cinta, posizione della caserma e del pozzo, trama del lastricato nel cortile.
  - Adattamento alle taglie:
    Large (20x20): mastio a due piani con scala e sala ampia, cortile con braccio asimmetrico, cinta con torri 3x3,
    corpo di guardia e strada.
    Huge (30x30): cortile ampliato con bracci asimmetrici, caserma coperta con tetto a padiglione e pozzo.
    Gargantuan (100x100): cortile ancora più ampio, cinta spessa, caserma, pozzo e fossato esterno.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhiKscWlGmdnrbtvQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Spostamento casuale del centro del mastio per variare la sagoma tra i semi -->
      <one in="HE" out="EH" symmetry="(x)" steps="2"/>
      <prl in="E/H" out="H/E" p="0.5" steps="1" symmetry="()"/>

      <!-- Mastio: almeno 7x8 celle interne (35x40 voxel) per avere >=30 voxel liberi davanti alla scala -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hhi]E" out="*i" symmetry="(x)" steps="3"/>
      <prl in="h" out="i"/>
      <all in="[Hi]E" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- Zona della scala del mastio lungo il muro posteriore (2 celle pianerottolo + 4 scala + 1 sbarco) -->
      <one in="KKKKKKK/iiiiiii/iiiiiii" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>

      <!-- Cortile base attorno al mastio e braccio asimmetrico casuale (anche a Large) -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="cEEEE/cEEEE/cEEEE/cEEEE" out="*cc**/*cc**/*cc**/*cc**" steps="1"/>

      <!-- Espansione del cortile dove c'è spazio (Huge e Gargantuan) e bracci casuali per sagome spezzate -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="cEEEEEE/cEEEEEE/cEEEEEE/cEEEEEE/cEEEEEE" out="*ccc***/*ccc***/*ccc***/*ccc***/*ccc***" steps="2"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile (spessa 2 celle dove resta ampio spazio) -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEEEEEE" out="*W*****" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo 3x3 su ogni spigolo convesso esterno della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Via d'uscita dal centro al fronte: portone del mastio (d), via nel cortile (n), corpo di guardia (G), strada (r) -->
      <all in="H/i" out="*/m" symmetry="()" steps="1"/>
      <all in="m/i" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="i"/>
        <rule in="H" out="i"/>
      </prl>

      <!-- Caserma coperta (6x4 celle) addossata alla cinta e pozzo nel cortile (solo dove c'è spazio: Huge e Gargantuan) -->
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vbbbbbbv/vbbbbbbv/vbbbbbbv/vbbbbbbv" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove resta terreno libero oltre la cinta (Gargantuan) -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Lastricato sparso nel cortile -->
      <convchain on="c" black="c" white="l" n="3" steps="6"><sample>cccllll/cccllll/ccclllc/llccccc/llcccll/lllccll/cllllcc</sample></convchain>
    </sequence>

    <map scale="5 5 1" values="BEfFgKWtvRclnrQaisdhwpmbq xOoNTkGMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="K" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="G" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="KWtv"/>
        <union symbol="=" values="fFg"/>
        <union symbol="%" values="KWt"/>

        <!-- B. Altezze: mura del mastio (65 voxel con due fasce finestre U) -->
        <all in="B h" out="h K" steps="6"/>
        <all in="B h" out="h U" steps="12"/>
        <all in="B h" out="h K" steps="20"/>
        <all in="B h" out="h U" steps="12"/>
        <all in="B h" out="h K" steps="14"/>
        <prl in="h" out="K"/>

        <!-- Portone del mastio: seme O sul pavimento, poi muro K fino in cima -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="63"/>
        <prl in="d" out="K"/>

        <!-- Sala del mastio e scala: 2 piani coperti (pavimento z=0, scala z=1, solaio z=32, terrazza z=64) -->
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

        <!-- Cinta muraria (24 voxel) e corpo di guardia (38 voxel con seme O) -->
        <all in="B w" out="w W" steps="23"/>
        <prl in="w" out="W"/>
        <all in="B x" out="x O" steps="1"/>
        <all in="B x" out="x W" steps="36"/>
        <prl in="x" out="W"/>

        <!-- Torri d'angolo (44 voxel) -->
        <all in="B p" out="p t" steps="43"/>
        <prl in="p" out="t"/>

        <!-- Caserma coperta (32 voxel + tetto R) e pozzo (4 voxel) -->
        <all in="B m" out="m v" steps="31"/>
        <prl in="m" out="R"/>
        <all in="B b" out="b g" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <prl in="b" out="R"/>
        <all in="B q" out="q Q" steps="3"/>
        <prl in="q" out="Q"/>

        <!-- C. Scala piena: porte, scale, finestre, merli, feritoie, tetto della caserma -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <prl in="U" out="K"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto a padiglione della caserma -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="7" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6A8E4E" hidden="True" name="Terreno"/>
  <color symbol="f" value="C8A878" area="keep" name="Pavimento del mastio"/>
  <color symbol="F" value="B09468" area="keep" name="Solaio del mastio"/>
  <color symbol="g" value="B8986A" area="barracks" name="Pavimento della caserma"/>
  <color symbol="K" value="6E6A63" area="keep" name="Mura del mastio"/>
  <color symbol="W" value="7E7A72" area="wall" name="Cinta muraria"/>
  <color symbol="t" value="5E5A54" area="tower" name="Torre d'angolo"/>
  <color symbol="v" value="8A7F70" area="barracks" name="Muro della caserma"/>
  <color symbol="R" value="A64B3C" area="barracks" name="Tetto della caserma"/>
  <color symbol="M" value="8C877E" name="Merli"/>
  <color symbol="O" value="5C3A21" name="Portone"/>
  <color symbol="o" value="3E2514" name="Assi del portone"/>
  <color symbol="N" value="4A443C" name="Cornice in pietra"/>
  <color symbol="G" value="7CA6B8" name="Vetro"/>
  <color symbol="k" value="9C7A54" name="Gradini"/>
  <color symbol="U" value="2B2825" name="Feritoia"/>
  <color symbol="c" value="9E8F6E" area="courtyard" name="Cortile"/>
  <color symbol="l" value="ABA396" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="n" value="B5ADA0" area="courtyard" name="Via del cortile"/>
  <color symbol="r" value="C2B28F" area="road" name="Strada"/>
  <color symbol="Q" value="68645D" area="courtyard" name="Pozzo"/>
  <color symbol="a" value="4A7C9B" area="moat" name="Acqua"/>
  <color symbol="#20" value="5C3A21" hidden="True" name="Portone aperto"/>
  <color symbol="#21" value="3E2514" hidden="True" name="Assi aperte"/>

  <action name="open" label="Apri il portone">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi il portone">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
It does not pass: taglia Grande, seme 1: stanze: una stanza a terra di 1,4 caselle² non si raggiunge a piedi dalla porta: apri una porta (part-door) nella parete che la separa dalle altre
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, K Mura del mastio, c Cortile, W Cinta muraria, l Lastricato del cortile, G Vetro, n Via del cortile, r Strada, t Torre d'angolo, v Muro della caserma, f Pavimento del mastio, F Solaio del mastio, g Pavimento della caserma, R Tetto della caserma, O Portone, o Assi del portone, N Cornice in pietra, k Gradini, M Merli, U Feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEMtMttMMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMMttMtt
EEEtttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt
EEEtttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt
EEEtttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt
EEEttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt
EEEtttttcccccccccclllllccccccccccccccccccccccttttt
EEEttttMcccccccccclllllccccccccccccccccccccccMtttt
EEEEtMMcccccNNNNcKlNNNNMccMNNNMccccccccccccccMMMtM
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMccccccclllllWWWEE
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMccccccclllllWWWEE
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMcRRRRRRRRRRRRWWEE
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMllRRRRRRRRRRRWWEE
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKllRRRRRRRRRRRWWEE
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKlllRRRRRRRRRRRWWEE
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMllRRRRRRRRRRRWWEE
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMlRRRRRRRRRRRRWWEE
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE
EEEEEWWWllMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKcccRRRRRRRRRRRWWEE
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMllRRRRRRRRRRWWWEE
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMlllllcccccccWWWEE
EEEEEWWcccMMNKMMlKMMnKMMnKMMNKMMllllllcccccccWWWEE
EEEttttMccccclllllnnnnnnncccccccclllllcccccllMtttt
EEEtttttccccclllllnnnnnnncccccccclllllcccccllttttt
EEEttttttMWWWWWWWNMWMWWMMNWWWWWWWWWWWWWWWWWMtttttt
EEEtttttttWWWWWWWNWWWWWWWNWWWWWWWWWWWWWWWWWttttttt
EEEtttttttWWWWWWWNMMWrMrMEWWWWWWWWWWWWWWWWWttttttt
EEEtttttttEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEttttttt
EEEttttttMEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEttttttt
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00mmmmjmmm00000000000000000000000000000000mmmjmmjj
00mjjjjjjm00000000000000000000000000000000mjjjjjjj
00mjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjj
00jjjjjjjjaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaajjjjjjjj
00mjjjjjmmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaammjjjjjj
00mjjjjj0000000000000000000000000000000000000jjjjj
00mjjjjm0000000000000000000000000000000000000mjjjj
00mmjmmm00vvvsvvvsvvvsvvvsvvvsvvv000000000000mmmjm
00000aaa00vsssssssssssssssssssssv000000000000aaa00
00000aaa00vsssssssssssssssssssssv00eeeeeeeeeeaaa00
00000aaa00sssssssssssssssssssssss0eeeeeeeeeeeeaa00
00000aaa0hvsssssssssssssssssssssv0eeffffffffeeaa00
00000aaa0hvsssssssssssssssssssssv0effffffffffeaa00
00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
00000aaa0hvsssssssssssssssssssssv0effffffffffeaa00
00000aaa0hvsssssssssssssssssssssv0eeffffffffeeaa00
00000aaa00sssssssssssssssssssssss0eeeeeeeeeeeeaa00
00000aaa00vsssssssssssssssssssssv00eeeeeeeeeeaaa00
00000aaa00vsssssssssssssssssssssv000000000000aaa00
00mmjmmm00vvvsvvvsvvvsvvvsvvvsvvv000000000000mmmjm
00mjjjjm0000000000000000000000000000000000000mjjjj
00mjjjjj0000000000000000000000000000000000000jjjjj
00jjjjjjmmaaaaaaajjjjgjjjaaaaaaaaaaaaaaaaammjjjjjj
00mjjjjjjmaaaaaaajggggggjaaaaaaaaaaaaaaaaajjjjjjjj
00mjjjjjjmaaaaaaajjjgjjjjaaaaaaaaaaaaaaaaamjjjjjjj
00mjjjjjjj00000000000000000000000000000000mjjjjjjj
00mmmmjmmm00000000000000000000000000000000mmmjmmjj
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
..........MM..MM..MM..MM..MM..MM..................
..........MMM.MMM.MMM.MMM.MMM.MMM.................
..........MMM.MMM.MMM.MMM.MMM.MMM.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KUKKKUKKKUKKKUKKKUKKKUK.................
..........KUKKKUKKKUKKKUKKKUKKKUK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..MMMMMMMMKKGGGNKKKKKKKKKKKGGGNKK.........MMMMMM.M
..MMMMMMMMKKGGGGKKKKKKKKKKKGGGGKK.........MMMMMM.M
..MMMMMMMMKKGGGGKKKKKKKKKKKGGGGKK.........MMMMMM.M
..ttttttttKKGGGGKKMMMKMMMKKGGGGKK.........tttttttt
..ttttUtttKKGGGGKKMMMKMMMKKGGGGKK.........ttttUttt
..ttttUtttKKNNNNKKMMMKMMMKKNNNNKK.........ttttUttt
..ttttUtttKKKKKKKKWWWWWWWKKKKKKKK......RR.ttttUttt
..ttttttttKKKKKKKKWWWWWWWKKKKKKKK....RRRRRRttttttt
..ttttttttKKKKKKKKWWWWWWWKKKKKKKK..RRRRRRRRttttttt
..ttttttttKKKKKKKKNNNNNNNKKKKKKKK..vvvvvvvtttttttt
..ttttttttKKKKKKKNoooooooNKKKKKKK..vvvvvvvvttttttt
..ttttttttKKKKKKKNoooooooNKKKKKKK..vvvvvvvvttttttt
..ttttttttKKKKKKKNoooooooNKKKKKKK..vvvvvvvvttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.............MM..MM..MM....MM..MM..MM.............
............MMM.MMM.MMM.MM.MMM.MMM.MMM............
............MMM.MMM.MMM.MM.MMM.MMM.MMM............
............KKKKKKKKKKKKKKKKKKKKKKKKKK............
............KKKKKKKKKKKKKKKKKKKKKKKKKK............
............KKKKKKKKKKKKKKKKUKKKUKKKUK............
............KKKKKKKKKKKKKKKKUKKKUKKKUK............
............KKKKKKKKKKKKKKKKKKKKKKKKKK............
............KKKKKKKKKKKKKKKKKKKKKKKKKK............
............KKKKKKKKKKKKKKKKKKKKKKKKKK............
............KKKKKKKKKKKKKKKKKKKKKKKKKK............
.....MMM.MMMMKKKNGGNKKKNGGNKKKNGGNKKKKMMMMMMM.....
.....MMM.MMMMKKKNGGGKKKNGGGKKKNGGGKKKKMMMMMMM.....
.....MMM.MMMMKKKNGGGKKKNGGGKKKNGGGKKKKMMMMMMM.....
.....ttttttttKKKNGGGKKKNGGGKKKNGGGKKKKttttttt.....
.....tUttttttKKKNGGGKKKNGGGKKKNGGGKKKKttttttt.....
.....tUttttttKKKNNNNKKKNNNNKKKNNNNKKKKttttttt.....
.....tUttttttKKKKKKKRRRRRRRRRRKKKKKKKKttttttt.....
.....ttttttttKKKKKRRRRRRRRRRRRRRKKKKKKttttttt.....
.....ttttttttKKKRRRRRRRRRRRRRRRRRRKKKKttttttt.....
.....ttttttttKKvvRKKKKKKKKKKKKKKRvvKKKttttttt.....
.....ttttttttKKvvvKKKKKKKKKKKKKKKvvKKKttttttt.....
.....ttttttttKKvvvKKKKKKKKKKKKKKKvvKKKttttttt.....
.....ttttttttKKvvvKKKKKKKKKKKKKKKvvKKKttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWttttttt.....
EEEEEttttttttEEEEEEEEEEEEEEEEEEEEEEEEttttttttEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..tttttttt................................tttttttt
..tttttttt................................tttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt
..tttttt.....................................ttttt
..tttttt.....................................ttttt
...ttttt..KKNGGGKKKNGGGNKKKGGGNK.............ttttt
.....WWW..KKK..KKKKK...KKKK...KKK............WWW..
.....WWW..KKK..KKKKK...KKKK...KKK............WWW..
.....WWW..KKK.......kkkkkk....KKK..vvvvvvvvvvWWW..
.....WWW..NK........kkkkkk....KKN..vvvvvvvvvvWWW..
.....WWW..G.........kkkkkk......G..vvvvvvvvvvWWW..
.....WWW..G.........kkkkkk......G............WWW..
.....WWW..GK........kkkkkk....KKG............WWW..
.....WWW..KKK.................KKK............WWW..
.....WWW..KKK.................KKK............WWW..
.....WWW..KKK.................KKK............WWW..
.....WWW..NK..................KKN............WWW..
.....WWW..G.....................G............WWW..
.....WWW..G.....................G............WWW..
.....WWW..GK..................KKG............WWW..
.....WWW..KKK.................KKK............WWW..
.....WWW..KKK.................KKK............WWW..
.....WWW..KKK.................KKK............WWW..
.....WWW..NK..................KKN............WWW..
.....WWW..G.....................G............WWW..
.....WWW..G.....................G..vvvvvvvvvvWWW..
.....WWW..GK..................KKG..vvvvvvvvvvWWW..
.....WWW..KK..................KKK..vvvvvvvvvvWWW..
.....WWW..KK...KKKoooooooKK...KKK............WWW..
.....WWW..KK...KKKoooooooKK...KKK............WWW..
...ttWWW..KKGGGGKKoooooooKKGGGGK.............WWttt
..tttttt.....................................ttttt
..tttttt.....................................ttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWttttttt
..ttttttttWWWWWWWNoooooooNWWWWWWWWWWWWWWWWtttttttt
..tttttttt................................tttttttt
..tttttttt................................tttttttt
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
..tttttttt................................tttttttt
..tttttttt................................tttttttt
..tttttttt................................tttttttt
..tttttttt................................tttttttt
..tttttttt................................tttttttt
..tttttt.....................................ttttt
..tttttt.....................................ttttt
...tttt...KKNGGGKKKNGGGNKKKGGGNK.............ttttt
..........KKK..KKKKK...KKKK...KKK.................
..........KKK..KKKKK...KKKK...KKK.................
..........KKK.................KKK.................
..........NK..................KKN.................
..........G.....................G.................
..........G.....................G.................
..........GK..................KKG.................
..........KKK.................KKK.................
..........KKK.................KKK.................
..........KKK.................KKK.................
..........NK..................KKN.................
..........G.....................G.................
..........G.....................G.................
..........GK..................KKG.................
..........KKK.................KKK.................
..........KKK.................KKK.................
..........KKK.................KKK.................
..........NK..................KKN.................
..........G.....................G.................
..........G.....................G.................
..........GK..................KKG.................
..........KK..................KKK.................
..........KK...KKKKKKKKKKKK...KKK.................
..........KK...KKKKKKKKKKKK...KKK.................
...tttt...KKGGGGKKKKKKKKKKKGGGGK.............ttttt
..tttttt.....................................ttttt
..tttttt.....................................ttttt
..tttttttt.......MM.M..MM.................tttttttt
..tttttttt.......M......M.................tttttttt
..tttttttt........MM..M.M.................tttttttt
..tttttttt................................tttttttt
..tttttttt................................tttttttt
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00mmmjmmmm00000000000000000000000000000000mmmjmmjj
EEEtttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt   00mjjjjjjm00000000000000000000000000000000mjjjjjjj
EEEtttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt   00mjjjjjjj00000000000000000000000000000000mjjjjjjj
EEEtttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt   00jjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaajjjjjjjj
EEEtttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt   00mjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjj
EEEtttttlMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWlMtttttt   00mjjjjjmmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaammjjjjjj
EEEttttlllccccclllllcccccccccccccccccclllllllttttt   00mjjjjm0000000000000000000000000000000000000mjjjj
EEEttttMllccccclllllcccccccccccccccccclllllllMtttt   00mmmjmm0000hhhh000hhhhh00hhhhh00000000000000mmmjm
EEEEEWWWllMMKKMMKKMMKKMMKKMMKKMMMccccclllllllWWWEE   00000aaa00vvvsvvvsvvvsvvvsvvvsvvv000000000000aaa00
EEEEEWWWllMKKKKKKKKKKKKKKKKKKKKKMccccclllllllWWWEE   00000aaa00vsssssssssssssssssssssv000000000000aaa00
EEEEEWWWllKKKKKKKKKKKKKKKKKKKKKKcccRRRRRRRRRRWWWEE   00000aaa00vsssssssssssssssssssssv0eeeeeeeeeeeeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa0hsssssssssssssssssssssss0eeeeeeeeeeeeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0eeffffffffeeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effffffffffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKcRRRRRRRRRRRRWWEE   00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMllRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMllRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
EEEEEWWWllMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effffffffffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0eeffffffffeeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa0hsssssssssssssssssssssss0eeeeeeeeeeeeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKcccRRRRRRRRRRWWWEE   00000aaa00vsssssssssssssssssssssv0eeeeeeeeeeeeaa00
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMccccccclllllWWWEE   00000aaa00vsssssssssssssssssssssv000000000000aaa00
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMccccccclllllWWWEE   00000aaa00vvvsvvvsvvvsvvvsvvvsvvv000000000000aaa00
EEEEEWWWllllNNNNccnnnnnnnccNNNNccllllllllllllWWWEE   00000aaa000hhhhh0000000000hhhhh00000000000000aaa00
EEEEEWWWlllllllcccnnnnnnnccccccccllllllllllllWWWEE   00000aaa0000000000000000000000000000000000000aaa00
EEEEEWWWlllllllcccnnnnnnnccccccccllllllllllllWWWEE   00000aaa0000000000000000000000000000000000000aaa00
EEEEEWWWlllllllcccnnnnnnnlllllcccllllllllllllWWWEE   00000aaa0000000000000000000000000000000000000aaa00
EEEEEWWWlllllllcccnnnnnnnlllllcccllllllllllllWWWEE   00000aaa0000000000000000000000000000000000000aaa00
EEEttMMMlllllllcccnnnnnnnlllllcccllllllllllllMMttM   00mmjmmm0000000000000000000000000000000000000mmmjm
EEEttttllllllllcccnnnnnnnlllllcccllllllllllllttttt   00mjjjjm0000000000000000000000000000000000000mjjjj
EEEtttttlllllllcccnnnnnnnlllllccWllllllllllllttttt   00mjjjjjmmaaaaaaajjjjgjjjaaaaaaaaaaaaaaaaammjjjjjj
EEEtttttttWWWWWWWNWWWWWWWNWWWWWWWWWWWWWWWWWttttttt   00mjjjjjjmaaaaaaajggggggjaaaaaaaaaaaaaaaaamjjjjjjj
EEEtttttttWWWWWWWNWWWWWWMNWWWWWWWWWWWWWWWWWttttttt   00jjjjjjjmaaaaaaajjjjgjjjaaaaaaaaaaaaaaaaajjjjjjjj
EEEtttttttEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEttttttt   00mjjjjjjj00000000000000000000000000000000mjjjjjjj
EEEtttttttEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEttttttt   00mjjjjjjm00000000000000000000000000000000mjjjjjjj
EEEMEMtEMMEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEMMtEMtt   00mmmmjmmm00000000000000000000000000000000mmmjmmjj
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEtttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt   00jjjjjjjm00000000000000000000000000000000mjjjjjjj
EEEtttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt   00jjjjjjjj00000000000000000000000000000000jjjjjjjj
EEEtttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEttttttt   00mjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjj
EEEtttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt   00mjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjj
EEEttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttt   00jjjjjjmmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaammjjjjjj
EEEtttttccccccclllllcccccccccccccccccccccccccttttt   00mjjjjj0000000000000000000000000000000000000jjjjj
EEEttttMccccccclllllcccccccccccccccccccccccccMtttt   00mjjjjm0000000000000000000000000000000000000mjjjj
EEEEtMMcccccNNNNlllNNNNMccMNNNMccccRRRRRRRRRRMMMtM   00mmjmmm00vvvsvvvsvvvsvvvsvvvsvvv0eeeeeeeeeeemmmjm
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMccRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0eeeeeeeeeeeeaa00
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMccRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0eeffffffffeeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa00sssssssssssssssssssssss0effffffffffeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKcccRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWllMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWllMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa00sssssssssssssssssssssss0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKNccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccRRRRRRRRRRRWWEE   00000aaa0hsssssssssssssssssssssss0effggggggffeaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKcccRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0effffffffffeaa00
EEEEEWWWllMKKFFFFFFFFFFFFFFFFFKKMllRRRRRRRRRRRWWEE   00000aaa00vsssssssssssssssssssssv0eeffffffffeeaa00
EEEEEWWWllMKKFFFFFFFFFFFFFFFFFKKMllRRRRRRRRRRRWWEE   00000aaa0hvsssssssssssssssssssssv0eeeeeeeeeeeeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKKllRRRRRRRRRRWWWEE   00000aaa0hsssssssssssssssssssssss0eeeeeeeeeeeeaa00
EEEEEWWWllKKKFFFFFFFFFFFFFFFFFKKNllccccccccccWWWEE   00000aaa0hvsssssssssssssssssssssv000000000000aaa00
EEEEEWWWllMKKFFFFFFFFFFFFFFFFFKKMllccccccccccWWWEE   00000aaa0hvsssssssssssssssssssssv000000000000aaa00
EEEEEWWWccMKKFFFFFFFFFFFFFFFFFKKMccccclllllllWWWEE   00000aaa0hvsssssssssssssssssssssv000000000000aaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccccclllllllWWWEE   00000aaa00sssssssssssssssssssssss000000000000aaa00
EEEEEWWWccKKKFFFFFFFFFFFFFFFFFKKKccccllllllllWWWEE   00000aaa00vsssssssssssssssssssssv000000000000aaa00
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMllllllllllllWWWEE   00000aaa00vsssssssssssssssssssssv000000000000aaa00
EEEEEWWWccMKKKKKKKKKKKKKKKKKKKKKMllllllllllllWWWEE   00000aaa00vvvsvvvsvvvsvvvsvvvsvvv000000000000aaa00
EEEttMMMllllNNNNccnnnnnnnccNNNNccllllllllllllMMttM   00mmjmmm000hhhhh0000000000hhhhh00000000000000mmmjm
EEEttttllllllcccccnnnnnnnccccccccllllllllllllttttt   00mjjjjm0000000000000000000000000000000000000mjjjj
EEEtttttllllWcccccnnnnnnncccccccWllllllllllllttttt   00mjjjjjmmaaaaaaajjjjgjjjaaaaaaaaaaaaaaaaammjjjjjj
EEEtttttttWWWWWWWNWWWWWWWNWWWWWWWWWWWWWWWWWttttttt   00jjjjjjjmaaaaaaajggggggjaaaaaaaaaaaaaaaaamjjjjjjj
EEEtttttttWWWWWWWNWWWWWWMNWWWWWWWWWWWWWWWWWttttttt   00mjjjjjjmaaaaaaajjjgjjjjaaaaaaaaaaaaaaaaajjjjjjjj
EEEtttttttEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEttttttt   00mjjjjjjj00000000000000000000000000000000mjjjjjjj
EEEtttttttEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEttttttt   00mjjjjjjm00000000000000000000000000000000mjjjjjjj
EEEMMtEMEMEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEMMtEMtt   00mmmjmmmm00000000000000000000000000000000mmmjmmjj
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.50 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 183 nodi, 697 passi, finito in 483 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Terreno (marcatore), h=honey, i=indigo, K=Mura del mastio, s=slate, c=Cortile, W=Cinta muraria, l=Lastricato del cortile, G=Vetro, m=magenta, d=dead, dark, n=Via del cortile, r=Strada, b=black, t=Torre d'angolo, v=Muro della caserma, f=Pavimento del mastio, F=Solaio del mastio, g=Pavimento della caserma, R=Tetto della caserma, w=white, p=purple, x=x, O=Portone, o=Assi del portone, N=Cornice in pietra, T=Teal (marcatore), k=Gradini, M=Merli, U=Feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #94=porta di prova, #93=terreno di prova (marcatore), #95=solaio di prova, #96=pavimento di prova, #97=? (marcatore).
Alla fine: K 43461, t 34234, W 26085, v 6200, o 4260, E 3325, k 2720, F 2640, R 2556, U 2466, M 1632, N 1556, f 1400, G 1380, c 1000, g 600, l 375, O 240, r 225, n 75.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-45 one×4, all×23, prl×2, convchain×1: 404 celle x1-19 y2-19 z0, passi 2-49
   #47 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 50
#49-50 all×2: 27900 celle x20-64 y25-74 z0-18, passi 51-68
#51-52 all×2: 49600 celle x20-64 y25-74 z18-50, passi 69-100
#53-59 all×5, prl×2: 35350 celle x20-64 y25-74 z0-64, passi 101-182
    #60 all . i → i . passi=31: ×31, 74400 celle x25-59 y30-69 z1-32, passi 183-213, i→. 37200, .→i 37200
#61-62 all×2: 14800 celle x25-59 y30-69 z2-33, passi 214-244
    #63 all . i → i . (+1) passi=31: ×31, 86800 celle x25-59 y30-69 z33-64, passi 245-275, i→. 37200, .→i 37200, s→. 6200, .→s 6200
      r1 . i → i . ×37200; r2 . s → s . ×6200
    #64 prl i → F (+1): ×1, 1400 celle x25-59 y30-69 z64, passi 276, i→F 1200, s→F 200
      r1 i → F ×1200; r2 s → F ×200
    #65 all . w → w W passi=23: ×23, 49450 celle x10-94 y15-84 z0-23, passi 277-299, w→W 24725, .→w 24725
#66-69 prl×2, all×2: 6700 celle x10-94 y15-84 z0-37, passi 300-338
    #70 all . p → p t passi=43: ×43, 68800 celle x5-99 y10-89 z0-43, passi 339-381, p→t 34400, .→p 34400
#71-74 prl×2, all×2: 14600 celle x5-99 y10-89 z0-43, passi 382-415
    #75 all . b → b . passi=31: ×31, 37200 celle x70-89 y35-64 z1-32, passi 416-446, b→. 18600, .→b 18600
#76-130 prl×5, all×14: 30322 celle x19-89 y24-84 z0-49, passi 447-578
#131-183 prl×14, all×19: 44303 celle x5-99 y10-89 z6-70, passi 579-697
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/H → H/E passi=1
#9 prl E/h → h/* passi=1
#20 one cEEEEEE/cEEEEEE/cEEEEEE/cEEEEEE/cEEEEEE → *ccc***/*ccc***/*ccc***/*ccc***/*ccc*** passi=2: le celle cercate c'erano, ma mai disposte come nel pattern
#21 all cEEEEEEEE → *cccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#25 all WEEEEEE → *W***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#26 all WE/*W → *W/**: le celle cercate c'erano, ma mai disposte come nel pattern
#41 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#42 all cWWEEEEE → ***aa*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#43 all [Wt]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#44 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#77 all . q → q Q passi=3: in quel momento nella griglia non c'erano celle "q"
… e altri 49
Fix it and answer with the whole program.

## Risposta

<!--
  Forte medievale:
  - Parti e lettere di pianta:
    i: sala del mastio (keep), K: mura del mastio, s: zona scala interna del mastio, d: portone del mastio
    c: cortile in terra battuta, l: lastricato sparso del cortile, n: via lastricata dal portone al corpo di guardia
    W: cinta muraria con camminamento, t: torri d'angolo, G: corpo di guardia sul fronte, r: strada esterna fino al bordo
    b: caserma coperta addossata alla cinta, v: muri della caserma, Q: pozzo nel cortile, a: fossato esterno
    (h, m: marcatori temporanei di costruzione)
  - Disposizione: il mastio (i, K) sorge nella zona centrale (almeno 7x8 celle interne, così la sala davanti alla scala
    misura almeno 30x35 voxel liberi) con la scala (s) lungo il muro posteriore e il portone (d) sul fronte; intorno si
    apre il cortile (c, l) con bracci asimmetrici, racchiuso dalla cinta muraria (W) con torri sugli spigoli esterni (t);
    dal portone la via (n) attraversa il cortile fino al corpo di guardia (G) e prosegue come strada (r) fino al bordo
    anteriore; caserma (b, v) e pozzo (Q) stanno nel cortile lasciando almeno 2 celle libere davanti per il passaggio;
    il fossato (a) cinge l'esterno.
  - Variazione tra i semi: posizione laterale e arretramento del mastio, profondità del mastio, bracci asimmetrici del
    cortile che piegano la cinta, posizione della caserma e del pozzo, trama del lastricato nel cortile.
  - Adattamento alle taglie:
    Large (20x20): mastio a due piani con scala e sala ampia, cortile con braccio asimmetrico, cinta con torri 3x3,
    corpo di guardia e strada.
    Huge (30x30): cortile ampliato con bracci asimmetrici, caserma coperta con tetto a padiglione e pozzo.
    Gargantuan (100x100): cortile ancora più ampio, cinta spessa, caserma, pozzo e fossato esterno.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhiKscWlGmdnrbtvQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Spostamento casuale del centro del mastio per variare la sagoma tra i semi -->
      <one in="HE" out="EH" symmetry="(x)" steps="2"/>
      <prl in="E/H" out="H/E" p="0.5" steps="1" symmetry="()"/>

      <!-- Mastio: almeno 7x8 celle interne (35x40 voxel) per avere >=30 voxel liberi davanti alla scala -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hhi]E" out="*i" symmetry="(x)" steps="3"/>
      <prl in="h" out="i"/>
      <all in="[Hi]E" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- Zona della scala del mastio lungo il muro posteriore (2 celle pianerottolo + 4 scala + 1 sbarco) -->
      <one in="KKKKKKK/iiiiiii/iiiiiii" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>

      <!-- Cortile base attorno al mastio e braccio asimmetrico casuale (anche a Large) -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="cEEEE/cEEEE/cEEEE/cEEEE" out="*cc**/*cc**/*cc**/*cc**" steps="1"/>

      <!-- Espansione del cortile dove c'è spazio (Huge e Gargantuan) e bracci casuali per sagome spezzate -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="cEEEEEE/cEEEEEE/cEEEEEE/cEEEEEE/cEEEEEE" out="*ccc***/*ccc***/*ccc***/*ccc***/*ccc***" steps="2"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile (spessa 2 celle dove resta ampio spazio) -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEEEEEE" out="*W*****" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo 3x3 su ogni spigolo convesso esterno della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Via d'uscita dal centro al fronte: portone del mastio (d), via nel cortile (n), corpo di guardia (G), strada (r) -->
      <all in="H/i" out="*/m" symmetry="()" steps="1"/>
      <all in="m/i" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="i"/>
        <rule in="H" out="i"/>
      </prl>

      <!-- Caserma coperta (6x4 celle) addossata alla cinta con 2 celle (10 voxel) di cortile libero davanti, e pozzo -->
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vbbbbbbv/vbbbbbbv/vbbbbbbv/vbbbbbbv/********/********" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove resta terreno libero oltre la cinta (Gargantuan) -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Lastricato sparso nel cortile -->
      <convchain on="c" black="c" white="l" n="3" steps="6"><sample>cccllll/cccllll/ccclllc/llccccc/llcccll/lllccll/cllllcc</sample></convchain>
    </sequence>

    <map scale="5 5 1" values="BEfFgKWtvRclnrQaisdhwpmbq xOoNTkGMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="K" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="G" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="KWtv"/>
        <union symbol="=" values="fFg"/>
        <union symbol="%" values="KWt"/>

        <!-- B. Altezze: mura del mastio (65 voxel con due fasce finestre U) -->
        <all in="B h" out="h K" steps="6"/>
        <all in="B h" out="h U" steps="12"/>
        <all in="B h" out="h K" steps="20"/>
        <all in="B h" out="h U" steps="12"/>
        <all in="B h" out="h K" steps="14"/>
        <prl in="h" out="K"/>

        <!-- Portone del mastio: seme O sul pavimento, poi muro K fino in cima -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="63"/>
        <prl in="d" out="K"/>

        <!-- Sala del mastio e scala: 2 piani coperti (pavimento z=0, scala z=1, solaio z=32, terrazza z=64) -->
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

        <!-- Cinta muraria (24 voxel) e corpo di guardia (38 voxel con seme O) -->
        <all in="B w" out="w W" steps="23"/>
        <prl in="w" out="W"/>
        <all in="B x" out="x O" steps="1"/>
        <all in="B x" out="x W" steps="36"/>
        <prl in="x" out="W"/>

        <!-- Torri d'angolo (44 voxel) -->
        <all in="B p" out="p t" steps="43"/>
        <prl in="p" out="t"/>

        <!-- Caserma coperta (32 voxel + tetto R) e pozzo (4 voxel) -->
        <all in="B m" out="m v" steps="31"/>
        <prl in="m" out="R"/>
        <all in="B b" out="b g" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <prl in="b" out="R"/>
        <all in="B q" out="q Q" steps="3"/>
        <prl in="q" out="Q"/>

        <!-- C. Scala piena: porte, scale, finestre, merli, feritoie, tetto della caserma -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <prl in="U" out="K"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto a padiglione della caserma -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="7" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6A8E4E" hidden="True" name="Terreno"/>
  <color symbol="f" value="C8A878" area="keep" name="Pavimento del mastio"/>
  <color symbol="F" value="B09468" area="keep" name="Solaio del mastio"/>
  <color symbol="g" value="B8986A" area="barracks" name="Pavimento della caserma"/>
  <color symbol="K" value="6E6A63" area="keep" name="Mura del mastio"/>
  <color symbol="W" value="7E7A72" area="wall" name="Cinta muraria"/>
  <color symbol="t" value="5E5A54" area="tower" name="Torre d'angolo"/>
  <color symbol="v" value="8A7F70" area="barracks" name="Muro della caserma"/>
  <color symbol="R" value="A64B3C" area="barracks" name="Tetto della caserma"/>
  <color symbol="M" value="8C877E" name="Merli"/>
  <color symbol="O" value="5C3A21" name="Portone"/>
  <color symbol="o" value="3E2514" name="Assi del portone"/>
  <color symbol="N" value="4A443C" name="Cornice in pietra"/>
  <color symbol="G" value="7CA6B8" name="Vetro"/>
  <color symbol="k" value="9C7A54" name="Gradini"/>
  <color symbol="U" value="2B2825" name="Feritoia"/>
  <color symbol="c" value="9E8F6E" area="courtyard" name="Cortile"/>
  <color symbol="l" value="ABA396" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="n" value="B5ADA0" area="courtyard" name="Via del cortile"/>
  <color symbol="r" value="C2B28F" area="road" name="Strada"/>
  <color symbol="Q" value="68645D" area="courtyard" name="Pozzo"/>
  <color symbol="a" value="4A7C9B" area="moat" name="Acqua"/>
  <color symbol="#20" value="5C3A21" hidden="True" name="Portone aperto"/>
  <color symbol="#21" value="3E2514" hidden="True" name="Assi aperte"/>

  <action name="open" label="Apri il portone">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi il portone">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>

