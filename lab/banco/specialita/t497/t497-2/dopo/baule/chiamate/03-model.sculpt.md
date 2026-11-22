# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 6415 token d'ingresso (4073 in cache), 710 d'uscita, 2130 di ragionamento · $0.0049

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

Parts of the seed the program may include with <import file="…"/> where the thing has one, instead of writing it: build what the part reads, mark what it asks, include it, give its letters your colours and use them for nothing else (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-leaf"/>: Leaves and lids that open (part-leaf), included after the piece is built: write each leaf shut with L, one voxel thick on a face with air in front of it, and its hinge with #80, the air cell in front of the end it turns on, at every layer of the leaf (a lid: the air over its back edge, all along it). It writes #81, hidden, where the leaf turns open on its hinge, out into the air as far as the leaf is wide (leave that air free; two hinges at the two ends of one run of L share it). The actions are yours: <action name="open" label="Apri le ante"><all><rule in="L" out="#82"/><rule in="#81" out="#83"/></all></action>, close back; #82 is hidden, give #83 the colour of L.
- <import file="part-wheel"/>: Wheels on an axle (part-wheel), included after the piece and its axles are built: mark each hub with H, on the axle or just past its end, with air on both sides of it across the axle and under it (two H side by side along the axle: a wheel two thick). The wheel grows round its hub in the plane across the axle, as large as the hub is high over what is under it (the ground, a floor, a deck), and touches it: I the iron tyre and hub, J the felloe and eight spokes (give I and J your colours). Two wheels in one plane must not touch.

## Risposta

<sequence values="B W n I L #80 #81 #82 #83" size="20 20 20" symmetry="(xy)" name="Baule da viaggio">
  <color symbol="W" value="8a5a30" name="legno"/>
  <color symbol="n" value="5e3c20" name="fessure"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="L" value="742f29" name="coperchio"/>
  <color symbol="#80" value="323c39" name="cardine" hidden="True"/>
  <color symbol="#81" value="000000" name="marcatore_cardine" hidden="True"/>
  <color symbol="#82" value="000000" name="vuoto_aperto" hidden="True"/>
  <color symbol="#83" value="323c39" name="cardine_attivo" hidden="True"/>

  <!-- Corpo del baule -->
  <box at="10 10 0" size="16 12 8" color="W"/>
  <!-- Texture assi -->
  <all in="W" out="n" p="0.1" steps="1"/>

  <!-- Coperchio bombato -->
  <box at="10 10 8" size="16 12 4" color="L"/>
  <convolution neighborhood="NoCorners" steps="2">
    <rule in="L B" out="B L"/>
    <rule in="B L" out="L B"/>
  </convolution>

  <!-- Cerchi di ferro -->
  <box at="10 0 0" size="16 1 12" color="I"/>
  <all in="I" out="B" p="0.5"/>
  <all in="I" out="I"/>
  
  <!-- Cardine per il coperchio (sul retro) -->
  <all in="L" out="#80" symmetry="()" steps="1">
    <in>B/L</in>
    <out>#80/L</out>
  </all>
  <all in="#80" out="#81" symmetry="()" steps="1">
    <in>L B</in>
    <out>L #81</out>
  </all>

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
