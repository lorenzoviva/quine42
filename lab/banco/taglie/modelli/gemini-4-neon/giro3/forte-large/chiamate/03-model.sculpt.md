# model.sculpt · gemini-4-neon · 67 s

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
    h: pavimento del mastio (attorno a H, con estensione casuale per seme)
    s: zona della scala interna del mastio (lungo il muro di fondo, con pianerottolo libero a sinistra)
    w: mura del mastio (attorno a h, con porta frontale d)
    d: porta del mastio (3 celle al centro della facciata)
    c: cortile (attorno al mastio, con braccio asimmetrico casuale per seme)
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
  Variazione tra i semi: estensione del mastio su un lato casuale, braccio asimmetrico del cortile su un lato casuale, posizione della caserma, del pozzo e degli alberi.
  Cosa entra per taglia:
    Large (20x20): mastio a due piani con scala interna, cortile asimmetrico, mura di cinta, torri d'angolo, corpo di guardia e strada.
    Huge (30x30): cortile più ampio, caserma con tetto spiovente, pozzo, fossato con ponte e alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdcnWtgarpvQfLm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio attorno al centro H: nucleo 7x6 + estensione casuale su un lato per variare i semi -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <one in="hEE/hEE/hEE/hEE" out="*hh/*hh/*hh/*hh" steps="1"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala nel mastio: lungo il muro di fondo, 2 celle di pianerottolo prima, 4 di scala, 1 dopo -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/w**ssss*/w**ssss*" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio: stretto a Large con braccio casuale, si espande a Huge -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="c/E" out="*/c" symmetry="()" steps="1"/>
      <one in="cEEE/cEEE/cEEE/cEEE/cEEE" out="*cc*/*cc*/*cc*/*cc*/*cc*" steps="1"/>
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
It does not pass: taglia Grande, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 19 voxel (1,19 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, c Cortile, n Lastricato, X Pietra del mastio, Y Pietra delle mura, Z Tavolato, F Solaio in pietra, K Camino in pietra, O Porta, o Assi della porta, N Cornice in pietra, k Gradini, M Merli, U Feritoia, G Vetro
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEMYMYYMMEEEEEEEEEEEEEEEEEEEEEEEMMYYMYMEEEEE
EEEEEEEEYYYYYYYEEEEEEEEEEEEEEEEEEEEEEEYYYYYYYEEEEE
EEEEEEEEYYYYYYYEEEEEEEEEEEEEEEEEEEEEEYYYYYYYYEEEEE
EEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEEEEE
EEEEEEEEYYYYYYMYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEEEEE
EEEEEEEEYYYYYcccccccccccccccccccccccccccYYYYYEEEEE
EEEEEEEEYYYYMcccccccccccccccccccccccccccMYYYYEEEEE
EEEEEEEEEYMMccccccccccccccccccccccccccccMMYYMEEEEE
EEEEEEEEEEYYYcccccccccccccccccccccccccccYYYEEEEEEE
EEEEEEEEEEYYYcccccccccccccccccccccccccccYYYEEEEEEE
EEEEEEEEEEYYYcccccccccccccccccccccccccccYYYEEEEEEE
EEEEEEEEEEYYYcccccccccccccccccccccccccccYYYEEEEEEE
EEEEEEEEEEYYYccccNNNNcccNNNNMccMNNNMccccYYYEEEEEEE
EEEEEEEEEEYYYccMXXXXXXXXXXXXXXXXXXXXXMccYYYEEEEEEE
EEEEEEEEEEYYYccMXXXXXXXXXXXXXXXXXXXXXMccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXXccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXNccYYYEEEEEEE
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXXccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXcccYYYEEEEEEE
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXXccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXNccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXNccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXXccYYYEEEEEEE
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE
EEEEEEEEEEYYYccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFFFFFFFFXXcccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFMMXXMXXXXXccYYYEEEEEEE
EEEEEEEEEEYYYccMXXFFFFFFFFFFXXXXXXXXXMccYYYEEEEEEE
EEEEEEEEEEYYYccMXXFFFFFFFFFFXXXXXXXXXMccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFXXXXXXXXXNccYYYEEEEEEE
EEEEEEEEEEYYYccXXXFFFFFFFFFFXXXXXXXXXXccYYYEEEEEEE
EEEEEEEEEEYYYccMXXXXXXXXXXXXXXXXXXXXXMccYYYEEEEEEE
EEEEEEEEEEYYYccMXXXXXXXXXXXXXXXXXXXXXMccYYYEEEEEEE
EEEEEEEEEEYYYccMMNXMMcXMMNXMMnXMMNXMMcccYYYEEEEEEE
EEEEEEEEEEYYYccccccccccnnnnnnnccccccccccYYYEEEEEEE
EEEEEEEEEEYYYccccccccccnnnnnnnccccccccccYYYEEEEEEE
EEEEEEEEEEYYYccccccccccnnnnnnnccccccccccYYYEEEEEEE
EEEEEEEEEEYYYccccccccccnnnnnnnccccccccccYYYEEEEEEE
EEEEEEEEEEYYYccccccccccnnnnnnnccccccccccYYYEEEEEEE
EEEEEEEEEEYYYYYYYYYYYYNYYYYYYYNYYYYYYYYYYYYEEEEEEE
EEEEEEEEEEYYYYYYYYYYYYNYYYYYYYNYYYYYYYYYYYYEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0000000mmmmjmmm0000000000000000000000mmmjmmmm00000
0000000mjjjjjjm0000000000000000000000jjjjjjjm00000
0000000mjjjjjjmaaaaaaaaaaaaaaaaaaaaaamjjjjjjm00000
0000000jjjjjjjjaaaaaaaaaaaaaaaaaaaaaamjjjjjjm00000
0000000mjjjjjmmaaaaaaaaaaaaaaaaaaaaaammjjjjjj00000
0000000mjjjjj000000000000000000000000000jjjjm00000
0000000mjjjjm000000000000000000000000000mjjjm00000
0000000mmjmmm000000000000000000000000000mmmjm00000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa00wwwtwwwtwwwtwwwtwwwtwww00aaa0000000
0000000000aaa00wtttttttttttttttttttttw00aaa0000000
0000000000aaa00wtttttttttttttttttttttw00aaa0000000
0000000000aaa00tttsssssssssssssssssttt00aaa0000000
0000000000aaa0hwttsssssssssssssssssttw00aaa0000000
0000000000aaa0hwttsssssssssssssssssttw00aaa0000000
0000000000aaa0hwttsssssssssssssssssttw00aaa0000000
0000000000aaa0htttsssssssssssssssssttt00aaa0000000
0000000000aaa00wttsssssssssssssssssttw00aaa0000000
0000000000aaa00wttsssssssssssssssssttw00aaa0000000
0000000000aaa00wttsssssssssssssssssttw00aaa0000000
0000000000aaa0htttsssssssssssssssssttt00aaa0000000
0000000000aaa0hwttsssssssssssssssssttw00aaa0000000
0000000000aaa0hwttsssssssssssssssssttw00aaa0000000
0000000000aaa0htttsssssssssssssssssttt00aaa0000000
0000000000aaa00wttsssssssssssssssssttw00aaa0000000
0000000000aaa00wttsssssssssssssssssttw00aaa0000000
0000000000aaa00wttsssssssssssssssssttw00aaa0000000
0000000000aaa0htttssssssssswwwtwwttttt00aaa0000000
0000000000aaa0hwttssssssssswtttttttttw00aaa0000000
0000000000aaa0hwttssssssssswtttttttttw00aaa0000000
0000000000aaa0hwttsssssssssttttttttttw00aaa0000000
0000000000aaa00tttssssssssswtttttttttt00aaa0000000
0000000000aaa00wtttttttttttttttttttttw00aaa0000000
0000000000aaa00wtttttttttttttttttttttw00aaa0000000
0000000000aaa00wwwtwwwtwwwtwwwtwwwtwww00aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaaaaaaaaaaajjjjgjjjaaaaaaaaaaaaa0000000
0000000000aaaaaaaaaaaajggggggjaaaaaaaaaaaaa0000000
0000000000aaaaaaaaaaaaggggggggaaaaaaaaaaaaa0000000
```
Front (looking from the front; the sky at the top):
```
...............MM..MM..MM..MMM.MM..MM.............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............XXXXXXXXXXXXXXXXXXXXXXX............
...............XXXXXXXXXXXXXXXXXXXXXXX............
...............UUUUUUUUUUUUUUUUUUUUUUU............
...............UUUUUUUUUUUUUUUUUUUUUUU............
...............XXXXXXXXXXXXXXXXXXXXXXX............
...............XXXXXXXXXXXXXXXXXXXXXXX............
...............XXXXXXXXXXXXXXXXXXXXXXX............
...............XXXXXXXXXXXXXXXXXXXXXXX............
...............XXNGGNXXXNGGGNXXXGGGNXX............
.......MMMMMMMMXXNGGGXXXNGGGNXXXGGGNXXMMMMMMM.....
.......MMMMMMMMXXNGGGXXXNGGGNXXXGGGNXXMMMMMMM.....
.......MMMMMMMMXXNGGGXXXNGGGNXXXGGGNXXMMMMMMM.....
.......YYYYYYYYXXNGGGXXMNMGGMMXXGGGNXXYYYYYYY.....
.......YYYYUYYYXXNGGGXXMNMGGMMXXGGGNXXYYYUYYY.....
.......YYYYUYYYXXNNNNXXMNMNMMMXXNNNNXXYYYUYYY.....
.......YYYYUYYYXXXXXXXXYYYYYYYXXXXXXXXYYYUYYY.....
.......YYYYYYYYXXXXXXXXYYYYYYYXXXXXXXXYYYYYYY.....
.......YYYYYYYYXXXXXXXXYYYYYYYXXXXXXXXYYYYYYY.....
.......YYYYYYYYXXXXXXXXNNNNNNNXXXXXXXXYYYYYYY.....
.......YYYYYYYYXXXXXXXNoooooooNXXXXXXXYYYYYYY.....
.......YYYYYYYYXXXXXXXNoooooooNXXXXXXXYYYYYYY.....
.......YYYYYYYYXXXXXXXNoooooooNXXXXXXXYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYYY.....
EEEEEEEEEEYYYYYYYYYYYYNoooooooNYYYYYYYYYYYYEEEEEEE
```
Right side (looking from the right):
```
..................MM..MM..MM....MM.MMM.MMM........
.................MMM.MMM.MMM.MM.MMMMMMMMMMM.......
.................MMM.MMM.MMM.MM.MMMMMMMMMMM.......
.................XXXXXXXXXXXXXXXXXXXXXXXXXX.......
.................XXXXXXXXXXXXXXXXXXXXXXXXXX.......
.................UUUUUUUUUUUUUUUUUUUUUUUUUU.......
.................UUUUUUUUUUUUUUUUUUUUUUUUUU.......
.................XXXXXXXXXXXXXXXXXXXXXXXXXX.......
.................XXXXXXXXXXXXXXXXXXXXXXXXXX.......
.................XXXXXXXXXXXXXXXXXXXXXXXXXX.......
.................XXXXXXXXXXXXXXXXXXXXXXXXXX.......
.................XXXXNGGNXXXNGGNXXXNGGNXXXX.......
.....MMMMMMMM....XXXXNGGGXXXNGGGXXXNGGGXXXX.......
.....MMMMMMMM....XXXXNGGGXXXNGGGXXXNGGGXXXX.......
.....MMMMMMMM....XXXXNGGGXXXNGGGXXXNGGGXXXX.......
.....YYYYYYYY....XXXXNGGGXXXNGGGXXXNGGGXXXX....MM.
.....YYYYYYUY....XXXXNGGGXXXNGGGXXXNGGGXXXX....MM.
.....YYYYYYUY....XXXXNNNNXXXNNNNXXXNNNNXXXX....MM.
.....YYYYYYUY....XXXXXXXXXXXXXXXXXXXXXXXXXX....YYY
.....YYYYYYYY....XXXXXXXXXXXXXXXXXXXXXXXXXX....YYY
.....YYYYYYYY....XXXXXXXXXXXXXXXXXXXXXXXXXX....YYY
.....YYYYYYYY....XXXXXXXXXXXXXXXXXXXXXXXXXX....NNN
.....YYYYYYYY....XXXXXXXXXXXXXXXXXXXXXXXXXX....Ooo
.....YYYYYYYY....XXXXXXXXXXXXXXXXXXXXXXXXXX....Ooo
.....YYYYYYYY....XXXXXXXXXXXXXXXXXXXXXXXXXX....Ooo
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
.....YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.....
.......YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.....
.......YYYYYY...........................YYYYY.....
.......YYYYYY...........................YYYYY.....
........YYYYY...........................YYYYY.....
..........YYY...........................YYY.......
..........YYY...........................YYY.......
..........YYY...........................YYY.......
..........YYY...........................YYY.......
..........YYY..XXNGGGXXXNGGGNXXXGGGNX...YYY.......
..........YYY..XXX..XXXXX...XXXX...XXX..YYY.......
..........YYY..XXX..XXXXX...XXXX...XXX..YYY.......
..........YYY..XXX.......kkkkkk....XXX..YYY.......
..........YYY..NX........kkkkkk....XXN..YYY.......
..........YYY..G.........kkkkkk......G..YYY.......
..........YYY..G.........kkkkkk......G..YYY.......
..........YYY..GX........kkkkkk....XXG..YYY.......
..........YYY..XXX.................XXX..YYY.......
..........YYY..XXX.................XXX..YYY.......
..........YYY..XXX.................XXX..YYY.......
..........YYY..NX..................XXN..YYY.......
..........YYY..G.....................G..YYY.......
..........YYY..G.....................G..YYY.......
..........YYY..GX..................XXG..YYY.......
..........YYY..XXX.................XXX..YYY.......
..........YYY..XXX.................XXX..YYY.......
..........YYY..XXX.................XXX..YYY.......
..........YYY..NX..........XXXXXXXXXXN..YYY.......
..........YYY..G...........XXXXXXX...G..YYY.......
..........YYY..G...........XXXXXXX...G..YYY.......
..........YYY..GX..........XXXXXXXXXXG..YYY.......
..........YYY..XX..........XXXXX...XXX..YYY.......
..........YYY..XX...XXXoooooooXX...XXX..YYY.......
..........YYY..XX...XXXoooooooXX...XXX..YYY.......
..........YYY..XXGGGGXXoooooooXXGGGGX...YYY.......
..........YYY...........................YYY.......
..........YYY...........................YYY.......
..........YYY...........................YYY.......
..........YYY...........................YYY.......
..........YYYYYYYYYYYYNoooooooNYYYYYYYYYYYY.......
..........YYYYYYYYYYYYNoooooooNYYYYYYYYYYYY.......
..........YYYYYYYYYYYYNoooooooNYYYYYYYYYYYY.......
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYY...........................YYYYY.....
.......YYYYYY...........................YYYYY.....
........YYYY............................YYYYY.....
..................................................
..................................................
..................................................
..................................................
...............XXNGGGXXXNGGGNXXXGGGNX.............
...............XXX..XXXXX...XXXX...XXX............
...............XXX..XXXXX...XXXX...XXX............
...............XXX.................XXX............
...............NX..................XXN............
...............G.....................G............
...............G.....................G............
...............GX..................XXG............
...............XXX.................XXX............
...............XXX.................XXX............
...............XXX.................XXX............
...............NX..................XXN............
...............G.....................G............
...............G.....................G............
...............GX..................XXG............
...............XXX.................XXX............
...............XXX.................XXX............
...............XXX.................XXX............
...............NX..........XXXXXXXXXXN............
...............G...........XXXXXXX...G............
...............G...........XXXXXXX...G............
...............GX..........XXXXXXXXXXG............
...............XXX..........XXXX...XXX............
...............XXX..XXXXX...XXXX...XXX............
...............XXX..XXXXX...XXXX...XXX............
...............XXNGGGXXXNGGGNXXXGGGNX.............
..................................................
..................................................
..................................................
..................................................
.......................M.M..MM....................
......................M......M....................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEMYMYYMMEEEEEEEEEEEEEEEEEEEEEEEEEEEEMMYYMYMEEEEE   00mmmmjmmm000000000000000000000000000mmmjmmmm00000
EEEYYYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYYYYYEEEEE   00mjjjjjjm000000000000000000000000000mjjjjjjm00000
EEEYYYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYYYYYYEEEEE   00mjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjm00000
EEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEEEEE   00jjjjjjjjaaaaaaaaaaaaaaaaaaaaaaaaaaajjjjjjjm00000
EEEYYYYYYMYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEEEEE   00mjjjjjmmaaaaaaaaaaaaaaaaaaaaaaaaaaammjjjjjj00000
EEEYYYYYccccccccccccccccccccccccccccccccYYYYYEEEEE   00mjjjjj00000000000000000000000000000000jjjjm00000
EEEYYYYMccccccccccccccccccccccccccccccccMYYYYEEEEE   00mjjjjm00000000000000000000000000000000mjjjm00000
EEEEYMMcccccccccccccccccccccccccccccccccMMYYMEEEEE   00mmjmmm00000000000000000000000000000000mmmjm00000
EEEEEYYYccccccccccccccccccccccccccccccccYYYEEEEEEE   00000aaa00000000000000000000000000000000aaa0000000
EEEEEYYYccccccccccccccccccccccccccccccccYYYEEEEEEE   00000aaa00000000000000000000000000000000aaa0000000
EEEEEYYYccccccccccccccccccccccccccccccccYYYEEEEEEE   00000aaa00000000000000000000000000000000aaa0000000
EEEEEYYYccccccccccccccccccccccccccccccccYYYEEEEEEE   00000aaa00000000000000000000000000000000aaa0000000
EEEEEYYYcccccccccNNNNcccNNNNMccMNNNMccccYYYEEEEEEE   00000aaa0000000wwwtwwwtwwwtwwwtwwwtwww00aaa0000000
EEEEEYYYcccccccMXXXXXXXXXXXXXXXXXXXXXMccYYYEEEEEEE   00000aaa0000000wtttttttttttttttttttttw00aaa0000000
EEEEEYYYcccccccMXXXXXXXXXXXXXXXXXXXXXMccYYYEEEEEEE   00000aaa0000000wtttttttttttttttttttttw00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXXccYYYEEEEEEE   00000aaa0000000tttsssssssssssssssssttt00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXNccYYYEEEEEEE   00000aaa000000hwttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE   00000aaa000000hwttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE   00000aaa000000hwttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXXccYYYEEEEEEE   00000aaa000000htttsssssssssssssssssttt00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXcccYYYEEEEEEE   00000aaa0000000wttsssswssssssssssssttw00aaa0000000
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE   00000aaa0000000wttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE   00000aaa0000000wttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXXccYYYEEEEEEE   00000aaa000000htttsssssssssssssssssttt00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXNccYYYEEEEEEE   00000aaa000000hwttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXNccYYYEEEEEEE   00000aaa000000hwttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXXccYYYEEEEEEE   00000aaa000000htttsssssssssssssssssttt00aaa0000000
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE   00000aaa0000000wttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFXXMccYYYEEEEEEE   00000aaa0000000wttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXcccYYYEEEEEEE   00000aaa0000000wttsssssssssssssssssttw00aaa0000000
EEEEEYYYcccccccXXXXMFFFFFFFFFFMMXXMXXXccYYYEEEEEEE   00000aaa000000htttwwsssssssssswwwtwttt00aaa0000000
EEEEEYYYcccccccMXXXXFFFFFFFFFFMXXXXXXMccYYYEEEEEEE   00000aaa000000hwtttwsssssssssswttttttw00aaa0000000
EEEEEYYYcccccccMXXXXFFFFFFFFFFXXXXXXXMccYYYEEEEEEE   00000aaa000000hwtttwsssssssssswttttttw00aaa0000000
EEEEEYYYcccccccXXXXXFFFFFFFFFFXXXXXXXNccYYYEEEEEEE   00000aaa000000hwttttsssssssssstttttttw00aaa0000000
EEEEEYYYcccccccXXXXXFFFFFFFFFFMXXXXXXXccYYYEEEEEEE   00000aaa0000000ttttwsssssssssswttttttt00aaa0000000
EEEEEYYYcccccccMXXXXXXXXXXXXXXXXXXXXXMccYYYEEEEEEE   00000aaa0000000wtttttttttttttttttttttw00aaa0000000
EEEEEYYYcccccccMXXXXXXXXXXXXXXXXXXXXXMccYYYEEEEEEE   00000aaa0000000wtttttttttttttttttttttw00aaa0000000
EEEEEYYYcccccccMMNXMMcXMMNXMMnXMMNXMMcccYYYEEEEEEE   00000aaa0000000wwwtwwwtwwwtwwwtwwwtwww00aaa0000000
EEEEEYYYcccccccccccccccnnnnnnnccccccccccYYYEEEEEEE   00000aaa00000000000000000000000000000000aaa0000000
EEEEEYYYcccccccccccccccnnnnnnnccccccccccYYYEEEEEEE   00000aaa00000000000000000000000000000000aaa0000000
EEEEEYYYcccccccccccccccnnnnnnnccccccccccYYYEEEEEEE   00000aaa00000000000000000000000000000000aaa0000000
EEEEEYYYcccccccccccccccnnnnnnnccccccccccYYYEEEEEEE   00000aaa00000000000000000000000000000000aaa0000000
EEEEEYYYcccccccccccccccnnnnnnnccccccccccYYYEEEEEEE   00000aaaaaaaaaaaaaaaaajjjjgjjjaaaaaaaaaaaaa0000000
EEEEEYYYYYYYYYYYYYYYYYNYYYYYYYNYYYYYYYYYYYYEEEEEEE   00000aaaaaaaaaaaaaaaaajggggggjaaaaaaaaaaaaa0000000
EEEEEYYYYYYYYYYYYYYYYYNYYYYYYYNYYYYYYYYYYYYEEEEEEE   00000aaaaaaaaaaaaaaaaaggggggggaaaaaaaaaaaaa0000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEMMYYMYMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMMYYMYY   00mmmjmmmm00000000000000000000000000000000mmmjmmjj
EEEYYYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYYYYY   00mjjjjjjm00000000000000000000000000000000jjjjjjjj
EEEYYYYYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYYYYYY   00mjjjjjjmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjj
EEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00jjjjjjjjaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaamjjjjjjj
EEEYYYYYYMYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00mjjjjjmmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaammjjjjjj
EEEYYYYYcccccccccccccccccccccccccccccccccccccYYYYY   00mjjjjj0000000000000000000000000000000000000jjjjj
EEEYYYYMcccccccccccccccccccccccccccccccccccccMYYYY   00mjjjjm0000000000000000000000000000000000000mjjjj
EEEMMYYccccccccccccccccccccccccccccccccccccccMMYYM   00mmmjmm0000000000000000000000000000000000000mmmjm
EEEEEYYYcccccccccccccccccccccccccccccccccccccYYYEE   00000aaa0000000000000000000000000000000000000aaa00
EEEEEYYYcccccccccccccccccccccccccccccccccccccYYYEE   00000aaa0000000000000000000000000000000000000aaa00
EEEEEYYYcccccccccccccccccccccccccccccccccccccYYYEE   00000aaa0000000000000000000000000000000000000aaa00
EEEEEYYYcccccccccccccccccccccccccccccccccccccYYYEE   00000aaa0000000000000000000000000000000000000aaa00
EEEEEYYYcccccccccccMNNNMccXNNNNcccNNNNcccccccYYYEE   00000aaa0000000wwwtwwwtwwwtwwwwtwwwtwwwtwww00aaa00
EEEEEYYYcccccccMXXXXXXXXXXXXXXXXXXXXXXXXXXMccYYYEE   00000aaa0000000wttttttttttttttttttttttttttw00aaa00
EEEEEYYYcccccccMXXXXXXXXXXXXXXXXXXXXXXXXXXMccYYYEE   00000aaa0000000wttttttttttttttttttttttttttw00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFFFFFFXXXccYYYEE   00000aaa0000000tttssssssssssssssssssssssttt00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFFFFFFXXcccYYYEE   00000aaa0000000wttssssssssssssssssssssssttw00aaa00
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFFFFFFXXMccYYYEE   00000aaa0000000wttssssssssssssssssssssssttw00aaa00
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFFFFFFXXMccYYYEE   00000aaa0000000wttssssssssssssssssssssssttw00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFFFFFFXXXccYYYEE   00000aaa0000000tttssssssssssssssssssssssttt00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFFFFFFXXXccYYYEE   00000aaa000000hwttssssssssssssssssssssssttw00aaa00
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFFFFFFXXMccYYYEE   00000aaa000000hwttssssssssssssssssssssssttw00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFFFFFFXXXccYYYEE   00000aaa000000htttssssssssssssssssssssssttt00aaa00
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFFFFFFXXMccYYYEE   00000aaa000000hwttssssssssssssssssssssssttw00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFFFFFFXXMccYYYEE   00000aaa000000hwttssssssssswssssssssssssttw00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFMMXXMXXXccYYYEE   00000aaa0000000tttssssssssssssssssswwwtwttt00aaa00
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFMXXXXXXMccYYYEE   00000aaa0000000wttssssssssssssssssswttttttw00aaa00
EEEEEYYYcccccccMXXFFFFFFFFFFFFFFFFFXXXXXXXMccYYYEE   00000aaa0000000wttssssssssssssssssswttttttw00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFXXXXXXXcccYYYEE   00000aaa0000000wttssssssssssssssssstttttttw00aaa00
EEEEEYYYcccccccXXXFFFFFFFFFFFFFFFFFMXXXXXXXccYYYEE   00000aaa0000000tttssssssssssssssssswttttttt00aaa00
EEEEEYYYcccccccMXXXXXXXXXXXXXXXXXXXXXXXXXXMccYYYEE   00000aaa0000000wttttttttttttttttttttttttttw00aaa00
EEEEEYYYcccccccMXXXXXXXXXXXXXXXXXXXXXXXXXXMccYYYEE   00000aaa0000000wttttttttttttttttttttttttttw00aaa00
EEEEEYYYcccccccMMNXMMNXMMnXMNMNXMMNXMMMXMMcccYYYEE   00000aaa0000000wwwtwwwtwwwtwwwwtwwwtwwwtwww00aaa00
EEEEEYYYcccccccccccccccnnnnnnncccccccccccccccYYYEE   00000aaa0000000000000000000000000000000000000aaa00
EEEEEYYYcccccccccccccccnnnnnnncccccccccccccccYYYEE   00000aaa0000000000000000000000000000000000000aaa00
EEEMMYYMcccccccccccccccnnnnnnncccccccccccccccMMYYM   00mmmjmm0000000000000000000000000000000000000mmmjm
EEEYYYYccccccccccccccccnnnnnnncccccccccccccccYYYYY   00mjjjjm0000000000000000000000000000000000000mjjjj
EEEYYYYYcccccccccccccccnnnnnnncccccccccccccccYYYYY   00mjjjjjmmaaaaaaaaaaaajjjjgjjjaaaaaaaaaaaammjjjjjj
EEEYYYYYYYYYYYYYYYYYYYNYYYYYYYNYYYYYYYYYYYYYYYYYYY   00mjjjjjjmaaaaaaaaaaaajggggggjaaaaaaaaaaaamjjjjjjj
EEEYYYYYYYYYYYYYYYYYYYNYYYYYYMNYYYYYYYYYYYYYYYYYYY   00jjjjjjjmaaaaaaaaaaaajjjjgjjjaaaaaaaaaaaajjjjjjjj
EEEYYYYYYYEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEYYYYYYY   00mjjjjjjj00000000000000000000000000000000mjjjjjjj
EEEYYYYYYYEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEYYYYYYY   00mjjjjjjm00000000000000000000000000000000mjjjjjjj
EEEMEMYEMMEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEMMYEMYY   00mmmmjmmm00000000000000000000000000000000mmmjmmjj
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.43 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 185 nodi, 626 passi, finito in 421 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Centro (marcatore), E=Terreno (marcatore), h=honey, w=white, s=slate, d=dead, dark, c=Cortile, n=Lastricato, W=White, t=teal, g=green, m=magenta, X=Pietra del mastio, Y=Pietra delle mura, Z=Tavolato, F=Solaio in pietra, K=Camino in pietra, O=Porta, o=Assi della porta, N=Cornice in pietra, T=Traccia della scala (marcatore), k=Gradini, M=Merli, U=Feritoia, G=Vetro, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #94=porta di prova, #93=terreno di prova (marcatore), #95=solaio di prova, #96=pavimento di prova, #97=? (marcatore).
Alla fine: X 48960, Y 45575, U 5827, o 4260, E 4225, k 2720, F 2340, N 1749, c 1725, G 1716, M 1338, Z 1250, O 240, n 150, K 9.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-34 all×21, one×3, prl×1: 267 celle x3-17 y2-19 z0, passi 2-38
   #44 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 39
#46-49 all×4: 40000 celle x30-74 y35-84 z0-20, passi 40-65
    #50 all . w → w X (+1) passi=18: ×18, 36000 celle x30-74 y35-84 z20-38, passi 66-83, w→X 16650, .→w 16650, d→X 1350, .→d 1350
      r1 . w → w X ×16650; r2 . d → d X ×1350
    #51 all . w → w U (+1) passi=14: ×14, 28000 celle x30-74 y35-84 z38-52, passi 84-97, w→U 12950, .→w 12950, d→U 1050, .→d 1050
      r1 . w → w U ×12950; r2 . d → d U ×1050
#52-55 all×3, prl×1: 31900 celle x30-74 y35-84 z0-66, passi 98-114
    #56 all . h → h . passi=31: ×31, 65100 celle x35-69 y40-79 z1-32, passi 115-145, h→. 32550, .→h 32550
#57-58 all×2: 14500 celle x35-69 y40-79 z2-33, passi 146-176
    #59 all . h → h . (+1) passi=31: ×31, 77500 celle x35-69 y40-79 z33-64, passi 177-207, h→. 32550, .→h 32550, s→. 6200, .→s 6200
      r1 . h → h . ×32550; r2 . s → s . ×6200
    #60 prl h → F (+1): ×1, 1250 celle x35-69 y40-79 z64, passi 208, h→F 1050, s→F 200
      r1 h → F ×1050; r2 s → F ×200
    #61 all . W → W Y passi=23: ×23, 54050 celle x20-84 y15-99 z0-23, passi 209-231, W→Y 27025, .→W 27025
#62-66 prl×2, all×3: 41200 celle x15-89 y10-99 z0-43, passi 232-313
#67-111 prl×2, all×9: 14980 celle x15-89 y10-99 z0-43, passi 314-394
#112-146 prl×12, all×9: 31138 celle x29-75 y34-85 z1-51, passi 395-513
#147-154 prl×2, all×6: 17859 celle x29-75 y34-85 z6-51, passi 514-521
#155-185 prl×3, all×8, one×1: 26517 celle x15-89 y10-99 z6-72, passi 522-626
Senza effetto (non hanno mai cambiato una cella):
#17 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#18 all cEEEEEEE → *cc***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#19 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#29 all [gr]/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all rE → *r passi=1: in quel momento nella griglia non c'erano celle "r"
#35 one Wccccc/Wccccc/Wccccc/Wccccc/Wccccc → ******/Wvvvv*/Wvaav*/Wvaav*/Wvvvv* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#36 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#37 all WEEEEE → **ff** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#38 all [Wt]E/*f → **/*f: in quel momento nella griglia non c'erano celle "f"
#39 all fE/*f → *f/**: in quel momento nella griglia non c'erano celle "f"
#40 all rf → pf: in quel momento nella griglia non c'erano celle "r", "f"
#41 all pr → pp passi=1: in quel momento nella griglia non c'erano celle "p", "r"
… e altri 62
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

