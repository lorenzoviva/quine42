# model.sculpt · claude-fable-5-1 · 195 s

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
FORTE. Parti: il mastio (h interno, w mura, s scala, d porta) al centro, la corte c attorno,
la cinta W di due celle con torri t ai quattro angoli esterni, il corpo di guardia G sulla
porta della cinta, la strada r davanti fino al bordo, il lastricato n che unisce la porta del
mastio alla cinta. Il mastio ha 3-4 celle dietro e 5-6 davanti al centro e 4-5 per lato (il seme decide);
la via d'uscita si traccia prima, la scala poi in un angolo dietro, a destra o a sinistra (il seme decide),
cosi' non taglia mai la via della porta. La corte e' una cella a Huge.
A Gargantuan la corte si allarga di 3 dove restano 11 celle di terreno, nascono il pozzo Q,
una tettoia a/e contro la cinta (dove la corte e' profonda 4) e il fossato x attorno alla cinta
dove il terreno va oltre. Altezze: cinta 24, corpo di guardia 40, mastio 65 (due piani), torri 80.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="PVCZY"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="PCYZ"/>
  <map scale="1/5 1/5 1" values="BHEhwsmdcnWGtrQaex" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la corte: una cella, tre di piu' dove il terreno va oltre di undici -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEE" out="*ccc********" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la cinta di due celle -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri agli angoli -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- il fossato, solo dove il terreno va oltre di sette -->
      <all in="[Wt]EEEEEEE" out="*x******" steps="1"/>
      <all in="[Wt]E/*x" out="*x/**"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- la via d'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/[Ex]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la scala in un angolo dietro del mastio, a destra o a sinistra -->
      <one steps="1" symmetry="()">
        <rule in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss"/>
        <rule in="wwwwwww/hhhhhhw/hhhhhhw" out="*******/*ssss**/*ssss**"/>
      </one>
      <!-- il pozzo e la tettoia, dove la corte e' larga -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*aaaaa*/*aaaaa*/*aaaaa*/*aaaaa*" steps="1"/>
      <all in="ac" out="e*" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsdcnWGtrQxpbyJPVCZYfFRTkMLUNOo#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <rule in="a" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="e" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <sequence symmetry="(xy)">
        <!-- B. le mura del mastio: intonaco, fascia delle finestre, intonaco, due piani, parapetto -->
        <all in="B w" out="w P" steps="1"/>
        <all in="B d" out="w O" steps="1"/>
        <all in="B w" out="w P" steps="5"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w P" steps="13"/>
        <prl in="w" out="P"/>
        <!-- la cinta, il corpo di guardia con la sua porta, le torri -->
        <all in="B W" out="W C" steps="23"/><prl in="W" out="C"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Z" steps="38"/><prl in="G" out="Z"/>
        <all in="B t" out="t Y" steps="79"/><prl in="t" out="Y"/>
        <!-- i piani del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- il pozzo -->
        <all in="B Q" out="Q q" steps="3"/><prl in="Q" out="q"/>
        <!-- la tettoia: pali e tetto -->
        <all in="B b" out="b b" steps="33"/>
        <all in="B p" out="y *" steps="1"/><all in="B y" out="y B" steps="33"/><prl in="y" out="J"/>
        <!-- C. le finestre nella fascia -->
        <one in="VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB" out="L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L*" steps="16"/>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="P"/>
        <!-- le parti -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="6a8a4a" name="terreno" hidden="True"/>
  <color symbol="c" value="7fa05a" name="corte" area="courtyard"/>
  <color symbol="n" value="c0b89a" name="lastricato"/>
  <color symbol="r" value="b8a070" name="strada"/>
  <color symbol="x" value="4f7fa0" name="fossato"/>
  <color symbol="P" value="9a9a92" name="pietra del mastio" area="keep"/>
  <color symbol="C" value="6f6f6a" name="pietra della cinta"/>
  <color symbol="Z" value="5f5f5a" name="corpo di guardia"/>
  <color symbol="Y" value="7a7a74" name="pietra delle torri" area="tower"/>
  <color symbol="f" value="b08050" name="assi del pavimento"/>
  <color symbol="F" value="8a6a40" name="solaio"/>
  <color symbol="R" value="a09a80" name="terrazza del mastio"/>
  <color symbol="k" value="c0a070" name="gradini"/>
  <color symbol="M" value="8a8a82" name="merli"/>
  <color symbol="U" value="2a2a2a" name="feritoia"/>
  <color symbol="L" value="3a5070" name="vetro"/>
  <color symbol="N" value="5a5a52" name="stipiti"/>
  <color symbol="O" value="5a3a1a" name="porta"/>
  <color symbol="o" value="3a2410" name="assi della porta"/>
  <color symbol="q" value="4a6a8a" name="pozzo"/>
  <color symbol="p" value="c8b088" name="pavimento della tettoia" area="porch"/>
  <color symbol="b" value="6a4a2a" name="pali"/>
  <color symbol="J" value="a04030" name="tegole della tettoia"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, c corte, n lastricato, r strada, x fossato, P pietra del mastio, C pietra della cinta, Z corpo di guardia, Y pietra delle torri, f assi del pavimento, F solaio, R terrazza del mastio, k gradini, M merli, L vetro, U feritoia, N stipiti, O porta, o assi della porta
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEYYYYYYYMxxxxxxxxxxxxxxxxxxxxxxYYYYYYYMEEEEE
EEEEEEEYYYYYYYYxxxxxxxxxxxxxxxxxxxxxxYYYYYYYYEEEEE
EEEEEEEYYYYYYYYxxxxxxxxxxxxxxxxxxxxxxYYYYYYYYEEEEE
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE
EEEEEEEYYYYYYYMCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE
EEEEEEEYYYYYYcccccccccccccccccccccccccYYYYYYYEEEEE
EEEEEEExxxCCCccMPPcPPcPcPPPPPPcPPcPcccCCCCxxxEEEEE
EEEEEEExxxCCCccPPPPPPPPPPPPPPPPPPPPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRMPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE
EEEEEEExxxCCCccPPPPPPPPPPPPPPPPPPPPPPcCCCCxxxEEEEE
EEEEEEExYYYYCccccccccccnnnnncccccccccccCYMYYMEEEEE
EEEEEEEYYYYYYccccccccccnnnnnccccccccccYYYYYYYEEEEE
EEEEEEEYYYYYYYMCCCCCCCCMZZZZMCCCCCCCCYYYYYYYYEEEEE
EEEEEEEYYYYYYYYCCCCCCCCZZZZZNCCCCCCCCYYYYYYYYEEEEE
EEEEEEEYYYYYYYYCCCCCCCCZZZZZNCCCCCCCCYYYYYYYYEEEEE
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE
EEEEEEEYYYYYYYMxxxxxxxxxxrrxxxxxxxxxxYYYYYYYMEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE
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
00000000000000000000000000000000000000000000000000
000000ppppppppp000000000000000000000ppppppppp00000
000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
000000pnnnnnnnp777777777777777777777pnnnnnnnp00000
000000pnnnnnnnn777777777777777777777nnnnnnnnp00000
000000pnnnnnnnp777777777777777777777pnnnnnnnp00000
000000pnnnnnnnp777777777777777777777ppnnnnnnp00000
000000pnnnnnnp000000000000000000000000pnnnnnp00000
000000pppppppp0llllllljllllllllllljll0ppnpppp00000
000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
000000000077770jjjjjjjjjjjjjjjjjjjjjj0777700000000
000000000077770ljlljjjjjjjjjjjjjjjjjl0777700000000
000000000077770ljjljjjjjjjjjjjjjjjjjl0777700000000
000000000077770ljlljjjjjjjjjjjjjjlljl0777700000000
000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
000000000077770ljlljjjjjjjjjjjjjjljjl0777700000000
000000000077770ljjljjjjjjjjjjjjjjljjl0777700000000
000000000077770jjjljjjjjjjjjjjjjjlljl0777700000000
000000000077770ljlljjjjjjjjjjjjjjjjjl0777700000000
000000000077770ljjjjjjjjjjjjjjjjjlljl0777700000000
000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
000000000077770jjjjjjjjjjjjjjjjjjlljj0777700000000
000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
000000pppppppp0llllllljljljllllllljll0ppnpppp00000
000000pnnnnnnp000000000000000000000000pnnnnnp00000
000000nnnnnnnnp77777777ddbddd7777777ppnnnnnnn00000
000000pnnnnnnnp77777777dbbbbd7777777pnnnnnnnp00000
000000nnnnnnnnp77777777dbbbbd7777777pnnnnnnnn00000
000000pnnnnnnnp77777777ddbddd7777777pnnnnnnnp00000
000000nnnnnnnnn000000000000000000000nnnnnnnnn00000
000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
000000ppppppppp000000000000000000000ppppppppp00000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.......M....MMM......................MMM.M..M.....
.......M.MMMMMM......................MMM.M.MM.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYYMMMM.MM.MMMMMM.M.MM.MMYYYYYYYY.....
.......YYYYYYYYMMMM.MM.MMMMMM.M.MM.MMYYYYYYYY.....
.......YYYYYYYYPPPPPPPPPPPPPPPPPPPPPPYYYYYYYY.....
.......YYYYYYYYUUUUUUUUUUUUUUUUUUUUUUYYYYYYYY.....
.......YYYYYYYYUUUUUUUUUUUUUUUUUUUUUUYYYYYYYY.....
.......YYYYYYYYPPPPPPPPPPPPPPPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPPPPPPPPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPPPPPPLPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPPPPPPLPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPMMPMMPPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPMMPMMPPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPZZZZZPPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPZZZZZPPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPZZZZZPPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPNooooOPPPPPPPPYYYYYYYY.....
.......YYYYYYYYPPPPPPPPNooooOPPPPPPPPYYYYYYYY.....
.......YYYYYYYYCCCCCCCCNooooOCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCNooooOCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCNooooOCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCNooooOCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCNooooOCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCNooooOCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCNooooOCCCCCCCCYYYYYYYY.....
......EYYYYYYYYCCCCCCCCEooooECCCCCCCCYYYYYYYY.....
```
Right side (looking from the right):
```
..........M..M.MMM.....................MMM.M.M....
..........MM.M.MMM....................MMMM.M.MM...
..........YYYYYYYY....................YYYYYYYYY...
..........YYYYYYYY....................YYYYYYYYY...
..........YYYYYYYY....................YYYYYYYYY...
..........YYYYYYYYMM.MMMMMMMMMMMM.MM.MYYYYYYYYY...
..........YYYYYYYYMM.MMMMMMMMMMMM.MM.MYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYUUUUUUUUUUUUUUUUUUUUYYYYYYYYY...
..........YYYYYYYYUUUUUUUUUUUUUUUUUUUUYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYPPPPLPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYPLPPLPPLPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYPLPPPPPLPPPPPLPPPPPPYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPLPPPPPPYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYPPPPPPPPPPPPPPPPPPPPYYYYYYYYY...
..........YYYYYYYYCCCCCCCCCCCCCCCCCCCCYYYYYYYYY...
..........YYYYYYYYCCCCCCCCCCCCCCCCCCCCYYYYYYYYY...
..........YYYYYYYYCCCCCCCCCCCCCCCCCCCCYYYYYYYYY...
..........YYYYYYYYCCCCCCCCCCCCCCCCCCCCYYYYYYYYY...
..........YYYYYYYYCCCCCCCCCCCCCCCCCCCCYYYYYYYYY...
..........YYYYYYYYCCCCCCCCCCCCCCCCCCCCYYYYYYYYY...
..........YYYYYYYYCCCCCCCCCCCCCCCCCCCCYYYYYYYYY...
..........YYYYYYYYCCCCCCCCCCCCCCCCCCCCYYYYYYYYY...
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
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYY.....
.......YYYYYY.........................YYYYYYY.....
..........CCC..PPPPPPPPPPPPLPPLPPPPP..CCCC........
..........CCC..PPPPPPPPPPPPLPPLPPPPPP.CCCC........
..........CCC..PP...........kkkk...LL.CCCC........
..........CCC..PP...........kkkk...PP.CCCC........
..........CCC..PPL..........kkkk...PP.CCCC........
..........CCC..PP.................PPP.CCCC........
..........CCC..PP................PPPP.CCCC........
..........CCC..PP................PPPP.CCCC........
..........CCC..PP................PPPP.CCCC........
..........CCC..PPP...............PPPP.CCCC........
..........CCC..PPP.................PP.CCCC........
..........CCC..PPP.................PP.CCCC........
..........CCC..PP................PPPP.CCCC........
..........CCC..PP................PPPP.CCCC........
..........CCC..PP................PPPP.CCCC........
..........CCC..PP..................PP.CCCC........
..........CCC..PP..................PP.CCCC........
..........CCC..PP..................PP.CCCC........
..........CCC..PP..................PP.CCCC........
..........CCC..PPPPPPPPooooooPPPPPPPP.CCCC........
.......YYYYYY.........................YYYYYYY.....
.......YYYYYY.........................YYYYYYY.....
.......YYYYYYYYCCCCCCCCoooooNCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCooooooCCCCCCCCYYYYYYYY.....
.......YYYYYYYYCCCCCCCCooooooCCCCCCCCYYYYYYYY.....
.......YYYYYYYY.....................YYYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
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
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYY.........................YYYYYYY.....
...............PPPPPPPPPPPPLPPPPPLPP..............
...............PPPPPPPPPPPPLPPPPPLPPP.............
...............PP..................PP.............
...............PP..................PP.............
...............PPP.................PP.............
...............PP.................PPP.............
...............PP................PPPP.............
...............PP................PPPP.............
...............PP................PPPP.............
...............PPP...............PPPP.............
...............PPP.................PP.............
...............PPP.................PP.............
...............PP................PPPP.............
...............PP................PPPP.............
...............PP................PPPP.............
...............PP..................PP.............
...............PP..................PP.............
...............PP..................PP.............
...............PP..................PP.............
...............PPPPPPPPPPPPPPPPPPPPPP.............
.......YYYYYY..........................YYYYYY.....
.......YYYYYY.........................YYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
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
.......UYYYYUYU......................UYUYYYYU.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......UYYYYUYU......................UYUYYYYU.....
.......YYYYYYYY......................YYYYYYYY.....
.......UYYYYU.........................YUYYYYU.....
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.......YYYYYY..........................YYYYYY.....
.......UYYYYU.........................YUYYYYU.....
.......UYYYYUYU......................UYUYYYYU.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......YYYYYYYY......................YYYYYYYY.....
.......UYYYYUYU......................UYUYYYYU.....
.......YYYYYYYY......................YYYYYYYY.....
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEYYYYYYYMxxxxxxxxxxxxxxxxxxxxxxYYYYYYYMEEEEE   000000ppppppppp000000000000000000000ppppppppp00000
EEEEEEEYYYYYYYYxxxxxxxxxxxxxxxxxxxxxxYYYYYYYYEEEEE   000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
EEEEEEEYYYYYYYYxxxxxxxxxxxxxxxxxxxxxxYYYYYYYYEEEEE   000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnp777777777777777777777pnnnnnnnp00000
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnn777777777777777777777nnnnnnnnp00000
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnp777777777777777777777pnnnnnnnp00000
EEEEEEEYYYYYYYMCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnp777777777777777777777ppnnnnnnp00000
EEEEEEEYYYYYYcccccccccccccccccccccccccYYYYYYYEEEEE   000000pnnnnnnp000000000000000000000000pnnnnnp00000
EEEEEEExxxCCCccMPPcPPcPcPPPPPPcPPcPcccCCCCxxxEEEEE   000000pppppppp0llllllljllllllllllljll0ppnpppp00000
EEEEEEExxxCCCccPPPPPPPPPPPPPPPPPPPPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770jjjjjjjjjjjjjjjjjjljjj0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjlljl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljlljjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljlljjjjjjjjjjjjjjlljl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljlljjjjjjjjjjjjjjlljl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljlljjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjlljl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770jjlljjjjjjjjjjjjjjlljj0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljlljjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRMPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjlljl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPPPPPPPPPPPPPPPPPPPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExYYYYCccccccccccnnnnncccccccccccCYMYYMEEEEE   000000pppppppp0llllllljllllllllllljll0ppnpppp00000
EEEEEEEYYYYYYccccccccccnnnnnccccccccccYYYYYYYEEEEE   000000pnnnnnnp000000000000000000000000pnnnnnp00000
EEEEEEEYYYYYYYMCCCCCCCCMZZZZNCCCCCCCCYYYYYYYYEEEEE   000000nnnnnnnnp77777777dddddd7777777ppnnnnnnn00000
EEEEEEEYYYYYYYYCCCCCCCCZZZZZNCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnp77777777dbbbbd7777777pnnnnnnnp00000
EEEEEEEYYYYYYYYCCCCCCCCNZZZZMCCCCCCCCYYYYYYYYEEEEE   000000nnnnnnnnp77777777dbbbbd7777777pnnnnnnnn00000
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE   000000pnnnnnnnp77777777ddbddd7777777pnnnnnnnp00000
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE   000000nnnnnnnnn000000000000000000000nnnnnnnnn00000
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE   000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
EEEEEEEYYYYYYYMxxxxxxxxxxrrxxxxxxxxxxYYYYYYYMEEEEE   000000ppppppppp000000000000000000000ppppppppp00000
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEYYYYYYYMxxxxxxxxxxxxxxxxxxxxxxYYYYYYYMEEEEE   000000ppppppppp000000000000000000000ppppppppp00000
EEEEEEEYYYYYYYYxxxxxxxxxxxxxxxxxxxxxxYYYYYYYYEEEEE   000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
EEEEEEEYYYYYYYYxxxxxxxxxxxxxxxxxxxxxxYYYYYYYYEEEEE   000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnp777777777777777777777pnnnnnnnp00000
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnn777777777777777777777nnnnnnnnp00000
EEEEEEEYYYYYYYYCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnp777777777777777777777pnnnnnnnp00000
EEEEEEEYYYYYYYMCCCCCCCCCCCCCCCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnp777777777777777777777ppnnnnnnp00000
EEEEEEEYYYYYYcccccccccccccccccccccccccYYYYYYYEEEEE   000000pnnnnnnp000000000000000000000000pnnnnnp00000
EEEEEEExxxCCCccMPPcPPcPcPcPcPPcPPcPcccCCCCxxxEEEEE   000000pppppppp0llllllljljljllllllljll0ppnpppp00000
EEEEEEExxxCCCccPPPPPPPPPPPPPPPPPPPPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770jjjljjjjjjjjjjjjjjljjj0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770ljjljjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE   000000000077770ljjljjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjlljl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjljjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjljjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjljjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRRPPcCCCCxxxEEEEE   000000000077770ljjljjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE   000000000077770ljlljjjjjjjjjjjjjjlljj0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770ljlljjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE   000000000077770ljjljjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770ljjljjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770jjlljjjjjjjjjjjjjjljjj0777700000000
EEEEEEExxxCCCccPPRRRRRRRRRRRRRRRRRPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPRRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770ljlljjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPPRRRRRRRRRRRRRRPPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjljjl0777700000000
EEEEEEExxxCCCccPPPPPPPPPPPPPPPPPPPPPPcCCCCxxxEEEEE   000000000077770ljjjjjjjjjjjjjjjjjjjjl0777700000000
EEEEEEExYYYYCccccccccccnnnnncccccccccccCYMYYMEEEEE   000000pppppppp0llllllljllllllllllljll0ppnpppp00000
EEEEEEEYYYYYYccccccccccnnnnnccccccccccYYYYYYYEEEEE   000000pnnnnnnp000000000000000000000000pnnnnnp00000
EEEEEEEYYYYYYYMCCCCCCCCMZZZZMCCCCCCCCYYYYYYYYEEEEE   000000nnnnnnnnp77777777dddddd7777777ppnnnnnnn00000
EEEEEEEYYYYYYYYCCCCCCCCZZZZZNCCCCCCCCYYYYYYYYEEEEE   000000pnnnnnnnp77777777dbbbbd7777777pnnnnnnnp00000
EEEEEEEYYYYYYYYCCCCCCCCNZZZZNCCCCCCCCYYYYYYYYEEEEE   000000nnnnnnnnp77777777dbbbbd7777777pnnnnnnnn00000
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE   000000pnnnnnnnp77777777dddddd7777777pnnnnnnnp00000
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE   000000nnnnnnnnn000000000000000000000nnnnnnnnn00000
EEEEEEEYYYYYYYYxxxxxxxxxxrrxxxxxxxxxxYYYYYYYYEEEEE   000000pnnnnnnnp000000000000000000000pnnnnnnnp00000
EEEEEEEYYYYYYYMxxxxxxxxxxrrxxxxxxxxxxYYYYYYYMEEEEE   000000ppppppppp000000000000000000000ppppppppp00000
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.03 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 140 nodi, 639 passi, finito in 837 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=terreno (marcatore), h=honey, w=white, s=slate, m=magenta, d=dead, dark, c=corte, n=lastricato, W=White, G=Green, t=teal, r=strada, x=fossato, P=pietra del mastio, V=oliVe, C=pietra della cinta, Z=corpo di guardia, Y=pietra delle torri, f=assi del pavimento, F=solaio, R=terrazza del mastio, T=Teal (marcatore), k=gradini, M=merli, L=vetro, U=feritoia, N=stipiti, O=porta, o=assi della porta, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: Y 188832, P 76903, C 55920, U 11412, E 9800, o 6510, M 2868, k 2720, f 2550, R 2550, x 2450, F 2390, L 1472, c 1275, Z 1206, N 1005, O 240, r 100, n 75.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-36 all×25, prl×3, one×1: 574 celle x4-26 y6-29 z0, passi 2-59
   #41 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 60
#43-45 all×3: 16200 celle x45-109 y55-114 z0-6, passi 61-67
    #46 all . w → w V passi=14: ×14, 37800 celle x45-109 y55-114 z6-20, passi 68-81, w→V 18900, .→w 18900
    #47 all . w → w P passi=12: ×12, 32400 celle x45-109 y55-114 z20-32, passi 82-93, w→P 16200, .→w 16200
    #48 all . w → w P passi=6: ×6, 16200 celle x45-109 y55-114 z32-38, passi 94-99, w→P 8100, .→w 8100
    #49 all . w → w V passi=14: ×14, 37800 celle x45-109 y55-114 z38-52, passi 100-113, w→V 18900, .→w 18900
#50-51 all×1, prl×1: 36450 celle x45-109 y55-114 z52-65, passi 114-127
    #52 all . W → W C passi=23: ×23, 108100 celle x30-124 y40-129 z0-23, passi 128-150, W→C 54050, .→W 54050
#53-56 prl×2, all×2: 14200 celle x30-124 y40-129 z0-39, passi 151-191
    #57 all . t → t Y passi=79: ×79, 379200 celle x20-134 y30-139 z0-79, passi 192-270, t→Y 189600, .→t 189600
#58-60 prl×1, all×2: 7900 celle x20-134 y30-139 z0-79, passi 271-273
    #61 all . h → h . passi=31: ×31, 145700 celle x50-104 y60-109 z1-32, passi 274-304, h→. 72850, .→h 72850
#62-63 all×2: 17100 celle x50-104 y60-109 z2-33, passi 305-335
    #64 all . h → h . (+1) passi=31: ×31, 158100 celle x50-104 y60-109 z33-64, passi 336-366, h→. 72850, .→h 72850, s→. 6200, .→s 6200
      r1 . h → h . ×72850; r2 . s → s . ×6200
#65-73 prl×1, one×1, all×1: 4022 celle x45-109 y55-114 z6-64, passi 367-384
    #74 prl V → P: ×1, 36328 celle x45-109 y55-114 z6-51, passi 385, V→P 36328
#81-109 all×10, prl×2: 20500 celle x20-134 y30-139 z0-85, passi 386-433
#110-140 all×10, prl×4: 24334 celle x20-134 y30-139 z1-77, passi 434-639
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/h → h/* passi=1
#15 all cEEEEEEEEEEE → *ccc******** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#16 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#37 one ccc/ccc/ccc → ***/*Q*/*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#38 one WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc → *******/*aaaaa*/*aaaaa*/*aaaaa*/*aaaaa* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#39 all ac → e* passi=1: in quel momento nella griglia non c'erano celle "a"
#66 all . Q → Q q passi=3: in quel momento nella griglia non c'erano celle "Q"
#67 prl Q → q: in quel momento nella griglia non c'erano celle "Q"
#68 all . b → b b passi=33: in quel momento nella griglia non c'erano celle "b"
#69 all . p → y * passi=1: in quel momento nella griglia non c'erano celle "p"
#70 all . y → y . passi=33: in quel momento nella griglia non c'erano celle "y"
#71 prl y → J: in quel momento nella griglia non c'erano celle "y"
… e altri 36
Fix it and answer with the whole program.

## Risposta

<!--
FORTE. Parti: il mastio (h interno, w mura, s scala, d porta) al centro, la corte c attorno,
la cinta W di due celle con torri t ai quattro angoli esterni, il corpo di guardia G sulla
porta della cinta, la strada r davanti fino al bordo, il lastricato n che unisce la porta del
mastio alla cinta. Il mastio ha 3-4 celle dietro e 5-6 davanti al centro e 4-5 per lato (il seme decide);
la via d'uscita si traccia prima, la scala poi in un angolo dietro, a destra o a sinistra (il seme decide),
larga tre celle, con due celle di pianerottolo prima e tre di pavimento dopo, cosi' il corpo
sale in linea ed esce comodo al piano di sopra. La corte e' una cella a Huge.
A Gargantuan la corte si allarga di 3 dove restano 11 celle di terreno, nascono il pozzo Q,
una tettoia a/e contro la cinta (dove la corte e' profonda 4) e il fossato x attorno alla cinta
dove il terreno va oltre. Altezze: cinta 24, corpo di guardia 40, mastio 65 (due piani), torri 80.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="PVCZY"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="PCYZ"/>
  <map scale="1/5 1/5 1" values="BHEhwsmdcnWGtrQaex" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la corte: una cella, tre di piu' dove il terreno va oltre di undici -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEE" out="*ccc********" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la cinta di due celle -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri agli angoli -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- il fossato, solo dove il terreno va oltre di sette -->
      <all in="[Wt]EEEEEEE" out="*x******" steps="1"/>
      <all in="[Wt]E/*x" out="*x/**"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- la via d'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/[Ex]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la scala in un angolo dietro del mastio, a destra o a sinistra: tre celle larga, due di pianerottolo prima, tre di pavimento dopo -->
      <one steps="1" symmetry="()">
        <rule in="wwwwwwwwww/whhhhhhhhh/whhhhhhhhh/whhhhhhhhh" out="**********/***ssss***/***ssss***/***ssss***"/>
        <rule in="wwwwwwwwww/hhhhhhhhhw/hhhhhhhhhw/hhhhhhhhhw" out="**********/**ssss****/**ssss****/**ssss****"/>
      </one>
      <!-- il pozzo e la tettoia, dove la corte e' larga -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*aaaaa*/*aaaaa*/*aaaaa*/*aaaaa*" steps="1"/>
      <all in="ac" out="e*" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsdcnWGtrQxpbyJPVCZYfFRTkMLUNOo#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <rule in="a" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="e" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <sequence symmetry="(xy)">
        <!-- B. le mura del mastio: intonaco, fascia delle finestre, intonaco, due piani, parapetto -->
        <all in="B w" out="w P" steps="1"/>
        <all in="B d" out="w O" steps="1"/>
        <all in="B w" out="w P" steps="5"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w P" steps="13"/>
        <prl in="w" out="P"/>
        <!-- la cinta, il corpo di guardia con la sua porta, le torri -->
        <all in="B W" out="W C" steps="23"/><prl in="W" out="C"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Z" steps="38"/><prl in="G" out="Z"/>
        <all in="B t" out="t Y" steps="79"/><prl in="t" out="Y"/>
        <!-- i piani del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- il pozzo -->
        <all in="B Q" out="Q q" steps="3"/><prl in="Q" out="q"/>
        <!-- la tettoia: pali e tetto -->
        <all in="B b" out="b b" steps="33"/>
        <all in="B p" out="y *" steps="1"/><all in="B y" out="y B" steps="33"/><prl in="y" out="J"/>
        <!-- C. le finestre nella fascia -->
        <one in="VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB" out="L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L*" steps="16"/>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="P"/>
        <!-- le parti -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="6a8a4a" name="terreno" hidden="True"/>
  <color symbol="c" value="7fa05a" name="corte" area="courtyard"/>
  <color symbol="n" value="c0b89a" name="lastricato"/>
  <color symbol="r" value="b8a070" name="strada"/>
  <color symbol="x" value="4f7fa0" name="fossato"/>
  <color symbol="P" value="9a9a92" name="pietra del mastio" area="keep"/>
  <color symbol="C" value="6f6f6a" name="pietra della cinta"/>
  <color symbol="Z" value="5f5f5a" name="corpo di guardia"/>
  <color symbol="Y" value="7a7a74" name="pietra delle torri" area="tower"/>
  <color symbol="f" value="b08050" name="assi del pavimento"/>
  <color symbol="F" value="8a6a40" name="solaio"/>
  <color symbol="R" value="a09a80" name="terrazza del mastio"/>
  <color symbol="k" value="c0a070" name="gradini"/>
  <color symbol="M" value="8a8a82" name="merli"/>
  <color symbol="U" value="2a2a2a" name="feritoia"/>
  <color symbol="L" value="3a5070" name="vetro"/>
  <color symbol="N" value="5a5a52" name="stipiti"/>
  <color symbol="O" value="5a3a1a" name="porta"/>
  <color symbol="o" value="3a2410" name="assi della porta"/>
  <color symbol="q" value="4a6a8a" name="pozzo"/>
  <color symbol="p" value="c8b088" name="pavimento della tettoia" area="porch"/>
  <color symbol="b" value="6a4a2a" name="pali"/>
  <color symbol="J" value="a04030" name="tegole della tettoia"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
