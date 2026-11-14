# model.sculpt · gemini-4-hydrogen · 26 s · 1 immagini

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
<sequence values="BHEfhswdrcgQtvapFVUOLRJPyCGqtklMN#90#91#92#94o#20#21" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WV"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="W"/>

  <map scale="1/5 1/5 1" values="BHEhswdrapcgQtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Casa principale attorno a H: 3 dietro, 5 davanti (+1 casuale), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala: lungo il muro posteriore, 4x2 celle con almeno 2 celle libere prima -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Stalla/fienile addossata a un muro laterale (destra o sinistra a caso) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Porta anteriore al centro e sentiero fino al bordo (3 celle di larghezza) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="d[wh]" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>

      <!-- Portico davanti alla porta (2 celle di profondità) -->
      <all in="d/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- Aia attorno a casa, stalla e portico -->
      <all in="[wvpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Espansione dell'aia dove c'è spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muretto/staccionata attorno all'aia, lasciando libero il sentiero r -->
      <all in="cE" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Pozzo nell'aia dove entra un 5x5 di c -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi nel terreno libero attorno all'aia -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BHEfhswdrcgQtvapFVUOLRJPyCGqtklMN#90#91#92#94o#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="t" out="EEEEE/EEtEE/EtltE/EEtEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Muri della casa (w) e zona porta (d): 2 piani da 32 = 64, poi tetto R -->
        <all steps="6"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>

        <!-- Interno casa (h) e scala (s): pavimento f, aria, solaio F a z=32, aria, tetto R a z=64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Stalla (v, a): 1 piano da 32, poi tetto J -->
        <all in="B v" out="v V" steps="32"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="J"/>

        <!-- Portico (p): pali P ai bordi alti 33, tetto J a 34 -->
        <all in="B p" out="y *" steps="1"/>
        <all in="B b" out="y B" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <all in="B p" out="p P" steps="32"/>
        <prl><rule in="y" out="J"/><rule in="p" out="J"/></prl>

        <!-- Staccionata (g): alta 10 -->
        <all in="B g" out="g G" steps="9"/>
        <prl in="g" out="G"/>

        <!-- Pozzo (Q, q): bordo alto 10, acqua alta 5 -->
        <all in="B Q" out="Q Q" steps="9"/>
        <all in="B q" out="q q" steps="4"/>
        <prl in="q" out="B"/>

        <!-- Alberi (t, l): tronco alto 14, chioma -->
        <all in="B t" out="t t" steps="14"/>
        <all in="B l" out="l t" steps="10"/>
        <prl><rule in="t" out="l"/><rule in="l" out="l"/></prl>
        <all in="B l" out="l l" steps="6"/>
        <all in="lB" out="*l" steps="2"/>

        <!-- C. Scala reale: porte, parti incluse, finestre, tetti, pulizia -->
        <!-- Seme della porta d'ingresso: dove il sentiero r incontra il muro W a z=0 -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Parti incluse -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Finestre nella fascia U -->
        <one steps="12">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- Tetti spioventi (casa R, stalla/portico J) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Camino sul tetto della casa -->
        <one in="B B R" out="* V *" steps="1" symmetry="()"/>
        <all in="B V" out="V *" steps="8"/>
      </sequence>
    </map>
  </map>

  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="7A9A5B" name="erba" area="garden"/>
  <color symbol="f" value="C8B58A" name="pavimento" area="house"/>
  <color symbol="F" value="B59B78" name="solaio" area="house"/>
  <color symbol="W" value="D9CFC1" name="muro casa"/>
  <color symbol="V" value="8C6D46" name="legno stalla"/>
  <color symbol="R" value="B34D37" name="tetto casa"/>
  <color symbol="J" value="9E5A3C" name="tetto stalla"/>
  <color symbol="P" value="7A5C3E" name="palo portico"/>
  <color symbol="C" value="C2B280" name="aia" area="courtyard"/>
  <color symbol="G" value="6E472B" name="staccionata"/>
  <color symbol="r" value="B89F7D" name="sentiero" area="courtyard"/>
  <color symbol="Q" value="8A8D8F" name="pietra pozzo"/>
  <color symbol="q" value="4F86A8" name="acqua pozzo"/>
  <color symbol="t" value="5C4033" name="tronco"/>
  <color symbol="l" value="4F772D" name="chioma"/>
  <color symbol="L" value="8ECAE6" name="vetro finestra"/>
  <color symbol="O" value="6E472B" name="porta"/>
  <color symbol="o" value="4A2E1B" name="assi porta"/>
  <color symbol="N" value="8A8D8F" name="stipite"/>
  <color symbol="k" value="A67B5B" name="gradini"/>
  <color symbol="M" value="D9CFC1" name="merli"/>
  <color symbol="U" value="2B2D42" name="feritoia"/>
  <color symbol="T" value="A67B5B" hidden="True"/>
  <color symbol="H" value="C8B58A" hidden="True"/>
  <color symbol="h" value="C8B58A" hidden="True"/>
  <color symbol="s" value="A67B5B" hidden="True"/>
  <color symbol="w" value="D9CFC1" hidden="True"/>
  <color symbol="d" value="6E472B" hidden="True"/>
  <color symbol="a" value="B59B78" hidden="True"/>
  <color symbol="v" value="8C6D46" hidden="True"/>
  <color symbol="p" value="A88C68" hidden="True"/>
  <color symbol="c" value="C2B280" hidden="True"/>
  <color symbol="g" value="7A5C3E" hidden="True"/>
  <color symbol="m" value="C8B58A" hidden="True"/>
  <color symbol="y" value="A88C68" hidden="True"/>
  <color symbol="b" value="000000" hidden="True"/>
  <color symbol="#90" value="000000" hidden="True"/>
  <color symbol="#91" value="000000" hidden="True"/>
  <color symbol="#92" value="000000" hidden="True"/>
  <color symbol="#94" value="000000" hidden="True"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: La porta d'ingresso sul fronte non è chiaramente visibile o definita.; Le finestre appaiono disposte in modo irregolare sulle pareti principali.
Advice: Scolpire un portone principale scuro e ben staccato sul lato frontale.; Allineare le finestre e definire meglio i contorni degli annessi nel cortile.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, f pavimento, r sentiero, Q pietra pozzo, F solaio, V legno stalla, L vetro finestra, R tetto casa, J tetto stalla, P palo portico, C aia, G staccionata, k gradini, W muro casa
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
EEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEE
EEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCC.CCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCQCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCJJJJJJJCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCCCCCCCCCGGEEEEE
EEEEEEEGCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGGCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCGGEEEEE
EEEEEEEGGGGGGGGGGGGGGGGrrrrrGGGGGGGGGGGGGGGGGEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
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
00000022222222222222222222222222222222222222200000
00000022222222222222222222222222222222222222200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
0000002220000000jjjjjjjjjjjjjjjjjjjj00000002200000
0000002220000000jjjjjjjjjjjjjjjjjjjj00000002200000
0000002220000000jjkkkkkkkkkkkkkkkkjj00000002200000
0000002220000000jjkkkkkkkkkkkkkkkkjj00000002200000
0000002220000000jjkkllllllllllllkkjj00000002200000
0000002220000000jjkkllllllllllllkkjj00000002200000
0000002220000000jjkkllmmmmmmmmllkkjj00000002200000
0000002220000000jjkkllmmmmmmmmllkkjj00000002200000
0000002220000000jjkkllmmmmmmmmllkkjj99999902200000
0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa02200000
0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa02200000
0000002220000000jjkkllmmmmmmmmllkkjjabbbaa02200000
0000002220000000jjkkllmmmmmmmmllkkjjabbbaa02200000
0000002220000000jjkkllllllllllllkkjjabbbaa02200000
0000002220000000jjkkllllllllllllkkjjabbbaa02200000
0000002220000000jjkkkkkkkkkkkkkkkkjjabbbaa02200000
0000002220000000jjkkkkkkkkkkkkkkkkjjabbbaa02200000
000000222002.200jjjjjjjjjmjjjjjjjjjjabbbaa02200000
0000002220022200jjjjjjjjjjjjjjjjjjjjaaaaaa02200000
000000222000000000000aaaaaaaaaa0009aaaaaaa02200000
000000222000000000000aaaaaaaaaa0009999999902200000
000000222000000000000aaaaaaaaaa0000000000002200000
000000222000000000000aaaaaaaaa00000000000002200000
00000022222222222222222200002222222222222222200000
00000022222222222222222200002222222222222222200000
00000022222222222222222200002222222222222222200000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
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
.................WWWWWLLWWWWWWWWWWW...............
.................WWWWWLLWWWWLLWWWWW...............
.................WWWWWWWWWWWLLWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWJJJJJJJJWWWWW.JJJJJ.........
.................WWWWWPPPPPPPPWWWWWVVVVVVV........
.................WWWWWPPPPPPPPWWWWWVVVVVVV........
.................WWWWWPPPPPPPPWWWWWVVVVVVV........
.................WWWWWPPPPPPPPWWWWWVVVVVVV........
.................WWWWWPPPPPPPPWWWWWVVVVVVV........
.................WWWWWPPPPPPPPWWWWWVVVVVVV........
.................WWWWWPPPPPPPPWWWWWVVVVVVV........
................GWWWWWPPPPPPPPWWWWWVVVVVVV........
.......GGGGGGGGGGGGGGGGPPPPPGGGGGGGGGGGGGGGGG.....
.......GGGGGGGGGGGGGGGGPPPPPGGGGGGGGGGGGGGGGG.....
......EGGGGGGGGGGGGGGGGPPPPPGGGGGGGGGGGGGGGGG.....
```
Right side (looking from the right):
```
..........................RRR.....................
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRRV..............
..................RRRRRRRRRRRRRRRRRRR.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWLLWWWWWWWWLLWWW.............
..................WWWWLLWLLWWWWLLLWWW.............
..................WWWWLLWLLWWWWLLLWWW.............
..................WWWWLLWWLWWWWLLWWWW.............
..................WWWWWWWWWWWWJJJJJWW.............
..................WWWWWWWWWWJJJJJJJJJJJJ..........
..................WWWWWWWWWVVVVVVVVVVVPP..........
..................WWWWWWWWWVVVVVVVVVVVPP..........
..................WWWWWWWWWVVVVVVVVVVVPP..........
..................WWWWWWWWWVVVVVVVVVVVPP..........
..................WWWWWWWWWVVVVVVVVVVVPP..........
..................WWWWWWWWWVVVVVVVVVVVPP..........
..................WWWWWWWWWVVVVVVVVVVVPP..........
..................WWWWWWWWWVVVVVVVVVVVPP..........
........GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.......
........GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.......
........GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGE......
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
.................WWWWWWLWWLLWWWWWWW...............
.................WWWWWWWWWWLWWWWWWW...............
.................W.....kkkk......WW...............
.................L.....kkkk......WW...............
.................L.....kkkk......WW...............
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
.................W...............LL.....VV........
.................WWWWWWWWWWWWWWWWWW.....VV........
.................WWWWWWWWWWWWWWWWWW.....VV........
.......................P..P.P......VVVVVVV........
......................PPPPPPPP....................
.......................PPPP.PP....................
..................................................
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
.................WWWWWWWWWWWWWWWWWW...............
.................W...............WW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................WWWWWWWWWWWLLWWWWW...............
.................WWWWWWWWWWWLLWWWWW...............
..................................................
..................................................
..................................................
..................................................
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
EEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEE   00000022222222222222222222222222222222222222200000
EEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEE   00000022222222222222222222222222222222222222200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCQCCCGGEEEEE   00000022200000000000000000000000000000220002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCQQCCCGGEEEEE   00000022200000000000000000000000000000220002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjjjaaaaaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjjjaaaaaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkkkkkkkkkkkkkkkjjabbbaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkkkkkkkkkkkkkkkjjabbbaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkllllllllllllkkjjabbbaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkllllllllllllkkjjabbbaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjjabbbaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjjabbbaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjjabbbaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjjabbbaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRJJJJJJJCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjjaaaaaa02200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjj99999902200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkllllllllllllkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkllllllllllllkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkkkkkkkkkkkkkkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkkkkkkkmkkkkkkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjjj00000002200000
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCCCCCCCCCGGEEEEE   000000222000000000000aaaaaaaaaa0000000000002200000
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCCCCCCCCCGGEEEEE   000000222000000000000aaaaaaaaaa0000000000002200000
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCCCCCCCCCGGEEEEE   000000222000000000000aaaaaaaaaa0000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCGGEEEEE   000000222000000000000aaaaaaaaa00000000000002200000
EEEEEEEGGCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCGGEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEGGGGGGGGGGGGGGGGrrrrrGGGGGGGGGGGGGGGGGEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000022222222222222222222222222222222222222200000
EEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEE   00000022222222222222222222222222222222222222200000
EEEEEEEGGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022222222222222222222222222222222222222200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000220000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCC.CCCCCCCCCCCCCCCCCCGGEEEEE   000000222000000000000002.0000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000220000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022200000000000000000000000000000000002200000
EEEEEEEGCCJJJJJJJCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   00000022299999999000000000000000000000000002200000
EEEEEEEGCCJJJJJJJCCCCCCCCCCCCCCCCCCCCCCCCCCGGEEEEE   0000002229aaaaaaa000000000000000000000000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aaaaaajjjjjjjjjjjjjjjjjjjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aabbaajjjjjjjjjjjjjjjjjjjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aabbaajjkkkkkkkkkkkkkkkkjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aabbaajjkkkkkkkkkkkkkkkkjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aabbaajjkkllllllllllllkkjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aabbaajjkkllllllllllllkkjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aabbaajjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aabbaajjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aaaaaajjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229aaaaaajjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEGCCJJJJJJRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002229999999jjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkllllllllllllkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkllllllllllllkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkkkkkkkkkkkknkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjkkkkkkkkkkkkkkkkjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjjj00000002200000
EEEEEEEGCCCCCCCCRRRRRRRRRRRRRRRRRRRCCCCCCCCGGEEEEE   0000002220000000jjjjjjjjjjjjjjjjjjjj00000002200000
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCCCCCCCCCGGEEEEE   000000222000000000000aaaaaaaaaa0000000000002200000
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCCCCCCCCCGGEEEEE   000000222000000000000aaaaaaaaaa0000000000002200000
EEEEEEEGCCCCCCCCCCCCCJJJJJJJJJCCCCCCCCCCCCCGGEEEEE   000000222000000000000aaaaaaaaaa0000000000002200000
EEEEEEEGCCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCGGEEEEE   000000222000000000000aaaaaaaaa00000000000002200000
EEEEEEEGGCCCCCCCCCCCCCCrrrrrCCCCCCCCCCCCCCCGGEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEGGGGGGGGGGGGGGGGrrrrrGGGGGGGGGGGGGGGGGEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000022222222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.16 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 149 nodi, 503 passi, finito in 599 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=erba, f=pavimento, h=honey (marcatore), s=slate (marcatore), w=white (marcatore), d=dead, dark (marcatore), r=sentiero, c=cyan (marcatore), g=green (marcatore), Q=pietra pozzo, v=olive (marcatore), a=alive, gray (marcatore), p=purple (marcatore), F=solaio, V=legno stalla, U=feritoia, L=vetro finestra, R=tetto casa, J=tetto stalla, P=palo portico, y=yellow (marcatore), G=staccionata, q=acqua pozzo, k=gradini, #90=#000000 (marcatore), #91=#000000 (marcatore), #92=#000000 (marcatore), m=magenta (marcatore), b=black (marcatore), W=muro casa, T=Teal (marcatore).
Alla fine: W 61832, G 20250, R 16921, V 10409, E 10125, C 5900, P 5120, J 2869, k 2720, f 2400, L 2168, F 1865, r 450, Q 160.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-35 all×26, one×3, prl×1: 522 celle x4-26 y5-29 z0, passi 2-65
   #38 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 66
#40-41 all×2: 40000 celle x50-104 y55-109 z0-20, passi 67-86
#42-43 all×2: 36000 celle x50-104 y55-109 z20-38, passi 87-104
    #44 all . w → w U (+1) passi=14: ×14, 28000 celle x50-104 y55-109 z38-52, passi 105-118, w→U 12950, .→w 12950, d→W 1050, .→d 1050
      r1 . w → w U ×12950; r2 . d → d W ×1050
#45-48 all×3, prl×1: 29450 celle x50-104 y55-109 z0-64, passi 119-133
    #49 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z1-33, passi 134-164, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
    #50 all . h → h F (+1) passi=1: ×1, 4050 celle x55-99 y60-104 z32-34, passi 165, h→F 1825, .→h 1825, s→F 200, .→s 200
      r1 . h → h F ×1825; r2 . s → s F ×200
    #51 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-65, passi 166-196, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#52-55 prl×2, all×2: 23900 celle x55-124 y60-114 z0-65, passi 197-231
    #56 all . a → a . passi=31: ×31, 23250 celle x105-119 y85-109 z1-32, passi 232-262, a→. 11625, .→a 11625
#57-62 prl×2, all×4: 27365 celle x65-119 y85-119 z0-33, passi 263-330
    #63 all . g → g G passi=9: ×9, 36450 celle x20-134 y25-129 z0-9, passi 331-339, g→G 18225, .→g 18225
#64-142 prl×6, all×13, one×1: 20168 celle x20-134 y25-129 z0-51, passi 340-474
    #143 prl U → W: ×1, 25832 celle x50-104 y55-109 z6-51, passi 475, U→W 25832
#144-149 all×5, one×1: 15664 celle x49-125 y54-120 z32-76, passi 476-503
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#36 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******… passi=4: le celle cercate c'erano, ma mai disposte come nel pattern
#68 all . t → t t passi=14: in quel momento nella griglia non c'erano celle "t"
#69 all . l → l t passi=10: in quel momento nella griglia non c'erano celle "l"
#70 prl t → l (+1): in quel momento nella griglia non c'erano celle "t", "l"
#71 all . l → l l passi=6: in quel momento nella griglia non c'erano celle "l"
#72 all l. → *l passi=2: in quel momento nella griglia non c'erano celle "l"
#73 all W/r → O/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#74 all W/O → O/* passi=4: in quel momento nella griglia non c'erano celle "O"
#76 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#77 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#78 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
… e altri 45
Improve it: answer with the whole program.

## Risposta

<sequence values="BHEfhswdrcgQtvapFVUOLRJPyCGqtklMN#90#91#92#94o#20#21" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WV"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="W"/>

  <map scale="1/5 1/5 1" values="BHEhswdrapcgQtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Casa principale attorno a H: 3 dietro, 5 davanti (+1 casuale), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala: lungo il muro posteriore, 4x2 celle con almeno 2 celle libere prima -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Stalla/fienile addossata a un muro laterale (destra o sinistra a caso) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Porta anteriore al centro e sentiero fino al bordo (3 celle di larghezza) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="d[wh]" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>

      <!-- Portico davanti alla porta (2 celle di profondità) -->
      <all in="d/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- Aia attorno a casa, stalla e portico -->
      <all in="[wvpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Espansione dell'aia dove c'è spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muretto/staccionata attorno all'aia, lasciando libero il sentiero r -->
      <all in="cE" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Pozzo nell'aia dove entra un 5x5 di c -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi nel terreno libero attorno all'aia -->
      <one in="EEE/EEE/EEE" out="***/ *t*/***" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BHEfhswdrcgQtvapFVUOLRJPyCGqtklMN#90#91#92#94o#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="t" out="EEEEE/EEtEE/EtltE/EEtEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Muri della casa (w) e zona porta (d): 2 piani da 32 = 64, poi tetto R -->
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="8"><rule in="B w" out="w U"/><rule in="B d" out="d W"/></all>
        <all steps="16"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="8"><rule in="B w" out="w U"/><rule in="B d" out="d W"/></all>
        <all steps="16"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>

        <!-- Interno casa (h) e scala (s): pavimento f, aria, solaio F a z=32, aria, tetto R a z=64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Stalla (v, a): 1 piano da 32, poi tetto J -->
        <all in="B v" out="v V" steps="32"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="J"/>

        <!-- Staccionata (g): alta 10 -->
        <all in="B g" out="g G" steps="9"/>
        <prl in="g" out="G"/>

        <!-- Pozzo (Q, q): bordo alto 10, acqua alta 5 -->
        <all in="B Q" out="Q Q" steps="9"/>
        <all in="B q" out="q q" steps="4"/>
        <prl in="q" out="B"/>

        <!-- Alberi (t, l): tronco alto 14, chioma -->
        <all in="B t" out="t t" steps="14"/>
        <all in="B l" out="l t" steps="10"/>
        <prl><rule in="t" out="l"/><rule in="l" out="l"/></prl>
        <all in="B l" out="l l" steps="6"/>
        <all in="lB" out="*l" steps="2"/>

        <!-- C. Scala reale: porte, parti incluse, finestre, tetti, pulizia -->
        <!-- Seme della porta d'ingresso: dove il sentiero r incontra il muro W a z=0 -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Parti incluse -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Finestre allineate nella fascia U (alta 8) -->
        <one steps="10">
          <rule in="BUUUUUUUUB/BUUUUUUUUB/BUUUUUUUUB/BUUUUUUUUB/BUUUUUUUUB/BUUUUUUUUB/BUUUUUUUUB/BUUUUUUUUB"
                out="*WWLLLLWW*/*WWLLLLWW*/*WWLLLLWW*/*WWLLLLWW*/*WWLLLLWW*/*WWLLLLWW*/*WWLLLLWW*/*WWLLLLWW*"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- Tetti spioventi (casa R, stalla J) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Camino sul tetto della casa -->
        <one in="B B R" out="* V *" steps="1" symmetry="()"/>
        <all in="B V" out="V *" steps="8"/>
      </sequence>
    </map>
  </map>

  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="7A9A5B" name="erba" area="garden"/>
  <color symbol="f" value="C8B58A" name="pavimento" area="house"/>
  <color symbol="F" value="B59B78" name="solaio" area="house"/>
  <color symbol="W" value="D9CFC1" name="muro casa"/>
  <color symbol="V" value="8C6D46" name="legno stalla"/>
  <color symbol="R" value="B34D37" name="tetto casa"/>
  <color symbol="J" value="9E5A3C" name="tetto stalla"/>
  <color symbol="P" value="7A5C3E" name="palo portico"/>
  <color symbol="C" value="C2B280" name="aia" area="courtyard"/>
  <color symbol="G" value="6E472B" name="staccionata"/>
  <color symbol="r" value="B89F7D" name="sentiero" area="courtyard"/>
  <color symbol="Q" value="8A8D8F" name="pietra pozzo"/>
  <color symbol="q" value="4F86A8" name="acqua pozzo"/>
  <color symbol="t" value="5C4033" name="tronco"/>
  <color symbol="l" value="4F772D" name="chioma"/>
  <color symbol="L" value="8ECAE6" name="vetro finestra"/>
  <color symbol="O" value="6E472B" name="porta"/>
  <color symbol="o" value="4A2E1B" name="assi porta"/>
  <color symbol="N" value="8A8D8F" name="stipite"/>
  <color symbol="k" value="A67B5B" name="gradini"/>
  <color symbol="M" value="D9CFC1" name="merli"/>
  <color symbol="U" value="2B2D42" name="feritoia"/>
  <color symbol="T" value="A67B5B" hidden="True"/>
  <color symbol="H" value="C8B58A" hidden="True"/>
  <color symbol="h" value="C8B58A" hidden="True"/>
  <color symbol="s" value="A67B5B" hidden="True"/>
  <color symbol="w" value="D9CFC1" hidden="True"/>
  <color symbol="d" value="6E472B" hidden="True"/>
  <color symbol="a" value="B59B78" hidden="True"/>
  <color symbol="v" value="8C6D46" hidden="True"/>
  <color symbol="p" value="A88C68" hidden="True"/>
  <color symbol="c" value="C2B280" hidden="True"/>
  <color symbol="g" value="7A5C3E" hidden="True"/>
  <color symbol="m" value="C8B58A" hidden="True"/>
  <color symbol="y" value="A88C68" hidden="True"/>
  <color symbol="b" value="000000" hidden="True"/>
  <color symbol="#90" value="000000" hidden="True"/>
  <color symbol="#91" value="000000" hidden="True"/>
  <color symbol="#92" value="000000" hidden="True"/>
  <color symbol="#94" value="000000" hidden="True"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
