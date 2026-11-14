# model.sculpt · gemini-3.8-flash · 23 s

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
  Forte: cinta quadrangolare con torri d'angolo, cammino di ronda e merli,
  cortile interno acciottolato con pozzo, mastio a due piani con scala (part-stair)
  e feritoie (part-slits), porta d'accesso della cinta (part-door) e porta del mastio.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtGdrQiamk" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Corpo del mastio attorno a H: 5 celle x (25 vox) e 5 celle y (25 vox) internamente -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>

      <!-- Vano scala: lungo x, largo 2 celle y, lungo 4 celle x -->
      <!-- Lascia 2 celle a ovest di sbarco/partenza -->
      <one in="hhhhhh/hhhhhh" out="**ssss/**ssss" symmetry="()" steps="1"/>

      <!-- Mura perimetrali del mastio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Cortile c attorno al mastio: 2 celle -->
      <all in="wE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Espansione cortile se c'è spazio (taglia huge) -->
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Pozzo nel cortile se c'è spazio libero -->
      <one in="ccc/ccc/ccc" out="***/ *Q* /***" steps="1"/>

      <!-- 3. Mura esterne della cinta (W) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo 2x2 celle -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- 4. Strada e porte verso il fronte (+y) dritto dal centro mastio -->
      <all in="[Hh]/[Hh]" out="*/m" symmetry="()" steps="1"/>
      <all in="m/[Hh]" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dm]/c" out="*/n" symmetry="()"/>
      <all in="[nm]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allargamento strada e passaggi a 3 celle (15 voxels) -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <prl><rule in="m" out="h"/><rule in="n" out="c"/></prl>
    </sequence>

    <!-- Ritorno alla scala voxel 5x5x1 -->
    <map scale="5 5 1" values="BEhwscWtGdrQiamkTkOoNMULFVfpP" symmetry="()">
      <!-- Terreno ed esterno -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <!-- Cortile e pozzo -->
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="Q" out="ccccc/cPPcc/cPPcc/ccccc/ccccc"/>
      <!-- Mastio: pavimento, vano scala, mura, porta -->
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <!-- Cinta esterna: mura, porta, torri -->
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>

      <sequence symmetry="(xy)">
        <!-- B. ALTEZZE DEI VOLUMI -->
        <!-- 1. Pavimentazioni a z=0: restano sul fondo come indicatore d'area -->
        <!-- Mastio piano terra (z=0 f, z=1 strip scala, z=32 solaio F, z=64 tetto) -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>

        <!-- Cortile e strada si alzano di un basamento in pietra -->
        <all steps="1"><rule in="B c" out="c P"/><rule in="B r" out="r r"/></all>

        <!-- Pozzo: bordo in pietra alto 10 con acqua al centro -->
        <all in="B P" out="P P" steps="9"/>

        <!-- Cinta muraria (W) e Corpo di guardia (G): cammino di ronda a quota 24 -->
        <all in="B W" out="W W" steps="23"/>
        <all in="B G" out="G W" steps="23"/>

        <!-- Torri della cinta (t): alte 40 voxels -->
        <all in="B t" out="t W" steps="39"/>

        <!-- Mura del mastio (w, d): alte 64 voxels (2 piani da 32) -->
        <all in="B w" out="w w" steps="64"/>
        <all in="B d" out="d w" steps="64"/>

        <!-- Interno mastio: piano terra (z=1..31) -->
        <!-- Posiziona il marker T della scala a z=1 nella zona s -->
        <all in="B s" out="s T" steps="1"/>
        <!-- Aria piano terra -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>

        <!-- Solaio primo piano mastio a z=32 -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>

        <!-- Primo piano mastio (z=33..63): aria -->
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>

        <!-- Piattaforma calpestabile in cima a torri, mura e mastio -->
        <prl>
          <rule in="t" out="W"/>
          <rule in="W" out="W"/>
          <rule in="G" out="W"/>
          <rule in="w" out="w"/>
          <rule in="d" out="w"/>
          <rule in="h" out="w"/>
          <rule in="s" out="w"/>
        </prl>

        <!-- C. DETTAGLI E INCLUSIONE PARTI -->
        <!-- Seme della porta d'ingresso principale nella cinta (G) a quota P/r -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>

        <!-- Seme della porta del mastio -->
        <all in="w/P" out="O/*" symmetry="()" steps="1"/>
        <all in="w/O" out="O/*" symmetry="()" steps="5"/>

        <!-- Unioni per le parti standard -->
        <union symbol="+" values="Ww"/>
        <union symbol="=" values="fFP"/>
        <union symbol="%" values="Ww"/>

        <!-- Import scala mastio -->
        <import file="part-stair"/>

        <!-- Import porte cinta e mastio -->
        <import file="part-door"/>

        <!-- Import merlatura sui camminamenti e torri -->
        <import file="part-battlements"/>

        <!-- Import feritoie sulle mura merlate -->
        <import file="part-slits"/>

        <!-- Finestre al primo piano del mastio (3 lati) -->
        <all in="BBB/BBB/BBB www" out="***/***/*** LLL" symmetry="(x)" steps="3"/>
        <all in="Lwww" out="*LLB" symmetry="()" steps="2"/>

        <!-- Pulizia finale -->
        <prl><rule in="L" out="B"/></prl>
      </sequence>
    </map>
  </map>

  <!-- AZIONI INTERATTIVE -->
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="B"/><rule in="o" out="B"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="B" out="O" steps="1"/></all>
  </action>

  <!-- PALETTE COLORI -->
  <color symbol="E" value="#4a7038" hidden="True" name="erba"/>
  <color symbol="r" value="#827b73" area="yard" name="strada lastricata"/>
  <color symbol="c" value="#666159" area="courtyard" name="cortile interno"/>
  <color symbol="P" value="#8c857b" name="selciato"/>
  <color symbol="W" value="#57524b" name="pietra fortezza"/>
  <color symbol="w" value="#615b54" name="pietra mastio"/>
  <color symbol="M" value="#6e685f" name="merli"/>
  <color symbol="f" value="#594230" name="pavimento legno"/>
  <color symbol="F" value="#6e543d" name="solaio legno"/>
  <color symbol="k" value="#806348" name="gradini scala"/>
  <color symbol="O" value="#4a3525" name="porta"/>
  <color symbol="o" value="#3b2b1e" name="tavole porta"/>
  <color symbol="N" value="#473e35" name="stipite"/>
  <color symbol="U" value="#1c1a17" name="feritoia"/>
</sequence>
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); porta: 45 × 24 voxel (2,25 × 1,20 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 25 voxel (1,25 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, w pietra mastio, c cortile interno, W pietra fortezza, r strada lastricata, k gradini scala, O porta, o tavole porta, N stipite, M merli, U feritoia, F solaio legno, f pavimento legno, P selciato
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEMWMWWMMEEEEEEEEEEEEEEEEEEEEEEEMMWWMWMEEEEE
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWEEEEE
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWEEEEE
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE
EEEEEEEEWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE
EEEEEEEEWWWWWccccccccccccWWWWWccccccccccWWWWWEEEEE
EEEEEEEEWWWWMccccccccccccMWWWWccccccccccMWWWWEEEEE
EEEEEEEEEWMMcccccccccccccWWWWWccccccccccMMWWMEEEEE
EEEEEEEEEEWWWccccccccccccWWWWWcPccccccccWWWEEEEEEE
EEEEEEEEEEWWWccccccccccccMWWWWccccccccccWWWEEEEEEE
EEEEEEEEEEWWWccccccccccccMWWWWccccccccccWWWEEEEEEE
EEEEEEEEEEWWWccccccccccccWWWWWccccccccccWWWEEEEEEE
EEEEEEEEEEWWWccccccccccccWWWWWccccccccccWWWEEEEEEE
EEEEEEEEEEWWWccMwwwwwwMccMWWWWcccwwwwMccWWWEEEEEEE
EEEEEEEEEEWWWccMwwwwwwwccMWWWWcccwwwwMccWWWEEEEEEE
EEEEEEEEEEWWWccwwwwFFwFwkkkwkkkFFwFwwwccWWWEEEEEEE
EEEEEEEEEEWWWccwwwFFFFFkkkkkkkFFFFFwwcccWWWEEEEEEE
EEEEEEEEEEWWWccMwwFFFFFkkwkkkwkFFFFwwMccWWWEEEEEEE
EEEEEEEEEEWWWccMwwFFFFFkkkkkkwkFFFFwwMccWWWEEEEEEE
EEEEEEEEEEWWWccwwwFFFFFkkkkwkkkFFFFwwwccWWWEEEEEEE
EEEEEEEEEEWWWccwwwFFFFFFFFFFFFwFFFFwwcccWWWEEEEEEE
EEEEEEEEEEWWWccMwwFFFFFFFFFFFFwFFFFwwMccWWWEEEEEEE
EEEEEEEEEEWWWccwwwwFFFFFFFFFwFFFFFFwwwccWWWEEEEEEE
EEEEEEEEEEWWWccwwwFFFFwFFFFFFFFFFFFwwcccWWWEEEEEEE
EEEEEEEEEEWWWccMwwFFFFFFFFFwFFFwFFFwwMccWWWEEEEEEE
EEEEEEEEEEWWWccMwwFFFwFFFFFFFFFFFFFwwMccWWWEEEEEEE
EEEEEEEEEEWWWccwwwwFFFFwFwFFFFFFFFFwwwccWWWEEEEEEE
EEEEEEEEEEWWWccwwwwFwwFwFFwFwwFFwwFwwcccWWWEEEEEEE
EEEEEEEEEEWWWccMwwwwwwwwwwwwwwwwwwwwwMccWWWEEEEEEE
EEEEEEEEEEWWWccMwwwwwwwwwwwwwwwwwwwwwMccWWWEEEEEEE
EEEEEEEEWWMMMcccccccccccccccccccccccccccMWWMMEEEEE
EEEEEEEEWWWWccccccccccccccccccccccccccccWWWWWEEEEE
EEEEEEEEWWWWWcccccccccccccccccccccccccccWWWWWEEEEE
EEEEEEEEWWWWWWWoooooooooooooooooooooooWWWWWWWEEEEE
EEEEEEEEWWWWWWWooooooooooooooooooooooWWWWWWWWEEEEE
EEEEEEEEWWWWWWWrrrrrrrrrrrrrrrrrrrrrrrWWWWWWWEEEEE
EEEEEEEEWWWWWWWrrrrrrrrrrrrrrrrrrrrrrrWWWWWWWEEEEE
EEEEEEEEMEMWEMMrrrrrrrrrrrrrrrrrrrrrrrMMWEMEMEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0000000kkkkhkkk0000000000000000000000kkkhkkkk00000
0000000khhhhhhk0000000000000000000000hhhhhhhk00000
0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
0000000hhhhhhhhaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00000
0000000khhhhhkkaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00000
0000000khhhhh000000000000daaaa0000000000hhhhk00000
0000000khhhhk000000000000daaaa0000000000khhhk00000
0000000kkhkkk000000000000aaaaa1110000000kkkhk00000
0000000000aaa000000000000daaaa4410000000aaa0000000
0000000000aaa000000000000daaaa1110000000aaa0000000
0000000000aaa000000000000daaaa0000000000aaa0000000
0000000000aaa000000000000aaaaa0000000000aaa0000000
0000000000aaa00vvvvsvvv00daaaa00vvsvvv00aaa0000000
0000000000aaa00vssssssv00daaaa00vssssv00aaa0000000
0000000000aaa00vsssssss00ddaaa00sssssv00aaa0000000
0000000000aaa00ssssesses4s8scseeesesss00aaa0000000
0000000000aaa00vsseseees4ssassseeeessv00aaa0000000
0000000000aaa00vsseeese34s8acsesessssv00aaa0000000
0000000000aaa00vsseeessss6sasseesesssv00aaa0000000
0000000000aaa00ssseeesssss8scseesessss00aaa0000000
0000000000aaa00vssseeessesseeesesesssv00aaa0000000
0000000000aaa00vsseesssssesesesesssssv00aaa0000000
0000000000aaa00sssseseesseessessesesss00aaa0000000
0000000000aaa00vsssseesessessessseessv00aaa0000000
0000000000aaa00vsseessesesesesssssessv00aaa0000000
0000000000aaa00vsseesseeeesssesssesssv00aaa0000000
0000000000aaa00ssssesesseseeeesseessss00aaa0000000
0000000000aaa00vsssssssssssssssssssssv00aaa0000000
0000000000aaa00vsssssssssssssssssssssv00aaa0000000
0000000000aaa00vvvsvvvsvvvsvvvsvvvsvvv00aaa0000000
0000000kkhkkk000000000000000000000000000khkkk00000
0000000khhhhk000000000000000000000000000khhhk00000
0000000khhhhhkkaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00000
0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00000
0000000hhhhhhhkaaaaaaaaaaaaaaaaaaaaaahhhhhhhk00000
0000000khhhhhhh0000000000000000000000khhhhhhk00000
0000000khhhhhhk0000000000000000000000khhhhhhk00000
0000000kkkkhkkk0000000000000000000000kkkhkkkk00000
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
...............MMM.MMM.MM..MM..MM..MM.............
...............MMMMMMMMMMM.MMM.MMM.MMM............
...............MMMMMMMMMMM.MMM.MMM.MMM............
...............wwwwwwwwwwwwwwwwwwwwwMw............
...............wwwwwwwwwwwwwwwwwwwwwww............
...............wUwwwUwwwUwwwUwwwUwwwUw............
...............wUwwwUwwwUwwwUwwwUwwwUw............
...............wwwwwwwwwwwwwwwwwwwwwww............
...............wwwwwwwwwwwwwwwwwwwwwww............
...............wwwwwwwwwwwwwwwwwwwwwww............
...............wwwwwwwwwwwwwwwwwwwwwww............
...............wwwwwwwwwwwwwwwwwwwwwww............
...............wwwwwwwwwwwwwwwwwwwwwww............
.......MMMMMMMMwwwwwwwwwwwwwwwwwwwwwwwMMMMMMM.....
.......MMMMMMMMwwwwwwwwwwwwwwwwwwwwwwwMMMMMMM.....
.......MMMMMMMMwwwwwwwwwwwwwwwwwwwwwwwMMMMMMM.....
.......WWWWWWWWwwwwwwwwwwwwwwwwwwwwwwwWWWWWWW.....
.......WWWWUWWWwwwwwwwwwwwwwwwwwwwwwwwWWWWWWW.....
.......WWWWUWWWwwwwwwwwwwwwwwwwwwwwwwwWWWWWWW.....
.......WWWWUWWWwwwwwwwwwwwwwwwwwwwwwwwWWWWWWW.....
.......WWWWWWWWNNNNNNNNNNNNNNNNNNNNNNWWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEE
```
Right side (looking from the right):
```
..................MM..MM..M..MM..MM...............
.................MMM.MMM.MM.MMM.MMM...............
.................MMM.MMM.MM.MMM.MMM...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.....MMMMMMMM....wwwwwwwwwwwwwwwwwwMMMMMMMM.......
.....MMMMMMMM....wwwwwwwwwwwwwwwwwwMMMMMMMM.......
.....MMMMMMMM....wwwwwwwwwwwwwwwwwwMMMMMMMM.......
.....WWWWWWWW....wwwwwwwwwwwwwwwwwwWWWWWWWW.......
.....WUWWWWWW....wwwwwwwwwwwwwwwwwwWUWWWWUW.......
.....WUWWWWWW....wwwwwwwwwwwwwwwwwwWUWWWWUW.......
.....WUWWWWWW....wwwwwwwwwwwwwwwwwwWUWWWWUW.......
.....WWWWWWWW....wwwwwwwwwwwwwwwNNNWWWWWWWW.......
.....WWWWWWWWMMM.wwwwwwwwwwwwwwwOooWWWWWWWW.......
.....WWWWWWWWMMM.wwwwwwwwwwwwwwwOooWWWWWWWW.......
.....WWWWWWWWMMM.wwwwwwwwwwwwwwwOooWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.......WWWWWWWW......................WWWWWWWW.....
.......WWWWWWWW......................WWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWW............WWWWW..........WWWWW.....
.......WWWWWW............WWWWW..........WWWWW.....
........WWWWW............WWWWW..........WWWWW.....
..........WWW............WWWWW..........WWW.......
..........WWW............WWWWW..........WWW.......
..........WWW............WWWWW..........WWW.......
..........WWW............WWWWW..........WWW.......
..........WWW..wwwwwww...WWWWW...wwww...WWW.......
..........WWW..wwwwwwww..WWWWW..wwwwww..WWW.......
..........WWW..wwwwwwww..WWWWW..wwwwww..WWW.......
..........WWW..www.......kkkkkk....www..WWW.......
..........WWW..www.......kkkkkk....www..WWW.......
..........WWW..www.......kkkkkk....www..WWW.......
..........WWW..www.......kkkkkk....www..WWW.......
..........WWW..www.......kkkkkk....www..WWW.......
..........WWW..www.................www..WWW.......
..........WWW..www.................www..WWW.......
..........WWW..www.................www..WWW.......
..........WWW..www.................www..WWW.......
..........WWW..www.................www..WWW.......
..........WWW..www.................www..WWW.......
..........WWW..www.................www..WWW.......
..........WWW..ooooooooooooooooooooooO..WWW.......
..........WWW..ooooooooooooooooooooooo..WWW.......
..........WWW..ooooooooooooooooooooooo..WWW.......
.......WWWWWW...........................WWWWW.....
.......WWWWWW...........................WWWWW.....
.......WWWWWWWWOoooooooooooooooooooooOWWWWWWW.....
.......WWWWWWWWoooooooooooooooooooooooWWWWWWW.....
.......WWWWWWWWooooooooooooooooooooooNWWWWWWW.....
.......WWWWWWWW......................WWWWWWWW.....
.......WWWWWWWW......................WWWWWWWW.....
........WWWWWWW.......................WWWWWWW.....
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
.......MM.M..MM......................MMM..M.M.....
.......M......M.............................M.....
..................................................
.....................................M............
.......M......M......................MM.....M.....
..................................................
.......M....M...........................M...M.....
..........MM............................MM..M.....
..................................................
..................................................
..................................................
..................................................
...............wwwwwww...........wwww.............
...............wwwwwwww.........wwwwww............
...............wwwwwwww.........wwwwww............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............www.................www............
...............wwwwwwwwwwwwwwwwwwwwwww............
...............wwwwwwwwwwwwwwwwwwwwwww............
...............wwwwwwwwwwwwwwwwwwwwwww............
.......M..MMM...........................M..MM.....
............................................M.....
.......M......M.......................M...........
..............M...................................
..............M.............................M.....
.......M.............................M............
.......M.............................M......M.....
........M.M..MM.......................MM..M.M.....
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
EEEEEEEEMMWWMWMEEEEEEEEEEEEEEEEEEEEEEEMMWWMWMEEEEE   0000000kkkhkkkk0000000000000000000000kkkhkkkk00000
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWEEEEE   0000000khhhhhhk0000000000000000000000khhhhhhk00000
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWEEEEE   0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE   0000000khhhhhhhaaaaaaaaaaaaaaaaaaaaaahhhhhhhh00000
EEEEEEEEWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE   0000000hhhhhhkkaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00000
EEEEEEEEWWWWWcccccccccccccccccccccccccccWWWWWEEEEE   0000000khhhhh000000000000000000000000000hhhhk00000
EEEEEEEEWWWWMcccccccccccccccccccccccccccMWWWWEEEEE   0000000khhhhk000000000000000000000000000khhhk00000
EEEEEEEEMMWWccccccccccccccccccccccccccccMMWWMEEEEE   0000000kkkhkk000000000000000000000000000kkkhk00000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa000000000000000000000000000aaa0000000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa000000000000000000000000000aaa0000000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa004410000000000000000000000aaa0000000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa004410000000000000000000000aaa0000000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa00vvvsvvvsvvvsvvvsvvvsvvv00aaa0000000
EEEEEEEEEEWWWccMwwwwwwwwwwwwwwwwwwwwwMccWWWEEEEEEE   0000000000aaa00vsssssssssssssssssssssv00aaa0000000
EEEEEEEEEEWWWccMwwwwwwwwwwwwwwwwwwwwwMccWWWEEEEEEE   0000000000aaa00vsssssssssssssssssssssv00aaa0000000
EEEEEEEEEEWWWccwwwwFFFwFFFFFFFFFFFFwwwccWWWEEEEEEE   0000000000aaa00sssseseseseseeesessesss00aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFFFFFFwFFFFFwwcccWWWEEEEEEE   0000000000aaa00vssseessseseeessesesssv00aaa0000000
EEEEEEEEEEWWWccMwwFFwFFFFFFFFFwFFFFwwMccWWWEEEEEEE   0000000000aaa00vsssesesesesseesesesssv00aaa0000000
EEEEEEEEEEWWWccMwwFFFFFFFFFFFFFFFFFwwMccWWWEEEEEEE   0000000000aaa00vssseeeesessesssseesssv00aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFFFFFFFwFFwFwwwccWWWEEEEEEE   0000000000aaa00sssseseseseeesessssesss00aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFFFFFFFFFFFwwwcccWWWEEEEEEE   0000000000aaa00vsssesssseeeeeesesesssv00aaa0000000
EEEEEEEEEEWWWccMwwFFFFFFwFFFFFFFFFFwwMccWWWEEEEEEE   0000000000aaa00vssseessssseseseeeeessv00aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFwFkFkFFFFFFwwwccWWWEEEEEEE   0000000000aaa00sssesessesssesessesssss00aaa0000000
EEEEEEEEEEWWWccwwwFFwFFkkkkkkkkFFFFwwcccWWWEEEEEEE   0000000000aaa00vsseesse34s8ssdsseeessv00aaa0000000
EEEEEEEEEEWWWccMwwFwFFkkkkkkkkkFFFFwwMccWWWEEEEEEE   0000000000aaa00vssesses3s68acdsesssssv00aaa0000000
EEEEEEEEEEWWWccMwwFwFFkkkkkkkkFFwFFwwMccWWWEEEEEEE   0000000000aaa00vssesessssssscssssesssv00aaa0000000
EEEEEEEEEEWWWccwwwFFFFkkkkkkkkkFFFFwwwccWWWEEEEEEE   0000000000aaa00sssssesss4ssscseessesss00aaa0000000
EEEEEEEEEEWWWccwwwFFFFwkkMkWkWcFFFFwwcccWWWEEEEEEE   0000000000aaa00vsssssss34sdscseesssssv00aaa0000000
EEEEEEEEEEWWWccMwwwwwwcccMWWWWcccwwwwMccWWWEEEEEEE   0000000000aaa00vssssssv00daaaa00vssssv00aaa0000000
EEEEEEEEEEWWWccMwwwwwwMccMWWWWcccwwwwMccWWWEEEEEEE   0000000000aaa00vvvsvvvv00daaaa00vvsvvv00aaa0000000
EEEEEEEEWWMMMccccccccccccWWWWWccccccccccMWWMMEEEEE   0000000kkhkkk000000000000aaaaa0000000000khkkk00000
EEEEEEEEWWWWcccccccccccccWWWWWccccccccccWWWWWEEEEE   0000000khhhhk000000000000daaaa0000000000khhhk00000
EEEEEEEEWWWWWccccccccccccWWWWWccccccccccWWWWWEEEEE   0000000khhhhhkkaaaaaaaaaadaaaaaaaaaaakkhhhhhk00000
EEEEEEEEWWWWWWWooooooooooNWWWWooooooooWWWWWWWEEEEE   0000000hhhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
EEEEEEEEWWWWWWWooooooooooNWWWWoooooooWWWWWWWWEEEEE   0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaahhhhhhhh00000
EEEEEEEEWWWWWWWrrrrrrrrrrEEEEErrrrrrrrWWWWWWWEEEEE   0000000khhhhhhh0000000000000000000000khhhhhhk00000
EEEEEEEEWWWWWWWrrrrrrrrrrEEEEErrrrrrrrWWWWWWWEEEEE   0000000khhhhhhk0000000000000000000000khhhhhhk00000
EEEEEEEEMEMWEMMrrrrrrrrrrEEEEErrrrrrrrMEMWEMMEEEEE   0000000kkkkhkkk0000000000000000000000kkkkhkkk00000
EEEEEEEEEEEEEEErrrrrrrrrrEEEEErrrrrrrrEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrEEEEErrrrrrrrEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrEEEEErrrrrrrrEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrEEEEErrrrrrrrEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrEEEEErrrrrrrrEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrEEEEErrrrrrrrEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrEEEEErrrrrrrrEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEMWMWWMMEEEEEEEEEEEEEEEEEEEEEEEMWMWWMMEEEEE   0000000kkkkhkkk0000000000000000000000kkkkhkkk00000
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWEEEEE   0000000khhhhhhk0000000000000000000000hhhhhhhk00000
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWEEEEE   0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE   0000000khhhhhhhaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00000
EEEEEEEEWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE   0000000hhhhhhkkaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00000
EEEEEEEEWWWWWcccccccccccccccccccccccccccWWWWWEEEEE   0000000khhhhh000000000000000000000000000hhhhk00000
EEEEEEEEWWWWMcccccccccccccccccccccccccccMWWWWEEEEE   0000000khhhhk000000000000000000000000000khhhk00000
EEEEEEEEMMWWccccccccccccccccccccccccccccMWWMMEEEEE   0000000kkkhkk000000000000001110000000000khkkk00000
EEEEEEEEEEWWWcccccccccccccccPcccccccccccWWWEEEEEEE   0000000000aaa000000000000001410000000000aaa0000000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa000000000000001110000000000aaa0000000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa000000000000000000000000000aaa0000000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa000000000000000000000000000aaa0000000
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE   0000000000aaa00vvvsvvvsvvvsvvvsvvvsvvv00aaa0000000
EEEEEEEEEEWWWccMwwwwwwwwwwwwwwwwwwwwwMccWWWEEEEEEE   0000000000aaa00vsssssssssssssssssssssv00aaa0000000
EEEEEEEEEEWWWccMwwwwwwwwwwwwwwwwwwwwwMccWWWEEEEEEE   0000000000aaa00vsssssssssssssssssssssv00aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFFFFFFFFFFFFwwwccWWWEEEEEEE   0000000000aaa00sssssseessessesseeessss00aaa0000000
EEEEEEEEEEWWWccwwwFFFFwFFFFFFwFFFFFwwcccWWWEEEEEEE   0000000000aaa00vsssssssessssssessesssv00aaa0000000
EEEEEEEEEEWWWccMwwFFFFFFFFFFFFFFwFFwwMccWWWEEEEEEE   0000000000aaa00vsseeeeesseesseessesssv00aaa0000000
EEEEEEEEEEWWWccMwwFFFFFFFFFFFFwFFFFwwcccWWWEEEEEEE   0000000000aaa00vsseesesssseeeessesessv00aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFFFFFFFFFFFFwwwccWWWEEEEEEE   0000000000aaa00sssesesseesesssssseesss00aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFFFFFFFFFFFFwwMccWWWEEEEEEE   0000000000aaa00vssssseseeeeseeseessssv00aaa0000000
EEEEEEEEEEWWWccMwwFFFFFFwFFFFFFFFFFwwMccWWWEEEEEEE   0000000000aaa00vsseseesesseseeesseessv00aaa0000000
EEEEEEEEEEWWWccwwwFwFFFFFFFFFFkFFFFwMcccWWWEEEEEEE   0000000000aaa00sssesseesseeeeesesevsvv00aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFFkkkkkkkwFFcccccWWWEEEEEEE   0000000000aaa00vsseeseese2s5ssscsev00000aaa0000000
EEEEEEEEEEWWWccMwwFFFFFFFkkkkwkkkFFcccccWWWEEEEEEE   0000000000aaa00vssseeseess4s7sbcees00000aaa0000000
EEEEEEEEEEWWWccMwwFFFFFFFkkkkkkkkFFcccccWWWEEEEEEE   0000000000aaa00vsssesseees4579scsev00000aaa0000000
EEEEEEEEEEWWWccwwwFFFFFFFkwkkkwkkFwcccccWWWEEEEEEE   0000000000aaa00sssssseeee2s579sceev00000aaa0000000
EEEEEEEEEEWWWccwwwFFFwwFFcMkcMMkMMMcccccWWWEEEEEEE   0000000000aaa00vsssssssssvv5vvvcvvv00000aaa0000000
EEEEEEEEEEWWWccMwwwwwwwwwccccccccWWcccccWWWEEEEEEE   0000000000aaa00vssssssssv0000000dad00000aaa0000000
EEEEEEEEEEWWWccMwwwwwwwwMccccccccWWcccccWWWEEEEEEE   0000000000aaa00vvvsvvsvvv0000000daa00000aaa0000000
EEEEEEEEWWMMMccccccccccccccccccccWWWWWMWMWWMMEEEEE   0000000kkhkkk0000000000000000000aaaaakkkkhkkk00000
EEEEEEEEWWWWcccccccccccccccccccccWWWWWWWWWWWWEEEEE   0000000khhhhk0000000000000000000daaaakhhhhhhk00000
EEEEEEEEWWWWWcccccccccccccccccccWWWWWWWWWWWWWEEEEE   0000000khhhhhkkaaaaaaaaaaaaaaaaadaaaakhhhhhhk00000
EEEEEEEEWWWWWWWoooooooooooooWWWWWWWWWWWWWWWWWEEEEE   0000000hhhhhhhkaaaaaaaaaaaaaaaaaaaaaahhhhhhhh00000
EEEEEEEEWWWWWWWooooooooooooNWWWWWWWWWWWWWWWWWEEEEE   0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
EEEEEEEEWWWWWWWrrrrrrrrrrrrrEEEEEEEEEEWWWWWWWEEEEE   0000000khhhhhhh0000000000000000000000khhhhhhk00000
EEEEEEEEWWWWWWWrrrrrrrrrrrrrEEEEEEEEEEWWWWWWWEEEEE   0000000khhhhhhk0000000000000000000000khhhhhhk00000
EEEEEEEEMMWEMEMrrrrrrrrrrrrrEEEEEEEEEEMMWEMEMEEEEE   0000000kkkhkkkk0000000000000000000000kkkhkkkk00000
EEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.23 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 120 nodi, 542 passi, finito in 291 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=erba (marcatore), h=honey, w=pietra mastio, s=slate, c=cortile interno, W=pietra fortezza, t=teal, G=Green, d=dead, dark, r=strada lastricata, Q=aQua, m=magenta, k=gradini scala, n=brown, T=Teal (marcatore), O=porta, o=tavole porta, N=stipite, M=merli, U=feritoia, L=Light, F=solaio legno, f=pavimento legno, P=selciato, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 51518, w 30121, o 12174, E 4375, k 2720, U 2274, r 1800, M 1542, P 1386, c 1371, f 875, N 775, F 715, O 276.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-30 all×21, one×2, prl×1: 321 celle x3-17 y2-19 z0-1, passi 2-32
   #32 map scala 5 5 1: ×1, 10025 celle x0-99 y0-99 z0-79, passi 33
#34-36 all×3: 5378 celle x25-79 y20-99 z0-10, passi 34-44
    #37 all . W → W W passi=23: ×23, 20125 celle x20-84 y15-69 z1-23, passi 45-67, .→W 20125
    #38 all . G → G W passi=23: ×23, 10350 celle x30-74 y75-79 z0-23, passi 68-90, G→W 5175, .→G 5175
    #39 all . t → t W passi=39: ×39, 62400 celle x15-89 y10-84 z0-39, passi 91-129, t→W 31200, .→t 31200
    #40 all . w → w w passi=64: ×64, 24000 celle x30-74 y35-64 z1-64, passi 130-193, .→w 24000
    #41 all . d → d w passi=64: ×64, 28800 celle x30-74 y65-69 z0-64, passi 194-257, d→w 14400, .→d 14400
    #42 all . s → s T passi=1: ×1, 400 celle x45-64 y40-49 z1-2, passi 258, s→T 200, .→s 200
    #43 all . h → h . passi=31: ×31, 41850 celle x35-69 y40-64 z1-32, passi 259-289, h→. 20925, .→h 20925
    #44 all . s → s . passi=30: ×30, 12000 celle x45-64 y40-49 z2-32, passi 290-319, s→. 6000, .→s 6000
    #45 all . h → h F (+1) passi=1: ×1, 1750 celle x35-69 y40-64 z32-33, passi 320, h→F 675, .→h 675, s→F 200, .→s 200
      r1 . h → h F ×675; r2 . s → s F ×200
    #46 all . h → h . (+1) passi=31: ×31, 54250 celle x35-69 y40-64 z33-64, passi 321-351, h→. 20925, .→h 20925, s→. 6200, .→s 6200
      r1 . h → h . ×20925; r2 . s → s . ×6200
#47-74 prl×2, all×9: 8150 celle x15-89 y10-84 z0-64, passi 352-411
#75-81 prl×3, all×4: 7990 celle x45-60 y40-49 z1-32, passi 412-461
     #88 all + O → O * passi=29: ×29, 11765 celle x30-74 y64-79 z1-29, passi 462-490, w→O 6815, W→O 4950
#89-90 all×2: 775 celle x29-75 y63-79 z0-30, passi 491-492
     #91 all OOO → *o*: ×1, 12174 celle x30-74 y64-79 z0-29, passi 493, O→o 12174
#97-120 all×9, prl×3: 7619 celle x15-89 y10-84 z16-70, passi 494-542
Senza effetto (non hanno mai cambiato una cella):
#14 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#21 all m/[Hh] → */m: le celle cercate c'erano, ma mai disposte come nel pattern
#53 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#54 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#55 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#56 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#57 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#58 all . I → I * passi=30: in quel momento nella griglia non c'erano celle "I"
#59 all . I → #95 * passi=1: in quel momento nella griglia non c'erano celle "I"
#60 all . #95 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#61 all . I → I * passi=29: in quel momento nella griglia non c'erano celle "I"
#62 all . I → S * passi=1: in quel momento nella griglia non c'erano celle "I"
… e altri 26
Fix it and answer with the whole program.

## Risposta

<!--
  Forte: cinta quadrangolare con torri d'angolo, cammino di ronda e merli,
  cortile interno lastricato con pozzo, mastio a due piani con scala (part-stair)
  e feritoie (part-slits), porta d'accesso della cinta (part-door) e porta del mastio.
  Mastio di dimensioni interne di almeno 7x7 caselle (35x35 voxel clear per la stanza),
  con scala rettilinea (T strip 16x10) e porta di larghezza 3 celle (15 voxel) alta 30.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtGdrQmk" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Corpo del mastio attorno a H: 7x7 caselle interne (35x35 voxel clear) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>

      <!-- Vano scala: lungo x, 4 celle x (20 voxels) per 2 celle y (10 voxels), a ridosso parete nord -->
      <one in="hhhhhhh/hhhhhhh" out="***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Mura perimetrali del mastio: spessore 1 cella (5 voxels) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Cortile c attorno al mastio: 2 celle -->
      <all in="wE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Espansione cortile se c'è spazio (taglia huge) -->
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Pozzo nel cortile se c'è spazio libero -->
      <one in="ccccc/ccccc/ccccc" out="*****/**Q**/*****" steps="1"/>

      <!-- 3. Mura esterne della cinta (W) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo 2x2 celle -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- 4. Strada e porte verso il fronte (+y) dritto dal centro mastio -->
      <all in="[Hh]/[Hh]" out="*/H" symmetry="()" steps="1"/>
      <all in="H/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/c" out="*/c" symmetry="()"/>
      <all in="c/W" out="*/G" symmetry="()" steps="1"/>
      <all in="G/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Allargamento strada e passaggi a 3 celle (15 voxels) -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
    </sequence>

    <!-- Ritorno alla scala voxel 5x5x1 -->
    <map scale="5 5 1" values="BEhwscWtGdrQmkTkOoNMULFVfpP" symmetry="()">
      <!-- Terreno ed esterno -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <!-- Cortile e pozzo -->
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="Q" out="ccccc/cPPcc/cPPcc/ccccc/ccccc"/>
      <!-- Mastio: pavimento, vano scala, mura, porta -->
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <!-- Cinta esterna: mura, porta, torri -->
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>

      <sequence symmetry="(xy)">
        <!-- B. ALTEZZE DEI VOLUMI -->
        <!-- 1. Pavimentazioni a z=0: restano sul fondo come indicatore d'area -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>

        <!-- Cortile e strada si alzano di un basamento in pietra -->
        <all steps="1"><rule in="B c" out="c P"/><rule in="B r" out="r r"/></all>

        <!-- Pozzo: bordo in pietra alto 10 con acqua al centro -->
        <all in="B P" out="P P" steps="9"/>

        <!-- Cinta muraria (W) e corpo di guardia (G): cammino di ronda a quota 32 -->
        <all in="B W" out="W W" steps="31"/>
        <all in="B G" out="G W" steps="31"/>

        <!-- Torri della cinta (t): alte 45 voxels -->
        <all in="B t" out="t W" steps="44"/>

        <!-- Mura del mastio (w, d): alte 64 voxels (2 piani da 32) -->
        <all in="B w" out="w w" steps="64"/>
        <all in="B d" out="d w" steps="64"/>

        <!-- Interno mastio: piano terra (z=1..31) -->
        <!-- Posiziona il marker T della scala a z=1 nella zona s -->
        <all in="B s" out="s T" steps="1"/>
        <!-- Aria piano terra -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>

        <!-- Solaio primo piano mastio a z=32 -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>

        <!-- Primo piano mastio (z=33..63): aria -->
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>

        <!-- Piattaforma calpestabile in cima a torri, mura e mastio -->
        <prl>
          <rule in="t" out="W"/>
          <rule in="W" out="W"/>
          <rule in="G" out="W"/>
          <rule in="w" out="w"/>
          <rule in="d" out="w"/>
          <rule in="h" out="w"/>
          <rule in="s" out="w"/>
        </prl>

        <!-- C. DETTAGLI E INCLUSIONE PARTI -->
        <!-- Seme della porta d'ingresso principale nella cinta (W) a quota z=1 su r -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Seme della porta del mastio (w) a quota z=1 su P/c -->
        <all in="w/P" out="O/*" symmetry="()" steps="1"/>
        <all in="w/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Unioni per le parti standard -->
        <union symbol="+" values="Ww"/>
        <union symbol="=" values="fFP"/>
        <union symbol="%" values="Ww"/>

        <!-- Import scala mastio -->
        <import file="part-stair"/>

        <!-- Import porte cinta e mastio -->
        <import file="part-door"/>

        <!-- Import merlatura sui camminamenti e torri -->
        <import file="part-battlements"/>

        <!-- Import feritoie sulle mura merlate -->
        <import file="part-slits"/>

        <!-- Finestre al primo piano del mastio -->
        <all in="BBB/BBB/BBB www" out="***/***/*** LLL" symmetry="(x)" steps="3"/>
        <all in="Lwww" out="*LLB" symmetry="()" steps="2"/>

        <!-- Pulizia finale -->
        <prl><rule in="L" out="B"/></prl>
      </sequence>
    </map>
  </map>

  <!-- AZIONI INTERATTIVE -->
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="B"/><rule in="o" out="B"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="B" out="O" steps="1"/></all>
  </action>

  <!-- PALETTE COLORI -->
  <color symbol="E" value="#4a7038" hidden="True" name="erba"/>
  <color symbol="r" value="#827b73" area="yard" name="strada lastricata"/>
  <color symbol="c" value="#666159" area="courtyard" name="cortile interno"/>
  <color symbol="P" value="#8c857b" name="selciato"/>
  <color symbol="W" value="#57524b" name="pietra fortezza"/>
  <color symbol="w" value="#615b54" name="pietra mastio"/>
  <color symbol="M" value="#6e685f" name="merli"/>
  <color symbol="f" value="#594230" name="pavimento legno"/>
  <color symbol="F" value="#6e543d" name="solaio legno"/>
  <color symbol="k" value="#806348" name="gradini scala"/>
  <color symbol="O" value="#4a3525" name="porta"/>
  <color symbol="o" value="#3b2b1e" name="tavole porta"/>
  <color symbol="N" value="#473e35" name="stipite"/>
  <color symbol="U" value="#1c1a17" name="feritoia"/>
</sequence>
