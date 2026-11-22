# model.sculpt · primo · gemini-3.1-flash-lite · 6 s · 5258 token d'ingresso (0 in cache), 251 d'uscita, 1848 di ragionamento · $0.0045

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="BHh" size="12 12 12" symmetry="(xy)" name="Cappello di paglia">
  <color symbol="H" value="e4bb40"/>
  <color symbol="h" value="8a6f30"/>
  <cylinder at="6 6 0" r="6" h="1" color="H"/>
  <cylinder at="6 6 1" r="3" h="3" color="H"/>
  <prl p="0.2" steps="10">
    <rule in="H" out="h"/>
  </prl>
  <worn zone="head">
    <all>
      <rule in="[rm] z" out="H z"/>
      <rule in="[rm]/z" out="H/z"/>
      <rule in="z[rm]" out="zH"/>
      <rule in="[rm]z" out="Hz"/>
    </all>
    <all in="H [rmo]" out="H *"/>
  </worn>
</sequence>
