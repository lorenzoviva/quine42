# model.sculpt · gemini-4-neon · 96 s · 1 immagini

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.
It is not a fortification: no merlons, no arrow slits, nothing of a fort; its flat tops end in a cornice, a solid parapet, a railing, a skylight or a dome, as its world builds them.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

Your program:
<!--
Fattoria (casa colonica a due piani con portico, stalla/fienile, aia recintata, pozzo, campi e alberi)
Parti e lettere del piano (1 cella = 5x5 voxel):
- h: sala principale (piano terra), k: seconda stanza sul retro, j: muro interno divisorio orizzontale, w: muri esterni della casa, s: vano scala nella sala
- d: porta d'ingresso sul fronte, p: portico antistante, b: pilastri del portico, r: strada verso il bordo anteriore
- a: interno della stalla/fienile laterale, v: muri della stalla
- c: aia intorno agli edifici, f: recinzione dell'aia, q: pozzo nell'aia, l: campi coltivati oltre la recinzione, t: alberi sul terreno libero
- E: suolo, H: origine (pulita in h), m: marcatore temporaneo per l'asse della porta (pulito in h)
Variazione tra i semi: lato del vano scala, posizione della porta interna, lato e profondità della stalla/fienile, posizione del pozzo e degli alberi.
Adattamento alle dimensioni:
- Large (20x20): casa colonica a due piani con due stanze, scala, portico con pilastri, aia anteriore e strada fino al bordo.
- Huge (30x30) e Gargantuan (100x100): si aggiungono la stalla laterale, l'aia recintata intorno agli edifici, il pozzo, i campi coltivati e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhkwjsdmpbravcfqlt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 15x13 celle interne (75x65 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="7"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta d'ingresso sul fronte, centrata sull'asse di H, larga 3 celle (15 voxel) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico anteriore profondo 2 celle e largo 5, con pilastri agli angoli anteriori, e strada dritta al bordo -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <all in="pE/EE" out="b*/**" symmetry="(x)" steps="1"/>
      <all in="p/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Muro interno divisorio orizzontale: sala anteriore h (75x30 voxel) e stanza posteriore k (75x30 voxel) -->
      <one in="w/h/h/h/h/h/h/h" out="*/*/*/*/*/*/*/j" symmetry="()" steps="1"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <one in="w/h/h/h/h/h/h/j" out="*/k/*/*/*/*/*/*" symmetry="()" steps="1"/>
      <all in="kh" out="*k"/>

      <!-- Vano scala nella sala lungo il muro interno: 2 celle di pianerottolo, 4 di scala, 2 di sbarco -->
      <one in="jjjjjjjj/hhhhhhhh/hhhhhhhh" out="********/hhsssshh/hhsssshh" symmetry="()" steps="1"/>

      <!-- Stalla/fienile laterale su un lato casuale, solo dove c'è spazio (Huge e Gargantuan) -->
      <one in="EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw" out="*******/*******/**aaaa*/*******/*******" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia intorno agli edifici dove il terreno prosegue, poi recinzione -->
      <all in="[wvpb]EEE" out="*c**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo nell'aia dove entra un quadrato 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Campi coltivati oltre la recinzione (solo dove c'è spazio aperto) e alberi sul terreno libero -->
      <all in="fEEEEE" out="*lll**" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>

    <map scale="5 5 1" values="BEhwjdspbavrcQuZlXtWVfFPJRLKTkOoNUG#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="k" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="b" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="ccccc/cZZZc/cZZZc/cZZZc/ccccc"/>
      <rule in="q" out="QQQQQ/QuuuQ/QuuuQ/QuuuQ/QQQQQ"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="t" out="EEEEE/EEtEE/EtXtE/EEtEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze: muri esterni della casa (2 piani da 32, con fasce finestre U) -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Porta d'ingresso: seme O a z=0, muro W sopra, fascia finestre al secondo piano -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="31"/>
        <all in="B d" out="d W" steps="6"/>
        <all in="B d" out="d U" steps="14"/>
        <all in="B d" out="d W" steps="12"/>
        <prl in="d" out="R"/>

        <!-- Muro interno divisorio: alto 1 piano, poi solaio F -->
        <all in="B j" out="j W" steps="32"/>
        <prl in="j" out="F"/>

        <!-- Pavimenti, striscia scala T, solaio F e soffitto/tetto R della casa -->
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

        <!-- Portico anteriore: pavimento P, pilastri X alti 33, tetto J a z=33 -->
        <all in="B p" out="p P" steps="1"/>
        <all in="B p" out="p B" steps="32"/>
        <prl in="p" out="J"/>
        <all in="B b" out="b X" steps="33"/>
        <prl in="b" out="J"/>

        <!-- Stalla/fienile laterale: alta 36 con fascia finestre e tetto J -->
        <all in="B v" out="v V" steps="10"/>
        <all in="B v" out="v U" steps="12"/>
        <all in="B v" out="v V" steps="14"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="35"/>
        <prl in="a" out="J"/>

        <!-- Recinzione, pozzo e alberi -->
        <all in="B Z" out="Z X" steps="9"/>
        <prl in="Z" out="X"/>
        <all in="B Q" out="Q P" steps="8"/>
        <prl in="Q" out="P"/>
        <all in="B u" out="u u" steps="4"/>
        <all in="B t" out="t X" steps="16"/>
        <prl in="t" out="L"/>
        <all in="LB" out="*L" steps="4"/>
        <all in="B L" out="L *" steps="4"/>

        <!-- C. Scala piena: porta interna tra le due stanze al piano terra -->
        <one in="f/W/W/W/W/W/f" out="*/O/O/O/O/O/*" symmetry="()" steps="1"/>
        <all in="OW" out="*O" symmetry="(x)" steps="5"/>

        <!-- Parti incluse: porte, scala, finestre -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <prl in="U" out="W"/>

        <!-- Tetti a padiglione con grondaia e camino -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="6"/>
      </sequence>
    </map>
  </map>

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

  <color symbol="B" value="000000" hidden="True" name="aria"/>
  <color symbol="E" value="6E8B4E" hidden="True" name="suolo"/>
  <color symbol="H" value="D4A76A" name="origine"/>
  <color symbol="m" value="D4A76A" name="asse"/>
  <color symbol="h" value="C9A87C" area="house" name="sala"/>
  <color symbol="w" value="E8DFD1" name="muro della casa"/>
  <color symbol="j" value="D8CEBE" name="muro interno"/>
  <color symbol="s" value="8C6239" area="house" name="scala"/>
  <color symbol="d" value="6B4226" name="porta"/>
  <color symbol="p" value="A89882" area="porch" name="portico"/>
  <color symbol="b" value="5C3A21" name="pilastro"/>
  <color symbol="r" value="A39B8B" area="road" name="strada"/>
  <color symbol="a" value="A68A5B" area="barn" name="stalla"/>
  <color symbol="v" value="9E5A40" name="muro della stalla"/>
  <color symbol="c" value="C7B889" area="yard" name="aia"/>
  <color symbol="q" value="4F86A8" name="pozzo"/>
  <color symbol="l" value="7D6D42" area="field" name="campo"/>
  <color symbol="t" value="4A7A42" name="albero"/>

  <color symbol="W" value="E8DFD1" name="intonaco"/>
  <color symbol="V" value="9E5A40" name="muro della stalla"/>
  <color symbol="f" value="C9A87C" area="house" name="pavimento in legno"/>
  <color symbol="F" value="B8956A" name="solaio in legno"/>
  <color symbol="P" value="9E988E" area="porch" name="pietra"/>
  <color symbol="X" value="5C3A21" name="legno scuro"/>
  <color symbol="R" value="B84A39" name="tegole della casa"/>
  <color symbol="J" value="8F563B" name="tetto in legno e tegole"/>
  <color symbol="L" value="4A7A42" name="chioma"/>
  <color symbol="K" value="7D776E" name="camino"/>
  <color symbol="Q" value="9E988E" name="bordo del pozzo"/>
  <color symbol="u" value="4F86A8" name="acqua"/>
  <color symbol="Z" value="5C3A21" name="recinzione"/>

  <color symbol="T" value="8C6239" name="striscia scala"/>
  <color symbol="k" value="A67C52" name="gradino"/>
  <color symbol="O" value="7A4B2A" name="porta di legno"/>
  <color symbol="o" value="4A2C16" name="assi della porta"/>
  <color symbol="N" value="63412C" name="infisso"/>
  <color symbol="U" value="E8DFD1" name="fascia finestre"/>
  <color symbol="G" value="7FA8C9" name="vetro"/>
  <color symbol="#20" value="7A4B2A" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="4A2C16" hidden="True" name="assi aperte"/>
  <color symbol="#90" value="000000" hidden="True" name="segno"/>
  <color symbol="#91" value="000000" hidden="True" name="segno"/>
  <color symbol="#92" value="000000" hidden="True" name="segno"/>
</sequence>
The attached image shows it from four sides. The Artist gave it 4/10.
Problems: Sul tetto svetta un'antenna con parabola e segnale, elemento tecnologico moderno del tutto fuori posto nel mondo medievale.; L'architettura è rigida e blocco unico, più simile a una caserma cittadina che a una fattoria di campagna: mancano porticati, legnaie o annessi per il fieno.; La facciata presenta finestre rettangolari grigie disposte in modo troppo industriale e uniforme, prive di calore o dettagli rustici.
Advice: Rimuovere l'antenna e la parabola dal colmo del tetto, sostituendole con un comignolo in muratura o pietra.; Aggiungere una tettoia laterale o posteriore in legno per attrezzi o fieno, rendendo la sagoma meno a blocco e più articolata.; Spezzare la monotonia delle pareti intonacate inserendo una zoccolatura in pietra alla base o travi a vista in legno.
What the game made of it, in text:
### Seed 1: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E suolo, k gradino, r strada, c aia, f pavimento in legno, l campo, X legno scuro, W intonaco, F solaio in legno, P pietra, J tetto in legno e tegole, R tegole della casa, K camino, O porta di legno, o assi della porta, N infisso, G vetro
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRRREE
EEEEERRRFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll
EEElcRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll
EEEXXcccccccccccccccJJJJJJJJJJJJJcccccccccccccccXX
EEEXccccccccccccccccJJJJJJJJJJJJJcccccccccccccccXc
EEEcccccccccccccccccJJJJJJJJJJJJJccccccccccccccccc
EEEXXcccccccccccccccJJJJJJJJJJJJJcccccccccccccccXX
EEEcccccccccccccccccJJJJJJJJJJJJJccccccccccccccccc
EEEXXcXcXXcXcXXcXcXXEEErrrrrrrEEEXXcXcXXcXcXXcXcXX
EEEXccXcXccXcXccXcXcEEErrrrrrrEEEXccXcXccXcXccXcXc
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000sssssssssssssssssssssssssssssssssssssssssss00
0000stttttttttttttttttttttttttttttttttttttttttts00
0000stttttttttttttttttttttttttttttttttttttttttts00
0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
0000sttutttttttttttttttttttttttwttttttttttttutts00
0000stttttttttttttttttttttttttttttttttttttttttts00
0000stttssssssssssssssssssssssssssssssssssssttts00
0000sttseeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeestts00
0000stttssssssssssssssssssssssssssssssssssssttts00
0000stttttttttttttttttttttttttttttttttttttttttts00
0000sttuttttttttttttttttttttttttttttttttttttutts00
0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
0000stttttttttttttttttttttttttttttttttttttttttts00
0000stttttttttttttttttttttttttttttttttttttttttts00
0000ssssssssssssssssssssssssssssssssssssssssssss00
0004400000000000000ffffffffffffff00000000000000044
0004400000000000000ffggggggggggff00000000000000044
0004400000000000000ffggggggggggff00000000000000044
0004400000000000000ffffffffffffff00000000000000044
0000000000000000000ffffffffffffff00000000000000000
00044440444404444044000000000000044440444404444044
00044440444404444044000000000000044440444404444044
```
Front (looking from the front; the sky at the top):
```
.............RRRRRRRRRRRRRRRRRRRRRRRRRRR..........
...........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR........
.........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR......
.......RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....
.....RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWNGGNWWWNGGNWWWNGGGNWWWGGGNWWWGGGNWWWWW..
.....WWWWWNGGGWWWNGGGWWWNGGGNWWWGGGNWWWGGGNWWWWW..
.....WWWWWNGGGWWWNGGGWWWNGGGNWWWGGGNWWWGGGNWWWWW..
.....WWWWWNGGGWWWNGGGWWWNGGGNWWWGGGNWWWGGGNWWWWW..
.....WWWWWNGGGWWWNGGGWWWNGGGNWWWGGGNWWWGGGNWWWWW..
.....WWWWWNGGGWWWNGGGWWWNGGGNWWWGGGNWWWGGGNWWWWW..
.....WWWWWNNNNWWWNNNNWWWNNNNNWWWNNNNWWWNNNNWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWJJJJJJJJJJJWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWJXWWWWWWWWJXWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWXWNNNNNNNWXWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWXNoooooooNXWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWXNoooooooNXWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWXNoooooooNXWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWXNoooooooNXWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWXNoooooooNXWWWWWWWWWWWWWWWW..
.....WWWWWWWGGGNWWWWWXWoooooooWXWWWWWGGGNWWWWWWW..
.....WWWWWWWGGGGWWWWWXWoooooooWXWWWWWGGGGWWWWWWW..
.....WWWWWWWGGGGWWWWWXWoooooooWXWWWWWGGGGWWWWWWW..
.....WWWWWWWGGGGWWWWWXWoooooooWXWWWWWGGGGWWWWWWW..
.....WWWWWWWGGGGWWWWWXWoooooooWXWWWWWGGGGWWWWWWW..
...XXWXWXXWXGXXGXWXXWXWoooooooWXWXXWXGXXGXWXXWXWXX
...XXWXWXXWXNXXXXWXXWXWoooooooWXWXXWXNXXXXWXXWXWXX
...XXWXWXXWXWXXWXWXXOXoooooooooXOXXWXWXXWXWXXWXWXX
...XXWXWXXWXWXXWXWXXOXoooooooooXOXXWXWXXWXWXXWXWXX
EEEcccccccccccccccccEEorrrrrrrEEEccccccccccccccccc
```
Right side (looking from the right):
```
.............RR.....K............RR...............
...........RRRRRR...K..........RRRRRR.............
.........RRRRRRRRRR.K........RRRRRRRRRR...........
.......RRRRRRRRRRRRRRRR..RRRRRRRRRRRRRRRR.........
.....RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWGGGNWWWGGGNWWWGGGNWWWNGGNWWWNGGNWWW.......
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW.......
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW.......
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW.......
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW.......
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW.......
.....WWWNNNNWWWNNNNWWWNNNNWWWNNNNWWWNNNNWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.JJJ...
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJXJ..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..XX...
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..XX...
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..XX...
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..XX...
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..XX...
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..XX...
.....WWWGGGNWWWGGGNWWWGGGNWWWNGGNWWWNGGNWWW..XX...
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW..XX...
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW..XX...
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW..XX...
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWW..XX...
.....WWWGGGNWWWGGGNWWWGGGGWWWNGGGWWWNGGGWWWXXXX.XX
.....WWWNNNNWWWNNNNWWWNNNNWWWNNNNWWWNNNNWWWXXXX.XX
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXX.XX
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXX.XX
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEllllllllccccccc
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.....WWWWWNGGGWWWNGGGWWWNGGGWWWWGGGWWWWGGGWWWWWW..
.....WWWWWW..WWWWW..WWWWW...WWWW...WWWW...WWWWWW..
.....WWWWW....WWW....WWW....WWWW...WWWW...WWWWWW..
.....G.........................................G..
.....G.........................................G..
.....G.........................................G..
.....WWW.....................................WWN..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....G.........................................G..
.....G.........................................G..
.....G.........................................G..
.....WWW.....................................WWN..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....G..WWWWWWWWWWWWWWWWWWWWWWWWWNoooooNWWWWW..G..
.....G.WWWWWWWWWWWWWWWWWWWWWWWWWWNoooooNWWWWW..G..
.....G.WWWWWWWWWWWWWWWWWWWWWWWWWWNoooooNWWWWW..G..
.....GW..................kkkkkk..............WWG..
.....WWW.................kkkkkk..............WWW..
.....WWW.................kkkkkk..............WWW..
.....WWW.................kkkkkk..............WWW..
.....NW..................kkkkkk..............WWN..
.....G.........................................G..
.....G.........................................G..
.....GW......................................WWG..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....NW......................................WWN..
.....G.........................................G..
.....G.........................................G..
.....GW......................................WWG..
.....WWWWWWW...WWWWWWWWoooooooWWWWWWW...WWWWWWWW..
.....WWWWWWW...WWWWWWWWoooooooWWWWWWW...WWWWWWWW..
.....WWWWWWWGGGGWWWWWWWoooooooWWWWWWWGGGGWWWWWW...
..................................................
..................................................
.....................X.........X..................
....................XX........XX..................
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
.....WWWWWNGGGWWWNGGGWWWNGGGWWWWGGGWWWWGGGWWWWWW..
.....WWWWWW..WWWWW..WWWWW...WWWW...WWWW...WWWWWW..
.....WWWWW....WWW....WWW....WWWW...WWWW...WWWWWW..
.....G.........................................G..
.....G.........................................G..
.....G.........................................G..
.....WWW.....................................WWN..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....G.........................................G..
.....G.........................................G..
.....G.........................................G..
.....WWW.....................................WWN..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....G.........................................G..
.....G.........................................G..
.....G.........................................G..
.....GW......................................WWG..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....NW......................................WWN..
.....G.........................................G..
.....G.........................................G..
.....GW......................................WWG..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....WWW.....................................WWW..
.....NW......................................WWN..
.....G.........................................G..
.....G.........................................G..
.....GW......................................WWG..
.....WWWWWW..WWWWW..WWWWW...WWWW...WWWW...WWWWWW..
.....WWWWWW..WWWWW..WWWWW...WWWW...WWWW...WWWWWW..
.....WWWWWNGGGWWWNGGGWWWNGGGNWWWGGGNWWWGGGNWWWW...
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000sssssssssssssssssssssssssssssssssssssssssss00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwzwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuttttttttttttttttttttttttttttttttttttutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttssssssssssssssssssssssssssssssssssssttts00
EEEEERRRFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRRREE   0000sttseeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeestts00
EEEEERRRFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRRRREE   0000stttssssssssssssssssssssssssssssssssssssttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuttttttttttttttttttttttttttttttttttttutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000stttttttttttttttttttttttttttttttttttttttttts00
EEElcRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000ssssssssssssssssssssssssssssssssssssssssssss00
EEEXXcccccccccccccccJJJJJJJJJJJJJcccccccccccccccXX   0004400000000000000ffffffffffffff00000000000000044
EEEXccccccccccccccccJJJJJJJJJJJJJcccccccccccccccXc   0004400000000000000ffggggggggggff00000000000000044
EEEcccccccccccccccccJJJJJJJJJJJJJccccccccccccccccc   0004400000000000000ffggggggggggff00000000000000044
EEEXXcccccccccccccccJJJJJJJJJJJJJcccccccccccccccXX   0004400000000000000ffffffffffffff00000000000000044
EEEcccccccccccccccccJJJJJJJJJJJJJccccccccccccccccc   0000000000000000000ffffffffffffff00000000000000000
EEEXXcXcXXcXcXXcXcXXEEErrrrrrrEEEXXcXcXXcXcXXcXcXX   00044440444404444044000000000000044440444404444044
EEEXccXcXccXcXccXcXcEEErrrrrrrEEEXccXcXccXcXccXcXc   00044440444404444044000000000000044440444404444044
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000sssssssssssssssssssssssssssssssssssssssssss00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttttttttttttttttttttttttttttttttttttttwtts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuttttttttttttttttttttttttttttttttttttutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttssssssssssssssssssssssssssssssssssssttts00
EEEEERRRFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRRREE   0000sttseeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeestts00
EEEEERRRFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRRRREE   0000stttssssssssssssssssssssssssssssssssssssttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuttttttttttttttttttttttttttttttttttttutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000stttttttttttttttttttttttttttttttttttttttttts00
EEEllRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000stttttttttttttttttttttttttttttttttttttttttts00
EEElcRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRll   0000ssssssssssssssssssssssssssssssssssssssssssss00
EEEXXcccccccccccccccJJJJJJJJJJJJJcccccccccccccccXX   0004400000000000000ffffffffffffff00000000000000044
EEEXccccccccccccccccJJJJJJJJJJJJJcccccccccccccccXc   0004400000000000000ffggggggggggff00000000000000044
EEEcccccccccccccccccJJJJJJJJJJJJJccccccccccccccccc   0004400000000000000ffggggggggggff00000000000000044
EEEXXcccccccccccccccJJJJJJJJJJJJJcccccccccccccccXX   0004400000000000000ffffffffffffff00000000000000044
EEEcccccccccccccccccJJJJJJJJJJJJJccccccccccccccccc   0000000000000000000ffffffffffffff00000000000000000
EEEXXcXcXXcXcXXcXcXXEEErrrrrrrEEEXXcXcXXcXcXXcXcXX   00044440444404444044000000000000044440444404444044
EEEXccXcXccXcXccXcXcEEErrrrrrrEEEXccXcXccXcXccXcXc   00044440444404444044000000000000044440444404444044
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 171 nodi, 683 passi, finito in 718 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=origine, E=suolo (marcatore), h=sala, k=gradino, w=muro della casa, j=muro interno, s=scala, d=porta, m=asse, p=portico, b=pilastro, r=strada, c=aia, f=pavimento in legno, l=campo, Z=recinzione, X=legno scuro, W=intonaco, F=solaio in legno, P=pietra, J=tetto in legno e tegole, R=tegole della casa, K=camino, T=striscia scala, O=porta di legno, o=assi della porta, N=infisso, U=fascia finestre, G=vetro, #90=segno (marcatore), #91=segno (marcatore), #92=segno (marcatore), #93=terreno di prova (marcatore), #94=porta di prova, #95=solaio di prova, #96=pavimento di prova, #97=? (marcatore).
Alla fine: W 87852, R 28996, F 4715, f 4500, o 3960, G 2772, k 2720, N 2393, X 2214, E 2100, c 888, J 513, O 240, P 232, l 150, r 75, K 7.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-39 all×21, prl×1, one×3: 444 celle x1-19 y2-19 z0, passi 2-76
   #42 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 77
    #44 all . w → w W passi=6: ×6, 17100 celle x10-94 y10-84 z0-6, passi 78-83, w→W 8550, .→w 8550
    #45 all . w → w U passi=14: ×14, 39900 celle x10-94 y10-84 z6-20, passi 84-97, w→U 19950, .→w 19950
    #46 all . w → w W passi=12: ×12, 34200 celle x10-94 y10-84 z20-32, passi 98-109, w→W 17100, .→w 17100
    #47 all . w → w W passi=6: ×6, 17100 celle x10-94 y10-84 z32-38, passi 110-115, w→W 8550, .→w 8550
    #48 all . w → w U passi=14: ×14, 39900 celle x10-94 y10-84 z38-52, passi 116-129, w→U 19950, .→w 19950
    #49 all . w → w W passi=12: ×12, 34200 celle x10-94 y10-84 z52-64, passi 130-141, w→W 17100, .→w 17100
#50-60 prl×3, all×8: 44875 celle x10-94 y10-84 z0-64, passi 142-242
    #61 all . h → h . passi=31: ×31, 266600 celle x15-89 y15-79 z1-32, passi 243-273, h→. 133300, .→h 133300
#62-63 all×2: 21000 celle x15-89 y15-79 z2-33, passi 274-304
    #64 all . h → h . (+1) passi=31: ×31, 279000 celle x15-89 y15-79 z33-64, passi 305-335, h→. 133300, .→h 133300, s→. 6200, .→s 6200
      r1 . h → h . ×133300; r2 . s → s . ×6200
#65-128 prl×8, all×18, one×1: 46333 celle x6-98 y15-98 z0-64, passi 336-550
#140-156 all×5, prl×9: 41066 celle x9-95 y9-85 z6-51, passi 551-656
#157-164 prl×2, all×4: 26751 celle x9-95 y9-85 z6-51, passi 657-662
    #165 prl U → W: ×1, 25592 celle x10-94 y10-84 z6-51, passi 663, U→W 25592
#166-171 all×5, one×1: 23266 celle x9-95 y9-95 z33-73, passi 664-683
Senza effetto (non hanno mai cambiato una cella):
#20 all r/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#26 one EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw → *******/*******/**aaaa*/*******/******* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#27 all E/a → a/* passi=3: in quel momento nella griglia non c'erano celle "a"
#28 all a/E → */a passi=3: in quel momento nella griglia non c'erano celle "a"
#29 prl a/E → */a passi=1: in quel momento nella griglia non c'erano celle "a"
#30 all aE → *v: in quel momento nella griglia non c'erano celle "a"
#31 all vE/*v → *v/**: in quel momento nella griglia non c'erano celle "v"
#34 all cEEEE → *cc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#38 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#40 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#71 all . v → v V passi=10: in quel momento nella griglia non c'erano celle "v"
… e altri 48
Improve it: answer with the whole program.

## Risposta

<!--
Fattoria (casa colonica a due piani con zoccolatura in pietra, travi a vista, portico asimmetrico, fieno, stalla/fienile, aia recintata, pozzo, campi e alberi)
Parti e lettere del piano (1 cella = 5x5 voxel):
- h: sala principale (piano terra), k: seconda stanza sul retro, j: muro interno divisorio orizzontale, w: muri esterni della casa, s: vano scala nella sala
- d: porta d'ingresso sul fronte, p: portico/veranda anteriore, b: pilastri del portico, r: strada verso il bordo anteriore
- a: interno della stalla/fienile laterale, v: muri della stalla
- c: aia intorno agli edifici, f: recinzione dell'aia, q: pozzo nell'aia, y: pagliaio/fieno nell'aia, l: campi coltivati oltre la recinzione, t: alberi sul terreno libero
- E: suolo, H: origine (pulita in h), m: marcatore temporaneo per l'asse della porta (pulito in h)
Variazione tra i semi: lato dell'estensione del portico anteriore, lato del vano scala, posizione della porta interna, posizione del pagliaio e del comignolo, lato e profondità della stalla/fienile, posizione del pozzo e degli alberi.
Adattamento alle dimensioni:
- Large (20x20): casa colonica a due piani con zoccolatura in pietra, travi in legno, due stanze, scala, portico/veranda asimmetrico, pagliaio, aia anteriore recintata e strada fino al bordo.
- Huge (30x30) e Gargantuan (100x100): si aggiungono la stalla/fienile laterale, l'aia recintata intorno agli edifici, il pozzo, i campi coltivati e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhkwjsdmpbravcfqlyt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 15x13 celle interne (75x65 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="7"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta d'ingresso sul fronte, centrata sull'asse di H, larga 3 celle (15 voxel) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico anteriore profondo 2 celle, esteso asimmetricamente su un lato a caso, con pilastri e strada al bordo -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <one in="ppE/ppE" out="**p/**p" symmetry="(x)" steps="1"/>
      <all in="ww/pE" out="**/*p" symmetry="(x)" steps="3"/>
      <all in="pE/pE" out="*p/*p" symmetry="(x)" steps="3"/>
      <all in="pE/EE" out="b*/**" symmetry="(x)" steps="1"/>
      <all in="d/p/p/E" out="*/*/*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Muro interno divisorio orizzontale: sala anteriore h (75x30 voxel) e stanza posteriore k (75x30 voxel) -->
      <one in="w/h/h/h/h/h/h/h" out="*/*/*/*/*/*/*/j" symmetry="()" steps="1"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <one in="w/h/h/h/h/h/h/j" out="*/k/*/*/*/*/*/*" symmetry="()" steps="1"/>
      <all in="kh" out="*k"/>

      <!-- Vano scala nella sala lungo il muro interno: 2 celle di pianerottolo, 4 di scala, 2 di sbarco -->
      <one in="jjjjjjjj/hhhhhhhh/hhhhhhhh" out="********/hhsssshh/hhsssshh" symmetry="()" steps="1"/>

      <!-- Stalla/fienile laterale su un lato casuale, solo dove c'è spazio (Huge e Gargantuan) -->
      <one in="EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw" out="*******/*******/**aaaa*/*******/*******" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia intorno agli edifici dove il terreno prosegue, poi recinzione -->
      <all in="[wvpb]EEE" out="*c**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pagliaio/fieno nell'aia e pozzo dove entra un quadrato 5x5 -->
      <one in="cc/cc" out="y*/**" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Campi coltivati oltre la recinzione (solo dove c'è spazio aperto) e alberi sul terreno libero -->
      <all in="fEEEEE" out="*lll**" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>

    <map scale="5 5 1" values="BEhwjdspbavrcQuZlyXtWVfFPJRLKYTkOoNUG#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="k" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="b" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="ccccc/cZZZc/cZZZc/cZZZc/ccccc"/>
      <rule in="q" out="QQQQQ/QuuuQ/QuuuQ/QuuuQ/QQQQQ"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="t" out="EEEEE/EEtEE/EtXtE/EEtEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WVP"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze: muri esterni della casa con zoccolatura in pietra P, intonaco W, finestre U e travi in legno X -->
        <all in="B w" out="w P" steps="6"/>
        <all in="B w" out="w W" steps="2"/>
        <all in="B w" out="w U" steps="10"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w X" steps="2"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="10"/>
        <all in="B w" out="w W" steps="14"/>
        <all in="B w" out="w X" steps="2"/>
        <prl in="w" out="R"/>

        <!-- Porta d'ingresso: seme O a z=0, zoccolatura P, intonaco W, trave X, secondo piano con finestre U -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d P" steps="5"/>
        <all in="B d" out="d W" steps="24"/>
        <all in="B d" out="d X" steps="2"/>
        <all in="B d" out="d W" steps="6"/>
        <all in="B d" out="d U" steps="10"/>
        <all in="B d" out="d W" steps="14"/>
        <all in="B d" out="d X" steps="2"/>
        <prl in="d" out="R"/>

        <!-- Muro interno divisorio: alto 1 piano, solaio F a z=32, aria al secondo piano, poi tetto R a z=64 -->
        <all in="B j" out="j W" steps="32"/>
        <all in="B j" out="j F" steps="1"/>
        <all in="B j" out="j B" steps="31"/>
        <prl in="j" out="R"/>

        <!-- Pavimenti, striscia scala T, solaio F e soffitto/tetto R della casa -->
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

        <!-- Portico anteriore: pavimento P, pilastri X alti 33, tetto J a z=33 -->
        <all in="B p" out="p P" steps="1"/>
        <all in="B p" out="p B" steps="32"/>
        <prl in="p" out="J"/>
        <all in="B b" out="b X" steps="33"/>
        <prl in="b" out="J"/>

        <!-- Stalla/fienile laterale: zoccolatura P, muri V, fascia finestre U, trave X e tetto J -->
        <all in="B v" out="v P" steps="6"/>
        <all in="B v" out="v V" steps="4"/>
        <all in="B v" out="v U" steps="10"/>
        <all in="B v" out="v V" steps="14"/>
        <all in="B v" out="v X" steps="2"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="35"/>
        <prl in="a" out="J"/>

        <!-- Recinzione, pozzo, pagliaio e alberi -->
        <all in="B Z" out="Z X" steps="9"/>
        <prl in="Z" out="X"/>
        <all in="B Q" out="Q P" steps="8"/>
        <prl in="Q" out="P"/>
        <all in="B u" out="u u" steps="4"/>
        <all in="B y" out="y Y" steps="10"/>
        <prl in="y" out="Y"/>
        <all in="B t" out="t X" steps="16"/>
        <prl in="t" out="L"/>
        <all in="LB" out="*L" steps="4"/>
        <all in="B L" out="L *" steps="4"/>

        <!-- C. Scala piena: porta interna tra le due stanze al piano terra -->
        <one in="f/W/W/W/W/W/f" out="*/O/O/O/O/O/*" symmetry="()" steps="1"/>
        <all in="OW" out="*O" symmetry="(x)" steps="5"/>

        <!-- Parti incluse: porte, scala, finestre -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <prl in="U" out="W"/>

        <!-- Tetti a padiglione con grondaia e comignolo in pietra 3x3 -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="11" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>
        <one in="B R" out="K *" steps="1" symmetry="()"/>
        <all in="KB" out="*K" steps="1"/>
        <all in="KB/*K" out="*K/**" steps="1"/>
        <all in="K B" out="* K"/>
        <all in="B K" out="K *" steps="7"/>
      </sequence>
    </map>
  </map>

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

  <color symbol="B" value="000000" hidden="True" name="aria"/>
  <color symbol="E" value="6E8B4E" hidden="True" name="suolo"/>
  <color symbol="H" value="D4A76A" name="origine"/>
  <color symbol="m" value="D4A76A" name="asse"/>
  <color symbol="h" value="C9A87C" area="house" name="sala"/>
  <color symbol="w" value="E8DFD1" name="muro della casa"/>
  <color symbol="j" value="D8CEBE" name="muro interno"/>
  <color symbol="s" value="8C6239" area="house" name="scala"/>
  <color symbol="d" value="6B4226" name="porta"/>
  <color symbol="p" value="A89882" area="porch" name="portico"/>
  <color symbol="b" value="5C3A21" name="pilastro"/>
  <color symbol="r" value="A39B8B" area="road" name="strada"/>
  <color symbol="a" value="A68A5B" area="barn" name="stalla"/>
  <color symbol="v" value="9E5A40" name="muro della stalla"/>
  <color symbol="c" value="C7B889" area="yard" name="aia"/>
  <color symbol="q" value="4F86A8" name="pozzo"/>
  <color symbol="y" value="D6B152" area="yard" name="fieno"/>
  <color symbol="l" value="7D6D42" area="field" name="campo"/>
  <color symbol="t" value="4A7A42" name="albero"/>

  <color symbol="W" value="EADFC9" name="intonaco caldo"/>
  <color symbol="V" value="A65E42" name="muro della stalla"/>
  <color symbol="f" value="C9A87C" area="house" name="pavimento in legno"/>
  <color symbol="F" value="B8956A" name="solaio in legno"/>
  <color symbol="P" value="969086" area="porch" name="pietra"/>
  <color symbol="X" value="5C3A21" name="legno scuro"/>
  <color symbol="R" value="B84A39" name="tegole della casa"/>
  <color symbol="J" value="8F563B" name="tetto in legno e tegole"/>
  <color symbol="L" value="4A7A42" name="chioma"/>
  <color symbol="K" value="8C857B" name="comignolo in pietra"/>
  <color symbol="Y" value="D6B152" name="pagliaio"/>
  <color symbol="Q" value="969086" name="bordo del pozzo"/>
  <color symbol="u" value="4F86A8" name="acqua"/>
  <color symbol="Z" value="5C3A21" name="recinzione"/>

  <color symbol="T" value="8C6239" name="striscia scala"/>
  <color symbol="k" value="A67C52" name="gradino"/>
  <color symbol="O" value="7A4B2A" name="porta di legno"/>
  <color symbol="o" value="4A2C16" name="assi della porta"/>
  <color symbol="N" value="5C3820" name="infisso in legno"/>
  <color symbol="U" value="EADFC9" name="fascia finestre"/>
  <color symbol="G" value="6B9EC2" name="vetro"/>
  <color symbol="#20" value="7A4B2A" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="4A2C16" hidden="True" name="assi aperte"/>
  <color symbol="#90" value="000000" hidden="True" name="segno"/>
  <color symbol="#91" value="000000" hidden="True" name="segno"/>
  <color symbol="#92" value="000000" hidden="True" name="segno"/>
</sequence>

