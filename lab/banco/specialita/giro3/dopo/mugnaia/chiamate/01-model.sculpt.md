# model.sculpt · primo · gemini-3.8-flash · 9 s · 5978 token d'ingresso (3935 in cache), 1148 d'uscita, 0 di ragionamento · $0.0061

## Richiesta

Sculpt: Mugnaia
What it looks like: una donna robusta col grembiule infarinato e un fazzoletto in testa
Class: person · box 20 × 15 × 30 voxels · at least 24 tall

## Risposta

```xml
<sequence values="BNPSCVHAMUEFIW" size="20 15 30" symmetry="(x)" name="Mugnaia">
  <!-- Palette -->
  <color symbol="N" value="342116" name="scarpe" part="leg"/>
  <color symbol="P" value="2d3b45" name="gonna scura" part="leg"/>
  <color symbol="C" value="7e3228" name="corpetto caldo"/>
  <color symbol="V" value="dfa57e" name="pelle viso" part="head"/>
  <color symbol="H" value="4a2b16" name="capelli" part="head"/>
  <color symbol="A" value="d6cfbe" name="grembiule di lino"/>
  <color symbol="M" value="8c3d32" name="maniche rimboccate" part="arm"/>
  <color symbol="U" value="dfa57e" name="braccia" part="arm"/>
  <color symbol="E" value="1c140e" name="occhi" part="head"/>
  <color symbol="F" value="f4f0e6" name="farina"/>
  <color symbol="I" value="e8dec8" name="fazzoletto" part="head"/>
  <color symbol="W" value="b09c7a" name="sacchetto farina"/>
  
  <!-- Gambe e gonna ampia -->
  <box at="7 7 0" size="4 5 3" color="N"/>
  <box at="13 7 0" size="4 5 3" color="N"/>
  <cylinder at="10 7 3" size="12 11 7" color="P"/>
  
  <!-- Busto e corpetto robusto -->
  <cylinder at="10 7 10" size="11 9 8" color="C"/>
  
  <!-- Grembiule sul davanti -->
  <box at="10 10 4" size="9 3 13" color="A"/>
  
  <!-- Braccia robuste con maniche arrotolate -->
  <cylinder at="4 7 13" size="4 4 4" color="M"/>
  <cylinder at="16 7 13" size="4 4 4" color="M"/>
  <cylinder at="4 8 7" size="3 3 7" color="U"/>
  <cylinder at="16 8 7" size="3 3 7" color="U"/>

  <!-- Un piccolo sacco di farina sotto il braccio destro -->
  <box at="4 9 7" size="3 4 5" color="W"/>

  <!-- Testa grande (chibi proporzionata) -->
  <ellipsoid at="10 7 20" size="11 11 9" color="V" on="B"/>
  <box at="10 6 20" size="11 8 8" color="H"/>
  
  <!-- Fazzoletto in testa (copricapo triangolare da mugnaia) -->
  <ellipsoid at="10 6 23" size="12 11 6" color="I"/>
  <box at="10 4 21" size="10 4 7" color="I"/>
  <box at="10 9 24" size="8 4 3" color="I"/>
  <!-- Nodi del fazzoletto dietro la nuca -->
  <box at="10 2 18" size="4 3 3" color="I"/>

  <!-- Volto: guance piene, occhi e fronte -->
  <box at="10 10 20" size="8 3 5" color="V"/>
  <box at="8 12 21" size="2 1 2" color="E"/>
  <box at="12 12 21" size="2 1 2" color="E"/>

  <!-- Spolverata di farina sul grembiule, sulle mani e sulle braccia -->
  <prl steps="1" symmetry="()">
    <rule in="B/* */* A/B" out="B/* */* F/B" p="0.35"/>
    <rule in="B/* A/*" out="B/* F/*" p="0.25"/>
    <rule in="B U" out="B F" p="0.20"/>
    <rule in="B W" out="B F" p="0.40"/>
  </prl>
  <one steps="15" symmetry="()" in="F A" out="F F"/>
</sequence>
```
