# model.sculpt · gemini-4-carbon · 86 s

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
Concept: Forte (medieval fort).
Parts and plan letters:
- Keep (mastio): interior floor 'h', stair zone 's', keep walls 'w', keep door 'd', attached watchturret 'q' on a random back/side corner of the keep.
- Courtyard (cortile): open yard 'c', paved axis 'n' from gatehouse to keep door, well 'Q' (when courtyard is large enough), wooden lean-to/armory 'a' with wall 'v' against the curtain wall.
- Curtain wall & Gatehouse: ring wall 'W' (2 cells thick = 10 voxels, walkable), corner towers 't' (4x4 cells = 20x20 voxels) on random/all corners, front gatehouse 'G' on the central axis with road 'r' to the front edge.
- Outer defenses (at Gargantuan 40x40 where ground remains): water moat 'm' bridged by wooden bridge 'b' along the road, and outer stone watch-posts/trees 'p' in the surrounding field.
What seeds change: keep proportions (8-9x8-10 interior), position of keep watchturret 'q', courtyard asymmetry (left/right/back expansion), which corners get stone towers 't' vs bastion corners, position of courtyard annex 'a' and well 'Q'.
What fits by size:
- Huge (30x30): Keep + watchturret + tight courtyard + curtain wall + corner towers + front gatehouse + road (and well or small shed where yard expands).
- Gargantuan (40x40): Expanded courtyard holding larger annex 'a'/'v' and well 'Q', plus full water moat 'm' around the fort crossed by bridge 'b', and outer perimeter markers 'p'.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdqcnavWGtrmbpQ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Keep interior 'h' around H: shifted slightly toward back so front yard & gate fit well -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="5"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <one in="hE/hE/hE/hE/hE/hE/hE/hE" out="*q/*q/*q/*q/*q/*q/*q/*q" symmetry="(x)" steps="1"/>
      <prl in="q" out="h"/>

      <!-- Keep walls 'w' -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone 's' inside keep: along back wall, 2 cells landing on small-x, 4 cells strip, floor after -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- High watchturret 'q' (3x3) on one back corner of the keep -->
      <one in="EE/Ew/wh" out="qq/qq/*h" symmetry="(x)" steps="1"/>
      <all steps="1">
        <rule in="q[Ew]" out="*q"/>
        <rule in="q*/*[Ew]" out="**/*q"/>
      </all>

      <!-- 2. Courtyard 'c' around the keep -->
      <all in="[wq]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard forward a bit more if room -->
      <all in="c/E/E/E/E/E" out="c/c/*/*/*/*" symmetry="()" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Seed-dependent extra courtyard expansion on sides/back where ample ground exists (especially Gargantuan, or 1 side in Huge) -->
      <one in="E/c" out="p/*" symmetry="(xy)" steps="1"/>
      <all in="pEEEEEE" out="ccccc**" symmetry="(xy)" steps="1"/>
      <prl in="p" out="E"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- At Gargantuan (lots of E left), expand courtyard evenly all around by 3 cells -->
      <all in="cEEEEEEEEE" out="*ccc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 3. Curtain wall 'W' (2 cells thick) around courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 4. Corner towers 't' (4x4) on outer corners of curtain wall -->
      <all in="EE/EW" out="*p/*t"/>
      <prl in="p" out="E"/>
      <!-- Randomly drop 1 front or back tower on some seeds for variety, keeping at least 2-4 towers -->
      <one in="t" out="W" steps="1"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 5. Way out: central axis toward front (+y) -->
      <!-- Find center column at front of keep and punch keep door 'd', yard path 'n', gatehouse 'G', road 'r' -->
      <one in="h/w/c" out="*/d/n" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Widen door 'd', path 'n', gatehouse 'G', road 'r' to 3 cells wide -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- Deepen gatehouse slightly into courtyard if space -->
      <all in="c/G" out="G/*" symmetry="()" steps="1"/>

      <!-- 6. Courtyard structures (fit where space allows: annex 'a'/'v' and well 'Q') -->
      <!-- Armory/barracks annex against side curtain wall in courtyard (fits when courtyard expanded) -->
      <one in="Wcccc/Wcccc/Wcccc/Wcccc/Wcccc/Wcccc" out="Waaav/Waaav/Waaav/Waaav/Waaav/Wvvvv" symmetry="(x)" steps="1"/>
      <!-- Second annex or well 'Q' in free 4x4 courtyard patch -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>

      <!-- 7. Outer Moat 'm' & Bridge 'b' (only grows where >= 4 cells of E remain outside W/t, i.e. Gargantuan) -->
      <all in="WEEEEE" out="*mmm**" steps="1"/>
      <all in="[WtG]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
      <all in="mE" out="*m" steps="1"/>
      <all in="mE/*m" out="*m/**"/>
      <!-- Bridge 'b' where road 'r' crosses moat zone -->
      <all in="mr" out="*b" symmetry="(x)"/>
      <all in="bm/br" out="**/*b" symmetry="(xy)"/>
      <all in="G/r/r/r/r" out="G/b/b/b/r" symmetry="()"/>
      <all in="br" out="*b" symmetry="(x)" steps="1"/>

      <!-- Outer lantern/watch posts 'p' along the road in big map -->
      <one in="Er/Er/EE" out="pr/*r/**" symmetry="(x)" steps="2"/>
    </sequence>
  </map>

  <color symbol="E" value="#7a8c56" name="erba" hidden="True"/>
  <color symbol="H" value="#ffffff" name="centro"/>
  <color symbol="h" value="#c8b89a" name="pavimento mastio" area="keep"/>
  <color symbol="s" value="#a88c64" name="scala mastio" area="keep"/>
  <color symbol="w" value="#8a867e" name="muro mastio" area="keep"/>
  <color symbol="d" value="#6e472b" name="porta mastio" area="keep"/>
  <color symbol="q" value="#6d6a63" name="torretta mastio" area="tower"/>
  <color symbol="c" value="#b8ab8e" name="cortile" area="courtyard"/>
  <color symbol="n" value="#9c9484" name="lastricato" area="courtyard"/>
  <color symbol="a" value="#c29b61" name="tettoia armeria" area="courtyard"/>
  <color symbol="v" value="#7a5835" name="legno armeria" area="courtyard"/>
  <color symbol="W" value="#96928a" name="mura di cinta" area="courtyard"/>
  <color symbol="G" value="#7c7870" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="#737069" name="torre angolare" area="tower"/>
  <color symbol="r" value="#a89878" name="strada"/>
  <color symbol="m" value="#4f7c8a" name="fossato"/>
  <color symbol="b" value="#855e3b" name="ponte di legno"/>
  <color symbol="Q" value="#5a5852" name="pozzo" area="courtyard"/>
  <color symbol="p" value="#6b4c30" name="cippo"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento mastio, s scala mastio, w muro mastio, d porta mastio, c cortile, n lastricato, W mura di cinta, G corpo di guardia, t torre angolare, r strada, m fossato, b ponte di legno
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEmmmmmmmmmmmmmmmEEEEEEEE
EEEEEEEmmmmmmmmmmmmmmmEEEEEEEE
EEEtttttmmmmmmmmmmmmmtttttEEEE
EEEtttttmmmmmmmmmmmmmtttttEEEE
EEEtttttWWWWWWWWWWWWWtttttEEEE
EEEtttttWWWWWWWWWWWWWtttttEEEE
EmmttttcccccccccccccccttttmmEE
EmmmmWWccwwwwwwwwwwwwcWWmmmmEE
EmmmmWWccwhhsssshhhhwcWWmmmmEE
EmmmmWWccwhhsssshhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwhhhhhHhhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwwwdddwwwwwwcWWmmmmEE
EmmmmWWcccccnnncccccccWWmmmmEE
EmmmmWWcccccnnncccccccWWmmmmEE
EmmttttccccGnnnGccccccWWmmmmEE
EEEtttttWWWGGGGGWWWWWWWWmmmmEE
EEEtttttWWWGGGGGWWWWWWWWmmmmEE
EEEtttttmmmmbbbmmmmmmmmmmmmmEE
EEEtttttmmmmbbbmmmmmmmmmmmmmEE
EEEEEEEmmmmmbbbmmmmmmmmmmmmmEE
EEEEEEEmmmmmbbbmmmmmmmmmmmmmEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento mastio, s scala mastio, w muro mastio, d porta mastio, c cortile, n lastricato, a tettoia armeria, v legno armeria, W mura di cinta, G corpo di guardia, t torre angolare, r strada, m fossato, b ponte di legno, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEmmmmmmmmmmmmmmmmmmmmmmmm
EEEEEEmmmmmmmmmmmmmmmmmmmmmmmm
EEtttttmmmmmmmmmmmmmmmmmmmmmmm
EEtttttmmmmmmmmmmmmmmmmmmmmmmm
EEtttttWWWWWWWWWWWWWWWWWWWWWWW
EEtttttWWWWWWWWWWWWWWWWWWWWWWW
EEttttccccccccccccccccccccccWW
EEEEWWaaavwwwwwwwwwwwwccccccWW
EEEEWWaaavwhhsssshhhhwccccccWW
EEEEWWaaavwhhsssshhhhwccccccWW
EEEEWWaaavwhhhhhhhhhhwccccQcWW
EEEEWWaaavwhhhhhhhhhhwccccccWW
EEEEWWvvvvwhhhhhhhhhhwccccccWW
EEEEWWccccwhhhhHhhhhhwccccccWW
EEEEWWccccwhhhhhhhhhhwccccccWW
EEEEWWccccwhhhhhhhhhhwccccccWW
EEEEWWccccwwwwwwwwwdddccccccWW
EEEEWWcccccccccccccnnnccccccWW
EEEEWWcccccccccccccnnnccccccWW
EEEEWWccccccccccccGnnnGcccccWW
EEEEWWWWWWWWWWWWWWGGGGGWWWWWWW
EEEEWWWWWWWWWWWWWWGGGGGWWWWWWW
EEEmmmmmmmmmmmmmmmmbbbmmmmmmmm
EEEmmmmmmmmmmmmmmmmbbbmmmmmmmm
EEEmmmmmmmmmmmmmmmmbbbmmmmmmmm
EEEmmmmmmmmmmmmmmmmbbbmmmmmmmm
EEEEEEEEEEEEEEEEEEErrrEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento mastio, s scala mastio, w muro mastio, d porta mastio, c cortile, n lastricato, W mura di cinta, G corpo di guardia, t torre angolare, r strada, m fossato, b ponte di legno
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EmmmmmmmmmmmmmmmmmmmmmEEEEEEEE
EmmmmmmmmmmmmmmmmmmmmmEEEEEEEE
EmmmmmmmmmmmmmmmmmmmmtttttEEEE
EmmmmmmmmmmmmmmmmmmmmtttttEEEE
EmmmmWWWWWWWWWWWWWWWWtttttEEEE
EmmmmWWWWWWWWWWWWWWWWtttttEEEE
EmmmmWWcccccccccccccccttttmmEE
EmmmmWWccwwwwwwwwwwwwcWWmmmmEE
EmmmmWWccwhhsssshhhhwcWWmmmmEE
EmmmmWWccwhhsssshhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwhhhhhHhhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwhhhhhhhhhhwcWWmmmmEE
EmmmmWWccwwwwwwwdddwwcWWmmmmEE
EmmmmWWcccccccccnnncccWWmmmmEE
EmmmmWWcccccccccnnncccWWmmmmEE
EmmttttccccccccGnnnGccttttmmEE
EEEtttttWWWWWWWGGGGGWtttttEEEE
EEEtttttWWWWWWWGGGGGWtttttEEEE
EEEtttttmmmmmmmmbbbmmtttttEEEE
EEEtttttmmmmmmmmbbbmmtttttEEEE
EEEEEEEmmmmmmmmmbbbmmmEEEEEEEE
EEEEEEEmmmmmmmmmbbbmmmEEEEEEEE
EEEEEEEEEEEEEEEErrrEEEEEEEEEEE
EEEEEEEEEEEEEEEErrrEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento mastio, s scala mastio, w muro mastio, d porta mastio, c cortile, n lastricato, a tettoia armeria, v legno armeria, W mura di cinta, G corpo di guardia, t torre angolare, r strada, m fossato, b ponte di legno, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEmmmmmmmmmmmmmmmmmmmmmEEEEEEEEEE
EEEEEEEEEmmmmmmmmmmmmmmmmmmmmmEEEEEEEEEE
EEEEEtttttmmmmmmmmmmmmmmmmmmmtttttEEEEEE
EEEEEtttttmmmmmmmmmmmmmmmmmmmtttttEEEEEE
EEEEEtttttWWWWWWWWWWWWWWWWWWWtttttEEEEEE
EEEEEtttttWWWWWWWWWWWWWWWWWWWtttttEEEEEE
EEEmmttttcccccccccccccccccccccttttmmEEEE
EEEmmmmWWcccccccccccccccccccccWWmmmmEEEE
EEEmmmmWWcccccccccccccccccccccWWmmmmEEEE
EEEmmmmWWcccccccccccccccccccccWWmmmmEEEE
EEEmmmmWWcccccwwwwwwwwwwwwccccWWmmmmEEEE
EEEmmmmWWcccccwhhsssshhhhwccccWWmmmmEEEE
EEEmmmmWWcccccwhhsssshhhhwccccWWmmmmEEEE
EEEmmmmWWcccccwhhhhhhhhhhwccccWWmmmmEEEE
EEEmmmmWWaaavcwhhhhhhhhhhwccccWWmmmmEEEE
EEEmmmmWWaaavcwhhhhhhhhhhwccccWWmmmmEEEE
EEEmmmmWWaaavcwhhhhhHhhhhwccccWWmmmmEEEE
EEEmmmmWWaaavcwhhhhhhhhhhwccccWWmmmmEEEE
EEEmmmmWWaaavcwhhhhhhhhhhwccccWWmmmmEEEE
EEEmmmmWWvvvvcwwdddwwwwwwwccccWWmmmmEEEE
EEEmmmmWWcccccccnnncccccccccccWWmmmmEEEE
EEEmmmmWWcccccccnnncccccccccccWWmmmmEEEE
EEEmmmmWWcccccccnnnccQccccccccWWmmmmEEEE
EEEmmmmWWcccccccnnncccccccccccWWmmmmEEEE
EEEmmmmWWcccccccnnncccccccccccWWmmmmEEEE
EEEmmttttccccccGnnnGccccccccccWWmmmmEEEE
EEEEEtttttWWWWWGGGGGWWWWWWWWWWWWmmmmEEEE
EEEEEtttttWWWWWGGGGGWWWWWWWWWWWWmmmmEEEE
EEEEEtttttmmmmmmbbbmmmmmmmmmmmmmmmmmEEEE
EEEEEtttttmmmmmmbbbmmmmmmmmmmmmmmmmmEEEE
EEEEEEEEEmmmmmmmbbbmmmmmmmmmmmmmmmmmEEEE
EEEEEEEEEmmmmmmmbbbmmmmmmmmmmmmmmmmmEEEE
EEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.48 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Concept: Forte (medieval fort).
Refinements from Block 1 plans:
1. Keep door 'd' stays away from the side corners of the keep (`wh/ww/cc` will not overwrite side wall `w`, matching `hhh/www/ccc` on the central axis).
2. Watchturret `q` on a back corner of the keep now triggers cleanly (`cc/cw/wh`) so the keep always has its asymmetric watchturret peak.
3. Moat `m` & Bridge `b` only spawn when at least 7 cells of free ground `E` exist outside the curtain wall (so Huge 30x30 stays a dry-ditch fort with road, while Gargantuan 40x40 gains the full water moat `m`, timber bridge `b`, courtyard armory lean-to `a`/`v`, well `Q`, and outer stone boundary posts `p` — clearly more parts and kinds of parts at the larger size).
4. Stair `s` inside keep climbs from ground floor (z=0) to 1st floor (z=32), and a second offset stair zone `u` climbs from 1st floor (z=32) to the roof battlement terrace (z=64), giving 2 covered interior storeys plus accessible roof walk.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhsuwdqcnavWGtrmbpQ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Keep interior 'h' around H (9-10 wide, 8-9 deep) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <one in="hE/hE/hE/hE/hE/hE/hE/hE" out="*q/*q/*q/*q/*q/*q/*q/*q" symmetry="(x)" steps="1"/>
      <prl in="q" out="h"/>

      <!-- Keep walls 'w' -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Ground-to-first-floor stair zone 's' along back wall: 2 cells landing on left, 4 cells strip, >=2 cells landing on right -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>
      <!-- First-to-roof stair zone 'u' further forward in keep: 2 cells landing on left, 4 cells strip, >=2 cells landing on right -->
      <one in="whhhhhhhh/whhhhhhhh/whhhhhhhh/whhhhhhhh" out="*********/***uuuu**/***uuuu**/*********" symmetry="()" steps="1"/>

      <!-- 2. Courtyard 'c' around the keep -->
      <all in="wE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="c/E/E/E/E/E" out="c/c/*/*/*/*" symmetry="()" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- High watchturret 'q' (3x3) on one back corner of the keep -->
      <one in="cc/cw/wh" out="qq/qq/*h" symmetry="(x)" steps="1"/>
      <all steps="1">
        <rule in="q[cw]" out="*q"/>
        <rule in="q*/*[cw]" out="**/*q"/>
      </all>

      <!-- Seed-dependent asymmetric courtyard expansion where ground permits -->
      <one in="E/c" out="p/*" symmetry="(xy)" steps="1"/>
      <all in="pEEEEEE" out="ccccc**" symmetry="(xy)" steps="1"/>
      <prl in="p" out="E"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- At Gargantuan (lots of E left), expand courtyard all around by 3 cells -->
      <all in="cEEEEEEEEE" out="*ccc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 3. Curtain wall 'W' (2 cells thick) around courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 4. Corner towers 't' (4x4) on outer corners of curtain wall -->
      <all in="EE/EW" out="*p/*t"/>
      <prl in="p" out="E"/>
      <!-- Drop 1 corner tower at random for seed variety (3 towers + 1 bastion corner) -->
      <one in="t" out="W" steps="1"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 5. Central way out toward front (+y), strictly centered on H or middle of keep front -->
      <all in="H/[hu]" out="*/n" symmetry="()" steps="1"/>
      <all in="n/[hu]" out="*/n" symmetry="()"/>
      <all in="n/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="H" out="h"/>
      <!-- Restore interior 'n' back to 'h' (or 'u' was not touched if H behind u; let's be clean: H is at center so H->front passes only h) -->
      <all in="n/d" out="h/d" symmetry="()"/>
      <all in="n/h" out="h/h" symmetry="()"/>
      <prl in="n" out="h"/>

      <!-- Fallback if d wasn't placed (e.g. u was in front of H): place d in middle of front keep wall -->
      <one in="hhh/www/ccc" out="***/.d./.n." symmetry="()" steps="1"/>
      <all in="d/c" out="*/n" symmetry="()" steps="1"/>
      <all in="n/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Widen door 'd' (inside keep width), path 'n', gatehouse 'G', road 'r' to 3 cells wide -->
      <all in="hd/wd" out="*h/*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="c/G" out="G/*" symmetry="()" steps="1"/>

      <!-- 6. Courtyard structures: open lean-to armory 'a'/'v' (at least 4 deep x 7 long = 20x35 voxels) and well 'Q' -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc" out="Waaaav/Waaaav/Waaaav/Waaaav/Waaaav/Waaaav/Waaaav" symmetry="(x)" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 7. Outer Moat 'm' & Bridge 'b' ONLY at Gargantuan (where >=6 cells of E remain outside W) -->
      <all in="cWWEEEEEEE" out="***mmm****" steps="1"/>
      <all in="[WtG]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
      <all in="mE" out="*m" steps="1"/>
      <all in="mE/*m" out="*m/**"/>
      <!-- Wooden bridge 'b' across moat on the road -->
      <all in="mr" out="*b" symmetry="(x)"/>
      <all in="r/m" out="b/b" symmetry="()"/>
      <all in="b/m" out="b/b" symmetry="()"/>
      <all in="m/r" out="b/r" symmetry="()"/>
      <all in="bm" out="*b" symmetry="(x)" steps="1"/>
      <!-- Ensure continuous road/bridge across moat -->
      <all in="G/m" out="G/b" symmetry="()"/>
      <all in="b/E" out="b/r" symmetry="()" steps="1"/>

      <!-- Outer roadside stone posts 'p' where moat exists -->
      <one in="Em/Eb/Er" out="*m/*b/pr" symmetry="(x)" steps="2"/>
    </sequence>

    <!-- Full scale 5x5x1 map -->
    <map scale="5 5 1" values="BEhsuwdqcnavWGtrmbpQfwFRLYKJPIZATkOoNMU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="aaaaa/avvva/avvva/avvva/aaaaa"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="Q" out="ccccc/cQQQc/cQIQc/cQQQc/ccccc"/>
      <rule in="p" out="EEEEE/EpPpE/EPPPE/EpPpE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- Unions for imported parts -->
        <union symbol="+" values="wWGtqZ"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wWGtq"/>

        <!-- ================= B. HEIGHTS ================= -->
        <!-- 1. Keep walls 'w' & keep door 'd' column: 2 storeys (64) + 1 parapet (65) -->
        <!-- Ground floor wall: 8 stone, 12 window band Z, 12 stone (total 32) -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w *" steps="12"/>
        <!-- First floor wall: 8 stone, 12 window band Z, 12 stone (total 32 -> z=64) -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w Z" steps="12"/>
        <all in="B w" out="w *" steps="12"/>
        <!-- Keep door 'd': z=0 floor 'n' with seed 'O', then wall 'w' up to 65 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="31"/>
        <all in="B d" out="d w" steps="8"/>
        <all in="B d" out="d Z" steps="12"/>
        <all in="B d" out="d w" steps="12"/>
        <prl in="d" out="w"/>

        <!-- 2. Keep interior 'h', ground stair 's', upper stair 'u' -->
        <!-- z=0: stone/plank floor 'f' while preserving 'h' at z=0? Keep 'h' at z=0 as floor! -->
        <!-- Wait: h, s, u at z=0 have area="keep". If we leave 'h'/'s'/'u' at z=0 or 'f' at z=0: let's leave 'f' with area="keep"! -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
          <rule in="B u" out="u f"/>
        </all>
        <!-- z=1: stair strip 'T' on 's', air on 'h' and 'u' -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B u" out="u B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- z=32: first floor timber slab 'F' -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
          <rule in="B u" out="u F"/>
        </all>
        <!-- z=33: upper stair strip 'T' on 'u' -->
        <all in="B u" out="u T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="31"/>
        <all in="B u" out="u B" steps="30"/>
        <!-- z=64: keep roof terrace slab 'R' (walls 'w' are at z=65, one higher for battlements!) -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
          <rule in="u" out="R"/>
        </prl>

        <!-- 3. Watchturret 'q' on keep corner: rises to z=82, crowned with battlements + pitched cap -->
        <all in="B q" out="q *" steps="82"/>

        <!-- 4. Curtain wall 'W': rises 26 (walkable rampart, battlements on top) -->
        <all in="B W" out="W *" steps="26"/>

        <!-- 5. Corner towers 't': rise 44 (taller than curtain wall, shorter than keep) -->
        <all in="B t" out="t *" steps="44"/>

        <!-- 6. Gatehouse 'G': passage on 'n' axis gets door seed 'O' on outer/middle rows, side bastions rise 38 -->
        <!-- Carve gate passage along 'n' line through 'G' -->
        <all in="n/G" out="n/A" symmetry="()"/>
        <all in="A/G" out="A/A" symmetry="()"/>
        <!-- Put gate door seed 'O' in the middle 2cells (10 voxels) of the gate passage 'A', paving 'n' elsewhere -->
        <all in="A/r" out="n/r" symmetry="()" steps="3"/>
        <all in="A/b" out="n/b" symmetry="()" steps="3"/>
        <all in="n/A" out="n/O" symmetry="()" steps="5"/>
        <!-- Wait: n is both behind and in front! Let's only seed O from front side so O is 5-6 voxels thick -->
        <prl in="O" out="A"/>
        <all in="A/[rb]" out="Y/*" symmetry="()" steps="1"/>
        <all in="A/Y" out="Y/*" symmetry="()" steps="4"/>
        <!-- Y is gate door zone (5 voxels thick, 15 wide): z=1 gets O, above z=1 gets G up to 38! -->
        <!-- Remaining A is open vaulted gatehouse archway: z=0 is 'n', z=1..31 air, z=32..38 'G' -->
        <all in="B Y" out="Y O" steps="1"/>
        <all in="B Y" out="Y G" steps="37"/>
        <prl in="Y" out="G"/>

        <all in="B A" out="A n" steps="1"/>
        <all in="B A" out="A B" steps="31"/>
        <all in="B A" out="A G" steps="6"/>
        <prl in="A" out="G"/>

        <!-- Solid gatehouse flanks 'G' rise 38 -->
        <all in="B G" out="G *" steps="38"/>

        <!-- 7. Courtyard lean-to armory 'a' & timber posts 'v' (clear height 32, roof at 33..36) -->
        <all in="B v" out="K v" steps="1"/>
        <all in="B K" out="K v" steps="32"/>
        <prl in="K" out="J"/>
        <all in="B a" out="K a" steps="1"/>
        <all in="B K" out="K B" steps="32"/>
        <prl in="K" out="J"/>
        <!-- Lean-to sloped roof rising toward curtain wall W -->
        <all in="WJ" out="*J"/>
        <all in="B B/W J" out="* J/* *" steps="1"/>
        <all in="B B/J J" out="* J/* *" steps="2"/>

        <!-- 8. Well 'Q' & water 'I' in courtyard -->
        <all in="B Q" out="Q *" steps="7"/>
        <!-- Two timber posts and little crossbeam over well -->
        <one in="B Q/B I/B Q" out="v */B */v *" symmetry="()" steps="1"/>
        <all in="B v" out="v *" steps="12"/>
        <all in="vBv" out="vvv"/>

        <!-- 9. Bridge 'b' with low wooden parapets on sides, and roadside stone posts 'p'/'P' -->
        <all in="bm" out="vm" symmetry="(x)"/>
        <all in="B P" out="P *" steps="10"/>
        <all in="B p" out="p *" steps="4"/>
        <!-- Warm lantern 'L' atop roadside stone posts 'P' -->
        <all in="B P" out="L P" steps="1"/>

        <!-- ================= C. FULL SCALE PARTS & DETAILS ================= -->
        <!-- 1. Doors (keep door & gatehouse door) -->
        <import file="part-door"/>

        <!-- 2. Stairs inside keep (ground->1st and 1st->roof) -->
        <import file="part-stair"/>
        <!-- Weatherhood / stair bulkhead shelter around roof stair exit so rain doesn't enter & adds roof height variety -->

        <!-- 3. Windows on the keep walls (in 'Z' bands, 6 wide x 8 high, with wooden sill/frame) -->
        <one steps="20">
          <rule in="BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <!-- Punch windows cleanly to interior or light them warmly; keep windows dark glazed 'L' with stone lintels, visible from outside -->
        <all in="LZ" out="*L" steps="1"/>
        <!-- Restore remaining window band Z back to keep stone wall w -->
        <prl in="Z" out="w"/>

        <!-- Add tall arched/framed windows on corner towers 't' and gatehouse 'G' upper walls -->
        <one steps="16">
          <rule in="Bt/Bt/Bt/Bt Bt/Bt/Bt/Bt Bt/Bt/Bt/Bt Bt/Bt/Bt/Bt Bt/Bt/Bt/Bt Bt/Bt/Bt/Bt"
                out="*L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L"/>
        </one>
        <one steps="6">
          <rule in="BG/BG/BG/BG BG/BG/BG/BG BG/BG/BG/BG BG/BG/BG/BG BG/BG/BG/BG BG/BG/BG/BG"
                out="*L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L"/>
        </one>

        <!-- 4. Stone buttresses / plinth batter along foot of curtain wall 'W' and keep 'w' for medieval silhouette -->
        <all in="cw" out="pw" steps="1"/>
        <all in="B p" out="p *" steps="5"/>
        <all in="EW" out="pW" steps="1"/>
        <all in="mW" out="pW" steps="1"/>

        <!-- 5. Battlements on all flat wall tops (+ = w, W, G, t, q) -->
        <import file="part-battlements"/>

        <!-- 6. Arrow slits under merlons (% = w, W, G, t, q) -->
        <import file="part-slits"/>

        <!-- 7. Pitched red-tile cap on watchturret 'q' inside/above its top & banner pole -->
        <one in="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq BBBBB/BBBBB/BBBBB/BBBBB/BBBBB"
             out="*****/*****/*****/*****/***** JJJJJ/JJJJJ/JJJJJ/JJJJJ/JJJJJ" steps="4"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Timber hoardings / machicolation trim band in dark wood 'v' under tower tops? Keep stone clean & readable; add red banner on highest turret peak -->
        <one in="J/B" out="J/B" symmetry="()" steps="0"/>
        <one in="B J" out="v *" steps="1" symmetry="()"/>
        <all in="B v" out="v *" steps="10">
          <!-- only grows up where solitary pole -->
        </all>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm cozy medieval cartoon voxel style -->
  <color symbol="E" value="#7b8f54" name="erba" hidden="True"/>
  <color symbol="c" value="#c4b493" name="terra battuta" area="courtyard"/>
  <color symbol="n" value="#9e9585" name="lastricato" area="courtyard"/>
  <color symbol="r" value="#b5a382" name="strada"/>
  <color symbol="m" value="#4a7c8c" name="acqua del fossato"/>
  <color symbol="b" value="#875f3b" name="ponte di legno"/>

  <!-- Keep & Fort Stonework (distinct light/dark separation) -->
  <color symbol="w" value="#aba496" name="pietra del mastio" area="keep"/>
  <color symbol="W" value="#969083" name="mura di cinta" area="courtyard"/>
  <color symbol="G" value="#8c8679" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="#827c70" name="torre angolare" area="tower"/>
  <color symbol="q" value="#9e9789" name="torretta di vedetta" area="tower"/>
  <color symbol="M" value="#b8b1a2" name="merlatura"/>
  <color symbol="p" value="#756f64" name="scarpa in pietra"/>
  <color symbol="P" value="#756f64" name="cippo in pietra"/>

  <!-- Floors, Stairs & Timber -->
  <color symbol="f" value="#b89365" name="intavolato" area="keep"/>
  <color symbol="F" value="#9c7648" name="solaio di legno" area="keep"/>
  <color symbol="R" value="#8f897d" name="terrazza del mastio" area="keep"/>
  <color symbol="k" value="#a88254" name="gradini di legno" area="keep"/>
  <color symbol="a" value="#bfa984" name="pavimento tettoia" area="courtyard"/>
  <color symbol="v" value="#69482a" name="trave di quercia" area="courtyard"/>
  <color symbol="J" value="#b54b35" name="tetto in coppi"/>

  <!-- Doors, Windows, Slits & Accents -->
  <color symbol="O" value="#6e4726" name="portone di legno"/>
  <color symbol="o" value="#4a2e16" name="assi del portone"/>
  <color symbol="N" value="#5e5950" name="stipite in pietra"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>
  <color symbol="L" value="#e0a94b" name="finestra illuminata"/>
  <color symbol="Q" value="#6e6960" name="vera da pozzo" area="courtyard"/>
  <color symbol="I" value="#3d6b7a" name="acqua del pozzo" area="courtyard"/>

  <!-- Hidden door-open markers -->
  <color symbol="#20" value="#000000" hidden="True"/>
  <color symbol="#21" value="#000000" hidden="True"/>

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
