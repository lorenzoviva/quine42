# model.sculpt · claude-opus-5-5 · 42 s · 1 immagini

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
  Fattoria (farm).
  Parts and letters on the plan:
    H  the centre of the house; h the floor of the house; w the walls of the house (two storeys).
    s  the stair zone inside the house, along the back wall.
    a  the floor of the barn wing; v its walls (lower, under its own hip roof).
    The barn stands against one side of the house; the seed picks the side and the place along it.
    d  the front door, three cells wide, in the middle of the front wall.
    r  the road, from the door straight to the edge.
    g  the farmyard lawn, a ring around house and barn; it grows deeper where the ground goes on.
    x  the fence posts around the yard.
    Q  the haystacks in the yard, only where a 5 x 5 window of lawn fits.
    t  the trees of the orchard beyond the fence, only where 7 x 7 of free ground fits.
  What the seeds change: the depth of the house, the side of the barn and its place, the hay and the trees.
  What fits: Large the house and barn; Huge a fenced yard with hay; Gargantuan also the orchard.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavdrmgxQt" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one symmetry="()" steps="1">
        <rule in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**"/>
        <rule in="wE/wE/wE/wE/wE" out="**/**/*a/**/**"/>
      </one>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wv]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEEE" out="*ggg****" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="3"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>
    </sequence>
    <map scale="5 5 1" values="BEhswavrgxQtWULfFRTkONoVPiXZYC" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="ggggg/ggggg/ggxgg/ggggg/ggggg"/>
      <rule in="Q" out="ggggg/gQQQg/gQQQg/gQQQg/ggggg"/>
      <rule in="t" out="EEEEE/EEEEE/EEYEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <!-- house walls, two storeys with window bands -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- house floors, stair strip, slab, ceiling -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- barn -->
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="P"/>
        <all in="B a" out="i a" steps="1"/>
        <all in="B i" out="i B" steps="39"/>
        <prl in="i" out="P"/>
        <!-- fence posts, hay, trees -->
        <all in="B x" out="x X" steps="10"/>
        <prl in="x" out="X"/>
        <all in="B Q" out="Q Z" steps="11"/>
        <prl in="Q" out="Z"/>
        <all in="B Y" out="Y Y" steps="14"/>
        <all in="B Y" out="C *" steps="1"/>
        <all in="BC" out="CC" steps="3"/>
        <all in="B C" out="C *" steps="5"/>
        <!-- windows -->
        <one steps="24"><rule in="BU/BU/BU BU/BU/BU BU/BU/BU BU/BU/BU" out="*L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <all in="PB" out="*P" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **P**/**P**/PPPPP/**P**/**P**" out="*****/*****/**P**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <!-- the door -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="FF0000" name="centro"/>
  <color symbol="h" value="C8A878" name="pavimento di casa" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro di casa"/>
  <color symbol="s" value="8A6A48" name="zona della scala" area="house"/>
  <color symbol="a" value="B89868" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="A04030" name="muro del fienile"/>
  <color symbol="d" value="5A3A20" name="porta"/>
  <color symbol="r" value="B0A080" name="strada"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="g" value="8AA858" name="aia" area="yard"/>
  <color symbol="x" value="7A5A38" name="steccato"/>
  <color symbol="Q" value="D8C060" name="covone"/>
  <color symbol="t" value="4A7A38" name="albero" area="orchard"/>
  <color symbol="W" value="E8DCC0" name="intonaco"/>
  <color symbol="U" value="E8DCC0" name="intonaco"/>
  <color symbol="L" value="7AA8C8" name="vetro della finestra"/>
  <color symbol="f" value="B08858" name="assi del pavimento" area="house"/>
  <color symbol="F" value="9A7850" name="solaio"/>
  <color symbol="R" value="8A4A38" name="tegole di casa"/>
  <color symbol="T" hidden="True"/>
  <color symbol="k" value="6A4A30" name="gradino"/>
  <color symbol="O" value="7A4A28" name="porta di legno"/>
  <color symbol="o" value="4A2A18" name="assi della porta"/>
  <color symbol="N" value="5A5048" name="stipite di pietra"/>
  <color symbol="V" value="A04030" name="tavole del fienile"/>
  <color symbol="P" value="6A6058" name="tetto del fienile"/>
  <color symbol="i" hidden="True"/>
  <color symbol="X" value="7A5A38" name="palo dello steccato"/>
  <color symbol="Z" value="E0C860" name="fieno"/>
  <color symbol="Y" value="5A3E28" name="tronco"/>
  <color symbol="C" value="5A8A40" name="chioma"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: Le finestre appaiono come piccoli blocchi sparsi e disordinati sulle pareti.; La proporzione tra l'altezza del tetto e il corpo dell'edificio è sbilanciata.
Advice: Raggruppa le finestre in cornici più ampie e definite.; Riduci l'altezza del tetto principale per armonizzare la silhouette.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, a pavimento del fienile, r strada, g aia, W intonaco, L vetro della finestra, f assi del pavimento, F solaio, R tegole di casa, k gradino, O porta di legno, N stipite di pietra, o assi della porta, V tavole del fienile, P tetto del fienile, X palo dello steccato, Z fieno
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEggggggggggggggggggggggggggggggggggEEEEEEE
EEEEEEEEgggggggggggggggggggggggggggggggggggEEEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggZgggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggZgggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggPPPPPPPgggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggPPPPPPPgggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEEgggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEEEggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrgggggggggggggggEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
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
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000033030330303303033030330303303033030000000
00000003000000000000000000000000000000000000300000
00000000000000000000000000000000000000000000000000
00000003000000000000000000000000000000000000300000
00000000000003300000000000000000000000000000000000
00000003000003300000000000000000000000000000300000
00000003000000000000000000000000000000000000300000
00000000000000000000000000000000000000000000000000
00000003000000000000000000000000000000330000300000
0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
0000000300000000jjjjjjjjjjjjjjjjjjjj00000000300000
0000000300000000jjkkkkkkkkkkkkkkkkjj00000000300000
0000000000000000jjkkkkkkkkkkkkkkkkjj00000000000000
0000000300003000jjkkllllllllllllkkjj00000000300000
0000000000000000jjkkllllllllllllkkjj00000000000000
0000000300000000jjkkllmmmmmmmmllkkjj00000000300000
0000000300000000jjkkllmmmmmmmmllkkjj00000000300000
0000000000000000jjkkllmmmmmmmmllkkjjcccccc00000000
0000000300000000jjkkllmmmmmmmmllkkjjcccccc00300000
0000000000000000jjkkllmmmmmmmmllkkjjcdddcc00000000
0000000300000000jjkkllmmmmmmmmllkkjjcdddcc00300000
0000000300000000jjkkllmmmmmmmmllkkjjcdddcc00300000
0000000000000000jjkkllllllllllllkkjjcdddcc00000000
0000000300000000jjkkllllllllllllkkjjcdddcc00300000
0000000000000000jjkkkkkkkkkkkkkkkkjjcdddcc00000000
0000000300000000jjkkkkkkkkkkkkkkkkjjcdddcc00300000
0000000300000000jjjjjjjjjjjjjjjjjjjjcdddcc00300000
0000000000000000jjjjjjjjjjjjjjjjjjjjcdddcc00000000
0000000300000000000000000000000000cccccccc00300000
0000000000000000000000000000000000cccccccc00000000
00000003000000000000000000000000000000000000300000
00000003000000000000000000000000000000000000300000
00000000000000000000000000000000000000000000000000
00000003000000000000000000000000000000000000300000
00000000000000000000000000000000000000000000000000
00000003000000000000000000000000000000000000300000
00000000033030330303303000000000000000000000300000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000330303303033030000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
........................RRR.......................
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWLWWLWWWLWWWWWWWW...............
.................WWWWWWWWWWWWWLWWWW...............
.................WWWWWWWWWWWWWWWWWW..PPP..........
.................WWWWWWWWWWWLWWWWWWPPPPPPP........
.................WWWWWWWWWWWWWWWWWWVVVVVVV........
.................WWWWWWWWWWWWWWWWWWVVVVVVV........
.................WWWWWWWWWWWWWWWWWWVVVVVVV........
.................WWWWWWNooooOWWWWWWVVVVVVV........
.................WWWWWWNooooOWWWWWWVVVVVVV........
.................WWWWWWNooooOWWWWWWVVVVVVV........
.................WWWWWWNooooOWWLWWWVVVVVVV........
.................WWWWWWNooooOWWLWWWVVVVVVV........
.................WWWWWWNooooOWWWWWWVVVVVVV........
............Z.Z..WWWWLWNooooOWWWWWWVVVVVVV........
............Z.X..WWWWLWNooooOWWWWWWVVVVVVV........
............Z.X..WWWWWWNooooOWWWWWWVVVVVVV........
.......E.EE.ZEEEEWWWWWWrooooEWWWWWWVVVVVVVE.E.....
```
Right side (looking from the right):
```
..........................RRR.....................
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWPPPPPPPPP.............
..................WWLWWWWWWPPPPPPPPPPP............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..............Z..ZWWWWWWWWWVVVVVVVVVVV............
..............X..ZWWWWWWWWWVVVVVVVVVVV............
..............X..ZWWWWWWWWWVVVVVVVVVVV............
.........EE.EEEE.ZWWWWWWWWWVVVVVVVVVVVEEE.E.EE.E..
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
.......................................Z..........
.................WWWWWLLWWWWWWWWLWW...............
.................WWWWWLLWWWWWWWWLWW...............
.................W.....kkkk......WW...............
.................W.....kkkk......WW...............
............Z....W.....kkkk......WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WWVVVVVVV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................WWWWWWoooooNWWWWWW.....VV........
.................WWWWWWoooooNWWWWWW.....VV........
...................................VVVVVVV........
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
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................WWWWWWWWWWLWWWWWWW...............
.................WWWWWWWWWWLWWWWWWW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW..PPP..........
.................W...............WW..PPP..........
.................W...............WW..PPP..........
.................W...............WW..PPP..........
.................W...............WW..PPP..........
.................W...............WW..PPP..........
.................W...............WW..PPP..........
.................WWWWWWWWWWWWWWWWWW..PPP..........
.................WWWWWWWWWWWWWWWWWW..PPP..........
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
........................RRRR......................
........................RRRR......................
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
```
### Seed 2: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEggggggggggggggggggggggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggggggggggggggggggEEEEEEE   00000000033030330303303033030330303303033030000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000003000030000000000000000000000
EEEEEEEgggggggggggggggZggggZgggggggggggggggggEEEEE   00000003000000000000003000030000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjjjjjjjjjjjjjjjjjjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkkkkkkkkkkkkkkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjkkkkkkkkkkkkkkkkjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkllllllllllllkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjkkllllllllllllkkjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllmmmmmmmmllkkjjcccccc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjjcccccc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllmmmmmmmmllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllllllllllllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkkkkkkkkkkkkkkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkkkkkkkkkkkkkkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjjjjjjjjjjjjjjjjjjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjjcdddcc00000000
EEEEEEEggggggggggggggggrrrrrgggggggPPPPPPPgggEEEEE   0000000300000000000000000000000000cccccccc00300000
EEEEEEEggggggggggggggggrrrrrgggggggPPPPPPPgggEEEEE   0000000000000000000000000000000000cccccccc00000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrggggZggggggggggggEEEEE   00000003000000000000000000000000300000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEEgggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000033030330303303000000000000000000000300000
EEEEEEEEEggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrgggggggggggggggEEEEEEE   00000000000000000000000000000330303303033030000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEggggggggggggggggggggggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggggggggggggggggggEEEEEEE   00000000033030330303303033030330303303033030000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000030000000000000000000000330000000000000
EEEEEEEgggggZggggggggggggggggggggggggggggggggEEEEE   00000003000030000000000000000000000330000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjjjjjjjjjjjjjjjjjjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkkkkkkkkkkkkkkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjkkkkkkkkkkkkkkkkjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkllllllllllllkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjkkllllllllllllkkjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjjcccccc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjjcccccc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllmmmmmmmmllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllmmmmmmmmllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllmmmmmmmmllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllllllllllllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000003000jjkkkkkkkkkkkkkkkkjjcdddcc00000000
EEEEEEEgggggZgggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300003000jjkkkkkkkkkkkkkkkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjjjjjjjjjjjjjjjjjjjcccccc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjjcccccc00000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEEgggggggggggggggrrrrrgggggggggggggggEEEEEEE   00000000033030330303303000000330303303033030000000
EEEEEEEEEggggggggggggggrrrrrgggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.03 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 112 nodi, 510 passi, finito in 560 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro, E=Emerald (marcatore), h=pavimento di casa, w=muro di casa, s=zona della scala, a=pavimento del fienile, v=muro del fienile, d=porta, r=strada, m=segno, g=aia, x=steccato, Q=covone, W=intonaco, U=intonaco, L=vetro della finestra, f=assi del pavimento, F=solaio, R=tegole di casa, T=Teal (marcatore), k=gradino, O=porta di legno, N=stipite di pietra, o=assi della porta, V=tavole del fienile, P=tetto del fienile, i=indigo (marcatore), X=palo dello steccato, Z=fieno, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 60015, R 17065, V 13000, g 9091, E 8975, k 2720, o 2130, P 2071, f 2025, F 1865, L 1360, X 902, r 600, a 375, N 375, Z 324, O 120.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-32 all×21, one×3, prl×1: 565 celle x4-26 y5-29 z0, passi 2-63
   #35 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 64
    #37 all . w → w W passi=6: ×6, 12000 celle x50-104 y55-109 z0-6, passi 65-70, w→W 6000, .→w 6000
    #38 all . w → w U passi=14: ×14, 28000 celle x50-104 y55-109 z6-20, passi 71-84, w→U 14000, .→w 14000
    #39 all . w → w W passi=12: ×12, 24000 celle x50-104 y55-109 z20-32, passi 85-96, w→W 12000, .→w 12000
    #40 all . w → w W passi=6: ×6, 12000 celle x50-104 y55-109 z32-38, passi 97-102, w→W 6000, .→w 6000
    #41 all . w → w U passi=14: ×14, 28000 celle x50-104 y55-109 z38-52, passi 103-116, w→U 14000, .→w 14000
#42-45 all×3, prl×1: 29450 celle x50-104 y55-109 z0-64, passi 117-131
    #46 all . h → h . passi=31: ×31, 113150 celle x55-99 y60-104 z1-32, passi 132-162, h→. 56575, .→h 56575
#47-48 all×2: 16050 celle x55-99 y60-104 z2-33, passi 163-193
    #49 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-64, passi 194-224, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#50-53 prl×2, all×2: 28725 celle x55-124 y60-114 z0-64, passi 225-267
    #54 all . i → i . passi=39: ×39, 29250 celle x105-119 y85-109 z1-40, passi 268-306, i→. 14625, .→i 14625
#55-66 prl×4, all×3, one×1: 30718 celle x22-132 y27-142 z0-51, passi 307-356
#67-68 all×2: 14040 celle x49-105 y54-110 z64-76, passi 357-369
#69-112 all×17, prl×4: 19456 celle x65-125 y60-115 z0-45, passi 370-510
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#29 all gEEEEEEE → *ggg**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all gE/*g → *g/**: le celle cercate c'erano, ma mai disposte come nel pattern
#33 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******… passi=6: le celle cercate c'erano, ma mai disposte come nel pattern
#60 all . Y → Y Y passi=14: in quel momento nella griglia non c'erano celle "Y"
#61 all . Y → C * passi=1: in quel momento nella griglia non c'erano celle "Y"
#62 all .C → CC passi=3: in quel momento nella griglia non c'erano celle "C"
#63 all . C → C * passi=5: in quel momento nella griglia non c'erano celle "C"
#74 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#75 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#76 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#77 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
… e altri 17
Improve it: answer with the whole program.

The program you wrote:
<!--
  Fattoria (farm).
  H the centre of the house; h its floor; w its walls; y the wall cells that carry a window column.
  s the stair zone against the back wall. a the barn floor, v the barn walls, on one side of the house.
  d the front door, r the road to the edge. g the yard lawn, x the fence posts, Q the haystacks, t the trees in the yard.
  Seeds: the depth of the house, the side and place of the barn, the hay and the trees.
  Large: house and barn. Huge: a fenced yard with hay. Gargantuan: a deeper yard with more hay and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavdrmgxQty" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one symmetry="()" steps="1">
        <rule in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**"/>
        <rule in="wE/wE/wE/wE/wE" out="**/**/*a/**/**"/>
      </one>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="www/[hs][hs][hs]" out="*y*/***"/>
      <all in="[wvy]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEEE" out="*ggg****" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="3"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****" steps="4"/>
    </sequence>
    <map scale="5 5 1" values="BEhswavrgxQtWLfFRTkONoVPiXZYCj" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="y" out="wwwww/wjjjw/wjjjw/wjjjw/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="ggggg/ggggg/ggxgg/ggggg/ggggg"/>
      <rule in="Q" out="ggggg/gQQQg/gQQQg/gQQQg/ggggg"/>
      <rule in="t" out="ggggg/ggggg/ggYgg/ggggg/ggggg"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="64"/>
        <prl in="w" out="R"/>
        <all in="B j" out="j W" steps="8"/><all in="B j" out="j L" steps="14"/><all in="B j" out="j W" steps="18"/>
        <all in="B j" out="j L" steps="14"/><all in="B j" out="j W" steps="10"/>
        <prl in="j" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="P"/>
        <all in="B a" out="i a" steps="1"/>
        <all in="B i" out="i B" steps="39"/>
        <prl in="i" out="P"/>
        <all in="B x" out="x X" steps="10"/>
        <prl in="x" out="X"/>
        <all in="B Q" out="Q Z" steps="11"/>
        <prl in="Q" out="Z"/>
        <all in="B Y" out="Y Y" steps="14"/>
        <all in="B Y" out="C *" steps="1"/>
        <all in="BC" out="CC" steps="3"/>
        <all in="B C" out="C *" steps="5"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="7" symmetry="()"/>
        <all in="PB" out="*P" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **P**/**P**/PPPPP/**P**/**P**" out="*****/*****/**P**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="FF0000" name="centro"/>
  <color symbol="h" value="C8A878" name="pavimento di casa" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro di casa"/>
  <color symbol="y" value="E8DCC0" name="muro con finestre"/>
  <color symbol="j" value="E8DCC0" name="muro con finestre"/>
  <color symbol="s" value="8A6A48" name="zona della scala" area="house"/>
  <color symbol="a" value="B89868" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="A04030" name="muro del fienile"/>
  <color symbol="d" value="5A3A20" name="porta"/>
  <color symbol="r" value="B0A080" name="strada"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="g" value="8AA858" name="aia" area="yard"/>
  <color symbol="x" value="7A5A38" name="steccato"/>
  <color symbol="Q" value="D8C060" name="covone"/>
  <color symbol="t" value="4A7A38" name="albero" area="orchard"/>
  <color symbol="W" value="E8DCC0" name="intonaco"/>
  <color symbol="L" value="5A7890" name="vetro della finestra"/>
  <color symbol="f" value="B08858" name="assi del pavimento" area="house"/>
  <color symbol="F" value="9A7850" name="solaio"/>
  <color symbol="R" value="8A4A38" name="tegole di casa"/>
  <color symbol="T" hidden="True"/>
  <color symbol="k" value="6A4A30" name="gradino"/>
  <color symbol="O" value="7A4A28" name="porta di legno"/>
  <color symbol="o" value="4A2A18" name="assi della porta"/>
  <color symbol="N" value="5A5048" name="stipite di pietra"/>
  <color symbol="V" value="A04030" name="tavole del fienile"/>
  <color symbol="P" value="6A6058" name="tetto del fienile"/>
  <color symbol="i" hidden="True"/>
  <color symbol="X" value="7A5A38" name="palo dello steccato"/>
  <color symbol="Z" value="E0C860" name="fieno"/>
  <color symbol="Y" value="5A3E28" name="tronco"/>
  <color symbol="C" value="5A8A40" name="chioma"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: varietà: alla taglia Gargantuesca 18 tipi di parti e 181 parti, alla Enorme 18 e 155: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 194 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at gargantuan: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, a pavimento del fienile, r strada, g aia, W intonaco, L vetro della finestra, f assi del pavimento, F solaio, R tegole di casa, k gradino, O porta di legno, N stipite di pietra, o assi della porta, V tavole del fienile, P tetto del fienile, X palo dello steccato, Z fieno, Y tronco, C chioma
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEggggggggggggggggggggggggggggggggggEEEEEEE
EEEEEEEEgggggggggggggggggggggggggggggggggggEEEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggCgggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggZgggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggCgggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggPPPPPPPgggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggPPPPPPPgggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggCgggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEEgggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEEEggggggggggggggrrrrrgggggggggggggggggEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrgggggggggggggggEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
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
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000033030330303303033030330303303033030000000
00000003000000000000000000000000000000000000300000
00000000000000000000000000000000000000000000000000
00000003000000000000000000000000000000000000300000
00000000000000000000000000006600000330000000000000
00000003000000000000000000000600000330000000300000
00000003000000000000000000000000000000000000300000
00000000000000000000000000000000000000000000000000
00000003000000000000000000000000000000000000300000
0000000000006000jjjjjjjjjjjjjjjjjjjj00000000000000
0000000300066000jjjjjjjjjjjjjjjjjjjj00000000300000
0000000300000000jjkkkkkkkkkkkkkkkkjj00000000300000
0000000000000000jjkkkkkkkkkkkkkkkkjj00000000000000
0000000300000000jjkkllllllllllllkkjj00000000300000
0000000000003000jjkkllllllllllllkkjj00000000000000
0000000300003000jjkkllllllllllllkkjj00000000300000
0000000300000000jjkkllllllllllllkkjj00000000300000
0000000000000000jjkkllllllllllllkkjjcccccc00000000
0000000300000000jjkkllllllllllllkkjjcccccc00300000
0000000000000000jjkkllllllllllllkkjjcdddcc00000000
0000000300000000jjkkllllllllllllkkjjcdddcc00300000
0000000300066000jjkkllllllllllllkkjjcdddcc00300000
0000000000006000jjkkllllllllllllkkjjcdddcc00000000
0000000300000000jjkkllllllllllllkkjjcdddcc00300000
0000000000000000jjkkkkkkkkkkkkkkkkjjcdddcc00000000
0000000300000000jjkkkkkkkkkkkkkkkkjjcdddcc00300000
0000000300000000jjjjjjjjjjjjjjjjjjjjcdddcc00300000
0000000000000000jjjjjjjjjjjjjjjjjjjjcdddcc00000000
0000000300000000000000000000000000cccccccc00300000
0000000000000000000000000000000000cccccccc00000000
00000003000000000000000000000000000000000000300000
00000003000000000033000000000000000000000000300000
00000000000000000033000000000000000000000000000000
00000003000000000000000000000000000000660000300000
00000000000000000000000000000000000000000000000000
00000003000000000000000000000000000000000000300000
00000000033030330303303000000000000000000000300000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000330303303033030000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW..PPP..........
.................WWWWWWWWWWWWWWWWWWPPPPPPP........
.................WWWWWWWWWWWWWWWWWWVVVVVVV........
.................WWWWWWWWWWWWWWWWWWVVVVVVV........
.................WWWWWWWWWWWWWWWWWWVVVVVVV........
.................WWWWWWNooooOWWWWWWVVVVVVV........
.................WWWWWWNooooOWWWWWWVVVVVVV........
.................WWWWWWNooooOWWWWWWVVVVVVV........
............C....WWWWWWNooooOWWWWWWVVVVCVV........
............C....WWWWWWNooooOWWWWWWVVVVCVV........
.................WWWWWWNooooOWWWWWWVVVVVVV........
............Z....WWZWWWNooooOWWWWWWVVVVVVV........
............Z....WWXWWWNooooOWWWWWWVVVVVVV........
............Z....WWXWWWNooooOWWWWWWVVVVVVV........
.......E.EE.Z.EEEWWEWWWrooooEWWWWWWVVVVVVVE.E.....
```
Right side (looking from the right):
```
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWPPPPPPPPP.............
..................WWWWWWWWWPPPPPPPPPPP............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..................WWWWWWWWWVVVVVVVVVVV............
..............C...WWWWWWWWWVVVVVVVVVVV....C.......
..............C...WWWWWWWWWVVVVVVVVVVV....C.......
..................WWWWWWWWWVVVVVVVVVVV............
..............Z...WWWWWWWWWVVVVVVVVVVV..Z.........
..............X...WWWWWWWWWVVVVVVVVVVV..Z.........
..............X...WWWWWWWWWVVVVVVVVVVV..Z.........
.........EE.EEEE.EWWWWWWWWWVVVVVVVVVVVEEEEE.EE.E..
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
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWLWWWWLWWWWWWW...............
.................W.....kkkk......WW...............
.................W.....kkkk......WW...............
.................L.....kkkk......WL...............
.................W...............WW...............
............Z....L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................L...............WLVVVVVVV........
.................W...............WW.....VV........
.................L...............WW.....VV........
.................L...............WW.....VV........
.................W...............WW.....VV........
.................L...............WL.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................WWWWWWoooooNWWWWWW.....VV........
.................WWWWWWoooooNWWWWWW.....VV........
...................................VVVVVVV........
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
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWLWWWWLWWWWWWW...............
.................W...............WW...............
.................W...............WW...............
.................L...............WL...............
.................W...............WW...............
.................L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................L...............WL...............
.................W...............WW..PPP..........
.................L...............WW..PPP..........
.................L...............WW..PPP..........
.................W...............WW..PPP..........
.................L...............WL..PPP..........
.................W...............WW..PPP..........
.................W...............WW..PPP..........
.................WWWWWWWWWWWWWWWWWW..PPP..........
.................WWWWWWWWWWWWWWWWWW..PPP..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEggggggggggggggggggggggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggggggggggggggggggEEEEEEE   00000000033030330303303033030330303303033030000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000003300000660000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000003300000660000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjjjjjjjjjjjjjjjjjjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkkkkkkkkkkkkkkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjkkkkkkkkkkkkkkkkjj00000000000000
EEEEEEEgggggCgggRRRRRRRRRRRRRRRRRRRggggZgggggEEEEE   0000000300006600jjkkllllllllllllkkjj00330000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000006000jjkkllllllllllllkkjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkllllllllllllkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkllllllllllllkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000006000jjkkllllllllllllkkjjcccccc00000000
EEEEEEEgggggCgggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300066000jjkkllllllllllllkkjjcccccc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllllllllllllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllllllllllllkkjjcdddcc00000000
EEEEEEEgggggCgggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300066600jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkkkkkkkkkkkkkkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkkkkkkkkkkkkkkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjjjjjjjjjjjjjjjjjjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjjcdddcc00000000
EEEEEEEggggggggggggggggrrrrrgggggggPPPPPPPgggEEEEE   0000000300000000000000000000000000cccccccc00300000
EEEEEEEggggggggggggggggrrrrrgggggggPPPPPPPgggEEEEE   0000000000000000000000000000000000cccccccc00000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000003300000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000003300000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEEgggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000033030330303303000000000000000000000300000
EEEEEEEEEggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrgggggggggggggggEEEEEEE   00000000000000000000000000000330303303033030000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEggggggggggggggggggggggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggggggggggggggggggEEEEEEE   00000000033030330303303033030330303303033030000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000300000000000000300000000000000000
EEEEEEEggggggggggZggggggggggggggZggggggggggggEEEEE   00000003000000000300000000000000300000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEgggggCggggggggggggggggggggggggggggggggEEEEE   00000003000066000000000000000000000000000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjjjjjjjjjjjjjjjjjjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkkkkkkkkkkkkkkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000000000jjkkkkkkkkkkkkkkkkjj00000000000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300000000jjkkllllllllllllkkjj00000000300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000000006000jjkkllllllllllllkkjj00000000000000
EEEEEEEgggggCgggRRRRRRRRRRRRRRRRRRRggggggggggEEEEE   0000000300006000jjkkllllllllllllkkjjcccccc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllllllllllllkkjjcccccc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllllllllllllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkllllllllllllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggCgggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300006600jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000006000jjkkllllllllllllkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkllllllllllllkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjkkkkkkkkkkkkkkkkjjcdddcc00000000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjkkkkkkkkkkkkkkkkjjcdddcc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000300000000jjjjjjjjjjjjjjjjjjjjcccccc00300000
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRPPPPPPPgggEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjjcccccc00000000
EEEEEEEgggggZggggggggggrrrrrgggggggggggggggggEEEEE   00000003000030000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggCgggggEEEEE   00000003000000000000000000000000000000660000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000060000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggEEEEE   00000003000000000000000000000000000000000000300000
EEEEEEEEgggggggggggggggrrrrrgggggggggggggggEEEEEEE   00000000033030330303303000000330303303033030000000
EEEEEEEEEggggggggggggggrrrrrgggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.03 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 200×200×160, 111 nodi, 583 passi, finito in 828 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro, E=Emerald (marcatore), h=pavimento di casa, w=muro di casa, s=zona della scala, a=pavimento del fienile, v=muro del fienile, d=porta, r=strada, m=segno, g=aia, x=steccato, Q=covone, t=albero, y=muro con finestre, W=intonaco, L=vetro della finestra, f=assi del pavimento, F=solaio, R=tegole di casa, T=Teal (marcatore), k=gradino, O=porta di legno, N=stipite di pietra, o=assi della porta, V=tavole del fienile, P=tetto del fienile, i=indigo (marcatore), X=palo dello steccato, Z=fieno, Y=tronco, C=chioma, j=muro con finestre, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 55579, E 17700, g 17461, R 15460, V 13000, L 5796, k 2720, o 2130, P 2071, f 2025, F 1865, X 1188, r 975, a 375, N 375, Z 324, C 192, O 120, Y 60.
  #3 map scala 1/5 1/5 1: ×1, 1600 celle x0-39 y0-39 z0-159, passi 1
#5-34 all×24, one×4, prl×1: 943 celle x6-35 y7-39 z0, passi 2-79
   #36 map scala 5 5 1: ×1, 40000 celle x0-199 y0-199 z0-159, passi 80
    #38 all . w → w W passi=64: ×64, 101504 celle x75-129 y80-134 z0-64, passi 81-144, w→W 50752, .→w 50752
#39-41 prl×1, all×2: 9901 celle x75-129 y80-134 z0-64, passi 145-167
#42-43 all×2: 13248 celle x76-128 y81-133 z22-54, passi 168-199
#44-47 all×3, prl×1: 8797 celle x76-128 y81-133 z0-64, passi 200-212
    #48 all . h → h . passi=31: ×31, 113150 celle x80-124 y85-129 z1-32, passi 213-243, h→. 56575, .→h 56575
#49-50 all×2: 16050 celle x80-124 y85-129 z2-33, passi 244-274
    #51 all . h → h . (+1) passi=31: ×31, 125550 celle x80-124 y85-129 z33-64, passi 275-305, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
    #52 prl h → R (+1): ×1, 2025 celle x80-124 y85-129 z64, passi 306, h→R 1825, s→R 200
      r1 h → R ×1825; r2 s → R ×200
    #53 all . v → v V passi=40: ×40, 26000 celle x130-149 y105-139 z0-40, passi 307-346, v→V 13000, .→v 13000
#54-55 prl×1, all×1: 700 celle x130-149 y105-139 z1-40, passi 347-348
    #56 all . i → i . passi=39: ×39, 29250 celle x130-144 y110-134 z1-40, passi 349-387, i→. 14625, .→i 14625
#57-67 prl×3, all×8: 15947 celle x32-177 y37-182 z0-71, passi 388-442
#68-111 all×17, prl×4: 19456 celle x90-150 y85-140 z0-45, passi 443-583
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#73 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#74 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#75 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#76 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#77 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#83 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#84 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#85 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#86 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#87 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#88 all . I → I * passi=30: in quel momento nella griglia non c'erano celle "I"
… e altri 10
Fix it and answer with the whole program.

## Risposta

```xml
<!--
  Fattoria (farm).
  H the centre of the house; h its floor; w its walls; y the wall cells that carry a window column.
  s the stair zone against the back wall. a the barn floor, v the barn walls, on one side of the house.
  d the front door, r the road to the edge. g the yard lawn, x the fence posts, Q the haystacks, t the trees in the yard.
  u the apple trees of the orchard outside the fence, only where 7 x 7 of free ground goes on past the yard.
  Seeds: the depth of the house, the side and place of the barn, the hay and the trees.
  Large: house and barn. Huge: a fenced yard with hay. Gargantuan: also an orchard of apple trees around the fence.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavdrmgxQtyu" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one symmetry="()" steps="1">
        <rule in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**"/>
        <rule in="wE/wE/wE/wE/wE" out="**/**/*a/**/**"/>
      </one>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="www/[hs][hs][hs]" out="*y*/***"/>
      <all in="[wvy]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEEE" out="*ggg****" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="3"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****" steps="4"/>
      <one in="xEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**u**/*****/*****" steps="16"/>
    </sequence>
    <map scale="5 5 1" values="BEhswavrgxQtWLfFRTkONoVPiXZYCjGD" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="y" out="wwwww/wjjjw/wjjjw/wjjjw/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="ggggg/ggggg/ggxgg/ggggg/ggggg"/>
      <rule in="Q" out="ggggg/gQQQg/gQQQg/gQQQg/ggggg"/>
      <rule in="t" out="ggggg/ggggg/ggYgg/ggggg/ggggg"/>
      <rule in="u" out="EEEEE/EEEEE/EEGEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="64"/>
        <prl in="w" out="R"/>
        <all in="B j" out="j W" steps="8"/><all in="B j" out="j L" steps="14"/><all in="B j" out="j W" steps="18"/>
        <all in="B j" out="j L" steps="14"/><all in="B j" out="j W" steps="10"/>
        <prl in="j" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="P"/>
        <all in="B a" out="i a" steps="1"/>
        <all in="B i" out="i B" steps="39"/>
        <prl in="i" out="P"/>
        <all in="B x" out="x X" steps="10"/>
        <prl in="x" out="X"/>
        <all in="B Q" out="Q Z" steps="11"/>
        <prl in="Q" out="Z"/>
        <all in="B Y" out="Y Y" steps="14"/>
        <all in="B Y" out="C *" steps="1"/>
        <all in="BC" out="CC" steps="3"/>
        <all in="B C" out="C *" steps="5"/>
        <all in="B G" out="G G" steps="10"/>
        <all in="B G" out="D *" steps="1"/>
        <all in="BD" out="DD" steps="2"/>
        <all in="B D" out="D *" steps="4"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="7" symmetry="()"/>
        <all in="PB" out="*P" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **P**/**P**/PPPPP/**P**/**P**" out="*****/*****/**P**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="FF0000" name="centro"/>
  <color symbol="h" value="C8A878" name="pavimento di casa" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro di casa"/>
  <color symbol="y" value="E8DCC0" name="muro con finestre"/>
  <color symbol="j" value="E8DCC0" name="muro con finestre"/>
  <color symbol="s" value="8A6A48" name="zona della scala" area="house"/>
  <color symbol="a" value="B89868" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="A04030" name="muro del fienile"/>
  <color symbol="d" value="5A3A20" name="porta"/>
  <color symbol="r" value="B0A080" name="strada"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="g" value="8AA858" name="aia" area="yard"/>
  <color symbol="x" value="7A5A38" name="steccato"/>
  <color symbol="Q" value="D8C060" name="covone"/>
  <color symbol="t" value="4A7A38" name="albero" area="orchard"/>
  <color symbol="u" value="6A9A40" name="melo" area="orchard"/>
  <color symbol="W" value="E8DCC0" name="intonaco"/>
  <color symbol="L" value="5A7890" name="vetro della finestra"/>
  <color symbol="f" value="B08858" name="assi del pavimento" area="house"/>
  <color symbol="F" value="9A7850" name="solaio"/>
  <color symbol="R" value="8A4A38" name="tegole di casa"/>
  <color symbol="T" hidden="True"/>
  <color symbol="k" value="6A4A30" name="gradino"/>
  <color symbol="O" value="7A4A28" name="porta di legno"/>
  <color symbol="o" value="4A2A18" name="assi della porta"/>
  <color symbol="N" value="5A5048" name="stipite di pietra"/>
  <color symbol="V" value="A04030" name="tavole del fienile"/>
  <color symbol="P" value="6A6058" name="tetto del fienile"/>
  <color symbol="i" hidden="True"/>
  <color symbol="X" value="7A5A38" name="palo dello steccato"/>
  <color symbol="Z" value="E0C860" name="fieno"/>
  <color symbol="Y" value="5A3E28" name="tronco"/>
  <color symbol="C" value="5A8A40" name="chioma"/>
  <color symbol="G" value="6B4A30" name="tronco del melo"/>
  <color symbol="D" value="7AA848" name="chioma del melo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
