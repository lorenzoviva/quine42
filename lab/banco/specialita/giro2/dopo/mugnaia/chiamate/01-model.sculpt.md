# model.sculpt · primo · gemini-3.8-flash · 10 s · 5978 token d'ingresso (3935 in cache), 1176 d'uscita, 0 di ragionamento · $0.0062

## Richiesta

Sculpt: Mugnaia
What it looks like: una donna robusta col grembiule infarinato e un fazzoletto in testa
Class: person · box 20 × 15 × 30 voxels · at least 24 tall

## Risposta

```xml
<sequence values="BNPSCVUDAFEHMWO" size="20 15 30" symmetry="(xy)" name="Mugnaia">
  <!-- Palette -->
  <color symbol="N" value="382315" name="scarpe" part="leg"/>
  <color symbol="P" value="2c4d6f" name="gonna blu scuro" part="leg"/>
  <color symbol="S" value="e8b590" name="pelle" part="arm"/>
  <color symbol="C" value="8f3832" name="corpetto caldo"/>
  <color symbol="V" value="e8b590" name="viso" part="head"/>
  <color symbol="U" value="ebd8b7" name="grembiule di canapa"/>
  <color symbol="D" value="dedede" name="farina sul grembiule"/>
  <color symbol="A" value="732b26" name="ombra corpetto"/>
  <color symbol="F" value="d6cfc5" name="fazzoletto in testa" part="head"/>
  <color symbol="E" value="1c140e" name="occhi" part="head"/>
  <color symbol="H" value="4a2e1b" name="capelli" part="head"/>
  <color symbol="M" value="8f3832" name="manica" part="arm"/>
  <color symbol="W" value="cf9872" name="pelle ombra"/>
  <color symbol="O" value="bf865e" name="matterello" part="arm"/>

  <!-- Scarpe e gonna robusta -->
  <box at="7 7 0" size="4 5 3" color="N"/>
  <box at="13 7 0" size="4 5 3" color="N"/>
  <cylinder at="10 7 2" size="13 11 8" color="P"/>

  <!-- Busto e grembiule -->
  <cylinder at="10 7 9" size="11 9 8" color="C"/>
  <box at="10 9 4" size="9 4 12" color="U"/>
  <box at="10 6 8" size="8 2 9" color="U"/>

  <!-- Braccia robuste con maniche rimboccate -->
  <cylinder at="4 7 12" size="3 4 5" color="M" on="B"/>
  <cylinder at="16 7 12" size="3 4 5" color="M" on="B"/>
  <cylinder at="4 7 7" size="3 3 6" color="S" on="B"/>
  <cylinder at="16 7 7" size="3 3 6" color="S" on="B"/>

  <!-- Matterello nella mano destra (piccola x) -->
  <cylinder at="4 8 4" size="2 6 2" color="O"/>

  <!-- Testa grande (chibi proporzionata) -->
  <ellipsoid at="10 7 19" size="10 10 9" color="V" on="B"/>
  <box at="10 9 19" size="8 4 6" color="V"/>

  <!-- Capelli sotto il fazzoletto -->
  <box at="10 5 18" size="9 4 6" color="H"/>
  <box at="6 9 19" size="2 3 3" color="H"/>
  <box at="14 9 19" size="2 3 3" color="H"/>

  <!-- Occhi -->
  <box at="8 11 20" size="2 1 2" color="E"/>
  <box at="12 11 20" size="2 1 2" color="E"/>

  <!-- Fazzoletto da mugnaia annodato in testa -->
  <ellipsoid at="10 6 22" size="11 11 7" color="F"/>
  <box at="10 4 17" size="4 3 4" color="F"/>
  <box at="10 5 20" size="10 4 6" color="F"/>

  <!-- Infarinatura sul grembiule e sulle mani -->
  <prl steps="1" symmetry="()">
    <rule in="U" out="D" p="0.45"/>
    <rule in="C" out="A" p="0.15"/>
    <rule in="S" out="D" p="0.10"/>
  </prl>
  <one steps="12" symmetry="()" in="D U" out="D D"/>
</sequence>
```
