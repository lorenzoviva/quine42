# model.sculpt · gemini-4-hydrogen · 30 s

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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, n lastricato, c cortile, W pietra delle mura, r strada, f pavimento, F solaio, M merlo, O porta, N stipite, o asse della porta, L tronco, J vetro, v chioma
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEvvvEEEEEEEEEEEEEEvvvEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEvvvvvEEEEEEEEEEEEvvvvvEEEEEEEEEEEEEE
EEEEEEEEEEEEEEvvvvvEEEEEEEEEEEEvvvvvvEEEEEEEEEEEEE
EEEEEEEvvvvEEEvvvvvvvvvEEEEEEEEvvvvvvEEEEEEEEEEEEE
EEEEEEvvvvvvEEvvvvvvvvvvEEEEEEEEvvvvEEEEMMWWMMWWMW
EEEEEEvvvvvvEEEvvEEvvvvvEEEEEEEEEvvEEEEEMWWWWWWWWW
EEEEEEvvvvvEEEEEEEEvvvvvEEEEEEEEEEEEEEEEWWWWWWWWWW
EEEEEEEvvvEEEEEEEEEEvvvEEEEEEEEEEEEEEEEEWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW
cccccccccccccccccccccccccccccccccccccccccccccWWWWW
cccccccccccccccccccccccccccccccccccccccccccccWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWMW
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWFFFFFFFWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
WWWFFFFFFFWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFWWWWWWccWWWEE
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW
WWWWWWWWWWWWWWWWWWWWWWNWWWWWWWNWWWWWWWWWWWWWWMWWWW
WWWWWWWWWWWWWWWWWWWWWWNWWWWWWMNWWWWWWWWWWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMMWWMWWWWW
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMWWWWWWWWW
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000555500000000000000555500000000000000
00000000000005555550000000000005555550000000000000
00000005550005555550555000000005555550000000000000
00000055555005555555555500000005555550000000000000
0000005555550055555555550000000555550000lllilllill
0000005555550005555555550000000055500000liiiiiiiii
0000005555550000005555550000000000000000liiiiiiiii
0000000555500000000555500000000000000000iiiiiiiiii
0000000000000000000000000000000000000000llliliiiii
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiii
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaliiii
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaalllii
000000000000000000000000000000000000000000000aalii
000000000000000000000000000000000000000000000aaiii
zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzssssssssssssssssssssssssssszzz00aaa00
zzzzzzzzzzzzzssssssssssssssssssssssssssszzz00aaa00
zzzzzzzzzzzzzzzssssssssssssssssssssssssszzz00aaa00
zzzssssssszzzzzssssssssssssssssssssssssszzz00aaa00
zzzssssssszzzzzssssssssssssssssssssssssszzz00aaa00
zzzssssssszzzzzsssssssssssssssssssssszzzzzz00aaa00
zzzssssssszzzzzsssssssssssssssssssssszzzzzz00aaa00
zzzssssssszzzzzsssssssssssssssssssssszzzzzz00aaa00
zzzssssssszzzssssssssssssssssssssssssssszzz00aaa00
zzzssssssszzzssssssssssssssssssssssssssszzz00aaa00
zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzsssssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzsssssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzsssssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzsssssssssssssssssssssssszzzzzz00aaa00
zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
000000000000000000000000000000000000000000000aaiii
000000000000000000000000000000000000000000000aalii
aaaaaaaaaaaaaaaaaaaaaajjjgjjjjaaaaaaaaaaaaaaalllii
aaaaaaaaaaaaaaaaaaaaaajggggggjaaaaaaaaaaaaaaaliiii
aaaaaaaaaaaaaaaaaaaaaajjjgjjjjaaaaaaaaaaaaaaaiiiii
0000000000000000000000000000000000000000llliliiiii
0000000000000000000000000000000000000000liiiiiiiii
0000000000000000000000000000000000000000liiiiiiiii
0000000000000000000000000000000000000000iiiiiiiiii
0000000000000000000000000000000000000000liiiiiiiii
```
Front (looking from the front; the sky at the top):
```
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJWWWWW.......
WWWWWWWWWWWWJJJWWWWWWWWWWWWWWWWWWWWJJJWWWWW.......
WWWWWWWWWWWWJJJWWWWWWWWWJJJWWWWWWWWJJJWWMMM.MMMMMM
WWWWWWWWWWWWJJJWWWWWWWWWJJJWWWWWWWWJJJWWMMM.MMMMMM
WWWWWWWWWWWWJJJWWWWWWWWMMJJMWMWWWWWWWWWWMMM.MMMMMM
WWWWWWWWWWWWWWWWWWWWWWWMMJJMWMWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWMMWWMWMWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWNNNNNNNWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW
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
.....MMM.M.MMM.MMMWWWWWWWWWWWWWWWWWWWWMM.MMMMMMM.M
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
.vvvvWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..LLLWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..LLLWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..LLLWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..LLLWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..LLLWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEEEEWWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEWWWWWWWWWWWWW
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
...............LL................LL...............
...............LLL..............LLL...............
...............LLL..............LLL...............
.......LLL..........LLL.................WWWWWWWWWW
.......LLL..........LLL.................WWWWWWWWWW
........LL..........LL..................WWWWWWWWWW
........................................WWWWWWWWWW
........................................WWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.............................................WWWWW
.............................................WWWWW
WWWWWWWWJJWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW
WWWWWWWWWWWWWWW......................WWWWWW..WWW..
WWWWWWWWWWWWWWW......................WWWWWW..WWW..
WWWWWWWWWWWWW...........................WWW..WWW..
WWWWWWWWWWWWW...........................WWW..WWW..
WWWWWJJJWWWWWWW.........................WWW..WWW..
WWW.......WWWWW.........................WWW..WWW..
WWW.......WWWWW.........................WWW..WWW..
WWW.......WWWWW......................WWWWWW..WWW..
WWW.......WWWWW......................WWWWWW..WWW..
WWW.......WWWWW.......................WWWWW..WWW..
WWW.......WWW...........................WWW..WWW..
WWW.......WWW...........................WWW..WWW..
WWWWWWWWWWWWWWW......................WWWWWW..WWW..
WWWWWWWWWWWWWWW......................WWWWWW..WWW..
WWWWWWWWWWWWWWW......................WWWWWW..WWW..
WWWWWWWWWWWWW........................WWWWWW..WWW..
WWWWWWWWWWWWW........................WWWWWW..WWW..
WWWWWWWWWWWWW........................WWWWWW..WWW..
WWWWWWWWWWWWW........................WWWWWW..WWW..
WWWWWWWWWWWWWJJWWWWWWWWoooooooWWWWWWWWWWWWW..WWWWW
WWWWWWWWWWWWWJJWWWWWWWWoooooooWWWWWWWWWWWWW..WWWWW
WWWWWWWWWWWWJJJWWWWWWWWoooooooWWWWWWWWWWWWW..WWWWW
.............................................WWWWW
.............................................WWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWWWWWW
........................................WWWWWWWWWW
........................................WWWWWWWWWW
........................................WWWWWWWWWW
........................................WWWWWWWWWW
........................................WWWWWWWWWW
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
........................................MM..MM..M.
........................................M.........
..................................................
..................................................
........................................MM..M.....
..................................................
.............................................M....
.............................................M....
..................................................
..................................................
WWWWWJJWWWWWWWWWWJJJWJJJWJJJWJJJWWWWWWWWWWW....M..
WWWWWWWWWWWWWWWWWJJJWJJJWJJJWJJJWWWWWWWWWWW....M..
WWWWWWWWWWWWWWWWWJJJWJJJWJJJWJJJWWWWWWWWWWW.....M.
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWW...........................WWW.......
WWWWWWWWWWWWW...........................WWW.......
WWWWWWWWWWWWWWW.........................WWW.......
WWW.......WWWWW.........................WWW.......
WWW.......WWWWW.........................WWW.......
WWW.......WWWWW......................WWWWWW.......
WWW.......WWWWW......................WWWWWW.......
WWW.......WWWWW.......................WWWWW.......
WWW.......WWW...........................WWW.......
WWW.......WWW...........................WWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWW........................WWWWWW.......
WWWWWWWWWWWWW........................WWWWWW.......
WWWWWWWWWWWWW........................WWWWWW.......
WWWWWWWWWWWWW........................WWWWWW.......
WWWWWWWWWWWWWJJWWWWWWWWWJJJWWWWWWWWWWWWWWWW.....M.
WWWWWWWWWWWWWJJWWWWWWWWWJJJWWWWWWWWWWWWWWWW....M..
WWWWWWWWWWWWJJJWWWWWWWWWJJJWWWWWWWWWWWWWWWW....M..
..................................................
..................................................
.............................................M....
.............................................M....
..................................................
........................................MM..M.....
........................................M.........
..................................................
..................................................
........................................M.........
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
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWW...........................WWW.......
WWWWWWWWWWWWW...........................WWW.......
WWWWWWWWWWWWWWW.........................WWW.......
WWW.......WWWWW.........................WWW.......
WWW.......WWWWW.........................WWW.......
WWW.......WWWWW......................WWWWWW.......
WWW.......WWWWW......................WWWWWW.......
WWW.......WWWWW.......................WWWWW.......
WWW.......WWW...........................WWW.......
WWW.......WWW...........................WWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWWWW......................WWWWWW.......
WWWWWWWWWWWWW........................WWWWWW.......
WWWWWWWWWWWWW........................WWWWWW.......
WWWWWWWWWWWWW........................WWWWWW.......
WWWWWWWWWWWWW........................WWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..................................................
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
EEEEEEEEEEEEEEEEEvvvEEEEEEEEEEEEvvvEEEEEEEEEEEEEEE   00000000000000000555500000000000555500000000000000
EEEEEEEEEEEEEEEEvvvvvEEEEEEEEEEvvvvvEEEEEEEEEEEEEE   00000000000000005555550000000005555550000000000000
EEEEEEEEEEEEEEEEvvvvvvEEEEEEEEEvvvvvvEEEEEEEEEEEEE   00555000000000005555550000055505555550000000000000
EEvvvvEEEEEEEEEEvvvvvvEEEEEvvvvvvvvvvEEEEEEEEEEEEE   05555500000000005555550000555555555550000000000000
EvvvvvvEEEEEEEEEEvvvvEEEEEvvvvvvvvvvEEEEMMWWMMWWMW   0555555000000000555550000055555555550000lllilllill
EvvvvvvEEEEEEEEEEEvvEEEEEEvvvvvvEvvEEEEEMWWWWWWWWW   0555555000000000055500000055555555500000liiiiiiiii
EvvvvvEEEEEEEEEEEEEEEEEEEEvvvvvEEEEEEEEEWWWWWWWWWW   0555555000000000000000000055555500000000liiiiiiiii
EEvvvEEEEEEEEEEEEEEEEEEEEEEvvvEEEEEEEEEEWWWWWWWWWW   0055550000000000000000000005555000000000iiiiiiiiii
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW   0000000000000000000000000000000000000000llliliiiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaliiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaalllii
cccccccccccccccccccccccccccccccccccccccccccccWWWWW   000000000000000000000000000000000000000000000aalii
cccccccccccccccccccccccccccccccccccccccccccccWWWWW   000000000000000000000000000000000000000000000aaiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWMW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzssssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzssssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzssssssszzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzssssssszzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzssssssszzzzzssssssssssssssssssssssssszzz00aaa00
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzssssssszzzzzssssssssssssssssssssssssszzz00aaa00
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzssssssszzzzzssssssssssssssssssssssssszzz00aaa00
WWWFFFFFFFWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzssssssszzzssssssssssssssssssssssssssszzz00aaa00
WWWFFFFFFFWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzssssssszzzssssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzssssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzssssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW   000000000000000000000000000000000000000000000aaiii
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW   000000000000000000000000000000000000000000000aalii
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW   aaaaaaaaaaaaaaaaaaaaaajjjgjjjjaaaaaaaaaaaaaaalllii
WWWWWWWWWWWWWWWWWWWWWWNWWWWWWWNWWWWWWWWWWWWWWMWWWW   aaaaaaaaaaaaaaaaaaaaaajggggggjaaaaaaaaaaaaaaaliiii
WWWWWWWWWWWWWWWWWWWWWWNWWWWWWMNWWWWWWWWWWWWWWWWWWW   aaaaaaaaaaaaaaaaaaaaaajjjgjjjjaaaaaaaaaaaaaaaiiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMMWWMWWWWW   0000000000000000000000000000000000000000llliliiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMWWWWWWWWW   0000000000000000000000000000000000000000liiiiiiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW   0000000000000000000000000000000000000000liiiiiiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW   0000000000000000000000000000000000000000iiiiiiiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMWWWWWWWWW   0000000000000000000000000000000000000000liiiiiiiii
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEvvvEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000555500000000000000000000000000000
EEEEEEEEEEEEEEEEvvvvvEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000005555550000000000000000000000000000
EEEEEEEEEEEEEEEEvvvvvvEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000555005550005555550000000055500000000000000000
EEEEvvvvEvvvvEEEvvvvvvEEEEEEEvvvvEEEEEEEEEEEEEEEEE   00005555555555005555550000000555550000000000000000
EEEEvvvvvvvvvvEEEvvvvEEEEEEEEvvvvvEEEEEEMMWWMMWWMW   0005555555555500555550000000555555000000lllilllill
EEEEvvvvvvvvvvEEEEvvEEEEEEEEEvvvvvEEEEEEMWWWWWWWWW   0005555555555500055500000000555555000000liiiiiiiii
EEEEvvvvvvvvvvEEEEEEEEEEEEEEEvvvvvEEEEEEWWWWWWWWWW   0005555555555500000000000000555555000000liiiiiiiii
EEEEEvvvEEvvvEEEEEEEEEEEEEEEEEvvvEEEEEEEWWWWWWWWWW   0000555505555000000000000000055550000000iiiiiiiiii
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWWWW   0000000000000000000000000000000000000000llliliiiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaliiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWW   aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaalllii
cccccccccccccccccccccccccccccccccccccccccccccWWWWW   000000000000000000000000000000000000000000000aalii
cccccccccccccccccccccccccccccccccccccccccccccWWWWW   000000000000000000000000000000000000000000000aaiii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWMW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzsssssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzsssssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzsssssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzsssssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzssssssszzzsssssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzssssssszzzsssssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzssssssszzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzssssssszzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzssssssszzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWFFFFFFFWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzssssssszzzssssssssssssssssssssssssssszzz00aaa00
WWWFFFFFFFWWWFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWccWWWEE   zzzssssssszzzssssssssssssssssssssssssssszzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFWWWWWccWWWEE   zzzzzzzzzzzzzzzsssssssssssssssssssssszzzzzz00aaa00
WWWWWWWWWWWWWWWFFFFFFFFFFFFFFFFFFFFFFWWWWWWccWWWEE   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalli
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccWWWWW   zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00aalii
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW   000000000000000000000000000000000000000000000aaiii
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW   000000000000000000000000000000000000000000000aalii
cccccccccccccccccccccccnnnnnnncccccccccccccccWWWWW   aaaaaaaaaaaaaaaaaaaaaajjjgjjjjaaaaaaaaaaaaaaalllii
WWWWWWWWWWWWWWWWWWWWWWNWWWWWWWNWWWWWWWWWWWWWWMWWWW   aaaaaaaaaaaaaaaaaaaaaajggggggjaaaaaaaaaaaaaaaliiii
WWWWWWWWWWWWWWWWWWWWWWNWWWWWWMNWWWWWWWWWWWWWWWWWWW   aaaaaaaaaaaaaaaaaaaaaajjjjgjjjaaaaaaaaaaaaaaaiiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMMWWMWWWWW   0000000000000000000000000000000000000000llliliiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMWWWWWWWWW   0000000000000000000000000000000000000000liiiiiiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW   0000000000000000000000000000000000000000liiiiiiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEWWWWWWWWWW   0000000000000000000000000000000000000000iiiiiiiiii
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEMWWWWWWWWW   0000000000000000000000000000000000000000liiiiiiiii
```
How much the plans of the seeds differ: 0.13 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 141 nodi, 464 passi, finito in 463 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=honey, w=white, d=dead, dark, n=lastricato, c=cortile, W=pietra delle mura, G=Green, r=strada, t=teal, g=green, m=magenta, a=alive, gray, U=feritoia, f=pavimento, F=solaio, M=merlo, O=porta, N=stipite, o=asse della porta, L=tronco, J=vetro, v=chioma, #90=? (marcatore), #91=? (marcatore).
Alla fine: W 211877, F 4400, o 4260, E 2550, f 2200, J 2048, L 1200, c 1075, M 564, N 550, v 388, O 240, r 150, n 75.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-40 all×26, prl×3, one×2: 326 celle x0-19 y1-19 z0, passi 2-56
   #42 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 57
    #44 all . w → w W passi=6: ×6, 23700 celle x0-84 y30-79 z0-6, passi 58-63, w→W 11850, .→w 11850
    #45 all . w → w U passi=14: ×14, 55300 celle x0-84 y30-79 z6-20, passi 64-77, w→U 27650, .→w 27650
    #46 all . w → w W passi=12: ×12, 47400 celle x0-84 y30-79 z20-32, passi 78-89, w→W 23700, .→w 23700
    #47 all . w → w W passi=6: ×6, 23700 celle x0-84 y30-79 z32-38, passi 90-95, w→W 11850, .→w 11850
    #48 all . w → w U passi=14: ×14, 55300 celle x0-84 y30-79 z38-52, passi 96-109, w→U 27650, .→w 27650
    #49 all . w → w W passi=13: ×13, 51350 celle x0-84 y30-79 z52-65, passi 110-122, w→W 25675, .→w 25675
#50-51 prl×1, all×1: 6375 celle x0-84 y30-79 z0-65, passi 123-124
    #53 all . h → h . passi=31: ×31, 136400 celle x5-79 y35-74 z1-32, passi 125-155, h→. 68200, .→h 68200
    #55 all . h → h F (+1) passi=1: ×1, 4400 celle x5-79 y35-74 z32-33, passi 156, h→F 2200, .→h 2200
      r1 . h → h F ×2200; r2 . s → s F ×0
    #56 all . h → h . (+1) passi=31: ×31, 136400 celle x5-79 y35-74 z33-64, passi 157-187, h→. 68200, .→h 68200
      r1 . h → h . ×68200; r2 . s → s . ×0
#57-60 prl×2, all×2: 12025 celle x5-79 y35-79 z0-65, passi 188-254
    #61 all . W → W W passi=23: ×23, 54575 celle x0-94 y20-89 z1-79, passi 255-277, .→W 54575
#63-65 all×2, prl×1: 5475 celle x45-59 y85-89 z0-36, passi 278-314
    #66 all . t → t W passi=41: ×41, 49200 celle x80-99 y10-99 z0-41, passi 315-355, t→W 24600, .→t 24600
#67-84 prl×4, all×7: 5411 celle x0-99 y2-99 z0-47, passi 356-385
#91-140 all×7, one×1: 14262 celle x9-99 y10-99 z0-51, passi 386-463
    #141 prl U → W: ×1, 56306 celle x0-99 y10-99 z6-51, passi 464, U→W 56306
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#19 one wwwwwww/whhhhhh/whhhhhh → *******/***ssss/***ssss passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#23 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#39 one ccc/ccc/ccc → ***/cQc/*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#52 all . s → s T passi=1: in quel momento nella griglia non c'erano celle "s"
#54 all . s → s . passi=30: in quel momento nella griglia non c'erano celle "s"
#62 prl W → W: le celle cercate c'erano, ma mai disposte come nel pattern
#68 all . Q → Q W passi=7: in quel momento nella griglia non c'erano celle "Q"
#69 prl Q → W: in quel momento nella griglia non c'erano celle "Q"
#74 all S#93 → *S passi=14: in quel momento nella griglia non c'erano celle "S", ""
#75 all S/#93 → */S passi=14: in quel momento nella griglia non c'erano celle "S", ""
… e altri 47
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
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <prl in="a" out="h"/>

      <!-- Zona della scala nel mastio (orientata verso +x, con 2 celle di pavimento libero prima) -->
      <one in="whhhhhh/whhhhhh" out="*hhssss/*hhssss" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio, espanso dove c'e spazio -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*cc**" steps="1"/>
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
      <one in="EEE/EEE/EEE" out="***/EgE/***" steps="5"/>
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
