# model.sculpt · claude-opus-5-5 · 54 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<!--
villetta: una casa di campagna a due piani con un'ala più bassa e un portico.
Parti (lettere del piano):
  h  interno del corpo principale (2 piani), w i suoi muri
  s  zona della scala, dentro h, lungo il muro di fondo
  a  interno dell'ala (1 piano, più bassa), v i suoi muri; l'ala sta a sinistra o a destra (seme)
  p  portico davanti alla porta, y i suoi pali agli angoli
  d  la porta nel muro frontale, r il vialetto dritto al bordo
  g  giardino attorno alla casa, x la siepe che lo chiude (solo dove il terreno continua)
  t  alberi nel prato (dove ci stanno 7x7 liberi), q pozzo nel giardino (Huge)
Large: casa + ala + portico + vialetto. Huge: in più giardino chiuso, pozzo e alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavpdrgxtqimy" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
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
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl in="H" out="i"/>
      <all in="i/h" out="*/i" symmetry="()"/>
      <all in="i/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pp/EE" out="**/**" symmetry="()"/>
      <all in="pE/EE" out="y*/**"/>
      <one in="ppp/EEE" out="***/rrr" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="i" out="h"/>
      <all in="[wvpy]EEEEEE" out="*gg****" steps="1"/>
      <all in="gE/[wvpyg]g" out="*g/**"/>
      <all in="gEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="ggg/ggg/ggg" out="***/*q*/***" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="4"/>
    </sequence>
    <map scale="5 5 1" values="BEHhwsavpdrgxtqyfFWVULRTkOoNJYPKecznQCAZX#90#91#92" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="y" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="EEEEE/EEEEE/EEZEE/EEEEE/EEEEE"/>
      <rule in="q" out="qqqqq/qXXXq/qXXXq/qXXXq/qqqqq"/>
      <sequence symmetry="(xy)">
        <!-- B. muri della casa (64) con la porta alla base -->
        <all steps="1"><rule in="B w" out="w W"/><rule in="B d" out="d O"/></all>
        <all steps="5"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B d" out="d U"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B d" out="d U"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>
        <!-- muri dell'ala (32) -->
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v U" steps="14"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="R"/>
        <!-- interni della casa: pavimento, scala, solaio, tetto -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- interno dell'ala -->
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <!-- portico: pali e tetto a 34 -->
        <all in="B p" out="Y *" steps="1"/>
        <all in="B Y" out="Y B" steps="33"/>
        <all in="B P" out="P *" steps="33"/>
        <prl in="Y" out="J"/>
        <all in="B P" out="J *" steps="1"/>
        <!-- siepe, pozzo, alberi -->
        <all in="B x" out="x *" steps="7"/>
        <all in="B q" out="q *" steps="4"/>
        <all in="B Z" out="Z A" steps="14"/>
        <prl in="Z" out="C"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="6"/>
        <!-- C. porta interna tra casa e ala -->
        <one in="fWWWWWf" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="3"/>
        <all in="W/O" out="O/*" symmetry="()" steps="3"/>
        <union symbol="+" values="WVU"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- finestre -->
        <one steps="20"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- arredi: piano terra contro il muro di facciata -->
        <one in="BBBBBB/BBBBBB/BBBBBB/BBBBBB/WWWWWW ffffff/ffffff/ffffff/ffffff/WWWWWW" out="cccccc/cccccc/cccccc/cccccc/****** ******/******/******/******/******" symmetry="()" steps="1"/>
        <one in="BBBBBBBB/BBBBBBBB/BBBBBBBB/BBBBBBBB/BBBBBBBB/WWWWWWWW ffffffff/ffffffff/ffffffff/ffffffff/ffffffff/WWWWWWWW" out="nnnnnnnn/nnnnnnnn/nnnnnnnn/nnnnnnnn/nnnnnnnn/******** ********/********/********/********/********/********" symmetry="()" steps="1"/>
        <one in="BBBB/BBBB/BBBB/BBBB/WWWW ffff/ffff/ffff/ffff/WWWW" out="zzzz/zzzz/zzzz/zzzz/**** ****/****/****/****/****" symmetry="()" steps="2"/>
        <!-- arredi: piano di sopra, letti e cassapanca contro la facciata -->
        <one in="BBBBBB/BBBBBB/BBBBBB/BBBBBB/BBBBBB/BBBBBB/BBBBBB/BBBBBB/BBBBBB/BBBBBB/WWWWWW FFFFFF/FFFFFF/FFFFFF/FFFFFF/FFFFFF/FFFFFF/FFFFFF/FFFFFF/FFFFFF/FFFFFF/WWWWWW" out="eeeeee/eeeeee/eeeeee/eeeeee/eeeeee/eeeeee/eeeeee/eeeeee/eeeeee/eeeeee/****** ******/******/******/******/******/******/******/******/******/******/******" symmetry="()" steps="2"/>
        <one in="BBBBBB/BBBBBB/BBBBBB/BBBBBB/WWWWWW FFFFFF/FFFFFF/FFFFFF/FFFFFF/WWWWWW" out="cccccc/cccccc/cccccc/cccccc/****** ******/******/******/******/******" symmetry="()" steps="1"/>
        <!-- arredi: l'ala, focolare e botti contro il muro di pietra -->
        <one in="VVVVVVVVVVVV/BBBBBBBBBBBB/BBBBBBBBBBBB/BBBBBBBBBBBB/BBBBBBBBBBBB VVVVVVVVVVVV/ffffffffffff/ffffffffffff/ffffffffffff/ffffffffffff" out="************/QQQQQQ**zzzz/QQQQQQ**zzzz/QQQQQQ**zzzz/QQQQQQ**zzzz ************/************/************/************/************" steps="1"/>
        <all in="B c" out="c *" steps="3"/>
        <all in="B n" out="n *" steps="4"/>
        <all in="B z" out="z *" steps="5"/>
        <all in="B e" out="e *" steps="2"/>
        <all in="B Q" out="Q *" steps="9"/>
        <!-- tetti -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="h" value="c9a77a" name="pavimento di casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="s" value="8a6a45" name="zona della scala" area="house"/>
  <color symbol="a" value="b89060" name="pavimento dell'ala" area="house"/>
  <color symbol="v" value="a8a090" name="muro dell'ala"/>
  <color symbol="y" value="6a4a2a" name="palo del portico"/>
  <color symbol="d" value="5a3a20" name="soglia"/>
  <color symbol="t" value="3d6b2a" name="albero"/>
  <color symbol="i" value="ff00ff" name="segno"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="H" value="ff0000" name="centro"/>
  <color symbol="f" value="b08458" name="pavimento di legno" area="house"/>
  <color symbol="F" value="8c6a48" name="solaio"/>
  <color symbol="W" value="ece2c8" name="intonaco"/>
  <color symbol="V" value="9a948a" name="pietra"/>
  <color symbol="U" value="ece2c8" name="intonaco"/>
  <color symbol="L" value="7fa8c8" name="vetro"/>
  <color symbol="R" value="a8452e" name="tegole"/>
  <color symbol="J" value="8a5a3a" name="tetto del portico"/>
  <color symbol="P" value="5a3c22" name="palo"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="r" value="b8ac96" name="vialetto"/>
  <color symbol="g" value="8fb060" name="giardino" area="garden"/>
  <color symbol="x" value="4a7a35" name="siepe"/>
  <color symbol="q" value="7a8088" name="pozzo"/>
  <color symbol="X" value="4a7aa8" name="acqua"/>
  <color symbol="A" value="6a4a2e" name="tronco"/>
  <color symbol="C" value="5a8a3a" name="chioma"/>
  <color symbol="T" value="8a6a45" name="striscia della scala"/>
  <color symbol="k" value="7a5634" name="gradini"/>
  <color symbol="O" value="6a3f22" name="porta"/>
  <color symbol="o" value="3e2614" name="assi della porta"/>
  <color symbol="N" value="4a3020" name="stipite"/>
  <color symbol="K" value="7a3a2a" name="camino"/>
  <color symbol="c" value="7a4a28" name="arredo cassapanca"/>
  <color symbol="e" value="c84a3a" name="arredo letto"/>
  <color symbol="n" value="9a6a3a" name="arredo tavolo"/>
  <color symbol="z" value="8a5a2a" name="arredo botte"/>
  <color symbol="Q" value="5a5450" name="arredo focolare"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Grande, seme 1: porta: 7 × 30 voxel (0,44 × 1,88 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 25 voxel (1,56 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the leaf the action open takes away: its width and its height
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, p portico, r vialetto, g giardino, x siepe, f pavimento di legno, F solaio, W intonaco, V pietra, L vetro, R tegole, k gradini, O porta, o assi della porta, N stipite, J tetto del portico, P palo, K camino, e arredo letto, c arredo cassapanca, z arredo botte, n arredo tavolo, Q arredo focolare
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
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEEEE
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEEEE
EEEEEEEEEExxxgggggggggggggggggggggggggggxxxEEEEEEE
EEEEEEEEEExxxgggggggggggggggggggggggggggxxxEEEEEEE
EERRRRRRRRRRRgggggggggggggggggggggggggggxxxEEEEEEE
EERRRRRRRRRRRgggggggggggggggggggggggggggxxxEEEEEEE
EERRRRRRRRRRRgggggggggggggggggggggggggggxxxEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEExxxxxxxxxRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEExxxxxxxxxRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEExxxxxxxxxRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEExxxRRRRRRRRRRRRRRRRRRRRRRRRRRRxxxEEEEEEE
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxEEEEEEE
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxEEEEEEE
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxEEEEEEE
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE
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
00000000003333333333333333333333333333333330000000
00000000003333333333333333333333333333333330000000
00000000003333333333333333333333333333333330000000
00000000003330000000000000000000000000003330000000
00000000003330000000000000000000000000003330000000
00eeeeeeeeeee0000000000000000000000000003330000000
00efffffffffe0000000000000000000000000003330000000
00efffffffffssssssssssssssssssssssssssss3330000000
00effgggggffsttttttttttttttttttttttttttts000000000
00effgggggffsttttttttttttttttttttttttttts000000000
00effgggggffsttuuuuuuuuuuuuuuuuuuuuuuutts000000000
00effgggggffsttuuuuuuuuuuuuuuuuuuuuuuutts000000000
00effgggggffsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
00effgggggffsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00efffffffffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00efffffffffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00eeeeeeeeeesttuuvzwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
003333333333sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
003333333333sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
003333333333sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000033ssssssssssssssssssssssssssss3330000000
00000000003330000ffffffffffffffffff000003330000000
00000000003330000ffffffffffffffffff000003330000000
00000000003330000ffffffffffffffffff000003330000000
00000000003330000ffffffffffffffffff000003330000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
..................K...............................
..................K...............................
..................K...RRRRRRRR....................
..................K.RRRRRRRRRRRR..................
..................RRRRRRRRRRRRRRRR................
................RRRRRRRRRRRRRRRRRRRR..............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
............RRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWLLLWWWWWWWWWWWWWWWWW..........
............WWWWWWWWLLLWWWWWWWWWWWWWWWWW..........
............WWLLLWWWLLLWWWWWWWLLWWWWWWWW..........
............WWLLLWWWLLLWWWLLLWLLLWWWWWWW..........
............WWLLLWWWWWWWWWLLLWLLLWWWWWWW..........
............WWLLLWWWWWWWWWLLLWLLLWWWWWWW..........
............WWWWWWWWWWWWWWLLLWWWWWWWWWWW..........
......RR....WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
....RRRRRRR.WWWWWWJJJJJJJJJJJJJJJJJWWWWW..........
..RRRRRRRRRRWWWWWWPPWWWWWWWWWWWWWPPWWWWW..........
..VVVVVVVVVVVWWWWWPPWWWNNNNNNNWWWPPWWWWW..........
..VVVVVVVVVVVWWWWWPPWWNoooooooNWWPPWWWWW..........
..VVVVVVVVVVVWWWWWPPWWNoooooooNWWPPWWWWW..........
..VVVVVVVVVVVWWWWWPPWWNoooooooNWWPPWWWWW..........
..VVVVVVVVVVVWWWWWPPWWNoooooooNWWPPWWWWW..........
..VVVVVVVVVVVWWWWWPPWWNoooooooNWWPPWWWWW..........
..WWWWWWWWWWWWWWWWPPWWNoooooooNWWPPWWWWW..........
..WWWWLLWWWWWWWWWWPPWWNoooooooNWWPPLLWWW..........
..WWWWLLLWWWWWWWWWPPWWNoooooooNWWPPLLWWW..........
..LWWWLLLWWWWWWWWWPPWWNoooooooNWWPPLLWWW..........
..LWWWLLLWWWWWWWWWPPWWNoooooooNWWPPLLWWW..........
..LWWWWWWWWWWWWWWWPPWWNoooooooNWWPPWWWWW..........
..xxxxxxxxxxxWWWWWPPWWNoooooooNWWPPWWWWWxxx.......
..xxxxxxxxxxxWWWWWPPWWNoooooooNWWPPWWWWWxxx.......
..xxxxxxxxxxxWWWWWPPWWNoooooooNWWPPWWWWWxxx.......
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrWEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
..............................K...................
..............................K...................
.........................RRRRRK...................
.......................RRRRRRRRR..................
.....................RRRRRRRRRRRRR................
...................RRRRRRRRRRRRRRRRR..............
.................RRRRRRRRRRRRRRRRRRRRR............
...............RRRRRRRRRRRRRRRRRRRRRRRRR..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWLLLWWWWWWWWWWWWWWWLLW..........
...............WWWWLLLWWWWWWWWWWWWWLLLLL..........
...............WWWWLLLWWWWWWWWWWWWWLLLLL..........
...............WWWWLLLWWWWWWWWWWWWWLLLLL..........
...............WWWWWWWWWWWWWWWWWWWWLLLWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
..............RWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJ.....
............RRRWWWWWWWWWWWWWWWWWWWWWWWWW...PP.....
............VVVWWWWWWWWWWWWWWWWWWWWWWWWW...PP.....
............VVVWWWWWWWWWWWWWWWWWWWWWWWWW...PP.....
............VVVWWWWWWWWWWWWWWWWWWWWWWWWW...PP.....
............VVVWWWWWWWWWWWWWWWWWWWWWWWWW...PP.....
............VVVWWWWWWWWWWWWWWWWWWWWWWWWW...PP.....
............VVVWWWWWWWWWWWWWWWWWWWWWWWWW...PP.....
............WWWWWWWLLLWWWWWWWLLLWWWWWWWW...PP.....
............WWWWWWWLLLWWWWWWWLLLWWWWWWWW...PP.....
............WWWWWWWLLLWWWWWWWLLLWWLLLWWW...PP.....
............WWWWWWWLLLWWWWWWWLLLWWLLLWWW...PP.....
............WWWWWWWWWWWWWWWWWWWWWWLLLWWW...PP.....
............WWWWWWWWWWWWWWWWWWWWWWLLLWWW...PP.....
.......xxxxxxxxWWWWWWWWWWWWWWWWWWWWWWWWWxxxxx.....
.......xxxxxxxxWWWWWWWWWWWWWWWWWWWWWWWWWxxxxx.....
.......xxxxxxxxWWWWWWWWWWWWWWWWWWWWWWWWWxxxxx.....
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
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
...WLLLWLLLW......................................
..WWWLLWLLLWW.....................................
..WWWLLWLLLWW.....................................
..WWW.......WWWWWWWWWWWWWWWWWWWWWWWLLLWW..........
..WWW.......WWWWWWWWWWWWWWWWWWWWWWWLLLWW..........
..WWW.......WWWWWWWWWWWWWWWWWWWWWWWLLWWW..........
..WWW.......WWW.......kkkkkk.........WWW..........
..LLL.......WWW.......kkkkkk.........LLL..........
..LLL.......WWW.......kkkkkk.........LLL..........
..LLL.......WWW.......kkkkkk.........LLL..........
..WWW.......WWW........kkkkk.........WWW..........
..WWW.......WWW......................WWW..........
..WWW.......Ooo......................WWW..........
..WWW.......ooo......................WWW..........
..WWW.......ooo......................WWW..........
..LLLWLLLWWWOoN......................WWW..........
..LWWWLLLWWWWWW......................WWW..........
..LWWWLLLWWWWWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWWWWWWWWWNoooooooNWWWLLLWWW..........
............WWWWWWWWWWNoooooooNWWWLLLWWW..........
............WWWWWWWWWWNoooooooNWWWLLLWWW..........
..................................................
..................................................
..................................................
..................PP.............PP...............
..................P..............P................
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
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
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
............LLL......................WWW..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWWLLWWWWWWWWWLLLWLLLWWWWWWW..........
............WWWLLWWWWWWWWWLLLWLLLWWWWWWW..........
............WWWLLWWWWWWWWWLLLWLLLWWWWWWW..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000003333333333333333333333333333333330000000
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEEEE   00000000003333333333333333333333333333333330000000
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEEEE   00000000003333333333333333333333333333333330000000
EEEEEEEEEExxxgggggggggggggggggggggggggggxxxEEEEEEE   00000000003330000000000000000000000000003330000000
EEEEEEEEEExxxgggggggggggggggggggggggggggxxxEEEEEEE   00000000003330000000000000000000000000003330000000
EERRRRRRRRRRRgggggggggggggggggggggggggggxxxEEEEEEE   00eeeeejeeeee0000000000000000000000000003330000000
EERRRRRRRRRRRgggggggggggggggggggggggggggxxxEEEEEEE   00efffffffffe0000000000000000000000000003330000000
EERRRRRRRRRRRgggggggggggggggggggggggggggxxxEEEEEEE   00efffffffffssssssssssssssssssssssssssss3330000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttttttttttttttttttttttttttts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttttttttttttttttttttttttttts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00efffffffffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00efffffffffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   00eeeeeeeeeesttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEExxxxxxxxxRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   003333333333sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEExxxxxxxxxRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   003333333333sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEExxxxxxxxxRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   003333333333sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEExxxRRRRRRRRRRRRRRRRRRRRRRRRRRRxxxEEEEEEE   000000000033ssssssssssssssssssssssssssss3330000000
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxEEEEEEE   00000000003330000ffffffffffffffffff000003330000000
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxEEEEEEE   00000000003330000ffffffffffffffffff000003330000000
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxEEEEEEE   00000000003330000ffffffffffffffffff000003330000000
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxEEEEEEE   00000000003330000ffffffffffffffffff000003330000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000003333333333333333333333333333333333333333
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   00000000003333333333333333333333333333333333333333
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   00000000003333333333333333333333333333333333333333
EEEEEEEEEExxxggggggggggggggggggggggggggggggggggggg   00000000003330000000000000000000000000000000000000
EEEEEEEEEExxxggggggggggggggggggggggggggggggggggggg   00000000003330000000000000000000000000000000000000
EEEEEEEEEExxxggggggggggggggggggggggggggggggggggggg   00000000003330000000000000000000000000000000000000
EEEEEEEEEExxxggggggggggggggggggggggggggggggggggggg   00000000003330000000000000000000000000000000000000
EEEEEEEEEExxxggggggggggggggggggggggggggggggggggggg   000000000033sssssssssssssssssssssssssssseeeeeeeeee
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000stttttttttttttttttttttttttttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000stttttttttttttttttttttttttttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxzxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttseeeeeeeee
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts333333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRxxxxxxxxx   000000000000sttttttttttttttttttttttttttts333333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRxxxxxxxxx   000000000000sttttttttttttttttttttttttttts333333333
EEEEEEEEEExxxRRRRRRRRRRRRRRRRRRRRRRRRRRRxxxxxxxxxx   000000000033ssssssssssssssssssssssssssss3333333333
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxxxxxxxx   00000000003330000ffffffffffffffffff000003333333333
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxxxxxxxx   00000000003330000ffffffffffffffffff000003333333333
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxxxxxxxx   00000000003330000ffffffffffffffffff000003333333333
EEEEEEEEEExxxgggggJJJJJJJJJJJJJJJJJgggggxxxxxxxxxx   00000000003330000ffffffffffffffffff000003333333333
EEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.25 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 132 nodi, 556 passi, finito in 433 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro, E=Emerald (marcatore), h=pavimento di casa, w=muro intonacato, s=zona della scala, a=pavimento dell'ala, v=muro dell'ala, p=portico, d=soglia, r=vialetto, g=giardino, x=siepe, i=segno, y=palo del portico, f=pavimento di legno, F=solaio, W=intonaco, V=pietra, U=intonaco, L=vetro, R=tegole, T=striscia della scala, k=gradini, O=porta, o=assi della porta, N=stipite, J=tetto del portico, Y=Yellow, P=palo, K=camino, e=arredo letto, c=arredo cassapanca, z=arredo botte, n=arredo tavolo, Q=arredo focolare, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 57068, R 16851, V 5850, x 4800, E 4500, L 4272, o 3060, k 2720, f 2175, F 1640, g 950, N 710, P 612, e 360, J 350, p 332, z 288, O 240, Q 240, n 200, c 192, r 150, K 9.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-33 all×21, one×3, prl×2: 242 celle x1-16 y3-19 z0, passi 2-42
   #37 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 43
#39-41 all×3: 38000 celle x25-79 y30-79 z0-20, passi 44-63
#42-43 all×2: 34200 celle x25-79 y30-79 z20-38, passi 64-81
    #44 all . w → w U (+1) passi=14: ×14, 26600 celle x25-79 y30-79 z38-52, passi 82-95, w→U 12250, .→w 12250, d→U 1050, .→d 1050
      r1 . w → w U ×12250; r2 . d → d U ×1050
    #45 all . w → w W (+1) passi=12: ×12, 22800 celle x25-79 y30-79 z52-64, passi 96-107, w→W 10500, .→w 10500, d→W 900, .→d 900
      r1 . w → w W ×10500; r2 . d → d W ×900
#46-52 prl×2, all×5: 26075 celle x5-79 y25-79 z0-64, passi 108-143
    #53 all . h → h . passi=31: ×31, 99200 celle x30-74 y35-74 z1-32, passi 144-174, h→. 49600, .→h 49600
#54-55 all×2: 15600 celle x30-74 y35-74 z2-33, passi 175-205
    #56 all . h → h . (+1) passi=31: ×31, 111600 celle x30-74 y35-74 z33-64, passi 206-236, h→. 49600, .→h 49600, s→. 6200, .→s 6200
      r1 . h → h . ×49600; r2 . s → s . ×6200
#57-59 prl×1, all×2: 25800 celle x10-74 y30-74 z0-64, passi 237-269
#60-62 prl×1, all×2: 22619 celle x10-69 y30-89 z1-34, passi 270-304
#63-116 all×19, prl×5, one×2: 29741 celle x5-84 y15-89 z0-51, passi 305-504
    #117 prl U → W: ×1, 25058 celle x5-79 y25-79 z6-51, passi 505, U→W 25058
#118-132 one×7, all×8: 14690 celle x4-80 y24-80 z1-79, passi 506-556
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#25 all pp/EE → **/**: le celle cercate c'erano, ma mai disposte come nel pattern
#31 all gE/[wvpyg]g → *g/**: le celle cercate c'erano, ma mai disposte come nel pattern
#34 one ggg/ggg/ggg → ***/*q*/*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******… passi=4: le celle cercate c'erano, ma mai disposte come nel pattern
#67 all . q → q * passi=4: in quel momento nella griglia non c'erano celle "q"
#68 all . Z → Z A passi=14: in quel momento nella griglia non c'erano celle "Z"
#69 prl Z → C: in quel momento nella griglia non c'erano celle "Z"
#70 all C. → *C passi=4: in quel momento nella griglia non c'erano celle "C"
#71 all . C → C * passi=6: in quel momento nella griglia non c'erano celle "C"
#76 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#77 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
… e altri 19
Fix it and answer with the whole program.

## Risposta

```xml
<!--
villetta: una casa di campagna a due piani con un'ala più bassa e un portico.
Parti (lettere del piano):
  h  interno del corpo principale (2 piani), w i suoi muri
  s  zona della scala, dentro h, lungo il muro di fondo
  a  interno dell'ala (1 piano, più bassa), v i suoi muri; l'ala sta a sinistra o a destra (seme)
  p  portico davanti alla porta, y i suoi pali agli angoli
  d  la porta nel muro frontale, r il vialetto dritto al bordo
  g  giardino attorno alla casa, x la siepe che lo chiude (solo dove il terreno continua)
  t  alberi nel prato (dove ci stanno 7x7 liberi), q pozzo nel giardino (Huge)
Large: casa + ala + portico + vialetto. Huge: in più giardino chiuso, pozzo e alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavpdrgxtqimy" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
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
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl in="H" out="i"/>
      <all in="i/h" out="*/i" symmetry="()"/>
      <all in="i/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pp/EE" out="**/**" symmetry="()"/>
      <all in="pE/EE" out="y*/**"/>
      <one in="ppp/EEE" out="***/rrr" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="i" out="h"/>
      <all in="[wvpy]EEEEEE" out="*gg****" steps="1"/>
      <all in="gE/[wvpyg]g" out="*g/**"/>
      <all in="gEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="ggg/ggg/ggg" out="***/*q*/***" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="4"/>
    </sequence>
    <map scale="5 5 1" values="BEHhwsavpdrgxtqyfFWVULRTkOoNJYPKecznQCAZX#90#91#92" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="y" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="EEEEE/EEEEE/EEZEE/EEEEE/EEEEE"/>
      <rule in="q" out="qqqqq/qXXXq/qXXXq/qXXXq/qqqqq"/>
      <sequence symmetry="(xy)">
        <all steps="1"><rule in="B w" out="w W"/><rule in="B d" out="d O"/></all>
        <all steps="5"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B d" out="d U"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B d" out="d U"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v U" steps="14"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all in="B p" out="Y *" steps="1"/>
        <all in="B Y" out="Y B" steps="33"/>
        <all in="B P" out="P *" steps="33"/>
        <prl in="Y" out="J"/>
        <all in="B P" out="J *" steps="1"/>
        <all in="B x" out="x *" steps="7"/>
        <all in="B q" out="q *" steps="4"/>
        <all in="B Z" out="Z A" steps="14"/>
        <prl in="Z" out="C"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="6"/>
        <one in="fWWWWWf" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>
        <union symbol="+" values="WVU"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <one steps="20"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <one in="BBBBBB/BBBBBB/BBBBBB/WWWWWW ffffff/ffffff/ffffff/WWWWWW" out="cccccc/cccccc/cccccc/****** ******/******/******/******" symmetry="()" steps="1"/>
        <one in="BBBBBBBB/BBBBBBBB/BBBBBBBB/BBBBBBBB/WWWWWWWW ffffffff/ffffffff/ffffffff/ffffffff/WWWWWWWW" out="nnnnnnnn/nnnnnnnn/nnnnnnnn/nnnnnnnn/******** ********/********/********/********/********" symmetry="()" steps="1"/>
        <one in="BBBB/BBBB/BBBB/WWWW ffff/ffff/ffff/WWWW" out="zzzz/zzzz/zzzz/**** ****/****/****/****" symmetry="()" steps="2"/>
        <one in="BBBBBBBBBB/BBBBBBBBBB/BBBBBBBBBB/BBBBBBBBBB/BBBBBBBBBB/WWWWWWWWWW FFFFFFFFFF/FFFFFFFFFF/FFFFFFFFFF/FFFFFFFFFF/FFFFFFFFFF/WWWWWWWWWW" out="eeeeeeeeee/eeeeeeeeee/eeeeeeeeee/eeeeeeeeee/eeeeeeeeee/********** **********/**********/**********/**********/**********/**********" symmetry="()" steps="2"/>
        <one in="BBBBBB/BBBBBB/BBBBBB/WWWWWW FFFFFF/FFFFFF/FFFFFF/WWWWWW" out="cccccc/cccccc/cccccc/****** ******/******/******/******" symmetry="()" steps="1"/>
        <one in="VVVVVVVVVVVV/BBBBBBBBBBBB/BBBBBBBBBBBB/BBBBBBBBBBBB/BBBBBBBBBBBB VVVVVVVVVVVV/ffffffffffff/ffffffffffff/ffffffffffff/ffffffffffff" out="************/QQQQQQ**zzzz/QQQQQQ**zzzz/QQQQQQ**zzzz/QQQQQQ**zzzz ************/************/************/************/************" steps="1"/>
        <all in="B c" out="c *" steps="3"/>
        <all in="B n" out="n *" steps="4"/>
        <all in="B z" out="z *" steps="5"/>
        <all in="B e" out="e *" steps="2"/>
        <all in="B Q" out="Q *" steps="9"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="h" value="c9a77a" name="pavimento di casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="s" value="8a6a45" name="zona della scala" area="house"/>
  <color symbol="a" value="b89060" name="pavimento dell'ala" area="house"/>
  <color symbol="v" value="a8a090" name="muro dell'ala"/>
  <color symbol="y" value="6a4a2a" name="palo del portico"/>
  <color symbol="d" value="5a3a20" name="soglia"/>
  <color symbol="t" value="3d6b2a" name="albero"/>
  <color symbol="i" value="ff00ff" name="segno"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="H" value="ff0000" name="centro"/>
  <color symbol="f" value="b08458" name="pavimento di legno" area="house"/>
  <color symbol="F" value="8c6a48" name="solaio"/>
  <color symbol="W" value="ece2c8" name="intonaco"/>
  <color symbol="V" value="9a948a" name="pietra"/>
  <color symbol="U" value="ece2c8" name="intonaco"/>
  <color symbol="L" value="7fa8c8" name="vetro"/>
  <color symbol="R" value="a8452e" name="tegole"/>
  <color symbol="J" value="8a5a3a" name="tetto del portico"/>
  <color symbol="P" value="5a3c22" name="palo"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="r" value="b8ac96" name="vialetto"/>
  <color symbol="g" value="8fb060" name="giardino" area="garden"/>
  <color symbol="x" value="4a7a35" name="siepe"/>
  <color symbol="q" value="7a8088" name="pozzo"/>
  <color symbol="X" value="4a7aa8" name="acqua"/>
  <color symbol="A" value="6a4a2e" name="tronco"/>
  <color symbol="C" value="5a8a3a" name="chioma"/>
  <color symbol="T" value="8a6a45" name="striscia della scala"/>
  <color symbol="k" value="7a5634" name="gradini"/>
  <color symbol="O" value="6a3f22" name="porta"/>
  <color symbol="o" value="3e2614" name="assi della porta"/>
  <color symbol="N" value="4a3020" name="stipite"/>
  <color symbol="K" value="7a3a2a" name="camino"/>
  <color symbol="c" value="7a4a28" name="arredo cassapanca"/>
  <color symbol="e" value="c84a3a" name="arredo letto"/>
  <color symbol="n" value="9a6a3a" name="arredo tavolo"/>
  <color symbol="z" value="8a5a2a" name="arredo botte"/>
  <color symbol="Q" value="5a5450" name="arredo focolare"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
