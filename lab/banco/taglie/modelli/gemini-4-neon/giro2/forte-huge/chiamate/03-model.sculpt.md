# model.sculpt · gemini-4-neon · 50 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (9.375 × 9.375 × 7.5 tiles, 16 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 9.375 × 9.375 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 500 × 500 × 160, 31.25 × 31.25 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

The program you wrote:
<!--
Forte medievale — Programma completo (Blocco 2 di 2)
Parti e lettere del piano (1 cella = 5 voxel):
  K = interno del mastio (keep), w = mura del mastio, s = scala del mastio, d = porta del mastio
  c = cortile (courtyard), n = strada lastricata interna, Q = pozzo, x = scala per il camminamento
  W = cinta muraria (2 celle di spessore), T = torri angolari, G = corpo di guardia (gatehouse)
  b = interno caserma (barracks), v = mura della caserma
  r = strada esterna fino al bordo frontale, a = fossato (moat), t = alberi esterni
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKwsctWGTdnrQbvaxm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Mastio (keep) rettangolare arretrato rispetto al centro, con variazione casuale -->
      <all in="E/H" out="m/E" symmetry="()" steps="1"/>
      <all in="E/m" out="m/E" symmetry="()" steps="3"/>
      <one in="Em" out="mE" symmetry="(x)" steps="1"/>
      <prl in="Em" out="mE" p="0.5" symmetry="(x)" steps="1"/>
      <prl in="m" out="K"/>
      <all in="E/K" out="K/*" symmetry="()" steps="2"/>
      <all in="K/E" out="*/K" symmetry="()" steps="3"/>
      <prl in="E/K" out="K/*" p="0.5" symmetry="()" steps="1"/>
      <all in="KE" out="*K" symmetry="(x)" steps="4"/>
      <all in="KE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwwww/wKKKKKKK/wKKKKKKK" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- 2. Cortile attorno al mastio, con braccio laterale e crescita per taglie grandi -->
      <all in="wE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="c/E" out="*/c" symmetry="()" steps="4"/>
      <prl in="c/E" out="*/c" p="0.5" symmetry="()" steps="1"/>
      <one in="Ec/Ec/Ec/Ec/Ec" out="m*/m*/m*/m*/m*" symmetry="(x)" steps="1"/>
      <all in="Em" out="m*" symmetry="(x)" steps="2"/>
      <prl in="m" out="c"/>
      <all in="cEEEEEEEEEE" out="*cccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*cccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*ccccc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 3. Cinta muraria (2 celle) e torri angolari -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*T"/>
      <all steps="1">
        <rule in="T[EW]" out="*T"/>
        <rule in="T*/*[EW]" out="**/*T"/>
      </all>

      <!-- 4. Asse di ingresso: porta del mastio, lastricato, corpo di guardia, strada esterna (3 celle) -->
      <one in="KKK/www/ccc" out="***/*d*/***" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- 5. Elementi interni ed esterni secondo lo spazio disponibile -->
      <one in="WWWWWWWW/cccccccc/cccccccc" out="********/ccxxxxcc/ccxxxxcc" symmetry="()" steps="1"/>
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/cvvvvvvc/cvbbbbvc/cvbbbbvc/cvbbbbvc/cvvvvvvc" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cWWEEEEEE" out="***aa****" steps="1"/>
      <all in="[WT]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="12"/>
    </sequence>

    <!-- Livelli B e C: scala piena (1 cella = 5×5 voxel) -->
    <map scale="5 5 1" values="BEKwsdc nraQyhgxbtWCHMfFPOoNGUTkVRqLA #20 #21 #90 #91 #92 #94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>
      <rule in="W" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="T" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="t" out="EEEEE/EEEEE/EELEE/EEEEE/EEEEE"/>

      <union symbol="+" values="WCH"/>
      <union symbol="%" values="WCH"/>
      <union symbol="=" values="fFcPn"/>

      <sequence symmetry="(xy)">
        <!-- B. Le altezze: ogni parte sale per colonne -->
        <!-- Mastio: mura (64) con fasce finestre U su due piani; porta d (seme O a z=0, poi muro) -->
        <all steps="1">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d O"/>
        </all>
        <all steps="9">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w U"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="10">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <prl in="d" out="w"/>
        <all in="B w" out="w W" steps="10"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w W" steps="10"/>
        <prl in="w" out="W"/>

        <!-- Mastio: pavimenti (z=0), scala (z=1), solaio (z=32), terrazza (z=64) -->
        <all steps="1">
          <rule in="B K" out="K f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B K" out="K B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B K" out="K F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B K" out="K B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="K" out="P"/>
          <rule in="s" out="P"/>
        </prl>

        <!-- Cinta muraria (32), torri angolari (44), corpo di guardia (52 con portone O a z=0) -->
        <all in="B y" out="y C" steps="32"/>
        <prl in="y" out="C"/>
        <all in="B h" out="h H" steps="44"/>
        <prl in="h" out="H"/>
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g C" steps="51"/>
        <prl in="g" out="C"/>

        <!-- Scala del cortile verso il camminamento della cinta -->
        <all in="B x" out="x c" steps="1"/>
        <all in="B x" out="x T" steps="1"/>
        <prl in="x" out="B"/>

        <!-- Caserma (1 piano, 32, con tetto a falde R) -->
        <all steps="1">
          <rule in="B b" out="b f"/>
          <rule in="B v" out="v V"/>
        </all>
        <all steps="31">
          <rule in="B b" out="b B"/>
          <rule in="B v" out="v V"/>
        </all>
        <prl>
          <rule in="b" out="R"/>
          <rule in="v" out="R"/>
        </prl>

        <!-- Pozzo (bordo alto 6) -->
        <all in="B q" out="q q" steps="6"/>

        <!-- Alberi esterni (tronco L alto 14, chioma A) -->
        <all in="B L" out="L L" steps="14"/>
        <all in="B L" out="A *" steps="1"/>
        <all in="AB" out="*A" steps="4"/>
        <all in="B A" out="A *" steps="5"/>

        <!-- C. Scala piena: porte, scale, finestre, merli, feritoie, tetti -->
        <pieces piece="125" margin="24">
          <import file="part-door"/>
          <import file="part-stair"/>
        </pieces>

        <import file="part-window"/>
        <prl in="U" out="W"/>

        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto a padiglione della caserma -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Camino sul mastio -->
        <one in="B B P" out="* W *" steps="1" symmetry="()"/>
        <all in="B W" out="W *" steps="10"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6E8B4A" hidden="True" name="terreno"/>
  <color symbol="H" value="696862" area="tower" name="pietra delle torri"/>
  <color symbol="W" value="8C8A82" area="keep" name="pietra del mastio"/>
  <color symbol="C" value="7A7972" area="wall" name="pietra della cinta"/>
  <color symbol="M" value="96938A" name="merli"/>
  <color symbol="f" value="B89468" area="keep" name="pavimento in legno"/>
  <color symbol="F" value="A39A88" area="keep" name="solaio in pietra"/>
  <color symbol="P" value="8F8A7E" area="keep" name="terrazza del mastio"/>
  <color symbol="c" value="C2B393" area="courtyard" name="cortile"/>
  <color symbol="n" value="9E9585" area="courtyard" name="lastricato"/>
  <color symbol="r" value="B09D78" area="road" name="strada"/>
  <color symbol="a" value="4A7C9B" area="moat" name="fossato"/>
  <color symbol="O" value="6E472B" name="portone"/>
  <color symbol="o" value="4E311D" name="assi del portone"/>
  <color symbol="N" value="5E5B54" name="cornice in pietra"/>
  <color symbol="G" value="7FA6B8" name="vetro delle finestre"/>
  <color symbol="U" value="2E2D2A" name="feritoia"/>
  <color symbol="k" value="9A7B56" name="gradini"/>
  <color symbol="V" value="C9B89A" area="barracks" name="muro della caserma"/>
  <color symbol="R" value="A8523A" area="barracks" name="tetto in tegole"/>
  <color symbol="q" value="70706B" area="courtyard" name="pietra del pozzo"/>
  <color symbol="L" value="6B4C32" area="forest" name="tronco"/>
  <color symbol="A" value="4B733A" area="forest" name="chioma"/>
  <color symbol="#20" value="6E472B" hidden="True" name="portone aperto"/>
  <color symbol="#21" value="4E311D" hidden="True" name="assi aperte"/>

  <action name="open" label="Apri il portone">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi il portone">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
It does not pass: taglia Enorme, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 20 voxel (1,25 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pietra delle torri, E terreno, c cortile, W pietra del mastio, G vetro delle finestre, n lastricato, r strada, a fossato, C pietra della cinta, M merli, f pavimento in legno, F solaio in pietra, P terrazza del mastio, O portone, o assi del portone, N cornice in pietra, U feritoia, k gradini, q pietra del pozzo
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEHHHHHEEEEEEEEEEEEEEEEEEEEEEEEEEEHHHHHEEE
EEEEEEEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEE
EEEEEEEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEE
EEEEEEEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEE
EEEEEEEEEEMHHHMCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHEEEE
EEEEEEEEaaaaCCCccccccccccccccccckkkkkcccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccccccccckkkkkcccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccccccccckkkkkcccccCCCEEEEE
EEEEEEEEaaaaCCCcccccccccccccccccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCcccccccccccccccccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCcccccccccccccccccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCcccWWNWMWWWNWcWWNWWMcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWWWWWWWWWWWWWWWWWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWPPPPPPPPPPPPPPPWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWWWWWWWWWWWWWWWWWWcccccccCCCEEEEE
EEEEEEEEaaaaCCCccWWWWWWWWWWWWWWWWWMcccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnnccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnnccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnnccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnncccqqcccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnnccccqcccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnnccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnnccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnnccccccccccccCCCEEEEE
EEEEEEEEaaaaCCCccccccccccnnnnnccccccccccccCCCEEEEE
EEEEEEEEEaaaCCCccccccccccnnnnnccccccccccccCCCEEEEE
EEEEEEEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEE
EEEEEEEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEE
EEEEEEEEEEHHHHHCCCCCCCCCCMCCCCCCCCCCCCCCCCHHHHHEEE
EEEEEEEEEEHHHHHaaaaaaaaaarrrrraaaaaaaaaaaaHHHHHEEE
EEEEEEEEEEMHHHMaaaaaaaaaarrrrraaaaaaaaaaaaHHHHEEEE
EEEEEEEEEEEEEEEaaaaaaaaaarrrrraaaaaaaaaaaaEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
0000000000fffff00000000000000000000000000fffdff000
0000000000fdddf00000000000000000000000000fddddf000
0000000000fdddf99999999999999999999999999fddddf000
0000000000fdddd99999999999999999999999999fddddd000
0000000000fdddf99999999999999999999999999fddddf000
0000000000fffff99999999999999999999999999ffffff000
00000000000999900000000000000000246890000999900000
00000000000999900000000000000000246890000999900000
00000000000999900000000000000000246890000999900000
00000000000999900000000000000000000000000999900000
00000000000999900000000000000000000000000999900000
00000000000999900000000000000000000000000999900000
0000000000099990lmmmmmmmmmmmmmmmmmm000000999900000
0000000000099990lmmmmmmmmmmmmmmmmmm000000999900000
0000000000099990mmmjjjjjjjjjjjjjjmm000000999900000
0000000000099990lmmjjjjjjjjjjjjjjmm000000999900000
0000000000099990mmmjjjjjjjjjjjjjjmm000000999900000
0000000000099990mmmjjjjjjjjjjjjjjmmc00000999900000
0000000000099990mmmjjjjjjjjjjjjjjmmc00000999900000
0000000000099990mmmjjjjjjjjjjjjjjmmc00000999900000
0000000000099990mmmjjjjjjjjjjjjjjmmc00000999900000
0000000000099990mmmjjjmjjjjjjjjjjmm000000999900000
0000000000099990lmmjjjjjjjjjjjjjjmm000000999900000
0000000000099990mmmjjjjjjjjjjjjjjmm000000999900000
0000000000099990lmmmmmmmmmmmmmmmmmm000000999900000
0000000000099990lmmmmmmmmmmmmmmmmmm000000999900000
00000000000999900000000000000000000000000999900000
00000000000999900000000000000000000000000999900000
00000000000999900000000000000000000000000999900000
00000000000999900000000000000000022000000999900000
00000000000999900000000000000000022000000999900000
00000000000999900000000000000000000000000999900000
00000000000999900000000000000000000000000999900000
00000000000999900000000000000000000000000999900000
00000000000999900000000000000000000000000999900000
0000000000fffff9999999999hhhhh99999999999ffffff000
0000000000fdddf9999999999hfffh99999999999fddddf000
0000000000fdddf9999999999hfffh99999999999fddddf000
0000000000ddddf9999999999hhhhh99999999999dddddf000
0000000000fdddf00000000000000000000000000fddddf000
0000000000fffff00000000000000000000000000fffdff000
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
.................WWWWWWWWWWWWWWWWWW...............
.................MWWMWMWWWMWMWWMWWM...............
.................MWMMWMMWMMWMMWMWMM...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWMWWMMWWWWW...............
.................WWWWWWWWMMWMMWWWWW...............
.................WWWGGWWNCCCCCGNWWW...............
..........MMMMM..WWWGGWWWCCCCCGGWWW.......MMMMM...
..........MMMMM..WWWGGWWWCCCCCGGWWW.......MMMMM...
..........HHHHH..WWWGGWWNCCCCCGNWWW.......HHHHH...
..........HHHHH..WWWWWWWWCCCCCWWWWW.......HHHHH...
..........HHHHH..WWWWWWWWCCCCCWWWWW.......HHHHH...
..........HHHHH..WWWWWWWWCCCCCWWWWW.......HHHHH...
..........HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
```
Right side (looking from the right):
```
.............WWWWWWWWWWWWWW.......................
.............MMWMWWWWWWMWMM.......................
.............MMWMMWMMWMMWMM.......................
.............WWWWWWWWWWWWWW.......................
.............WWWWWWWWWWWWWW.......................
.............WWWWWWWWWWWWWW..........MMM..........
.............WWWWWWWWWWWWWW..........MMM..........
.............WWWWWWGGWWWWWW..........CCC..........
..MMMMM......WWWWWWGGWWWWWW..........MMMMM........
..MMMMM......WWWWWWGGWWWWWW..........MMMMM........
..HHHHH......WWWWWWGGWWWWWW..........HHHHH........
..HHHHH......WWWWWWWWWWWWWW..........HHHHH........
..HHHHH......WWWWWWWWWWWWWW..........HHHHH........
..HHHHH......WWWWWWWWWWWWWW..........HHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
..HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
.EHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH........
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..........HHHHH...........................HHHHH...
..........HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHH....
............CCC..................kkkk.....CCC.....
............CCC..................kkkk.....CCC.....
............CCC..................kkkk.....CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC..WWWGGWWWGGWWWGWWWW.......CCC.....
............CCC..WWWWWWWWWWWWWWWWWW.......CCC.....
............CCC..W.....kkkk......WW.......CCC.....
............CCC..W.....kkkk......WW.......CCC.....
............CCC..W.....kkkk......WW.......CCC.....
............CCC..W...............WW.......CCC.....
............CCC..W...............WW.......CCC.....
............CCC..W...............WW.......CCC.....
............CCC..W...............WW.......CCC.....
............CCC..W...............WW.......CCC.....
............CCC..W...............WW.......CCC.....
............CCC..W...............WW.......CCC.....
............CCC..WWWWWWWWoooooWWWWW.......CCC.....
............CCC..WWWWWWWWoooooWWWWW.......CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
............CCC...........................CCC.....
...........HCCC..........................CCCC.....
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHHCCCCCCCCCCoooooCCCCCCCCCCCCHHHHH...
..........HHHHH...........................HHHHH...
..........HHHHH...........................HHHH....
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
..........HHHHH...........................HHHHH...
..........HHHHH...........................HHHHH...
..........HHHHH...........................HHHHH...
..........HHHHH...........................HHHHH...
..........HHHHH...........................HHHH....
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................WWWGGWWWGGWWWGWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..........HHHHH..........CCCCC............HHHHH...
..........HHHHH..........CCCCC............HHHHH...
..........HHHHH..........CCCCC............HHHHH...
..........HHHHH...........................HHHHH...
..........HHHHH...........................HHHH....
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
EEEMHHHHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMHHHH   000ffffff000000000000000000000000000000000000ffffd
EEEHHHHHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEHHHHH   000fddddf999999999999999999999999999999999999fdddd
EEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH   000fddddf999999999999999999999999999999999999fdddd
EEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH   000fddddf999999999999999999999999999999999999fdddd
EEEMHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCMHHHH   000ffdfff999999999999999999999999999999999999ffffd
EEEEECCCcccccccccccccccccccccccccccccccccccccCCCEE   00000999900000000000000000000000000000000000099990
EEEEECCCcccccccccccccccccccccccccccccccccccccCCCEE   0000099990000000llmmlmlmmmmmmlmmlmlmmll00000099990
EEEEECCCcccccccccWWWWWWWWWWWWWWWWWWWWWcccccccCCCEE   0000099990000000lmmmmmmmmmmmmmmmmmmmmml00000099990
EEEEECCCcccccccccWWWWWPPPPPPPPPPPPPPWWNccccccCCCEE   0000099990000000mmmmmmmmmmmmmmmmmmmmmmm00000099990
EEEEECCCcccccccccWWWWWPPPPPPPPPPPPPPPWNccccccCCCEE   0000099990000000mmmmmmjjjjjjjjjjjjjjmmm00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWcccccccCCCEE   0000099990000000lmmmjjjjjjjjjjjjjjjjmml00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWcccccccCCCEE   0000099990000000mmmjjjjjjjjjjjjjjjjjmmm00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWcccccccCCCEE   0000099990000000lmmjjjjjjjjjjjjjjjjjmml00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWNccccccCCCEE   0000099990000000mmmjjjjjjjjjjjjjjjjjmmm00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWNccccccCCCEE   0000099990000000mmmjjjjjjjjjjjjjjjjjmmm00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWcccccccCCCEE   0000099990000000lmmjjjjjjjjjjjjjjjjjmml00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWcccccccCCCEE   0000099990000000mmmjjjjjjjjjjjjjjjjjmmm00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWcccccccCCCEE   0000099990000000mmmjjjjjjjjjjjjjjjjjmmm00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWMccccccCCCEE   0000099990000000lmmjjjjjjjjjjjjjjjjjmml00000099990
EEEEECCCcccccccccWPPPPPPPPPPPPPPPPPPPWWccccccCCCEE   0000099990000000mmmjjjjjjjjjjjjjjjjjmmm00000099990
EEEEECCCcccccccccWWWWWWWWWWWWWWWWWWWWWcccccccCCCEE   0000099990000000lmmmmmmmmmmmmmmmmmmmmml00000099990
EEEEECCCcccccccccWWWWWWWWWWWWWWWWWWWWWcccccccCCCEE   0000099990000000lmmmmmmmmmmmmmmmmmmmmml00000099990
EEEEECCCccccccccccccnnnnnccccccccccccccccccccCCCEE   00000999900000000000000000000000000000000000099990
EEEEECCCccccccccccccnnnnnccccccccccccccccccccCCCEE   00000999900000000000000000000000000000000000099990
EEEEECCCccccccccccccnnnnnccccccccccccccccccccCCCEE   00000999900000000000000000000000000000000000099990
EEEEECCCccccccccccccnnnnncccccccccccccqqcccccCCCEE   00000999900000000000000000000000000000220000099990
EEEEECCCccccccccccccnnnnnccccccccccccccqcccccCCCEE   00000999900000000000000000000000000000220000099990
EEEEECCCccccccccccccnnnnnccccccccccccccccccccCCCEE   00000999900000000000000000000000000000000000099990
EEEEECCCccccccccccccnnnnnccccccccccccccccccccCCCEE   00000999900000000000000000000000000000000000099990
EEEEECCCccccccccccccnnnnnccccccccccccccccccccCCCEE   00000999900000000000000000000000000000000000099990
EEEEECCCccccccccccccnnnnnccccccccccccccccccccCCCEE   00000999900000000000000000000000000000000000099990
EEEEECCCccccccccccccnnnnnccccccccccccccccccccCCCEE   000ffffff99999999999hhhhh99999999999999999999ffffd
EEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH   000fddddf99999999999hfffh99999999999999999999fdddd
EEEEHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHH   000fddddf99999999999hfffh99999999999999999999fdddd
EEEHHHHHCCCCCCCCCCCCMCCCCCCCCCCCCCCCCCCCCCCCCHHHHH   000dddddf99999999999hhhhh99999999999999999999fdddd
EEEEHHHHaaaaaaaaaaaarrrrraaaaaaaaaaaaaaaaaaaaHHHHH   000fddddf000000000000000000000000000000000000fdddd
EEEEHHHHaaaaaaaaaaaarrrrraaaaaaaaaaaaaaaaaaaaMHHHH   000ffffff000000000000000000000000000000000000ffffd
EEEEEEEEaaaaaaaaaaaarrrrraaaaaaaaaaaaaaaaaaaaEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000fffff000000000000000000000000000000fffff00000
EEEEEHHHHHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEHHHHHEEEEE   00000fdddf000000000000000000000000000000fdddf00000
EEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEEEE   00000fdddf999999999999999999999999999999fdddf00000
EEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEEEE   00000fdddd999999999999999999999999999999fdddd00000
EEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEEEE   00000fdddf999999999999999999999999999999fdddf00000
EEEEEMHHHMCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCMHHHMEEEEE   00000fffff999999999999999999999999999999fffff00000
EEEEEEECCCccccccckkkkkccccccccccccccccccCCCEEEEEEE   00000099990000000246890000000000000000009999000000
EEEEEEECCCccccccckkkkkccccccccccccccccccCCCEEEEEEE   00000099990000000246890000000000000000009999000000
EEEEEEECCCccccccckkkkkccccccccccccccccccCCCEEEEEEE   00000099990000000246890000000000000000009999000000
EEEEEEECCCccccccccccccccccccccccccccccccCCCEEEEEEE   00000099990000000000000000000000000000009999000000
EEEEEEECCCccccccccccccccccccccccccccccccCCCEEEEEEE   0000009999000000llmmlmlmmmmmmlmmlmlmmll09999000000
EEEEEEECCCcccccccWWWWWWWWWWWWWWWWWWWWWccCCCEEEEEEE   0000009999000000lmmmmmmmmmmmmmmmmmmmmml09999000000
EEEEEEECCCcccccccWWPPPPPPPPPPPPPPPPPWWNcCCCEEEEEEE   0000009999000000mmmmmmmmmmmmmmmmmmmmmmm09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWNcCCCEEEEEEE   0000009999000000mmmjjjjjjjjjjjjjjjjjmmm09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWccCCCEEEEEEE   0000009999000000lmmjjjjjjjjjjjjjjjjjmml09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWccCCCEEEEEEE   0000009999000000mmmjjjjjjjjjjjjjjjjjmmm09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWccCCCEEEEEEE   0000009999000000lmmjjjjjjjjjjjjjjjjjmml09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWNcCCCEEEEEEE   0000009999000000mmmjjjjjmjjjjjjjjjjjmmm09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWNcCCCEEEEEEE   0000009999000000mmmjjjjjjjjjjjjjjjjjmmm09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWccCCCEEEEEEE   0000009999000000lmmjjjjjjjjjjjjjjjjjmml09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWccCCCEEEEEEE   0000009999000000mmmjjjjjjjjjjjjjjjjjmmm09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWccCCCEEEEEEE   0000009999000000mmmjjjjjjjjjjjjjjjjjmmm09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWMcCCCEEEEEEE   0000009999000000lmmjjjjjjjjjjjjjjjjjmml09999000000
EEEEEEECCCcccccccWPPPPPPPPPPPPPPPPPPPWWcCCCEEEEEEE   0000009999000000mmmjjjjjjjjjjjjjjjjjmmm09999000000
EEEEEEECCCcccccccWWWWWWWWWWWWWWWWWWWWWccCCCEEEEEEE   0000009999000000lmmmmmmmmmmmmmmmmmmmmml09999000000
EEEEEEECCCcccccccWWWWWWWWWWWWWWWWWWWWWccCCCEEEEEEE   0000009999000000lmmmmmmmmmmmmmmmmmmmmml09999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000099990000000000000000000000000000009999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000099990000000000000000000000000000009999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000099990000000000000000000000000000009999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000099990000000000000000000000000000009999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000099990000000000000000000000000220009999000000
EEEEEEECCCcccccccccccccnnnnncccccccaacccCCCEEEEEEE   00000099990000000000000000000000000220009999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000099990000000000000000000000000220009999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000099990000000000000000000000000000009999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000099990000000000000000000000000000009999000000
EEEEEEECCCcccccccccccccnnnnnccccccccccccCCCEEEEEEE   00000fffff9999999999999hhhhhh99999999999fffff00000
EEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEEEE   00000fdddf9999999999999hffffh99999999999fdddf00000
EEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEEEE   00000fdddf9999999999999hffffh99999999999fdddf00000
EEEEEHHHHHCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCHHHHHEEEEE   00000ddddf9999999999999hhfhhh99999999999fdddd00000
EEEEEHHHHHaaaaaaaaaaaaarrrrraaaaaaaaaaaaHHHHHEEEEE   00000fdddf000000000000000000000000000000fdddf00000
EEEEEMHHHMaaaaaaaaaaaaarrrrraaaaaaaaaaaaMHHHMEEEEE   00000fffff000000000000000000000000000000fffff00000
EEEEEEEEEEaaaaaaaaaaaaarrrrraaaaaaaaaaaaEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.52 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 192 nodi, 943 passi, finito in 909 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=pietra delle torri, E=terreno (marcatore), K=pinK, w=white, s=slate, c=cortile, W=pietra del mastio, G=vetro delle finestre, T=Teal (marcatore), d=dead, dark, n=lastricato, r=strada, Q=aQua, a=fossato, x=x, m=magenta, y=yellow, h=honey, g=green, C=pietra della cinta, M=merli, f=pavimento in legno, F=solaio in pietra, P=terrazza del mastio, O=portone, o=assi del portone, N=cornice in pietra, U=feritoia, k=gradini, q=pietra del pozzo, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #94=porta di prova, #93=terreno di prova (marcatore), #95=solaio di prova, #96=pavimento di prova, #97=? (marcatore).
Alla fine: C 109722, W 57152, H 39234, E 9000, o 6510, k 5440, c 4525, U 2898, M 1872, N 1680, a 1559, f 1350, P 1350, F 1190, G 950, n 450, r 450, O 240, q 112.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-44 all×24, one×6, prl×4: 627 celle x5-27 y1-29 z0, passi 2-72
   #49 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 73
#51-53 all×3: 37400 celle x50-104 y40-79 z0-22, passi 74-95
#54-56 all×2, prl×1: 34075 celle x50-104 y40-79 z22-42, passi 96-116
#57-61 all×4, prl×1: 41350 celle x50-104 y40-79 z0-64, passi 117-141
    #62 all . K → K . passi=31: ×31, 71300 celle x55-99 y45-74 z1-32, passi 142-172, K→. 35650, .→K 35650
#63-64 all×2: 14700 celle x55-99 y45-74 z2-33, passi 173-203
    #65 all . K → K . (+1) passi=31: ×31, 83700 celle x55-99 y45-74 z33-64, passi 204-234, K→. 35650, .→K 35650, s→. 6200, .→s 6200
      r1 . K → K . ×35650; r2 . s → s . ×6200
    #66 prl K → P (+1): ×1, 1350 celle x55-99 y45-74 z64, passi 235, K→P 1150, s→P 200
      r1 K → P ×1150; r2 s → P ×200
    #67 all . y → y C passi=32: ×32, 208000 celle x35-134 y10-119 z0-32, passi 236-267, y→C 104000, .→y 104000
    #68 prl y → C: ×1, 3250 celle x35-134 y10-119 z32, passi 268, y→C 3250
    #69 all . h → h H passi=44: ×44, 79200 celle x30-139 y5-124 z0-44, passi 269-312, h→H 39600, .→h 39600
#70-85 prl×3, all×5, pieces×1: 31163 celle x30-139 y5-124 z0-52, passi 313-376
#137-153 all×5, prl×9: 18624 celle x49-105 y39-80 z10-53, passi 377-450
#154-162 prl×3, all×6: 23445 celle x49-105 y39-80 z10-53, passi 451-459
#168-192 all×8, prl×2, one×1: 18859 celle x30-139 y5-124 z11-75, passi 460-510
Senza effetto (non hanno mai cambiato una cella):
#12 prl E/K → K/* passi=1
#26 all cEEEEEEEEEE → *cccccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#27 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all cEEEEEEEEEE → *ccccc***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#29 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#42 one WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cc… → ********/cvvvvvvc/cvbbbbvc/cvbbbbvc/cvbbbbvc/cv… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#45 all [WT]E/*a → **/*a: le celle cercate c'erano, ma mai disposte come nel pattern
#46 all aE/*a → *a/**: le celle cercate c'erano, ma mai disposte come nel pattern
#47 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******… passi=12: le celle cercate c'erano, ma mai disposte come nel pattern
#77 all . b → b f (+1) passi=1: in quel momento nella griglia non c'erano celle "b", "v"
#78 all . b → b . (+1) passi=31: in quel momento nella griglia non c'erano celle "b", "v"
#79 prl b → R (+1): in quel momento nella griglia non c'erano celle "b", "v"
… e altri 33
Fix it and answer with the whole program.

## Risposta

<!--
Forte medievale — Programma completo (Blocco 2 di 2)
Parti e lettere del piano (1 cella = 5 voxel):
  K = interno del mastio (keep), w = mura del mastio, s = scala del mastio, d = porta del mastio
  c = cortile (courtyard), n = strada lastricata interna, Q = pozzo, x = scala per il camminamento
  W = cinta muraria (2 celle di spessore), T = torri angolari, G = corpo di guardia (gatehouse)
  b = interno caserma (barracks), v = mura della caserma
  r = strada esterna fino al bordo frontale, a = fossato (moat), t = alberi esterni
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKwsctWGTdnrQbvaxm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Mastio (keep) rettangolare arretrato rispetto al centro, con variazione casuale -->
      <all in="E/H" out="m/E" symmetry="()" steps="1"/>
      <all in="E/m" out="m/E" symmetry="()" steps="3"/>
      <one in="Em" out="mE" symmetry="(x)" steps="1"/>
      <prl in="Em" out="mE" p="0.5" symmetry="(x)" steps="1"/>
      <prl in="m" out="K"/>
      <all in="E/K" out="K/*" symmetry="()" steps="3"/>
      <all in="K/E" out="*/K" symmetry="()" steps="4"/>
      <prl in="E/K" out="K/*" p="0.5" symmetry="()" steps="1"/>
      <all in="KE" out="*K" symmetry="(x)" steps="4"/>
      <all in="KE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwwww/wKKKKKKK/wKKKKKKK" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- 2. Cortile attorno al mastio, con braccio laterale e crescita per taglie grandi -->
      <all in="wE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="c/E" out="*/c" symmetry="()" steps="3"/>
      <prl in="c/E" out="*/c" p="0.5" symmetry="()" steps="1"/>
      <one in="Ec/Ec/Ec/Ec/Ec" out="m*/m*/m*/m*/m*" symmetry="(x)" steps="1"/>
      <all in="Em" out="m*" symmetry="(x)" steps="2"/>
      <prl in="m" out="c"/>
      <all in="cEEEEEEEEEE" out="*cccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*cccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*ccccc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 3. Cinta muraria (2 celle) e torri angolari -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*T"/>
      <all steps="1">
        <rule in="T[EW]" out="*T"/>
        <rule in="T*/*[EW]" out="**/*T"/>
      </all>

      <!-- 4. Asse di ingresso: porta del mastio, lastricato, corpo di guardia, strada esterna (3 celle) -->
      <one in="KKK/www/ccc" out="***/*d*/***" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- 5. Elementi interni ed esterni secondo lo spazio disponibile -->
      <one in="WWWWWWWW/cccccccc/cccccccc" out="********/ccxxxxcc/ccxxxxcc" symmetry="()" steps="1"/>
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/cvvvvvvc/cvbbbbvc/cvbbbbvc/cvbbbbvc/cvvvvvvc" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cWWEEEEEE" out="***aa****" steps="1"/>
      <all in="[WT]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="12"/>
    </sequence>

    <!-- Livelli B e C: scala piena (1 cella = 5×5 voxel) -->
    <map scale="5 5 1" values="BEKwsdc nraQyhgxbtWCHMfFPOoNGUTkVRqLA #20 #21 #90 #91 #92 #94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>
      <rule in="W" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="T" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="t" out="EEEEE/EEEEE/EELEE/EEEEE/EEEEE"/>

      <union symbol="+" values="WCH"/>
      <union symbol="%" values="WCH"/>
      <union symbol="=" values="fFcPn"/>

      <sequence symmetry="(xy)">
        <!-- B. Le altezze: ogni parte sale per colonne -->
        <!-- Mastio: mura (64) con fasce finestre U su due piani; porta d (seme O a z=0, poi muro) -->
        <all steps="1">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d O"/>
        </all>
        <all steps="9">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w U"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="10">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <prl in="d" out="w"/>
        <all in="B w" out="w W" steps="10"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w W" steps="10"/>
        <prl in="w" out="W"/>

        <!-- Mastio: pavimenti (z=0), scala (z=1), solaio (z=32), terrazza (z=64) -->
        <all steps="1">
          <rule in="B K" out="K f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B K" out="K B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B K" out="K F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B K" out="K B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="K" out="P"/>
          <rule in="s" out="P"/>
        </prl>

        <!-- Cinta muraria (32), torri angolari (44), corpo di guardia (52 con portone O a z=0) -->
        <all in="B y" out="y C" steps="32"/>
        <prl in="y" out="C"/>
        <all in="B h" out="h H" steps="44"/>
        <prl in="h" out="H"/>
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g C" steps="51"/>
        <prl in="g" out="C"/>

        <!-- Scala del cortile verso il camminamento della cinta -->
        <all in="B x" out="x c" steps="1"/>
        <all in="B x" out="x T" steps="1"/>
        <prl in="x" out="B"/>

        <!-- Caserma (1 piano, 32, con tetto a falde R) -->
        <all steps="1">
          <rule in="B b" out="b f"/>
          <rule in="B v" out="v V"/>
        </all>
        <all steps="31">
          <rule in="B b" out="b B"/>
          <rule in="B v" out="v V"/>
        </all>
        <prl>
          <rule in="b" out="R"/>
          <rule in="v" out="R"/>
        </prl>

        <!-- Pozzo (bordo alto 6) -->
        <all in="B q" out="q q" steps="6"/>

        <!-- Alberi esterni (tronco L alto 14, chioma A) -->
        <all in="B L" out="L L" steps="14"/>
        <all in="B L" out="A *" steps="1"/>
        <all in="AB" out="*A" steps="4"/>
        <all in="B A" out="A *" steps="5"/>

        <!-- C. Scala piena: porte, scale, finestre, merli, feritoie, tetti -->
        <pieces piece="125" margin="24">
          <import file="part-door"/>
          <import file="part-stair"/>
        </pieces>

        <import file="part-window"/>
        <prl in="U" out="W"/>

        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto a padiglione della caserma -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Camino sul mastio -->
        <one in="B B P" out="* W *" steps="1" symmetry="()"/>
        <all in="B W" out="W *" steps="10"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6E8B4A" hidden="True" name="terreno"/>
  <color symbol="H" value="696862" area="tower" name="pietra delle torri"/>
  <color symbol="W" value="8C8A82" area="keep" name="pietra del mastio"/>
  <color symbol="C" value="7A7972" area="wall" name="pietra della cinta"/>
  <color symbol="M" value="96938A" name="merli"/>
  <color symbol="f" value="B89468" area="keep" name="pavimento in legno"/>
  <color symbol="F" value="A39A88" area="keep" name="solaio in pietra"/>
  <color symbol="P" value="8F8A7E" area="keep" name="terrazza del mastio"/>
  <color symbol="c" value="C2B393" area="courtyard" name="cortile"/>
  <color symbol="n" value="9E9585" area="courtyard" name="lastricato"/>
  <color symbol="r" value="B09D78" area="road" name="strada"/>
  <color symbol="a" value="4A7C9B" area="moat" name="fossato"/>
  <color symbol="O" value="6E472B" name="portone"/>
  <color symbol="o" value="4E311D" name="assi del portone"/>
  <color symbol="N" value="5E5B54" name="cornice in pietra"/>
  <color symbol="G" value="7FA6B8" name="vetro delle finestre"/>
  <color symbol="U" value="2E2D2A" name="feritoia"/>
  <color symbol="k" value="9A7B56" name="gradini"/>
  <color symbol="V" value="C9B89A" area="barracks" name="muro della caserma"/>
  <color symbol="R" value="A8523A" area="barracks" name="tetto in tegole"/>
  <color symbol="q" value="70706B" area="courtyard" name="pietra del pozzo"/>
  <color symbol="L" value="6B4C32" area="forest" name="tronco"/>
  <color symbol="A" value="4B733A" area="forest" name="chioma"/>
  <color symbol="#20" value="6E472B" hidden="True" name="portone aperto"/>
  <color symbol="#21" value="4E311D" hidden="True" name="assi aperte"/>

  <action name="open" label="Apri il portone">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi il portone">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>

