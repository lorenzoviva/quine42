# model.sculpt · primo · gemini-3.1-flash-lite · 6 s · 6575 token d'ingresso (4073 in cache), 279 d'uscita, 1852 di ragionamento · $0.0039

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="BNYn" size="12 12 12" name="Cappello di paglia">
  <color symbol="N" value="ab5236"/>
  <color symbol="Y" value="ffec27"/>
  <color symbol="n" value="742f29"/>

  <!-- Base shape: Brim (z=2) and Crown (z=4) -->
  <box at="6 6 2" size="12 12 2" color="N"/>
  <box at="6 6 4" size="6 6 4" color="N"/>

  <!-- Weave texture pattern -->
  <all in="N" out="Y" p="0.3"/>
  <all in="N" out="n" p="0.2"/>

  <worn zone="head">
    <all>
      <rule in="[rm] z" out="N z"/>
      <rule in="[rm]/z" out="N/z"/>
      <rule in="[rm]z" out="Nz"/>
      <rule in="z[rm]" out="zN"/>
    </all>
  </worn>
</sequence>
