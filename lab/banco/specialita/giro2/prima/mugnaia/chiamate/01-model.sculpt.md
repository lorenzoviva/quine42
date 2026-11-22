# model.sculpt · primo · gemini-3.8-flash · 12 s · 7589 token d'ingresso (5543 in cache), 1423 d'uscita, 0 di ragionamento · $0.0073

## Richiesta

Sculpt: Mugnaia
What it looks like: una donna robusta col grembiule infarinato e un fazzoletto in testa
Class: person · box 20 × 15 × 30 voxels · at least 24 tall

## Risposta

```xml
<sequence values="BNPSCVHAMFEWLID" size="20 15 30" symmetry="(xy)" name="Mugnaia">
  <!-- Palette stilizzata e accogliente con fasce di luce chiare e nette -->
  <color symbol="N" value="4a2b16" name="scarpe robuste di cuoio" part="leg"/>
  <color symbol="P" value="7e3230" name="gonna pesante da lavoro" part="leg"/>
  <color symbol="S" value="8f3c3a" name="busto della veste"/>
  <color symbol="C" value="382218" name="corpetto stretto"/>
  <color symbol="V" value="ffccaa" name="pelle viso e braccia"/>
  <color symbol="H" value="5a3219" name="capelli castani"/>
  <color symbol="A" value="f4efe6" name="grembiule di canapa"/>
  <color symbol="M" value="eae4d8" name="fazzoletto e cuffia in testa"/>
  <color symbol="F" value="ffffff" name="infarinatura" glow="True"/>
  <color symbol="E" value="231710" name="occhi"/>
  <color symbol="W" value="d69977" name="sacco di farina o ciotola"/>
  <color symbol="L" value="e0cca3" name="farina nel sacco"/>
  <color symbol="I" value="442817" name="cintura grembiule"/>
  <color symbol="D" value="2a180e" name="dettaglio gonna"/>

  <!-- Piedi e scarpe da lavoro -->
  <box at="7 7 0" size="4 5 3" color="N"/>
  <box at="13 7 0" size="4 5 3" color="N"/>

  <!-- Gonna robusta e ampia che scende fino alle caviglie -->
  <cylinder at="10 7 3" size="12 11 11" color="P"/>
  <cylinder at="10 7 10" size="10 9 4" color="P"/>

  <!-- Busto e corpetto tipico medievale -->
  <cylinder at="10 7 13" size="9 8 5" color="S"/>
  <cylinder at="10 7 13" size="10 9 3" color="C"/>
  <cylinder at="10 7 12" size="10 9 1" color="I"/>

  <!-- Grembiule da mugnaia sul davanti -->
  <box at="10 10 4" size="9 3 9" color="A"/>
  <box at="10 9 13" size="6 3 4" color="A"/>

  <!-- Braccia robuste con maniche rimboccate -->
  <cylinder at="4 7 13" size="3 4 4" color="S" on="B"/>
  <cylinder at="16 7 13" size="3 4 4" color="S" on="B"/>
  <cylinder at="4 8 8" size="3 3 6" color="V" on="B"/>
  <cylinder at="16 8 8" size="3 3 6" color="V" on="B"/>

  <!-- Un piccolo sacco di grano/farina tenuto su un fianco -->
  <cylinder at="16 9 8" size="5 5 6" color="W"/>
  <cylinder at="16 9 12" size="4 4 2" color="L"/>

  <!-- Collo e testa grande in stile chibi -->
  <cylinder at="10 7 17" size="4 4 2" color="V"/>
  <ellipsoid at="10 7 21" size="11 10 9" color="V" on="B"/>

  <!-- Capelli sotto il fazzoletto -->
  <box at="10 4 20" size="10 4 7" color="H"/>
  <box at="10 9 20" size="9 3 3" color="H"/>

  <!-- Fazzoletto/cuffia annodato in testa -->
  <ellipsoid at="10 6 24" size="11 11 5" color="M"/>
  <box at="10 4 22" size="10 3 6" color="M"/>
  <box at="10 8 25" size="8 4 3" color="M"/>
  <!-- Lembo del nodo dietro la nuca -->
  <box at="10 3 19" size="4 3 4" color="M"/>

  <!-- Volto: occhi vispi e amichevoli rivolti verso il davanti (y grande) -->
  <box at="8 11 21" size="2 2 2" color="E"/>
  <box at="12 11 21" size="2 2 2" color="E"/>
  <box at="10 11 18" size="3 2 1" color="V"/>

  <!-- Chiazze di farina sul grembiule e sulle mani/braccia -->
  <prl steps="1" symmetry="()">
    <rule in="A" out="F" p="0.22"/>
    <rule in="V/* */* A/B" out="V/* */* F/B" p="0.3"/>
  </prl>
  <one steps="15" symmetry="()" in="F A" out="F F"/>
  <prl steps="1">
    <rule in="P" out="D" p="0.1"/>
  </prl>
</sequence>
```
