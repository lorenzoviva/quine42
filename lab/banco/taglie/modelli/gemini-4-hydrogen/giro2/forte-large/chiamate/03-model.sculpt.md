# model.sculpt · gemini-4-hydrogen · 22 s

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
  Forte:
  - Mastio centrale (h: pavimento, s: zona scala, w: mura del mastio, d: porta del mastio) intorno al centro H, con due piani e merlatura.
  - Cortile (c: cortile, n: lastricato d'ingresso, Q: pozzo dove c'e spazio) attorno al mastio.
  - Cinta muraria (W: mura di cinta, G: corpo di guardia al fronte, t: torri d'angolo dove c'e spazio) attorno al cortile.
  - Strada (r) dal corpo di guardia al bordo, e alberi (g) all'esterno dove c'e spazio.
  - I semi variano le dimensioni del mastio, la posizione della scala, la posizione del pozzo e degli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="W"/>
  <union symbol="%" values="W"/>
  <union symbol="=" values="fF"/>

  <map scale="1/5 1/5 1" values="BHEhwdsncWGrQtgm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio centrale attorno a H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala lungo una parete del mastio (orientata verso +x) -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="(y)" steps="1"/>

      <!-- Cortile attorno al mastio, espanso dove c'e spazio -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo sugli spigoli esterni della cinta dove c'e spazio -->
      <all in="EE/EW" out="**/*t" steps="1"/>
      <all steps="2">
        <rule in="tE" out="*t"/>
        <rule in="t*/*E" out="**/*t"/>
      </all>

      <!-- Ingresso dal centro H al fronte fino al bordo -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allarga porta, lastricato, corpo di guardia e strada a 3 celle -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Ripristina il pavimento interno dove era passato il tracciato -->
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Pozzo nel cortile dove c'e spazio 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi all'esterno dove c'e spazio 5x5 -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**g**/*****/*****" steps="3"/>
    </sequence>

    <map scale="5 5 1" values="BEhwdsncWGrQtgUfFMTkONoLJv" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Mura del mastio (w): 2 piani = 64 + 1 di parapetto = 65 -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="13"/>
        <prl in="w" out="W"/>

        <!-- Pavimento e scala del mastio (h, s): z=0 pavimento, z=1 striscia scala, z=32 solaio, z=64 tetto -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Porta del mastio (d) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="64"/>
        <prl in="d" out="W"/>

        <!-- Cinta muraria (W): alta 24 -->
        <all in="B W" out="W W" steps="23"/>
        <prl in="W" out="W"/>

        <!-- Corpo di guardia (G): alto 36 con porta O alla base -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G W" steps="35"/>
        <prl in="G" out="W"/>

        <!-- Torri d'angolo (t): alte 42 -->
        <all in="B t" out="t W" steps="41"/>
        <prl in="t" out="W"/>

        <!-- Pozzo (Q): alto 8 -->
        <all in="B Q" out="Q W" steps="7"/>
        <prl in="Q" out="W"/>

        <!-- Alberi (g): tronco L alto 12, poi chioma v -->
        <all in="B g" out="g L" steps="12"/>
        <prl in="g" out="v"/>
        <all in="vB" out="*v" steps="3"/>

        <!-- C. Scala piena: parti incluse -->
        <import file="part-battlements"/>
        <import file="part-door"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre nella fascia U del mastio -->
        <one steps="12">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J"/>
        </one>
        <all in="JUUUUB" out="*JJJJ*"/>
        <prl in="U" out="W"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>
  <color symbol="T" hidden="True"/>

  <color symbol="W" value="7A7268" name="pietra delle mura"/>
  <color symbol="M" value="6A6258" name="merlo"/>
  <color symbol="U" value="3A3632" name="feritoia"/>
  <color symbol="J" value="88A8B8" name="vetro"/>
  <color symbol="f" value="B89868" name="pavimento" area="keep"/>
  <color symbol="F" value="9E8258" name="solaio" area="keep"/>
  <color symbol="k" value="C4A474" name="gradino"/>
  <color symbol="O" value="5C3A21" name="porta"/>
  <color symbol="o" value="422814" name="asse della porta"/>
  <color symbol="N" value="524A42" name="stipite"/>
  <color symbol="c" value="A69A80" name="cortile" area="courtyard"/>
  <color symbol="n" value="8C8270" name="lastricato" area="courtyard"/>
  <color symbol="r" value="9E8B6E" name="strada" area="road"/>
  <color symbol="L" value="5C4028" name="tronco"/>
  <color symbol="v" value="4A7038" name="chioma" area="garden"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c cortile, W pietra delle mura, f pavimento, F solaio, M merlo, k gradino, J vetro
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
WWMMWWMMWWMMMEEEEEEEEEEEEEEEEEEEEEEEEEEEMMWWMMWWMW
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW
WWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW
WWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW
WWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW
MWEMMWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWMW
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFWWWWWWccWWWEE
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW
WWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWMMMEEEEEEEEEEEEEEEEEEEEEEEEEEEMMWWMWWWWW
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW
WWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW
WWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
lilllilllilll000000000000000000000000000lllilllill
iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
iiiiiiiiiiiii000000000000000000000000000iiiiiiiiii
iiiiiiillilll000000000000000000000000000llliliiiii
iiiiiiiiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiii
iiiiiiilaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaliiii
iiiilillaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaalllii
iiiilaaa0000000000000000000000000000000000000aalii
iiiiiaaa0000000000000000000000000000000000000aaiii
iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
lilllaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
lilllaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
iiiiiaaa0000000000000000000000000000000000000aaiii
iiiilaaa0000000000000000000000000000000000000aalii
iiiilillaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaalllii
iiiiiiilaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaliiii
iiiiiiiiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiii
iiiiiiillilll000000000000000000000000000llliliiiii
iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
iiiiiiiiiiiii000000000000000000000000000iiiiiiiiii
iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
```
Front (looking from the front; the sky at the top):
```
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWJJJWWWWWWWWWWWWWWWJJJWWWWWW.......
..........WWWWWWJJJWWWWWWWWWWWWWWWJJJWWWWWW.......
M.MMM.MMM.MMMWWWJJJWWWWWWWWWWWWWWWJJJWWWMMM.MMMMMM
M.MMM.MMM.MMMWWWJJJWWWWWWWWWWWWWWWJJJWWWMMM.MMMMMM
M.MMM.MMM.MMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMM.MMMMMM
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW
```
Right side (looking from the right):
```
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
.....MMM.M.MMM.MMMWWWWWWWWWWWWWWWWWWWWMM.MMM.MMM.M
.....MMM.M.MMM.MMMWWWWWWWWWWWWWWWWWWWWMM.MMM.MMM.M
.....MMM.M.MMM.MMMWWWWWWWWWWWWWWWWWWWWMM.MMM.MMM.M
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEEEEWWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEWWWWWWWWWWWWW
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWW.....................................WWWWW
WWWWWWWW.....................................WWWWW
WWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW
WWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW
WWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW
.....WWW..WWWWW......................WWWWWW..WWW..
.....WWW..WWWWW......................WWWWWW..WWW..
.....WWW..WWW...........................WWW..WWW..
.....WWW..WWW...........................WWW..WWW..
.....WWW..WWWWW.........................WWW..WWW..
.....WWW..WWWWW.........................WWW..WWW..
.....WWW..WWWWW.........................JJJ..WWW..
.....WWW..WWWWW......................WWWWWJ..WWW..
.....WWW..WWWWW......................WWWWWJ..WWW..
.....WWW..WWWWW.......................WWWWW..WWW..
.....WWW..WWW...........................WWW..WWW..
.....WWW..WWW...........................WWW..WWW..
.....WWW..WWWWW......................WWWWWW..WWW..
.....WWW..WWWWW......................WWWWWW..WWW..
.....WWW..WWWWW.....kkkkk............WWWWWW..WWW..
.....WWW..WWW.......kkkkkk...........WWWWWW..WWW..
.....WWW..WWW.......kkkkkk...........WWWWWW..WWW..
.....WWW..WWW.......kkkkkk...........WWWWWW..WWW..
.....WWW..WWW.......kkkkkk...........WWWWWW..WWW..
WWWWWWWW..WWWJJJWWWWkkkkkWWWWWWWWWWWWWWWWWW..WWWWW
WWWWWWWW..WWWJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW
WWWWWWWW..WWWJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW
WWWWWWWW.....................................WWWWW
WWWWWWWW.....................................WWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
WWWWWWWWWWWWW...........................WWWWWWWWWW
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..MM..MM..MMM...........................MM..MM..M.
............M...........................M.........
..................................................
..................................................
..........MMM...........................MM..M.....
..................................................
.......M.....................................M....
......M......................................M....
..................................................
..................................................
....M.....WWWWWWWWWWWJJJWWWWWWWWWWWJJJWWWWW....M..
....M.....WWWWWWWWWWWJJJWWWWWWWWWWWJJJWWWWW....M..
M..MM.....WWWWWWWWWWWJJJWWWWWWWWWWWJJWWWWWW.....M.
..........WWWWW......................WWWWWW.......
..........WWWWW......................WWWWWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWWWW.........................WWW.......
..........WWWWW.........................WWW.......
..........WWWWW.........................WWW.......
..........WWWWW......................WWWWWW.......
..........WWWWW......................WWWWWW.......
..........WWWWW.......................WWWWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWWWW......................WWWWWW.......
..........JWWWW......................WWWWWW.......
..........JWWWW......................WWWWWW.......
..........JJJ........................WWWWWW.......
..........JJJ........................WWWWWW.......
..........JJJ........................WWWWWW.......
..........JJJ........................WWWWWW.......
M..MM.....WWWWWWJJJWWWWWWWWWWWWWWWJJJWWWWWW.....M.
....M.....WWWWWWJJJWWWWWWWWWWWWWWWJJJWWWWWW....M..
....M.....WWWWWWJJJWWWWWWWWWWWWWWWJJJWWWWWW....M..
..................................................
..................................................
......M......................................M....
.......M.....................................M....
..................................................
..........MMM...........................MM..M.....
............M...........................M.........
..................................................
..................................................
............M...........................M.........
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
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWW......................WWWWWW.......
..........WWWWW......................WWWWWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWWWW.........................WWW.......
..........WWWWW.........................WWW.......
..........WWWWW.........................WWW.......
..........WWWWW......................WWWWWW.......
..........WWWWW......................WWWWWW.......
..........WWWWW.......................WWWWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWWWW......................WWWWWW.......
..........WWWWW......................WWWWWW.......
..........WWWWW......................WWWWWW.......
..........WWW........................WWWWWW.......
..........WWW........................WWWWWW.......
..........WWW........................WWWWWW.......
..........WWW........................WWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..................................................
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
WWMMWWMMWWMMMEEEEEEEEEEEEEEEEEEEEEEEEEEEMMWWMMWWMW   lilllilllilll000000000000000000000000000lllilllill
WWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW   iiiiiiiiiiiii000000000000000000000000000iiiiiiiiii
WWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW   iiiiiiillilll000000000000000000000000000llliliiiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   iiiiiiiiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiii
WWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   iiiiiiilaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaliiii
WWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   iiiilillaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaalllii
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW   iiiilaaa0000000000000000000000000000000000000aalii
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW   iiiiiaaa0000000000000000000000000000000000000aaiii
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
MWEMMWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWMW   lilllaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   lilllaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW   iiiiiaaa0000000000000000000000000000000000000aaiii
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW   iiiilaaa0000000000000000000000000000000000000aalii
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW   iiiilillaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaalllii
WWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   iiiiiiilaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaliiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   iiiiiiiiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiii
WWWWWWWWWWMMMEEEEEEEEEEEEEEEEEEEEEEEEEEEMMWWMWWWWW   iiiiiiillilll000000000000000000000000000llliliiiii
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
WWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
WWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW   iiiiiiiiiiiii000000000000000000000000000iiiiiiiiii
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
WWMMWWMMWWMMMEEEEEEEEEEEEEEEEEEEEEEEEEEEMMWWMMWWMW   lilllilllilll000000000000000000000000000lllilllill
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
WWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
WWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWWWW   iiiiiiiiiiiii000000000000000000000000000iiiiiiiiii
WWWWWWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW   iiiiiiillilll000000000000000000000000000llliliiiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   iiiiiiiiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiii
WWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   iiiiiiilaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaliiii
WWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   iiiilillaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaalllii
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW   iiiilaaa0000000000000000000000000000000000000aalii
WWWWWWWWcccccccccccccccccccccccccccccccccccccWWWWW   iiiiiaaa0000000000000000000000000000000000000aaiii
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
MWEMMWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWMW   lilllaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzsssssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   00000aaa00zzzssssssssssssssssssssssssssszzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   00000aaa00zzzzzsssssssssssssssssssssszzzzzz00aaa00
EEEEEWWWccWWWWWFFFFFFFFFFFFFFFFFFFFFFWWWWWWccWWWEE   lilllaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   iiiilaaa00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWcccccccccccccccnnnnnnncccccccccccccccWWWWW   iiiiiaaa0000000000000000000000000000000000000aaiii
WWWWWWWWcccccccccccccccnnnnnnncccccccccccccccWWWWW   iiiilaaa0000000000000000000000000000000000000aalii
WWWWWWWWcccccccccccccccnnnnnnncccccccccccccccWWWWW   iiiilillaaaaaaaaaaaaaajjjgjjjjaaaaaaaaaaaaaaalllii
WWWWWWWMWWWWWWWWWWWWWWNWWWWWWWNWWWWWWWWWWWWWWMWWWW   iiiiiiilaaaaaaaaaaaaaajggggggjaaaaaaaaaaaaaaaliiii
WWWWWWWWWWWWWWWWWWWWWWNWWWWWWMNWWWWWWWWWWWWWWWWWWW   iiiiiiiiaaaaaaaaaaaaaajjjjgjjjaaaaaaaaaaaaaaaiiiii
WWWWWWWWWWMMMEEEEEEEEEErrrrrrrEEEEEEEEEEMMWWMWWWWW   iiiiiiillilll000000000000000000000000000llliliiiii
WWWWWWWWWWWWMEEEEEEEEEErrrrrrrEEEEEEEEEEMWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
WWWWWWWWWWWWEEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
WWWWWWWWWWWWWEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW   iiiiiiiiiiiii000000000000000000000000000iiiiiiiiii
WWWWWWWWWWWWMEEEEEEEEEErrrrrrrEEEEEEEEEEMWWWWWWWWW   iiiiiiiiiiiil000000000000000000000000000liiiiiiiii
```
How much the plans of the seeds differ: 0.06 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 134 nodi, 416 passi, finito in 414 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=honey, w=white, s=slate, c=cortile, W=pietra delle mura, t=teal, m=magenta, U=feritoia, f=pavimento, F=solaio, M=merlo, T=Teal (marcatore), k=gradino, J=vetro, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 192868, F 3790, k 2720, E 2700, J 2432, f 1975, c 1250, M 858.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-31 all×13, prl×2, one×1: 308 celle x0-19 y2-19 z0, passi 2-29
   #35 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 30
    #37 all . w → w W passi=6: ×6, 15300 celle x20-84 y30-79 z0-6, passi 31-36, w→W 7650, .→w 7650
    #38 all . w → w U passi=14: ×14, 35700 celle x20-84 y30-79 z6-20, passi 37-50, w→U 17850, .→w 17850
    #39 all . w → w W passi=12: ×12, 30600 celle x20-84 y30-79 z20-32, passi 51-62, w→W 15300, .→w 15300
    #40 all . w → w W passi=6: ×6, 15300 celle x20-84 y30-79 z32-38, passi 63-68, w→W 7650, .→w 7650
    #41 all . w → w U passi=14: ×14, 35700 celle x20-84 y30-79 z38-52, passi 69-82, w→U 17850, .→w 17850
    #42 all . w → w W passi=13: ×13, 33150 celle x20-84 y30-79 z52-65, passi 83-95, w→W 16575, .→w 16575
#43-45 prl×1, all×2: 5625 celle x20-84 y30-79 z0-65, passi 96-98
    #46 all . h → h . passi=31: ×31, 110050 celle x25-79 y35-74 z1-32, passi 99-129, h→. 55025, .→h 55025
    #47 all . s → s . passi=30: ×30, 12000 celle x35-54 y65-74 z2-32, passi 130-159, s→. 6000, .→s 6000
    #48 all . h → h F (+1) passi=1: ×1, 3950 celle x25-79 y35-74 z32-33, passi 160, h→F 1775, .→h 1775, s→F 200, .→s 200
      r1 . h → h F ×1775; r2 . s → s F ×200
    #49 all . h → h . (+1) passi=31: ×31, 122450 celle x25-79 y35-74 z33-64, passi 161-191, h→. 55025, .→h 55025, s→. 6200, .→s 6200
      r1 . h → h . ×55025; r2 . s → s . ×6200
    #50 prl h → F (+1): ×1, 1975 celle x25-79 y35-74 z64, passi 192, h→F 1775, s→F 200
      r1 h → F ×1775; r2 s → F ×200
    #54 all . W → W W passi=23: ×23, 48900 celle x10-94 y20-89 z1-79, passi 193-215, .→W 48900
    #59 all . t → t W passi=41: ×41, 118900 celle x0-99 y10-99 z0-41, passi 216-256, t→W 59450, .→t 59450
#60-101 prl×3, all×7: 9021 celle x0-99 y10-99 z24-47, passi 257-304
#119-125 all×5, prl×2: 10300 celle x35-54 y65-74 z1-32, passi 305-353
#126-133 all×5, prl×2, one×1: 5462 celle x20-84 y30-79 z1-51, passi 354-415
    #134 prl U → W: ×1, 38224 celle x0-99 y10-99 z6-51, passi 416, U→W 38224
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#15 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#16 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#23 all m/w → */d passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#24 all [dn]/c → */n: in quel momento nella griglia non c'erano celle "dn"
#25 all [nG]/W → */G: in quel momento nella griglia non c'erano celle "nG"
#26 all [Gr]/E → */r: in quel momento nella griglia non c'erano celle "Gr"
#27 all dw → *d passi=1: in quel momento nella griglia non c'erano celle "d"
#28 all nc → *n passi=1: in quel momento nella griglia non c'erano celle "n"
#29 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G"
#30 all rE → *r passi=1: in quel momento nella griglia non c'erano celle "r"
#32 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 53
Fix it and answer with the whole program.

## Risposta

<!--
  Forte:
  - Mastio centrale (h: pavimento, s: zona scala al fondo, w: mura del mastio, d: porta del mastio) intorno al centro H, con due piani e merlatura.
  - Ala laterale (a) agganciata a un fianco casuale del mastio per variare la pianta tra i semi.
  - Cortile (c: cortile, n: lastricato d'ingresso, Q: pozzo dove c'e spazio) attorno al mastio.
  - Cinta muraria (W: mura di cinta, G: corpo di guardia al fronte, t: torri d'angolo) attorno al cortile.
  - Strada (r) dal corpo di guardia al bordo, e alberi (g) all'esterno dove c'e spazio.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="W"/>
  <union symbol="%" values="W"/>
  <union symbol="=" values="fF"/>

  <map scale="1/5 1/5 1" values="BHEhwdsncWGrQtgma" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio centrale attorno a H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Ala laterale su un fianco casuale del mastio -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <prl in="a" out="h"/>

      <!-- Zona della scala lungo la parete posteriore del mastio (orientata verso +x, lontana dalla porta) -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio, espanso dove c'e spazio -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo sugli spigoli esterni della cinta -->
      <all in="EE/EW" out="**/*t" steps="1"/>
      <all steps="2">
        <rule in="tE" out="*t"/>
        <rule in="t*/*E" out="**/*t"/>
      </all>

      <!-- Ingresso dal centro H al fronte fino al bordo -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allarga porta, lastricato, corpo di guardia e strada a 3 celle -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Ripristina il pavimento interno dove era passato il tracciato -->
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Pozzo nel cortile dove c'e spazio 3x3 -->
      <one in="ccc/ccc/ccc" out="***/cQc/***" steps="1"/>

      <!-- Alberi all'esterno dove c'e spazio 3x3 -->
      <one in="EEE/EEE/EEE" out="***/EgE/***" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BEhwdsncWGrQtgUfFMTkONoLJv" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Mura del mastio (w): 2 piani = 64 + 1 di parapetto = 65 -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="13"/>
        <prl in="w" out="W"/>

        <!-- Pavimento e scala del mastio (h, s): z=0 pavimento, z=1 striscia scala, z=32 solaio, z=64 tetto -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Porta del mastio (d) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="64"/>
        <prl in="d" out="W"/>

        <!-- Cinta muraria (W): alta 24 -->
        <all in="B W" out="W W" steps="23"/>
        <prl in="W" out="W"/>

        <!-- Corpo di guardia (G): alto 36 con porta O alla base -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G W" steps="35"/>
        <prl in="G" out="W"/>

        <!-- Torri d'angolo (t): alte 42 -->
        <all in="B t" out="t W" steps="41"/>
        <prl in="t" out="W"/>

        <!-- Pozzo (Q): alto 8 -->
        <all in="B Q" out="Q W" steps="7"/>
        <prl in="Q" out="W"/>

        <!-- Alberi (g): tronco L alto 12, poi chioma v -->
        <all in="B g" out="g L" steps="12"/>
        <prl in="g" out="v"/>
        <all in="vB" out="*v" steps="3"/>

        <!-- C. Scala piena: parti incluse -->
        <import file="part-battlements"/>
        <import file="part-door"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre nella fascia U del mastio -->
        <one steps="12">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J *J/*J/*J/*J/*J/*J"/>
        </one>
        <all in="JUUUUB" out="*JJJJ*"/>
        <prl in="U" out="W"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>
  <color symbol="T" hidden="True"/>

  <color symbol="W" value="7A7268" name="pietra delle mura"/>
  <color symbol="M" value="6A6258" name="merlo"/>
  <color symbol="U" value="3A3632" name="feritoia"/>
  <color symbol="J" value="88A8B8" name="vetro"/>
  <color symbol="f" value="B89868" name="pavimento" area="keep"/>
  <color symbol="F" value="9E8258" name="solaio" area="keep"/>
  <color symbol="k" value="C4A474" name="gradino"/>
  <color symbol="O" value="5C3A21" name="porta"/>
  <color symbol="o" value="422814" name="asse della porta"/>
  <color symbol="N" value="524A42" name="stipite"/>
  <color symbol="c" value="A69A80" name="cortile" area="courtyard"/>
  <color symbol="n" value="8C8270" name="lastricato" area="courtyard"/>
  <color symbol="r" value="9E8B6E" name="strada" area="road"/>
  <color symbol="L" value="5C4028" name="tronco"/>
  <color symbol="v" value="4A7038" name="chioma" area="garden"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
