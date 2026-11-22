# model.sculpt · primo · gemini-3.1-flash-lite · 2 s · 6575 token d'ingresso (4073 in cache), 324 d'uscita, 129 di ragionamento · $0.0014

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="B P p" size="12 12 12" name="Cappello di paglia">
  <!-- P: Straw, p: Straw shadow/weave -->
  <color symbol="P" value="e6d08a" name="paglia"/>
  <color symbol="p" value="c2a550" name="intreccio"/>
  
  <!-- Main shape: A dome and a wide flat brim -->
  <cylinder at="6 6 2" radius="4" height="3" color="P"/>
  <cylinder at="6 6 1" radius="6" height="1" color="P"/>
  
  <!-- Add some texture (weave) -->
  <all steps="20">
    <rule in="P" out="p" p="0.2"/>
  </all>

  <worn zone="head">
    <all>
      <!-- Place hat over the head -->
      <rule in="[rm] z" out="P z"/>
      <rule in="[rm]/z" out="P/z"/>
      <rule in="[rm]z" out="Pz"/>
      <rule in="z[rm]" out="zP"/>
    </all>
    <!-- Ensure the hat is solid and covers the head area -->
    <all in="P [rmoB]" out="P *"/>
  </worn>
</sequence>
