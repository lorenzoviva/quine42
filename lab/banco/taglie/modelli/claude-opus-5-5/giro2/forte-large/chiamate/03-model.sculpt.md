# model.sculpt · claude-opus-5-5 · 39 s

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
<!--
  FORTE. Parti e lettere del piano (una cella = 5 voxel):
  H centro; h sala del mastio; w muro del mastio; s zona della scala; x torretta d'angolo del mastio;
  c cortile; W cinta; t torri d'angolo (non tutti gli angoli); d porta del mastio; n selciato; G torre-porta;
  r strada; Q pozzo lontano dalla porta; a fossato fuori dalla cinta.
  I semi cambiano la lunghezza del mastio davanti e dietro, l'angolo della torretta e quali angoli hanno torri.
  Grande: mastio e cinta sottile. Enorme: cortile largo, cinta doppia, pozzo. Gigantesco: anche il fossato.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsxcWtdnGrQamK" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <all in="[wx]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cc*****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="cWEEEE" out="**W***" steps="1"/><all in="WE/*W" out="*W/**"/>
      <prl in="EE/EW" out="**/*t" p="0.65"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"><field for="Q" from="r" on="cnr"/></one>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsxdpzgqfFWuLDOoNTkYPZGVAcnrMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="t" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qAAAq/qAAAq/qAAAq/qqqqq"/>
      <rule in="a" out="AAAAA/AAAAA/AAAAA/AAAAA/AAAAA"/>
      <sequence symmetry="(xy)">
        <!-- muri del mastio: intonaco e fasce delle finestre, 66 -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w W" steps="13"/>
        <prl in="w" out="W"/>
        <!-- porta del mastio -->
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="64"/><prl in="d" out="W"/>
        <!-- torretta -->
        <all in="B x" out="x Y" steps="72"/><prl in="x" out="Y"/>
        <!-- sala e scala: pavimento, solaio a 32, terrazza a 64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <!-- cinta, torri, torre-porta, pozzo -->
        <all in="B p" out="p P" steps="23"/><prl in="p" out="P"/>
        <all in="B z" out="z Z" steps="39"/><prl in="z" out="Z"/>
        <all in="B g" out="g O" steps="1"/><all in="B g" out="g G" steps="47"/><prl in="g" out="G"/>
        <all in="B q" out="q V" steps="5"/><prl in="q" out="V"/>
        <!-- finestre -->
        <one steps="14"><rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="W"/>
        <union symbol="+" values="WYPZG"/>
        <union symbol="%" values="YPZG"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="W" value="d8ccb0" name="intonaco del mastio"/>
  <color symbol="L" value="2e3a4a" name="finestra"/>
  <color symbol="Y" value="6e675e" name="pietra della torretta"/>
  <color symbol="P" value="a8a090" name="pietra della cinta"/>
  <color symbol="Z" value="857d72" name="pietra delle torri"/>
  <color symbol="G" value="9a3c2c" name="mattoni della torre-porta"/>
  <color symbol="M" value="bdb5a4" name="merli"/>
  <color symbol="U" value="1e1e22" name="feritoia"/>
  <color symbol="f" value="a0703c" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7a6a58" name="solaio"/>
  <color symbol="k" value="8a5a30" name="gradini"/>
  <color symbol="O" value="6a4428" name="porta"/>
  <color symbol="o" value="3e2614" name="assi della porta"/>
  <color symbol="N" value="4a4038" name="stipiti"/>
  <color symbol="V" value="9c948a" name="parapetto del pozzo"/>
  <color symbol="A" value="4a7aa8" name="acqua"/>
  <color symbol="c" value="9cae6a" name="cortile" area="courtyard"/>
  <color symbol="n" value="c8b890" name="selciato" area="courtyard"/>
  <color symbol="r" value="b8a070" name="strada"/>
  <color symbol="T" value="a0703c" name="striscia della scala"/>
  <color symbol="#20" value="6a4428" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="3e2614" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: varietà: alla taglia Enorme 18 tipi di parti e 129 parti, alla Grande 18 e 114: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 143 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at huge: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, c cortile, W intonaco del mastio, n selciato, G mattoni della torre-porta, r strada, f assi del pavimento, F solaio, L finestra, O porta, o assi della porta, N stipiti, k gradini, Y pietra della torretta, P pietra della cinta, Z pietra delle torri, M merli, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZ
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZ
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZ
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZ
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMZZZZZZZZZZZZ
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPcMMZcZZZZZZZZ
EEEEEEEEPPcccccccccccccccccccccccccccccccccZZZZZZZ
EEEEEEEEPPcccccccccccccccccccccccccccccccccZZZZZZZ
EEEEEEEEPPcccMMWWMMWWMMWWMWMWWMMWWMMWWMMcccPPEEEEE
EEEEEEEEPPcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccPPEEEEE
EEEEEEEEPPcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE
EEEEEEEEPPcccWWWWWWWWWWWWWWWWWWWWWWWWWMMcccMMZZMZZ
EEEEEEEEPPcccWWWWWWWWWWWWWWWWWWWWWWWWWYYcccZZZZZZZ
EEEEEEEEPPcccMMWcMMWcMMWnMMWnMMWcMMWcMMMcccZZZZZZZ
EEEEEEEEPPcccccccccccccnnnnnnncccccccccccccZZZZZZZ
EEEEEEEEPPcccccccccccccnnnnnnncccccccccccccZZZZZZZ
EEEEEEEEPPPPPPPPPPPPPPNMGMGGMMNPPPPPPPMMZZZZZZZZZZ
EEEEEEEEPPPPPPPPPPPPPPNGGGGGGGNPPPPPPPZZZZZZZZZZZZ
EEEEEEEEMMPEMMPEMMPEMPNMrMGrMMEPPPPPPPZZZZZZZZZZZZ
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEZZZZZZZZZZZZ
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEZZZZZZZZZZZZ
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000kkkhkkkhkkkhk
0000000000000000000000000000000000000khhhhhhhhhhhh
0000000000000000000000000000000000000khhhhhhhhhhhh
0000000000000000000000000000000000000hhhhhhhhhhhhh
0000000000000000000000000000000000000khhhhhhhhhhhh
0000000dddadddadddadddadddadddadddaddkhhhhhhhhhhhh
0000000daaaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhhhhhhh
0000000daaaaaaaaaaaaaaaaaaaaaaaaaaaaahhhhhhhhhhhhh
0000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhhhhhhh
0000000daaaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhhhhhhh
0000000daaaaaaaaaaaaaaaaaaaaaaaaaaaaakkkhkkhhhhhhh
0000000daa00000000000000000000000000000000khhhhhhh
0000000aaa00000000000000000000000000000000kkkhkkhh
0000000daa00wwwtwwwtwwwtwwwwtwwwtwwwtwww00aaa00000
0000000daa00wttttttttttttttttttttttttttw00aaa00000
0000000daa00wttttttttttttttttttttttttttw00aaa00000
0000000aaa00tttssssssssssssssssssssssttt00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000aaa00tttssssssssssssssssssssssttt00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000aaa00tttssssssssssssssssssssssttt00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000aaa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttt00aaa00000
0000000daa00tttssssssssssssssssssssssttw00aaa00000
0000000aaa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttt00aaa00000
0000000daa00tttssssssssssssssssssssssttw00aaa00000
0000000aaa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttw00aaa00000
0000000daa00wttssssssssssssssssssssssttt00aaa00000
0000000daa00tttssssssssssssssssssssssttw00aaa00000
0000000aaa00wttttttttttttttttttttttttzzz00kkkhkkhh
0000000daa00wttttttttttttttttttttttttzwz00khhhhhhh
0000000daa00wwwtwwwtwwwtwwwtwwwtwwwtwzzz00khhhhhhh
0000000daa00000000000000000000000000000000hhhhhhhh
0000000aaa00000000000000000000000000000000khhhhhhh
0000000daaaaaaaaaaaaaaooooloooaaaaaaakkkhkkhhhhhhh
0000000daaaaaaaaaaaaaaolllllloaaaaaaakhhhhhhhhhhhh
0000000dddadddadddaddaooooloooaaaaaaakhhhhhhhhhhhh
0000000000000000000000000000000000000hhhhhhhhhhhhh
0000000000000000000000000000000000000khhhhhhhhhhhh
```
Front (looking from the front; the sky at the top):
```
......................................MM..........
.....................................MMM..........
.....................................MMM..........
.....................................YYY..........
............MMM.MMM.MMM.MMMMMMMMMMMMMMYY..........
............MMM.MMM.MMM.MMMMMMMMMMMMMMYY..........
............MMM.MMM.MMM.MMMMMMMMMMMMMMYY..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWYY..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWYY..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWYY..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWYY..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWYY..........
............WWWWWWWWWWWMWMWWMMWWWWWWWWYY..........
............WWWWWWWWWWWMWMWWMMWWWWWWWWYY..........
............WWWWWWWWWWWMWMWWMMWWWWWWWWYY..........
............WWWWWWWWWWWGGGGGGGWWWWWWWWYY..........
............WWWWWWWWWWWGGGGGGGWWWWWWWWYY..........
............WWWWWLLLWWWGGGGGGGWWWWWWWWMM.MMMMMMM.M
............WWWWWLLLWWWGGGGGGGWWWWWWWWMM.MMMMMMM.M
............WWWWWLLLWWWGGGGGGGWWWWWWWWMM.MMMMMMM.M
............WWWWWLLLWWWGGGGGGGWWWWWWWWZZZZZZZZZZZZ
............WWWWWWWWWWWGGGGGGGWWWWWWWWZZZZZZZZZZZZ
............WWWWWWWWWWWGGGGGGGWWWWWWWWZZZZZZZZZZZZ
............WWWWWWWWWWWGGGGGGGWWWWWWWWZZZZZZZZZZZZ
............WWWWWWWWWWWNNNNNNNWWWWWWWWZZZZZZZZZZZZ
.......MMM.MMMWWMMWWMWNoooooooNWWWWWWWZZZZZZZZZZZZ
.......MMM.MMMWWMMWWMWNoooooooNWWWWWWWZZZZZZZZZZZZ
.......MMM.MMMWWMMWWMWNoooooooNWWWWWWWZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEZZZZZZZZZZZZZ
```
Right side (looking from the right):
```
........................................MM........
........................................MMM.......
........................................MMM.......
........................................YYY.......
...............MMM.MMM.MMM.MMMMMMMMMMMMMYYY.......
...............MMM.MMM.MMM.MMMMMMMMMMMMMYUY.......
...............MMM.MMM.MMM.MMMMMMMMMMMMMYUY.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWYYY.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWYYY.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWYYY.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWYYY.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWYYY.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWYYY..MM...
...............WWWWWWWWWWWWWWWWWWWWWWWWWYYY..MMM..
...............WWWWWWLLLWWWWWWWWWWWWWWWWYYY..MMM..
...............LWLLLWLLLWWWLLWWWWWWWWWWWYYY..GGG..
...............LWLLLWLLLWWWLLLWWWWWWWWWWYYY..GGG..
..MMM.MMM.MMMMMLWLLLLLLLWWWLLLWWWWWWWWWWMMM.MMMM.M
..MMM.MMM.MMMMMLWLLLLWWWWWWLLLWWWWWWWWWWMMM.MMMM.M
..MMM.MMM.MMMMMWWWLLLWWWWWWWWWWWWWWWWWWWMMM.MMMM.M
..ZZZZZZZZZZZZZWWWLLLWWWWWWWWWWWWWWWWWWWZZZZZZZZZZ
..UUUUUUUUUUUUUWWWWWWWWWWWWWWWWWWWWWWWWWZUZZZZUZZZ
..UUUUUUUUUUUUUWWWWWWWWWWWWWWWWWWWWWWWWWZUZZZZUZZZ
..UUUUUUUUUUUUUWWWWWWWWWWWWWWWWWWWWWWWWWZUZZZZUZZZ
..ZZZZZZZZZZZZZWWWWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZZZ
..ZZZZZZZZZZZZZWWWWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZZZ
..ZZZZZZZZZZZZZWWWWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZZZ
..ZZZZZZZZZZZZZWWWWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
..ZZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZ
EEZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZ
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
......................................ZZZZZZZZZZZZ
.....................................ZZZZZZZZZZZZZ
.....................................ZZZZZZZZZZZZZ
.....................................ZZZZZZZZZZZZZ
.....................................ZZZZZZZZZZZZZ
........PPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ
.......PPP................................ZZZZZZZZ
.......PPP................................ZZZZZZZZ
.......PPP..WWWWWWWWWWWWWWWWWWWWLLLWWWWW..PPP.....
.......PPP..WWWWWWWWWWWWWWWWWWWWLLLWWWWW..PPP.....
.......PPP..WWWWWWWWWWWWWWWWWWWWLLLWWWWW..PPP.....
.......PPP..WWW.......kkkkkk.........WWW..PPP.....
.......PPP..WWW.......kkkkkk.........WWW..PPP.....
.......PPP..WWW.......kkkkkk.........WWW..PPP.....
.......PPP..WWW.......kkkkkk.........WWW..PPP.....
.......PPP..WWW........kkkkk.........WWW..PPP.....
.......PPP..LLL......................WWW..PPP.....
.......PPP..LWW......................WWW..PPP.....
.......PPP..LWW......................WWW..PPP.....
.......PPP..LLL......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..LLL......................WWW..PPP.....
.......PPP..LLL......................WWW..PPP.....
.......PPP..LLL......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWW......................WWW..PPP.....
.......PPP..WWWLWWWWWWNoooooooNWWWWWWWYY..ZZZZZZZZ
.......PPP..WWWLWWWWWWNoooooooNWWWWWWWYY..ZZZZZZZZ
.......PPP...LLLWWWWWWNoooooooNWWWWWWWYY..ZZZZZZZZ
.......PPP................................ZZZZZZZZ
.......PPP................................ZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
.......PPPPPPPPPPPPPPPNoooooooNPPPPPPPZZZZZZZZZZZZ
........PPPPPPPPPPPPPPNoooooooNPPPPPPZZZZZZZZZZZZZ
.....................................ZZZZZZZZZZZZZ
.....................................ZZZZZZZZZZZZZ
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
......................................MM..MM..MM..
.....................................M............
.....................................M............
..................................................
..................................................
.....................................M............
..................................................
..................................................
.....................................M............
.....................................M............
......................................MM..........
..................................................
..........................................MMM..M..
............WWWWWWWWWWWWWWWLLLWWWWWWWLLL..........
............WWWWWWWWWWWWWWWLLLWWWWWWWLWW..........
............WWWWWWWWWWWWWWWLLLWWWWWWWLWW..........
............WWW......................LWW..........
............WWW......................LWW..........
............WWW......................LLL..........
............LLL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWLLLWWWWWWWWWWWWWWWWWWYY..MMM..M..
............WWWWWLLLWWWWWWWWWWWWWWWWWWYY..M.......
.............WWWWLLLWWWWWWWWWWWWWWWWWWYY..........
..................................................
..........................................M.......
......................GGGGGGGG.......MMM..........
......................UUUUUUUU.......M............
.......................GGGGGGG....................
..................................................
.....................................M............
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
.....................................MMM..........
.....................................M.M..........
......................................MM..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00kkkhkkhkkhkkk0000000000000000000000kkkhkkkhkkkhk
EEEZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZ   00khhhhhhhhhhhk0000000000000000000000khhhhhhhhhhhh
EEEZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZ   00khhhhhhhhhhhk0000000000000000000000khhhhhhhhhhhh
EEEZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZ   00hhhhhhhhhhhhh0000000000000000000000hhhhhhhhhhhhh
EEEZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZ   00khhhhhhhhhhhk0000000000000000000000khhhhhhhhhhhh
EEEZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEMZZZZZZZZZZZZ   00khhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhhhhhhh
EEEZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ   00hhhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhhhhhhh
EEEZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ   00khhhhhhhhhhhhaaaaaaaaaaaaaaaaaaaaaahhhhhhhhhhhhh
EEEZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ   00khhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhhhhhhh
EEEZZZZZZZZZZZZPPPPPPPPPPPPPPPPPPPPPPPZZZZZZZZZZZZ   00hhhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhhhhhhh
EEEZZZZZZZMZcMMPPPPPPPPPPPPPPPPPPPPPPcMMZcZZZZZZZZ   00khhhhhhhkhkkkaaaaaaaaaaaaaaaaaaaaaakkkhkkhhhhhhh
EEEZZZZZZZcccccccccccccccccccccccccccccccccZZZZZZZ   00khhhhhhk00000000000000000000000000000000khhhhhhh
EEEZZZZZZMcccccccccccccccccccccccccccccccccZZZZZZZ   00kkkkhkkk00000000000000000000000000000000kkkhkkhh
EEEEEEEEPPcccMMMWWMMWWMMWWMMWWMMWWMMWWMMcccPPEEEEE   0000000aaa00zzzwtwwwtwwwtwwwtwwwtwwwtwww00aaa00000
EEEEEEEEPPcccYYWWWWWWWWWWWWWWWWWWWWWWWWWcccPPEEEEE   0000000aaa00zwzttttttttttttttttttttttttw00aaa00000
EEEEEEEEPPcccMMWWWWWWWWWWWWWWWWWWWWWWWWWcccPPEEEEE   0000000aaa00zzzttttttttttttttttttttttttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttt00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttt00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttt00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEMMZZMZMcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccMMZZMZZ   00kkkhkkkk00wttttttttttttttttttttttttttw00kkkhkkhh
EEEZZZZZZZcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccZZZZZZZ   00khhhhhhk00wttttttttttttttttttttttttttw00khhhhhhh
EEEZZZZZZZcccMMWcMMWcMMWnMnMWnMMWcMMWcMMcccZZZZZZZ   00khhhhhhk00wwwtwwwtwwwtwwwwtwwwtwwwtwww00khhhhhhh
EEEZZZZZZZcccccccccccccnnnnnnncccccccccccccZZZZZZZ   00hhhhhhhh00000000000000000000000000000000hhhhhhhh
EEEZZZZZZZcccccccccccccnnnnnnncccccccccccccZZZZZZZ   00khhhhhhk00000000000000000000000000000000khhhhhhh
EEEZZZZZZZMZZMMPPPPPPPNMGMGGMMNPPPPPPPMMZZZZZZZZZZ   00khhhhhhhkhkkkaaaaaaaooooloooaaaaaaakkkhkkhhhhhhh
EEEZZZZZZZZZZZZPPPPPPPNGGGGGGGNPPPPPPPZZZZZZZZZZZZ   00khhhhhhhhhhhkaaaaaaaolllllloaaaaaaakhhhhhhhhhhhh
EEEZZZZZZZZZZZZPPPPPPPNMMGrMrMEPPPPPPPZZZZZZZZZZZZ   00hhhhhhhhhhhhkaaaaaaaooolooooaaaaaaakhhhhhhhhhhhh
EEEZZZZZZZZZZZZEEEEEEEErrrrrrrEEEEEEEEZZZZZZZZZZZZ   00khhhhhhhhhhhh0000000000000000000000hhhhhhhhhhhhh
EEEZZZZZZZZZZZZEEEEEEEErrrrrrrEEEEEEEEZZZZZZZZZZZZ   00khhhhhhhhhhhk0000000000000000000000khhhhhhhhhhhh
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0000000dddadddadddadddaddadddadddadddadddaddd00000
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEEEE   0000000daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEEEE   0000000daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEEEE   0000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00000
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEEEE   0000000daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
EEEEEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEEEE   0000000daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
EEEEEEEEPPcccccccccccccccccccccccccccccccccPPEEEEE   0000000daa00000000000000000000000000000000aad00000
EEEEEEEEPPcccccccccccccccccccccccccccccccccPPEEEEE   0000000aaa00000000000000000000000000000000aaa00000
EEEEEEEEPPcccMMWWMMWWMMWWMMWWMMWWMMWWMMMcccPPEEEEE   0000000daa00wwwtwwwtwwwtwwwtwwwtwwwtwzzz00aad00000
EEEEEEEEPPcccWWWWWWWWWWWWWWWWWWWWWWWWWYYcccPPEEEEE   0000000daa00wttttttttttttttttttttttttzwz00aad00000
EEEEEEEEPPcccWWWWWWWWWWWWWWWWWWWWWWWWWMMcccPPEEEEE   0000000daa00wttttttttttttttttttttttttzzz00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttt00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttt00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00tttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttt00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00tttssssssssssssssssssssssttt00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00tttssssssssssssssssssssssttt00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00wttssssssssssssssssssssssttw00aad00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEPPcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccPPEEEEE   0000000daa00tttssssssssssssssssssssssttt00aad00000
EEEMMZZMZMcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccMMZZMZZ   00kkkhkkkk00wttttttttttttttttttttttttttw00kkkhkkhh
EEEZZZZZZZcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccZZZZZZZ   00khhhhhhk00wttttttttttttttttttttttttttw00khhhhhhh
EEEZZZZZZZcccMMWcMMWcMMWnMnMWnMMWcMMWcMMcccZZZZZZZ   00khhhhhhk00wwwtwwwtwwwtwwwwtwwwtwwwtwww00khhhhhhh
EEEZZZZZZZcccccccccccccnnnnnnncccccccccccccZZZZZZZ   00hhhhhhhh00000000000000000000000000000000hhhhhhhh
EEEZZZZZZZcccccccccccccnnnnnnncccccccccccccZZZZZZZ   00khhhhhhk00000000000000000000000000000000khhhhhhh
EEEZZZZZZZMZZMMPPPPPPPNMGMGGMMNPPPPPPPMMZZZZZZZZZZ   00khhhhhhhkhkkkaaaaaaaooooloooaaaaaaakkkhkkhhhhhhh
EEEZZZZZZZZZZZZPPPPPPPNGGGGGGGNPPPPPPPZZZZZZZZZZZZ   00khhhhhhhhhhhkaaaaaaaolllllloaaaaaaakhhhhhhhhhhhh
EEEZZZZZZZZZZZZPPPPPPPNMrMGrMMEPPPPPPPZZZZZZZZZZZZ   00hhhhhhhhhhhhkaaaaaaaooooloooaaaaaaakhhhhhhhhhhhh
EEEZZZZZZZZZZZZEEEEEEEErrrrrrrEEEEEEEEZZZZZZZZZZZZ   00khhhhhhhhhhhh0000000000000000000000hhhhhhhhhhhhh
EEEZZZZZZZZZZZZEEEEEEEErrrrrrrEEEEEEEEZZZZZZZZZZZZ   00khhhhhhhhhhhk0000000000000000000000khhhhhhhhhhhh
```
How much the plans of the seeds differ: 0.16 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 140 nodi, 658 passi, finito in 699 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald, h=honey, w=white, s=slate, x=x, c=cortile, W=intonaco del mastio, t=teal, d=dead, dark, n=selciato, G=mattoni della torre-porta, r=strada, m=magenta, p=purple, z=z, g=green, f=assi del pavimento, F=solaio, u=blue, L=finestra, O=porta, o=assi della porta, N=stipiti, T=striscia della scala, k=gradini, Y=pietra della torretta, P=pietra della cinta, Z=pietra delle torri, M=merli, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: Z 92832, P 77520, W 58781, E 7450, o 6510, c 5775, F 3890, U 3450, L 2944, k 2720, M 2550, G 2472, f 2025, Y 1771, N 1005, O 240, n 225, r 225.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-36 all×26, prl×3, one×2: 671 celle x1-27 y2-29 z0, passi 2-56
   #42 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 57
#44-45 all×2: 36000 celle x50-104 y55-109 z0-20, passi 58-77
#46-47 all×2: 32400 celle x50-104 y55-109 z20-38, passi 78-95
    #48 all . w → w u passi=14: ×14, 25200 celle x50-104 y55-109 z38-52, passi 96-109, w→u 12600, .→w 12600
    #49 all . w → w W passi=13: ×13, 23400 celle x50-104 y55-109 z52-65, passi 110-122, w→W 11700, .→w 11700
#50-57 prl×3, all×5: 18800 celle x50-104 y55-109 z0-72, passi 123-264
    #58 all . h → h . passi=31: ×31, 113150 celle x55-99 y60-104 z1-32, passi 265-295, h→. 56575, .→h 56575
#59-60 all×2: 16050 celle x55-99 y60-104 z2-33, passi 296-326
    #61 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-64, passi 327-357, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
    #62 prl h → F (+1): ×1, 2025 celle x55-99 y60-104 z64, passi 358, h→F 1825, s→F 200
      r1 h → F ×1825; r2 s → F ×200
    #63 all . p → p P passi=23: ×23, 149500 celle x15-129 y20-134 z0-23, passi 359-381, p→P 74750, .→p 74750
    #64 prl p → P: ×1, 3250 celle x15-129 y20-134 z23, passi 382, p→P 3250
    #65 all . z → z Z passi=39: ×39, 187200 celle x5-139 y10-144 z0-39, passi 383-421, z→Z 93600, .→z 93600
#66-73 prl×2, all×3, one×1: 19894 celle x5-139 y10-144 z0-51, passi 422-486
    #74 prl u → W: ×1, 22256 celle x50-104 y55-109 z6-51, passi 487, u→W 22256
#81-140 all×20, prl×6: 36945 celle x5-139 y10-144 z0-78, passi 488-658
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/h → h/* passi=1
#37 one ccc/ccc/ccc → ***/*Q*/*** passi=1 [campo Q da r su cnr]: le regole combaciavano, ma ogni applicazione portava dove un potenziale è -1
#38 all cWWEEEEE → ***aa*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#39 all [Wt]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#40 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#70 all . q → q V passi=5: in quel momento nella griglia non c'erano celle "q"
#71 prl q → V: in quel momento nella griglia non c'erano celle "q"
#76 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#77 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#78 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#79 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#80 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
… e altri 31
Fix it and answer with the whole program.

## Risposta

```xml
<!--
  FORTE. Parti e lettere del piano (una cella = 5 voxel):
  H centro; h sala del mastio; w muro del mastio; s zona della scala; x torretta d'angolo del mastio;
  c cortile; W cinta; t torri d'angolo (non tutti gli angoli); d porta del mastio; n selciato; G torre-porta;
  r strada; Q pozzo lontano dalla porta; a fossato fuori dalla cinta.
  I semi cambiano la lunghezza del mastio davanti e dietro, l'angolo della torretta e quali angoli hanno torri.
  Grande: mastio e cinta sottile. Enorme: cortile largo, cinta doppia, pozzo. Gigantesco: anche il fossato.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsxcWtdnGrQamK" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <all in="[wx]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cc*****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="cWEEEE" out="**W***" steps="1"/><all in="WE/*W" out="*W/**"/>
      <prl in="EE/EW" out="**/*t" p="0.65"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"><field for="Q" from="n" on="cn"/></one>
      <all in="cWWWEEEE" out="****aa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsxdpzgqfFWuLDOoNTkYPZGVAcnrMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="t" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qAAAq/qAAAq/qAAAq/qqqqq"/>
      <rule in="a" out="AAAAA/AAAAA/AAAAA/AAAAA/AAAAA"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w W" steps="13"/>
        <prl in="w" out="W"/>
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="64"/><prl in="d" out="W"/>
        <all in="B x" out="x Y" steps="72"/><prl in="x" out="Y"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <all in="B p" out="p P" steps="23"/><prl in="p" out="P"/>
        <all in="B z" out="z Z" steps="39"/><prl in="z" out="Z"/>
        <all in="B g" out="g O" steps="1"/><all in="B g" out="g G" steps="47"/><prl in="g" out="G"/>
        <all in="B q" out="q V" steps="5"/><prl in="q" out="V"/>
        <one steps="14"><rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="W"/>
        <union symbol="+" values="WYPZG"/>
        <union symbol="%" values="YPZG"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="W" value="d8ccb0" name="intonaco del mastio"/>
  <color symbol="L" value="2e3a4a" name="finestra"/>
  <color symbol="Y" value="6e675e" name="pietra della torretta"/>
  <color symbol="P" value="a8a090" name="pietra della cinta"/>
  <color symbol="Z" value="857d72" name="pietra delle torri"/>
  <color symbol="G" value="9a3c2c" name="mattoni della torre-porta"/>
  <color symbol="M" value="bdb5a4" name="merli"/>
  <color symbol="U" value="1e1e22" name="feritoia"/>
  <color symbol="f" value="a0703c" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7a6a58" name="solaio"/>
  <color symbol="k" value="8a5a30" name="gradini"/>
  <color symbol="O" value="6a4428" name="porta"/>
  <color symbol="o" value="3e2614" name="assi della porta"/>
  <color symbol="N" value="4a4038" name="stipiti"/>
  <color symbol="V" value="9c948a" name="parapetto del pozzo"/>
  <color symbol="A" value="4a7aa8" name="acqua"/>
  <color symbol="c" value="9cae6a" name="cortile" area="courtyard"/>
  <color symbol="n" value="c8b890" name="selciato" area="courtyard"/>
  <color symbol="r" value="b8a070" name="strada"/>
  <color symbol="T" value="a0703c" name="striscia della scala"/>
  <color symbol="#20" value="6a4428" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="3e2614" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
