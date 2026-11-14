# model.sculpt · gemini-4-argon · 48 s

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
<!--
  Concept: Fattoria (Farmstead)
  Parts and letters:
  - Main farmhouse (h = interior floor, s = stair zone, w = farmhouse walls, d = front door): two-storey dwelling with pitched roof around the centre.
  - Front porch / lean-to (p = porch around the front door): covered wooden veranda along the front facade.
  - Attached barn / stable wing (a = barn interior, v = barn walls): one-storey timber/brick annex on one side of the farmhouse, connected internally.
  - Stone silo / dovecote tower (t = tower): attached to a rear corner of the farmhouse, crowned with battlements and slits.
  - Farmyard (c = courtyard, q = well, y = haystack): paved/dirt yard around the buildings, enclosed by a low fence (z).
  - Road (r): front path from the farmhouse door straight to the front edge.
  - Cultivated field (g = plowed field) and orchard trees (u = fruit tree): grown outside the farmyard fence where space allows.
  What seeds change: depth of the farmhouse, which side the barn wing attaches to, which rear corner holds the dovecote tower, positions of the well, haystack, and orchard trees.
  What fits at each size:
  - Large (20x20): Farmhouse, porch, side barn wing, rear dovecote tower, small yard.
  - Huge (30x30): Full farmyard enclosed by fence, well and haystack in the yard.
  - Gargantuan (40x40): Extended farmyard, cultivated fields (g) with furrows beyond the fence, and orchard trees (u).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavtpcqyzgru" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around H: 9 wide, 7 or 8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone along the back wall of the farmhouse: 2 cells landing, 4 cells stair, 2 cells wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Attached barn wing on one side (left or right): 6 wide, 6 deep -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stone dovecote / silo tower on one rear outer corner of the farmhouse -->
      <one in="EE/Ew/wh" out="t*/*t/**" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>

      <!-- Front road from the middle of the front wall straight to the edge (3 cells wide) -->
      <one in="hhhhh/wwwww/EEEEE" out="*****/*ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Front porch / lean-to along the front wall around the door (2 cells deep) -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pr" out="*p" symmetry="(x)" steps="1"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard if room allows (Huge and Gargantuan) -->
      <all in="cEEEE" out="*ccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Fence around the farmyard where ground continues -->
      <all in="cE" out="*z"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Keep road clear through yard and fence -->
      <all in="[rd]/c" out="*/r" symmetry="()"/>
      <all in="r/z" out="*/r" symmetry="()"/>
      <all in="r[cz]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Well and haystack inside the farmyard where space fits -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="1"/>

      <!-- Cultivated fields outside the fence at Gargantuan size -->
      <all in="zEEEEE" out="*gggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Orchard trees in remaining open ground at Gargantuan size -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/**u**/*uuu*/**u**/*****" steps="3"/>
    </sequence>
  </map>
  <color symbol="E" value="#7a9a55" name="erba" hidden="True"/>
  <color symbol="H" value="#ffffff" name="centro" hidden="True"/>
  <color symbol="h" value="#d9c29c" name=" pavimento casa" area="house"/>
  <color symbol="s" value="#c4a478" name="zona scala" area="house"/>
  <color symbol="w" value="#e8dcc5" name="muro casa" area="house"/>
  <color symbol="d" value="#8c5838" name="porta" area="house"/>
  <color symbol="a" value="#c8b08a" name="fienile" area="barn"/>
  <color symbol="v" value="#b55942" name="muro fienile" area="barn"/>
  <color symbol="t" value="#8f8b84" name="torre colombaia" area="tower"/>
  <color symbol="p" value="#b88b58" name="portico" area="porch"/>
  <color symbol="c" value="#c7b595" name="aia" area="yard"/>
  <color symbol="q" value="#5a7d9a" name="pozzo" area="yard"/>
  <color symbol="y" value="#e0b84c" name="pagliaio" area="yard"/>
  <color symbol="z" value="#78583a" name="staccionata" area="yard"/>
  <color symbol="g" value="#6e553b" name="campo arato" area="field"/>
  <color symbol="r" value="#b09e82" name="sentiero" area="yard"/>
  <color symbol="u" value="#4f7838" name="albero da frutto" area="orchard"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h  pavimento casa, s zona scala, w muro casa, d porta, a fienile, v muro fienile, p portico, c aia, q pozzo, y pagliaio, z staccionata, r sentiero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEzzzzzzzzzzzzzzzzzzzzzzzzzzzz
EEzccccccccccccccccccccccccccz
EEzccccccccccccccccccccccccccz
EEzccccccccccccccccccccccccccz
EEzccccccccccccccccccccqqccccz
EEzccccccccccccccccccccqqccccz
EEzccccccccccccccccccccccccccz
EEzcyycccccccccccccccccccccccz
EEzcyyccccwwwwwwwwwwwccccccccz
EEzcccccccwhhsssshhhwccccccccz
EEzcccccccwhhsssshhhwvvvvvvvcz
EEzcccccccwhhhhhhhhhwaaaaaavcz
EEzcccccccwhhhhhhhhhwaaaaaavcz
EEzcccccccwhhhhhhhhhwaaaaaavcz
EEzcccccccwhhhhhhhhhwaaaaaavcz
EEzcccccccwhhhhhhhhhwaaaaaavcz
EEzcccccccwwwwwdddwwwaaaaaavcz
EEzcccccccpppppprppppvvvvvvvcz
EEzcccccccpppppprppppccccccccz
EEzcccccccccccrrrrrccccccccccz
EEzcccccccccccrrrrrccccccccccz
EEzcccccccccccrrrrrccccccccccz
EEzcccccccccccrrrrrccccccccccz
EEzzzzzzzzzzzzrrrrrzzzzzzzzzzz
EEEEEEEEEEEEEEErrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h  pavimento casa, s zona scala, w muro casa, d porta, a fienile, v muro fienile, p portico, c aia, q pozzo, y pagliaio, z staccionata, r sentiero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EzzzzzzzzzzzzzzzzzzzzzzzzzEEEE
EzccccccccccccccccccccccczEEEE
EzccccccccccccccccccccccczEEEE
EzccccccyyccccccccccccccczEEEE
EzccccccyyccccccccccccccczEEEE
EzccccccccccccccccccccccczEEEE
EzccccccccccccccccccccccczEEEE
EzccccccccccccccccccccccczEEEE
EzccccccccwwwwwwwwwwwcccczEEEE
EzccccccccwhhsssshhhwcccczEEEE
EzcvvvvvvvwhhsssshhhwcccczEEEE
EzcvaaaaaawhhhhhhhhhwcccczEEEE
EzcvaaaaaawhhhhhhhhhwcccczEEEE
EzcvaaaaaawhhhhhhhhhwcccczEEEE
EzcvaaaaaawhhhhhhhhhwcccczEEEE
EzcvaaaaaawhhhhhhhhhwcccczEEEE
EzcvaaaaaawwdddwwwwwwcccczEEEE
EzcvvvvvvvppprpppppppcccczEEEE
EzccccccccppprpppppppcccczEEEE
EzcccccccccrrrrrccccccccczEEEE
EzcccccccccrrrrrcccqqcccczEEEE
EzcccccccccrrrrrcccqqcccczEEEE
EzcccccccccrrrrrccccccccczEEEE
EzzzzzzzzzzrrrrrzzzzzzzzzzEEEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h  pavimento casa, s zona scala, w muro casa, d porta, a fienile, v muro fienile, p portico, c aia, q pozzo, y pagliaio, z staccionata, r sentiero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEzzzzzzzzzzzzzzzzzzzzzzzzzzzz
EEzccccccccccccccccccccccccccz
EEzccccccccccccccccccccccccccz
EEzccccccccccccccccccccccccccz
EEzccccccccccccccccccccccccccz
EEzccccccccccyyccccccccccccccz
EEzccccccccccyyccccccccccccccz
EEzccccccccccccccccccccccccccz
EEzccccccccccccccccccvvvvvvvcz
EEzcccccccwwwwwwwwwwwaaaaaavcz
EEzcccccccwhhsssshhhwaaaaaavcz
EEzcccccccwhhsssshhhwaaaaaavcz
EEzcccccccwhhhhhhhhhwaaaaaavcz
EEzcccccccwhhhhhhhhhwaaaaaavcz
EEzcccccccwhhhhhhhhhwaaaaaavcz
EEzcccccccwhhhhhhhhhwvvvvvvvcz
EEzcccccccwhhhhhhhhhwccccccccz
EEzcccccccwwdddwwwwwwccccccccz
EEzcccccccppprpppppppccccccccz
EEzcccccccppprpppppppccqqccccz
EEzccccccccrrrrrcccccccqqccccz
EEzccccccccrrrrrcccccccccccccz
EEzccccccccrrrrrcccccccccccccz
EEzccccccccrrrrrcccccccccccccz
EEzzzzzzzzzrrrrrzzzzzzzzzzzzzz
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h  pavimento casa, s zona scala, w muro casa, d porta, a fienile, v muro fienile, p portico, c aia, q pozzo, y pagliaio, z staccionata, g campo arato, r sentiero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEgggggggggggggggggggggggggggggggggggEE
EEEgggggggggggggggggggggggggggggggggggEE
EEEgggggggggggggggggggggggggggggggggggEE
EEEgggggggggggggggggggggggggggggggggggEE
EEEggggzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzEE
EEEggggzccccccccccccccccccccccccccccczEE
EEEggggzcccccccccccccccccccccccccqqcczEE
EEEggggzcccccccccccccccccccccccccqqcczEE
EEEggggzccccccccccccccccccccccccccccczEE
EEEggggzccccccccccccccccccccccccccccczEE
EEEggggzccccccccccccccccccccccccccccczEE
EEEggggzccccccccccccccccccccccccccccczEE
EEEggggzcccccccwwwwwwwwwwwccccccccccczEE
EEEggggzcccccccwhhsssshhhwccccccccccczEE
EEEggggzcccccccwhhsssshhhwvvvvvvvcccczEE
EEEggggzcccccccwhhhhhhhhhwaaaaaavcccczEE
EEEggggzcccccccwhhhhhhhhhwaaaaaavcccczEE
EEEggggzcyyccccwhhhhhhhhhwaaaaaavcccczEE
EEEggggzcyyccccwhhhhhhhhhwaaaaaavcccczEE
EEEggggzcccccccwhhhhhhhhhwaaaaaavcccczEE
EEEggggzcccccccwwwwwdddwwwaaaaaavcccczEE
EEEggggzcccccccpppppprppppvvvvvvvcccczEE
EEEggggzcccccccpppppprppppccccccccccczEE
EEEggggzcccccccccccrrrrrccccccccccccczEE
EEEggggzcccccccccccrrrrrccccccccccccczEE
EEEggggzcccccccccccrrrrrccccccccccccczEE
EEEggggzcccccccccccrrrrrccccccccccccczEE
EEEggggzcccccccccccrrrrrccccccccccccczEE
EEEggggzcccccccccccrrrrrccccccccccccczEE
EEEggggzcccccccccccrrrrrccccccccccccczEE
EEEggggzzzzzzzzzzzzrrrrrzzzzzzzzzzzzzzEE
EEEggggggggggggggggErrrEggggggggggggggEE
EEEggggggggggggggggErrrEggggggggggggggEE
EEEggggggggggggggggErrrEggggggggggggggEE
EEEggggggggggggggggErrrEggggggggggggggEE
EEEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.43 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Concept: Fattoria (Farmstead)
  Parts and letters:
  - Main farmhouse (h = interior floor, s = stair zone, w = farmhouse walls, d = front door): two-storey dwelling with pitched roof around the centre.
  - Front porch / lean-to (p = porch around the front door): covered wooden veranda along the front facade.
  - Attached barn / stable wing (a = barn interior, v = barn walls): one-storey timber/brick annex on one side of the farmhouse, connected internally.
  - Stone silo / dovecote tower (t = tower): attached to a rear corner of the farmhouse, crowned with battlements and slits.
  - Farmyard (c = courtyard, q = well, y = haystack): paved/dirt yard around the buildings, enclosed by a low fence (z).
  - Road (r): front path from the farmhouse door straight to the front edge.
  - Cultivated field (g = plowed field) and orchard trees (u = fruit tree): grown outside the farmyard fence where space allows.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavtpcqyzgru" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around H: 9 wide, 7 or 8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone along the back wall of the farmhouse: 2 cells landing, 4 cells stair, 2 cells wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Attached barn wing on one side (left or right): 6 wide, 6 deep -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stone dovecote / silo tower on one rear outer corner of the farmhouse -->
      <one in="EE/Ew" out="t*/*t" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>

      <!-- Front road from the middle of the front wall straight to the edge (3 cells wide) -->
      <one in="hhhhh/wwwww/EEEEE" out="*****/*ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Front porch / lean-to along the front wall around the door (2 cells deep) -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pr" out="*p" symmetry="(x)" steps="1"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard if room allows (Huge and Gargantuan) -->
      <all in="cEEEE" out="*ccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Fence around the farmyard where ground continues -->
      <all in="cE" out="*z"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Keep road clear through yard and fence -->
      <all in="[rd]/c" out="*/r" symmetry="()"/>
      <all in="r/z" out="*/r" symmetry="()"/>
      <all in="r[cz]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Well and haystack inside the farmyard where space fits -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="1"/>

      <!-- Cultivated fields outside the fence at Gargantuan size -->
      <all in="zEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="r/g" out="*/r" symmetry="()"/>
      <all in="rg" out="*r" symmetry="(x)" steps="1"/>

      <!-- Orchard trees in remaining open ground at Gargantuan size -->
      <one in="EEE/EEE/EEE" out="***/*u*/***" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavtpcqyzgrufFWVAPRTJKLQXZYGIOoNMTkU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="q" out="qqqqq/qQQQq/qQLQq/qQQQq/qqqqq"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="g" out="ggggg/ZZZZZ/ggggg/ZZZZZ/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="u" out="uuuuu/uuuuu/uuGuu/uuuuu/uuuuu"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WVQ"/>
        <union symbol="=" values="hsaFcpr"/>
        <union symbol="%" values="Q"/>

        <!-- B. Heights -->
        <!-- Farmhouse walls (w) and door wall (d): 2 storeys = 64 high + roof R -->
        <all steps="1">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d h"/>
        </all>
        <all steps="5">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w I"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="6">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w I"/>
          <rule in="B d" out="d I"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <prl>
          <rule in="w" out="R"/>
          <rule in="d" out="R"/>
        </prl>

        <!-- Farmhouse interior (h) and stair zone (s) -->
        <all steps="1">
          <rule in="B h" out="h h"/>
          <rule in="B s" out="s h"/>
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

        <!-- Barn walls (v) and interior (a): 1 storey = 34 high + roof J -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v I" steps="12"/>
        <all in="B v" out="v V" steps="14"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a a" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>

        <!-- Stone dovecote tower (t): 76 high with battlements -->
        <all in="B t" out="t Q" steps="76"/>
        <prl in="t" out="B"/>

        <!-- Front porch (p floor, b posts): posts 33 high, roof J at 34 -->
        <all in="B p" out="p p" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <all in="B b" out="b P" steps="34"/>
        <prl in="b" out="J"/>

        <!-- Well (Q stone rim 10 high, L water 4 high) -->
        <all in="B Q" out="Q Q" steps="10"/>
        <prl in="Q B" out="Q Q"/>
        <all in="B L" out="L L" steps="4"/>

        <!-- Haystack (y): 12 high -->
        <all in="B y" out="y Y" steps="8"/>
        <prl in="y" out="B"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>

        <!-- Fence (z): 7 high -->
        <all in="B z" out="z P" steps="6"/>
        <prl in="z" out="B"/>

        <!-- Orchard trees (G trunk 12 high, X canopy) -->
        <all in="B G" out="G P" steps="12"/>
        <prl in="G" out="X"/>
        <all in="XB" out="*X" steps="4"/>
        <all in="B X" out="X X" steps="6"/>

        <!-- C. Full scale details, doors, parts, windows, roofs -->
        <!-- Front door seed (O) on z=1 where road (r) meets the door wall above h -->
        <all in="W/B B/r" out="O/* */*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Internal door seed (O) between farmhouse (h) and barn (a) on z=1 -->
        <one in="BBBBB/WWWWW/BBBBB hhhhh/WWWWW/aaaaa" out="*****/OOOOO/***** *****/*****/*****" symmetry="(xy)" steps="1"/>
        <all in="OWW/OWW/OWW" out="OOO/OOO/OOO" symmetry="(xy)" steps="2"/>
        <all in="W/O" out="O/*" symmetry="(xy)" steps="4"/>

        <!-- Barn exterior door into the farmyard (c) on z=1 -->
        <one in="BBBBB/VVVVV/BBBBB aaaaa/VVVVV/ccccc" out="*****/OOOOO/***** *****/*****/*****" symmetry="(xy)" steps="1"/>
        <all in="OVV/OVV/OVV" out="OOO/OOO/OOO" symmetry="(xy)" steps="2"/>
        <all in="V/O" out="O/*" symmetry="(xy)" steps="4"/>

        <!-- Include seed parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in farmhouse and barn bands (I) -->
        <one steps="18">
          <rule in="BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I W" out="W W"/>
        <prl in="W I" out="W W"/>
        <prl in="I V" out="V V"/>
        <prl in="V I" out="V V"/>
        <prl in="I" out="W"/>

        <!-- Farmhouse pitched roof (R) + chimney (K) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>
        <one in="RR/RR BB/BB" out="**/** KK/KK" steps="1" symmetry="()"/>
        <all in="B K" out="K K" steps="10"/>

        <!-- Barn and porch roofs (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette -->
  <color symbol="E" value="#7a9a55" name="erba" hidden="True"/>
  <color symbol="h" value="#c89d66" name="pavimento in legno" area="house"/>
  <color symbol="s" value="#c89d66" name="pavimento in legno" area="house"/>
  <color symbol="w" value="#e8dcc5" name="intonaco chiaro" area="house"/>
  <color symbol="d" value="#c89d66" name="soglia" area="house"/>
  <color symbol="a" value="#b59b72" name="terra battuta fienile" area="barn"/>
  <color symbol="v" value="#b55942" name="mattone fienile" area="barn"/>
  <color symbol="t" value="#8f8b84" name="pietra colombaia" area="tower"/>
  <color symbol="p" value="#b88b58" name="tavolato portico" area="porch"/>
  <color symbol="c" value="#c7b595" name="aia in ghiaia" area="yard"/>
  <color symbol="q" value="#8f8b84" name="base pozzo" area="yard"/>
  <color symbol="y" value="#e0b84c" name="paglia" area="yard"/>
  <color symbol="z" value="#78583a" name="staccionata" area="yard"/>
  <color symbol="g" value="#6e553b" name="terra arata" area="field"/>
  <color symbol="Z" value="#57412b" name="solco arato" area="field"/>
  <color symbol="r" value="#b09e82" name="sentiero" area="yard"/>
  <color symbol="u" value="#6e8c49" name="prato frutteto" area="orchard"/>

  <color symbol="W" value="#e8dcc5" name="muro intonacato"/>
  <color symbol="V" value="#b55942" name="muro di mattoni"/>
  <color symbol="Q" value="#8f8b84" name="muro in pietra"/>
  <color symbol="F" value="#b88b58" name="solaio di legno"/>
  <color symbol="P" value="#78583a" name="trave di quercia"/>
  <color symbol="R" value="#a84a32" name="coppi di terracotta"/>
  <color symbol="J" value="#8f3d28" name="tettoia in coppi"/>
  <color symbol="K" value="#736e68" name="comignolo in pietra"/>
  <color symbol="L" value="#5a829e" name="vetro finestra"/>
  <color symbol="Y" value="#e0b84c" name="covone di fieno"/>
  <color symbol="X" value="#4f7838" name="chioma di melo"/>

  <color symbol="O" value="#8c5838" name="porta di legno"/>
  <color symbol="o" value="#593620" name="assi della porta"/>
  <color symbol="N" value="#736e68" name="stipite in pietra"/>
  <color symbol="M" value="#8f8b84" name="merlo in pietra"/>
  <color symbol="k" value="#a37949" name="gradino di legno"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>

  <color symbol="#20" value="#000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#000000" name="assi aperte" hidden="True"/>

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
