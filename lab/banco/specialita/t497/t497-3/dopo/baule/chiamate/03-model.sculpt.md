# model.sculpt · primo · gemini-3.1-flash-lite · 11 s · 6415 token d'ingresso (4073 in cache), 661 d'uscita, 3237 di ragionamento · $0.0065

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

Parts of the seed the program may include with <import file="…"/> where the thing has one, instead of writing it: build what the part reads, mark what it asks, include it, give its letters your colours and use them for nothing else (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-leaf"/>: Leaves and lids that open (part-leaf), included after the piece is built: write each leaf shut with L, one voxel thick on a face with air in front of it, and its hinge with #80, the air cell in front of the end it turns on, at every layer of the leaf (a lid: the air over its back edge, all along it). It writes #81, hidden, where the leaf turns open on its hinge, out into the air as far as the leaf is wide (leave that air free; two hinges at the two ends of one run of L share it). The actions are yours: <action name="open" label="Apri le ante"><all><rule in="L" out="#82"/><rule in="#81" out="#83"/></all></action>, close back; #82 is hidden, give #83 the colour of L.
- <import file="part-wheel"/>: Wheels on an axle (part-wheel), included after the piece and its axles are built: mark each hub with H, on the axle or just past its end, with air on both sides of it across the axle and under it (two H side by side along the axle: a wheel two thick). The wheel grows round its hub in the plane across the axle, as large as the hub is high over what is under it (the ground, a floor, a deck), and touches it: I the iron tyre and hub, J the felloe and eight spokes (give I and J your colours). Two wheels in one plane must not touch.

## Risposta

<sequence values="BNnIKLS" size="20 20 20" name="BauleDaViaggio">
  <color symbol="N" value="8a5a30" name="legno"/>
  <color symbol="n" value="5e3c20" name="venature"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="L" value="9a6a3a" name="coperchio"/>
  <color symbol="S" value="c8a040" name="serratura"/>

  <!-- Struttura del corpo -->
  <box at="10 10 0" size="16 12 8" color="N"/>
  
  <!-- Coperchio bombato: L posizionato ad arco -->
  <box at="10 10 8" size="16 12 1" color="L"/>
  <box at="10 10 9" size="14 10 1" color="L"/>
  <box at="10 10 10" size="12 8 1" color="L"/>

  <!-- Dettagli: Venature e bordi -->
  <prl in="N" out="n" p="0.05" steps="1"/>
  
  <!-- Cerchi di ferro -->
  <box at="6 10 0" size="2 12 11" color="I"/>
  <box at="14 10 0" size="2 12 11" color="I"/>
  <box at="10 10 0" size="2 12 11" color="I"/>

  <!-- Serratura centrale -->
  <box at="10 16 4" size="2 1 3" color="S"/>
  
  <!-- Cerniere per il coperchio (sul bordo posteriore y=4) -->
  <box at="6 4 8" size="1 1 1" color="#80"/>
  <box at="14 4 8" size="1 1 1" color="#80"/>

  <!-- Include la logica per aprire il coperchio -->
  <import file="part-leaf"/>

  <action name="open" label="Apri il coperchio">
    <all>
      <rule in="L" out="#82"/>
      <rule in="#81" out="#83"/>
    </all>
  </action>
  <action name="close" label="Chiudi il coperchio">
    <all>
      <rule in="#82" out="L"/>
      <rule in="#83" out="#81"/>
    </all>
  </action>
</sequence>
