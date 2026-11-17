# model.sculpt · claude-opus-5-5 · 68 s · 1 immagini

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

Your program:
<!--
villetta: a country house; two volumes of different height under pitched roofs, with a porch on the door.
h  the main hall (two storeys); w its walls; s the stair zone along the back wall, landing at small x.
a  the wing (one storey, lower); v its walls; it stands against a side wall, side and place chosen by the seed.
d  the door, in the middle of the front wall, 3 cells wide; r the path from the door straight to the front edge.
p  the porch on both sides of the path, under a lean-to on posts.
g  the lawn ring; t the trees beyond it; Q a well in the lawn.
The seeds change:
  - the depth of the house (one more cell behind and/or in front);
  - the side and place of the wing;
  - the trees.
Large holds the house, wing, porch, path and lawn. Huge adds the trees around it and the well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrpgtsmQ" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <all in="rE" out="*p" symmetry="(x)" steps="1"/>
      <all in="w/p" out="*/p" symmetry="()"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wvp]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwWYRDOafvsTkFrpbXyJgtZCQPLKNoM#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ggggg/gtttg/gtttg/gtttg/ggggg"/>
      <rule in="Q" out="QQQQQ/QgggQ/QgggQ/QgggQ/QQQQQ"/>
      <sequence symmetry="(xy)">
        <!-- the walls of the hall: 64 tall, two bands of windows -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w Y" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w Y" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- the door wall -->
        <all in="B D" out="D O" steps="1"/>
        <all in="B D" out="D W" steps="63"/>
        <prl in="D" out="R"/>
        <!-- the hall: floor, stair strip, slab, roof -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- the wing: one storey, 32 -->
        <all in="B v" out="v W" steps="6"/><all in="B v" out="v Y" steps="14"/><all in="B v" out="v W" steps="12"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <!-- the porch: posts and the lean-to at 34 -->
        <all in="B b" out="b X" steps="34"/>
        <prl in="b" out="J"/>
        <all in="B p" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <!-- the trees -->
        <all in="B t" out="t Z" steps="16"/>
        <prl in="t" out="C"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="6"/>
        <!-- the well -->
        <all in="B Q" out="Q P" steps="6"/>
        <prl in="Q" out="P"/>
        <!-- the windows -->
        <one steps="14"><rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="W"/>
        <!-- the roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
        <!-- the parts -->
        <union symbol="+" values="W"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="c9a77a" name="sala" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro della casa"/>
  <color symbol="a" value="b89470" name="ala" area="house"/>
  <color symbol="v" value="d8c8a8" name="muro dell'ala"/>
  <color symbol="d" value="6b3e1f" name="porta"/>
  <color symbol="r" value="a89a80" name="sentiero" area="garden"/>
  <color symbol="p" value="9c6b3a" name="portico" area="porch"/>
  <color symbol="g" value="8fb060" name="prato" area="garden"/>
  <color symbol="t" value="3f7a3a" name="albero" area="garden"/>
  <color symbol="s" value="7a5a3a" name="scala" area="house"/>
  <color symbol="Q" value="5a8ab0" name="pozzo" area="garden"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="W" value="ece2c8" name="intonaco"/>
  <color symbol="Y" value="ece2c8" name="intonaco"/>
  <color symbol="D" value="ece2c8" name="intonaco"/>
  <color symbol="R" value="b0452e" name="tegole"/>
  <color symbol="O" value="7a4a24" name="porta di legno"/>
  <color symbol="o" value="4a2a14" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="f" value="a0784a" name="pavimento di tavole" area="house"/>
  <color symbol="F" value="8a6a48" name="solaio"/>
  <color symbol="T" value="7a5a3a" name="scala"/>
  <color symbol="k" value="6a4a2a" name="gradini"/>
  <color symbol="b" value="5c3a1e" name="palo"/>
  <color symbol="X" value="5c3a1e" name="palo del portico"/>
  <color symbol="y" value="5c3a1e" name="tettoia"/>
  <color symbol="J" value="8a3a28" name="tettoia del portico"/>
  <color symbol="Z" value="6a4628" name="tronco"/>
  <color symbol="C" value="5a9a4a" name="chioma"/>
  <color symbol="P" value="8a8a88" name="pietra del pozzo"/>
  <color symbol="L" value="3a5a78" name="finestra"/>
  <color symbol="K" value="7a6a60" name="camino"/>
  <color symbol="M" value="ece2c8" name="merlo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: Le finestre sui lati e sul retro sono disposte in modo disordinato e casuale, senza un'allineamento sui piani; Le pareti laterali sono troppo spoglie e lisce rispetto al tetto imponente; La proporzione del tetto principale risalta un po' troppo alta e pesante rispetto al corpo dell'edificio
Advice: Allinea le finestre lungo linee orizzontali e verticali pulite per definire bene i due piani della villetta; Riduci leggermente l'altezza del tetto principale per bilanciare le proporzioni con la struttura inferiore; Aggiungi cornici scure o dettagli in legno attorno alle finestre per staccarle meglio dal tono chiaro del muro
What the game made of it, in text:
### Seed 1: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, r sentiero, p portico, g prato, W intonaco, R tegole, O porta di legno, f pavimento di tavole, k gradini, F solaio, X palo del portico, J tettoia del portico, L finestra, K camino, N stipite, o assi della porta
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEgggggggggggggggggggggggggggggggggggggggggg
EEEEEEEEgggggggggggggggggggggggggggggggggggggggggg
EEEEEEEEgggggggggggggggggggggggggggggggggggggggggg
EEEEEEEEgggggggggggggggggggggggggggggggggggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEgggggRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
000000000000sssssssssssssssssssssssssssss000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuzvvwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttseeeeeeeee
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffffffffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffffffffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsffggggffe
000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsffffffffe
000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsffffffffe
000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttseeeeeeeee
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000ssssssssssssssssssssssssssss0000000000
00000000000000000ffffff0000000fffff000000000000000
00000000000000000ffffff0000000fffff000000000000000
00000000000000000ffffff0000000fffff000000000000000
00000000000000000ffffff0000000fffff000000000000000
00000000000000000ffffff0000000fffff000000000000000
00000000000000000ffffff0000000fffff000000000000000
00000000000000000ffffff0000000fffff000000000000000
00000000000000000ffffff0000000fffff000000000000000
00000000000000000ffffff0000000fffff000000000000000
```
Front (looking from the front; the sky at the top):
```
................K.................................
................K.................................
................K.....RRRRRRRR....................
................K...RRRRRRRRRRRR..................
................K.RRRRRRRRRRRRRRRR................
................RRRRRRRRRRRRRRRRRRRR..............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
............RRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW....RR....
............WWWWWWJJJJWWWWWWWWJJJJJWWWWW..RRRRRR..
............WWWWWWXXWXWWWWWWWWWXWXXWWWWWRRRRRRRRRR
............WWWWWWXXWXWNNNNNNNWXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
............WWWWWWXXWXNoooooooNXWXXWWWWWWWWWWWWWWW
EEEEEEEEgggggggggWppppprrrrrrrpppppggggggggggggggg
```
Right side (looking from the right):
```
.................K................................
.................K................................
.................RRRRRRRRRRRRR....................
...............RRRRRRRRRRRRRRRRR..................
.............RRRRRRRRRRRRRRRRRRRRR................
...........RRRRRRRRRRRRRRRRRRRRRRRRR..............
.........RRRRRRRRRRRRRRRRRRRRRRRRRRRRR............
.......RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......WWWWWWWWWWWWWWWWWRRRRRRRRRRWWWWWW..........
.......WWWWWWWWWWWWWWWRRRRRRRRRRRRRRWWWWJJJJJJJJJJ
.......WWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......LWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......LWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......LWWWWLLLWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......LWWWWLLLWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWLLLWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWLLLWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXX.XXXX.XX
EEEgggggggggggggggggWWWWWWWWWWWWWWWWWWgggggggggggg
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
.............WWLLLWWWWLLLWWWLLLWWWLLLLLL..........
............WWWLLLWWWWLLLWWWLLLWWWLLLLWW..........
............WWWLLLWWWWLLLWWWLLLWWWLLLLWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........LLL..........
............WWW.......kkkkkk.........LLL..........
............WWW.......kkkkkk.........LLL..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWWWWWWLLLWWW
............WWW......................WWWWWWWLLLWWW
............WWW......................WWWWWWWLLLWWW
............WWW......................WWW.......WWW
............WWW......................WWW.......WWW
............WWW......................WWW.......WWW
............WWW......................WWW.......WWW
............LLL......................WWW.......WWW
............LLL......................WWW.......WWW
............LLL......................WWW.......WWW
............WWW......................WWW.......WWW
............WWW......................WWW.......WWW
............WWW......................WWW.......WWW
............WWW......................WWW.......WWW
............LLL......................WWW.......WWW
............LLL......................WWWWWWWWWWWWW
............LLL......................WWWWWWWWWWWWW
............WWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
............WWWWWWWWWWNoooooooNWWWWWWWWW..........
............WWWWWWWWWWNoooooooNWWWWWWWWW..........
..................X..X.........X.X................
..................XXXX........XX.XX...............
..................................................
..................XXXX........XX.XX...............
..................X..X.........X.X................
..................X..X.........X.X................
..................XXXX........XX.XX...............
..................................................
..................XXXX........XX.XX...............
..................X..X.........X.X................
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
.............WWWWWLLLWWWWWWWWWWWWWWWWWWW..........
............WWWWWWLLLWWWWWWWWWWWWWWWWWWW..........
............WWWWWWLLLWWWWWWWWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............LWL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
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
gggggggggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggEEEEE   000000000000sssssssssssssssssssssssssssss000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttttttttttttttttttttttttttts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttttttttttttttttttttttttttts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00eeeeeeeeeesttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00efffffffffsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00efffffffffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwzwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00efffffffffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00efffffffffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
gggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   00eeeeeeeeeesttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000003330000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
gggggPgPggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000003030000sttttttttttttttttttttttttttts000000000
gggggPgPggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggEEEEE   000003330000sttttttttttttttttttttttttttts000000000
gggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggEEEEE   000000000000ssssssssssssssssssssssssssss0000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
ggggggggggggggggggJJJJJrrrrrrrJJJJJggggggggggEEEEE   00000000000000000ffffff0000000fffff000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggggg   000000000000sssssssssssssssssssssssssssss000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttseeeeeeeee
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffffffffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffffffffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggkfe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffffffffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffffffffe
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttseeeeeeeee
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEgggggRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggggg   000000000000ssssssssssssssssssssssssssss0000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
EEEEEEEEggggggggggJJJJJrrrrrrrJJJJJggggggggggggggg   00000000000000000ffffff0000000fffff000000000000000
```
How much the plans of the seeds differ: 0.35 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 119 nodi, 581 passi, finito in 502 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=sala, w=muro della casa, a=ala, v=muro dell'ala, d=porta, r=sentiero, p=portico, g=prato, s=scala, m=segno, W=intonaco, Y=intonaco, R=tegole, D=intonaco, O=porta di legno, f=pavimento di tavole, T=scala, k=gradini, F=solaio, b=palo, X=palo del portico, y=tettoia, J=tettoia del portico, L=finestra, K=camino, N=stipite, o=assi della porta, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 75071, R 22785, X 4896, L 3104, g 3100, f 2850, k 2720, F 2315, o 2130, E 1925, J 400, N 375, r 300, p 256, O 120, K 11.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-32 all×22, prl×2, one×2: 342 celle x3-19 y1-19 z0, passi 2-50
   #36 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 51
    #38 all . w → w W passi=6: ×6, 12300 celle x25-79 y15-79 z0-6, passi 52-57, w→W 6150, .→w 6150
    #39 all . w → w Y passi=14: ×14, 28700 celle x25-79 y15-79 z6-20, passi 58-71, w→Y 14350, .→w 14350
    #40 all . w → w W passi=12: ×12, 24600 celle x25-79 y15-79 z20-32, passi 72-83, w→W 12300, .→w 12300
    #41 all . w → w W passi=6: ×6, 12300 celle x25-79 y15-79 z32-38, passi 84-89, w→W 6150, .→w 6150
    #42 all . w → w Y passi=14: ×14, 28700 celle x25-79 y15-79 z38-52, passi 90-103, w→Y 14350, .→w 14350
    #43 all . w → w W passi=12: ×12, 24600 celle x25-79 y15-79 z52-64, passi 104-115, w→W 12300, .→w 12300
#44-49 prl×2, all×4: 16050 celle x25-79 y15-79 z0-64, passi 116-183
    #50 all . h → h . passi=31: ×31, 141050 celle x30-74 y20-74 z1-32, passi 184-214, h→. 70525, .→h 70525
#51-52 all×2: 16950 celle x30-74 y20-74 z2-33, passi 215-245
    #53 all . h → h . (+1) passi=31: ×31, 153450 celle x30-74 y20-74 z33-64, passi 246-276, h→. 70525, .→h 70525, s→. 6200, .→s 6200
      r1 . h → h . ×70525; r2 . s → s . ×6200
#54-59 prl×2, all×4: 24350 celle x30-99 y20-74 z0-64, passi 277-311
    #60 all . a → a . passi=31: ×31, 23250 celle x80-94 y45-69 z1-32, passi 312-342, a→. 11625, .→a 11625
#61-74 prl×3, all×4, one×1: 30823 celle x25-94 y15-99 z0-51, passi 343-428
    #75 prl Y → W: ×1, 30146 celle x25-99 y15-79 z6-51, passi 429, Y→W 30146
#76-77 all×2: 18510 celle x24-99 y14-80 z32-74, passi 430-440
#78-119 one×1, all×14, prl×4: 18021 celle x33-60 y20-79 z0-79, passi 441-581
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/h → h/* passi=1
#26 all w/p → */p: le celle cercate c'erano, ma mai disposte come nel pattern
#33 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#34 one ggggg/ggggg/ggggg/ggggg/ggggg → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#67 all . t → t Z passi=16: in quel momento nella griglia non c'erano celle "t"
#68 prl t → C: in quel momento nella griglia non c'erano celle "t"
#69 all C. → *C passi=4: in quel momento nella griglia non c'erano celle "C"
#70 all . C → C * passi=6: in quel momento nella griglia non c'erano celle "C"
#71 all . Q → Q P passi=6: in quel momento nella griglia non c'erano celle "Q"
#72 prl Q → P: in quel momento nella griglia non c'erano celle "Q"
#81 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#82 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
… e altri 19
Improve it: answer with the whole program.

## Risposta

```xml
<!--
villetta: a country house; two volumes of different height under pitched roofs, with a porch on the door.
h  the main hall (two storeys); w its walls; x the wall cells with windows, regular every other cell from the corners.
s  the stair zone along the back wall, landing at small x.
a  the wing (one storey, lower); v its walls; u its window cells; against a side wall, side and place chosen by the seed.
d  the door, in the middle of the front wall, 3 cells wide; r the path from the door straight to the front edge.
p  the porch on both sides of the path, under a lean-to on posts.
g  the lawn ring; t the trees beyond it; Q a well in the lawn.
Seeds change the depth of the house, the side and place of the wing, the trees.
Large: house, wing, porch, path, lawn. Huge adds trees and the well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrpgtsmQxu" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <all in="rE" out="*p" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- regular windows: every other wall cell from the outer corners -->
      <all in="EEE/Eww/Ew[hs]" out="***/***/*x*"/>
      <all in="xww" out="**x"/>
      <all in="EEE/Evv/Eva" out="***/***/*u*"/>
      <all in="uvv" out="**u"/>
      <all in="[wvpxud]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwWYRDOafvsTkFrpbXyJgtZCQPLKNoMxqAGcue#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="x" out="qqqqq/qxxxq/qxxxq/qxxxq/qqqqq"/>
      <rule in="u" out="eeeee/euuue/euuue/euuue/eeeee"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ggggg/gtttg/gtttg/gtttg/ggggg"/>
      <rule in="Q" out="QQQQQ/QgggQ/QgggQ/QgggQ/QQQQQ"/>
      <sequence symmetry="(xy)">
        <!-- the walls of the hall: 64 tall, stone plinth -->
        <all in="B w" out="w A" steps="4"/><all in="B w" out="w W" steps="60"/>
        <prl in="w" out="R"/>
        <!-- the window cells: frame q, glass x, two storeys -->
        <all in="B q" out="q A" steps="4"/><all in="B q" out="q W" steps="2"/><all in="B q" out="q G" steps="15"/><all in="B q" out="q W" steps="11"/>
        <all in="B q" out="q W" steps="6"/><all in="B q" out="q G" steps="15"/><all in="B q" out="q W" steps="11"/>
        <prl in="q" out="R"/>
        <all in="B x" out="x A" steps="4"/><all in="B x" out="x W" steps="2"/><all in="B x" out="x G" steps="1"/><all in="B x" out="x L" steps="13"/><all in="B x" out="x G" steps="1"/><all in="B x" out="x W" steps="11"/>
        <all in="B x" out="x W" steps="6"/><all in="B x" out="x G" steps="1"/><all in="B x" out="x L" steps="13"/><all in="B x" out="x G" steps="1"/><all in="B x" out="x W" steps="11"/>
        <prl in="x" out="R"/>
        <!-- the door wall -->
        <all in="B D" out="D O" steps="1"/>
        <all in="B D" out="D W" steps="63"/>
        <prl in="D" out="R"/>
        <!-- the hall: floor, stair strip, slab, roof -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- the wing: one storey, 32 -->
        <all in="B v" out="v A" steps="4"/><all in="B v" out="v W" steps="28"/>
        <prl in="v" out="c"/>
        <all in="B e" out="e A" steps="4"/><all in="B e" out="e W" steps="2"/><all in="B e" out="e G" steps="15"/><all in="B e" out="e W" steps="11"/>
        <prl in="e" out="c"/>
        <all in="B u" out="u A" steps="4"/><all in="B u" out="u W" steps="2"/><all in="B u" out="u G" steps="1"/><all in="B u" out="u L" steps="13"/><all in="B u" out="u G" steps="1"/><all in="B u" out="u W" steps="11"/>
        <prl in="u" out="c"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="c"/>
        <!-- the porch: posts and the lean-to at 34 -->
        <all in="B b" out="b X" steps="34"/>
        <prl in="b" out="J"/>
        <all in="B p" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <!-- the trees -->
        <all in="B t" out="t Z" steps="16"/>
        <prl in="t" out="C"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="6"/>
        <!-- the well -->
        <all in="B Q" out="Q P" steps="6"/>
        <prl in="Q" out="P"/>
        <!-- the roofs: lower main roof, wing roof in a darker tile -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="7" symmetry="()"/>
        <all in="cB" out="*c" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **c**/**c**/ccccc/**c**/**c**" out="*****/*****/**c**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="8"/>
        <!-- the parts -->
        <union symbol="+" values="WA"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="c9a77a" name="sala" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro della casa"/>
  <color symbol="x" value="3a5a78" name="finestra"/>
  <color symbol="u" value="3a5a78" name="finestra dell'ala"/>
  <color symbol="a" value="b89470" name="ala" area="house"/>
  <color symbol="v" value="d8c8a8" name="muro dell'ala"/>
  <color symbol="d" value="6b3e1f" name="porta"/>
  <color symbol="r" value="a89a80" name="sentiero" area="garden"/>
  <color symbol="p" value="9c6b3a" name="portico" area="porch"/>
  <color symbol="g" value="8fb060" name="prato" area="garden"/>
  <color symbol="t" value="3f7a3a" name="albero" area="garden"/>
  <color symbol="s" value="7a5a3a" name="scala" area="house"/>
  <color symbol="Q" value="5a8ab0" name="pozzo" area="garden"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="q" value="ece2c8" name="intonaco"/>
  <color symbol="e" value="ece2c8" name="intonaco"/>
  <color symbol="W" value="ece2c8" name="intonaco"/>
  <color symbol="Y" value="ece2c8" name="intonaco"/>
  <color symbol="D" value="ece2c8" name="intonaco"/>
  <color symbol="A" value="8f8a80" name="zoccolo di pietra"/>
  <color symbol="G" value="5a3a20" name="cornice di legno"/>
  <color symbol="R" value="b0452e" name="tegole"/>
  <color symbol="c" value="8e3624" name="tegole dell'ala"/>
  <color symbol="O" value="7a4a24" name="porta di legno"/>
  <color symbol="o" value="4a2a14" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="f" value="a0784a" name="pavimento di tavole" area="house"/>
  <color symbol="F" value="8a6a48" name="solaio"/>
  <color symbol="T" value="7a5a3a" name="scala"/>
  <color symbol="k" value="6a4a2a" name="gradini"/>
  <color symbol="b" value="5c3a1e" name="palo"/>
  <color symbol="X" value="5c3a1e" name="palo del portico"/>
  <color symbol="y" value="5c3a1e" name="tettoia"/>
  <color symbol="J" value="8a3a28" name="tettoia del portico"/>
  <color symbol="Z" value="6a4628" name="tronco"/>
  <color symbol="C" value="5a9a4a" name="chioma"/>
  <color symbol="P" value="8a8a88" name="pietra del pozzo"/>
  <color symbol="L" value="3a5a78" name="finestra"/>
  <color symbol="K" value="7a6a60" name="camino"/>
  <color symbol="M" value="ece2c8" name="merlo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
