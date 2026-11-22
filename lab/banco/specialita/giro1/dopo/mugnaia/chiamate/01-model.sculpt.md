# model.sculpt · primo · gemini-3.8-flash · 11 s · 5978 token d'ingresso (0 in cache), 1324 d'uscita, 0 di ragionamento · $0.0094

## Richiesta

Sculpt: Mugnaia
What it looks like: una donna robusta col grembiule infarinato e un fazzoletto in testa
Class: person · box 20 × 15 × 30 voxels · at least 24 tall

## Risposta

```xml
<sequence values="BNPSDCAULFMEVI" size="20 15 30" symmetry="()" name="Mugnaia">
  <!-- Palette: farina, grembiule, abito rustico, fazzoletto in testa -->
  <color symbol="N" value="3a2417" name="scarpe robuste" part="leg"/>
  <color symbol="P" value="704832" name="sottoveste" part="leg"/>
  <color symbol="S" value="8f4034" name="abito rustico"/>
  <color symbol="D" value="632820" name="abito in ombra"/>
  <color symbol="A" value="d6cfbe" name="grembiule di canapa"/>
  <color symbol="U" value="f4f0e6" name="farina sul grembiule"/>
  <color symbol="L" value="452e1e" name="cintura"/>
  <color symbol="C" value="8f4034" name="manica arrotolata" part="arm"/>
  <color symbol="M" value="e0a885" name="avambraccio e mani" part="arm"/>
  <color symbol="V" value="e0a885" name="viso e collo" part="head"/>
  <color symbol="F" value="483120" name="capelli raccolti" part="head"/>
  <color symbol="E" value="231b15" name="occhi" part="head"/>
  <color symbol="I" value="e8dec8" name="fazzoletto in testa" part="head"/>

  <!-- Piedi e scarpe robuste -->
  <box at="7 7 0" size="4 5 3" color="N"/>
  <box at="13 7 0" size="4 5 3" color="N"/>

  <!-- Gonna ampia da donna robusta di campagna -->
  <cylinder at="10 7 2" size="12 10 7" color="P"/>
  <cylinder at="10 7 5" size="13 11 6" color="S"/>

  <!-- Torso solido / busto -->
  <cylinder at="10 7 9" size="12 10 8" color="S"/>
  <cylinder at="10 7 9" size="13 11 2" color="L"/>

  <!-- Grembiule frontale -->
  <box at="10 10 4" size="10 4 11" color="A"/>
  <box at="10 9 12" size="8 3 4" color="A"/>

  <!-- Braccia forti con maniche rimboccate ai lati -->
  <cylinder at="4 7 12" size="4 4 4" color="C"/>
  <cylinder at="4 8 7" size="3 4 6" color="M"/>
  <cylinder at="16 7 12" size="4 4 4" color="C"/>
  <cylinder at="16 8 7" size="3 4 6" color="M"/>

  <!-- Collo -->
  <cylinder at="10 7 16" size="5 5 3" color="V"/>

  <!-- Testa grande (stile chibi proporzionato) -->
  <ellipsoid at="10 7 21" size="11 11 9" color="V"/>
  <box at="10 10 21" size="9 4 5" color="V"/>

  <!-- Capelli sotto il fazzoletto -->
  <box at="10 5 21" size="10 5 6" color="F"/>
  <box at="10 8 18" size="4 4 3" color="F"/>

  <!-- Fazzoletto da mugnaia legato sulla nuca/fronte -->
  <ellipsoid at="10 6 24" size="11 10 5" color="I"/>
  <box at="10 7 25" size="10 8 2" color="I"/>
  <box at="10 3 21" size="5 3 4" color="I"/>
  <box at="5 6 23" size="2 4 4" color="I"/>
  <box at="15 6 23" size="2 4 4" color="I"/>

  <!-- Tratti del viso: occhi e guance sane -->
  <box at="8 12 21" size="2 1 2" color="E"/>
  <box at="12 12 21" size="2 1 2" color="E"/>
  <box at="8 12 23" size="2 1 1" color="F"/>
  <box at="12 12 23" size="2 1 1" color="F"/>

  <!-- Spolverata di farina sul grembiule e sulle mani -->
  <prl steps="1">
    <rule in="A" out="U" p="0.45"/>
    <rule in="M" out="U" p="0.15"/>
    <rule in="S" out="D" p="0.2"/>
  </prl>
  <one steps="35" in="U A" out="U U"/>
</sequence>
```
