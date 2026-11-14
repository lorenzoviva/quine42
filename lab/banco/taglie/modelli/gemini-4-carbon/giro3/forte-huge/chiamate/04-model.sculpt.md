# model.sculpt · gemini-4-carbon · 61 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
Concept: Forte (medieval fort with courtyard, curtain wall, corner towers, tall watchtower turret, gatehouse, central keep, side armory annex, courtyard well, outer moat & wooden bridge).
Parts & plan letters:
- h, w, s, d: Keep interior (h), keep walls (w), stair strip (s, 4x2 along back wall with landing before & after), keep front doorway (d).
- a, v, e: Low roofed hall annex (armory/barracks) attached to left or right wall of keep (a interior, v walls, e doorway into keep).
- c, n, Q: Courtyard (c) around keep and annex; stone paved path (n) from keep door to gatehouse; stone well (Q) where open yard allows.
- W, t, p, G, g: Curtain wall (W, 2 cells thick) with corner towers (t, 4x4 on 2-4 corners) and one taller watchtower turret (p); front gatehouse walls (G) and 3-cell central gate portal (g).
- r, m, b: Approach road (r) straight to front edge; at Gargantuan (40x40), where ground extends 4+ cells past the curtain wall, a water moat (m, 2 cells wide) rings the fort, crossed by a wooden bridge (b).
-->
<sequence values="BHEhwsdavcenQWtpGgrmbfFKZVDLIYXOoNTUkvM#20#21#90#91#92#94" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="KVZ"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="KVZ"/>

  <map scale="1/5 1/5 1" values="BHEhwsdavcenQWtpGgrmbxyz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- Shift H by 1 cell left or right on ~60% of seeds -->
      <prl in="EHE" out="xHE" p="0.6" steps="1"/>
      <one in="xHE" out="EH*" symmetry="(x)" steps="1"/>
      <prl in="x" out="E"/>

      <!-- Keep spine: shifted toward the back so courtyard opens in front -->
      <all in="E/[Hh]" out="h/*" steps="5"/>
      <all in="[Hh]/E" out="*/h" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1"/>
      <prl in="H" out="h"/>

      <!-- Keep width: 4 left, 3 or 4 right (interior 8..9 wide x 8..9 deep, 40..45 voxels clear) -->
      <all in="Eh" out="h*" steps="4"/>
      <all in="hE" out="*h" steps="3"/>
      <!-- Decide on a single corner cell whether to widen keep by 1 cell on the right -->
      <prl in="EE/hE" out="**/*z" p="0.5" steps="1"/>
      <all in="hE/*z" out="*z/**"/>
      <all in="*z/hE" out="**/*z"/>
      <prl in="z" out="h"/>

      <!-- Keep walls (w) -->
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Stair zone inside keep along back wall: 2 cells landing on left (10 voxels), 4 cells stair (s, 20 voxels), 2..3 cells landing on right -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/whhssssh/whhssssh" steps="1"/>

      <!-- Side hall annex (armory/barracks) on left or right wall of keep -->
      <one in="hE/wE/wE/wE/wE/wE/hE" out="**/**/*a/*a/*a/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" steps="2"/>
      <all in="a/E" out="*/a" steps="2"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <!-- Shared doorway (3 cells = 15 voxels wide) between keep and annex -->
      <one in="hva/hva/hva" out="*e*/*e*/*e*" symmetry="(x)" steps="1"/>
      <all in="hwe" out="*e*" symmetry="(x)"/>
      <all in="eva" out="**a" symmetry="(x)"/>

      <!-- Courtyard (c) around keep and annex: 2 cells base, plus 2 more in front -->
      <all in="[wv]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cE" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="c/E" out="*/c" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Expand courtyard where ample ground remains (Gargantuan 40x40) -->
      <all in="cEEEEEE" out="*cc****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Curtain wall (W, 2 cells thick) -->
      <all in="cE" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>
      <all in="WE" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers (t, 4x4): guaranteed on front corners, optional on back corners -->
      <all in="WE/EE" out="*t/**" symmetry="(x)"/>
      <one in="EE/EW" out="**/*t" symmetry="(x)" steps="1"/>
      <prl in="EE/EW" out="**/*t" p="0.5" symmetry="(x)" steps="1"/>
      <all steps="2" symmetry="(xy)">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Promote one corner tower to a taller watchtower turret (p) -->
      <one in="tttt/tttt/tttt/tttt" out="pppp/pppp/pppp/pppp" steps="1"/>

      <!-- Way out: straight forward from front keep wall (d -> n -> g/G -> r) -->
      <one in="hhhhh/wwwww/ccccc" out="*****/**d**/*****" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n"/>
      <all in="[ng]/W" out="*/g"/>
      <all in="[gr]/E" out="*/r"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="gW" out="*G" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>

      <!-- Stone well (Q, 2x2) in an open 4x4 courtyard area -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- Outer water moat (m) and wooden bridge (b) only where 4+ ground cells remain outside (Gargantuan) -->
      <all in="cWWEEEE" out="***mm**" symmetry="(xy)" steps="1"/>
      <all symmetry="(xy)" steps="45">
        <rule in="m/W/E" out="*/*/m"/>
        <rule in="m/t/E" out="*/*/m"/>
        <rule in="m/p/E" out="*/*/m"/>
        <rule in="m/G/E" out="*/*/m"/>
        <rule in="mE/WW" out="*m/**"/>
        <rule in="mE/tt" out="*m/**"/>
        <rule in="mE/pp" out="*m/**"/>
        <rule in="mE/GG" out="*m/**"/>
        <rule in="mE/Wt" out="*m/**"/>
        <rule in="mE/Wp" out="*m/**"/>
        <rule in="mE/WG" out="*m/**"/>
        <rule in="mr/GG" out="*b/**"/>
        <rule in="mr/gg" out="*b/**"/>
        <rule in="br/gg" out="*b/**"/>
        <rule in="br/GG" out="*b/**"/>
      </all>
      <all in="[WtGgp]mE" out="**m" symmetry="(xy)" steps="1"/>
      <all in="[WtGgp]b[Er]" out="**b" symmetry="(xy)" steps="1"/>
      <all in="mE/*m" out="*m/**" symmetry="(xy)"/>
      <all in="b[mr]/*b" out="*b/**" symmetry="(xy)"/>
    </sequence>

    <map scale="5 5 1" values="BHEhwsdavcenQWtpGgrmbfFKZVDLIYXOoNTUkvMJ#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>

      <sequence symmetry="()">
        <!-- ==================== B. HEIGHTS (COLUMNS BY STEPS) ==================== -->
        <!-- Keep walls (w): 2 storeys + roof parapet = 66 total, with window bands Y -->
        <all in="B w" out="w K" steps="8"/>
        <all in="B w" out="w Y" steps="14"/>
        <all in="B w" out="w K" steps="10"/>
        <all in="B w" out="w K" steps="8"/>
        <all in="B w" out="w Y" steps="14"/>
        <all in="B w" out="w K" steps="11"/>
        <prl in="w" out="K"/>

        <!-- Keep front door zone (d): seed O on z=0, then keep wall K/Y up to z=65 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="39"/>
        <all in="B d" out="d Y" steps="14"/>
        <all in="B d" out="d K" steps="11"/>
        <prl in="d" out="K"/>

        <!-- Keep interior door to annex (e): seed O on z=0, then keep wall K/Y up to z=65 -->
        <all in="B e" out="e O" steps="1"/>
        <all in="B e" out="e K" steps="39"/>
        <all in="B e" out="e Y" steps="14"/>
        <all in="B e" out="e K" steps="11"/>
        <prl in="e" out="K"/>

        <!-- Keep interior (h) & stair zone (s): 2 covered storeys (z=0 floor, z=32 slab, z=64 roof slab) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- z=1: stair strip T on s, air on h -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- z=32: first floor slab F -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- z=33..63: second storey air; z=64: roof slab F -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="31"/>
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Annex hall (a interior, v walls): 1 covered storey (z=0 floor D, z=1..33 air, z=34 pitched roof J) -->
        <all in="B v" out="v K" steps="8"/>
        <all in="B v" out="v Y" steps="12"/>
        <all in="B v" out="v K" steps="14"/>
        <prl in="v" out="J"/>

        <all in="B a" out="a D" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>

        <!-- Curtain wall (W): 24 high (z=0..23) of Z -->
        <all in="B W" out="W Z" steps="23"/>
        <prl in="W" out="Z"/>

        <!-- Gatehouse side walls/towers (G): 40 high (z=0..39) of Z -->
        <all in="B G" out="G Z" steps="16"/>
        <all in="B G" out="G Y" steps="12"/>
        <all in="B G" out="G Z" steps="11"/>
        <prl in="G" out="Z"/>

        <!-- Gatehouse portal (g): seed O on z=0, then Z up to z=39 -->
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g Z" steps="38"/>
        <prl in="g" out="Z"/>

        <!-- Corner towers (t): 42 high (z=0..41) of V with window band -->
        <all in="B t" out="t V" steps="18"/>
        <all in="B t" out="t Y" steps="10"/>
        <all in="B t" out="t V" steps="13"/>
        <prl in="t" out="V"/>

        <!-- Tall watchtower turret (p): 54 high (z=0..53) of V with window band & conical roof X -->
        <all in="B p" out="p V" steps="20"/>
        <all in="B p" out="p Y" steps="12"/>
        <all in="B p" out="p V" steps="16"/>
        <prl in="p" out="X"/>

        <!-- Courtyard stone well (Q, 10x10 voxels): hollow rim of I 8 high with water m inside -->
        <one in="QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ"
             out="IIIIIIIIII/IIIIIIIIII/IImmmmmmII/IImmmmmmII/IImmmmmmII/IImmmmmmII/IImmmmmmII/IImmmmmmII/IIIIIIIIII/IIIIIIIIII" steps="1"/>
        <prl in="Q" out="c"/>
        <all in="B I" out="I *" steps="7"/>

        <!-- ==================== C. FULL SCALE: PARTS, WINDOWS, ROOFS ==================== -->
        <!-- 1. Stair inside keep (part-stair reads T and =) -->
        <import file="part-stair"/>

        <!-- 2. Doors (part-door reads O and +) -->
        <import file="part-door"/>

        <!-- 3. Battlements on flat tops of + (K, V, Z) -->
        <import file="part-battlements"/>

        <!-- 4. Arrow slits under merlons on % (K, V, Z) -->
        <import file="part-slits"/>

        <!-- 5. Windows in keep, annex, gatehouse & towers (band Y -> L, rest back to wall) -->
        <one steps="28" symmetry="(xy)">
          <rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY"
                out="*Y/*L/*L/*L/*L/*Y *Y/*L/*L/*L/*L/*Y *Y/*L/*L/*L/*L/*Y *Y/*L/*L/*L/*L/*Y *Y/*L/*L/*L/*L/*Y *Y/*L/*L/*L/*L/*Y *Y/*L/*L/*L/*L/*Y *Y/*L/*L/*L/*L/*Y"/>
        </one>
        <all in="LYYYY" out="LLLLL" symmetry="(xy)"/>
        <all in="LY" out="LL" symmetry="(xy)" steps="5"/>
        <!-- Restore remaining Y to matching wall material below it -->
        <all in="K Y" out="* K" steps="20"/>
        <all in="V Y" out="* V" steps="20"/>
        <all in="Z Y" out="* Z" steps="20"/>
        <prl in="Y" out="K"/>

        <!-- 6. Pitched terracotta roof (J) on side annex hall -->
        <all in="JB" out="*J" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- 7. Steep slate pavilion roof (X) on watchtower turret -->
        <all in="XB" out="*X" symmetry="(xy)" steps="1"/>
        <all in="XB/*X" out="*X/**" symmetry="(xy)"/>
        <all in="***/***/*** *X*/XXX/*X*" out="***/*X*/*** ***/***/***" steps="14" symmetry="()"/>
        <!-- Finial / flagpole on turret peak -->
        <one in="B B X" out="* I *" steps="1" symmetry="()"/>
        <all in="B I" out="I *" steps="5"/>

        <!-- 8. Bridge low wooden curbs along water moat -->
        <all in="bm/bm" out="kb/kb" symmetry="(xy)"/>
        <all in="B k/B b" out="k k/B b" steps="2" symmetry="(xy)"/>

        <!-- Clean any stray T if left -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon voxel colours (hex rrggbb), distinct light/dark contrast, >6 materials, all <50% -->
  <color symbol="E" value="7c945c" hidden="True" name="erba" area="field"/>
  <color symbol="H" value="7c945c" hidden="True" name="centro" area="keep"/>

  <!-- Ground & floors (with semantic areas) -->
  <color symbol="c" value="b8ab8e" name="terra battuta del cortile" area="courtyard"/>
  <color symbol="n" value="9a9386" name="lastricato del cortile" area="courtyard"/>
  <color symbol="r" value="a89674" name="strada sterrata" area="road"/>
  <color symbol="m" value="4a7896" name="acqua del fossato" area="moat"/>
  <color symbol="b" value="8a623e" name="ponte di legno" area="bridge"/>
  <color symbol="f" value="9e744c" name="pavimento del mastio" area="keep"/>
  <color symbol="F" value="845e3c" name="solaio in legno" area="keep"/>
  <color symbol="D" value="96704a" name="pavimento dell'armeria" area="hall"/>

  <!-- Masonry walls (3 distinct stone shades so keep, curtain wall & towers read clearly and no single material exceeds 50%) -->
  <color symbol="K" value="c2b9a7" name="pietra chiara del mastio" area="keep"/>
  <color symbol="Z" value="9c968b" name="pietra grigia delle mura" area="wall"/>
  <color symbol="V" value="878279" name="pietra scura delle torri" area="tower"/>
  <color symbol="M" value="aba394" name="merlatura in pietra"/>
  <color symbol="I" value="757068" name="pietra del pozzo"/>

  <!-- Roofs -->
  <color symbol="J" value="b5543c" name="tetto in coppi rossi"/>
  <color symbol="X" value="4c5866" name="tetto in ardesia della vedetta"/>

  <!-- Doors, stairs, windows & slits -->
  <color symbol="O" value="6e472b" name="porta di legno"/>
  <color symbol="o" value="4d301b" name="assi scure della porta"/>
  <color symbol="N" value="5c554d" name="stipite in pietra"/>
  <color symbol="k" value="b08457" name="gradini in legno"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="U" value="2b2927" name="feritoia"/>

  <!-- Hidden air letters for openable doors -->
  <color symbol="#20" value="000000" hidden="True" name="vano porta aperto"/>
  <color symbol="#21" value="000000" hidden="True" name="vano assi aperto"/>

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
It does not pass: varietà: alla taglia Gargantuesca 19 tipi di parti e 141 parti, alla Enorme 19 e 124: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 155 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at gargantuan: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c terra battuta del cortile, n lastricato del cortile, r strada sterrata, m acqua del fossato, f pavimento del mastio, F solaio in legno, K pietra chiara del mastio, Z pietra grigia delle mura, V pietra scura delle torri, L finestra, I pietra del pozzo, X tetto in ardesia della vedetta, O porta di legno, o assi scure della porta, N stipite in pietra, U feritoia, k gradini in legno, M merlatura in pietra, S muro di prova, # = #95 solaio di prova
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEXXXXXXXEEE
EEEEVVVVVVVVEEEEEEEEEEEEEEEEEEEEEEEEEEEVXXXXXXXEEE
EEEVVVVVVVVVEEEEEEEEEEEEEEEEEEEEEEEEEEVVXXXXXXXEEE
EEEVVVVVVVVVEEEEEEEEEEEEEEEEEEEEEEEEEEVVXXXXXXXEEE
EEEVVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZVVXXXXXXXEEE
EEEVVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZVVXXXXXXXEEE
EEEVVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZVVXXXXXXXEEE
EEEVVVVVVVVVccccccccccccccccccccccccccVVXXXXXXXEEE
EEEMVVVVVVVMccccccccccccccccccccccccccMVVVVVVVMEEE
EEmmmmmZZZcccccccSSSccccccccccccccccccccZZZmmmmmEE
EEmmmmmZZZcccccccmmSccccccccccccccccccccZZZmmmmmEE
EEmmmmmZZZcccccccSmSccccccccccccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKKFFFFFFFFFFFFKKcccccccZZZmmmmmEE
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEmmmmmZZZccccccccccccnnnnnnnnccccccccccZZZmmmmmEE
EEVVVVVVVVccccccccccccnnnnnnnnccccccccccVVVVVVVVEE
EEVVVVVVVVZZZZZZZZccZMZZnZZnZnZZcZZZZZZZVVVVVVVVEE
EEVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVEE
EEVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVEE
EEVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVEE
EEVVVVVVVVEEEEEEEEEEEErrrrrrrrEEEEEEEEEEVVVVVVVVEE
EEVVVVVVVVEEEEEEEEEEEErrrrrrrrEEEEEEEEEEVVVVVVVVEE
EEVVVVVVVVEEEEEEEEEEEErrrrrrrrEEEEEEEEEEVVVVVVVVEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
000eecececee00000000000000000000000000eeeeeeeee000
000eccccccce00000000000000000000000000eefffffff000
000eccccccce00000000000000000000000000eefgggggf000
000eccccccce00000000000000000000000000eefghhggf000
000eccccccce77777777777777777777777777eefghhggf000
000eccccccce77777777777777777777777777eefgggggf000
000eccccccce77777777777777777777777777eefgfffff000
000eccccccce77777777777777777777777777eeeeeeeee000
000eecececee00000000000000000000000000eecececee000
0000007777000000zzzz000000000000000000007777000000
0000007777000000zz0z000000000000000000007777000000
0000007777000000zzzz000000000000000000007777000000
0000007777000000zzzz000000000000000000007777000000
00000077770000000000000000000000000000007777000000
0000007777000000llllljlllllljlllll0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000jjjjjjjjjjjjjjjjjj0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000jjjjjjjjjjjjjjjjjj0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
0000007777000000llllljlllllljlllll0000007777000000
00000077770000000000000000000000000000007777000000
00000077770000000000000000000000000000007777000000
00000077770000000000000000000000000000007777000000
00000077770000000000000000000000000000007777000000
00000077770000000000000000000000000000007777000000
00000077770000000000000000000000000000007777000000
00000077770000000000000000000000000000007777000000
0eeeeeeeee000000000000000000000000000000eeeeeeeee0
0eccccccce000000000000000000000000000000eccccccce0
0eccccccce77777777ddbdddddddbddddd777777eccccccce0
0eccccccce77777777bbbbbbbbbbbbbbbb777777eccccccce0
0eccccccce77777777dbbbbbbbbbbbbbbd777777eccccccce0
0ccccccccc77777777ddbdddddddbddddd777777ccccccccc0
0eccccccce000000000000000000000000000000eccccccce0
0eccccccce000000000000000000000000000000eccccccce0
0eccccccce000000000000000000000000000000eccccccce0
```
Front (looking from the front; the sky at the top):
```
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................SSS..............................
.................MSMM.MM..MM.MM.M.................
.................M.MM.MM..MM.MM.M.................
.................KKKKKKKKKKKKKKKK.................
.................KKKKKKKKKKKKKKKK.................
.................KKKKKKKKKKKKKKKK..........X......
.................KKKKKKKKKKKKKKKK.........XXX.....
.................LLLLLLLLLLLLLLLL........XXXXX....
.................LLLLLLLLLLLLLLLL.......XXXXXXX...
..MMM.M.MMMM.....LLLLLLLLLLLLLLLL.....MMMMVMVMMM..
..MMM.M.MMMM.....LMMLMMLMLMMLMMLM.....MMMMVMVMMM..
..VVVVVVVVVV.....LMMLMMLMLMMLMMLM.....VVVVVVVVVV..
..VVVVVVVVVV.....KZZZZZZZZZZZZZZZ.....VVVVVVVVVV..
..VVVVVVVVVV.....KZZZZZZZZZZZZZZZ.....VVVVVVVVVV..
..VVVVVVVVVV.....KZZZZZZZZZZZZZZZ.....VVVVVVVVVV..
..VVVVVVVVVV.....KZZZZooooooooZZZ.....VVVVVVVVVV..
..VVVVVVVVVV.....KZZZZooooooooZZZ.....VVVVVVVVVV..
..VVVVVVVVZZZZZZZZLLLLooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZLLLLooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZZLLLooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZZZZZooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZZZZZooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZZZZZooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZZZZZooooooooZZZZZZZZZZVVVVVVVV..
.VVVVVVVVVZZZZZZZZZZZEooooooooZZZZZZZZZZVVVVVVVVV.
```
Right side (looking from the right):
```
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS.....................................
..........SSS..MM.M.MM.MM.MM.MM.M.................
...............MM.M.MM.MM.MM.MM.M.................
...............KKKKKKKKKKKKKKKKKK.................
...............KKKKKKKKKKKKKKKKKK.................
...............KKKKKKKKKKKKKKKKKK.................
....XX.........KKKKKKKKKKKKKKKKKK.................
...XXXXX.......LLLLLLLLLLLLLLLLLL.................
..XXXXXX.......LLLLLLLLLLLLLLLLLL.................
..VVVVVVMM.....LLLLLLLLLLLLLLLLLL.........MMMM.MM.
..VVVVVVMM.....LLLLLLLLLLLLLLLLLL.........MMMMMMM.
..VVVVVVVV.....LLLLLLLLLLLLLLLLLL.........VVVVVVVV
..VVVVVVVV.....KKKKKKKKKKKKKKKKKK.........VVVVVVVV
..VVVVVVVV.....KKKKKKKKKKKKKKKKKK.........VVVVVVVV
..VVVVVVVV.....KKKKKKKKKKKKKKKKKK.........VVVVVVVV
..VVVVVVVV.....KKKKKKKKKKKKKKKKKK.........VVVVVVVV
..VVVVVVVV.....KKKKKKKKKKKKKKKKKK.........VVVVVVVV
..VVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVV
..VVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVV
..VVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVV
..VVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVV
..VVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVV
..VVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVV
..VVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVV
.EVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVV
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
...VVVVVVVVV..........................VVVVVVVVV...
...VVVVVVVVV..........................VVVVVVVVV...
...VVVVVVVVV..........................VVVVVVVVV...
...VVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVV...
...VVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVV...
...VVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVV...
...VVVVVVVVV..........................VVVVVVVVV...
...VVVVVVVVV..........................VVVVVVVVV...
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ.......LLLLLLLLLLLLLLLL.......ZZZ.......
.......ZZZ.......LLLLLLLLLLLLLLLL.......ZZZ.......
.......ZZZ.......L.....kkkk.....L.......ZZZ.......
.......ZZZ.......L.....kkkk.....L.......ZZZ.......
.......ZZZ.......L.....kkkk.....L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......L..............L.......ZZZ.......
.......ZZZ.......LL............LL.......ZZZ.......
.......ZZZ.......LLLLLLoooooLLLLL.......ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
.......ZZZ..............................ZZZ.......
......VZZZ..............................ZZZV......
..VVVVVVVV..............................VVVVVVVV..
..VVVVVVVVZZZZZZZZZZZZooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZZZZZooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZZZZZooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVVZZZZZZZZZZZZooooooooZZZZZZZZZZVVVVVVVV..
..VVVVVVVV..............................VVVVVVVV..
..VVVVVVVV..............................VVVVVVVV..
..VVVVVVVV..............................VVVVVVVV..
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
........................................VVVVVVV...
........................................VVVVVVV...
........................................VVVVVVV...
........................................VVVVVVV...
........................................VVVVVVV...
........................................VVVVVVV...
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................LLLLLLLLLLLLLLLL.................
.................LLLLLLLLLLLLLLLL.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................L..............L.................
.................LL............LL.................
.................LLLLLLLLLLLLLLLL.................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
.................SSS..............................
...................S..............................
.................S.S..............................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000eecececee00000000000000000000000000000000000000
EEEVVVVVVVVVEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000eccccccce00000000000000000000000000000000000000
EEEXXXXXXXVVEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000fffffffee00000000000000000000000000000000000000
EEEXXXXXXXVVEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000fgggggfee00000000000000000000000000000000000000
EEEXXXXXXXVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZmmmmmEE   000fgggggfee78788888887888888878888888788888000000
EEEXXXXXXXVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZmmmmmEE   000fgghhgfee77777777777777777777777777777778000000
EEEXXXXXXXVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZmmmmmEE   000ggghhgfee77777777777777777777777777777778000000
EEEXXXXXXXVVccccccccccccccccccccccccccccZZZmmmmmEE   000fgggggfee77777777777777777777777777777778000000
EEEXXXXXXXVMccccccccccccccccccccccccccccZZZmmmmmEE   000fffffffee00000000000000000000000000007778000000
EEmmmmmZZZcccccccccccccSSSScccccccccccccZZZmmmmmEE   000eeeeeeee000000000000zzzz00000000000007778000000
EEmmmmmZZZcccccccccccccSmmScccccccccccccZZZmmmmmEE   00000077770000000000000z00z00000000000007778000000
EEmmmmmZZZcccccccccccccSmmScccccccccccccZZZmmmmmEE   00000077770000000000000zzzz00000000000007777000000
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE   00000077770000000000000zzzz00000000000007778000000
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE   0000007777000000llllljlllllljlllll0000007778000000
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000jjjjjjjjjjjjjjjjjj0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000jjjjjjjjjjjjjjjjjj0000007777000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKKFFFFFFFFFFFFKKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   0000007777000000llllljlllllljlllll0000007778000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007777000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZccccccccnnnnnnnnncccccccccccccZZZmmmmmEE   0eeeeeeeee000000000000000000000000000000eeeeeeeee0
EEVVVVVVVVccccccccnnnnnnnnncccccccccccccVVVVVVVVEE   0eccccccce000000000000000000000000000000eccccccce0
EEVVVVVVVVZZZZZMZZMZZnZnZZMZZMZZZZZZZZZZVVVVVVVVEE   0eccccccce77777dddddddbddddddd7777777777eccccccce0
EEVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVEE   0eccccccce77777bbbbbbbbbbbbbbb7777777777eccccccce0
EEVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVEE   0eccccccce77777dbbbbbbbbbbbbbd7777777777eccccccce0
EEVVVVVVVVZZZZZMZZZZZZZZZZZZZMZZZZZZZZZZVVVVVVVVEE   0ccccccccc77777dddddddbddddddd7777777777ccccccccc0
EEVVVVVVVVEEEEEEEErrrrrrrrrEEEEEEEEEEEEEVVVVVVVVEE   0eccccccce000000000000000000000000000000eccccccce0
EEVVVVVVVVEEEEEEEErrrrrrrrrEEEEEEEEEEEEEVVVVVVVVEE   0eccccccce000000000000000000000000000000eccccccce0
EEVVVVVVVVEEEEEEEErrrrrrrrrEEEEEEEEEEEEEVVVVVVVVEE   0eccccccce000000000000000000000000000000eccccccce0
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000eecececee00000000000000000000000000000000000000
EEEEVVVVVVVVEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000eccccccce00000000000000000000000000000000000000
EEEVVXXXXXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000eefffffff00000000000000000000000000000000000000
EEEVVXXXXXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000eefgggghf00000000000000000000000000000000000000
EEEVVXXXXXXXZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZmmmmmEE   000eefgggggf78788888887888888878888888788888000000
EEEVVXXXXXXXZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZmmmmmEE   000eefghhggf77777777777777777777777777777778000000
EEEVVXXXXXXXZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZmmmmmEE   000eefghhggf77777777777777777777777777777778000000
EEEVVXXXXXXXccccccccccccccccccccccccccccZZZmmmmmEE   000eefgggggf77777777777777777777777777777778000000
EEEMVXXXXXXXccccccccccccccccccccccccccccZZZmmmmmEE   000eefffffff00000000000000000000000000007778000000
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE   0000eeeeeeee00000000000000000000000000007778000000
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007777000000
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZccccccccccccccccccccccccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE   0000007777000000llllljlllllljlllll0000007778000000
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007777000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000jjjjjjjjjjjjjjjjjj0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000jjjjjjjjjjjjjjjjjj0000007777000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKFFFFFFFFFFFFFFKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKKFFFFFFFFFFFFKKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccKKKKKKKKKKKKKKKKcccccccZZZmmmmmEE   0000007777000000ljjjjjjjjjjjjjjjjl0000007778000000
EEmmmmmZZZcccccccccccccnnnnnnnnnccccccccZZZmmmmmEE   0000007777000000llllljlllllljlllll0000007778000000
EEmmmmmZZZcccccccccccccnnnnnnnnnccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZcccccccccccccnnnnnnnnnccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZcccccccccccccnnnnnnnnnccccccccZZZmmmmmEE   000000777700000000zzzz0000000000000000007777000000
EEmmmmmZZZccccccccSmmScnnnnnnnnnccccccccZZZmmmmmEE   000000777700000000zzzz0000000000000000007778000000
EEmmmmmZZZccccccccSmmScnnnnnnnnnccccccccZZZmmmmmEE   000000777700000000z00z0000000000000000007778000000
EEmmmmmZZZccccccccSSSScnnnnnnnnnccccccccZZZmmmmmEE   000000777700000000zzzz0000000000000000007778000000
EEmmmmmZZZcccccccccccccnnnnnnnnnccccccccZZZmmmmmEE   00000077770000000000000000000000000000007778000000
EEmmmmmZZZcccccccccccccnnnnnnnnnccccccccZZZmmmmmEE   0eeeeeeeee000000000000000000000000000000eeeeeeeee0
EEVVVVVVVVcccccccccccccnnnnnnnnnccccccccVVVVVVVVEE   0eccccccce000000000000000000000000000000eccccccce0
EEVVVVVVVVZZZZZZZZZZMZZMZZnZnZZMZZMZZZZZVVVVVVVVEE   0eccccccce7777777777dddddddbddddddd77777eccccccce0
EEVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVEE   0eccccccce7777777777bbbbbbbbbbbbbbd77777eccccccce0
EEVVVVVVVVZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZVVVVVVVVEE   0eccccccce7777777777dbbbbbbbbbbbbbb77777eccccccce0
EEVVVVVVVVZZZZZZZZZZMZZZZZZZZZZZZZMZZZZZVVVVVVVVEE   0ccccccccc7777777777dddddddbddddddd77777ccccccccc0
EEVVVVVVVVEEEEEEEEEEEEErrrrrrrrrEEEEEEEEVVVVVVVVEE   0eccccccce000000000000000000000000000000eccccccce0
EEVVVVVVVVEEEEEEEEEEEEErrrrrrrrrEEEEEEEEVVVVVVVVEE   0eccccccce000000000000000000000000000000eccccccce0
EEVVVVVVVVEEEEEEEEEEEEErrrrrrrrrEEEEEEEEVVVVVVVVEE   0eccccccce000000000000000000000000000000eccccccce0
```
How much the plans of the seeds differ: 0.12 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 200×200×160, 201 nodi, 983 passi, finito in 1131 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=erba (marcatore), h=honey, w=white, s=slate, d=dead, dark, c=terra battuta del cortile, n=lastricato del cortile, Q=aQua, W=White, t=teal, p=purple, G=Green, g=green, r=strada sterrata, m=acqua del fossato, f=pavimento del mastio, F=solaio in legno, K=pietra chiara del mastio, Z=pietra grigia delle mura, V=pietra scura delle torri, L=finestra, I=pietra del pozzo, Y=Yellow, X=tetto in ardesia della vedetta, O=porta di legno, o=assi scure della porta, N=stipite in pietra, T=Teal (marcatore), U=feritoia, k=gradini in legno, M=merlatura in pietra, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), S=muro di prova, #95=solaio di prova.
Alla fine: V 87196, Z 84656, L 39417, K 37318, E 19325, o 9510, S 5824, c 5800, U 4518, m 4336, F 3440, k 2720, M 2502, X 2024, f 1800, r 875, N 845, n 750, O 240, #95 64, I 6.
  #3 map scala 1/5 1/5 1: ×1, 1600 celle x0-39 y0-39 z0-159, passi 1
#8-62 all×32, prl×3, one×5: 936 celle x6-33 y6-39 z0, passi 2-84
   #65 map scala 5 5 1: ×1, 40000 celle x0-199 y0-199 z0-159, passi 85
#67-68 all×2: 38500 celle x75-124 y70-124 z0-22, passi 86-107
#69-70 all×2: 31500 celle x75-124 y70-124 z22-40, passi 108-125
    #71 all . w → w Y passi=14: ×14, 24500 celle x75-124 y70-124 z40-54, passi 126-139, w→Y 12250, .→w 12250
#72-85 all×7, prl×2: 33950 celle x75-124 y70-124 z0-65, passi 140-219
    #86 all . h → h . passi=31: ×31, 99200 celle x80-119 y75-119 z1-32, passi 220-250, h→. 49600, .→h 49600
#87-88 all×2: 15600 celle x80-119 y75-119 z2-33, passi 251-281
    #89 all . h → h . passi=31: ×31, 99200 celle x80-119 y75-119 z33-64, passi 282-312, h→. 49600, .→h 49600
#90-91 all×1, prl×1: 14200 celle x80-119 y75-119 z33-64, passi 313-344
    #99 all . W → W Z passi=23: ×23, 144900 celle x45-154 y40-164 z0-23, passi 345-367, W→Z 72450, .→W 72450
#100-105 prl×2, all×4: 19450 celle x45-154 y40-164 z0-39, passi 368-409
#106-107 all×1, prl×1: 19250 celle x90-114 y155-164 z1-39, passi 410-448
    #108 all . t → t V passi=18: ×18, 75600 celle x30-169 y30-174 z0-18, passi 449-466, t→V 37800, .→t 37800
    #109 all . t → t Y passi=10: ×10, 42000 celle x30-169 y30-174 z18-28, passi 467-476, t→Y 21000, .→t 21000
    #110 all . t → t V passi=13: ×13, 54600 celle x30-169 y30-174 z28-41, passi 477-489, t→V 27300, .→t 27300
#111-112 prl×1, all×1: 18100 celle x30-169 y30-174 z0-41, passi 490-510
#113-114 all×2: 22400 celle x145-164 y30-49 z20-48, passi 511-538
#115-152 prl×6, one×1, all×16: 25094 celle x60-164 y30-104 z0-108, passi 539-747
#155-185 all×13, prl×2, one×1: 34497 celle x30-169 y30-174 z0-159, passi 748-898
    #186 all LYYYY → LLLLL: ×39, 35348 celle x30-164 y30-174 z9-53, passi 899-937, Y→L 35348
#187-198 all×7, prl×1, one×1: 19136 celle x30-169 y29-174 z8-58, passi 938-983
Senza effetto (non hanno mai cambiato una cella):
#5 prl EHE → xHE passi=1
#6 one xHE → EH* passi=1: in quel momento nella griglia non c'erano celle "x"
#7 prl x → E: in quel momento nella griglia non c'erano celle "x"
#14 prl EE/hE → **/*z passi=1
#15 all hE/*z → *z/**: in quel momento nella griglia non c'erano celle "z"
#16 all *z/hE → **/*z: in quel momento nella griglia non c'erano celle "z"
#17 prl z → h: in quel momento nella griglia non c'erano celle "z"
#21 one hE/wE/wE/wE/wE/wE/hE → **/**/*a/*a/*a/**/** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all aE → *a passi=5: in quel momento nella griglia non c'erano celle "a"
#23 all E/a → a/* passi=2: in quel momento nella griglia non c'erano celle "a"
#24 all a/E → */a passi=2: in quel momento nella griglia non c'erano celle "a"
#25 all aE → *v: in quel momento nella griglia non c'erano celle "a"
… e altri 53
Fix it and answer with the whole program.

## Risposta

<!--
Concept: Forte (medieval fort with courtyard, curtain wall, corner towers, tall watchtower turret, gatehouse, central keep, side armory annex, courtyard well; at Gargantuan size, where extra ground surrounds the fort, an outer water moat, wooden bridge with parapet curbs, and an outer courtyard barracks shed are added).
Parts & plan letters:
- h, w, s, d: Keep interior (h), keep walls (w), stair strip (s, 4x2 along back wall with landing before & after), keep front doorway (d).
- a, v, e: Low roofed hall annex (armory) attached to left or right wall of keep (a interior, v walls, e doorway into keep).
- c, n, Q: Courtyard (c) around keep and annex; stone paved path (n) from keep door to gatehouse; stone well (Q) in open yard.
- W, t, p, G, g: Curtain wall (W, 2 cells thick) with corner towers (t, 4x4 on 2-4 corners) and one taller watchtower turret (p); front gatehouse walls (G) and 3-cell central gate portal (g).
- r: Approach road straight to front edge.
- Gargantuan additions (fit only where extra ground exists): expanded courtyard holding a timber-roofed courtyard barracks/storehouse (q, u) and outer water moat (m) crossed by a wooden bridge (b) with stone/wood curbs (C).
-->
<sequence values="BHEhwsdavcequnQWtpGgrmbfFKZVDLIYXCPAPOoNTUkvMJ#20#21#90#91#92#94" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="KVZ"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="KVZ"/>

  <map scale="1/5 1/5 1" values="BHEhwsdavcequnQWtpGgrmbxyz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- Shift H left or right by 2 cells on one random side so seeds differ clearly in symmetry -->
      <one in="EEHEE" out="H*E**" symmetry="(x)" steps="1"/>

      <!-- Keep spine: shifted toward the back so courtyard opens in front -->
      <all in="E/[Hh]" out="h/*" steps="4"/>
      <all in="[Hh]/E" out="*/h" steps="2"/>
      <prl in="h/E" out="*/h" p="0.6" steps="1"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1"/>
      <prl in="H" out="h"/>

      <!-- Keep width: 4 left, 3 right, optional +1 width -->
      <all in="Eh" out="h*" steps="4"/>
      <all in="hE" out="*h" steps="3"/>
      <prl in="EE/hE" out="**/*z" p="0.6" steps="1"/>
      <all in="hE/*z" out="*z/**"/>
      <all in="*z/hE" out="**/*z"/>
      <prl in="z" out="h"/>

      <!-- Keep walls (w) -->
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Stair zone inside keep along back wall: 2 cells landing on left (10 voxels), 4 cells stair (s, 20 voxels), 2..3 cells landing on right -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/whhssssh/whhssssh" steps="1"/>

      <!-- Side hall annex (armory) on left or right wall of keep (fixed pattern: hwE along keep wall) -->
      <one in="hwE/hwE/hwE/hwE/hwE/hwE" out="***/**a/**a/**a/**a/***" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <prl in="EE/aE" out="**/*x" p="0.5" symmetry="(x)" steps="1"/>
      <all in="aE/*x" out="*x/**" symmetry="(x)"/>
      <all in="*x/aE" out="**/*x" symmetry="(x)"/>
      <prl in="x" out="a"/>
      <all in="E/a" out="a/*" steps="1"/>
      <all in="a/E" out="*/a" steps="1"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <!-- Shared doorway (3 cells = 15 voxels wide) between keep and annex -->
      <one in="hwa/hwa/hwa" out="*e*/*e*/*e*" symmetry="(x)" steps="1"/>

      <!-- Base courtyard (c) around keep and annex: 2 cells around, plus 1 in front (fits Huge 30x30 cleanly with room for front road) -->
      <all in="[wv]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cE" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="c/E" out="*/c" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Expand courtyard ONLY when 7+ ground cells remain (Gargantuan 40x40, never at Huge 30x30) -->
      <all in="cEEEEEEE" out="*ccc****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Curtain wall (W, 2 cells thick) -->
      <all in="cE" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>
      <all in="WE" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers (t, 4x4): vary which corners get towers across seeds -->
      <one in="WE/EE" out="*t/**" symmetry="(x)" steps="1"/>
      <prl in="WE/EE" out="*t/**" p="0.65" symmetry="(x)" steps="1"/>
      <one in="EE/EW" out="**/*t" symmetry="(x)" steps="1"/>
      <prl in="EE/EW" out="**/*t" p="0.55" symmetry="(x)" steps="1"/>
      <all steps="2" symmetry="(xy)">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Promote one random corner tower to a taller watchtower turret (p) -->
      <one in="tttt/tttt/tttt/tttt" out="pppp/pppp/pppp/pppp" steps="1"/>

      <!-- Way out: straight forward from front keep wall (d -> n -> g/G -> r) -->
      <one in="hhhhh/wwwww/ccccc" out="*****/**d**/*****" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n"/>
      <all in="[ng]/W" out="*/g"/>
      <all in="[gr]/E" out="*/r"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="gW" out="*G" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>

      <!-- Courtyard lean-to / storehouse pavilion (u posts/roof, q floor) ONLY where a 6x6 open courtyard patch exists (Gargantuan) -->
      <one in="cccccc/cccccc/cccccc/cccccc/cccccc/cccccc"
           out="cccccc/cuuuuc/cuqquc/cuqquc/cuuuuc/cccccc" steps="1"/>

      <!-- Stone well (Q, 2x2) in an open 4x4 courtyard area -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- Outer water moat (m) and wooden bridge (b) ONLY where 4+ ground cells remain outside W on all sides (Gargantuan 40x40) -->
      <all in="EEEWWc" out="*mm***" symmetry="()" steps="1"/>
      <all in="cWWEEE" out="***mm*" symmetry="()" steps="1"/>
      <all in="EEE/EEE/EEE/WWW/WWW/ccc" out="***/mmm/mmm/***/***/***" symmetry="()" steps="1"/>
      <all in="ccc/WWW/WWW/EEE/EEE/EEE" out="***/***/***/mmm/mmm/***" symmetry="()" steps="1"/>
      <all in="ccc/WWW/WWW/rrr/rrr/rrr" out="***/***/***/bbb/bbb/rrr" symmetry="()" steps="1"/>
      <!-- Wrap moat smoothly around curtain walls and corner towers where moat already seeded -->
      <all symmetry="(xy)" steps="30">
        <rule in="mE/[WtGp][WtGp]" out="*m/**"/>
        <rule in="mE/*m" out="*m/**"/>
        <rule in="mr/[Gg][Gg]" out="*b/**"/>
        <rule in="br/[Gg][Gg]" out="*b/**"/>
        <rule in="b[mr]/*b" out="*b/**"/>
      </all>
    </sequence>

    <map scale="5 5 1" values="BHEhwsdavcequnQWtpGgrmbfFKZVDLIYXCPAPOoNTUkvMJ#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="u" out="uuuuu/upppu/upppu/upppu/uuuuu"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="p" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>

      <sequence symmetry="()">
        <!-- ==================== B. HEIGHTS (COLUMNS BY STEPS) ==================== -->
        <!-- Keep walls (w): 2 storeys + roof parapet = 66 total, with window bands Y -->
        <all in="B w" out="w K" steps="8"/>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B w" out="w K" steps="12"/>
        <all in="B w" out="w K" steps="8"/>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B w" out="w K" steps="13"/>
        <prl in="w" out="K"/>

        <!-- Keep front door zone (d): seed O on z=0, then keep wall K/Y up to z=65 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="39"/>
        <all in="B d" out="d Y" steps="12"/>
        <all in="B d" out="d K" steps="13"/>
        <prl in="d" out="K"/>

        <!-- Keep interior door to annex (e): seed O on z=0, then keep wall K/Y up to z=65 -->
        <all in="B e" out="e O" steps="1"/>
        <all in="B e" out="e K" steps="39"/>
        <all in="B e" out="e Y" steps="12"/>
        <all in="B e" out="e K" steps="13"/>
        <prl in="e" out="K"/>

        <!-- Keep interior (h) & stair zone (s): 2 covered storeys (z=0 floor, z=32 slab, z=64 roof slab) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- z=1: stair strip T on s, air on h -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- z=32: first floor slab F -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- z=33..63: second storey air; z=64: roof slab F -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="31"/>
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Annex hall (a interior, v walls): 1 covered storey (z=0 floor D, z=1..33 air, z=34 pitched terracotta roof J) -->
        <all in="B v" out="v K" steps="8"/>
        <all in="B v" out="v Y" steps="12"/>
        <all in="B v" out="v K" steps="14"/>
        <prl in="v" out="J"/>

        <all in="B a" out="a D" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>

        <!-- Gargantuan courtyard timber pavilion / storehouse (q interior, u floor around posts, p timber posts -> P, roof A at z=32) -->
        <all in="B p" out="p P" steps="32"/>
        <prl in="p" out="A"/>
        <all in="B u" out="u c" steps="1"/>
        <all in="B u" out="u B" steps="31"/>
        <prl in="u" out="A"/>
        <all in="B q" out="q c" steps="1"/>
        <all in="B q" out="q B" steps="31"/>
        <prl in="q" out="A"/>
        <!-- Hollow out interior posts so only corner posts stand (30+ clear span, 20x20 clear pavilion) -->
        <all in="ccPcc/ccPcc" out="ccccc/ccccc" symmetry="(xy)"/>

        <!-- Curtain wall (W): 24 high (z=0..23) of Z -->
        <all in="B W" out="W Z" steps="23"/>
        <prl in="W" out="Z"/>

        <!-- Gatehouse side walls/towers (G): 40 high (z=0..39) of Z -->
        <all in="B G" out="G Z" steps="16"/>
        <all in="B G" out="G Y" steps="10"/>
        <all in="B G" out="G Z" steps="13"/>
        <prl in="G" out="Z"/>

        <!-- Gatehouse portal (g): seed O on z=0, then Z up to z=39 -->
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g Z" steps="38"/>
        <prl in="g" out="Z"/>

        <!-- Corner towers (t): 42 high (z=0..41) of V with window band -->
        <all in="B t" out="t V" steps="18"/>
        <all in="B t" out="t Y" steps="10"/>
        <all in="B t" out="t V" steps="13"/>
        <prl in="t" out="V"/>

        <!-- Tall watchtower turret (y from plan p): 54 high (z=0..53) of V with window band & conical roof X -->
        <all in="B y" out="y V" steps="20"/>
        <all in="B y" out="y Y" steps="12"/>
        <all in="B y" out="y V" steps="16"/>
        <prl in="y" out="X"/>

        <!-- Courtyard stone well (Q, 10x10 voxels): hollow rim of I 8 high with water C inside -->
        <one in="QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ/QQQQQQQQQQ"
             out="IIIIIIIIII/IIIIIIIIII/IICCCCCCII/IICCCCCCII/IICCCCCCII/IICCCCCCII/IICCCCCCII/IICCCCCCII/IIIIIIIIII/IIIIIIIIII" steps="1"/>
        <prl in="Q" out="c"/>
        <all in="B I" out="I *" steps="7"/>

        <!-- ==================== C. FULL SCALE: PARTS, WINDOWS, ROOFS ==================== -->
        <!-- 1. Stair inside keep (part-stair reads T and =) -->
        <import file="part-stair"/>

        <!-- 2. Doors (part-door reads O and +) -->
        <import file="part-door"/>

        <!-- 3. Battlements on flat tops of + (K, V, Z) -->
        <import file="part-battlements"/>

        <!-- 4. Arrow slits under merlons on % (K, V, Z) -->
        <import file="part-slits"/>

        <!-- 5. Discrete framed windows (4 wide x 8 tall) in band Y, then restore remaining Y to wall stone! -->
        <one steps="26" symmetry="(xy)">
          <rule in="BY/BY/BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY/BY/BY"
                out="*Y/*Y/*L/*L/*L/*L/*Y/*Y *Y/*Y/*L/*L/*L/*L/*Y/*Y *Y/*Y/*L/*L/*L/*L/*Y/*Y *Y/*Y/*L/*L/*L/*L/*Y/*Y *Y/*Y/*L/*L/*L/*L/*Y/*Y *Y/*Y/*L/*L/*L/*L/*Y/*Y *Y/*Y/*L/*L/*L/*L/*Y/*Y *Y/*Y/*L/*L/*L/*L/*Y/*Y"/>
        </one>
        <!-- Punch window L straight through the 5-voxel wall thickness (orthogonal to facade, never sideways along Y!) -->
        <all in="BLYYYY" out="*LLLLL" symmetry="(xy)"/>
        <!-- Restore remaining Y to matching wall material below it -->
        <all in="K Y" out="* K" steps="20"/>
        <all in="V Y" out="* V" steps="20"/>
        <all in="Z Y" out="* Z" steps="20"/>
        <prl in="Y" out="K"/>

        <!-- 6. Pitched terracotta roof (J) on side annex hall -->
        <all in="JB" out="*J" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- 7. Pitched shingle roof (A) on Gargantuan courtyard pavilion -->
        <all in="AB" out="*A" symmetry="(xy)" steps="1"/>
        <all in="***/***/*** *A*/AAA/*A*" out="***/*A*/*** ***/***/***" steps="8" symmetry="()"/>

        <!-- 8. Steep slate pavilion roof (X) on watchtower turret -->
        <all in="XB" out="*X" symmetry="(xy)" steps="1"/>
        <all in="XB/*X" out="*X/**" symmetry="(xy)"/>
        <all in="***/***/*** *X*/XXX/*X*" out="***/*X*/*** ***/***/***" steps="14" symmetry="()"/>
        <!-- Finial / flagpole on turret peak -->
        <one in="B B X" out="* I *" steps="1" symmetry="()"/>
        <all in="B I" out="I *" steps="5"/>

        <!-- 9. Wooden bridge parapet railings (P) along moat water (m) -->
        <all in="bm/bm" out="Pb/Pb" symmetry="(xy)"/>
        <all in="B P/B b" out="P P/B b" steps="4" symmetry="(xy)"/>

        <!-- Clean any stray T if left -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon voxel colours (hex rrggbb), distinct light/dark contrast, >6 materials, all <50% -->
  <color symbol="E" value="7c945c" hidden="True" name="erba" area="field"/>
  <color symbol="H" value="7c945c" hidden="True" name="centro" area="keep"/>
  <color symbol="y" value="878279" hidden="True" name="base vedetta" area="tower"/>

  <!-- Ground & floors (with semantic areas) -->
  <color symbol="c" value="b8ab8e" name="terra battuta del cortile" area="courtyard"/>
  <color symbol="n" value="9a9386" name="lastricato del cortile" area="courtyard"/>
  <color symbol="r" value="a89674" name="strada sterrata" area="road"/>
  <color symbol="m" value="4a7896" name="acqua del fossato" area="moat"/>
  <color symbol="C" value="3d6682" name="acqua del pozzo" area="courtyard"/>
  <color symbol="b" value="8a623e" name="ponte di legno" area="bridge"/>
  <color symbol="f" value="9e744c" name="pavimento del mastio" area="keep"/>
  <color symbol="F" value="845e3c" name="solaio in legno" area="keep"/>
  <color symbol="D" value="96704a" name="pavimento dell'armeria" area="hall"/>

  <!-- Masonry walls & timber posts -->
  <color symbol="K" value="c2b9a7" name="pietra chiara del mastio" area="keep"/>
  <color symbol="Z" value="9c968b" name="pietra grigia delle mura" area="wall"/>
  <color symbol="V" value="878279" name="pietra scura delle torri" area="tower"/>
  <color symbol="M" value="aba394" name="merlatura in pietra"/>
  <color symbol="I" value="757068" name="pietra del pozzo"/>
  <color symbol="P" value="6b4c30" name="pilastro di quercia" area="porch"/>

  <!-- Roofs -->
  <color symbol="J" value="b5543c" name="tetto in coppi rossi"/>
  <color symbol="A" value="9e6b43" name="tettoia in scandole di legno"/>
  <color symbol="X" value="4c5866" name="tetto in ardesia della vedetta"/>

  <!-- Doors, stairs, windows & slits -->
  <color symbol="O" value="6e472b" name="porta di legno"/>
  <color symbol="o" value="4d301b" name="assi scure della porta"/>
  <color symbol="N" value="5c554d" name="stipite in pietra"/>
  <color symbol="k" value="b08457" name="gradini in legno"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="U" value="2b2927" name="feritoia"/>

  <!-- Hidden air letters for openable doors -->
  <color symbol="#20" value="000000" hidden="True" name="vano porta aperto"/>
  <color symbol="#21" value="000000" hidden="True" name="vano assi aperto"/>

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
