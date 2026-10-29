I risultati sono magnifici. 

## Migliorie

I modelli relativi a grandi strutture dovrebbero essere distribuiti su più tiles, ho apprezzato che hai ingrandito la casetta ma penso andrebbe generata direttamente su un'area 3D più grande.
Inoltre ho apprezzato che hai messo l'azione di aprire la porta ma cerchiamo già di immaginarcelo integrato nel gioco: attualmente abbiamo un concilio con un cartografo, questo deve coordinare la disposizione delle case, degli alberi, fontane, ponti etc... Iniziamo a pensare se abbiamo veramente bisogno di quantizzare lo spazio in "tiles" e "chunks" per consentire al cartografo di creare la mappa oppure se vogliamo spostarci verso un universo non quantizzato. Tenendo presente che le mesh create con MarkovJunior sono comunque a voxel ma che già il viandante e gli NPC hanno "posizione" non quantizzata.

## Analisi del rapporto costo/resa

C'è una netta differenza di qualità tra quelli della 3.1 flash e quelli della 3.8 flash.
Stiamo spendendo molto, più di quanto desideravo. Non sempre riesco a capire il rapporto tra resa e consumi. Inoltre la pagina che espone l'usage di gemini si aggiorna dopo un po di tempo.
Vorrei che facessi un'analisi sulla possibile spesa. Prima sulle generazioni avvenute precedentemente, dove possibile risalire al consumo, poi su un caso di test.
Proviamo anche altri modelli. Per minimizzare la spesa lavoriamo su un solo mesh 3D, ma complesso. 

Ti mando un link ai costi dei modelli, scrivi tutti i calcoli esplicitamente nel report finale, inquanto questi prezzi potrebbero cambiare. Il report ci aiuterà a trovare un compromesso tra la qualità di generazione e i costi.

[Gemini](https://aistudio.google.com/docs/pricing):
- Puoi provare una volta sola Gemini 4 Argon, assicurati di non sbagliare, è molto al di sopra del budget quindi non ripeteremo la prova
    - Prima di provare Argon fai le altre prove
- Puoi provare a aumentare il numero di iterazioni solo per i modelli più economici (3.1 Flash)

