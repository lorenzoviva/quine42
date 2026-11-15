# model.sculpt · claude-sonnet-5-5 · 37 s · 1 immagini

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

Your program:
<!--
FORTE: the parts and where each goes (plan letters, 1 cell = 5 voxels)
- keep h/H (floor), w (walls), d (door): around the centre H, 9 cells wide inside, 9 or 10 deep.
  The door d is 3 cells wide in the middle of the front wall. Two storeys, band windows, a flat roof inside a parapet with merlons.
- stair zone s: inside the keep, along the back wall, 2 cells of landing, 4 long and 2 wide, climbing toward large x.
- yard c: a ring around the keep, 4 cells wider on every side where 6 cells of ground go on past it.
- curtain wall W: one cell thick around the yard, with a walk and merlons, slits under the merlons.
- towers t: 3 x 3 on the outer corners of the wall, 40 high. The seed picks which corners.
- gate G: through the wall on the axis of the keep door. Paving n crosses the yard, road r runs on to the edge, all 3 wide.
- annex a: a barracks against the inside of the wall, on a side chosen by the seed (only where the yard is wide enough).
- well Q: in 5 x 5 of free yard.
- moat x: 2 cells outside the wall where 5 cells of ground go on past it. The road crosses it as a causeway.
- trees q: 7 x 7 of lawn beyond the moat.
What fits: Large = keep inside a thin ring with towers and the gate. Huge = a wide yard, annexes and a well. Gargantuan = the same plus moat and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdcWtGnraxQqs" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="h/E" out="*/d" symmetry="()" steps="1"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all steps="1"><rule in="wE" out="*c"/><rule in="dE" out="*c"/></all>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <one in="EE/EW" out="**/*t" steps="2"/>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.7"/></one>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.5"/></one>
      <all steps="1"><rule in="t[EWc]" out="*t"/><rule in="t*/*[EWc]" out="**/*t"/></all>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <one in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" steps="1"/>
      <one steps="1"><rule in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" p="0.6"/></one>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cWEEEEE" out="**xx***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***q***/*******/*******/*******" steps="3"/>
    </sequence>
    <map scale="5 5 1" values="BEfFhsTkmYLwWdOoNGtMURcnraxQqge" symmetry="()">
      <union symbol="+" values="wWmYtG"/>
      <union symbol="=" values="fF"/>
      <union symbol="%" values="W"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="q" out="eeeee/eggge/eggge/eggge/eeeee"/>
      <sequence symmetry="(xy)">
        <!-- B. the heights -->
        <!-- keep walls: 70, two bands of windows -->
        <all in="B w" out="w m" steps="6"/>
        <all in="B w" out="w Y" steps="14"/>
        <all in="B w" out="w m" steps="18"/>
        <all in="B w" out="w Y" steps="14"/>
        <all in="B w" out="w m" steps="18"/>
        <!-- keep door cells: the seed O at the foot, wall above -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d m" steps="69"/>
        <prl in="d" out="w"/>
        <!-- curtain wall with a walk, towers, gatehouse, annexes, well -->
        <all in="B W" out="W W" steps="23"/>
        <all in="B t" out="t t" steps="39"/>
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G G" steps="39"/>
        <all in="B a" out="a a" steps="19"/>
        <prl in="a" out="R"/>
        <all in="B Q" out="Q Q" steps="8"/>
        <!-- trees: trunk and crown -->
        <all in="B e" out="e E" steps="1"/>
        <all in="B e" out="e B" steps="9"/>
        <all in="B e" out="e q" steps="6"/>
        <all in="B g" out="g g" steps="10"/>
        <all in="B g" out="g q" steps="6"/>
        <prl><rule in="e" out="q"/><rule in="g" out="q"/></prl>
        <!-- the floors of the keep -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- C. windows in the bands -->
        <one steps="36"><rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="m"/>
        <!-- the parts -->
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="7FA35A" name="terra" hidden="True"/>
  <color symbol="H" value="D8C08A" name="centro del mastio" area="keep"/>
  <color symbol="h" value="C9B28A" name="pavimento del mastio" area="keep"/>
  <color symbol="f" value="9C7B52" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7D7468" name="solaio"/>
  <color symbol="m" value="D9CCAE" name="intonaco"/>
  <color symbol="Y" value="B9AC8C" name="fascia"/>
  <color symbol="L" value="6FA8C8" name="vetro"/>
  <color symbol="w" value="8E8A82" name="muro del mastio"/>
  <color symbol="d" value="5B3A29" name="porta del mastio"/>
  <color symbol="c" value="9FB36B" name="cortile" area="courtyard"/>
  <color symbol="W" value="6F6B66" name="muro di cinta"/>
  <color symbol="t" value="5A5650" name="torre" area="tower"/>
  <color symbol="G" value="3F3C3A" name="porta fortificata"/>
  <color symbol="n" value="C2A878" name="lastricato"/>
  <color symbol="r" value="B08D57" name="strada"/>
  <color symbol="a" value="C79A55" name="alloggio" area="barracks"/>
  <color symbol="R" value="B5483A" name="tetto"/>
  <color symbol="x" value="4A90B8" name="fossato"/>
  <color symbol="Q" value="3B6E8F" name="pozzo" area="well"/>
  <color symbol="q" value="3E7D3A" name="chioma" area="orchard"/>
  <color symbol="g" value="6B4A2B" name="tronco"/>
  <color symbol="e" value="3E7D3A" name="chioma" hidden="True"/>
  <color symbol="s" value="D96B2B" name="zona della scala" hidden="True"/>
  <color symbol="T" value="D96B2B" name="traccia della scala" hidden="True"/>
  <color symbol="k" value="8A5A32" name="gradini"/>
  <color symbol="M" value="A39E94" name="merlo"/>
  <color symbol="U" value="1E1E1E" name="feritoia"/>
  <color symbol="O" value="5B3A29" name="porta"/>
  <color symbol="o" value="3A2418" name="assi della porta"/>
  <color symbol="N" value="2E2A28" name="stipite"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: La sommità del maschio centrale presenta un riempimento rosso vivo che non sembra un pavimento o un tetto naturale.; Le finestre sulla torre centrale sono disposte in modo disordinato con piccoli blocchi sparsi a macchia.
Advice: Sostituisci il rosso acceso in cima alla torre con una pavimentazione in pietra o legno, coerente con lo stile della fortezza.; Riorganizza le finestre lungo assi verticali puliti e usa una sfumatura scura costante per i vani.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, w muro del mastio, c cortile, W muro di cinta, t torre, G porta fortificata, n lastricato, r strada, x fossato, Q pozzo, f assi del pavimento, F solaio, k gradini, m intonaco, L vetro, O porta, o assi della porta, N stipite, M merlo, R tetto
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEExxxxxxxxEEEEEEEEExxxxxxxxxxxxxxxEEEEEEEE
EEEEEEEEEExxxxxxxxEEEEEEEEExxxxxxxxxxxxxxxEEEEEEEE
EEEEEtttttxxxxxxxxEEEEEEEEExxxxxxxxxxxxxxxtttttEEE
EEEEEtttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttEEE
EEEEEtttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttEEE
EEEEEtttttccccccccRRRRRRRRRccccccccccccccctttttEEE
EEEEEMtttMccccccccRRRRRRRRRcccccccccccccccttttEEEE
EEEEEEEWccccccccccRRRRRRRRRccccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE
EEEEEEEWRRRRcccccccccccccccccccccccccccccccWWEEEEE
EEEEEEEWRRRRccccccwwcwcwwwcwcwwcwwMccccccccWWEEEEE
EEEEEEEWRRRRcccccwwwwwwwwwwwwwwwwwwccccccccWWEEEEE
EEEEEEEWRRRRcccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWRRRRcccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWRRRRcccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWRRRRcccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWRRRRcccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE
EEEEEEEWcccccccccwwwwwwwwwwwwwwwwwwcccQQcccWWEEEEE
EEEEEEEWcccccccccwwwwwwwwwwwwwwwwwMccccQcccWWEEEEE
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE
EEEEEMtttMcccccccccccccnnnnncccccccccccccctMtEEEEE
EEEEEtttttcccccccccccccnnnnncccccccccccccctttttEEE
EEEEEtttttWWWWWWWWWWWWWMGGGGMWWWWWWWWWWWWWtttttEEE
EEEEEtttttWWWWWWWWWWWWWMGGGGMWWWWWWWWWWWWWtttttEEE
EEEEEtttttEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000ddddd0000000000000000000000000000000dddbdd000
00000dbbbd0000000000000000000000000000000dbbbbd000
00000dbbbd7777777777777777777777777777777dbbbbd000
00000bbbbb7777777777777777777777777777777dbbbbd000
00000dbbbd0000000055555555500000000000000dbbbbd000
00000ddddd0000000055555555500000000000000dddddd000
00000077700000000055555555500000000000000007700000
00000077700000000055555555500000000000000007700000
00000077700000000000000000000000000000000007700000
00000077700000000000000000000000000000000007700000
00000077755500000000000000000000000000000007700000
00000077755500000000000000000000000000000007700000
0000007775550000mmmmmlmmmmmlmmmmmmm000000007700000
0000007775550000mlllllllllllllllllm000000007700000
0000007775550000llljjjjjjjjjjjjjjll000000007700000
0000007775550000mlljjjjjjjjjjjjjjlm000000007700000
0000007775550000mlljjjjjjjjjjjjjjlm000000007700000
0000007775550000mlljjjjjjjjjjjjjjlm000000007700000
0000007775550000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
0000007770000000llljjjjjjjjjjjjjjll000000007700000
0000007770000000mlllllllllllllllllm000220007700000
0000007770000000mmmmmlmmmmmlmmmmmmm000220007700000
00000077700000000000000000000000000000000007700000
00000077700000000000000000000000000000000007700000
00000077700000000000000000000000000000000007700000
00000077700000000000000000000000000000000007700000
00000077700000000000000000000000000000000007700000
00000077700000000000000000000000000000000007700000
00000ddddd0000000000000000000000000000000dddbdd000
00000dbbbd0000000000000000000000000000000dbbbbd000
00000bbbbb7777777777777dddddd777777777777dbbbbd000
00000dbbbd7777777777777dddddd777777777777dbbbbd000
00000dbbbd0000000000000000000000000000000dbbbbd000
00000ddddd0000000000000000000000000000000dddddd000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.................M..M.M...M.M..M..M...............
.................M.MM.MM.MM.MM.M.MM...............
.................mmmmmmmmmmmmmmmmmm...............
.................mmmmmmmmmmmmmmmmmm...............
.................mmmmmmmmmmmmmmmmmm...............
.................mmmmmmmmmmmmmmmmmm...............
.................mmmmmmmmmmmmmmmmmm...............
.................mmmmmmmmmmmmmmmmmm...............
.................mmmmmmmmmmmmmmmmmm...............
.................mmLLmLmmmmmmmmmmmm...............
.................mmLLLLMmmmMmmmmmmm...............
.....MMMMM.......mmLmLLMMMmMmmmmmmm.......MMMMM...
.....MMMMM.......mmmmmmGGGGGmmmmmmm.......MMMMM...
.....ttttt.......mmmmmmGGGGGmmmmmmm.......ttttt...
.....ttttt.......mmmmmmGGGGGmmmmmmm.......ttttt...
.....ttttt.......mmmmmmGGGGGmmmmmmm.......ttttt...
.....ttttt.......mmmmmmNooooOmmmmmm.......ttttt...
.....ttttt.......mmmmmmNooooOmmmmmm.......ttttt...
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWrooooEWWWWWWWWWWWWWttttt...
```
Right side (looking from the right):
```
...................M.M..M.....M..M.M..............
..................MM.MM.M.MMM.M.MM.MM.............
..................mmmmmmmmmmmmmmmmmmm.............
..................mmmmmmmmmmmmmmmmmmm.............
..................mmmmmmmmmmmmmmmmmmm.............
..................mmmmmmmmmmmmmmmmmmm.............
..................mmmmmmmmmmmmmmmmmmm.............
..................mmmmmmmmmmmmmmmmmmm.............
..................mmmmmmmmmmmmmmmmmmm.............
..................mmmmmmmLLmmmmmmLLmm.............
..................mmLLLmmLLmmmmmmLLmm........MM...
.......MMMMM......mmLLLmmLLmmmmmmLLmm......MMMMM..
.......MMMMM......mmmLLmmLLmmmmmmmmmm......MMMMM..
.......ttttt......mmmmmmmmmmmmmmmmmmm......ttttt..
.......ttttt......mmmmmmmmmmmmmmmmmmm......ttttt..
.......ttttt......mmmmmmmmmmmmmmmmmmm......ttttt..
.......ttttt......mmmmmmmmmmmmmmmmmmm......ttttt..
.......ttttt......mmmmmmmmmmmmmmmmmmm......ttttt..
.......tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
.......tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
.......tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
.......tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
.......tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
.......tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
.......tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
......EtttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttE.
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
.....ttttt................................ttttt...
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt...
.....ttttt........RRRRRRRRR...............ttttt...
.....ttttt........RRRRRRRRR...............tttt....
.......W..........RRRRRRRRR................WW.....
.......W...................................WW.....
.......W...................................WW.....
.......W...................................WW.....
.......WW..................................WW.....
.......WRRRR...............................WW.....
.......WRRRR.....mmLLmmmLLmLLmmLLLm........WW.....
.......WRRRR.....mmLLmmmLLmLLmmLLmm........WW.....
.......WRRRR.....L.....kkkk......LL........WW.....
.......WRRRR.....m.....kkkk......LL........WW.....
.......WRRRR.....m.....kkkk......mm........WW.....
.......WRRRR.....m...............mm........WW.....
.......WRRRR.....L...............mm........WW.....
.......W.........L...............LL........WW.....
.......W.........L...............LL........WW.....
.......W.........L...............mm........WW.....
.......W.........m...............mm........WW.....
.......W.........m...............mm........WW.....
.......W.........m...............mm........WW.....
.......W.........m...............mm........WW.....
.......W.........L...............mm........WW.....
.......W.........L...............mm........WW.....
.......W.........m...............mm........WW.....
.......W.........mLLmmmoooooNmmmmmm........WW.....
.......W.........mLLmmmoooooNmmmmmm........WW.....
.......W...................................WW.....
.......W...................................WW.....
.......W...................................WW.....
.......W...................................WW.....
.......W...................................WW.....
.......W...................................WW.....
.....ttttt................................tttt....
.....ttttt................................ttttt...
.....tttttWWWWWWWWWWWWWoooooNWWWWWWWWWWWWWttttt...
.....tttttWWWWWWWWWWWWWoooooNWWWWWWWWWWWWWttttt...
.....ttttt................................ttttt...
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
.................mLLmmLLmLLLLLmLLmm...............
.................mLLmmLLmLLLLLmLLmm...............
.................m...............LL...............
.................m...............LL...............
.................m...............LL...............
.................m...............mm...............
.................L...............mm...............
.................L...............mm...............
.................m...............Lm...............
.................m...............mm...............
.................m...............mm...............
.................m...............mm...............
.................L...............mm...............
.................L...............mm...............
.................L...............mm...............
.................L...............LL...............
.................m...............LL...............
.................mmLLLLmmmmmmmmmmmm...............
.................mmLLLLmmmmmmmmmmmm...............
..................................................
..................................................
..................................................
..................................................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEEEEEE   00000ddddd0000000000000000000000000000000dddddd000
EEEEEtttttxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxtttttEEE   00000dbbbd0000000000000000000000000000000dbbbbd000
EEEEEtttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttEEE   00000dbbbd7777777777777777777777777777777dbbbbd000
EEEEEtttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttEEE   00000dbbbb7777777777777777777777777777777dbbbbd000
EEEEEtttttcccccccccccccccccccccccccccccccctttttEEE   00000dbbbd0000000000000000000000000000000dbbbbd000
EEEEEMtttMccccccccccccccccccccccccccccccccttttEEEE   00000ddddd0000000000000000000000000000000dddddd000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWccccccccccwwcwcwwwcwcwwcwwMccccQcccWWEEEEE   0000007770000000mmmmmlmmmmmlmmmmmmm000220007700000
EEEEEEEWcccccccccwwwwwwwwwwwwwwwwwwcccQQcccWWEEEEE   0000007770000000mlllllllllllllllllm000220007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000llljjjjjjjjjjjjjjll000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000llljjjjjjjjjjjjjjll000005557700000
EEEEEEEWRRRRcccccwwwwwwwwwwwwwwwwwwccccccccWWEEEEE   0000007775550000mlllllllllllllllllm000000007700000
EEEEEEEWRRRRcccccwwwwwwwwwwwwwwwwwMccccccccWWEEEEE   0000007775550000mmmmmlmmmmmlmmmmmmm000000007700000
EEEEEEEWRRRRcccccccccccnnnnncccccccccccccccWWEEEEE   00000077755500000000000000000000000000000007700000
EEEEEEEWRRRRcccccccccccnnnnncccccccccccccccWWEEEEE   00000077755500000000000000000000000000000007700000
EEEEEEEWRRRRcccccccccccnnnnncccccccccccccccWWEEEEE   00000077755500000000000000000000000000000007700000
EEEEEEEWRRRRcccccccccccnnnnncccccccccccccccWWEEEEE   00000077755500000000000000000000000000000007700000
EEEEEEEWRRRRcccccccccccnnnnncccccccccccccccWWEEEEE   00000077755500000000000000000000000000000007700000
EEEEEEEWRRRRcccccccccccnnnnncccccccccccccccWWEEEEE   00000077755500000000000000000000000000000007700000
EEEEEMtttMcccccccccccccnnnnnccccccccccccccctttEEEE   00000ddddd5500000000000000000000000000000dddddd000
EEEEEtttttcccccccccccccnnnnncccccccccccccctttttEEE   00000dbbbd0000000000000000000000000000000dbbbbd000
EEEEEtttttWWWWWWWWWWWWWMGGGGMWWWWWWWWWWWWWtttttEEE   00000dbbbb7777777777777ddcddd777777777777dbbbbb000
EEEEEtttttWWWWWWWWWWWWWMGGGGMWWWWWWWWWWWWWtttttEEE   00000dbbbd7777777777777dddddd777777777777dbbbbd000
EEEEEtttttEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttEEE   00000dbbbd0000000000000000000000000000000dbbbbd000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000ddddd0000000000000000000000000000000dddbdd000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEExxxxxxxxEEEEEEEEExxxxxxxxxxxxxxxEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEExxxxxxxxEEEEEEEEExxxxxxxxxxxxxxxEEEEEEEE   00000ddddd0000000000000000000000000000000dddddd000
EEEEEtttttxxxxxxxxEEEEEEEEExxxxxxxxxxxxxxxtttttEEE   00000dbbbd0000000000000000000000000000000dbbbbd000
EEEEEtttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttEEE   00000dbbbd7777777777777777777777777777777dbbbbd000
EEEEEtttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttEEE   00000bbbbb7777777777777777777777777777777dbbbbb000
EEEEEtttttccccccccRRRRRRRRRccccccccccccccctttttEEE   00000dbbbd0000000055555555500000000000000dbbbbd000
EEEEEMtttMccccccccRRRRRRRRRcccccccccccccccttttEEEE   00000ddddd0000000055555555500000000000000dddbdd000
EEEEEEEWccccccccccRRRRRRRRRccccccccccccccccWWEEEEE   00000077700000000055555555500000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000055555555500000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccccccccccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWccccccccccwwcwcwwwcwcwwcwwMcccccRRRWWEEEEE   0000007770000000mmmmmlmmmmmlmmmmmmm000005557700000
EEEEEEEWcccccccccwwwwwwwwwwwwwwwwwwcccccRRRWWEEEEE   0000007770000000mlllllllllllllllllm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000llljjjjjjjjjjjjjjll000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770022200mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWccccQccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770022200mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770022200mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwcccccRRRWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000005557700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000mlljjjjjjjjjjjjjjlm000000007700000
EEEEEEEWcccccccccwRRRRRRRRRRRRRRRwwccccccccWWEEEEE   0000007770000000llljjjjjjjjjjjjjjll000000007700000
EEEEEEEWcccccccccwwwwwwwwwwwwwwwwwwccccccccWWEEEEE   0000007770000000mlllllllllllllllllm000000007700000
EEEEEEEWcccccccccwwwwwwwwwwwwwwwwwMccccccccWWEEEEE   0000007770000000mmmmmlmmmmmlmmmmmmm000000007700000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEEEWcccccccccccccccnnnnncccccccccccccccWWEEEEE   00000077700000000000000000000000000000000007700000
EEEEEMtttMcccccccccccccnnnnncccccccccccccctMtEEEEE   00000ddddd0000000000000000000000000000000dddbdd000
EEEEEtttttcccccccccccccnnnnncccccccccccccctttttEEE   00000dbbbd0000000000000000000000000000000dbbbbd000
EEEEEtttttWWWWWWWWWWWWWMGGGGMWWWWWWWWWWWWWtttttEEE   00000dbbbb7777777777777ddcddd777777777777bbbbbb000
EEEEEtttttWWWWWWWWWWWWWMGGGGMWWWWWWWWWWWWWtttttEEE   00000dbbbd7777777777777dddddd777777777777dbbbbd000
EEEEEtttttEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEtttttEEE   00000dbbbd0000000000000000000000000000000dbbbbd000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000ddddd0000000000000000000000000000000dddbdd000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.07 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 133 nodi, 597 passi, finito in 614 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=terra (marcatore), h=pavimento del mastio, w=muro del mastio, d=porta del mastio, c=cortile, W=muro di cinta, t=torre, G=porta fortificata, n=lastricato, r=strada, a=alloggio, x=fossato, Q=pozzo, s=zona della scala (marcatore), f=assi del pavimento, F=solaio, T=traccia della scala (marcatore), k=gradini, m=intonaco, Y=fascia, L=vetro, O=porta, o=assi della porta, N=stipite, M=merlo, R=tetto, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: m 60111, W 43560, t 36000, R 12025, E 7925, L 7264, c 7000, o 4260, k 2720, f 2025, M 1968, F 1865, w 1000, G 750, x 700, N 690, n 375, O 240, Q 225, r 150.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-30 all×18, one×7: 647 celle x3-27 y3-29 z0, passi 2-47
   #34 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 48
    #36 all . w → w m passi=6: ×6, 11100 celle x50-104 y55-109 z0-6, passi 49-54, w→m 5550, .→w 5550
    #37 all . w → w Y passi=14: ×14, 25900 celle x50-104 y55-109 z6-20, passi 55-68, w→Y 12950, .→w 12950
    #38 all . w → w m passi=18: ×18, 33300 celle x50-104 y55-109 z20-38, passi 69-86, w→m 16650, .→w 16650
    #39 all . w → w Y passi=14: ×14, 25900 celle x50-104 y55-109 z38-52, passi 87-100, w→Y 12950, .→w 12950
    #40 all . w → w m passi=18: ×18, 33300 celle x50-104 y55-109 z52-70, passi 101-118, w→m 16650, .→w 16650
#41-43 all×2, prl×1: 10575 celle x70-84 y105-109 z0-70, passi 119-189
    #44 all . W → W W passi=23: ×23, 41975 celle x20-134 y25-139 z1-23, passi 190-212, .→W 41975
    #45 all . t → t t passi=39: ×39, 35100 celle x15-139 y20-144 z1-39, passi 213-251, .→t 35100
#46-48 all×3: 12575 celle x25-84 y30-139 z0-40, passi 252-310
#49-58 prl×1, all×3: 14650 celle x25-119 y30-109 z0-19, passi 311-321
    #59 all . h → h . passi=31: ×31, 113150 celle x55-99 y60-104 z1-32, passi 322-352, h→. 56575, .→h 56575
#60-61 all×2: 16050 celle x55-99 y60-104 z2-33, passi 353-383
    #62 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-64, passi 384-414, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#63-65 prl×1, one×1, all×1: 9289 celle x50-104 y55-109 z6-64, passi 415-452
    #66 prl Y → m: ×1, 18636 celle x50-104 y55-109 z6-51, passi 453, Y→m 18636
#72-101 all×8, prl×2: 10510 celle x15-139 y20-144 z0-76, passi 454-498
#102-132 all×10, prl×4: 17590 celle x65-84 y60-139 z0-32, passi 499-597
Senza effetto (non hanno mai cambiato una cella):
#7 prl E/h → h/* passi=1
#31 all xE/*x → *x/**: le celle cercate c'erano, ma mai disposte come nel pattern
#32 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***q***/*******/*******… passi=3: le celle cercate c'erano, ma mai disposte come nel pattern
#51 all . e → e E passi=1: in quel momento nella griglia non c'erano celle "e"
#52 all . e → e . passi=9: in quel momento nella griglia non c'erano celle "e"
#53 all . e → e q passi=6: in quel momento nella griglia non c'erano celle "e"
#54 all . g → g g passi=10: in quel momento nella griglia non c'erano celle "g"
#55 all . g → g q passi=6: in quel momento nella griglia non c'erano celle "g"
#56 prl e → q (+1): in quel momento nella griglia non c'erano celle "e", "g"
#68 all S#93 → *S passi=14: in quel momento nella griglia non c'erano celle "S", ""
#69 all S/#93 → */S passi=14: in quel momento nella griglia non c'erano celle "S", ""
#70 all . S → S * passi=29: in quel momento nella griglia non c'erano celle "S"
… e altri 36
Improve it: answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdcWtGnraxQqs" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="h/E" out="*/d" symmetry="()" steps="1"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all steps="1"><rule in="wE" out="*c"/><rule in="dE" out="*c"/></all>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <one in="EE/EW" out="**/*t" steps="2"/>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.7"/></one>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.5"/></one>
      <all steps="1"><rule in="t[EWc]" out="*t"/><rule in="t*/*[EWc]" out="**/*t"/></all>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <one in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" steps="1"/>
      <one steps="1"><rule in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" p="0.6"/></one>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cWEEEEE" out="**xx***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***q***/*******/*******/*******" steps="3"/>
    </sequence>
    <map scale="5 5 1" values="BEfFhsTkmYLwWdOoNGtMURcnraxQqgePp" symmetry="()">
      <union symbol="+" values="wWmYtG"/>
      <union symbol="=" values="fF"/>
      <union symbol="%" values="W"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="q" out="eeeee/eggge/eggge/eggge/eeeee"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w m" steps="6"/>
        <all in="B w" out="w Y" steps="14"/>
        <all in="B w" out="w m" steps="18"/>
        <all in="B w" out="w Y" steps="14"/>
        <all in="B w" out="w m" steps="18"/>
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d m" steps="69"/>
        <prl in="d" out="w"/>
        <all in="B W" out="W W" steps="23"/>
        <all in="B t" out="t t" steps="39"/>
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G G" steps="39"/>
        <all in="B a" out="a a" steps="19"/>
        <prl in="a" out="R"/>
        <all in="B Q" out="Q Q" steps="8"/>
        <all in="B e" out="e E" steps="1"/>
        <all in="B e" out="e B" steps="9"/>
        <all in="B e" out="e q" steps="6"/>
        <all in="B g" out="g g" steps="10"/>
        <all in="B g" out="g q" steps="6"/>
        <prl><rule in="e" out="q"/><rule in="g" out="q"/></prl>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="P"/><rule in="s" out="P"/></prl>
        <one steps="20"><rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="m"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="7FA35A" name="terra" hidden="True"/>
  <color symbol="H" value="D8C08A" name="centro del mastio" area="keep"/>
  <color symbol="h" value="C9B28A" name="pavimento del mastio" area="keep"/>
  <color symbol="f" value="9C7B52" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7D7468" name="solaio"/>
  <color symbol="P" value="A8A294" name="lastre del terrazzo"/>
  <color symbol="m" value="D9CCAE" name="intonaco"/>
  <color symbol="Y" value="B9AC8C" name="fascia"/>
  <color symbol="L" value="2F4A66" name="vetro"/>
  <color symbol="w" value="8E8A82" name="muro del mastio"/>
  <color symbol="d" value="5B3A29" name="porta del mastio"/>
  <color symbol="c" value="9FB36B" name="cortile" area="courtyard"/>
  <color symbol="W" value="6F6B66" name="muro di cinta"/>
  <color symbol="t" value="5A5650" name="torre" area="tower"/>
  <color symbol="G" value="3F3C3A" name="porta fortificata"/>
  <color symbol="n" value="C2A878" name="lastricato"/>
  <color symbol="r" value="B08D57" name="strada"/>
  <color symbol="a" value="C79A55" name="alloggio" area="barracks"/>
  <color symbol="R" value="B5483A" name="tetto"/>
  <color symbol="x" value="4A90B8" name="fossato"/>
  <color symbol="Q" value="3B6E8F" name="pozzo" area="well"/>
  <color symbol="q" value="3E7D3A" name="chioma" area="orchard"/>
  <color symbol="g" value="6B4A2B" name="tronco"/>
  <color symbol="e" value="3E7D3A" name="chioma" hidden="True"/>
  <color symbol="s" value="D96B2B" name="zona della scala" hidden="True"/>
  <color symbol="T" value="D96B2B" name="traccia della scala" hidden="True"/>
  <color symbol="k" value="8A5A32" name="gradini"/>
  <color symbol="M" value="A39E94" name="merlo"/>
  <color symbol="U" value="1E1E1E" name="feritoia"/>
  <color symbol="O" value="5B3A29" name="porta"/>
  <color symbol="o" value="3A2418" name="assi della porta"/>
  <color symbol="N" value="2E2A28" name="stipite"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
