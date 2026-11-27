# model.sculpt · gemini-4-neon · 52 s

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
Forte medievale: programma completo (pianta, altezze, scala reale)
Parti e lettere in pianta (cella = 5 voxel):
- h: pavimento del maschio (area="keep"), corpo centrale rettangolare attorno ad H
- w: mura del maschio, spesse 1 cella attorno ad h
- s: zona scala interna del maschio (area="keep"), lungo la parete di fondo con pianerottolo a sinistra
- d: porta del maschio, larga 3 celle sul fronte
- c: cortile interno attorno al maschio (area="courtyard")
- n: lastricato nel cortile dall'ingresso al maschio (area="courtyard")
- W: muro di cinta attorno al cortile
- g: corpo di guardia sul fronte del muro di cinta (area="gatehouse")
- t: torri angolari 3x3 sugli spigoli esterni del muro di cinta (area="tower")
- a, v: caserma/annesso nel cortile con le sue mura (area="barracks")
- q: pozzo nel cortile (area="courtyard")
- r: strada lastricata dal corpo di guardia fino al bordo anteriore (area="road")
- m: fossato esterno oltre il muro di cinta (area="moat")
- p, x: marcatori temporanei per la croce del maschio e l'asse d'ingresso

Variazioni tra i semi:
- spina e traversa del maschio di lunghezza variabile per seme (larghezza 7-9, profondità 5-7 celle)
- eventuale ala laterale del maschio sul lato sinistro o destro
- posizione della caserma e del pozzo nel cortile

Cosa entra in ogni taglia:
- Large (100x100x80): maschio a due piani con scala interna e merli, cortile, muro di cinta, corpo di guardia, 4 torri angolari e strada
- Huge (150x150x120): cortile più ampio, caserma con tetto a falde e pozzo nel cortile
- Gargantuan (500x500): cortile esteso e fossato esterno attorno alle mura
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdcnWgtavqrmpx" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Maschio attorno ad H: spina verticale p (2-3 dietro, 2-3 davanti) e traversa orizzontale x (3-4 per lato) -->
      <all in="E/[Hp]" out="p/*" symmetry="()" steps="2"/>
      <prl in="E/p" out="p/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hp]/E" out="*/p" symmetry="()" steps="2"/>
      <prl in="p/E" out="*/p" p="0.5" steps="1" symmetry="()"/>

      <all in="E[Hx]" out="x*" symmetry="()" steps="3"/>
      <prl in="Ex" out="x*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hx]E" out="*x" symmetry="()" steps="3"/>
      <prl in="xE" out="*x" p="0.5" steps="1" symmetry="()"/>

      <!-- Riempie il rettangolo del maschio -->
      <prl>
        <rule in="p" out="h"/>
        <rule in="x" out="h"/>
      </prl>
      <all in="hE/*h" out="*h/**"/>

      <!-- Mura del maschio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala interna lungo il muro di fondo: 2 celle di pianerottolo a sinistra, 4 di scala, 1 di sbarco -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- Cortile attorno al maschio: 1 cella a Large, si espande a Huge e Gargantuan -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*ccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muro di cinta attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari 3x3 sugli spigoli esterni del muro di cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Asse d'ingresso dal centro verso il fronte: porta d, lastricato n, corpo di guardia g, strada r -->
      <all in="H/[hs]" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[hs]" out="*/p" symmetry="()"/>
      <all in="p/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/W" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="p" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Caserma e pozzo nel cortile dove c'è spazio (Huge e Gargantuan) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="vvvvv/vaaav/vaaav/vaaav/vcccv" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove resta terreno oltre il muro (Gargantuan) -->
      <all in="cWEEEEEE" out="**mm****" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
    </sequence>

    <!-- Scala reale: ogni cella di pianta diventa un blocco 5x5 -->
    <map scale="5 5 1" values="BEhwsdcnWgtavqrmKCAPVfFRkOoNGUMTQL#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="q" out="QQQQQ/QLLLQ/QLLLQ/QLLLQ/QQQQQ"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>

      <union symbol="+" values="KCAP"/>
      <union symbol="%" values="KCAP"/>
      <union symbol="=" values="fF"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Mura del maschio (65 voxel: 2 piani con fasce finestre U) -->
        <all in="B w" out="w K" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w K" steps="14"/>
        <all in="B w" out="w K" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w K" steps="14"/>
        <prl in="w" out="K"/>

        <!-- Porta del maschio (seme O a z=0, muro K sopra fino a z=64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="63"/>
        <prl in="d" out="K"/>

        <!-- Pavimenti, striscia scala T, solaio F e copertura R del maschio -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
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
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Muro di cinta (24 voxel) -->
        <all in="B W" out="W C" steps="23"/>
        <prl in="W" out="C"/>

        <!-- Corpo di guardia (38 voxel, seme porta O a z=0) -->
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g A" steps="36"/>
        <prl in="g" out="A"/>

        <!-- Torri angolari (42 voxel) -->
        <all in="B t" out="t P" steps="41"/>
        <prl in="t" out="P"/>

        <!-- Caserma nel cortile (1 piano, 32 voxel + tetto R) -->
        <all in="B v" out="v V" steps="32"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>

        <!-- Bordo del pozzo (6 voxel) -->
        <all in="B Q" out="Q Q" steps="5"/>

        <!-- C. Scala reale: porte, finestre, scale, merli, feritoie -->
        <import file="part-door"/>
        <import file="part-window"/>
        <prl in="U" out="K"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto a padiglione sulla copertura R -->
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette e aree -->
  <color symbol="E" value="7E9458" hidden="True" name="Terreno"/>
  <color symbol="K" value="8C8880" area="keep" name="Pietra del maschio"/>
  <color symbol="C" value="78746D" area="courtyard" name="Pietra del muro di cinta"/>
  <color symbol="A" value="69655E" area="gatehouse" name="Pietra del corpo di guardia"/>
  <color symbol="P" value="6E6A62" area="tower" name="Pietra della torre"/>
  <color symbol="V" value="968E82" area="barracks" name="Pietra della caserma"/>
  <color symbol="M" value="827E76" name="Merli"/>
  <color symbol="f" value="B89B72" area="keep" name="Assi di legno"/>
  <color symbol="F" value="A68960" area="keep" name="Solaio di legno"/>
  <color symbol="R" value="8F5943" name="Copertura"/>
  <color symbol="k" value="A19A8E" area="keep" name="Gradini di pietra"/>
  <color symbol="O" value="7A4F2F" name="Porta di legno"/>
  <color symbol="o" value="59371E" name="Assi della porta"/>
  <color symbol="N" value="5C5852" name="Cornice di pietra"/>
  <color symbol="G" value="7BA3B5" name="Vetro"/>
  <color symbol="U" value="363330" name="Feritoia"/>
  <color symbol="c" value="C7B793" area="courtyard" name="Cortile"/>
  <color symbol="n" value="A8A296" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="r" value="9E9789" area="road" name="Strada"/>
  <color symbol="m" value="46738C" area="moat" name="Acqua del fossato"/>
  <color symbol="Q" value="7A7670" area="courtyard" name="Pietra del pozzo"/>
  <color symbol="L" value="4F7D96" area="courtyard" name="Acqua del pozzo"/>
  <color symbol="#20" value="7A4F2F" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="59371E" hidden="True" name="Assi aperte"/>

  <!-- Azioni sulle porte -->
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
Letters: E Terreno, c Cortile, n Lastricato del cortile, r Strada, K Pietra del maschio, C Pietra del muro di cinta, A Pietra del corpo di guardia, P Pietra della torre, V Pietra della caserma, f Assi di legno, F Solaio di legno, R Copertura, k Gradini di pietra, O Porta di legno, o Assi della porta, N Cornice di pietra, G Vetro, U Feritoia, M Merli, Q Pietra del pozzo, L Acqua del pozzo
Plan (the letter on top of every column):
```
EEEEEEEEPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPEEEEE
EEEEEEEEPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPEEEEE
EEEEEEEEPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPEEEEE
EEEEEEEEPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCPPPPPPPEEEEE
EEEEEEEEPPPPPPMCCCCCCCCCCCCCCCCCCCCCCCPPPPPPPEEEEE
EEEEEEEEPPPPPcccccccccccccccRRRRRRRRRRRRPPPPPEEEEE
EEEEEEEEPPPPMcccccccccccccccRRRRRRRRRRRRMPPPPEEEEE
EEEEEEEEEPMMccccccccccccccccRRRRRRRRRRRRMPPMMEEEEE
EEEEEEEEEECCCcccccccccccccccccRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccccccccccccccccRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccccccQQQcccccccRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccccccQLQcccccccRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccccccQQccccccccRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccccccccccccccccRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccccccccccccccccRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccccccccccccccRRRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccccccccccccccRRRRRRRRRRRRCCCEEEEEEE
EEEEEEEEEECCCcccMNNNNcccNNNNMRRMNNNMRRRRCCCEEEEEEE
EEEEEEEEEECCCccMKKKKKKKKKKKKKKKKKKKKKMccCCCEEEEEEE
EEEEEEEEEECCCccMKKKKKKKKKKKKKKKKKKKKKMccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKcccCCCEEEEEEE
EEEEEEEEEECCCccMKKRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE
EEEEEEEEEECCCccMKKRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKNccCCCEEEEEEE
EEEEEEEEEECCCccMKKRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE
EEEEEEEEEECCCccMKKRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE
EEEEEEEEEECCCccMKKRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE
EEEEEEEEEECCCccMKKRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKNccCCCEEEEEEE
EEEEEEEEEECCCccKKKRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE
EEEEEEEEEECCCccMKKKKKKKKKKKKKKKKKKKKKMccCCCEEEEEEE
EEEEEEEEEECCCccMKKKKKKKKKKKKKKKKKKKKKMccCCCEEEEEEE
EEEEEEEEEECCcccMMNKMMcKMMnKMMnKMMNKMMcccCCCEEEEEEE
EEEEEEEEPPPPMccccccccccnnnnnnnccccccccccMPPPPEEEEE
EEEEEEEEPPPPPccccccccccnnnnnnnccccccccccPPPPPEEEEE
EEEEEEEEPPPPPPMCCCCCCCNMMAAMAMNCCCCCCCMPPPPPPEEEEE
EEEEEEEEPPPPPPPCCCCCCCNAAAAAAANCCCCCCCPPPPPPPEEEEE
EEEEEEEEPPPPPPPCCCCCCCNMMArMrMECCCCCCCPPPPPPPEEEEE
EEEEEEEEPPPPPPPEEEEEEEErrrrrrrEEEEEEEEPPPPPPPEEEEE
EEEEEEEEPPPPPPMEEEEEEEErrrrrrrEEEEEEEEPPPPPPMEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
0000000iiiiiiil0000000000000000000000liiiiiii00000
0000000iiiiiiii0000000000000000000000iiiiiiii00000
0000000liiiiiilaaaaaaaaaaaaaaaaaaaaaaliiiiiil00000
0000000liiiiiilaaaaaaaaaaaaaaaaaaaaaaliiiiiil00000
0000000iiiiiillaaaaaaaaaaaaaaaaaaaaaalliiiiii00000
0000000liiiii00000000000000eeeeeeeeeeeeeiiiil00000
0000000liiiil00000000000000efffffffffffeliiil00000
0000000llilll00000000000000eeefffffffffelilll00000
0000000000aaa00000000000000000effggggffeaaa0000000
0000000000aaa00000000000000000effggggffeaaa0000000
0000000000aaa00000002220000000effggggffeaaa0000000
0000000000aaa00000002020000000effggggffeaaa0000000
0000000000aaa00000002220000000effggggffeaaa0000000
0000000000aaa00000000000000000effggggffeaaa0000000
0000000000aaa00000000000000000effggggffeaaa0000000
0000000000aaa00000000000000eeefffffffffeaaa0000000
0000000000aaa00000000000000efffffffffffeaaa0000000
0000000000aaa00vvvsvvvsvvvsvvvsvvvsvvveeaaa0000000
0000000000aaa00vsssssssssssssssssssssv00aaa0000000
0000000000aaa00vsssssssssssssssssssssv00aaa0000000
0000000000aaa00sssssssssssssssssssssss00aaa0000000
0000000000aaa00vssttttttttttttttttsssv00aaa0000000
0000000000aaa00vssttttttttttttttttsssv00aaa0000000
0000000000aaa00vssttuuuuuuuuuuuuttsssv00aaa0000000
0000000000aaa00sssttuuuuuuuuuuuuttssss00aaa0000000
0000000000aaa0hvssttuuvvvvvvvvuuttsssv00aaa0000000
0000000000aaa0hvssttuuvvvvvvvvuuttsssv00aaa0000000
0000000000aaa0hsssttuuvvvvvvvvuuttssss00aaa0000000
0000000000aaa0hvssttuuvvvvvvvvuuttsssv00aaa0000000
0000000000aaa0hvssttuuvvvvvvvvuuttsssv00aaa0000000
0000000000aaa00sssttuuuuuuuuuuuuttssss00aaa0000000
0000000000aaa00vssttuuuuuuuuuuuuttsssv00aaa0000000
0000000000aaa00vssttttttttttttttttsssv00aaa0000000
0000000000aaa00vssttttttttttttttttsssv00aaa0000000
0000000000aaa00sssssssssssssssssssssss00aaa0000000
0000000000aaa00vsssssssssssssssssssssv00aaa0000000
0000000000aaa00vsssssssssssssssssssssv00aaa0000000
0000000lllill00vvvsvvvsvvvsvvvsvvvsvvv00lllil00000
0000000liiiil000000000000000000000000000liiil00000
0000000liiiii000000000000000000000000000iiiil00000
0000000liiiiillaaaaaaajjjgjjjjaaaaaaalliiiiii00000
0000000iiiiiiiiaaaaaaajggggggjaaaaaaaliiiiiil00000
0000000liiiiiilaaaaaaajjjgjjjjaaaaaaaliiiiiil00000
0000000liiiiiil0000000000000000000000iiiiiiil00000
0000000llllilll0000000000000000000000llllilll00000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
...............MM..MM..MM..MM..MM..MM.............
...............MMM.MMMRMMMRMMMRMMM.MMM............
...............MMM.MMMRMMMRMMMRMMM.MMM............
...............KKKKKKKKKKKKKKKKKKKKKKK............
...............KKKKKKKKKKKKKKKKKKKKKKK............
...............KUKKKUKKKUKKKUKKKUKKKUK............
...............KUKKKUKKKUKKKUKKKUKKKUK............
...............KKKKKKKKKKKKKKKKKKKKKKK............
...............KKKKKKKKKKKKKKKKKKKKKKK............
...............KKKKKKKKKKKKKKKKKKKKKKK............
...............KKKKKKKKKKKKKKKKKKKKKKK............
...............KKGGGNKKKKKKKKKKKGGGNKK............
.......MMMMMMMMKKGGGGKKKKKKKKKKKGGGGKKMMMMMMM.....
.......MMMMMMMMKKGGGGKKKKKKKKKKKGGGGKKMMMMMMM.....
.......MMMMMMMMKKGGGGKKMMKKMKMKKGGGGKKMMMMMMM.....
.......PPPPPPPPKKGGGGKKMMKKMKMKKGGGGKKPPPPPPP.....
.......PPPPPPPPKKNNNNKKMMKKMKMKKNNNNKKPPPUPPP.....
.......PPPPPPPPKKKKKKKKAAAAAAAKKKKKKKKPPPUPPP.....
.......PPPPPPPPKKKKKKKKAAAAAAAKKKKKKKKPPPUPPP.....
.......PPPPPPPPKKKKKKKKAAAAAAAKKKKKKKKPPPPPPP.....
.......PPPPPPPPKKKKKKKKNNNNNNNKKKKKKKKPPPPPPP.....
.......PPPPPPPPKKKKKKKNoooooooNKKKKKKKPPPPPPP.....
.......PPPPPPPPKKKKKKKNoooooooNKKKKKKKPPPPPPP.....
.......PPPPPPPPKKKKKKKNoooooooNKKKKKKKPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
..................MM..MM..M.M..MM..MM.............
.................MMM.MMMRRMRMMRMMM.MMM............
.................MMM.MMMRRMRMMRMMM.MMM............
.................KKKKKKKKKKKKKKKKKKKKK............
.................KKKKKKKKKKKKKKKKKKKKK............
.................KKKKKKKKKKKKKKKUKKKUK............
.................KKKKKKKKKKKKKKKUKKKUK............
.................KKKKKKKKKKKKKKKKKKKKK............
.................KKKKKKKKKKKKKKKKKKKKK............
.................KKKKKKKKKKKKKKKKKKKKK............
.................KKKKKKKKKKKKKKKKKKKKK............
.................KKKKKKKKKGGGNKKKKKKKK............
M.MMMMMM.........KKKKKKKKKGGGNKKKKKKKKMMMMMMM.....
M.MMMMMM.........KKKKKKKKKGGGNKKKKKKKKMMMMMMM.....
M.MMMMMM.........KKKKKKKKKGGGNKKKKKKKKMMMMMMM.....
PPPPPPPP.........KKKKKKKKKGGGNKKKKKKKKPPPPPPP.....
PPPPPPUP.........KKKKKKKKKNNNNKKKKKKKKPPPUPPP.....
PPPPPPUP.RRRR....KKKKKKKKKKKKKKKKKKKKKPPPUPPP.....
PPPPPPUPRRRRRRR..KKKKKKKKKKKKKKKKKKKKKPPPUPPP.....
PPPPPPPPRRRRRRRRRKKKKKKKKKKKKKKKKKKKKKPPPPPPP.....
PPPPPPPPVVVVVVVVVVKKKKKKKKKKKKKKKKKKKKPPPPPPP.....
PPPPPPPPVVVVVVVVVVKKKKKKKKKKKKKKKKKKKKPPPPPPP.....
PPPPPPPPVVVVVVVVVVKKKKKKKKKKKKKKKKKKKKPPPPPPP.....
PPPPPPPPVVVVVVVVVVKKKKKKKKKKKKKKKKKKKKPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
.......PPPPPPPP......................PPPPPPPP.....
.......PPPPPPPP......................PPPPPPPP.....
.......PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCPPPPPPPP.....
.......PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCCCCCCCCCCCCCCCCCPPPPPPP.....
.......PPPPPP..............VVVVVVVVVVVVVPPPPP.....
.......PPPPPP..............VVVVVVVVVVVVVPPPPP.....
........PPPPP...............VVVVVVVVVVVVPPPPP.....
..........CCC........................VVVCCC.......
..........CCC........................VVVCCC.......
..........CCC........................VVVCCC.......
..........CCC........................VVVCCC.......
..........CCC........................VVVCCC.......
..........CCC........................VVVCCC.......
..........CCC........................VVVCCC.......
..........CCC..............VVVVVVVVVVVVVCCC.......
..........CCC..............VVVVVVVVVVVVVCCC.......
..........CCC..KKGGGNKKKKKKKVVVVVVVVVVVVCCC.......
..........CCC..KK...KKKKKKKKKKKKKKKKKK..CCC.......
..........CCC..KK...KKKKKKKKKKKKKKKKKK..CCC.......
..........CCC..KK........kkkkkk....KKK..CCC.......
..........CCC..KKK.......kkkkkk....KKK..CCC.......
..........CCC..KKK.......kkkkkk....KKK..CCC.......
..........CCC..KKK.......kkkkkk....KKK..CCC.......
..........CCC..KKK.......kkkkkk....KKK..CCC.......
..........CCC..KKK.................KKN..CCC.......
..........CCC..G.....................G..CCC.......
..........CCC..G.....................G..CCC.......
..........CCC..G...................KKG..CCC.......
..........CCC..KKK.................KKK..CCC.......
..........CCC..KKK.................KKK..CCC.......
..........CCC..KKK.................KKK..CCC.......
..........CCC..KKK.................KKN..CCC.......
..........CCC..KKK...................G..CCC.......
..........CCC..KK....................G..CCC.......
..........CCC..KK...KKKoooooooKK....KG..CCC.......
..........CCC..KK...KKKoooooooKK...KKK..CCC.......
........PPCCC..KKGGGGKKoooooooKKGGGGK...CCPPP.....
.......PPPPPP...........................PPPPP.....
.......PPPPPP...........................PPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCCPPPPPPP.....
.......PPPPPPPPCCCCCCCNoooooooNCCCCCCPPPPPPPP.....
.......PPPPPPPP......................PPPPPPPP.....
.......PPPPPPPP......................PPPPPPPP.....
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..............M......................M............
..................................................
.......M....................................M.....
..............M......................M............
..............M......................MM...........
.......M....................................M.....
.......M....M...........................M...M.....
..........MM............................M..MM.....
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
...............KKNGGGKKKNGGGNKKKGGGNK.............
...............KKK..KKKKK...KKKK...KKK............
...............KKK..KKKKK...KKKK...KKK............
...............KKK.................KKK............
...............KKK.................KKK............
...............KKK.................KKK............
...............KKK.................KKK............
...............KKK.................KKK............
...............KKK.................KKK............
...............G.....................G............
...............G.....................G............
...............G.....................G............
...............KKK.................KKN............
...............KKK.................KKK............
...............KKK.................KKK............
...............KKK.................KKK............
...............KKK.................KKK............
...............KK..................KKK............
...............KK...KKKKKKKKKKKK...KKK............
...............KK...KKKKKKKKKKKK...KKK............
........MM.....KKGGGGKKKKKKKKKKKGGGGK...MM..M.....
.......M....M...........................M...M.....
............................................M.....
.......M......M.......MMM..M.M.......MM...........
......................M......M.......M............
.......................MM..M.M..............M.....
.......M......M...................................
.......MM.M..MM......................MM.M..MM.....
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
EEEEEPPPPPPPMEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPEEEEE   00000iiiiiiil000000000000000000000000liiiiiii00000
EEEEEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPEEEEE   00000iiiiiiii000000000000000000000000iiiiiiii00000
EEEEEMPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPEEEEE   00000liiiiiilaaaaaaaaaaaaaaaaaaaaaaaaliiiiiil00000
EEEEEPPPPPPPMCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPPEEEEE   00000liiiiiilaaaaaaaaaaaaaaaaaaaaaaaaliiiiiil00000
EEEEEPPPPPPPMCCCCCCCCCCCCCCCCCCCCCCCCCPPPPPPPEEEEE   00000iiiiiillaaaaaaaaaaaaaaaaaaaaaaaalliiiiii00000
EEEEEMPPPPccccccccRRccccccccRRccccccccccPPPPPEEEEE   00000liiii0000000eee0000000eee0000000000iiiil00000
EEEEEMPPPPccccccccRRccccccccRRccccccccccMPPPPEEEEE   00000liiil0000000efe0000000efe0000000000liiil00000
EEEEEMPPMMccccccccRRcccccccRRRccccccccccMPPMMEEEEE   00000lilll0000000effeeeeeeeffe0000000000lilll00000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000efffffffffffe0000000000aaa0000000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000efffffffffffe0000000000aaa0000000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000effgggggggffe0000000000aaa0000000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000effgggggggffe0000000000aaa0000000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000effgggggggffe0000000000aaa0000000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000effgggggggffe0000000000aaa0000000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000effgggggggffe0000000000aaa0000000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000efffffffffffe0000000000aaa0000000
EEEEEEEECCccccccccRRRRRRRRRRRRccccccccccCCCEEEEEEE   0000000aaa0000000efffffffffffe0000000000aaa0000000
EEEEEEEECCccccccNNNNRRRNNNNRRRNNNNccccccCCCEEEEEEE   0000000aaa00vvvsvvvsvvvsvvsvvvsvvvsvvv00aaa0000000
EEEEEEEECCcccKKKKKKKKKKKKKKKKKKKKKKKKMccCCCEEEEEEE   0000000aaa00vssssssssssssssssssssssssv00aaa0000000
EEEEEEEECCcccKKKKKKKKKKKKKKKKKKKKKKKKMccCCCEEEEEEE   0000000aaa00vssssssssssssssssssssssssv00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE   0000000aaa00ssssssssssssssssssssssssss00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKcccCCCEEEEEEE   0000000aaa00vsssttttttttttttttttttsssv00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE   0000000aaa00vsssttttttttttttttttttsssv00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE   0000000aaa00vsssttuuuuuuuuuuuuuuttsssv00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE   0000000aaa00ssssttuuuuuuuuuuuuuuttssss00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE   0000000aaa00vsssttuuvvvvvvvvvvuuttsssv00aaa0000000
EEEEEEEECCccNKKRRRRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE   0000000aaa00vsssttuuvvvvvvvvvvuuttsssv00aaa0000000
EEEEEEEECCccNKKRRRRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE   0000000aaa00ssssttuuvvvvvvvvvvuuttssss00aaa0000000
EEEEEEEECCccNKKRRRRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE   0000000aaa00vsssttuuvvvvvvvvvvuuttsssv00aaa0000000
EEEEEEEECCccNKKRRRRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE   0000000aaa00vsssttuuvvvvvvvvvvuuttsssv00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE   0000000aaa00ssssttuuuuuuuuuuuuuuttssss00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE   0000000aaa00vsssttuuuuuuuuuuuuuuttsssv00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKMccCCCEEEEEEE   0000000aaa00vsssttttttttttttttttttsssv00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKcccCCCEEEEEEE   0000000aaa00vsssttttttttttttttttttsssv00aaa0000000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRKKKccCCCEEEEEEE   0000000aaa00ssssssssssssssssssssssssss00aaa0000000
EEEEEEEECCcccKKKKKKKKKKKKKKKKKKKKKKKKMccCCCEEEEEEE   0000000aaa00vssssssssssssssssssssssssv00aaa0000000
EEEEEEEECCcccKKKKKKKKKKKKKKKKKKKKKKKKMccCCCEEEEEEE   0000000aaa00vssssssssssssssssssssssssv00aaa0000000
EEEEEEEECCcccMMKNMMKcMMKnnKMMnKMMNKMMcccCCCEEEEEEE   00000lilll00vvvsvvvsvvvsvvsvvvsvvvsvvv00lilll00000
EEEEEMPPPPcccccccccccccnnnnnnnccccccccccMPPPPEEEEE   00000liiil000000000000000000000000000000liiil00000
EEEEEPPPPPcccccccccccccnnnnnnnccccccccccPPPPPEEEEE   00000liiii000000000000000000000000000000iiiil00000
EEEEEMPPPPPMMCCCCCCCCCNMMAAMAMNCCCCCCCMPPPPPPEEEEE   00000liiiiillaaaaaaaaajjjgjjjjaaaaaaalliiiiii00000
EEEEEPPPPPPPMCCCCCCCCCNAAAAAAANCCCCCCCPPPPPPPEEEEE   00000iiiiiiilaaaaaaaaajggggggjaaaaaaaliiiiiil00000
EEEEEPPPPPPPMCCCCCCCCCNMrMArMMECCCCCCCPPPPPPPEEEEE   00000liiiiiilaaaaaaaaajjjjgjjjaaaaaaaliiiiiil00000
EEEEEMPPPPPPPEEEEEEEEEErrrrrrrEEEEEEEEPPPPPPPEEEEE   00000liiiiiii000000000000000000000000iiiiiiil00000
EEEEEMPPPPPPMEEEEEEEEEErrrrrrrEEEEEEEEPPPPPPMEEEEE   00000lllillll000000000000000000000000llllilll00000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEPPPPPPPMEEEEEEEEEEEEEEEEEEEEEEEEEEEMPPPPPPPEE   00000iiiiiiil000000000000000000000000000liiiiiii00
EEEEEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPEE   00000iiiiiiii000000000000000000000000000iiiiiiii00
EEEEEMPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPMEE   00000liiiiiilaaaaaaaaaaaaaaaaaaaaaaaaaaaliiiiiil00
EEEEEPPPPPPPMCCCCCCCCCCCCCCCCCCCCCCCCCCCMPPPPPPEEE   00000liiiiiilaaaaaaaaaaaaaaaaaaaaaaaaaaaliiiiiil00
EEEEEPPPPPPPMCCCCCCCCCCCCCCCCCCCCCCCCCCCMPPPPPPPEE   00000iiiiiillaaaaaaaaaaaaaaaaaaaaaaaaaaalliiiiii00
EEEEEMPPPPccccccccccccccccccRRRRRRRRRRRRcccPPPPMEE   00000liiii00000000000000000eeeeeeeeeeeee00iiiiil00
EEEEEMPPPPccccccccccccccccccRRRRRRRRRRRRcccPPPPMEE   00000liiil00000000000000000efffffffffffe00liiiil00
EEEEEMMMPMccccccccccccccccccRRRRRRRRRRRRcccMMPEEEE   00000lllil00000000000000000efffffffffffe00lllill00
EEEEEEEECCccccccccccccccccccRRRRRRRRRRRRcccCCEEEEE   0000000aaa00000000000000000effgggggggffe00aaa00000
EEEEEEEECCccccccccccccccccccRRRRRRRRRRRRcccCCEEEEE   0000000aaa00000000000000000effgggggggffe00aaa00000
EEEEEEEECCccccccccccQQQcccccRRRRRRRRRRRRcccCCEEEEE   0000000aaa00000000002220000effgggggggffe00aaa00000
EEEEEEEECCccccccccccQLQcccccRRRRRRRRRRRRcccCCEEEEE   0000000aaa00000000002020000effgggggggffe00aaa00000
EEEEEEEECCccccccccccQQccccccRRRRRRRRRRRRcccCCEEEEE   0000000aaa00000000002220000efffffffffffe00aaa00000
EEEEEEEECCccccccccccccccccccRRRRRRRRRRRRcccCCEEEEE   0000000aaa00000000000000000efffffffffffe00aaa00000
EEEEEEEECCccccccccccccccccccRRRRRRRRRRRRcccCCEEEEE   0000000aaa00000000000000000effeeeeeeeffe00aaa00000
EEEEEEEECCccccccccccccccccccRRccccccccRRcccCCEEEEE   0000000aaa00000000000000000efe0000000efe00aaa00000
EEEEEEEECCccccccccccccccccccRRccccccccRRcccCCEEEEE   0000000aaa00000000000000000efe0000000efe00aaa00000
EEEEEEEECCccccNNNNNNNNNNNNNNKRcMNNNMccRRcccCCEEEEE   0000000aaa00vvvsvvvsvvvsvvvvsvvvsvvvsvvv00aaa00000
EEEEEEEECCcccKKKKKKKKKKKKKKKKKKKKKKKKKKKcccCCEEEEE   0000000aaa00vssssssssssssssssssssssssssv00aaa00000
EEEEEEEECCcccKKKKKKKKKKKKKKKKKKKKKKKKKKKcccCCEEEEE   0000000aaa00vssssssssssssssssssssssssssv00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00ssssssssssssssssssssssssssss00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00vssstttttttttttttttttttttssv00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00vssstttttttttttttttttttttssv00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00vsssttuuuuuuuuuuuuuuuuuttssv00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00ssssttuuuuuuuuuuuuuuuuuttsss00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00vsssttuuvvvvvvvvvvvvvuuttssvh0aaa00000
EEEEEEEECCccNKKRRRRRRRRRRRRRRRRRRRRRRRKKNccCCEEEEE   0000000aaa00vsssttuuvvvvvvvvvvvvvuuttssvh0aaa00000
EEEEEEEECCccNKKRRRRRRRRRRRRRRRRRRRRRRRKKNccCCEEEEE   0000000aaa00ssssttuuvvvvvvvvvvvvvuuttsssh0aaa00000
EEEEEEEECCccNKKRRRRRRRRRRRRRRRRRRRRRRRKKNccCCEEEEE   0000000aaa00vsssttuuvvvvvvvvvvvvvuuttssvh0aaa00000
EEEEEEEECCccNKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00vsssttuuvvvvvvvvvvvvvuuttssvh0aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00ssssttuuuuuuuuuuuuuuuuuttsss00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00vsssttuuuuuuuuuuuuuuuuuttssv00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00vssstttttttttttttttttttttssv00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00vssstttttttttttttttttttttssv00aaa00000
EEEEEEEECCcccKKRRRRRRRRRRRRRRRRRRRRRRRKKcccCCEEEEE   0000000aaa00ssssssssssssssssssssssssssss00aaa00000
EEEEEEEECCcccKKKKKKKKKKKKKKKKKKKKKKKKKKKcccCCEEEEE   0000000aaa00vssssssssssssssssssssssssssv00aaa00000
EEEEEEEECCcccKKKKKKKKKKKKKKKKKKKKKKKKKKKcccCCEEEEE   0000000aaa00vssssssssssssssssssssssssssv00aaa00000
EEEEEEEECCcccMMKNMMKcMMKnMnMKnMMKNMMKcMMcccCCEEEEE   00000lilll00vvvsvvvsvvvsvvvvsvvvsvvvsvvv00lllill00
EEEEEMPPPPcccccccccccccnnnnnnncccccccccccccPPPPMEE   00000liiil00000000000000000000000000000000liiiil00
EEEEEPPPPPcccccccccccccnnnnnnncccccccccccccPPPPEEE   00000liiii00000000000000000000000000000000iiiiil00
EEEEEMPPPPPMMCCCCCCCCCNMMAAMAMNCCCCCCCCCMPPPPPPMEE   00000liiiiillaaaaaaaaajjjgjjjjaaaaaaaaaalliiiiil00
EEEEEPPPPPPPMCCCCCCCCCNAAAAAAANCCCCCCCCCMPPPPPPPEE   00000iiiiiiilaaaaaaaaajggggggjaaaaaaaaaaliiiiiii00
EEEEEPPPPPPPMCCCCCCCCCNMrMArMMECCCCCCCCCPPPPPPPEEE   00000liiiiiilaaaaaaaaajjjjgjjjaaaaaaaaaaliiiiiil00
EEEEEMPPPPPPPEEEEEEEEEErrrrrrrEEEEEEEEEEPPPPPPPMEE   00000liiiiiii000000000000000000000000000iiiiiiil00
EEEEEMPPPPPPMEEEEEEEEEErrrrrrrEEEEEEEEEEMPPPPPPMEE   00000llllilll000000000000000000000000000lllillll00
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.37 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 180 nodi, 707 passi, finito in 422 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Terreno (marcatore), h=honey, w=white, s=slate, d=dead, dark, c=Cortile, n=Lastricato del cortile, W=White, g=green, t=teal, a=alive, gray, v=olive, q=aqua, r=Strada, p=purple, x=x, K=Pietra del maschio, C=Pietra del muro di cinta, A=Pietra del corpo di guardia, P=Pietra della torre, V=Pietra della caserma, f=Assi di legno, F=Solaio di legno, R=Copertura, k=Gradini di pietra, O=Porta di legno, o=Assi della porta, N=Cornice di pietra, G=Vetro, U=Feritoia, M=Merli, T=Teal (marcatore), Q=Pietra del pozzo, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #94=? (marcatore), #93=terreno di prova (marcatore), #95=? (marcatore), #96=? (marcatore), #97=? (marcatore).
Alla fine: K 40263, P 32610, C 23160, V 10400, R 4532, o 4260, E 4075, k 2720, U 2274, M 1560, c 1400, f 1275, N 1157, F 890, G 830, A 525, O 240, r 225, Q 96, n 75, L 9.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-40 all×24, prl×3, one×3: 306 celle x3-17 y0-19 z0, passi 2-44
   #45 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 45
#47-48 all×2: 24300 celle x30-74 y35-74 z0-18, passi 46-63
    #49 all . w → w K passi=14: ×14, 18900 celle x30-74 y35-74 z18-32, passi 64-77, w→K 9450, .→w 9450
#50-51 all×2: 24300 celle x30-74 y35-74 z32-50, passi 78-95
    #52 all . w → w K passi=14: ×14, 18900 celle x30-74 y35-74 z50-64, passi 96-109, w→K 9450, .→w 9450
#53-58 prl×2, all×4: 12850 celle x30-74 y35-74 z0-64, passi 110-177
    #59 all . h → h . passi=31: ×31, 52700 celle x35-69 y40-69 z1-32, passi 178-208, h→. 26350, .→h 26350
#60-61 all×2: 14100 celle x35-69 y40-69 z2-33, passi 209-239
    #62 all . h → h . (+1) passi=31: ×31, 65100 celle x35-69 y40-69 z33-64, passi 240-270, h→. 26350, .→h 26350, s→. 6200, .→s 6200
      r1 . h → h . ×26350; r2 . s → s . ×6200
    #63 prl h → R (+1): ×1, 1050 celle x35-69 y40-69 z64, passi 271, h→R 850, s→R 200
      r1 h → R ×850; r2 s → R ×200
    #64 all . W → W C passi=23: ×23, 44850 celle x20-84 y5-84 z0-23, passi 272-294, W→C 22425, .→W 22425
#65-68 prl×2, all×2: 6600 celle x20-84 y5-84 z0-37, passi 295-333
    #69 all . t → t P passi=41: ×41, 65600 celle x15-89 y0-89 z0-41, passi 334-374, t→P 32800, .→t 32800
#70-71 prl×1, all×1: 21600 celle x15-89 y0-89 z0-41, passi 375-407
#72-86 prl×2, all×7: 24210 celle x40-79 y10-84 z0-32, passi 408-478
#98-114 all×7, prl×9: 15213 celle x29-75 y34-75 z6-49, passi 479-560
#115-123 prl×3, all×6: 19699 celle x29-75 y34-75 z6-49, passi 561-569
#141-180 all×17, prl×6: 22057 celle x15-89 y0-89 z1-70, passi 570-707
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/p → p/* passi=1
#10 prl Ex → x* passi=1
#12 prl xE → *x passi=1
#21 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all cEEEEEEEEE → *ccccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#23 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#41 all cWEEEEEE → **mm**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#42 all [Wt]E/*m → **/*m: in quel momento nella griglia non c'erano celle "m"
#43 all mE/*m → *m/**: in quel momento nella griglia non c'erano celle "m"
#78 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#79 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#80 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
… e altri 43
Fix it and answer with the whole program.

## Risposta

```xml
<!--
Forte medievale: programma completo (pianta, altezze, scala reale)
Parti e lettere in pianta (cella = 5 voxel):
- h: pavimento del maschio (area="keep"), corpo centrale rettangolare attorno ad H
- w: mura del maschio, spesse 1 cella attorno ad h
- s: zona scala interna del maschio (area="keep"), lungo la parete di fondo con pianerottolo a sinistra
- d: porta del maschio, larga 3 celle sul fronte
- c: cortile interno attorno al maschio (area="courtyard")
- n: lastricato nel cortile dall'ingresso al maschio (area="courtyard")
- W: muro di cinta attorno al cortile
- g: corpo di guardia sul fronte del muro di cinta (area="gatehouse")
- t: torri angolari 3x3 sugli spigoli esterni del muro di cinta (area="tower")
- a, v: caserma/annesso nel cortile con le sue mura (area="barracks")
- q: pozzo nel cortile (area="courtyard")
- r: strada lastricata dal corpo di guardia fino al bordo anteriore (area="road")
- m: fossato esterno oltre il muro di cinta (area="moat")
- p, x: marcatori temporanei per la croce del maschio e l'asse d'ingresso

Variazioni tra i semi:
- spina e traversa del maschio di lunghezza variabile per seme (larghezza 7-9, profondità 8-9 celle, così da lasciare almeno 30x30 voxel liberi davanti alla scala)
- posizione della caserma e del pozzo nel cortile

Cosa entra in ogni taglia:
- Large (100x100x80): maschio a due piani con scala interna e merli, cortile, muro di cinta, corpo di guardia, 4 torri angolari e strada
- Huge (150x150x120): cortile più ampio, caserma con tetto a falde e pozzo nel cortile
- Gargantuan (500x500): cortile esteso e fossato esterno attorno alle mura
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdcnWgtavqrmpx" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Maschio attorno ad H: spina verticale p (3-4 dietro, 4 davanti: 8-9 celle = 40-45 voxel) e traversa orizzontale x (3-4 per lato: 7-9 celle = 35-45 voxel) -->
      <all in="E/[Hp]" out="p/*" symmetry="()" steps="3"/>
      <prl in="E/p" out="p/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hp]/E" out="*/p" symmetry="()" steps="4"/>

      <all in="E[Hx]" out="x*" symmetry="()" steps="3"/>
      <prl in="Ex" out="x*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hx]E" out="*x" symmetry="()" steps="3"/>
      <prl in="xE" out="*x" p="0.5" steps="1" symmetry="()"/>

      <!-- Riempie il rettangolo del maschio -->
      <prl>
        <rule in="p" out="h"/>
        <rule in="x" out="h"/>
      </prl>
      <all in="hE/*h" out="*h/**"/>

      <!-- Mura del maschio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala interna lungo il muro di fondo: 2 celle di pianerottolo a sinistra, 4 di scala, 1 di sbarco -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- Cortile attorno al maschio: 1 cella a Large, si espande a Huge e Gargantuan -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*ccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muro di cinta attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari 3x3 sugli spigoli esterni del muro di cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Asse d'ingresso dal centro verso il fronte: porta d, lastricato n, corpo di guardia g, strada r -->
      <all in="H/[hs]" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[hs]" out="*/p" symmetry="()"/>
      <all in="p/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/W" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="p" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Caserma e pozzo nel cortile dove c'è spazio (Huge e Gargantuan) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="vvvvv/vaaav/vaaav/vaaav/vcccv" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove resta terreno oltre il muro (Gargantuan) -->
      <all in="cWEEEEEE" out="**mm****" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
    </sequence>

    <!-- Scala reale: ogni cella di pianta diventa un blocco 5x5 -->
    <map scale="5 5 1" values="BEhwsdcnWgtavqrmKCAPVfFRkOoNGUMTQL#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="q" out="QQQQQ/QLLLQ/QLLLQ/QLLLQ/QQQQQ"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>

      <union symbol="+" values="KCAP"/>
      <union symbol="%" values="KCAP"/>
      <union symbol="=" values="fF"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Mura del maschio (65 voxel: 2 piani con fasce finestre U) -->
        <all in="B w" out="w K" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w K" steps="14"/>
        <all in="B w" out="w K" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w K" steps="14"/>
        <prl in="w" out="K"/>

        <!-- Porta del maschio (seme O a z=0, muro K sopra fino a z=64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="63"/>
        <prl in="d" out="K"/>

        <!-- Pavimenti, striscia scala T, solaio F e copertura R del maschio -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
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
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Muro di cinta (24 voxel) -->
        <all in="B W" out="W C" steps="23"/>
        <prl in="W" out="C"/>

        <!-- Corpo di guardia (38 voxel, seme porta O a z=0) -->
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g A" steps="36"/>
        <prl in="g" out="A"/>

        <!-- Torri angolari (42 voxel) -->
        <all in="B t" out="t P" steps="41"/>
        <prl in="t" out="P"/>

        <!-- Caserma nel cortile (1 piano, 32 voxel + tetto R) -->
        <all in="B v" out="v V" steps="32"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>

        <!-- Bordo del pozzo (6 voxel) -->
        <all in="B Q" out="Q Q" steps="5"/>

        <!-- C. Scala reale: porte, finestre, scale, merli, feritoie -->
        <import file="part-door"/>
        <import file="part-window"/>
        <prl in="U" out="K"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto a padiglione sulla copertura R -->
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette e aree -->
  <color symbol="E" value="7E9458" hidden="True" name="Terreno"/>
  <color symbol="K" value="8C8880" area="keep" name="Pietra del maschio"/>
  <color symbol="C" value="78746D" area="courtyard" name="Pietra del muro di cinta"/>
  <color symbol="A" value="69655E" area="gatehouse" name="Pietra del corpo di guardia"/>
  <color symbol="P" value="6E6A62" area="tower" name="Pietra della torre"/>
  <color symbol="V" value="968E82" area="barracks" name="Pietra della caserma"/>
  <color symbol="M" value="827E76" name="Merli"/>
  <color symbol="f" value="B89B72" area="keep" name="Assi di legno"/>
  <color symbol="F" value="A68960" area="keep" name="Solaio di legno"/>
  <color symbol="R" value="8F5943" name="Copertura"/>
  <color symbol="k" value="A19A8E" area="keep" name="Gradini di pietra"/>
  <color symbol="O" value="7A4F2F" name="Porta di legno"/>
  <color symbol="o" value="59371E" name="Assi della porta"/>
  <color symbol="N" value="5C5852" name="Cornice di pietra"/>
  <color symbol="G" value="7BA3B5" name="Vetro"/>
  <color symbol="U" value="363330" name="Feritoia"/>
  <color symbol="c" value="C7B793" area="courtyard" name="Cortile"/>
  <color symbol="n" value="A8A296" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="r" value="9E9789" area="road" name="Strada"/>
  <color symbol="m" value="46738C" area="moat" name="Acqua del fossato"/>
  <color symbol="Q" value="7A7670" area="courtyard" name="Pietra del pozzo"/>
  <color symbol="L" value="4F7D96" area="courtyard" name="Acqua del pozzo"/>
  <color symbol="#20" value="7A4F2F" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="59371E" hidden="True" name="Assi aperte"/>

  <!-- Azioni sulle porte -->
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

