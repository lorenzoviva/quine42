# model.sculpt · gemini-4-hydrogen · 18 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
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
<!-- Fattoria (Farmstead) -->
<sequence values="BHEhwsdrcfQptbvgqFWULRTkONoMPyzlJK" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="Wv"/>
  <union symbol="=" values="fF"/>
  <map scale="1/5 1/5 1" values="BHEhwsdrcfQptbvgq" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main house around H: 3 behind, 4-5 in front, 3-4 each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="(x)"/>
      <!-- House walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Stair zone inside the house: 3 cells landing + 4 cells stair, 2 cells wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Front door (3 cells wide) and road to the front edge -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <!-- Restore door in w -->
      <all in="h/w/r" out="*/d/*" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <!-- Lean-to porch against one side wall (3-4 deep, 5-6 long) -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="p*/p*/p*/p*/p*/p*" symmetry="(x)" steps="1"/>
      <all in="Ep" out="p*" symmetry="(x)" steps="2"/>
      <!-- Yard around the house and porch -->
      <all in="[wp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand yard where ground goes on (larger sizes) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Barn annex at larger sizes where 5x5 of yard fits -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="vvvvv/vbbbv/vbbbv/vbbbv/vvqvv" steps="1"/>
      <!-- Well in 4x4 of yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <!-- Fence around yard -->
      <all in="[cb]E" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <!-- Keep road clear -->
      <all in="[cf]/r" out="*/r" symmetry="()"/>
      <!-- Fields beyond fence where ground goes on -->
      <all in="fEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- Trees on free ground (5x5 of E) -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsdrfcQptbvgqFWULRTkONoMPyzlJK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <sequence symmetry="(xy)">
        <!-- B. Heights: columns by steps -->
        <!-- House walls (w): 2 storeys of 32 = 64, with window bands U -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Doorway (d): O at z=0, W above up to 64 -->
        <all in="B d" out="W O" steps="1"/>
        <all in="B W" out="W *" steps="63"/>
        <prl in="W" out="R"/>

        <!-- House floors (h) and stair zone (s) -->
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
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Porch (p): floor p, marker y rises 33 to roof J -->
        <all in="B p" out="y p" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- Barn (b, v, q): 36 high, roof J -->
        <all in="B v" out="v *" steps="36"/>
        <prl in="v" out="J"/>
        <all in="B q" out="q O" steps="1"/>
        <all in="B q" out="q v" steps="35"/>
        <prl in="q" out="J"/>
        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b B" steps="35"/>
        <prl in="b" out="J"/>

        <!-- Fence (f -> z): 6 high -->
        <all in="B f" out="z *" steps="6"/>
        <prl in="z" out="B"/>

        <!-- Well (Q): 6 high -->
        <all in="B Q" out="Q *" steps="6"/>
        <prl in="Q" out="B"/>

        <!-- Trees (t): trunk 12 high, leaves l -->
        <all in="B t" out="t *" steps="12"/>
        <prl in="t" out="l"/>
        <all in="lB" out="*l" steps="4"/>

        <!-- C. Full scale: doors, stairs, windows, roofs, cleaning -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- Windows in the U band -->
        <one steps="12">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- House hip roof (R) with eaves -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- Porch & barn pitched/flat roof (J) with eaves -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>

        <!-- Chimney on house roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="8A9A5B" hidden="True"/>
  <color symbol="f" value="D2B48C" name="pavimento legno" area="house"/>
  <color symbol="F" value="C19A6B" name="solaio"/>
  <color symbol="W" value="E8DCC4" name="muro intonaco"/>
  <color symbol="L" value="87CEEB" name="vetro finestra"/>
  <color symbol="R" value="A52A2A" name="tetto tegole"/>
  <color symbol="J" value="8B4513" name="tetto legno"/>
  <color symbol="T" value="C19A6B" hidden="True"/>
  <color symbol="k" value="B8860B" name="gradini scala"/>
  <color symbol="O" value="6F4E37" name="porta"/>
  <color symbol="o" value="4A3525" name="assi porta"/>
  <color symbol="N" value="5C4033" name="stipite"/>
  <color symbol="r" value="B8A99A" name="strada"/>
  <color symbol="c" value="C2B280" name="aia" area="yard"/>
  <color symbol="z" value="8B5A2B" name="staccionata"/>
  <color symbol="Q" value="708090" name="pozzo"/>
  <color symbol="p" value="A0785A" name="pavimento tettoia" area="porch"/>
  <color symbol="t" value="654321" name="tronco"/>
  <color symbol="l" value="4F7942" name="chioma albero"/>
  <color symbol="v" value="B22222" name="muro fienile"/>
  <color symbol="g" value="9ACD32" name="campo" area="field"/>
  <color symbol="K" value="696969" name="camino"/>
  <color symbol="P" value="8B5A2B" name="palo"/>
  <color symbol="M" value="E8DCC4" hidden="True"/>
  <color symbol="U" value="E8DCC4" hidden="True"/>
  <color symbol="y" value="8B4513" hidden="True"/>
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
It does not pass: taglia Grande, seme 1: il simbolo "#20" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="#20" value="rrggbb"/>
Fix it and answer with the whole program.

## Risposta

<!-- Fattoria (Farmstead) -->
<sequence values="BHEhwsdrcfQptbvgqFWULRTkONoMPyzlJK" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="Wv"/>
  <union symbol="=" values="fF"/>
  <map scale="1/5 1/5 1" values="BHEhwsdrcfQptbvgq" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main house around H: 3 behind, 4-5 in front, 3-4 each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="(x)"/>
      <!-- House walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Stair zone inside the house: 3 cells landing + 4 cells stair, 2 cells wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Front door (3 cells wide) and road to the front edge -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <!-- Restore door in w -->
      <all in="h/w/r" out="*/d/*" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <!-- Lean-to porch against one side wall (3-4 deep, 5-6 long) -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="p*/p*/p*/p*/p*/p*" symmetry="(x)" steps="1"/>
      <all in="Ep" out="p*" symmetry="(x)" steps="2"/>
      <!-- Yard around the house and porch -->
      <all in="[wp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand yard where ground goes on (larger sizes) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Barn annex at larger sizes where 5x5 of yard fits -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="vvvvv/vbbbv/vbbbv/vbbbv/vvqvv" steps="1"/>
      <!-- Well in 4x4 of yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <!-- Fence around yard -->
      <all in="[cb]E" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <!-- Keep road clear -->
      <all in="[cf]/r" out="*/r" symmetry="()"/>
      <!-- Fields beyond fence where ground goes on -->
      <all in="fEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- Trees on free ground (5x5 of E) -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsdrfcQptbvgqFWULRTkONoMPyzlJK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <sequence symmetry="(xy)">
        <!-- B. Heights: columns by steps -->
        <!-- House walls (w): 2 storeys of 32 = 64, with window bands U -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Doorway (d): O at z=0, W above up to 64 -->
        <all in="B d" out="W O" steps="1"/>
        <all in="B W" out="W *" steps="63"/>
        <prl in="W" out="R"/>

        <!-- House floors (h) and stair zone (s) -->
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
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Porch (p): floor p, marker y rises 33 to roof J -->
        <all in="B p" out="y p" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- Barn (b, v, q): 36 high, roof J -->
        <all in="B v" out="v *" steps="36"/>
        <prl in="v" out="J"/>
        <all in="B q" out="q O" steps="1"/>
        <all in="B q" out="q v" steps="35"/>
        <prl in="q" out="J"/>
        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b B" steps="35"/>
        <prl in="b" out="J"/>

        <!-- Fence (f -> z): 6 high -->
        <all in="B f" out="z *" steps="6"/>
        <prl in="z" out="B"/>

        <!-- Well (Q): 6 high -->
        <all in="B Q" out="Q *" steps="6"/>
        <prl in="Q" out="B"/>

        <!-- Trees (t): trunk 12 high, leaves l -->
        <all in="B t" out="t *" steps="12"/>
        <prl in="t" out="l"/>
        <all in="lB" out="*l" steps="4"/>

        <!-- C. Full scale: doors, stairs, windows, roofs, cleaning -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- Windows in the U band -->
        <one steps="12">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- House hip roof (R) with eaves -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- Porch & barn pitched/flat roof (J) with eaves -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>

        <!-- Chimney on house roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="8A9A5B" hidden="True"/>
  <color symbol="f" value="D2B48C" name="pavimento legno" area="house"/>
  <color symbol="F" value="C19A6B" name="solaio"/>
  <color symbol="W" value="E8DCC4" name="muro intonaco"/>
  <color symbol="L" value="87CEEB" name="vetro finestra"/>
  <color symbol="R" value="A52A2A" name="tetto tegole"/>
  <color symbol="J" value="8B4513" name="tetto legno"/>
  <color symbol="T" value="C19A6B" hidden="True"/>
  <color symbol="k" value="B8860B" name="gradini scala"/>
  <color symbol="O" value="6F4E37" name="porta"/>
  <color symbol="o" value="4A3525" name="assi porta"/>
  <color symbol="N" value="5C4033" name="stipite"/>
  <color symbol="r" value="B8A99A" name="strada"/>
  <color symbol="c" value="C2B280" name="aia" area="yard"/>
  <color symbol="z" value="8B5A2B" name="staccionata"/>
  <color symbol="Q" value="708090" name="pozzo"/>
  <color symbol="p" value="A0785A" name="pavimento tettoia" area="porch"/>
  <color symbol="t" value="654321" name="tronco"/>
  <color symbol="l" value="4F7942" name="chioma albero"/>
  <color symbol="v" value="B22222" name="muro fienile"/>
  <color symbol="g" value="9ACD32" name="campo" area="field"/>
  <color symbol="K" value="696969" name="camino"/>
  <color symbol="P" value="8B5A2B" name="palo"/>
  <color symbol="M" value="E8DCC4" hidden="True"/>
  <color symbol="U" value="E8DCC4" hidden="True"/>
  <color symbol="y" value="8B4513" hidden="True"/>
  <color symbol="#20" value="6F4E37" hidden="True"/>
  <color symbol="#21" value="4A3525" hidden="True"/>
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
