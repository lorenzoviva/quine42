# model.sculpt · primo · gemini-3.1-flash-lite · 6 s · 6575 token d'ingresso (4073 in cache), 305 d'uscita, 1816 di ragionamento · $0.0039

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="BYh" size="12 12 12" name="Cappello di paglia">
  <color symbol="Y" value="ffec27" name="paglia"/>
  <color symbol="h" value="8a6f30" name="intreccio"/>

  <!-- Base shape of the straw hat -->
  <cylinder at="6 6 2" size="12 12 1" color="Y"/>
  <cylinder at="6 6 3" size="6 6 3" color="Y"/>

  <!-- Adds the woven texture -->
  <all steps="1">
    <rule in="Y" out="h" p="0.2"/>
  </all>

  <!-- Worn on the head -->
  <worn zone="head">
    <all>
      <!-- Brim around the head -->
      <rule in="[rm] z" out="Y z"/>
      <rule in="z [rm]" out="z Y"/>
      <rule in="[rm]/z" out="Y/z"/>
      <rule in="z/[rm]" out="z/Y"/>
      <!-- Top of the hat -->
      <rule in="[rm] z" out="Y z" p="0.6"/>
    </all>
  </worn>
</sequence>
