# model.sculpt · gemini-4-argon · 55 s · 1 immagini

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

Your program:
<!--
  Concept: Fattoria (medieval farmstead).
  Parts and letters:
  - Main farmhouse: interior (h), stair zone (s), stone/plaster walls (w), front door (d). 2 storeys + hip roof.
  - Barn / stable wing: interior (a), brick/timber walls (v), attached to a side of the farmhouse (1 tall storey + pitched roof).
  - Lean-to porch (tettoia): (p), 4 cells (20 voxels) deep and 7 cells (35 voxels) wide along the opposite side of the house, with wooden posts and a roof at 34 voxels high.
  - Stone silo / dovecote tower: (t), attached to a rear corner of the farmhouse, crowned with battlements (M) and arrow slits (U).
  - Farmyard (aia): (c) dirt yard around the buildings, enclosed by a low dry-stone wall (x), with a road (r) leading straight from the front door to the south edge.
  - Haystacks: (y) in the yard.
  - At Huge / Gargantuan sizes (where more ground E is available around the yard): expanded yard, stone well (Q), plowed crop fields (g), and orchard trees (z).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavptcxyrgQz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around centre H: 9x8 or 9x9 interior -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside the farmhouse along the back wall: 2 cells landing before small-x, 4 cells strip, floor after -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Silo / dovecote tower on one of the rear corners of the farmhouse -->
      <one in="EE/EE/Ew" out="tt/tt/*w" symmetry="(x)" steps="1"/>
      <all in="tE" out="*t" steps="1"/>
      <all in="tE/*t" out="*t/**"/>

      <!-- Lean-to (tettoia) 4 cells deep (20 voxels) and 7 cells long (35 voxels) on one side of the farmhouse -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*pppp/*pppp/*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- Barn wing on the other side wall (where E remains) -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="******/**aaa*/**aaa*/**aaa*/**aaa*/******" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Farmyard around the farmhouse, barn, lean-to and silo -->
      <all in="[wvtp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand the yard at Huge and Gargantuan sizes where at least 6 cells of E remain -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystack in the yard -->
      <one in="ccc/ccc/ccc" out="***/**y/**y" steps="1"/>

      <!-- Well in the expanded yard (matches when a 4x4 patch of yard is free, i.e., Huge+) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- Low stone wall / fence around the yard -->
      <all in="cE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Cultivated fields outside the fence at Huge+ sizes where 4 cells of open soil remain -->
      <all in="xEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="4"/>

      <!-- Orchard trees in remaining open soil at Huge+ sizes -->
      <one in="EEEE/EEEE/EEEE/EEEE" out="****/*zz*/*zz*/****" steps="3"/>

      <!-- Way out from H straight to the front (south): door d (3 cells wide) and road r to the edge -->
      <all in="[Hh]/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/[cxpgE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cxpgE]" out="*r" symmetry="(x)" steps="1"/>
      <prl in="H" out="h"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavptcxyrgQzfFWVGKLJRPOoNTkMU#90#91#92#94#20#21ijmnqub" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="z" out="zzzzz/zmmmz/zmmmz/zmmmz/zzzzz"/>

      <sequence symmetry="(xy)">
        <!-- Unions for imported parts -->
        <union symbol="+" values="WVG"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="WVG"/>

        <!-- B. Heights: grow columns from the bottom layer -->

        <!-- Main farmhouse walls (w) and front door column (d): 2 storeys = 64 high + roof R -->
        <all steps="1"><rule in="B d" out="d f"/></all>
        <all steps="1"><rule in="f d" out="d O"/></all>
        <all steps="4"><rule in="B w" out="w G"/><rule in="O d" out="d W"/><rule in="W d" out="d W"/></all>
        <all steps="2"><rule in="B w" out="w W"/><rule in="W d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w j"/><rule in="W d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="W d" out="d W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="W d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w j"/><rule in="W d" out="d j"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="j d" out="d W"/><rule in="W d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>

        <!-- Main farmhouse interior (h) and stair zone (s): floor at z=0, slab at z=32, roof R at z=64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Barn walls (v) and interior (a): 1 tall storey = 36 high + roof J -->
        <all in="B v" out="v G" steps="4"/>
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v j" steps="14"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="35"/>
        <prl in="a" out="J"/>

        <!-- Lean-to porch (p, b): corner/outer posts rise 33, roof J at z=34 -->
        <all in="b[pB]" out="p*" steps="2"/>
        <all in="B p" out="u *" steps="1"/>
        <all in="B b" out="b P" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B u" out="u B" steps="33"/>
        <prl in="u" out="J"/>

        <!-- Silo / dovecote tower (t): stone column 48 high, flat top for battlements & slits -->
        <all in="B t" out="t G" steps="48"/>
        <prl in="t" out="G"/>

        <!-- Low courtyard fence/wall (x): 7 high -->
        <all in="B x" out="x G" steps="6"/>

        <!-- Haystack (y): stepped mound of hay -->
        <all in="B y" out="y *" steps="10"/>
        <all in="yB" out="*B" steps="1"/>
        <all in="B y" out="y *" steps="6"/>

        <!-- Well (Q, q): stone curb and water -->
        <all in="B Q" out="Q G" steps="7"/>
        <all in="B q" out="q n" steps="3"/>

        <!-- Orchard trees (z, m): trunk P and canopy L -->
        <all in="B m" out="m P" steps="12"/>
        <all in="B m" out="m L" steps="10"/>
        <all in="LB" out="*L" steps="2"/>

        <!-- C. Full scale: doors, parts, windows, roofs, cleaning -->

        <!-- Internal doorway between farmhouse (f) and barn (f) through shared wall -->
        <one in="fWWWWWGf" out="*OOOOOO*" symmetry="(xy)" steps="1"/>
        <one in="fGGGGGGf" out="*OOOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/[WGV]" out="*/O" symmetry="()" steps="5"/>
        <all in="[WGV]/O" out="O/*" symmetry="()" steps="5"/>

        <!-- Include parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the window band (j) -->
        <one steps="18">
          <rule in="Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj" out="*K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K"/>
        </one>
        <all in="KjjjjB" out="*KKKK*"/>
        <prl in="j" out="W"/>

        <!-- Main farmhouse hip roof (R) with eaves and chimney -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <one in="B B R" out="* G *" steps="1" symmetry="()"/>
        <all in="B G" out="G *" steps="9"/>

        <!-- Barn and lean-to roof (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Clean up temporary markers -->
        <prl><rule in="q" out="B"/><rule in="m" out="z"/></prl>
      </sequence>
    </map>
  </map>

  <!-- Palette -->
  <color symbol="E" value="8a9a68" name="erba" area="field"/>
  <color symbol="c" value="b8a682" name="aia" area="yard"/>
  <color symbol="r" value="9e8c6c" name="sentiero" area="yard"/>
  <color symbol="x" value="857c70" name="muretto" area="yard"/>
  <color symbol="g" value="786048" name="campo arato" area="field"/>
  <color symbol="z" value="6e8c52" name="frutteto" area="orchard"/>
  <color symbol="L" value="4e7538" name="chioma" area="orchard"/>
  <color symbol="Q" value="7a7670" name="pozzo" area="yard"/>
  <color symbol="n" value="4a7a96" name="acqua" area="yard"/>
  <color symbol="y" value="d9b854" name="pagliaio" area="yard"/>
  <color symbol="p" value="a89674" name="pavimento tettoia" area="porch"/>
  <color symbol="P" value="6e4e32" name="legno" area="porch"/>
  <color symbol="f" value="b89060" name="tavolato" area="house"/>
  <color symbol="F" value="9c764c" name="solaio" area="house"/>
  <color symbol="W" value="dcd2be" name="intonaco" area="house"/>
  <color symbol="G" value="8c867c" name="pietra" area="tower"/>
  <color symbol="V" value="a85844" name="mattone" area="barn"/>
  <color symbol="R" value="b54d38" name="coppi" area="house"/>
  <color symbol="J" value="9c4230" name="tetto" area="barn"/>
  <color symbol="K" value="3b4d59" name="finestra" area="house"/>
  <color symbol="O" value="73482b" name="porta" area="house"/>
  <color symbol="o" value="4d2f1c" name="assi della porta" area="house"/>
  <color symbol="N" value="8c867c" name="stipite" area="house"/>
  <color symbol="k" value="8a6642" name="gradini" area="house"/>
  <color symbol="M" value="8c867c" name="merlo" area="tower"/>
  <color symbol="U" value="262422" name="feritoia" area="tower"/>
  <color symbol="#20" hidden="True" area="house"/>
  <color symbol="#21" hidden="True" area="house"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
The attached image shows it from four sides. The Artist gave it 5/10.
Problems: La parete frontale appare aperta o sezionata a metà, lasciando l'interno scoperto e privo di una vera porta d'ingresso principale.; La forma dell'edificio è troppo alta e stretta, poco somigliante a una fattoria di campagna tozza con tettoia o fienile.; Le finestre sulle pareti laterali e posteriori sono disposte in modo disordinato e sembrano macchie scure sparse.
Advice: Chiudi la facciata frontale e disegna un portone d'ingresso ben staccato dal colore del muro per accogliere chi entra.; Riorganizza le proporzioni: abbassa l'edificio principale e allarga la tettoia o la stalla per dare il tipico aspetto rurale.; Rendi le finestre più regolari e pulite, eliminando i voxel scuri isolati sulle pareti.
What the game made of it, in text:
### Seed 1: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, p pavimento tettoia, c aia, x muretto, y pagliaio, r sentiero, Q pozzo, f tavolato, F solaio, W intonaco, G pietra, K finestra, J tetto, R coppi, k gradini, M merlo, U feritoia, n acqua
Plan (the letter on top of every column):
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEE
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEE
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEE
cccccccccccccccccccccccccccccccccccccccccccccxxxEE
cccccccccccccccccccccccccccccccccccccccccccccxxxEE
cccccccccccccccccccccccccccccccccccccccccccccxxxEE
cccccccccccccccccccccccccccccccccccccccccccccxxxEE
cccccccccccccccccccccccccccccccccccccccccccccxxxEE
ccccccccGGGGGGGGGMccccccccccccQnQnnccccccccccxxxEE
ccccccccGGGGGGGGGMccccccccccccQnQnQccccccccccxxxEE
ccccccccGGGGGGGGGGccccccccccccQQQQQccccccccccxxxEE
ccccccccGGGGGGGGGcccccccccccccQnQnnccccccccccxxxEE
ccccccccGGGGGGGGGMccccccccccccQQQQQccccccccccxxxEE
ccccccccGGGGGGGGGGcccccccccccccccccccccccccccxxxEE
ccccccccGGGGGGGGGRcccccccccccccccccccccccccccxxxEE
ccccccccGGGGRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccccccccGGGGRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccccccccMMGcRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
yyyyycccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
yyyyycccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
yyJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
ccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE
cccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccxxxEE
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccxxxEE
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccxxxEE
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccxxxEE
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccxxxEE
xxxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxxEE
xxxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxxEE
xxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
33333333333333333333333333333333333333333333333300
33333333333333333333333333333333333333333333333300
33333333333333333333333333333333333333333333333300
00000000000000000000000000000000000000000000033300
00000000000000000000000000000000000000000000033300
00000000000000000000000000000000000000000000033300
00000000000000000000000000000000000000000000033300
0000000oooppoppooo00000000000033333000000000033300
0000000opppppppppo00000000000031313000000000033300
0000000opppppppppo00000000000033333000000000033300
0000000ppppppppppp00000000000033333000000000033300
0000000ppppppppppp00000000000031313000000000033300
0000000opppppppppo00000000000033333000000000033300
0000000ppppppppppp00000000000000000000000000033300
0000000pppppssssssssssssssssssssssssssss0000033300
0000000oppppsttttttttttttttttttttttttttts000033300
0000000oppppsttttttttttttttttttttttttttts000033300
0000000oooppsttuuuuuuuuuuuuuuuuuuuuuuutts000033300
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000033300
000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000033300
777770000000sttuuvvvvvvvvvvvvvvvvvvvuutts000033300
777770000000sttuuvvwwwwwwwwwwwwwwwvvuutts000033300
77ffffffffffsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
00fgggggggggsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
00fgggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000033300
00fgggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000033300
00fggghhhgggsttuuvvwwwxxxxxxxxxwwwvvuutts000033300
00fggghhhgggsttuuvvwwwxxxxxxxxxwwwvvuutts000033300
00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
00fggghhhgggsttuuvvvvvvvvvvvvvvvvvvvuutts000033300
00fggghhhgggsttuuvvvvvvvvvvvvvvvvvvvuutts000033300
00fggghhhgggsttuuuuuuuuuuuuuuuuuuuuuuutts000033300
00fggghhhgggsttuuuuuuuuuuuuuuuuuuuuuuuttx000033300
00fggghhhgggsttttttttttttttttttttttttttts000033300
00fggghhhgggsttttttttttttttttttttttttttts000033300
00fgggggggggsssssssssssssssssssssssssssss000033300
00fgggggggggf1111111111111111111111111110000033300
00fgggggggggf1111111111111111111111111110000033300
00fffffffffff0000000000000000000000000000000033300
00000000000000000000000000000000000000000000033300
00000000000000000000000000000000000000000000033300
00000000000000000000000000000000000000000000033300
00000000000000000000000000000000000000000000033300
33333333333330000000000000000000000000003333333300
33333333333330000000000000000000000000003333333300
33333333333330000000000000000000000000003333333300
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRRR....................
....................RRRRRRRRRRRR........G.........
..................RRRRRRRRRRRRRRRR......G.........
................RRRRRRRRRRRRRRRRRRRR....G.........
..............RRRRRRRRRRRRRRRRRRRRRRRR..G.........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......MMMGGWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......MMMGGMWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......MMMGGMWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......GGGGGWWWWWWWWWWWWWWWWKKWWWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWWWWKKKKWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWWWWKKKKWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWWWWKKKKWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWWWWWKKKWWWWWWWW..........
......JJGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
....JJJJJJJGGWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..JJJJJJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.......GGGGGGWWFFFFFFFFFFFFFFFFFFFFFFWWW..........
.......GGGGGGWWWWWWWWWWWWWWkWWWWWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWWWkWWWWWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWWkkWWWWWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWWkkWWWWWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWkkkWWWWWWWWWWWW..........
.......GGGGGGWWWWWWWWWWWWkkkWWWWWWWWWWWW..........
.......GGGGGGWWWWWWWKKWWkkkkWWWKKKWWWWWW..........
yyyyy..GGGGGGWWWWWWWKKKWkkkkWWWKKKWWWWWW..........
yyyyy..GGGGGGWWWWWWWKKKkkkkkKWWKKKWWWWWW..........
yyyyy..GGGGGGWWWWKKKKKKkkkkkKWWKKKWWWWWW..........
yyyyy..GGGGGGWWWWKKKWWkkkkkkKWWWWWWWWWWW..........
yyyyy..GGGGGGWWWWKKKWWkkkkkkKWWWWWWWWWWW..........
xxxxxxxxxxxxWWWWWKKKWkkkkkkkWWWWWWWWWWWWxxxxxxx...
GGGGGGGGGGGGGWWWWWWWWkkkkkkkWWWWWWWWWWWWGGGGGGGG..
GGGGGGGGGGGGGRRRRRRRRRRRRRRRRRRRRRRRRRRGGGGGGGGG..
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE
```
Right side (looking from the right):
```
.........................RRR......................
.......................RRRRRRR....G...............
.....................RRRRRRRRRRR..G...............
...................RRRRRRRRRRRRRRRG...............
.................RRRRRRRRRRRRRRRRRGR..............
...............RRRRRRRRRRRRRRRRRRRRRRR............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......MMMGGMGGWWWWWWWWWWWWWWWWWWWWWWW............
.......MMMGGMGGWWWWWWWWWWWWWWWWWWWWWWW............
.......MMMGGMGGWWWWWWWWWWWWWWWKKKWWWWW............
.......GGGGGGGGWWWWWWWKKWWWWWWKKKWWWWW............
.......GGGGGGGGWWWWWWWKKKWWWWWKKKWWWWW............
.......GGGGGGGGWWWWWWWKKKWWWWWKKKWWWWW............
.......GGGGGGGGWWWWWWWKKKWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWWJJ..........
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWWWWW............
.......GGGGGGGGWWWWWWWWWWWWWWKKKWWWWWW............
.......GGGGGGGGWWWWWWWWWWWKKKKKKKKKKWW............
.......GGGGGGGGWWWWWWWWWWWKKKKKKKKKKKW............
.......GGGGGGGGWWWWWWWWWWWKKKKKKKKKKKW............
.......GGGGGGGGWWWWWWWWWWWKKKKKKKKKKKW............
.......GGGGGGGGWWWWWWWWWWWWWWWWWWWKKKW............
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
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
........GGGGGGGGG.................................
.......GGGGGGGGGGG................................
.......GGGGGGGGGGG................................
.......GGGGGGGGGGG................................
.......GGGGGGGGGGG................................
.......GGGGGGGGGGG................................
.......GGGGGGGGGGG................................
.......GGGGGGGGGGG................................
.......GGGGGGWWWWWKKKKKWWWKKKWWKKKWWWWWW..........
.......GGGGGGWWWWWKKKKKWWWWWKWWKKKWWWWWW..........
........GGGGWWWWWKKKKKKWWWWWKWWKKKWWWWWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
yyyyy.......WWW.......kkkkkk.........WWW..........
yyyyy.......WWW.......kkkkkk.........WWW..........
yyyyy.......WWW........kkkkk.........WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............KWW......................KKK..........
............KWW......................KKK..........
............KWK......................KKK..........
............WWW......................KKK..........
............WWW......................KWW..........
............WWW......................KWW..........
............WWW......................KKK..........
............WWW......................KKK..........
............WWW......................KWW..........
............WWW......................KWW..........
............WWW......................KKK..........
.............WW.......................WW..........
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
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
........GGGGGGGGU.................................
.......GUGGGGGGGUG................................
.......GGGGGGGGGUG................................
.......GGGGGGGGGUG................................
.......GGGGGGGGGUG................................
.......GGGGGGGGGUG................................
.......GGGGGGGGGUG................................
.......GGGGGGGGGUG................................
.......GGGGGGWWWWWWWWWWWWWWWKKKKWWWWWWWW..........
.......UUUUUWWWWWWWWWWWWWWWWKWWKWWWWWWWW..........
........GGGGWWWWWWWWWWWWWWWWKKKKWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............KKK......................WWW..........
............KKK......................WWW..........
............KKK......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
.............WW.......................WW..........
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
.......................RRRRRR.....................
.......................RRRRRRR....................
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
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   33333333333333333333333333333333333333333333333333
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   33333333333333333333333333333333333333333333333333
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   33333333333333333333333333333333333333333333333333
cccccccccccccccccccccccccccccccccccccccccccccccccc   00000000000000000000000000000000000000000000000000
cccccccccccccccccccccccccccccccccccccccccccccccccc   00000000000000000000000000000000000000000000000000
cccccccccccccccccccccccccccccccccccccccccccccccccc   00000000000000000000000000000000000000000000000000
cccccccccccccccccccccccccccccccccccccccccccccccccc   00000000000000000000000000000000000000000000000000
cccccccccccccccccccccccccccccccccccccccccccccccccc   00000000000000000000000000033333300ooppooppoo00000
ccccccccccccccccccccccccccccnnQnQccMGGGGGGGGGccccc   00000000000000000000000000031331300pppppppppp00000
ccccccccccccccccccccccccccccnQQnQccMGGGGGGGGGccccc   00000000000000000000000000033333300pppppppppp00000
ccccccccccccccccccccccccccccQQQQQccGGGGGGGGGGccccc   00000000000000000000000000033333300pppppppppp00000
ccccccccccccccccccccccccccccnnQnQccGGGGGGGGGGccccc   00000000000000000000000000031331300pppppppppp00000
ccccccccccccccccccccccccccccQQQQcccMGGGGGGGGGccccc   00777777000000000000000000033333300pppppppppp00000
cccyyyyycccccccccccccccccccccccccccGGGGGGGGGGccccc   00777777000000000000000000000000000pppppppppp00000
cccyyyyycccccccccccccccccccccccccccGGGGGGGGGGccccc   007777770000ssssssssssssssssssssssssssssppppp00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRGGGGccccc   000000000000stttttttttttttttttttttttttttspppp00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRGGGGccccc   000000000000stttttttttttttttttttttttttttspppp00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRGcMMccccc   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsppoo00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00ffffffffffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fgggggggggsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fgggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fgggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuvvvzvvvvvvvvvvvvvvvuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttuuuuuuuuuuuuuuuuuuuuuuutts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttttttttttttttttttttttttttts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fggghhhgggsttttttttttttttttttttttttttts000000000
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fgggggggggsssssssssssssssssssssssssssss000000000
ccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fgggggggggf1111111111111111111111111110000000000
ccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00fgggggggggf1111111111111111111111111110000000000
cccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc   00fffffffffff0000000000000000000000000000000000000
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccccccc   00000000000000000000000000000000000000000000000000
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccccccc   00000000000000000000000000000000000000000000000000
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccccccc   00000000000000000000000000000000000000000000000000
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccccccc   00000000000000000000000000000000000000000000000000
xxxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxxxx   33333333333330000000000000000000000000003333333333
xxxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxxxx   33333333333330000000000000000000000000003333333333
xxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxxxx   33333333333330000000000000000000000000003333333333
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEE   33333333333333333333333333333333333333333333333300
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEE   33333333333333333333333333333333333333333333333300
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEE   33333333333333333333333333333333333333333333333300
cccccccccccccccccccccccccccccccccccccccccccccxxxEE   00000000000000000000000000000000000000000000033300
cccccccccccccccccccccccccccccccccccccccccccccxxxEE   00000000000000000000000000000000000000000000033300
cccccccccccccccccccccccccccccccccccccccccccccxxxEE   00000000000000000000000000000000000000000000033300
cccccccccccccccccccccccccccccccccccccccccccccxxxEE   00000000000000000000000000000000000000000000033300
cccccccccccccccccccccccccccccccccccccccccccccxxxEE   0000000oooppoppooo00000007777700000333330000033300
ccccccccGGGGGGGGGMcccccccyyyyycccccQnQnncccccxxxEE   0000000opppppppppo00000007777700000313130000033300
ccccccccGGGGGGGGGMcccccccyyyyycccccQnQnQcccccxxxEE   0000000opppppppppo00000007777700000333330000033300
ccccccccGGGGGGGGGGcccccccccccccccccQQQQQcccccxxxEE   0000000ppppppppppp00000000000000000333330000033300
ccccccccGGGGGGGGGccccccccccccccccccQnQnncccccxxxEE   0000000ppppppppppp00000000000000000313130000033300
ccccccccGGGGGGGGGMcccccccccccccccccQQQQQcccccxxxEE   0000000opppppppppo00000000000000000333330000033300
ccccccccGGGGGGGGGGcccccccccccccccccccccccccccxxxEE   0000000ppppppppppp00000000000000000000000000033300
ccccccccGGGGGGGGGRcccccccccccccccccccccccccccxxxEE   0000000pppppssssssssssssssssssssssssssss0000033300
ccccccccGGGGRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   0000000oppppsttttttttttttttttttttttttttts000033300
ccccccccGGGGRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   0000000oppppsttttttttttttttttttttttttttts000033300
ccccccccMMGcRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   0000000oooppsttuuuuuuuuuuuuyuuuuuuuuuutts000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00ffffffffffsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fgggggggggsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fgggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fgggggggggsttuuvvwwwxxxxxxxxxwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuvvwwwxxxxxxxxxwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuvvwwwxxxxxxxxxwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuvvwwwwwwwwwwwwwwwvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuvvvvvvvvvvvvvvvvvvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuvvvvvvvvvvvvvvvvvvvuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuuuuuuuuuuuuuuuuuuuuuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttuuuuuuuuuuuuuuuuuuuuuuutts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttttttttttttttttttttttttttts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fggghhhgggsttttttttttttttttttttttttttts000033300
ccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fgggggggggsssssssssssssssssssssssssssss000033300
ccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fgggggggggf1111111111111111111111111110000033300
ccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccxxxEE   00fgggggggggf1111111111111111111111111110000033300
cccJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccxxxEE   00fffffffffff0000000000000000000000000000000033300
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccxxxEE   00000000000000000000000000000000000000000000033300
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccxxxEE   00000000000000000000000000000000000000000000033300
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccxxxEE   00000000000000000000000000000000000000000000033300
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccxxxEE   00000000000000000000000000000000000000000000033300
xxxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxxEE   33333333333330000000000000000000000000003333333300
xxxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxxEE   33333333333330000000000000000000000000003333333300
xxxxxxxxxxxxrrrrrrrrrrrrrrrrrrrrrrrrrrrrxxxxxxxEEE   33333333333330000000000000000000000000003333333300
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.17 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 161 nodi, 500 passi, finito in 378 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba, h=honey, s=slate, w=white, d=dead, dark, p=pavimento tettoia, t=teal, c=aia, x=muretto, y=pagliaio, r=sentiero, Q=pozzo, f=tavolato, F=solaio, W=intonaco, G=pietra, K=finestra, J=tetto, R=coppi, T=Teal (marcatore), k=gradini, M=merlo, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), j=jungle, n=acqua, q=aqua, u=blue, b=black.
Alla fine: W 37252, G 29326, R 13320, K 3248, c 3150, k 2720, f 2075, J 2071, F 1640, r 1100, x 1100, y 850, E 700, p 700, U 372, M 240, n 108, Q 64.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-36 all×17, one×5, prl×1: 430 celle x0-18 y0-19 z0, passi 2-45
   #38 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 46
#40-44 all×4: 27550 celle x25-79 y30-79 z0-20, passi 47-67
#45-46 all×2: 24300 celle x25-79 y30-74 z20-38, passi 68-85
    #47 all . w → w j (+1) passi=14: ×14, 18900 celle x25-79 y30-74 z38-52, passi 86-99, w→j 9450, .→w 9450
      r1 . w → w j ×9450; r2 W d → d j ×0
#48-51 all×3, prl×1: 21150 celle x25-79 y30-79 z0-64, passi 100-114
    #52 all . h → h . passi=31: ×31, 99200 celle x30-74 y35-74 z1-32, passi 115-145, h→. 49600, .→h 49600
#53-54 all×2: 15600 celle x30-74 y35-74 z2-33, passi 146-176
    #55 all . h → h . (+1) passi=31: ×31, 111600 celle x30-74 y35-74 z33-64, passi 177-207, h→. 49600, .→h 49600, s→. 6200, .→s 6200
      r1 . h → h . ×49600; r2 . s → s . ×6200
#56-66 prl×1, all×2: 2752 celle x5-74 y35-79 z0-64, passi 208-211
    #69 all . u → u . passi=33: ×33, 46200 celle x5-24 y45-79 z1-34, passi 212-244, u→. 23100, .→u 23100
    #70 prl u → J: ×1, 700 celle x5-24 y45-79 z34, passi 245, u→J 700
    #71 all . t → t G passi=48: ×48, 33600 celle x15-34 y15-34 z0-48, passi 246-293, t→G 16800, .→t 16800
#72-73 prl×1, all×1: 13550 celle x0-94 y0-94 z0-48, passi 294-300
#74-153 all×21, prl×6, one×1: 19208 celle x0-79 y15-73 z0-54, passi 301-470
#154-161 prl×2, all×5, one×1: 30429 celle x4-80 y15-80 z1-75, passi 471-500
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#16 one EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw → ******/**aaa*/**aaa*/**aaa*/**aaa*/****** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#17 all aE → *v: in quel momento nella griglia non c'erano celle "a"
#18 all vE/*v → *v/**: in quel momento nella griglia non c'erano celle "v"
#23 all cEEEEEE → *ccc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#24 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#29 all xEEEE → *ggg* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all gE/*g → *g/** passi=4: in quel momento nella griglia non c'erano celle "g"
#31 one EEEE/EEEE/EEEE/EEEE → ****/*zz*/*zz*/**** passi=3: le celle cercate c'erano, ma mai disposte come nel pattern
#41 all f d → d O passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#57 all . v → v G passi=4: in quel momento nella griglia non c'erano celle "v"
#58 all . v → v V passi=6: in quel momento nella griglia non c'erano celle "v"
… e altri 56
Improve it: answer with the whole program.

## Risposta

<!--
  Concept: Fattoria (medieval farmstead).
  Parts and letters:
  - Main farmhouse: interior (h), stair zone (s), stone/plaster walls (w), front door (d). 2 storeys + hip roof.
  - Barn / stable wing: interior (a), brick walls (v), attached to a side of the farmhouse (1 tall storey + pitched roof).
  - Lean-to porch (tettoia): (p), 4 cells (20 voxels) deep and 7 cells (35 voxels) wide along the opposite side of the house, with wooden posts and a roof at 34 voxels high.
  - Stone silo / dovecote tower: (t), attached to a rear corner of the farmhouse, crowned with battlements (M) and arrow slits (U).
  - Farmyard (aia): (c) dirt yard around the buildings, enclosed by a low dry-stone wall (x), with a road (r) leading straight from the front door to the south edge.
  - Haystacks: (y) in the yard.
  - At Huge / Gargantuan sizes (where more ground E is available around the yard): expanded yard, stone well (Q), plowed crop fields (g), and orchard trees (z).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavptcxyrgQz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around centre H: 8x7 interior (40x35 voxels) so both side wings fit cleanly -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="()" steps="4"/>
      <all in="E[Hh]" out="h*" symmetry="()" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside the farmhouse along the back wall: 2 cells landing before small-x, 4 cells strip, floor after -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- Silo / dovecote tower on one of the rear corners of the farmhouse -->
      <one in="EE/EE/Ew" out="tt/tt/*w" symmetry="(x)" steps="1"/>
      <all in="tE" out="*t" steps="1"/>
      <all in="tE/*t" out="*t/**"/>

      <!-- Lean-to (tettoia) 4 cells deep (20 voxels) and 7 cells long (35 voxels) on one side of the farmhouse -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*pppp/*pppp/*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- Barn wing on the other side wall (where E remains): 3 cells out, 4 cells deep, plus brick wall v -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="*****/*aaa*/*aaa*/*aaa*/*aaa*/*****" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Farmyard around the farmhouse, barn, lean-to and silo -->
      <all in="[wvtp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand the yard at Huge and Gargantuan sizes where at least 5 cells of E remain -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystack in the yard -->
      <one in="ccc/ccc/ccc" out="***/**y/**y" steps="2"/>

      <!-- Well in the expanded yard (matches when a 4x4 patch of yard is free) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- Low stone wall / fence around the yard -->
      <all in="cE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Cultivated fields outside the fence at Huge+ sizes where 4 cells of open soil remain -->
      <all in="xEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="4"/>

      <!-- Orchard trees in remaining open soil at Huge+ sizes -->
      <one in="EEEE/EEEE/EEEE/EEEE" out="****/*zz*/*zz*/****" steps="3"/>

      <!-- Way out from H straight to the front (south): door d (3 cells = 15 voxels wide) and road r to the edge -->
      <all in="[Hh]/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/[cxpgE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cxpgE]" out="*r" symmetry="(x)" steps="1"/>
      <prl in="H" out="h"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavptcxyrgQzfFWVGKLJRPOoNTkMU#90#91#92#94#20#21ijmnqub" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="z" out="zzzzz/zmmmz/zmmmz/zmmmz/zzzzz"/>

      <sequence symmetry="(xy)">
        <!-- Unions for imported parts -->
        <union symbol="+" values="WVG"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="G"/>

        <!-- B. Heights: grow columns from the bottom layer -->

        <!-- Main farmhouse walls (w) and front door column (d): 2 storeys = 64 high + roof R -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B w" out="w G" steps="1"/>
        <all steps="3"><rule in="B d" out="d W"/><rule in="B w" out="w G"/></all>
        <all steps="6"><rule in="B d" out="d W"/><rule in="B w" out="w W"/></all>
        <all steps="8"><rule in="B d" out="d W"/><rule in="B w" out="w j"/></all>
        <all steps="14"><rule in="B d" out="d W"/><rule in="B w" out="w W"/></all>
        <all steps="10"><rule in="B d" out="d W"/><rule in="B w" out="w W"/></all>
        <all steps="8"><rule in="B d" out="d j"/><rule in="B w" out="w j"/></all>
        <all steps="14"><rule in="B d" out="d W"/><rule in="B w" out="w W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>

        <!-- Main farmhouse interior (h) and stair zone (s): floor at z=0, slab at z=32, roof R at z=64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Barn walls (v) and interior (a): 1 storey = 34 high + roof J -->
        <all in="B v" out="v G" steps="4"/>
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v j" steps="8"/>
        <all in="B v" out="v V" steps="16"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>

        <!-- Lean-to porch (p, b): corner/outer wooden posts P rise 33, roof J at z=34 -->
        <all in="b[pB]" out="p*" steps="1"/>
        <all in="B p" out="u *" steps="1"/>
        <all in="B b" out="b P" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B u" out="u B" steps="33"/>
        <prl in="u" out="J"/>

        <!-- Silo / dovecote tower (t): stone column 44 high, flat top for battlements & slits -->
        <all in="B t" out="t G" steps="44"/>
        <prl in="t" out="G"/>

        <!-- Low courtyard fence/wall (x): 7 high -->
        <all in="B x" out="x G" steps="6"/>

        <!-- Haystack (y): stepped mound of hay -->
        <all in="B y" out="y *" steps="10"/>
        <all in="yB" out="*B" steps="1"/>
        <all in="B y" out="y *" steps="6"/>

        <!-- Well (Q, q): stone curb and water -->
        <all in="B Q" out="Q G" steps="7"/>
        <all in="B q" out="q n" steps="3"/>

        <!-- Orchard trees (z, m): trunk P and canopy L -->
        <all in="B m" out="m P" steps="12"/>
        <all in="B m" out="m L" steps="10"/>
        <all in="LB" out="*L" steps="2"/>

        <!-- C. Full scale: doors, parts, windows, roofs, cleaning -->

        <!-- Internal doorway between farmhouse (f) and barn (f) through shared wall -->
        <one in="fGGGGGGf" out="*OOOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/[WGV]" out="*/O" symmetry="()" steps="5"/>
        <all in="[WGV]/O" out="O/*" symmetry="()" steps="5"/>

        <!-- Include parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Cleanly spaced windows in the 8-high window band (j): 4 wide, 8 high, 3 voxels margin on each side -->
        <one steps="16">
          <rule in="BBBBBBBBBB/jjjjjjjjjj B/j B/j B/j B/j B/j B/j B/j" out="**********/jjiKKKKijj */* */* */* */* */* */*"/>
        </one>
        <all in="B K" out="K *" steps="7"/>
        <all in="B i" out="i *" steps="7"/>
        <all in="KjjjjB" out="*KKKK*"/>
        <prl><rule in="j" out="W"/><rule in="i" out="W"/></prl>

        <!-- Main farmhouse hip roof (R) with eaves and chimney -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* G *" steps="1" symmetry="()"/>
        <all in="B G" out="G *" steps="8"/>

        <!-- Barn and lean-to roof (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="7" symmetry="()"/>

        <!-- Clean up temporary markers -->
        <prl><rule in="q" out="B"/><rule in="m" out="z"/></prl>
      </sequence>
    </map>
  </map>

  <!-- Palette -->
  <color symbol="E" value="8a9a68" name="erba" area="field"/>
  <color symbol="c" value="b8a682" name="aia" area="yard"/>
  <color symbol="r" value="9e8c6c" name="sentiero" area="yard"/>
  <color symbol="x" value="857c70" name="muretto" area="yard"/>
  <color symbol="g" value="786048" name="campo arato" area="field"/>
  <color symbol="z" value="6e8c52" name="frutteto" area="orchard"/>
  <color symbol="L" value="4e7538" name="chioma" area="orchard"/>
  <color symbol="Q" value="7a7670" name="pozzo" area="yard"/>
  <color symbol="n" value="4a7a96" name="acqua" area="yard"/>
  <color symbol="y" value="d9b854" name="pagliaio" area="yard"/>
  <color symbol="p" value="a89674" name="pavimento tettoia" area="porch"/>
  <color symbol="P" value="6e4e32" name="legno" area="porch"/>
  <color symbol="f" value="b89060" name="tavolato" area="house"/>
  <color symbol="F" value="9c764c" name="solaio" area="house"/>
  <color symbol="W" value="dcd2be" name="intonaco" area="house"/>
  <color symbol="G" value="8c867c" name="pietra" area="tower"/>
  <color symbol="V" value="a85844" name="mattone" area="barn"/>
  <color symbol="R" value="b54d38" name="coppi" area="house"/>
  <color symbol="J" value="9c4230" name="tetto" area="barn"/>
  <color symbol="K" value="3b4d59" name="finestra" area="house"/>
  <color symbol="O" value="73482b" name="porta" area="house"/>
  <color symbol="o" value="4d2f1c" name="assi della porta" area="house"/>
  <color symbol="N" value="8c867c" name="stipite" area="house"/>
  <color symbol="k" value="8a6642" name="gradini" area="house"/>
  <color symbol="M" value="8c867c" name="merlo" area="tower"/>
  <color symbol="U" value="262422" name="feritoia" area="tower"/>
  <color symbol="#20" hidden="True" area="house"/>
  <color symbol="#21" hidden="True" area="house"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
