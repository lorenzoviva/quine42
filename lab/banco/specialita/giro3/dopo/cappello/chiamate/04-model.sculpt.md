# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 5258 token d'ingresso (2034 in cache), 251 d'uscita, 2272 di ragionamento · $0.0046

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="BHh" size="12 12 12" name="Cappello di paglia">
  <color symbol="H" value="e4bb40"/>
  <color symbol="h" value="8a6f30"/>
  <ellipsoid at="6 6 5" size="6 6 4" color="H"/>
  <cylinder at="6 6 2" size="12 12 2" color="H"/>
  <prl p="0.1" steps="10">
    <rule in="H" out="h"/>
  </prl>
  <worn zone="head">
    <all>
      <rule in="[rm] z" out="H z"/>
      <rule in="[rm]/z" out="H/z"/>
      <rule in="[rm]z" out="Hz"/>
      <rule in="z[rm]" out="zH"/>
    </all>
    <all in="H [rmoB]" out="H *"/>
  </worn>
</sequence>
