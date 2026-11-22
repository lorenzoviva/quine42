# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 6575 token d'ingresso (4073 in cache), 301 d'uscita, 2474 di ragionamento · $0.0049

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="BYON" size="12 12 12" name="Cappello di paglia" symmetry="(xy)">
  <color symbol="Y" value="ffec27"/>
  <color symbol="O" value="ffa300"/>
  <color symbol="N" value="ab5236"/>
  
  <!-- Main masses: brim and crown -->
  <cylinder at="6 6 0" size="12 12 2" color="Y"/>
  <ellipsoid at="6 6 2" size="6 6 6" color="Y"/>
  <box at="3 3 2" size="6 6 1" color="N"/>
  
  <!-- Texture: woven straw -->
  <all in="Y" out="O" p="0.4" symmetry="(xy)"/>

  <worn zone="head">
    <all>
      <!-- Place the hat on the top of the head -->
      <rule in="[rm] z" out="Y z"/>
      <rule in="[rm]/z" out="Y/z"/>
      <rule in="z/[rm]" out="z/Y"/>
      <rule in="z[rm]" out="zY"/>
    </all>
  </worn>
</sequence>
