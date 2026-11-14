# model.sculpt · gemini-4-hydrogen · 27 s

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

The program you wrote:
<!--
Forte: un mastio centrale (h pavimento, s scala, w mura, d porta) circondato da un cortile (c) con pozzo (Q),
chiuso da una cinta muraria (W) con torri angolari (t) e corpo di guardia frontale (G),
collegato da un lastricato (n) e una strada (r) fino al bordo.
I semi variano le dimensioni del mastio, la posizione della scala, del pozzo e degli alberi (Y).
A Huge (30x30) entra il mastio, il cortile, la cinta e le torri; a Gargantuan (40x40) il cortile si amplia ed entra il fossato (a) e il bosco (Y).
-->
<sequence values="BHEhswdcWtnGrQaY" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcWtnGrQaY" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio attorno a H: 3 dietro, 4 davanti (+1 casuale), 4 ai lati (+1 casuale) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <prl in="H" out="h"/>

      <!-- Mura del mastio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala nel mastio: 4x2 lungo un muro con 2 celle di sbarco -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio (almeno 3 celle) -->
      <all in="[wh]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Ampliamento cortile se c'e' spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Via d'uscita dritta verso il fronte (y crescente): porta d, lastricato n, corpo di guardia G, strada r -->
      <one in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Pozzo nel cortile se entra in 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove c'e' abbastanza terreno -->
      <all in="cWEEEEE" out="**aaa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Alberi nel terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***Y***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdcWtnGrQaYfFTkLMNoOUV" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="ccccc/cWWWc/cWaWc/cWWWc/ccccc"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Y" out="EEEEE/EEEEE/EELEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="wWt"/>
        <union symbol="%" values="wWt"/>
        <union symbol="=" values="fF"/>

        <!-- B. Le altezze -->
        <!-- Mura del mastio: 2 piani (32 + 32 = 64) + 1 di parapetto -->
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w w" steps="12"/>
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w w" steps="13"/>

        <!-- Porta del mastio: O a z=0, poi muro w sopra -->
        <all in="B d" out="w O" steps="1"/>
        <all in="B w" out="w w" steps="64"/>

        <!-- Pavimenti, scala e solai del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>

        <!-- Cinta muraria (24), corpo di guardia (O a z=0, W fino a 36), torri (40) -->
        <all in="B W" out="W W" steps="24"/>
        <all in="B G" out="W O" steps="1"/>
        <all in="B W" out="W W" steps="35"/>
        <all in="B t" out="t t" steps="40"/>

        <!-- Alberi: tronco L alto 10, chioma V -->
        <all in="B L" out="L L" steps="10"/>
        <all in="B L" out="V V" steps="1"/>
        <all in="EV" out="*V" steps="2"/>
        <all in="B V" out="V V" steps="6"/>

        <!-- C. Scala reale: porte, merli, feritoie, scale, finestre -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre nelle fasce U del mastio -->
        <one steps="14">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="w"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="6A8E4E" hidden="True" area="prato"/>
  <color symbol="H" value="FF00FF" name="origine"/>
  <color symbol="f" value="C2B280" name="pavimento mastio" area="mastio"/>
  <color symbol="F" value="A8996E" name="solaio mastio" area="mastio"/>
  <color symbol="w" value="8B8989" name="mura mastio" area="mastio"/>
  <color symbol="W" value="706E6E" name="cinta muraria" area="mura"/>
  <color symbol="t" value="5A5858" name="torre" area="torre"/>
  <color symbol="M" value="6E6C6C" name="merli"/>
  <color symbol="U" value="444444" name="feritoia"/>
  <color symbol="L" value="4A3525" name="legno"/>
  <color symbol="V" value="2E5A27" name="chioma" area="bosco"/>
  <color symbol="k" value="9C7A54" name="gradini"/>
  <color symbol="O" value="5E3A22" name="porta"/>
  <color symbol="o" value="3E2414" name="assi porta"/>
  <color symbol="N" value="4A4848" name="stipite"/>
  <color symbol="c" value="D8C89E" name="cortile" area="cortile"/>
  <color symbol="n" value="9E9B95" name="lastricato" area="cortile"/>
  <color symbol="r" value="B5A478" name="strada" area="strada"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="fossato"/>
  <color symbol="#20" value="5E3A22" hidden="True"/>
  <color symbol="#21" value="3E2414" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2); porta: 10 × 30 voxel (0,50 × 1,50 caselle), una porta è almeno 11 × 30 a ogni taglia — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, w mura mastio, c cortile, W cinta muraria, t torre, a fossato, f pavimento mastio, F solaio mastio, L legno, M merli, N stipite, o assi porta, O porta
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEEE
EEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEE
EEtttttttMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt
EEttttttttaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt
EEttttttttaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt
EEttttttttMWWaWWaWaWWaWWaWaWWWaWaWWaWWaWaMtttttttt
EEttttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMtttttttt
EEtttttccccccccccccccccccccccccccccccccccccccttttt
EEtttttccccccccccccccccccccccccccccccccccccccttttt
EEtttttccccccccccccccccccccccccccccccccccccccttttt
EEEEEMMccccccccccccccccccccccccccccccccccccccMtEEE
EEEEEWWccccccccccccccccccccccccccccccMcccccccWWEEE
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwcccccccccWWEEE
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFwwwccccccccWWEEE
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFwwwccccccccWWEEE
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFwwwccccccccWWEEE
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFwwwwccccccccWWEEE
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFwwwwccccccccWWEEE
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFwwwwccccccccWWEEE
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE
EEEEEMMccccccccccccccccccccccccccccccccccccccMMEEE
EEtttttccccccccccccccccccccccccccccccccccccccttttt
EEtttttccccccccccccccccccccccccccccccccccccccttttt
EEtttttccccccccccccccccccccccccccccccccccccccttttt
EEttttttttMWWcWWcWcWWcWWcWcWWWcWcWWcWWcWcctttttttt
EEttttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMtttttttt
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0ddddddddd0000000000000000000000000000000dddddcddd
0dcccccccd0000000000000000000000000000000dcccccccc
0dcccccccd0000000000000000000000000000000dcccccccc
0dcccccccdjjjjjjjhjjjjjjjhjjjjjhjjjjjjjhjjcccccccc
0dccccccccjjjjjjjhjjjjjjjjjjjjjhjjjjjjjhjjcccccccc
0dccccc00000000000000000000000000000000000000ccccc
0dccccc00000000000000000000000000000000000000ccccc
0dccccc00000000000000000000000000000000000000ccccc
0ddddjj000000000000000000000000000000j0000000jjccc
00000jj000000000000000000000000000000j0000000jj000
00000hh00000000000000000000000000000000000000hh000
00000jj00000000000000000000000000000000000000jj000
00000jj00000000000000000000000000000000000000jj000
00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
00000jj00000000zzjjjjjjjjjjjjjjjjjjzz00000000jj000
00000hh00000000zzlljjjjjjjjjjjjjjjjzz00000000hh000
00000jj00000000jjjljjjjjjjjjjjjjjjjzz00000000jj000
00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
00000jj00000000zzjjjjjjjjjjjjjjjjjjzz00000000jj000
00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
00000jj00000000zzjjjjjjjjjjjjjjjjzzzz00000000jj000
00000jj00000000zzjjjjjjjjjjjjjjjjzzzz00000000jj000
00000hh00000000zzjjjjjjjjjjjjjjjjzzzz00000000hh000
00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
00000jj00000000000000000000000000000000000000jj000
00000jj00000000000000000000000000000000000000jj000
00000jj00000000000000000000000000000000000000jj000
00000jj00000000000000000000000000000000000000jj000
00000jj00000000000000000000000000000000000000jj000
0ddddcc00000000000000000000000000000000000000ccccc
0dccccc00000000000000000000000000000000000000ccccc
0dccccc00000000000000000000000000000000000000ccccc
0dccccccccjjjjjjjhjjjjjjjhjjjjjhjjjjjjjhjjcccccccc
0dccccccccjjjjjjjhjjjjjjjjjjjjjhjjjjjjjhjjcccccccc
0dcccccccd0000000000000000000000000000000dcccccccc
0dcccccccd0000000000000000000000000000000dcccccccc
0dcccccccd0000000000000000000000000000000dcccccccc
0ddddddddd0000000000000000000000000000000dddddcddd
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
.....MM...MM.M.MMwMMwMwMMMMMwMMwMMwMMMM.MM...MM...
.....MM...MM.M.MMwMMwMwMMMMMwMMwMMwMMMM.MM...MM...
.....WW...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...WW...
.....WW...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...WW...
.....WW...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...WW...
.....WW...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...WW...
..M..WM..MWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWM..MWM..
..M.MWM.MMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWM.MMWMM.
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
.EttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
```
Right side (looking from the right):
```
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
........MM...MM.MMwMwMMwMMMMMwMMwMM.M.MM...MM.....
........MM...MM.MMwMwMMwMMMMMwMMwMM.M.MM...MM.....
........WW...WWWWWWWWWWWWWWWWWWWWWWWWWWW...WW.....
........WW...WWWWWWWWWWWWWWWWWWWWWWWWWWW...WW.....
........WW...WWWWWWWWWWWWWWWWWWWWWWWWWWW...WW.....
........WW...WWWWWWWWWWWWWWWWWWWWWWWWWWW...WW.....
.....M..WW..MWWWWWWWWWWWWWWWWWWWWWWWWWWWM..WW..M..
.....MM.WWM.MWWWWWWWWWWWWWWWWWWWWWWWWWWWMM.WWM.M..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..
.....wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt..
.....ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWttttttttt.
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..tttttttt................................tttttttt
..tttttttt................................tttttttt
..tttttttt................................tttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttt......................................ttttt
..ttttt......................................ttttt
..ttttt......................................ttttt
.....WW......................................WW...
.....WW..............................W.......WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW........wwwLLwwwwLLwwwwwwwwww.........WW...
.....WW........wwwLLwwwwLLwwwwwwwwwww........WW...
.....WW........www...............wwww........WW...
.....WW........www................www........WW...
.....WW........ww..................ww........WW...
.....WW........ooo.................LL........WW...
.....WW........ooo.................LL........WW...
.....WW........www...............wwww........WW...
.....WW........www................www........WW...
.....WW........ww..................ww........WW...
.....WW........Lww................www........WW...
.....WW........www...............wwww........WW...
.....WW........ww................wwww........WW...
.....WW........ww................wwww........WW...
.....WW........ww................wwww........WW...
.....WW........wwwwwwLLwwwLLLLwwwwwww........WW...
.....WW........wwwwwwLLwwwLLLLwwwwwww........WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW......................................WW...
..ttttt......................................ttttt
..ttttt......................................ttttt
..ttttt......................................ttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..ttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttt
..tttttttt................................tttttttt
..tttttttt................................tttttttt
..tttttttt................................tttttttt
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
.........M........................................
..................................................
..................................................
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........
..................................................
..................................................
..................................................
.....W.......................................W....
.....WW..............................W.......WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW........wwwwLLLwwwwwwwwwwwwww.........WW...
.....WW........wwwwLLLwwwwwwwwwwwwwww........WW...
.....WW........www...............wwww........WW...
.....WW........www................www........WW...
.....WW........ww..................ww........WW...
.....WW........www.................ww........WW...
.....WW........www.................ww........WW...
.....WW........www...............wwww........WW...
.....WW........Lww................www........WW...
.....WW........ww..................ww........WW...
.....WW........www................www........WW...
.....WW........www...............wwww........WW...
.....WW........ww................wwww........WW...
.....WW........ww................wwww........WW...
.....WW........ww................wwww........WW...
.....WW........wwLLwwwwwwwLLwwwwwwwww........WW...
.....WW........wwLLwwwwwwwLLwwwwwLwww........WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW......................................WW...
.....WW......................................WW...
..................................................
..................................................
..................................................
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........
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
...............wwwwwwwwwwwwwwwwwwwww..............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............www...............wwww.............
...............www................www.............
...............ww..................ww.............
...................................ww.............
...................................ww.............
...............www...............wwww.............
...............www................www.............
...............ww..................ww.............
...............www................www.............
...............www...............wwww.............
...............ww................wwww.............
...............ww................wwww.............
...............ww................wwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
EEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEE   00000000000000000000000000000000000000000000000000
EEtttttttMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt   0ddddddddd0000000000000000000000000000000dddddcddd
EEttttttttaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEttttttttaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEttttttttMWWaWWaWaWWaWWaWaWWWaWaWWaWWaWaMtttttttt   0dcccccccdjjjjjjjhjjjjjjjhjjjjjhjjjjjjjhjjcccccccc
EEttttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMtttttttt   0dccccccccjjjjjjjhjjjjjjjjjjjjjhjjjjjjjhjjcccccccc
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEEEEMMccccccccccccccccccccccccccccccccccccccMtEEE   0ddddjj000jj000000000000000000000000000000000jjccc
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj000jj000000000000000000000000000000000jj000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000hh00000000000000000000000000000000000000hh000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwcccccccccWWEEE   00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE   00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000hh00000000zzzzjjjjjjjjjjjjjjzzzz00000000hh000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000jjlljjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFwwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000hh00000000zzzzjjjjjjjjjjjjjjjjzz00000000hh000
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE   00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE   00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEMMccccccccccccccccccccccccccccccccccccccMMEEE   00000jj00000000000000000000000000000000000000jj000
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0ddddcc00000000000000000000000000000000000000ccccc
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEttttttttMWWcWWcWcWWcWWcWcWWWcWcWWcWWcWcctttttttt   0dccccccccjjjjjjjhjjjjjjjhjjjjjhjjjjjjjhjjcccccccc
EEttttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMtttttttt   0dccccccccjjjjjjjhjjjjjjjhjjjjjhjjjjjjjhjjcccccccc
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0ddddddddd0000000000000000000000000000000dddddcddd
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEEEEEEE   00000000000000000000000000000000000000000000000000
EEtttttttMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt   0ddddddddd0000000000000000000000000000000dddddcddd
EEttttttttaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEttttttttaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaatttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEttttttttMWWaWWaWaWWaWWaWaWWWaWaWWaWWaWaMtttttttt   0dcccccccdjjjjjjjhjjjjjjjhjjjjjhjjjjjjjhjjcccccccc
EEttttttttMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMtttttttt   0dccccccccjjjjjjjhjjjjjjjjjjjjjhjjjjjjjhjjcccccccc
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEtttttccccccccccccccccccccccccccccccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEEEEMMccccccccccccccccccccccccccccccccccccccMtEEE   0ddddjj00000000000000000000000000000000000000jjccc
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000hh00000000000000000000000000000000000000hh000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWccccccccccccccccccccccccccccccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwcccccccccWWEEE   00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE   00000jj00000000zzzzzzzzzzzzzzzzzzzzzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000hh00000000zzzzjjjjjjjjjjjjjjzzzz00000000hh000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzjjjjjjjjjjjjjjjjjjzz00000000jj000
EEEEEWWccccccccwwFFFFFFFFFFFFFFFFFFwwccccccccWWEEE   00000jj00000000zzzzjjjjjjjjjjjjjjzzzz00000000jj000
EEEEEWWccccccccwwwFFFFFFFFFFFFFFFwwwwccccccccWWEEE   00000hh00000000zzzzjjjjjjjjjjjjjjzzzz00000000hh000
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE   00000jj00000000zzzzzzzzzzzzzzzjjjzzzz000jj000jj000
EEEEEWWccccccccwwwwwwwwwwwwwwwwwwwwwwccccccccWWEEE   00000jj00000000zzzzzzzzzzzzzzzjjjjjzz000jj000jj000
EEEEEWWcccccccccccccccccccccccnnnnnccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWcccccccccccccccccccccccnnnnnccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWcccccccccccccccccccccccnnnnnccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEWWcccccccccccccccccccccccnnnnnccccccccccWWEEE   00000jj00000000000000000000000000000000000000jj000
EEEEEMMcccccccccccccccccccccccnnnnnccccccccccMMEEE   00000jj00000000000000000000000000000000000000jj000
EEtttttcccccccccccccccccccccccnnnnnccccccccccttttt   0ddddcc00000000000000000000000000000000000000ccccc
EEtttttcccccccccccccccccccccccnnnnnccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEtttttcccccccccccccccccccccccnnnnnccccccccccttttt   0dccccc00000000000000000000000000000000000000ccccc
EEttttttttMWWcWWcWcWWcWcWWcWWMwwwwwMWWcWcctttttttt   0dccccccccjjjjjjjhjjjjhjjjjjjjbbbbbjjjjhjjcccccccc
EEttttttttMWWWWWWWWWWWWWWWWWWMwwwwwMWWWWWMtttttttt   0dccccccccjjjjjjjhjjjjhjjjjjjjbbbbbjjjjhjjcccccccc
EEttttttttEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEtttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEttttttttEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEtttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEttttttttEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEtttttttt   0dcccccccd0000000000000000000000000000000dcccccccc
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEE   0ddddddddd0000000000000000000000000000000dddddcddd
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.05 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 129 nodi, 585 passi, finito in 706 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=origine, E=Emerald (marcatore), h=honey, w=mura mastio, d=dead, dark, c=cortile, W=cinta muraria, t=torre, Q=aQua, a=fossato, f=pavimento mastio, F=solaio mastio, L=legno, M=merli, N=stipite, o=assi porta, O=porta, U=feritoia, #90=? (marcatore), #91=? (marcatore).
Alla fine: w 172246, W 91848, t 73500, c 8241, E 5725, F 3950, M 3690, L 2496, f 1975, a 1426, o 1380, N 290, O 120.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-31 all×15, prl×2, one×2: 694 celle x1-29 y2-28 z0, passi 2-38
   #36 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 39
    #38 all . w → w w passi=6: ×6, 7350 celle x45-109 y55-104 z1-6, passi 40-45, .→w 7350
    #39 all . w → w U passi=14: ×14, 34300 celle x45-109 y55-104 z6-20, passi 46-59, w→U 17150, .→w 17150
#40-41 all×2: 22050 celle x45-109 y55-104 z21-38, passi 60-77
    #42 all . w → w U passi=14: ×14, 34300 celle x45-109 y55-104 z38-52, passi 78-91, w→U 17150, .→w 17150
#43-44 all×2: 16025 celle x45-109 y55-104 z0-65, passi 92-105
    #45 all . w → w w passi=64: ×64, 69350 celle x45-109 y55-104 z2-119, passi 106-169, .→w 69350
    #46 all . h → h f (+1) passi=1: ×1, 3950 celle x50-104 y60-99 z0-1, passi 170, h→f 1975, .→h 1975
      r1 . h → h f ×1975; r2 . s → s f ×0
    #48 all . h → h . passi=31: ×31, 122450 celle x50-104 y60-99 z1-32, passi 171-201, h→. 61225, .→h 61225
    #50 all . h → h F (+1) passi=1: ×1, 3950 celle x50-104 y60-99 z32-33, passi 202, h→F 1975, .→h 1975
      r1 . h → h F ×1975; r2 . s → s F ×0
    #51 all . h → h . (+1) passi=31: ×31, 122450 celle x50-104 y60-99 z33-64, passi 203-233, h→. 61225, .→h 61225
      r1 . h → h . ×61225; r2 . s → s . ×0
    #52 prl h → F (+1): ×1, 1975 celle x50-104 y60-99 z64, passi 234, h→F 1975
      r1 h → F ×1975; r2 s → F ×0
    #53 all . W → W W passi=24: ×24, 42192 celle x15-139 y25-134 z1-24, passi 235-258, .→W 42192
    #55 all . W → W W passi=35: ×35, 61530 celle x15-139 y25-134 z25-59, passi 259-293, .→W 61530
    #56 all . t → t t passi=40: ×40, 84000 celle x5-149 y15-144 z1-40, passi 294-333, .→t 84000
#67-128 all×12, prl×2, one×1: 38152 celle x5-149 y15-144 z0-71, passi 334-584
    #129 prl U → w: ×1, 58736 celle x5-149 y15-144 z6-57, passi 585, U→w 58736
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#13 one wwwwwww/whhhhhh/whhhhhh → *******/***ssss/***ssss passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#23 all [dn]/c → */n: le celle cercate c'erano, ma mai disposte come nel pattern
#24 all [nG]/W → */G: in quel momento nella griglia non c'erano celle "nG"
#25 all [Gr]/E → */r: in quel momento nella griglia non c'erano celle "Gr"
#27 all nc → *n passi=1: in quel momento nella griglia non c'erano celle "n"
#28 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G"
#29 all rE → *r passi=1: in quel momento nella griglia non c'erano celle "r"
#32 all [Wt]E/*a → **/*a: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all aE/*a → *a/**: le celle cercate c'erano, ma mai disposte come nel pattern
#34 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***Y***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#47 all . s → s T passi=1: in quel momento nella griglia non c'erano celle "s"
… e altri 55
Fix it and answer with the whole program.

## Risposta

<!--
Forte: un mastio centrale (h pavimento, s scala, w mura, d porta) circondato da un cortile (c) con pozzo (Q),
chiuso da una cinta muraria (W) con torri angolari (t) e corpo di guardia frontale (G),
collegato da un lastricato (n) e una strada (r) fino al bordo.
I semi variano le dimensioni del mastio, la posizione della scala, del pozzo e degli alberi (Y).
A Huge (30x30) entra il mastio, il cortile, la cinta e le torri; a Gargantuan (40x40) il cortile si amplia ed entra il fossato (a) e il bosco (Y).
-->
<sequence values="BHEhswdcWtnGrQaYm" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcWtnGrQaYm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio attorno a H: 3 dietro, 4 davanti (+1 casuale), 4 ai lati (+1 casuale) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>

      <!-- Mura del mastio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala nel mastio: 4x2 lungo un muro con 2 celle di sbarco -->
      <one in="whhhhhhh/whhhhhhh" out="***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio (almeno 3 celle) -->
      <all in="[wh]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Ampliamento cortile se c'e' spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Via d'uscita dritta verso il fronte (y crescente): porta d, lastricato n, corpo di guardia G, strada r -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="[mh]/w" out="*/d" symmetry="()"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Pozzo nel cortile se entra in 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove c'e' abbastanza terreno -->
      <all in="cWEEEEE" out="**aaa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Alberi nel terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***Y***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdcWtnGrQaYfFTkLMNoOUVg" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="ccccc/cWWWc/cWaWc/cWWWc/ccccc"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Y" out="EEEEE/EEEEE/EELEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="wWtg"/>
        <union symbol="%" values="wWt"/>
        <union symbol="=" values="fF"/>

        <!-- B. Le altezze -->
        <!-- Mura del mastio: 2 piani (32 + 32 = 64) + 1 di parapetto -->
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w w" steps="12"/>
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w w" steps="13"/>

        <!-- Porta del mastio: O a z=0, poi muro w sopra -->
        <all in="B d" out="w O" steps="1"/>
        <all in="B w" out="w w" steps="64"/>

        <!-- Pavimenti, scala e solai del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>

        <!-- Cinta muraria (24), corpo di guardia (O a z=0, g fino a 36), torri (40) -->
        <all in="B W" out="W W" steps="23"/>
        <all in="B G" out="g O" steps="1"/>
        <all in="B g" out="g g" steps="35"/>
        <all in="B t" out="t t" steps="40"/>

        <!-- Alberi: tronco L alto 10, chioma V -->
        <all in="B L" out="L L" steps="10"/>
        <all in="B L" out="V V" steps="1"/>
        <all in="EV" out="*V" steps="2"/>
        <all in="B V" out="V V" steps="6"/>

        <!-- C. Scala reale: porte, merli, feritoie, scale, finestre -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre nelle fasce U del mastio -->
        <one steps="14">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="w"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="6A8E4E" hidden="True" area="prato"/>
  <color symbol="H" value="FF00FF" name="origine"/>
  <color symbol="f" value="C2B280" name="pavimento mastio" area="mastio"/>
  <color symbol="F" value="A8996E" name="solaio mastio" area="mastio"/>
  <color symbol="w" value="8B8989" name="mura mastio" area="mastio"/>
  <color symbol="W" value="706E6E" name="cinta muraria" area="mura"/>
  <color symbol="g" value="787676" name="corpo di guardia" area="mura"/>
  <color symbol="t" value="5A5858" name="torre" area="torre"/>
  <color symbol="M" value="6E6C6C" name="merli"/>
  <color symbol="U" value="444444" name="feritoia"/>
  <color symbol="L" value="4A3525" name="legno"/>
  <color symbol="V" value="2E5A27" name="chioma" area="bosco"/>
  <color symbol="k" value="9C7A54" name="gradini"/>
  <color symbol="O" value="5E3A22" name="porta"/>
  <color symbol="o" value="3E2414" name="assi porta"/>
  <color symbol="N" value="4A4848" name="stipite"/>
  <color symbol="c" value="D8C89E" name="cortile" area="cortile"/>
  <color symbol="n" value="9E9B95" name="lastricato" area="cortile"/>
  <color symbol="r" value="B5A478" name="strada" area="strada"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="fossato"/>
  <color symbol="#20" value="5E3A22" hidden="True"/>
  <color symbol="#21" value="3E2414" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
