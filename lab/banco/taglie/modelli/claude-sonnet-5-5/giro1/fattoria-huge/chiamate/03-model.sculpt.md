# model.sculpt · claude-sonnet-5-5 · 90 s

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
<!-- FATTORIA: the parts and where each goes (plan on 5-voxel cells, front = large y).
 1. House (h, walls w): a body of 9 x 9-10 cells around the centre H. A stair zone (s) sits against the back wall, 2 cells of landing from the west wall.
 2. Door (d) in the middle of the front wall, 3 cells wide. A porch (p) of 3 x 2 in front of it, then the road (r) straight to the edge of the box.
 3. Hay lean-to (y, 5 x 4) against the back wall, behind the house. Its position along the wall is chosen by the seed.
 4. Wing (a, walls v), 6 x 7 inside, against a side wall of the house. Only where 8 cells of free ground reach the wall (Huge and up). The seed chooses side and row.
 5. Barn (b, walls u), 9 x 7 inside, against the other side wall. Only where 12 cells are free (Gargantuan). It takes the side the wing did not take.
 6. Field (f) on the side of the road, a well (Q) beside the road, trees (t crown, x trunk), and an orchard in rows (g) where an 11 x 7 lawn is free.
 What the seeds change: the front line (+1 by chance), the side and row of wing and barn, the place of the hay, the side of the field and the well, the trees.
 What fits: Large = house + porch + hay + a few trees. Huge = + wing, field, well. Gargantuan = + barn, second field, orchard. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwabuvdpryfgtxsmQ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the body of the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the door in the middle of the front wall, the porch, the road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>

      <!-- the barn -->
      <one in="EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw"
           out="*************/*************/*************/*************/***********b*/*************/*************/*************/*************"
           symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="8"/>
      <all in="E/b" out="b/*" symmetry="()" steps="3"/>
      <all in="b/E" out="*/b" symmetry="()" steps="3"/>
      <all in="bE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- the wing -->
      <one in="EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw"
           out="*********/*********/*********/*********/*******a*/*********/*********/*********/*********"
           symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- the hay lean-to behind the back wall: 5 wide, 4 deep, touching the wall -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/wwwwwww"
           out="*******/*yyyyy*/*yyyyy*/*yyyyy*/*yyyyy*/*******"
           symmetry="()" steps="1"/>

      <!-- fields and well on the side of the road -->
      <one in="EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr"
           out="*********/**ffffff*/**ffffff*/**ffffff*/**ffffff*/*********"
           symmetry="(x)" steps="1"/>
      <one in="EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr"
           out="*********/**ffffff*/**ffffff*/**ffffff*/**ffffff*/*********"
           symmetry="(x)" steps="1"/>
      <one in="EEEEr/EEEEr/EEEEr/EEEEr" out="*****/**QQ*/**QQ*/*****" symmetry="(x)" steps="1"/>

      <!-- the orchard in rows -->
      <one in="EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE"
           out="***********/*g***g***g*/***********/*g***g***g*/***********/*g***g***g*/***********"
           symmetry="()" steps="1"/>

      <!-- trees: crown t around a trunk x -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*ttt*/*txt*/*ttt*/*****" steps="3"/>

      <!-- the zone of the stair -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhwabuvdprYyfgtxsQWVZULPADFRJTkOoNKCXqj" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="m" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>

      <union symbol="+" values="WVZU"/>
      <union symbol="=" values="PADF"/>
      <union symbol="%" values="WVZ"/>

      <sequence symmetry="(xy)">
        <!-- B. the heights: house walls, two storeys -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- the wall of the door: plain plaster -->
        <all in="B d" out="d W" steps="64"/>
        <prl in="d" out="R"/>
        <!-- wing walls: one storey -->
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v U" steps="14"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="R"/>
        <!-- barn walls: one storey -->
        <all in="B u" out="u Z" steps="6"/>
        <all in="B u" out="u U" steps="14"/>
        <all in="B u" out="u Z" steps="12"/>
        <prl in="u" out="R"/>

        <!-- house floor, strip of the stair, air, slab, air, ceiling -->
        <all steps="1"><rule in="B h" out="h P"/><rule in="B s" out="s P"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- wing and barn: floor, air, ceiling under the roof -->
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all in="B b" out="b D" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <prl in="b" out="R"/>

        <!-- porch and hay lean-to: a roof at 34 -->
        <all in="B p" out="y *" steps="1"/>
        <all in="B Y" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- trees -->
        <all in="B x" out="x K" steps="12"/>
        <all in="B x" out="x C" steps="10"/>
        <prl in="x" out="C"/>
        <all in="B t" out="t E" steps="1"/>
        <all in="B t" out="t B" steps="7"/>
        <all in="B t" out="t C" steps="10"/>
        <prl in="t" out="C"/>
        <!-- orchard bushes, the ground letter stays below -->
        <all in="B g" out="j *" steps="1"/>
        <all in="B j" out="j C" steps="8"/>
        <prl in="j" out="C"/>
        <!-- the well: stone block with water on top -->
        <all in="B Q" out="Q X" steps="8"/>
        <all in="B Q" out="Q q" steps="1"/>
        <prl in="Q" out="B"/>

        <!-- C. the doors -->
        <all in="W/p" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <one in="VVVVVVVVVVV/EEEEEEEEEEE" out="OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <all in="V/O" out="O/*" symmetry="()" steps="4"/>
        <one in="ZZZZZZZZZZZ/EEEEEEEEEEE" out="OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <all in="Z/O" out="O/*" symmetry="()" steps="4"/>
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- windows in the band, through the wall -->
        <one steps="30">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                 out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- roofs: eaves, then a hip with a slope of one in two -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="8DAA5B" name="prato" hidden="True"/>
  <color symbol="H" value="D8C9A3" name="centro" area="house"/>
  <color symbol="h" value="D8C9A3" name="pavimento della casa" area="house"/>
  <color symbol="w" value="C9B38A" name="muro della casa"/>
  <color symbol="a" value="E0B97A" name="interno dell'ala" area="wing"/>
  <color symbol="v" value="B98B5A" name="muro dell'ala"/>
  <color symbol="b" value="C79A4E" name="interno del fienile" area="barn"/>
  <color symbol="u" value="8E5B3A" name="muro del fienile"/>
  <color symbol="d" value="5A3A24" name="muro della porta"/>
  <color symbol="p" value="A98B5E" name="portico" area="porch"/>
  <color symbol="r" value="B7AE98" name="strada"/>
  <color symbol="y" value="E3C54B" name="fieno" area="hay"/>
  <color symbol="Y" value="E3C54B" name="paglia" area="hay"/>
  <color symbol="f" value="9C7A3C" name="campo" area="field"/>
  <color symbol="g" value="5E8F3E" name="frutteto" area="orchard"/>
  <color symbol="t" value="3F7A3A" name="chioma"/>
  <color symbol="x" value="6B4A2E" name="tronco del segno"/>
  <color symbol="s" value="C06A3E" name="zona della scala"/>
  <color symbol="m" value="FF00FF" name="segno" hidden="True"/>
  <color symbol="Q" value="5E8FB8" name="pozzo"/>
  <color symbol="j" value="FF00FF" name="segno del cespuglio" hidden="True"/>
  <color symbol="W" value="E4D6B0" name="intonaco"/>
  <color symbol="V" value="B98B5A" name="legno dell'ala"/>
  <color symbol="Z" value="7A4A2E" name="assi del fienile"/>
  <color symbol="U" value="8A6A44" name="fascia delle finestre"/>
  <color symbol="L" value="8EC5D6" name="vetro"/>
  <color symbol="P" value="BF9A66" name="assi del pavimento" area="house"/>
  <color symbol="A" value="D9B77C" name="pavimento dell'ala" area="wing"/>
  <color symbol="D" value="B7873E" name="pavimento del fienile" area="barn"/>
  <color symbol="F" value="8F8576" name="solaio"/>
  <color symbol="R" value="B5473A" name="tetto di coppi"/>
  <color symbol="J" value="7A4F34" name="tettoia"/>
  <color symbol="T" value="7F7F7F" name="traccia della scala" hidden="True"/>
  <color symbol="k" value="A0907A" name="gradini"/>
  <color symbol="O" value="6B4226" name="porta"/>
  <color symbol="o" value="3E2615" name="assi della porta"/>
  <color symbol="N" value="4A3A2E" name="stipite"/>
  <color symbol="K" value="5A3C28" name="tronco"/>
  <color symbol="C" value="3F7A3A" name="fogliame"/>
  <color symbol="X" value="8A8A8A" name="pietra del pozzo"/>
  <color symbol="q" value="5E8FB8" name="acqua del pozzo" area="well"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
It does not pass: taglia Enorme, seme 1: pezzi staccati: 8% dei voxel non è attaccato al corpo principale (13 pezzi) — everything must rest on the bottom and be attached to the main body
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, p portico, r strada, f campo, g frutteto, Y paglia, W intonaco, V legno dell'ala, L vetro, P assi del pavimento, A pavimento dell'ala, F solaio, R tetto di coppi, J tettoia, k gradini, O porta, o assi della porta, N stipite, K tronco, C fogliame
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEECCEEEEECEEEEECCEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEECCEEEEECEEEEECCEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEECEEEEEECEEEEEECEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEECCCCCEEE
EEEEEEEEEEEEEEEEEEEECEEEEEECEEEEEECEEEEEEECCCCCEEE
EEEEEEEEEEEEEEEEEEEECCEEEEECEEEEECCEEEEEEECCCCCEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEECCCCCEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEECCCCEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEECCCCEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEECCCCCEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEECCCCCEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEECCCCCEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEECCCCCEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEEEEEEEEE
EEEECCCCEEEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEEEEEEEEE
EEECCCCCEEEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEEEEEEEEE
EEECCCCCEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEECCCCCEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEECCCCCEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000220000222000022000000000000000
00000000000000000000220000222000022000000000000000
00000000000000000000220000222000022000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000220000222000022000000000000000
00000000000000000000220000222000022000000555555000
00000000000000000000000000000000000000000555555000
00000000000000000000220000222000022000000556655000
00000000000000000000220000222000022000000556655000
00000000000000000000000000000000000000000555555000
0000000000000000000000000aaaaaaaaa0000000555555000
0000000000000000000000000aaaaaaaaa0000000000000000
0000000000000000000000000aaaaaaaaa0000000000000000
0000000000000000000000000aaaaaaaaa0000000000000000
0000000000000000000000000aaaaaaaaa0000000000000000
0000000000000000000000000aaaaaaaaa0000000000000000
0000000000000000000000000aaaaaaaaa0000000000000000
0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
0000099999999999jjjjjjjjjjjjjjjjjjjj00000000000000
00009aaaaaaaaaaajjkkkkkkkkkkkkkkkkjj00000000000000
00009aaaaaaaaaaajjkkkkkkkkkkkkkkkkjj00000000000000
00009aabbbbbbbaajjkkllllllllllllkkjj00000000000000
00009aabbbbbbbaajjkkllllllllllllkkjj00555555000000
00009aabbbbbbbaajjkkllmmmmmmmmllkkjj00555555000000
00009aabbbccbbaajjkkllmmmmmmmmllkkjj00556655000000
00009aabbbccbbaajjkkllmmmmmmmmllkkjj00556655000000
00009aabbbccbbaajjkkllmmmmmmmmllkkjj00555555000000
00009aabbbccbbaajjkkllmmmmmmmmllkkjj00555555000000
00009aabbbccbbaajjkkllmmmmmmmmllkkjj00000000000000
00009aabbbbbbbaajjkkllmmmmmmmmllkkjj00000000000000
00009aabbbbbbbaajjkkllllllllllllkkjj00000000000000
00009aabbbbbbbaajjkkllllllllllllkkjj00000000000000
00009aaaaaaaaaaajjkkkkkkkkkkkkkkkkjj00000000000000
00009aaaaaaaaaaajjkkkkkkkkkkkkkkkkjj00000000000000
0000099999999999jjjjjjjjjjjjjjjjjjjj00000000000000
0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
00000000000000000000000aaaaaa000000000000000000000
00055555500000000000000aaaaaa000000000000000000000
00055555500000000000000aaaaaa000000000000000000000
00055665500000000000000000000000000000000000000000
00055665500000000000000000000000000000000000000000
00055555500000000000000000000000000000000000000000
00055555500000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
..........R......WWWWWWWWWWWWWWWWWW...............
........RRRRR....WWWWWWWWWWWWWWWWWW...............
......RRRRRRRRR..WWWWWWWWWWWWWWWWWW...............
.....VNNNVVVVVVVVWWWWWWWWWWWWWWWWWW...............
.....VoooOVVVVVVVWWWWWWNooooOWWWWWW...............
.....VoooOVVVVVVVWWWWWWNooooOWWWWWW...............
.....CoooOVVVVVVVWWWWWWNooooOWWWWWW.....C...C.....
.....CCooOWWWWWWWWWWWWWNooooOWWWWWW.....CC.CC.....
...CCCCCoOWWWLLWWWWWWLLNooooOWWWWWW...CCCCCCCCC...
...CCCCCoOWWWLLWWWWWWLLNooooOWWWWWW...CCCCCCCCC...
...CCCCCoOWWWLLWWWWWWLWNooooOWWWWWW...CCCCCCCCC...
.....KKooOWWWWWWWWWWWWWNooooOWWWWWW.....KK.KK.....
.....KKooOVVVVVVVWWWWWWNooooOWWWWWW.....KK.KK.....
.....KKooEVVVVVVVWWWWWWrooooEWWWWWW.....KK.KK.....
```
Right side (looking from the right):
```
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWLLWWWWWWW.............
..................WWWWWWWLLWLLLLWWWWW.............
..................WWWWWWWLLWWLLLWWWWW.............
..................WWWWWWWLWWWWLLWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
.........C........WWWWWWWCWWWWWWWWWWW...C.........
........CC........WWWWWWWCCWWWWWWWWWW...CC........
.......CCCCC......WWWWWCCCCCCLLWWLLWW.CCCCC.......
.......CCCCC......WWWLWCCCCCCLLWWLLWW.CCCCC.......
......CCCCCC......WWWLLCCCCCWWWWWWWWW.CCCCC.......
..C..CC.KK........WWWLLWWKKWWWWWWWWWW...KK........
..C..CC.KK........WWWWWWWKKWWWWWWWWWW...KK........
.ECE.CC.KK........WWWWWWWKKWWWWWWWWWW...KK........
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
..........................................CCCCC...
..........................................CCKCC...
..........................................CKKCC...
..........................................CCCCC...
..........................................CCCC....
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................WWLLWWWWWWWWWLLWWW...............
.................WWLLWWWWWWWWWLLWWW...............
.....WLLWWWWWWLLWW.....kkkk......WW...............
.....WWLWWWWWWLLWW.....kkkk......LL...............
.....LL..........L.....kkkk......LL...............
.....LL..........L...............WW....CCCC.......
.....WW..........L...............LL...CCCCC.......
.....WW..........W...............LL...CCKKC.......
.....WW..........L...............WW...CCKCC.......
.....LL..........L...............WW...CCCCC.......
.....LL..........L...............WW...............
.....LL..........W...............LL...............
.....WW..........W...............LL...............
.....WW..........W...............WW...............
.....LL..........W...............WW...............
.....LoooNWWWLLWWW...............LL...............
.....WoooNWWWLLWWW...............LL...............
.................WWWWLLoooooNWWWWWW...............
.................WWWWLLoooooNWWWWWW...............
..................................................
....CCCC..........................................
...CCCCC..........................................
...CCKKC..........................................
...CCKCC..........................................
...CCCCC..........................................
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
..................................................
..................................................
..................................................
.................LLWLLWWWWWLLLLLWWW...............
.................WLWLLWWWWWLLWWWWWW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............LL...............
.................W...............LL...............
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000055555500000000000000000000000000000000000000
EEEEEEECCCCCEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000055555500000000000000000000000000000000000000
EEEEEEECCCCCEEEEEEEEEEEEEEEEEEEECEEEEEECEEEEECEEEE   00000055665500000000000000000002220000220000022000
EEEEEEECCCCCEEEEEEEEEEEEEEEEEEEECEEEEECCEEEEECCEEE   00000055665500000000000000000002220000220000022000
EEEEEEECCCCCEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000055555500000000000000000000000000000000000000
EEEEEEECCCCEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000055555500000000000000000002220000220000022000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEECEEEEECCEEEEECCEEE   00000000000000000000000000000002220000220000022000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000002220000220000022000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEECEEEEECCEEEEECCEEE   00000000000000000000000000000002220000220000022000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEECEEEEEECEEEEECEEEE   00000000000000000000aaaaaaaaa002220000220000022000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000aaaaaaaaa000000000000000000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000aaaaaaaaa000000000000000000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000aaaaaaaaa000000000000000000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEECCCCCEEEEEEEE   00000000000000000000aaaaaaaaa000000055555500000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEECCCCCEEEEEEEE   00000000000000000000aaaaaaaaa000000055665500000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEECCCCCEEEEEEEE   00000000000000000000aaaaaaaaa000000055665500000000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREECCCCCEEEEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj55665500000000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREECCCCCEEEEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj55555500000000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   0000000000000000jjkkkkkkkkkkkkkkkkjj00000000000000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkkkkkkkkkkkkkkkjj99999999999000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkllllllllllllkkjjaaaaaaaaaaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkllllllllllllkkjjaaaaaaaaaaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkllmmmmmmmmllkkjjabbbbbbbbaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkllmmmmmmmmllkkjjabbbbbbbbaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkllmmmmmmmmllkkjjabbbccbbbaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkllmmmmmmmmllkkjjabbbccbbbaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkllmmmmmmmmllkkjjabbbccbbbaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjkkllmmmmmmmmllkkjjabbbccbbbaa000
EEEEEEEECCCCCEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000055555500jjkkllmmmmmmmmllkkjjabbbccbbbaa000
EEEEEEEECCCCCEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000055665500jjkkllllllllllllkkjjabbbccbbbaa000
EEEEEEEECCCCCEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000055665500jjkkllllllllllllkkjjabbbbbbbbaa000
EEEEEEEECCCCCEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000055665500jjkkkkkkkkkkkkkkkkjjabbbbbbbbaa000
EEEEEEEECCCCCEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000055555500jjkkkkkkkkkkkkkkkkjjabbbbbbbbaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjjjjjjjjjjjjjjjjjjjaaaaaaaaaaa000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE   0000000000000000jjjjjjjjjjjjjjjjjjjjaaaaaaaaaaa000
EEEEEEEEEEEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000aaaaaa000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000aaaaaa000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000aaaaaa000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000005555550000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEECCCCCEEEEEEEEEEEEEEEEE   00000000000000000000000000005555550000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEECCCCCEEEEEEEEEEEEEEEEE   00000000000000000000000000005566550000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEECCCCCEEEEEEEEEEEEEEEEE   00000000000000000000000000005566550000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEECCCCCEEEEEEEEEEEEEEEEE   00000000000000000000000000005555550000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEECCCCEEEEEEEEEEEEEEEEE   00000220000222000022000000005555550000000000000000
EEEEECCEEEEECEEEEECCEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000220000222000022000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000220000222000022000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEECCEEEEECEEEEECCEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000220000222000022000000000000000000000000000000
EEEEECEEEEEECEEEEEECEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000002200002220000220aaaaaaaaa00000000000000000000
EEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEE   000000000000000000000aaaaaaaaa00000000000000000000
EEEEECEEEEEECEEEEEECEEJJJJJJJJEEEEEEEEEEEEEEEEEEEE   000002200002220000220aaaaaaaaa00000000000000000000
EEEEECCEEEEECEEEEECCEEJJJJJJJJEEEEEEEEEEEEEEEEEEEE   000002200002220000220aaaaaaaaa00000000000000000000
EEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEE   000000000000000000000aaaaaaaaa00000000000000000000
EEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEE   000000000000000000000aaaaaaaaa00000000000000000000
EEEEEEEEEEEEEEEEEEEEEEJJJJJJJJEEEEEEEEEEEEEEEEEEEE   000000000000000000000aaaaaaaaa00000000000000000000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   0000099999999999jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aaaaaaaaaaajjkkkkkkkkkkkkkkkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aaaaaaaaaaajjkkkkkkkkkkkkkkkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbbbbbaajjkkllllllllllllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbbbbbaajjkkllllllllllllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbbbbbaajjkkllmmmmmmmmllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbccbbaajjkkllmmmmmmmmllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbccbbaajjkkllmmmmmmmmllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbccbbaajjkkllmmmmmmmmllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbccbbaajjkkllmmmmmmmmllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbccbbaajjkkllmmmmmmmmllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbbbbbaajjkkllmmmmmmmmllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbbbbbaajjkkllllllllllllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aabbbbbbbaajjkkllllllllllllkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aaaaaaaaaaajjkkkkkkkkkkkkkkkkjj00000000000000
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   00009aaaaaaaaaaajjkkkkkkkkkkkkkkkkjj00000000000000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   0000099999999999jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRREEEEEEEEEEEEEEE   0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEEEEEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000aaaaaa000000000000000000000
EEEEECCCCCEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEEECCCCEE   00000555550000000000000aaaaaa000000000000005555550
EEEEECCCCCEEEEEEEEEEEEEJJJJJEEEEEEEEEEEEEEECCCCCEE   00000555550000000000000aaaaaa000000000000005555550
EEEEECCCCCEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEECCCCCEE   00000566650000000000000000000000000000000005566550
EEEEECCCCCEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEECCCCCEE   00000566650000000000000000000000000000000005566550
EEEEECCCCCEEEffffffffffrrrrrffffffffffEEEEECCCCCEE   00000555550000000000000000000000000000000005555550
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000555550000000000000000000000000000000005555550
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEffffffffffrrrrrffffffffffEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.39 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 139 nodi, 617 passi, finito in 732 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=prato (marcatore), h=pavimento della casa, w=muro della casa, a=interno dell'ala, v=muro dell'ala, d=muro della porta, p=portico, r=strada, y=fieno, f=campo, g=frutteto, t=chioma, x=tronco del segno, s=zona della scala, m=segno (marcatore), W=intonaco, V=legno dell'ala, U=fascia delle finestre, L=vetro, P=assi del pavimento, A=pavimento dell'ala, F=solaio, R=tetto di coppi, J=tettoia, T=traccia della scala (marcatore), k=gradini, O=porta, o=assi della porta, N=stipite, K=tronco, C=fogliame, j=segno del cespuglio (marcatore), #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 61901, R 23353, E 15300, C 9450, V 8307, L 5872, o 3660, k 2720, P 2025, F 1865, f 1200, A 1050, K 900, N 820, J 650, Y 500, r 450, O 240, g 225, p 150.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-38 all×18, prl×1, one×7: 332 celle x2-27 y1-29 z0, passi 2-53
   #40 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 54
#42-43 all×2: 37000 celle x50-104 y55-109 z0-20, passi 55-74
#44-45 all×2: 33300 celle x50-104 y55-109 z20-38, passi 75-92
    #46 all . w → w U passi=14: ×14, 25900 celle x50-104 y55-109 z38-52, passi 93-106, w→U 12950, .→w 12950
    #47 all . w → w W passi=12: ×12, 22200 celle x50-104 y55-109 z52-64, passi 107-118, w→W 11100, .→w 11100
#48-52 prl×2, all×3: 31600 celle x15-104 y55-109 z0-64, passi 119-204
#53-60 all×3, prl×1: 17575 celle x15-99 y60-104 z0-32, passi 205-219
    #61 all . h → h . passi=31: ×31, 113150 celle x55-99 y60-104 z1-32, passi 220-250, h→. 56575, .→h 56575
#62-63 all×2: 16050 celle x55-99 y60-104 z2-33, passi 251-281
    #64 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-64, passi 282-312, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#65-66 prl×1, all×1: 4125 celle x20-99 y60-104 z0-64, passi 313-314
    #67 all . a → a . passi=31: ×31, 65100 celle x20-49 y65-99 z1-32, passi 315-345, a→. 32550, .→a 32550
#68-73 prl×1, all×2: 1700 celle x20-99 y35-119 z1-32, passi 346-348
    #74 all . y → y . passi=33: ×33, 42900 celle x70-99 y35-119 z1-34, passi 349-381, y→. 21450, .→y 21450
#75-80 prl×2, all×4: 13625 celle x10-139 y20-129 z0-34, passi 382-413
#81-125 all×13, prl×3, one×1: 25570 celle x10-139 y5-129 z0-30, passi 414-494
#126-136 all×7, prl×3, one×1: 18662 celle x15-104 y55-109 z1-51, passi 495-605
    #137 prl U → W: ×1, 26286 celle x15-104 y55-109 z6-51, passi 606, U→W 26286
#138-139 all×2: 18753 celle x14-105 y54-110 z32-74, passi 607-617
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#20 one EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEE… → *************/*************/*************/*****… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#21 all bE → *b passi=8: in quel momento nella griglia non c'erano celle "b"
#22 all E/b → b/* passi=3: in quel momento nella griglia non c'erano celle "b"
#23 all b/E → */b passi=3: in quel momento nella griglia non c'erano celle "b"
#24 all bE → *u: in quel momento nella griglia non c'erano celle "b"
#25 all uE/*u → *u/**: in quel momento nella griglia non c'erano celle "u"
#35 one EEEEr/EEEEr/EEEEr/EEEEr → *****/**QQ*/**QQ*/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#55 all . u → u Z passi=6: in quel momento nella griglia non c'erano celle "u"
#56 all . u → u U passi=14: in quel momento nella griglia non c'erano celle "u"
#57 all . u → u Z passi=12: in quel momento nella griglia non c'erano celle "u"
#58 prl u → R: in quel momento nella griglia non c'erano celle "u"
… e altri 29
Fix it and answer with the whole program.

## Risposta

<!-- FATTORIA: the parts and where each goes (plan on 5-voxel cells, front = large y).
 1. House (h, walls w): a body of 9 x 9-10 cells around the centre H. A stair zone (s) sits against the back wall, 2 cells of landing from the west wall.
 2. Door (d) in the middle of the front wall, 3 cells wide. A porch (p) of 3 x 2 in front of it, then the road (r) straight to the edge of the box.
 3. Hay lean-to (y, 5 x 4) against the back wall, behind the house. Its position along the wall is chosen by the seed.
 4. Wing (a, walls v), 6 x 7 inside, against a side wall of the house. Only where 8 cells of free ground reach the wall (Huge and up). The seed chooses side and row.
 5. Barn (b, walls u), 9 x 7 inside, against the other side wall. Only where 12 cells are free (Gargantuan).
 6. Field (f) on the side of the road, a well (Q) beside the road, trees (t crown, x trunk) leaning on the house walls so they are attached.
 What the seeds change: the front line (+1 by chance), the side and row of wing and barn, the place of the hay, the side of the field and the well, the trees.
 What fits: Large = house + porch + hay + a few trees. Huge = + wing, field, well. Gargantuan = + barn, second field. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwabuvdpryfgtxsmQ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>

      <one in="EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw"
           out="*************/*************/*************/*************/***********b*/*************/*************/*************/*************"
           symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="8"/>
      <all in="E/b" out="b/*" symmetry="()" steps="3"/>
      <all in="b/E" out="*/b" symmetry="()" steps="3"/>
      <all in="bE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <one in="EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw"
           out="*********/*********/*********/*********/*******a*/*********/*********/*********/*********"
           symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/wwwwwww"
           out="*******/*yyyyy*/*yyyyy*/*yyyyy*/*yyyyy*/*******"
           symmetry="()" steps="1"/>

      <one in="EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr"
           out="*********/**ffffff*/**ffffff*/**ffffff*/**ffffff*/*********"
           symmetry="(x)" steps="1"/>
      <one in="EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr"
           out="*********/**ffffff*/**ffffff*/**ffffff*/**ffffff*/*********"
           symmetry="(x)" steps="1"/>
      <one in="EEEEr/EEEEr/EEEEr/EEEEr" out="*****/**QQ*/**QQ*/*****" symmetry="(x)" steps="1"/>

      <!-- trees lean on a house wall so the crown touches it -->
      <one in="wEEEE/wEEEE/wEEEE" out="*ttt*/*txt*/*ttt*" steps="3"/>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhwabuvdprYyfgtxsQWVZULPADFRJTkOoNKCXqj" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="m" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>

      <union symbol="+" values="WVZU"/>
      <union symbol="=" values="PADF"/>
      <union symbol="%" values="WVZ"/>

      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B d" out="d W" steps="64"/>
        <prl in="d" out="R"/>
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v U" steps="14"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="R"/>
        <all in="B u" out="u Z" steps="6"/>
        <all in="B u" out="u U" steps="14"/>
        <all in="B u" out="u Z" steps="12"/>
        <prl in="u" out="R"/>

        <all steps="1"><rule in="B h" out="h P"/><rule in="B s" out="s P"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all in="B b" out="b D" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <prl in="b" out="R"/>

        <all in="B p" out="y *" steps="1"/>
        <all in="B Y" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <all in="B x" out="x K" steps="12"/>
        <all in="B x" out="x C" steps="10"/>
        <prl in="x" out="C"/>
        <all in="B t" out="t E" steps="1"/>
        <all in="B t" out="t B" steps="7"/>
        <all in="B t" out="t C" steps="10"/>
        <prl in="t" out="C"/>
        <all in="B g" out="j *" steps="1"/>
        <all in="B j" out="j C" steps="8"/>
        <prl in="j" out="C"/>
        <all in="B Q" out="Q X" steps="8"/>
        <all in="B Q" out="Q q" steps="1"/>
        <prl in="Q" out="B"/>

        <all in="W/p" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <one in="VVVVVVVVVVV/EEEEEEEEEEE" out="OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <all in="V/O" out="O/*" symmetry="()" steps="4"/>
        <one in="ZZZZZZZZZZZ/EEEEEEEEEEE" out="OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <all in="Z/O" out="O/*" symmetry="()" steps="4"/>
        <import file="part-door"/>
        <import file="part-stair"/>

        <one steps="30">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                 out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="8DAA5B" name="prato" hidden="True"/>
  <color symbol="H" value="D8C9A3" name="centro" area="house"/>
  <color symbol="h" value="D8C9A3" name="pavimento della casa" area="house"/>
  <color symbol="w" value="C9B38A" name="muro della casa"/>
  <color symbol="a" value="E0B97A" name="interno dell'ala" area="wing"/>
  <color symbol="v" value="B98B5A" name="muro dell'ala"/>
  <color symbol="b" value="C79A4E" name="interno del fienile" area="barn"/>
  <color symbol="u" value="8E5B3A" name="muro del fienile"/>
  <color symbol="d" value="5A3A24" name="muro della porta"/>
  <color symbol="p" value="A98B5E" name="portico" area="porch"/>
  <color symbol="r" value="B7AE98" name="strada"/>
  <color symbol="y" value="E3C54B" name="fieno" area="hay"/>
  <color symbol="Y" value="E3C54B" name="paglia" area="hay"/>
  <color symbol="f" value="9C7A3C" name="campo" area="field"/>
  <color symbol="g" value="5E8F3E" name="frutteto" area="orchard"/>
  <color symbol="t" value="3F7A3A" name="chioma"/>
  <color symbol="x" value="6B4A2E" name="tronco del segno"/>
  <color symbol="s" value="C06A3E" name="zona della scala"/>
  <color symbol="m" value="FF00FF" name="segno" hidden="True"/>
  <color symbol="Q" value="5E8FB8" name="pozzo"/>
  <color symbol="j" value="FF00FF" name="segno del cespuglio" hidden="True"/>
  <color symbol="W" value="E4D6B0" name="intonaco"/>
  <color symbol="V" value="B98B5A" name="legno dell'ala"/>
  <color symbol="Z" value="7A4A2E" name="assi del fienile"/>
  <color symbol="U" value="8A6A44" name="fascia delle finestre"/>
  <color symbol="L" value="8EC5D6" name="vetro"/>
  <color symbol="P" value="BF9A66" name="assi del pavimento" area="house"/>
  <color symbol="A" value="D9B77C" name="pavimento dell'ala" area="wing"/>
  <color symbol="D" value="B7873E" name="pavimento del fienile" area="barn"/>
  <color symbol="F" value="8F8576" name="solaio"/>
  <color symbol="R" value="B5473A" name="tetto di coppi"/>
  <color symbol="J" value="7A4F34" name="tettoia"/>
  <color symbol="T" value="7F7F7F" name="traccia della scala" hidden="True"/>
  <color symbol="k" value="A0907A" name="gradini"/>
  <color symbol="O" value="6B4226" name="porta"/>
  <color symbol="o" value="3E2615" name="assi della porta"/>
  <color symbol="N" value="4A3A2E" name="stipite"/>
  <color symbol="K" value="5A3C28" name="tronco"/>
  <color symbol="C" value="3F7A3A" name="fogliame"/>
  <color symbol="X" value="8A8A8A" name="pietra del pozzo"/>
  <color symbol="q" value="5E8FB8" name="acqua del pozzo" area="well"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
