# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 5725 token d'ingresso (2035 in cache), 691 d'uscita, 1696 di ragionamento · $0.0046

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTLSOH" size="40 40 60" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="L" value="2f6b3a" name="chioma"/>
  <color symbol="S" value="1f4a2c" name="ombra"/>
  <color symbol="H" value="4b8f4a" name="luce"/>
  <color symbol="O" hidden="True" name="volume"/>
  <color symbol="X" hidden="True" name="tronco_temp"/>

  <!-- Base del tronco, massiccia -->
  <box at="18 18 0" size="4 4 10" color="T"/>
  <box at="19 19 10" size="2 2 10" color="X"/>

  <!-- Crescita tronco -->
  <one steps="35">
    <rule in="X B" out="T X" p="0.8"/>
    <rule in="X B" out="T T" p="0.2"/> <!-- Biforcazione accennata -->
  </one>
  <all in="X" out="T"/>

  <!-- Volume della chioma tonda -->
  <ellipsoid at="20 20 45" size="32 32 24" color="O" on="B"/>
  
  <!-- Riempimento chioma -->
  <all in="O" out="L"/>
  
  <!-- Texture della chioma -->
  <convolution neighborhood="Moore" steps="3">
    <rule in="B L" out="L L" sum="1..26"/>
    <rule in="L B" out="L L" sum="1..26"/>
  </convolution>

  <!-- Arrotondamento e frastagliatura naturale -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="L" out="B" values="B" sum="0..10" p="0.7"/>
  </convolution>

  <!-- Luci e ombre (ombre in basso e interno, luci in alto) -->
  <prl steps="1">
    <rule in="L B" out="L B"/> <!-- Caso base -->
  </prl>
  
  <!-- Ombreggiature -->
  <all>
    <rule in="L T" out="S T"/>
    <rule in="L B" out="L B"/>
  </all>
  
  <convolution neighborhood="NoCorners" steps="2">
    <rule in="L" out="S" values="S" sum="5..18" p="0.3"/>
    <rule in="L" out="H" values="H" sum="1..4" p="0.4"/>
  </convolution>

  <!-- Pulizia finale -->
  <all in="O" out="B"/>
</sequence>
