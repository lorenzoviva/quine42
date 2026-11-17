# model.sculpt · claude-opus-5-5 · 62 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<!--
  FATTORIA: the parts and where they go
  - Casa (h floor, w walls, H centre): the main body around the centre.
    It is 9 wide and 9-10 deep, the depth chosen by the seed.
    It has two storeys, with the stair zone s against the back wall.
  - Furniture, placed on the plan against the walls, away from the stair landing:
    - z, in the front-left corner: the hearth, with a bed above it.
    - b, in the front-right corner: barrels, with a chest above them.
    - m, on the right wall at the centre: a table, with shelves above it.
    - n, on the left wall at the centre: a bench, with a bed above it.
  - Stalla (a floor, v walls): a lower wing set against one side wall of the house.
    The seed picks the side and the position.
    Mangers (p) with hay stand against its outer end wall.
  - Porta (d) and strada (r): the door is on the front axis and 3 cells wide.
    The road runs straight from it to the edge.
  - Aia (g): a ring of beaten earth around the house and the stable.
  - Staccionata (x): a fence around the yard, only where the ground goes on past it.
  - Covone (Y): a haystack, placed far from the road.
  - Campi (c) and alberi (t): placed where the free ground allows.
  - Large: house, stable, yard and haystack.
  - Huge: adds the fence, the fields and the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="=" values="fF"/>
  <union symbol="+" values="WU"/>
  <map scale="1/5 1/5 1" values="BHEhwavdrsgxYctzbmnp" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="[wv]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="d/d" symmetry="()"/>
      <all in="d/w" out="*/r" symmetry="()" steps="1"/>
      <prl in="d" out="h"/>
      <all in="h/r" out="*/d" symmetry="()"/>
      <all in="[dr]/[Egx]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[Egx]" out="*r" symmetry="(x)" steps="1"/>
      <all in="ww/wh" out="**/*z" symmetry="()"/>
      <all in="ww/hw" out="**/b*" symmetry="()"/>
      <all in="whhhhH" out="*n****" symmetry="()"/>
      <all in="Hhhhhw" out="****m*" symmetry="()"/>
      <all in="av" out="p*" symmetry="(x)"/>
      <one in="EEE/EEE/EEE" out="***/*Y*/***" steps="1"><field for="Y" from="r" on="Egrx"/></one>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*******" steps="6"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEfFWULROoNTkKAVJIyQPGjlieGgrcCXDZYhswqzbmnavpxt#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="ggggg/ggggg/ggxgg/ggggg/ggggg"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="c" out="ccccc/CCCCC/ccccc/CCCCC/ccccc"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <all steps="1" symmetry="()"><rule in="B w" out="w W"/><rule in="B q" out="q O"/></all>
        <prl in="q" out="w"/>
        <all in="B w" out="w W" steps="5" symmetry="()"/><all in="B w" out="w U" steps="14" symmetry="()"/><all in="B w" out="w W" steps="12" symmetry="()"/>
        <all in="B w" out="w W" steps="6" symmetry="()"/><all in="B w" out="w U" steps="14" symmetry="()"/><all in="B w" out="w W" steps="12" symmetry="()"/>
        <prl in="w" out="R"/>
        <all steps="1" symmetry="()"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B z" out="z f"/><rule in="B b" out="b f"/><rule in="B m" out="m f"/><rule in="B n" out="n f"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31" symmetry="()"/><all in="B s" out="s B" steps="30" symmetry="()"/>
        <all in="B z" out="z Q" steps="10" symmetry="()"/><all in="B z" out="z B" steps="21" symmetry="()"/>
        <all in="B b" out="b P" steps="8" symmetry="()"/><all in="B b" out="b B" steps="23" symmetry="()"/>
        <all in="B m" out="m G" steps="7" symmetry="()"/><all in="B m" out="m B" steps="24" symmetry="()"/>
        <all in="B n" out="n j" steps="5" symmetry="()"/><all in="B n" out="n B" steps="26" symmetry="()"/>
        <all steps="1" symmetry="()"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B z" out="z F"/><rule in="B b" out="b F"/><rule in="B m" out="m F"/><rule in="B n" out="n F"/></all>
        <all steps="31" symmetry="()"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <all in="B z" out="z l" steps="6" symmetry="()"/><all in="B z" out="z B" steps="25" symmetry="()"/>
        <all in="B b" out="b i" steps="7" symmetry="()"/><all in="B b" out="b B" steps="24" symmetry="()"/>
        <all in="B m" out="m e" steps="14" symmetry="()"/><all in="B m" out="m B" steps="17" symmetry="()"/>
        <all in="B n" out="n l" steps="6" symmetry="()"/><all in="B n" out="n B" steps="25" symmetry="()"/>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="z" out="R"/><rule in="b" out="R"/><rule in="m" out="R"/><rule in="n" out="R"/></prl>
        <all in="B v" out="v V" steps="36" symmetry="()"/>
        <all steps="1" symmetry="()"><rule in="B a" out="a A"/><rule in="B p" out="p A"/></all>
        <all in="B a" out="a B" steps="35" symmetry="()"/>
        <all in="B p" out="p I" steps="6" symmetry="()"/><all in="B p" out="p y" steps="3" symmetry="()"/><all in="B p" out="p B" steps="26" symmetry="()"/>
        <prl><rule in="v" out="J"/><rule in="a" out="J"/><rule in="p" out="J"/></prl>
        <all in="B x" out="x X" steps="10" symmetry="()"/><prl in="x" out="X"/>
        <all in="XBBBBX" out="*XXXX*"/>
        <all in="B Y" out="Y *" steps="9" symmetry="()"/>
        <all in="B C" out="C *" steps="3" symmetry="()"/>
        <all in="B t" out="t D" steps="14" symmetry="()"/><prl in="t" out="Z"/>
        <all in="ZB" out="*Z" steps="3"/>
        <all in="B Z" out="Z *" steps="4" symmetry="()"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terreno"/>
  <color symbol="H" hidden="True" name="centro casa"/>
  <color symbol="h" hidden="True" name="segno casa"/>
  <color symbol="s" hidden="True" name="segno scala"/>
  <color symbol="w" hidden="True" name="segno muro"/>
  <color symbol="q" hidden="True" name="segno porta"/>
  <color symbol="z" hidden="True" name="segno focolare"/>
  <color symbol="b" hidden="True" name="segno botti"/>
  <color symbol="m" hidden="True" name="segno tavolo"/>
  <color symbol="n" hidden="True" name="segno panca"/>
  <color symbol="a" hidden="True" name="segno stalla"/>
  <color symbol="v" hidden="True" name="segno muro stalla"/>
  <color symbol="p" hidden="True" name="segno mangiatoia"/>
  <color symbol="x" hidden="True" name="segno palo"/>
  <color symbol="t" hidden="True" name="segno albero"/>
  <color symbol="d" value="5A3820" name="porta"/>
  <color symbol="f" value="B08850" name="pavimento casa" area="house"/>
  <color symbol="F" value="8A6A44" name="solaio"/>
  <color symbol="W" value="E8DCC0" name="intonaco"/>
  <color symbol="U" value="E8DCC0" name="intonaco"/>
  <color symbol="L" value="6A90B0" name="finestra"/>
  <color symbol="R" value="B04A30" name="tegole"/>
  <color symbol="K" value="7A7068" name="comignolo"/>
  <color symbol="O" value="6A4426" name="porta"/>
  <color symbol="o" value="3E2614" name="assi porta"/>
  <color symbol="N" value="4A4038" name="stipiti"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="assi aperte"/>
  <color symbol="T" value="8A6038" name="scala"/>
  <color symbol="k" value="9A7048" name="gradini"/>
  <color symbol="A" value="A07A48" name="pavimento stalla" area="barn"/>
  <color symbol="V" value="8C5034" name="tavole stalla"/>
  <color symbol="J" value="C8A850" name="tetto di paglia"/>
  <color symbol="I" value="6E4E2E" name="arredo mangiatoia"/>
  <color symbol="y" value="E6CC6A" name="arredo fieno"/>
  <color symbol="Q" value="8E8A84" name="arredo focolare"/>
  <color symbol="P" value="7A4A28" name="arredo botti"/>
  <color symbol="G" value="9A6A3A" name="arredo tavolo"/>
  <color symbol="j" value="7E5A36" name="arredo panca"/>
  <color symbol="l" value="C05050" name="arredo letto"/>
  <color symbol="i" value="5E3A20" name="arredo cassapanca"/>
  <color symbol="e" value="A88058" name="arredo scaffale"/>
  <color symbol="g" value="CDB98A" name="aia" area="yard"/>
  <color symbol="r" value="BFA678" name="strada" area="road"/>
  <color symbol="c" value="8A7040" name="campo" area="field"/>
  <color symbol="C" value="A8B858" name="grano" area="field"/>
  <color symbol="X" value="6E5030" name="staccionata"/>
  <color symbol="D" value="5A3A22" name="tronco"/>
  <color symbol="Z" value="5E8A40" name="chioma"/>
  <color symbol="Y" value="E0C050" name="covone" area="yard"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, r strada, g aia, Y covone, f pavimento casa, F solaio, W intonaco, L finestra, R tegole, O porta, o assi porta, N stipiti, k gradini, K comignolo, A pavimento stalla, V tavole stalla, J tetto di paglia, y arredo fieno, Q arredo focolare, P arredo botti, G arredo tavolo, j arredo panca, l arredo letto, i arredo cassapanca, e arredo scaffale, X staccionata
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEgggggggggggggggggggggggggggggggggggggggg
EEEEEEEEEEgXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXg
EEEEEEEEEEgggggggggggggggggggggggggggggggggggggggg
EEEEEEEEEEgggggggggggggggggggggggggggggggggggggggg
EEEEEEEEEEgggggggggggggggggggggggggggggggggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJ
EEEEEEEEEEgggggggggggggrrrrrrrggggggggggJJJJJJJJJJ
EEEEEEEEEEgggggggggggggrrrrrrrggggggggggJJJJJJJJJJ
EEEEEEEEEEgggggggggggggrrrrrrrggggggggggJJJJJJJJJJ
EEEEEEEEEEgggggggggggggrrrrrrrgggggggggggggggggggg
EEEEEEEEEEggggggggggggrrrrrrrrgggggggggggggggggggg
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000044400
00000000000000000000000000000000000000000000044400
00000000000000000000000000000000000000000000044400
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000444444444444444444444444444444444444440
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
000000000000ssssssssssssssssssssssssssss0000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttuuuuuuuuuuuyuuuuuuuuuuutts000000000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
000000000000stttttttttttttttttttttttttttsggggggggg
000000000000stttttttttttttttttttttttttttsggggggggg
000000000000sssssssssssssssssssssssssssssggggggggg
000000000000000000000000000000000000000ggggggggggg
000000000000000000000000000000000000000ggggggggggg
0000000000000000000000000000000000000000gggggggggg
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
..........................K.......................
......................RRRRRRRR....................
....................RRRRRRRRRRRR..................
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
............WWWWWWWWWWLLLWWWWWWWWWWWWWWW..........
............WWWWWWWWWWLLLWWWWWWWWWWWWWWW..........
............WWWWWWWWWWLLLWWWLLLWWWWWWWWW..........
............WWWWWWWWWWLLLWWWLLLWWWWWWWWW..........
............WWWWWWWWWWWWWWWWLLLWWWWWWWWW..........
............WWWWWWWWWWWWWWWWLLLWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJJJJJJ
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWWNNNNNNNWWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWLLWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWLLLWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWLLLWWWWWVVVVVVVVVV
...........XWWWWWWWWWWNoooooooNWLLLWWWWWVVVVVVVVVV
...........XXWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
...........XXWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
...........XXWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
...........XXWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.................K................................
.................K.......RRRRRRRR.................
.................K.....RRRRRRRRRRRR...............
.................K...RRRRRRRRRRRRRRRR.............
.................K.RRRRRRRRRRRRRRRRRRRR...........
.................RRRRRRRRRRRRRRRRRRRRRRRR.........
...............RRRRRRRRRRRRRRRRRRRRRRRRRRRR.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWLLWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWLLLW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWLLLW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWLLLW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWJJJJJJJJJJJJJJJJJJ.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
..YYY......X...WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
..YYY......X...WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
..YYY......X...WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
..YYY......X...WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
EEEEEEEEEEgggggggggggggggggVVVVVVVVVVVVVVVVVVgggEE
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
............WWWWWLLLLLWWWWWWWWWWWWWWWWWW..........
............WWWWWLLWLLWWWWWWWWWWWWWWWWWW..........
............WWWWWLLLLLWWWWWWWWWWWWWWWWWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
............WWW........kkkkk.........WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWWVVVVVVVVVV
............WWW......................WWWVVVVVVVVVV
............LLL......................WWWVVVVVVVVVV
............LLL......................WWW.......VVV
............LLL......................WWW.......VVV
............WWW......................LWW.......VVV
............WWW......................LWW.......VVV
............WWW......................LWW.......VVV
............WWW......................WWW.......VVV
............WWW......................WWW.......VVV
............WWW......................WWW.......VVV
............WWW......................WWW.......VVV
............WWW......................WWW.......VVV
............WWWWWWWWWWNoooooooNWLLLWWWWW.......VVV
............WWWWWWWWWWNoooooooNWLLLWWWWW.......VVV
.............WWWWWWWWWNoooooooNWLLLWWWWWVVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
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
............WWWWWWWWWWLLLWWWWLLLWWWWWWWW..........
............WWWWWWWWWWLLLWWWWLLLWWWWWWWW..........
............WWWWWWWWWWLLLWWWWLLLWWWWWWWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW....................eeeWW..........
............WWW....................eeeWW..........
............WWW....................eeWWW..........
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
............LLL......................LLL..........
............WWWWWWWWWWLLLWWWLLLWWWWWWWWW..........
............WWWWWWWWWWLLLWWWLLLWWWWWWWWW..........
.............WWWWWWWWWLLLWWWLLLWWWWWWWWW..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000044400
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYEE   00000000000000000000000000000000000000000000044400
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYEE   00000000000000000000000000000000000000000000044400
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEgggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEEEgXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXg   00000000000444444444444444444444444444444444444440
EEEEEEEEEEgggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEEEgggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEEEgggggggggggggggggggggggggggggggggggggggg   000000000000ssssssssssssssssssssssssssssgggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000stttttttttttttttttttttttttttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000stttttttttttttttttttttttttttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuuuuuuuuuuuuuuuuuuuuzuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEggRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggggg   000000000000sssssssssssssssssssssssssssss000000000
EEEEEEEEEEgggggggggggggrrrrrrrgggggggggggggggggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEEEgggggggggggggrrrrrrrgggggggggggggggggggg   00000000000000000000000000000000000000000000000000
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000044400000000000000000000000000000000
EEEEEEEEEEEEEEEYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000044400000000000000000000000000000000
EEEEEEEEEEEEEEEYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000044400000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
ggJJJJJJJJJJJggggggggggggggggggggggggggggggEEEEEEE   00ggggggggggg0000000000000000000000000000000000000
ggJJJJJJJJJJJggggggggggggggggggggggggggggggEEEEEEE   00ggggggggggg0000000000000000000000000000000000000
ggJJJJJJJJJJJggggggggggggggggggggggggggggggEEEEEEE   00ggggggggggssssssssssssssssssssssssssss0000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttttttttttttttttttttttttttts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttttttttttttttttttttttttttts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwwwwwwwwwwwzwvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
gggJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   00ggggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggEEEEEEE   000000000000sssssssssssssssssssssssssssss000000000
gggggggggggggggggggggggrrrrrrrgggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggrrrrrrrgggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.34 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 136 nodi, 768 passi, finito in 511 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=terreno (marcatore), h=segno casa (marcatore), w=segno muro (marcatore), a=segno stalla (marcatore), v=segno muro stalla (marcatore), d=porta, r=strada, s=segno scala (marcatore), g=aia, x=segno palo (marcatore), Y=covone, z=segno focolare (marcatore), b=segno botti (marcatore), m=segno tavolo (marcatore), n=segno panca (marcatore), p=segno mangiatoia (marcatore), f=pavimento casa, F=solaio, W=intonaco, U=intonaco, L=finestra, R=tegole, O=porta, o=assi porta, N=stipiti, T=scala, k=gradini, K=comignolo, A=pavimento stalla, V=tavole stalla, J=tetto di paglia, I=arredo mangiatoia, y=arredo fieno, Q=arredo focolare, P=arredo botti, G=arredo tavolo, j=arredo panca, l=arredo letto, i=arredo cassapanca, e=arredo scaffale, X=staccionata, q=segno porta (marcatore), #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 58511, R 16815, V 11700, E 3900, L 2864, k 2720, o 2130, g 2109, f 2025, F 1865, X 776, J 745, A 375, N 375, y 375, e 350, l 300, Y 250, Q 250, r 225, P 200, G 175, i 175, j 125, O 120, K 11.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-35 all×25, one×3, prl×1: 280 celle x4-19 y1-19 z0, passi 2-58
   #39 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 59
#41-43 all×2, prl×1: 12075 celle x25-79 y30-84 z0-6, passi 60-66
    #44 all . w → w U passi=14: ×14, 28000 celle x25-79 y30-84 z6-20, passi 67-80, w→U 14000, .→w 14000
    #45 all . w → w W passi=12: ×12, 24000 celle x25-79 y30-84 z20-32, passi 81-92, w→W 12000, .→w 12000
    #46 all . w → w W passi=6: ×6, 12000 celle x25-79 y30-84 z32-38, passi 93-98, w→W 6000, .→w 6000
    #47 all . w → w U passi=14: ×14, 28000 celle x25-79 y30-84 z38-52, passi 99-112, w→U 14000, .→w 14000
#48-51 all×3, prl×1: 29450 celle x25-79 y30-84 z0-64, passi 113-127
    #52 all . h → h . passi=31: ×31, 106950 celle x30-74 y35-79 z1-32, passi 128-158, h→. 53475, .→h 53475
#53-62 all×10: 22250 celle x30-74 y35-79 z1-33, passi 159-313
    #63 all . h → h . (+1) passi=31: ×31, 119350 celle x30-74 y35-79 z33-64, passi 314-344, h→. 53475, .→h 53475, s→. 6200, .→s 6200
      r1 . h → h . ×53475; r2 . s → s . ×6200
#64-73 all×9, prl×1: 31625 celle x30-99 y35-89 z0-64, passi 345-505
#74-75 all×2: 18250 celle x80-94 y60-84 z0-36, passi 506-541
#76-130 all×20, prl×7, one×1: 32235 celle x22-99 y5-89 z0-50, passi 542-744
    #131 prl U → W: ×1, 23946 celle x25-79 y30-84 z6-51, passi 745, U→W 23946
#132-136 all×4, one×1: 13846 celle x24-99 y29-90 z36-77, passi 746-768
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#21 all xE/*x → *x/**: le celle cercate c'erano, ma mai disposte come nel pattern
#36 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*ccccc*… passi=6: le celle cercate c'erano, ma mai disposte come nel pattern
#37 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#84 all . C → C * passi=3: in quel momento nella griglia non c'erano celle "C"
#85 all . t → t D passi=14: in quel momento nella griglia non c'erano celle "t"
#86 prl t → Z: in quel momento nella griglia non c'erano celle "t"
#87 all Z. → *Z passi=3: in quel momento nella griglia non c'erano celle "Z"
#88 all . Z → Z * passi=4: in quel momento nella griglia non c'erano celle "Z"
#90 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#91 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#92 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
… e altri 17
Fix it and answer with the whole program.

## Risposta

```xml
<!--
  FATTORIA: the parts and where they go
  - Casa (h floor, w walls, H centre): the main body around the centre.
    It is 9 wide and 9-10 deep, the depth chosen by the seed.
    It has two storeys, with the stair zone s against the back wall.
  - Furniture, placed on the plan against the walls, away from the stair landing and its way out:
    - z, in the front-left corner: the hearth, with a bed above it.
    - b, in the front-right corner: barrels, with a chest above them.
    - m, on the right wall at the centre: a table, with shelves above it.
    - n, on the left wall at the centre: a bench, with a bed above it.
  - Stalla (a floor, v walls): a lower wing set against one side wall of the house.
    The seed picks the side and the position.
    Mangers (p) with hay stand against its outer end wall.
  - Porta (d) and strada (r): the door is on the front axis and 3 cells wide.
    The road runs straight from it to the edge.
  - Aia (g): a ring of beaten earth around the house and the stable.
  - Staccionata (x): a fence around the yard, only where the ground goes on past it.
  - Covone (Y): a haystack, placed far from the road.
  - Campi (c) and alberi (t): placed where the free ground allows.
  - Large: house, stable, yard and haystack.
  - Huge: adds the fence, the fields and the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="=" values="fF"/>
  <union symbol="+" values="WU"/>
  <map scale="1/5 1/5 1" values="BHEhwavdrsgxYctzbmnp" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="[wv]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="d/d" symmetry="()"/>
      <all in="d/w" out="*/r" symmetry="()" steps="1"/>
      <prl in="d" out="h"/>
      <all in="h/r" out="*/d" symmetry="()"/>
      <all in="[dr]/[Egx]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[Egx]" out="*r" symmetry="(x)" steps="1"/>
      <all in="wh/ww" out="*z/**" symmetry="()"/>
      <all in="hw/ww" out="b*/**" symmetry="()"/>
      <all in="whhhhH" out="*n****" symmetry="()"/>
      <all in="Hhhhhw" out="****m*" symmetry="()"/>
      <all in="av" out="p*" symmetry="(x)"/>
      <one in="EEE/EEE/EEE" out="***/*Y*/***" steps="1"><field for="Y" from="r" on="Egrx"/></one>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*******" steps="6"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEfFWULROoNTkKAVJIyQPGjlieGgrcCXDZYhswqzbmnavpxt#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="ggggg/ggggg/ggxgg/ggggg/ggggg"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="c" out="ccccc/CCCCC/ccccc/CCCCC/ccccc"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <all steps="1" symmetry="()"><rule in="B w" out="w W"/><rule in="B q" out="q O"/></all>
        <prl in="q" out="w"/>
        <all in="B w" out="w W" steps="5" symmetry="()"/><all in="B w" out="w U" steps="14" symmetry="()"/><all in="B w" out="w W" steps="12" symmetry="()"/>
        <all in="B w" out="w W" steps="6" symmetry="()"/><all in="B w" out="w U" steps="14" symmetry="()"/><all in="B w" out="w W" steps="12" symmetry="()"/>
        <prl in="w" out="R"/>
        <all steps="1" symmetry="()"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B z" out="z f"/><rule in="B b" out="b f"/><rule in="B m" out="m f"/><rule in="B n" out="n f"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31" symmetry="()"/><all in="B s" out="s B" steps="30" symmetry="()"/>
        <all in="B z" out="z Q" steps="10" symmetry="()"/><all in="B z" out="z B" steps="21" symmetry="()"/>
        <all in="B b" out="b P" steps="8" symmetry="()"/><all in="B b" out="b B" steps="23" symmetry="()"/>
        <all in="B m" out="m G" steps="7" symmetry="()"/><all in="B m" out="m B" steps="24" symmetry="()"/>
        <all in="B n" out="n j" steps="5" symmetry="()"/><all in="B n" out="n B" steps="26" symmetry="()"/>
        <all steps="1" symmetry="()"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B z" out="z F"/><rule in="B b" out="b F"/><rule in="B m" out="m F"/><rule in="B n" out="n F"/></all>
        <all steps="31" symmetry="()"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <all in="B z" out="z l" steps="6" symmetry="()"/><all in="B z" out="z B" steps="25" symmetry="()"/>
        <all in="B b" out="b i" steps="7" symmetry="()"/><all in="B b" out="b B" steps="24" symmetry="()"/>
        <all in="B m" out="m e" steps="14" symmetry="()"/><all in="B m" out="m B" steps="17" symmetry="()"/>
        <all in="B n" out="n l" steps="6" symmetry="()"/><all in="B n" out="n B" steps="25" symmetry="()"/>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="z" out="R"/><rule in="b" out="R"/><rule in="m" out="R"/><rule in="n" out="R"/></prl>
        <all in="B v" out="v V" steps="36" symmetry="()"/>
        <all steps="1" symmetry="()"><rule in="B a" out="a A"/><rule in="B p" out="p A"/></all>
        <all in="B a" out="a B" steps="35" symmetry="()"/>
        <all in="B p" out="p I" steps="6" symmetry="()"/><all in="B p" out="p y" steps="3" symmetry="()"/><all in="B p" out="p B" steps="26" symmetry="()"/>
        <prl><rule in="v" out="J"/><rule in="a" out="J"/><rule in="p" out="J"/></prl>
        <all in="B x" out="x X" steps="10" symmetry="()"/><prl in="x" out="X"/>
        <all in="XBBBBX" out="*XXXX*"/>
        <all in="B Y" out="Y *" steps="9" symmetry="()"/>
        <all in="B C" out="C *" steps="3" symmetry="()"/>
        <all in="B t" out="t D" steps="14" symmetry="()"/><prl in="t" out="Z"/>
        <all in="ZB" out="*Z" steps="3"/>
        <all in="B Z" out="Z *" steps="4" symmetry="()"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terreno"/>
  <color symbol="H" hidden="True" name="centro casa"/>
  <color symbol="h" hidden="True" name="segno casa"/>
  <color symbol="s" hidden="True" name="segno scala"/>
  <color symbol="w" hidden="True" name="segno muro"/>
  <color symbol="q" hidden="True" name="segno porta"/>
  <color symbol="z" hidden="True" name="segno focolare"/>
  <color symbol="b" hidden="True" name="segno botti"/>
  <color symbol="m" hidden="True" name="segno tavolo"/>
  <color symbol="n" hidden="True" name="segno panca"/>
  <color symbol="a" hidden="True" name="segno stalla"/>
  <color symbol="v" hidden="True" name="segno muro stalla"/>
  <color symbol="p" hidden="True" name="segno mangiatoia"/>
  <color symbol="x" hidden="True" name="segno palo"/>
  <color symbol="t" hidden="True" name="segno albero"/>
  <color symbol="d" value="5A3820" name="porta"/>
  <color symbol="f" value="B08850" name="pavimento casa" area="house"/>
  <color symbol="F" value="8A6A44" name="solaio"/>
  <color symbol="W" value="E8DCC0" name="intonaco"/>
  <color symbol="U" value="E8DCC0" name="intonaco"/>
  <color symbol="L" value="6A90B0" name="finestra"/>
  <color symbol="R" value="B04A30" name="tegole"/>
  <color symbol="K" value="7A7068" name="comignolo"/>
  <color symbol="O" value="6A4426" name="porta"/>
  <color symbol="o" value="3E2614" name="assi porta"/>
  <color symbol="N" value="4A4038" name="stipiti"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="assi aperte"/>
  <color symbol="T" value="8A6038" name="scala"/>
  <color symbol="k" value="9A7048" name="gradini"/>
  <color symbol="A" value="A07A48" name="pavimento stalla" area="barn"/>
  <color symbol="V" value="8C5034" name="tavole stalla"/>
  <color symbol="J" value="C8A850" name="tetto di paglia"/>
  <color symbol="I" value="6E4E2E" name="arredo mangiatoia"/>
  <color symbol="y" value="E6CC6A" name="arredo fieno"/>
  <color symbol="Q" value="8E8A84" name="arredo focolare"/>
  <color symbol="P" value="7A4A28" name="arredo botti"/>
  <color symbol="G" value="9A6A3A" name="arredo tavolo"/>
  <color symbol="j" value="7E5A36" name="arredo panca"/>
  <color symbol="l" value="C05050" name="arredo letto"/>
  <color symbol="i" value="5E3A20" name="arredo cassapanca"/>
  <color symbol="e" value="A88058" name="arredo scaffale"/>
  <color symbol="g" value="CDB98A" name="aia" area="yard"/>
  <color symbol="r" value="BFA678" name="strada" area="road"/>
  <color symbol="c" value="8A7040" name="campo" area="field"/>
  <color symbol="C" value="A8B858" name="grano" area="field"/>
  <color symbol="X" value="6E5030" name="staccionata"/>
  <color symbol="D" value="5A3A22" name="tronco"/>
  <color symbol="Z" value="5E8A40" name="chioma"/>
  <color symbol="Y" value="E0C050" name="covone" area="yard"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
