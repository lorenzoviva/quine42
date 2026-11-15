# model.sculpt · claude-fable-5-1 · 114 s

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

The program you wrote:
<!-- FATTORIA: una casa colonica a due piani (h pavimento, w muri, s zona scala lungo il muro di fondo, d porta sul fronte),
     una tettoia aperta (l, P i pali sul bordo) addossata a un fianco della casa, scelto a caso, profonda 4 celle (20 voxel);
     il fienile (a interno, v muri, b bocca aperta verso l'aia) dietro la casa, spostato lungo il retro a caso;
     l'aia (c, nascosta, area yard) attorno a casa e fienile, chiusa da uno steccato (x) con cancello (G) sull'asse della porta;
     la strada (r, pietre n nell'aia) dritta fino al bordo davanti.
     I semi cambiano: la profondità della casa, il fianco della tettoia, la posizione del fienile e della sua bocca, quella della scala.
     Huge (30x30): casa, tettoia, fienile, aia stretta e steccato.
     Gargantuan (40x40): l'aia si allarga dove la terra continua e ospita il pozzo (Q) e il frutteto (t), e fuori dallo steccato i campi (g). -->
<sequence values="BHEhwsmdlPavbcxGnrQtg" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsmdlPavbcxGnrQtg" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. il corpo della casa attorno ad H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>
      <!-- la tettoia su un fianco, a caso, lunga quanto il muro, profonda 4 -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/l*/**/**" symmetry="(x)" steps="1"/>
      <all symmetry="()">
        <rule in="Ew/lw" out="l*/**"/><rule in="lw/Ew" out="**/l*"/>
        <rule in="wE/wl" out="*l/**"/><rule in="wl/wE" out="**/*l"/>
      </all>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <!-- il fienile dietro la casa, due celle d'aia in mezzo, posizione a caso lungo il retro -->
      <one in="EEEEEEE/EEEEEEE/wwwwwww" out="***a***/*******/*******" symmetry="()" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <one in="aaa/vvv" out="***/bbb" symmetry="()" steps="1"/>
      <!-- l'aia: due anelli attorno a tutto, resa rettangolare -->
      <all in="[wvlc]E" out="*c" symmetry="(xy)" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- l'aia cresce di tre dove sette celle di terra continuano -->
      <all in="cEEEEEEE" out="*ccc****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- lo steccato -->
      <all in="cE" out="*x" symmetry="(xy)"/>
      <all in="cx/xE" out="**/*x" symmetry="(xy)"/>
      <!-- la via d'uscita: porta, lastre nell'aia, cancello, strada fino al bordo; larga tre -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/x" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="Gx" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- la zona della scala lungo il muro di fondo (le file davanti hanno m), due celle di pianerottolo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- i pali della tettoia sul bordo aperto -->
      <all in="l[cn]" out="P*" symmetry="(xy)"/>
      <!-- dove l'aia è larga: il pozzo e il frutteto -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**t**/*****/*****" steps="5"/>
      <!-- fuori dallo steccato, dove cinque celle di terra continuano: i campi -->
      <all in="xEEEEE" out="*gggg*" symmetry="(xy)" steps="1"/>
      <all in="gE/*g" out="*g/**" symmetry="(xy)"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsdlPavbcxGnrQtgfFTWURVYJjpeXZquiAKLOoNkM#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="l" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="P" out="ppppp/ppppp/ppiip/ppiip/ppppp"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="G" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="t" out="ccccc/ccccc/ccucc/ccccc/ccccc"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <sequence symmetry="(xy)">
        <!-- B. i muri della casa: intonaco, fascia delle finestre, intonaco; due piani -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- la colonna della porta: il seme O a terra, poi muro come gli altri -->
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="5"/><all in="B d" out="d U" steps="14"/><all in="B d" out="d W" steps="12"/>
        <all in="B d" out="d W" steps="6"/><all in="B d" out="d U" steps="14"/><all in="B d" out="d W" steps="12"/>
        <prl in="d" out="R"/>
        <!-- i pavimenti, la striscia della scala, il solaio, il soffitto -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- la tettoia: pali di 33, tetto a 33 -->
        <all in="B i" out="i j" steps="33"/><prl in="i" out="J"/>
        <all in="B p" out="y *" steps="1"/><all in="B y" out="y B" steps="32"/><prl in="y" out="J"/>
        <!-- il fienile: muri di 40, bocca aperta per 30 -->
        <all in="B v" out="v V" steps="40"/><prl in="v" out="Y"/>
        <all in="B a" out="a e" steps="1"/><all in="B a" out="a B" steps="39"/><prl in="a" out="Y"/>
        <all in="B b" out="b e" steps="1"/><all in="B b" out="b B" steps="29"/><all in="B b" out="b V" steps="10"/><prl in="b" out="Y"/>
        <!-- lo steccato, il pozzo, gli alberi -->
        <all in="B x" out="x X" steps="6"/><prl in="x" out="X"/>
        <all in="B Q" out="Q Z" steps="7"/><prl in="Q" out="Z"/>
        <all in="B u" out="u j" steps="10"/><prl in="u" out="A"/>
        <all in="AB" out="*A" symmetry="(xyz+)" steps="3"/>
        <!-- C. la porta e la scala -->
        <union symbol="+" values="WU"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- le finestre nella fascia: 14, alte 8, larghe 3, attraverso il muro -->
        <one in="UUUUUB UUUUUB UUUUUB UUUUUB UUUUUB UUUUUB UUUUUB UUUUUB" out="LLLLL* LLLLL* LLLLL* LLLLL* LLLLL* LLLLL* LLLLL* LLLLL*" steps="14"/>
        <all in="LU" out="*L" steps="1"/>
        <prl in="U" out="W"/>
        <prl in="L" out="B"/>
        <!-- i tetti: gronda e padiglione -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="YB" out="*Y" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <!-- il camino -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="h" value="C8A878" name="pavimento di casa" area="house"/>
  <color symbol="w" value="D8D0B8" name="muro di casa"/>
  <color symbol="s" value="A08048" name="zona scala"/>
  <color symbol="d" value="6A4A28" name="porta"/>
  <color symbol="l" value="B89868" name="tettoia" area="porch"/>
  <color symbol="P" value="A88858" name="pali della tettoia" area="porch"/>
  <color symbol="a" value="D0B050" name="fienile" area="barn"/>
  <color symbol="v" value="8A5A30" name="muro del fienile"/>
  <color symbol="b" value="5A3A1A" name="bocca del fienile"/>
  <color symbol="c" value="A8A070" hidden="True" area="yard" name="aia"/>
  <color symbol="x" value="7A5A38" name="steccato"/>
  <color symbol="G" value="9A7A48" name="cancello"/>
  <color symbol="n" value="9A9A90" name="lastre dell'aia"/>
  <color symbol="r" value="8A8070" name="strada"/>
  <color symbol="Q" value="707880" name="pozzo"/>
  <color symbol="t" value="4A8A3A" name="albero" area="orchard"/>
  <color symbol="g" value="7AA848" name="campo" area="field"/>
  <color symbol="f" value="C8A878" name="assi del pavimento" area="house"/>
  <color symbol="F" value="B08858" name="solaio"/>
  <color symbol="W" value="E0D8C0" name="intonaco"/>
  <color symbol="U" value="E0D8C0" hidden="True" name="fascia delle finestre"/>
  <color symbol="R" value="B04830" name="tegole"/>
  <color symbol="V" value="8A5A30" name="tavole del fienile"/>
  <color symbol="Y" value="807048" name="paglia del tetto"/>
  <color symbol="J" value="6A4A28" name="tetto della tettoia"/>
  <color symbol="j" value="5A3A1A" name="legno dei pali"/>
  <color symbol="p" value="B89868" name="terra battuta" area="porch"/>
  <color symbol="e" value="D0B050" name="fieno" area="barn"/>
  <color symbol="X" value="7A5A38" name="assi dello steccato"/>
  <color symbol="Z" value="707880" name="pietre del pozzo"/>
  <color symbol="q" value="4878A8" name="acqua"/>
  <color symbol="A" value="4A8A3A" name="chioma"/>
  <color symbol="K" value="606060" name="camino"/>
  <color symbol="O" value="6A4A28" name="porta"/>
  <color symbol="o" value="3A2410" name="assi della porta"/>
  <color symbol="N" value="907858" name="stipiti"/>
  <color symbol="k" value="A08048" name="gradini"/>
  <color symbol="M" value="E0D8C0" name="merli"/>
  <color symbol="T" value="A08048" hidden="True" name="striscia della scala"/>
  <color symbol="#20" value="6A4A28" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="3A2410" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: varietà: alla taglia Gargantuesca 23 tipi di parti e 50 parti, alla Enorme 23 e 46: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 58 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at gargantuan: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, c aia, n lastre dell'aia, r strada, g campo, f assi del pavimento, F solaio, W intonaco, R tegole, V tavole del fienile, Y paglia del tetto, J tetto della tettoia, j legno dei pali, p terra battuta, e fieno, X assi dello steccato, Z pietre del pozzo, q acqua, A chioma, K camino, O porta, o assi della porta, N stipiti, k gradini
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEE
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccqcccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccccccYYYYYYYYYYYYYYYYYYYccccccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRYYYJJJccccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJccccXXEEE
EEEEEEEXcccccccccccccccnnnnncccccccccccccccccXXEEE
EEEEEEEXcccccccccccccccnnnnncccccccccccccccccXXEEE
EEEEEEEXcccccccccccccccnnnnncccccccccccccccccXXEEE
EEEEEEEXXXXXXXXXXXXXXXXnnnnnXXXXXXXXXXXXXXXXXXXEEE
EEEEEEEXXXXXXXXXXXXXXXXnnnnnXXXXXXXXXXXXXXXXXXXEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000022222222222222222222222222222222222222222000
00000022222222222222222222222222222222222222222000
00000022200000000000000000000000000000000000022000
00000022200000000000000000000000000000000000022000
00000022200000000000000000000000000000000000022000
0000002220000000000cccccccccccccccccccc00000022000
0000002220000000000cccccccccccccccccccc00000022000
0000002220000000000ccddddddddddddddddcc00000022000
0000002220022200000ccddddddddddddddddcc00000022000
0000002220020200000ccdddeeeeeeeeeedddcc00000022000
0000002220022200000ccdddeeeeeeeeeedddcc00000022000
0000002220000000000ccddddddddddddddddcc00000022000
0000002220000000000ccddddddddddddddddcc00000022000
0000002220000000000ccddddddddddddddddcc00000022000
0000002220000000000cccccccccccccccccccc00000022000
0000002220000000jjjjjjjjjjjjjjjjjjjjcccaaa00022000
0000002220003000jjjjjjjjjjjjjjjjjjjjaaaaaa00022000
0000002220034300jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
0000002220033300jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
0000002220000000jjkkllllllllllllkkjjaaaaaa00022000
0000002220000000jjkkllllllllllllkkjjaaaaaa00022000
0000002220003000jjkkllmmmmmmmmllkkjjaaaaaa00022000
0000002220034300jjkkllmmmmmmmmllkkjjaaaaaa00022000
0000002220033300jjkkllmmmmmmmmllkkjjaaaaaa00022000
0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
0000002220000000jjkkllllllllllllkkjjaaaaaa00022000
0000002220000000jjkkllllllllllolkkjjaaaaaa00022000
0000002220033300jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
0000002220034300jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
0000002220003000jjjjjjjjjjjjjjjjjjjjaaaaaa00022000
0000002220000000jjjjjjjjjjjjjjjjjjjjaaaaaa00022000
00000022200000000000000000000000000000000000022000
00000022200000000000000000000000000000000000022000
00000022200000000000000000000000000000000000022000
00000022222222222222222200002222222222222222222000
00000022222222222222222200002222222222222222222000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWYWWWW...............
.................WWWWWWWWWWWWWWWWWWYY.............
.................WWWWWWWWWWWWWWWWWWYYY............
.................WWWWWWWWWWWWWWWWWWVVV............
.................WWWWWWWWWWWWWWWWWWVVVJ...........
.................WWWWWWWWWWWWWWWWWWVVj.j..........
.................WWWWWWNooooOWWWWWWVVj.j..........
.................WWWWWWNooooOWWWWWWVVj.j..........
.................WWWWWWNooooOWWWWWWVVj.j..........
.................WWWWWWNooooOWWWWWWVVj.j..........
.................WWWWWWNooooOWWWWWWVVj.j..........
.................WWWWWWNooooOWWWWWWVVj.j..........
............A....WWWWWWNooooOWWWWWWVVj.j..........
............X...XWWWWWWOooooOWWWWWWVVjXjXX........
.......XXXXXXXXXXXXXXXXXooooXXXXXXXXXXXXXXXXXXX...
......EXXXXXXXXXXXXXXXXrooooXXXXXXXXXXXXXXXXXXX...
```
Right side (looking from the right):
```
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
............YYY...WWWWWWWWWWWWWWWWWWW.............
..........YYYYYYY.WWWWWWWWWWWWWWWWWWW.............
........YYYYYYYYYYWWWWWWWWWWWWWWWWWWW.............
........VVVVVVVVVVWWWWWWWWWWWWWWWWWWW.............
........VVVVVVVVVVWWWWWWWWWWWWWWWWWWW.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWj.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWj.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWj.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWj.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWj.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWj.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWj.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWj.............
........VVVVVVVVVVWjWWjWjWWjWjWWjWjWX.............
...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX........
...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX........
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
....................VVVVVVVVVVVVVVVVVV............
....................VVVVVVVVVVVVVVVVVV............
....................VV...............V............
....................VV...............V............
....................VV...............V............
....................VV...............V............
....................VV...............V............
....................VV...............V............
....................VV...............V............
....................VVVVVVVVVVVV.....V............
.................WWWWWVWWWWWWWWWWWW...............
.................WWWWW.WWWWWWWWWWWW...............
............A..........kkkk......WW...............
.......................kkkk......WW...............
.................W.....kkkk......WW...............
.................W...............WW...............
.................W...............WW...............
............A....W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................................WW...............
.................................WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
............A....W...............WW...............
.................WWWWWWoooooNWWWWWW...............
.................WWWWWWoooooNWWWWWW...............
..................................................
..................................................
..................................................
..................................................
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
......................YYYYYYYYYYYYYYY.............
......................YYYYYYYYYYYYYYY.............
......................YYYYYYYYYYYYYYY.............
......................YYYYYYYYYYYYYYY.............
......................YYYYYYYYYYYYYYY.............
......................YYYYYYYYYYYYYYY.............
................................Y..Y..............
..................................................
.................WWWWWWWWWWW.....WW...............
.................WWWWWWWWWWW.W.W.WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W................................
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................................WW...............
.................................WW...............
.................W...............WW...............
.................WWWWWW.WWWWWWWWWWW...............
.................WWWWWW.WWWWWWWWWWW...............
..................................................
..................................................
..................................................
..................................................
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
EEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEE   00000222222222222222222222222222222222222222222000
EEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEE   00000222222222222222222222222222222222222222222000
EEEEEXXccccccccccccccccccccccccccccccccccccccXXEEE   00000220000000000000000000000000000000000000022000
EEEEEXXccccccccccccccccccccccccccccccccccccccXXEEE   00000220000000000000000000000000000000000000022000
EEEEEXXccccccccccccccccccccccccccccccccccccccXXEEE   00000220000000000000000000000000000000000000022000
EEEEEXXccccccccYYYYYYYYYYYYYYYYYYYcccccccccccXXEEE   00000220000000cccccccccccccccccccc0000000000022000
EEEEEXXccccccccYYYYYYYYYYYYYYYYYYYcccccccccccXXEEE   00000220003000cccccccccccccccccccc0000000000022000
EEEEEXXcccAAcccYYYYYYYYYYYYYYYYYYYccccZZcccccXXEEE   00000220034300ccddddddddddddddddcc0000220000022000
EEEEEXXcccAccccYYYYYYYYYYYYYYYYYYYcccccZcccccXXEEE   00000220003300ccddddddddddddddddcc0000220000022000
EEEEEXXccccccccYYYYYYYYYYYYYYYYYYYcccccccccccXXEEE   00000220000000ccdddeeeeeeeeeedddcc0000000000022000
EEEEEXXccccccccYYYYYYYYYYYYYYYYYYYcccccccccccXXEEE   00000220000000ccdddeeeeeeeeeedddcc0000000000022000
EEEEEXXccccccccYYYYYYYYYYYYYYYYYYYcccccccccccXXEEE   00000220003000ccddddddddddddddddcc0000000000022000
EEEEEXXcccAAcccYYYYYYYYYYYYYYYYYYYcccccccccccXXEEE   00000220034300ccddddddddddddddddcc0000000000022000
EEEEEXXcccAccccYYYYYYYYYYYYYYYYYYYcccccccccccXXEEE   00000220003300ccddddddddddddddddcc0000000000022000
EEEEEXXccccccccYYYYYYYYYYYYYYYYYYYcccccccccccXXEEE   00000220000000cccccccccccccccccccc0000000000022000
EEEEEXXccccccccYRRRRRRRRRRRRRRRRRRRJJJJJJccccXXEEE   00000220000000ccjjjjjjjjjjjjjjjjjjjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000300000jjjjjjjjjjjjjjjjjjjjaaaaaa00022000
EEEEEXXcccAAccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022003430000jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
EEEEEXXcccAcccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000330000jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000000000jjkkllllllllllllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000000000jjkkllllllllllllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000003000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEXXcccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000034300jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000003000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000003000jjkkllllllllllllkkjjaaaaaa00022000
EEEEEXXcccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000034300jjkkllllllllllllkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000003000jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000000000jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000022000000000jjjjjjjjjjjnjjjjjjjjaaaaaa00022000
EEEEEXXcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJccccXXEEE   0000022000000000jjjjjjjjjjjjjjjjjjjjaaaaaa00022000
EEEEEXXccccccccccccccccnnnnncccccccccccccccccXXEEE   00000220000000000000000000000000000000000000022000
EEEEEXXccccccccccccccccnnnnncccccccccccccccccXXEEE   00000220000000000000000000000000000000000000022000
EEEEEXXccccccccccccccccnnnnncccccccccccccccccXXEEE   00000220000000000000000000000000000000000000022000
EEEEEXXXXXXXXXXXXXXXXXXnnnnnXXXXXXXXXXXXXXXXXXXEEE   00000222222222222222222200002222222222222222222000
EEEEEXXXXXXXXXXXXXXXXXXnnnnnXXXXXXXXXXXXXXXXXXXEEE   00000222222222222222222200002222222222222222222000
EEEEEggggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEggggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEggggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEggggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEggggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEggggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEE   00000022222222222222222222222222222222222222222000
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEE   00000022222222222222222222222222222222222222222000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXccccccccYYYYYYYYYYYYYYYYYYYccccccccccXXEEE   0000002220000000cccccccccccccccccccc00000000022000
EEEEEEEXccccccccYYYYYYYYYYYYYYYYYYYccccccccccXXEEE   0000002220000000cccccccccccccccccccc00000000022000
EEEEEEEXccccccccYYYYYYYYYYYYYYYYYYYcccZZcccccXXEEE   0000002220000000ccddddddddddddddddcc00220000022000
EEEEEEEXccccccccYYYYYYYYYYYYYYYYYYYccccZcccccXXEEE   0000002220000000ccddddddddddddddddcc00220000022000
EEEEEEEXccccccccYYYYYYYYYYYYYYYYYYYccccccccccXXEEE   0000002220000000ccdddeeeeeeeeeedddcc00000000022000
EEEEEEEXccccccccYYYYYYYYYYYYYYYYYYYccccccccccXXEEE   0000002220000000ccdddeeeeeeeeeedddcc00000000022000
EEEEEEEXccccccccYYYYYYYYYYYYYYYYYYYccccccccccXXEEE   0000002220003000ccddddddddddddddddcc00000000022000
EEEEEEEXccccAcccYYYYYYYYYYYYYYYYYYYccccccccccXXEEE   0000002220034300ccddddddddddddddddcc00000000022000
EEEEEEEXccccAcccYYYYYYYYYYYYYYYYYYYccccccccccXXEEE   0000002220033300ccddddddddddddddddcc00000000022000
EEEEEEEXccccccccYYYYYYYYYYYYYYYYYYYccccccccccXXEEE   0000002220000000cccccccccccccccccccc00000000022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJccccXXEEE   0000002220000000jjjjjjjjjjjjjjjjjjjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220003000jjjjjjjjjjjjjjjjjjjjaaaaaa00022000
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220034300jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220033300jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220000000jjkkllllllllllllkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220000000jjkkllllllllllllkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220003000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220034300jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220033300jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220003000jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220034300jjkkllmmmmmmmmllkkjjaaaaaa00022000
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220033300jjkkllllllllllllkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220000000jjkkllllllllllllkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220000000jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220003000jjkkkkkkkkkkkkkkkkjjaaaaaa00022000
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJJcccXXEEE   0000002220034300jjjjjjjjjjjjjjjjjjjjaaaaaa00022000
EEEEEEEXccccAcccRRRRRRRRRRRRRRRRRRRJJJJJJccccXXEEE   0000002220033300jjjjjjjjjjjjjjjmjjjjaaaaaa00022000
EEEEEEEXcccccccccccccccnnnnncccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXcccccccccccccccnnnnncccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXcccccccccccccccnnnnncccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXXXXXXXXXXXXXXXXnnnnnXXXXXXXXXXXXXXXXXXXEEE   00000022222222222222222200002222222222222222222000
EEEEEEEXXXXXXXXXXXXXXXXnnnnnXXXXXXXXXXXXXXXXXXXEEE   00000022222222222222222200002222222222222222222000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggrrrrrgggggggggggggggggggEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.10 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 200×200×160, 138 nodi, 720 passi, finito in 987 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald, h=pavimento di casa, w=muro di casa, s=zona scala, m=magenta, d=porta, l=tettoia, P=pali della tettoia, a=fienile, v=muro del fienile, b=bocca del fienile, c=aia (marcatore), x=steccato, G=cancello, n=lastre dell'aia, r=strada, Q=pozzo, t=albero, g=campo, f=assi del pavimento, F=solaio, T=striscia della scala (marcatore), W=intonaco, U=fascia delle finestre (marcatore), R=tegole, V=tavole del fienile, Y=paglia del tetto, J=tetto della tettoia, j=legno dei pali, e=fieno, X=assi dello steccato, Z=pietre del pozzo, u=blue, i=indigo, A=chioma, K=camino, L=Light, O=porta, o=assi della porta, N=stipiti, k=gradini, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), y=yellow.
Alla fine: W 59717, V 27750, X 18375, R 16815, E 14200, c 10695, Y 6553, g 5700, k 2720, o 2130, j 2030, f 2025, F 1865, J 1100, p 1040, e 975, r 525, n 450, N 375, A 300, Z 128, O 120, K 11, q 9.
  #3 map scala 1/5 1/5 1: ×1, 1600 celle x0-39 y0-39 z0-159, passi 1
#5-42 all×30, one×6, prl×1: 1095 celle x5-35 y4-39 z0, passi 2-96
   #44 map scala 5 5 1: ×1, 40000 celle x0-199 y0-199 z0-159, passi 97
#46-47 all×2: 37000 celle x75-129 y80-134 z0-20, passi 98-117
#48-49 all×2: 33300 celle x75-129 y80-134 z20-38, passi 118-135
    #50 all . w → w U passi=14: ×14, 25900 celle x75-129 y80-134 z38-52, passi 136-149, w→U 12950, .→w 12950
#51-62 all×10, prl×2: 37250 celle x75-129 y80-134 z0-64, passi 150-229
    #63 all . h → h . passi=31: ×31, 113150 celle x80-124 y85-129 z1-32, passi 230-260, h→. 56575, .→h 56575
#64-65 all×2: 16050 celle x80-124 y85-129 z2-33, passi 261-291
    #66 all . h → h . (+1) passi=31: ×31, 125550 celle x80-124 y85-129 z33-64, passi 292-322, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#67-70 prl×2, all×2: 7085 celle x80-149 y80-134 z0-64, passi 323-358
    #71 all . y → y . passi=32: ×32, 66560 celle x130-149 y80-134 z1-33, passi 359-390, y→. 33280, .→y 33280
#72-75 prl×2, all×2: 57515 celle x85-149 y50-134 z0-40, passi 391-433
    #76 all . a → a . passi=39: ×39, 70200 celle x90-134 y55-74 z1-40, passi 434-472, a→. 35100, .→a 35100
#77-82 prl×2, all×4: 38475 celle x45-179 y20-164 z0-40, passi 473-520
#83-130 prl×7, all×17, one×1: 22933 celle x45-179 y20-164 z0-51, passi 521-688
#131-138 prl×2, all×5, one×1: 45514 celle x74-140 y49-135 z6-75, passi 689-720
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#90 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#91 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#92 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#93 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#94 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#100 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#101 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#102 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#103 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#104 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#105 all . I → I * passi=30: in quel momento nella griglia non c'erano celle "I"
… e altri 10
Fix it and answer with the whole program.

## Risposta

<!-- FATTORIA: una casa colonica a due piani (h pavimento, w muri, s zona scala lungo il muro di fondo, d porta sul fronte),
     una tettoia aperta (l, P i pali sul bordo) addossata a un fianco della casa, scelto a caso, profonda 4 celle (20 voxel);
     il fienile (a interno, v muri, b bocca aperta verso l'aia) dietro la casa, spostato lungo il retro a caso;
     l'aia (c, nascosta, area yard) attorno a casa e fienile, chiusa da uno steccato (x) con cancello (G) sull'asse della porta;
     la strada (r, pietre n nell'aia) dritta fino al bordo davanti.
     I semi cambiano: la profondità della casa, il fianco della tettoia, la posizione del fienile e della sua bocca, quella della scala.
     Huge (30x30): casa, tettoia, fienile, aia stretta e steccato, qualche albero dove l'aia si allarga.
     Gargantuan (40x40): l'aia si allarga su tutti i lati e ospita il pozzo (Q) e il frutteto (t, un albero ogni finestra di 5x5 di aia), e fuori dallo steccato i campi (g). -->
<sequence values="BHEhwsmdlPavbcxGnrQtg" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsmdlPavbcxGnrQtg" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. il corpo della casa attorno ad H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>
      <!-- la tettoia su un fianco, a caso, lunga quanto il muro, profonda 4 -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/l*/**/**" symmetry="(x)" steps="1"/>
      <all symmetry="()">
        <rule in="Ew/lw" out="l*/**"/><rule in="lw/Ew" out="**/l*"/>
        <rule in="wE/wl" out="*l/**"/><rule in="wl/wE" out="**/*l"/>
      </all>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <!-- il fienile dietro la casa, due celle d'aia in mezzo, posizione a caso lungo il retro -->
      <one in="EEEEEEE/EEEEEEE/wwwwwww" out="***a***/*******/*******" symmetry="()" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <one in="aaa/vvv" out="***/bbb" symmetry="()" steps="1"/>
      <!-- l'aia: due anelli attorno a tutto, resa rettangolare -->
      <all in="[wvlc]E" out="*c" symmetry="(xy)" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- l'aia cresce di tre dove sette celle di terra continuano -->
      <all in="cEEEEEEE" out="*ccc****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- lo steccato -->
      <all in="cE" out="*x" symmetry="(xy)"/>
      <all in="cx/xE" out="**/*x" symmetry="(xy)"/>
      <!-- la via d'uscita: porta, lastre nell'aia, cancello, strada fino al bordo; larga tre -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/x" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="Gx" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- la zona della scala lungo il muro di fondo (le file davanti hanno m), due celle di pianerottolo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- i pali della tettoia sul bordo aperto -->
      <all in="l[cn]" out="P*" symmetry="(xy)"/>
      <!-- dove l'aia è larga: il pozzo, poi il frutteto in ogni finestra libera di 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**t**/*****/*****"/>
      <!-- fuori dallo steccato, dove cinque celle di terra continuano: i campi -->
      <all in="xEEEEE" out="*gggg*" symmetry="(xy)" steps="1"/>
      <all in="gE/*g" out="*g/**" symmetry="(xy)"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsdlPavbcxGnrQtgfFTWURVYJjpeXZquiAKLOoNkM#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="l" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="P" out="ppppp/ppppp/ppiip/ppiip/ppppp"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="G" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="t" out="ccccc/ccccc/ccucc/ccccc/ccccc"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <sequence symmetry="(xy)">
        <!-- B. i muri della casa: intonaco, fascia delle finestre, intonaco; due piani -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- la colonna della porta: il seme O a terra, poi muro come gli altri -->
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="5"/><all in="B d" out="d U" steps="14"/><all in="B d" out="d W" steps="12"/>
        <all in="B d" out="d W" steps="6"/><all in="B d" out="d U" steps="14"/><all in="B d" out="d W" steps="12"/>
        <prl in="d" out="R"/>
        <!-- i pavimenti, la striscia della scala, il solaio, il soffitto -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- la tettoia: pali di 33, tetto a 33 -->
        <all in="B i" out="i j" steps="33"/><prl in="i" out="J"/>
        <all in="B p" out="y *" steps="1"/><all in="B y" out="y B" steps="32"/><prl in="y" out="J"/>
        <!-- il fienile: muri di 40, bocca aperta per 30 -->
        <all in="B v" out="v V" steps="40"/><prl in="v" out="Y"/>
        <all in="B a" out="a e" steps="1"/><all in="B a" out="a B" steps="39"/><prl in="a" out="Y"/>
        <all in="B b" out="b e" steps="1"/><all in="B b" out="b B" steps="29"/><all in="B b" out="b V" steps="10"/><prl in="b" out="Y"/>
        <!-- lo steccato, il pozzo, gli alberi -->
        <all in="B x" out="x X" steps="6"/><prl in="x" out="X"/>
        <all in="B Q" out="Q Z" steps="7"/><prl in="Q" out="Z"/>
        <all in="B u" out="u j" steps="10"/><prl in="u" out="A"/>
        <all in="AB" out="*A" symmetry="(xyz+)" steps="3"/>
        <!-- C. la porta e la scala -->
        <union symbol="+" values="WU"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- le finestre nella fascia: 14, alte 8, larghe 3, attraverso il muro -->
        <one in="UUUUUB UUUUUB UUUUUB UUUUUB UUUUUB UUUUUB UUUUUB UUUUUB" out="LLLLL* LLLLL* LLLLL* LLLLL* LLLLL* LLLLL* LLLLL* LLLLL*" steps="14"/>
        <all in="LU" out="*L" steps="1"/>
        <prl in="U" out="W"/>
        <prl in="L" out="B"/>
        <!-- i tetti: gronda e padiglione -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="YB" out="*Y" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <!-- il camino -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="h" value="C8A878" name="pavimento di casa" area="house"/>
  <color symbol="w" value="D8D0B8" name="muro di casa"/>
  <color symbol="s" value="A08048" name="zona scala"/>
  <color symbol="d" value="6A4A28" name="porta"/>
  <color symbol="l" value="B89868" name="tettoia" area="porch"/>
  <color symbol="P" value="A88858" name="pali della tettoia" area="porch"/>
  <color symbol="a" value="D0B050" name="fienile" area="barn"/>
  <color symbol="v" value="8A5A30" name="muro del fienile"/>
  <color symbol="b" value="5A3A1A" name="bocca del fienile"/>
  <color symbol="c" value="A8A070" hidden="True" area="yard" name="aia"/>
  <color symbol="x" value="7A5A38" name="steccato"/>
  <color symbol="G" value="9A7A48" name="cancello"/>
  <color symbol="n" value="9A9A90" name="lastre dell'aia"/>
  <color symbol="r" value="8A8070" name="strada"/>
  <color symbol="Q" value="707880" name="pozzo"/>
  <color symbol="t" value="4A8A3A" name="albero" area="orchard"/>
  <color symbol="g" value="7AA848" name="campo" area="field"/>
  <color symbol="f" value="C8A878" name="assi del pavimento" area="house"/>
  <color symbol="F" value="B08858" name="solaio"/>
  <color symbol="W" value="E0D8C0" name="intonaco"/>
  <color symbol="U" value="E0D8C0" hidden="True" name="fascia delle finestre"/>
  <color symbol="R" value="B04830" name="tegole"/>
  <color symbol="V" value="8A5A30" name="tavole del fienile"/>
  <color symbol="Y" value="807048" name="paglia del tetto"/>
  <color symbol="J" value="6A4A28" name="tetto della tettoia"/>
  <color symbol="j" value="5A3A1A" name="legno dei pali"/>
  <color symbol="p" value="B89868" name="terra battuta" area="porch"/>
  <color symbol="e" value="D0B050" name="fieno" area="barn"/>
  <color symbol="X" value="7A5A38" name="assi dello steccato"/>
  <color symbol="Z" value="707880" name="pietre del pozzo"/>
  <color symbol="q" value="4878A8" name="acqua"/>
  <color symbol="A" value="4A8A3A" name="chioma"/>
  <color symbol="K" value="606060" name="camino"/>
  <color symbol="O" value="6A4A28" name="porta"/>
  <color symbol="o" value="3A2410" name="assi della porta"/>
  <color symbol="N" value="907858" name="stipiti"/>
  <color symbol="k" value="A08048" name="gradini"/>
  <color symbol="M" value="E0D8C0" name="merli"/>
  <color symbol="T" value="A08048" hidden="True" name="striscia della scala"/>
  <color symbol="#20" value="6A4A28" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="3A2410" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
