# model.sculpt · gemini-4-hydrogen · 11 s

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
<!--
  Fattoria (Block 2: Programma completo)
-->
<sequence values="BHEhwsdavpcrfgQtWXLFVRJYKTkONMU" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WXV"/>
  <union symbol="=" values="F"/>
  <union symbol="%" values="WXV"/>
  <map scale="1/5 1/5 1" values="BHEhwsdavpcrfgQt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale attorno a H: 3 dietro, 4 davanti (+1 a caso), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Muri della casa principale -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Zona scala interna: 4x2 celle lungo un muro, con 2 celle di spazio davanti -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Ala laterale (fienile) su un fianco a scelta del seme -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <!-- Aia attorno a casa, portico e fienile -->
      <all in="[wvpa]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Aia extra dove c'è molto spazio (taglie grandi) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Staccionata attorno all'aia -->
      <all in="cE" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <!-- Pozzo nell'aia se c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Campi coltivati oltre la staccionata dove c'è spazio (taglie grandi) -->
      <all in="fEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- Alberi su terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="3"/>
      <!-- Strada dalla casa (H) fino al bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[pcfE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cfE]" out="*r" symmetry="(x)" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BHEhwsdavpcrfgQtWXLFVRJYKTkONMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <sequence symmetry="(xy)">
        <!-- B. Altezze: muri della casa e porta (64 voxel = 2 piani da 32) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B [wd]" out="[wd] W" steps="5"/>
        <all in="B [wd]" out="[wd] X" steps="14"/>
        <all in="B [wd]" out="[wd] W" steps="12"/>
        <all in="B [wd]" out="[wd] W" steps="6"/>
        <all in="B [wd]" out="[wd] X" steps="14"/>
        <all in="B [wd]" out="[wd] W" steps="12"/>
        <prl in="[wd]" out="R"/>
        <!-- B. Altezze: pavimenti e scala della casa -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
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
        <!-- B. Altezze: fienile (1 piano alto 34) -->
        <all in="B v" out="v V" steps="34"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>
        <!-- B. Altezze: portico (tetto a 34) -->
        <all in="B p" out="p F" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <!-- B. Altezze: staccionata, pozzo, alberi -->
        <all in="B f" out="f Y" steps="8"/>
        <prl in="f" out="B"/>
        <all in="B Q" out="Q W" steps="8"/>
        <prl in="Q" out="B"/>
        <all in="B t" out="t Y" steps="14"/>
        <prl in="t" out="B"/>
        <!-- C. Parti incluse -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- C. Finestre nella fascia X -->
        <one steps="14">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="W"/>
        <!-- C. Tetti a padiglione e camino -->
        <all in="RB" out="*R" steps="1"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="6E8B4A" hidden="True"/>
  <color symbol="H" value="D9C8A9" name="centro" area="house"/>
  <color symbol="h" value="D9C8A9" name="pavimento casa" area="house"/>
  <color symbol="w" value="C7B299" name="muro" area="house"/>
  <color symbol="s" value="A67C52" name="scala" area="house"/>
  <color symbol="d" value="6E472B" name="porta" area="house"/>
  <color symbol="a" value="C9B48C" name="pavimento fienile" area="barn"/>
  <color symbol="v" value="8C5A3C" name="muro fienile" area="barn"/>
  <color symbol="p" value="B88E65" name="portico" area="porch"/>
  <color symbol="c" value="B59E7A" name="aia" area="yard"/>
  <color symbol="f" value="7A5230" name="staccionata" area="yard"/>
  <color symbol="r" value="9E8B70" name="strada" area="yard"/>
  <color symbol="Q" value="5B84B1" name="pozzo" area="yard"/>
  <color symbol="g" value="8A794D" name="campo" area="field"/>
  <color symbol="t" value="4F772D" name="chioma" area="orchard"/>
  <color symbol="W" value="E6DEC8" name="intonaco"/>
  <color symbol="V" value="9E6B47" name="legno fienile"/>
  <color symbol="F" value="B89368" name="tavolato"/>
  <color symbol="R" value="A84A32" name="tetto casa"/>
  <color symbol="J" value="8F3D29" name="tetto fienile"/>
  <color symbol="Y" value="6B4423" name="legno scuro"/>
  <color symbol="K" value="7A7267" name="camino"/>
  <color symbol="L" value="A6D8E8" name="vetro"/>
  <color symbol="k" value="8C6239" name="gradini"/>
  <color symbol="T" value="8C6239" hidden="True"/>
  <color symbol="O" value="5C3A21" name="porta"/>
  <color symbol="o" value="3E2716" name="assi porta"/>
  <color symbol="N" value="7A5230" name="stipite"/>
  <color symbol="M" value="C7B299" name="merlo"/>
  <color symbol="U" value="4A453E" name="feritoia"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="3E2716" hidden="True"/>
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
It does not pass: taglia Grande, seme 1: "[..]" non è ammesso in un'uscita: W [wd]
Fix it and answer with the whole program.

## Risposta

<!--
  Fattoria (Block 2: Programma completo)
-->
<sequence values="BHEhwsdavpcrfgQtWXLFVRJYKTkONMU" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WXV"/>
  <union symbol="=" values="F"/>
  <union symbol="%" values="WXV"/>
  <map scale="1/5 1/5 1" values="BHEhwsdavpcrfgQt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale attorno a H: 3 dietro, 4 davanti (+1 a caso), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Muri della casa principale -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Zona scala interna: 4x2 celle lungo un muro, con 2 celle di spazio davanti -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Ala laterale (fienile) su un fianco a scelta del seme -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <!-- Aia attorno a casa, portico e fienile -->
      <all in="[wvpa]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Aia extra dove c'è molto spazio (taglie grandi) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Staccionata attorno all'aia -->
      <all in="cE" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <!-- Pozzo nell'aia se c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Campi coltivati oltre la staccionata dove c'è spazio (taglie grandi) -->
      <all in="fEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- Alberi su terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="3"/>
      <!-- Strada dalla casa (H) fino al bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[pcfE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cfE]" out="*r" symmetry="(x)" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BHEhwsdavpcrfgQtWXLFVRJYKTkONMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <sequence symmetry="(xy)">
        <!-- B. Altezze: muri della casa e porta (64 voxel = 2 piani da 32) -->
        <all in="B d" out="d O" steps="1"/>
        <all steps="5">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="6">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <prl in="[wd]" out="R"/>
        <!-- B. Altezze: pavimenti e scala della casa -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
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
        <!-- B. Altezze: fienile (1 piano alto 34) -->
        <all in="B v" out="v V" steps="34"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>
        <!-- B. Altezze: portico (tetto a 34) -->
        <all in="B p" out="p F" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <!-- B. Altezze: staccionata, pozzo, alberi -->
        <all in="B f" out="f Y" steps="8"/>
        <prl in="f" out="B"/>
        <all in="B Q" out="Q W" steps="8"/>
        <prl in="Q" out="B"/>
        <all in="B t" out="t Y" steps="14"/>
        <prl in="t" out="B"/>
        <!-- C. Parti incluse -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- C. Finestre nella fascia X -->
        <one steps="14">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="W"/>
        <!-- C. Tetti a padiglione e camino -->
        <all in="RB" out="*R" steps="1"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="6E8B4A" hidden="True"/>
  <color symbol="H" value="D9C8A9" name="centro" area="house"/>
  <color symbol="h" value="D9C8A9" name="pavimento casa" area="house"/>
  <color symbol="w" value="C7B299" name="muro" area="house"/>
  <color symbol="s" value="A67C52" name="scala" area="house"/>
  <color symbol="d" value="6E472B" name="porta" area="house"/>
  <color symbol="a" value="C9B48C" name="pavimento fienile" area="barn"/>
  <color symbol="v" value="8C5A3C" name="muro fienile" area="barn"/>
  <color symbol="p" value="B88E65" name="portico" area="porch"/>
  <color symbol="c" value="B59E7A" name="aia" area="yard"/>
  <color symbol="f" value="7A5230" name="staccionata" area="yard"/>
  <color symbol="r" value="9E8B70" name="strada" area="yard"/>
  <color symbol="Q" value="5B84B1" name="pozzo" area="yard"/>
  <color symbol="g" value="8A794D" name="campo" area="field"/>
  <color symbol="t" value="4F772D" name="chioma" area="orchard"/>
  <color symbol="W" value="E6DEC8" name="intonaco"/>
  <color symbol="V" value="9E6B47" name="legno fienile"/>
  <color symbol="F" value="B89368" name="tavolato"/>
  <color symbol="R" value="A84A32" name="tetto casa"/>
  <color symbol="J" value="8F3D29" name="tetto fienile"/>
  <color symbol="Y" value="6B4423" name="legno scuro"/>
  <color symbol="K" value="7A7267" name="camino"/>
  <color symbol="L" value="A6D8E8" name="vetro"/>
  <color symbol="k" value="8C6239" name="gradini"/>
  <color symbol="T" value="8C6239" hidden="True"/>
  <color symbol="O" value="5C3A21" name="porta"/>
  <color symbol="o" value="3E2716" name="assi porta"/>
  <color symbol="N" value="7A5230" name="stipite"/>
  <color symbol="M" value="C7B299" name="merlo"/>
  <color symbol="U" value="4A453E" name="feritoia"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="3E2716" hidden="True"/>
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
