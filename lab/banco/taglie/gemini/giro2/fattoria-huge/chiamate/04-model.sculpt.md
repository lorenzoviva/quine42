# model.sculpt · gemini-4-argon · 48 s · 1 immagini

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

Your program:
<!--
  Concept: Fattoria (Farmstead)
  Parts and letters:
  - Main farmhouse (h = interior floor, s = stair zone, w = farmhouse walls, d = front door): two-storey dwelling with pitched roof around the centre.
  - Front porch / lean-to (p = porch around the front door): covered wooden veranda along the front facade.
  - Attached barn / stable wing (a = barn interior, v = barn walls): one-storey timber/brick annex on one side of the farmhouse, connected internally.
  - Stone silo / dovecote tower (t = tower): attached to a rear corner of the farmhouse, crowned with battlements and slits.
  - Farmyard (c = courtyard, q = well, y = haystack): paved/dirt yard around the buildings, enclosed by a low fence (z).
  - Road (r): front path from the farmhouse door straight to the front edge.
  - Cultivated field (g = plowed field) and orchard trees (u = fruit tree): grown outside the farmyard fence where space allows.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavtpcqyzgru" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around H: 9 wide, 7 or 8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone along the back wall of the farmhouse: 2 cells landing, 4 cells stair, 2 cells wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Attached barn wing on one side (left or right): 6 wide, 6 deep -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stone dovecote / silo tower on one rear outer corner of the farmhouse -->
      <one in="EE/Ew" out="t*/*t" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>

      <!-- Front road from the middle of the front wall straight to the edge (3 cells wide) -->
      <one in="hhhhh/wwwww/EEEEE" out="*****/*ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Front porch / lean-to along the front wall around the door (2 cells deep) -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pr" out="*p" symmetry="(x)" steps="1"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard if room allows (Huge and Gargantuan) -->
      <all in="cEEEE" out="*ccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Fence around the farmyard where ground continues -->
      <all in="cE" out="*z"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Keep road clear through yard and fence -->
      <all in="[rd]/c" out="*/r" symmetry="()"/>
      <all in="r/z" out="*/r" symmetry="()"/>
      <all in="r[cz]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Well and haystack inside the farmyard where space fits -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="1"/>

      <!-- Cultivated fields outside the fence at Gargantuan size -->
      <all in="zEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="r/g" out="*/r" symmetry="()"/>
      <all in="rg" out="*r" symmetry="(x)" steps="1"/>

      <!-- Orchard trees in remaining open ground at Gargantuan size -->
      <one in="EEE/EEE/EEE" out="***/*u*/***" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavtpcqyzgrufFWVAPRTJKLQXZYGIOoNMTkU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="q" out="qqqqq/qQQQq/qQLQq/qQQQq/qqqqq"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="g" out="ggggg/ZZZZZ/ggggg/ZZZZZ/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="u" out="uuuuu/uuuuu/uuGuu/uuuuu/uuuuu"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WVQ"/>
        <union symbol="=" values="hsaFcpr"/>
        <union symbol="%" values="Q"/>

        <!-- B. Heights -->
        <!-- Farmhouse walls (w) and door wall (d): 2 storeys = 64 high + roof R -->
        <all steps="1">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d h"/>
        </all>
        <all steps="5">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w I"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="6">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w I"/>
          <rule in="B d" out="d I"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <prl>
          <rule in="w" out="R"/>
          <rule in="d" out="R"/>
        </prl>

        <!-- Farmhouse interior (h) and stair zone (s) -->
        <all steps="1">
          <rule in="B h" out="h h"/>
          <rule in="B s" out="s h"/>
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

        <!-- Barn walls (v) and interior (a): 1 storey = 34 high + roof J -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v I" steps="12"/>
        <all in="B v" out="v V" steps="14"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a a" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>

        <!-- Stone dovecote tower (t): 76 high with battlements -->
        <all in="B t" out="t Q" steps="76"/>
        <prl in="t" out="B"/>

        <!-- Front porch (p floor, b posts): posts 33 high, roof J at 34 -->
        <all in="B p" out="p p" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <all in="B b" out="b P" steps="34"/>
        <prl in="b" out="J"/>

        <!-- Well (Q stone rim 10 high, L water 4 high) -->
        <all in="B Q" out="Q Q" steps="10"/>
        <prl in="Q B" out="Q Q"/>
        <all in="B L" out="L L" steps="4"/>

        <!-- Haystack (y): 12 high -->
        <all in="B y" out="y Y" steps="8"/>
        <prl in="y" out="B"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>

        <!-- Fence (z): 7 high -->
        <all in="B z" out="z P" steps="6"/>
        <prl in="z" out="B"/>

        <!-- Orchard trees (G trunk 12 high, X canopy) -->
        <all in="B G" out="G P" steps="12"/>
        <prl in="G" out="X"/>
        <all in="XB" out="*X" steps="4"/>
        <all in="B X" out="X X" steps="6"/>

        <!-- C. Full scale details, doors, parts, windows, roofs -->
        <!-- Front door seed (O) on z=1 where road (r) meets the door wall above h -->
        <all in="W/B B/r" out="O/* */*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Internal door seed (O) between farmhouse (h) and barn (a) on z=1 -->
        <one in="BBBBB/WWWWW/BBBBB hhhhh/WWWWW/aaaaa" out="*****/OOOOO/***** *****/*****/*****" symmetry="(xy)" steps="1"/>
        <all in="OWW/OWW/OWW" out="OOO/OOO/OOO" symmetry="(xy)" steps="2"/>
        <all in="W/O" out="O/*" symmetry="(xy)" steps="4"/>

        <!-- Barn exterior door into the farmyard (c) on z=1 -->
        <one in="BBBBB/VVVVV/BBBBB aaaaa/VVVVV/ccccc" out="*****/OOOOO/***** *****/*****/*****" symmetry="(xy)" steps="1"/>
        <all in="OVV/OVV/OVV" out="OOO/OOO/OOO" symmetry="(xy)" steps="2"/>
        <all in="V/O" out="O/*" symmetry="(xy)" steps="4"/>

        <!-- Include seed parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in farmhouse and barn bands (I) -->
        <one steps="18">
          <rule in="BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I W" out="W W"/>
        <prl in="W I" out="W W"/>
        <prl in="I V" out="V V"/>
        <prl in="V I" out="V V"/>
        <prl in="I" out="W"/>

        <!-- Farmhouse pitched roof (R) + chimney (K) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>
        <one in="RR/RR BB/BB" out="**/** KK/KK" steps="1" symmetry="()"/>
        <all in="B K" out="K K" steps="10"/>

        <!-- Barn and porch roofs (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette -->
  <color symbol="E" value="#7a9a55" name="erba" hidden="True"/>
  <color symbol="h" value="#c89d66" name="pavimento in legno" area="house"/>
  <color symbol="s" value="#c89d66" name="pavimento in legno" area="house"/>
  <color symbol="w" value="#e8dcc5" name="intonaco chiaro" area="house"/>
  <color symbol="d" value="#c89d66" name="soglia" area="house"/>
  <color symbol="a" value="#b59b72" name="terra battuta fienile" area="barn"/>
  <color symbol="v" value="#b55942" name="mattone fienile" area="barn"/>
  <color symbol="t" value="#8f8b84" name="pietra colombaia" area="tower"/>
  <color symbol="p" value="#b88b58" name="tavolato portico" area="porch"/>
  <color symbol="c" value="#c7b595" name="aia in ghiaia" area="yard"/>
  <color symbol="q" value="#8f8b84" name="base pozzo" area="yard"/>
  <color symbol="y" value="#e0b84c" name="paglia" area="yard"/>
  <color symbol="z" value="#78583a" name="staccionata" area="yard"/>
  <color symbol="g" value="#6e553b" name="terra arata" area="field"/>
  <color symbol="Z" value="#57412b" name="solco arato" area="field"/>
  <color symbol="r" value="#b09e82" name="sentiero" area="yard"/>
  <color symbol="u" value="#6e8c49" name="prato frutteto" area="orchard"/>

  <color symbol="W" value="#e8dcc5" name="muro intonacato"/>
  <color symbol="V" value="#b55942" name="muro di mattoni"/>
  <color symbol="Q" value="#8f8b84" name="muro in pietra"/>
  <color symbol="F" value="#b88b58" name="solaio di legno"/>
  <color symbol="P" value="#78583a" name="trave di quercia"/>
  <color symbol="R" value="#a84a32" name="coppi di terracotta"/>
  <color symbol="J" value="#8f3d28" name="tettoia in coppi"/>
  <color symbol="K" value="#736e68" name="comignolo in pietra"/>
  <color symbol="L" value="#5a829e" name="vetro finestra"/>
  <color symbol="Y" value="#e0b84c" name="covone di fieno"/>
  <color symbol="X" value="#4f7838" name="chioma di melo"/>

  <color symbol="O" value="#8c5838" name="porta di legno"/>
  <color symbol="o" value="#593620" name="assi della porta"/>
  <color symbol="N" value="#736e68" name="stipite in pietra"/>
  <color symbol="M" value="#8f8b84" name="merlo in pietra"/>
  <color symbol="k" value="#a37949" name="gradino di legno"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>

  <color symbol="#20" value="#000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#000000" name="assi aperte" hidden="True"/>

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
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: La torre alta con merletti dà un aspetto troppo militare, simile a un forte piuttosto che a una fattoria.
Advice: Riduci l'altezza della torre o trasformala in un fienile/colombaia per accentuare il carattere agricolo.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c aia in ghiaia, q base pozzo, r sentiero, u prato frutteto, F solaio di legno, W muro intonacato, V muro di mattoni, P trave di quercia, R coppi di terracotta, J tettoia in coppi, K comignolo in pietra, L vetro finestra, Q muro in pietra, X chioma di melo, Y covone di fieno, M merlo in pietra, k gradino di legno, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
EEEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
EEEEEPPcccccccccccccccccccccccccccccccccccccccccPP
EEEEEPPcccccccccccccccccccccccccccccccccccccccccPP
EEEEEPPcccccccccccccccccccccccccccccccccccccccccPP
EEEEEPPcccccccccccccccccccccccccccccccccccccccccPP
EEEEEPPcccccccccccccccccccccccccccccccccccccccccPP
EEEEEPPcccccccccccccccccccccccccccccccccccccccccPP
EEEEEPPccccccccccccccccccccccccccQQQQQQMccccccccPP
EEEEEPPcccccccccccccccccccccccccQQQQQQQQccccccccPP
EEEEEPPcccccccccccccccccccccccMQQQQQQQQQccccccccPP
EEEEEPPcccccccccccccccccccccccQQQQQQQQQQccccccccPP
EEEEEPPcccccccccccccccccccccccQQQQQQQQQQcccYYYYcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRQQQQQQQQQQcccYYYYcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRMQQQQQQQQQcccYYYYcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRRRRQQQQQQQccccccccPP
EEXEEPPcccccccccRRRRRRRRRRRRRRRRRQQQQQQMJJJJJJJcPP
EXXXEPPcccccccccRRRRRRRRRRRRRRRRRRQQQQJJJJJJJJJcPP
EEXEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEEEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEXEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EXXXEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEXEEPPcccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP
EEEEEPPcccccccccJJJJJJrJJJJJJJJJJJJJJJJJJJJJJJJcPP
EEEEEPPcccccccccJJJJJJrJJJJJJJJJJJJJccccccccccccPP
EEEEEPPcccccccccJJJJJJrJJJJJJJJJJJJcccccccccccccPP
EEEEEPPcccMqMcccccrrrrrrrrrcccccccccccccccccccccPP
EEEEEPPcccqqqcccccrrrrrrrrrcccccccccccccccccccccPP
EEEEEPPcccqqMcccccrrrrrrrrrcccccccccccccccccccccPP
EEEEEPPcccccccccccrrrrrrrrrcccccccccccccccccccccPP
EEEEEPPcccccccccccrrrrrrrrrcccccccccccccccccccccPP
EEEEEPPcccccccccccrrrrrrrrrcccccccccccccccccccccPP
EEEEEPPPPPPPPPPPPPrrrrrrrrrPPPPPPPPPPPPPPPPPPPPPPP
EEEEEPPPPPPPPPPPPPrrrrrrrrrPPPPPPPPPPPPPPPPPPPPPPP
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEXEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEXXEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEXEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
05550000000000000000000000000000000000000000000000
05550000000000000000000000000000000000000000000000
05550000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000111111111111111111111111111111111111111111111
00000111111111111111111111111111111111111111111111
00000110000000000000000000000000000000000000000011
00000110000000000000000000000000000000000000000011
00000110000000000000000000000000000000000000000011
00000110000000000000000000000000000000000000000011
00000110000000000000000000000000000000000000000011
00000110000000000000000000000000000000000000000011
0000011000000000000000000000000rrrrrrrrr0000000011
0000011000000000000000000000000rpppppppr0000000011
000001100000000000000000000000rppppppppp0000000011
000001100000000000000000000000rppppppppr0002222011
000001100000000000000000000000rppppppppp0002222011
0000011000000000jjjjjjjjjjjjjjrppppppppr0002222011
0000011000000000jjjjjjjjjjjjjjrrrrpppppp0002222011
0000011000000000jjkkkkkkkkkkkkjjjrpppppr0000000011
0555011000000000jjkkkkkkkkkkkkjjjrpppppraaaaaaa011
0555011000000000jjkkllllllllllkkjrpppprabbbbbba011
0555011000000000jjkkllllllllllkkjrrprrrbbbbbbba011
0000011000000000jjkkllmmmmmmmmllkkjjbbbbbbbbbba011
0000011000000000jjkkllmmmmmmmmllkkjjbbbccccbbba011
0000011000000000jjkkllmmmmmmmmllkkjjbbbccccbbba011
0000011000000000jjkkllmmmmmmmmllkkjjbbbccccbbba011
0000011000000000jjkkllllllllllllkkjjbbbccccbbba011
0000011000000000jjkkllllllllllllkkjjbbbccccbbba011
0000011000000000jjkkkkkkkkkkkkkkkkjjbbbccccbbba011
0555011000000000jjkkkkkkkkkkkkkkkkjjbbbccccbbba011
0555011000000000jjjjjjjjjjjjjjjjjjjjbbbbbbbbbba011
0555011000000000jjjjjjjjjjjjjjjjjjjjbbbbbbbbbba011
0000011000000000abbbba0abbbbbbbbbbbbaaaaaaaaaaa011
0000011000000000abbbba0abbbbbbbbbbbaaaaaaaaaaaa011
0000011000000000aaaaaa0aaaaaaaaaaaaa00000000000011
00000110005550000000000000000000000000000000000011
00000110005550000000000000000000000000000000000011
00000110005550000000000000000000000000000000000011
00000110000000000000000000000000000000000000000011
00000110000000000000000000000000000000000000000011
00000110000000000000000000000000000000000000000011
00000111111111111110000000111111111111111111111111
00000111111111111110000000111111111111111111111111
00000000000000000000000000000000000000000000000000
00000000005500000000000000000000000000000000000000
00000000055550000000000000000000000000000000000000
00000000005500000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
..............................MMMMM.MMMM..........
..............................MMMMM.MMMM..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
......................RRRRRRR.QQQQQQQQQQ..........
....................RRRRRRRRRRRQQQQQQQQQ..........
..................RRRRRRRRRRRRRRRQQQQQQQ..........
.................RRRRRRRRRRRRRRRRRRQQQQQ..........
.................WWWWWWWWWWWWWWWWWWQQQQQ..........
.................WWWWWWWWWWWWWWWWWWQQQQQ..........
.................WWWWWWWWWWWWWWWWWWQQQQQ..........
.................WWWWWWWWWWWWWWWWWWQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
.................M..M.M..MM.M.QMQQMQQQQQ..........
.................M.MM.MM.MMMMMQMQMMQQQQJJJJ.......
.................WJJWWWWWJJJJJJJJJWQQJJJJJJJJ.....
.................JJJJJWWJJJJJJJJJJJJJJJJJJJJJJJ...
.................PWPPWWWPPWPWPPWPWPVVVVVVVVVVVV...
.................PWPPWWWPPWPWPPWPWPVVVVVVVVVVVV...
.................PWPPWWWPPWPWPPWPWPVVVVVVVVVVVV...
.................PWPPWWWPPWPWPPWPWPVVVVVVVVVVVV...
.................PPPPWWWPPkPPPPQPQPQQQQQ..........
.XXX.....XXXM....P.PPWWWPPkP.PPQPQPQQQQQ..........
.XXX.....XXXM....P.PPWWWPPkP.PPQPQPMQQMQ.M.M.M....
..........P.Q....PMPPWWWPPMPMPPMPQPMMQMQMMMM.MM...
..........Q.Q....PMPPWWWPPMPMPPMPQPVVVVVVVVVVVV...
.....PPPPPPPPPPPPPPPPWWWPPPPPPPPPPPPPPPPPPPPPPPPPP
..E..PPPPPPPPPPPPPPPPWWWPPPPPPPPPPPPPPPPPPPPPPPPPP
```
Right side (looking from the right):
```
..............MMM.MMMMM...........................
.............MMMM.MMMMM...........................
.............QQQQQQQQQQ...........................
.............QQQQQQQQQQ...........................
.............QQQQQQQQQQ...........................
.............QQQQQQQQQQ...........................
.............QQQQQQQQQQQRRRR......................
.............QQQQQQQQQQRRRRRRR....................
.............QQQQQQQQQQRRRRRRRRR..................
.............QQQQQQQQQQRRRRRRRRRR.................
.............QQQQQQQQQQWWWWWWWWWW.................
.............QQQQQQQQQQWWWWWWWWWW.................
.............QQQQQQQQQQWWWWWWWWWW.................
.............QQQQQQQQQQWWWWWWWWWW.................
.............QQQQQQQQQQ...........................
.............QQQQQQQQQQ...........................
.............QQQQQQQQQQQM..J.J..M.................
.............QQQQQQQQQQQMJJJJJJJM.................
.............QQQQQQQQQQJJJJJJJJJJJ................
.............QQQQQQQQQJJJJJJJJJJJJJJJ.............
.............QQQQQQQQQVVVVVVVVVVVVVPJ.............
.............QQQQQQQQQVVVVVVVVVVVVVP..............
.............QQQQQQQQQVVVVVVVVVVVVVP..............
.............QQQQQQQQQVVVVVVVVVVVVVP..............
.............QQQQQQQQQQV.......VWVPP..............
.XXX.........QQQQQQQQQQX.......XWWPP.M........XXX.
.XXX.........QQQQQQQQQMX.M.M...MWMMP.M.M......XXX.
.............QQQQQQQQQMMMMMM.MMMMMMP.Q.Q..........
.............QQQQYYYQQVVVVVVVVVVVVVP.Q.Q..........
.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.....
..E..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..E..
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
................................QQQQQQQQ..........
................................QQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
.......................kkkk......QQQQQQQ..........
.......................kkkk......QQQQQQQ..........
.......................kkkk......QQQQQ............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
....................WWWWW.........................
.................M..W...W.........M...............
.................P.........P....P..M..............
.................P.........P....P.................
..................................................
..........M.M.....................................
..................................................
............M.....................................
..................................................
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
................................QQQQQQQQ..........
................................QQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
.................................QQQQQQQ..........
.................................QQQQQQQ..........
.................................QQQQQ............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
................................QQQQQQQQ..........
................................QQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
..............................QQQQQQQQQQ..........
.................................QQQQQQQ..........
.................................QQQQQQQ..........
.................................QQQQQ............
..................................................
..................................................
........................RRRR......................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
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
EEXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEXEEEEEEEEEEEE   05550000000000000000000000000000000055500000000000
EXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEXXXEEEEEEEEEEE   05550000000000000000000000000000000055500000000000
EEXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEXEEEEEEEEEEEE   05550000000000000000000000000000000055500000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPgggggEE   01111111111111111111111111111111111111111111000000
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPgggggEE   01111111111111111111111111111111111111111111000000
EEPcccccccccccccccccccccccccccccccccccccccPZZZZZEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccccccccccccccccccccccccccPgggggEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccccccccccccccccccccccccccPgggggEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccccccccccccccccccccccccccPgggggEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccccccccccccccccccccccccccPgggggEE   01110000000000000000000000222200000000000111000000
EEPccccccccccccccccccccccccYYYccccccccccccPZZZZZEE   01110000000000000000000000222200000000000111000000
EEPccccccccccQQQQQQMcccccccYYYccccccccccccPgggggEE   01110000000rrrrrrrrr000000222200000000000111000000
EEPcccccccccQQQQQQQQcccccccYYYccccccccccccPgggggEE   01110000000rpppppppr000000222200000000000111000000
EEPcccccccccQQQQQQQQQMccccccccccccccccccccPgggggEE   01110000000ppppppppprr0000000000000000000111000000
EEPcccccccccQQQQQQQQQQccccccccccccccccccccPgggggEE   01110000000rpppppppppr0000000000000000000111000000
EEPcccccccccQQQQQQQQQQccccccccccccccccccccPZZZZZEE   01110000000ppppppppppr0000000000000000000111000000
EEPcccccccccQQQQQQQQQQRRRRRRRRRRRRRcccccccPgggggEE   01110000000rppppppppprjjjjjjjjjjjjjj00000111000000
EEPcccccccccQQQQQQQQQMRRRRRRRRRRRRRcccccccPgggggEE   01110000000ppppppprprrjjjjjjjjjjjjjj00000111000000
EEPcccccccccQQQQQQRRRRRRRRRRRRRRRRRcccccccPgggggEE   01110000000rpppppprjjjkkkkkkkkkkkkjj00000111000000
EEPccJJJJJJJQQQQQQRRRRRRRRRRRRRRRRRcccccccPgggggEE   0111aaaaaaarrppppprjjkkkkkkkkkkkkkjj00000111000000
EEPccJJJJJJJJQQQQQRRRRRRRRRRRRRRRRRcccccccPZZZZZEE   0111aabbbbbbarpppprjkkllllllllllkkjj00000111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRcccccccPgggggEE   0111aabbbbbbbrrrrrrkklllllllllllkkjj00000111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRcccccccPgggggEE   0111aabbbbbbbbbbjjkkllmmmmmmmmllkkjj00000111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRcccccccPgggggEE   0111aabbccccbbbbjjkkllmmmmmmmmllkkjj00000111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRcccccccPgggggEE   0111aabbcccccbbbjjkkllmmmmmmmmllkkjj00000111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRccMqMccPZZZZZEE   0111aabbcccccbbbjjkkllmmmmmmmmllkkjj05550111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRccqqqccPgggggEE   0111aabbcccccbbbjjkkllllllllllllkkjj05550111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRccMqqccPgggggEE   0111aabbcccccbbbjjkkllllllllllllkkjj05550111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRcccccccPgggggEE   0111aabbcccccbbbjjkkkkkkkkkkkkkkkkjj00000111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRcccccccPgggggEE   0111aabbcccccbbbjjkkkkkkkkkkkkkkkkjj00000111000000
EEPccJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRcccccccPZZZZZEE   0111aabbbbbbbbbbjjjjjjjjjjjjjjjjjjjj00000111000000
EEPccJJJJJJJJJJJJRRRRRRRRRRRRRRRRRRcccccccPgggggEE   0111aabbbbbbbbbbjjjjjjjjjjjjjjjjjjjj00000111000000
EEPccJJJJJJJJJJJJJJJJJrJJJJJJJJJJJJcccccccPgggggEE   0111aaaaaaaaaaaabbbbba0abbbbbbbbbbaa00000111000000
EEPcccccccccccccJJJJJJrJJJJJJJJJJJJcccccccPgggggEE   01110aaaaaaaaaaaabbbba0abbbbbbbbbbaa00000111000000
EEPcccccccccccccJJJJJJrJJJJJJJJJJJJcccccccPgggggEE   0111000000000000aaaaaa0aaaaaaaaaaaaa00000111000000
EEPcccccccccccccccrrrrrrrrrcccccccccccccccPZZZZZEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccrrrrrrrrrcccccccccccccccPgggggEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccrrrrrrrrrcccccccccccccccPgggggEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccrrrrrrrrrcccccccccccccccPgggggEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccrrrrrrrrrcccccccccccccccPgggggEE   01110000000000000000000000000000000000000111000000
EEPcccccccccccccccrrrrrrrrrcccccccccccccccPZZZZZEE   01110000000000000000000000000000000000000111000000
EEPPPPPPPPPPPPPPPPrrrrrrrrrPPPPPPPPPPPPPPPPgggggEE   01111111111111111110000000111111111111111111000000
EEPPPPPPPPPPPPPPPPrrrrrrrrrPPPPPPPPPPPPPPPPgggggEE   01111111111111111110000000111111111111111111000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEXEEEEEEEEEXEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   05550000000555000000000000000000000000000000000000
EXXXEEEEEEEXXXEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   05550000000555000000000000000000000000000000000000
EEXEEEEEEEEEXEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   05550000000555000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEXEEXEEEEEEEEEEEEEEEEEEXEEEEEEEEEEEEEEE   00000000000555055000000000000000055000000000000000
EEEEEEEEEEEXXXEXXEEEEEEEEEEEEEEEEXXEEEEEEEEEEEEEEE   00000000000555555500000000000000555500000000000000
EEEEEEEEEEEEXEEXEEEEEEEEEEEEEEEEEEXEEEEEEEEEEEEEEE   00000000000555055000000000000000055000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   00011111111111111111111111111111111111111111111111
EEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   00011111111111111111111111111111111111111111111111
EEEPPcccccccccccccccccccccccccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPcccccccccccccccccccccccccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPcccccccccccccccccccccccccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPccccccccccccccccccccccccccccccccccccccqqqqcPP   00011000000000000000000000000000000000000005555011
EEEPPccccccccccccccccccccccccccccccccccccccqqqqcPP   00011000000000000000000000000000000000000005555011
EEEPPcccccccccccccccccccccccccccccccccccccccMMMcPP   00011000000000000000000000000000000000000005555011
EEEPPccYYYcccQQQQQQMccccccccccccccccccccccccccccPP   00011022220rrrrrrrrr000000000000000000000000000011
EEEPPccYYYccQQQQQQQQccccccccccccccccccccccccccccPP   00011022220rpppppppr000000000000000000000000000011
EEEPPccYYYccQQQQQQQQQMccccccccccccccccccccccccccPP   00011022220ppppppppprr0000000000000000000000000011
EEEPPccYYYccQQQQQQQQQQcccccccccccccJJJJJJJJJJJJcPP   00011022220rpppppppppr000000000000aaaaaaaaaaaaa011
EEEPPcccccccQQQQQQQQQQcccccccccccccJJJJJJJJJJJJcPP   00011000000ppppppppppr000000000000aabbbbbbbbbba011
EEEPPcccccccQQQQQQQQQQRRRRRRRRRRRRRJJJJJJJJJJJJcPP   00011000000rppppppppprjjjjjjjjjjjjjjbbbbbbbbbba011
EEEPPcccccccQQQQQQQQQMRRRRRRRRRRRRRJJJJJJJJJJJJcPP   00011000000ppppppprprrjjjjjjjjjjjjjjbbbbbbbbbba011
EEEPPcccccccQQQQQQRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   00011000000rpppppprjjjkkkkkkkkkkkkjjbbbccccbbba011
EEEPPcccccccQQQQQQRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   00011000000rrppppprjjkkkkkkkkkkkkkjjbbbccccbbba011
EEEPPccccccccQQQQQRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   0001100000000rpppprjkkllllllllllkkjjbbbccccbbba011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   0001100000000rrprrrkklllllllllllkkjjbbbccccbbba011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   0001100000000000jjkkllmmmmmmmmllkkjjbbbccccbbba011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   0001100000000000jjkkllmmmmmmmmllkkjjbbbccccbbba011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   0001100000000000jjkkllmmmmmmmmllkkjjbbbccccbbba011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   0001100000000000jjkkllmmmmmmmmllkkjjbbbbbbbbbba011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   0001100000000000jjkkllllllllllllkkjjbbbbbbbbbba011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJJcPP   0001100000000000jjkkllllllllllllkkjjaaaaaaaaaaa011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRcccccccccccccPP   0001100000000000jjkkkkkkkkkkkkkkkkjjaaaaaaaaaaa011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRcccccccccccccPP   0001100000000000jjkkkkkkkkkkkkkkkkjj00000000000011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRcccccccccccccPP   0001100000000000jjjjjjjjjjjjjjjjjjjj00000000000011
EEEPPcccccccccccRRRRRRRRRRRRRRRRRRRcccccccccccccPP   0001100000000000jjjjjjjjjjjjjjjjjjjj00000000000011
EEEPPcccccccccccJJJJJJJJrJJJJJJJJJJcccccccccccccPP   0001100000000000abbbbbbaaabbbbbbbbaa00000000000011
EEEPPcccccccccccJJJJJJJJrJJJJJJJJJJcccccccccccccPP   0001100000000000abbbbbbaaabbbbbbbbaa00000000000011
EEEPPcccccccccccJJJJJJJJrJJJJJJJJJJcccccccccccccPP   0001100000000000aaaaaaaaaaaaaaaaaaaa00000000000011
EEEPPcccccccccccccccrrrrrrrrccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPcccccccccccccccrrrrrrrrccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPcccccccccccccccrrrrrrrrccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPcccccccccccccccrrrrrrrrccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPcccccccccccccccrrrrrrrrccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPcccccccccccccccrrrrrrrrccccccccccccccccccccPP   00011000000000000000000000000000000000000000000011
EEEPPPPPPPPPPPPPPPPPrrrrrrrrPPPPPPPPPPPPPPPPPPPPPP   00011111111111111111000000001111111111111111111111
EEEPPPPPPPPPPPPPPPPPrrrrrrrrPPPPPPPPPPPPPPPPPPPPPP   00011111111111111111000000001111111111111111111111
EEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrEEXEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000005500000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrEXXEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000055550000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrEEXEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000005500000000000000000000
EEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.39 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 174 nodi, 669 passi, finito in 742 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba (marcatore), h=pavimento in legno, s=pavimento in legno, w=intonaco chiaro, d=soglia, a=terra battuta fienile, v=mattone fienile, t=pietra colombaia, p=tavolato portico, c=aia in ghiaia, q=base pozzo, y=paglia, z=staccionata, r=sentiero, u=prato frutteto, F=solaio di legno, W=muro intonacato, V=muro di mattoni, P=trave di quercia, R=coppi di terracotta, T=Teal (marcatore), J=tettoia in coppi, K=comignolo in pietra, L=vetro finestra, Q=muro in pietra, X=chioma di melo, Y=covone di fieno, G=Green, I=Indigo (marcatore), M=merlo in pietra, k=gradino di legno, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), b=black.
Alla fine: Q 63832, W 28875, P 20118, R 13791, V 9900, J 8441, c 8050, E 5975, F 2790, k 2720, M 2298, X 1148, U 1020, r 900, Y 840, u 96, q 64, L 20, K 4.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-43 all×23, prl×1, one×7: 701 celle x1-29 y1-29 z0, passi 2-70
   #45 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 71
#47-49 all×3: 31000 celle x50-104 y55-99 z0-20, passi 72-91
#50-51 all×2: 27900 celle x50-104 y55-99 z20-38, passi 92-109
#52-56 all×4, prl×1: 43250 celle x50-104 y55-99 z0-64, passi 110-138
    #57 all . h → h . passi=31: ×31, 167750 celle x55-99 y60-94 z0-32, passi 139-169, h→. 83875, .→h 83875
#58-59 all×2: 17900 celle x55-99 y60-94 z2-33, passi 170-200
    #60 all . h → h . (+1) passi=31: ×31, 97650 celle x55-99 y60-94 z33-64, passi 201-231, h→. 42625, .→h 42625, s→. 6200, .→s 6200
      r1 . h → h . ×42625; r2 . s → s . ×6200
#61-66 prl×2, all×4: 35175 celle x55-139 y60-104 z0-64, passi 232-268
    #67 all . a → a . passi=33: ×33, 117000 celle x105-134 y70-99 z0-34, passi 269-301, a→. 58500, .→a 58500
    #68 prl a → J: ×1, 1800 celle x105-134 y70-99 z32-34, passi 302, a→J 1800
    #69 all . t → t Q passi=76: ×76, 114000 celle x90-119 y40-69 z0-76, passi 303-378, t→Q 57000, .→t 57000
#70-72 prl×1, all×2: 42670 celle x50-119 y40-109 z0-76, passi 379-413
#73-81 prl×3, all×5: 22636 celle x31-139 y40-118 z0-85, passi 414-474
    #82 all . z → z P passi=6: ×6, 27900 celle x15-149 y15-134 z0-6, passi 475-480, z→P 13950, .→z 13950
#83-117 prl×3, all×3: 29619 celle x3-149 y3-146 z0-51, passi 481-505
#123-174 all×20, prl×6, one×1: 33721 celle x31-140 y40-118 z0-91, passi 506-669
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#31 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#34 all [rd]/c → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all r/z → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#39 all zEEEE → *ggg* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#40 all gE/*g → *g/**: in quel momento nella griglia non c'erano celle "g"
#41 all r/g → */r: in quel momento nella griglia non c'erano celle "g"
#42 all rg → *r passi=1: in quel momento nella griglia non c'erano celle "g"
#77 prl Q . → Q Q: le celle cercate c'erano, ma mai disposte come nel pattern
#88 all W/. ./r → O/* */* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#89 all W/O → O/* passi=4: in quel momento nella griglia non c'erano celle "O"
#90 one ...../WWWWW/..... hhhhh/WWWWW/aaaaa → *****/OOOOO/***** *****/*****/***** passi=1: in quel momento nella griglia non c'erano celle "h", "a"
… e altri 52
Improve it: answer with the whole program.

## Risposta

<!--
  Concept: Fattoria (Farmstead)
  Parts and letters:
  - Main farmhouse (h = interior floor, s = stair zone, w = farmhouse walls, d = front door): two-storey warm plastered dwelling with terracotta pitched roof and stone chimney.
  - Front porch / lean-to (p = porch floor, m = front corner post cells): covered wooden veranda along the front facade with timber posts at the outer corners.
  - Attached barn / stable wing (a = barn interior, v = brick barn walls): one-storey red-brick annex on one side of the farmhouse, with timber roof and hayloft ventilation slits.
  - Low rural granary / dovecote turret (t = stone dovecote): modest height (below the main roof ridge) with a terracotta pyramid roof and small dovecote openings instead of high military battlements.
  - Farmyard (c = gravel yard, q = stone well, y = golden haystack): enclosed by a low wooden fence (z).
  - Road (r): front path from the farmhouse door straight to the front edge.
  - Cultivated field (g = plowed field) and orchard apple trees (u = fruit tree): grown outside the farmyard fence where space allows.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavtpmcqyzgru" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around H: 9 wide, 7 or 8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone along the back wall of the farmhouse: 2 cells landing, 4 cells stair, 2 cells wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Attached barn wing on one side (left or right): 6 wide, 6 deep -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Compact rural dovecote / granary turret on one rear corner of the farmhouse (3x3 cells) -->
      <one in="EE/Ew" out="t*/*t" symmetry="(x)" steps="1"/>
      <all steps="1">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>

      <!-- Front road from the middle of the front wall straight to the edge (3 cells wide) -->
      <one in="hhhhh/wwwww/EEEEE" out="*****/*ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Front porch / lean-to along the front wall around the door (2 cells deep, continuous across the front) -->
      <all in="[wd]/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[Er]" out="*/m" symmetry="()" steps="1"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtpdm]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard if room allows (Huge and Gargantuan) -->
      <all in="cEEEE" out="*ccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Fence around the farmyard where ground continues -->
      <all in="cE" out="*z"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Keep road clear through yard and fence -->
      <all in="r/[cz]" out="*/r" symmetry="()"/>
      <all in="r[cz]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Well and haystacks inside the farmyard where space fits -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="2"/>

      <!-- Cultivated fields outside the fence at Gargantuan size -->
      <all in="zEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="r/g" out="*/r" symmetry="()"/>
      <all in="rg" out="*r" symmetry="(x)" steps="1"/>

      <!-- Orchard trees in remaining open ground -->
      <one in="EEE/EEE/EEE" out="***/*u*/***" steps="5"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavtpmcqyzgrufFWVAPRTJKLQXZYGIOoNMTkU#90#91#92#94#20#21b" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="m" out="ppppp/ppppp/ppppp/pbppp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="q" out="qqqqq/qQQQq/qQLQq/qQQQq/qqqqq"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="g" out="ggggg/ZZZZZ/ggggg/ZZZZZ/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="u" out="uuuuu/uuuuu/uuGuu/uuuuu/uuuuu"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WVQ"/>
        <union symbol="=" values="hsaFcpr"/>
        <union symbol="%" values="QV"/>

        <!-- B. Heights -->
        <!-- Farmhouse walls (w) and door wall (d): 2 storeys = 64 high + roof R -->
        <all steps="1">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d d"/>
        </all>
        <all steps="7">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w I"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="8">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w I"/>
          <rule in="B d" out="d I"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <prl>
          <rule in="w" out="R"/>
          <rule in="d" out="R"/>
        </prl>

        <!-- Farmhouse interior (h) and stair zone (s) -->
        <all steps="1">
          <rule in="B h" out="h h"/>
          <rule in="B s" out="s h"/>
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

        <!-- Barn walls (v) and interior (a): 1 storey = 34 high + roof J -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v I" steps="12"/>
        <all in="B v" out="v V" steps="14"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a a" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>

        <!-- Rural dovecote / granary turret (t): 48 high (lower than main house ridge) -->
        <all in="B t" out="t Q" steps="48"/>
        <prl in="t" out="B"/>

        <!-- Front porch (p floor, b posts): posts 33 high, roof J at 34 -->
        <all in="B p" out="p p" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <all in="B b" out="b P" steps="34"/>
        <prl in="b" out="J"/>

        <!-- Well (Q stone rim 8 high, L water 4 high) -->
        <all in="B Q" out="Q Q" steps="8"/>
        <all in="B L" out="L L" steps="4"/>

        <!-- Haystack (y): 12 high rounded mound -->
        <all in="B y" out="y Y" steps="8"/>
        <prl in="y" out="B"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>

        <!-- Wooden fence (z): 6 high -->
        <all in="B z" out="z P" steps="5"/>
        <prl in="z" out="B"/>

        <!-- Orchard apple trees (G trunk 10 high, X rounded canopy) -->
        <all in="B G" out="G P" steps="10"/>
        <prl in="G" out="X"/>
        <all in="XB" out="*X" steps="4"/>
        <all in="B X" out="X X" steps="6"/>

        <!-- C. Full scale details, doors, parts, windows, roofs -->
        <!-- Front door seed (O) on z=1 above threshold d -->
        <all in="d W" out="d O"/>

        <!-- Internal door seed (O) between farmhouse (h) and barn (a) on z=1 -->
        <one in="B/W/B h/w/a" out="*/O/* */*/*" symmetry="(xy)" steps="1"/>
        <all in="OW/OW/OW" out="OO/OO/OO" symmetry="(xy)" steps="6"/>
        <all in="W/O" out="O/*" symmetry="(xy)" steps="4"/>

        <!-- Barn exterior door into the farmyard (c) on z=1 -->
        <one in="B/V/B a/v/c" out="*/O/* */*/*" symmetry="(xy)" steps="1"/>
        <all in="OV/OV/OV" out="OO/OO/OO" symmetry="(xy)" steps="6"/>
        <all in="V/O" out="O/*" symmetry="(xy)" steps="4"/>

        <!-- Include seed parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Replace battlements on dovecote/well with pitched terracotta roof on dovecote so it looks rural, not military -->
        <prl in="M" out="B"/>
        <prl in="Q B" out="Q R"/>

        <!-- Windows in farmhouse and barn bands (I): 4x6 framed windows, no missing wall bands -->
        <one steps="20">
          <rule in="BI/BI/BI/BI BI/BI/BI/BI BI/BI/BI/BI BI/BI/BI/BI BI/BI/BI/BI BI/BI/BI/BI" out="*L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L"/>
        </one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I W" out="W W"/>
        <prl in="W I" out="W W"/>
        <prl in="I V" out="V V"/>
        <prl in="V I" out="V V"/>
        <prl in="I" out="W"/>

        <!-- Farmhouse and dovecote pitched roofs (R) + chimney (K) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>
        <one in="RR/RR BB/BB" out="**/** KK/KK" steps="1" symmetry="()"/>
        <all in="B K" out="K K" steps="10"/>

        <!-- Barn and porch roofs (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette -->
  <color symbol="E" value="#7a9a55" name="erba" hidden="True"/>
  <color symbol="h" value="#c89d66" name="pavimento in legno" area="house"/>
  <color symbol="s" value="#c89d66" name="pavimento in legno" area="house"/>
  <color symbol="w" value="#e8dcc5" name="intonaco chiaro" area="house"/>
  <color symbol="d" value="#c89d66" name="soglia" area="house"/>
  <color symbol="a" value="#b59b72" name="terra battuta fienile" area="barn"/>
  <color symbol="v" value="#b55942" name="mattone fienile" area="barn"/>
  <color symbol="t" value="#d6c7b2" name="pietra colombaia" area="tower"/>
  <color symbol="p" value="#b88b58" name="tavolato portico" area="porch"/>
  <color symbol="m" value="#b88b58" name="tavolato portico" area="porch"/>
  <color symbol="c" value="#c7b595" name="aia in ghiaia" area="yard"/>
  <color symbol="q" value="#8f8b84" name="base pozzo" area="yard"/>
  <color symbol="y" value="#e0b84c" name="paglia" area="yard"/>
  <color symbol="z" value="#78583a" name="staccionata" area="yard"/>
  <color symbol="g" value="#6e553b" name="terra arata" area="field"/>
  <color symbol="Z" value="#57412b" name="solco arato" area="field"/>
  <color symbol="r" value="#b09e82" name="sentiero" area="yard"/>
  <color symbol="u" value="#6e8c49" name="prato frutteto" area="orchard"/>

  <color symbol="W" value="#e8dcc5" name="muro intonacato"/>
  <color symbol="V" value="#b55942" name="muro di mattoni"/>
  <color symbol="Q" value="#d6c7b2" name="muro colombaia"/>
  <color symbol="F" value="#b88b58" name="solaio di legno"/>
  <color symbol="P" value="#78583a" name="trave di quercia"/>
  <color symbol="R" value="#a84a32" name="coppi di terracotta"/>
  <color symbol="J" value="#8f3d28" name="tettoia in coppi"/>
  <color symbol="K" value="#736e68" name="comignolo in pietra"/>
  <color symbol="L" value="#5a829e" name="vetro finestra"/>
  <color symbol="Y" value="#e0b84c" name="covone di fieno"/>
  <color symbol="X" value="#4f7838" name="chioma di melo"/>

  <color symbol="O" value="#8c5838" name="porta di legno"/>
  <color symbol="o" value="#593620" name="assi della porta"/>
  <color symbol="N" value="#736e68" name="stipite in pietra"/>
  <color symbol="M" value="#d6c7b2" name="cornice colombaia"/>
  <color symbol="k" value="#a37949" name="gradino di legno"/>
  <color symbol="U" value="#2b2927" name="feritoia colombaia"/>

  <color symbol="#20" value="#000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#000000" name="assi aperte" hidden="True"/>

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
