# model.sculpt · primo · gemini-4-argon · 20 s · 6920 token d'ingresso (4866 in cache), 2112 d'uscita, 0 di ragionamento · $0.03

## Richiesta

Sculpt: Casetta del pastore
What it looks like: una casetta di pietra a un piano col tetto di paglia, la porta davanti e una finestra
Class: building · box 50 × 50 × 50 voxels · at least 30 tall

## Risposta

<sequence values="BXQIWNDnOURrGHhkmP" size="25 25 25" origin="True" symmetry="(xy)">
  <color symbol="X" hidden="True" name="volume casa"/>
  <color symbol="Q" hidden="True" name="prisma tetto"/>
  <color symbol="I" hidden="True" name="interno"/>
  <color symbol="W" hidden="True" name="porta aperta"/>
  <color symbol="P" value="5a534a" name="zoccolo pietra"/>
  <color symbol="D" value="8c8478" name="pietra chiara"/>
  <color symbol="N" value="3d2817" name="legno scuro travi"/>
  <color symbol="n" value="6e4726" name="legno medio"/>
  <color symbol="O" value="8f582d" name="porta asse"/>
  <color symbol="U" value="7cb8c9" alpha="0.45" name="vetro finestra"/>
  <color symbol="R" value="d9a84e" name="paglia chiara"/>
  <color symbol="r" value="8c6222" name="paglia bordo scuro"/>
  <color symbol="G" value="5c7a3b" name="muschio verde"/>
  <color symbol="H" value="24150b" name="ferramenta e segni"/>
  <color symbol="h" hidden="True" name="misure possibili"/>
  <color symbol="k" hidden="True" name="il taglio"/>
  <color symbol="m" hidden="True" name="mescola"/>

  <!-- Shuffle for seed variations -->
  <box at="12 0 24" size="25 2 1" color="m"/>
  <prl in="m" out="B" p="0.5" steps="1"/>
  <all in="m" out="B"/>

  <!-- Seed drops to ground -->
  <one in="X B" out="B X"/>

  <!-- Rectangular plan: up to 17 along x, 13 along y, 10 tall -->
  <all in="XB" out="*X" steps="8" symmetry="(x)"/>
  <all in="X/B" out="*/X" steps="6" symmetry="(y)"/>
  <all in="B X" out="X *" steps="9"/>

  <!-- Seed-driven variation in width and depth -->
  <box at="18 0 0" size="5 1 1" color="h"/>
  <one in="h" out="k" steps="1"/>
  <all in="h" out="B"/>
  <all symmetry="()">
    <rule in="k/*" out="k/k"/>
    <rule in="*/k" out="k/k"/>
    <rule in="* k" out="k k"/>
    <rule in="k *" out="k k"/>
    <rule in="k*" out="kk"/>
  </all>
  <all in="k" out="B"/>

  <box at="0 7 0" size="1 4 1" color="h"/>
  <one in="h" out="k" steps="1"/>
  <all in="h" out="B"/>
  <all symmetry="()">
    <rule in="k*" out="kk"/>
    <rule in="*k" out="kk"/>
    <rule in="* k" out="k k"/>
    <rule in="k *" out="k k"/>
    <rule in="*/k" out="k/k"/>
  </all>
  <all in="k" out="B"/>

  <!-- Eaves and gable roof along y (slopes on x) -->
  <all in="B X" out="R *"/>
  <all in="RB XB" out="*R **" symmetry="(x)"/>
  <all in="R/B X/B" out="*/R */*" symmetry="(y)"/>
  <all in="B R" out="Q *"/>
  <all in="B Q" out="Q *" steps="8"/>
  <!-- Two slopes erosion -->
  <all in="*Q B*" out="*B **" symmetry="(x)"/>

  <!-- Front and back gable (north and south) in wood -->
  <all in="R Q" out="* n" symmetry="(y)"/>
  <all in="n Q" out="* n" symmetry="(y)"/>

  <!-- Hollow out the interior so the door leads inside -->
  <all in="XXX/XXX/XXX XXX/XXX/XXX" out="***/*I*/*** ***/*I*/***"/>
  <all in="X" out="D"/>
  <all in="I" out="B"/>
  <all in="Q" out="R"/>

  <!-- Stone chimney on one side of the roof -->
  <one in="R D D" out="D D D" steps="1"/>
  <all in="B R D D" out="D * * *" steps="1"/>
  <all in="B D R" out="D * *" steps="1"/>
  <all in="B D D" out="P * *" steps="1"/>

  <!-- Dark stone plinth at the base of the walls -->
  <all in="D D" out="* P" steps="1"/>
  <all in="D P" out="P *" steps="1"/>

  <!-- Sturdy wooden beams on the four outer corners -->
  <all in="BB/BD" out="**/*N"/>
  <all in="BB/BP" out="**/*N"/>

  <!-- Front facade (large y, south): DOOR through the wall, 8 voxels tall (16 after scale 2) + stone step -->
  <one steps="1" symmetry="()"
       in="DDDD/BBBB DDDD/BBBB DDDD/BBBB DDDD/BBBB DDDD/BBBB DDDD/BBBB PPPP/BBBB PPPP/BBBB"
       out="NNNN/**** NOON/**** NOON/**** NOON/**** NOON/**** NOON/**** NOON/**** NOON/*PP*"/>

  <!-- Front window with wooden frame beside the door -->
  <one steps="1" symmetry="()"
       in="DDD/BBB DDD/BBB DDD/BBB"
       out="NNN/*** NUN/*** NNN/***"/>

  <!-- Side window -->
  <one steps="1" symmetry="(x)"
       in="D/B D/B D/B"
       out="N/* U/* N/*"/>

  <!-- Fine resolution: scale x2 to reach 50x50x50 box -->
  <map scale="2 2 2" values="BWPDNnOURrGHd">
    <rule in="P" out="PP/PP PP/PP"/>
    <rule in="D" out="DD/DD DD/DD"/>
    <rule in="N" out="NN/NN NN/NN"/>
    <rule in="n" out="nn/nn nn/nn"/>
    <rule in="O" out="OO/OO OO/OO"/>
    <rule in="U" out="UU/UU UU/UU"/>
    <rule in="R" out="RR/RR RR/RR"/>
    <rule in="r" out="rr/rr rr/rr"/>
    <rule in="G" out="GG/GG GG/GG"/>
    <rule in="H" out="HH/HH HH/HH"/>
    <color symbol="d" value="5a534a" name="corso pietra"/>

    <!-- Roof eaves and ridge clearly marked in darker thatch -->
    <all in="RB" out="r*" steps="1"/>
    <all in="R/B" out="r/*" steps="1"/>
    <all in="B R R" out="* r *" steps="1"/>

    <!-- Clean horizontal stone courses and vertical joints -->
    <all in="DD DD" out="dd **" steps="1"/>
    <prl in="DD/DD" out="*d/**" p="0.18" steps="1"/>

    <!-- Gable timber plank lines -->
    <all in="nn nn" out="NN **" steps="1"/>

    <!-- Door details: vertical plank separation and iron latch -->
    <all in="OOOO" out="*H*H" symmetry="()" steps="1"/>
    <one in="HO" out="HH" symmetry="()" steps="1"/>

    <!-- Window cross frame -->
    <all in="UU" out="UN" symmetry="()" steps="1"/>
    <all in="U U" out="N *" symmetry="()" steps="1"/>

    <!-- Moss patch at the base -->
    <prl in="B/P" out="*/G" p="0.25" steps="1"/>
  </map>

  <action name="open" label="Apri la porta">
    <all in="O" out="W"/>
  </action>
  <action name="close" label="Chiudi la porta">
    <all in="W" out="O"/>
  </action>
</sequence>
