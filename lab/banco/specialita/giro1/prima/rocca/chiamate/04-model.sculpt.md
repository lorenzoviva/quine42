# model.sculpt · correzione · gemini-4-argon · 40 s · 24973 token d'ingresso (0 in cache), 5055 d'uscita, 0 di ragionamento · $0.10

## Richiesta

Sculpt: rocca di confine
What it looks like: rocca di confine: a building one enters, with the door at the front, with a cellar under it
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.
It has a cellar under it: the box goes 20 voxels (1.25 tiles) under the soil, which the kernel writes at z=20; z=0 to 19 are under the ground. Dig it with part-cellar: mark D under the floor of a room on the soil, away from the door and from the foot of the stair, then include part-cellar after the floors rise and before part-stair, and give D, V and k your colours. The cellar must hold: a body goes down to it on foot from the door, and every floor down there is reached; if it does not, the building comes in without it.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<!--
  Concept: Rocca di confine (border fortress / fortified keep with cellar)
  Parts & Letters:
  - Keep interior (h: front floor, u: back floor with cellar underneath, s: stair zone to upper storey)
  - Keep walls (w: thick stone walls of the main keep)
  - Corner / flank watchtower attached to the keep (t: tower interior, v: tower wall)
  - Side garrison wing / lean-to or annex (a: wing floor, b: wing wall)
  - Forecourt / bailey (c: courtyard paving, C: outer curtain wall, g: gatehouse, p: corner bastion, q: well/cistern)
  - Entry & road (d: main keep door wall cell, r: paved road to front edge)
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhuswdtabvcCgpqr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main Keep interior: 11 cells wide (55 voxels along x), 8 cells deep (40 voxels along y) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <prl in="H" out="h"/>

      <!-- Keep walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Flank watchtower on one of the corners (seed chooses corner & depth) -->
      <one in="EEw/EEw/EEw/EEw" out="t**/t**/t**/t**" symmetry="(x)" steps="1"/>
      <all in="tE" out="*t" symmetry="(x)" steps="1"/>
      <prl in="E/t" out="t/*" p="0.5" steps="1" symmetry="()"/>
      <all in="t[Ew]" out="*v"/>
      <all in="v[Ew]/*v" out="*v/**"/>
      <!-- Connect tower interior to keep interior -->
      <all in="tvwh" out="ttth" symmetry="(x)"/>
      <all in="tvuh" out="ttuh" symmetry="(x)"/>

      <!-- Side garrison wing on the opposite side wall (seed chooses position) -->
      <one in="wEE/wEE/wEE/wEE" out="*aa/*aa/*aa/*aa" symmetry="(x)" steps="1"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*b"/>
      <all in="bE/*b" out="*b/**"/>
      <!-- Connect wing interior to keep interior -->
      <all in="hwb" out="hha" symmetry="(x)"/>

      <!-- Mark back 4 rows of keep interior as 'u' (cellar zone: 55 voxels wide x 20 deep, 20 voxels back from front wall) -->
      <all in="w/h/h/h/h/h" out="*/u/u/u/u/*" symmetry="()"/>

      <!-- Mark stair zone 's' (4 cells = 20 voxels along x, 2 cells = 10 voxels along y) in front half with 2 cells landing before it -->
      <one in="hhhhhhhhhhh/hhhhhhhhhhh/hhhhhhhhhhh" out="**ssss*****/**ssss*****/***********" symmetry="()" steps="1"/>

      <!-- Front courtyard / bailey in front of keep -->
      <all in="w/E" out="*/c" symmetry="()" steps="2"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>

      <!-- At Huge (where 5+ cells of E remain around the keep), expand courtyard into a full surrounding bailey with curtain wall C, corner bastions p, gatehouse g, and well q -->
      <all in="cEEEEE" out="*ccc**" symmetry="()" steps="1"/>
      <all in="[wvb]EEEEE" out="*ccC**" symmetry="(x)" steps="1"/>
      <all in="E/E/E/E/[wvb]" out="*/C/c/c/*" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="c/E/E" out="*/C/*" symmetry="()"/>
      <all in="cEE" out="*C*" symmetry="(x)"/>
      <all in="CE/*C" out="*C/**"/>

      <!-- Corner bastions 'p' on outer corners of curtain wall C (only at Huge+) -->
      <one in="EE/EC" out="*p/**" steps="4"/>
      <all in="p[EC]" out="*p" steps="1"/>
      <all in="p*/*[EC]" out="**/*p" steps="1"/>

      <!-- Courtyard well/cistern 'q' in a 3x3 clear courtyard space (only fits at Huge+) -->
      <one in="ccc/ccc/ccc" out="***/*q*/***" steps="1"/>

      <!-- Main door 'd' centered on front keep wall, gatehouse 'g' through outer curtain wall, and road 'r' to front edge -->
      <one in="hhhhhhh/wwwwwww/ccccccc" out="*******/**ddd**/**rrr**" symmetry="()" steps="1"/>
      <all in="r/c" out="*/r" symmetry="()"/>
      <all in="r/[CE]" out="*/r" symmetry="()"/>
      <all in="Cr" out="gr" symmetry="(x)" steps="1"/>
      <all in="Cg" out="gg" symmetry="(x)" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhuswdtabvcCgpqrfFWJLRKUGXYQZzDPVOkNMTS#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="C" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="q" out="ccccc/cqqqc/cqZqc/cqqqc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="(xy)">
        <!-- Define unions for parts -->
        <union symbol="+" values="WJXYG"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="WJX"/>

        <!-- 1. Mark D on the first layer under the soil (z=19) directly under 'u' before anything else rises -->
        <all in="B u" out="D *" symmetry="()"/>

        <!-- 2. Ground paving & well -->
        <all in="B q" out="q X" steps="4"/>
        <prl in="q" out="B"/>
        <all in="B Z" out="Z z" steps="2"/>
        <prl in="Z" out="B"/>

        <!-- 3. Outer bailey curtain wall C (24 tall), corner bastions p (34 tall), gatehouse g (38 tall) -->
        <all in="B C" out="C X" steps="24"/>
        <prl in="C" out="B"/>
        <all in="B p" out="p X" steps="34"/>
        <prl in="p" out="B"/>
        <all in="B g" out="g r" steps="1"/>
        <all in="B g" out="g B" steps="29"/>
        <all in="B g" out="g G" steps="8"/>
        <prl in="g" out="B"/>

        <!-- 4. Side garrison wing: walls b (36 tall) and interior a (1 storey = 32 + slab) -->
        <all in="B b" out="b Y" steps="8"/>
        <all in="B b" out="b Q" steps="12"/>
        <all in="B b" out="b Y" steps="16"/>
        <prl in="b" out="B"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a R" steps="1"/>
        <prl in="a" out="B"/>

        <!-- 5. Flank watchtower: walls v (76 tall) and interior t (2 storeys + roof terrace at 64) -->
        <all in="B v" out="v J" steps="10"/>
        <all in="B v" out="v Q" steps="12"/>
        <all in="B v" out="v J" steps="20"/>
        <all in="B v" out="v Q" steps="12"/>
        <all in="B v" out="v J" steps="22"/>
        <prl in="v" out="B"/>
        <all in="B t" out="t f" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t F" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t R" steps="1"/>
        <prl in="t" out="B"/>

        <!-- 6. Main Keep walls w & front door wall d (68 tall: 2 storeys of 32 + 4 parapet base) -->
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d P"/></all>
        <all steps="12"><rule in="B w" out="w Q"/><rule in="B d" out="d W"/></all>
        <all steps="22"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Q"/><rule in="B d" out="d Q"/></all>
        <all steps="14"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="B"/><rule in="d" out="B"/></prl>

        <!-- 7. Main Keep floors: h, u, s (z=20 floor f, z=21 stair strip T on s, z=52 slab F, z=84 roof terrace R) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B u" out="u f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B u" out="u B"/>
        </all>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B u" out="u F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B u" out="u B"/>
          <rule in="B s" out="s B"/>
        </all>
        <all steps="1">
          <rule in="B h" out="h R"/>
          <rule in="B u" out="u R"/>
          <rule in="B s" out="s R"/>
        </all>
        <prl>
          <rule in="h" out="B"/>
          <rule in="u" out="B"/>
          <rule in="s" out="B"/>
        </prl>

        <!-- 8. Include part-cellar after floors have risen and before part-stair -->
        <import file="part-cellar"/>

        <!-- 9. Include part-stair -->
        <import file="part-stair"/>

        <!-- 10. Seed main front door O at foot of front door wall P (where road r meets P at z=20) -->
        <all in="P/r" out="O/*" symmetry="()" steps="1"/>
        <all in="P/O" out="O/*" symmetry="()" steps="4"/>
        <prl in="P" out="W"/>

        <!-- Include part-door -->
        <import file="part-door"/>

        <!-- 11. Include part-battlements and part-slits on fortification walls -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 12. Windows in the Q bands on all sides -->
        <one steps="18">
          <rule in="BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LQQQQB" out="*LLLL*"/>
        <prl in="Q" out="W"/>

        <!-- 13. Chimney on the keep roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="12"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval stone, timber, slate/terracotta accents, high contrast -->
  <color symbol="E" value="#7a8c56" name="erba" hidden="True"/>
  <color symbol="H" value="#8c7b65" name="centro" hidden="True"/>
  <color symbol="h" value="#b89f7d" name="pavimento della sala" area="keep" hidden="True"/>
  <color symbol="u" value="#b89f7d" name="pavimento sopra la cantina" area="keep" hidden="True"/>
  <color symbol="s" value="#b89f7d" name="zona della scala" area="keep" hidden="True"/>
  <color symbol="w" value="#75787d" name="base del muro" area="keep" hidden="True"/>
  <color symbol="d" value="#75787d" name="soglia del portone" area="keep" hidden="True"/>
  <color symbol="t" value="#a38c6b" name="base della torre" area="tower" hidden="True"/>
  <color symbol="v" value="#5e6166" name="fondazione della torre" area="tower" hidden="True"/>
  <color symbol="a" value="#bfa786" name="base dell'ala" area="keep" hidden="True"/>
  <color symbol="b" value="#82858a" name="fondazione dell'ala" area="keep" hidden="True"/>
  <color symbol="C" value="#686b70" name="fondazione della cinta" area="courtyard" hidden="True"/>
  <color symbol="g" value="#54575c" name="base del corpo di guardia" area="courtyard" hidden="True"/>
  <color symbol="p" value="#54575c" name="base della torretta" area="tower" hidden="True"/>
  <color symbol="q" value="#686b70" name="base della cisterna" area="courtyard" hidden="True"/>
  <color symbol="Z" value="#416b75" name="fondo della cisterna" area="courtyard" hidden="True"/>

  <!-- Visible ground & structure materials -->
  <color symbol="c" value="#9c9384" name="lastricato del cortile" area="courtyard"/>
  <color symbol="r" value="#877d6e" name="strada lastricata" area="yard"/>
  <color symbol="W" value="#7c8085" name="pietra del mastio" area="keep"/>
  <color symbol="J" value="#64686e" name="pietra della torre" area="tower"/>
  <color symbol="Y" value="#8a8d91" name="muro dell'ala di guardia" area="keep"/>
  <color symbol="X" value="#6e7175" name="cinta muraria" area="courtyard"/>
  <color symbol="G" value="#595c61" name="arco del corpo di guardia" area="courtyard"/>
  <color symbol="M" value="#8c9096" name="merlatura"/>
  <color symbol="f" value="#9e7348" name="tavolato in legno" area="keep"/>
  <color symbol="F" value="#87603a" name="solaio di quercia" area="keep"/>
  <color symbol="R" value="#9c4a3b" name="terrazza in cotto" area="keep"/>
  <color symbol="K" value="#5c352d" name="comignolo in mattoni"/>
  <color symbol="L" value="#2b3842" name="finestra"/>
  <color symbol="U" value="#23272b" name="feritoia"/>
  <color symbol="z" value="#3b7a8c" name="acqua della cisterna" area="courtyard"/>

  <!-- Parts colours: door (O, o, N), stair (k, T), cellar (D, V) -->
  <color symbol="O" value="#6e4427" name="portone in rovere"/>
  <color symbol="o" value="#4a2c17" name="assi del portone"/>
  <color symbol="N" value="#4f5257" name="stipite in pietra"/>
  <color symbol="k" value="#ab8154" name="gradini"/>
  <color symbol="T" value="#ab8154" name="scala"/>
  <color symbol="D" value="#706658" name="lastricato della cantina" area="keep"/>
  <color symbol="V" value="#524c44" name="muro della cantina" area="keep"/>
  <color symbol="P" value="#7c8085" name="muro frontale"/>
  <color symbol="Q" value="#7c8085" name="fascia muraria"/>

  <color symbol="#20" value="#6e4427" name="portone aperto" hidden="True"/>
  <color symbol="#21" value="#4a2c17" name="assi aperte" hidden="True"/>

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
It does not pass: taglia Grande, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 21 voxel (1,31 caselle), una stanza ne vuole almeno 28 (1,75) a ogni taglia: se l'area è piccola fai meno parti, non più piccole; cantina: dalla porta non si scende in cantina — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at large: grid 100×100×100, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c lastricato del cortile, r strada lastricata, f tavolato in legno, F solaio di quercia, W pietra del mastio, J pietra della torre, L finestra, R terrazza in cotto, K comignolo in mattoni, U feritoia, G arco del corpo di guardia, X cinta muraria, Y muro dell'ala di guardia, D lastricato della cantina, V muro della cantina, O portone in rovere, k gradini, N stipite in pietra, M merlatura, o assi del portone
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEMMXXMMXXMMXXMMXXMMXXMMXXMMXXMMXXMMXXMMXXMX
EEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EEEEEMXMXXcccccccccccccccccccccccccccccccccXXXXXXX
EEEEEXXXXXcccccccccccccccccccccccccccccccccXXXXXXX
XXXXXXXXXMcccccccccccccccccccccccccccccccccXXXXXXX
XXXXXXXXXXcccccccccccccccccccccccccccccccccXXXXXXX
XXXXXXXXXXccccccccccccccccccccccccccccccccXXXXXXXX
XXXXXXXXXXMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMXXXXXXX
XXXXXXXXXXMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMXXXXXXX
XXXXXXXXXXWWVVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWccccccc
XXXXXXXXXXWWMVDDDDDDDDDDDDDDDDDDDDDDDDDVWWcccccccc
XXXXXXXXXXMWWVDDDDDDDDDDDDDDDDDDDDDDDDDVWWMccccccc
XXXXXXXXXXWWVVDDDDDDDDDDDDDDDDDDDDDDDDDVWWWccccccc
XXXXXXXXXXWWMVDDDDDDDkkkkkkkkkkkkkkkkkDVWWWccccccc
XXXcccccEEMWMVDDDDDDDkkkkkkkkkkkkkkkkkDVMMJJMMJJMJ
XXMcccccEEWWWVDDDDDDDkkkkkkkkkkkkkkkkkDVMJJJJJJJJJ
XMccccccEEWWVVDDDDDDDkkkkkkkkkkkkkkkkkDVJJJJJJJJJJ
EEEcccccEEMWMVDDDDDDDkkkkkkkkkkkkkkkkkDVJJJRRRRRJJ
EEEcccccEEMWMVVVVVVVVVVVVVVVVVVVVVVVVVVVMJJRRRRRJJ
EEEMMYYMRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJRRRRRRR
EEEYYYYMRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR
EEEYYYMRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR
EEEYYRRRRRMWMRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJRRRRRRR
EEEYYRRRRRMWMRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR
EEEYYRRRRRWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR
EEEYYRRRRRWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJRRRRRRR
EEEYYRRRRRMWMRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJRRRRRRR
EEEYYRRRRRWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR
EEEYYRRRRRWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR
EEEYYRRRRRMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMJJJJJJJJJ
EEEYYRRRRRMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMJJJJJJJJJ
EEEYYRRRRRMMMWMMcWMMcWMMcWMMrWMMrWMMcWMcMMMJMMEJME
EEEYYRRRRRYYccccccccccccccccrrrrrrrccccccccXXEEEEE
EEEYYRRRRRYYYcccccccccccccccrrrrrrrccccccccXXEEEEE
EEEYYYYYYYYYMcccccXXMMMGGMMMrrrrrrrMGGMMXMMXXMMMEE
EEEYYYYYYYYYMcccccXXXXMGGGGGrrrrrrrGGGGGXXXXXXXEEE
EEEMMYEMXYMMXccccXXXXXMGGGGrrrrrrrrGGGXMXXXXXXXXEE
EEEEEEEEXXXXXXXXXXXXXXXGGGGMrrrrrrrMGXXXXXXXXXXXXX
EEEEEEEEXXXXXXXXXXXMXXMGGGGMrrrrrrrMGMXXXXXXXXXXXX
EEEEEEEEEEXXXXXXXXEEEEEEEEEErrrrrrrEEEEEXXXXXXXXEE
EEEEEEEEEEXXXXXXXXEEEEEEEEEErrrrrrrEEEEEXXXXXXXXEE
EEEEEEEEEEXXXXXXXXEEEEEEEEEErrrrrrrEEEEEXXXXXXXXEE
EEEEEEEEXXXXXXXXXXXXEEEEEEEErrrrrrrEEEXXXXXXXXXXXX
EEEEEEEEXXXXXXXXXXXXEEEEEEEErrrrrrrEEEXXXXXXXXXXXX
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
77777777777777777777777777777777777777777777777777
7777777hhhfhhhfhhhfhhhfhhhfhhhfhhhfhhhfhhhfhhhfhhf
7777777hffffffffffffffffffffffffffffffffffffffffff
77777lllffffffffffffffffffffffffffffffffffffffffff
77777ljlff77777777777777777777777777777777ffffffff
77777jjjff77777777777777777777777777777777ffffffff
jjjjjjjjll77777777777777777777777777777777ffffffff
jjjjjjjjjl77777777777777777777777777777777ffffffff
jjjjjjjjjjxxxvxxxvxxxvxxvxxvxxxvxxxvxxxvxxxfffffff
jjjjjjjjjjxvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvxfffffff
jjjjjjjjjjxvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvxfffffff
jjjjjjjjjjvvx777777777777777777777777777vvv7777777
jjjjjjjjjjxvx700000000000000000000000007vvx7777777
jjjjjjjjjjxvv700000000000000000000000007vvx7777777
jjjjjjjjjjvvx700000000000000000000000007vvv7777777
jjjjjjjjjjxvx700000011122333445556677707vvv7777777
jjj7777777xvx700000011122333445556677707zzzyzzzyzz
jjl7777777vvv700000011122333445556677707zyyyyyyyyy
jll7777777xvx700000011122333445556677707zyyyyyyyyy
7777777777xvx700000011122333445556677707yyyuuuuzyy
7777777777xxx777777777777777777777777777zyyuuuuzzy
77mmmjmmiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
77mjjjjmiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
77mjjjmmiixxxuuuuuuuuuuuuuuuuuuuuuuuuuuuyyyyuuuuuu
77jjjiiiiixvxuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
77mjjiiiiixvxuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
77mjjiiiiivvvuuuuuuuuuuuuuuuuuuuuuuuuuuuyyyuuuuuuu
77mjjiiiiixvxuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
77jjjiiiiixvxuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
77mjjiiiiixvvuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
77mjjiiiiivvvuuuuuuuuuuuuuuuuuuuuuuuuuuuyyyuuuuuuu
77jjjiiiiixvvvvvvvvvvvvvvvvvvvvvvvvvvvvvzyyyyyyyyy
77mjjiiiiixvvvvvvvvvvvvvvvvvvvvvvvvvvvvvzyyyyyyyyy
77mjjiiiiixxxvxxxvxxxvxxxvxxxvxxxvxxxvxxzzzyzzzyzz
77mjjiiiiijjm77777777777777777777777777777fff77777
77jjjiiiiijjj77777777777777777777777777777fff77777
77mjjjjjjjjjm7777hhfhhmmkmmm7777777mkmmmjllfflll77
77mjjjjjjjjjm7777hffffmkkkkk7777777kkkkmjjlffljl77
77mmmjmmmjmmmjlljlllffmkkkkm7777777mkkmmjjjjjjjjjj
7777777ljjjjjjjjjjjlffkkkkkm7777777mkmjjjjjjjjjjjj
7777777lljjjjjjjjjllfhmmmkmm7777777mmmjjjjjjjjjjjj
7777777777jjjjjjjj7777777777777777777777jjjjjjjj77
7777777777jjjjjjjj7777777777777777777777jjjjjjjj77
7777777lljjjjjjjjjll77777777777777777lljjjjjjjjjjj
7777777ljjjjjjjjjjjl77777777777777777ljjjjjjjjjjjj
7777777jjjjjjjjjjjjj77777777777777777jjjjjjjjjjjjj
```
Front (looking from the front; the sky at the top):
```
........................................MMM.MMMMMM
........................................MMMKMMMMMM
........................................JJJJJJJJJJ
..........MMM.MMM.MMM.MMMMMMMMMMMMMMMMMMJUJJJUJJJJ
..........MMM.MMM.MMM.MMMMMMMMMMMMMMMMMMJUJJJUJJJJ
..........MMM.MMM.MMM.MMMMMMMMMMMMMMMMMMJUJJJUJJJJ
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJJJJJJ
..........WUWWWUWWWUWWWUWWWUWWWUWWWUWWWWJUJJJJJJJJ
..........WUWWWUWWWUWWWUWWWUWWWUWWWUWWWWJUJJJJJJJJ
..........WUWWWUWWWUWWWUWWWUWWWUWWWUWWWWJUJJJJJJJJ
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJJJJJJ
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJJJJJJ
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJJJJJJ
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWWWWW
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWWWWW
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWWWWW
..........WWWWWWWWWWWWWMMMMMWWWWWWWMMMMMLLLWWWWWWW
..MMM.MMM.MMMWWWWWWWWWWMMMMMWWWWWWWMMMMMJJJJJJJJJJ
.MMMMMMMMMMMMWWMWWMMWWWMMMMMWWWWWWWMMMMMJMMJJMMMJJ
.MMMMMMMMMMMMWWMWWMMWWWGGGGGWWWWWWWGGGMGJMMJJMMMJJ
.MMYYYYYMYYYYWWMWWMMWWWGGGGGWWWWWWWGGGMGJMMJJMMMJJ
XXXYYYYYXXXXXXXXXXXXWWWGGGGGWWWWWWWGGGXXXXXXXXXXXX
XXXYYYYYXXXXXXXXXXXXWWWGGGGGNNNNNNNGGGXXXXXXXXUXXX
XXXYYYYYXXXXXXXXXXXXMMMWWWWNoooooooNWWXXXXXXXXUXXX
XXXYYYYYXXXXXXXXXXXXMMMWWWWNoooooooNWWXXXXXXXXUXXX
XXXYYYYYXXXXXXXXXXXXMMMWWWWNoooooooNWWXXXXXXXXXXXX
XXXYYYYYXXXXXXXXXXXXXXXWWWWNoooooooNWWXXXXXXXXXXXX
XXXYYYYYXXXXXXXXXXXXXUXWWWWNoooooooNWWXXXXXXXXXXXX
XXXWWWWWXXXXXXXXXXXXXUXWLLLWoooooooLLLXXXXXXXXXXXX
XXXWWWWWXXXXXXXXXXXXXUXWLLLWoooooooLLLXXXXXXXXXXXX
XXXLLLWWXXXXXXXXXXXXXXXWLLLWoooooooLLLXXXXXXXXXXXX
XXXLLLWWXXXXXXXXXXXXXXXWLLLWoooooooLLLXXXXXXXXXXXX
XXXLLLWWXXXXXXXXXXXXXXXWWWWWoooooooWWWXXXXXXXXXXXX
XXXLLLWWXXXXXXXXXXXXXXXWWWWWoooooooWWWXXXXXXXXXXXX
XXXYYYYYXXXXXXXXXXXXXXXWWWWNoooooooNWWXXXXXXXXXXXX
XXXYYYYYXXXXXXXXXXXXXXXWWWWNoooooooNWWXXXXXXXXXXXX
XXXYYYYYXXXXXXXXXXXXXXXWWWWNoooooooNWWXXXXXXXXXXXX
EEEEEEEXXXXXXXXXXXXXEEEEEEEErrrrrrrEEXXXXXXXXXXXXX
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............DDDDDDDDDDDDDDDDDDDDDDDDDDDD..........
```
Right side (looking from the right):
```
....................MMMMMMM.MM.MMM.MMM............
....................MMMMMMMKMM.MMM.MMM............
....................JJJJJJJKJJJJJJJJJJ............
............MMMMMMMMJUJJJUJKJJJJUJJJUJ............
............MMMMMMMMJUJJJUJKJJJJUJJJUJ............
............MMMMMMMMJUJJJUJKJJJJUJJJUJ............
............WWWWWWWWJJJJJJJKJJJJJJJJJJ............
............WWWWWWWWJJJJJRRRRRRRRRRJUJ............
............WWWWWWWWJJJJJJJJJJJJJJJJUJ............
............WWWWWWWWJJJJJJJJJJJJJJJJUJ............
............WWWWWWWWJJJJJJJJJJJJJJJJJJ............
............WWWWWWWWJJJJJJJJJJJJJJJJJJ............
............WWWWWWWWJJJJJJJJJJJJJJJJJJ............
............WWWWLLWWWWWWWWWWWWWLLWWWWW............
............WWWWLLWWWWWWWWWWWWWLLWWWWW............
............WWWWLLWWWWWWWLWWWWWLLLLWWW............
............WWWWLLWWWWWWWLWWWWWLLLLWWW............
............WWWWWWWWWWWWWLWWWWWWLLLWWW............
............WWWWWWWWWWWWWWWWWWWWLLLWWW..MMMMM.....
............WWWWWWWWJJJJJJJJJJJJJJJJJJM.MMMMM.....
.......MM.MMWWWWWWWWJJJJJJJJJJJJJJJJJJM.MMMMM..MM.
.......MM.MMWWWWWWWWJJJJJJJJJJJJJJJJJJM.MMGGG..MM.
.......MM.MMWWWWWWWWJJJJJJJJJJJJJJJJJJYYMMGGG..MM.
.......XXXXXXWWWWWWWJJJJJFFFFFFFFFFJJJYYXXXXXXXXXX
.......XXXXXXWWWWWWWJJJJJJJJJJJJJJJJJJYYXXXXXXXXXX
.....MMXXXXXXWWWWWWWJJJJJJJJJJJJJJJJJJYYXXXXXXXXXX
.....MMXXXXXXWWWWWWWJJJJJJJJJJJJJJJJJJYYXXXXXXXXXX
.....MMXXXXXXWWWWWWWJJJJJJJJJJJJJJJJJJYYXXXXXXXXXX
.....XXXXXXXXXXWWWWWJJJJJJJJJJJJJJJJJJXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWJJJJJJJJJJJJJJJJJJXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWJJJJJJJJJJJJJJJJJJXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWJJJJJJJJJJJJJJJJJJXXXXXXXXXXXX
.....XXXXXXXXXXWWWWWJJJJJJJJJJJJJJJJJJXXXXXXXXXXXX
EEEEEXXXXXXXXXXcccccJJJJJffffffffffJJJEEEEXXXEEXXX
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............VVVVVVVVVV.........................
...............DDDDDDDDDD.........................
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
..................................................
..................................................
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
............VV.........................V..........
............VV.........................V..........
............VV.........................V..........
............VV..............kkkkkkkkkk.V..........
............VV..............kkkkkkkkkk.V..........
............VV..............kkkkkkkkkk.V..........
............VV..............kkkkkkkkkk.V..........
............VV..............kkkkkkkkkk.V..........
............VVVVVVVVVVVVVVVVVVVVVVVVVVVV..........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
.......XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
.......XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
.....XXXXX................................XXXXXXXX
.....XXXXX................................XXXXXXXX
XXXXXXXXXX................................XXXXXXXX
XXXXXXXXXX................................XXXXXXXX
XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXXXXX
XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXXXX
XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXXXX
XXXXXXXXXXWWW...........................WWW.......
XXXXXXXXXXWWW...........................WWW.......
XXXXXXXXXXWWW...........................WWW.......
XXXXXXXXXXWWW...........................WWW.......
XXXXXXXXXXWWW...........................WWW.......
XXX.......WWW...........................JJJJJJJJJJ
XXX.......WWW...........................JJJJJJJJJJ
XX........WWW...........................JJJJJJJJJJ
..........WWW...........................JJJ....JJJ
..........WWW...........................JJJ....JJJ
..YYYYYY...............kkk..............JJJ.......
..YYYYYY...............kkk..............JJJ.......
..YYYYY...WW...........kkk..............JJJ.......
..YYY.....WWW..........kkk..............JJJ.......
..YYY.....WWW..........kkk..............JJJ.......
..YYY.....WWW...........................JJJ.......
..YYY.....WWW...........................JJJ.......
..YYY.....WWW...........................JJJ.......
..YYY.....WWW...........................JJJ.......
..YYY.....WWW...........................JJJ.......
..YYY.....WWWWWWWWWWWWWWWWWNoooooooNWWWWJJJJJJJJJJ
..YYY.....WWWWWWWWWWWWWWWWWNoooooooNWWWWJJJJJJJJJJ
..YYY.....WWWWWWWWWWWWWWWWWNoooooooNWWWWJJJJJJJJJJ
..YYY.....YYY.............................XXX.....
..YYY.....YYY.............................XXX.....
..YYYYYYYYYYY....XXXXXX.................XXXXXXXX..
..YYYYYYYYYYY....XXXXXX.................XXXXXXXX..
...YYYYYYYYYXXXXXXXXXXX...............XXXXXXXXXXXX
.......XXXXXXXXXXXXXXXX..............XXXXXXXXXXXXX
.......XXXXXXXXXXXXXXXX..............XXXXXXXXXXXXX
..........XXXXXXXX......................XXXXXXXX..
..........XXXXXXXX......................XXXXXXXX..
........XXXXXXXXXXXX..................XXXXXXXXXXXX
.......XXXXXXXXXXXXX.................XXXXXXXXXXXXX
.......XXXXXXXXXXXXX.................XXXXXXXXXXXXX
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
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWW...........................JJJJJJJJJJ
..........WWW...........................JJJJJJJJJJ
..........WWW...........................JJJJJJJJJJ
..........WWW...........................JJJ....JJJ
..........WWW...........................JJJ....JJJ
........................................JJJ.......
........................................JJJ.......
..........WW............................JJJ.......
..........WWW...........................JJJ.......
..........WWW...........................JJJ.......
..........WWW...........................JJJ.......
..........WWW...........................JJJ.......
..........WWW...........................JJJ.......
..........WWW...........................JJJ.......
..........WWW...........................JJJ.......
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJJJJJJ
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJJJJJJ
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJJJJJJ
..................................................
..................................................
..................................................
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
XXXEEXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   jjj77jjj777777777777777777777777777777777777777777
XXXEEXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   jjj77jjj777777777777777777777777777777777777777777
XXXEEXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   jjjjjjjjll7777777777777777777777777777777777777777
XXXXXXXXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   jjjjjjjjjl7777777777777777777777777777777777777777
XXXXXXXXXMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   jjjjjjjjll7777777777777777777777777777777777777777
XXXXXXXXEEMMXXMMXXMMXXMMXXMMXXMMXXMMXXMMXXMMXXMXXX   jjjjjjjj77hhhfhhhfhhhfhhhfhhhfhhhfhhhfhhhfhhhfhhff
XXXXXXXXEEMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX   jjjjjjjj77hfffffffffffffffffffffffffffffffffffffff
XXXXXXXXEEMMcXMMcXMMcXMMcXMMcXMMcXMMcXMMcXMXXXXXXX   jjjjjjjjllhhhfhhhfhhhfhhhfhhhfhhhfhhhfhhhfhfffffff
XXXXXXXXXXcccccccccccccccccccccccccccccccccXXXXXXX   jjjjjjjjjl77777777777777777777777777777777hfffffff
XXXXXXXXXMcccccccccccccccccccccccccccccccccXXXXXXX   jjjjlljlll77777777777777777777777777777777ffffffff
XXXcccccEEcccccccccccccccccccccccccccccccccXXXXXXX   jjj777777777777777777777777777777777777777hfffffff
XXMcccccEEcccccccccccccccccccccccccccccccccXXXXXXX   jjl777777777777777777777777777777777777777hfffffff
XMccccccEEccccccccccccccccccccccccccccccccMMMXcMXX   jll7777777xxxvxxxvxxxvxxvxxvxxxvxxxvxxxvxxxhhfhhff
EEEcccccEEMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMccccccc   7777777777xvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvx7777777
EEEcccccEEMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMccccccc   7777777777xxxvxxxvxxxvxxxvxxxvxxxvxxxvxxvvx7777777
EEEYYMMMRRRRRVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWccccccc   77mmjmmmiiuuu777777777777777777777777777vvv7777777
EEEYYYYMRRRRRVDDDDDDDDDDDDDDDDDDDDDDDDDVWWcccccccc   77mjjjjmiiuuu700000000000000000000000007vvx7777777
EEEYYYMRRRRRVVDDDDDDDDDDDDDDDDDDDDDDDDDVWWMccccccc   77mjjjmmiixxx700000000000000000000000007zzzyzzzyzz
EEEYYRRRRRMWMVDDDDDDDDDDDDDDDDDDDDDDDDDVMJJJJJJJJJ   77jjjiiiiixvx700000000000000000000000007zyyyyyyyyy
EEEYYRRRRRMWMVDDDDkkkkkkkkkkkkkkkkkDDDDVMJJJJJJJJJ   77mjjiiiiixvx700011122333445556677700007zyyyyyyyyy
EEEYYRRRRRWWWVDDDDkkkkkkkkkkkkkkkkkDDDDVJJJRRJJJJJ   77mjjiiiiivvv700011122333445556677700007yyyuuyyyyy
EEEYYRRRRRWWVVDDDDkkkkkkkkkkkkkkkkkDDDDVJJJRRMJJJJ   77mjjiiiiixvx700011122333445556677700007zyyuuzyyyy
EEEYYRRRRRMWMVDDDDkkkkkkkkkkkkkkkkkDDDDVMJJRRMMRJM   77jjjiiiiixvx700011122333445556677700007zyyuuzzzyz
EEEYYRRRRRWWVVDDDDkkkkkkkkkkkkkkkkkDDDDVMJJRRRRRRR   77mjjiiiiixvx700011122333445556677700007zyyuuuuuuu
EEEYYRRRRRWWWVVVVVVVVVVVVVVVVVVVVVVVVVVVJJJRRRRRRR   77mjjiiiiivvv777777777777777777777777777yyyuuuuuuu
EEEYYRRRRRMWMRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR   77jjjiiiiixvxuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
EEEYYRRRRRMWMRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJRRRRRRR   77mjjiiiiixvxuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
EEEYYRRRRRMMRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR   77mjjiiiiixxxuuuuuuuuuuuuuuuuuuuuuuuuuuuyyyuuuuuuu
EEEYYRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR   77mjjiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
EEEYYRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJRRRRRRR   77jjjiiiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyuuuuuuu
EEEYYYMMRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJRRRRRRR   77mjjjmmiiuuuuuuuuuuuuuuuuuuuuuuyuuuuuuuzyyuuuuuuu
EEEYYYYMRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR   77mjjjjmiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuyyyuuuuuuu
EEMMMYXMRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJRRRRRRR   jlmmmjmmiixxxuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyy
XXMEEXXXEEMWMRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJJJJJJJJ   jjl77jjj77xvxuuuuuuuuuuuuuuuuuuuuuuuuuuuzyyyyyyyyy
XXXEEXXXEEMWWRRRRRRRRRRRRRRRRRRRRRRRRRRRMJJJJJJJJJ   jjj77jjj77xvvuuuuuuuuuuuuuuuuuuuuuuuuuuuzzzyzzzyzz
XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEXXXEE   jjjjjjjjjjvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv77jjj77
XXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMEEXXXEE   jjjjjjjjjjxvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvx77jjj77
XXXXXXXXXXMMcWMMcWMMcWMMcWMrWMrWMMcWMMcWMMcEEXXXEE   jjjjjjjjjjxxxvxxxvxxxvxxxvxxvxxvxxxvxxxvxxx77jjjjj
XXXXXXXXcccccccccccccccccrrrrrrrrccccccccccccXXXXX   jjjjjjjj7777777777777777777777777777777777777jjjjj
XXXXXXXXcccccccccccccccccrrrrrrrrccccccccccccXXXXX   jjjjjjjj7777777777777777777777777777777777777jjjjj
XXXXXXXXXMXMXXMMXXMMMMGGMrrrrrrrrMMGGMMMXXMXXXXXXX   jjjjjjjjllhhfhhhfhhhmmmkm7777777mmmkmmhhfhhffjjjjj
XXXXXXXXXXXXXXXXXXXXMGGGGrrrrrrrrGGGGMXXXXXXXXXXXX   jjjjjjjjjlfffffffffhmkkkm7777777mkkkkmfffffffjjjjj
XXXXXXXXXXEMXEMMXEMMMGEMMrrrrrrrrEGMMMMMXEMXXXXXXX   jjjjjjjjjlhhfhhhfhhhmkmmm7777777mmkmmmhhfhlljjjjjj
XXXXXXXXXXEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEXXXXXXX   jjjjjjjjjj77777777777777777777777777777777ljjjjjjj
XXXXXXXXXMEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEXXXXXXX   jjjjjjjjll77777777777777777777777777777777lljjjjjj
XXXEEXXXEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEXXXEE   jjj77jjj7777777777777777777777777777777777777jjj77
XXMEEMXMEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEMXMEE   jjl77ljl7777777777777777777777777777777777777ljl77
XMEEEMMEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEMMEEE   jll77lll7777777777777777777777777777777777777lll77
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
EEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE   77777777777777777777777777777777777777777777777777
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEXXXXXXXXXXXX   7777777777777777777777777777777777777jjjjjjjjjjjjj
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEXXXXXXXXXXXX   7777777777777777777777777777777777777ljjjjjjjjjjjj
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMXXXXXXXXXXX   7777777777777777777777777777777777777lljjjjjjjjjjj
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEXXXXXXXXEE   7777777777777777777777777777777777777777jjjjjjjj77
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEXXXXXXXXEE   7777777777777777777777777777777777777777jjjjjjjj77
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXMXXXXXXXXXXX   ffffffffffffffffffffffffffffffffffffflljjjjjjjjjjj
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX   fffffffffffffffffffffffffffffffffffffljjjjjjjjjjjj
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXcMMXcMXXXXXXX   fffffffffffffffffffffffffffffffffffffllljlljjjjjjj
cccccccccccccccccccccccccccccccccccccccccccXXXXXEE   777777777777777777777777777777777777777777fffjjj77
cccccccccccccccccccccccccccccccccccccccccccXXXXXEE   777777777777777777777777777777777777777777fffjjj77
cccccccccccccccccccccccccccccccccccccccccccMXXXXXX   777777777777777777777777777777777777777777lljjjjjj
cccccccccccccccccccccccccccccccccccccccccccXXXXXXX   777777777777777777777777777777777777777777ljjjjjjj
ccccccccccccccccccccccccccccccccccccccccccXXXXXXXX   zyzzzyzzzyzzzxxvxxxvxxxvxxxvxxxvxxxvxxxvxxxjjjjjjj
JJJJJJJJJJJJMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMXXXXXEE   yyyyyyyyyyyyzvvvvvvvvvvvvvvvvvvvvvvvvvvvvvxjjjjj77
JJJJJJJJJJJJMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMXXXXXEE   yyyyyyyyyyyyzvvvvvvvvvvvvvvvvvvvvvvvvvvvvvxjjjjj77
JJJRRJJJJJJJJVVVVVVVVVVVVVVVVVVVVVVVVVVVWWWXXXXXXX   yyyuuyyyyyyyy777777777777777777777777777xvvjjjjjjj
JJJRRMJJJJJJVVDDDDDDDDDDDDDDDDDDDDDDDDDVMWXXXXXXXX   yyyuuzyyyyyyz700000000000000000000000007xvxjjjjjjj
JJJRRMMRJMJJMVDDDDDDDDDDDDDDDDDDDDDDDDDVWWMXXXXXXX   yyyuuzzzyzyyz700000000000000000000000007vvxjjjjjjj
JJJRRRRRRRJJMVDDDDDDDDDDDDDDDDDDDDDDDDDVWWWEEXXXXX   yyyuuuuuuuyyz700000000000000000000000007xvv77ljlff
JJJRRRRRRRJJJVDDDDkkkkkkkkkkkkkkkkkDDDDVMWEEEMXMXX   yyyuuuuuuuyyy700011122333445556677700007xvx77lllff
JJJRRRRRRRJJVVDDDDkkkkkkkkkkkkkkkkkDDDDVMWMEEccccc   yyyuuuuuuuyyz700011122333445556677700007xvx7777777
JJJRRRRRRRJJMVDDDDkkkkkkkkkkkkkkkkkDDDDVWWWEEccccc   yyyuuuuuuuyyz700011122333445556677700007vvv7777777
JJJRRRRRRRJJJVDDDDkkkkkkkkkkkkkkkkkDDDDVWWEEEccccc   yyyuuuuuuuyyy700011122333445556677700007xvx7777777
JJJRRRRRRRJJVVDDDDkkkkkkkkkkkkkkkkkDDDDVMWMEEccccc   yyyuuuuuuuyyz700011122333445556677700007xvx7777777
JJJRRRRRRRJJMVVVVVVVVVVVVVVVVVVVVVVVVVVVMWMEEccccc   yyyuuuuuuuyyz777777777777777777777777777xxx7777777
JJJRRRRRRRJJMRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRMMYYM   yyyuuuyuuuyyzuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiimmmjm
JJJRRRRRRRJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRMYYYY   yyyuuuuuuuyyyuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuiimjjjj
JJJRRRRRRRJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRMRYYY   yyyyyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuuuuuuxxxiimmjjj
JJJJJJJJJJJJMRRRRRRRRRRRRRRRRRRRRRRRRRRRMWMRRRRRYY   yyyyyyyyyyyyzuuuuuuuuuuuuuuuuuuuuuuuuuuuxvxiiiijjj
JJJJJJJJJJJJMRRRRRRRRRRRRRRRRRRRRRRRRRRRMWMRRRRRYY   zyzzzyzzzyzzzuuuuuuuuuuuuuuuuuuuuuuuuuuuxvxiiiijjj
EEEEEEEEEEWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWRRRRRYY   7777777777vvvuuuuuuuuuuuuuuuuuuuuuuuuuuuvvviiiijjj
EEEEEEEEEEWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRWWRRRRRRYY   7777777777vvvuuuuuuuuuuuuuuuuuuuuuuuuuuuxvxiiiijjj
EEEEEEEEEEMWWRRRRRRRRRRRRRRRRRRRRRRRRRRRMWMRRRRRYY   7777777777xvvuuuuuuuuuuuuuuuuuuuuuuuuuuuxvxiiiijjj
EEEEEEEEEEWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRWWRRRRRRYY   7777777777xvvuuuuuuuuuuuuuuuuuuuuuuuuuuuvvxiiiijjj
EEEEEEEEEEWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWRRRRRYY   7777777777vvvuuuuuuuuuuuuuuuuuuuuuuuuuuuvvviiiijjj
EEEEEEEEEEMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMRRRRRYY   7777777777xvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvxiiiijjj
EEEEEEEEEEMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMRRRRRYY   7777777777xvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvxiiiijjj
EEEEEEEEEEMMcWMMcWMMcWMcWMcWMMrWMMrWMMcWMMRRRRRRYY   jll77lll77xxxvxxxvxxxvxxvxxvxxxvxxxvxxxvxxxiiiijjj
XXMEEMXMccccccccccccccccccccrrrrrrrcccccYYYRRRRRYY   jjl77ljl77777777777777777777777777777777mjjiiiijjj
XXXEEXXXccccccccccccccccccccrrrrrrrcccccYYYRRRRRYY   jjj77jjj77777777777777777777777777777777jjjiiiijjj
XXXXXXXXXMXXMMXXMMXXMMMGGMMMrrrrrrrcccccMYYYYYYYYY   jjjjjjjjllhfhhhfhhhfhhmmkmmm777777777777mjjjjjjjjj
XXXXXXXXXXXXXXXXXXXXXXXGGGGMrrrrrrrcccccMYYYYYYYYY   jjjjjjjjjlffffffffffffkkkkkm777777777777mjjjjjjjjj
XXXXXXXXXMXXXXXXXXXXXXMGGGGrrrrrrrrcccccMMXYMMEYME   jjjjjjjjllffffffffffffmkkkkm7777llljlljjmmmjmmmjmm
XXXXXXXXXXXXXXXXXXXXXXMGGGGGrrrrrXXXXXXXXXXXXEEEEE   jjjjjjjjffffffffffffffmkkkkk7777ljjjjjjjjjjjl77777
XXXXXXXXXXXXXXXXXXXXXXMGGGGMrrrrrXXXXXXXXXXXMEEEEE   jjjjjjjjffhfhhhfhhhfhhmmmkmm7777lljjjjjjjjjll77777
XXXXXXXXXMEEEEEEEEEEEEEEEEEErrrrrEEXXXXXXXXEEEEEEE   jjjjjjjjll7777777777777777777777777jjjjjjjj7777777
XXXXXXXXXXEEEEEEEEEEEEEEEEEErrrrrEEXXXXXXXXEEEEEEE   jjjjjjjjjl7777777777777777777777777jjjjjjjj7777777
XXXXXXXXEMEEEEEEEEEEEEEEEEEErrrrrEEXXXXXXXXEEEEEEE   jjjjjjjjll7777777777777777777777lljjjjjjjjjll77777
XXXEEXXXEEEEEEEEEEEEEEEEEEEErrrrrXXXXXXXXXXXXEEEEE   jjj77jjj777777777777777777777777ljjjjjjjjjjjl77777
XXXEEXXXEEEEEEEEEEEEEEEEEEEErrrrrXXXXXXXXXXXXEEEEE   jjj77jjj777777777777777777777777jjjjjjjjjjjjj77777
```
How much the plans of the seeds differ: 0.42 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×100, 200 nodi, 871 passi, finito in 526 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=erba (marcatore), h=pavimento della sala (marcatore), u=pavimento sopra la cantina (marcatore), s=zona della scala (marcatore), w=base del muro (marcatore), d=soglia del portone (marcatore), t=base della torre (marcatore), a=base dell'ala (marcatore), b=fondazione dell'ala (marcatore), v=fondazione della torre (marcatore), c=lastricato del cortile, C=fondazione della cinta (marcatore), g=base del corpo di guardia (marcatore), p=base della torretta (marcatore), r=strada lastricata, f=tavolato in legno, F=solaio di quercia, W=pietra del mastio, J=pietra della torre, L=finestra, R=terrazza in cotto, K=comignolo in mattoni, U=feritoia, G=arco del corpo di guardia, X=cinta muraria, Y=muro dell'ala di guardia, Q=fascia muraria, D=lastricato della cantina, P=muro frontale, V=muro della cantina, O=portone in rovere, k=gradini, N=stipite in pietra, M=merlatura, T=scala, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #93=terreno di prova (marcatore), o=assi del portone.
Alla fine: W 62731, X 57202, J 17342, Y 7200, k 6920, V 5468, U 3384, L 3136, M 2506, o 2130, E 1975, f 1750, R 1750, G 1400, F 1315, c 1175, D 1100, r 550, N 255, O 120, K 13.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-99, passi 1
#5-42 all×24, prl×3, one×5: 411 celle x0-19 y2-19 z20, passi 2-58
   #44 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-99, passi 59
#46-52 all×2, prl×1: 40300 celle x15-99 y10-89 z20-44, passi 60-85
    #53 all . p → p X passi=34: ×34, 78200 celle x0-99 y15-99 z20-54, passi 86-119, p→X 39100, .→p 39100
#54-68 prl×4, all×11: 70350 celle x0-99 y15-99 z20-58, passi 120-252
#69-73 all×4, prl×1: 38850 celle x80-99 y40-74 z20-96, passi 253-308
#74-76 all×3: 44100 celle x85-99 y45-69 z21-84, passi 309-371
#77-80 all×3, prl×1: 35050 celle x20-99 y25-74 z20-85, passi 372-393
    #81 all . w → w W (+1) passi=22: ×22, 37400 celle x20-84 y25-74 z40-62, passi 394-415, w→W 17050, .→w 17050, d→W 1650, .→d 1650
      r1 . w → w W ×17050; r2 . d → d W ×1650
#82-86 all×4, prl×1: 47700 celle x20-84 y25-74 z20-88, passi 416-444
    #87 all . h → h . (+1) passi=31: ×31, 57350 celle x20-79 y50-69 z21-52, passi 445-475, h→. 28675, .→h 28675
      r1 . h → h . ×28675; r2 . u → u . ×0
#88-89 all×2: 14250 celle x20-79 y50-69 z22-53, passi 476-506
    #90 all . h → h . (+2) passi=31: ×31, 69750 celle x20-79 y50-69 z53-84, passi 507-537, h→. 28675, .→h 28675, s→. 6200, .→s 6200
      r1 . h → h . ×28675; r2 . u → u . ×0; r3 . s → s . ×6200
#91-111 all×2, prl×2: 50675 celle x20-79 y30-69 z0-85, passi 538-561
#112-150 prl×9, one×1, all×10: 36610 celle x25-79 y30-59 z1-52, passi 562-656
#151-200 all×19, prl×6, one×2: 47930 celle x0-99 y10-99 z20-99, passi 657-871
Senza effetto (non hanno mai cambiato una cella):
#16 all tvwh → ttth: le celle cercate c'erano, ma mai disposte come nel pattern
#17 all tvuh → ttuh: in quel momento nella griglia non c'erano celle "u"
#27 all cEEEEE → *ccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#37 one ccc/ccc/ccc → ***/*q*/*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#39 all r/c → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#47 all . q → q X passi=4: in quel momento nella griglia non c'erano celle "q"
#48 prl q → .: in quel momento nella griglia non c'erano celle "q"
#49 all . Z → Z z passi=2: in quel momento nella griglia non c'erano celle "Z"
#50 prl Z → .: in quel momento nella griglia non c'erano celle "Z"
#94 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#95 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
… e altri 52
Fix it and answer with the whole program.

## Risposta

<!--
  Concept: Rocca di confine (border fortress / fortified keep with cellar)
  Parts & Letters:
  - Keep interior (h: front floor, u: back floor with cellar underneath, s: stair zone to upper storey)
  - Keep walls (w: thick stone walls of the main keep, d: front door wall cells)
  - Corner / flank watchtower attached to the keep (t: tower interior, v: tower wall)
  - Side garrison wing / annex (a: wing floor, b: wing wall)
  - Forecourt / bailey (c: courtyard paving, C: outer curtain wall, g: gatehouse, p: corner bastion, q: well/cistern)
  - Entry & road (r: paved road to front edge)
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhuswdtabvcCgpqr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main Keep interior: 11 cells wide (55 voxels along x), 10 cells deep (50 voxels along y) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="5"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <prl in="H" out="h"/>

      <!-- Keep walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Flank watchtower on one of the side walls (seed chooses side & position) -->
      <one in="EEw/EEw/EEw/EEw" out="tt*/tt*/tt*/tt*" symmetry="(x)" steps="1"/>
      <prl in="E/t" out="t/*" p="0.5" steps="1" symmetry="()"/>
      <all in="t[Ew]" out="*v"/>
      <all in="v[Ew]/*v" out="*v/**"/>
      <!-- Connect tower interior to keep interior -->
      <all in="twh" out="tth" symmetry="(x)"/>

      <!-- Side garrison wing on the opposite side wall (seed chooses position) -->
      <one in="wEE/wEE/wEE/wEE" out="*aa/*aa/*aa/*aa" symmetry="(x)" steps="1"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*b"/>
      <all in="bE/*b" out="*b/**"/>
      <!-- Connect wing interior to keep interior -->
      <all in="hwb" out="hha" symmetry="(x)"/>

      <!-- Mark back 5 rows of keep interior as 'u' (cellar zone: 55 voxels wide x 25 deep, leaving 25 voxels front floor h) -->
      <all in="w/h/h/h/h/h/h" out="*/u/u/u/u/u/*" symmetry="()"/>

      <!-- Mark stair zone 's' (4 cells = 20 voxels along x, 2 cells = 10 voxels along y) against the front wall inside h -->
      <one in="hhhhhhhhhhh/hhhhhhhhhhh/wwwwwwwwwww" out="****ssss***/****ssss***/***********" symmetry="()" steps="1"/>

      <!-- Front courtyard / forecourt in front of keep -->
      <all in="w/E" out="*/c" symmetry="()" steps="2"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>

      <!-- At Huge (where 7+ cells of E remain around the keep), expand courtyard into a full surrounding bailey with curtain wall C, corner bastions p, gatehouse g, and well q -->
      <all in="wEEEEEEE" out="*ccccC**" symmetry="(x)" steps="1"/>
      <all in="E/E/E/E/E/[wvb]" out="*/C/c/c/c/*" symmetry="()" steps="1"/>
      <all in="c/E/E/E" out="*/c/c/*" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**" steps="6"/>
      <all in="c/E/E" out="*/C/*" symmetry="()"/>
      <all in="cEE" out="*C*" symmetry="(x)"/>
      <all in="CE/*C" out="*C/**"/>

      <!-- Corner bastions 'p' on outer corners of curtain wall C (only at Huge+) -->
      <one in="EE/EC" out="*p/**" steps="4"/>
      <all in="p[EC]" out="*p" steps="1"/>
      <all in="p*/*[EC]" out="**/*p" steps="1"/>

      <!-- Courtyard well/cistern 'q' in a 3x3 clear courtyard space (only fits at Huge+) -->
      <one in="ccc/ccc/ccc" out="***/*q*/***" steps="1"/>

      <!-- Main door 'd' centered on front keep wall, gatehouse 'g' through outer curtain wall, and road 'r' to front edge -->
      <one in="wwwwwww/ccccccc" out="**ddd**/**rrr**" symmetry="()" steps="1"/>
      <all in="r/c" out="*/r" symmetry="()"/>
      <all in="r/[CE]" out="*/r" symmetry="()"/>
      <all in="Cr" out="gr" symmetry="(x)" steps="1"/>
      <all in="Cg" out="gg" symmetry="(x)" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhuswdtabvcCgpqrfFWJLRKUGXYQZzDPVOkNMTS#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="C" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="q" out="ccccc/cqqqc/cqZqc/cqqqc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="(xy)">
        <!-- Define unions for parts -->
        <union symbol="+" values="WJXYG"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="WJX"/>

        <!-- 1. Mark D on the first layer under the soil (z=19) directly under 'u' before anything else rises -->
        <all in="u B" out="* D" symmetry="()"/>

        <!-- 2. Ground paving & well -->
        <all in="B q" out="q X" steps="4"/>
        <prl in="q" out="B"/>
        <all in="B Z" out="Z z" steps="2"/>
        <prl in="Z" out="B"/>

        <!-- 3. Outer bailey curtain wall C (24 tall), corner bastions p (34 tall), gatehouse g (38 tall) -->
        <all in="B C" out="C X" steps="24"/>
        <prl in="C" out="B"/>
        <all in="B p" out="p X" steps="34"/>
        <prl in="p" out="B"/>
        <all in="B g" out="g r" steps="1"/>
        <all in="B g" out="g B" steps="29"/>
        <all in="B g" out="g G" steps="8"/>
        <prl in="g" out="B"/>

        <!-- 4. Side garrison wing: walls b (36 tall) and interior a (1 storey = 32 + slab) -->
        <all in="B b" out="b Y" steps="8"/>
        <all in="B b" out="b Q" steps="12"/>
        <all in="B b" out="b Y" steps="16"/>
        <prl in="b" out="B"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a R" steps="1"/>
        <prl in="a" out="B"/>

        <!-- 5. Flank watchtower: walls v (76 tall) and interior t (2 storeys + roof terrace at 64) -->
        <all in="B v" out="v J" steps="10"/>
        <all in="B v" out="v Q" steps="12"/>
        <all in="B v" out="v J" steps="20"/>
        <all in="B v" out="v Q" steps="12"/>
        <all in="B v" out="v J" steps="22"/>
        <prl in="v" out="B"/>
        <all in="B t" out="t f" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t F" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t R" steps="1"/>
        <prl in="t" out="B"/>

        <!-- 6. Main Keep walls w & front door wall d (68 tall: 2 storeys of 32 + 4 parapet base) -->
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d P"/></all>
        <all steps="12"><rule in="B w" out="w Q"/><rule in="B d" out="d W"/></all>
        <all steps="22"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Q"/><rule in="B d" out="d Q"/></all>
        <all steps="14"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="B"/><rule in="d" out="B"/></prl>

        <!-- 7. Main Keep floors: h, u, s (z=20 floor f, z=21 stair strip T on s, z=52 slab F, z=84 roof terrace R) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B u" out="u f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B u" out="u B"/>
        </all>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B u" out="u F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B u" out="u B"/>
          <rule in="B s" out="s B"/>
        </all>
        <all steps="1">
          <rule in="B h" out="h R"/>
          <rule in="B u" out="u R"/>
          <rule in="B s" out="s R"/>
        </all>
        <prl>
          <rule in="h" out="B"/>
          <rule in="u" out="B"/>
          <rule in="s" out="B"/>
        </prl>

        <!-- 8. Include part-cellar after floors have risen and before part-stair -->
        <import file="part-cellar"/>

        <!-- 9. Include part-stair -->
        <import file="part-stair"/>

        <!-- 10. Seed main front door O at foot of front door wall P (where road r meets P at z=20) -->
        <all in="P/r" out="O/*" symmetry="()" steps="1"/>
        <all in="P/O" out="O/*" symmetry="()" steps="4"/>
        <prl in="P" out="W"/>

        <!-- Include part-door -->
        <import file="part-door"/>

        <!-- 11. Include part-battlements and part-slits on fortification walls -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 12. Windows in the Q bands on all sides -->
        <one steps="18">
          <rule in="BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ BQ/BQ/BQ/BQ/BQ" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LQQQQB" out="*LLLL*"/>
        <prl in="Q" out="W"/>

        <!-- 13. Chimney on the keep roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="12"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval stone, timber, slate/terracotta accents, high contrast -->
  <color symbol="E" value="#7a8c56" name="erba" hidden="True"/>
  <color symbol="H" value="#8c7b65" name="centro" hidden="True"/>
  <color symbol="h" value="#b89f7d" name="pavimento della sala" area="keep" hidden="True"/>
  <color symbol="u" value="#b89f7d" name="pavimento sopra la cantina" area="keep" hidden="True"/>
  <color symbol="s" value="#b89f7d" name="zona della scala" area="keep" hidden="True"/>
  <color symbol="w" value="#75787d" name="base del muro" area="keep" hidden="True"/>
  <color symbol="d" value="#75787d" name="soglia del portone" area="keep" hidden="True"/>
  <color symbol="t" value="#a38c6b" name="base della torre" area="tower" hidden="True"/>
  <color symbol="v" value="#5e6166" name="fondazione della torre" area="tower" hidden="True"/>
  <color symbol="a" value="#bfa786" name="base dell'ala" area="keep" hidden="True"/>
  <color symbol="b" value="#82858a" name="fondazione dell'ala" area="keep" hidden="True"/>
  <color symbol="C" value="#686b70" name="fondazione della cinta" area="courtyard" hidden="True"/>
  <color symbol="g" value="#54575c" name="base del corpo di guardia" area="courtyard" hidden="True"/>
  <color symbol="p" value="#54575c" name="base della torretta" area="tower" hidden="True"/>
  <color symbol="q" value="#686b70" name="base della cisterna" area="courtyard" hidden="True"/>
  <color symbol="Z" value="#416b75" name="fondo della cisterna" area="courtyard" hidden="True"/>

  <!-- Visible ground & structure materials -->
  <color symbol="c" value="#9c9384" name="lastricato del cortile" area="courtyard"/>
  <color symbol="r" value="#877d6e" name="strada lastricata" area="yard"/>
  <color symbol="W" value="#7c8085" name="pietra del mastio" area="keep"/>
  <color symbol="J" value="#64686e" name="pietra della torre" area="tower"/>
  <color symbol="Y" value="#8a8d91" name="muro dell'ala di guardia" area="keep"/>
  <color symbol="X" value="#6e7175" name="cinta muraria" area="courtyard"/>
  <color symbol="G" value="#595c61" name="arco del corpo di guardia" area="courtyard"/>
  <color symbol="M" value="#8c9096" name="merlatura"/>
  <color symbol="f" value="#9e7348" name="tavolato in legno" area="keep"/>
  <color symbol="F" value="#87603a" name="solaio di quercia" area="keep"/>
  <color symbol="R" value="#9c4a3b" name="terrazza in cotto" area="keep"/>
  <color symbol="K" value="#5c352d" name="comignolo in mattoni"/>
  <color symbol="L" value="#2b3842" name="finestra"/>
  <color symbol="U" value="#23272b" name="feritoia"/>
  <color symbol="z" value="#3b7a8c" name="acqua della cisterna" area="courtyard"/>

  <!-- Parts colours: door (O, o, N), stair (k, T), cellar (D, V) -->
  <color symbol="O" value="#6e4427" name="portone in rovere"/>
  <color symbol="o" value="#4a2c17" name="assi del portone"/>
  <color symbol="N" value="#4f5257" name="stipite in pietra"/>
  <color symbol="k" value="#ab8154" name="gradini"/>
  <color symbol="T" value="#ab8154" name="scala"/>
  <color symbol="D" value="#706658" name="lastricato della cantina" area="keep"/>
  <color symbol="V" value="#524c44" name="muro della cantina" area="keep"/>
  <color symbol="P" value="#7c8085" name="muro frontale"/>
  <color symbol="Q" value="#7c8085" name="fascia muraria"/>

  <color symbol="#20" value="#6e4427" name="portone aperto" hidden="True"/>
  <color symbol="#21" value="#4a2c17" name="assi aperte" hidden="True"/>

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
