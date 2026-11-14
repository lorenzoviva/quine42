# model.sculpt · gemini-4-argon · 54 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
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
  Concept: Fattoria (Farmstead)
  Parts & Letters:
  - Main farmhouse (h: interior floor, w: masonry wall, s: stair zone, d: front door) around centre H, two storeys (64 high) with hipped tile roof.
  - Front porch / lean-to (p: covered porch with wooden posts and roof at 34) along the front wall and entry door.
  - Attached barn / hayloft wing (a: barn floor, v: barn brick wall, i: internal doorway) on one side of the farmhouse (chosen by seed).
  - Stone silo / dovecote tower (t: tower wall, u: tower interior) attached to a corner of the farmhouse, crowned with battlements & slits.
  - Farmyard (c: dirt/cobble yard, x: wooden fence around yard, r: road to the front edge, q: stone well in the yard).
  - At Gargantuan (where 7 cells of ground extend beyond the fence): plowed crop fields (g: field) and orchard trees (y: orchard/trees).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapviutcxrqgy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Farmhouse main body around H: 9 wide (x), 8 or 9 deep (y) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Front door (3 cells wide, centered on H) and road straight to the front edge (+y) -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/[hw]" out="*/d" symmetry="()"/>
      <prl in="d/h" out="h/*" symmetry="()"/>
      <prl in="H" out="h"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Front porch (lean-to, 2 cells deep) along the front wall of the farmhouse -->
      <all in="[wd]/[Er]" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[Er]" out="*/p" symmetry="()" steps="1"/>

      <!-- Road continues from porch to the front edge (+y) -->
      <all in="p/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Stair zone inside farmhouse: along back wall, 2 cells landing before small-x, 4 cells long, 2 wide -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Attached Barn wing on one side (x) of the farmhouse -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Internal passage between farmhouse and barn -->
      <one in="hwh/awa" out="*i*/*i*" symmetry="(xy)" steps="1"/>

      <!-- Silo / Dovecote tower at a back corner of the farmhouse -->
      <one in="EE/Ew" out="**/*t" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>
      <all in="ttt/ttt/ttt" out="***/t*t/***"/>
      <all in="tBt" out="*u*" symmetry="(xy)"/>
      <all in="uBt" out="*u*" symmetry="(xy)"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Well in a 4x4 patch of the yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>

      <!-- Wooden fence around the farmyard -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- At Gargantuan (where 7 cells of ground go on past the fence): plowed fields (g) and orchard (y) -->
      <all in="xEEEEEEE" out="*ggggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="gggg/gggg/gggg/gggg" out="****/*yy*/*yy*/****" steps="6"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdapviutcxrqgyfFWVPRJKLZQYGCDoONMTkU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="q" out="qqqqq/qQQQq/qQQQq/qQQQq/qqqqq"/>
      <rule in="g" out="ggggg/DDDDD/ggggg/DDDDD/ggggg"/>
      <rule in="y" out="ggggg/gYYYg/gYYYg/gYYYg/ggggg"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WVZ"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Z"/>

        <!-- B. THE HEIGHTS -->

        <!-- 1. Farmhouse walls (w, d, i): 2 storeys = 64 high, topped with R -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="5"/>
        <all in="B i" out="i O" steps="1"/>
        <all in="B i" out="i W" steps="5"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B [wdi]" out="* K" steps="14"/>
        <all in="B [wdi]" out="* W" steps="12"/>
        <all in="B [wdi]" out="* W" steps="6"/>
        <all in="B [wdi]" out="* K" steps="14"/>
        <all in="B [wdi]" out="* W" steps="12"/>
        <prl in="[wdi]" out="R"/>

        <!-- 2. Farmhouse interior (h) and stair zone (s): floor at z=1, slab at z=33, ceiling R at z=65 -->
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

        <!-- 3. Barn wing: walls (v) and floor (a), 1 tall storey = 38 high, topped with P -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v K" steps="14"/>
        <all in="B v" out="v V" steps="16"/>
        <prl in="v" out="P"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="37"/>
        <prl in="a" out="P"/>

        <!-- 4. Silo / Dovecote tower: walls (t) 72 high, interior (u) with floors and top platform at 71 -->
        <all in="B t" out="t Z" steps="72"/>
        <prl in="t" out="B"/>
        <all in="B u" out="u f" steps="1"/>
        <all in="B u" out="u B" steps="31"/>
        <all in="B u" out="u F" steps="1"/>
        <all in="B u" out="u B" steps="37"/>
        <all in="B u" out="u F" steps="1"/>
        <prl in="u" out="B"/>

        <!-- 5. Front porch (lean-to): floor p, posts b rising 33, roof J at z=34 -->
        <!-- Keep only outer corner posts so the porch and doorway are clear -->
        <all in="b[pb]" out="p*" symmetry="(xy)"/>
        <all in="B p" out="y p" steps="1"/>
        <all in="B b" out="b J" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- 6. Well (q wall, Q water), Fence (x), Orchard trees (Y) -->
        <all in="B q" out="q Z" steps="10"/>
        <prl in="q" out="B"/>
        <all in="B x" out="x J" steps="8"/>
        <prl in="x" out="B"/>

        <all in="B Y" out="Y J" steps="12"/>
        <all in="B Y" out="Y G" steps="10"/>
        <prl in="Y" out="G"/>
        <all in="GB" out="*G" steps="2"/>

        <!-- C. THE FULL SCALE: DOORS, PARTS, WINDOWS, ROOFS -->

        <!-- Included parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the window bands K -->
        <one steps="20">
          <rule in="BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LKKKKB" out="*LLLL*"/>
        <all in="K W" out="W *"/>
        <all in="K V" out="V *"/>
        <prl in="K" out="W"/>

        <!-- Roofs: eaves and hipped roofs on farmhouse (R) and barn (P) -->
        <all in="RB" out="*R" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>

        <all in="PB" out="*P" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **P**/**P**/PPPPP/**P**/**P**" out="*****/*****/**P**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- Brick chimney on the farmhouse roof -->
        <one in="B B R" out="* C *" steps="1" symmetry="()"/>
        <all in="B C" out="C *" steps="10"/>
        <all in="CB" out="*C" symmetry="(xy)" steps="1"/>
      </sequence>
    </map>
  </map>

  <!-- Palette & Areas -->
  <color symbol="E" value="#7a9a55" name="erba" area="field"/>
  <color symbol="c" value="#c2b088" name="aia" area="yard"/>
  <color symbol="r" value="#b09e78" name="sentiero" area="yard"/>
  <color symbol="p" value="#b59267" name="pavimento portico" area="porch"/>
  <color symbol="g" value="#735838" name="campo arato" area="field"/>
  <color symbol="D" value="#5e462b" name="solco" area="field"/>
  <color symbol="G" value="#4f783b" name="chioma albero" area="orchard"/>

  <color symbol="f" value="#bfa074" name="tavolato" area="house"/>
  <color symbol="F" value="#a6885e" name="solaio" area="house"/>
  <color symbol="W" value="#e3d6be" name="intonaco chiaro" area="house"/>
  <color symbol="V" value="#b3543b" name="mattone fienile" area="barn"/>
  <color symbol="Z" value="#8c877e" name="pietra grigia" area="tower"/>
  <color symbol="M" value="#8c877e" name="merlo in pietra" area="tower"/>
  <color symbol="U" value="#2b2927" name="feritoia" area="tower"/>

  <color symbol="R" value="#b84a32" name="coppi rossi" area="house"/>
  <color symbol="P" value="#9e432e" name="tetto fienile" area="barn"/>
  <color symbol="C" value="#7d3525" name="comignolo" area="house"/>
  <color symbol="J" value="#6e4f32" name="trave di legno" area="porch"/>
  <color symbol="L" value="#8ab4c9" name="vetro finestra" area="house"/>
  <color symbol="Q" value="#4b7fa8" name="acqua del pozzo" area="yard"/>

  <color symbol="O" value="#7a5230" name="porta di legno" area="house"/>
  <color symbol="o" value="#4d321c" name="assi della porta" area="house"/>
  <color symbol="N" value="#8c877e" name="stipite in pietra" area="house"/>
  <color symbol="k" value="#9c7a52" name="gradino di legno" area="house"/>
  <color symbol="T" value="#9c7a52" name="scala" area="house"/>

  <color symbol="#20" hidden="True" name="porta aperta" area="house"/>
  <color symbol="#21" hidden="True" name="assi aperte" area="house"/>

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
It does not pass: taglia Enorme, seme 1: porta: 25 × 6 voxel (1,25 × 0,30 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the leaf the action open takes away: its width and its height
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, p pavimento portico, c aia, r sentiero, f tavolato, F solaio, W intonaco chiaro, V mattone fienile, P tetto fienile, R coppi rossi, J trave di legno, L vetro finestra, Z pietra grigia, Q acqua del pozzo, C comignolo, o assi della porta, O porta di legno, N stipite in pietra, M merlo in pietra, k gradino di legno, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEE
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE
EEEJJccccccccccccccccccccccccccccMMMMccccccccJJEEE
EEEJJccccccccccccccccccccccccccccMZZMccccccccJJEEE
EEEJJcccccccccccccccccccccccccccccQQQccccccccJJEEE
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE
EEEJJcccccccccccccccccccccccccMZZZZZZZcccccccJJEEE
EEEJJccPPPPPPPPPPcccccccccccccZZZZZZZZcccccccJJEEE
EEEJJcPPPPPPPPPPPcccccccccccccZZZZZZZZcccccccJJEEE
EEEJJcPPPPPPPPPPPWWWWWWWWWWWWWZZZZZZZZcccccccJJEEE
EEEJJcPPPPPPPPPPPWWWWWWWWWWWWWMZZZZZZZcccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRRRRRRRRRZZZZZcccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRRRRRRRRRZZZZZcccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRRRRRRRRRRZZZZcccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRRRRRRRRRRWccccccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRRRRRRRRRRWccccccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRRRRRRRRRRWccccccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRRRRRRRRRRWccccccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRWRRRRRRRRWccccccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRWRRRRRRRRWccccccccccJJEEE
EEEJJcPPPPPPPPPPPWRRRRRRRWRRRRRRRRWccccccccccJJEEE
EEEJJccccccccccccWRRRRRRRWRRRRRRRRWccccccccccJJEEE
EEEJJccccccccccccWRRRRRRRWRRRRRRRRWccccccccccJJEEE
EEEJJccccccccccccWRRRRRRRWRRRRRRRRWccccccccccJJEEE
EEEJJccccccccccccWRRRRRRRWWRRRRRRWWccccccccccJJEEE
EEEJJccccccccccccWWWWWWWWWWWWWWWWWWccccccccccJJEEE
EEEJJccccccccccccJJJJJJJJJJJJJJJJJJccccccccccJJEEE
EEEJJccccccccccccJJJJJJJJJJJJJJJJJJccccccccccJJEEE
EEEJJccccccccccccJJJJJJJJJJJJJJJJJJccccccccccJJEEE
EEEJJccccccccccccrrrrrrrrrrrrrrrrrrccccccccccJJEEE
EEEJJccccccccccccrrrrrrrrrrrrrrrrrrccccccccccJJEEE
EEEJJccccccccccccrrrrrrrrrrrrrrrrrrccccccccccJJEEE
EEEJJccccccccccccrrrrrrrrrrrrrrrrrrccccccccccJJEEE
EEEJJccccccccccccrrrrrrrrrrrrrrrrrrccccccccccJJEEE
EEEJJJJJJJJJJJJJJrrrrrrrrrrrrrrrrrrJJJJJJJJJJJJEEE
EEEJJJJJJJJJJJJJJrrrrrrrrrrrrrrrrrrJJJJJJJJJJJJEEE
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00022222222222222222222222222222222222222222222000
00022222222222222222222222222222222222222222222000
00022222222222222222222222222222222222222222222000
00022000000000000000000000000000000000000000022000
00022000000000000000000000000000044440000000022000
00022000000000000000000000000000044440000000022000
00022000000000000000000000000000044440000000022000
00022000000000000000000000000000044440000000022000
00022000000000000000000000000000000000000000022000
000220000000000000000000000000nnnnnnnnn00000022000
000220bbbbbbbbbbb0000000000000nllllllln00000022000
000220bcccccccccb0000000000000nllllllln00000022000
000220bcccccccccb2222222222222nllllllln00000022000
000220bccdddddccb2jjjjjjjjjjjjnnnnlllln00000022000
000220bccdddddccb2jjjjjmmjjjjjjjjnlllln00000022000
000220bccdddddccb2jjkkkmkkkkkkjjjnlllln00000022000
000220bccdddddccb2jjkkkkkkkkkkkkjnlllln00000022000
000220bccdddddccb2jjkklllkklllkkjnnnnnn00000022000
000220bccdddddccb2jjkklllkklllkkjj2000000000022000
000220bccdddddccb2jjkkllkkkkllkkjj2000000000022000
000220bccdddddccb2jjkklkkjjkklkkjj2000000000022000
000220bcccccccccb2jjkkkkjjjjkkkkjj2000000000022000
000220bcccccccccb2jjkkkkjjjjkkkkjj2000000000022000
000220bbbbbbbbbbb2jjkkkkjjjjkkkkjj2000000000022000
000220bbbbbbbbbbb2jjkkkkjjjjkkkkjj2000000000022000
000220000000000022jjkkkkjjjjkkkkjj2000000000022000
000220000000000022jjjjjjjjjjjjjjjj2000000000022000
000220000000000022jjjjjjjjjjjjjjjj2000000000022000
00022000000000002222222222222222222000000000022000
0002200000000000aaaaaaaaaaaaaaaaaaa000000000022000
0002200000000000aaaaaaaaaaaaaaaaaaa000000000022000
0002200000000000aaaaaaaaaaaaaaaaaaa000000000022000
0002200000000000aaaaaaaaaaaaaaaaaaa000000000022000
00022000000000000000000000000000000000000000022000
00022000000000000000000000000000000000000000022000
00022000000000000000000000000000000000000000022000
00022000000000000000000000000000000000000000022000
00022222222222222000000000000000000222222222222000
00022222222222222000000000000000000222222222222000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
..............................MM.MMM.M............
.......................C......MM.MMM.M............
......................RRR..RRRZZZZZZZZ............
....................RRRRRRRRRRRRZZZZZZ............
...................RRRRRRRRRRRRRRZZZZZ............
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..........PPPP................ZZZZZZZZ............
........PPPPPPPP..............ZZZZZZZZ............
.......VVVVVVVVVV.............ZZZZZZZZ............
.......VVVVVVVVVV.............ZZZZZZZZ............
.......VVVVVVVVVV.........k...ZZZZZZZZ............
.......VVVVVVVVVV.........k...ZZZZZZZZ............
.......VVVVVVVVVV.........k...ZZZZZZZZ............
.......VVVVVVVVVV........kk...ZZZZZZZZ............
.......WWWWWWVVLL........kk...ZZZZZZZZ............
.......LLLLLLVLLL.......kkk...ZZZZZZZZ............
.......LLLLLLVLLL.......kkk...ZZZZZZZZ............
.......LLLLLLVLLL......kkkk...ZZZZZZZZ............
....JJJJJJJJJJJJJWWWWWWkkkkWWWZZZZZJJJJJJJJJJJ....
...JJJJJJJJJJJJJJWWWWWWNooooOWWWWWWJJJJJJJJJJJJ...
...JJJJJJJJJJJJJJWWWWWWroooorWWWWWWJJJJJJJJJJJJ...
```
Right side (looking from the right):
```
...............MMMMMMMM...........................
...............MMMMMMCM...........................
...............ZZZZZZZZRRR........................
...............ZZZZZZZZRRRRRRRRR..................
...............ZZZZZZZZRRRRRRRRRR.................
...............ZZZZZZZZ...........................
...............ZZZZZZZZ...........................
...............ZZZZZZZZ...........................
...............ZZZZZZZZ...........................
...............ZZZZZZZZ...........................
...............ZZZZZZZZZ..........................
...............ZZZZZZZZPPPP.......................
...............ZZZZZZZZPPPPPP.....................
...............ZZZZZZZZVVVVVVV....................
...............ZZZZZZZZVVVVVVV....................
...............ZZZZZZZZVVVVVVV....................
...............ZZZZZZZZVVVVVVV....................
...............ZZZZZZZZVVVVVVV....................
...............ZZZZZZZZVVVVVVV....................
...............ZZZZZZZZVLLWWLL....................
...............ZZZZZZZZVLLLLLL....................
..........MMM..ZZZZZZZZVLLLLLL....................
..........MMM..ZZZZZZZZVLLLLVV....................
.......JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
.......JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
......EJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
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
..................................MM..............
.................................M..M.............
..................................................
..................................................
..................................................
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
.......VLVVLLWWLL.............ZZZZZZZZ............
.......VL.....................ZZZZZZZZ............
.......V......................ZZZZZZZZ............
.......V...............kkkk......ZZZZZ............
.......L...............kkkk......ZZZZZ............
.......L...............kkkk......ZZZZZ............
.......V..........................................
.......L..........................................
.......L..........................................
.......W..........................................
.......W..........................................
.......VLLLLLVLL..................................
.......VLLLLVVLLL.................................
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
..................................................
..................................................
..................................................
..................................................
..................................................
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..............................ZZZZZZZZ............
..........PPPP...................ZZZZZ............
..........PPPP...................ZZZZZ............
..........PPPP...................ZZZZZ............
..........PPPP....................................
..........PPPP....................................
..........PPPP....................................
..........PPPP....................................
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
..............................M...................
..................................................
..................................................
..................................................
..............................M...................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000222222222222222222222222222222222222222222220
EEEEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEE   00000222222222222222222222222222222222222222222220
EEEEEJJcccccccccccccccccccccccccccccccccccccccJJEE   00000222222222222222222222222222222222222222222220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccMZZZZZZZMcccccccccccccccccccccccccJEE   0000022000000nnlnlnlnn0000000000000000000000002220
EEEEEJJccccccZZZZZZZZZcccccccccccccccccccccccccJEE   0000022000000nllllllln0000000000000000000000002220
EEEEEJJccccccZZZZZZZZZcccccccccccccccccccccccccJEE   0000022000000nllllllln0000000000000000000000002220
EEEEEJJccccccZZZZZZZZZWWWWWWWWWWWWWccccccccccccJEE   0000022000000nllllllln2222222222222000000000002220
EEEEEJJccccccZZZZZZZZMWWWWWWWWWWWWWccccccccccccJEE   0000022000000nllllnlnnjjjjjjjjjjjj2000000000002220
EEEEEJJccccccZZZZZRRRRRRRRRRRRRRRRWccccccccccccJEE   0000022000000nllllnjjjjjjjjjjjjjjj2000000000002220
EEEEEJJccccccZZZZZRRRRRRRRRRRRRRRRWccccccccccccJEE   0000022000000nllllnjjkkkkkkkkkkkjj2000000000002220
EEEEEJJcccccccZZZZRRRRRRRRRRRRRRRRWccccccccccccJEE   0000022000000nllllnmkkkkkkkkkkkkjj2000000000002220
EEEEEJJccccccccccWRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   0000022000000nnlnnnmkklllkklllkkjjbbbbbbbbbbbb2220
EEEEEJJccccccccccWRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkklllkklllkkjjbbccccccccbb2220
EEEEEJJccccccccccWRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkllkkkkllkkjjbbccccccccbb2220
EEEEEJJccccccccccWRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkklkkjjkklkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkkkjjjjkkkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkkkjjjjkkkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkkkjjjjkkkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkkkjjjjkkkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkkkjjjjkkkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjjjjjjjjjjjjjjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRWWRRRRRRWWPPPPPPPPPPccJEE   000002200000000022jjjjjjjjjjjjjjjjbbccddddccbb2220
EEEEEJJccccccccccWWWWWWWWWWWWWWWWWWPPPPPPPPPPccJEE   0000022000000000222222222222222222bbccccccccbb2220
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJPPPPPPPPPPccJEE   0000022000000000aaaaaaaaaaaaaaaaaabbccccccccbb2220
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJPPPPPPPPPPccJEE   0000022000000000aaaaaaaaaaaaaaaaaabbbbbbbbbbbb2220
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE   0000022000000000aaaaaaaaaaaaaaaaaaa000000000002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrccccMMccccccJEE   0000022000000000aaaaaaaaaaaaaaaaaaa000444400002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrcccMQQMcccccJEE   00000220000000000000000000000000000000444400002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrcccMQQMcccccJEE   00000220000000000000000000000000000000444400002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrccccMMccccccJEE   00000220000000000000000000000000000000444400002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJJJJJJJJJJJrrrrrrrrrrrrrrrrrrJJJJJJJJJJJJJEE   00000222222222222000000000000000000222222222222220
EEEEEJJJJJJJJJJJJrrrrrrrrrrrrrrrrrrJJJJJJJJJJJJJEE   00000222222222222000000000000000000222222222222220
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000222222222222222222222222222222222222222222220
EEEEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEE   00000222222222222222222222222222222222222222222220
EEEEEJJcccccccccccccccccccccccccccccccccccccccJJEE   00000222222222222222222222222222222222222222222220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJcccccccccccccccccccccMMMMcccccccccccccccJEE   00000220000000000000000000004444000000000000002220
EEEEEJJcccccccccccccccccccccMZZMcccccccccccccccJEE   00000220000000000000000000004444000000000000002220
EEEEEJJccccccccccccccccccccccQQQcccccccccccccccJEE   00000220000000000000000000004444000000000000002220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000004444000000000000002220
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccMZZZZZZZMcccccccccccccccccccccccccJEE   0000022000000nnlnlnlnn0000000000000000000000002220
EEEEEJJccccccZZZZZZZZZcccccccccccccPPPPPPPPPPccJEE   0000022000000nllllllln000000000000bbbbbbbbbbbb2220
EEEEEJJccccccZZZZZZZZZcccccccccccccPPPPPPPPPPccJEE   0000022000000nllllllln000000000000bbccccccccbb2220
EEEEEJJccccccZZZZZZZZZWWWWWWWWWWWWWPPPPPPPPPPccJEE   0000022000000nllllllln222222222222bbccccccccbb2220
EEEEEJJccccccZZZZZZZZMWWWWWWWWWWWWWPPPPPPPPPPccJEE   0000022000000nllllnlnnjjjjjjjjjjjjbbccddddccbb2220
EEEEEJJccccccZZZZZRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   0000022000000nllllnjjjjjjjjjjjjjjjbbccddddccbb2220
EEEEEJJccccccZZZZZRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   0000022000000nllllnjjkkkkkkkkkkkjjbbccddddccbb2220
EEEEEJJcccccccZZZZRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   0000022000000nllllnjkkkkkkkkkkkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   0000022000000nnlnnnjkklllkklllkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkklllkklllkkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkllkkkkllnkjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRRRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkklkkjjkklnnjjbbccddddccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkkkjjjjkkkkjjbbccccccccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkkkjjjjkkkkjjbbccccccccbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWPPPPPPPPPPccJEE   000002200000000022jjkkkkjjjjkkkkjjbbbbbbbbbbbb2220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWccccccccccccJEE   000002200000000022jjkkkkjjjjkkkkjj2bbbbbbbbbb02220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWccccccccccccJEE   000002200000000022jjkkkkjjjjkkkkjj2000000000002220
EEEEEJJccccccccccWRRRRRRRWRRRRRRRRWccccccccccccJEE   000002200000000022jjjjjjjjjjjjjjjj2000000000002220
EEEEEJJccccccccccWRRRRRRRWWRRRRRRWWccccccccccccJEE   000002200000000022jjjjjjjjjjjjjjjj2000000000002220
EEEEEJJccccccccccWWWWWWWWWWWWWWWWWWccccccccccccJEE   00000220000000002222222222222222222000000000002220
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE   0000022000000000aaaaaaaaaaaaaaaaaaa000000000002220
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE   0000022000000000aaaaaaaaaaaaaaaaaaa000000000002220
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE   0000022000000000aaaaaaaaaaaaaaaaaaa000000000002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrccccccccccccJEE   0000022000000000aaaaaaaaaaaaaaaaaaa000000000002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJccccccccccrrrrrrrrrrrrrrrrrrccccccccccccJEE   00000220000000000000000000000000000000000000002220
EEEEEJJJJJJJJJJJJrrrrrrrrrrrrrrrrrrJJJJJJJJJJJJJEE   00000222222222222000000000000000000222222222222220
EEEEEJJJJJJJJJJJJrrrrrrrrrrrrrrrrrrJJJJJJJJJJJJJEE   00000222222222222000000000000000000222222222222220
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.26 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 172 nodi, 596 passi, finito in 583 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba, h=honey, w=white, s=slate, d=dead, dark, a=alive, gray, p=pavimento portico, v=olive, t=teal, c=aia, x=x, r=sentiero, q=aqua, y=yellow, f=tavolato, F=solaio, W=intonaco chiaro, V=mattone fienile, P=tetto fienile, R=coppi rossi, J=trave di legno, K=pinK, L=vetro finestra, Z=pietra grigia, C=comignolo, o=assi della porta, O=porta di legno, N=stipite in pietra, M=merlo in pietra, T=scala, k=gradino di legno, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), b=black.
Alla fine: Z 37840, J 17150, V 12838, W 7043, c 6775, E 6725, R 6121, P 4700, k 2720, L 2584, f 2450, r 1925, F 1540, o 1014, M 690, U 600, p 550, N 60, C 54, Q 36, O 36.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-41 all×26, prl×1, one×4: 658 celle x2-27 y4-29 z0, passi 2-72
   #46 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 73
#48-60 all×6: 15825 celle x50-104 y55-104 z0-6, passi 74-88
    #61 all . h → h . passi=31: ×31, 93000 celle x55-99 y60-99 z1-32, passi 89-119, h→. 46500, .→h 46500
#62-63 all×2: 15400 celle x55-99 y60-99 z2-33, passi 120-150
    #64 all . h → h . (+1) passi=31: ×31, 105400 celle x55-99 y60-99 z33-64, passi 151-181, h→. 46500, .→h 46500, s→. 6200, .→s 6200
      r1 . h → h . ×46500; r2 . s → s . ×6200
#65-66 prl×1, all×1: 8900 celle x20-99 y50-99 z0-64, passi 182-190
    #67 all . v → v K passi=14: ×14, 12600 celle x20-49 y50-89 z8-22, passi 191-204, v→K 6300, .→v 6300
#68-70 all×2, prl×1: 16350 celle x20-49 y50-89 z0-38, passi 205-222
    #71 all . a → a . passi=37: ×37, 55500 celle x25-49 y55-84 z1-38, passi 223-259, a→. 27750, .→a 27750
    #72 prl a → P: ×1, 750 celle x25-49 y55-84 z38, passi 260, a→P 750
    #73 all . t → t Z passi=72: ×72, 75600 celle x90-114 y45-69 z0-72, passi 261-332, t→Z 37800, .→t 37800
#74-82 prl×1, all×2: 1273 celle x50-114 y45-114 z0-72, passi 333-335
    #85 all . y → y . passi=33: ×33, 36300 celle x50-104 y105-114 z1-34, passi 336-368, y→. 18150, .→y 18150
#86-88 prl×2, all×1: 1894 celle x50-109 y30-114 z0-34, passi 369-380
    #89 all . x → x J passi=8: ×8, 33200 celle x10-139 y20-134 z0-8, passi 381-388, x→J 16600, .→x 16600
#90-127 prl×2, all×8: 9364 celle x10-139 y20-134 z0-32, passi 389-444
#128-163 prl×5, all×13, one×1: 12839 celle x20-114 y30-104 z1-77, passi 445-553
#164-172 all×7, prl×1, one×1: 11876 celle x19-100 y49-104 z6-76, passi 554-596
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#13 prl d/h → h/*: le celle cercate c'erano, ma mai disposte come nel pattern
#29 one hwh/awa → *i*/*i* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all ttt/ttt/ttt → ***/t*t/***: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all t.t → *u*: le celle cercate c'erano, ma mai disposte come nel pattern
#34 all u.t → *u*: in quel momento nella griglia non c'erano celle "u"
#42 all xEEEEEEE → *ggggg** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#43 all gE/*g → *g/**: in quel momento nella griglia non c'erano celle "g"
#44 one gggg/gggg/gggg/gggg → ****/*yy*/*yy*/**** passi=6: in quel momento nella griglia non c'erano celle "g"
#50 all . i → i O passi=1: in quel momento nella griglia non c'erano celle "i"
#51 all . i → i W passi=5: in quel momento nella griglia non c'erano celle "i"
#54 all . [wdi] → * W passi=12: in quel momento nella griglia non c'erano celle "wdi"
… e altri 53
Fix it and answer with the whole program.

## Risposta

<!--
  Concept: Fattoria (Farmstead)
  Parts & Letters:
  - Main farmhouse (h: interior floor, w: masonry wall, s: stair zone, d: front door) around centre H, two storeys (64 high) with hipped tile roof.
  - Front porch / lean-to (p: covered porch with corner posts and roof at 34) along the front wall and entry door.
  - Attached barn / hayloft wing (a: barn floor, v: barn brick wall, i: internal doorway) on one side of the farmhouse (chosen by seed).
  - Stone silo / dovecote tower (t: tower wall, u: tower interior) attached to a corner of the farmhouse, crowned with battlements & slits.
  - Farmyard (c: dirt/cobble yard, x: wooden fence around yard, r: road to the front edge, q: stone well in the yard).
  - At Gargantuan (where ground extends beyond the fence): plowed crop fields (g: field) and orchard trees (y: orchard/trees).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapviutcxrqgy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Farmhouse main body around H: 9 wide (x), 9 or 10 deep (y) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Front door (3 cells wide, centered on H) and road straight to the front edge (+y) -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/[hw]" out="*/d" symmetry="()"/>
      <prl in="d/w" out="h/*" symmetry="()"/>
      <prl in="d/h" out="h/*" symmetry="()"/>
      <prl in="H" out="h"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Front porch (lean-to, 2 cells deep) along the front wall of the farmhouse -->
      <all in="[wd]/[Er]" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[Er]" out="*/p" symmetry="()" steps="1"/>

      <!-- Road continues from porch to the front edge (+y) -->
      <all in="p/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Stair zone inside farmhouse: along back wall, 2 cells landing before small-x, 4 cells long, 2 wide -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Attached Barn wing on one side (x) of the farmhouse -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Internal passage between farmhouse and barn -->
      <one in="hwh/awa" out="***/*i*" symmetry="(xy)" steps="1"/>
      <all in="iw" out="*i" symmetry="(xy)" steps="1"/>

      <!-- Silo / Dovecote tower at a back corner of the farmhouse -->
      <one in="EE/Ew" out="**/*t" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>
      <all in="ttt/ttt/ttt" out="***/tht/***"/>
      <all in="twt/hhh" out="ttt/***" symmetry="(xy)"/>
      <all in="tvt/aaa" out="ttt/***" symmetry="(xy)"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Well in a 4x4 patch of the yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>

      <!-- Wooden fence around the farmyard -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- At Gargantuan (where 6 cells of ground go on past the fence): plowed fields (g) and orchard (y) -->
      <all in="xEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEE" out="*gg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="gggg/gggg/gggg/gggg" out="****/*yy*/*yy*/****" steps="6"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdapviutcxrqgyzbYfFWVPRJKLZQYGCDoONMTkU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="q" out="qqqqq/qQQQq/qQQQq/qQQQq/qqqqq"/>
      <rule in="g" out="ggggg/DDDDD/ggggg/DDDDD/ggggg"/>
      <rule in="y" out="ggggg/gYYYg/gYYYg/gYYYg/ggggg"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WVZ"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Z"/>

        <!-- B. THE HEIGHTS -->

        <!-- 1. Farmhouse walls (w, d, i): 2 storeys = 64 high, topped with R -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B i" out="i O" steps="1"/>
        <all in="B w" out="w W" steps="1"/>
        <all steps="5">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
          <rule in="B i" out="i W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
          <rule in="B i" out="i W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
          <rule in="B i" out="i W"/>
        </all>
        <all steps="6">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
          <rule in="B i" out="i W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w K"/>
          <rule in="B d" out="d K"/>
          <rule in="B i" out="i K"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
          <rule in="B i" out="i W"/>
        </all>
        <prl>
          <rule in="w" out="R"/>
          <rule in="d" out="R"/>
          <rule in="i" out="R"/>
        </prl>

        <!-- 2. Farmhouse interior (h) and stair zone (s): floor at z=0, slab at z=32, ceiling R at z=64 -->
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

        <!-- 3. Barn wing: walls (v) and floor (a), 1 tall storey = 38 high, topped with P -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v K" steps="14"/>
        <all in="B v" out="v V" steps="16"/>
        <prl in="v" out="P"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="37"/>
        <prl in="a" out="P"/>

        <!-- 4. Silo / Dovecote tower: walls (t) 72 high -->
        <all in="B t" out="t Z" steps="72"/>
        <prl in="t" out="B"/>

        <!-- 5. Front porch (lean-to): floor p, corner posts b rising 33, roof J at z=34 -->
        <all in="b[pb]" out="p*" symmetry="(xy)"/>
        <all in="B p" out="z p" steps="1"/>
        <all in="B b" out="b J" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B z" out="z B" steps="33"/>
        <prl in="z" out="J"/>

        <!-- 6. Well (q wall, Q water), Fence (x), Orchard trees (Y) -->
        <all in="B q" out="q Z" steps="10"/>
        <prl in="q" out="B"/>
        <all in="B x" out="x J" steps="8"/>
        <prl in="x" out="B"/>

        <all in="B Y" out="Y J" steps="12"/>
        <all in="B Y" out="Y G" steps="10"/>
        <prl in="Y" out="G"/>
        <all in="GB" out="*G" steps="2"/>

        <!-- C. THE FULL SCALE: DOORS, PARTS, WINDOWS, ROOFS -->

        <!-- Included parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the window bands K (upper farmhouse storey and barn) -->
        <one steps="18">
          <rule in="BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LKKKKB" out="*LLLL*"/>
        <all in="K W" out="W *"/>
        <all in="K V" out="V *"/>
        <prl in="K" out="W"/>

        <!-- Roofs: eaves and hipped roofs on farmhouse (R) and barn (P) -->
        <all in="RB" out="*R" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>

        <all in="PB" out="*P" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **P**/**P**/PPPPP/**P**/**P**" out="*****/*****/**P**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- Brick chimney on the farmhouse roof -->
        <one in="B B R" out="* C *" steps="1" symmetry="()"/>
        <all in="B C" out="C *" steps="10"/>
        <all in="CB" out="*C" symmetry="(xy)" steps="1"/>
      </sequence>
    </map>
  </map>

  <!-- Palette & Areas -->
  <color symbol="E" value="#7a9a55" name="erba" area="field"/>
  <color symbol="c" value="#c2b088" name="aia" area="yard"/>
  <color symbol="r" value="#b09e78" name="sentiero" area="yard"/>
  <color symbol="p" value="#b59267" name="pavimento portico" area="porch"/>
  <color symbol="g" value="#735838" name="campo arato" area="field"/>
  <color symbol="D" value="#5e462b" name="solco" area="field"/>
  <color symbol="G" value="#4f783b" name="chioma albero" area="orchard"/>

  <color symbol="f" value="#bfa074" name="tavolato" area="house"/>
  <color symbol="F" value="#a6885e" name="solaio" area="house"/>
  <color symbol="W" value="#e3d6be" name="intonaco chiaro" area="house"/>
  <color symbol="V" value="#b3543b" name="mattone fienile" area="barn"/>
  <color symbol="Z" value="#8c877e" name="pietra grigia" area="tower"/>
  <color symbol="M" value="#8c877e" name="merlo in pietra" area="tower"/>
  <color symbol="U" value="#2b2927" name="feritoia" area="tower"/>

  <color symbol="R" value="#b84a32" name="coppi rossi" area="house"/>
  <color symbol="P" value="#9e432e" name="tetto fienile" area="barn"/>
  <color symbol="C" value="#7d3525" name="comignolo" area="house"/>
  <color symbol="J" value="#6e4f32" name="trave di legno" area="porch"/>
  <color symbol="L" value="#8ab4c9" name="vetro finestra" area="house"/>
  <color symbol="Q" value="#4b7fa8" name="acqua del pozzo" area="yard"/>

  <color symbol="O" value="#7a5230" name="porta di legno" area="house"/>
  <color symbol="o" value="#4d321c" name="assi della porta" area="house"/>
  <color symbol="N" value="#8c877e" name="stipite in pietra" area="house"/>
  <color symbol="k" value="#9c7a52" name="gradino di legno" area="house"/>
  <color symbol="T" value="#9c7a52" name="scala" area="house"/>

  <color symbol="#20" hidden="True" name="porta aperta" area="house"/>
  <color symbol="#21" hidden="True" name="assi aperte" area="house"/>

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
