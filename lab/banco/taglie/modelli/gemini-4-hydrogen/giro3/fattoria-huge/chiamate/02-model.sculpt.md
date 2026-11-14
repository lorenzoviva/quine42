# model.sculpt · gemini-4-hydrogen · 25 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
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
<!-- Fattoria:
  Parti:
  - h: interno della casa principale (due piani) attorno al centro H
  - s: zona della scala dentro h (lungo una parete, 4x2 celle, con spazio libero davanti)
  - w: muri della casa principale
  - d: porta d'ingresso al centro della facciata anteriore (3 celle)
  - r: sentiero dalla porta fino al bordo anteriore
  - a, v: stalla/fienile laterale (interno a, muri v) addossata a un fianco scelto a caso
  - p: portico davanti all'ingresso
  - c: aia (cortile) attorno alla casa e alla stalla
  - g: muretto/staccionata attorno all'aia (interrotta dal sentiero)
  - Q: pozzo nell'aia (dove entra un 5x5 di aia)
  - t: alberi da frutto nel terreno libero attorno all'aia (di più a Gargantuan)
  Variazione tra seed: profondità della casa, lato della stalla (destra/sinistra) e sua posizione lungo il fianco, posizione del pozzo e degli alberi.
  Taglie: a Huge casa, portico, stalla, aia, muretto e pozzo; a Gargantuan l'aia si espande, compaiono più alberi e un secondo corpo/orto.
-->
<sequence values="BHEhswdrapcgQt" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdrapcgQt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Casa principale attorno a H: 3 dietro, 5 davanti (+1 casuale), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala: lungo il muro posteriore, 4x2 celle con almeno 2 celle libere prima -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Stalla/fienile addossata a un muro laterale (destra o sinistra a caso) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Porta anteriore al centro e sentiero fino al bordo -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dw]/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="d[wh]" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="d" out="h"/>
      <all in="h/d" out="*/d" symmetry="()" steps="1"/>
      <all in="d/r" out="d/*" symmetry="()" steps="1"/>
      <all in="w/d/r" out="*/d/*" symmetry="()" steps="1"/>
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <!-- Pulizia: d solo sul muro anteriore -->
      <prl in="d" out="h"/>
      <all in="h/w/r" out="*/d/*" symmetry="()" steps="1"/>
      <all in="d[wr]" out="*d" symmetry="(x)" steps="1"/>

      <!-- Portico davanti alla porta (3 celle di profondità) -->
      <all in="d/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="2"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- Aia attorno a casa, stalla e portico -->
      <all in="[wvpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Espansione dell'aia dove c'è spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muretto/staccionata attorno all'aia, lasciando libero il sentiero r -->
      <all in="cE" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Pozzo nell'aia dove entra un 5x5 di c -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi nel terreno libero attorno all'aia -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="4"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="7A9A5B" name="erba"/>
  <color symbol="H" value="C8B58A" name="centro"/>
  <color symbol="h" value="C8B58A" name="pavimento casa"/>
  <color symbol="s" value="A67B5B" name="scala"/>
  <color symbol="w" value="D9CFC1" name="muro casa"/>
  <color symbol="d" value="6E472B" name="porta"/>
  <color symbol="r" value="B89F7D" name="sentiero"/>
  <color symbol="a" value="B59B78" name="pavimento stalla"/>
  <color symbol="v" value="8C6D46" name="muro stalla"/>
  <color symbol="p" value="A88C68" name="portico"/>
  <color symbol="c" value="C2B280" name="aia"/>
  <color symbol="g" value="7A5C3E" name="staccionata"/>
  <color symbol="Q" value="5B7A9A" name="pozzo"/>
  <color symbol="t" value="4F772D" name="albero"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento casa, s scala, w muro casa, r sentiero, a pavimento stalla, c aia, g staccionata, Q pozzo, t albero, v muro stalla
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEgggggggggggggggggggggggEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgccccccccccccccccccQccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccwwwwwwwwwwwcccccgEEE
EEEEgcccccwhhsssshhhwcccccgEEE
EEEEgcccccwhhsssshhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhHhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwvvvvcgEEE
EEEEgcccccwhhhhhhhhhwaaavcgEEE
EEEEgcccccwhhhhhhhhhwaaavcgEEE
EEEEgcccccwhhhhhhhhhwaaavcgEEE
EEEEgcccccwhhhhhhhhhwaaavcgEEE
EEEEgcccccwhhhhhhhhhwaaavcgEEE
EEEEgggggrrrrrrrrrrrrvvvvcgEEE
EEEEEEEEErrrrrrrrrrrrrccccgEEE
EEEEEEEEErrrrrrrrrrrrrccccgEEE
EEEEEEEEErrrrrrrrrrrrrccccgEEE
EEEEtEEEErrrrrrrrrrrrrccccgEEE
EEEEEEEEErrrrrrrrrrrrrccccgEEE
EEEEEEEEErrrrrrrrrrrrrgggggEEE
EEEEEEEEErrrrrrrrrrrrrEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento casa, s scala, w muro casa, r sentiero, a pavimento stalla, c aia, g staccionata, Q pozzo, t albero, v muro stalla
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEgggggggggggggggggggggggEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccccccQcccccccccccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccwwwwwwwwwwwvvvvcgEEE
EEEEgcccccwhhsssshhhwaaavcgEEE
EEEEgcccccwhhsssshhhwaaavcgEEE
EEEEgcccccwhhhhhhhhhwaaavcgEEE
EEEEgcccccwhhhhHhhhhwaaavcgEEE
EEEEgcccccwhhhhhhhhhwaaavcgEEE
EEEEgcccccwhhhhhhhhhwvvvvcgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgggggrrrrrrrrrrrrrccccgEEE
EEEEEEEEErrrrrrrrrrrrrccccgEEE
EEEEEEEEErrrrrrrrrrrrrccccgEEE
EEEEEEEEErrrrrrrrrrrrrccccgEEE
EEEEtEEEErrrrrrrrrrrrrgggggEEE
EEEEEEEEErrrrrrrrrrrrrEEEEEEEE
EEEEEEEEErrrrrrrrrrrrrEEEEEEEE
EEEEEEEEErrrrrrrrrrrrrEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento casa, s scala, w muro casa, r sentiero, a pavimento stalla, c aia, g staccionata, Q pozzo, t albero, v muro stalla
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEgggggggggggggggggggggggEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgccccccccccccccccQccccgEEE
EEEEgcccccccccccccccccccccgEEE
EEEEgcvvvvccccccccccccccccgEEE
EEEEgcvaaawwwwwwwwwwwcccccgEEE
EEEEgcvaaawhhsssshhhwcccccgEEE
EEEEgcvaaawhhsssshhhwcccccgEEE
EEEEgcvaaawhhhhhhhhhwcccccgEEE
EEEEgcvaaawhhhhHhhhhwcccccgEEE
EEEEgcvvvvwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgcccccwhhhhhhhhhwcccccgEEE
EEEEgccccrrrrrrrrrrrrrgggggEEE
EEEEgccccrrrrrrrrrrrrrEEEEEEEE
EEEEgccccrrrrrrrrrrrrrEEEEEEEE
EEEEgccccrrrrrrrrrrrrrEEEEEEEE
EEEEgggggrrrrrrrrrrrrrEEEtEEEE
EEEEEEEEErrrrrrrrrrrrrEEEEEEEE
EEEEEEEEErrrrrrrrrrrrrEEEEEEEE
EEEEEEEEErrrrrrrrrrrrrEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento casa, s scala, w muro casa, r sentiero, a pavimento stalla, c aia, g staccionata, Q pozzo, t albero, v muro stalla
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEtEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEgggggggggggggggggggggggggggEEEE
EEEEEEEEEgcccccccccccccccccccccccccgEEEE
EEEEEEEEEgcccccccccccccccccccccccccgEEEE
EEEEEEEEEgcccccccccccccccccccccccccgEEEE
EEEEEEEEEgcccccccccccccccccccccccccgEEEE
EEEEEEEEEgcccccccccccccccccccQcccccgEEEE
EEEEEEEEEgcccccwwwwwwwwwwwcccccccccgEEEE
EEEEEEEEEgcccccwhhsssshhhwcccccccccgEEEE
EEEEEEEEEgcccccwhhsssshhhwcccccccccgEEEE
EEEEEEEEEgcccccwhhhhhhhhhwcccccccccgEEEE
EEEEEEEEEgcccccwhhhhHhhhhwcccccccccgEEEE
EEEEEEEEEgcccccwhhhhhhhhhwvvvvcccccgEEEE
EEEEEEEEEgcccccwhhhhhhhhhwaaavcccccgEEEE
EEEEEEEEEgcccccwhhhhhhhhhwaaavcccccgEEEE
EEEEEEEEEgcccccwhhhhhhhhhwaaavcccccgEEEE
EEEEEtEEEgcccccwhhhhhhhhhwaaavcccccgEEEE
EEEEEEEEEgcccccwhhhhhhhhhwaaavcccccgEEEE
EEEEEEEEEgggggrrrrrrrrrrrrvvvvcccccgEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrccccccccgEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrccccccccgEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrccccccccgEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrccccccccgEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrccccccccgEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrgggggggggEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEtEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.22 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!-- Fattoria:
  Parti:
  - h: interno della casa principale (due piani) attorno al centro H
  - s: zona della scala dentro h (lungo una parete, 4x2 celle, con spazio libero davanti)
  - w: muri della casa principale
  - d: porta d'ingresso al centro della facciata anteriore (3 celle)
  - r: sentiero dalla porta fino al bordo anteriore (3 celle di larghezza)
  - a, v: stalla/fienile laterale (interno a, muri v) addossata a un fianco scelto a caso
  - p: portico davanti all'ingresso
  - c: aia (cortile) attorno alla casa e alla stalla
  - g: muretto/staccionata attorno all'aia (interrotta dal sentiero)
  - Q: pozzo nell'aia (dove entra un 5x5 di aia)
  - t: alberi da frutto nel terreno libero attorno all'aia (di più a Gargantuan)
-->
<sequence values="BHEfhswdrcgQtvapFVUOLRJPyCGqtklMN#90#91#92#94o" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WV"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="W"/>

  <map scale="1/5 1/5 1" values="BHEhswdrapcgQtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Casa principale attorno a H: 3 dietro, 5 davanti (+1 casuale), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala: lungo il muro posteriore, 4x2 celle con almeno 2 celle libere prima -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Stalla/fienile addossata a un muro laterale (destra o sinistra a caso) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Porta anteriore al centro e sentiero fino al bordo (3 celle di larghezza) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="d[wh]" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>

      <!-- Portico davanti alla porta (2 celle di profondità) -->
      <all in="d/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- Aia attorno a casa, stalla e portico -->
      <all in="[wvpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Espansione dell'aia dove c'è spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muretto/staccionata attorno all'aia, lasciando libero il sentiero r -->
      <all in="cE" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Pozzo nell'aia dove entra un 5x5 di c -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi nel terreno libero attorno all'aia -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BHEfhswdrcgQtvapFVUOLRJPyCGqtklMN#90#91#92#94o" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="t" out="EEEEE/EEtEE/EtltE/EEtEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Muri della casa (w) e zona porta (d): 2 piani da 32 = 64, poi tetto R -->
        <all steps="6"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>

        <!-- Interno casa (h) e scala (s): pavimento f, aria, solaio F a z=32, aria, tetto R a z=64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Stalla (v, a): 1 piano da 32, poi tetto J -->
        <all in="B v" out="v V" steps="32"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="J"/>

        <!-- Portico (p): pali P ai bordi alti 33, tetto J a 34 -->
        <all in="B p" out="y *" steps="1"/>
        <all in="B b" out="y B" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <all in="B p" out="p P" steps="32"/>
        <prl><rule in="y" out="J"/><rule in="p" out="J"/></prl>

        <!-- Staccionata (g): alta 10 -->
        <all in="B g" out="g G" steps="9"/>
        <prl in="g" out="G"/>

        <!-- Pozzo (Q, q): bordo alto 10, acqua alta 5 -->
        <all in="B Q" out="Q Q" steps="9"/>
        <all in="B q" out="q q" steps="4"/>
        <prl in="q" out="B"/>

        <!-- Alberi (t, l): tronco alto 14, chioma -->
        <all in="B t" out="t t" steps="14"/>
        <all in="B l" out="l t" steps="10"/>
        <prl><rule in="t" out="l"/><rule in="l" out="l"/></prl>
        <all in="B l" out="l l" steps="6"/>
        <all in="lB" out="*l" steps="2"/>

        <!-- C. Scala reale: porte, parti incluse, finestre, tetti, pulizia -->
        <!-- Seme della porta d'ingresso: dove il sentiero r incontra il muro W a z=0 -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Parti incluse -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Finestre nella fascia U -->
        <one steps="12">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- Tetti spioventi (casa R, stalla/portico J) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Camino sul tetto della casa -->
        <one in="B B R" out="* V *" steps="1" symmetry="()"/>
        <all in="B V" out="V *" steps="8"/>
      </sequence>
    </map>
  </map>

  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="7A9A5B" name="erba" area="garden"/>
  <color symbol="f" value="C8B58A" name="pavimento" area="house"/>
  <color symbol="F" value="B59B78" name="solaio" area="house"/>
  <color symbol="W" value="D9CFC1" name="muro casa"/>
  <color symbol="V" value="8C6D46" name="legno stalla"/>
  <color symbol="R" value="B34D37" name="tetto casa"/>
  <color symbol="J" value="9E5A3C" name="tetto stalla"/>
  <color symbol="P" value="7A5C3E" name="palo portico"/>
  <color symbol="C" value="C2B280" name="aia" area="courtyard"/>
  <color symbol="G" value="6E472B" name="staccionata"/>
  <color symbol="r" value="B89F7D" name="sentiero" area="courtyard"/>
  <color symbol="Q" value="8A8D8F" name="pietra pozzo"/>
  <color symbol="q" value="4F86A8" name="acqua pozzo"/>
  <color symbol="t" value="5C4033" name="tronco"/>
  <color symbol="l" value="4F772D" name="chioma"/>
  <color symbol="L" value="8ECAE6" name="vetro finestra"/>
  <color symbol="O" value="6E472B" name="porta"/>
  <color symbol="o" value="4A2E1B" name="assi porta"/>
  <color symbol="N" value="8A8D8F" name="stipite"/>
  <color symbol="k" value="A67B5B" name="gradini"/>
  <color symbol="M" value="D9CFC1" name="merli"/>
  <color symbol="U" value="2B2D42" name="feritoia"/>
  <color symbol="T" value="A67B5B" hidden="True"/>
  <color symbol="H" value="C8B58A" hidden="True"/>
  <color symbol="h" value="C8B58A" hidden="True"/>
  <color symbol="s" value="A67B5B" hidden="True"/>
  <color symbol="w" value="D9CFC1" hidden="True"/>
  <color symbol="d" value="6E472B" hidden="True"/>
  <color symbol="a" value="B59B78" hidden="True"/>
  <color symbol="v" value="8C6D46" hidden="True"/>
  <color symbol="p" value="A88C68" hidden="True"/>
  <color symbol="c" value="C2B280" hidden="True"/>
  <color symbol="g" value="7A5C3E" hidden="True"/>
  <color symbol="m" value="C8B58A" hidden="True"/>
  <color symbol="y" value="A88C68" hidden="True"/>
  <color symbol="b" value="000000" hidden="True"/>
  <color symbol="#90" value="000000" hidden="True"/>
  <color symbol="#91" value="000000" hidden="True"/>
  <color symbol="#92" value="000000" hidden="True"/>
  <color symbol="#94" value="000000" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
