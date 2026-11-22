# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 5258 token d'ingresso (0 in cache), 238 d'uscita, 2409 di ragionamento · $0.0053

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="BYN" size="12 12 12" symmetry="(xyz)" name="Cappello di paglia">
  <color symbol="Y" value="ffec27"/>
  <color symbol="N" value="ab5236"/>
  <!-- Brim -->
  <cylinder at="6 6 1" radius="6" height="1" color="Y"/>
  <!-- Crown -->
  <cylinder at="6 6 2" radius="3" height="4" color="Y"/>
  <!-- Ribbon -->
  <cylinder at="6 6 2" radius="3.1" height="1" color="N"/>
</sequence>
<worn zone="head">
  <all>
    <rule in="[rm] z" out="Y z"/>
    <rule in="[rm]/z" out="Y/z"/>
    <rule in="[rm]z" out="Yz"/>
    <rule in="z[rm]" out="zY"/>
  </all>
</worn>
