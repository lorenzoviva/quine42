# model.sculpt · gemini-4-carbon · 63 s

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
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavulpcqyzrtgjei" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Shift anchor 3 cells toward back (-y) so yard & road fit in front (+y) -->
      <all in="E/E/E/H" out="i/E/E/E" symmetry="()" steps="1"/>
      <prl in="H" out="E"/>

      <!-- Main farmhouse interior (h): 9 wide (x), 7 or 8 deep (y) -->
      <all in="E/[ih]" out="h/*" symmetry="()" steps="3"/>
      <all in="[ih]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[ih]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="i" out="h"/>

      <!-- Farmhouse walls (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone (s): along back inner wall, 2 cells landing on small-x, 4 cells stair, 3 cells upper landing on large-x -->
      <one in="wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw" out="***********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- Barn wing (a, walls v) on one side of the farmhouse (left or right chosen by seed): 6x6 interior (30x30 voxels) -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="aaaaa*/aaaaa*/aaaaa*/aaaaa*/aaaaa*/aaaaa*" symmetry="(x)" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v" symmetry="(x)"/>
      <all in="E/a" out="v/*" symmetry="()"/>
      <all in="a/E" out="*/v" symmetry="()"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="vE/*w" out="*v/**"/>

      <!-- Lean-to shed / porch (l floor, p outer post row): 4 cells deep (20 voxels), 7 cells long (35 voxels) on the opposite side -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*lllp/*lllp/*lllp/*lllp/*lllp/*lllp/*lllp" symmetry="(x)" steps="1"/>

      <!-- Front farmyard (c) extending in front (+y) of farmhouse, barn, and lean-to -->
      <all in="[wvlp]/E" out="*/c" symmetry="()" steps="6"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>
      <all in="c/E" out="*/c" symmetry="()" steps="2"/>
      <!-- If plenty of room in front (Gargantuan), expand yard 2 more cells forward -->
      <all in="c/E/E/E/E/E/E/E" out="*/c/c/*/*/*/*/*" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Barn doorway (u) opening onto the farmyard (3 cells wide = 15 voxels) -->
      <one in="aaaaa/vvvvv/ccccc" out="*****/*uuu*/*****" symmetry="()" steps="1"/>

      <!-- Dry-stone yard fence (z) around the farmyard -->
      <all in="cE" out="*z"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Dovecote / grain silo tower (t: 4x4 cells = 20x20 voxels) on one outer corner of the yard fence -->
      <one in="zzE/zzE/EEE" out="ttt/ttt/ttt" symmetry="(xy)" steps="1"/>
      <all in="t[Ezc]" out="*t" steps="1"/>
      <all in="t*/*[Ezc]" out="**/*t" steps="1"/>

      <!-- Front door (d: 3 cells = 15 voxels) in middle of farmhouse front wall, path (r) across yard & through fence to front edge -->
      <one in="hhhhh/wwwww/ccccc" out="*****/*ddd*/**r**" symmetry="()" steps="1"/>
      <all in="r/[czE]" out="*/r" symmetry="()"/>
      <all in="r[czE]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Haystack (y: 2x2 cells) in yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="1"/>
      <!-- Stone well (q: 2x2 cells) in the farmyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>

      <!-- Gargantuan outer farm features: only grown where at least 6 cells of empty soil E remain beyond the buildings/yard -->
      <!-- Plowed vegetable field (g) on sides/back where wide ground exists -->
      <all in="[zwvlpt]EEEEEEE" out="*gggggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="4"/>
      <!-- Orchard grass (j) on remaining wide ground -->
      <all in="[zwvlptg]EEEEEE" out="*jjjjj*" steps="1"/>
      <all in="jE/*j" out="*j/**" steps="4"/>
      <!-- Connect fields and orchard to yard/fence -->
      <one in="czg" out="*r*" steps="1"/>
      <one in="czj" out="*r*" steps="1"/>
      <!-- Fruit trees (e) inside orchard plots -->
      <one in="jjj/jjj/jjj" out="***/*e*/***" steps="4"/>
      <!-- Second haystack in fields if space permits -->
      <one in="ggg/ggg/ggg" out="***/*y*/***" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavulpcqyzrtgjeifFWVXZRLJKbPAQoONMTkU#90#91#92#94#20#21#31#32#33#34#35" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="q" out="qqqqq/qQQQq/qQAQq/qQQQq/qqqqq"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="g" out="ggggg/PPPPP/ggggg/PPPPP/ggggg"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="e" out="jjjjj/j#33#33#33j/j#33#32#33j/j#33#33#33j/jjjjj"/>

      <sequence symmetry="(xy)">
        <!-- Unions for imported parts -->
        <union symbol="+" values="WVZ"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Z"/>

        <!-- Internal doorway between farmhouse and barn wing (15 voxels wide) using door marker d -->
        <one in="hwwwwwa/hwwwwwa/hwwwwwa" out="*ddddd*/*ddddd*/*ddddd*" symmetry="(xy)" steps="1"/>
        <all in="w/d/h" out="*/*/*" steps="0"/>
        <all in="hwwwwwa" out="*ddddd*" steps="0"/>
        <all in="hwwwwwa/hddddd*" out="*ddddd*/*******" symmetry="(xy)" steps="6"/>

        <!-- B. HEIGHTS -->
        <!-- Main farmhouse walls (w) & door wall (d): 2 storeys = 64 high + roof R -->
        <!-- Keep area letter on z=0 under walls/doors, door O placed at z=1 (floor level) -->
        <all steps="1">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d d"/>
        </all>
        <all in="B d" out="d O" steps="1"/>
        <!-- Ground floor wall: 7 base, 12 window band X, 12 upper -->
        <all in="B w" out="w W" steps="7"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w W" steps="12"/>
        <!-- Door header rises from z=2 to z=64 as wall W -->
        <all in="B d" out="d W" steps="62"/>
        <prl in="d" out="R"/>
        <!-- Second floor wall: 1 slab level + 6 base, 12 window band X, 13 upper -->
        <all in="B w" out="w W" steps="7"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w W" steps="13"/>
        <prl in="w" out="R"/>

        <!-- Main farmhouse interior (h) and stair zone (s) -->
        <!-- z=0 stays h/s (area="house"), z=1 is wood floor f, z=2 has stair strip T -->
        <all steps="1">
          <rule in="B h" out="h h"/>
          <rule in="B s" out="s s"/>
        </all>
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="30"/>
        <all in="B s" out="s B" steps="29"/>
        <!-- z=32..33: second floor slab F (2 voxels thick for sturdy timber ceiling) -->
        <all steps="2">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second storey air: 30 clear (z=34..63) -->
        <all steps="30">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- z=64: attic ceiling / roof deck R -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Barn wing: walls (v), barn doorway (u), barn floor (a) — 1 tall storey (40 high) + roof J -->
        <all steps="1">
          <rule in="B v" out="v V"/>
          <rule in="B u" out="u u"/>
          <rule in="B a" out="a a"/>
        </all>
        <all in="B u" out="u O" steps="1"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="38"/>
        <prl in="a" out="J"/>
        <all in="B v" out="v V" steps="10"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v V" steps="17"/>
        <prl in="v" out="J"/>
        <all in="B u" out="u V" steps="38"/>
        <prl in="u" out="J"/>

        <!-- Lean-to porch: floor (l, p) at z=0, posts (b) rise 33, roof J at z=34 (33 clear above z=0) -->
        <all steps="1">
          <rule in="B l" out="#31 l"/>
          <rule in="B p" out="#31 p"/>
          <rule in="B b" out="b p"/>
        </all>
        <all in="B b" out="b b" steps="32"/>
        <prl in="b" out="J"/>
        <all in="B #31" out="#31 B" steps="33"/>
        <prl in="#31" out="J"/>

        <!-- Dovecote / silo tower (t): hollow stone tower Z, 50 high, flat top with parapet for battlements & slits -->
        <!-- Hollow interior of tower on z=0 before rising using #35 -->
        <all in="ttt/ttt/ttt" out="***/*#35*/***"/>
        <all steps="1">
          <rule in="B t" out="t Z"/>
          <rule in="B #35" out="#35 f"/>
        </all>
        <all in="B t" out="t Z" steps="47"/>
        <all in="B #35" out="#35 B" steps="46"/>
        <all in="B #35" out="#35 F" steps="1"/>
        <!-- Top parapet layer z=49: Z around F so part-battlements adds merlons M (55 total) & part-slits cuts slits U -->
        <prl in="t" out="Z"/>
        <prl in="#35" out="B"/>

        <!-- Low dry-stone yard fence (z): 9 high -->
        <all in="B z" out="z Z" steps="8"/>
        <prl in="z" out="Z"/>

        <!-- Well (Q stone rim 10 high, A water 5 deep) -->
        <all in="B Q" out="Q Z" steps="9"/>
        <prl in="Q" out="Z"/>
        <all in="B A" out="A A" steps="4"/>
        <prl in="A" out="A"/>

        <!-- Haystacks (y): rounded golden mound 14 high -->
        <all in="B y" out="y y" steps="8"/>
        <all in="yyy/yyy/yyy B/B/B" out="***/***/*** */y/*" symmetry="()" steps="5"/>

        <!-- Orchard fruit trees (#32 trunk, #33 canopy marker -> #34 canopy leaves) -->
        <all in="B #32" out="#32 b" steps="1"/>
        <all in="B #32" out="#32 b" steps="11"/>
        <prl in="#32" out="#34"/>
        <all in="B #33" out="#33 j" steps="1"/>
        <all in="B #33" out="#33 B" steps="7"/>
        <all in="B #33" out="#33 #34" steps="9"/>
        <prl in="#33" out="#34"/>
        <all in="#34B" out="*#34" steps="2"/>
        <all in="B #34" out="#34 #34" steps="2"/>

        <!-- C. FULL SCALE PARTS, WINDOWS, ROOFS & DETAILS -->
        <!-- Doors & Stair -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- Battlements & Arrow Slits on the dovecote tower -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in farmhouse (W) and barn (V) window bands (X) -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <!-- Punch windows through thickness of wall to interior air B -->
        <all in="LXXXXB" out="*LLLL*"/>
        <all in="LXXXB" out="*LLL*"/>
        <!-- Restore unused X band on barn to V and on farmhouse to W -->
        <all in="X/V" out="V/*" symmetry="(xyz)"/>
        <prl in="X" out="W"/>

        <!-- Timber horizontal belt-course / beams on farmhouse facade at slab height -->
        <all in="WF" out="b*"/>

        <!-- Eaves & pitched hip roof on main farmhouse (R) -->
        <all in="RB" out="*R" steps="2"/>
        <all in="RB/*R" out="*R/**"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- Brick chimney (K) rising through farmhouse roof -->
        <one in="RRR/RRR/RRR BBB/BBB/BBB" out="***/***/*** ***/*K*/***" symmetry="()" steps="1"/>
        <all in="KB" out="*K" steps="1"/>
        <all in="KB/*K" out="*K/**"/>
        <all in="B K" out="K K" steps="10"/>

        <!-- Eaves & pitched roof on barn and lean-to (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="JB/*J" out="*J/**"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="9" symmetry="()"/>

        <!-- Final cleanup of any stray helper markers -->
        <prl>
          <rule in="#31" out="B"/>
          <rule in="#32" out="b"/>
          <rule in="#33" out="j"/>
          <rule in="#35" out="f"/>
          <rule in="Q" out="Z"/>
        </prl>
      </sequence>
    </map>
  </map>

  <!-- Palette: cozy medieval cartoon style, warm plaster, terracotta roofs, timber accents, stone & greenery -->
  <!-- Ground & Area symbols preserved at z=0 -->
  <color symbol="h" value="c8a272" name="pavimento di casa" area="house"/>
  <color symbol="s" value="c8a272" name="vano scala" area="house"/>
  <color symbol="w" value="ebe0c8" name="fondamenta di casa" area="house"/>
  <color symbol="d" value="c8a272" name="soglia di casa" area="house"/>
  <color symbol="a" value="b58e5e" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="d4bfa0" name="fondamenta del fienile" area="barn"/>
  <color symbol="u" value="b58e5e" name="soglia del fienile" area="barn"/>
  <color symbol="l" value="bfa682" name="pavimento della tettoia" area="porch"/>
  <color symbol="p" value="bfa682" name="bordo della tettoia" area="porch"/>
  <color symbol="c" value="d4c19c" name="aia in terra battuta" area="yard"/>
  <color symbol="q" value="9a9e9c" name="base del pozzo" area="yard"/>
  <color symbol="z" value="989690" name="base del muretto" area="yard"/>
  <color symbol="t" value="989690" name="fondamenta della colombaia" area="tower"/>
  <color symbol="r" value="b8a482" name="sentiero" area="road"/>
  <color symbol="g" value="8c6d46" name="orto arato" area="field"/>
  <color symbol="P" value="6e8c42" name="filare di ortaggi" area="field"/>
  <color symbol="j" value="88ab55" name="prato del frutteto" area="orchard"/>
  <color symbol="e" value="88ab55" name="terra del frutteto" area="orchard"/>
  <color symbol="i" value="c8a272" name="centro casa" area="house"/>

  <!-- Structural & Architectural materials -->
  <color symbol="W" value="ebe0c8" name="muro intonacato" area="house"/>
  <color symbol="V" value="d4bfa0" name="muro del fienile" area="barn"/>
  <color symbol="X" value="ebe0c8" name="fascia muraria"/>
  <color symbol="Z" value="989690" name="pietra grezza" area="tower"/>
  <color symbol="Q" value="989690" name="bordo del pozzo" area="yard"/>
  <color symbol="f" value="b88c58" name="tavolato di legno"/>
  <color symbol="F" value="9e7344" name="solaio di legno"/>
  <color symbol="b" value="6e4a2c" name="trave di quercia"/>
  <color symbol="R" value="c4563a" name="tetto di coppi"/>
  <color symbol="J" value="a84830" name="tettoia di tegole"/>
  <color symbol="K" value="9e3e2c" name="comignolo di mattoni"/>
  <color symbol="L" value="6ba3be" name="finestra"/>
  <color symbol="A" value="4f8fb8" name="acqua del pozzo"/>
  <color symbol="y" value="dfc156" name="pagliaio" area="yard"/>
  <color symbol="#34" value="588c3e" name="chioma di albero"/>

  <!-- Imported parts colours & helper markers -->
  <color symbol="O" value="855432" name="porta di legno"/>
  <color symbol="o" value="54331c" name="assi della porta"/>
  <color symbol="N" value="78756e" name="stipite di pietra"/>
  <color symbol="T" value="a67b4b" hidden="True"/>
  <color symbol="k" value="a67b4b" name="gradini di legno"/>
  <color symbol="M" value="989690" name="merlatura di pietra"/>
  <color symbol="U" value="33302c" name="feritoia"/>

  <!-- Hidden markers -->
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#31" hidden="True"/>
  <color symbol="#32" value="6e4a2c" hidden="True"/>
  <color symbol="#33" value="88ab55" hidden="True"/>
  <color symbol="#35" value="b88c58" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>

  <!-- Interactive door actions -->
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
It does not pass: taglia Enorme, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, l pavimento della tettoia, p bordo della tettoia, c aia in terra battuta, q base del pozzo, y pagliaio, r sentiero, g orto arato, j prato del frutteto, f tavolato di legno, F solaio di legno, W muro intonacato, V muro del fienile, Z pietra grezza, R tetto di coppi, L finestra, J tettoia di tegole, K comignolo di mattoni, b trave di quercia, P filare di ortaggi, A acqua del pozzo, o assi della porta, O porta di legno, N stipite di pietra, M merlatura di pietra, k gradini di legno, U feritoia, # = #34 chioma di albero
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEjjjjjjjjjjjjjEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEjjjjjjjjjjjjjjgggggggggggggggggggggggggEEEEEEEE
EEjjjjjjjjj###jjjgyygggggggggggggggggggggggEEEEEEE
EEjj#jjjjjjj#jjjjgyygggggggggggggggggggggggEEEEEEE
EEj##jjjjjjjjjjPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEEEE
EEjj#jj#jjjjjjjggggggggggggggggggggggggggggggEEEEE
EEjjjj###jjjjggggggggggggggggggggggggggggggggEEEEE
EEj##jjjjjjjgggggggggggggggggggggggggggggggggEEEEE
EEj##jjjjjjjgggggggggggggggggggggggggggggggggEEEEE
EEjjjjjjjjPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPjjjEE
EEEEEEEjjjggggggRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE
EEEEEEEgggggggggRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE
EEEEEEEPPPJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE
EEEEEEEPPPJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJPPPEE
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE
EEEEEEEPPJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE
EEEEEEEZrrJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJPPPEE
EEEEEEEZccJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE
EEEEEEEZccccccccJJJJJJJJJJJJJJJJJJJJJJJJJJJJJgggEE
EEEEEEEZccccccccJJJJJJJJJJJJJJJJJJJJJJJJJJJJJZZZEE
EEEEEEEZccccccccJJJJJJJJJJJJJJJJJJJJJJJJJJJJJZZZEE
EEEEEEEZccMqMccccccccccccccccccccccccccccccccccZEE
EEEEEEEZccqqqccccccccccccccccccccccccccccccccccZEE
EEEEEEEZccqqMccccccccccccccccccccccccccccccccccZEE
EEEEEEEZccccccccccccccyyyccccccccccccccccccccccZEE
EEEEEEEZccccccccccccccyyyccccccccccccccccccccccZEE
EEEEEEEZccccccccccccccyyyccccccccccccccccccccccZEE
EEEEEEEZcccccccccccccccccccccccccccccccccccccccZEE
EEEEEEEZcccccccccccccccccccccccccccccccccccccccZEE
EEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZEE
EEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000050000000000000000000000000000000000000
00000000000555000022000000000000000000000000000000
00055000000555000022000000000000000000000000000000
00055500000000000000000000000000000000000000000000
00055055500000000000000000000000000000000000000000
00055055500000000000000000000000000000000000000000
00055505000000000000000000000000000000000000000000
00055500000000000000000000000000000000000000000000
0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
0000000000000000jjjjjjjjjjjjjjjjjjjjcccccccccc0000
0000000000000000jjkkkkkkkkkkkkkkkkjjcccccccccc0000
0000000000000000jjkkkkkkkkkkkkkkkkjjcdddddddcc0000
000000000aaaaaaajjkkllllllllllllkkjjcdddddddcc0000
000000000aabbbbbjjkkllllllllllllkkjjcddeedddcc0000
000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
000000000aabbbbbjjkkllllllllllllkkjjcddeedddcc0000
000000000aabbbbbjjkkllllllllllllkkjjcddeedddcc0000
000000000aabbbbbjjkkkkkkkkkkkkkkkkjjcddeedddcc0000
000000444aabbbbbjjkkkkkkkkkkkkkkkkjjcddeedddcc0000
000000424aabbbbbjjjjjjjjjjjjjjjjjjjjcddeedddcc0000
000000424aaaaaaajjjjjjjjjjjjjjjjjjjjddddddddcc0000
0000004240000000cccccccccccccccccccdddddddddcc0000
0000004240000000cccccccccccccccccccccccccccccc4440
0000002220000000cccccccccccccccccccccccccccccc2240
00000042404440000000000000000000000000000000002240
00000042404440000000000000000000000000000000002240
00000042404440000000000000000000000000000000002240
00000042400000000000022220000000000000000000002240
00000042400000000000022220000000000000000000002240
00000042400000000000022220000000000000000000002240
00000042400000000000022220000000000000000000002240
00000022200000000000000000000000000000000000002220
00000042222222222222222222222222222222222222222240
00000044444244444442444444424444444244444442444440
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
........................RRRR......................
......................RRRRRRRR....................
....................RRRRRRRRRRRR..................
..................RRRRRRRRRRRRRRRR................
................RRRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................VVVVVLVVVVVVVVVVVV...............
.................VVVVVLLVVVVVVVVVVV....JJ.........
.................VVVVVLLVVVVVVVVVVVJJJJJJJJ.......
.................JJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
............JJJ..VVVVVVVVVVVVVVVVVVVVVVVVVVVV.....
..........JJJJJJVVVVVVVVVVVVVVVVVVVVVVVVVVVVV.....
..........JJ.....VVVVVVVVVVVVVVVVVVVVooooVVVV.....
..........JJ.....VVVVVVVVVVVVVVVVVVVVoooooVVV.....
..........JJ.....VVVVVVVVVVVVVVVVVVVVoooooVVV.....
..........JJ.....VVVVVVVVVVLLVVVVVVVVoooooVVV.....
...##..#..JJ#....VVVVVVVVVVLLVVVVVVVVoooooVVV.....
...##.###.JJ##...VVVVVVVVVVLLVVVVVVVVoooooVVV.....
...##.#MMMMMMM.MMMMVMMVMVMMVMMVMVMMVMMoMoMMVMM.M..
...##.#MMMMJMM.MMMMVMMVMVMMVMMVMVMMVMMoMoMMVMM.M..
....#..ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ..
.......ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ..
....E.EZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZE.
```
Right side (looking from the right):
```
...................RRRR...........................
.................RRRRRRRR.........................
...............RRRRRRRRRRRR.......................
.............RRRRRRRRRRRRRRRR.....................
.............WWWWWWWWWWWWWWW......................
.............WWWWWWWWWWWWWWW......................
.............WWWWWWWWWWWWWWW......................
.............WWWWWWWWWWWWWWW......................
.............VVLLVWWWWWWWWWV......................
.............VVLLJJJJJJJJJJJ......................
.............VVJJJJJJJJJJJJJJJ....................
.............JJJJJJJJJJJJJJJJJJJ..................
.............VVVVVVVVVVVVVVVVVVV..................
.............VVVVVVVVVVVVVVVVVVV..................
.............VVVVVVVVVVVVVVVVVVV..................
.............VVVVVVVVVVVVVVVVVVV..................
.............VVVVVVVVVVVVVVVVVVV..................
.............VVVVVVVVLVVVVVVVVVV..................
.....#######.VVVVVVVLLLVLLVVVVVV..................
.....#######.VVVVVVLLLLVLLVVVVVV..................
.....#######.VVVVVVLLVVVLLVVVVMMMMMM.MM.MM........
.....#######.VVVVVVVVVVVVVVVVVMMMMMM.MM.MM........
.....yy#.##..VVVVVVVVVVVVVVVVVZZZZZZZZZZZZ........
.....yy......VVVVVVVVVVVVVVVVVZZZZZZZZZZZZ........
.....yyE.EE..VVVVVVVVVVVVVVVVVZZZZZZZZZZZZ........
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
...........###....................................
....#.......#.....................................
...##.............................................
....#..#..........................................
......###.........................................
...##.............................................
...##.............................................
..................................................
.................LLLVVVVVVVLLVVVVVVV..............
.................VLLVVVVVVVLLVVVVVVVV.............
.................V.....kkkk......VVVV.............
.................V.....kkkk......VVVV.............
..........JJ.....V.....kkkk......VVVVVVVVVVVV.....
..........JJ.....V...............oo........VV.....
..........JJ.....V...............oo........LL.....
..........JJ.....V...............oo........LL.....
..........JJ.....V...............oo........VV.....
..........JJ.....L...............oo........VV.....
..........JJ.....L...............oo........VV.....
..........JJ.....V...............oo........VV.....
..........JJ.....V...............oo........VV.....
..........JJ.....VV..............oo........VV.....
..........JJ.....VVVVVVVVVVVVVVVVVV........VV.....
.................VVVVVVVVVVVVVVVVVV........VV.....
.................VVVVVVVVVVVVVVVVVV........VV.....
.................................VVVVoooooVVV.....
..................................VVVoooooVVV.....
..........M.M.....................................
..................................................
............M.....................................
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
.................VVLLLVVLLLVVVVVVVV...............
.................VVLLLVVLWLVVVVVVVV...............
.................V...............LL..JJJJJJ.......
.................V...............LL..JJJJJJ.......
.................V...............VV..JJJJJJ.......
.................L...............WW..JJJJJJ.......
.................L...............WW..JJJJJJ.......
.................V...............WW..JJJJJJ.......
.................V...............WW..JJJJJJ.......
.................V...............WW..JJJJJJ.......
.................V...............WW..JJJJJJ.......
.................V...............WW..JJJJJJ.......
.................V...............WW..JJJJJJ.......
.................VV..............WW..JJJJJJ.......
.................VVVVVVVVVVVVVVVVVV..JJJJJJ.......
.....................................JJJJJJ.......
...................................JJJJJJJJ.......
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
..................................................
..................................................
..................................................
..................................................
..................................................
.......................RRRRR......................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEjjEEEEE   00000000000000000000000000000000000000000000000000
EEjjjjjjjjEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEjjEEEEE   00000000000000000000000000000000000000000000000000
EEjjjjjjjjggggggggggggggggggggggggggggggggEjjEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEggggggggggggggggggggggggggggggggggEjjEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEgggggggggggggggggggPggggggggggggggEjjEEEEE   00000000000000000000000000222000000000000000000000
EEEEEEEPPPPPPPPPPPPPPPPPPPPyPPPPPPPPPPPPPPEjjEEEEE   00000000000000000000000000222000000000000000000000
EEEEEEEggggggggggggggggggggyggggggggggggggEjjEEEEE   00000000000000000000000000222000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggjjEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEjjjjPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEjjjJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRgggggggggEEEEE   000000ccccccccccjjjjjjjjjjjjjjjjjjjj00000000000000
EEEjjjJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRgggggggggEEEEE   000000ccccccccccjjkkkkkkkkkkkkkkkkjjaaaaaa00000000
EEEjjjJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJgggEEEEE   000000ccdddddddcjjkkkkkkkkkkkkkkkkjjaaaaaa00000000
EEEjjjJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJgggEEEEE   000000ccdddddddcjjkkllllllllllllkkjjbbbbba00000000
EEEjjjJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJPPPEEEEE   000000ccdddedddcjjkkllllllllllllkkjjbbbbba00000000
EEEjjjJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJgggEEEEE   000000ccdddedddcjjkkllmmmmmmmmllkkjjbbbbba00000000
EEEjjjJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJgggEEEEE   000000ccdddedddcjjkkllmmmmmmmmllkkjjbbbbba00000000
EEEgggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJgggEEEEE   000000ccdddedddcjjkkllmmmmmmmmllkkjjbbbbba00000000
EEEgggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJgggEEEEE   000000ccdddedddcjjkkllmmmmmmmmllkkjjbbbbba00000000
EEEPPPJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJPPPEEEEE   000000ccdddedddcjjkkllmmmmmmmmllkkjjbbbbba00000000
EEEgggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJgggEEEEE   000000ccdddedddcjjkkllllllllllllkkjjbbbbba00000000
EEEgggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJgggEEEEE   000000ccdddedddcjjkkllllllllllllkkjjbbbbba00000000
EEEgggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJrMMEEEEE   000000ccdddedddcjjkkkkkkkkkkkkkkkkjjbbbbba04400000
EEEgggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJrZZEEEEE   000000ccdddedddcjjkkkkkkkkkkkkkkkkjjaaaaaa04400000
EEEPPPJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRcccccccZZEEEEE   000000ccdddedddcjjjjjjjjjjjjjjjjjjjj00000004400000
EEEgggJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRccccccccZEEEEE   000000ccddddddddjjjjjjjjjjjjjjjjjjjj00000004400000
EEEgggJJJJJJJJJJJJJJJJJJJJJJJJJJJJJccccccccZZEEEEE   000000ccdddddddddccccccccccccccccccc00000004400000
EEEMZZJJJJJJJJJJJJJJJJJJJJJJJJJJJJJccccccccZZEEEEE   000442cccccccccccccccccccccccccccccc00000004400000
EEEZZZJJJJJJJJJJJJJJJJJJJJJJJJJJJJJcccccccccZEEEEE   000422cccccccccccccccccccccccccccccc00000004400000
EEEZZccccccccccccccccccccccccccccccccccccccZZEEEEE   00042000000000000000000000000000000000000002200000
EEEEZccccccccccccccccccccccccyycccccccccccccZEEEEE   00042000000000000000000000002222000000000004400000
EEEZZcccccccccccccccccccccccyyyycccccccccccZZEEEEE   00042000000000000000000000002222000000000004400000
EEEZZccccccccccccMqqccccccccyyyycccccccccccZZEEEEE   00042000000000000444000000002222000000000004400000
EEEZZccccccccccccqqqcccccccccyycccccccccccccZEEEEE   00042000000000000444000000002222000000000004400000
EEEZZccccccccccccMqMcccccccccccccccccccccccZZEEEEE   00042000000000000444000000000000000000000004400000
EEEEZccccccccccccccccccccccccccccccccccccccZZEEEEE   00042000000000000000000000000000000000000004400000
EEEZZccccccccccccccccccccccccccccccccccccccZZEEEEE   00022000000000000000000000000000000000000004200000
EEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEE   00042222222222222222222222222222222222222222400000
EEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZMEEEEE   00044244444442444444424444444244444442444444400000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEjjjjjjjjjjjjjjPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEEEE   00000000000000000000000000000000000000000000000000
EEjjjjjjjjjjjjjjjggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEjjjjjjjjjjjjjjjggggggggggggggggggggggggggggEEEEE   00055005005500000000000000000000000000000000000000
EEj##j###j##jjjggggggggggggggggggggggggggggggEEEEE   00055555555500000000000000000000000000000000000000
EEj##jj#jj##jjjggggggggggggggggggggggggggggggEEEEE   00055555555500000000000000000000000000000000000000
EEjjjjjjjjjjjPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPjjjEE   00000000000000000000000000000000000000000000000000
EEjjjjj#jjjjjggggggggggggggggggggggggggggggggjjjEE   00000055500000000000000000000000000000000000000000
EEjjjj###jjjgggggggggggggggggggggggggggggggggjjjEE   00000055500000000000000000000000000000000000000000
EEjjjjjjjjgggggggggggggggggggggggggggggggggggjjjEE   00000005000000000000000000000000000000000000000000
EEjjjjjjjjggggggJJJJJJJJJJJJJJJJJJJJJJJJJJJJJjjjEE   0000000000000000cccccccccccccccccccccccccccccc0000
EEEEEEEPPPPPPPPPJJJJJJJJJJJJJJJJJJJJJJJJJJJJJjjjEE   0000000000000000jjjjjjjjjjjjjjjjjjjjcccccccccc0000
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE   000000000aaaaaaajjjjjjjjjjjjjjjjjjjjcdddddddcc0000
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJjjjEE   000000000aabbbbbjjkkkkkkkkkkkkkkkkjjcdddddddcc0000
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE   000000000aabbbbbjjkkkkkkkkkkkkkkkkjjcdddddddcc0000
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE   000000000aabbbbbjjkkllllllllllllkkjjcddeedddcc0000
EEEEEEEPPPJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJPPPEE   000000000aabbbbbjjkkllllllllllllkkjjcddeedddcc0000
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE   000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE   000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE   000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
EEEEEEEgggJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE   000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
EEEEEEEPPPJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJPPPEE   000000000aabbbbbjjkkllmmmmmmmmllkkjjcddeedddcc0000
EEEEEEEgZZJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE   000000444aabbbbbjjkkllllllllllllkkjjcddeedddcc0000
EEEEEEEZZZJJJJJJRRRRRRRRRRRRRRRRRRRRJJJJJJJJJgggEE   000000422aaaaaaajjkkllllllllllllkkjjcdddddddcc0000
EEEEEEEZccccccccRRRRRRRRRRRRRRRRRRRRJJJJJJJJJZZZEE   000000222aaaaaaajjkkkkkkkkkkkkkkkkjjcdddddddcc4440
EEEEEEEZccccccccRRRRRRRRRRRRRRRRRRRRJJJJJJJJJZZZEE   0000004220000000jjkkkkkkkkkkkkkkkkjjcdddddddcc2240
EEEEEEEZccccccccRRRRRRRRRRRRRRRRRRRRJJJJJJJJJccZEE   0000004220000000jjjjjjjjjjjjjjjjjjjjcccccccccc2240
EEEEEEEZccccccccRRRRRRRRRRRRRRRRRRRRJJJJJJJJJccZEE   0000004220000000jjjjjjjjjjjjjjjjjjjjcccccccccc2240
EEEEEEEZccccccccccccccrrrrrccccccccccccccccccccZEE   00000042200000000000000000000000000000000000002240
EEEEEEEZccccccccccccccrrrrrcccccccccccccccyyyccZEE   00000042200000000000000000000000000000000222202240
EEEEEEEZccccccccccccccrrrrrcccccccccccccccyyyccZEE   00000042200000000000000000000000000000000222202240
EEEEEEEZccccccccccccccrrrrrcccccMqMcccccccyyyccZEE   00000042200000000000000000000000444000000222202240
EEEEEEEZccccccccccccccrrrrrcccccqqqccccccccccccZEE   00000022200000000000000000000000444000000222202220
EEEEEEEZccccccccccccccrrrrrcccccMqqccccccccccccZEE   00000042200000000000000000000000444000000000002240
EEEEEEEZccccccccccccccrrrrrccccccccccccccccccccZEE   00000042200000000000000000000000000000000000002240
EEEEEEEZZcccccccccccccrrrrrccccccccccccccccccccZEE   00000042244444044442440000444442444444424444444240
EEEEEEEZZZZZZrrZZZZZZZrrrrrZZZZZZZZZZZZZZZZZZZZZEE   00000042222224042222240000422222222222222222222240
EEEEEEEMggggMgrMggMZMrrrrrrMggMZMggMggggggMZMggMEE   00000044444444044442440000444442444444444442444440
EEEEEEEgggggggggggggggrrrrrgggggggggggggggggggggEE   00000000000000000000000000000000000000000000000000
EEEEEEEgggggggggggggggrrrrrgggggggggggggggggggggEE   00000000000000000000000000000000000000000000000000
EEEEEEEggggggggggggPggrrrrrgggggggggggggggggggggEE   00000000000000000022000000000000000000000000000000
EEEEEEEPPPPPPPPPPPyyPPrrrrrPPPPPPPPPPPPPPPPPPPPPEE   00000000000000000022000000000000000000000000000000
EEEEEEEggggggggggggyggrrrrrgggggggggggggggggggggEE   00000000000000000022000000000000000000000000000000
EEEEEEEgggggggggggggggrrrrrgggggggggggggggggggggEE   00000000000000000000000000000000000000000000000000
EEEEEEEgggggggggggggggrrrrrgggggggggggggggggggggEE   00000000000000000000000000000000000000000000000000
EEEEEEEgggggggggggggggrrrrrgggggggggggggggggggggEE   00000000000000000000000000000000000000000000000000
EEEEEEEPPPPPPPPPPPPPPPrrrrrPPPPPPPPPPPPPPPPPPPPPEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.46 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 195 nodi, 923 passi, finito in 742 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald, h=pavimento di casa, s=vano scala, w=fondamenta di casa, d=soglia di casa, a=pavimento del fienile, v=fondamenta del fienile, u=soglia del fienile, l=pavimento della tettoia, p=bordo della tettoia, c=aia in terra battuta, q=base del pozzo, y=pagliaio, z=base del muretto, r=sentiero, g=orto arato, j=prato del frutteto, e=terra del frutteto, i=centro casa, f=tavolato di legno, F=solaio di legno, W=muro intonacato, V=muro del fienile, X=fascia muraria, Z=pietra grezza, R=tetto di coppi, L=finestra, J=tettoia di tegole, K=comignolo di mattoni, b=trave di quercia, A=acqua del pozzo, Q=bordo del pozzo, o=assi della porta, O=porta di legno, N=stipite di pietra, M=merlatura di pietra, T=Teal (marcatore), k=gradini di legno, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #31=? (marcatore), #32=#6e4a2c (marcatore), #33=#88ab55 (marcatore), #34=chioma di albero.
Alla fine: V 45822, W 34634, J 16527, R 15987, E 8025, Z 7544, o 5760, c 3175, L 3096, F 2830, k 2720, f 2450, g 2310, U 1776, #34 1760, P 1540, j 1321, M 1170, y 1125, N 560, l 525, b 336, O 240, p 175, q 64, r 25, A 20, K 9.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-46 all×23, prl×1, one×9: 606 celle x1-28 y2-24 z0, passi 2-73
   #48 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 74
#50-57 one×1, all×5: 31500 celle x50-104 y40-84 z0-20, passi 75-97
#58-61 all×3, prl×1: 45200 celle x50-104 y40-84 z0-64, passi 98-179
#62-67 all×5, prl×1: 44650 celle x50-104 y40-84 z1-64, passi 180-208
    #68 all . h → h . passi=30: ×30, 82500 celle x55-99 y45-79 z2-32, passi 209-238, h→. 41250, .→h 41250
#69-70 all×2: 17900 celle x55-99 y45-79 z3-34, passi 239-269
    #71 all . h → h . (+1) passi=30: ×30, 94500 celle x55-99 y45-79 z34-64, passi 270-299, h→. 41250, .→h 41250, s→. 6000, .→s 6000
      r1 . h → h . ×41250; r2 . s → s . ×6000
#72-75 prl×1, all×3: 7500 celle x50-134 y40-94 z0-64, passi 300-303
    #76 all . a → a . passi=38: ×38, 66500 celle x105-129 y55-89 z2-40, passi 304-341, a→. 33250, .→a 33250
#77-79 prl×1, all×2: 34750 celle x50-134 y40-94 z0-40, passi 342-364
#80-86 all×4, prl×3: 36958 celle x30-134 y40-94 z0-40, passi 365-455
    #87 all . #31 → #31 . passi=33: ×33, 42042 celle x30-49 y50-84 z1-34, passi 456-488, #31→. 21021, .→#31 21021
#88-119 prl×5, all×12: 27717 celle x9-144 y14-124 z0-34, passi 489-584
#120-181 all×21, prl×6, one×1: 26598 celle x20-144 y40-124 z1-49, passi 585-780
#182-194 all×10, prl×1, one×1: 47774 celle x29-135 y38-95 z1-76, passi 781-923
Senza effetto (non hanno mai cambiato una cella):
#6 prl H → E: in quel momento nella griglia non c'erano celle "H"
#9 prl h/E → */h passi=1
#31 one zzE/zzE/EEE → ttt/ttt/ttt passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all t[Ezc] → *t passi=1: in quel momento nella griglia non c'erano celle "t"
#33 all t*/*[Ezc] → **/*t passi=1: in quel momento nella griglia non c'erano celle "t"
#34 one hhhhh/wwwww/ccccc → *****/*ddd*/**r** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all r/[czE] → */r: in quel momento nella griglia non c'erano celle "r"
#36 all r[czE] → *r passi=1: in quel momento nella griglia non c'erano celle "r"
#44 one czj → *r* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#51 all w/d/h → */*/*: le celle cercate c'erano, ma mai disposte come nel pattern
#53 all hwwwwwa/hddddd* → *ddddd*/******* passi=6: le celle cercate c'erano, ma mai disposte come nel pattern
#89 all ttt/ttt/ttt → ***/*#35*/***: in quel momento nella griglia non c'erano celle "t"
… e altri 46
Fix it and answer with the whole program.

## Risposta

```xml
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavulpcqyzrtgjei" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Shift anchor 4 cells toward back (-y) so a large house, yard & road fit in front (+y) -->
      <all in="E/E/E/E/H" out="i/E/E/E/E" symmetry="()" steps="1"/>
      <prl in="H" out="i"/>

      <!-- Main farmhouse interior (h): 10 or 11 wide (50-55 voxels), 9 deep (45 voxels) -> >35 clear square after stair! -->
      <all in="E/[ih]" out="h/*" symmetry="()" steps="4"/>
      <all in="[ih]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[ih]E" out="*h" symmetry="(x)" steps="4"/>
      <one in="hE" out="*h" symmetry="(x)" steps="1"/>
      <prl in="i" out="h"/>

      <!-- Farmhouse walls (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone (s): along back inner wall, 2 cells landing on small-x, 4 cells stair, 3+ cells upper landing on large-x -->
      <!-- Leaves 7 full rows (35 voxels) of clear room in front of the stair -->
      <one in="wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw" out="***********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- Barn wing (a, walls v) on one side of the farmhouse (left or right chosen by seed): 6 wide x 7 deep interior (30x35 voxels) -->
      <one in="EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw" out="aaaaaa*/aaaaaa*/aaaaaa*/aaaaaa*/aaaaaa*/aaaaaa*/aaaaaa*" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*[vw]" out="*v/**"/>

      <!-- Lean-to shed / porch (l floor, p outer post row): 4 cells deep (20 voxels), 7 cells long (35 voxels) on the opposite side -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*lllp/*lllp/*lllp/*lllp/*lllp/*lllp/*lllp" symmetry="(x)" steps="1"/>

      <!-- Front farmyard (c) extending in front (+y) of farmhouse, barn, and lean-to -->
      <all in="[wvlp]/E" out="*/c" symmetry="()" steps="5"/>
      <!-- Ensure yard is directly in front of the farmhouse front wall even if barn projects slightly forward -->
      <all in="w/v" out="*/c" symmetry="()" steps="0"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>
      <all in="c/E/E/E" out="*/c/*/*" symmetry="()" steps="2"/>
      <!-- If plenty of room in front (Gargantuan), expand yard 3 more cells forward -->
      <all in="c/E/E/E/E/E/E/E" out="*/c/c/c/*/*/*/*" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Front door (d: 3 cells = 15 voxels) in middle of farmhouse front wall, path (r) straight to the front edge -->
      <one in="hhhhh/wwwww/ccccc" out="*****/*ddd*/**r**" symmetry="()" steps="1"/>
      <one in="hhhhh/vvvvv/ccccc" out="*****/*ddd*/**r**" symmetry="()" steps="1"/>

      <!-- Barn doorway (u: 3 cells = 15 voxels) opening onto the farmyard -->
      <one in="aaaaa/vvvvv/ccccc" out="*****/*uuu*/*****" symmetry="()" steps="1"/>

      <!-- Dry-stone yard fence (z) around the farmyard, leaving at least 1 cell for road to reach edge -->
      <all in="cE" out="*z"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Dovecote / grain silo tower (t: 4x4 cells = 20x20 voxels) on one outer corner of the yard fence -->
      <one in="zc/zz/EE" out="*t/tt/tt" symmetry="(xy)" steps="1"/>
      <all in="t[Ezc]" out="*t" steps="1"/>
      <all in="t*/*[Ezc]" out="**/*t" steps="1"/>

      <!-- Extend road (r: 3 cells wide = 15 voxels) across yard, through fence, straight to the front edge -->
      <all in="r/[czE]" out="*/r" symmetry="()"/>
      <all in="r[czE]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Haystack (y: 2x2 cells) in yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="1"/>
      <!-- Stone well (q: 2x2 cells) in the farmyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>

      <!-- Gargantuan outer farm features: ONLY grown where >= 8 cells of empty soil E remain beyond buildings/yard -->
      <!-- At Huge (30x30), margins are 2-6 cells so none of these match; at Gargantuan (40x40), margins are 8-12 cells! -->
      <!-- Plowed vegetable field (g) on sides/back where wide ground exists -->
      <all in="[zwvlpt]EEEEEEEE" out="*ggggggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="5"/>
      <!-- Orchard grass (j) on remaining wide ground -->
      <all in="[zwvlptg]EEEEEEEE" out="*jjjjjjj*" steps="1"/>
      <all in="jE/*j" out="*j/**" steps="5"/>
      <!-- Connect fields and orchard to yard/fence -->
      <one in="czg" out="*r*" steps="1"/>
      <one in="czj" out="*r*" steps="1"/>
      <!-- Fruit trees (e) inside orchard plots -->
      <one in="jjj/jjj/jjj" out="***/*e*/***" steps="5"/>
      <!-- Second haystack in fields if space permits -->
      <one in="gggg/gggg/gggg/gggg" out="****/*yy*/*yy*/****" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavulpcqyzrtgjeifFWVXYRLJKbPAQoONMTkU#90#91#92#94#20#21#31#32#33#34#35#36" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="q" out="qqqqq/qQQQq/qQAQq/qQQQq/qqqqq"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="g" out="ggggg/PPPPP/ggggg/PPPPP/ggggg"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="e" out="jjjjj/j#33#33#33j/j#33#32#33j/j#33#33#33j/jjjjj"/>

      <sequence symmetry="(xy)">
        <!-- Unions for imported parts -->
        <!-- Notice Z (dovecote tower) is in + and %, while yard fence uses #36 so fence never gets merlons -->
        <union symbol="+" values="WVZ"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Z"/>

        <!-- Internal doorway between farmhouse and barn wing (13 voxels wide) using door marker d -->
        <one in="hwwwwwa" out="*ddddd*" symmetry="(xy)" steps="1"/>
        <all in="hwwwwwa/hddddda" out="*ddddd*/*******" symmetry="(xy)" steps="6"/>

        <!-- Hollow interior of dovecote tower (t) on z=0 before rising: 2px stone walls, inner floor #35 -->
        <all in="ttttt/ttttt/ttttt/ttttt/ttttt" out="*****/*****/**#35**/*****/*****"/>
        <all in="#35t/tt" out="#35#35/**" steps="0"/>

        <!-- B. HEIGHTS -->
        <!-- Main farmhouse walls (w) & door wall (d): 2 storeys = 66 high + roof R -->
        <all steps="1">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d d"/>
        </all>
        <!-- z=1: door seed O at floor level -->
        <all in="B d" out="d O" steps="1"/>
        <!-- Ground floor wall: 7 base, 12 window band X, 13 upper (reaches z=33) -->
        <all in="B w" out="w W" steps="7"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w W" steps="13"/>
        <!-- Door header rises from z=2 to z=66 as wall W -->
        <all in="B d" out="d W" steps="64"/>
        <prl in="d" out="R"/>
        <!-- Second floor wall: 2 slab + 6 base, 12 window band X, 13 upper (reaches z=66) -->
        <all in="B w" out="w W" steps="8"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w W" steps="13"/>
        <prl in="w" out="R"/>

        <!-- Main farmhouse interior (h) and stair zone (s) -->
        <!-- z=0 stays h/s (area="house"), z=1 is wood floor f, z=2 has stair strip T -->
        <!-- Ground floor clear air: z=2..32 (31 voxels clear!), slab F at z=33..34, 2nd floor air: z=35..65 (31 clear!), ceiling R at z=66 -->
        <all steps="1">
          <rule in="B h" out="h h"/>
          <rule in="B s" out="s s"/>
        </all>
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- z=33..34: second floor slab F -->
        <all steps="2">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second storey air: 31 clear (z=35..65) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- z=66: attic ceiling / roof deck R -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Barn wing: walls (v), barn doorway (u), barn floor (a) — 1 tall storey (40 high) + roof J -->
        <!-- Uses its own window band Y so barn walls stay V and never overwrite farmhouse W -->
        <all steps="1">
          <rule in="B v" out="v V"/>
          <rule in="B u" out="u u"/>
          <rule in="B a" out="a a"/>
        </all>
        <all in="B u" out="u O" steps="1"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="38"/>
        <prl in="a" out="J"/>
        <all in="B v" out="v V" steps="10"/>
        <all in="B v" out="v Y" steps="12"/>
        <all in="B v" out="v V" steps="17"/>
        <prl in="v" out="J"/>
        <all in="B u" out="u V" steps="38"/>
        <prl in="u" out="J"/>

        <!-- Lean-to porch: floor (l, p) at z=0, posts (b) rise 33, roof J at z=34 (33 clear above z=0) -->
        <all steps="1">
          <rule in="B l" out="#31 l"/>
          <rule in="B p" out="#31 p"/>
          <rule in="B b" out="b p"/>
        </all>
        <all in="B b" out="b b" steps="32"/>
        <prl in="b" out="J"/>
        <all in="B #31" out="#31 B" steps="33"/>
        <prl in="#31" out="J"/>

        <!-- Dovecote / silo tower (t, inner #35): hollow stone tower Z, 50 high, flat platform F at 49, Z parapet at 50 -->
        <all steps="1">
          <rule in="B t" out="t Z"/>
          <rule in="B #35" out="#35 f"/>
        </all>
        <all in="B t" out="t Z" steps="48"/>
        <all in="B #35" out="#35 B" steps="47"/>
        <all in="B #35" out="#35 F" steps="1"/>
        <prl in="t" out="Z"/>
        <prl in="#35" out="B"/>

        <!-- Low dry-stone yard fence (z -> #36): 8 high, plain stone wall without merlons -->
        <all in="B z" out="z #36" steps="7"/>
        <prl in="z" out="#36"/>

        <!-- Well (Q stone rim 10 high, A water 5 deep) -->
        <all in="B Q" out="Q #36" steps="9"/>
        <prl in="Q" out="#36"/>
        <all in="B A" out="A A" steps="4"/>
        <prl in="A" out="A"/>

        <!-- Haystacks (y): rounded golden mound 14 high -->
        <all in="B y" out="y y" steps="8"/>
        <all in="yyy/yyy/yyy B/B/B" out="***/***/*** */y/*" symmetry="()" steps="5"/>

        <!-- Orchard fruit trees (#32 trunk, #33 canopy marker -> #34 canopy leaves) -->
        <all in="B #32" out="#32 b" steps="12"/>
        <prl in="#32" out="#34"/>
        <all in="B #33" out="#33 j" steps="1"/>
        <all in="B #33" out="#33 B" steps="7"/>
        <all in="B #33" out="#33 #34" steps="9"/>
        <prl in="#33" out="#34"/>
        <all in="#34B" out="*#34" steps="2"/>
        <all in="B #34" out="#34 #34" steps="2"/>

        <!-- C. FULL SCALE PARTS, WINDOWS, ROOFS & DETAILS -->
        <!-- Doors & Stair -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- Battlements & Arrow Slits on the dovecote tower (Z only) -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in farmhouse window bands (X) -->
        <one steps="14">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>

        <!-- Windows in barn window bands (Y) -->
        <one steps="6">
          <rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LYYYYB" out="*LLLL*"/>

        <!-- Restore remaining window bands cleanly to their own walls -->
        <prl>
          <rule in="X" out="W"/>
          <rule in="Y" out="V"/>
        </prl>

        <!-- Timber horizontal belt-course / beams on farmhouse facade at slab height -->
        <all in="WF" out="b*"/>

        <!-- Eaves & pitched hip roof on main farmhouse (R) -->
        <all in="RB" out="*R" steps="2"/>
        <all in="RB/*R" out="*R/**"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- Brick chimney (K) rising through farmhouse roof -->
        <one in="RRR/RRR/RRR BBB/BBB/BBB" out="***/***/*** ***/*K*/***" symmetry="()" steps="1"/>
        <all in="KB" out="*K" steps="1"/>
        <all in="KB/*K" out="*K/**"/>
        <all in="B K" out="K K" steps="10"/>

        <!-- Eaves & pitched roof on barn and lean-to (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="JB/*J" out="*J/**"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="9" symmetry="()"/>

        <!-- Final cleanup of helper markers -->
        <prl>
          <rule in="#31" out="B"/>
          <rule in="#32" out="b"/>
          <rule in="#33" out="j"/>
          <rule in="#35" out="f"/>
          <rule in="Q" out="#36"/>
        </prl>
      </sequence>
    </map>
  </map>

  <!-- Palette: cozy medieval cartoon style, warm plaster, terracotta roofs, timber accents, stone & greenery -->
  <!-- Ground & Area symbols preserved at z=0 -->
  <color symbol="h" value="c8a272" name="pavimento di casa" area="house"/>
  <color symbol="s" value="c8a272" name="vano scala" area="house"/>
  <color symbol="w" value="ebe0c8" name="fondamenta di casa" area="house"/>
  <color symbol="d" value="c8a272" name="soglia di casa" area="house"/>
  <color symbol="a" value="b58e5e" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="d4bfa0" name="fondamenta del fienile" area="barn"/>
  <color symbol="u" value="b58e5e" name="soglia del fienile" area="barn"/>
  <color symbol="l" value="bfa682" name="pavimento della tettoia" area="porch"/>
  <color symbol="p" value="bfa682" name="bordo della tettoia" area="porch"/>
  <color symbol="c" value="d4c19c" name="aia in terra battuta" area="yard"/>
  <color symbol="q" value="9a9e9c" name="base del pozzo" area="yard"/>
  <color symbol="z" value="989690" name="base del muretto" area="yard"/>
  <color symbol="t" value="989690" name="fondamenta della colombaia" area="tower"/>
  <color symbol="r" value="b8a482" name="sentiero" area="road"/>
  <color symbol="g" value="8c6d46" name="orto arato" area="field"/>
  <color symbol="P" value="6e8c42" name="filare di ortaggi" area="field"/>
  <color symbol="j" value="88ab55" name="prato del frutteto" area="orchard"/>
  <color symbol="e" value="88ab55" name="terra del frutteto" area="orchard"/>
  <color symbol="i" value="c8a272" name="centro casa" area="house"/>

  <!-- Structural & Architectural materials -->
  <color symbol="W" value="ebe0c8" name="muro intonacato" area="house"/>
  <color symbol="V" value="d4bfa0" name="muro del fienile" area="barn"/>
  <color symbol="X" value="ebe0c8" name="fascia muraria"/>
  <color symbol="Y" value="d4bfa0" name="fascia del fienile"/>
  <color symbol="Z" value="989690" name="pietra della colombaia" area="tower"/>
  <color symbol="#36" value="8f8c84" name="muretto a secco" area="yard"/>
  <color symbol="Q" value="8f8c84" name="bordo del pozzo" area="yard"/>
  <color symbol="f" value="b88c58" name="tavolato di legno"/>
  <color symbol="F" value="9e7344" name="solaio di legno"/>
  <color symbol="b" value="6e4a2c" name="trave di quercia"/>
  <color symbol="R" value="c4563a" name="tetto di coppi"/>
  <color symbol="J" value="a84830" name="tettoia di tegole"/>
  <color symbol="K" value="9e3e2c" name="comignolo di mattoni"/>
  <color symbol="L" value="6ba3be" name="finestra"/>
  <color symbol="A" value="4f8fb8" name="acqua del pozzo"/>
  <color symbol="y" value="dfc156" name="pagliaio" area="yard"/>
  <color symbol="#34" value="588c3e" name="chioma di albero"/>

  <!-- Imported parts colours & helper markers -->
  <color symbol="O" value="855432" name="porta di legno"/>
  <color symbol="o" value="54331c" name="assi della porta"/>
  <color symbol="N" value="78756e" name="stipite di pietra"/>
  <color symbol="T" value="a67b4b" hidden="True"/>
  <color symbol="k" value="a67b4b" name="gradini di legno"/>
  <color symbol="M" value="989690" name="merlatura di pietra"/>
  <color symbol="U" value="33302c" name="feritoia"/>

  <!-- Hidden markers -->
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#31" hidden="True"/>
  <color symbol="#32" value="6e4a2c" hidden="True"/>
  <color symbol="#33" value="88ab55" hidden="True"/>
  <color symbol="#35" value="b88c58" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>

  <!-- Interactive door actions -->
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
```
