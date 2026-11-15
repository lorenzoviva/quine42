# model.sculpt · claude-sonnet-5-5 · 38 s · 1 immagini

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

Your program:
<!--
FATTORIA (a farm), composition on the plan (a cell is 5 voxels)

PARTS, LETTERS, POSITIONS
- Farmhouse (h floor, w wall, H centre): the main volume, 9 cells clear inside, 3 cells behind the centre and 5 or 6 in front (the seed decides). Two storeys, hip roof, chimney.
- Stair zone (s): back-left corner of the house, 2 cells of landing, then 4 cells climbing toward +x.
- Door (d, 3 cells) in the front wall on the axis of H, with a porch (p, 3 x 2) in front of it, then the road (r) straight to the edge.
- Lean-to (a): against one side wall of the house, 4 cells deep, 7 long. The seed decides the side and the place along the wall.
- Hay (Y): 3 x 3 against the back wall.
- Barn (q wall, g floor): HUGE and larger only. Flush with the back-right corner of the house, behind it, 6 x 6 clear inside, with a door through the shared wall.
- Yard (c): a ring around everything built. Where six cells of ground go on it grows four more.
- Fence (x): a ring beyond the yard, with the gap of the road.
- Well (Q): in 5 x 5 of yard, so only where the yard is wide.
- Trees (t): in free 3 x 3 lawn, up to six.
- Orchard (n with t) and fields (u): GARGANTUAN only.

WHAT THE SEEDS CHANGE
- Depth of the house, side and place of the lean-to, place of the hay at the small size, place of the trees, which fence sides take the orchard and the fields.

WHAT FITS
- LARGE (20 cells): house + porch + lean-to + hay + thin yard + fence + a few trees.
- HUGE (30): adds the barn, the wide yard and the well.
- GARGANTUAN (40): adds the orchard and the fields.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdprasqgYmcxtQune" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one in="EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/wwwwwwwwE" out="qqqqqqqq*/qggggggq*/qggggggq*/qggggggq*/qggggggq*/qggggggq*/qggggggq*/*********" symmetry="()" steps="1"/>

      <one in="EEE/EEE/EEE/www" out="YYY/YYY/YYY/***" symmetry="()" steps="1"/>

      <one in="Ew/Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/**/a*/**/**/**" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="[pr]/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>

      <all in="[wqaYp]E" out="*c"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="cEE" out="*x*"/>
      <all in="xE/*x" out="*x/**"/>

      <one in="xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE" out="*nnnnnnn/*ntnntnn/*nnnnnnn/*nnnnnnn/*nnnnnnn/*ntnntnn/*nnnnnnn" steps="1"/>
      <one in="xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE" out="*uuuuuu/*uuuuuu/*uuuuuu/*uuuuuu/*uuuuuu" steps="2"/>

      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <one in="EEE/EEE/EEE" out="eee/ete/eee" steps="6"/>
      <prl in="e" out="E"/>
    </sequence>

    <map scale="5 5 1" values="BEHhwdprasqgYmcxtQuneWUFRLTkOoNVAJKZGy" symmetry="()">
      <union symbol="+" values="WUV"/>
      <union symbol="=" values="hsFg"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="e" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="m" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="EEEEE/EtttE/EtttE/EtttE/EEEEE"/>
      <rule in="Q" out="QQQQQ/QcccQ/QcccQ/QcccQ/QQQQQ"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <sequence symmetry="(xy)">
        <!-- door seeds at z=0: the barn door through the shared wall (11 wide), then the front door -->
        <one in="g/w/w/w/w/w/h" out="*/O/O/O/O/O/*" symmetry="()" steps="1"/>
        <all in="Ow" out="*O" symmetry="(x)" steps="5"/>
        <all in="d/p" out="O/*" symmetry="()" steps="1"/>
        <all in="d/O" out="O/*" symmetry="()" steps="4"/>

        <!-- house walls: 64 high, two bands for windows -->
        <all in="B w" out="w W" steps="1"/>
        <all in="B O" out="w O" steps="1"/>
        <all in="B w" out="w W" steps="5"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- house floors, stair strip, slab, ceiling -->
        <all steps="1"><rule in="B h" out="h h"/><rule in="B s" out="s s"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- the barn: 40 high -->
        <all in="B q" out="q V" steps="6"/>
        <all in="B q" out="q U" steps="14"/>
        <all in="B q" out="q V" steps="20"/>
        <prl in="q" out="A"/>
        <all in="B g" out="g g" steps="1"/>
        <all in="B g" out="g B" steps="39"/>
        <prl in="g" out="A"/>

        <!-- the lean-to: a roof at 34, three thick, against the wall -->
        <all in="B a" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B J" out="J J" steps="2"/>

        <!-- hay, fence, well -->
        <all in="B Y" out="Y Y" steps="12"/>
        <all in="B x" out="x x" steps="8"/>
        <all in="B Q" out="Q Q" steps="8"/>

        <!-- trees: trunk, then a crown that spreads -->
        <all in="B t" out="t Z" steps="6"/>
        <all in="B t" out="t G" steps="8"/>
        <prl in="t" out="G"/>
        <all in="BG" out="*G" steps="2"/>

        <!-- the roofs: hip roofs, a slope of one in two -->
        <all steps="14">
          <rule in="*****/*****/**B**/*****/***** RRRRR/RRRRR/RRRRR/RRRRR/RRRRR" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" symmetry="()"/>
          <rule in="*****/*****/**B**/*****/***** AAAAA/AAAAA/AAAAA/AAAAA/AAAAA" out="*****/*****/**A**/*****/***** *****/*****/*****/*****/*****" symmetry="()"/>
        </all>

        <!-- the parts -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- the chimney -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- windows in the bands -->
        <one steps="28"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="6E8B4E" name="terra"/>
  <color symbol="H" value="D2B48C" name="focolare" area="house"/>
  <color symbol="h" value="B98A5A" name="pavimento" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro" area="house"/>
  <color symbol="W" value="EADFC4" name="intonaco"/>
  <color symbol="U" value="D9CBA6" name="fascia"/>
  <color symbol="L" value="6FA8C9" name="finestra"/>
  <color symbol="F" value="8A6A44" name="solaio"/>
  <color symbol="R" value="B5513A" name="tetto"/>
  <color symbol="A" value="8E3B2C" name="tetto del fienile"/>
  <color symbol="V" value="A9573F" name="muro del fienile"/>
  <color symbol="J" value="6B4A2E" name="tettoia in legno"/>
  <color symbol="K" value="5E5A55" name="camino"/>
  <color symbol="Z" value="5A3B22" name="tronco"/>
  <color symbol="G" value="3E7A3B" name="chioma"/>
  <color symbol="y" value="FF00FF" name="segno tettoia"/>
  <color symbol="T" value="FF00FF" name="traccia scala"/>
  <color symbol="k" value="9C8F7A" name="gradino"/>
  <color symbol="O" value="7B4A2A" name="porta"/>
  <color symbol="o" value="4A2C18" name="assi della porta"/>
  <color symbol="N" value="5C4630" name="stipite"/>
  <color symbol="d" value="7B4A2A" name="porta" area="house"/>
  <color symbol="p" value="A67B5B" name="portico" area="porch"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="a" value="8B5A2B" name="tettoia" area="leanto"/>
  <color symbol="s" value="9C8F7A" name="scala" area="house"/>
  <color symbol="q" value="B5513A" name="muro del fienile base" area="barn"/>
  <color symbol="g" value="D8B66A" name="fienile" area="barn"/>
  <color symbol="Y" value="E3C14E" name="fieno" area="hay"/>
  <color symbol="m" value="FFFFFF" name="traccia"/>
  <color symbol="c" value="CDBB8E" name="aia" area="yard"/>
  <color symbol="x" value="7A5232" name="staccionata" area="fence"/>
  <color symbol="t" value="3E7A3B" name="albero" area="orchard"/>
  <color symbol="Q" value="7D8791" name="pozzo" area="well"/>
  <color symbol="u" value="8F6B3F" name="campo" area="field"/>
  <color symbol="n" value="8DB26A" name="frutteto" area="orchard"/>
  <color symbol="e" value="FF00FF" name="segno"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: Il cortile interno appare vuoto e privo di elementi caratteristici.; Le finestre sul prospetto principale hanno un allineamento poco uniforme.
Advice: Aggiungere dettagli rurali come balle di fieno o steccati nel cortile.; Riordinare la disposizione delle aperture sulla facciata frontale.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, p portico, r strada, a tettoia, Y fieno, c aia, x staccionata, Q pozzo, W intonaco, F solaio, R tetto, L finestra, k gradino, O porta, o assi della porta, N stipite, V muro del fienile, A tetto del fienile, J tettoia in legno, K camino, Z tronco, G chioma
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEE
EEGEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEE
EEEEEEExcccccccccccccccccccccccccccccccccccxxEEEEE
EEEEEEExcccccccccccccccccccccccccccccccccccxxEEEEE
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEGEE
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE
EEGEEEExcccccccccYYYYYAAAAAAAAAAAAAccccQcccxxEEEEE
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJccxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEGEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE
EEEEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE
EEEEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE
EEEEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEGEE
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE
EEEEEEExxccccccccccccccrrrrrcccccccccccccccxxEEEEE
EEEEEEExxxxxxxxxxxxxxxxrrrrrxxxxxxxxxxxxxxxxxEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00400022222222222222222222222222222222222222200000
00400022222222222222222222222222222222222222200000
00000022200000000000000000000000000000000002200000
000000222000000000000cccccccccccccc000000002200000
000000222000000000000cccccccccccccc000000002200000
000000222000000000000ccddddddddddcc000000002200000
000000222000000000000ccddddddddddcc000000002200000
000000222000000000000ccddddddddddcc000000002200400
000000222000000000000ccdddeeeeeddcc000000002200400
000000222000000000000ccdddeeeeeddcc000000002200000
000000222000000033333ccdddeeeeeddcc000000002200000
000000222000000033333ccddddddddddcc000000002200000
004000222000000033333ccddddddddddcc000220002200000
004000222000000033333ccddddddddddcc000220002200000
000000222000000033333cccccccccccccc000000002200000
0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
0000002220000000jjkkkkkkkkkkkkkkkjj000000002200000
0000002220000000jjkkkkkkkkkkkkkkkjj000000002200000
0000002220000000jjkklllllllllllkkjj000000002200000
0000002220000000jjkklllllllllllkkjjbbbbbbb02200000
0000002220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
0004402220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
0004402220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
0000002220000000jjkkllmmmnnmmllkkjjbbbbbbb02200000
0000002220000000jjkkllmmmmqmmllkkjjbbbbbbb02200000
0000002220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
0040002220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
0040002220000000jjkklllllllllllkkjjbbbbbbb02200000
0000002220000000jjkklllllllllllkkjjbbbbbbb02200000
0000002220000000jjkkkkkkkkkkkkkkkjjbbbbbbb02200000
0000002220000000jjkkkkkkkkkkkkkkkjjbbbbbbb02200000
0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200400
00000022200000000000000000000000000000000002200400
00000022200000000000000000000000000000000002200000
00000022222222222222222200002222222222222222200000
00000022222222222222222200002222222222222222200000
00000022222222222222222200002222222222222222200000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.........................RR.......................
.......................RRRRRR.....................
.....................RRRRRRRRRR...................
...................RRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................LLLLWLLWWWWWWWWWWW...............
.................LLLLWLLWWWWLLWWWWW...............
.................WWWWWWLWWWWLLWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWWJJJJJJ.........
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWNooooOWWWWWW...............
.................WWWWWWNooooOWWWWWW...............
.................WWWWWWNooooOWWWWWW...............
.................WWWWWWNooooOWWWWWW...............
.................WWWWWWNooooOWWWWWW...............
..G.G............WWLWWWNooooOWWWWWW............G..
..G.G............WWLLWWNooooOWWWWWW............G..
..G.G..xxxxxxxxxxxxxxxxxooooxxxxxxxxxxxxxxxxx..G..
..Z.Z..xxxxxxxxxxxxxxxxxooooxxxxxxxxxxxxxxxxx..Z..
..ZEZ.Exxxxxxxxxxxxxxxxrooooxxxxxxxxxxxxxxxxx..Z..
```
Right side (looking from the right):
```
..........................RRR.....................
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
...................RRRRRRRRRRRRRRRRR..............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................LLWWWWWWWLWWWWWWWWW.............
...........AAA....LLLLLLLWLLWWWWWWWWW.............
.........AAAAAAA..LLLLLLLWLLWWWWWWWWW.............
.......AAAAAAAAAAAWWWLWWLWWWWWWWWWWWW.............
.......VVVVVVVVVVVWWWWWWWWWWWWWWWWWWW.............
.......VVVVVVVVVVVWWWWWWJJJJJJJJJJJWW.............
.......VVVVVVVVVVVWWWWWWWWWWWWWWWWWWW.............
.......VVVVVVVVVVVWWWWWWWWWWWWWWWWWWW.............
.......VVVVVVVVVVVWWWWWWWWWWWWWWWWWWW.............
.......VVVVVVVVVVVWWWWWWWWWWWWWWWWWWW.............
.......WLLWWWWWWWWWWWWWWWWWWWWWWWWWWW.............
.......WLLWWWWWWWWWWWWWWWWWWWWLLLLWWW.............
....G..WLLGLLWWWWWWLLLWWWWWWWWLLLLLWW.......G.....
....G..WWWGLLWWWWWWLLLWWWWWWWWWLLLLWW.......G.....
...xxxxxxxGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxGxxx..
...xxxxxxxZxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxZxxx..
...xxxxxxxZxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxZxxxE.
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..G...............................................
..................................................
..................................................
......................WWWWWLLWWWWWW...............
......................WW.........WW...............
......................L..........WW...............
......................W..........WW............G..
......................W..........LL...............
......................L..........LL...............
.................YYYYYW..........WW...............
.................YYYYYW..........WW...............
..G..............YYYYYW..........WW...............
.................YYYYYW..........WW...............
.................YYYYYW..........WW...............
.................WWWWWWWWWLLooooWWW...............
.................WWWWWWWWWWLooooWWW...............
.................W.....kkkk......LL...............
.................W.....kkkk......LL...............
.................L.....kkkk......WW...............
.................L...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................L...............WW...............
.................L...............WW...............
..G..............W...............LL...............
.................W...............LL...............
.................W...............LL...............
.................W...............LL...............
.................W...............LL...............
.................WWLLWWoooooNWWWWWW...............
.................WWLLWWoooooNWWWWWW...............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
...............................................G..
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
..................................................
..................................................
........................AAAAAAAAA.................
........................AAAAAAAAA.................
........................AAAAAAAAA.................
........................AAAAAAAAA.................
........................AAAAAAAAA.................
........................AAAAAAAAA.................
........................AAAAAAAAA.................
..................................................
..................................................
.................WWWWWWWLLWWLLWWWWW...............
.................WWWWWWWLLWWLLWWWWW...............
.................W...............LL...............
.................W...............LL...............
.................W...............LL...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................WWLLWLLWWWWLLWWWWW...............
.................WLLLWLLWWWWLLWWWWW...............
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
........................RRRR......................
........................RRRR......................
........................RRRR......................
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
EEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEE   00044022222222222222222222222222222222222222200000
EEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEE   00044022222222222222222222222222222222222222200000
EEEEEEExcccccccccccccccccccccccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccccccccccccccccccccccxxEEEEE   000000222000000000000cccccccccccccc000000002200000
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000000000cccccccccccccc000000002200000
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000000000ccddddddddddcc000000002200400
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEGEE   000000222000000000000ccddddddddddcc000000002200400
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000000000ccddddddddddcc000000002200000
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000000000ccdddeeeeeddcc000000002200000
EEGEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   004000222000000000000ccdddeeeeeddcc000000002200000
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333ccdddeeeeeddcc000000002200000
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333ccddddddddddcc000000002200000
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333ccddddddddddcc000000002200000
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333ccddddddddddcc000000002200000
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333cccccccccccccc000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkkkkkkkkkkkkkkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkkkkkkkkkkkkkkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkklllllllllllkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkklllllllllllkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkkllmmmmmmmllkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkkllmmmmmmmllkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkkllmmmmmmmllkkjj000000002200000
EEGEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0040002220bbbbbbjjkkllmmmnnmmllkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkkllmmmmmmmllkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkkllmmmmmmmllkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkkllmmmmmmmllkkjj000000002200000
EEEEEEExccJJJJJJJRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220bbbbbbjjkklllllllllllkkjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjkklllllllllllkkjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjnkkkkkkkkkkkkkkjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjkkkkkkkkkkkkkkkjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0004402220000000jjjjjjjjjjjjjjjjjjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0004402220000000jjjjjjjjjjjjjjjjjjj000000002200000
EEEEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000002220000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000002220000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00400022200000000000000000000000000000000002200000
EEGEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00400022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExxccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEExxxxxxxxxxxxxxxxrrrrrxxxxxxxxxxxxxxxxxEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEE   00000022222222222222222222222222222222222222200000
EEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEE   00000022222222222222222222222222222222222222200000
EEEEEEExcccccccccccccccccccccccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccccccccccccccccccccccxxEEEEE   000000222000000000000cccccccccccccc000000002200000
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEGEE   000000222000000000000cccccccccccccc000000002200400
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000000222002220000000ccddddddddddcc000000002200000
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000000222002220000000ccddddddddddcc000000002200000
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000000000ccddddddddddcc000000002200000
EEEEEEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000000000ccdddeeeeeddcc000000002200000
EEEEGEExccccccccccccccAAAAAAAAAAAAAccccccccxxEEEEE   000440222000000000000ccdddeeeeeddcc000000002200000
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333ccdddeeeeeddcc000000002200000
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333ccddddddddddcc000000002200000
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEGEE   000000222000000033333ccddddddddddcc000000002200400
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333ccddddddddddcc000000002200400
EEEEEEExcccccccccYYYYYAAAAAAAAAAAAAccccccccxxEEEEE   000000222000000033333cccccccccccccc000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jjkkkkkkkkkkkkkkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jjkkkkkkkkkkkkkkkjjbbbbbbb02200000
EEGEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0040002220000000jjkklllllllllllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jjkklllllllllllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jjkkllmmmnnmmllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0000002220000000jmkkllmmmmmmmllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJJcxxEEEEE   0004402220000000jjkkllmmmmmmmllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRJJJJJJccxxEEEEE   0004402220000000jjkklllllllllllkkjjbbbbbbb02200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjkklllllllllllkkjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjkkkkkkkkkkkkkkkjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjkkkkkkkkkkkkkkkjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
EEEEEEExcccccccccRRRRRRRRRRRRRRRRRRccccccccxxEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjj000000002200000
EEEEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE   00400022200000000000000000000000000000000002200000
EEGEEEExcccccccccccccccpppppcccccccccccccccxxEEEEE   00400022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExcccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEExxccccccccccccccrrrrrcccccccccccccccxxEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEExxxxxxxxxxxxxxxxrrrrrxxxxxxxxxxxxxxxxxEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.08 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 123 nodi, 596 passi, finito in 814 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=terra, h=pavimento, w=muro, d=porta, p=portico, r=strada, a=tettoia, s=scala, q=muro del fienile base, g=fienile, Y=fieno, m=traccia, c=aia, x=staccionata, t=albero, Q=pozzo, e=segno, W=intonaco, U=fascia, F=solaio, R=tetto, L=finestra, T=traccia scala, k=gradino, O=porta, o=assi della porta, N=stipite, V=muro del fienile, A=tetto del fienile, J=tettoia in legno, K=camino, Z=tronco, G=chioma, y=segno tettoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 60698, x 20925, R 17439, V 13000, c 7309, E 6846, A 6640, L 5672, F 3690, o 3660, Y 2925, k 2720, J 2100, N 730, a 700, G 486, r 450, Z 324, O 240, p 150, Q 144, K 11.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-36 all×21, one×6, prl×2: 747 celle x0-29 y1-29 z0, passi 2-76
   #38 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 77
#40-47 one×1, all×7: 40000 celle x50-104 y55-109 z0-20, passi 78-109
#48-49 all×2: 36000 celle x50-104 y55-109 z20-38, passi 110-127
    #50 all . w → w U passi=14: ×14, 28000 celle x50-104 y55-109 z38-52, passi 128-141, w→U 14000, .→w 14000
#51-54 all×3, prl×1: 27425 celle x50-104 y55-109 z1-64, passi 142-156
    #55 all . h → h . passi=31: ×31, 222650 celle x55-99 y60-104 z0-32, passi 157-187, h→. 111325, .→h 111325
#56-57 all×2: 19700 celle x55-99 y60-104 z2-33, passi 188-218
    #58 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-64, passi 219-249, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#59-61 prl×1, all×2: 24050 celle x55-104 y20-104 z0-64, passi 250-270
#62-64 all×2, prl×1: 21400 celle x65-104 y20-54 z1-40, passi 271-292
    #65 all . g → g . passi=39: ×39, 138600 celle x70-99 y25-54 z0-40, passi 293-331, g→. 69300, .→g 69300
#66-67 prl×1, all×1: 2500 celle x70-124 y25-104 z1-40, passi 332-333
    #68 all . y → y . passi=33: ×33, 46200 celle x105-124 y70-104 z1-34, passi 334-366, y→. 23100, .→y 23100
#69-78 prl×2, all×7: 41823 celle x6-143 y10-144 z0-77, passi 367-425
#85-122 all×15, prl×4, one×2: 27173 celle x50-104 y20-109 z0-87, passi 426-595
    #123 prl U → W: ×1, 27228 celle x50-104 y20-109 z6-51, passi 596, U→W 27228
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#32 one xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE/xE… → *nnnnnnn/*ntnntnn/*nnnnnnn/*nnnnnnn/*nnnnnnn/*n… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#33 one xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE → *uuuuuu/*uuuuuu/*uuuuuu/*uuuuuu/*uuuuuu passi=2: le celle cercate c'erano, ma mai disposte come nel pattern
#77 all .G → *G passi=2: le celle cercate c'erano, ma mai disposte come nel pattern
#80 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#81 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#82 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#83 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#84 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#90 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#91 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#92 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
… e altri 13
Improve it: answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdprasqgYmcxtQune" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one in="EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/wwwwwwwwE" out="qqqqqqqq*/qggggggq*/qggggggq*/qggggggq*/qggggggq*/qggggggq*/qggggggq*/*********" symmetry="(x)" steps="1"/>

      <one in="EEE/EEE/EEE/www" out="YYY/YYY/YYY/***" symmetry="()" steps="1"/>

      <one in="Ew/Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/**/a*/**/**/**" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="[pr]/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>

      <all in="[wqaYp]E" out="*c"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="cEE" out="*x*"/>
      <all in="xE/*x" out="*x/**"/>

      <one in="xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE/xEEEEEEE" out="*nnnnnnn/*ntnntnn/*nnnnnnn/*nnnnnnn/*nnnnnnn/*ntnntnn/*nnnnnnn" steps="1"/>
      <one in="xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE" out="*uuuuuu/*uuuuuu/*uuuuuu/*uuuuuu/*uuuuuu" steps="2"/>

      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccc/ccc/ccc" out="***/*Y*/***" steps="4"/>

      <one in="EEE/EEE/EEE" out="eee/ete/eee" steps="6"/>
      <prl in="e" out="E"/>
    </sequence>

    <map scale="5 5 1" values="BEHhwdprasqgYmcxtQuneWUFRLTkOoNVAJKZGy" symmetry="()">
      <union symbol="+" values="WUV"/>
      <union symbol="=" values="hsFg"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="e" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="m" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="EEEEE/EtttE/EtttE/EtttE/EEEEE"/>
      <rule in="Q" out="QQQQQ/QcccQ/QcccQ/QcccQ/QQQQQ"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <sequence symmetry="(xy)">
        <one in="g/w/w/w/w/w/h" out="*/O/O/O/O/O/*" symmetry="()" steps="1"/>
        <all in="Ow" out="*O" symmetry="(x)" steps="5"/>
        <all in="d/p" out="O/*" symmetry="()" steps="1"/>
        <all in="d/O" out="O/*" symmetry="()" steps="4"/>

        <all in="B w" out="w W" steps="1"/>
        <all in="B O" out="w O" steps="1"/>
        <all in="B w" out="w W" steps="5"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <all steps="1"><rule in="B h" out="h h"/><rule in="B s" out="s s"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <all in="B q" out="q V" steps="6"/>
        <all in="B q" out="q U" steps="14"/>
        <all in="B q" out="q V" steps="20"/>
        <prl in="q" out="A"/>
        <all in="B g" out="g g" steps="1"/>
        <all in="B g" out="g B" steps="39"/>
        <prl in="g" out="A"/>

        <all in="B a" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B J" out="J J" steps="2"/>

        <all in="B Y" out="Y Y" steps="12"/>
        <all in="B x" out="x x" steps="8"/>
        <all in="B Q" out="Q Q" steps="8"/>

        <all in="B t" out="t Z" steps="6"/>
        <all in="B t" out="t G" steps="8"/>
        <prl in="t" out="G"/>
        <all in="BG" out="*G" steps="2"/>

        <all steps="14">
          <rule in="*****/*****/**B**/*****/***** RRRRR/RRRRR/RRRRR/RRRRR/RRRRR" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" symmetry="()"/>
          <rule in="*****/*****/**B**/*****/***** AAAAA/AAAAA/AAAAA/AAAAA/AAAAA" out="*****/*****/**A**/*****/***** *****/*****/*****/*****/*****" symmetry="()"/>
        </all>

        <import file="part-door"/>
        <import file="part-stair"/>

        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <one steps="28"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="6E8B4E" name="terra"/>
  <color symbol="H" value="D2B48C" name="focolare" area="house"/>
  <color symbol="h" value="B98A5A" name="pavimento" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro" area="house"/>
  <color symbol="W" value="EADFC4" name="intonaco"/>
  <color symbol="U" value="D9CBA6" name="fascia"/>
  <color symbol="L" value="6FA8C9" name="finestra"/>
  <color symbol="F" value="8A6A44" name="solaio"/>
  <color symbol="R" value="B5513A" name="tetto"/>
  <color symbol="A" value="8E3B2C" name="tetto del fienile"/>
  <color symbol="V" value="A9573F" name="muro del fienile"/>
  <color symbol="J" value="6B4A2E" name="tettoia in legno"/>
  <color symbol="K" value="5E5A55" name="camino"/>
  <color symbol="Z" value="5A3B22" name="tronco"/>
  <color symbol="G" value="3E7A3B" name="chioma"/>
  <color symbol="y" value="FF00FF" name="segno tettoia"/>
  <color symbol="T" value="FF00FF" name="traccia scala"/>
  <color symbol="k" value="9C8F7A" name="gradino"/>
  <color symbol="O" value="7B4A2A" name="porta"/>
  <color symbol="o" value="4A2C18" name="assi della porta"/>
  <color symbol="N" value="5C4630" name="stipite"/>
  <color symbol="d" value="7B4A2A" name="porta" area="house"/>
  <color symbol="p" value="A67B5B" name="portico" area="porch"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="a" value="8B5A2B" name="tettoia" area="leanto"/>
  <color symbol="s" value="9C8F7A" name="scala" area="house"/>
  <color symbol="q" value="B5513A" name="muro del fienile base" area="barn"/>
  <color symbol="g" value="D8B66A" name="fienile" area="barn"/>
  <color symbol="Y" value="E3C14E" name="fieno" area="hay"/>
  <color symbol="m" value="FFFFFF" name="traccia"/>
  <color symbol="c" value="CDBB8E" name="aia" area="yard"/>
  <color symbol="x" value="7A5232" name="staccionata" area="fence"/>
  <color symbol="t" value="3E7A3B" name="albero" area="orchard"/>
  <color symbol="Q" value="7D8791" name="pozzo" area="well"/>
  <color symbol="u" value="8F6B3F" name="campo" area="field"/>
  <color symbol="n" value="8DB26A" name="frutteto" area="orchard"/>
  <color symbol="e" value="FF00FF" name="segno"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
