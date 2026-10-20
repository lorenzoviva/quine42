# ADR-0023 — Geografia: biomi, atlante, timbri di strutture

Data: 2026-10-20 · Stato: accettato

## Contesto
Poca varietà di mappe; un «bosco degli elfi» chiesto al Cartografo era diventato un oggetto; un NPC non
sapeva indicare un luogo appena lasciato. Il Cartografo deve coordinare gli ambienti e collocarli nello spazio.

## Decisione
- **Biomi** nel generatore (`world.terrain`): temperatura, umidità e continente su larga scala → mare e
  coste, deserti, giungle, nevi, montagne, fiumi; nuovi codici obbligatori `s j o k n` (con ripiego
  automatico se un mondo non li ha) e nuovi terreni nel seme (pietra, mattoni, paglia, staccionata,
  ponte levatoio, lastricato, lava).
- **Timbri** (`src/kernel/stamps.ts`, nodo `stamp` di MarkovJunior): `casa castello fortezza torre tempio
  piramide capanne recinto caserma dungeon tana pozzo`, disegnati dal kernel con i codici del mondo per
  ruolo (`muro pavimento porta acqua ponte terreno strada roccia recinto`). Il seme ha 20 ambienti
  (castello con fossato e ponte levatoio, fortezza, villaggio di capanne, maneggio, caserma, sotterraneo,
  torre del mago, tana del drago, tempio, piramide, deserto, giungla, montagne, lago, borgo di mattoni…).
- **Atlante** (`world/atlas.json`, `src/kernel/atlas.ts`): regioni con nome, ambiente, centro e raggio. I
  luoghi dentro una regione usano il suo ambiente e il suo nome; gli ambienti regionali non compaiono
  altrove. Alla Genesi lo disegna il Cartografo (`genesis.atlas`); un universo senza atlante ne riceve
  uno dal kernel.
- **Ambienti su richiesta** (`createEnvironment`, anche via chat col Cartografo o col Referente): il
  Cartografo scrive programma e terreni nuovi, il validatore li prova sulle bozze, la regione viene
  collocata nella direzione e alla distanza indicate, in zona inesplorata.
- **Direzioni**: chi sta in un luogo sa dove sono i luoghi vicini e le regioni (`dintorni` nei fatti
  degli NPC, l'atlante nel contesto del Cartografo).

## Conseguenze
- Un mondo con una geografia; le strutture complesse non dipendono dalla capacità dei modelli di contare.
