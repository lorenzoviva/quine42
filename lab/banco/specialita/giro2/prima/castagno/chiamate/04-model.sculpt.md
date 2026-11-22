# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 7263 token d'ingresso (4075 in cache), 397 d'uscita, 2202 di ragionamento · $0.0048

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTFLN" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="F" value="2f6b3a" name="chioma"/>
  <color symbol="L" value="4b8f4a" name="chioma al sole"/>
  <color symbol="N" value="1f4a2c" name="chioma in ombra"/>

  <!-- Tronco: robusto e centrale -->
  <cylinder at="20 20 0" size="8 8 40" color="T" on="B"/>
  
  <!-- Chioma: ellissoide tonda e ampia -->
  <ellipsoid at="20 20 40" size="38 38 28" color="F" on="B"/>
  
  <!-- Riempimento della chioma -->
  <one steps="3000" symmetry="(xyz)" in="BF" out="FF"/>
  
  <!-- Dettagli di luce e ombra: la luce colpisce dall'alto -->
  <all in="B F" out="B L"/>
  
  <!-- Ombreggiatura interna e irregolarità -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="F" out="N" values="F" sum="0..14"/>
  </convolution>
  
  <!-- Pulizia bordi -->
  <convolution neighborhood="NoCorners" steps="1">
    <rule in="F" out="B" values="B" sum="12..18"/>
  </convolution>
</sequence>
