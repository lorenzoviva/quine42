# model.sculpt · claude-fable-5-1 · 154 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
FORTE — composizione
Parti: il mastio (interno h, muri w) al centro, interno 8 celle largo (la cella in più su un lato a caso) e 7 o 8 profondo (a caso);
la sua porta d sul fronte; attorno il cortile c di una cella, una in più su un lato dove la terra continua; lastricato n sull'asse;
la cinta W spessa due; torri t 3x3 sugli angoli esterni; il corpo di guardia G sul fronte, la strada r fino al bordo;
la scala s lungo il muro di fondo del mastio (posizione a caso), con due celle di pianerottolo prima e pavimento dopo.
Al Huge il cortile cresce di quattro dove la terra continua: stalla b con pali P contro la cinta, pozzo Q nel cortile.
Altezze: mastio 65 (due piani, piattaforma merlata), cinta 44, corpo di guardia 50, torri 56, tettoia 34.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdscnWGrtQbP" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- mastio: 3 dietro, 3 davanti e una in più a caso, 3 per lato e una in più su un lato a caso -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="[Hh]/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <one in="hE" out="*h" symmetry="(x)" steps="1"/>
      <all in="hE/*h" out="*h/**"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- cortile: una cella attorno, poi una in più su un lato dove restano almeno 5 celle di terra -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <one in="wcEEEEE" out="**c****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- al Huge il cortile cresce di quattro dove la terra continua per sei -->
      <all in="c/E/E/E/E/E/E" out="*/c/c/c/c/*/*" symmetry="()" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- cinta spessa due -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- torri d'angolo 3x3 -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- l'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la zona della scala lungo il muro di fondo del mastio: due celle di pianerottolo, quattro di scala, una di pavimento dopo -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>
      <!-- stalla contro la cinta e pozzo, dove il cortile è largo -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc" out="*bbbb*/*bbbb*/*bbbb*/*bbbb*/*bbbb*" symmetry="(x)" steps="1"/>
      <all in="bc" out="P*" symmetry="(x)" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwdscnWGrtQbPafFKuLVjJpqkTMOoNUxz#90#91#92#94" symmetry="()">
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="Q" out="ccccc/cQQQc/cQaQc/cQQQc/ccccc"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="P" out="bbbbb/bpppb/bpppb/bpppb/bbbbb"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="KV"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="VK"/>
        <!-- B. i muri del mastio: 65, con due fasce per le finestre; la porta d lascia O al piede -->
        <all steps="1"><rule in="B w" out="w K"/><rule in="B d" out="w O"/></all>
        <all in="B w" out="w K" steps="5"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w K" steps="12"/>
        <all in="B w" out="w K" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w K" steps="12"/>
        <all in="B w" out="w K" steps="1"/>
        <prl in="w" out="K"/>
        <!-- la cinta 44, il corpo di guardia 50 con la porta al piede, le torri 56 -->
        <all in="B W" out="W V" steps="44"/><prl in="W" out="V"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G V" steps="49"/><prl in="G" out="V"/>
        <all in="B t" out="t V" steps="56"/><prl in="t" out="V"/>
        <!-- i piani del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <!-- il pozzo e la stalla: pali 33, tettoia a 34 -->
        <all in="B Q" out="Q q" steps="3"/><prl in="Q" out="q"/>
        <all in="B p" out="p p" steps="33"/>
        <all in="B b" out="j b" steps="1"/><all in="B j" out="j B" steps="33"/>
        <all in="B p" out="J *" steps="1"/><prl in="j" out="J"/>
        <!-- C. le parti -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <!-- le finestre nelle fasce: 3 larghe, 8 alte, due di muro tra l'una e l'altra -->
        <one steps="60" in="uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB" out="**/**/**/**/**/**/** **/**/**/**/**/**/** **/**/**/**/**/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/**/**/**/**/** **/**/**/**/**/**/** **/**/**/**/**/**/**"/>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="K"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="c" value="7FA85A" name="cortile" area="courtyard"/>
  <color symbol="n" value="B8B0A0" name="lastricato"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="b" value="C9A25A" name="paglia della stalla" area="barn"/>
  <color symbol="a" value="4A7FB0" name="acqua del pozzo"/>
  <color symbol="q" value="8C8C84" name="pietra del pozzo"/>
  <color symbol="p" value="6B4A2A" name="palo"/>
  <color symbol="J" value="9A4A32" name="tettoia"/>
  <color symbol="f" value="B07A45" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7D6A50" name="solaio"/>
  <color symbol="K" value="A09A88" name="pietra del mastio"/>
  <color symbol="V" value="6E6E68" name="pietra della cinta" area="tower"/>
  <color symbol="M" value="5A5A55" name="merlo"/>
  <color symbol="L" value="2E4A6B" name="finestra"/>
  <color symbol="U" value="1E2A38" name="feritoia"/>
  <color symbol="k" value="8A7050" name="gradino"/>
  <color symbol="O" value="6B3F1E" name="porta"/>
  <color symbol="o" value="4A2A12" name="assi della porta"/>
  <color symbol="N" value="5C5C58" name="stipite"/>
  <color symbol="x" hidden="True" name="porta aperta"/>
  <color symbol="z" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="x"/><rule in="o" out="z"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="x" out="O"/><rule in="z" out="o"/></all></action>
</sequence>
It does not pass: taglia Grande, seme 1: porta: 15 × 6 voxel (0,75 × 0,30 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the leaf the action open takes away: its width and its height
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: c cortile, n lastricato, r strada, f assi del pavimento, F solaio, K pietra del mastio, L finestra, V pietra della cinta, k gradino, M merlo, O porta, o assi della porta, N stipite, U feritoia
Plan (the letter on top of every column):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..MMVMVVMM................................MMMVVMVV
..MVVVVVVV................................MVVVVVVV
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
...MVMVVMMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMMVVMVV
.....VVVVVcccccccccccccccccccccccccccccccccVVVVV..
.....VVVVVcccccccccccccccccccccccccccccccccVVVVV..
.....VVVVVcccccMMKKMMKKMMKKMKKMMKKMMKKMMcccVVVVV..
.....VVVVVcccccMKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV..
.....VVVVVcccccKKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..
.....VVVVVcccccMKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV..
.....VVVVVcccccMKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV..
.....VVVVVcccccMMcKMMcKMMnKMKnMMKcMMKcMMcccVVVVV..
.....VVVVVcccccccccccccnnnnnnncccccccccccccVVVVV..
.....VVVVVcccccccccccccnnnnnnncccccccccccccVVVVV..
..MMVMVVMMVVVVVVVVVVVVVMVMVVMMVVVVVVVVVVVVVMMVVMVV
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVVVVVVVVVVVVVVV
..MVVVVVVV...............rrr..............MVVVVVVV
..MVVVVVVV...............rrr..............MVVVVVVV
...MMVVMVM...............rrr...............MMVVMVV
.........................rrr......................
.........................rrr......................
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..sssspsss................................ssspsspp
..spppppps................................sppppppp
..sppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkksppppppp
..ppppppppkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkksppppppp
..sppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkpppppppp
..sppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkksppppppp
..sppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkksppppppp
...ssspssskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkssspsspp
.....kkkkk00000000000000000000000000000000kkkkkk..
.....kkkkk00000000000000000000000000000000kkkkkk..
.....kkkkk00000wwwtwwwtwwwtwtwwwtwwwtwww00kkkkkk..
.....kkkkk00000wtttttttttttttttttttttttw00kkkkkk..
.....kkkkk00000wtttttttttttttttttttttttw00kkkkkk..
.....kkkkk00000tttsssssssssssssssssssttt00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000tttsssssssssssssssssssttt00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000tttsssssssssssssssssssttt00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000tttsssssssssssssssssssttt00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000wttsssssssssssssssssssttw00kkkkkk..
.....kkkkk00000tttsssssssssssssssssssttt00kkkkkk..
.....kkkkk00000wtttttttttttttttttttttttw00kkkkkk..
.....kkkkk00000wtttttttttttttttttttttttw00kkkkkk..
.....kkkkk00000wwwtwwwtwwwtwtwwwtwwwtwww00kkkkkk..
.....kkkkk00000000000000000000000000000000kkkkkk..
.....kkkkk00000000000000000000000000000000kkkkkk..
..sssspssskkkkkkkkkkkkppppmpppkkkkkkkkkkkkssspsspp
..sppppppskkkkkkkkkkkkpmmmmmmmkkkkkkkkkkkksppppppp
..sppppppskkkkkkkkkkkkpmmmmmmpkkkkkkkkkkkksppppppp
..spppppppkkkkkkkkkkkkmmmmmmmpkkkkkkkkkkkkpppppppp
..pppppppskkkkkkkkkkkkpppmppppkkkkkkkkkkkksppppppp
..spppppps...............000..............sppppppp
..spppppps...............000..............sppppppp
...sspssss...............000...............sspsspp
.........................000......................
.........................000......................
```
Front (looking from the front; the sky at the top):
```
...............MMM.MMM.MMM.M.MMM.MMM.MMM..........
...............MMM.MMM.MMM.M.MMM.MMM.MMM..........
...............MMM.MMM.MMM.M.MMM.MMM.MMM..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...MMM.MMM.....KUKKKUKKKUKKKKKKKKKKKKKKK...MM..M..
..MMMMMMMM.....KUKKKUKKKUKKKKKKKKKKKKKKK..MMM.MM..
..MMMMMMMM.....KUKKKUKKKUKKKKKKKKKKKKKKK..MMM.MM..
..VVVVVVVV.....KKKKKKKKMMMKMMMKKKKKKKKKK..VVVVVVVV
..VVVVVVVV.....KKKKKKKKMMMKMMMKKKKKKKKKK..VVVVVVVV
..VVVVVVVV.....KKKKKKKKMMMKMMMKKKKKKKKKK..VVVVVVVV
..VVVVVVVV.....KKKKKKKKVVVVVVVKKKKKKKKKK..VVVVVVVV
..VVVVVVVV.....KKKKKLKKVVVVVVVLKKLLKKKKK..VVVVVVVV
..VVVVVVVV.....KKKKKLKKVVVVVVVLKKLLLKKKK..VVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVNNNNNNNVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoorroooNVVVVVVVVVVVVVVVVVVV
```
Right side (looking from the right):
```
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............KKKKKKKKKKKKKKKKKKKKKKK............
.....MMM.MMM...KUKKKUKKKUKKKUKKKUKKKUK..MMM.MMM...
.....MMMMMMMM..KUKKKUKKKUKKKUKKKUKKKUK..MMMMMMMM..
.....MMMMMMMM..KUKKKUKKKUKKKUKKKUKKKUK..MMMMMMMM..
.....VVVVVVVV..KKKKKKKKKKKKKKKKKKKKKKK..VVVVVVVV..
.....VVVVVVVV..KKKKKKKKKKKKKKKKKKKKKKK..VVVVVVVV..
.....VVVVVVUV..KKKKKKKKKKKKKKKKKKKKKKK..VUVVVVVV..
.....VVVVVVUV..KKKKKKKKKKKKKKKKKKKKKKK..VUVVVVVV..
.....VVVVVVVV..KKKLKKLLKKLLLLKKKLKKLKK..VVVVVVVV..
.....VVVVVVVV..LKKLLKLLLKLLLLKKKLLKLLK..VVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVrr
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..VVVVVVVV................................VVVVVVVV
..VVVVVVVV................................VVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
...VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
.....VVVVV................................VVVVVV..
.....VVVVV................................VVVVVV..
.....VVVVV.....KKKKKLLKKLKLKKKLLKLLKLLKK..VVVVVV..
.....VVVVV.....KKKKKLKKKLKKKKKKLKLLKLLKK..VVVVVV..
.....VVVVV.....KKKKKLLKKLKKKKKKLKLLKLLKL..VVVVVV..
.....VVVVV.....KKK.......kkkkkk......KKK..VVVVVV..
.....VVVVV.....KKK.......kkkkkk......KKK..VVVVVV..
.....VVVVV.....LLL.......kkkkkk......KKK..VVVVVV..
.....VVVVV.....LLL.......kkkkkk......LLL..VVVVVV..
.....VVVVV.....LLL.......kkkkk.......KKK..VVVVVV..
.....VVVVV.....LKL...................LLL..VVVVVV..
.....VVVVV.....LLL...................KKK..VVVVVV..
.....VVVVV.....KKK...................KKK..VVVVVV..
.....VVVVV.....LLL...................LLL..VVVVVV..
.....VVVVV.....LLL...................KKK..VVVVVV..
.....VVVVV.....KKK...................LKK..VVVVVV..
.....VVVVV.....LLL...................LKK..VVVVVV..
.....VVVVV.....LKL...................KKK..VVVVVV..
.....VVVVV.....LLL...................LLL..VVVVVV..
.....VVVVV.....LLL...................LLL..VVVVVV..
.....VVVVV.....LKL...................KKK..VVVVVV..
.....VVVVV.....KKK...................KKK..VVVVVV..
.....VVVVV.....KKKKLKKLKKLKKLLLKKKKKKLKK..VVVVVV..
.....VVVVV.....KKKKLKKLKKLKKLLLKKKKKKLKK..VVVVVV..
.....VVVVV.....KLLKLKKLKKLKKLLLKKKKKKLLL..VVVVVV..
.....VVVVV................................VVVVVV..
.....VVVVV................................VVVVVV..
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVNoooooooNVVVVVVVVVVVVVVVVVVV
..VVVVVVVV................................VVVVVVVV
..VVVVVVVV................................VVVVVVVV
...VVVVVVV.................................VVVVVVV
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
..VVVVVVVV................................VVVVVVVV
..VVVVVVVV................................VVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
...VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
.....VVVVV................................VVVVVV..
.....VVVVV................................VVVVVV..
.....VVVVV.....KKKKKKLLLKKLKKLKKKLLKKLLL..VVVVVV..
.....VVVVV.....KKKKKKLLLKKLKKKKKKLLKKLKK..VVVVVV..
.....VVVVV.....KKKKKKLLLKKLKKLLKKLLKKKKK..VVVVVV..
.....VVVVV.....KKK...................LLL..VVVVVV..
.....VVVVV.....KKK...................LLL..VVVVVV..
.....VVVVV.....LKL...................KKK..VVVVVV..
.....VVVVV.....LLL...................LLL..VVVVVV..
.....VVVVV.....KKK...................LKL..VVVVVV..
.....VVVVV.....KKK...................LLL..VVVVVV..
.....VVVVV.....LLL...................KKK..VVVVVV..
.....VVVVV.....LLL...................LLL..VVVVVV..
.....VVVVV.....KKK...................LLL..VVVVVV..
.....VVVVV.....LLL...................LLL..VVVVVV..
.....VVVVV.....KKK...................LLL..VVVVVV..
.....VVVVV.....KKK...................KKK..VVVVVV..
.....VVVVV.....LLL...................KKK..VVVVVV..
.....VVVVV.....LKL...................KKK..VVVVVV..
.....VVVVV.....KKK...................LKK..VVVVVV..
.....VVVVV.....KKK...................LLL..VVVVVV..
.....VVVVV.....KKK...................KKK..VVVVVV..
.....VVVVV.....LKKKKLKKLLKLLKKLKKLLLKKKK..VVVVVV..
.....VVVVV.....KKKKKLKKLLKLLKKKKKLKLKKKK..VVVVVV..
.....VVVVV.....KKKKKLKKLLKLLKKLKKLLLKKKK..VVVVVV..
.....VVVVV................................VVVVVV..
.....VVVVV................................VVVVVV..
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVVVVVVV................................VVVVVVVV
..VVVVVVVV................................VVVVVVVV
...VVVVVVV.................................VVVVVVV
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
..................................................   ..................................................
..................................................   ..................................................
.....MMMMVMM...............................MMVVMVV   .....sssspss...............................sspsspp
.....MVVVVVVM.............................MVVVVVVV   .....spppppps.............................sppppppp
.....MVVVVVVV.............................MVVVVVVV   .....spppppps.............................sppppppp
.....VVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   .....pppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkkpppppppp
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   .....spppppppkkkkkkkkkkkkkkkkkkkkkkkkkkkkksppppppp
.....MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   .....sppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkksppppppp
.....VVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   .....sppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkksppppppp
.....MVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   .....sssspssskkkkkkkkkkkkkkkkkkkkkkkkkkkkkssspsspp
.......VVVVVVccccccccccccccccccccccccccccccVVVVV..   .......kkkkkk00000000000000000000000000000kkkkkk..
.......VVVVVVccccccccccccccccccccccccccccccVVVVV..   .......kkkkkk00000000000000000000000000000kkkkkk..
.......VVVVVVccccccccccccccccccccccccccccccVVVVV..   .......kkkkkk00000000000000000000000000000kkkkkk..
.......VVVVVVccccccccccccccccccccccccccccccVVVVV..   .......kkkkkk00000000000000000000000000000kkkkkk..
.......VVVVVVccccccccccccccccccccccccccccccVVVVV..   .......kkkkkk00000000000000000000000000000kkkkkk..
.......VVVVVVccMMKKMMKKMMKKMKKMMKKMMKKMMcccVVVVV..   .......kkkkkk00wwwtwwwtwwwtwtwwwtwwwtwww00kkkkkk..
.......VVVVVVccMKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV..   .......kkkkkk00wtttttttttttttttttttttttw00kkkkkk..
.......VVVVVVccKKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV..   .......kkkkkk00wtttttttttttttttttttttttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00tttsssssssssssssssssssttt00kkkkkk..
.......VVVVVVccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00tttsssssssssssssssssssttt00kkkkkk..
.......VVVVVVccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00tttsssssssssssssssssssttt00kkkkkk..
.......VVVVVVccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00tttsssssssssssssssssssttt00kkkkkk..
.......VVVVVVccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccMKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00wttsssssssssssssssssssttw00kkkkkk..
.......VVVVVVccKKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV..   .......kkkkkk00tttsssssssssssssssssssttt00kkkkkk..
.......VVVVVVccMKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV..   .......kkkkkk00wtttttttttttttttttttttttw00kkkkkk..
.......VVVVVVccMKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV..   .......kkkkkk00wtttttttttttttttttttttttw00kkkkkk..
.......VVVVVVccMMcKMMcKMMnKMKnMMKcMMKcMMcccVVVVV..   .......kkkkkk00wwwtwwwtwwwtwtwwwtwwwtwww00kkkkkk..
.......VVVVVVccccccccccnnnnnnncccccccccccccVVVVV..   .......kkkkkk00000000000000000000000000000kkkkkk..
.......VVVVVVccccccccccnnnnnnncccccccccccccVVVVV..   .......kkkkkk00000000000000000000000000000kkkkkk..
.....MVMVVMMMVVVVVVVVVVMMVVMVMVVVVVVVVVVVVVMMVVMVV   .....sssspssskkkkkkkkkpppmppppkkkkkkkkkkkkssspsspp
.....MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   .....sppppppskkkkkkkkkpmmmmmmmkkkkkkkkkkkksppppppp
.....VVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   .....sppppppskkkkkkkkkpmmmmmmpkkkkkkkkkkkksppppppp
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   .....pppppppskkkkkkkkkmmmmmmmpkkkkkkkkkkkkpppppppp
.....MVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVVVVVVVVVVVVVVV   .....spppppppkkkkkkkkkpppmppppkkkkkkkkkkkksppppppp
.....VVVVVVVM............rrr..............MVVVVVVV   .....spppppps............000..............sppppppp
.....MVVVVVVM............rrr..............MVVVVVVV   .....spppppps............000..............sppppppp
.....MMMMVMM.............rrr...............MMVVMVV   .....sssspss.............000...............sspsspp
.........................rrr......................   .........................000......................
.........................rrr......................   .........................000......................
```
### Seed 3: plan and heights side by side
```
..................................................   ..................................................
..................................................   ..................................................
...MMVVMVM..............................MMMMVMM...   ...sspssss..............................sssspss...
..MVVVVVVV..............................MVVVVVVM..   ..spppppps..............................spppppps..
..VVVVVVVV..............................VVVVVVVV..   ..spppppps..............................spppppps..
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVM..   ..spppppppkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkspppppps..
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..   ..pppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkpppppppp..
..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..   ..sppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkspppppps..
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVM..   ..sppppppskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkspppppps..
..MVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVM..   ..ssspsssskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkssspssss..
.....VVVVVccccccccccccccccccccccccccccccVVVVV.....   .....kkkkk000000000000000000000000000000kkkkk.....
.....VVVVVccccccccccccccccccccccccccccccVVVVV.....   .....kkkkk000000000000000000000000000000kkkkk.....
.....VVVVVccccccccccccccccccccccccccccccVVVVV.....   .....kkkkk000000000000000000000000000000kkkkk.....
.....VVVVVccccccccccccccccccccccccccccccVVVVV.....   .....kkkkk000000000000000000000000000000kkkkk.....
.....VVVVVccccccccccccccccccccccccccccccVVVVV.....   .....kkkkk000000000000000000000000000000kkkkk.....
.....VVVVVcccMMKKMMKKMMKKKKMMKKMMKKMMMccVVVVV.....   .....kkkkk00wwwtwwwtwwwtwwtwwwtwwwtwww00kkkkk.....
.....VVVVVcccKKKKKKKKKKKKKKKKKKKKKKKKMccVVVVV.....   .....kkkkk00wttttttttttttttttttttttttw00kkkkk.....
.....VVVVVcccKKKKKKKKKKKKKKKKKKKKKKKKcccVVVVV.....   .....kkkkk00wttttttttttttttttttttttttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKKccVVVVV.....   .....kkkkk00tttssssssssssssssssssssttt00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKMccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKMccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKKccVVVVV.....   .....kkkkk00tttssssssssssssssssssssttt00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKMccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKMccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKKccVVVVV.....   .....kkkkk00tttssssssssssssssssssssttt00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKMccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKMccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKKccVVVVV.....   .....kkkkk00tttssssssssssssssssssssttt00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKMccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKMccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKcccVVVVV.....   .....kkkkk00wttssssssssssssssssssssttw00kkkkk.....
.....VVVVVcccKKFFFFFFFFFFFFFFFFFFFFKKKccVVVVV.....   .....kkkkk00tttssssssssssssssssssssttt00kkkkk.....
.....VVVVVcccKKKKKKKKKKKKKKKKKKKKKKKKMccVVVVV.....   .....kkkkk00wttttttttttttttttttttttttw00kkkkk.....
.....VVVVVcccKKKKKKKKKKKKKKKKKKKKKKKKMccVVVVV.....   .....kkkkk00wttttttttttttttttttttttttw00kkkkk.....
.....VVVVVcccMMKcMMKcMMKnnKMMnKMMcKMMcccVVVVV.....   .....kkkkk00wwwtwwwtwwwtwwtwwwtwwwtwww00kkkkk.....
.....VVVVVcccccccccccccnnnnnnnccccccccccVVVVV.....   .....kkkkk000000000000000000000000000000kkkkk.....
.....VVVVVcccccccccccccnnnnnnnccccccccccVVVVV.....   .....kkkkk000000000000000000000000000000kkkkk.....
..MMMVVMVMVVVVVVVVVVVVVMMVVMVMVVVVVVVVVVMVMVVMMM..   ..ssspsssskkkkkkkkkkkkpppmppppkkkkkkkkkksssspsss..
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVM..   ..sppppppskkkkkkkkkkkkmmmmmmmmkkkkkkkkkkspppppps..
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVM..   ..sppppppskkkkkkkkkkkkpmmmmmmpkkkkkkkkkkspppppps..
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVM..   ..spppppppkkkkkkkkkkkkpmmmmmmpkkkkkkkkkkppppppps..
..VVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVVVVVMVVVVVVV..   ..pppppppskkkkkkkkkkkkppppmpppkkkkkkkkkksppppppp..
..MVVVVVVV...............rrr............VVVVVVVM..   ..spppppps...............000............spppppps..
..MVVVVVVV...............rrr............MVVVVVVM..   ..spppppps...............000............spppppps..
...MVMVVMM...............rrr............MMMVMMM...   ...ssspsss...............000............ssspsss...
.........................rrr......................   .........................000......................
.........................rrr......................   .........................000......................
```
How much the plans of the seeds differ: 0.33 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 140 nodi, 593 passi, finito in 463 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=terra (marcatore), h=honey, w=white, m=magenta, d=dead, dark, s=slate, c=cortile, n=lastricato, W=White, G=Green, r=strada, t=teal, f=assi del pavimento, F=solaio, K=pietra del mastio, u=blue, L=finestra, V=pietra della cinta, k=gradino, T=Teal (marcatore), M=merlo, O=porta, o=assi della porta, N=stipite, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: V 153864, K 48978, L 5112, o 4806, k 2720, F 2640, U 2586, M 1692, f 1400, c 1250, N 810, O 144, n 75, r 50.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-35 all×24, one×3, prl×1: 319 celle x1-19 y2-19 z0, passi 2-48
   #40 map scala 5 5 1: ×1, 6925 celle x0-99 y0-99 z0-79, passi 49
#42-43 all×2: 10200 celle x30-79 y30-74 z0-6, passi 50-55
    #44 all . w → w u passi=14: ×14, 23800 celle x30-79 y30-74 z6-20, passi 56-69, w→u 11900, .→w 11900
    #45 all . w → w K passi=12: ×12, 20400 celle x30-79 y30-74 z20-32, passi 70-81, w→K 10200, .→w 10200
    #46 all . w → w K passi=6: ×6, 10200 celle x30-79 y30-74 z32-38, passi 82-87, w→K 5100, .→w 5100
    #47 all . w → w u passi=14: ×14, 23800 celle x30-79 y30-74 z38-52, passi 88-101, w→u 11900, .→w 11900
    #48 all . w → w K passi=12: ×12, 20400 celle x30-79 y30-74 z52-64, passi 102-113, w→K 10200, .→w 10200
#49-50 all×1, prl×1: 2550 celle x30-79 y30-74 z64-65, passi 114-115
    #51 all . W → W V passi=44: ×44, 198000 celle x10-94 y15-89 z0-44, passi 116-159, W→V 99000, .→W 99000
#52-53 prl×1, all×1: 2550 celle x10-94 y15-89 z0-44, passi 160-161
#54-55 all×1, prl×1: 14850 celle x45-59 y80-89 z1-50, passi 162-211
    #56 all . t → t V passi=56: ×56, 100800 celle x5-99 y10-94 z0-56, passi 212-267, t→V 50400, .→t 50400
#57-59 prl×1, all×2: 4100 celle x5-99 y10-94 z0-56, passi 268-270
    #60 all . h → h . passi=31: ×31, 74400 celle x35-74 y35-69 z1-32, passi 271-301, h→. 37200, .→h 37200
#61-62 all×2: 14800 celle x35-74 y35-69 z2-33, passi 302-332
    #63 all . h → h . (+1) passi=31: ×31, 86800 celle x35-74 y35-69 z33-64, passi 333-363, h→. 37200, .→h 37200, s→. 6200, .→s 6200
      r1 . h → h . ×37200; r2 . s → s . ×6200
#64-104 prl×2, all×9: 17081 celle x35-74 y35-89 z0-64, passi 364-444
#105-136 prl×5, all×10: 12460 celle x5-99 y10-94 z1-71, passi 445-509
#137-139 all×2, one×1: 7446 celle x5-99 y11-94 z9-63, passi 510-592
    #140 prl u → K: ×1, 18688 celle x30-79 y30-74 z6-51, passi 593, u→K 18688
Senza effetto (non hanno mai cambiato una cella):
#7 prl [Hh]/E → */h passi=1
#17 all c/E/E/E/E/E/E → */c/c/c/c/*/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#18 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#36 one Wccccc/Wccccc/Wccccc/Wccccc/Wccccc → *bbbb*/*bbbb*/*bbbb*/*bbbb*/*bbbb* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#37 all bc → P* passi=1: in quel momento nella griglia non c'erano celle "b"
#38 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#65 all . Q → Q q passi=3: in quel momento nella griglia non c'erano celle "Q"
#66 prl Q → q: in quel momento nella griglia non c'erano celle "Q"
#67 all . p → p p passi=33: in quel momento nella griglia non c'erano celle "p"
#68 all . b → j b passi=1: in quel momento nella griglia non c'erano celle "b"
#69 all . j → j . passi=33: in quel momento nella griglia non c'erano celle "j"
#70 all . p → J * passi=1: in quel momento nella griglia non c'erano celle "p"
… e altri 37
Fix it and answer with the whole program.

## Risposta

<!--
FORTE — composizione
Parti: il mastio (interno h, muri w) al centro, interno 8 celle largo (la cella in più su un lato a caso) e 8 profondo (4 dietro, 3 davanti);
la sua porta d sul fronte; attorno il cortile c di una cella, una in più su un lato dove la terra continua; lastricato n sull'asse;
la cinta W spessa due; torri t 3x3 sugli angoli esterni; il corpo di guardia G sul fronte, la strada r fino al bordo;
la scala s lungo il muro di fondo del mastio (posizione a caso), con due celle di pianerottolo prima e pavimento dopo.
Al Huge il cortile cresce di quattro sul fronte dove la terra continua: stalla b con pali P contro la cinta, pozzo Q nel cortile.
Altezze: mastio 65 (due piani, piattaforma merlata), cinta 44, corpo di guardia 50, torri 56, tettoia 34.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdscnWGrtQbP" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- mastio: 4 dietro, 3 davanti, 3 per lato e una in più su un lato a caso -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <one in="hE" out="*h" symmetry="(x)" steps="1"/>
      <all in="hE/*h" out="*h/**"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- cortile: una cella attorno, poi una in più su un lato dove restano almeno 5 celle di terra -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <one in="wcEEEEE" out="**c****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- al Huge il cortile cresce di quattro dove la terra continua per sei -->
      <all in="c/E/E/E/E/E/E" out="*/c/c/c/c/*/*" symmetry="()" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- cinta spessa due -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- torri d'angolo 3x3 -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- l'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la zona della scala lungo il muro di fondo del mastio: due celle di pianerottolo, quattro di scala, una di pavimento dopo -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>
      <!-- stalla contro la cinta e pozzo, dove il cortile è largo -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc" out="*bbbb*/*bbbb*/*bbbb*/*bbbb*/*bbbb*" symmetry="(x)" steps="1"/>
      <all in="bc" out="P*" symmetry="(x)" steps="1"/>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwdscnWGrtQbPafFKuLVjJpqkTMOoNUxz#90#91#92#94" symmetry="()">
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="Q" out="ccccc/cQQQc/cQaQc/cQQQc/ccccc"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="P" out="bbbbb/bpppb/bpppb/bpppb/bbbbb"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="KVu"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="VK"/>
        <!-- B. i muri del mastio: 65, con due fasce per le finestre; la porta d lascia O al piede -->
        <all steps="1"><rule in="B w" out="w K"/><rule in="B d" out="w O"/></all>
        <all in="B w" out="w K" steps="5"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w K" steps="12"/>
        <all in="B w" out="w K" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w K" steps="12"/>
        <all in="B w" out="w K" steps="1"/>
        <prl in="w" out="K"/>
        <!-- la cinta 44, il corpo di guardia 50 con la porta al piede, le torri 56 -->
        <all in="B W" out="W V" steps="44"/><prl in="W" out="V"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G V" steps="49"/><prl in="G" out="V"/>
        <all in="B t" out="t V" steps="56"/><prl in="t" out="V"/>
        <!-- i piani del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <!-- il pozzo e la stalla: pali 33, tettoia a 34 -->
        <all in="B Q" out="Q q" steps="3"/><prl in="Q" out="q"/>
        <all in="B p" out="p p" steps="33"/>
        <all in="B b" out="j b" steps="1"/><all in="B j" out="j B" steps="33"/>
        <all in="B p" out="J *" steps="1"/><prl in="j" out="J"/>
        <!-- C. le parti -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <!-- le finestre nelle fasce: 3 larghe, 8 alte, due di muro tra l'una e l'altra -->
        <one steps="60" in="uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB" out="**/**/**/**/**/**/** **/**/**/**/**/**/** **/**/**/**/**/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/**/**/**/**/** **/**/**/**/**/**/** **/**/**/**/**/**/**"/>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="K"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="c" value="7FA85A" name="cortile" area="courtyard"/>
  <color symbol="n" value="B8B0A0" name="lastricato"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="b" value="C9A25A" name="paglia della stalla" area="barn"/>
  <color symbol="a" value="4A7FB0" name="acqua del pozzo"/>
  <color symbol="q" value="8C8C84" name="pietra del pozzo"/>
  <color symbol="p" value="6B4A2A" name="palo"/>
  <color symbol="J" value="9A4A32" name="tettoia"/>
  <color symbol="f" value="B07A45" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7D6A50" name="solaio"/>
  <color symbol="K" value="A09A88" name="pietra del mastio"/>
  <color symbol="V" value="6E6E68" name="pietra della cinta" area="tower"/>
  <color symbol="M" value="5A5A55" name="merlo"/>
  <color symbol="L" value="2E4A6B" name="finestra"/>
  <color symbol="U" value="1E2A38" name="feritoia"/>
  <color symbol="k" value="8A7050" name="gradino"/>
  <color symbol="O" value="6B3F1E" name="porta"/>
  <color symbol="o" value="4A2A12" name="assi della porta"/>
  <color symbol="N" value="5C5C58" name="stipite"/>
  <color symbol="x" hidden="True" name="porta aperta"/>
  <color symbol="z" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="x"/><rule in="o" out="z"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="x" out="O"/><rule in="z" out="o"/></all></action>
</sequence>
