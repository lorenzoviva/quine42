# model.sculpt · gemini-4-hydrogen · 23 s · 1 immagini

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
  Fattoria:
  - Corpo principale della casa: interno (h), muri (w), porta frontale (d), zona scala interna (s)
  - Ala della stalla/fienile su un lato scelto dal seme: interno (a), muri (v)
  - Portico antistante (p) e strada verso il bordo anteriore (r)
  - Aia (c) intorno alla casa e alla stalla, con pozzo (Q) dove entra un 5x5
  - Orto/frutteto (g) recintato (x) e alberi (t) dove c'e' terreno libero (piu' estesi a Gargantuan)
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdravpcQgxtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa intorno a H: 4 dietro (+1 a caso), 5 davanti (+1 a caso), 5 ai lati -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala interna lungo il muro posteriore -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Ala della stalla su un lato scelto a caso (sinistra o destra) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="2"/>

      <!-- Strada dritta dal centro verso il bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rp" out="*r" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Aia intorno a casa, stalla e portico -->
      <all in="[wvp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Pozzo nell'aia se entra un 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Orto/frutteto sul retro o ai lati dove c'e' spazio, poi recinzione -->
      <all in="[wc]EEEEEEE" out="*gggg***" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x"/>

      <!-- Alberi sparsi dove c'e' terreno libero 5x5 -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****"/>
    </sequence>
    <map scale="5 5 1" values="BEfFWULRKTk#90#91#92OoNAVYPyJCrqugXblhwsdavpQt" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="Q" out="qqqqq/quuuq/quuuq/quuuq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX"/>
      <rule in="t" out="EEEEE/EEbEE/EbbbE/EEbEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="W"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze: casa a due piani -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Porta frontale: O alla base, W sopra -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Pavimenti e solaio della casa + zona scala -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Stalla -->
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="Y"/>
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="Y"/>

        <!-- Portico: pavimento C e tetto J a quota 34 -->
        <all in="B p" out="y C" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- Pozzo, staccionata, alberi -->
        <all in="B q" out="q q" steps="6"/>
        <all in="B u" out="u u" steps="4"/>
        <all in="B X" out="X X" steps="6"/>
        <all in="B b" out="b b" steps="15"/>
        <all in="B b" out="l *" steps="1"/>
        <all in="lB" out="*l" steps="3"/>
        <all in="B l" out="l *" steps="3"/>

        <!-- C. Scala e porta -->
        <import file="part-stair"/>
        <import file="part-door"/>

        <!-- Finestre nelle fasce U -->
        <one steps="14">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- Tetti a padiglione -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <all in="YB" out="*Y" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Pulizia -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="6A7F4A" name="prato" hidden="True"/>
  <color symbol="f" value="C8B89A" name="pavimento" area="house"/>
  <color symbol="F" value="B8A686" name="solaio" area="house"/>
  <color symbol="W" value="D8CFC0" name="intonaco" area="house"/>
  <color symbol="L" value="8EB8C9" name="vetro" area="house"/>
  <color symbol="R" value="A64B38" name="tetto" area="house"/>
  <color symbol="K" value="7A7268" name="camino" area="house"/>
  <color symbol="k" value="9C7A54" name="gradini" area="house"/>
  <color symbol="O" value="6E472B" name="porta" area="house"/>
  <color symbol="o" value="52341E" name="assi della porta" area="house"/>
  <color symbol="N" value="4A3B32" name="stipite" area="house"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <color symbol="A" value="B59E7A" name="pavimento della stalla" area="barn"/>
  <color symbol="V" value="7A5C43" name="muro della stalla" area="barn"/>
  <color symbol="Y" value="8C4A32" name="tetto della stalla" area="barn"/>
  <color symbol="J" value="8B6B4D" name="tettoia" area="porch"/>
  <color symbol="r" value="9C8E78" name="strada" area="yard"/>
  <color symbol="C" value="B0A184" name="aia" area="yard"/>
  <color symbol="q" value="6E757A" name="pietra del pozzo" area="yard"/>
  <color symbol="u" value="4A7B8C" name="acqua del pozzo" area="yard"/>
  <color symbol="g" value="5A6E3A" name="orto" area="garden"/>
  <color symbol="X" value="6E5239" name="staccionata" area="garden"/>
  <color symbol="b" value="5C4028" name="tronco" area="garden"/>
  <color symbol="l" value="3E5C2E" name="chioma" area="garden"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: Pareti laterali spoglie con finestre disperse; Alberi attorno troppo sottili rispetto alla struttura
Advice: Aggiungere travi o dettagli in legno per spezzare le pareti; Ingrossare i tronchi degli alberi per bilanciare le proporzioni
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, r strada, f pavimento, F solaio, W intonaco, L vetro, R tetto, K camino, k gradini, O porta, o assi della porta, N stipite, A pavimento della stalla, V muro della stalla, Y tetto della stalla, J tettoia, C aia, q pietra del pozzo, u acqua del pozzo, b tronco, l chioma
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEElEEEElEEEElEEEEEllEEEEEEElEEEEEEEllEEEllEEE
EEEEEElllEElllEElllEEEEllEEEEEElllEEEEEEllEEEllEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEE
EEEEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEE
EEEEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEE
EEEEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEE
EEEEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEE
EEEEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEE
EEEEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEE
EEEEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCqqCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCqCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCEEE
EEEEEEECCCCCCCCJJJJJJJJrrrrrJJJJJJJJJCCCCCCCCCCEEE
EEEEEEECCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCCCCCEEE
EEEEEEECCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCCCCEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEllEEEEEllEEEllEEEEEErrrrrEEElllEEEEllEEEllEEEEE
EEEllEEEEEllEEEllEEEEEErrrrrEEEElEEEEEllEEEllEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000005000050000500000050000000500000005000050000
00000055500555005550000555000005550000055500555000
00000055500555005550005555000005550000055550555500
00000005000050000500000550000000500000005500055000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
00000000000000jjkkkkkkkkkkkkkkkkkkkjj0000000000000
00000000000000jjkkkkkkkkkkkkkkkkkkkjjcccccccc00000
00000000000000jjkklllllllllllllllkkjjccccccccc0000
00000000000000jjkklllllllllllllllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllknjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjcddddddcc0000
00000000000000jjkkllmmmmmmmmmmmllkkjjccccccccc0000
00000000000000jjkklllllllllllllllkkjjccccccccc0000
00000000000000jjkklllllllllllllllkkjj0000000000000
00000000002200jjkkkkkkkkkkkkkkkkkkkjj0000000000000
00000000002200jjkkkkkkkkkkkkkkkkkkkjj0000000000000
00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
000000000000000aaaaaaaaa0000aaaaaaaaa0000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00055000005500055000000000000000500000550005500000
00555500055550555500000000000005550005555055550000
00055500055500555000000000000005550000555005550000
00005000005000050000000000000000500000050000500000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.......................RRRRRR.....................
.....................RRRRRRRRRR...................
...................RRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
...............RRRRRRRRRRRRRRRRRRRRRR.............
...............WWWWWWWWWWWWWWWWWWWWWW.............
...............WWWWWWWWWWWWWWWWWWWWWW.............
...............WWWWWWWWWWWWWWWWWWWWWW.............
...............WWWWWWWWWWWWWWWWWWWWWW.............
...............WWWWWWWWWWWWWWWWWWWWWW.............
...............WWWWWWWWWWWWWWWWWWWWWW.............
...............WWWWWWWWWWWWWWWWWWWWWW..YYYY.......
...............WWWWWWWWWWWWWWWWWWWWWWYYYYYYYY.....
...............WWWWWWWWWWWWWWWWWWWWWWVVVVVVVV.....
...............WWWWWWWWWWWWWWWWWWWWWWVVVVVVVV.....
...............WWWWWWWWWWWWWWWWWWWWWWVVVVVVVV.....
...............WWWWWWWWNooooOWWWWWWWWVVVVVVVV.....
...............WWWWWWWWNooooOWWWWWWWWVVVVVVVV.....
...............WWWWWWWWNooooOWWWWWWWWVVVVVVVV.....
...ll.lll.llll.llWWWWWWOooooWWWlllWWWVllVVVllll...
...ll.lll.llll.llWWWWWWWooooWWWlllWWWVllVVVllll...
....b..b..b.b..bWWWWWWWWooooWWWWbWWWWVVbVVVVbb....
....b..b..b.b..bWWWWWWWWooooWWWWbWWWWVVbVVVVbb....
....b..b..b.b..bWWWWWWWWooooWWWWbWWWWVVbVVVVbb....
....b..b..bbb..bWWWWWWWNooooOWWWbWWWWVVbVVVVbb....
...Eb..b..bEb..bWWWWWWWrooooEWWWbWWWWVVbVVVVbbE...
```
Right side (looking from the right):
```
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
.................RRRRRRRRRRRRRRRRRRRRR............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWLLWWWWWWLLWWWWWWW............
.................WLLWLLYYYYYYYLWWWWWWW............
.................WLLWYYYYYYYYYYYWWWWWW............
.................WWWYYYYYYYYYYYYYWWWWW............
.................WWWVVVVVVVVVVVVVWWWWW............
.................WWWVVVVVVVVVVVVVWWWWWW...........
.................WWWVVVVVVVVVVVVVWWWWW............
.................WWWVVVVVVVVVVVVVWWWWW............
.................WWWVVVVVVVVVVVVVWWWWW............
.................WWWVVVVVVVVVVVVVWWWWW............
...ll............WWWVVVVVVVVVVVVVWWWWW.......ll...
...ll............WWWVVVVVVVVVVVVVWWWWW.......ll...
....b............WWWVVVVVVVVVVVVVWWWWW.......b....
....b............WWWVVVVVVVVVVVVVWWWWW.......b....
....b............WWWVVVVVVVVVVVVVWWWWW.......b....
....b............WWWVVVVVVVVVVVVVWWWWW.......b....
...Eb...........EWWWVVVVVVVVVVVVVWWWWWE......bE...
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
...............WWWWWWWWWWWLLWWWWWWWWW.............
...............WW....WkkkW.........WW.............
...............WW.....kkk..........WW.............
...............WW.....kkk..........WWVVVVVVVV.....
...............WW.....kkk..........WWVVVVVVVV.....
...............WW..................WW......VV.....
...............WW..................WW......VV.....
...............WW..................WW......VV.....
...............LL..................WW......VV.....
...............LL..................WW......VV.....
...............WW..................WW......VV.....
...............WW..................WW......VV.....
...............WW..................WW......VV.....
...............WW..................WW......VV.....
...............WW..................WW......VV.....
...............WW..................WWVVVVVVVV.....
...............WW..................WW.............
...............LL..................WW.............
...............LL..................WW.............
...............WW..................WW.............
...............WWWWWWWWoooooWWWWWWWWW.............
..................................................
..................................................
..................................................
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
...............WWWWWWWWWWLLWWWWWLLWWW.............
...............LL..................LL.............
...............LL..................LL.............
...............WW..................WW.............
...............LL..................LL.............
...............LL..................LL..YYYY.......
...............WW..................WW..YYYY.......
...............WW..................WW..YYYY.......
...............WW..................WW..YYYY.......
...............WW..................WW..YYYY.......
...............WW..................WW..YYYY.......
...............LL..................WW..YYYY.......
...............LL..................LL..YYYY.......
...............WW..................LL..YYYY.......
...............LL..................WW..YYYY.......
...............LL..................WW.............
...............WW..................WW.............
...............WW..................WW.............
...............WW..................WW.............
...............WW..................WW.............
...............WWWWWWWWWWWWWWWWWWWWWW.............
..................................................
..................................................
..................................................
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
......................RRRRRRRR....................
......................RRRRRRRR....................
......................RRRRRRRR....................
......................RRRRRRRR....................
......................RRRRRRRR....................
......................RRRRRRRR....................
......................RRRRRRRR....................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000005000000500005000050000000500005000050000000
EEEEEEElEEEEEllEEEllEEEllEEEEEEElEEEElEEEElEEEEEEE   00000055500005550055500555000005550055500555000000
EEEEEElllEEEEllEEEllEEEllEEEEEElllEElllEElllEEEEEE   00000055500055550555505555000005550055500555000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000005000005500055000550000000500005000050000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000022000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCuuCCCCCCCCCCCCCEEEEE   00000000000000000000000000000022000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000022000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccccccccjjkkkkkkkkkkkkkkkkkkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccccccccjjkkkkkkkkkkkkkkkkkkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkklllllllllllllllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjknlllllllllllllllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccccccccjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccccccccjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkklllllllllllllllkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkklllllllllllllllkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkkkkkkkkkkkkkkkkkkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkkkkkkkkkkkkkkkkkkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
EEEEECCCCCCCCCCJJJJJJJJrrrrrJJJJJJJJJCCCCCCCCEEEEE   000000000000000aaaaaaaaa0000aaaaaaaaa0000000000000
EEEEECCCCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00055000550005500055000000000000000550000005500000
EEEllEEEllEEEllEEEllEEErrrrrEEEEEEEllEEEEEEllEEEEE   00555505555055550555500000000000005555000055550000
EEEllEEEllEEEllEEEllEEErrrrrEEEEEEEllEEEEEEllEEEEE   00055500555005550055500000000000005550000005550000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00005000050000500005000000000000000500000000500000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00005000000050000000500000050000005000005000050000
EEEllEEEEEEElEEEEEEEllEEEEElEEEEEllEEEEEllEEEllEEE   00055500000555000005550000555000055500055500555000
EEEllEEEEEElllEEEEEEllEEEElllEEEEllEEEEEllEEEllEEE   00555500000555000005555000555000555500055550555500
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00055000000050000000550000050000055000005500055000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCqqCCCEEEEE   00000000000000000000000000000000000000002200000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCqCCCCEEEEE   00000000000000jjjjjjjjjjjjjjjjjjjjjjj0002200000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjjjjjjjjjjjjjjjjjjjjjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkkkkkkkkkkkkkkkkkkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkkkkkkkkkkkkkkkkkkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkklllllllllllllllkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkklllllllllllllllkkjm0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   00000000000000jjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccccccccjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccccccccjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkllmmmmmmmmmmmllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkklllllllllllllllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkklllllllllllllllkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkkkkkkkkkkkkkkkkkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccdddddcjjkkkkkkkkkkkkkkkkkkkjj0000000000000
EEEEECYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccccccccjjjjjjjjjjjjjjjjjjjjjjj0000000000000
EEEEECCYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCEEEEE   000000ccccccccjjjjjjjjjjjjjjjjjjjjjjj0000000000000
EEEEECCCCCCCCCCJJJJJJJJrrrrrJJJJJJJJJCCCCCCCCEEEEE   000000000000000aaaaaaaaa0000aaaaaaaaa0000000000000
EEEEECCCCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCCCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCCCEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000005000050000500000000000000500005000005500000
EEEEEElllEElllEElllEEEErrrrrEEElllEElllEEEEllEEEEE   00000055500555005550000000000005550055500055550000
EEEEEEElEEEElEEEElEEEEErrrrrEEEElEEEElEEEEEllEEEEE   00000055500555005550000000000005550055500005550000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000005000050000500000000000000500005000000500000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.22 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 123 nodi, 633 passi, finito in 682 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=prato (marcatore), h=honey, w=white, s=slate, d=dead, dark, r=strada, a=alive, gray, v=olive, p=purple, c=cyan, Q=aQua, t=teal, m=magenta, f=pavimento, F=solaio, W=intonaco, U=blUe, L=vetro, R=tetto, K=camino, T=Teal (marcatore), k=gradini, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), O=porta, o=assi della porta, N=stipite, A=pavimento della stalla, V=muro della stalla, Y=tetto della stalla, y=yellow, J=tettoia, C=aia, q=pietra del pozzo, u=acqua del pozzo, b=tronco, l=chioma.
Alla fine: W 71083, R 26945, V 16000, E 10060, C 6600, Y 3386, L 3232, f 3025, F 2865, k 2720, l 2132, o 2130, b 1040, A 600, r 525, J 250, N 235, O 120, q 112, u 45, K 11.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-38 all×23, prl×2, one×4: 534 celle x2-27 y2-29 z0, passi 2-80
   #40 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 81
    #42 all . w → w W passi=6: ×6, 13500 celle x45-109 y50-114 z0-6, passi 82-87, w→W 6750, .→w 6750
    #43 all . w → w U passi=14: ×14, 31500 celle x45-109 y50-114 z6-20, passi 88-101, w→U 15750, .→w 15750
#44-45 all×2: 40500 celle x45-109 y50-114 z20-38, passi 102-119
    #46 all . w → w U passi=14: ×14, 31500 celle x45-109 y50-114 z38-52, passi 120-133, w→U 15750, .→w 15750
    #47 all . w → w W passi=12: ×12, 27000 celle x45-109 y50-114 z52-64, passi 134-145, w→W 13500, .→w 13500
#48-53 prl×2, all×4: 17250 celle x45-109 y50-114 z0-64, passi 146-213
    #54 all . h → h . passi=31: ×31, 175150 celle x50-104 y55-109 z1-32, passi 214-244, h→. 87575, .→h 87575
#55-56 all×2: 18050 celle x50-104 y55-109 z2-33, passi 245-275
    #57 all . h → h . (+1) passi=31: ×31, 187550 celle x50-104 y55-109 z33-64, passi 276-306, h→. 87575, .→h 87575, s→. 6200, .→s 6200
      r1 . h → h . ×87575; r2 . s → s . ×6200
#58-59 prl×1, all×1: 4225 celle x50-129 y55-109 z0-64, passi 307-308
    #60 all . a → a . passi=39: ×39, 46800 celle x110-129 y65-94 z1-40, passi 309-347, a→. 23400, .→a 23400
#61-62 prl×1, all×1: 32600 celle x110-134 y60-99 z0-40, passi 348-388
#63-115 prl×6, all×22, one×1: 41991 celle x8-141 y8-141 z0-50, passi 389-601
    #116 prl U → W: ×1, 28268 celle x45-109 y50-114 z6-51, passi 602, U→W 28268
#117-122 all×5, one×1: 25117 celle x44-135 y49-115 z40-79, passi 603-633
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/h → h/* passi=1
#24 all r/p → */r passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all [wc]EEEEEEE → *gggg*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#36 all gE/*g → *g/**: in quel momento nella griglia non c'erano celle "g"
#37 all gE → *x: in quel momento nella griglia non c'erano celle "g"
#69 all . X → X X passi=6: in quel momento nella griglia non c'erano celle "X"
#75 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#76 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#77 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#78 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#79 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#80 all . I → I * passi=30: in quel momento nella griglia non c'erano celle "I"
… e altri 16
Improve it: answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdravpcQgxtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa intorno a H: 4 dietro (+1 a caso), 5 davanti (+1 a caso), 5 ai lati -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala interna lungo il muro posteriore -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Ala della stalla su un lato scelto a caso (sinistra o destra) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="2"/>

      <!-- Strada dritta dal centro verso il bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rp" out="*r" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Aia intorno a casa, stalla e portico -->
      <all in="[wvp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Pozzo nell'aia se entra un 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Orto/frutteto dove c'e' spazio, poi recinzione -->
      <all in="[wc]EEEEE" out="*ggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x"/>

      <!-- Alberi sparsi dove c'e' terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="8"/>
    </sequence>
    <map scale="5 5 1" values="BEfFWULRKTk#90#91#92OoNAVYPyJCrqugXblhwsdavpQt" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="Q" out="qqqqq/quuuq/quuuq/quuuq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX"/>
      <rule in="t" out="EEEEE/EbbbE/EbbbE/EbbbE/EEEEE"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="W"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze: casa a due piani con travi marcapiano in legno (J) -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="10"/><all in="B w" out="w J" steps="2"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="10"/><all in="B w" out="w J" steps="2"/>
        <prl in="w" out="R"/>

        <!-- Porta frontale: O alla base, W sopra -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Pavimenti e solaio della casa + zona scala -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Stalla -->
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="Y"/>
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="Y"/>

        <!-- Portico: pavimento C e tetto J a quota 34 -->
        <all in="B p" out="y C" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- Pozzo, staccionata, alberi con tronchi robusti e chiome tondeggianti -->
        <all in="B q" out="q q" steps="6"/>
        <all in="B u" out="u u" steps="4"/>
        <all in="B X" out="X X" steps="6"/>
        <all in="B b" out="b b" steps="14"/>
        <all in="B b" out="l *" steps="1"/>
        <all in="lB" out="*l" steps="3"/>
        <all in="B l" out="l *" steps="6"/>
        <all in="*****/*****/**B**/*****/***** **l**/**l**/lllll/**l**/**l**" out="*****/*****/**l**/*****/***** *****/*****/*****/*****/*****" steps="2" symmetry="()"/>

        <!-- C. Scala e porta -->
        <import file="part-stair"/>
        <import file="part-door"/>

        <!-- Finestre nelle fasce U con cornici in legno N -->
        <one steps="12">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="WL" out="NL" symmetry="(x)" steps="1"/>

        <!-- Tetti a padiglione -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <all in="YB" out="*Y" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Pulizia -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="6A7F4A" name="prato" hidden="True"/>
  <color symbol="f" value="C8B89A" name="pavimento" area="house"/>
  <color symbol="F" value="B8A686" name="solaio" area="house"/>
  <color symbol="W" value="D8CFC0" name="intonaco" area="house"/>
  <color symbol="L" value="8EB8C9" name="vetro" area="house"/>
  <color symbol="R" value="A64B38" name="tetto" area="house"/>
  <color symbol="K" value="7A7268" name="camino" area="house"/>
  <color symbol="k" value="9C7A54" name="gradini" area="house"/>
  <color symbol="O" value="6E472B" name="porta" area="house"/>
  <color symbol="o" value="52341E" name="assi della porta" area="house"/>
  <color symbol="N" value="4A3B32" name="stipite" area="house"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <color symbol="A" value="B59E7A" name="pavimento della stalla" area="barn"/>
  <color symbol="V" value="7A5C43" name="muro della stalla" area="barn"/>
  <color symbol="Y" value="8C4A32" name="tetto della stalla" area="barn"/>
  <color symbol="J" value="8B6B4D" name="travi e tettoia" area="porch"/>
  <color symbol="r" value="9C8E78" name="strada" area="yard"/>
  <color symbol="C" value="B0A184" name="aia" area="yard"/>
  <color symbol="q" value="6E757A" name="pietra del pozzo" area="yard"/>
  <color symbol="u" value="4A7B8C" name="acqua del pozzo" area="yard"/>
  <color symbol="g" value="5A6E3A" name="orto" area="garden"/>
  <color symbol="X" value="6E5239" name="staccionata" area="garden"/>
  <color symbol="b" value="5C4028" name="tronco" area="garden"/>
  <color symbol="l" value="3E5C2E" name="chioma" area="garden"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
