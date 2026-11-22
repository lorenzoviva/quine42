# model.sculpt · primo · gemini-3.1-flash-lite · 2 s · 6575 token d'ingresso (4073 in cache), 306 d'uscita, 137 di ragionamento · $0.0014

## Richiesta

Sculpt: Cappello di paglia
What it looks like: un cappello a tesa larga, intrecciato
Class: object · box 12 × 12 × 12 voxels
It is worn on the head: after the program write its <worn zone="head"> section (see «Worn things»).

## Risposta

<sequence values="B P p" size="12 12 12" symmetry="(xy)" name="Cappello di paglia">
  <color symbol="P" value="ffec27" name="paglia"/>
  <color symbol="p" value="e4bb40" name="intreccio"/>
  <!-- Base shape: a dome for the crown and a flat wide brim -->
  <box at="6 6 4" size="6 6 4" color="P"/>
  <box at="6 6 2" size="12 12 2" color="P"/>
  <!-- Texture: simple cross-hatch pattern on top -->
  <all in="P P" out="p *" steps="10"/>
  <worn zone="head">
    <!-- Place the hat on the head: crown on top, brim around -->
    <all>
      <rule in="[rm] z" out="P z"/>
      <rule in="[rm]/z" out="P/z"/>
      <rule in="[rm]z" out="Pz"/>
      <rule in="z[rm]" out="zP"/>
    </all>
    <!-- Add some structural detail to the hat when worn -->
    <all in="P P" out="p *"/>
  </worn>
</sequence>
