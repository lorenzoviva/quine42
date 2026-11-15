# model.sculpt · claude-opus-5-5 · 119 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
Il forte (forte):
 - il mastio: un corpo attorno al centro H, pavimento h, muri w; la lunghezza varia di 1 cella col seme
 - il cortile c: un anello attorno al mastio, 3 celle; si allarga di 4 o 3 dove il terreno prosegue (a Gargantuan)
 - la cinta W: due celle di spessore attorno al cortile, con una torre t su ogni angolo esterno
 - la via: dal centro dritta verso il fronte (y grande): porta d nel mastio, selciato n nel cortile, porta della cinta G
   (più alta del muro), strada r fino al bordo; tre celle di larghezza
 - il pozzo Q: in un quadrato libero 5x5 del cortile, lontano dalla porta (il seme sceglie l'angolo)
 - il fossato a: un anello fuori dalla cinta, solo dove il terreno prosegue oltre (Gargantuan)
Huge: mastio, cortile col pozzo, cinta con quattro torri, porta e strada.
Gargantuan: cortile più largo, il fossato attorno a tutto.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtmdnGrQa" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- il cortile -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="2"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*cccc*****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*ccc*******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la cinta, due celle -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri sugli angoli -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- la via -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <!-- il pozzo, lontano dalla porta -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"><field for="Q" from="n" on="cn"/></one>
      <!-- il fossato, dove il terreno prosegue -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="tE" out="*a" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="H" value="9a7b4f" name="centro del mastio" area="keep"/>
  <color symbol="h" value="b08d5a" name="sala del mastio" area="keep"/>
  <color symbol="w" value="8a8580" name="muro del mastio" area="keep"/>
  <color symbol="c" value="c9b98a" name="cortile" area="courtyard"/>
  <color symbol="W" value="9c968c" name="cinta" area="wall"/>
  <color symbol="t" value="77726b" name="torre" area="tower"/>
  <color symbol="m" value="ff00ff" name="segno della via"/>
  <color symbol="d" value="6b4a2b" name="porta del mastio" area="keep"/>
  <color symbol="n" value="a39e93" name="selciato" area="courtyard"/>
  <color symbol="G" value="5e5750" name="porta della cinta" area="gatehouse"/>
  <color symbol="r" value="b89e6e" name="strada" area="road"/>
  <color symbol="Q" value="4f7fa6" name="pozzo" area="well"/>
  <color symbol="a" value="5d8fb3" name="fossato" area="moat"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E marker, h sala del mastio, w muro del mastio, c cortile, W cinta, t torre, d porta del mastio, n selciato, G porta della cinta, r strada, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEaaaaaaaaaaaaaaaaaaaaaaaaaaaE
EEatttttaaaaaaaaaaaaaaatttttaE
EEatttttaaaaaaaaaaaaaaatttttaE
EEatttttWWWWWWWWWWWWWWWtttttaE
EEatttttWWWWWWWWWWWWWWWtttttaE
EEattttcccccccccccccccccttttaE
EEaaaWWcccccccccccccccccWWaaaE
EEaaaWWcccccccccccccccccWWEEEE
EEaaaWWcccwwwwwwwwwwwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhHhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwwwwdddwwwwcccWWEEEE
EEaaaWWcccccccnnncccccccWWEEEE
EEaaaWWcccccccnnncccccccWWaaaE
EEattttcccccccnnncccccccttttaE
EEatttttWWWWWWGGGWWWWWWtttttaE
EEatttttWWWWWWGGGWWWWWWtttttaE
EEatttttaEEEEErrrEEEEEatttttaE
EEatttttaEEEEErrrEEEEEatttttaE
EEaaaaaaaEEEEErrrEEEEEaaaaaaaE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E marker, h sala del mastio, w muro del mastio, c cortile, W cinta, t torre, d porta del mastio, n selciato, G porta della cinta, r strada, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEaaaaaaaaaaaaaaaaaaaaaaaaaaaE
EEatttttaaaaaaaaaaaaaaatttttaE
EEatttttaaaaaaaaaaaaaaatttttaE
EEatttttWWWWWWWWWWWWWWWtttttaE
EEatttttWWWWWWWWWWWWWWWtttttaE
EEattttcccccccccccccccccttttaE
EEaaaWWcccccccccccccccccWWaaaE
EEaaaWWcccccccccccccccccWWEEEE
EEaaaWWcccwwwwwwwwwwwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhHhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwwwwdddwwwwcccWWEEEE
EEaaaWWcccccccnnncccccccWWEEEE
EEaaaWWcccccccnnncccccccWWaaaE
EEattttcccccccnnncccccccttttaE
EEatttttWWWWWWGGGWWWWWWtttttaE
EEatttttWWWWWWGGGWWWWWWtttttaE
EEatttttaEEEEErrrEEEEEatttttaE
EEatttttaEEEEErrrEEEEEatttttaE
EEaaaaaaaEEEEErrrEEEEEaaaaaaaE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E marker, h sala del mastio, w muro del mastio, c cortile, W cinta, t torre, d porta del mastio, n selciato, G porta della cinta, r strada, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEaaaaaaaaaaaaaaaaaaaaaaaaaaaE
EEatttttaaaaaaaaaaaaaaatttttaE
EEatttttaaaaaaaaaaaaaaatttttaE
EEatttttWWWWWWWWWWWWWWWtttttaE
EEatttttWWWWWWWWWWWWWWWtttttaE
EEattttcccccccccccccccccttttaE
EEaaaWWcccccccccccccccccWWaaaE
EEaaaWWcccccccccccccccccWWEEEE
EEaaaWWcccwwwwwwwwwwwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhHhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwhhhhhhhhhwcccWWEEEE
EEaaaWWcccwwwwdddwwwwcccWWEEEE
EEaaaWWcccccccnnncccccccWWEEEE
EEaaaWWcccccccnnncccccccWWaaaE
EEattttcccccccnnncccccccttttaE
EEatttttWWWWWWGGGWWWWWWtttttaE
EEatttttWWWWWWGGGWWWWWWtttttaE
EEatttttaEEEEErrrEEEEEatttttaE
EEatttttaEEEEErrrEEEEEatttttaE
EEaaaaaaaEEEEErrrEEEEEaaaaaaaE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E marker, h sala del mastio, w muro del mastio, c cortile, W cinta, t torre, d porta del mastio, n selciato, G porta della cinta, r strada, Q pozzo, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEE
EEEatttttaaaaaaaaaaaaaaaaaaaaaaatttttaEE
EEEatttttaaaaaaaaaaaaaaaaaaaaaaatttttaEE
EEEatttttWWWWWWWWWWWWWWWWWWWWWWWtttttaEE
EEEatttttWWWWWWWWWWWWWWWWWWWWWWWtttttaEE
EEEattttcccccccccccccccccccccccccttttaEE
EEEaaaWWcccccccccccccccccccccccccWWaaaEE
EEEaaaWWccccccccccccQccccccccccccWWaaaEE
EEEaaaWWcccccccccccccccccccccccccWWaaaEE
EEEaaaWWcccccccccccccccccccccccccWWaaaEE
EEEaaaWWcccccccccccccccccccccccccWWaaaEE
EEEaaaWWcccccccccccccccccccccccccWWaaaEE
EEEaaaWWcccccccwwwwwwwwwwwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhhhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhhhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhhhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhHhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhhhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhhhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhhhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhhhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwhhhhhhhhhwcccccccWWaaaEE
EEEaaaWWcccccccwwwwdddwwwwcccccccWWaaaEE
EEEaaaWWcccccccccccnnncccccccccccWWaaaEE
EEEaaaWWcccccccccccnnncccccccccccWWaaaEE
EEEaaaWWcccccccccccnnncccccccccccWWaaaEE
EEEaaaWWcccccccccccnnncccccccccccWWaaaEE
EEEaaaWWcccccccccccnnncccccccccccWWaaaEE
EEEaaaWWcccccccccccnnncccccccccccWWaaaEE
EEEattttcccccccccccnnncccccccccccttttaEE
EEEatttttWWWWWWWWWWGGGWWWWWWWWWWtttttaEE
EEEatttttWWWWWWWWWWGGGWWWWWWWWWWtttttaEE
EEEatttttaEEEEEEEEErrrEEEEEEEEEatttttaEE
EEEatttttaEEEEEEEEErrrEEEEEEEEEatttttaEE
EEEaaaaaaaEEEEEEEEErrrEEEEEEEEEaaaaaaaEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Il forte (forte):
 - il mastio: corpo attorno al centro H, sala h, muri w, due piani e terrazza merlata; la scala s lungo il muro di fondo
 - l'annesso v: un corpo basso contro un lato del mastio, nel cortile; il seme sceglie il lato e il punto
 - il cortile c attorno al mastio; si allarga dove il terreno prosegue (Gargantuan)
 - la cinta W, due celle, merlata, con le feritoie; una torre t su ogni angolo esterno
 - la via: porta d del mastio, selciato n, porta della cinta G (più alta del muro), strada r fino al bordo
 - il pozzo Q nel cortile largo, lontano dalla porta; il fossato a fuori dalla cinta
Huge: mastio, annesso, cinta con torri, fossato. Gargantuan: cortile largo con il pozzo.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtmdnGrQavs" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="2"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*cccc*****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*ccc*******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <one in="ccw/ccw/ccw/ccw/ccw" out="vv*/vv*/vv*/vv*/vv*" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"><field for="Q" from="n" on="cn"/></one>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="tE" out="*a" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhswcWtnGrQqaAvPYfFRTkONoMULV#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="a" out="AAAAA/AAAAA/AAAAA/AAAAA/AAAAA"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w Y" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w Y" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="1"/>
        <prl in="w" out="P"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <all in="B W" out="W *" steps="23"/>
        <all in="B t" out="t *" steps="47"/>
        <all in="B G" out="G *" steps="43"/>
        <all in="B v" out="v *" steps="39"/>
        <all in="B Q" out="Q *" steps="5"/>
        <prl in="v" out="V"/>
        <one steps="14"><rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="P"/>
        <all in="G/r" out="O/*" symmetry="()" steps="1"/>
        <all in="G/O" out="O/*" symmetry="()" steps="9"/>
        <all in="P/n" out="O/*" symmetry="()" steps="1"/>
        <all in="P/O" out="O/*" symmetry="()" steps="4"/>
        <union symbol="+" values="PYWtGV"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="Wt"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="H" value="9a7b4f" name="centro del mastio" area="keep"/>
  <color symbol="h" value="b08d5a" name="sala del mastio" area="keep"/>
  <color symbol="s" value="b08d5a" name="scala del mastio" area="keep"/>
  <color symbol="w" value="d8cdb4" name="muro del mastio" area="keep"/>
  <color symbol="d" value="6b4a2b" name="porta del mastio" area="keep"/>
  <color symbol="m" value="b08d5a" name="sala del mastio" area="keep"/>
  <color symbol="c" value="c9b98a" hidden="True" name="cortile" area="courtyard"/>
  <color symbol="W" value="9c968c" name="pietra della cinta" area="wall"/>
  <color symbol="t" value="77726b" name="pietra della torre" area="tower"/>
  <color symbol="G" value="5e5750" name="porta della cinta" area="gatehouse"/>
  <color symbol="n" value="a39e93" name="selciato" area="courtyard"/>
  <color symbol="r" value="b89e6e" name="strada" area="road"/>
  <color symbol="Q" value="8c8a84" name="pozzo" area="well"/>
  <color symbol="q" value="3f6f96" name="acqua del pozzo" area="well"/>
  <color symbol="a" value="5d8fb3" name="fossato" area="moat"/>
  <color symbol="A" value="5d8fb3" name="acqua del fossato" area="moat"/>
  <color symbol="v" value="a8744f" name="annesso" area="barn"/>
  <color symbol="V" value="a8744f" name="muro dell'annesso" area="barn"/>
  <color symbol="P" value="d8cdb4" name="intonaco del mastio" area="keep"/>
  <color symbol="Y" value="d8cdb4" name="intonaco del mastio" area="keep"/>
  <color symbol="L" value="2e3a4a" name="finestra" area="keep"/>
  <color symbol="f" value="9a6b3e" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7a6a58" name="solaio" area="keep"/>
  <color symbol="R" value="b5472f" name="terrazza in mattoni" area="keep"/>
  <color symbol="T" value="9a6b3e" name="scala" area="keep"/>
  <color symbol="k" value="6e5038" name="gradini" area="keep"/>
  <color symbol="O" value="7a4a24" name="porta" area="keep"/>
  <color symbol="o" value="4a2c16" name="assi della porta" area="keep"/>
  <color symbol="N" value="3d3530" name="stipiti" area="keep"/>
  <color symbol="M" value="b3ada3" name="merli" area="wall"/>
  <color symbol="U" value="1f1c1a" name="feritoia" area="wall"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
