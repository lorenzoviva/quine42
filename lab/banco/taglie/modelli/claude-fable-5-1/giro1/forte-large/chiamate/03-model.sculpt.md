# model.sculpt · claude-fable-5-1 · 198 s

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
Parti: il mastio (interno h, muri w) al centro, profondo 7 o 8 celle (a caso); la sua porta d sul fronte; attorno il cortile c,
una cella più largo su uno o due lati scelti a caso; lastricato n sull'asse; la cinta W spessa due; torri t 3x3 sugli angoli;
il corpo di guardia G sul fronte, la strada r fino al bordo; la scala s lungo il muro di fondo del mastio (posizione a caso).
Al Huge il cortile cresce avanti e ai lati: stalla b con pali P contro la cinta, pozzo Q nel cortile.
Altezze: mastio 65 (due piani, piattaforma merlata), cinta 44, corpo di guardia 50, torri 56, tettoia 34.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdscnWGrtQbP" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- mastio: 3 dietro, 3 davanti e una in più a caso, 3 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="[Hh]/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- cortile: una cella attorno, poi una in più su uno o due lati a caso -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <one in="wcE" out="**c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <one in="wcE" out="**c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- al Huge il cortile cresce avanti e ai lati dove la terra continua -->
      <all in="c/E/E/E/E/E/E" out="*/c/c/c/c/*/*" symmetry="()" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" symmetry="(x)" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- cinta spessa due -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- torri d'angolo 3x3 -->
      <all in="EE/EW" out="**/*t"/>
      <all in="t[EW]" out="*t" steps="1"/>
      <all in="t[EW]/*[EW]" out="**/*t"/>
      <!-- l'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la zona della scala lungo il muro di fondo del mastio -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
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
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2); porta: 15 × 6 voxel (0,75 × 0,30 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: c cortile, n lastricato, f assi del pavimento, F solaio, K pietra del mastio, L finestra, V pietra della cinta, k gradino, M merlo, O porta, o assi della porta, N stipite, U feritoia
Plan (the letter on top of every column):
```
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
VVM..MVM..MVM..MVM..MVM..VVVVV..MVV..MVV..MVV..MVV
VMMMMMMMMMMMMMMMMMMMMMMMVVVVVVVMMMMMMMMMMMMMMMMMMV
..MVV..MVV..MVV..MVV..MVVVVVVVVVM..MVM..MVM..MVM..
..MVM..VVV..MVM..MVM..MVVVVVVVVVM..MVM..MVM..VVV..
VMM..MVVVVVMMVVMMMVVMMMVVVVVVVVVVMMVVVMMVVVMVVVVVV
VVM..MVVVVVVMVVMVMVVMVMVVVVVVVVVVVVVVVVVVVVVVVVVVV
VMMMMMMVVVVMVVVMMVVVMMVVVVVVVVVVMMMVVMMMVVMMVVVVVV
..MVV..VVVVVVVVVVVVVVVVVVVVVVVVVMVVMVMVVMVMVVVVV..
..MVM..MVMVVVVMVVVVMVVVVVVVVVVVVMVVMVMVVMVMVVMVM..
VMM..MMMVVMMMccccccccccccccccccccccccccccccMMVVVMV
VVM..MVMVVMVMccccccccccccccccccccccccccccccVVVVVVV
VMMMMMMMVVMMcccccccccccccccccccccccccccccccMMVVMMV
..MVV..MVVVVVccccccccccccccccccccccccccccccVVMVM..
..MVM..MVMVVVccccccccccccccccccccccccccccccVVMVM..
VMM..MMMVVMMMccMMKKMMKKMMKKMMKKMMKKMMMcccccMMVVVMV
VVM..MVMVVMVMccMKKKKKKKKKKKKKKKKKKKKKMcccccVVVVVVV
VMMMMMMMVVMMcccKKKKKKKKKKKKKKKKKKKKKKccccccMMVVMMV
..MVV..MVVVVVccKKKFFFFFFFFFFFFFFFFFKKKcccccVVMVM..
..MVM..MVMVVVccMKKFFFFFFFFFFFFFFFFFKKMcccccVVMVM..
VMM..MMMVVMMMccMKKFFFFFFFFFFFFFFFFFKKMcccccMMVVVMV
VVM..VVVVVVVMccKKKFFFFFFFFFFFFFFFFFKKccccccVVVVVVV
VVVVVVVVVVVVcccKKKFFFFFFFFFFFFFFFFFKKKcccccVVVVVVV
VVVVVVVVVVVVVccMKKFFFFFFFFFFFFFFFFFKKMcccccVVVVVVV
VVVVVVVVVVVVMccMKKFFFFFFFFFFFFFFFFFKKMcccccVVVVVVV
VVVVVVVVVVVVMccKKKFFFFFFFFFFFFFFFFFKKccccccVVVVVVV
VVVVVVVVVVVVVccKKKFFFFFFFFFFFFFFFFFKKKcccccVVVVVVV
VVVVVVVVVVVVcccMKKFFFFFFFFFFFFFFFFFKKMcccccVVVVVVV
VVV..VVVVVVVMccMKKFFFFFFFFFFFFFFFFFKKMcccccVVVVVVV
VVM..MVMVVMVMccKKKFFFFFFFFFFFFFFFFFKKccccccVMVVVVV
..MMM..MMMVVVccKKKFFFFFFFFFFFFFFFFFKKKcccccVVMMM..
..MVV..MVVVVVccMKKFFFFFFFFFFFFFFFFFKKMcccccVVMVM..
VMMMMMMMMMVVcccMKKFFFFFFFFFFFFFFFFFKKMcccccVVMMMMV
VVM..MVMVVMVMccKKKFFFFFFFFFFFFFFFFFKKccccccVVVVVVV
VVM..MVMVVMVMccKKKFFFFFFFFFFFFFFFFFKKKcccccVMVVVVV
..MMM..MMMVVVccMKKKKKKKKKKKKKKKKKKKKKMcccccVVMMM..
..MVV..MVVVVVccMKKKKKKKKKKKKKKKKKKKKKMcccccVVMVM..
VMMMMMMMMMVVcccMMcKMMcKMMnKMMnKMMcKMMccccccVVMMMMV
VVM..MVMVVMVMccccccccccnnnnnnncccccccccccccVVVVVVV
VVM..MVMVVMVMccccccccccnnnnnnncccccccccccccVMVVVVV
..MMM..MMMVVVMMVVVMMVVVMMVVMVVMMMVVMMMVVMMMVVMMM..
..MVV..MVVVVVVVVVVVVVVVVVVVVVVVVMVVMVMVVMVMVVVVM..
VMMMMMMVVVVVMMMVVMMMVVMMVVVVVVVMVVVMMVVVMMVVVVVVVV
VVM..MVVVVVVMVVMVMVVMVMVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVM..MVVVVVVMVVMVMVVMVMVVVVVVVVVVVMVVVVMVVVVVVVVVV
..MMM..VVV..MMM..MMM..MMVVVVVVVMM..MMM..MMM..VVV..
..MVV..MVV..MVV..MVV..MVVVVVVVVVM..MVM..MVM..MVM..
VMMMMMMMMMMMMMMMMMMMMMMMVVVVVVVMMMMMMMMMMMMMMMMMMV
VVM..MVM..MVM..MVM..MVM..VVVVV..MVV..MVV..MVV..MVV
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
ppp..ppp..ppp..ppp..ppp..ppppp..ppp..ppp..ppp..ppp
pps..sps..sps..sps..sps..ppppp..sps..sps..sps..spp
pssssssssssssssssssssssspppppppssssssssssssssssssp
..sps..sps..sps..sps..sppppppppps..sps..sps..sps..
..sss..ppp..sss..sss..sspppppppss..sss..sss..ppp..
pss..ssppppsskkssskkssskkpppppkkssskkssskksspppppp
pps..sppppppskkspskkspskkpppppkkspskkspskksppppppp
pssssssppppssssssssssssspppppppssssssssssssspppppp
..sps..spskkspskkspskkspppppppppskkspskkspskksps..
..sss..ssskkssskkssskkssspssspssskkssskkssskksss..
pss..ssskksss00000000000000000000000000000ssskkssp
pps..spskksps00000000000000000000000000000spskkspp
pssssssssssss00000000000000000000000000000sssssssp
..sps..spskkk00000000000000000000000000000kkksps..
..sss..ssskkk00000000000000000000000000000kkksss..
pss..ssskksss00wwwtwwwtwwwtwwwtwwwtwww0000ssskkssp
pps..spskksps00wtttttttttttttttttttttw0000spskkspp
pssssssssssss00wtttttttttttttttttttttw0000sssssssp
..sps..spskkk00tttsssssssssssssssssttt0000kkksps..
..sss..ssskkk00wttsssssssssssssssssttw0000kkksss..
pss..ssskksss00wttsssssssssssssssssttw0000ssskkssp
pps..spskksps00wttsssssssssssssssssttw0000spskkspp
pppppppppppps00tttsssssssssssssssssttt0000sppppppp
ppppppppppppp00wttsssssssssssssssssttw0000pppppppp
pppppppppppps00wttsssssssssssssssssttw0000sppppppp
pppppppppppps00wttsssssssssssssssssttw0000sppppppp
ppppppppppppp00tttsssssssssssssssssttt0000pppppppp
pppppppppppps00wttsssssssssssssssssttw0000sppppppp
pps..spskksps00wttsssssssssssssssssttw0000spskkspp
pss..ssskksss00wttsssssssssssssssssttw0000ssskkssp
..sss..ssskkk00tttsssssssssssssssssttt0000kkksss..
..sps..spskkk00wttsssssssssssssssssttw0000kkksps..
pssssssssssss00wttsssssssssssssssssttw0000sssssssp
pps..spskksps00wttsssssssssssssssssttw0000spskkspp
pss..ssskksss00tttsssssssssssssssssttt0000ssskkssp
..sss..ssskkk00wtttttttttttttttttttttw0000kkksss..
..sps..spskkk00wtttttttttttttttttttttw0000kkksps..
pssssssssssss00wwwtwwwtwwwtwwwtwwwtwww0000sssssssp
pps..spskksps00000000000000000000000000000spskkspp
pss..ssskksss00000000000000000000000000000ssskkssp
..sss..ssskkssskkssskkssspssspssskkssskkssskksss..
..sps..spskkspskkspskkspppppppppskkspskkspskksps..
pssssssppppssssssssssssspppppppssssssssssssspppppp
pps..sppppppskkspskkspskkpppppkkspskkspskksppppppp
pss..ssppppsskkssskkssskkpppppkkssskkssskksspppppp
..sss..ppp..sss..sss..sspppppppss..sss..sss..ppp..
..sps..sps..sps..sps..sppppppppps..sps..sps..sps..
pssssssssssssssssssssssspppppppssssssssssssssssssp
pps..sps..sps..sps..sps..ppppp..sps..sps..sps..spp
ppp..ppp..ppp..ppp..ppp..ppppp..ppp..ppp..ppp..ppp
```
Front (looking from the front; the sky at the top):
```
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............KKKKKKKKKKKKKKKKKKKKKKK............
.MMMMMMMMMMMMMMMMMMMMMMMMKKMKKMMMMMMMMMMMMMMMMMMM.
.MMMMMMMMMMMMMMMMMMMMMMMMKKMMKMMMMMMMMMMMMMMMMMMM.
.MMMMMMMMMMMMMMMMMMMMMMMMKKMMKMMMMMMMMMMMMMMMMMMM.
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVUVVVVUVVVVUVVVVUVVVVVVVVVVVVVVUVVVVUVVVVUVVV
VVVVVVUVVVVUVVVVUVVVVUVVVVVVVVVVVVVVUVVVVUVVVVUVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
```
Right side (looking from the right):
```
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............KKKKKKKKKKKKKKKKKKKKKKK............
.MMMMMMMMMMMMMMMMMMMMMKKMMKKMMMMMMMMMMMMMMMMMMMMM.
.MMMMMMMMMMMMMMMMMMMMMMKMMKKMMMMMMMMMMMMMMMMMMMMM.
.MMMMMMMMMMMMMMMMMMMMMMKMMKKMMMMMMMMMMMMMMMMMMMMM.
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVUVVVVUVVVVUVVVVVVVVVVVVVVUVVVVUVVVVVVVVVVVVV
VVVVVVUVVVVUVVVVUVVVVVVVVVVVVVVUVVVVUVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVV..VVV..VVV..VVV..VVVVVVVVVVV..VVV..VVV..VVV..
..VVV..VVV..VVV..VVV..VVVVVVVVVVV..VVV..VVV..VVV..
VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
..VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
VVV..VVVVVVVV.............................VVVVVVVV
VVV..VVVVVVVV.............................VVVVVVVV
VVVVVVVVVVVVV.............................VVVVVVVV
..VVV..VVVVVV.............................VVVVVV..
..VVV..VVVVVV.............................VVVVVV..
VVV..VVVVVVVV..KLKKKKLLLLKKLKKKLLKKKKK....VVVVVVVV
VVV..VVVVVVVV..KKKKKKLLLLKKKKKKLKKKKKL....VVVVVVVV
VVVVVVVVVVVVV..KKKKKKLLLLKKKKKKLLKKKKL....VVVVVVVV
..VVV..VVVVVV..KKK.......kkkkkk....KKK....VVVVVV..
..VVV..VVVVVV..KKK.......kkkkkk....LLL....VVVVVV..
VVV..VVVVVVVV..LKL.......kkkkkk....KKK....VVVVVVVV
VVV..VVVVVVVV..LLL.......kkkkkk....LLL....VVVVVVVV
VVVVVVVVVVVVV..KKK.......kkkkk.....LKL....VVVVVVVV
VVVVVVVVVVVVV..LKL.................KKK....VVVVVVVV
VVVVVVVVVVVVV..KKL.................KKK....VVVVVVVV
VVVVVVVVVVVVV..KKK.................KKK....VVVVVVVV
VVVVVVVVVVVVV..LKL.................KKK....VVVVVVVV
VVVVVVVVVVVVV..KKL.................KKK....VVVVVVVV
VVV..VVVVVVVV..KKK.................KKK....VVVVVVVV
VVV..VVVVVVVV..LLL.................LLL....VVVVVVVV
..VVV..VVVVVV..KKK.................LLL....VVVVVV..
..VVV..VVVVVV..LLL.................KKK....VVVVVV..
VVVVVVVVVVVVV..LLL.................KKK....VVVVVVVV
VVV..VVVVVVVV..KKK.................LLL....VVVVVVVV
VVV..VVVVVVVV..KKK.................LLL....VVVVVVVV
..VVV..VVVVVV..KKKLLKLLKLKKLKKKLLKKKKK....VVVVVV..
..VVV..VVVVVV..KKKLLKLLKLKKKKKKKLKKKKK....VVVVVV..
VVVVVVVVVVVVV..KKKLLKLLKLKKLKKKLLKKKK.....VVVVVVVV
VVV..VVVVVVVV.............................VVVVVVVV
VVV..VVVVVVVV.............................VVVVVVVV
..VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
..VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVV..VVV..VVV..VVV..VVVVVVVVVVV..VVV..VVV..VVV..
..VVV..VVV..VVV..VVV..VVVVVVVVVVV..VVV..VVV..VVV..
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVV..VVV..VVV..VVV..VVVVVVVVVVV..VVV..VVV..VVV..
..VVV..VVV..VVV..VVV..VVVVVVVVVVV..VVV..VVV..VVV..
VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
..VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
VVV..VVVVVVVV.............................VVVVVVVV
VVV..VVVVVVVV.............................VVVVVVVV
VVVVVVVVVVVVV.............................VVVVVVVV
..VVV..VVVVVV.............................VVVVVV..
..VVV..VVVVVV.............................VVVVVV..
VVV..VVVVVVVV..KLKKKLLLKKKLLKLLLLKLLLL....VVVVVVVV
VVV..VVVVVVVV..KKKKKLLLKKKKLKLKLLKLKKK....VVVVVVVV
VVVVVVVVVVVVV..KKKKKLLLKKKLLKLLLLKLKKK....VVVVVVVV
..VVV..VVVVVV..KKK.................LLL....VVVVVV..
..VVV..VVVVVV..LKL.................KKK....VVVVVV..
VVV..VVVVVVVV..KKL.................KKK....VVVVVVVV
VVV..VVVVVVVV..KKK.................LLL....VVVVVVVV
VVVVVVVVVVVVV..LLL.................LLL....VVVVVVVV
VVVVVVVVVVVVV..KKK.................KKK....VVVVVVVV
VVVVVVVVVVVVV..LLL.................KKK....VVVVVVVV
VVVVVVVVVVVVV..KKK.................KKK....VVVVVVVV
VVVVVVVVVVVVV..LLL.................KKK....VVVVVVVV
VVVVVVVVVVVVV..LLL.................LLL....VVVVVVVV
VVV..VVVVVVVV..KKK.................LLL....VVVVVVVV
VVV..VVVVVVVV..KKK.................KKK....VVVVVVVV
..VVV..VVVVVV..KKK.................KKK....VVVVVV..
..VVV..VVVVVV..LLL.................KKK....VVVVVV..
VVVVVVVVVVVVV..LLL.................LLL....VVVVVVVV
VVV..VVVVVVVV..KKK.................KKK....VVVVVVVV
VVV..VVVVVVVV..KKK.................KKK....VVVVVVVV
..VVV..VVVVVV..LKKKLLLLLKLLKLKKLLLKKKL....VVVVVV..
..VVV..VVVVVV..KKKKLKLLLKLLKLKKLLLKKKK....VVVVVV..
VVVVVVVVVVVVV..KKLKLLLLLKLLKLKKLLLKLL.....VVVVVVVV
VVV..VVVVVVVV.............................VVVVVVVV
VVV..VVVVVVVV.............................VVVVVVVV
..VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
..VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVV..VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
..VVV..VVV..VVV..VVV..VVVVVVVVVVV..VVV..VVV..VVV..
..VVV..VVV..VVV..VVV..VVVVVVVVVVV..VVV..VVV..VVV..
VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
VVV..VVV..VVV..VVV..VVV..VVVVV..VVV..VVV..VVV..VVV
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
VVV..VVV..VVV..VVV..VVVVVVVVVV..VVV..VVV..VVV..VVV   ppp..ppp..ppp..ppp..pppppppppp..ppp..ppp..ppp..ppp
VVM..MVM..MVM..MVM..MVVVVVVVVV..MVV..MVV..MVV..MVV   pps..sps..sps..sps..spppppppps..sps..sps..sps..spp
VMMMMMMMMMMMMMMMMMMMMMVVVVVVVMMMMMMMMMMMMMMMMMMMMV   psssssssssssssssssssssppppppsssssssssssssssssssssp
..MVV..MVV..MVV..MVV..VVVVVV..MVM..MVM..MVM..MVM..   ..sps..sps..sps..sps..pppppp..sps..sps..sps..sps..
..MVM..MVM..MVM..MVM..VVVVVV..MVM..MVM..MVM..MVM..   ..sss..sss..sss..sss..pppppp..sss..sss..sss..sss..
VMM..MMM..MMM..MMM..MVVVVVVVVM..MMM..MMM..MMM..MMV   pss..sss..sss..sss..ssppppppss..sss..sss..sss..ssp
VVM..VVM..MVM..MVM..MVVVVVVVVV..MVV..MVV..MVV..MVV   pps..sps..sps..sps..spppppppps..sps..sps..sps..spp
VMMMVVVVVMMMMMMMMMMMMVVVVVVVVMMMMMMMMMMMMMVVVVMMMV   psssppppssssssssssssssppppppssssssssssssssppppsssp
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVMVMVVMVMVVMVVVVVVM..   ..sppppppskkspskkspskkppppppkkspskkspskkspppppps..
..MVVVVVVMVVVVMVVVVMVVVVVVVVVVMVMVVMVMVVMVVVVVVM..   ..ssppppsskkssskkssskkppppppkkssskkssskkssppppss..
VMM..VVVVVMMMVVMMMVVMVVVVVVVVMVVVMMVVVMMVVVVV..MMV   pss..pppkkssskkssskkssppppppsskkssskkssskkppp..ssp
VVM..MVMVVMVMVVMVMVVMVVVVVVVVVVVVVVVVVVVVVVVV..MVV   pps..spskkspskkspskksppppppppskkspskkspskksps..spp
VMMMMMMVVVMMcVVMMcVVMMcVMMVcMMVVcMMVVcMMVVMMMMMMMV   psssssssssssskkssskkssspsspssskkssskkssssssssssssp
..MVVVVVVVccccccccccccccccccccccccccccccMVMVVMVM..   ..spskksps000000000000000000000000000000spskksps..
..MVMVVVVMccccccccccccccccccccccccccccccMVMVVMVM..   ..ssskksss000000000000000000000000000000ssskksss..
VMM..MMMVVcccccMMKKMMKKMMKKMMKKMMKKMMMccVVVMM..MMV   pss..ssskk00000wwwtwwwtwwwtwwwtwwwtwww00kksss..ssp
VVM..MVMVVcccccMKKKKKKKKKKKKKKKKKKKKKMccVVVVV..MVV   pps..spskk00000wtttttttttttttttttttttw00kksps..spp
VMMMMMMVVVcccccKKKKKKKKKKKKKKKKKKKKKKcccVVMMMMMMMV   psssssssss00000wtttttttttttttttttttttw00sssssssssp
..MVVVVVVVcccccKKKFFFFFFFFFFFFFFFFFKKKccMVMVVMVM..   ..spskksps00000tttsssssssssssssssssttt00spskksps..
..MVMVVVVMcccccMKKFFFFFFFFFFFFFFFFFKKMccMVMVVMVM..   ..ssskksss00000wttsssssssssssssssssttw00ssskksss..
VMM..MMMVVcccccMKKFFFFFFFFFFFFFFFFFKKMccVVVMM..MMV   pss..ssskk00000wttsssssssssssssssssttw00kksss..ssp
VVM..MVMVVcccccKKKFFFFFFFFFFFFFFFFFKKcccVVVVV..MVV   pps..spskk00000wttsssssssssssssssssttw00kksps..spp
VMMMMMMVVVcccccKKKFFFFFFFFFFFFFFFFFKKKccVVMMMMMMMV   psssssssss00000tttsssssssssssssssssttt00sssssssssp
..MVVVVVVVcccccMKKFFFFFFFFFFFFFFFFFKKMccMVMVVMVM..   ..spskksps00000wttsssssssssssssssssttw00spskksps..
..VVVVVVVVcccccMKKFFFFFFFFFFFFFFFFFKKMccMVVVVVVV..   ..pppkkpps00000wttsssssssssssssssssttw00sppkkppp..
VVVVVVVVVVcccccKKKFFFFFFFFFFFFFFFFFKKcccVVVVVVVVVV   pppppppppp00000wttsssssssssssssssssttw00pppppppppp
VVVVVVVVVVcccccKKKFFFFFFFFFFFFFFFFFKKKccVVVVVVVVVV   ppppppppps00000tttsssssssssssssssssttt00sppppppppp
VVVVVVVVVVcccccMKKFFFFFFFFFFFFFFFFFKKMccMVVVVVVVVV   ppppppppps00000wttsssssssssssssssssttw00sppppppppp
VVVVVVVVVVcccccMKKFFFFFFFFFFFFFFFFFKKMccVVVVVVVVVV   ppppppppps00000wttsssssssssssssssssttw00sppppppppp
VVVVVVVVVVcccccKKKFFFFFFFFFFFFFFFFFKKcccVVVVVVVVVV   pppppppppp00000wttsssssssssssssssssttw00pppppppppp
..VVVVVVVVcccccKKKFFFFFFFFFFFFFFFFFKKKccMVVVVVVV..   ..pppkkpps00000tttsssssssssssssssssttt00sppkkppp..
..MVVVVVVVcccccMKKFFFFFFFFFFFFFFFFFKKMccMVMVVMVM..   ..spskksps00000wttsssssssssssssssssttw00spskksps..
VMMMMVVMMMcccccMKKFFFFFFFFFFFFFFFFFKKMccMMVVVMMMMV   psssssssss00000wttsssssssssssssssssttw00sssssssssp
VVM..MVMVVcccccKKKFFFFFFFFFFFFFFFFFKKcccVVVVV..MVV   pps..spskk00000wttsssssssssssssssssttw00kksps..spp
VVM..MVMVVcccccKKKFFFFFFFFFFFFFFFFFKKKccVVVVM..MVV   pss..ssskk00000tttsssssssssssssssssttt00kksss..ssp
..MMMVVVMMcccccMKKKKKKKKKKKKKKKKKKKKKMccMMMVVMMM..   ..ssskksss00000wtttttttttttttttttttttw00ssskksss..
..MVVVVVVVcccccMKKKKKKKKKKKKKKKKKKKKKMccMVMVVMVM..   ..spskksps00000wtttttttttttttttttttttw00spskksps..
VMMMMVVMMMcccccMMcKMMcKMMnKMMnKMMcKMMcccMMVVVMMMMV   psssssssss00000wwwtwwwtwwwtwwwtwwwtwww00sssssssssp
VVM..MVMVVcccccccccccccnnnnnnnccccccccccVVVVV..MVV   pps..spskk000000000000000000000000000000kksps..spp
VVM..MVMVVcccccccccccccnnnnnnnccccccccccVVVVM..MVV   pss..ssskk000000000000000000000000000000kksss..ssp
..MMMVVVMMcccccccccccccnnnnnnnccccccccccMMMVVMMM..   ..ssskksss000000000000000000000000000000ssskksss..
..MVVVVVVVcccccccccccccnnnnnnnccccccccccMVMVVMVM..   ..spskksps000000000000000000000000000000spskksps..
VMMMMVVMMMcccccccccccccnnnnnnnccccccccccMMVVVMMMMV   psssssssssssskkssskkssspsspssskkssskkssssssssssssp
VVM..MVMVVMVMVVMVMVVMVVVVVVVVVVVVVVVVVVVVVVVV..MVV   pps..spskkspskkspskksppppppppskkspskkspskksps..spp
VVM..VVVVVMVMVVMVMVVMVVVVVVVVMVVVVMVVVVMVVVVV..MVV   pss..pppkkssskkssskkssppppppsskkssskkssskkppp..ssp
..MMVVVVVMVVVMMVVVMMVVVVVVVVVVMMMVVMMMVVMVVVVVMM..   ..ssppppsskkssskkssskkppppppkkssskkssskkssppppss..
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVMVMVVMVMVVMVVVVVVM..   ..sppppppskkspskkspskkppppppkkspskkspskkspppppps..
VMMMVVVVVMVVMMMVVMMMVVVVVVVVVVMMMVVMMMVVMMVVVVMMMV   psssppppssssssssssssssppppppssssssssssssssppppsssp
VVM..VVV..MVM..MVM..MVVVVVVVVV..MVV..MVV..VVV..MVV   pps..ppp..sps..sps..spppppppps..sps..sps..ppp..spp
VVV..VVV..VVV..VVV..VVVVVVVVVV..VVV..VVV..VVV..VVV   ppp..ppp..ppp..ppp..pppppppppp..ppp..ppp..ppp..ppp
```
### Seed 3: plan and heights side by side
```
VVV..VVV..VVV..VVV..VVV..VVV..VVV..VVV..VVV..VVV..   ppp..ppp..ppp..ppp..ppp..ppp..ppp..ppp..ppp..ppp..
VVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..   pps..sps..sps..sps..sps..sps..sps..sps..sps..sps..
VMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMV   pssssssssssssssssssssssssssssssssssssssssssssssssp
..MVV..MVV..MVV..MVV..MVV..MVV..MVV..MVV..MVV..MVV   ..sps..sps..sps..sps..sps..sps..sps..sps..sps..spp
..MVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..MVV   ..sss..sss..sss..sss..sss..sss..sss..sss..sss..ssp
VMM..MMM..MMM..MMM..MMM..MMM..MMM..MMM..MMM..MMM..   pss..sss..sss..sss..sss..sss..sss..sss..sss..sss..
VVM..VVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..VVM..   pps..sps..sps..sps..sps..sps..sps..sps..sps..sps..
VMMMVVVVVMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMVVVVVV   psssppppsssssssssssssssssssssssssssssssssssspppppp
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   ..sppppppskkspskkspskkspskkspskkspskkspskksppppppp
..MVVVVVVMVVVVMVVVVMVVVVMVVVVMVVVVMVVVVMVVVVVVVVVV   ..ssppppsskkssskkssskkssskkssskkssskkssskksspppppp
VMM..VVVVVMMMVVMMMVVMMMVVMMMVVMMMVVMMMVVMMMVVVVV..   pss..pppkkssskkssskkssskkssskkssskkssskkssskkppp..
VVM..MVMVVMVMVVMVMVVMVMVVMVMVVMVMVVMVMVVMVMVVMVM..   pps..spskkspskkspskkspskkspskkspskkspskkspskksps..
VMMMMMMVVVMMcVVMMcVVMMcVVMMcVVMMcVVMMcVVMMMVVMMMMV   psssssssssssskkssskkssskkssskkssskkssskksssssssssp
..MVVVVVVVcccccccccccccccccccccccccccccccccVVVVVVV   ..spskksps00000000000000000000000000000000spskkspp
..MVMVVVVMcccccccccccccccccccccccccccccccccVMVVVVV   ..ssskksss00000000000000000000000000000000ssskkssp
VMM..MMMVVcccccMMKKMMKKMMKKMMKKMMKKMMMcccccVVMMM..   pss..ssskk00000wwwtwwwtwwwtwwwtwwwtwww0000kkksss..
VVM..MVMVVcccccMKKKKKKKKKKKKKKKKKKKKKMcccccVVMVM..   pps..spskk00000wtttttttttttttttttttttw0000kkksps..
VMMMMMMVVVcccccKKKKKKKKKKKKKKKKKKKKKKccccccVVMMMMV   psssssssss00000wtttttttttttttttttttttw0000sssssssp
..MVVVVVVVcccccKKKFFFFFFFFFFFFFFFFFKKKcccccVVVVVVV   ..spskksps00000tttsssssssssssssssssttt0000spskkspp
..MVMVVVVMcccccMKKFFFFFFFFFFFFFFFFFKKMcccccVMVVVVV   ..ssskksss00000wttsssssssssssssssssttw0000ssskkssp
VMM..MMMVVcccccMKKFFFFFFFFFFFFFFFFFKKMcccccVVMMM..   pss..ssskk00000wttsssssssssssssssssttw0000kkksss..
VVM..MVMVVcccccKKKFFFFFFFFFFFFFFFFFKKccccccVVMVM..   pps..spskk00000wttsssssssssssssssssttw0000kkksps..
VMMMMMMVVVcccccKKKFFFFFFFFFFFFFFFFFKKKcccccVVMMMMV   psssssssss00000tttsssssssssssssssssttt0000sssssssp
..MVVVVVVVcccccMKKFFFFFFFFFFFFFFFFFKKMcccccVVVVVVV   ..spskksps00000wttsssssssssssssssssttw0000spskkspp
..MVMVVVVMcccccMKKFFFFFFFFFFFFFFFFFKKMcccccVMVVVVV   ..ssskksss00000wttsssssssssssssssssttw0000ssskkssp
VMM..MMMVVcccccKKKFFFFFFFFFFFFFFFFFKKccccccVVMMM..   pss..ssskk00000wttsssssssssssssssssttw0000kkksss..
VVM..MVMVVcccccKKKFFFFFFFFFFFFFFFFFKKKcccccVVMVM..   pps..spskk00000tttsssssssssssssssssttt0000kkksps..
VMMMMMMVVVcccccMKKFFFFFFFFFFFFFFFFFKKMcccccVVMMMMV   psssssssss00000wttsssssssssssssssssttw0000sssssssp
..MVVVVVVVcccccMKKFFFFFFFFFFFFFFFFFKKMcccccVVVVVVV   ..spskksps00000wttsssssssssssssssssttw0000spskkspp
..MVMVVVVMcccccKKKFFFFFFFFFFFFFFFFFKKccccccVMVVVVV   ..ssskksss00000wttsssssssssssssssssttw0000ssskkssp
VMM..MMMVVcccccKKKFFFFFFFFFFFFFFFFFKKKcccccVVMMM..   pss..ssskk00000tttsssssssssssssssssttt0000kkksss..
VVM..MVMVVcccccMKKFFFFFFFFFFFFFFFFFKKMcccccVVMVM..   pps..spskk00000wttsssssssssssssssssttw0000kkksps..
VMMMMMMVVVcccccMKKFFFFFFFFFFFFFFFFFKKMcccccVVMMMMV   psssssssss00000wttsssssssssssssssssttw0000sssssssp
..MVVVVVVVcccccKKKFFFFFFFFFFFFFFFFFKKccccccVVVVVVV   ..spskksps00000wttsssssssssssssssssttw0000spskkspp
..MVMVVVVMcccccKKKFFFFFFFFFFFFFFFFFKKKcccccVMVVVVV   ..ssskksss00000tttsssssssssssssssssttt0000ssskkssp
VMM..MMMVVcccccMKKKKKKKKKKKKKKKKKKKKKMcccccVVMMM..   pss..ssskk00000wtttttttttttttttttttttw0000kkksss..
VVM..MVMVVcccccMKKKKKKKKKKKKKKKKKKKKKMcccccVVMVM..   pps..spskk00000wtttttttttttttttttttttw0000kkksps..
VMMMMMMVVVcccccMMcKMMcKMMnKMMnKMMcKMMccccccVVMMMMV   psssssssss00000wwwtwwwtwwwtwwwtwwwtwww0000sssssssp
..MVVVVVVVcccccccccccccnnnnnnncccccccccccccVVVVVVV   ..spskksps00000000000000000000000000000000spskkspp
..MVMVVVVMcccccccccccccnnnnnnncccccccccccccVMVVVVV   ..ssskksss00000000000000000000000000000000ssskkssp
VMM..MMMVVMMMVVMMMVVMMMVVMMMVVMMMVVMMMVVMMMVVMMM..   pss..ssskkssskkssskkssskkssskkssskkssskkssskksss..
VVM..VVVVVMVMVVMVMVVMVMVVMVMVVMVMVVMVMVVMVMVVVVM..   pps..spskkspskkspskkspskkspskkspskkspskkspskksps..
VMMMVVVVVVMMVVVMMVVVMMVVVMMVVVMMVVVMMVVVMMVVVVVVVV   psssppppsssssssssssssssssssssssssssssssssssspppppp
..MVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV   ..sppppppskkspskkspskkspskkspskkspskkspskksppppppp
..MVVVVVVMVVVVMVVVVMVVVVMVVVVMVVVVMVVVVMVVVVVVVVVV   ..ssppppsskkssskkssskkssskkssskkssskkssskksspppppp
VMM..VVV..MMM..MMM..MMM..MMM..MMM..MMM..MMM..VVV..   pss..ppp..sss..sss..sss..sss..sss..sss..sss..ppp..
VVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..MVM..   pps..sps..sps..sps..sps..sps..sps..sps..sps..sps..
VMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMV   pssssssssssssssssssssssssssssssssssssssssssssssssp
..MVV..MVV..MVV..MVV..MVV..MVV..MVV..MVV..MVV..MVV   ..sps..sps..sps..sps..sps..sps..sps..sps..sps..spp
..VVV..VVV..VVV..VVV..VVV..VVV..VVV..VVV..VVV..VVV   ..ppp..ppp..ppp..ppp..ppp..ppp..ppp..ppp..ppp..ppp
```
How much the plans of the seeds differ: 0.33 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 143 nodi, 519 passi, finito in 514 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=terra (marcatore), h=honey, w=white, m=magenta, d=dead, dark, s=slate, c=cortile, n=lastricato, W=White, t=teal, f=assi del pavimento, F=solaio, K=pietra del mastio, u=blue, L=finestra, V=pietra della cinta, k=gradino, T=Teal (marcatore), M=merlo, O=porta, o=assi della porta, N=stipite, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: V 257994, K 46050, M 8928, U 6696, L 4800, k 2720, F 2290, c 1500, f 1225, o 426, n 75, N 60, O 24.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-38 all×22, one×3, prl×1: 426 celle x0-19 y0-19 z0, passi 2-52
   #43 map scala 5 5 1: ×1, 8450 celle x0-99 y0-99 z0-79, passi 53
#45-46 all×2: 9600 celle x30-74 y30-74 z0-6, passi 54-59
    #47 all . w → w u passi=14: ×14, 22400 celle x30-74 y30-74 z6-20, passi 60-73, w→u 11200, .→w 11200
    #48 all . w → w K passi=12: ×12, 19200 celle x30-74 y30-74 z20-32, passi 74-85, w→K 9600, .→w 9600
    #49 all . w → w K passi=6: ×6, 9600 celle x30-74 y30-74 z32-38, passi 86-91, w→K 4800, .→w 4800
    #50 all . w → w u passi=14: ×14, 22400 celle x30-74 y30-74 z38-52, passi 92-105, w→u 11200, .→w 11200
    #51 all . w → w K passi=12: ×12, 19200 celle x30-74 y30-74 z52-64, passi 106-117, w→K 9600, .→w 9600
#52-53 all×1, prl×1: 2400 celle x30-74 y30-74 z64-65, passi 118-119
    #54 all . W → W V passi=44: ×44, 96800 celle x15-94 y10-89 z0-44, passi 120-163, W→V 48400, .→W 48400
    #55 prl W → V: ×1, 1100 celle x15-94 y10-89 z44, passi 164, W→V 1100
    #59 all . t → t V passi=56: ×56, 420000 celle x0-99 y0-99 z0-56, passi 165-220, t→V 210000, .→t 210000
#60-62 prl×1, all×2: 6600 celle x0-99 y0-99 z0-56, passi 221-223
    #63 all . h → h . passi=31: ×31, 63550 celle x35-69 y35-69 z1-32, passi 224-254, h→. 31775, .→h 31775
#64-65 all×2: 14450 celle x35-69 y35-69 z2-33, passi 255-285
    #66 all . h → h . (+1) passi=31: ×31, 75950 celle x35-69 y35-69 z33-64, passi 286-316, h→. 31775, .→h 31775, s→. 6200, .→s 6200
      r1 . h → h . ×31775; r2 . s → s . ×6200
#67-124 prl×6, all×16: 19628 celle x0-99 y0-99 z0-66, passi 317-430
#125-142 all×4, prl×1, one×1: 19554 celle x0-99 y0-99 z9-71, passi 431-518
    #143 prl u → K: ×1, 17600 celle x30-74 y30-74 z6-51, passi 519, u→K 17600
Senza effetto (non hanno mai cambiato una cella):
#7 prl [Hh]/E → */h passi=1
#17 all c/E/E/E/E/E/E → */c/c/c/c/*/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#18 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#19 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#20 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all [nG]/W → */G: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all [Gr]/E → */r: in quel momento nella griglia non c'erano celle "Gr"
#36 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G"
#39 one Wccccc/Wccccc/Wccccc/Wccccc/Wccccc → *bbbb*/*bbbb*/*bbbb*/*bbbb*/*bbbb* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#40 all bc → P* passi=1: in quel momento nella griglia non c'erano celle "b"
#41 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#56 all . G → G O passi=1: in quel momento nella griglia non c'erano celle "G"
… e altri 46
Fix it and answer with the whole program.

## Risposta

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
