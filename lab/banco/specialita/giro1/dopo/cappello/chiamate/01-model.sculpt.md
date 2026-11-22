# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 5258 token d'ingresso (0 in cache), 299 d'uscita, 2694 di ragionamento · $0.0058

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="BYHh" size="12 12 12" symmetry="(xy)" name="Cappello di paglia">
  <color symbol="Y" value="ffec27"/>
  <color symbol="H" value="e4bb40"/>
  <color symbol="h" value="8a6f30"/>
  
  <ellipsoid at="6 6 4" size="6 6 6" color="Y"/>
  <cylinder at="6 6 2" size="12 12 2" color="Y"/>
  <cylinder at="6 6 3" size="7 7 1" color="H"/>

  <all>
    <rule in="Y B" out="h Y"/>
    <rule in="H B" out="h H"/>
  </all>
</sequence>

<worn zone="head">
  <all>
    <rule in="[rm] z" out="Y z"/>
    <rule in="[rm]/z" out="Y/z"/>
    <rule in="[rm]z" out="Yz"/>
    <rule in="z[rm]" out="zY"/>
    <rule in="[rm] Y" out="H Y"/>
  </all>
</worn>
