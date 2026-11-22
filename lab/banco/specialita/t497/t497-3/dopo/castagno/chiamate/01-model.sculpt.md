# model.sculpt · primo · gemini-3.1-flash-lite · 4 s · 5725 token d'ingresso (2035 in cache), 881 d'uscita, 174 di ragionamento · $0.0026

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTFLNhkVrx" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="5d4037" name="tronco"/>
  <color symbol="F" value="2e7d32" name="chioma"/>
  <color symbol="L" value="4caf50" name="chioma al sole"/>
  <color symbol="N" value="1b5e20" name="chioma in ombra"/>
  <color symbol="h" hidden="True" name="altezze possibili"/>
  <color symbol="k" hidden="True" name="quota scelta"/>
  <color symbol="V" hidden="True" name="sagoma sferica"/>
  <color symbol="r" hidden="True" name="crescita"/>
  <color symbol="x" hidden="True" name="base"/>

  <!-- Scelta altezza (tra 48 e 58) -->
  <box at="0 0 48" size="1 1 10" color="h"/>
  <one in="h" out="k" steps="1"/>
  <all in="h" out="B"/>
  <all in="kB" out="kk"/>

  <!-- Tronco largo che sale -->
  <box at="20 20 0" size="4 4 1" color="r"/>
  <one steps="50">
    <rule in="B r" out="r T" p="1"/>
    <rule in="B* *r" out="r* *T" p="0.08"/>
  </one>
  <all in="r" out="T"/>
  <all in="k" out="B"/>
  <cylinder at="20 20 0" size="6 6 4" color="T" on="B"/>

  <!-- Sagoma della chioma (sferica) -->
  <ellipsoid at="20 20 40" size="30 30 20" color="V" on="B"/>
  
  <!-- Rami che si espandono nella chioma -->
  <prl steps="1" in="VT" out="rT" p="0.2"/>
  <one steps="800">
    <rule in="Vr" out="rT"/>
    <rule in="V* *r" out="r* *T" p="0.25"/>
  </one>
  <all in="r" out="T"/>
  
  <!-- Foglie attorno ai rami -->
  <all steps="3" symmetry="(xyz)">
    <rule in="TV" out="TF"/>
    <rule in="FV" out="FF"/>
  </all>
  <one steps="3000" symmetry="(xyz)" in="FV" out="FF"/>
  <prl steps="1" symmetry="(xyz)" in="FV" out="FF" p="0.4"/>
  
  <!-- Pulizia base e sagoma -->
  <all in="[Vx]" out="B"/>
  <convolution neighborhood="Moore" steps="2">
    <rule in="F" out="B" values="B" sum="12..26" p="0.5"/>
  </convolution>
  <convolution neighborhood="Moore" steps="2">
    <rule in="F" out="B" values="B" sum="20..26"/>
  </convolution>

  <!-- Luci e ombre sulla chioma -->
  <prl steps="1">
    <rule in="B F" out="B L" p="0.6"/>
    <rule in="F B" out="N B" p="0.7"/>
  </prl>
</sequence>
