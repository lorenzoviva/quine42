# model.sculpt · gemini-4-hydrogen · 28 s

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
  Forte medievale:
  - Mastio (K mura, h interno, s zona scala, d porta del mastio) nella parte più lontana dall'ingresso, con 2 piani coperti (64 voxel) e tetto a padiglione (R).
  - Corte (c) intorno al mastio, con pavimentazione (n) dalla porta del mastio al corpo di guardia, e un pozzo (Q) dove c'è spazio (5x5).
  - Cinta muraria (W -> V) spessa 2 celle alta 24 attorno alla corte, con merli (M) e feritoie (U), torri angolari (t -> Z) di 5x5 alte 40, e corpo di guardia (G -> V) alto 36 sul fronte.
  - Strada (r) larga 3 celle dritta dal corpo di guardia fino al bordo anteriore.
  - Fossato (a) attorno alla cinta muraria dove il terreno prosegue oltre le mura.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKhsdcWtGnrQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Il mastio attorno a H: dimensioni variabili per seme -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <!-- Mura del mastio -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- 2. Zona della scala nel mastio: lungo il muro posteriore, 2 celle di pianerottolo, 4x2 di scala -->
      <one in="KKKKKKK/Khhhhhh/Khhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Corte attorno al mastio, poi espansione dove c'è terreno libero -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Cinta muraria spessa 2 celle attorno alla corte -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Via d'uscita dritta da H al bordo anteriore: porta d, lastricato n, corpo di guardia G, strada r (larga 3) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 7. Pozzo nella corte dove c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 8. Fossato oltre la cinta dove il terreno prosegue -->
      <all in="cWWEEEE" out="***aa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>

    <map scale="5 5 1" values="BEKhsdcWtGnrQawuLfFRVZTMOoNUk#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QaaaQ/QaaaQ/QaaaQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wVuZ"/>
        <union symbol="%" values="VZ"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze -->
        <!-- Mura del mastio (K -> w, u, R) alte 64 -->
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <prl in="K" out="R"/>

        <!-- Porta del mastio (d -> O alla base, w sopra fino a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Interno del mastio (h) e zona scala (s): 2 piani coperti -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Cinta muraria (W -> V) alta 24 -->
        <all in="B W" out="W V" steps="23"/>
        <prl in="W" out="V"/>

        <!-- Corpo di guardia (G -> O alla base, V sopra fino a 36) -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G V" steps="35"/>
        <prl in="G" out="V"/>

        <!-- Torri angolari (t -> Z) alte 40 -->
        <all in="B t" out="t Z" steps="39"/>
        <prl in="t" out="Z"/>

        <!-- Pozzo (Q) alto 4 -->
        <all in="B Q" out="Q V" steps="4"/>
        <prl in="Q" out="V"/>

        <!-- C. Scala reale: parti incluse, finestre, tetto, pulizia -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre del mastio -->
        <one steps="14">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="w"/>

        <!-- Tetto a padiglione del mastio (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6A7F4E" hidden="True"/>
  <color symbol="H" value="E6C229" hidden="True"/>
  <color symbol="w" value="7A7672" name="pietra del mastio" area="keep"/>
  <color symbol="V" value="8C8881" name="pietra della cinta" area="wall"/>
  <color symbol="Z" value="6E6A66" name="pietra della torre" area="tower"/>
  <color symbol="M" value="96918A" name="merlo"/>
  <color symbol="U" value="3A3632" name="feritoia"/>
  <color symbol="L" value="8AB4C9" name="vetro"/>
  <color symbol="f" value="A67C52" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="8F6843" name="solaio in legno" area="keep"/>
  <color symbol="k" value="B88E62" name="gradino"/>
  <color symbol="R" value="9E4738" name="tetto in tegole"/>
  <color symbol="O" value="5C3A21" name="porta" area="gatehouse"/>
  <color symbol="o" value="472C18" name="assi della porta" area="gatehouse"/>
  <color symbol="N" value="4A4642" name="stipite"/>
  <color symbol="c" value="B8A990" name="corte" area="courtyard"/>
  <color symbol="n" value="9E9589" name="lastricato" area="courtyard"/>
  <color symbol="r" value="8F816B" name="strada" area="road"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="moat"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="472C18" hidden="True"/>

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
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c corte, n lastricato, r strada, a fossato, w pietra del mastio, L vetro, f pavimento in legno, F solaio in legno, R tetto in tegole, V pietra della cinta, Z pietra della torre, M merlo, O porta, o assi della porta, N stipite, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
ZZEZEZZEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEZEZZZ
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZ
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZ
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaMZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMZZZZZZ
ZZZZZZZccccccccccccccccccccccccccccccccccccccZZZZZ
ZZZZZZMccccccccccccccccccccccccccccccccccccccMZZZZ
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE
EEEVVVVccccccccccccccccnnnnnccccccccccccMMcccVVVEE
EEEVVVVccccccccccccccccnnnnnccccccccccccMccccVVVEE
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE
ZZZZZZZccccccccccccccccnnnnncccccccccccccccccZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVMVVVncVVVVVVVVVVVVVVcZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVMVVVVVVVVVVVVVVVZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVNVVVVVVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVMVVVVMVVVVVVVVVVVVVVMZZZZZZ
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
dddbddddd0000000000000000000000000000000000ddbdddd
bbbbbbbbd0000000000000000000000000000000000dbbbbbb
bbbbbbbbb0000000000000000000000000000000000bbbbbbb
bbbbbbbbd7777777777777777777777777777777777dbbbbbb
bbbbbbbbd7777777777777777777777777777777777dbbbbbb
bbbbbbbbd7777777777777777777777777777777777dbbbbbb
bbbbbbbdd7777777777777777777777777777777777ddbbbbb
bbbbbbd00000000000000000000000000000000000000dbbbb
ddddbdd00000000000000000000000000000000000000ddddb
00077770000000000000000000000000000000000000077770
00077770000000000000000000000000000000000000077770
00077770000000000000000000000000000000000000077770
00077770000000000000000000000000000000000000077770
00077770000000000000000000000000000000000000077770
00077770000000000000000000000000000000000000077770
00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
00077770000000jjkklllllllllllllllkkjj0000000077770
00077770000000jjkklllllllllllllllkkjj0000000077770
00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
00077770000000jjkklllllllllllllllkkjj0000000077770
00077770000000jjkklllllllllllllllkkjj0000000077770
00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
000777700000000jjjjjjjjjjjjjjjjjjjjjj0003300077770
00077770000000000000000000000000000000003300077770
00077770000000000000000000000000000000000000077770
00077770000000000000000000000000000000000000077770
00077770000000000000000000000000000000000000077770
00077770000000000000000000000000000000000000077770
ddddbdd00000000000000000000000000000000000000ddddb
bbbbbbd00000000000000000000000000000000000000dbbbb
bbbbbbbdd77777777777777cccccc77777777777777ddbbbbb
bbbbbbbbd77777777777777bbbbbc77777777777777dbbbbbb
bbbbbbbbb77777777777777cbbbbb77777777777777bbbbbbb
bbbbbbbbd77777777777777ccbccc77777777777777dbbbbbb
bbbbbbbbd0000000000000000000000000000000000dbbbbbb
bbbbbbbbd0000000000000000000000000000000000dbbbbbb
bbbbbbbbd0000000000000000000000000000000000dbbbbbb
```
Front (looking from the front; the sky at the top):
```
.....................RRRRRRRRRR...................
...................RRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
...............RRRRRRRRRRRRRRRRRRRRRR.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwwwwwwwwwwwwwwwww.............
...............wwwwwwLLwwwwwwwwwwwwww.............
...............wwwwwwLLwwwwwwwwwwwwww.............
MMMMMMMM.......wwwwwwLLwwwwwwLLwwwwww......MMMMMMM
MMMMMMMM.......wwwwwwwwMMMMMMLLwwwwww......MMMMMMM
ZZZZZZZZ.......wwwwwwwwMMMMMwwwwwwwww......ZZZZZZZ
ZZZZZZZZ.......wwwwwwwwVVVVVwwwwwwwww......ZZZZZZZ
ZZZZZZZZ.......wwwwwwwwVVVVVwwwwwwwww......ZZZZZZZ
ZZZZZZZZ.......wwwwwwwwNooooOwwwwwwww......ZZZZZZZ
ZZZZZZZZ.......wwwwwwwwNooooOwwwwwwww......ZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVrooooEVVVVVVVVVVVVVVZZZZZZZ
```
Right side (looking from the right):
```
........................RRRRR.....................
......................RRRRRRRRR...................
....................RRRRRRRRRRRRR.................
..................RRRRRRRRRRRRRRRRR...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwwwwwwwwwwwwww...............
..................wwwwLLwwwwwwwwwww...............
..................wwwwLLwwwwwwwwwww...............
...MM.M.MM.M......wwwwLwwwwwwwwwwww.......MMM.MM.M
...MM.MZMMZM......wwwwwwwwwwwwwwwww.......MMMMMMZM
...ZZZZZZZZZ......wwwwwwwwwwwwwwwww.......ZZZZZZZZ
...ZZZZZZZZZ......wwwwwwwwwwwwwwwww.......ZZZZZZZZ
...ZZZZZZZZZ......wwwwwwwwwwwwwwwww.......ZZZZZZZZ
...ZZZZZZZZZ......wwwwwwwwwwwwwwwww.......ZZZZZZZZ
...ZZZZZZZZZ......wwwwwwwwwwwwwwwww.......ZZZZZZZZ
...ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
...ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
...ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
...ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
...ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
...ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
...ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
...ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
ZZZZZZZZ....................................ZZZZZZ
ZZZZZZZZ...................................ZZZZZZZ
ZZZZZZZZ...................................ZZZZZZZ
ZZZZZZZZZ..................................ZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZ......................................ZZZZZ
ZZZZZZZ......................................ZZZZZ
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV........wwwwwLwwwwwwwwwwwwwww.........VVV..
...VVVV........wwwwwwwwwwwwwwwwwwwwww........VVV..
...VVVV........www...............wwww........VVV..
...VVVV........www................www........VVV..
...VVVV........ww..................ww........VVV..
...VVVV........www.................ww........VVV..
...VVVV........www.................ww........VVV..
...VVVV........www...............wwww........VVV..
...VVVV........www................www........VVV..
...VVVV........LL..................ww........VVV..
...VVVV........www................www........VVV..
...VVVV........www...............wwww........VVV..
...VVVV........ww................wwww........VVV..
...VVVV........LL................wwww........VVV..
...VVVV........LL................wwww........VVV..
...VVVV........wwwwwwwwoooooNwwLLwwww........VVV..
...VVVV........wwwwwwwwoooooNwwLLwwww........VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVV..
...VVVV......................................VVVZ.
ZZZZZZZ......................................ZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVoooooNVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVooooooVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVooooooVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZVVVVVVVVVVVVVVVoooooNVVVVVVVVVVVVVVZZZZZZZ
ZZZZZZZZ...................................ZZZZZZZ
ZZZZZZZZ...................................ZZZZZZZ
ZZZZZZZZ...................................ZZZZZZZ
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
...............wwwLLLLLwwwwwwwwwwwww..............
...............wwwLLLLLwwwwwwwwwwwwww.............
...............www...............wwww.............
...............www................www.............
...............ww..................LL.............
...............www.................LL.............
...............www.................ww.............
...............www...............wwww.............
...............www................www.............
...............ww..................ww.............
...............www................www.............
...............www...............wwww.............
...............ww................wwww.............
...............ww................wwww.............
...............ww................wwww.............
...............wwwwwwLLwwwwwwLLwwwwww.............
...............wwwwwwLLwwwwwwLLwwwwww.............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
ZZEZEZZEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEZEZZZ   dddbddddd0000000000000000000000000000000000ddbdddd
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZ   bbbbbbbbd0000000000000000000000000000000000dbbbbbb
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZ   bbbbbbbbb0000000000000000000000000000000000bbbbbbb
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaMZZZZZZ   bbbbbbbbd7777777777777777777777777777777777dbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ   bbbbbbbbd7777777777777777777777777777777777dbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ   bbbbbbbbd7777777777777777777777777777777777dbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMZZZZZZ   bbbbbbbdd7777777777777777777777777777777777ddbbbbb
ZZZZZZZccccccccccccccccccccccccccccccccccccccZZZZZ   bbbbbbd00000000000000000000000000000000000000dbbbb
ZZZZZZMccccccccccccccccccccccccccccccccccccccMZZZZ   ddddbdd00000000000000000000000000000000000000ddddb
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVcccMMcccccccccccccccccccccccccccccccccVVVEE   00077770003300000000000000000000000000000000077770
EEEVVVVcccMccccccccccccccccccccccccccccccccccVVVEE   00077770003300000000000000000000000000000000077770
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkklllllllllllllllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkklllllllllllllllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkklllllllllllllllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkklllllllllllllllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   000777700000000jjjjjjjjjjjjjjjjjjjjjj0000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   ddddbdd00000000000000000000000000000000000000ddddb
ZZZZZZZccccccccccccccccnnnnncccccccccccccccccZZZZZ   bbbbbbd00000000000000000000000000000000000000dbbbb
ZZZZZZZZVVVVVVVVVVVVVVVMVVVncVVVVVVVVVVVVVVcZZZZZZ   bbbbbbbdd77777777777777cccccc77777777777777ddbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVMVVVVVVVVVVVVVVVZZZZZZ   bbbbbbbbd77777777777777bbbbbc77777777777777dbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVNVVVVVVVVVVVVVVVVVVVZZZZZZZ   bbbbbbbbb77777777777777cbbbbb77777777777777bbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVMVVVVMVVVVVVVVVVVVVVMZZZZZZ   bbbbbbbbd77777777777777ccbccc77777777777777dbbbbbb
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ   bbbbbbbbd0000000000000000000000000000000000dbbbbbb
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ   bbbbbbbbd0000000000000000000000000000000000dbbbbbb
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ   bbbbbbbbd0000000000000000000000000000000000dbbbbbb
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
ZZEZEZZEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEEZEZZZ   dddbddddd0000000000000000000000000000000000ddbdddd
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZ   bbbbbbbbd0000000000000000000000000000000000dbbbbbb
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZ   bbbbbbbbb0000000000000000000000000000000000bbbbbbb
ZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaMZZZZZZ   bbbbbbbbd7777777777777777777777777777777777dbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ   bbbbbbbbd7777777777777777777777777777777777dbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZ   bbbbbbbbd7777777777777777777777777777777777dbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMZZZZZZ   bbbbbbbdd7777777777777777777777777777777777ddbbbbb
ZZZZZZZccccccccccccccccccccccccccccccccccccccZZZZZ   bbbbbbd00000000000000000000000000000000000000dbbbb
ZZZZZZMccccccccccccccccccccccccccccccccccccccMZZZZ   ddddbdd00000000000000000000000000000000000000ddddb
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccccccccMcccccccccccccccVVVEE   00077770000000000000000000003300000000000000077770
EEEVVVVcccccccccccccccccccccMMcccccccccccccccVVVEE   00077770000000000000000000003300000000000000077770
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccccccccccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkklllllllllllllllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkklllllllllllllllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkllmmmmmmmmmmmllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkklllllllllllllllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkklllllllllllllllkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjkkkkkkkkkkkkkkkkkkkjj0000000077770
EEEVVVVccccccccRRRRRRRRRRRRRRRRRRRRRRccccccccVVVEE   00077770000000jjjjjjjjjjjjjjjjjjjjjjj0000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   000777700000000jjjjjjjjjjjjjjjjjjjjjj0000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   00077770000000000000000000000000000000000000077770
EEEVVVVccccccccccccccccnnnnncccccccccccccccccVVVEE   ddddbdd00000000000000000000000000000000000000ddddb
ZZZZZZZccccccccccccccccnnnnncccccccccccccccccZZZZZ   bbbbbbd00000000000000000000000000000000000000dbbbb
ZZZZZZZZVVVVVVVVVVVVVVVMVVVncVVVVVVVVVVVVVVcZZZZZZ   bbbbbbbdd77777777777777cccccc77777777777777ddbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZ   bbbbbbbbd77777777777777bbbbbb77777777777777dbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVNVVVVMVVVVVVVVVVVVVVZZZZZZZ   bbbbbbbbb77777777777777cbbbbc77777777777777bbbbbbb
ZZZZZZZZVVVVVVVVVVVVVVVMVVVVMVVVVVVVVVVVVVVMZZZZZZ   bbbbbbbbd77777777777777ccbccc77777777777777dbbbbbb
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ   bbbbbbbbd0000000000000000000000000000000000dbbbbbb
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ   bbbbbbbbd0000000000000000000000000000000000dbbbbbb
ZZZZZZZZEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEZZZZZZZ   bbbbbbbbd0000000000000000000000000000000000dbbbbbb
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 139 nodi, 456 passi, finito in 710 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey (marcatore), E=Emerald (marcatore), K=pinK, h=honey, d=dead, dark, c=corte, W=White, t=teal, G=Green, n=lastricato, r=strada, Q=aQua, a=fossato, m=magenta, w=pietra del mastio, u=blue, L=vetro, f=pavimento in legno, F=solaio in legno, R=tetto in tegole, V=pietra della cinta, Z=pietra della torre, M=merlo, O=porta, o=assi della porta, N=stipite, U=feritoia, #90=? (marcatore), #91=? (marcatore).
Alla fine: V 90500, Z 83462, w 76599, R 18300, c 7850, o 6510, E 3750, U 2538, L 2376, f 1975, F 1975, M 1122, a 1059, N 1005, n 375, O 240, r 150.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-37 all×26, prl×2, one×1: 815 celle x0-29 y2-29 z0, passi 2-56
   #41 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 57
    #43 all . K → K w passi=6: ×6, 14400 celle x45-109 y55-104 z0-6, passi 58-63, K→w 7200, .→K 7200
    #44 all . K → K u passi=14: ×14, 33600 celle x45-109 y55-104 z6-20, passi 64-77, K→u 16800, .→K 16800
#45-46 all×2: 43200 celle x45-109 y55-104 z20-38, passi 78-95
    #47 all . K → K u passi=14: ×14, 33600 celle x45-109 y55-104 z38-52, passi 96-109, K→u 16800, .→K 16800
#48-53 all×4, prl×2: 43625 celle x45-109 y55-104 z0-64, passi 110-188
    #55 all . h → h . passi=31: ×31, 122450 celle x50-104 y60-99 z1-32, passi 189-219, h→. 61225, .→h 61225
    #57 all . h → h F (+1) passi=1: ×1, 3950 celle x50-104 y60-99 z32-33, passi 220, h→F 1975, .→h 1975
      r1 . h → h F ×1975; r2 . s → s F ×0
    #58 all . h → h . (+1) passi=31: ×31, 122450 celle x50-104 y60-99 z33-64, passi 221-251, h→. 61225, .→h 61225
      r1 . h → h . ×61225; r2 . s → s . ×0
    #59 prl h → R (+1): ×1, 1975 celle x50-104 y60-99 z64, passi 252, h→R 1975
      r1 h → R ×1975; r2 s → R ×0
    #60 all . W → W V passi=23: ×23, 172500 celle x10-144 y20-139 z0-23, passi 253-275, W→V 86250, .→W 86250
#61-64 prl×2, all×2: 14700 celle x10-144 y20-139 z0-36, passi 276-313
    #65 all . t → t Z passi=39: ×39, 167700 celle x0-149 y10-149 z0-39, passi 314-352, t→Z 83850, .→t 83850
#66-136 prl×4, all×13, one×1: 25095 celle x0-149 y10-149 z0-50, passi 353-444
#137-139 prl×1, all×2: 46134 celle x44-110 y54-105 z6-74, passi 445-456
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#12 one KKKKKKK/Khhhhhh/Khhhhhh → *******/***ssss/***ssss passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#17 all cEEEEEEE → *ccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#18 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#38 all [Wt]E/*a → **/*a: le celle cercate c'erano, ma mai disposte come nel pattern
#39 all aE/*a → *a/**: le celle cercate c'erano, ma mai disposte come nel pattern
#54 all . s → s T passi=1: in quel momento nella griglia non c'erano celle "s"
#56 all . s → s . passi=30: in quel momento nella griglia non c'erano celle "s"
#70 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#71 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#72 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#73 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
… e altri 45
Fix it and answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKhsdcWtGnrQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Il mastio attorno a H: dimensioni variabili per seme -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Variazione per seme: estensione casuale del mastio su un lato -->
      <one in="hE" out="*h" steps="1"/>
      <all in="hE/*h" out="*h/**" steps="2"/>
      <!-- Mura del mastio -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- 2. Zona della scala nel mastio: 2 celle di pianerottolo, 4x2 di scala -->
      <one in="Khhhhhh/Khhhhhh" out="***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Corte attorno al mastio, poi espansione dove c'è terreno libero -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Cinta muraria spessa 2 celle attorno alla corte -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Via d'uscita dritta da H al bordo anteriore: porta d, lastricato n, corpo di guardia G, strada r (larga 3) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 7. Pozzo nella corte dove c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 8. Fossato oltre la cinta dove il terreno prosegue -->
      <all in="cWWEEEE" out="***aa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>

    <map scale="5 5 1" values="BEKhsdcWtGnrQawuLfFRVZTMOoNUk#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QaaaQ/QaaaQ/QaaaQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wVuZ"/>
        <union symbol="%" values="VZ"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze -->
        <!-- Mura del mastio (K -> w, u, R) alte 64 -->
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <prl in="K" out="R"/>

        <!-- Porta del mastio (d -> O alla base, w sopra fino a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Interno del mastio (h) e zona scala (s): 2 piani coperti -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Cinta muraria (W -> V) alta 24 -->
        <all in="B W" out="W V" steps="23"/>
        <prl in="W" out="V"/>

        <!-- Corpo di guardia (G -> O alla base, V sopra fino a 36) -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G V" steps="35"/>
        <prl in="G" out="V"/>

        <!-- Torri angolari (t -> Z) alte 40 -->
        <all in="B t" out="t Z" steps="39"/>
        <prl in="t" out="Z"/>

        <!-- Pozzo (Q) alto 4 -->
        <all in="B Q" out="Q V" steps="4"/>
        <prl in="Q" out="V"/>

        <!-- C. Scala reale: parti incluse, finestre, tetto, pulizia -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre del mastio -->
        <one steps="14">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="w"/>

        <!-- Tetto a padiglione del mastio (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6A7F4E" hidden="True"/>
  <color symbol="H" value="E6C229" hidden="True"/>
  <color symbol="w" value="7A7672" name="pietra del mastio" area="keep"/>
  <color symbol="V" value="8C8881" name="pietra della cinta" area="wall"/>
  <color symbol="Z" value="6E6A66" name="pietra della torre" area="tower"/>
  <color symbol="M" value="96918A" name="merlo"/>
  <color symbol="U" value="3A3632" name="feritoia"/>
  <color symbol="L" value="8AB4C9" name="vetro"/>
  <color symbol="f" value="A67C52" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="8F6843" name="solaio in legno" area="keep"/>
  <color symbol="k" value="B88E62" name="gradino"/>
  <color symbol="R" value="9E4738" name="tetto in tegole"/>
  <color symbol="O" value="5C3A21" name="porta" area="gatehouse"/>
  <color symbol="o" value="472C18" name="assi della porta" area="gatehouse"/>
  <color symbol="N" value="4A4642" name="stipite"/>
  <color symbol="c" value="B8A990" name="corte" area="courtyard"/>
  <color symbol="n" value="9E9589" name="lastricato" area="courtyard"/>
  <color symbol="r" value="8F816B" name="strada" area="road"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="moat"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="472C18" hidden="True"/>

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
