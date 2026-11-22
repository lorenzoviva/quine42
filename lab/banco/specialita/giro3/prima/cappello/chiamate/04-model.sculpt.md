# model.sculpt · primo · gemini-3.1-flash-lite · 6 s · 6575 token d'ingresso (4073 in cache), 376 d'uscita, 1636 di ragionamento · $0.0037

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="BYNO" size="12 12 12" name="Cappello di paglia">
  <color symbol="Y" value="ffec27" name="paglia"/>
  <color symbol="N" value="ab5236" name="intreccio"/>
  <color symbol="O" value="ffa300" name="nastro"/>

  <!-- Base shape: brim -->
  <box at="0 0 2" size="12 12 2" color="Y"/>
  <!-- Base shape: crown -->
  <cylinder at="6 6 4" r="4" h="4" color="Y"/>
  <!-- Decoration: ribbon -->
  <box at="2 2 4" size="8 8 1" color="O"/>
  
  <!-- Texture -->
  <all steps="2">
    <rule in="Y B" out="N Y"/>
  </all>

  <worn zone="head">
    <!-- Place the crown on top of the head -->
    <all>
      <rule in="[rm] z" out="Y z"/>
      <rule in="[rm]/z" out="Y/z"/>
    </all>
    <!-- Place the brim around the sides of the head -->
    <all>
      <rule in="z [rm]" out="z Y"/>
      <rule in="z/[rm]" out="z/Y"/>
    </all>
    <!-- Add the ribbon band -->
    <all>
      <rule in="Y Y" out="Y O"/>
    </all>
  </worn>
</sequence>
