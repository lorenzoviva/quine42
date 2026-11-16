# model.sculpt · claude-opus-5-5 · 40 s · 1 immagini

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 500 × 500 × 160, 25 × 25 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

Your program:
<!--
  FORTE: le parti e dove stanno
  - h il mastio intorno al centro H; w i suoi muri; s la zona della scala; d la porta del mastio sul fronte.
  - c il cortile intorno al mastio; cresce dove la terra prosegue.
  - W la cinta di 2 celle intorno al cortile; t le torri agli angoli e torri mezzane a caso.
  - n il selciato dalla porta del mastio a G, il corpo di guardia nella cinta; r la strada fino al bordo.
  - Q il pozzo in 5 x 5 di cortile libero.
  - p il fossato e P la palizzata oltre la cinta, solo dove la terra prosegue.
  - u gli alberi del bosco intorno, solo dove resta molta terra libera (gargantuesca).
  I semi cambiano: la profondita' del mastio, le torri mezzane, il pozzo, gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtGrdnQamepPu" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <one steps="1" symmetry="()"><rule in="E/h" out="h/*"/><rule in="E/h" out="e/*"/></one>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <prl in="e" out="E"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="WWWWW/WWWWW/EEEEE" out="ttttt/ttttt/ttttt" steps="2"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="[Wt]EEEEEEEE" out="*p*******" steps="1"/>
      <all in="pE/*p" out="*p/**"/>
      <all in="[Wt]E/*p" out="*p/**"/>
      <all in="pE/*p" out="*p/**"/>
      <all in="pE" out="*p" steps="1"/>
      <all in="pE/*p" out="*p/**"/>
      <all in="pE" out="*P" steps="1"/>
      <all in="PE/*P" out="*P/**"/>
      <one in="EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE" out="*********/*********/*********/*********/****u****/*********/*********/*********/*********"/>
    </sequence>
    <map scale="5 5 1" values="BEhwscCZGDOgnrqafFWVLRTkMNoUxyXPYK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="t" out="ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>
      <rule in="p" out="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX"/>
      <rule in="P" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="u" out="EEEEE/EYYYE/EYYYE/EYYYE/EEEEE"/>
      <sequence symmetry="(xy)">
        <prl in="B G" out="g O"/>
        <prl in="B D" out="w O"/>
        <all in="B g" out="g g" steps="34"/>
        <all in="B C" out="C C" steps="23"/>
        <all in="B Z" out="Z Z" steps="40"/>
        <all in="B q" out="q q" steps="5"/>
        <all in="B P" out="P P" steps="12"/>
        <all in="B Y" out="Y Y" steps="12"/>
        <all in="B Y" out="K *" steps="1"/>
        <all in="KB" out="*K" steps="3"/>
        <all in="B K" out="K K" steps="8"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w W" steps="13"/>
        <prl in="w" out="W"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <one steps="24"><rule in="BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="W"/>
        <union symbol="+" values="WCZg"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="CZg"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" rgb="#ff00ff" name="centro"/>
  <color symbol="m" rgb="#ff8800" name="segno della via"/>
  <color symbol="e" rgb="#ff8800" name="segno"/>
  <color symbol="t" rgb="#6f6c66" name="torre" area="tower"/>
  <color symbol="W" rgb="#d8cfb8" name="muro del mastio"/>
  <color symbol="w" rgb="#d8cfb8" name="muro del mastio"/>
  <color symbol="h" rgb="#c9b48a" name="sala del mastio" area="keep"/>
  <color symbol="s" rgb="#a0764a" name="scala"/>
  <color symbol="G" rgb="#7a5c44" name="corpo di guardia"/>
  <color symbol="d" rgb="#5a3b26" name="porta"/>
  <color symbol="Q" rgb="#4a7fa8" name="pozzo"/>
  <color symbol="p" rgb="#4f7f9f" name="fossato"/>
  <color symbol="P" rgb="#6b4a2c" name="palizzata"/>
  <color symbol="u" rgb="#5f8a3c" name="albero" area="garden"/>
  <color symbol="Y" rgb="#5a3d24" name="tronco"/>
  <color symbol="K" rgb="#6f9a48" name="chioma" area="garden"/>
  <color symbol="c" hidden="True" name="cortile" area="courtyard"/>
  <color symbol="C" rgb="#a7a396" name="cinta di pietra"/>
  <color symbol="Z" rgb="#77736b" name="pietra delle torri" area="tower"/>
  <color symbol="g" rgb="#8f8676" name="corpo di guardia"/>
  <color symbol="D" rgb="#5a3b26" name="porta"/>
  <color symbol="n" rgb="#9c8f7a" name="selciato"/>
  <color symbol="r" rgb="#b89b6a" name="strada"/>
  <color symbol="q" rgb="#8c8c84" name="pozzo di pietra"/>
  <color symbol="a" rgb="#5b8fb0" name="acqua"/>
  <color symbol="X" rgb="#41769a" name="acqua del fossato"/>
  <color symbol="f" rgb="#a0764a" name="pavimento di assi" area="keep"/>
  <color symbol="F" rgb="#b5a58a" name="solaio di lastre"/>
  <color symbol="V" rgb="#d8cfb8" name="muro del mastio"/>
  <color symbol="L" rgb="#3d5a73" name="finestra"/>
  <color symbol="R" rgb="#a5402e" name="tetto"/>
  <color symbol="T" rgb="#a0764a" name="scala"/>
  <color symbol="k" rgb="#8a6440" name="gradini"/>
  <color symbol="M" rgb="#bdb5a2" name="merli"/>
  <color symbol="U" rgb="#2a2a2a" name="feritoia"/>
  <color symbol="N" rgb="#4a3020" name="cornice della porta"/>
  <color symbol="O" rgb="#7a4a2a" name="porta"/>
  <color symbol="o" rgb="#3e2716" name="assi della porta"/>
  <color symbol="x" hidden="True" name="porta aperta"/>
  <color symbol="y" hidden="True" name="porta aperta"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="x"/><rule in="o" out="y"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="x" out="O"/><rule in="y" out="o"/></all></action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: Toni di azzurro e magenta troppo saturi rispetto alla palette del mondo.; Scarsa integrazione visiva tra il portale d'ingresso e le mura esterne.
Advice: Sostituire l'azzurro e il magenta con toni di pietra smorzati e ocra.; Rendere la porta principale più definita con toni di legno scuro e dettagli in rilievo.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, c cortile, W muro del mastio, r strada, n selciato, a acqua, P palizzata, C cinta di pietra, Z pietra delle torri, O porta, g corpo di guardia, q pozzo di pietra, f pavimento di assi, F solaio di lastre, L finestra, k gradini, M merli, N cornice della porta, o assi della porta, U feritoia, X acqua del fossato
Plan (the letter on top of every column):
```
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ
EEZZZZZZZMCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ
PPZZZZZZcccccccccccccccccccccccccccccccccccZZZZZZZ
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX
XXXXXCCCcccccccccWWWWWWWWWWWWWWWWWMccccccccCCCCXXX
XXXXXCCCcccccccccWWWWWWWWWWWWWWWWWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX
XXXMZZZZcccccccccWWWWWWWWWWWWWWWWWWccccccccMZZZZXX
XXXZZZZZcccccccccWWWWWWWWWWWWWWWWWMccccccccZZZZZXX
XXXZZZZZcccccccccccccccnnnnncccccccccccccccZZZZZXX
XXXXZZZZcccccccccccccccnnnnnccccccccccccccccZZZZXX
XXXZZZZZcccccccccccccccnnnnncccccccccccccccZZZZZXX
XXXZZZZZcccccccccccccccnnnnnccccaccccccccccZZZZZXX
XXXXZZZZcccccccccccccccnnnnnccccacccccccccccZZZZXX
XXXZZZZZcccccccccccccccnnnnncccccccccccccccZZZZZXX
PPZZZZZZcccccccccccccccnnnnnccccccccccccccccZZZZZZ
PPZZZZZZcccccccccccccccnnnnncccccccccccccccZZZZZZZ
EEZZZZZZZMCCCCCCCCCCCCCMggggMCCCCCCCCCCCCCZZZZZZZZ
EEZZZZZZZZCCCCCCCCCCCCCgggggNCCCCCCCCCCCCCZZZZZZZZ
EEZZZZZZZZCCCCCCCCCCCCCgggggNCCCCCCCCCCCCCZZZZZZZZ
EEZZZZZZZZXXXXXXXXXXXXXXXrrXXXXXXXXXXXXXXXZZZZZZZZ
EEZZZZZZZZXXXXXXXXXXXXXXXrrXXXXXXXXXXXXXXXZZZZZZZZ
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
0dcccccccd0000000000000000000000000000000dcccccccc
0dcccccccd0000000000000000000000000000000dcccccccc
0dcccccccd0000000000000000000000000000000dcccccccc
0ccccccccd7777777777777777777777777777777dcccccccc
0dcccccccc7777777777777777777777777777777ccccccccc
0dcccccccd7777777777777777777777777777777dcccccccc
3dcccccccd7777777777777777777777777777777ddccccccc
3dccccccd0000000000000000000000000000000000dcccccc
3dddddddd0000000000000000000000000000000000ddcdddd
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
0000077770000000llllljllllljlllllll000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000jjjjjjjjjjjjjjjjjjj000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
0000077770000000jjjjjjjjjjjjjjjjjjj000000007777000
000ddcddd0000000ljjjjjjlllllljjjjjl00000000dddddd0
000dccccd0000000llllljlllllllllllll00000000dccccd0
000dccccd0000000000000000000000000000000000dccccd0
000dccccd0000000000000000000000000000000000dccccd0
000dccccd0000000000000000000000000000000000dccccd0
000dccccd0000000000000000000000111000000000dccccd0
000dccccd0000000000000000000000111000000000dccccd0
000cccccc0000000000000000000000000000000000cccccc0
3dddccccd0000000000000000000000000000000000dccccdc
3dccccccc0000000000000000000000000000000000ccccccc
0ccccccccd7777777777777cccccc777777777777ddccccccc
0dcccccccd7777777777777caaaac777777777777dcccccccc
0dcccccccd7777777777777caaaac777777777777dcccccccc
0dcccccccd7777777777777ccaccc777777777777dcccccccc
0dcccccccc0000000000000000000000000000000ccccccccc
```
Front (looking from the front; the sky at the top):
```
.................M.MM.MMMMMMMM.M.MM...............
.................M.MM.MMMMMMMM.M.MM...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWLLL...............
..MMM.MM.M.......LLWWWLLWWWWWWWWLLL.........M.MM..
..MMMMMM.M.......LLWWWLLWWWWWWWWLLL.......MMMMMMMM
..ZZZZZZZZ.......WWWWWWMMMMMWWWWWWW.......ZZZZZZZZ
..ZZZZZZZZ.......WWWWWWMMMMMWWWWWWW.......ZZZZZZZZ
..ZZZZZZZZ.......WWWWWWgggggWWWWWWW.......ZZZZZZZZ
..ZZZZZZZZ.......WWWWWWgggggWWWWWWW.......ZZZZZZZZ
..ZZZZZZZZ.......WWWWWWNooooOWWWWWW.......ZZZZZZZZ
..ZZZZZZZZ.......WWWWWWNooooOWWWWWW.......ZZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCNooooOCCCCCCCCCCCCCZZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCNooooOCCCCCCCCCCCCCZZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCNooooOCCCCCCCCCCCCCZZZZZZZZ
.ZZZZZZZZZCCCCCCCCCCCCCNooooOCCCCCCCCCCCCCZZZZZZZZ
PPZZZZZZZZCCCCCCCCCCCCCNooooOCCCCCCCCCCCCCZZZZZZZZ
PPZZZZZZZZCCCCCCCCCCCCCNooooOCCCCCCCCCCCCCZZZZZZZZ
PPZZZZZZZZCCCCCCCCCCCCCNooooOCCCCCCCCCCCCCZZZZZZZZ
PPZZZZZZZZCCCCCCCCCCCCCXooooXCCCCCCCCCCCCCZZZZZZZZ
```
Right side (looking from the right):
```
....................MM.M.MM.M.M.MM.MM.............
....................MM.M.MM.M.M.MM.MM.............
....................WWWWWWWWWWWWWWWWW.............
....................WWWWWWWWWWWWWWWWW.............
....................WWWWWWWWWWWWWWWWW.............
....................WWWWWWWWWWWWWWWWW.............
....................WWWWWWWWWWWWWWWWW.............
....................WWWWWWWWWWWWWWWWW.............
MMMMMMMM............WWWWWWWWWWLWWWWMM.M..M.MMMMMM.
MMMMMMMM............WWWWWWLLWWLLWLLMM.M.MM.MMMMMMM
ZZZZZZZZ............WWWWWWLLWWLLWLLZZZZZZZZZZZZZZZ
ZZZZZZZZ............WWWWWWWWWWWWWWWZZZZZZZZZZZZZZZ
ZZZZZZZZ............WWWWWWWWWWWWWWWZZZZZZZZZZZZZZZ
ZZZZZZZZ............WWWWWWWWWWWWWWWZZZZZZZZZZZZZZZ
ZZZZZZZZ............WWWWWWWWWWWWWWWZZZZZZZZZZZZZZZ
ZZZZZZZZ............WWWWWWWWWWWWWWWZZZZZZZZZZZZZZZ
ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZZZZZZZZ
ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZZZZZZZZ
ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZZZZZZZZ
ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZZZZZZZZ
ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZZZZZZZZ
ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZZZZZZZZ
ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZZZZZZZZ
ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZZZZZZZZ
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..ZZZZZZZZ................................ZZZZZZZZ
..ZZZZZZZZ................................ZZZZZZZZ
..ZZZZZZZZ................................ZZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ
.ZZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ
PPZZZZZZ...................................ZZZZZZZ
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC...................................CCCC...
.....CCC.........WLWWWWLLWLLWWWWWWW........CCCC...
.....CCC.........WLWWWWLLWLLWWWWWWW........CCCC...
.....CCC.........L.....kkkk......WW........CCCC...
.....CCC.........W.....kkkk......LL........CCCC...
.....CCC.........W.....kkkk......LL........CCCC...
.....CCC.........W...............LL........CCCC...
.....CCC.........W...............LW........CCCC...
.....CCC.........W...............LL........CCCC...
.....CCC.........W...............WW........CCCC...
.....CCC.........W...............WW........CCCC...
.....CCC.........W...............WW........CCCC...
.....CCC.........W...............WW........CCCC...
.....CCC.........W...............WW........CCCC...
.....CCC.........W...............LL........CCCC...
.....CCC.........L...............LL........CCCC...
...ZZZZZ.........WWWWWWoooooNLLWWWW........ZZZZZ..
...ZZZZZ.........WWWWWWoooooNLLWWWW........ZZZZZ..
...ZZZZZ...................................ZZZZZ..
...ZZZZZ...................................ZZZZZ..
...ZZZZZ...................................ZZZZZ..
...ZZZZZ...................................ZZZZZ..
...ZZZZZ...................................ZZZZZ..
...ZZZZZ...................................ZZZZZ..
PPZZZZZZ...................................ZZZZZZZ
PPZZZZZZ...................................ZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCoooooNCCCCCCCCCCCCCZZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCooooooCCCCCCCCCCCCCZZZZZZZZ
..ZZZZZZZZCCCCCCCCCCCCCooooooCCCCCCCCCCCCCZZZZZZZZ
..ZZZZZZZZ...............................ZZZZZZZZZ
..ZZZZZZZZ................................ZZZZZZZZ
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
..................................................
..................................................
.................WWWWLLWWWWWWWWWLLW...............
.................WWWWLLWWWWWWWWWLWW...............
.................L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................WLWWWLLWWWWWWWWLWW...............
.................WLWWWLLWWWWWWWWLLW...............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.........M........................................
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
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ   0dcccccccd0000000000000000000000000000000dcccccccc
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ   0dcccccccd0000000000000000000000000000000dcccccccc
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ   0dcccccccd0000000000000000000000000000000dcccccccc
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ   0ccccccccd7777777777777777777777777777777dcccccccc
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ   0dcccccccc7777777777777777777777777777777ccccccccc
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ   0dcccccccd7777777777777777777777777777777dcccccccc
EEZZZZZZZMCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ   3dcccccccd7777777777777777777777777777777ddccccccc
PPZZZZZZcccccccccccccccccccccccccccccccccccZZZZZZZ   3dccccccd0000000000000000000000000000000000dcccccc
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   3dddddddd0000000000000000000000000000000000ddcdddd
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCccccccccccccccccccccccccccccccccccccZZZXXX   0000077770000000000000000000000000000000000dddddd0
XXXXXCCCccccccccccccccccccccccccccccccccccccZZZZXX   0000077770000000000000000000000000000000000dccccd0
XXXXXCCCcccccccccccccccccccccccccccccccccccZZZZZPP   0000077770000000000000000000000000000000000cccccc3
XXXXXCCCccccccccccccccccccccccccccccccccccccZZZZPP   0000077770000000000000000000000000000000000dccccd3
XXXXXCCCcccccccccccccccccccccccccccccccccccZZZZZEE   0000077770000000000000000000000000000000000cccccc0
XXXXXCCCccccccccccccccccccccccccccccccccccccZZZZEE   0000077770000000000000000000000000000000000dccccd0
XXXXXCCCcccccccccccccccccccccccccccccccccccZZZZZEE   0000077770000000000000000000000000000000000cccccc0
XXXXXCCCcccccccccWWWWWWWWWWWWWWWWWMcccccccccZZZZPP   0000077770000000llllljllllljlllllll00000000dccccd3
XXXXXCCCcccccccccWWWWWWWWWWWWWWWWWWccccccccMZZZZPP   0000077770000000ljjjjjjjjjjjjjjjjjl00000000dddddd3
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   0000077770000000ljjjjjjjjjjjjjjjjjl000000007777000
XXXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   0000077770000000jjjjjjjjjjjjjjjjjjj000000007777000
XXXXXZCZcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   000ddcddd0011100ljjjjjjjjjjjjjjjjjl000000007777000
XXXXZZZZccccaccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   000dccccd0011100ljjjjjjjjjjjjjjjjjl000000007777000
PPPZZZZZcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   333cccccc0000000ljjjjjjjjjjjjjjjjjl000000007777000
PPPMZZZZcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   333dccccd0000000ljjjjjjjjjjjjjjjjjl000000007777000
EEEZZZZZcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   000cccccc0000000ljjjjjjjjjjjjjjjjjl000000007777000
EEEEZZZZcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   000dccccd0000000jjjjjjjjjjjjjjjjjjj000000007777000
EEEZZZZZcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   000cccccc0000000ljjjjjjjjjjjjjjjjjl000000007777000
PPPPZZZZcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   333dccccd0000000ljjjjjjjjjjjjjjjjjl000000007777000
PPPMZZZZcccccccccWWFFFFFFFFFFFFFFWWccccccccCCCCXXX   333dddddd0000000ljjjjjjlljllljjjjjl000000007777000
PPXXXCCCcccccccccWWWWWWWWWWWWWWWWWWccccccccCCCCXXX   3300077770000000ljjjjjjljjjjljjjjjl000000007777000
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCXXX   3300077770000000llllljlllllllllllll000000007777000
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCXXX   33000777700000000000000000000000000000000007777000
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCXXX   33000777700000000000000000000000000000000007777000
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCXXX   33000777700000000000000000000000000000000007777000
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCXXX   33000777700000000000000000000000000000000007777000
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCXXX   33000777700000000000000000000000000000000007777000
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCXXX   33000777700000000000000000000000000000000007777000
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCXXX   33000777700000000000000000000000000000000007777000
PPXXXCCCCccccccccccccccnnnnncccccccccccccccCCCCXXX   33000777777777777777777cccccc777777777777777777000
PPXXXCCCCCCCCCCCCCCCCCCNggggMCCCCCCCCCCCCCCCCCCXXX   33000777777777777777777caaaac777777777777777777000
PPXXXCCCCCCCCCCCCCCCCCCgggggNCCCCCCCCCCCCCCCCCCXXX   33000777777777777777777caaaac777777777777777777000
PPXXXCCCCCCCCCCCCCCCCCCgggggNCCCCCCCCCCCCCCCCCCXXX   33000777777777777777777caaaac777777777777777777000
```
### Seed 3: plan and heights side by side
```
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ   0dcccccccd0000000000000000000000000000000dcccccccc
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ   0dcccccccd0000000000000000000000000000000dcccccccc
EEZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ   0dcccccccd0000000000000000000000000000000dcccccccc
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ   0ccccccccd7777777777777777777777777777777dcccccccc
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ   0dcccccccc7777777777777777777777777777777ccccccccc
EEZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ   0dcccccccd7777777777777777777777777777777dcccccccc
EEZZZZZZZMCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCZZZZZZZZ   3dcccccccd7777777777777777777777777777777ddccccccc
PPZZZZZZcccccccccccccccccccccccccccccccccccZZZZZZZ   3dccccccd0000000000000000000000000000000000dcccccc
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   3dddddddd0000000000000000000000000000000000ddcdddd
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXXXCCCcccccccccccccccccccccccccccccccccccCCCCXXX   00000777700000000000000000000000000000000007777000
XXXMZZZZcccccccccccccccccccccccccqqccccccccCCCCXXX   000ddcddd00000000000000000000000011000000007777000
XXXZZZZZccccccccccccccccccccccccccqccccccccCCCCXXX   333dccccd00000000000000000000000011000000007777000
PPPZZZZZcccccccccccccccccccccccccccccccccccCCCCXXX   333dccccd00000000000000000000000000000000007777000
EEEZZZZZcccccccccccccccccccccccccccccccccccCCCCXXX   333dccccd00000000000000000000000000000000007777000
EEEZZZZZcccccccccccccccccccccccccccccccccccCCCCXXX   000dccccd00000000000000000000000000000000007777000
EEEZZZZZcccccccccWWWWWWWWWWWWWWWWWMccccccccCCCCXXX   000dccccd0000000llllljllllljlllllll000000007777000
EEEZZZZZcccccccccWWWWWWWWWWWWWWWWWWccccccccCCCCXXX   333dccccd0000000ljjjjjjjjjjjjjjjjjl000000007777000
PPPPZZZZcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   333dccccd0000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   333dddddd0000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000jjjjjjjjjjjjjjjjjjj000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000jjjjjjjjjjjjjjjjjjj000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWFFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjjjjjjjjjjjjl000000007777000
PPXXXCCCcccccccccWWFFFFFFFFFFFFFFWWccccccccCCCCXXX   3300077770000000ljjjjjjlljllljjjjjl00000000dddddd0
PPXXXCCCcccccccccWWWWWWWWWWWWWWWWWWcccccccccZZZZXX   3300077770000000ljjjjjjljjjjljjjjjl00000000dccccd0
PPXXXCCCcccccccccccccccnnnnncccccccccccccccZZZZZPP   3300077770000000llllljllljlllllllll00000000dccccd3
PPXXXCCCcccccccccccccccnnnnncccccccccccccccZZZZZPP   3300077770000000000000000000000000000000000dccccd3
PPXXXCCCcccccccccccccccnnnnncccccccccccccccZZZZZEE   3300077770000000000000000000000000000000000dccccd0
PPXXXCCCcccccccccccccccnnnnncccccccccccccccZZZZZEE   3300077770000000000000000000000000000000000dccccd0
PPXXXCCCcccccccccccccccnnnnncccccccccccccccZZZZZEE   3300077770000000000000000000000000000000000dccccd0
PPXXXCCCcccccccccccccccnnnnncccccccccccccccZZZZZEE   3300077770000000000000000000000000000000000dccccd0
PPXXXCCCcccccccccccccccnnnnncccccccccccccccMZZZZEE   3300077770000000000000000000000000000000000ddcddd0
PPXXXCCCcccccccccccccccnnnnncccccccccccccccCCCCEEE   33000777700000000000000000000000000000000007777000
PPXXXCCCCccccccccccccccnnnnncccccccccccccccCCCCEEE   33000777777777777777777cccccc777777777777777777000
PPXXXCCCCCCCCCCCCCCCCCCNggggMCCCCCCCCCCCCCCCCCCEEE   33000777777777777777777caaaac777777777777777777000
PPXXXCCCCCCCCCCCCCCCCCCgggggNCCCCCCCCCCCCCCCCCCEEE   33000777777777777777777caaaac777777777777777777000
PPXXXCCCCCCCCCCCCCCCCCCgggggNCCCCCCCCCCCCCCCCCCEEE   33000777777777777777777caaaac777777777777777777000
```
How much the plans of the seeds differ: 0.26 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 144 nodi, 569 passi, finito in 671 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro, E=terra (marcatore), h=sala del mastio, w=muro del mastio, s=scala, c=cortile (marcatore), W=muro del mastio, t=torre, G=corpo di guardia, r=strada, d=porta, n=selciato, Q=pozzo, m=segno della via, e=segno, p=fossato, P=palizzata, C=cinta di pietra, Z=pietra delle torri, D=porta, O=porta, g=corpo di guardia, q=pozzo di pietra, f=pavimento di assi, F=solaio di lastre, V=muro del mastio, L=finestra, T=scala, k=gradini, M=merli, N=cornice della porta, o=assi della porta, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: Z 115774, C 79920, W 55334, c 8925, o 6510, L 4816, X 3775, F 3440, U 3126, k 2720, M 2274, f 1800, N 1005, g 750, P 650, n 375, O 240, E 175, q 96, r 25, a 9.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-45 all×30, one×6, prl×2: 992 celle x0-29 y0-29 z0, passi 2-78
   #49 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 79
#51-53 prl×2, all×1: 5550 celle x70-84 y105-144 z0-35, passi 80-115
    #54 all . C → C C passi=23: ×23, 77050 celle x15-139 y10-144 z1-23, passi 116-138, .→C 77050
    #55 all . Z → Z Z passi=40: ×40, 116000 celle x5-149 y0-149 z1-40, passi 139-178, .→Z 116000
#56-62 all×3: 12080 celle x0-104 y20-134 z0-12, passi 179-201
    #63 all . w → w V passi=14: ×14, 26600 celle x50-104 y60-109 z6-21, passi 202-215, w→V 13300, .→w 13300
    #64 all . w → w W passi=12: ×12, 22800 celle x50-104 y60-109 z20-33, passi 216-227, w→W 11400, .→w 11400
    #65 all . w → w W passi=6: ×6, 11400 celle x50-104 y60-109 z32-39, passi 228-233, w→W 5700, .→w 5700
    #66 all . w → w V passi=14: ×14, 26600 celle x50-104 y60-109 z38-53, passi 234-247, w→V 13300, .→w 13300
#67-70 all×3, prl×1: 29650 celle x50-104 y60-109 z0-66, passi 248-263
    #71 all . h → h . passi=31: ×31, 99200 celle x55-99 y65-104 z1-32, passi 264-294, h→. 49600, .→h 49600
#72-73 all×2: 15600 celle x55-99 y65-104 z2-33, passi 295-325
    #74 all . h → h . (+1) passi=31: ×31, 111600 celle x55-99 y65-104 z33-64, passi 326-356, h→. 49600, .→h 49600, s→. 6200, .→s 6200
      r1 . h → h . ×49600; r2 . s → s . ×6200
#75-78 prl×2, one×1, all×1: 28400 celle x50-104 y60-109 z6-64, passi 357-383
#85-88 all×4: 14040 celle x69-85 y105-144 z0-30, passi 384-415
#106-144 all×16, prl×6: 22223 celle x5-149 y0-149 z1-72, passi 416-569
Senza effetto (non hanno mai cambiato una cella):
#19 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#40 all pE/*p → *p/**: le celle cercate c'erano, ma mai disposte come nel pattern
#44 all pE/*p → *p/**: le celle cercate c'erano, ma mai disposte come nel pattern
#46 all PE/*P → *P/**: le celle cercate c'erano, ma mai disposte come nel pattern
#47 one EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEE… → *********/*********/*********/*********/****u**…: le celle cercate c'erano, ma mai disposte come nel pattern
#58 all . Y → Y Y passi=12: in quel momento nella griglia non c'erano celle "Y"
#59 all . Y → K * passi=1: in quel momento nella griglia non c'erano celle "Y"
#60 all K. → *K passi=3: in quel momento nella griglia non c'erano celle "K"
#61 all . K → K K passi=8: in quel momento nella griglia non c'erano celle "K"
#80 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#81 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#82 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
… e altri 33
Improve it: answer with the whole program.

## Risposta

```xml
<!--
  FORTE: le parti e dove stanno
  - h il mastio intorno al centro H; w i suoi muri; s la zona della scala; d la porta del mastio sul fronte.
  - c il cortile intorno al mastio; cresce dove la terra prosegue.
  - W la cinta di 2 celle intorno al cortile; t le torri agli angoli e torri mezzane a caso.
  - n il selciato dalla porta del mastio a G, il corpo di guardia nella cinta; r la strada fino al bordo.
  - Q il pozzo in 5 x 5 di cortile libero.
  - p il fossato e P la palizzata oltre la cinta, solo dove la terra prosegue.
  - u gli alberi del bosco intorno, solo dove resta molta terra libera (gargantuesca).
  I semi cambiano: la profondita' del mastio, le torri mezzane, il pozzo, gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtGrdnQamepPu" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <one steps="1" symmetry="()"><rule in="E/h" out="h/*"/><rule in="E/h" out="e/*"/></one>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <prl in="e" out="E"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="WWWWW/WWWWW/EEEEE" out="ttttt/ttttt/ttttt" steps="2"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="[Wt]EEEEEEEE" out="*p*******" steps="1"/>
      <all in="pE/*p" out="*p/**"/>
      <all in="[Wt]E/*p" out="*p/**"/>
      <all in="pE/*p" out="*p/**"/>
      <all in="pE" out="*p" steps="1"/>
      <all in="pE/*p" out="*p/**"/>
      <all in="pE" out="*P" steps="1"/>
      <all in="PE/*P" out="*P/**"/>
      <one in="EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE" out="*********/*********/*********/*********/****u****/*********/*********/*********/*********"/>
    </sequence>
    <map scale="5 5 1" values="BEhwscCZGDOgnrqafFWVLRTkMNoUxyXPYK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="t" out="ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>
      <rule in="p" out="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX"/>
      <rule in="P" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="u" out="EEEEE/EYYYE/EYYYE/EYYYE/EEEEE"/>
      <sequence symmetry="(xy)">
        <prl in="B G" out="g O"/>
        <prl in="B D" out="w O"/>
        <all in="B g" out="g g" steps="34"/>
        <all in="B C" out="C C" steps="23"/>
        <all in="B Z" out="Z Z" steps="40"/>
        <all in="B q" out="q q" steps="5"/>
        <all in="B P" out="P P" steps="12"/>
        <all in="B Y" out="Y Y" steps="12"/>
        <all in="B Y" out="K *" steps="1"/>
        <all in="KB" out="*K" steps="3"/>
        <all in="B K" out="K K" steps="8"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w W" steps="13"/>
        <prl in="w" out="W"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <one steps="24"><rule in="BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="W"/>
        <union symbol="+" values="WCZg"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="CZg"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" rgb="#9a8a6a" name="centro"/>
  <color symbol="m" rgb="#9a8a6a" name="segno della via"/>
  <color symbol="e" rgb="#9a8a6a" name="segno"/>
  <color symbol="t" rgb="#857f74" name="torre" area="tower"/>
  <color symbol="W" rgb="#d6c9a8" name="muro del mastio"/>
  <color symbol="w" rgb="#d6c9a8" name="muro del mastio"/>
  <color symbol="h" rgb="#c9b48a" name="sala del mastio" area="keep"/>
  <color symbol="s" rgb="#a0764a" name="scala"/>
  <color symbol="G" rgb="#8a7a62" name="corpo di guardia"/>
  <color symbol="d" rgb="#4a2f1c" name="porta"/>
  <color symbol="Q" rgb="#6f8a96" name="pozzo"/>
  <color symbol="p" rgb="#6f8a96" name="fossato"/>
  <color symbol="P" rgb="#6b4a2c" name="palizzata"/>
  <color symbol="u" rgb="#6f8f4a" name="albero" area="garden"/>
  <color symbol="Y" rgb="#5a3d24" name="tronco"/>
  <color symbol="K" rgb="#7a9a52" name="chioma" area="garden"/>
  <color symbol="c" hidden="True" name="cortile" area="courtyard"/>
  <color symbol="C" rgb="#a8a08c" name="cinta di pietra"/>
  <color symbol="Z" rgb="#8b8476" name="pietra delle torri" area="tower"/>
  <color symbol="g" rgb="#9a8f7a" name="corpo di guardia"/>
  <color symbol="D" rgb="#4a2f1c" name="porta"/>
  <color symbol="n" rgb="#9c8f7a" name="selciato"/>
  <color symbol="r" rgb="#b89b6a" name="strada"/>
  <color symbol="q" rgb="#8c8c84" name="pozzo di pietra"/>
  <color symbol="a" rgb="#6f8a96" name="acqua"/>
  <color symbol="X" rgb="#62808c" name="acqua del fossato"/>
  <color symbol="f" rgb="#a0764a" name="pavimento di assi" area="keep"/>
  <color symbol="F" rgb="#b5a58a" name="solaio di lastre"/>
  <color symbol="V" rgb="#d6c9a8" name="muro del mastio"/>
  <color symbol="L" rgb="#3a3f44" name="finestra"/>
  <color symbol="R" rgb="#a5402e" name="tetto"/>
  <color symbol="T" rgb="#a0764a" name="scala"/>
  <color symbol="k" rgb="#8a6440" name="gradini"/>
  <color symbol="M" rgb="#bdb29a" name="merli"/>
  <color symbol="U" rgb="#2e2a26" name="feritoia"/>
  <color symbol="N" rgb="#6a6458" name="cornice della porta"/>
  <color symbol="O" rgb="#5e3a20" name="porta"/>
  <color symbol="o" rgb="#3a2414" name="assi della porta"/>
  <color symbol="x" hidden="True" name="porta aperta"/>
  <color symbol="y" hidden="True" name="porta aperta"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="x"/><rule in="o" out="y"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="x" out="O"/><rule in="y" out="o"/></all></action>
</sequence>
```
