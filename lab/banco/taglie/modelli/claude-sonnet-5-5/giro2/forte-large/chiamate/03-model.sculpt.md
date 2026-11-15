# model.sculpt · claude-sonnet-5-5 · 25 s

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
<!-- FORTE: parts and where each goes.
 h/w : the keep, a body of 9 x 8-9 cells around the centre H, with its walls w, two storeys. The stair s lies along the back wall, at one of three offsets by seed.
 c : the yard, a ring one cell wide around the keep. W : the curtain wall around the yard. t : corner towers; two corners always, the others by chance.
 d, n, G, r : door in the keep wall, paving across the yard, gatehouse in the ring, road to the edge. All straight to the front on the axis of H, three cells wide.
 The seeds change: depth of the keep, which corners have towers, where the stair stands, where the trees and barracks go.
 At 5x5 tiles: keep, thin yard, ring, towers, gate, road, a few trees.
 At 7.5 tiles: the yard grows four cells on every side, a well, barracks against the ring, more lawn. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdncWGrtsaQy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <one in="EE/EW" out="**/*t" steps="2"/>
      <prl in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the stair zone along the back wall: two cells of landing, four of stair, at one of three offsets -->
      <one in="wwwwwww/hhhhhhh/hhhhhhh" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/WWWWWWW" out="*******/*aaaaa*/*aaaaa*/*aaaaa*/*aaaaa*/*******" steps="2"/>
      <one in="EEE/EEE/EEE" out="***/*y*/***" steps="3"/>
    </sequence>
    <map scale="5 5 1" values="BEhswWtGgnrcaQqyjOoNDYXKJRVLZFTkMU" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="y" out="yyyyy/yjjjy/yjjjy/yjjjy/yyyyy"/>
      <union symbol="+" values="wWtG"/>
      <union symbol="=" values="hsF"/>
      <union symbol="%" values="wW"/>
      <sequence symmetry="(xy)">
        <!-- B. the heads: one marker on top of each column -->
        <all steps="1"><rule in="B h" out="Y h"/><rule in="B s" out="X s"/><rule in="B a" out="K a"/><rule in="B O" out="D O"/></all>
        <!-- keep walls: two storeys with a band, one more than the roof -->
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w V" steps="14"/>
        <all in="B w" out="w w" steps="12"/>
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w V" steps="14"/>
        <all in="B w" out="w w" steps="12"/>
        <all in="B w" out="w w" steps="1"/>
        <!-- the wall over the door -->
        <all in="B D" out="D w" steps="64"/>
        <!-- ring wall, 24, with a dark course -->
        <all in="B W" out="W W" steps="10"/>
        <all in="B W" out="W Z" steps="2"/>
        <all in="B W" out="W W" steps="11"/>
        <!-- towers, 40 -->
        <all in="B t" out="t t" steps="10"/>
        <all in="B t" out="t Z" steps="2"/>
        <all in="B t" out="t t" steps="27"/>
        <!-- gatehouse: paving, a free passage of 31, a lintel above -->
        <all in="B G" out="G n" steps="1"/>
        <all in="B G" out="G g" steps="31"/>
        <all in="B G" out="G G" steps="7"/>
        <!-- barracks -->
        <all in="B K" out="K a" steps="23"/>
        <all in="B K" out="K J" steps="3"/>
        <!-- well -->
        <all in="B Q" out="Q Q" steps="8"/>
        <!-- trees -->
        <all in="B j" out="j j" steps="19"/>
        <all in="B y" out="y E" steps="1"/>
        <all in="B y" out="y B" steps="9"/>
        <all in="B y" out="y y" steps="9"/>
        <!-- keep floors: strip of the stair, air, slab, air, roof -->
        <all in="B X" out="X T" steps="1" symmetry="()"/>
        <all in="B Y" out="Y B" steps="1"/>
        <all steps="30"><rule in="B Y" out="Y B"/><rule in="B X" out="X B"/></all>
        <all steps="1"><rule in="B Y" out="Y F"/><rule in="B X" out="X F"/></all>
        <all steps="31"><rule in="B Y" out="Y B"/><rule in="B X" out="X B"/></all>
        <prl><rule in="Y" out="R"/><rule in="X" out="R"/><rule in="D" out="w"/><rule in="K" out="J"/></prl>
        <!-- C. windows in the band -->
        <one steps="60"><rule in="BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="w"/>
        <!-- the passage of the gate: 11 wide, piers of 2 -->
        <all in="[BW]ggggggggggggggg[BW]" out="***BBBBBBBBBBB***"/>
        <prl in="g" out="G"/>
        <!-- the parts -->
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
        <import file="part-door"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="#000000" name="aria"/>
  <color symbol="H" value="#8A6A4A" name="centro del maschio" area="keep"/>
  <color symbol="E" value="#7FA05A" name="terra" hidden="True"/>
  <color symbol="h" value="#B89A6A" name="assito del maschio" area="keep"/>
  <color symbol="w" value="#A9A59A" name="muro del maschio"/>
  <color symbol="m" value="#C9A66B" name="traccia del percorso" hidden="True"/>
  <color symbol="d" value="#5A3A22" name="porta del maschio"/>
  <color symbol="n" value="#B7A98A" name="selciato"/>
  <color symbol="c" value="#A8B878" name="cortile" area="courtyard"/>
  <color symbol="W" value="#8A8A82" name="cinta muraria"/>
  <color symbol="G" value="#6A6862" name="torre del cancello"/>
  <color symbol="g" value="#6A6862" name="pilastro del cancello"/>
  <color symbol="r" value="#C8B58A" name="strada"/>
  <color symbol="t" value="#9A8C78" name="torre d'angolo" area="tower"/>
  <color symbol="s" value="#A88A5A" name="assito della scala" area="keep"/>
  <color symbol="a" value="#B5654A" name="caserma" area="barracks"/>
  <color symbol="Q" value="#7C7A74" name="pozzo"/>
  <color symbol="q" value="#4A7FA8" name="acqua del pozzo"/>
  <color symbol="y" value="#3F7A3A" name="chioma"/>
  <color symbol="j" value="#5B3E26" name="tronco"/>
  <color symbol="O" value="#7A4E2C" name="porta"/>
  <color symbol="o" value="#4A2E1A" name="assi della porta"/>
  <color symbol="N" value="#3C2A1E" name="stipite"/>
  <color symbol="D" value="#A9A59A" name="segno" hidden="True"/>
  <color symbol="Y" value="#000000" name="segno del piano" hidden="True"/>
  <color symbol="X" value="#000000" name="segno della scala" hidden="True"/>
  <color symbol="K" value="#000000" name="segno della caserma" hidden="True"/>
  <color symbol="J" value="#6B4A3A" name="tetto della caserma"/>
  <color symbol="R" value="#A6483A" name="tetto del maschio"/>
  <color symbol="V" value="#A9A59A" name="fascia" hidden="True"/>
  <color symbol="L" value="#8FB8D0" name="vetro"/>
  <color symbol="Z" value="#4A4642" name="cordolo scuro"/>
  <color symbol="F" value="#8C6A44" name="solaio"/>
  <color symbol="T" value="#000000" name="traccia della scala" hidden="True"/>
  <color symbol="k" value="#C2A878" name="gradini"/>
  <color symbol="M" value="#B5B0A4" name="merlo"/>
  <color symbol="U" value="#1E1E22" name="feritoia"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Grande, seme 1: il simbolo "#20" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="#20" value="rrggbb"/>
Fix it and answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdncWGrtsaQy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <one in="EE/EW" out="**/*t" steps="2"/>
      <prl in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/hhhhhhh/hhhhhhh" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/WWWWWWW" out="*******/*aaaaa*/*aaaaa*/*aaaaa*/*aaaaa*/*******" steps="2"/>
      <one in="EEE/EEE/EEE" out="***/*y*/***" steps="3"/>
    </sequence>
    <map scale="5 5 1" values="BEhswWtGgnrcaQqyjOoNDYXKJRVLZFTkMU" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="y" out="yyyyy/yjjjy/yjjjy/yjjjy/yyyyy"/>
      <union symbol="+" values="wWtG"/>
      <union symbol="=" values="hsF"/>
      <union symbol="%" values="wW"/>
      <sequence symmetry="(xy)">
        <all steps="1"><rule in="B h" out="Y h"/><rule in="B s" out="X s"/><rule in="B a" out="K a"/><rule in="B O" out="D O"/></all>
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w V" steps="14"/>
        <all in="B w" out="w w" steps="12"/>
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w V" steps="14"/>
        <all in="B w" out="w w" steps="12"/>
        <all in="B w" out="w w" steps="1"/>
        <all in="B D" out="D w" steps="64"/>
        <all in="B W" out="W W" steps="10"/>
        <all in="B W" out="W Z" steps="2"/>
        <all in="B W" out="W W" steps="11"/>
        <all in="B t" out="t t" steps="10"/>
        <all in="B t" out="t Z" steps="2"/>
        <all in="B t" out="t t" steps="27"/>
        <all in="B G" out="G n" steps="1"/>
        <all in="B G" out="G g" steps="31"/>
        <all in="B G" out="G G" steps="7"/>
        <all in="B K" out="K a" steps="23"/>
        <all in="B K" out="K J" steps="3"/>
        <all in="B Q" out="Q Q" steps="8"/>
        <all in="B j" out="j j" steps="19"/>
        <all in="B y" out="y E" steps="1"/>
        <all in="B y" out="y B" steps="9"/>
        <all in="B y" out="y y" steps="9"/>
        <all in="B X" out="X T" steps="1" symmetry="()"/>
        <all in="B Y" out="Y B" steps="1"/>
        <all steps="30"><rule in="B Y" out="Y B"/><rule in="B X" out="X B"/></all>
        <all steps="1"><rule in="B Y" out="Y F"/><rule in="B X" out="X F"/></all>
        <all steps="31"><rule in="B Y" out="Y B"/><rule in="B X" out="X B"/></all>
        <prl><rule in="Y" out="R"/><rule in="X" out="R"/><rule in="D" out="w"/><rule in="K" out="J"/></prl>
        <one steps="60"><rule in="BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="w"/>
        <all in="[BW]ggggggggggggggg[BW]" out="***BBBBBBBBBBB***"/>
        <prl in="g" out="G"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
        <import file="part-door"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="#000000" name="aria"/>
  <color symbol="H" value="#8A6A4A" name="centro del maschio" area="keep"/>
  <color symbol="E" value="#7FA05A" name="terra" hidden="True"/>
  <color symbol="h" value="#B89A6A" name="assito del maschio" area="keep"/>
  <color symbol="w" value="#A9A59A" name="muro del maschio"/>
  <color symbol="m" value="#C9A66B" name="traccia del percorso" hidden="True"/>
  <color symbol="d" value="#5A3A22" name="porta del maschio"/>
  <color symbol="n" value="#B7A98A" name="selciato"/>
  <color symbol="c" value="#A8B878" name="cortile" area="courtyard"/>
  <color symbol="W" value="#8A8A82" name="cinta muraria"/>
  <color symbol="G" value="#6A6862" name="torre del cancello"/>
  <color symbol="g" value="#6A6862" name="pilastro del cancello"/>
  <color symbol="r" value="#C8B58A" name="strada"/>
  <color symbol="t" value="#9A8C78" name="torre d'angolo" area="tower"/>
  <color symbol="s" value="#A88A5A" name="assito della scala" area="keep"/>
  <color symbol="a" value="#B5654A" name="caserma" area="barracks"/>
  <color symbol="Q" value="#7C7A74" name="pozzo"/>
  <color symbol="q" value="#4A7FA8" name="acqua del pozzo"/>
  <color symbol="y" value="#3F7A3A" name="chioma"/>
  <color symbol="j" value="#5B3E26" name="tronco"/>
  <color symbol="O" value="#7A4E2C" name="porta"/>
  <color symbol="o" value="#4A2E1A" name="assi della porta"/>
  <color symbol="N" value="#3C2A1E" name="stipite"/>
  <color symbol="D" value="#A9A59A" name="segno" hidden="True"/>
  <color symbol="Y" value="#000000" name="segno del piano" hidden="True"/>
  <color symbol="X" value="#000000" name="segno della scala" hidden="True"/>
  <color symbol="K" value="#000000" name="segno della caserma" hidden="True"/>
  <color symbol="J" value="#6B4A3A" name="tetto della caserma"/>
  <color symbol="R" value="#A6483A" name="tetto del maschio"/>
  <color symbol="V" value="#A9A59A" name="fascia" hidden="True"/>
  <color symbol="L" value="#8FB8D0" name="vetro"/>
  <color symbol="Z" value="#4A4642" name="cordolo scuro"/>
  <color symbol="F" value="#8C6A44" name="solaio"/>
  <color symbol="T" value="#000000" name="traccia della scala" hidden="True"/>
  <color symbol="k" value="#C2A878" name="gradini"/>
  <color symbol="M" value="#B5B0A4" name="merlo"/>
  <color symbol="U" value="#1E1E22" name="feritoia"/>
  <color symbol="#20" value="#000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
