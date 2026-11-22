# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 5678 token d'ingresso (0 in cache), 352 d'uscita, 2095 di ragionamento · $0.0051

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTLSG" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="L" value="4b692f" name="foglie"/>
  <color symbol="S" value="354724" name="ombra"/>
  <color symbol="G" value="84a956" name="luce"/>

  <!-- Base del tronco larga -->
  <cylinder at="20 20 0" size="8 8 2" color="T"/>
  <!-- Tronco robusto -->
  <cylinder at="20 20 2" size="4 4 40" color="T"/>

  <!-- Chioma tonda -->
  <ellipsoid at="20 20 40" size="32 32 20" color="L" on="B"/>

  <!-- Dettaglio della chioma: rende la forma meno geometrica -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="B L" out="L L" sum="2..26"/>
  </convolution>

  <!-- Luci e ombre per dare volume -->
  <prl steps="1">
    <rule in="L B" out="S B" p="0.3"/>
    <rule in="B L" out="G B" p="0.3"/>
  </prl>
</sequence>
