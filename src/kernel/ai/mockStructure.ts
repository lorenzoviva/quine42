// The structure the Sculptor answers with offline (T354, ADR-0183): a country house written by hand as the Sculptor writes one from the
// prompt without a skeleton — the composition of the concept on a plan at a fifth of the scale (a cell is a quarter of a tile), the
// `map` back to the box so that one program serves every size, the columns that rise by steps, the parts one lives in included
// from the seed (`part-stair`, `part-door`). It passes the kernel's checks at Large, Huge and Gargantuan (`tests/sculptor-structures.test.ts`)
// and the bench of the sizes measures it beside the fort of the bench (`lab/scripts/banco-taglie.ts`). Here, not in the prompt: a program
// in the prompt is copied (T337).

export const MOCK_STRUCTURE_PROGRAM = `<!--
Country house (villetta): a body of two storeys under a hip roof, a one-storey wing on one side with its own roof, a porch along the front
on posts, a garden with a hedge where the ground goes on, trees and a well where more ground is left. The seeds change the depth of the
body, the side and the place of the wing, the posts, the trees.
Plan letters (a cell is 5 voxels): H the centre, h the floor of the body, w its walls, s the zone of the stair, d the door, m the way to it,
a the floor of the wing, v its walls, p the porch, q the road on the porch, r the road, g the garden, b a post, x the hedge, t a tree, Q the well.
Not S nor #90-#97: they belong to the parts.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdmavpqrgbxtQ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. The body: a line through the centre, 3 behind, 5 in front and one more by chance (one cell decides: the front end of the line); then 4 to each side of every cell of the line; its walls, the corners filled. -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- The door: from the centre straight to the front wall, three cells wide; the way back to floor. -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- The zone of the stair: along the back wall, two cells from the left wall (the landing: a body walks onto the first step in line), four cells along x and two wide (20 × 10 voxels: the stair takes 16). -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- The wing: a one-storey body against a side wall, 3 cells out and 5 deep, from a cell of that side chosen at random. -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- The porch: two cells in front of the front wall; the road from the door through it and straight to the edge; posts at its corners and three more. -->
      <all in="[wdp]/E" out="*/p" symmetry="()" steps="2"/>
      <all in="[dq]/p" out="*/q" symmetry="()"/>
      <all in="[qr]/E" out="*/r" symmetry="()"/>
      <all in="Ep/Ep" out="**/*b" symmetry="(x)"/>
      <one in="w/p/p" out="*/*/b" symmetry="()" steps="3"/>
      <!-- The garden: two cells around what is built; the hedge where the ground goes on past it (the road is its gate). -->
      <all in="[wvpb]E" out="*g" steps="1"/>
      <all in="gE" out="*g" steps="1"/>
      <all in="gE" out="*x"/>
      <!-- Beyond the hedge: a well where 11 × 11 of lawn are free, trees where 7 × 7 are. -->
      <one in="EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE" out="***********/***********/***********/***********/***********/*****Q*****/***********/***********/***********/***********/***********" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <!-- B. To the voxels: every cell five by five. -->
    <map scale="5 5 1" values="BEhwsavpqrgbGYQAfWUFRLOoNkT#90#91#92KJyCP#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="b" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="x" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="BBBBB/BYYYB/BYYYB/BYYYB/BBBBB"/>
      <rule in="Q" out="BQQQB/QQAQQ/QAAAQ/QQAQQ/BQQQB"/>
      <!-- C. The detail at full scale. -->
      <sequence symmetry="(xy)">
        <union symbol="+" values="WU"/>
        <union symbol="=" values="F"/>
        <!-- 1. The walls rise and leave plaster, a band for the windows, plaster: the body two storeys of 32, the wing one; the roof letter on top. -->
        <all steps="6"><rule in="B w" out="w W"/><rule in="B v" out="v W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B v" out="v U"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B v" out="v W"/></all>
        <prl in="v" out="R"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- The floors rise too: the planks at the bottom, the strip of the stair in the air above its zone, the slab at 32, the ceiling at 64 (the wing's at 32). -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B a" out="a f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- 2. The doors: where the road meets the foot of the front wall, the seed O through the wall; between the wing and the body, a seed through the shared wall, 11 wide. part-door raises them. -->
        <all in="W/q" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <one in="fWWWWWf" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>
        <import file="part-door"/>
        <!-- 3. The stair: part-stair climbs the strip and opens the slab. -->
        <import file="part-stair"/>
        <!-- 4. Windows in the band: 6 wide and 8 tall, through the wall; the rest of the band is plaster. -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- 5. The roofs: the eaves one voxel out, then one layer more over every cell that has two of roof on every side (a slope of one in two); a chimney. -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
        <!-- 6. The porch: posts 34 tall, a roof of boards over the porch at 34 (a marker rises from its floor). -->
        <all in="B [pq]" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B b" out="b *" steps="33"/>
        <!-- 7. The hedge, the trees (a trunk and a round crown), the rim of the well. -->
        <all in="B G" out="G *" steps="7"/>
        <all in="B Y" out="Y *" steps="11"/>
        <all in="B Y" out="C *" steps="1"/>
        <all in="CB" out="*C" steps="2" symmetry="(xyz)"/>
        <all in="B Q" out="Q *" steps="4"/>
        <!-- 8. Cleaning: the roads are gravel; the ground stays, hidden, with its areas. -->
        <prl><rule in="r" out="P"/><rule in="q" out="P"/></prl>
      </sequence>
    </map>
  </map>
  <color symbol="f" value="8e6a44" name="assito" area="house"/><color symbol="W" value="e8dcc0" name="intonaco"/><color symbol="F" value="7a5634" name="solaio"/>
  <color symbol="R" value="a5482e" name="coppi"/><color symbol="L" value="86b8c8" alpha="0.5" name="vetro"/><color symbol="K" value="8e8578" name="comignolo"/>
  <color symbol="O" value="7a4a26" name="porta"/><color symbol="o" value="5e3a1e" name="asse scura"/><color symbol="N" value="6b4a2e" name="telaio"/><color symbol="k" value="9a7048" name="scala"/>
  <color symbol="p" value="a89c86" name="pietra del portico" area="porch"/><color symbol="b" value="7a5634" name="pali"/><color symbol="J" value="8a6a3a" name="tetto del portico"/>
  <color symbol="P" value="c2ad84" name="ghiaia"/><color symbol="G" value="3f6f2f" name="siepe"/><color symbol="Y" value="6b4a2e" name="tronco"/><color symbol="C" value="4e7f34" name="chioma"/>
  <color symbol="Q" value="8a8274" name="pozzo"/><color symbol="A" value="3a78c8" name="acqua"/>
  <color symbol="g" hidden="True" name="giardino" area="garden"/><color symbol="E" hidden="True" name="prato"/>
  <color symbol="H" hidden="True"/><color symbol="h" hidden="True"/><color symbol="w" hidden="True"/><color symbol="s" hidden="True"/><color symbol="d" hidden="True"/><color symbol="m" hidden="True"/><color symbol="a" hidden="True"/><color symbol="v" hidden="True"/><color symbol="q" hidden="True"/><color symbol="r" hidden="True"/><color symbol="x" hidden="True"/><color symbol="t" hidden="True"/><color symbol="U" hidden="True"/><color symbol="y" hidden="True"/><color symbol="T" hidden="True"/><color symbol="#90" hidden="True"/><color symbol="#91" hidden="True"/><color symbol="#92" hidden="True"/><color symbol="#20" hidden="True"/><color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
`;
