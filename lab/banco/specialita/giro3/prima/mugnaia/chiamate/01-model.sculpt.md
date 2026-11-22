# model.sculpt · primo · gemini-3.8-flash · 12 s · 7589 token d'ingresso (5543 in cache), 1509 d'uscita, 0 di ragionamento · $0.0076

## Richiesta

Sculpt: Mugnaia
What it looks like: una donna robusta col grembiule infarinato e un fazzoletto in testa
Class: person · box 20 × 15 × 30 voxels · at least 24 tall

## Risposta

```xml
<sequence values="BNTCDAGSFEHMOPW" size="20 15 30" symmetry="(xy)" name="Mugnaia">
  <!-- Palette accogliente diurna: vestito di lino rustico, grembiule da mugnaia cosparso di farina -->
  <color symbol="N" value="382315" name="scarpe di cuoio" part="leg"/>
  <color symbol="T" value="5a6d58" name="gonna di lana verde oliva" part="leg"/>
  <color symbol="C" value="73523c" name="corpetto marrone"/>
  <color symbol="D" value="4f3424" name="ombra corpetto"/>
  <color symbol="A" value="d6cfbd" name="grembiule di canapa"/>
  <color symbol="G" value="f4f1e8" name="macchie di farina"/>
  <color symbol="S" value="e8b592" name="pelle braccia e viso" part="arm"/>
  <color symbol="F" value="d99577" name="guance rosee"/>
  <color symbol="E" value="231812" name="occhi scuri"/>
  <color symbol="H" value="4d2c19" name="capelli castani"/>
  <color symbol="M" value="b84b3e" name="fazzoletto da testa rosso mattone" part="head"/>
  <color symbol="O" value="8f3227" name="nodo del fazzoletto" part="head"/>
  <color symbol="P" value="e0d8c8" name="maniche corte chiare" part="arm"/>
  <color symbol="W" value="bda88a" name="cucchiaio di legno" part="arm"/>

  <!-- Scarpe basse e robuste -->
  <box at="7 7 0" size="4 5 3" color="N"/>
  <box at="13 7 0" size="4 5 3" color="N"/>

  <!-- Gonna a campana ampia (robusta e pratica) -->
  <cylinder at="10 7 2" size="13 11 9" color="T"/>
  <cylinder at="10 7 7" size="11 9 4" color="T"/>

  <!-- Torso, busto solido e corpetto -->
  <cylinder at="10 7 10" size="11 9 7" color="C"/>
  <box at="10 8 10" size="9 4 6" color="A"/>

  <!-- Grembiule davanti sulla gonna -->
  <box at="10 11 3" size="9 2 9" color="A"/>
  <box at="10 10 2" size="9 2 1" color="A"/>

  <!-- Braccia e spalle robuste con maniche rimboccate -->
  <!-- Braccio sinistro rilassato lungo il fianco -->
  <cylinder at="4 7 14" size="4 4 3" color="P" on="B"/>
  <cylinder at="4 7 8" size="3 3 6" color="S" on="B"/>

  <!-- Braccio destro leggermente avanzato con mestolo o spatola per farina -->
  <cylinder at="16 7 14" size="4 4 3" color="P" on="B"/>
  <cylinder at="16 8 8" size="3 4 6" color="S" on="B"/>
  <box at="16 11 8" size="1 2 7" color="W"/>
  <box at="16 11 14" size="3 2 2" color="W"/>

  <!-- Testa proporzionata stile cartone / chibi (circa un terzo dell'altezza totale) -->
  <ellipsoid at="10 7 20" size="11 10 9" color="S" on="B"/>

  <!-- Capelli sotto il fazzoletto -->
  <ellipsoid at="10 6 21" size="12 10 7" color="H"/>
  <box at="10 5 18" size="10 4 6" color="H"/>
  <box at="6 7 18" size="2 3 5" color="H"/>
  <box at="14 7 18" size="2 3 5" color="H"/>

  <!-- Volto: guance piene, occhi e naso -->
  <box at="8 11 20" size="2 1 2" color="E"/>
  <box at="12 11 20" size="2 1 2" color="E"/>
  <box at="6 11 18" size="2 1 2" color="F"/>
  <box at="14 11 18" size="2 1 2" color="F"/>

  <!-- Fazzoletto in testa (legato dietro con nodo) -->
  <ellipsoid at="10 6 24" size="11 10 5" color="M"/>
  <box at="10 8 23" size="10 3 2" color="M"/>
  <box at="10 2 20" size="4 3 3" color="O"/>
  <box at="10 2 18" size="2 2 2" color="O"/>

  <!-- Dettagli e macchie di farina sul grembiule e sulle mani -->
  <prl steps="1" symmetry="()">
    <rule in="B/* A" out="B/* G" p="0.35"/>
    <rule in="A/B" out="G/*" p="0.4"/>
  </prl>
  <one steps="18" symmetry="()" in="G A" out="G G"/>

  <!-- Lievi sfumature d'ombra sul corpetto rustico -->
  <prl steps="1">
    <rule in="C" out="D" p="0.25"/>
  </prl>
</sequence>
```
