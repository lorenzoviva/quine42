# model.sculpt · gemini-4-neon · 70 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.
It is not a fortification: no merlons, no arrow slits, nothing of a fort; its flat tops end in a cornice, a solid parapet, a railing, a skylight or a dome, as its world builds them.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
Fattoria (casa colonica con portico, stalla/fienile, aia recintata, pozzo, campi e alberi)
Parti e lettere del piano (1 cella = 5x5 voxel):
- h: sala principale (piano terra), k: seconda stanza, j: muro interno divisorio, w: muri esterni della casa, s: vano scala lungo il muro di fondo
- d: porta d'ingresso sul fronte, p: portico antistante, b: pilastri del portico, r: strada verso il bordo anteriore
- a: interno della stalla/fienile laterale, v: muri della stalla
- c: aia intorno agli edifici, f: recinzione dell'aia, q: pozzo nell'aia, l: campi coltivati oltre la recinzione, t: alberi sul terreno libero
- E: suolo, H: origine (pulita in h), m: marcatore temporaneo per l'asse della porta (pulito in h)
Variazione tra i semi: lato del muro interno (stanza a sinistra o a destra), lato e profondità della stalla/fienile, posizione del pozzo e degli alberi.
Adattamento alle dimensioni:
- Large (20x20): casa colonica a due piani con due stanze, scala, portico con pilastri e strada fino al bordo.
- Huge (30x30) e Gargantuan (100x100): si aggiungono la stalla laterale, l'aia recintata, il pozzo, i campi coltivati e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhkwjsdmpbravcfqlt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 15x13 celle interne (75x65 voxel), spostato leggermente indietro per il portico -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="7"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta d'ingresso sul fronte, centrata sull'asse di H, larga 3 celle (15 voxel) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico anteriore profondo 2 celle e largo 5, con pilastri agli angoli anteriori, e strada dritta al bordo -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <all in="pE/EE" out="b*/**" symmetry="(x)" steps="1"/>
      <all in="p/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Muro interno divisorio: stanza k larga 6 celle (30 voxel) e sala h larga 8 celle (40 voxel) -->
      <one in="whhhhhhh" out="*******j" symmetry="(x)" steps="1"/>
      <all in="h/j" out="j/*" symmetry="()"/>
      <all in="j/h" out="*/j" symmetry="()"/>
      <one in="whhhhhhj" out="*k******" symmetry="(x)" steps="1"/>
      <all in="kh" out="*k"/>

      <!-- Vano scala nella sala lungo il muro di fondo: 2 celle di pianerottolo, 4 di scala, 2 di sbarco -->
      <one in="wwwwwwww/hhhhhhhh/hhhhhhhh" out="********/hhsssshh/hhsssshh" symmetry="()" steps="1"/>

      <!-- Stalla/fienile laterale su un lato casuale, solo dove c'è spazio (Huge e Gargantuan) -->
      <one in="EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw" out="*******/*******/**aaaa*/*******/*******" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia intorno agli edifici dove il terreno prosegue, poi recinzione -->
      <all in="[wvpb]EEE" out="*c**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo nell'aia dove entra un quadrato 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Campi coltivati oltre la recinzione e alberi sul terreno libero -->
      <all in="fEEEEE" out="*lll**" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>

  <color symbol="B" value="000000" hidden="True" name="aria"/>
  <color symbol="E" value="6E8B4E" hidden="True" name="suolo"/>
  <color symbol="H" value="D4A76A" name="origine"/>
  <color symbol="m" value="D4A76A" name="asse"/>
  <color symbol="h" value="C9A87C" area="house" name="sala"/>
  <color symbol="k" value="B8956A" area="house" name="stanza"/>
  <color symbol="w" value="D8CEBE" name="muro della casa"/>
  <color symbol="j" value="BFB39F" name="muro interno"/>
  <color symbol="s" value="8C6239" area="house" name="scala"/>
  <color symbol="d" value="6B4226" name="porta"/>
  <color symbol="p" value="A89882" area="porch" name="portico"/>
  <color symbol="b" value="5C3A21" name="pilastro"/>
  <color symbol="r" value="9E9484" name="strada"/>
  <color symbol="a" value="A68A5B" area="barn" name="stalla"/>
  <color symbol="v" value="8F5B3C" name="muro della stalla"/>
  <color symbol="c" value="C2B280" area="yard" name="aia"/>
  <color symbol="f" value="7A5438" name="recinzione"/>
  <color symbol="q" value="4F7D9E" name="pozzo"/>
  <color symbol="l" value="7B6B3E" area="field" name="campo"/>
  <color symbol="t" value="3E6B3A" name="albero"/>
</sequence>
```

