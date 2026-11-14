# model.sculpt · gemini-4-argon · 58 s · 1 immagini

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

Your program:
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
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: La torre merlata ha un aspetto troppo militare e poco agricolo.; Il cortile interno risulta spoglio e le pareti di recinzione sono molto uniformi.
Advice: Sostituire la torre difensiva con una struttura rurale come un fienile o un silo.; Aggiungere elementi caratteristici nel cortile come una tettoia, carri o depositi.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, p pavimento portico, c aia, r sentiero, f tavolato, F solaio, W intonaco chiaro, V mattone fienile, P tetto fienile, R coppi rossi, J trave di legno, L vetro finestra, Z pietra grigia, Q acqua del pozzo, C comignolo, o assi della porta, O porta di legno, N stipite in pietra, M merlo in pietra, k gradino di legno, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEE
EEEEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEE
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE
EEEEEJJccccccccccccccccccccccccccccccccccccccccJEE
EEEEEJJccccccccccccccccccccQMQcccccccccccccccccJEE
EEEEEJJccccccccZcZcZcccccccMZMcccccccccccccccccJEE
EEEEEJJcccccccZZZZZZZZcccccQMMcccccccccccccccccJEE
EEEEEJJccccccZZRRZRRZZcccccccccccccccccccccccccJEE
EEEEEJJcccccccZRZZZRZZRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJccccccZZZZZZZZZRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccZRZZMRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJccccccZZRRZRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccZZZZRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccZZZZRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRccccccccccccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRccccccccccccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRccccccccccccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRccccccccccccJEE
EEEEEJJcccccccccRRRRRRRRRRRRRRRRRRRccccccccccccJEE
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE
EEEEEJJccccccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE
EEEEEJJccccccccrrrrrrrrrrrrrrrrrrrrrcccccccccccJEE
EEEEEJJccccccccrrrrrrrrrrrrrrrrrrrrrrccccccccccJEE
EEEEEJJccccccccrrrrrrrrrrrrrrrrrrrrrrccccccccccJEE
EEEEEJJccccccccrrrrrrrrrrrrrrrrrrrrrrccccccccccJEE
EEEEEJJccccccccrrrrrrrrrrrrrrrrrrrrrrccccccccccJEE
EEEEEJJJJJJJJJJrrrrrrrrrrrrrrrrrrrrrrJJJJJJJJJJJEE
EEEEEJJJJJJJJJJrrrrrrrrrrrrrrrrrrrrrrJJJJJJJJJJJEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000222222222222222222222222222222222222222222220
00000222222222222222222222222222222222222222222220
00000220000000000000000000000000000000000000002220
00000220000000000000000000000000000000000000002220
00000220000000000000000000000000000000000000002220
00000220000000000000000000000000000000000000002220
00000220000000000000000000444400000000000000002220
00000220000000000000000000404400000000000000002220
0000022000000nnlnlnlnn0000442400000000000000002220
0000022000000nllllllln0000444400000000000000002220
0000022000000lljllljll0000000000000000000000002220
0000022000000nlllllllnjjjjjjjjjjjjjjbbbbbbbbbb2220
0000022000000llllllllnjjjjjjjjjjjjjjccccccccbb2220
0000022000000nllllnlnnjkkkkkkkkkkkjjccccccccbb2220
0000022000000lljllljjkkkkkkkkkkkkkjjccddddccbb2220
0000022000000nllllnjkkklllllllllkkjjccddddccbb2220
0000022000000nnnnnnkklllllllllllkkjjccddddccbb2220
0000022000000000jjjkkllmmmmmmmllkkjjccddddccbb2220
0000022000000000jjkkllmmmmmmmmllkkjjccddddccbb2220
0000022000000000jjkkllmmmmmmmmllkkjjccddddccbb2220
0000022000000000jjkkllmmmnnmmmllkkjjccddddccbb2220
0000022000000000jjkkllmmmnnmmmllkkjjccddddccbb2220
0000022000000000jjkkllmmmmmmmmllkkjjccccccccbb2220
0000022000000000jjnnllmmmmmmmmllkkjjccccccccbb2220
0000022000000000jjkkllmmmmmmmmllkkjjbbbbbbbbbb2220
0000022000000000jjkkllllllllllllkkjjbbbbbbbbb02220
0000022000000000jjkkllllllllllllkkjj00000000002220
0000022000000000jjkkkkkkkkkkkkkkkkjj00000000002220
0000022000000000jjkkkkkkkkkkkkkkkkjj00000000002220
0000022000000000jjjjjjjjjjjjjjjjjjjj00000000002220
0000022000000000jjjjjjjjjjjjjjjjjjj000000000002220
0000022000000000aaaaaaaaaaaaaaaaaaa000000000002220
0000022000000000aaaaaaaaaaaaaaaaaaa000000000002220
0000022000000000aaaaaaaaaaaaaaaaaaa000000000002220
00000220000000000000000000000000000000000000002220
00000220000000000000000000000000000000000000002220
00000220000000000000000000000000000000000000002220
00000220000000000000000000000000000000000000002220
00000222222222200000000000000000000022222222222220
00000222222222200000000000000000000022222222222220
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.............MMMMMMCMM..RRR.......................
.............MMMMMMCMMRRRRRRR.....................
.............ZZZZZZCRRRRRRRRRRR...................
.............ZZZZZRRRRRRRRRRRRRRR.................
.............ZZZZRRRRRRRRRRRRRRRRRR...............
.............ZZZZWWWWWWWWWWWWWWWWWW...............
.............ZZZZWWWWWWWWWWWWWWWWWW...............
.............ZZZZWWWWWWWWWWWWWWWWWW...............
.............ZZZZWWWWWWWWWWWWWWWWWW...............
.............ZZZZWWWWWWWWLLWLLWWWWW...............
.............ZZZZWWWWWWWWLLWLLWWWWW...............
.............ZZZZWWWWWWWWLWWWLWWWWW...PPPP........
.............ZZZZWWWWWWWWWWWWWWWWWW.PPPPPPPP......
.............ZZZZWWWWWWWWWWWWWWWWWWVVVVVVVVVV.....
.............ZZZZWWWWWWWWWWWWWWWWWWVVVVVVVVVV.....
.............ZZZZWWWWWWWWWWWWWWWWWWVVVVVVVVVV.....
.............ZZZZWWWWWWNooooOWWWWWWVVVVVVVVVV.....
.............ZZZZWWWWWWNooooOWWWWWWVVVVVVVVVV.....
.............ZZZZWWWWWWNooooOWWWWWWVVVVVVVVVV.....
.............ZZZZWWWWWWNooooOWWWWWWVVWWWWVVVV.....
.............ZZZZWWWWWWNooooOWWWWWWVVLLLLVVVV.....
.............ZZZZWWWWWWNooooOWWWWWWVVLLLLVVVV.....
.............ZZZZWWWWWWNooooOWWWWWWVVLLLLVVVV.....
.....JJJJJJJJJJZZWWWWWWNooooOWWWWWWVVJJJJJJJJJJJ..
.....JJJJJJJJJJZZWWWWWWNooooOWWWWWWVVJJJJJJJJJJJ..
.....JJJJJJJJJJZZWWWWWWroooorWWWWWWVVJJJJJJJJJJJE.
```
Right side (looking from the right):
```
............................C.....................
.............MM.MMM.MM..RRR.C.....................
.............MM.MMM.MMRRRRRRR.....................
.............ZZZZZZZRRRRRRRRRRR...................
.............ZZZZZRRRRRRRRRRRRRRR.................
.............ZZZZRRRRRRRRRRRRRRRRRR...............
.............ZZZZWWWWWWWWWWWWWWWWWW...............
.............ZZZZWWWWWWWWWWWWWWWWWW...............
.............ZZZZWWWWWWWWWWWWWWWWWW...............
.............ZZZZWWWWWWWWWWWWWWWWWW...............
.............ZZZZWWWLLWWWWWWWWWWWWW...............
.............ZZZZWWWLLWLLWWWWWWWWWW...............
.............ZZZZWWPPPPPPPPWWWWLLWW...............
.............ZZZZWPPPPPPPPPPPWWLLWW...............
.............ZZZZVVVVVVVVVVVVVWWWWW...............
.............ZZZZVVVVVVVVVVVVVWWWWW...............
.............ZZZZVVVVVVVVVVVVVWWWWW...............
.............ZZZZVVVVVVVVVVVVVWWWWW...............
.............ZZZZVVVVVVVVVVVVVWWWWW...............
.............ZZZZVVVVVVVVVVVVVWWWWW...............
.............ZZZZVVVWWVLLVVWWVWWWWW...............
.............ZZZZVVVLLVLLVVWWVWWWWW...............
............MMMZZVVVLLVVVVVLLVWWWWW...............
............MMMZZVVVVVVVVVVLLVWWWWW...............
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
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
..................................................
..................................................
..................................................
..............ZZZZZZZ........M....................
.............ZZZZZZZZZ......MM....................
.............ZZ..Z..ZZ............................
.............ZZ.ZZZ.ZZ............................
.............ZZZZZZZZZWWWWWWWWWWWWWVVVVVLLVVV.....
.............ZZ.ZZZ....kkkk......WW........VV.....
.............ZZ..Z.....kkkk......WW........VV.....
.............ZZZZZ.....kkkk......WW........LL.....
..............ZZZZ......kkk......WW........LL.....
.................W...............WW........VV.....
.................W...............WW........VV.....
.................W...............WW........VV.....
.................W...............WW........VV.....
.................W...............WW........VV.....
.................W.......oo......WW........LL.....
.................W.......oo......WWVVLLLLVVVL.....
.................W.......oo......WWVVLLLLVVVV.....
.................W.......oo......WW...............
.................W.......oo......WW...............
.................W.......oo......WW...............
.................WWWWWWoooooNWWWWWW...............
.................WWWWWWoooooNWWWWWW...............
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
..............ZZZZZZZ.............................
.............ZZZZZZZZZ............................
.............ZZ..Z..ZZ............................
.............ZZ.ZZZ.ZZ............................
.............ZZZZZZZZZWWWWLLLLWWWWW...............
.............ZZ.ZZZ..............WW...............
.............ZZ..Z...............WW...............
.............ZZZZZ...............WW...PPPP........
..............ZZZZ...............WW...PPPP........
.................W...............WW...PPPP........
.................W...............LL...PPPP........
.................W...............LL...PPPP........
.................W...............WW...PPPP........
.................W...............WW...PPPP........
.................W.......WW......WW...............
.................W.......WW......WW...............
.................W.......WW......WW...............
.................L.......WW......WW...............
.................L.......WW......LL...............
.................W.......WW......LL...............
.................WWWWWWWWWWWLLWWWWW...............
.................WWWWWWWWWWWLLWWWWW...............
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
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
........................RRRR......................
........................RRRR......................
........................RRRR......................
........................RRRR......................
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
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEE   00022222222222222222222222222222222222222222222000
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEE   00022222222222222222222222222222222222222222222000
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJccccccccccccccccccccccccccccccccccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJcccccccccccccccccccccccccMZZZZZZccccccccJJEEE   000220000000000000000000000000nnnnnnnnn00000022000
EEEJJcccccccccccccccccccccccccZZZZZZZZcccccccJJEEE   000220000000000000000000000000nllllllln00000022000
EEEJJcccccccccccccccccccccccccZZRZZRRZcccccccJJEEE   000220000000000000000000000000lljlljlll00000022000
EEEJJccPPPPPPPPPcRRRRRRRRRRRRRZZRZZRRZcccccccJJEEE   000220bbbbbbbbbbjjjjjjjjjjjjjjnlllljlln00000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRZZZZZRRZcccccccJJEEE   000220bcccccccccjjjjjjjjjjjjjjnlllljlll00000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRZZRRZcccccccJJEEE   000220bcccccccccjjkkkkkkkkkkkjnnnnljlln00000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRZZRRZcccccccJJEEE   000220bccdddddccjjkkkkkkkkkkkkjjjlljlll00000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRZZZZcccccccJJEEE   000220bccdddddccjjkklllllllllkkkjnlllln00000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRZZZZcccccccJJEEE   000220bccdddddccjjnkllllllllllkkjnnlnnn00000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   000220bccdddddccjjnkllmmmmmmmllkkjjj00000000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   000220bccdddddccjjkkllmmmmmmmmllkkjj00000000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   000220bccdddddccjjkkllmmmmmmmmllkkjj00000000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   000220bccdddddccjjkkllmmmnnmmmllkkjj00000000022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   000220bccdddddccjjkkllmmmnnmmmllkkjj00004444022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRRcccccQMQccJJEEE   000220bcccccccccjjkkllmmmmmmmmllkkjj00004404022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRRcccccMZMccJJEEE   000220bcccccccccjjkkllmmmmmmmmllkkjj00004244022000
EEEJJcPPPPPPPPPPRRRRRRRRRRRRRRRRRRRcccccMMQccJJEEE   000220bbbbbbbbbbjjkkllmmmmmmmmllkkjj00004444022000
EEEJJcccccccccccRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   000220bbbbbbbbbbjjkkllllllllllllkkjj00000000022000
EEEJJcccccccccccRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   0002200000000000jjkkllllllllllllkkjj00000000022000
EEEJJcccccccccccRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   0002200000000000jjkkkkkkkkkkkkkkkkjj00000000022000
EEEJJcccccccccccRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   0002200000000000jjkkkkkkkkkkkkkkkkjj00000000022000
EEEJJcccccccccccRRRRRRRRRRRRRRRRRRRccccccccccJJEEE   0002200000000000jjjjjjjjjjjjjjjjjjjj00000000022000
EEEJJccccccccccccJJJJJJJJJJJJJJJJJJccccccccccJJEEE   0002200000000000jjjjjjjjjjjjjjjjjjj000000000022000
EEEJJccccccccccccJJJJJJJJJJJJJJJJJJccccccccccJJEEE   0002200000000000aaaaaaaaaaaaaaaaaaa000000000022000
EEEJJccccccccccccJJJJJJJJJJJJJJJJJJccccccccccJJEEE   0002200000000000aaaaaaaaaaaaaaaaaaa000000000022000
EEEJJccccccccccrrrrrrrrrrrrrrrrrrrrrcccccccccJJEEE   0002200000000000aaaaaaaaaaaaaaaaaaa000000000022000
EEEJJccccccccccrrrrrrrrrrrrrrrrrrrrrrccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJccccccccccrrrrrrrrrrrrrrrrrrrrrrccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJccccccccccrrrrrrrrrrrrrrrrrrrrrrccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJccccccccccrrrrrrrrrrrrrrrrrrrrrrccccccccJJEEE   00022000000000000000000000000000000000000000022000
EEEJJJJJJJJJJJJrrrrrrrrrrrrrrrrrrrrrrJJJJJJJJJJEEE   00022222222222200000000000000000000022222222222000
EEEJJJJJJJJJJJJrrrrrrrrrrrrrrrrrrrrrrJJJJJJJJJJEEE   00022222222222200000000000000000000022222222222000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEE   00000000222222222222222222222222222222222222222220
EEEEEEEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEE   00000000222222222222222222222222222222222222222220
EEEEEEEEJJcccccccccccccccccccccccccccccccccccccJEE   00000000220000000000000000000000000000000000002220
EEEEEEEEJJcccccccccccccccccccccccccccccccccccccJEE   00000000220000000000000000000000000000000000002220
EEEEEEEEJJcccccccccccccccccccccccccccccccccccccJEE   00000000220000000000000000000000000000000000002220
EEEEEEEEJJcccccccccccccccMMQcccccccccccccccccccJEE   00000000220000000000000004444000000000000000002220
EEEEEEEEJJcccccccccccccccMZMcccccccccccccccccccJEE   00000000220000000000000004244000000000000000002220
EEEEEEEEJJcccccccccccccccQMQcccccccccccccccccccJEE   00000000220000000000000004404000000000000000002220
EEEEEEEEJJccccccccccccccccccccMZZZZZZccccccccccJEE   000000002200000000000000044440nnnnnnnnn00000002220
EEEEEEEEJJccccccccccccccccccccZZZZZZZZcccccccccJEE   000000002200000000000000000000nllllllln00000002220
EEEEEEEEJJccccccccccccccccccccZZRRRRRZcccccccccJEE   000000002200000000000000000000lljjjjlll00000002220
EEEEEEEEJJcccccccRRRRRRRRRRRRRZZRRRRZZcccccccccJEE   0000000022000000jjjjjjjjjjjjjjnllllllln00000002220
EEEEEEEEJJccccccRRRRRRRRRRRRRRZZZZZZZZcccccccccJEE   0000000022000000jjjjjjjjjjjjjjnllllllln00000002220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRZZZZZPPPPPPPccJEE   0000000022000000jjkkkkkkkknnkjnnnnllllnbbbbbbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRZZZZZPPPPPPPccJEE   0000000022000000jjkkkkkkkkknkkjjjllnnnncccccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRZPPPPPPPPPPccJEE   0000000022000000jjkklllllllllkkkjnnbbbccccccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRMPPPPPPPPPPccJEE   0000000022000000jjkkllllllllllkkjnnjcccdddccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllmmmmmmmllkkjjjccddddccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllmmmmmmmmllkkjjccddddccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllmmmmmmmmllkkjjccddddccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllmmmnnmmmllkkjjccddddccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllmmmnnmmmllkkjjccddddccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllmmmmmmmmllkkjjccddddccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllmmmmmmmmllkkjjccddddccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllmmmmmmmmllkkjjccccccccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllllllllllllkkjjccccccccbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRPPPPPPPPPPccJEE   0000000022000000jjkkllllllllllllkkjjbbbbbbbbbb2220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRccccccccccccJEE   0000000022000000jjkkkkkkkkkkkkkkkkjj00000000002220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRccccccccccccJEE   0000000022000000jjkkkkkkkkkkkkkkkkjj00000000002220
EEEEEEEEJJccccccRRRRRRRRRRRRRRRRRRRccccccccccccJEE   0000000022000000jjjjjjjjjjjjjjjjjjjj00000000002220
EEEEEEEEJJcccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE   0000000022000000jjjjjjjjjjjjjjjjjjj000000000002220
EEEEEEEEJJcccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE   0000000022000000aaaaaaaaaaaaaaaaaaa000000000002220
EEEEEEEEJJcccccccJJJJJJJJJJJJJJJJJJccccccccccccJEE   0000000022000000aaaaaaaaaaaaaaaaaaa000000000002220
EEEEEEEEJJJJJJJrrrrrrrrrrrrrrrrrrrrrcccccccccccJEE   0000000022222220aaaaaaaaaaaaaaaaaaa000000000002220
EEEEEEEEJJJJJJJrrrrrrrrrrrrrrrrrrrrrrccccccccccJEE   00000000222222200000000000000000000000000000002220
EEEEEggggggggggrrrrrrrrrrrrrrrrrrrrrrccccccccccJEE   00000000000000000000000000000000000000000000002220
EEEEEgggggGGGggrrrrrrrrrrrrrrrrrrrrrrccccccccccJEE   00000000006666000000000000000000000000000000002220
EEEEEDDDDDGGGGDrrrrrrrrrrrrrrrrrrrrrrccccccccccJEE   00000000066666000000000000000000000000000000002220
EEEEEgggggGGGggrrrrrrrrrrrrrrrrrrrrrrJJJJJJJJJJJEE   00000000066666000000000000000000000022222222222220
EEEEEgggggGGGGgrrrrrrrrrrrrrrrrrrrrrrJJJJJJJJJJJEE   00000000066666000000000000000000000022222222222220
EEEEEgggggggGggrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000006660000000000000000000000000000000000000
EEEEEDDDDDDDDDDrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.29 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 170 nodi, 694 passi, finito in 700 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba, h=honey, w=white, s=slate, d=dead, dark, a=alive, gray, p=pavimento portico, v=olive, t=teal, c=aia, x=x, r=sentiero, q=aqua, z=z, b=black, f=tavolato, F=solaio, W=intonaco chiaro, V=mattone fienile, P=tetto fienile, R=coppi rossi, J=trave di legno, K=pinK, L=vetro finestra, Z=pietra grigia, C=comignolo, o=assi della porta, O=porta di legno, N=stipite in pietra, M=merlo in pietra, T=scala, k=gradino di legno, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 54893, Z 32462, J 17150, R 16402, V 15138, c 6950, E 5925, o 5070, P 4478, L 3744, f 2750, k 2720, r 2275, F 1840, M 690, U 578, p 550, N 475, O 180, C 55, Q 36.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-44 all×28, prl×1, one×4: 693 celle x3-28 y3-29 z0, passi 2-75
   #51 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 76
#53-57 all×4: 39000 celle x50-104 y50-104 z0-20, passi 77-97
#58-59 all×2: 35100 celle x50-104 y50-104 z20-38, passi 98-115
    #60 all . w → w K (+2) passi=14: ×14, 27300 celle x50-104 y50-104 z38-52, passi 116-129, w→K 11200, .→w 11200, d→K 2450, .→d 2450
      r1 . w → w K ×11200; r2 . d → d K ×2450; r3 . i → i K ×0
#61-64 all×3, prl×1: 28775 celle x45-104 y45-104 z0-64, passi 130-144
    #65 all . h → h . passi=31: ×31, 111600 celle x45-99 y45-99 z1-32, passi 145-175, h→. 55800, .→h 55800
#66-67 all×2: 16000 celle x45-99 y45-99 z2-33, passi 176-206
    #68 all . h → h . (+1) passi=31: ×31, 124000 celle x45-99 y45-99 z33-64, passi 207-237, h→. 55800, .→h 55800, s→. 6200, .→s 6200
      r1 . h → h . ×55800; r2 . s → s . ×6200
#69-74 prl×2, all×4: 38150 celle x45-134 y45-99 z0-64, passi 238-278
    #75 all . a → a . passi=37: ×37, 55500 celle x105-129 y55-84 z1-38, passi 279-315, a→. 27750, .→a 27750
    #76 prl a → P: ×1, 750 celle x105-129 y55-84 z38, passi 316, a→P 750
    #77 all . t → t Z passi=72: ×72, 64800 celle x40-64 y40-64 z0-72, passi 317-388, t→Z 32400, .→t 32400
#78-83 prl×1, all×3: 37498 celle x40-104 y40-114 z0-72, passi 389-424
#84-87 prl×2, all×2: 35094 celle x15-144 y15-134 z0-34, passi 425-444
#88-125 prl×2, all×9: 18035 celle x15-144 y15-134 z0-32, passi 445-525
#126-164 prl×6, all×15, one×1: 29813 celle x40-134 y35-105 z1-77, passi 526-660
#165-170 all×5, one×1: 16570 celle x47-135 y47-103 z38-79, passi 661-694
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#13 prl d/w → h/*: le celle cercate c'erano, ma mai disposte come nel pattern
#14 prl d/h → h/*: le celle cercate c'erano, ma mai disposte come nel pattern
#31 one hwh/awa → ***/*i* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all iw → *i passi=1: in quel momento nella griglia non c'erano celle "i"
#36 all twt/hhh → ttt/***: le celle cercate c'erano, ma mai disposte come nel pattern
#37 all tvt/aaa → ttt/***: le celle cercate c'erano, ma mai disposte come nel pattern
#45 all xEEEEEE → *gggg** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#46 all gE/*g → *g/**: in quel momento nella griglia non c'erano celle "g"
#47 all gEEEE → *gg** passi=1: in quel momento nella griglia non c'erano celle "g"
#48 all gE/*g → *g/**: in quel momento nella griglia non c'erano celle "g"
#49 one gggg/gggg/gggg/gggg → ****/*yy*/*yy*/**** passi=6: in quel momento nella griglia non c'erano celle "g"
… e altri 43
Improve it: answer with the whole program.

## Risposta

<!--
  Concept: Fattoria (Farmstead)
  Parts & Letters:
  - Main farmhouse (h: interior floor, w: masonry wall, s: stair zone, d: front door) around centre H, two storeys (64 high) with hipped tile roof.
  - Front porch / lean-to (p: covered porch with corner posts and roof at 34) along the front wall and entry door.
  - Attached barn / hayloft wing (a: barn floor, v: barn brick wall, i: internal doorway) on one side of the farmhouse (chosen by seed), connected inside via a door.
  - Rural brick & stone granary / dovecote silo (t: silo wall, u: silo interior) at a back corner, crowned with a steep rural pyramidal roof (no military crenellations on the sky silhouette).
  - Farmyard (c: dirt/cobble yard, x: open wooden post-and-rail fence with stone wall piers, r: road to the front edge, q: low stone well, m: golden haystacks / grain sacks, n: wooden shed / cart shelter in the yard).
  - At Gargantuan (where ground extends beyond the fence): plowed crop fields (g: field) and orchard trees (y: orchard/trees).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapviutcxrqgymn" symmetry="()">
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
      <all in="d/h" out="h/d" symmetry="()"/>
      <all in="d/w" out="h/d" symmetry="()" steps="1"/>
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
      <!-- Internal passage (3 cells wide) between farmhouse and barn -->
      <one in="hwh/hwa/hwa/hwa/hwh" out="***/***/**i/***/***" symmetry="(x)" steps="1"/>
      <all in="w/i" out="i/*" symmetry="(y)" steps="1"/>

      <!-- Rural Granary / Dovecote Silo at a back corner of the farmhouse (capped with a steep roof) -->
      <one in="EE/Ew" out="**/*t" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>
      <all in="ttt/ttt/ttt" out="***/tut/***"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Courtyard details: Well (q), Wooden cart/tool shed (n), and Golden Haystacks (m) -->
      <one in="cccc/cccc/cccc" out="****/*qq*/****" steps="1"/>
      <one in="ccccc/ccccc/ccccc" out="*****/**nn*/**nn*" steps="1"/>
      <one in="ccc/ccc/ccc" out="***/*m*/***" steps="3"/>

      <!-- Open wooden post-and-rail fence around the farmyard -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- At Gargantuan (where ground extends beyond the fence): plowed fields (g) and orchard (y) -->
      <all in="xEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEE" out="*gg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="gggg/gggg/gggg/gggg" out="****/*yy*/*yy*/****" steps="8"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdapviutcxrqgymnzbYfFWVPRJKLZQYGCDSoONMTkU#90#91#92#94#20#21" symmetry="()">
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
      <rule in="x" out="ccccc/cxxxc/cxxxc/cxxxc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="q" out="ccccc/cqqqc/cqQqc/cqqqc/ccccc"/>
      <rule in="m" out="ccccc/cmmmc/cmmmc/cmmmc/ccccc"/>
      <rule in="n" out="nnnnn/nbbbn/nbbbn/nbbbn/nnnnn"/>
      <rule in="g" out="ggggg/DDDDD/ggggg/DDDDD/ggggg"/>
      <rule in="y" out="ggggg/gYYYg/gYYYg/gYYYg/ggggg"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WVZ"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Z"/>

        <!-- B. THE HEIGHTS -->

        <!-- 1. Farmhouse walls (w, d, i): 2 storeys = 64 high, with lower & upper window bands K, topped with R -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B i" out="i O" steps="1"/>
        <all in="B w" out="w Z" steps="1"/>
        <all steps="3">
          <rule in="B w" out="w Z"/>
          <rule in="B d" out="d W"/>
          <rule in="B i" out="i W"/>
        </all>
        <all steps="4">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
          <rule in="B i" out="i W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w K"/>
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
          <rule in="B i" out="i W"/>
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

        <!-- 3. Barn wing: walls (v) and floor (a), 1 tall storey = 40 high, topped with P -->
        <all in="B v" out="v Z" steps="4"/>
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v K" steps="14"/>
        <all in="B v" out="v V" steps="16"/>
        <prl in="v" out="P"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="P"/>

        <!-- 4. Rural Granary / Dovecote Silo: stone base (16), brick shaft (36), stone dovecote top (16) = 68 high -->
        <all steps="16">
          <rule in="B t" out="t Z"/>
          <rule in="B u" out="u f"/>
        </all>
        <all steps="36">
          <rule in="B t" out="t V"/>
          <rule in="B u" out="u B"/>
        </all>
        <all steps="16">
          <rule in="B t" out="t Z"/>
          <rule in="B u" out="u B"/>
        </all>
        <prl>
          <rule in="t" out="B"/>
          <rule in="u" out="P"/>
        </prl>

        <!-- 5. Front porch (p) and Yard cart shed (n): corner posts b rising 33, roof J at z=34 -->
        <all in="b[pnb]" out="p*" symmetry="(xy)"/>
        <all in="B p" out="z p" steps="1"/>
        <all in="B n" out="z p" steps="1"/>
        <all in="B b" out="b J" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B z" out="z B" steps="33"/>
        <prl in="z" out="J"/>

        <!-- 6. Well (q, Q), Haystacks (m), Post-and-rail fence (x), Orchard trees (Y) -->
        <all in="B q" out="q Z" steps="6"/>
        <prl in="q" out="J"/>

        <all in="B m" out="m Y" steps="10"/>
        <prl in="m" out="Y"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="4" symmetry="()"/>

        <!-- Fence posts with low horizontal rails -->
        <all in="B x" out="x J" steps="6"/>
        <prl in="x" out="J"/>
        <all in="JccccJ" out="JJJJJJ" symmetry="(xy)"/>

        <!-- Orchard trees -->
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

        <!-- Convert the silo's top merlons into a solid rural roof base P so the silo has a pitched roof instead of military battlements -->
        <prl in="M" out="P"/>

        <!-- Windows in the window bands K (farmhouse lower & upper storeys and barn) -->
        <one steps="26">
          <rule in="BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LKKKKB" out="*LLLL*"/>
        <all in="K W" out="W *"/>
        <all in="K V" out="V *"/>
        <prl in="K" out="W"/>

        <!-- Fill gaps in the silo top plate P so its hipped roof rises cleanly -->
        <all in="PB" out="*P" symmetry="(xy)" steps="1"/>
        <all in="PBP" out="PPP" symmetry="(xy)"/>

        <!-- Roofs: eaves and hipped roofs on farmhouse (R) and barn + silo (P) -->
        <all in="RB" out="*R" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>

        <all in="*****/*****/**B**/*****/***** **P**/**P**/PPPPP/**P**/**P**" out="*****/*****/**P**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

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
  <color symbol="n" value="#b59267" name="tettoia attrezzi" area="yard"/>
  <color symbol="g" value="#735838" name="campo arato" area="field"/>
  <color symbol="D" value="#5e462b" name="solco" area="field"/>
  <color symbol="G" value="#4f783b" name="chioma albero" area="orchard"/>
  <color symbol="Y" value="#d9af43" name="covone di fieno" area="yard"/>

  <color symbol="f" value="#bfa074" name="tavolato" area="house"/>
  <color symbol="F" value="#a6885e" name="solaio" area="house"/>
  <color symbol="W" value="#e3d6be" name="intonaco chiaro" area="house"/>
  <color symbol="V" value="#b3543b" name="mattone fienile" area="barn"/>
  <color symbol="Z" value="#8c877e" name="zoccolo in pietra" area="house"/>
  <color symbol="M" value="#9e432e" name="cornice colombaia" area="barn"/>
  <color symbol="U" value="#2b2927" name="feritoia colombaia" area="barn"/>

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
