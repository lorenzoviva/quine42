# model.sculpt · primo · gemini-4-argon · 28 s · 7597 token d'ingresso (5543 in cache), 1993 d'uscita, 0 di ragionamento · $0.02

## Richiesta

Sculpt: Barca da pesca
What it looks like: una barca a vela con lo scafo di legno
Class: vessel · box 40 × 96 × 64 voxels · at least 19 tall
A vessel: a tile is 16 voxels, a person 24 tall, a step 3. The bow toward large y, the stern toward small y.
Write waterline="N" on the root: the N lowest layers (z=0 to N-1) are under the water, the kernel lays the hull that deep (1 to 40, less than 64). The hull at z=N-1 must be closed (the sea does not get in) and at least 2 times as long (along y) as wide, its foremost eighth at most 75% of its width (the bow narrows).
Mark with area="boarding" the letter where one comes aboard (a gangway, a ladder, a step in the gap of the rail) and with area="helm" the helm (a wheel, a tiller), aft on the deck; area="hold" the floor of the hold, if it has one. The deck is dry (its floor at z=N or above), a step up or down at a time from the boarding (at most 3 voxels), with 12 voxels free over it; at least 50% of it over the hull at the waterline; the helm within 0.75 tiles of it. Sails and rigging above the head of whoever walks the deck.

## Risposta

<sequence values="BHIDFRGTOMNSsKLWCE" size="40 96 64" waterline="10">
  <!-- Hull: lower half of an ellipsoid, hollowed, stern cut flat and closed by a transom -->
  <ellipsoid at="19.5 47.5 0" size="36 96 36" color="H"/>
  <ellipsoid at="19.5 47.5 2" size="30 90 32" color="I" on="H"/>
  <box at="19.5 47.5 18" size="40 96 46" color="B"/>
  <box at="19.5 3.5 0" size="40 8 64" color="B"/>
  <box at="19.5 8 0" size="40 2 18" color="H" on="I"/>

  <!-- Keel and rubbing strake along the hull -->
  <box at="19.5 48 0" size="2 82 2" color="R"/>
  <all in="H/B" out="R/*" steps="1" symmetry="()"/>
  <box at="19.5 47.5 14" size="40 96 1" color="R" on="H"/>

  <!-- Main deck (z=16) and raised aft & fore platforms (z=17, 1 voxel step) -->
  <box at="19.5 47.5 16" size="40 96 1" color="D" on="I"/>
  <box at="19.5 16 17" size="40 16 1" color="D" on="I"/>
  <box at="19.5 82 17" size="40 20 1" color="D" on="I"/>

  <!-- Hold floor at bottom of interior, then clear remaining interior air -->
  <all in="I H" out="O *" steps="1"/>
  <prl in="I" out="B"/>

  <!-- Deck plank lines every few voxels -->
  <box at="11 47.5 16" size="1 80 1" color="F" on="D"/>
  <box at="15 47.5 16" size="1 80 1" color="F" on="D"/>
  <box at="19 47.5 16" size="1 80 1" color="F" on="D"/>
  <box at="23 47.5 16" size="1 80 1" color="F" on="D"/>
  <box at="27 47.5 16" size="1 80 1" color="F" on="D"/>

  <!-- Railings (z=18 and z=19) along the hull rim -->
  <all in="B H" out="R *" steps="1"/>
  <all in="B R" out="R *" steps="1"/>

  <!-- Boarding gaps amidships on port and starboard (z=18..19 cleared, z=17 step) -->
  <box at="19.5 44 19" size="40 14 1" color="B" on="R"/>
  <box at="19.5 44 18" size="40 14 1" color="B" on="R"/>
  <box at="19.5 44 17" size="40 14 1" color="G" on="H"/>

  <!-- Central fish hatch / crate and water barrel amidships (leaving clean walkways on both sides) -->
  <box at="19.5 36 17" size="8 10 3" color="K"/>
  <box at="19.5 36 20" size="6 8 1" color="W"/>
  <box at="19.5 48 17" size="4 4 4" color="K"/>

  <!-- Helm aft: rudder post and long wooden tiller handle -->
  <box at="19.5 11 18" size="2 2 5" color="T"/>
  <box at="19.5 15 22" size="2 8 1" color="T"/>
  <box at="19.5 7 4" size="2 2 15" color="R"/>

  <!-- Main mast and bowsprit -->
  <box at="19.5 58 17" size="2 2 45" color="M"/>
  <box at="19.5 89 18" size="2 14 2" color="M"/>

  <!-- Lantern hanging on the front of the mast -->
  <box at="19.5 60 25" size="2 1 1" color="N"/>
  <box at="19.5 60 23" size="2 1 2" color="L"/>

  <!-- Boom, upper yard, and high Gaff Rigged Tanbark Sail (z=42..59, well above head height) -->
  <box at="19.5 42 41" size="2 32 1" color="N"/>
  <box at="19.5 45 59" size="2 26 2" color="N"/>
  <box at="19.5 43 42" size="2 28 17" color="S"/>
  <box at="19.5 32 45" size="2 12 10" color="C" on="S"/>

  <!-- Fore staysail high near the bow -->
  <box at="19.5 70 42" size="2 12 14" color="S"/>
  <box at="19.5 74 42" size="2 8 9" color="S"/>
  <box at="19.5 78 42" size="2 4 4" color="S"/>

  <!-- Colors & Areas -->
  <color symbol="H" value="5c3a21" name="scafo"/>
  <color symbol="D" value="b89058" name="ponte"/>
  <color symbol="F" value="94703e" name="assi del ponte"/>
  <color symbol="R" value="3b2313" name="parapetto e chiglia"/>
  <color symbol="G" value="8c673a" name="imbarco" area="boarding"/>
  <color symbol="T" value="4a2c18" name="barra del timone" area="helm"/>
  <color symbol="O" value="734f2c" name="fondo della stiva" area="hold"/>
  <color symbol="M" value="4f331b" name="albero"/>
  <color symbol="N" value="3b2313" name="boma e pennone"/>
  <color symbol="S" value="c85a32" name="vela al terzo"/>
  <color symbol="C" value="e6dcc8" name="toppa di vela"/>
  <color symbol="K" value="7a5230" name="cassa del pescato"/>
  <color symbol="W" value="7898a8" name="pescato e ghiaccio"/>
  <color symbol="L" value="ffcc44" glow="True" name="lanterna di bordo"/>
  <color symbol="I" hidden="True" name="interno"/>
  <color symbol="s" hidden="True" name="vela ammainata"/>
  <color symbol="E" hidden="True" name="toppa ammainata"/>

  <!-- Actions -->
  <action name="furl" label="Ammaina le vele">
    <all in="S" out="s"/>
    <all in="C" out="E"/>
  </action>
  <action name="hoist" label="Issa le vele">
    <all in="s" out="S"/>
    <all in="E" out="C"/>
  </action>
</sequence>
