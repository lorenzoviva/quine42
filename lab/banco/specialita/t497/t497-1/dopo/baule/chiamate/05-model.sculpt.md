# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 6415 token d'ingresso (4073 in cache), 729 d'uscita, 2182 di ragionamento · $0.0051

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

Parts of the seed the program may include with <import file="…"/> where the thing has one, instead of writing it: build what the part reads, mark what it asks, include it, give its letters your colours and use them for nothing else (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-leaf"/>: Leaves and lids that open (part-leaf), included after the piece is built: write each leaf shut with L, one voxel thick on a face with air in front of it, and its hinge with #80, the air cell in front of the end it turns on, at every layer of the leaf (a lid: the air over its back edge, all along it). It writes #81, hidden, where the leaf turns open on its hinge, out into the air as far as the leaf is wide (leave that air free; two hinges at the two ends of one run of L share it). The actions are yours: <action name="open" label="Apri le ante"><all><rule in="L" out="#82"/><rule in="#81" out="#83"/></all></action>, close back; #82 is hidden, give #83 the colour of L.
- <import file="part-wheel"/>: Wheels on an axle (part-wheel), included after the piece and its axles are built: mark each hub with H, on the axle or just past its end, with air on both sides of it across the axle and under it (two H side by side along the axle: a wheel two thick). The wheel grows round its hub in the plane across the axle, as large as the hub is high over what is under it (the ground, a floor, a deck), and touches it: I the iron tyre and hub, J the felloe and eight spokes (give I and J your colours). Two wheels in one plane must not touch.

## Risposta

<sequence values="BNnIKL#80#81#82#83S" size="20 20 20" symmetry="(xy)" name="Baule da viaggio">
  <color symbol="N" value="8a5a30" name="legno"/>
  <color symbol="n" value="5e3c20" name="fessure"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="K" value="8a5a30" name="struttura coperchio"/>
  <color symbol="L" value="8a5a30" name="coperchio mobile"/>
  <color symbol="S" value="c8a040" name="serratura"/>
  <color symbol="#80" value="4a4f5a" hidden="True"/>
  <color symbol="#81" value="000000" hidden="True"/>
  <color symbol="#82" value="8a5a30" hidden="True"/>
  <color symbol="#83" value="8a5a30" hidden="True"/>

  <!-- Corpo del baule -->
  <box at="10 10 0" size="16 12 8" color="N"/>
  
  <!-- Fasce di ferro -->
  <box at="10 4 0" size="16 1 8" color="I"/>
  <box at="10 16 0" size="16 1 8" color="I"/>
  <box at="4 10 0" size="1 12 8" color="I"/>
  <box at="16 10 0" size="1 12 8" color="I"/>

  <!-- Coperchio bombato (inizialmente rettangolare) -->
  <box at="10 10 9" size="16 12 4" color="L"/>
  
  <!-- Arrotondamento del coperchio -->
  <all symmetry="()">
    <rule in="L/B" out="B/B"/>
    <rule in="B/L" out="B/B"/>
  </all>
  <all in="L" out="L" symmetry="(x)"/>

  <!-- Cerniere (per part-leaf) -->
  <box at="10 4 9" size="16 1 1" color="#80"/>

  <!-- Importazione della parte mobile -->
  <import file="part-leaf"/>

  <!-- Dettagli e serratura -->
  <one in="N/B" out="*/S" symmetry="()" steps="1"/>
  <prl in="N" out="n" p="0.05" steps="1"/>
  
  <!-- Azione -->
  <action name="open" label="Apri il coperchio">
    <all>
      <rule in="L" out="#82"/>
      <rule in="#81" out="#83"/>
    </all>
  </action>
</sequence>
