# model.sculpt · gemini-4-hydrogen · 28 s

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
  Forte:
  - Mastio centrale (h: pavimento, s: zona scala, w: mura del mastio, d: porta del mastio) intorno al centro H, con due piani e merlatura.
  - Cortile (c: cortile, n: lastricato d'ingresso, Q: pozzo dove c'e spazio) attorno al mastio.
  - Cinta muraria (W: mura di cinta, G: corpo di guardia al fronte, t: torri d'angolo dove c'e spazio) attorno al cortile.
  - Strada (r) dal corpo di guardia al bordo, e alberi (g) all'esterno dove c'e spazio.
  - I semi variano la profondita del mastio, la posizione della scala, la posizione del pozzo e degli alberi.
  - A taglia Large (5x5): mastio, cortile stretto, cinta, corpo di guardia e strada. A Huge (7.5x7.5) e Gargantuan (10x10): cortile piu ampio, torri d'angolo, pozzo e alberi esterni.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdsncWGrQtg" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio centrale attorno a H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala lungo una parete del mastio -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio, espanso dove c'e spazio -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo sugli spigoli esterni della cinta dove c'e spazio -->
      <all in="EE/EW" out="**/*t" steps="1"/>
      <all steps="2">
        <rule in="tE" out="*t"/>
        <rule in="t*/*E" out="**/*t"/>
      </all>

      <!-- Ingresso dal centro H al fronte fino al bordo -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allarga porta, lastricato, corpo di guardia e strada a 3 celle -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Ripristina il pavimento interno dove era passato il tracciato -->
      <prl>
        <rule in="H" out="h"/>
      </prl>

      <!-- Pozzo nel cortile dove c'e spazio 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi all'esterno dove c'e spazio 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***g***/*******/*******/*******"/>
    </sequence>
  </map>

  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="H" value="E04040" name="centro"/>
  <color symbol="h" value="B89868" name="pavimento del mastio" area="keep"/>
  <color symbol="s" value="D4B483" name="zona scala" area="keep"/>
  <color symbol="w" value="7A7268" name="mura del mastio" area="keep"/>
  <color symbol="d" value="5C3A21" name="porta del mastio" area="keep"/>
  <color symbol="c" value="A69A80" name="cortile" area="courtyard"/>
  <color symbol="n" value="8C8270" name="lastricato" area="courtyard"/>
  <color symbol="W" value="625C54" name="cinta muraria" area="wall"/>
  <color symbol="G" value="4F4840" name="corpo di guardia" area="gatehouse"/>
  <color symbol="t" value="565048" name="torre d'angolo" area="tower"/>
  <color symbol="r" value="9E8B6E" name="strada" area="road"/>
  <color symbol="Q" value="4A7A8C" name="pozzo" area="courtyard"/>
  <color symbol="g" value="4A7038" name="albero" area="garden"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w mura del mastio, d porta del mastio, s zona scala, n lastricato, c cortile, W cinta muraria, G corpo di guardia, r strada, t torre d'angolo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttWWWWWWWWWWWWWttt
EttWcccccccccccccWtt
EttWcwwwwwwwwwwwcWtt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EttWcwwwwdddwwwwcWtt
EttWcccccnnncccccWtt
EtttWWWWWGGGWWWWWttt
EtttttEEErrrEEEttttt
EtttttEEErrrEEEttttt
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w mura del mastio, d porta del mastio, s zona scala, n lastricato, c cortile, W cinta muraria, G corpo di guardia, r strada, t torre d'angolo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttWWWWWWWWWWWWWttt
EttWcccccccccccccWtt
EttWcwwwwwwwwwwwcWtt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EttWcwwwwdddwwwwcWtt
EttWcccccnnncccccWtt
EtttWWWWWGGGWWWWWttt
EtttttEEErrrEEEttttt
EtttttEEErrrEEEttttt
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w mura del mastio, d porta del mastio, s zona scala, n lastricato, c cortile, W cinta muraria, G corpo di guardia, r strada, t torre d'angolo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttWWWWWWWWWWWWWttt
EttWcccccccccccccWtt
EttWcwwwwwwwwwwwcWtt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EEEWcwhhhhdhhhhwcWEE
EttWcwwwwdddwwwwcWtt
EttWcccccnnncccccWtt
EtttWWWWWGGGWWWWWttt
EtttttEEErrrEEEttttt
EtttttEEErrrEEEttttt
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w mura del mastio, d porta del mastio, s zona scala, n lastricato, c cortile, W cinta muraria, G corpo di guardia, r strada, Q pozzo, t torre d'angolo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttWWWWWWWWWWWWWWWWWWWWWtttE
EEttWcccccccccccccccccccccWttE
EEttWcccccccccccccccccccccWttE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhdhhhhwcccccWEEE
EEEEWcccccwhhhhdhhhhwcccccWEEE
EEEEWcccccwhhhhdhhhhwcccccWEEE
EEEEWcccccwhhhhdhhhhwcccccWEEE
EEEEWcccccwwwwdddwwwwcccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWccccccQccnnncccccccccWEEE
EEttWcccccccccnnncccccccccWttE
EEttWcccccccccnnncccccccccWttE
EEtttWWWWWWWWWGGGWWWWWWWWWtttE
EEtttttEEEEEEErrrEEEEEEEtttttE
EEtttttEEEEEEErrrEEEEEEEtttttE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Forte:
  - Mastio centrale (h: pavimento, s: zona scala, w: mura del mastio, d: porta del mastio) intorno al centro H, con due piani e merlatura.
  - Cortile (c: cortile, n: lastricato d'ingresso, Q: pozzo dove c'e spazio) attorno al mastio.
  - Cinta muraria (W: mura di cinta, G: corpo di guardia al fronte, t: torri d'angolo dove c'e spazio) attorno al cortile.
  - Strada (r) dal corpo di guardia al bordo, e alberi (g) all'esterno dove c'e spazio.
  - I semi variano le dimensioni del mastio, la posizione della scala, la posizione del pozzo e degli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="W"/>
  <union symbol="%" values="W"/>
  <union symbol="=" values="fF"/>

  <map scale="1/5 1/5 1" values="BHEhwdsncWGrQtgm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio centrale attorno a H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala lungo una parete del mastio (orientata verso +x) -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="(y)" steps="1"/>

      <!-- Cortile attorno al mastio, espanso dove c'e spazio -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo sugli spigoli esterni della cinta dove c'e spazio -->
      <all in="EE/EW" out="**/*t" steps="1"/>
      <all steps="2">
        <rule in="tE" out="*t"/>
        <rule in="t*/*E" out="**/*t"/>
      </all>

      <!-- Ingresso dal centro H al fronte fino al bordo -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allarga porta, lastricato, corpo di guardia e strada a 3 celle -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Ripristina il pavimento interno dove era passato il tracciato -->
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Pozzo nel cortile dove c'e spazio 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi all'esterno dove c'e spazio 5x5 -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**g**/*****/*****" steps="3"/>
    </sequence>

    <map scale="5 5 1" values="BEhwdsncWGrQtgUfFMTkONoLJv" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Mura del mastio (w): 2 piani = 64 + 1 di parapetto = 65 -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="13"/>
        <prl in="w" out="W"/>

        <!-- Pavimento e scala del mastio (h, s): z=0 pavimento, z=1 striscia scala, z=32 solaio, z=64 tetto -->
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
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Porta del mastio (d) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="64"/>
        <prl in="d" out="W"/>

        <!-- Cinta muraria (W): alta 24 -->
        <all in="B W" out="W W" steps="23"/>
        <prl in="W" out="W"/>

        <!-- Corpo di guardia (G): alto 36 con porta O alla base -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G W" steps="35"/>
        <prl in="G" out="W"/>

        <!-- Torri d'angolo (t): alte 42 -->
        <all in="B t" out="t W" steps="41"/>
        <prl in="t" out="W"/>

        <!-- Pozzo (Q): alto 8 -->
        <all in="B Q" out="Q W" steps="7"/>
        <prl in="Q" out="W"/>

        <!-- Alberi (g): tronco L alto 12, poi chioma v -->
        <all in="B g" out="g L" steps="12"/>
        <prl in="g" out="v"/>
        <all in="vB" out="*v" steps="3"/>

        <!-- C. Scala piena: parti incluse -->
        <import file="part-battlements"/>
        <import file="part-door"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre nella fascia U del mastio -->
        <one steps="12">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J"/>
        </one>
        <all in="JUUUUB" out="*JJJJ*"/>
        <prl in="U" out="W"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>
  <color symbol="T" hidden="True"/>

  <color symbol="W" value="7A7268" name="pietra delle mura"/>
  <color symbol="M" value="6A6258" name="merlo"/>
  <color symbol="U" value="3A3632" name="feritoia"/>
  <color symbol="J" value="88A8B8" name="vetro"/>
  <color symbol="f" value="B89868" name="pavimento" area="keep"/>
  <color symbol="F" value="9E8258" name="solaio" area="keep"/>
  <color symbol="k" value="C4A474" name="gradino"/>
  <color symbol="O" value="5C3A21" name="porta"/>
  <color symbol="o" value="422814" name="asse della porta"/>
  <color symbol="N" value="524A42" name="stipite"/>
  <color symbol="c" value="A69A80" name="cortile" area="courtyard"/>
  <color symbol="n" value="8C8270" name="lastricato" area="courtyard"/>
  <color symbol="r" value="9E8B6E" name="strada" area="road"/>
  <color symbol="L" value="5C4028" name="tronco"/>
  <color symbol="v" value="4A7038" name="chioma" area="garden"/>

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
