# model.sculpt · gemini-4-neon · 45 s

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
  Concetto: Forte medievale (mastio centrale a due piani abitabili con scala interna e terrazza merlata, cortile asimmetrico, mura di cinta con camminamento e merli, torri d'angolo, corpo di guardia con porta apribile, caserma con tetto spiovente, pozzo, fossato con ponte e alberi).
  Parti e lettere della pianta (griglia 1/5, 1 cella = 5 voxel):
    h: pavimento del mastio (almeno 7x8 celle attorno a H, con estensione casuale pulita su un lato per seme)
    s: zona della scala interna del mastio (lungo il muro di fondo, 2 celle di pianerottolo prima, 4 di scala, almeno 6 celle libere davanti)
    w: mura del mastio (attorno a h, con porta frontale d)
    d: porta del mastio (3 celle al centro della facciata)
    c: cortile (attorno al mastio, con braccio asimmetrico casuale su un lato per seme)
    n: lastricato nel cortile (collega d al corpo di guardia g)
    W: mura di cinta (attorno al cortile)
    t: torri d'angolo (3x3 su ogni angolo esterno convesso delle mura di cinta)
    g: corpo di guardia (3 celle sul fronte delle mura di cinta)
    r: strada d'accesso (dal corpo di guardia fino al bordo anteriore)
    a, v: caserma addossata all'interno delle mura di cinta (dove il cortile è ampio)
    Q: pozzo nel cortile (dove c'è uno spiazzo libero 5x5)
    f: fossato esterno alle mura (dove resta terreno libero oltre le mura)
    p: ponte della strada sul fossato
    L: alberi nel terreno circostante (dove c'è spazio 7x7)
    m: marcatore temporaneo dell'asse centrale (ripulito in h)
  Variazione tra i semi: estensione del mastio in profondità e su un lato casuale, braccio asimmetrico del cortile su un lato casuale, posizione della caserma, del pozzo e degli alberi.
  Cosa entra per taglia:
    Large (20x20): mastio a due piani con ampia sala (almeno 30x30 voxel liberi davanti alla scala), cortile asimmetrico, mura di cinta, torri d'angolo, corpo di guardia e strada.
    Huge (30x30): cortile più ampio, caserma con tetto spiovente, pozzo, fossato con ponte e alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdcnWtgarpvQfLm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio attorno al centro H: almeno 7x8 celle (35x40 voxel) + estensione casuale pulita per variare i semi -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <one in="hE/hE/hE/hE/hE/hE/hE/hE" out="*h/*h/*h/*h/*h/*h/*h/*h" symmetry="(x)" steps="1"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala nel mastio: lungo il muro di fondo, 2 celle di pianerottolo prima, 4 di scala, 1 dopo; almeno 6 celle (30 voxel) libere davanti -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/w**ssss*/w**ssss*" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio: stretto a Large con braccio asimmetrico sui lati, si espande a Huge -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="cEEE/cEEE/cEEE/cEEE/cEEE" out="*cc*/*cc*/*cc*/*cc*/*cc*" symmetry="(x)" steps="1"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Mura di cinta attorno al cortile e torri 3x3 sugli angoli esterni -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Asse centrale dal mastio al bordo anteriore: porta d, lastricato n, corpo di guardia g, strada r -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/W" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Parti aggiuntive dove c'è spazio (Huge): caserma, pozzo, fossato con ponte, alberi -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc" out="******/Wvvvv*/Wvaav*/Wvaav*/Wvvvv*" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="WEEEEE" out="**ff**" steps="1"/>
      <all in="[Wt]E/*f" out="**/*f"/>
      <all in="fE/*f" out="*f/**"/>
      <all in="rf" out="pf" symmetry="(x)"/>
      <all in="pr" out="pp" symmetry="(x)" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***L***/*******/*******/*******"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdcnWtgarpvQfLXYZFPRKACJIOoNTkMUG#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Q" out="PPPPP/PIIIP/PIIIP/PIIIP/PPPPP"/>
      <rule in="f" out="IIIII/IIIII/IIIII/IIIII/IIIII"/>
      <rule in="p" out="JJJJJ/JJJJJ/JJJJJ/JJJJJ/JJJJJ"/>
      <rule in="L" out="EEEEE/EEEEE/EEAE*/EEEEE/EEEEE"/>

      <union symbol="+" values="XY"/>
      <union symbol="=" values="ZF"/>
      <union symbol="%" values="XY"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: il mastio (due piani da 32 + terrazza merlata a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B w" out="w X" steps="6"/>
        <all in="B d" out="d X" steps="5"/>
        <all steps="14">
          <rule in="B w" out="w U"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="18">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w U"/>
          <rule in="B d" out="d U"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <prl>
          <rule in="w" out="X"/>
          <rule in="d" out="X"/>
        </prl>

        <!-- Pavimenti, striscia scala T e solaio del mastio -->
        <all steps="1">
          <rule in="B h" out="h Z"/>
          <rule in="B s" out="s Z"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
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

        <!-- Mura di cinta (24), corpo di guardia (38) e torri d'angolo (44) -->
        <all in="B W" out="W Y" steps="23"/>
        <prl in="W" out="Y"/>
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g Y" steps="36"/>
        <prl in="g" out="Y"/>
        <all in="B t" out="t Y" steps="43"/>
        <prl in="t" out="Y"/>

        <!-- Caserma interna (dove presente): pareti e tetto spiovente -->
        <all in="B v" out="v Y" steps="25"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a Z" steps="1"/>
        <all in="B a" out="a B" steps="24"/>
        <prl in="a" out="R"/>

        <!-- Pozzo e alberi -->
        <all in="B P" out="P *" steps="5"/>
        <all in="B A" out="A *" steps="16"/>
        <all in="B A" out="C *" steps="1"/>
        <all in="C B" out="C *" steps="4"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="4"/>

        <!-- C. Scala reale: porte, scala interna, finestre, merli, feritoie, tetto caserma e camino -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <prl in="U" out="X"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto spiovente della caserma e camino sul mastio -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>
        <one in="B B F" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="8"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="7c9a59" hidden="True" name="Terreno"/>
  <color symbol="H" value="d9c7a3" hidden="True" name="Centro"/>
  <color symbol="c" value="c2b280" area="courtyard" name="Cortile"/>
  <color symbol="n" value="9e9a8e" area="courtyard" name="Lastricato"/>
  <color symbol="r" value="a89878" name="Strada"/>
  <color symbol="X" value="6e7075" name="Pietra del mastio"/>
  <color symbol="Y" value="7d8085" name="Pietra delle mura"/>
  <color symbol="Z" value="b89b72" area="keep" name="Tavolato"/>
  <color symbol="F" value="949699" area="keep" name="Solaio in pietra"/>
  <color symbol="P" value="8a8880" name="Pietra del pozzo"/>
  <color symbol="R" value="a64b38" name="Tegole del tetto"/>
  <color symbol="K" value="54565c" name="Camino in pietra"/>
  <color symbol="A" value="6e4c2e" name="Tronco"/>
  <color symbol="C" value="4b7338" name="Chioma"/>
  <color symbol="J" value="855e42" name="Legno del ponte"/>
  <color symbol="I" value="3d6e8f" name="Acqua"/>
  <color symbol="O" value="6b4423" name="Porta"/>
  <color symbol="o" value="4a2e16" name="Assi della porta"/>
  <color symbol="N" value="595b61" name="Cornice in pietra"/>
  <color symbol="T" value="8c6d46" hidden="True" name="Traccia della scala"/>
  <color symbol="k" value="9c7a54" name="Gradini"/>
  <color symbol="M" value="75787d" name="Merli"/>
  <color symbol="U" value="3b3d42" name="Feritoia"/>
  <color symbol="G" value="7aa6bd" name="Vetro"/>
  <color symbol="#20" value="6b4423" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="4a2e16" hidden="True" name="Assi aperte"/>

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
It does not pass: taglia Enorme, seme 1: pezzi staccati: 48% dei voxel non poggia a terra né su ciò che vi poggia (6 pezzi) — everything must rest on the bottom and be attached to the main body
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, c Cortile, n Lastricato, r Strada, X Pietra del mastio, Y Pietra delle mura, Z Tavolato, F Solaio in pietra, P Pietra del pozzo, R Tegole del tetto, K Camino in pietra, J Legno del ponte, O Porta, o Assi della porta, N Cornice in pietra, k Gradini, M Merli, U Feritoia, G Vetro, S muro di prova
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEESSSSSSSSSSSSSSSSSSSSSSSSSSSSSEEEEEEEEE
EEEEEEEEEEEESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSEEEEEEEE
EEEEEEEEEEEESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSEEEEEEEE
EEEEEEEEEEEESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSEEEEEEEE
EEEEEEEYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYYYEEE
EEEEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEEE
EEEEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEEE
EEEEEEEYYYcccccccccccccccccccccccccccccccccYYYYEEE
EEEEEEEYYYcccccccccccccccccccccccccccccccccMYYEEEE
EEESSSSEYYcccccccccccccccccccccccccccccccccYYEEEEE
EEESSSSEYYcccccccccccccccccccccccccccccccccYYEEEEE
EEESSSSEYYcccccccccccccccccccccccccccccccccYYEEEEE
EEESSSSEYYRRRRRRRccccccccccccccccccccccccccYYEEEEE
EEESSSSEYYRRRRRRRccccccccccccccccccccccccccYYEEEEE
EEESSSSEYYRRRRRRRccccccccccccccccccccccccccYYEEEEE
EEESSSSEYYRRRRRRRcccXNXXcXXXcXXNXXMccccccccYYEEEEE
EEESSSSEYYRRRRRRRccXXXXXXXXXXXXXXXXccccccccYYEEEEE
EEESSSSEYYRRRRRRRcXXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYRRRRRRRcNXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccXXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccXXFFFFFFFFFFFFFXXccccPcccYYEEEEE
EEESSSSEYYcccccccccXFFFFFFFFFFFFFXXcccPPcccYYEEEEE
EEESSSSEYYccccccccXXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccXXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccXXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYcccccccccXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccXXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccXXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccNXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccXXFFFFFFFFFFFFFXXccccccccYYEEEEE
EEESSSSEYYccccccccXXXXXXXXXXXXXXXXXccccccccYYEEEEE
EEESSSSEYYccccccccMXXXXXXXXXXXXXXXMccccccccYYEEEEE
EEESSSSEYYcccccccccccccnnnnncccccccccccccccYYEEEEE
EEESSSSEYYcccccccccccccnnnnncccccccccccccccYYEEEEE
EEESSSSEYYcccccccccccccnnnnncccccccccccccccYYEEEEE
EEEEEEEYYYcccccccccccccnnnnnccccccccccccccccYEEEEE
EEEEEEEYYYcccccccccccccnnnnncccccccccccccccYYYYEEE
EEEEEEEYYYYYYYYYYYYYYYYMYYYYMYYYYYYYYYYYYYYYYYYEEE
EEEEEEEYYYYYYYYYYYYYYYYMYYYYMYYYYYYYYYYYYYYYYYYEEE
EEEEEEEYYYYYEEEEEEEEEEErrrrrEEEEEEEEEEEEEEYYYYYEEE
EEEEEEEEEEEESSSSSSSSSSSJJJJJSSSSSSSSSSSSSSEEEEEEEE
EEEEEEEEEEEESSSSSSSSSSSJJJJJSSSSSSSSSSSSSSEEEEEEEE
EEEEEEEEEEEESSSSSSSSSSSJJJJJSSSSSSSSSSSSSSEEEEEEEE
EEEEEEEEEEEESSSSSSSSSSSJJJJJSSSSSSSSSSSSSEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00000000
00000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00000000
00000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00000000
000000eeeeezzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzeeeee000
000000edddde00000000000000000000000000000edddde000
000000edddde77777777777777777777777777777edddde000
000000ddddee77777777777777777777777777777eeddde000
000000edde000000000000000000000000000000000edde000
000zzzzeee000000000000000000000000000000000eede000
000zzzz0770000000000000000000000000000000007700000
000zzzz0770000000000000000000000000000000007700000
000zzzz0777777777000000000000000000000000007700000
000zzzz0778888888000000000000000000000000007700000
000zzzz0778888888000000000000000000000000007700000
000zzzz0778888888000000000000000000000000007700000
000zzzz07788898880lljlllllljlllllll000000007700000
000zzzz07788888880ljjjjjjjjjjjjjjjl000000007700000
000zzzz07788888880jjjjjjjjjjjjjjjjjb00000007700000
000zzzz07788888880ljjjjjjjjjjjjjjjlb00000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjlb00000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjlb00zz0007700000
000zzzz07700000000ljjjjjjjjjjjjjjjl000zz0007700000
000zzzz07700000000ljjjjjjjjjjjjjjjlb00000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjlb00000007700000
000zzzz07700000000jjjjjjjjjjjjjjjjjb00000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjl000000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjl000000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjlb00000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjlb00000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjlb00000007700000
000zzzz07700000000ljjjjjjjjjjjjjjjl000000007700000
000zzzz07700000000lljlllllljlllllll000000007700000
000zzzz0770000000002bbbb0bbb00bbb00000000007700000
000zzzz0770000000000000000000000000000000007700000
000zzzz0770000000000000000000000000000000007700000
000zzzzeee000000000000000000000000000000000edee000
000000edde000000000000000000000000000000000edde000
000000ddddee77777777777dddddd777777777777eeddde000
000000edddde77777777777dddddd777777777777edddde000
000000edddde00000000000000000000000000000edddde000
000000eeedezzzzzzzzzzzzz0000zzzzzzzzzzzzzzeeeee000
00000000000zzzzzzzzzzzzz0000zzzzzzzzzzzzzz00000000
00000000000zzzzzzzzzzzzz0000zzzzzzzzzzzzzz00000000
00000000000zzzzzzzzzzzzz0000zzzzzzzzzzzzzz00000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........
...XXXX.....XXXXNGNXXXXXXNGNXXXXXXGGXXXXXX........
...XXXX.....XXXXGGGXXXXXXXGGXXXXXXGGXXXXXX........
...XXXX.....XXXXGGGXXXXXXXGGXXXXXXGGXXXXXX........
...XXXX.....XXXXGGGXXXXXXNGGXXXXXXGGXXXXXX........
...XXXX.....XXXXNSNXXXXXMMMNXXXXXXSSXXXXXX........
...SSSS.....SSSSSSSSSSSSMSMSSSSSSSSSSSSSSS........
...SSSS.....SSSSSSSSSSSXXXXXSSSSSSSSSSSSSS........
..................XXXXXXXXXXXXXXXXX...............
..................XXXXXXXXXXXXXXXXX...............
..................XXXXXXXXXXXXXXXXX...............
..................XXXXXXXXXXXXXXXXX...............
.......MMMM.......XXXGGXXXGGXXGGGXX.......MMMM....
.......MMMMM......XXXGGXXXGGXXGGGXX.......MMMMM...
.......YYYYY......XXXGGMXMGMXXGGGXX.......YYYYY...
.......YYYYY......XXXGGMMMGMXXGGGXX.......YYYYY...
.......YYYYY......XXXXXYYYYYXXXXXXX.......YYYYY...
.......YYYYY......XXXXXYYYYYXXXXXXX.......YYYYY...
.......YYYYY......XXXXXYYYYYXXXXXXX.......YYYYY...
.......YYYYYRRR...XXXXXNooooOXXXXXX.......YYYYY...
.......YYYYYRRRRR.XXXXXNooooOXXXXXX.......YYYYY...
.......YYYYYYYYYYYYYYYYNooooOYYYYYYYYYYYYYYYYYY...
.......YYYYYYYYYYYYYYYYNooooOYYYYYYYYYYYYYYYYYY...
.......YYYYYYYYYYYYYYYYNooooOYYYYYYYYYYYYYYYYYY...
.......YYYYYYYYYYYYYYYYNooooOYYYYYYYYYYYYYYYYYY...
.......YYYYYYYYYYYYYYYYNooooOYYYYYYYYYYYYYYYYYY...
.......YYYYYYYYYYYYYYYYNooooOYYYYYYYYYYYYYYYYYY...
.......YYYYYYYYYYYYYYYYNooooOYYYYYYYYYYYYYYYYYY...
......EYYYYYYYYYYYYYYYYrooooEYYYYYYYYYYYYYYYYYY...
```
Right side (looking from the right):
```
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...SSSS.....SSSSSSSSSSSSSSSSSSSSSSSSSS.....SSSS...
...XXXX.....XXNGNXXNGNXXXGXXNGNXXNGNXX.....XXXX...
...XXXX.....XXXGGXXGGGXXXGXXXGGXXGGGXX.....XXXX...
...XXXX.....XXXGGXXGGGXXXGXXXGGXXGGGXX.....XXXX...
...XXXX.....XXXGGXXGGMXXXGXXMGGXXGGGXX.....XXXX...
...XXXX.....XXSSNXMMSMMXXMMXMMMMXMMSXX.....XXXX...
...SSSS.....SSSSSSMMSMMSSSMSMMSMSMMSSS.....SSSS...
...SSSS.....SSSSSSXXXXXXSXXXXXXXXXXSSS.....SSSS...
..................XXXXXXXXXXXXXXXXX...............
..................XXXXXXXXXXXXXXXXX...............
..................XXXXXXXXXXXXXXXXX...............
..................XXXXXXXXXXXXXXXXX...............
.......MMMM.......XXXGGXXXGGXXGGGXX....MMMM.......
.......MMMMM......XXXGGXXXGGXXGGGXX...MMMMM.......
.......YYYYY......XXXGGXXXGGXXGGGXX...YYYYY.......
.......YYYYY......XXXGGXXXGGXXGGGXX...YYYYY.......
.......YYYYY......XXXXXXXXXXXXXXXXX...YYYYY.......
.......YYYYY......XXXXXXXXXXXXXXXXX...YYYYY.......
.......YYYYY......XXXXXXXXXXXXXXXXX...YYYYY.......
.......YYYYY.....RXXXXXXXXXXXXXXXXX...YYYYY.......
.......YYYYY...RRRXXXXXXXXXXXXXXXXX...YYYYY.......
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.......
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.......
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.......
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.......
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.......
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.......
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.......
......EYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYE......
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
.......YYYYY..............................YYYYY...
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY...
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY...
.......YYY.................................YYYY...
.......YYY.................................YYY....
........YY.................................YY.....
........YY.................................YY.....
........YY.................................YY.....
........YYYYYYYYY..........................YY.....
........YYYYYYYYY..........................YY.....
........YYYY...YY..........................YY.....
........YYYY...YY..XX..XXX..XX..XXX........YY.....
........YYYY...YY.XXX..XXX..XX..XXX........YY.....
........YYYYYYYYY.XX.....kkkk....XX........YY.....
........YYYYYYYY.........kkkk..............YY.....
........YY...............kkkk..............YY.....
........YY........XX.............XX........YY.....
........YY........XX.............XX........YY.....
........YY........XX..............X........YY.....
........YY.................................YY.....
........YY........................G........YY.....
........YY........XX.............XX........YY.....
........YY........XX.............XX........YY.....
........YY........................X........YY.....
........YY.................................YY.....
........YY........XX..............X........YY.....
........YY........XX..XoooooXX...XX........YY.....
........YY........XX..XoooooXXX.XXX........YY.....
........YY.................................YY.....
........YY.................................YY.....
........YY.................................YY.....
.......YYY.................................YYY....
.......YYY.................................YYYY...
.......YYYYYYYYYYYYYYYYoooooNYYYYYYYYYYYYYYYYYY...
.......YYYYYYYYYYYYYYYYoooooNYYYYYYYYYYYYYYYYYY...
.......YYYYY..............................YYYYY...
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
..................................................
..................................................
.......YYYYY..............................YYYYY...
.......YYYYY..............................YYYYY...
.......YYYYY..............................YYYYY...
.......YYY.................................YYYY...
.......YYY..................................YY....
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
...................XX..XXX..XX..XXX...............
..................XXX..XXX..XX..XXX...............
..................XX.............XX...............
..................................................
..................................................
..................XX.............XX...............
..................XX.............XX...............
..................XX..............X...............
..................................................
..................................G...............
..................XX.............XX...............
..................XX.............XX...............
..................................X...............
..................................................
..................XX..............X...............
..................XXX..XX...XX...XX...............
..................XXX..XXX.XXXX.XXX...............
..................................................
..................................................
..................................................
.......YYY..................................YY....
.......YYY.................................YYYY...
.......YYYYY..............................YYYYY...
.......YYYYY..............................YYYYY...
.......YYYYY..............................YYYYY...
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
............XXXX..XXX..XXX..XX..XXX..XXXX.........
............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSX........
............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSX........
............XXXX..XXX..XXX..XX..XXX..XXXX.........
..................................................
..................................................
..................................................
..................................................
..................................................
...XSSX...........................................
...XSSX...........................................
...XSSX...........................................
....SS............................................
....SS............................................
...XSSX...........................................
...XSSX...........................................
....SS............................................
....SS............................................
...XSSX...........................................
...XSSX...........................................
...XSSX...........................................
....SS............................................
....SS............................................
...XSSX...........................................
...XSSX...........................................
...XSSX...........................................
....SS............................................
....SS............................................
...XSSX...........................................
...XSSX...........................................
....SS............................................
....SS............................................
...XSSX...........................................
...XSSX...........................................
...XSSX...........................................
..................................................
..................................................
..................................................
..................................................
..................................................
............XXXX...XXXX......XXXXX..XXXXX.........
............SSSSSSSSSSS.....XSSSSSSSSSSSSX........
............SSSSSSSSSSS.....XSSSSSSSSSSSSX........
............XXXX...XXXX......XXXXX..XXXXX.........
..................................................
..................................................
..................................................
```
### Seed 1: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0000000mmmmjmmm00000000000000000000000000000000000
EEEEEEEEYYYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0000000mjjjjjjm00000000000000000000000000000000000
EEEEEEEEYYYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0000000mjjjjjjm00000000000000000000000000000000000
EEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   0000000jjjjjjjjaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   0000000mjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEEEEYYYYYcMYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   0000000mjjjjjmmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEEEEYYYYccccccccccccccccccccccccccccccccccccYY   0000000mjjjjm0000000000000000000000000000000000aaa
EEEEEEEEYYYYMcccccccccccccccccccccccccccccccccccYY   0000000mmjmmm00000hhhhh00hhhhh00hhhhh0000000000aaa
EEEEEEEEEEYYYccMMXXMMXXMMXXMXXMMXXMMXXMMccccccccYY   0000000000aaa00wwwtwwwtwwwtwtwwwtwwwtwww0000000aaa
EEEEEEEEEEYYYccMXXXXXXXXXXXXXXXXXXXXXXXXccccccccYY   0000000000aaa00wtttttttttttttttttttttttw0000000aaa
EEEEEEEEEEYYYccXXXXXXXXXXXXXXXXXXXXXXXXXccccccccYY   0000000000aaa00wtttttttttttttttttttttttw0000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa0htttsssssssssssssssssssttth000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa0htttsssssssssssssssssssttth000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa00wttsssssssssssssssssssttw0000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa00wttsssssssssssssssssssttw0000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0htttsssssssssssssssssssttth000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0htttsssswssssssssssssssttth000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa00wttsssssssssssssssssssttw0000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa00wttsssssssssssssssssssttw0000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa0htttsssssssssssssssssssttth000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYY   0000000000aaa0hwttsssssssssssssssssssttwh000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFFXXccccccccYY   0000000000aaa0htttsssssssssssssssssssttth000000aaa
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFFFXXXccccccccYY   0000000000aaa00wtttttttttttttttttttttttw0000000aaa
EEEEEEEEEEYYYccMXXXXXXXXXXXXXXXXXXXXXXXXccccccccYY   0000000000aaa00wtttttttttttttttttttttttw0000000aaa
EEEEEEEEEEYYYccMXXXXXXXXXXXXXXXXXXXXXXXMccccccccYY   0000000000aaa00wwwtwwwtwwwtwtwwwtwwwtwww0000000aaa
EEEEEEEEYYMMMccccNNNNNnnnnNNNncccNNNNcccccccccccYY   0000000mmjmmm00033hhhhh00hhhhh00hhhhh0000000000aaa
EEEEEEEEYYYYcccccccccccnnnnnnnccccccccccccccccccYY   0000000mjjjjm0000000000000000000000000000000000aaa
EEEEEEEEYYYYYccccccccccnnnnnnncccccccccccccccccYYY   0000000mjjjjjmmaaaaaaajjjjgjjjaaaaaaaaaaaaaaaaaaaa
EEEEEEEEYYYYYYYYYYYYYYNYYYYYYYNYYYYYYYYYYYYYYYYYYY   0000000mjjjjjjmaaaaaaajggggggjaaaaaaaaaaaaaaaaaaaa
EEEEEEEEYYYYYYYYYYYYYYNYYYYYYMNYYYYYYYYYYYYYYYYYYY   0000000jjjjjjjjaaaaaaajjjgjjjjaaaaaaaaaaaaaaaaaaaa
EEEEEEEEYYYYYYYEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   0000000mjjjjjjm00000000000000000000000000000000000
EEEEEEEEYYYYYYYEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   0000000mjjjjjjm00000000000000000000000000000000000
EEEEEEEEMMYEMEMEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   0000000mmmjmmmm00000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 2: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000mmmmjmmm00000000000000000000000000000mmmjmmjj
EEEEEMYYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYYYYY   00000mjjjjjjm00000000000000000000000000000mjjjjjjj
EEEEEYYYYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYYYYY   00000mjjjjjjj00000000000000000000000000000jjjjjjjj
EEEEEMYYYYYYMYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00000mjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjj
EEEEEYYYYYYYMYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00000jjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjj
EEEEEYYYYYYMcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYcMYYYYYY   00000mjjjjjmmaaaaaaaaaaaaaaaaaaaaaaaaaaaaammjjjjjj
EEEEEMYYYYcccccccccccccccccccccccccccccccccccYYYYY   00000mjjjm00000000000000000000000000000000000mjjjj
EEEEEMYYYMcccccccccccccccccccccccccccccccccccMYYYY   00000mjmmm000000hhhh000hhhh000hhhh00000000000mmmjm
EEEEEEEEYYcccMMXXMMXXMMXXXXMMXXMMXXMMMcccccccYYYEE   0000000aaa00wwwtwwwtwwwtwwtwwwtwwwtwww0000000aaa00
EEEEEEEEYYcccXXXXXXXXXXXXXXXXXXXXXXXXMcccccccYYYEE   0000000aaa00wttttttttttttttttttttttttw0000000aaa00
EEEEEEEEYYcccXXXXXXXXXXXXXXXXXXXXXXXXccccccccYYYEE   0000000aaa00wttttttttttttttttttttttttw0000000aaa00
EEEEEEEEYYccXXXFFFFFFFFFFFFFFFFFFFFXXXcccccccYYYEE   0000000aaa00tttssssssssssssssssssssttt0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccXXXFFFFFFFFFFFFFFFFFFFFXXXcccccccYYYEE   0000000aaa00tttssssssssssssssssssssttt0000000aaa00
EEEEEEEEYYcccXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYcccXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYcccXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXXcccccccYYYEE   0000000aaa00tttssssssssssssssssssssttt0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXXcccccccYYYEE   0000000aaa00tttssssssssssssssssssssttt0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXXcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYcccXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYcccXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccXXXFFFFFFFFFFFFFFFFFFFFXXXcccccccYYYEE   0000000aaa00tttssssssssssssssssssssttt0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXNcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccNXXFFFFFFFFFFFFFFFFFFFFXXMcccccccYYYEE   0000000aaa00wttssssssssssssssssssssttw0000000aaa00
EEEEEEEEYYccXXXFFFFFFFFFFFFFFFFFFFFXXXcccccccYYYEE   0000000aaa00tttssssssssssssssssssssttt0000000aaa00
EEEEEEEEYYcccXXFFFFFFFFFFFFFFFFFFFFXXccccccccYYYEE   0000000aaa00wttttttttttttttttttttttttw0000000aaa00
EEEEEEEEYYcccXXXXXXXXXXXXXXXXXXXXXXXXMcccccccYYYEE   0000000aaa00wttttttttttttttttttttttttw0000000aaa00
EEEEEEEEYYcccXXXXXXXXXXXXXXXXXXXXXXXXMcccccccYYYEE   0000000aaa00wwwtwwwtwwwtwwtwwwtwwwtwww0000000aaa00
EEEEEMMYYMccccccNNNNcccNNNNnnnNNNNNNcccccccccMMYYM   00000mmmjm000003hhhh000hhhh000hhhh33000000000mmmjm
EEEEEMYYYYcccccccccccccnnnnnnncccccccccccccccYYYYY   00000mjjjm00000000000000000000000000000000000mjjjj
EEEEEYYYYYcccccccccccccnnnnnnncccccccccccccccYYYYY   00000mjjjjjmmaaaaaaaaajjjjgjjjaaaaaaaaaaaammjjjjjj
EEEEEYYYYYYYYYYYYYYYYYNYYYYYYYNYYYYYYYYYYYYYYYYYYY   00000jjjjjjjmaaaaaaaaajggggggjaaaaaaaaaaaamjjjjjjj
EEEEEMYYYYYYYYYYYYYYYYNYYYYYYMNYYYYYYYYYYYYYYYYYYY   00000mjjjjjjjaaaaaaaaajjjjgjjjaaaaaaaaaaaajjjjjjjj
EEEEEYYYYYYYMEEEEEEEEEErrrrrrrEEEEEEEEEEEEEYYYYYYY   00000mjjjjjjm00000000000000000000000000000mjjjjjjj
EEEEEMYYYYYYMEEEEEEEEEErrrrrrrEEEEEEEEEEEEEYYYYYYY   00000mjjjjjjm00000000000000000000000000000mjjjjjjj
EEEEEMMEYMEMEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEMMYEMYY   00000mmmjmmmm00000000000000000000000000000mmmjmmjj
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.73 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 185 nodi, 851 passi, finito in 1145 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Centro (marcatore), E=Terreno (marcatore), h=honey, w=white, s=slate, d=dead, dark, c=Cortile, n=Lastricato, W=White, t=teal, g=green, a=alive, gray, r=Strada, p=purple, v=olive, Q=aQua, f=fawn, m=magenta, X=Pietra del mastio, Y=Pietra delle mura, Z=Tavolato, F=Solaio in pietra, P=Pietra del pozzo, R=Tegole del tetto, K=Camino in pietra, I=Acqua, O=Porta, o=Assi della porta, N=Cornice in pietra, T=Traccia della scala (marcatore), k=Gradini, M=Merli, U=Feritoia, G=Vetro, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #94=porta di prova, S=muro di prova, #93=terreno di prova (marcatore), #95=solaio di prova, #96=pavimento di prova, #97=? (marcatore).
Alla fine: S 127432, Y 80785, X 57691, E 8175, c 5850, o 4260, G 3420, F 3040, N 2815, U 2760, k 2720, M 1800, Z 1700, R 1140, O 240, n 225, r 225, J 150, P 96, K 9.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-41 all×28, one×5, prl×1: 639 celle x2-27 y2-29 z0, passi 2-59
   #44 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 60
#46-50 all×5: 68400 celle x55-104 y55-104 z0-38, passi 61-104
#51-55 all×4, prl×1: 54900 celle x55-104 y55-104 z0-66, passi 105-135
    #56 all . h → h . passi=31: ×31, 86800 celle x60-99 y60-99 z1-32, passi 136-166, h→. 43400, .→h 43400
#57-58 all×2: 15200 celle x60-99 y60-99 z2-33, passi 167-197
    #59 all . h → h . (+1) passi=31: ×31, 99200 celle x60-99 y60-99 z33-64, passi 198-228, h→. 43400, .→h 43400, s→. 6200, .→s 6200
      r1 . h → h . ×43400; r2 . s → s . ×6200
#60-61 prl×1, all×1: 76350 celle x25-134 y25-124 z0-64, passi 229-252
#62-66 prl×2, all×3: 76050 celle x20-139 y20-129 z0-43, passi 253-334
#67-88 prl×3, all×8: 30440 celle x20-139 y20-129 z0-43, passi 335-424
     #95 all . I → I * passi=30: ×30, 73770 celle x10-124 y10-139 z1-30, passi 425-454, .→I 73770
#96-97 all×2: 4918 celle x10-124 y10-139 z31-32, passi 455-456
#98-99 all×2: 73770 celle x10-124 y10-139 z33-62, passi 457-486
     #100 prl I → . passi=1: ×1, 149999 celle x10-124 y10-139 z0-61, passi 487, I→. 149999
#106-127 all×12, prl×5: 61359 celle x10-124 y10-139 z1-84, passi 488-608
#128-131 all×2, prl×2: 60380 celle x9-125 y9-140 z6-89, passi 609-616
#132-155 prl×11, all×10: 63755 celle x9-125 y9-140 z6-83, passi 617-742
     #159 all . S → S * passi=29: ×29, 71311 celle x10-124 y10-139 z63-118, passi 743-771, .→S 71311
#161-185 all×11, prl×2, one×1: 48382 celle x10-139 y10-139 z7-119, passi 772-851
Senza effetto (non hanno mai cambiato una cella):
#7 prl E/h → h/* passi=1
#38 all [Wt]E/*f → **/*f: le celle cercate c'erano, ma mai disposte come nel pattern
#39 all fE/*f → *f/**: le celle cercate c'erano, ma mai disposte come nel pattern
#42 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***L***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#74 all . A → A * passi=16: in quel momento nella griglia non c'erano celle "A"
#75 all . A → C * passi=1: in quel momento nella griglia non c'erano celle "A"
#76 all C . → C * passi=4: in quel momento nella griglia non c'erano celle "C"
#77 all C. → *C passi=4: in quel momento nella griglia non c'erano celle "C"
#78 all . C → C * passi=4: in quel momento nella griglia non c'erano celle "C"
#80 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#81 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#82 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
… e altri 31
Fix it and answer with the whole program.

## Risposta

<!--
  Concetto: Forte medievale (mastio centrale a due piani abitabili con scala interna e terrazza merlata, cortile asimmetrico, mura di cinta con camminamento e merli, torri d'angolo, corpo di guardia con porta apribile, caserma con tetto spiovente, pozzo, fossato con ponte e alberi).
  Parti e lettere della pianta (griglia 1/5, 1 cella = 5 voxel):
    h: pavimento del mastio (almeno 7x8 celle attorno a H, con estensione casuale pulita su un lato per seme)
    s: zona della scala interna del mastio (lungo il muro di fondo, 2 celle di pianerottolo prima, 4 di scala, almeno 6 celle libere davanti)
    w: mura del mastio (attorno a h, con porta frontale d)
    d: porta del mastio (3 celle al centro della facciata)
    c: cortile (attorno al mastio, con braccio asimmetrico casuale su un lato per seme)
    n: lastricato nel cortile (collega d al corpo di guardia g)
    W: mura di cinta (attorno al cortile)
    t: torri d'angolo (3x3 su ogni angolo esterno convesso delle mura di cinta)
    g: corpo di guardia (3 celle sul fronte delle mura di cinta)
    r: strada d'accesso (dal corpo di guardia fino al bordo anteriore)
    a, v: caserma addossata all'interno delle mura di cinta (dove il cortile è ampio)
    Q: pozzo nel cortile (dove c'è uno spiazzo libero 5x5)
    f: fossato esterno alle mura (dove resta terreno libero oltre le mura)
    p: ponte della strada sul fossato
    L: alberi nel terreno circostante (dove c'è spazio 7x7)
    m: marcatore temporaneo dell'asse centrale (ripulito in h)
  Variazione tra i semi: estensione del mastio in profondità e su un lato casuale, braccio asimmetrico del cortile su un lato casuale, posizione della caserma, del pozzo e degli alberi.
  Cosa entra per taglia:
    Large (20x20): mastio a due piani con ampia sala (almeno 30x30 voxel liberi davanti alla scala), cortile asimmetrico, mura di cinta, torri d'angolo, corpo di guardia e strada.
    Huge (30x30): cortile più ampio, caserma con tetto spiovente, pozzo, fossato con ponte e alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdcnWtgarpvQfLm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio attorno al centro H: almeno 7x8 celle (35x40 voxel) + estensione casuale pulita per variare i semi -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <one in="hE/hE/hE/hE/hE/hE/hE/hE" out="*h/*h/*h/*h/*h/*h/*h/*h" symmetry="(x)" steps="1"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala nel mastio: lungo il muro di fondo, 2 celle di pianerottolo prima, 4 di scala, 1 dopo; almeno 6 celle (30 voxel) libere davanti -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/w**ssss*/w**ssss*" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio: stretto a Large con braccio asimmetrico sui lati, si espande a Huge -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="cEEE/cEEE/cEEE/cEEE/cEEE" out="*cc*/*cc*/*cc*/*cc*/*cc*" symmetry="(x)" steps="1"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Mura di cinta attorno al cortile e torri 3x3 sugli angoli esterni -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Asse centrale dal mastio al bordo anteriore: porta d, lastricato n, corpo di guardia g, strada r -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/W" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Parti aggiuntive dove c'è spazio (Huge): caserma, pozzo, fossato con ponte, alberi -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc" out="******/Wvvvv*/Wvaav*/Wvaav*/Wvvvv*" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="WEEEEE" out="**ff**" steps="1"/>
      <all in="[Wt]E/*f" out="**/*f"/>
      <all in="fE/*f" out="*f/**"/>
      <all in="rf" out="pf" symmetry="(x)"/>
      <all in="pr" out="pp" symmetry="(x)" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***L***/*******/*******/*******"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdcnWtgarpvQfLXYZFPRKACJqOoNTkMUG#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Q" out="PPPPP/PqqqP/PqqqP/PqqqP/PPPPP"/>
      <rule in="f" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="p" out="JJJJJ/JJJJJ/JJJJJ/JJJJJ/JJJJJ"/>
      <rule in="L" out="EEEEE/EEEEE/EEAE*/EEEEE/EEEEE"/>

      <union symbol="+" values="XY"/>
      <union symbol="=" values="ZF"/>
      <union symbol="%" values="XY"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: il mastio (due piani da 32 + terrazza merlata a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B w" out="w X" steps="6"/>
        <all in="B d" out="d X" steps="5"/>
        <all steps="14">
          <rule in="B w" out="w U"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="18">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w U"/>
          <rule in="B d" out="d U"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <prl>
          <rule in="w" out="X"/>
          <rule in="d" out="X"/>
        </prl>

        <!-- Pavimenti, striscia scala T e solaio del mastio -->
        <all steps="1">
          <rule in="B h" out="h Z"/>
          <rule in="B s" out="s Z"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
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

        <!-- Mura di cinta (24), corpo di guardia (38) e torri d'angolo (44) -->
        <all in="B W" out="W Y" steps="23"/>
        <prl in="W" out="Y"/>
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g Y" steps="36"/>
        <prl in="g" out="Y"/>
        <all in="B t" out="t Y" steps="43"/>
        <prl in="t" out="Y"/>

        <!-- Caserma interna (dove presente): pareti e tetto spiovente -->
        <all in="B v" out="v Y" steps="25"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a Z" steps="1"/>
        <all in="B a" out="a B" steps="24"/>
        <prl in="a" out="R"/>

        <!-- Pozzo e alberi -->
        <all in="B P" out="P *" steps="5"/>
        <all in="B A" out="A *" steps="16"/>
        <all in="B A" out="C *" steps="1"/>
        <all in="C B" out="C *" steps="4"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="4"/>

        <!-- C. Scala reale: porte, scala interna, finestre, merli, feritoie, tetto caserma e camino -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <prl in="U" out="X"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto spiovente della caserma e camino sul mastio -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>
        <one in="B B F" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="8"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="7c9a59" hidden="True" name="Terreno"/>
  <color symbol="H" value="d9c7a3" hidden="True" name="Centro"/>
  <color symbol="c" value="c2b280" area="courtyard" name="Cortile"/>
  <color symbol="n" value="9e9a8e" area="courtyard" name="Lastricato"/>
  <color symbol="r" value="a89878" name="Strada"/>
  <color symbol="X" value="6e7075" name="Pietra del mastio"/>
  <color symbol="Y" value="7d8085" name="Pietra delle mura"/>
  <color symbol="Z" value="b89b72" area="keep" name="Tavolato"/>
  <color symbol="F" value="949699" area="keep" name="Solaio in pietra"/>
  <color symbol="P" value="8a8880" name="Pietra del pozzo"/>
  <color symbol="R" value="a64b38" name="Tegole del tetto"/>
  <color symbol="K" value="54565c" name="Camino in pietra"/>
  <color symbol="A" value="6e4c2e" name="Tronco"/>
  <color symbol="C" value="4b7338" name="Chioma"/>
  <color symbol="J" value="855e42" name="Legno del ponte"/>
  <color symbol="q" value="3d6e8f" name="Acqua"/>
  <color symbol="O" value="6b4423" name="Porta"/>
  <color symbol="o" value="4a2e16" name="Assi della porta"/>
  <color symbol="N" value="595b61" name="Cornice in pietra"/>
  <color symbol="T" value="8c6d46" hidden="True" name="Traccia della scala"/>
  <color symbol="k" value="9c7a54" name="Gradini"/>
  <color symbol="M" value="75787d" name="Merli"/>
  <color symbol="U" value="3b3d42" name="Feritoia"/>
  <color symbol="G" value="7aa6bd" name="Vetro"/>
  <color symbol="#20" value="6b4423" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="4a2e16" hidden="True" name="Assi aperte"/>

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

