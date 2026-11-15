# model.sculpt · claude-sonnet-5-5 · 48 s

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
  <map scale="1/5 1/5 1" values="BHEwhavcdnmpqfgytQs" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <prl in="E/a" out="a/*" p="0.5" steps="1" symmetry="()"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/n" symmetry="()"/>
      <all in="n/E" out="*/n" symmetry="()"/>
      <all in="d/n" out="*/p" symmetry="()"/>
      <all in="p/n" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*q" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all steps="1"><rule in="[wvpq]E" out="*c"/><rule in="[wvpq]*/*E" out="**/*c"/></all>
      <all steps="2"><rule in="cE" out="*c"/><rule in="c*/*E" out="**/*c"/></all>
      <one in="cc/cc/ww" out="yy/yy/**" symmetry="()" steps="2"/>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <one in="ccc/ccc/ccc" out="***/*t*/***" steps="2"/>
      <all steps="1"><rule in="cE" out="*f"/><rule in="c*/*E" out="**/*f"/></all>
      <all in="fEEEEEEE" out="*ggggggg" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwWUuLRZFTsxONoakAvVcnpPXYJfKlyQjGCk#90#91#92" symmetry="()">
      <union symbol="+" values="WUu"/>
      <union symbol="=" values="ZFA"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="q" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="g" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="t" out="ccccc/cKKKc/cKKKc/cKKKc/ccccc"/>
      <rule in="Q" out="QQQQQ/QjjjQ/QjjjQ/QjjjQ/QQQQQ"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <sequence symmetry="(xy)">
        <all in="B O" out="x *" steps="1" symmetry="()"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B x" out="x W" steps="63"/>
        <all in="B v" out="v V" steps="40"/>
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <all steps="1"><rule in="B h" out="h Z"/><rule in="B s" out="s Z"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="w" out="R"/><rule in="x" out="R"/><rule in="v" out="R"/><rule in="a" out="R"/></prl>
        <all in="B p" out="Y *" steps="1" symmetry="()"/>
        <all in="B P" out="P X" steps="34"/>
        <all in="B Y" out="Y B" steps="33"/>
        <prl><rule in="Y" out="J"/><rule in="P" out="J"/></prl>
        <all in="B f" out="f f" steps="5"/>
        <all in="B y" out="y y" steps="7"/>
        <all in="B Q" out="Q Q" steps="6"/>
        <all in="B G" out="G G" steps="1"/>
        <all in="B K" out="K K" steps="8"/>
        <all in="B K" out="l *" steps="1"/>
        <all in="lB" out="*l" steps="1"/>
        <all in="B l" out="l l" steps="5"/>
        <import file="part-stair"/>
        <one in="UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB" out="L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L*" steps="7"/>
        <one in="uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB" out="L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L*" steps="7"/>
        <all in="LUUUUB" out="*LLLL*"/>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="U" out="W"/><prl in="u" out="W"/>
        <import file="part-door"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="BBB/BBB/BBB RRR/RRR/RRR" out="CCC/CCC/CCC ***/***/***" steps="1" symmetry="()"/>
        <all in="B C" out="C C" steps="11"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="7BA05B" name="erba" hidden="True"/>
  <color symbol="H" value="C9A66B" name="centro"/>
  <color symbol="h" value="C9A66B" name="casa"/>
  <color symbol="w" value="E8DCC0" name="muro"/>
  <color symbol="a" value="B5895A" name="fienile"/>
  <color symbol="v" value="9C6B43" name="muro fienile"/>
  <color symbol="c" value="A9C27A" name="aia" area="yard"/>
  <color symbol="d" value="8B5A2B" name="porta"/>
  <color symbol="n" value="B8B0A0" name="lastrico" area="yard"/>
  <color symbol="m" value="B8B0A0" name="sentiero"/>
  <color symbol="p" value="C9B58A" name="portico" area="porch"/>
  <color symbol="q" value="6B4A2B" name="palo portico"/>
  <color symbol="f" value="6B4A2B" name="recinto" area="field"/>
  <color symbol="g" value="7A5A33" name="campo"/>
  <color symbol="y" value="D8B94A" name="fieno" area="barn"/>
  <color symbol="t" value="3F7A3A" name="albero"/>
  <color symbol="Q" value="8A8F94" name="pozzo" area="yard"/>
  <color symbol="s" value="C9A66B" name="scala"/>
  <color symbol="W" value="E8DCC0" name="intonaco" area="house"/>
  <color symbol="U" value="E8DCC0" name="fascia bassa"/>
  <color symbol="u" value="E8DCC0" name="fascia alta"/>
  <color symbol="L" value="7FB2D6" name="vetro"/>
  <color symbol="R" value="B5523B" name="tegole"/>
  <color symbol="Z" value="9C6B3C" name="assi" area="house"/>
  <color symbol="F" value="B8B0A0" name="solaio"/>
  <color symbol="T" value="000000" name="segno scala" hidden="True"/>
  <color symbol="k" value="C9B58A" name="gradini"/>
  <color symbol="x" value="E8DCC0" name="testa porta" hidden="True"/>
  <color symbol="O" value="8B5A2B" name="porta" area="house"/>
  <color symbol="o" value="5A3A1E" name="assi porta"/>
  <color symbol="N" value="4A3A2A" name="stipite"/>
  <color symbol="A" value="D9B85A" name="paglia" area="barn"/>
  <color symbol="V" value="9C6B43" name="legno fienile" area="barn"/>
  <color symbol="P" value="6B4A2B" name="testa palo" hidden="True"/>
  <color symbol="X" value="6B4A2B" name="palo" area="porch"/>
  <color symbol="Y" value="000000" name="segno tettoia" hidden="True"/>
  <color symbol="J" value="A8483A" name="tettoia"/>
  <color symbol="K" value="5A3A1E" name="tronco" area="orchard"/>
  <color symbol="l" value="3F7A3A" name="fogliame"/>
  <color symbol="j" value="5A7FA8" name="acqua" area="yard"/>
  <color symbol="G" value="7A5A33" name="solchi" area="field"/>
  <color symbol="C" value="8C4A3A" name="comignolo"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: varietà: alla taglia Gargantuesca 24 tipi di parti e 48 parti, alla Enorme 24 e 49: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 62 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at gargantuan: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c aia, n lastrico, p portico, f recinto, y fieno, Q pozzo, W intonaco, L vetro, R tegole, Z assi, F solaio, O porta, N stipite, o assi porta, k gradini, A paglia, V legno fienile, X palo, J tettoia, K tronco, l fogliame, j acqua, G solchi, C comignolo
Plan (the letter on top of every column):
```
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEEEEE
EEEGGGGGGGffffffffffffffffffffffffffffffffEEEEEEEE
EEEGGGGGGGffccccccccccccccccccccccccccccffEEEEEEEE
EEEGGGGGGGffccccccccccccccccccccccccccccffEEEEEEEE
EEEfffffffffcccccccccccyyyycccyyyccccjccffEEEEEEEE
EEEffffffffccccccccccccyyyycccyyyccccjccffEEEEEEEE
EEEffccccccccccccccccccyyyycccyyycccccccffEEEEEEEE
EEEffcccccccccccRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccccccccRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccccccccRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcclccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRCRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcclccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcclccRRRRRRRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccccccccRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccccccccRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccccccccRRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffccccccccccccRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE
EEEffcccccccccccccccccJJJJJJJJccccccccccffEEEEEEEE
EEEfffffffffccccccccccJJJJJJJJccccccccccffEEEEEEEE
EEEEffffffffccccccccccJJJJJJJJccccccccccffEEEEEEEE
EEEEEEEEEEffcccccccccccnnnnnccccccccccccffEEEEEEEE
EEEEEEEEEEffffffcccccccnnnnncccccccfffffffEEEEEEEE
EEEEEEEEEEfffffffccccccnnnnncccccccfffffffEEEEEEEE
EEEGGGGGGGGGGGGffccccccnnnnncccccccffGGGGGGGGGGGEE
EEEGGGGGGGGGGGGffccccccnnnnncccccccffGGGGGGGGGGGEE
EEEGGGGGGGGGGGGffffffffnnnnnfffffffffGGGGGGGGGGGEE
EEEEEEEEEEEEEEEEEEEEEEEnnnnnEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEnnnnnEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000001111111111111111111111111111111100000000
00000000001111111111111111111111111111111100000000
00000000001111111111111111111111111111111100000000
00000000001100000000000000000000000000001100000000
00011111111100000000000222200022220022201100000000
00011111111100000000000222200022220022201100000000
00011000000000000000000222200022220000001100000000
0001100000000000jjjjjjjjjjjjjjjjjjjj00001100000000
0001100000000000jjjjjjjjjjjjjjjjjjjj00001100000000
0001100000000000jjkkkkkkkkkkkkkkkkjj00001100000000
000110040cccccccjjkkkkkkkkkkkkkkkkjj00001100000000
000110444cccccccjjkkllllllllllllkkjj00001100000000
000110040ccddddcjjkkllllllllllllkkjj00001100000000
000110000ccddddcjjkkllmmmmmmmmllkkjj00001100000000
000110000ccddddcjjkkllmmmmmmmmllkkjj00001100000000
000110000ccddddcjjkkllmmmmmmmmllkkjj00001100000000
000110000ccddddcjjkkllmmmmmmmmllkkjj00001100000000
000110000ccddddcjjkkllmmmmpmmmllkkjj00001100000000
000110000ccddddcjjkkllmmmmpmmmllkkjj00001100000000
000110000ccddddcjjkkllmmmmmmmmllkkjj00001100000000
000110000ccddddcjjkkllmmmmmmmmllkkjj00001100000000
000110000ccddddcjjkkllmmmmmmmmllkkjj00001100000000
000110444ccddddcjjkkllllllllllllkkjj00001100000000
000110444cccccccjjkkllllllllllllkkjj00001100000000
0001100000ccccccjjkkkkkkkkkkkkkkkkjj00001100000000
0001100000000000jjkkkkkkkkkkkkkkkkjj00001100000000
0001100000000000jjjjjjjjjjjjjjjjjjjj00001100000000
0001100000000000jjjjjjjjjjjjjjjjjjjj00001100000000
000110000000000000000aaaaaaaaa00000000001100000000
000111111111000000000aaaaaaaaa00000000001100000000
000111111111000000000aaaaaaaaa00000000001100000000
00000000001100000000000000000000000000001100000000
00000000001111111000000000000000000111111100000000
00000000001111111000000000000000000111111100000000
00000000000000011000000000000000000110000000000000
00000000000000011111111100001111111110000000000000
00000000000000011111111100001111111110000000000000
00000000000000011111111100001111111110000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
..........................C.......................
..........................C.......................
..........................C.......................
..........................C.......................
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWLWW...............
............RRR..WWWWWWWWWWWWWWLLWW...............
..........RRRRRRWWWWWWWWWWWWWWWLLWW...............
..........VVVVVVVWWWWWWWWWWWWWWWWWW...............
..........VVVVVVVWWWWWXWWWWWWWWWWWW...............
..........VVVVVVVWWWWWXWWWWWWXWWWWW...............
..........VVVVVVVWWWWWXNooooOXWWWWW...............
..........VVVVVVVWWWWWXNooooOXWWWWW...............
..........VVVVVVVWWWWWXNooooOXWWWWW...............
..........VVVVVVVWWWWWXNooooOXWWWWW...............
..........VVVVVVVWWWWWXNooooOXWWWWW...............
.......l..VVVVVVVWWWWWXNooooOXLWWWW...............
.......l..VVVVVVVWWWWWXNooooOXLWWWW...............
.......K..VVVVVVVWWWWWXNooooOXWWWWW...............
...fffffffffffffffffffffooooffffffffffffff........
...EEEEEEEEEEEEffffffffnoooofffffffffEEEEEEEEEEE..
```
Right side (looking from the right):
```
............................C.....................
............................C.....................
............................C.....................
............................C.....................
........................RRRRRRRRR.................
......................RRRRRRRRRRRRR...............
....................RRRRRRRRRRRRRRRRR.............
..................RRRRRRRRRRRRRRRRRRRR............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWW............
..................WWWWWWWWWWWWWWWWWWWWWJJ.........
..................WWWWWWWWWWWWWWWWWWWWWXX.........
..................WWWWWWWWWWWWWWWWWWWWWXX.........
..................WWWWWWWWWWWWWWWWWWWWWXX.........
..................WWWWWWWWWWWWWWWWWWWWWXX.........
..................WWWWWWWWWWWWWWWWWWWWWXX.........
..................WWWWWWWWWWLLWLLWWWWWWXX.........
..................WWWWWWWWWWLLWLLWLLWWWXX.........
..................WWWWWWWWWWLLWLWWLLWWWXX.........
...............QyyWWWWWWWWWWWWWWWWWWWWWXX.........
............ffffffffffffffffffffffffffffffffffff..
EEEEEEEEEEEEfffffffffffffffffffffffffffffffffEEEE.
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
..................................................
..................................................
..................................................
.................WWWWWWWWWWLLWWWWWW...............
.................WWWWWWWWWWLLWWWWWW...............
.................W.....kkkk......WW...............
................WW.....kkkk......WW...............
.......l..VVVVVVVW.....kkkk......WW...............
..........VV...VVW...............WW...............
..........VV...VVW...............WW...............
..........VV.....W...............WW...............
..........VV.....W...............WW...............
..........VV.....W...............WW...............
..........VV.....W...............LL...............
..........VV.....W...............LL...............
..........VV.....W...............WW...............
..........VV.....W...............LL...............
..........VV.....W...............LL...............
.......l..VVVVVVVW...............WW...............
.......l..VVVVVVVW...............LL...............
.................L...............LL...............
.................WW..............WW...............
.................WWWWWWooooooLLWWWW...............
......................W......L....................
......................X...........................
......................X...........................
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
..................................................
..................................................
..................................................
..................................................
..................................................
.................WWWWLLWWLLLLLWWWWW...............
.................WWWWLLWWLLLLLWWWWW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
............RR...W...............WW...............
............RRR..W...............WW...............
............RRR..W...............WW...............
............RRR..W...............WW...............
............RRR..W...............WW...............
............RRR..W...............WW...............
............RRR..W...............WW...............
............RRR..W...............WW...............
............RRR..W...............WW...............
............RRR..L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................W...............WW...............
.................WW..............WW...............
.................WWWWWWWWWWWWWWLLWW...............
..................................................
..................................................
..................................................
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
..........................C.......................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
EEEEEEEEEEGGGGGGGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGffffffffffffffffffffff   00000000000000000000000000001111111111111111111111
EEEEEEEEEEGGGGGGGGGGGGGGGGGGffffffffffffffffffffff   00000000000000000000000000001111111111111111111111
EEEEEEEEEEGGGGGGGGGGGGGGGGGGffccccccccccccccccccff   00000000000000000000000000001100000000000000000011
EEEEEEEEEEGGGGGGGGGGGGGGGGGGffccccccccccccccccccff   00000000001111111111111111111100000000000000000011
EEEEEEEEEEffffffffffffffffffffccccccccccccccccccff   00000000001111111111111111111100000000000000000011
EEEEEEEEEEffccccccccccccccccccccccccccccccccccccff   00000000001111111111111111111100000000000000000011
EEEEEEEEEEffccccccccccccccccccccccccccccccccccccff   00000000001100000000000000000000000ccccccccc000011
EEEEEEEEEEffcccccyyycccyyyyccccccccRRRRRRRRRccccff   0000000000110000222200022220000000cccccccccc000011
EEEEEEEEEEffcccccyyycccyyyyccccccccRRRRRRRRRccccff   0000000000110000222200022220000000ccddddddcc000011
EEEEEEEEEEffcccccyyycccyyyyccccccccRRRRRRRRRccccff   0000000000110000222200022220000000ccddddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjjjjjjjjjjjjjjjjjjjddddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjjjjjjjjjjjjjjjjjjjcdddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjkkkkkkkkkkkkkkkkjjcdddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjkkkkkkkkkkkkkkkkjjcdddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjkkllllllllllllkkjjcdddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjkkllllllllllllkkjjcdddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjkkllmmmmmmmmllkkjjcdddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjkkllmmmmmmmmllkkjjcdddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccff   0000000000110000jjkkllmmmmmmmmllkkjjcdddddcc000011
EEEEEEEEEEffccccRRRRRRRRRRCRRRRRRRRRRRRRRRRRccccff   0000000000110000jjkkllmmmmppmmllkkjjcccccccc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccff   0000000000110000jjkkllmmmmmmmmllkkjjcccccccc000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcccccccccccccff   0000000000110000jjkkllmmmmmmmmllkkjj00000000000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRccccccclcccccff   0000000000110000jjkkllmmmmmmmmllkkjj00000444000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRccccccclcccccff   0000000000110000jjkkllmmmmmmmmllkkjj00000444000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcccccccccccccff   0000000000110000jjkkllmmmmmmmmllkkjj00000000000011
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcccccffffffffff   0000000000110000jjkkllllllllllllkkjj00001111111111
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcccccffffffffff   0000000000110000jjkkllllllllllllkkjj00001111111111
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcccccffGGGGGGGG   0000000000110000jjkkkkkkkkkkkkkkkkjj00001100000000
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcccccffGGGGGGGG   0000000000110000jjkkkkkkkkkkkkkkkkjj00001100000000
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcccccffGGGGGGGG   0000000000110000jjjjjjjjjjjjjjjjjjjj00001100000000
EEEEEEEEEEffcccccRRRRRRRRRRRRRRRRRRcccccffGGGGGGGG   0000000000110000jjjjjjjjjjjjjjjjjjjj00001100000000
EEEEEEEEEEffccccccccccJJJJJJJJccccccccccffGGGGGGGG   000000000011000000000aaaaaaaaa00000000001100000000
EEEEEEEEEEffcccllcccccJJJJJJJJccjcccccccffGGGGGGGG   000000000011000440000aaaaaaaaa02220000001100000000
EEEEEEEEEEffccclccccccJJJJJJJJccjcccccccffGGGGGGGG   000000000011000440000aaaaaaaaa02220000001100000000
EEEEEEEEEEffcccccccccccnnnnnccccccccccccffGGGGGGGG   00000000001100000000000000000000000000001100000000
EEEEEEEEEEffffffcccccccnnnnncccccccfffffffGGGGGGGG   00000000001111111000000000000000000111111100000000
EEEEEEEEEEfffffffccccccnnnnncccccccfffffffGGGGGGGG   00000000001111111000000000000000000111111100000000
EEEGGGGGGGGGGGGffccccccnnnnncccccccffEEEEEGGGGGGGG   00000000000000011000000000000000000110000000000000
EEEGGGGGGGGGGGGffccccccnnnnncccccccffEEEEGGGGGGGGG   00000000000000011111111100001111111110000000000000
EEEGGGGGGGGGGGGffffffffnnnnnfffffffffGGGGGGGGGGGEE   00000000000000011111111100001111111110000000000000
EEEEEEEEEEEEEEEEEEEEEEEnnnnnEEEEEEEEEEEEEEEEEEEEEE   00000000000000011111111100001111111110000000000000
EEEEEEEEEEEEEEEEEEEEEEEnnnnnEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEE   00000000001111111111111111111111111111111111111110
EEEEEEEEEEffffffffffffffffffffffffffffffffffffffEE   00000000001111111111111111111111111111111111111110
EEEEEEEEEEffccccccccccccccccccccccccccccccccccffEE   00000000001111111111111111111111111111111111111110
EEEEEEEEEEffcccccccccccccccccccccccccccccccccccfEE   00000000001100000000000000000000000000000000001110
EEEEEEEEEEffccccccccccyyycccccyyyccccccccccccccfEE   00000000001100000000022220000022220000000000001110
EEEEEEEEEEffccccccccccyyycccccyyyccccccccccccccfEE   00000000001100000000022220000022220000000002201110
EEEEEEEEEEffccccccccccyyycccccyyycccccccccccjccfEE   00000000001100000000022220000022220000000002201110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjjjjjjjjjjjjjjjjjjjcccccc02201110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjjjjjjjjjjjjjjjjjjjcccccc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkkkkkkkkkkkkkkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkkkkkkkkkkkkkkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllllllllllllkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllllllllllllkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllmmmmmmmmllkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllmmmmmmmmllkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllmmmmmmmmllkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllmppmmmmmllkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllmppmmmmmllkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllmmmmmmmmllkkjjcdddcc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllmmmmmmmmllkkjjcccccc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRRRRRRRRcccccfEE   0000000000110000jjkkllmmmmmmmmllkkjjcccccc00001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRccccccccccccfEE   0000000000110000jjkkllmmmmmmmmllkkjj00000000001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRccccccccccccfEE   0000000000110000jjkkllllllllllllkkjj00000000001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRccccccccccccfEE   0000000000110000jjkkllllllllllllkkjj00000000001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRccccccccccccfEE   0000000000110000jjkkkkkkkkkkkkkkkkjj00000000001110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcccccccccccffEE   0000000000110000jjkkkkkkkkkkkkkkkkjj04001111111110
EEEEEEEEEEffccccRRRRRRRRRRRRRRRRRRRcclccffffffffEE   0000000000110000jjjjjjjjjjjjjjjjjjjj44401111111110
EEEEEEEEEEffcccccRRRRRRRRRRRRRRRRRRcccccffEEEEEEEE   0000000000110000jjjjjjjjjjjjjjjjjjjj04001111111110
EEEEEEEEEEffccccccccccJJJJJJJJccccccccccffEEEEEEEE   000000000011000000000aaaaaaaaa00000000001100000000
EEEEEEEEEEffccccccccccJJJJJJJJccccccccccffEEEEEEEE   000000000011000000000aaaaaaaaa00000000001100000000
EEEEEEEEEEffccccccccccJJJJJJJJccccccccccffEEEEEEEE   000000000011000000000aaaaaaaaa00400000001100000000
EEEEEEEEEEffcccccccccccnnnnncccclcccccccffEEEEEEEE   00000000001100000000000000000004440000001100000000
EEEEEEEEEEffffffcccccccnnnnncccccccfffffffEEEEEEEE   00000000001111111000000000000000400111111100000000
EEEEEEEEEEfffffffccccccnnnnncccccccfffffffEEEEEEEE   00000000001111111000000000000000000111111100000000
EEEGGGGGGGGGGGGffccccccnnnnncccccccffGGGGGGGGGGGEE   00000000000000011000000000000000000110000000000000
EEEGGGGGGGGGGGGffccccccnnnnncccccccffGGGGGGGGGGGEE   00000000000000011111111100001111111110000000000000
EEEGGGGGGGGGGGGffffffffnnnnnfffffffffGGGGGGGGGGGEE   00000000000000011111111100001111111110000000000000
EEEEEEEEEEEEEEEEEEEEEEEnnnnnEEEEEEEEEEEEEEEEEEEEEE   00000000000000011111111100001111111110000000000000
EEEEEEEEEEEEEEEEEEEEEEEnnnnnEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.37 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 200×200×160, 119 nodi, 640 passi, finito in 1008 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=erba (marcatore), w=muro, h=casa, a=fienile, v=muro fienile, c=aia, d=porta, n=lastrico, m=sentiero, p=portico, q=palo portico, f=recinto, g=campo, y=fieno, t=albero, Q=pozzo, s=scala, W=intonaco, U=fascia bassa, u=fascia alta, L=vetro, R=tegole, Z=assi, F=solaio, T=segno scala (marcatore), x=testa porta (marcatore), O=porta, N=stipite, o=assi porta, k=gradini, A=paglia, V=legno fienile, P=testa palo (marcatore), X=palo, Y=segno tettoia (marcatore), J=tettoia, K=tronco, l=fogliame, G=solchi, C=comignolo, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 61471, G 23450, R 21240, E 16075, V 15000, f 12450, c 4782, L 3144, k 2720, Z 2250, o 2130, F 2090, y 1600, X 1224, n 750, A 425, N 335, l 252, J 250, p 214, K 162, O 120, Q 112, C 108, j 9.
  #3 map scala 1/5 1/5 1: ×1, 1600 celle x0-39 y0-39 z0-159, passi 1
#5-36 all×22, prl×3, one×5: 996 celle x0-36 y5-39 z0, passi 2-61
   #38 map scala 5 5 1: ×1, 40000 celle x0-199 y0-199 z0-159, passi 62
#40-41 all×2: 11775 celle x75-129 y80-139 z0-6, passi 63-69
    #42 all . w → w U passi=14: ×14, 27300 celle x75-129 y80-139 z6-20, passi 70-83, w→U 13650, .→w 13650
#43-44 all×2: 35100 celle x75-129 y80-139 z20-38, passi 84-101
    #45 all . w → w u passi=14: ×14, 27300 celle x75-129 y80-139 z38-52, passi 102-115, w→u 13650, .→w 13650
#46-47 all×2: 32850 celle x75-129 y80-139 z1-64, passi 116-190
#48-49 all×2: 30850 celle x55-74 y90-129 z0-40, passi 191-231
    #50 all . a → a . passi=39: ×39, 33150 celle x60-74 y95-124 z1-40, passi 232-270, a→. 16575, .→a 16575
#51-52 all×2: 4900 celle x80-124 y85-134 z0-2, passi 271-272
    #53 all . h → h . passi=31: ×31, 127100 celle x80-124 y85-134 z1-32, passi 273-303, h→. 63550, .→h 63550
#54-55 all×2: 16500 celle x80-124 y85-134 z2-33, passi 304-334
    #56 all . h → h . (+1) passi=31: ×31, 139500 celle x80-124 y85-134 z33-64, passi 335-365, h→. 63550, .→h 63550, s→. 6200, .→s 6200
      r1 . h → h . ×63550; r2 . s → s . ×6200
#57-60 prl×1, all×3: 20886 celle x55-129 y80-149 z0-64, passi 366-434
#61-65 prl×1, all×4: 23846 celle x0-184 y25-194 z1-34, passi 435-454
#66-104 all×15, prl×5, one×2: 29032 celle x65-129 y75-149 z1-51, passi 455-584
#105-119 prl×1, all×7, one×1: 33882 celle x54-130 y79-140 z0-86, passi 585-640
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/h → h/* passi=1
#14 prl aE → *a passi=1
#71 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#72 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#73 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#74 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#75 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#76 all . I → I * passi=30: in quel momento nella griglia non c'erano celle "I"
#77 all . I → #95 * passi=1: in quel momento nella griglia non c'erano celle "I"
#78 all . #95 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#79 all . I → I * passi=29: in quel momento nella griglia non c'erano celle "I"
#80 all . I → S * passi=1: in quel momento nella griglia non c'erano celle "I"
… e altri 11
Fix it and answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEwhavcdnmpqfgytQsr" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <prl in="E/a" out="a/*" p="0.5" steps="1" symmetry="()"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/n" symmetry="()"/>
      <all in="n/E" out="*/n" symmetry="()"/>
      <all in="d/n" out="*/p" symmetry="()"/>
      <all in="p/n" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*q" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all steps="1"><rule in="[wvpq]E" out="*c"/><rule in="[wvpq]*/*E" out="**/*c"/></all>
      <all steps="2"><rule in="cE" out="*c"/><rule in="c*/*E" out="**/*c"/></all>
      <one in="cc/cc/ww" out="yy/yy/**" symmetry="()" steps="2"/>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <one in="ccc/ccc/ccc" out="***/*t*/***" steps="2"/>
      <all steps="1"><rule in="cE" out="*f"/><rule in="c*/*E" out="**/*f"/></all>
      <all in="EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE" out="*********/*********/*********/***rrr***/***rrr***/***rrr***/*********/*********/*********" symmetry="()"/>
      <all in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" symmetry="()"/>
      <all in="fEEEEEEE" out="*ggggggg" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwWUuLRZFTsxONoakAvVcnpPXYJfKlyQjGCkr#90#91#92" symmetry="()">
      <union symbol="+" values="WUu"/>
      <union symbol="=" values="ZFA"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="q" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="g" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="t" out="ccccc/cKKKc/cKKKc/cKKKc/ccccc"/>
      <rule in="Q" out="QQQQQ/QjjjQ/QjjjQ/QjjjQ/QQQQQ"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <sequence symmetry="(xy)">
        <all in="B O" out="x *" steps="1" symmetry="()"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B x" out="x W" steps="63"/>
        <all in="B v" out="v V" steps="40"/>
        <all in="B r" out="r V" steps="26"/>
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <all steps="1"><rule in="B h" out="h Z"/><rule in="B s" out="s Z"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="w" out="R"/><rule in="x" out="R"/><rule in="v" out="R"/><rule in="a" out="R"/><rule in="r" out="R"/></prl>
        <all in="B p" out="Y *" steps="1" symmetry="()"/>
        <all in="B P" out="P X" steps="34"/>
        <all in="B Y" out="Y B" steps="33"/>
        <prl><rule in="Y" out="J"/><rule in="P" out="J"/></prl>
        <all in="B f" out="f f" steps="5"/>
        <all in="B y" out="y y" steps="7"/>
        <all in="B Q" out="Q Q" steps="6"/>
        <all in="B G" out="G G" steps="1"/>
        <all in="B K" out="K K" steps="8"/>
        <all in="B K" out="l *" steps="1"/>
        <all in="lB" out="*l" steps="1"/>
        <all in="B l" out="l l" steps="5"/>
        <import file="part-stair"/>
        <one in="UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB" out="L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L*" steps="7"/>
        <one in="uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB" out="L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L*" steps="7"/>
        <all in="LUUUUB" out="*LLLL*"/>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="U" out="W"/><prl in="u" out="W"/>
        <import file="part-door"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="BBB/BBB/BBB RRR/RRR/RRR" out="CCC/CCC/CCC ***/***/***" steps="1" symmetry="()"/>
        <all in="B C" out="C C" steps="11"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="7BA05B" name="erba" hidden="True"/>
  <color symbol="H" value="C9A66B" name="centro"/>
  <color symbol="h" value="C9A66B" name="casa"/>
  <color symbol="w" value="E8DCC0" name="muro"/>
  <color symbol="a" value="B5895A" name="fienile"/>
  <color symbol="v" value="9C6B43" name="muro fienile"/>
  <color symbol="c" value="A9C27A" name="aia" area="yard"/>
  <color symbol="d" value="8B5A2B" name="porta"/>
  <color symbol="n" value="B8B0A0" name="lastrico" area="yard"/>
  <color symbol="m" value="B8B0A0" name="sentiero"/>
  <color symbol="p" value="C9B58A" name="portico" area="porch"/>
  <color symbol="q" value="6B4A2B" name="palo portico"/>
  <color symbol="f" value="6B4A2B" name="recinto" area="field"/>
  <color symbol="g" value="7A5A33" name="campo"/>
  <color symbol="y" value="D8B94A" name="fieno" area="barn"/>
  <color symbol="t" value="3F7A3A" name="albero"/>
  <color symbol="Q" value="8A8F94" name="pozzo" area="yard"/>
  <color symbol="s" value="C9A66B" name="scala"/>
  <color symbol="r" value="9C6B43" name="granaio" area="granary"/>
  <color symbol="W" value="E8DCC0" name="intonaco" area="house"/>
  <color symbol="U" value="E8DCC0" name="fascia bassa"/>
  <color symbol="u" value="E8DCC0" name="fascia alta"/>
  <color symbol="L" value="7FB2D6" name="vetro"/>
  <color symbol="R" value="B5523B" name="tegole"/>
  <color symbol="Z" value="9C6B3C" name="assi" area="house"/>
  <color symbol="F" value="B8B0A0" name="solaio"/>
  <color symbol="T" value="000000" name="segno scala" hidden="True"/>
  <color symbol="k" value="C9B58A" name="gradini"/>
  <color symbol="x" value="E8DCC0" name="testa porta" hidden="True"/>
  <color symbol="O" value="8B5A2B" name="porta" area="house"/>
  <color symbol="o" value="5A3A1E" name="assi porta"/>
  <color symbol="N" value="4A3A2A" name="stipite"/>
  <color symbol="A" value="D9B85A" name="paglia" area="barn"/>
  <color symbol="V" value="9C6B43" name="legno fienile" area="barn"/>
  <color symbol="P" value="6B4A2B" name="testa palo" hidden="True"/>
  <color symbol="X" value="6B4A2B" name="palo" area="porch"/>
  <color symbol="Y" value="000000" name="segno tettoia" hidden="True"/>
  <color symbol="J" value="A8483A" name="tettoia"/>
  <color symbol="K" value="5A3A1E" name="tronco" area="orchard"/>
  <color symbol="l" value="3F7A3A" name="fogliame"/>
  <color symbol="j" value="5A7FA8" name="acqua" area="yard"/>
  <color symbol="G" value="7A5A33" name="solchi" area="field"/>
  <color symbol="C" value="8C4A3A" name="comignolo"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
